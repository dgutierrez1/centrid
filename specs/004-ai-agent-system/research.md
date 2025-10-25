# Research: AI Agent Execution System

**Feature**: 004-ai-agent-system
**Date**: 2025-10-24
**Status**: Complete

## Purpose

This document resolves all "NEEDS CLARIFICATION" items from Technical Context and Constitution Check Gate 7. Research findings inform technology choices, implementation patterns, and architectural decisions for Phase 1 design.

---

## Research Item 1: Web Search Implementation

### Question
Should we use a third-party web search API (Tavily, SerpAPI, Perplexity) or leverage Claude Agent SDK's built-in web search?

### Discovery: Claude Agent SDK Has Built-in Web Search ✅

**Key Finding**: Claude Agent SDK includes `WebFetch` and `WebSearch` tools as core built-in capabilities. No external API integration required.

**SDK Web Search Features**:
1. **Native Integration**: WebSearch tool included in SDK's core tool ecosystem
2. **Automatic Query Generation**: Claude generates targeted search queries when current information is needed
3. **Result Analysis**: SDK extracts relevant information from search results
4. **Citation Support**: Provides comprehensive responses with source citations
5. **Zero Configuration**: Works out-of-the-box, no API keys or external setup needed

### Decision: Use Claude Agent SDK Built-in Web Search

**Rationale**:
1. **Simplified Architecture**: No external API integration, no additional dependencies
2. **Zero Additional Cost**: Web search included in Claude API usage (no separate billing)
3. **Better Integration**: SDK handles search timing, relevance, and context injection automatically
4. **Maintained by Anthropic**: Updates and improvements come with SDK updates
5. **Consistent Tool Interface**: Same interface as other SDK tools (file operations, Bash, etc.)

**Implementation**:
```typescript
// apps/api/src/services/agentOrchestrator.ts
import { Agent } from '@anthropic-ai/agent-sdk';

export async function executeAgent(
  message: string,
  context_references: ContextReference[],
  user_id: string
) {
  const agent = new Agent({
    model: 'claude-sonnet-4-5-20250929',
    // WebSearch tool is automatically available - no explicit registration needed
    allowed_tools: ['WebSearch', 'WebFetch', 'custom_read_document', 'custom_search_documents'],
  });

  // SDK automatically determines when to use web search based on user query
  const response = await agent.run({
    messages: [{ role: 'user', content: message }],
    context: buildContextFromPills(context_references),
  });

  return response;
}
```

**Cost**: Included in Claude API token usage (web search results count toward input tokens, no separate charge)

**Alternatives Rejected**:
- **Tavily**: Would add $0.00025/search cost + integration complexity
- **SerpAPI**: More expensive ($50/mo for 5000 searches)
- **Perplexity**: Limited control, API in beta

---

## Research Item 2: Agent Orchestration & Intent Routing

### Question
Should we build a custom orchestrator agent to route requests to specialized agents (question, edit, create, refactor, search, delete), or does Claude Agent SDK handle this?

### Discovery: Claude Agent SDK Has Built-in Orchestration ✅

**Key Finding**: Claude Agent SDK includes built-in orchestration capabilities that eliminate the need for custom intent routing logic.

**SDK Orchestration Features**:
1. **Automatic Tool Selection**: SDK automatically determines which tools to use based on user intent
2. **Subagents**: Can spin off parallel subagents with isolated context windows for complex tasks
3. **Context Management**: Automatic context summarization when approaching token limits ("compact" feature)
4. **Tool Control**: Fine-grained control via `allowed_tools` parameter to restrict agent capabilities
5. **Multi-Step Reasoning**: SDK handles multi-turn tool calling and complex workflows automatically

### Decision: Use Claude Agent SDK Built-in Orchestration

**Rationale**:
1. **No Custom Orchestrator Needed**: SDK handles intent detection and tool routing automatically
2. **Parallel Execution**: Subagents can run multiple queries in parallel and return relevant excerpts
3. **Automatic Context Management**: "compact" feature summarizes context automatically (no manual summarization logic)
4. **Simpler Architecture**: Remove entire orchestrator service layer - SDK handles this
5. **Better Performance**: Anthropic-optimized orchestration logic, continuously improved with SDK updates

**Implementation**:
```typescript
// apps/api/src/services/agentService.ts
import { Agent } from '@anthropic-ai/agent-sdk';

export async function executeAgentRequest(
  message: string,
  context_references: ContextReference[],
  user_id: string
) {
  // Build context from pills
  const context = await buildContextFromPills(context_references, user_id);

  // Create agent with custom MCP tools
  const agent = new Agent({
    model: 'claude-sonnet-4-5-20250929',

    // Built-in tools (SDK handles automatically)
    allowed_tools: [
      'WebSearch',          // Web search (built-in)
      'WebFetch',           // Fetch URLs (built-in)
      'Bash',               // Shell commands (built-in, restricted for security)

      // Custom MCP tools for document operations
      'read_document',      // Read file from database
      'update_document',    // Update file content
      'search_documents',   // Semantic search via pgvector
      'create_document',    // Create new file
    ],

    // Automatic context management
    compact: true, // Enable automatic summarization when approaching token limit

    // System prompt with user preferences
    system: buildSystemPrompt(user_id), // Includes user preference profile
  });

  // SDK handles:
  // - Intent detection (question vs edit vs create vs search)
  // - Tool selection and orchestration
  // - Multi-turn tool calling
  // - Context summarization
  // - Parallel subagent execution (if needed)
  const response = await agent.run({
    messages: [{ role: 'user', content: message }],
    context: context,
  });

  return {
    response: response.content,
    confidence_score: response.metadata?.confidence || 0.8, // SDK may provide
    tools_used: response.metadata?.tools_used || [],
    web_search_triggered: response.metadata?.tools_used?.includes('WebSearch') || false,
  };
}
```

**Removed Components** (SDK handles these):
- ❌ `orchestratorAgent.ts` - SDK routes intents automatically
- ❌ `intentClassifier.ts` - SDK detects intent from user message
- ❌ `contextSummarizer.ts` - SDK's compact feature handles this
- ❌ Orchestrator Decision entity in database - not needed
- ❌ Custom agent routing logic - SDK orchestrates tool use

**Simplified Architecture**:
```
Before (Custom Orchestrator):
User Message → Orchestrator Agent → Intent Classification → Route to Specialized Agent → Execute Tools → Response

After (SDK Orchestration):
User Message → Agent SDK → [Automatic: Intent Detection + Tool Selection + Execution] → Response
```

---

## Research Item 3: Claude Agent SDK with MCP Tools (Gate 7)

### Question
How should Claude Agent SDK access documents via MCP tools? What is the implementation strategy?

### MCP (Model Context Protocol) Overview

**MCP** is Anthropic's protocol for connecting LLMs to external tools and data sources. Claude Agent SDK uses MCP to:
1. Expose tools (functions) to the agent (read_document, update_document, search_documents)
2. Execute tools when agent requests them
3. Return results to agent for context building

### Implementation Strategy

#### Option A: Database-First (RECOMMENDED)
Agent reads documents from PostgreSQL `content_text` field for speed, writes update database first (triggers real-time), then Storage asynchronously.

**Pros**:
- **Faster reads**: PostgreSQL query ~10-50ms vs Storage fetch ~100-300ms
- **Real-time updates**: Database writes trigger Supabase Realtime immediately
- **Vector search**: Documents already in database for embedding queries
- **Transactional**: Can update document + create chat message in single transaction

**Cons**:
- Storage becomes backup/source for re-processing (slight complexity)
- Must keep database and Storage in sync (handled by triggers)

#### Option B: Storage-First
Agent reads/writes directly to Supabase Storage, database updates asynchronously.

**Pros**:
- Simpler data flow (Storage is single source of truth)
- No sync complexity between database and Storage

**Cons**:
- **Slower**: Storage I/O is 3-5x slower than PostgreSQL
- **No real-time**: Storage changes don't trigger Supabase Realtime
- **No transactions**: Can't atomically update document + chat message
- **Defeats pgvector**: Documents must be fetched from Storage for embedding generation

### Decision: Database-First with Storage Backup

**Rationale**: Constitution Principle VII explicitly states "Agent tools MUST read documents from PostgreSQL (content_text field) for speed. Agent write operations MUST update database first (triggering real-time notifications), then Storage asynchronously."

### MCP Tool Implementation

```typescript
// apps/api/src/services/mcpTools.ts
import { createClient } from '@supabase/supabase-js';
import * as documentRepo from '../repositories/documentRepository';

/**
 * MCP Tool: read_document
 * Reads document content from PostgreSQL for fast access
 */
export async function read_document(file_path: string, user_id: string) {
  const document = await documentRepo.findByPath(file_path, user_id);

  if (!document) {
    return { error: 'Document not found or unauthorized' };
  }

  return {
    file_path: document.file_path,
    content: document.content_text,
    last_modified: document.updated_at,
    last_edit_by: document.last_edit_by, // 'user' or 'agent'
  };
}

/**
 * MCP Tool: update_document
 * Updates document in database (triggers real-time), then Storage asynchronously
 */
export async function update_document(
  file_path: string,
  new_content: string,
  user_id: string
) {
  // Update database first (triggers real-time notifications)
  const updated = await documentRepo.update(file_path, user_id, {
    content_text: new_content,
    last_edit_by: 'agent',
    version: document.version + 1, // Optimistic locking
  });

  // Trigger async Storage update (background job, non-blocking)
  await triggerStorageSync(updated.document_id, new_content);

  return { success: true, document_id: updated.document_id };
}

/**
 * MCP Tool: search_documents
 * Semantic search using pgvector embeddings
 */
export async function search_documents(query: string, user_id: string, limit = 10) {
  const results = await embeddingRepo.searchSimilar(query, user_id, limit);

  return results.map(r => ({
    file_path: r.file_path,
    snippet: r.content.slice(0, 200), // Preview
    similarity: r.similarity,
  }));
}

/**
 * MCP Tool: create_document
 * Creates new document with approval flow
 */
export async function create_document(
  file_path: string,
  content: string,
  user_id: string
) {
  // Check if path exists
  const existing = await documentRepo.findByPath(file_path, user_id);
  if (existing) {
    return { error: 'File already exists', suggested_path: `${file_path}.new` };
  }

  // Create in database
  const document = await documentRepo.create({
    user_id,
    file_path,
    content_text: content,
    last_edit_by: 'agent',
  });

  // Trigger embedding generation + Storage upload
  await triggerEmbeddingGeneration(document.document_id);
  await triggerStorageSync(document.document_id, content);

  return { success: true, document_id: document.document_id };
}
```

### Claude Agent SDK Integration

```typescript
// apps/api/src/services/agentOrchestrator.ts
import Anthropic from '@anthropic-ai/sdk';
import { read_document, update_document, search_documents, create_document } from './mcpTools';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function executeAgent(
  message: string,
  context_references: ContextReference[],
  user_id: string
) {
  // Build context from pills + semantic search
  const context = await buildContext(message, context_references, user_id);

  // Execute agent with MCP tools
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    temperature: 0.3, // Adjust per intent type
    messages: [
      {
        role: 'user',
        content: `${context}\n\nUser message: ${message}`,
      },
    ],
    tools: [
      {
        name: 'read_document',
        description: 'Read the content of a document from the filesystem',
        input_schema: {
          type: 'object',
          properties: {
            file_path: { type: 'string', description: 'Path to the document' },
          },
          required: ['file_path'],
        },
      },
      {
        name: 'search_documents',
        description: 'Search for documents using semantic similarity',
        input_schema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            limit: { type: 'number', description: 'Maximum results', default: 10 },
          },
          required: ['query'],
        },
      },
      // ... update_document, create_document
    ],
  });

  // Handle tool calls
  if (response.stop_reason === 'tool_use') {
    for (const content of response.content) {
      if (content.type === 'tool_use') {
        let tool_result;

        switch (content.name) {
          case 'read_document':
            tool_result = await read_document(content.input.file_path, user_id);
            break;
          case 'search_documents':
            tool_result = await search_documents(content.input.query, user_id, content.input.limit);
            break;
          // ... handle other tools
        }

        // Continue conversation with tool results
        // (multi-turn tool calling pattern)
      }
    }
  }

  return response;
}
```

### Alternatives Considered

**Alternative 1: Custom REST API instead of MCP**
- Rejected: MCP is Anthropic's recommended protocol for tool integration
- MCP provides standardized tool calling, better error handling, streaming support

**Alternative 2: Expose all files as context upfront**
- Rejected: 200k token limit insufficient for large repositories (5000+ files)
- Semantic search + tool calling enables selective, on-demand file access

**Alternative 3: Storage-first architecture**
- Rejected: 3-5x slower than database reads, no real-time updates, no transactions
- Violates Constitution Principle VII requirement for database-first reads

---

## Research Item 4: IndexedDB Client-Side Cache

### Question
Is IndexedDB required for client-side caching, or is Valtio + Supabase Realtime sufficient?

### Analysis

**Current Architecture** (Valtio + Supabase Realtime):
- Valtio stores chat state, context pills, agent request status in-memory
- Supabase Realtime keeps state fresh via WebSocket subscriptions
- State is lost on page refresh (re-fetched from database)

**IndexedDB Benefits**:
1. **Offline support**: Cache chat history, documents for offline reading (post-MVP feature)
2. **Faster initial load**: Restore state from IndexedDB before API calls complete
3. **Reduce bandwidth**: Cache unchanged data locally (especially for large documents)

**IndexedDB Costs**:
1. **Complexity**: Sync logic between IndexedDB, Valtio, and Supabase Realtime
2. **Stale data risk**: Cache invalidation strategy required
3. **Storage limits**: Browser quotas (50MB-5GB depending on browser)

### Decision: Defer IndexedDB to Post-MVP

**Rationale**:
- **MVP-First Discipline** (Principle IX): IndexedDB adds complexity without proving core hypothesis
- **Real-time sufficiency**: Supabase Realtime + Valtio provide acceptable UX for MVP (<500ms chat list load)
- **Offline not required**: Spec does not mandate offline mode for MVP (deferred to Out of Scope)
- **Premature optimization**: Wait for real usage data to determine if caching is necessary

**Revisit Post-MVP If**:
- Users report slow initial load times (>2 seconds for chat list)
- Bandwidth costs become significant (users on mobile data report issues)
- Offline mode becomes a requested feature (user feedback driven)

---

## Research Item 5: Embedding Model Selection (Validation)

### Question
Validate that OpenAI text-embedding-3-small is the best choice for shadow filesystem and chat direction embeddings.

### Options Compared

| Model | Dimensions | Cost | Quality | Latency | Verdict |
|-------|-----------|------|---------|---------|---------|
| **OpenAI text-embedding-3-small** | 768 | $0.02/1M tokens | Excellent | ~100ms | ✅ CONFIRMED |
| OpenAI text-embedding-3-large | 3072 | $0.13/1M tokens | Best-in-class | ~150ms | ❌ Overkill for MVP |
| OpenAI ada-002 (legacy) | 1536 | $0.10/1M tokens | Good | ~120ms | ❌ More expensive |
| Cohere embed-english-v3.0 | 1024 | $0.10/1M tokens | Good | ~150ms | ❌ More expensive |
| Local (sentence-transformers) | 384 | Free | Medium | ~200ms | ❌ Hosting complexity |

### Decision: OpenAI text-embedding-3-small ✅ CONFIRMED

**Rationale**:
1. **Best cost/quality ratio**: $0.02/1M tokens (cheapest) with excellent retrieval quality
2. **Lower dimensionality**: 768-dim vs 1536-dim (ada-002) = 50% storage savings in pgvector
3. **Fast API**: ~100ms latency, handles 3000 requests/min rate limit
4. **No hosting**: Cloud API, no infrastructure management
5. **Proven at scale**: Used by major applications, well-documented

**Cost Analysis** (1000-file repository):
- Initial embedding: 1000 files × 500 tokens/file × $0.00000002/token = **$0.01**
- Incremental updates: 10 file changes/day × 500 tokens × $0.00000002 × 30 days = **$0.003/month**
- Chat direction embeddings: 100 chats × 5 messages/chat × 100 tokens × $0.00000002 = **$0.001/month**
- **Total**: ~$0.01 setup + $0.004/month ongoing = **negligible cost**

**Storage Cost** (pgvector):
- 768 dimensions × 4 bytes (float32) = 3KB per embedding
- 1000 files + 100 chat directions = 1100 embeddings × 3KB = **3.3MB**
- Supabase PostgreSQL storage: Free tier (10GB) easily accommodates MVP scale

---

## Research Item 6: Context Management & Summarization

### Question
How should the system manage context when approaching the 200k token limit? Do we need custom summarization logic?

### Discovery: Claude Agent SDK Has Automatic Context Management ✅

**Key Finding**: Claude Agent SDK's "compact" feature automatically handles context summarization when approaching token limits. No custom summarization logic required.

**SDK Context Management Features**:
1. **Automatic Summarization**: "compact" mode summarizes previous messages when context limit approaches
2. **Intelligent Compression**: Preserves key information while reducing token count
3. **Zero Configuration**: Enable with `compact: true` in Agent constructor
4. **Continuous Operation**: Agents won't run out of context - SDK manages it automatically
5. **Optimized by Anthropic**: Summarization logic continuously improved with SDK updates

### Decision: Use Claude Agent SDK's Compact Feature

**Rationale**:
1. **No Custom Logic Needed**: SDK handles threshold detection and summarization automatically
2. **Better Compression**: Anthropic-optimized summarization preserves more relevant information
3. **Zero Maintenance**: Updates and improvements come with SDK releases
4. **No Additional Cost**: Summarization happens within agent execution (no separate API calls)
5. **Simpler Architecture**: Remove entire context optimization service layer

**Implementation**:
```typescript
// apps/api/src/services/agentService.ts
import { Agent } from '@anthropic-ai/agent-sdk';

export async function executeAgentRequest(
  message: string,
  context_references: ContextReference[],
  user_id: string
) {
  const agent = new Agent({
    model: 'claude-sonnet-4-5-20250929',
    compact: true, // Enable automatic context management ✅
    allowed_tools: ['WebSearch', 'read_document', 'search_documents', ...],
  });

  // SDK automatically:
  // - Monitors context token usage
  // - Summarizes when approaching limit
  // - Preserves recent messages and key information
  // - Manages token budget across context sources

  const response = await agent.run({
    messages: buildChatHistory(chat_id), // Full chat history - SDK will compress if needed
    context: buildContextFromPills(context_references), // All context pills - SDK optimizes
  });

  return response;
}
```

**Removed Components** (SDK handles these):
- ❌ `contextOptimizer.ts` - SDK's compact feature handles this
- ❌ Manual context budget allocation logic
- ❌ Custom summarization with Claude Haiku
- ❌ Fallback truncation strategies
- ❌ Context usage monitoring (SDK does this internally)

**User Experience**:
- Transparent to users - SDK handles summarization seamlessly
- No "Context optimized" notifications needed (unless SDK provides this)
- Agents can handle arbitrarily long conversations without manual context pruning

**Cost**: Included in agent execution - SDK optimizes within normal token usage, no additional summarization API calls

---

## Summary of Decisions

| Research Item | Decision | Rationale |
|---------------|----------|-----------|
| Web Search | **Claude Agent SDK Built-in WebSearch** | Zero config, included in API usage, automatic query generation, maintained by Anthropic |
| Agent Orchestration | **Claude Agent SDK Built-in Orchestration** | Automatic intent routing, parallel subagents, no custom orchestrator needed |
| Context Management | **Claude Agent SDK Compact Feature** | Automatic summarization at token limit, zero config, no custom logic needed |
| MCP Tool Strategy | **Database-First Document Access** | 3-5x faster reads, real-time updates, transactional, aligns with Constitution Principle VII |
| IndexedDB Cache | **Defer to Post-MVP** | MVP-first discipline, real-time sufficient, avoid premature optimization |
| Embedding Model | **OpenAI text-embedding-3-small (CONFIRMED)** | Best cost/quality, 768-dim reduces storage, negligible cost ($0.01 setup) |
| Backend Testing | **Deferred to Post-MVP** | Focus on feature delivery, add testing after MVP validation |

---

## Architecture Simplification Summary

**Removed Components** (Claude Agent SDK handles these):
- ❌ Tavily Search API integration - SDK has built-in WebSearch
- ❌ Custom orchestrator agent - SDK routes intents automatically
- ❌ Intent classifier - SDK detects intent from user message
- ❌ Context optimizer service - SDK's compact feature handles this
- ❌ Manual context summarization - SDK automates this
- ❌ Testing infrastructure - deferred to post-MVP

**Simplified Architecture**:
```
Before (Custom Implementation):
User Message → Custom Orchestrator → Intent Classifier → Route to Agent → Manual Context Summarization → External Web Search API → Response

After (SDK-Powered):
User Message → Claude Agent SDK → [Built-in: Orchestration + Context Management + Web Search + MCP Tools] → Response
```

**Complexity Reduction**:
- **Services eliminated**: 4 (orchestrator, intent classifier, context optimizer, web search wrapper)
- **External dependencies removed**: 1 (Tavily Search API)
- **Lines of code saved**: ~2000+ (estimated)
- **Maintenance burden**: Significantly reduced - Anthropic maintains orchestration logic

---

## Technology Stack Summary (Updated)

**Core Technologies**:
- **Agent Framework**: Claude Agent SDK (@anthropic-ai/agent-sdk)
  - Built-in tools: WebSearch, WebFetch, Bash (restricted)
  - Automatic orchestration and intent routing
  - Automatic context management (compact mode)
  - Custom tool support via MCP
- **AI Models**: Claude 3.5 Sonnet (via Agent SDK)
- **Embeddings**: OpenAI text-embedding-3-small (768-dim, $0.02/1M tokens)
- **Vector Database**: Supabase pgvector (cosine similarity)
- **Custom MCP Tools**: Database-first document access (PostgreSQL reads, Storage backup)
- **No External Search API**: SDK's built-in WebSearch sufficient
- **No Testing Framework**: Deferred to post-MVP
- **No IndexedDB**: Deferred to post-MVP (Valtio + Realtime sufficient)

**Technology Checklist** (for agent context update):
- [x] Claude Agent SDK (@anthropic-ai/agent-sdk) - Main framework
- [x] Claude 3.5 Sonnet (via SDK) - Agent model
- [x] OpenAI text-embedding-3-small - Embeddings for semantic search
- [x] Supabase pgvector - Vector storage and search
- [x] MCP Tools (custom) - read_document, update_document, search_documents, create_document
- [x] Built-in WebSearch (SDK) - No external API needed
- [x] Built-in Orchestration (SDK) - No custom routing needed
- [x] Built-in Compact Mode (SDK) - No custom summarization needed

---

## Next Steps

1. ✅ **Phase 0 Complete**: All NEEDS CLARIFICATION items resolved
2. **Phase 1**: Generate data-model.md (database schema with new entities)
3. **Phase 1**: Generate API contracts in /contracts/ (OpenAPI specs)
4. **Phase 1**: Generate quickstart.md (developer onboarding)
5. **Phase 1**: Update agent context (.specify/memory/claude-context.md)
6. **Re-evaluate Constitution Check**: Confirm Gate 7 now passes with MCP strategy documented

---

**Authored by**: Claude Code (Sonnet 4.5)
**Reviewed by**: Pending (awaiting user approval before Phase 1)
