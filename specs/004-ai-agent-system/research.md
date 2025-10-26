# Research: AI-Powered Exploration Workspace

**Feature**: `004-ai-agent-system`
**Date**: 2025-10-26
**Phase**: Phase 0 (Outline & Research)
**Status**: Complete - Aligned with spec.md and arch.md

---

## Purpose

This document resolves research questions identified during technical planning for the AI-Powered Exploration Workspace. Research findings inform technology choices, implementation patterns, and architectural decisions documented in arch.md (Key Architectural Decisions sections).

**Research Scope**:
1. Server-Sent Events (SSE) best practices for agent streaming
2. pgvector performance optimization for shadow domain
3. Context assembly algorithms across multiple domains
4. User preference derivation from behavioral patterns
5. Memory chunking strategies for long threads
6. Supabase Realtime patterns with optimistic updates
7. Claude 3.5 Sonnet streaming with tool approval flows

---

## R1: Server-Sent Events (SSE) for Agent Streaming

### Question
How should we stream agent responses (mixed text chunks + tool calls + approval prompts) to the frontend in real-time?

### Options Considered

**Option 1: WebSocket (Bidirectional)**
- Pros: Full duplex communication, low latency, can send approval responses back through same connection
- Cons: More complex protocol, harder to debug, requires custom connection management, overkill for primarily one-way streaming

**Option 2: Server-Sent Events (SSE)**
- Pros: Native browser support (`EventSource` API), automatic reconnection, simpler HTTP-based protocol, unidirectional sufficient for our use case
- Cons: One-way only (approval must be separate POST), slightly higher HTTP overhead

**Option 3: Long Polling**
- Pros: Simplest implementation, works everywhere
- Cons: High latency (1-2s), inefficient (constant requests), poor UX for streaming

### Decision: Server-Sent Events (SSE)

**Rationale** (from arch.md Decision 2):
- Agent streaming is inherently one-way (server → client) - bidirectional not needed
- SSE reconnection is automatic via browser `EventSource` API
- Simpler to implement and debug than WebSocket (standard HTTP, visible in DevTools)
- Works with existing CDN/load balancer infrastructure without special WebSocket config
- Claude API returns streaming responses that map naturally to SSE events
- Tool call approvals handled via separate POST endpoint (acceptable UX trade-off)

### Implementation Pattern

**Edge Function (Deno)**:
```typescript
// apps/api/src/functions/execute-agent/index.ts
export default async function handler(req: Request) {
  const { threadId } = await req.json()

  const stream = new ReadableStream({
    async start(controller) {
      // Keep-alive every 30s
      const keepAlive = setInterval(() => {
        controller.enqueue(`: ping\n\n`)
      }, 30000)

      try {
        // Stream Claude 3.5 Sonnet response
        const claudeStream = await anthropic.messages.stream({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4096,
          messages: [{ role: 'user', content: primeContext + userMessage }],
          tools: mcpTools
        })

        for await (const chunk of claudeStream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            // Text chunk
            controller.enqueue(`data: ${JSON.stringify({
              type: 'text',
              content: chunk.delta.text
            })}\n\n`)
          } else if (chunk.type === 'content_block_start' && chunk.content_block.type === 'tool_use') {
            // Tool call - pause for approval
            const tool = chunk.content_block

            controller.enqueue(`data: ${JSON.stringify({
              type: 'tool_call',
              toolName: tool.name,
              status: 'awaiting_approval',
              input: tool.input
            })}\n\n`)

            // Wait for approval (blocks stream, FR-048a)
            const approved = await waitForApproval(tool.id, { timeout: 600000 }) // 10min

            if (!approved) {
              controller.enqueue(`data: ${JSON.stringify({
                type: 'error',
                message: 'Approval timed out after 10 minutes'
              })}\n\n`)
              break
            }

            controller.enqueue(`data: ${JSON.stringify({
              type: 'tool_call',
              toolName: tool.name,
              status: 'approved'
            })}\n\n`)
          }
        }

        controller.enqueue(`data: ${JSON.stringify({ type: 'completion' })}\n\n`)
      } finally {
        clearInterval(keepAlive)
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}
```

**Frontend (EventSource)**:
```typescript
// apps/web/src/lib/hooks/useStreamMessage.ts
function useStreamMessage() {
  const streamMessage = async (threadId: string, text: string) => {
    // Create message, get SSE endpoint
    const { sseEndpoint } = await threadService.sendMessage(threadId, text)

    // Subscribe to SSE stream
    const eventSource = new EventSource(sseEndpoint)

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.type === 'text') {
        // Append text chunk to streaming buffer
        aiAgentState.streamingBuffer += data.content
      } else if (data.type === 'tool_call' && data.status === 'awaiting_approval') {
        // Show approval modal
        aiAgentState.pendingApproval = data
      } else if (data.type === 'completion') {
        // Move buffer to final message
        aiAgentState.messages.push({
          role: 'assistant',
          content: aiAgentState.streamingBuffer
        })
        aiAgentState.streamingBuffer = ''
        eventSource.close()
      }
    }

    eventSource.onerror = () => {
      toast.error('Stream interrupted. Please retry.')
      eventSource.close()
    }
  }

  return { streamMessage }
}
```

### Best Practices

1. **Keep-Alive**: Send comment lines (`: ping\n\n`) every 30s to prevent connection timeout
2. **Event Format**: `data: {JSON}\n\n` with double newline terminator
3. **Pause for Approval**: Block stream yield until approval received (FR-048a)
4. **Timeout Handling**: Auto-reject after 10 minutes, release resources (FR-048b)
5. **Error Recovery**: On disconnect, discard partial message, user retries from beginning (MVP simplicity per FR-053a)
6. **Cross-Session Visibility**: Primary session uses SSE, secondary sessions use Supabase Realtime subscriptions to agent_tool_calls table

### Performance Targets

- Chunk latency: <500ms between chunks
- Approval wait: User has 10 minutes to approve/reject
- Reconnection: Automatic via `EventSource`, but partial message is discarded

---

## R2: pgvector Optimization for Shadow Domain

### Question
How should we optimize pgvector for semantic search across 1000+ shadow entities (files + threads + concepts)?

### Background

Shadow domain (FR-010a to FR-010f) is a unified `shadow_entities` table containing:
- `entity_id`: Reference to source entity (file_id, thread_id, or kg_node_id)
- `entity_type`: Discriminator ('file' | 'thread' | 'kg_node')
- `embedding`: 768-dim vector (OpenAI text-embedding-3-small)
- `summary`: Auto-generated 2-3 sentence description
- `structure_metadata`: JSONB (entity-specific: outline for files, topics for threads, relationships for KG nodes)

### Index Options

| Index Type | Build Time | Query Speed | Accuracy | Use Case |
|-----------|------------|-------------|----------|----------|
| **ivfflat** | Fast | Good | ~95% | <10K vectors (our scale) |
| HNSW | Slow | Excellent | ~99% | >10K vectors, read-heavy |
| None (seq scan) | N/A | Terrible | 100% | Development only |

### Decision: ivfflat with 100 Lists

**Rationale**:
- MVP scale: 1000+ entities per user (fits well with ivfflat sweet spot)
- `lists = 100` optimal for 1000-10000 vectors (rule of thumb: sqrt of expected rows)
- Build time: <1s for 1000 vectors (acceptable for async background job)
- Query speed: <1s for top-10 results (meets FR-064 requirement)

### Implementation

**Index Creation**:
```sql
-- Create ivfflat index for cosine similarity
CREATE INDEX shadow_entities_embedding_idx
ON shadow_entities
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Analyze for query planner
ANALYZE shadow_entities;
```

**Query Pattern**:
```typescript
// apps/api/src/repositories/shadowEntity.ts
async function semanticSearch(
  queryEmbedding: number[],
  entityTypes: EntityType[],
  userId: string,
  limit: number = 10
) {
  const result = await db.execute(sql`
    SELECT
      entity_id,
      entity_type,
      summary,
      structure_metadata,
      1 - (embedding <=> ${queryEmbedding}::vector) AS similarity
    FROM shadow_entities
    WHERE entity_type = ANY(${entityTypes})
      AND owner_user_id = ${userId}
    ORDER BY embedding <=> ${queryEmbedding}::vector
    LIMIT ${limit}
  `)

  return result.rows
}
```

### Embedding Model: OpenAI text-embedding-3-small

**Why 768-dim (not 1536-dim)**:
- Cost: $0.02/1M tokens (cheapest option)
- Storage: 768 × 4 bytes = 3KB per embedding (vs 6KB for 1536-dim)
- Quality: Excellent retrieval performance for our use case
- Speed: ~100ms API latency, 3000 req/min rate limit

**Cost Analysis** (1000 entities):
- Initial: 1000 entities × 500 tokens × $0.00000002/token = **$0.01**
- Daily updates: 10 changes × 500 tokens × $0.00000002 = **$0.0001/day**
- Total: ~$0.01 setup + $0.003/month = **negligible**

### Performance Targets

- <1s for 1000 entities (FR-064) ✅
- <500ms for <100 entities (FR-064) ✅
- <300ms for unified cross-entity searches (FR-064a) ✅

### Maintenance

- **VACUUM**: Automatic via Supabase (removes dead tuples)
- **ANALYZE**: Run after bulk inserts (updates query planner stats)
- **Re-index**: If vector count grows >10K, consider HNSW or increase lists to sqrt(N)

---

## R3: Context Assembly Algorithms

### Question
How should we gather and prioritize context from 6 domains within 200K token budget in <1s?

### Multi-Domain Architecture

**6 Context Domains** (from arch.md):
1. **Explicit Context** (1.0 weight) - Files/threads @-mentioned by user
2. **Shadow Domain** (0.5 base weight) - Semantic matches via pgvector
3. **Thread Tree** (0.7 weight) - Parent summary, inherited files, sibling threads
4. **Memory Chunks** (0.6 weight) - Top-3 relevant chunks if thread >40 messages
5. **User Preferences** (0.8 weight for always-include, filtering for excluded) - Derived from behavior
6. **Knowledge Graph** (0.6 weight) - Related concepts (Phase 2+)

### Algorithm (from arch.md Decision 4)

**Step 1: Parallel Domain Queries** (target <1s total)
```typescript
// apps/api/src/services/contextAssembly.ts
async function assembleContext(threadId: string, query: string, userId: string) {
  // Execute ALL domains in parallel
  const [explicit, semantic, tree, memory, preferences] = await Promise.all([
    loadExplicitReferences(threadId), // Load full content
    semanticSearchService.search(query, userId, threadId), // Top 10 with modifiers
    loadThreadTree(threadId), // Parent summary + inherited files
    loadMemoryChunks(threadId, query), // Top 3 if >40 messages
    userPreferencesService.loadPreferences(userId) // Cached per request
  ])

  // ... (continue to Step 2)
}
```

**Step 2: Apply Modifiers**
- **Relationship modifiers** (based on thread tree position):
  - Siblings: +0.10 to semantic matches from sibling branches (FR-022)
  - Parent/Child: +0.15 to semantic matches from parent or child branches (FR-022)
- **Temporal decay**: `1.0 - (months_since_last_interaction × 0.05)` with floor 0.3 (FR-023)
- **Topic divergence filtering**: If branch summary similarity <0.3, only show semantic matches >0.9 (FR-021c)

**Step 3: Apply User Preferences**
```typescript
// Filter OUT excluded patterns (reduces noise)
const filteredSemantic = semantic.filter(item =>
  !preferences.excluded_patterns.some(pattern =>
    new RegExp(pattern).test(item.path)
  ) &&
  !preferences.blacklisted_branches.includes(item.source_thread_id)
)

// Add always-include files (learned from behavior)
const alwaysInclude = preferences.always_include_files.map(path => ({
  path,
  weight: 0.8,
  source: 'user_preference'
}))
```

**Step 4: Prioritize and Fit Budget**
```typescript
// Merge all context sources
const allContext = [
  ...explicit.map(item => ({ ...item, weight: 1.0, group: 'explicit' })),
  ...alwaysInclude.map(item => ({ ...item, group: 'frequently_used' })),
  ...tree.map(item => ({ ...item, weight: 0.7, group: 'branch' })),
  ...filteredSemantic.map(item => ({ ...item, group: 'semantic' })),
  ...memory.map(item => ({ ...item, weight: 0.6, group: 'memory' }))
]

// Sort by final weight (base + modifiers)
allContext.sort((a, b) => b.weight - a.weight)

// Fit within 200K token budget
const { included, excluded } = fitWithinBudget(allContext, 200000)

return {
  included: groupBy(included, 'group'), // 6 sections for UI
  excluded // Show in "Excluded context" section for manual re-prime
}
```

### SemanticSearchService (Separate, Reusable)

**Why Separate** (arch.md Decision 4):
- Used by: ContextAssemblyService, ConsolidationService, manual user search, memory chunk search
- Clear separation: SemanticSearchService handles shadow domain queries, ContextAssemblyService orchestrates ALL domains
- Easier to optimize and test independently

```typescript
// apps/api/src/services/semanticSearch.ts
class SemanticSearchService {
  async search(
    query: string,
    userId: string,
    threadId: string,
    entityTypes: EntityType[] = ['file', 'thread'],
    limit: number = 10
  ) {
    // Generate query embedding
    const queryEmbedding = await openai.createEmbedding(query)

    // Get thread tree metadata for relationship modifiers
    const threadMetadata = await threadRepository.getTreeMetadata(threadId)

    // Semantic search across shadow domain
    const results = await shadowEntityRepository.search(
      queryEmbedding,
      entityTypes,
      userId,
      limit * 2 // Get 20, filter to top 10 after modifiers
    )

    // Apply relationship modifiers
    const withModifiers = results.map(result => {
      let modifier = 0

      if (threadMetadata.siblingIds.includes(result.source_thread_id)) {
        modifier += 0.10 // Sibling boost
      } else if (threadMetadata.parentId === result.source_thread_id ||
                 threadMetadata.childIds.includes(result.source_thread_id)) {
        modifier += 0.15 // Parent/child boost
      }

      return {
        ...result,
        finalScore: result.similarity + modifier
      }
    })

    // Apply topic divergence filtering
    const filtered = withModifiers.filter(result => {
      const branchSimilarity = calculateBranchSimilarity(
        threadMetadata.summary,
        result.branch_summary
      )

      if (branchSimilarity < 0.3) {
        // Topics diverged - high confidence only
        return result.finalScore > 0.9
      }

      return true
    })

    // Return top 10
    return filtered.sort((a, b) => b.finalScore - a.finalScore).slice(0, limit)
  }
}
```

### Performance Targets

- Total assembly: <1s (FR-024c) ✅
- Parallel domain queries: 6 queries execute concurrently
- Semantic search: <500ms (leverages pgvector index)
- Preference load: <50ms (cached in memory per request)

---

## R4: User Preference Derivation

### Question
Should user preferences be explicitly managed (UI settings) or derived from behavioral patterns?

### Decision: Derived from Behavioral Patterns (arch.md Decision 6)

**Rationale**:
- **Zero-friction personalization**: Users get better context without configuration burden
- **Behavior is truth**: What users actually do (files they @-mention, matches they dismiss) is more accurate than predictions
- **AI-native UX**: System learns from user instead of user configuring system
- **Improves over time**: More interactions → better preference model → more relevant context

### Derivation Patterns (BR-011 to BR-014)

**Always-Include Files** (0.8 weight):
- Trigger: Files @-mentioned 3+ times in last 30 days
- Result: Auto-included in future context assembly
- UI: Shown in "Frequently used" section (transparent, not hidden)

**Excluded Patterns** (filtering):
- Trigger: Files dismissed 3+ times from semantic matches
- Result: Filtered out BEFORE semantic search ranking
- UI: Not visible (reduces noise silently)

**Blacklisted Branches** (filtering):
- Trigger: Branches manually hidden via "Hide from [Branch Name]" button
- Result: Excluded from relationship modifiers and semantic matches
- UI: View/remove in context settings (per-thread scope)

### Implementation

**Daily Background Job** (pg_cron):
```sql
-- Recompute user preferences from last 30 days
UPDATE user_preferences SET
  always_include_files = ARRAY(
    SELECT DISTINCT file_path
    FROM context_references
    WHERE user_id = $1
      AND source = '@-mentioned'
      AND created_at > NOW() - INTERVAL '30 days'
    GROUP BY file_path
    HAVING COUNT(*) >= 3
  ),
  excluded_patterns = ARRAY(
    SELECT DISTINCT file_pattern
    FROM semantic_match_dismissals
    WHERE user_id = $1
      AND created_at > NOW() - INTERVAL '30 days'
    GROUP BY file_pattern
    HAVING COUNT(*) >= 3
  ),
  blacklisted_branches = ARRAY(
    SELECT DISTINCT branch_id
    FROM conversation_metadata
    WHERE user_id = $1
      AND blacklisted_at IS NOT NULL
  ),
  last_updated = NOW()
WHERE user_id = $1;
```

**Load Per Request** (cached):
```typescript
// apps/api/src/services/userPreferences.ts
const preferencesCache = new Map<string, UserPreference>()

async function loadUserPreferences(userId: string): Promise<UserPreference> {
  // Check cache
  if (preferencesCache.has(userId)) {
    return preferencesCache.get(userId)!
  }

  // Load from database
  const prefs = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.user_id, userId)
  })

  // Check staleness (>24h)
  if (prefs.last_updated < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
    // Trigger recompute (fire-and-forget)
    recomputeUserPreferences(userId).catch(err => logError(err))
  }

  // Cache for request duration
  preferencesCache.set(userId, prefs)
  return prefs
}
```

### Transparency

- "Frequently used" section shows always-include files
- No UI for managing preferences in MVP (advanced users get viewer in Phase 3+)
- Privacy: All data scoped to user_id (RLS enforced), never shared

### Performance

- Recompute: <5s daily per user
- Load: <50ms per request (cached)
- Staleness: Mark >24h old as stale

---

## R5: Memory Chunking for Long Threads

### Question
How should we handle threads exceeding 40 messages without overflowing 200K token budget?

### Decision: 10-Message Chunks with Localized Summaries (arch.md Decision 7)

**Rationale**:
- **Chunk size: 10 messages** - Balances coherence (meaningful segment) with granularity (not too many chunks)
- **Localized summaries** - Each chunk summarized from its 10 messages only (not cumulative) for better retrieval precision
- **Top-3 retrieval** - Fits budget: Latest 10 full messages (~5K tokens) + 3 chunks (~6K) + files (~180K) = ~191K

### Chunking Strategy (FR-024e to FR-024g)

**Trigger**: Thread exceeds 40 messages
- Keep messages 31-40 as full text (recent context)
- Compress messages 1-30 into chunks:
  - Chunk 1: messages 1-10
  - Chunk 2: messages 11-20
  - Chunk 3: messages 21-30

**Chunk Structure**:
```typescript
interface ThreadMemoryChunk {
  chunk_id: string
  conversation_id: string
  message_ids: string[] // 10 message IDs
  embedding: number[] // 768-dim
  summary: string // Localized (topics, decisions, artifacts, questions from this chunk)
  timestamp_range: [Date, Date]
  chunk_index: number // 1, 2, 3, ...
}
```

### Implementation

**Compression (Background Job)**:
```typescript
// apps/api/src/functions/compress-memory/index.ts
async function compressThreadMemory(threadId: string) {
  const messages = await messageRepository.findByThread(threadId)

  if (messages.length <= 40) return // Not needed yet

  const oldMessages = messages.slice(0, 30) // Messages 1-30
  const chunks: ThreadMemoryChunk[] = []

  // Create 10-message chunks
  for (let i = 0; i < oldMessages.length; i += 10) {
    const chunkMessages = oldMessages.slice(i, i + 10)

    // Generate localized summary (topics, decisions, artifacts, questions)
    const summary = await generateChunkSummary(chunkMessages)

    // Generate embedding
    const embedding = await openai.createEmbedding(summary)

    chunks.push({
      chunk_id: uuid(),
      conversation_id: threadId,
      message_ids: chunkMessages.map(m => m.id),
      embedding,
      summary,
      timestamp_range: [
        chunkMessages[0].created_at,
        chunkMessages[chunkMessages.length - 1].created_at
      ],
      chunk_index: i / 10 + 1
    })
  }

  await db.insert(threadMemoryChunks).values(chunks)
}
```

**Retrieval (Context Assembly)**:
```typescript
// apps/api/src/services/contextAssembly.ts
async function loadMemoryChunks(threadId: string, query: string) {
  // Only if thread >40 messages
  const messageCount = await messageRepository.count(threadId)
  if (messageCount <= 40) return []

  // Semantic search across chunks
  const queryEmbedding = await openai.createEmbedding(query)

  const chunks = await db.execute(sql`
    SELECT chunk_id, summary, 1 - (embedding <=> ${queryEmbedding}::vector) AS similarity
    FROM thread_memory_chunks
    WHERE conversation_id = ${threadId}
    ORDER BY embedding <=> ${queryEmbedding}::vector
    LIMIT 3
  `)

  return chunks.map(c => ({ summary: c.summary, weight: 0.6 }))
}
```

### Performance

- Chunking: <5s for 30 messages (3 chunks)
- Retrieval: <500ms for top-3 chunks
- Storage: 1000-message thread = 100 chunks = 300KB embeddings

---

## R6: Supabase Realtime with Optimistic Updates

### Question
How should we integrate Supabase Realtime subscriptions with Valtio state and optimistic updates?

### Decision: Valtio + Realtime (No React Query) - arch.md Decision 3

**Rationale** (Constitution Principle XVI):
- Real-time subscriptions already keep state fresh - caching library is redundant
- React Query creates dual state (cache + Valtio) and cache invalidation complexity
- Custom hooks are lighter and purpose-built for real-time apps

### Pattern: Optimistic Update → API Call → Realtime Reconciliation

```typescript
// apps/web/src/lib/hooks/useCreateFile.ts
function useCreateFile() {
  const createFile = async (path: string, content: string) => {
    // 1. Optimistic update (instant UI feedback)
    const tempFile = {
      id: uuid(),
      path,
      content,
      created_at: new Date(),
      status: 'pending'
    }
    aiAgentState.files.push(tempFile)

    try {
      // 2. API call (async)
      const { data, error } = await fileService.create({ path, content })

      if (error) throw error

      // 3. Replace temp with server data (reconciliation)
      const index = aiAgentState.files.findIndex(f => f.id === tempFile.id)
      aiAgentState.files[index] = data

      toast.success('File created')
    } catch (err) {
      // 4. Rollback on error
      aiAgentState.files = aiAgentState.files.filter(f => f.id !== tempFile.id)
      toast.error(`Failed: ${err.message}`)
    }
  }

  return { createFile }
}
```

### Realtime Subscriptions

**RealtimeProvider**:
```typescript
// apps/web/src/providers/RealtimeProvider.tsx
function RealtimeProvider({ children }) {
  useEffect(() => {
    const userId = auth.currentUser.id

    // Subscribe to file changes
    const filesChannel = supabase
      .channel(`files:user:${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'files',
        filter: `owner_user_id=eq.${userId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          // Check if already in state (optimistic update)
          const exists = aiAgentState.files.find(f => f.path === payload.new.path)
          if (!exists) {
            aiAgentState.files.push(payload.new)
          }
        } else if (payload.eventType === 'UPDATE') {
          const index = aiAgentState.files.findIndex(f => f.id === payload.new.id)
          if (index !== -1) {
            aiAgentState.files[index] = payload.new
          }
        } else if (payload.eventType === 'DELETE') {
          aiAgentState.files = aiAgentState.files.filter(f => f.id !== payload.old.id)
        }
      })
      .subscribe()

    return () => filesChannel.unsubscribe()
  }, [])

  return <>{children}</>
}
```

### Cross-Session Visibility

- **Primary session** (sent message): Subscribes to SSE for lowest latency
- **Secondary sessions** (other tabs/devices): Subscribe to agent_tool_calls via Realtime
- Both see identical progress (SSE is primary, Realtime is fallback)

---

## R7: Multi-Provider LLM Strategy with Direct API

### Question
How should we integrate LLM providers for agent intelligence with tool use, streaming responses, and approval flows? Should we use Claude Agent SDK or Direct API? Support multiple providers?

### Options Considered

**Option 1: Claude Agent SDK**
- Pros: Built-in tool management, permission hooks, MCP integration, automatic context compaction
- Cons: ❌ Incompatible with Supabase Edge Functions (requires Node.js long-running process, file system access), opinionated orchestration conflicts with custom approval UI, locks to Claude only

**Option 2: Direct API (Single Provider - Claude)**
- Pros: Works in Edge Functions, full control over approval flow, TypeScript-native, simpler for MVP
- Cons: Manual tool orchestration, single vendor lock-in, expensive at scale

**Option 3: Direct API (Multi-Provider Abstraction)**
- Pros: Works in Edge Functions, full provider flexibility, 85% cost savings via model tiering, easy provider switching, all providers support identical tool calling patterns
- Cons: Requires abstraction layer (~5 days implementation)

### Decision: Direct API with Multi-Provider Abstraction (Option 3)

**Rationale**:
- **Edge Functions compatibility**: Direct API works in Supabase Edge Functions (Deno runtime), SDK does not
- **Deno/Node.js clarification**: Deno 2 supports npm packages, but Edge Functions are stateless with 10s timeout (SDK needs long-running process + file system)
- **Cost optimization**: 85% savings via model tiering (Gemini Flash → GPT-5 Mini → Claude Sonnet 4.5)
- **Provider flexibility**: Claude, OpenAI, and Gemini all support streaming + tool calling with similar patterns
- **Custom approval UI**: Direct API allows pausing SSE stream at exact tool call moment (FR-048a)
- **Future-proof**: Easy to add new providers or switch defaults

**Multi-Provider Architecture**:
- Unified `LLMProvider` interface abstracts tool format differences
- Provider adapters normalize message formats, tool definitions, and streaming chunks
- Model selection strategy: Simple tasks (70%) → Gemini 2.0 Flash, Medium (20%) → GPT-5 Mini, Complex (10%) → Claude Sonnet 4.5
- Implementation effort: ~5 days for full abstraction layer

**Cost Analysis** (10K input + 1K output per request, 3.65M requests/year):
- Claude-only: $164,250/year
- Multi-provider (tiered): $25,112/year
- **Savings: $139,138/year (85%)**

**When Agent SDK would be better** (not applicable):
- If using traditional Node.js server (not Edge Functions)
- If willing to accept single-vendor lock-in
- If not needing custom approval UI

### Model Pricing Comparison (2025)

| Model | Input/1M | Output/1M | Context | Best For |
|-------|----------|-----------|---------|----------|
| Claude Sonnet 4.5 | $3.00 | $15.00 | 200K | Complex reasoning (10%) |
| GPT-5 | $1.25 | $10.00 | 272K | General tasks |
| GPT-5 Mini | $0.50 | $2.00 | 272K | Medium complexity (20%) |
| o3-mini | $1.10 | $4.40 | 64K | Reasoning tasks |
| Gemini 2.5 Flash-Lite | $0.10 | $0.40 | 1M | Simple tasks (70%) |
| Gemini 2.0 Flash | $0.10 | $0.40 | 1M | Simple tasks (70%) |

### Built-in Web Search

All providers offer server-side web search (no custom implementation needed):
- **Claude**: `web_search` tool via Brave ($10/1K searches + tokens)
- **OpenAI**: `gpt-5-search-api` model (included in token cost)
- **Gemini**: `google_search_retrieval` grounding ($35/1K searches + tokens)

**Decision**: Enable as optional tool, use when user requests current information or semantic search finds no results.

### Summarization Strategy

**Thread Summaries** (every message):
- Model: Gemini 2.0 Flash ($0.0006/summary)
- Trigger: Background job after each message
- Format: 2-3 sentences (topics, decisions, artifacts, questions)
- Annual cost: ~$2K for 10K summaries/day

**Memory Chunks** (threads >40 messages):
- Model: Gemini 2.0 Flash + OpenAI embeddings
- Trigger: Every 10 messages after hitting 40
- Format: Dense paragraph (100-150 words) + 768-dim embedding
- Cost: $0.0006/chunk
- Retrieval: Top-3 chunks via semantic search

### Implementation

**Provider Abstraction**:
- Unified interface: `LLMProvider.generateStream(request)`
- Tool format normalization: Each provider adapter converts to/from unified schema
- Agentic loop pattern: Same while-loop works across all providers
- Model selection: Configurable per-request based on complexity heuristics

**Streaming with Tool Use**:
- All providers support SSE streaming with tool calls
- Pattern: Stream text → encounter tool call → pause → approval → execute → resume
- Tool result format differs (Claude: `tool_result`, OpenAI: `tool` role, Gemini: `function_response`)
- Abstraction layer normalizes differences

**Cost Monitoring**:
- Log every request: provider, model, input tokens, output tokens, cost
- Track success rate and latency per provider
- Fallback to Claude if primary provider fails
- A/B test quality metrics across providers

### Implementation

**Agentic Loop (Simplified)**:
```text
WHILE not done:
  1. Call LLM with tools + messages
  2. Stream text chunks to frontend
  3. IF tool_call:
       - Pause stream
       - Send approval request
       - Wait for user decision
       - IF approved: execute tool, add result to messages
       - IF rejected: end stream with error
  4. IF complete: end stream
  5. IF max_loops reached: timeout error
```

**Key Differences from SDK**:
- Manual loop (not SDK orchestration)
- Custom approval flow (not PreToolUse hooks)
- Works in Edge Functions (not Node.js server)
- Multi-provider ready (not Claude-only)

---

## Research Summary

**Key Decisions**:
      { role: 'user', content: `${primeContext}\n\nUser: ${query}` }
    ],
    tools: [
      {
        name: 'write_file',
        description: 'Create or update file',
        input_schema: writeFileSchema
      },
      {
        name: 'search_files',
        description: 'Search files semantically',
        input_schema: searchFilesSchema
      }
      // ... more tools
    ]
  })

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      // Text chunk
      yield { type: 'text', content: chunk.delta.text }
    } else if (chunk.type === 'content_block_start' && chunk.content_block.type === 'tool_use') {
      const tool = chunk.content_block

      // Pause stream, wait for approval (FR-048a)
      yield {
        type: 'tool_call',
        toolName: tool.name,
        status: 'awaiting_approval',
        input: tool.input
      }

      const approved = await waitForApproval(tool.id, { timeout: 600000 }) // 10min

      if (!approved) {
        yield { type: 'error', message: 'Approval timed out after 10 minutes' }
        return
      }

      yield { type: 'tool_call', toolName: tool.name, status: 'approved' }

      // Execute tool
      const result = await executeTool(tool.name, tool.input)
      yield { type: 'tool_call', toolName: tool.name, status: 'completed', result }
    }
  }
}
```

### Timeout Handling (FR-048b)

- Start 10-minute timer when approval requested
- Auto-reject after timeout
- Release SSE connection and Edge Function resources
- User must retry from beginning

### Error Handling

- Claude API error: Retry once, show toast if failed
- Tool execution error: Send error to agent, agent revises plan
- Stream interrupt: Discard partial message, user retries (MVP simplicity)

### Fine-Grained Tool Streaming (Optional Enhancement)

Claude supports `fine-grained-tool-streaming-2025-05-14` header for streaming tool parameters without buffering. This can reduce latency for large tool inputs but is not required for MVP.

**MVP**: Use standard tool streaming (chunk-at-a-time text, buffer complete tool calls)
**Post-MVP**: Consider fine-grained streaming for large file operations

---

## Summary of Decisions

| Research Item | Decision | Key Points |
|---------------|----------|------------|
| **SSE Streaming** | Server-Sent Events | One-way sufficient, automatic reconnection, HTTP-based, debuggable |
| **pgvector Optimization** | ivfflat with 100 lists | Optimal for <10K vectors, <1s queries, 768-dim embeddings |
| **Context Assembly** | Multi-domain with SemanticSearchService | 6 domains in parallel, weighted prioritization, separate search service |
| **User Preferences** | Behavioral derivation | Zero-friction, learned from @-mentions/dismissals, daily recompute |
| **Memory Chunking** | 10-message chunks, top-3 retrieval | Localized summaries, semantic chunk search, trigger at 40 messages |
| **Realtime Sync** | Valtio + Realtime, no React Query | Optimistic updates with rollback, Realtime reconciliation |
| **LLM Strategy** | Multi-provider abstraction (Direct API) | 85% cost savings, Edge Functions compatible, multi-model support |
| **Web Search** | Built-in provider tools | Claude ($10/1K), OpenAI (included), Gemini ($35/1K) - no custom implementation |
| **Summarization** | Gemini 2.0 Flash + embeddings | $0.0006/summary, background jobs, ~$2K/year at scale |

---

## Architecture Simplifications

**Deferred from earlier consideration**:
- ❌ Claude Agent SDK → Not viable (requires Node.js long-running process + file system, incompatible with Edge Functions)
- ❌ Single-provider → Multi-provider abstraction chosen (85% cost savings via model tiering)
- ❌ Custom web search → Built-in provider tools sufficient (Claude/OpenAI/Gemini all support server-side search)
- ❌ Expensive summarization → Use Gemini 2.0 Flash instead of Claude (97% cheaper)

**Added for current architecture**:
- ✅ Thread branching (parent-child DAG)
- ✅ Provenance tracking (created_in_conversation_id, context_summary)
- ✅ Consolidation workflows (multi-branch artifact gathering)
- ✅ User preference derivation (behavioral learning)
- ✅ Shadow domain (unified semantic layer)
- ✅ Memory chunking (long thread compression)
- ✅ Direct Anthropic API with streaming (full control over SSE relay and approval flow)

---

## Next Steps

1. ✅ Phase 0 Complete - Research findings documented
2. **Phase 1**: Generate data-model.md (9 entities aligned with arch.md)
3. **Phase 1**: Expand contracts/ (19 API endpoints)
4. **Phase 1**: Generate quickstart.md (implementation guide)
5. **Phase 2**: Run /speckit.tasks to generate task list

---

**Authored by**: Claude Code (Sonnet 4.5)
**Reviewed by**: Aligned with spec.md (2025-10-26) and arch.md (2025-10-26)
