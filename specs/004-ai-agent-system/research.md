# Research: AI-Powered Exploration Workspace

**Feature**: `004-ai-agent-system`
**Date**: 2025-10-26
**Phase**: Phase 0 (Outline & Research)
**Status**: Complete - Aligned with spec.md and arch.md

---

## Executive Summary

This research document resolves 7 critical technical questions for the AI agent system, covering streaming infrastructure, vector search optimization, context assembly, user personalization, memory management, real-time synchronization, and multi-provider LLM strategy.

### Key Decisions at a Glance

| Research Area | Decision | Impact |
|---------------|----------|--------|
| **SSE Streaming** | Server-Sent Events over WebSocket | Simpler HTTP-based protocol, automatic reconnection, debuggable |
| **Vector Search** | ivfflat index (100 lists) | <1s queries for 1000+ entities, 768-dim embeddings |
| **Context Assembly** | 6 domains in parallel | <1s total assembly, 200K token budget, weighted prioritization |
| **User Preferences** | Behavioral derivation | Zero-friction personalization, learned from interactions |
| **Memory Management** | 10-message chunks, top-3 retrieval | Handles 1000+ message threads efficiently |
| **State Sync** | Valtio + Realtime (no React Query) | Optimistic updates with rollback, real-time reconciliation |
| **LLM Strategy** | Multi-provider abstraction | 85% cost savings ($164K → $25K/year), Edge Functions compatible |

### Performance Targets

- Vector search: <1s for 1000 entities, <500ms for <100 entities
- Context assembly: <1s total (6 parallel queries)
- Memory chunk retrieval: <500ms for top-3 chunks
- Agent streaming: <500ms chunk latency
- User preference load: <50ms (cached)

### Cost Optimization

- **Embeddings**: OpenAI text-embedding-3-small at $0.02/1M tokens (~$0.01 per 1000 entities)
- **Summarization**: Gemini 2.0 Flash at $0.0006/summary (~$2K/year at scale)
- **LLM Tiering**: 70% Gemini Flash, 20% GPT-5 Mini, 10% Claude Sonnet 4.5 = 85% savings

### Architecture Highlights

**6 Context Domains** (assembled in parallel):
1. Explicit Context (1.0 weight) - @-mentioned files/threads
2. Shadow Domain (0.5 base) - Semantic matches via pgvector
3. Thread Tree (0.7) - Parent summary, inherited files, siblings
4. Memory Chunks (0.6) - Top-3 relevant chunks if >40 messages
5. User Preferences (0.8) - Behavioral derivation (always-include files)
6. Knowledge Graph (0.6) - Related concepts (Phase 2+)

**Multi-Provider LLM**:
- Direct API over Claude Agent SDK (Edge Functions compatibility)
- Unified abstraction layer for Claude, OpenAI, Gemini
- Model tiering: Simple (70%) → Gemini 2.0 Flash, Medium (20%) → GPT-5 Mini, Complex (10%) → Claude Sonnet 4.5
- Built-in web search across all providers (no custom implementation)

**User Preference Derivation**:
- Always-Include Files: @-mentioned 3+ times in 30 days → auto-included (0.8 weight)
- Excluded Patterns: Dismissed 3+ times → filtered out
- Blacklisted Branches: Manually hidden → excluded from matches
- Daily background job recomputes, cached per request (<50ms)

**Memory Chunking** (threads >40 messages):
- 10-message chunks with localized summaries
- 768-dim embeddings for semantic retrieval
- Top-3 chunks retrieved per query
- Budget: Latest 10 full messages + 3 chunks + files = ~191K tokens

**Real-time Sync**:
- Primary session: SSE for lowest latency
- Secondary sessions: Realtime subscriptions
- Optimistic updates with rollback on error
- No React Query (redundant with real-time subscriptions)

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

**Rationale**:
- Agent streaming is inherently one-way (server → client) - bidirectional not needed
- SSE reconnection is automatic via browser `EventSource` API
- Simpler to implement and debug than WebSocket (standard HTTP, visible in DevTools)
- Works with existing CDN/load balancer infrastructure without special WebSocket config
- Claude API returns streaming responses that map naturally to SSE events
- Tool call approvals handled via separate POST endpoint (acceptable UX trade-off)

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

**6 Context Domains**:
1. **Explicit Context** (1.0 weight) - Files/threads @-mentioned by user
2. **Shadow Domain** (0.5 base weight) - Semantic matches via pgvector
3. **Thread Tree** (0.7 weight) - Parent summary, inherited files, sibling threads
4. **Memory Chunks** (0.6 weight) - Top-3 relevant chunks if thread >40 messages
5. **User Preferences** (0.8 weight for always-include, filtering for excluded) - Derived from behavior
6. **Knowledge Graph** (0.6 weight) - Related concepts (Phase 2+)

### Algorithm (4 Steps)

**Step 1: Parallel Domain Queries** (target <1s total)
- Execute ALL 6 domains in parallel using `Promise.all`
- Explicit: Load full content from @-mentions
- Semantic: Top 10 matches with modifiers (SemanticSearchService)
- Tree: Parent summary + inherited files
- Memory: Top 3 chunks if >40 messages
- Preferences: Cached per request

**Step 2: Apply Modifiers**
- **Relationship modifiers** (based on thread tree position):
  - Siblings: +0.10 to semantic matches from sibling branches (FR-022)
  - Parent/Child: +0.15 to semantic matches from parent or child branches (FR-022)
- **Temporal decay**: `1.0 - (months_since_last_interaction × 0.05)` with floor 0.3 (FR-023)
- **Topic divergence filtering**: If branch summary similarity <0.3, only show semantic matches >0.9 (FR-021c)

**Step 3: Apply User Preferences**
- Filter OUT excluded patterns (reduces noise)
- Filter OUT blacklisted branches
- Add always-include files (learned from behavior, 0.8 weight)

**Step 4: Prioritize and Fit Budget**
- Merge all context sources with weights
- Sort by final weight (base + modifiers)
- Fit within 200K token budget
- Return included (6 sections for UI) + excluded (manual re-prime option)

### SemanticSearchService (Separate, Reusable)

**Why Separate**:
- Used by: ContextAssemblyService, ConsolidationService, manual user search, memory chunk search
- Clear separation: SemanticSearchService handles shadow domain queries, ContextAssemblyService orchestrates ALL domains
- Easier to optimize and test independently

**Process**:
1. Generate query embedding (OpenAI)
2. Get thread tree metadata for relationship modifiers
3. Semantic search across shadow domain (top 20, filter to 10 after modifiers)
4. Apply relationship modifiers (+0.10 siblings, +0.15 parent/child)
5. Apply topic divergence filtering (if branch similarity <0.3, only show matches >0.9)
6. Return top 10 sorted by final score

### Performance Targets

- Total assembly: <1s (FR-024c) ✅
- Parallel domain queries: 6 queries execute concurrently
- Semantic search: <500ms (leverages pgvector index)
- Preference load: <50ms (cached in memory per request)

---

## R4: User Preference Derivation

### Question
Should user preferences be explicitly managed (UI settings) or derived from behavioral patterns?

### Decision: Derived from Behavioral Patterns

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
- Recompute user preferences from last 30 days
- Update `always_include_files` (files @-mentioned 3+ times)
- Update `excluded_patterns` (files dismissed 3+ times)
- Update `blacklisted_branches` (manually hidden branches)
- Runs daily for each user

**Load Per Request** (cached):
- Check in-memory cache first
- Load from database if not cached
- Check staleness (>24h triggers fire-and-forget recompute)
- Cache for request duration

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

### Decision: 10-Message Chunks with Localized Summaries

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

**Chunk Structure** (ThreadMemoryChunk):
- `chunk_id`: UUID
- `conversation_id`: Thread reference
- `message_ids`: Array of 10 message IDs
- `embedding`: 768-dim vector
- `summary`: Localized (topics, decisions, artifacts, questions from this chunk)
- `timestamp_range`: [start_date, end_date]
- `chunk_index`: 1, 2, 3, ...

### Implementation

**Compression** (Background Job):
- Triggered when thread exceeds 40 messages
- Generate localized summary for each 10-message chunk (Gemini 2.0 Flash)
- Generate embedding for each summary (OpenAI text-embedding-3-small)
- Store in `thread_memory_chunks` table

**Retrieval** (Context Assembly):
- Only if thread >40 messages
- Semantic search across chunks using query embedding
- Return top-3 chunks sorted by similarity
- Each chunk assigned 0.6 weight

### Performance

- Chunking: <5s for 30 messages (3 chunks)
- Retrieval: <500ms for top-3 chunks
- Storage: 1000-message thread = 100 chunks = 300KB embeddings

---

## R6: Supabase Realtime with Optimistic Updates

### Question
How should we integrate Supabase Realtime subscriptions with Valtio state and optimistic updates?

### Decision: Valtio + Realtime (No React Query)

**Rationale** (Constitution Principle XVI):
- Real-time subscriptions already keep state fresh - caching library is redundant
- React Query creates dual state (cache + Valtio) and cache invalidation complexity
- Custom hooks are lighter and purpose-built for real-time apps

### Pattern: Optimistic Update → API Call → Realtime Reconciliation

**Flow**:
1. **Optimistic update**: Add temp item to Valtio state (instant UI feedback)
2. **API call**: Async service call to backend
3. **Success**: Replace temp with server data (reconciliation)
4. **Error**: Rollback (remove temp) + toast error

**Benefits**:
- Instant UI feedback (no loading delay)
- Automatic reconciliation via Realtime subscriptions
- Simple rollback on error
- Works across sessions (primary uses SSE, secondary uses Realtime)

### Realtime Subscriptions

**RealtimeProvider**:
- Subscribe to table changes filtered by `owner_user_id`
- Handle INSERT: Check if already in state (from optimistic update), add if not
- Handle UPDATE: Find by ID, replace with new data
- Handle DELETE: Remove from state
- Unsubscribe on cleanup

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

### Agentic Loop Pattern

**WHILE not done**:
1. Call LLM with tools + messages
2. Stream text chunks to frontend
3. **IF tool_call**:
   - Pause stream
   - Send approval request
   - Wait for user decision
   - IF approved: execute tool, add result to messages
   - IF rejected: end stream with error
4. **IF complete**: end stream
5. **IF max_loops reached**: timeout error

**Key Differences from SDK**:
- Manual loop (not SDK orchestration)
- Custom approval flow (not PreToolUse hooks)
- Works in Edge Functions (not Node.js server)
- Multi-provider ready (not Claude-only)

### Timeout Handling (FR-048b)

- Start 10-minute timer when approval requested
- Auto-reject after timeout
- Release SSE connection and Edge Function resources
- User must retry from beginning

### Error Handling

- Claude API error: Retry once, show toast if failed
- Tool execution error: Send error to agent, agent revises plan
- Stream interrupt: Discard partial message, user retries (MVP simplicity)

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
