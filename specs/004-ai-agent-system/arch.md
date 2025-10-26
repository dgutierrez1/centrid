# Architecture: AI-Powered Exploration Workspace

**Feature**: `004-ai-agent-system`
**Date**: 2025-10-26
**Status**: Complete
**Spec**: [spec.md](./spec.md)

> **Purpose**: Document complete feature architecture (frontend + backend + data + integration) for the AI-powered exploration workspace where branching conversations and persistent filesystem are unified through provenance.

**System Patterns**: See `.specify/memory/system-architecture.md` for project-wide patterns. This document focuses on feature-specific architecture.

---

## System Context

**How this feature fits into the system**:

| Aspect | Details |
|--------|---------|
| **This feature owns** | Conversation branching (DAG structure), file provenance tracking, cross-branch semantic discovery, AI agent execution with tool calls, context assembly engine, consolidation workflows, shadow entity management |
| **Depends on** | Supabase Auth (user identity), Supabase Storage (file backup), OpenAI Embeddings API (shadow entity vectors), Claude 3.5 Sonnet (agent intelligence), Supabase pgvector (semantic search), Supabase Realtime (live updates) |
| **Exposes to others** | Agent tool APIs (write_file, create_branch, search_files, read_file), Shadow entity semantic search (files/conversations/concepts), Provenance navigation (file → source conversation), Context assembly service (prime context for AI) |
| **Integration pattern** | Event-driven for real-time updates (Supabase Realtime), Synchronous API for agent execution (SSE streaming), Asynchronous background jobs for shadow entity generation, Semantic search for cross-entity discovery |

---

## Architecture Overview

**Layers in this feature**:

- [x] **Frontend** - User interface (screens, components, client-side logic)
- [x] **Backend** - Server-side APIs, business logic, background jobs
- [x] **Data** - Database schema, storage, caching
- [x] **Integration** - External services, webhooks, message queues

**High-level flow**:
```
[User] → [Chat UI] → [SSE Stream] → [Agent Execution] → [Tool Calls] → [Approval Flow]
                           ↓                                    ↓
                    [Context Assembly]                   [File Creation]
                           ↓                                    ↓
                    [Semantic Search]                   [Shadow Entity]
                           ↓                                    ↓
                    [Shadow Entities]                   [Provenance Tracking]
```

---

## Frontend Architecture

### Screens & Flows

| Screen | Purpose | User Story | Priority | Route/Entry Point |
|--------|---------|------------|----------|-------------------|
| **Chat Interface** | Primary conversation UI with message stream, context panel, branch selector | US-1, US-2, US-3, US-5 | P1 | `/chat/:conversationId` |
| **Branch Selector** | Hierarchical tree dropdown showing parent/siblings/children branches | US-1 | P1 | Chat header component |
| **Context Panel** | Integrated above input box, shows explicit files, semantic matches, branch context, excluded items | US-3 | P3 | Chat interface (above input) |
| **File Editor** | Full-screen editor with provenance header showing source conversation, creation context | US-2, US-5 | P2 | `/files/:fileId` or modal |
| **Approval Modal** | Tool call approval prompt with file preview, branch details, approve/reject buttons | US-2 | P2 | Inline during agent streaming |
| **Visual Tree View** | Interactive graph showing branch hierarchy, artifact counts (Phase 3, desktop only) | US-5 | P5 | `/tree` or sidebar toggle |

**Primary user flow**:
```
Chat Interface → User sends message → Loading indicator
    ↓
Context assembly (background, <1s)
    ↓
Agent streaming response (SSE) → Text chunks + Tool calls mixed
    ↓
Tool call requires approval → Pause stream → Approval Modal
    ↓
User approves → Stream resumes → File created → Provenance tracked
    ↓
Auto-include file in next message context → Continue conversation
```

**Branching flow**:
```
Chat Interface → User clicks "Create Branch" → Branch name modal
    ↓
OR Agent suggests branch → Approval prompt → User approves/rejects
    ↓
New branch created → Inherits parent context (explicit files, summary, last message)
    ↓
Branch Selector updates → User can switch between branches
    ↓
Context isolation enforced (sibling branches don't auto-share context)
```

**Consolidation flow**:
```
Main branch → User requests "generate report from all branches"
    ↓
Tree traversal → Access all child branch artifacts + summaries
    ↓
Context assembly with multi-branch provenance
    ↓
Agent generates consolidated document with citations
    ↓
File created with multiple source conversations tracked
```

**Navigation pattern**: Hub-and-spoke (Main branch is hub, child branches are spokes), Linear within each branch (message history), Modal overlays for approvals and file editing

### Component Structure

**Chat Interface**:
```
ChatController (business logic, state management)
├─ ChatView (presentation)
│  ├─ ChatHeader
│  │  ├─ BranchSelector (dropdown with hierarchical tree)
│  │  └─ BranchActions (create branch, consolidate, tree view)
│  ├─ ContextPanel (collapsible sections)
│  │  ├─ ExplicitContext (files, conversations @-mentioned)
│  │  ├─ SemanticMatches (cross-branch file discovery with provenance)
│  │  ├─ BranchContext (parent summary, inherited files)
│  │  ├─ ArtifactsFromThisChat (files created in current conversation)
│  │  └─ ExcludedContext (items that didn't fit in budget, manual re-prime)
│  ├─ MessageStream
│  │  ├─ Message (text content, timestamps)
│  │  ├─ ToolCallApproval (inline approval prompt during streaming)
│  │  └─ LoadingIndicator (streaming in progress)
│  └─ ChatInput
│     ├─ AutocompleteDropdown (files, conversations @-mention)
│     └─ SendButton
└─ FileEditorModal (opens when file clicked)
   ├─ ProvenanceHeader (source branch, creation context, "Go to source" link)
   └─ EditorContent
```

**File Editor**:
```
FileEditorController
├─ FileEditorView
│  ├─ ProvenanceHeader
│  │  ├─ SourceBranchPill (clickable → navigate to source conversation)
│  │  ├─ CreationTimestamp
│  │  ├─ ContextSummary (2-3 sentences)
│  │  └─ LastEditInfo (last_edited_by: agent/user, conversation link if agent edit)
│  └─ EditorPane (markdown editor with syntax highlighting)
```

**Visual Tree View** (Phase 3):
```
TreeViewController
├─ TreeViewCanvas (D3.js or React Flow)
│  ├─ BranchNode (title, artifact count, creation timestamp)
│  ├─ FileNode (provenance links to conversations)
│  └─ Edges (parent-child relationships, file references)
```

**Pattern**: Follows standard Controller/View pattern (see system-architecture.md) - Controllers handle data fetching, state updates, API calls; Views are pure presentational components receiving props and callbacks.

**Module locations**:
- Controllers: `apps/web/src/features/ai-agent-system/controllers/`
- Views: `apps/web/src/features/ai-agent-system/views/`
- Shared widgets: `packages/ui/src/features/ai-agent-system/`
- State management: `apps/web/src/lib/state/aiAgentState.ts` (Valtio)

### Frontend State Management

| State Type | Contains | Scope | Update Pattern |
|------------|----------|-------|----------------|
| **Application** | Current conversation, branch tree structure, shadow entities cache, streaming message buffer | Global (Valtio) | Optimistic updates → API call → Rollback on error or Server reconciliation via Realtime |
| **UI** | Context panel collapsed/expanded, file editor open/closed, approval modal state, autocomplete dropdown | Component-local | React useState |
| **URL** | Current conversation ID, file editor file ID | Navigation | Synced with Next.js router |
| **Streaming** | Incremental message chunks (text, tool calls), SSE connection status, pending approvals | Global (Valtio) | SSE events → Append to buffer → Render incrementally |

**State flow**:

**Message streaming**:
```
User sends message → Optimistic add to messages → SSE connection opened
    ↓
SSE chunks arrive → Append to streaming buffer (Valtio state)
    ↓
UI renders incremental content (text → tool → text → tool)
    ↓
Tool call requires approval → Pause stream, show modal (UI state)
    ↓
User approves → Send approval via API → Stream resumes → Buffer continues
    ↓
Stream complete → Move buffer to final messages → SSE connection closed
```

**Real-time sync** (Supabase Realtime):
```
Database change (file created, branch created, message added)
    ↓
Realtime subscription fires → Update Valtio state
    ↓
UI re-renders automatically (Valtio reactivity)
    ↓
Reconcile with optimistic updates (replace temp IDs with server IDs)
```

**Cross-branch discovery**:
```
User types in chat input → Trigger context assembly (debounced 300ms)
    ↓
Semantic search across shadow entities → Return top 10 files
    ↓
Update ContextPanel state (Valtio) → UI shows semantic matches
    ↓
User clicks file in semantic matches → Add to explicit context
    ↓
Next message includes file with 1.0 weight (explicit reference)
```

---

## Backend Architecture

### API Surface

| Endpoint | Method | Purpose | Request | Response | Auth |
|----------|--------|---------|---------|----------|------|
| `/execute-agent` | POST | Execute AI agent with streaming response via SSE | `{ conversationId, message, contextReferences[] }` | SSE stream (text chunks, tool calls, approvals) | Required (JWT) |
| `/approve-tool-call` | POST | Approve pending agent tool call during streaming | `{ toolCallId, approved: true/false, reason? }` | `{ success, resumeStream }` | Required (JWT) |
| `/create-branch` | POST | Create new conversation branch from parent | `{ parentId, title, contextFiles[] }` | `{ conversationId, branchTitle }` | Required (JWT) |
| `/search-entities` | POST | Semantic search across shadow entities (files, conversations, concepts) | `{ query, entityTypes[], limit }` | `{ entities[], relevanceScores[] }` | Required (JWT) |
| `/consolidate-branches` | POST | Consolidate artifacts from multiple child branches | `{ conversationId, childBranchIds[] }` | `{ consolidatedFileId, provenance[] }` | Required (JWT) |
| `/get-conversation/:id` | GET | Fetch conversation with messages, context, branch metadata | None | `{ conversation, messages[], contextReferences[], branchMetadata }` | Required (JWT) |
| `/update-file/:id` | PUT | Update file content with provenance tracking | `{ content, editedBy: 'user' }` | `{ file, shadowEntityUpdated }` | Required (JWT) |
| `/get-provenance/:fileId` | GET | Fetch full provenance for file (source conversation, edit history) | None | `{ createdIn, contextSummary, lastEdit }` | Required (JWT) |

**API pattern**: REST (resource-oriented) with SSE streaming for agent execution. Stateless endpoints with JWT auth. All responses follow consistent `{ data?, error? }` format except SSE streams.

**Contract location**: `specs/004-ai-agent-system/contracts/` (OpenAPI spec with Zod schemas)

### Service Layer

**Services** (business logic):

| Service | Responsibilities | Dependencies | Location |
|---------|------------------|--------------|----------|
| **AgentExecutionService** | Orchestrate AI agent execution, handle tool calls, manage streaming responses, approval flow | Claude 3.5 Sonnet API, ContextAssemblyService, ToolCallService | `apps/api/src/services/agentExecution.ts` |
| **ContextAssemblyService** | Build prime context from explicit references, semantic matches, branch context, memory chunks | ShadowEntityRepository, ConversationRepository, SemanticSearchService | `apps/api/src/services/contextAssembly.ts` |
| **SemanticSearchService** | Query shadow entities with cosine similarity, apply relationship modifiers, temporal decay | ShadowEntityRepository, pgvector | `apps/api/src/services/semanticSearch.ts` |
| **ProvenanceTrackingService** | Create/update file provenance metadata, track edit history, handle orphaned files | FileRepository, ConversationRepository | `apps/api/src/services/provenanceTracking.ts` |
| **TreeTraversalService** | Traverse conversation tree for consolidation, access child branch artifacts, gather summaries | ConversationRepository, FileRepository | `apps/api/src/services/treeTraversal.ts` |
| **ShadowEntityService** | Generate embeddings, summaries, structure metadata for files/conversations/concepts | OpenAI Embeddings API, ShadowEntityRepository, Claude for summarization | `apps/api/src/services/shadowEntity.ts` |
| **ToolCallService** | Execute agent tool calls (write_file, create_branch, search_files, read_file), handle approvals | FileRepository, ConversationRepository, ProvenanceTrackingService | `apps/api/src/services/toolCall.ts` |
| **ConsolidationService** | Orchestrate multi-branch consolidation, handle conflicts, generate provenance citations | TreeTraversalService, AgentExecutionService, ProvenanceTrackingService | `apps/api/src/services/consolidation.ts` |

**Pattern**: Three-layer backend architecture (see system-architecture.md and constitution Principle XVII):
- **Edge Functions** (HTTP routing, auth verification, SSE streaming setup)
- **Services** (business logic, orchestration, validation) ← This layer
- **Repositories** (data access, type-safe queries)

Services contain complex business logic, orchestrate multiple repositories, and are reusable across Edge Functions.

### Background Jobs / Async Processing

| Job | Trigger | Frequency | Purpose |
|-----|---------|-----------|---------|
| **ShadowEntitySyncJob** | File created/updated (>20% content change), Conversation message added, KG node created | On-demand (event-driven) | Generate embeddings + summary + structure metadata for shadow entities asynchronously (<2s target) |
| **ConversationSummaryJob** | New message added to conversation | On-demand (every message) | Regenerate conversation summary from scratch including topics, decisions, artifacts, open questions |
| **MemoryChunkCompressionJob** | Conversation exceeds 40 messages | On-demand (when threshold crossed) | Compress oldest messages (1-30) into 10-message chunks with embeddings and localized summaries |
| **ContextPruningJob** | Orphaned context references (file deleted, conversation archived) | Scheduled (daily) | Clean up invalid context references, remove orphaned shadow entities |

**Job queue pattern**: Event-driven via Supabase Edge Functions triggered by database changes (using Database Webhooks or triggers calling Edge Functions). For scheduled jobs, use Supabase pg_cron extension.

---

## Data Architecture

### Domain Model

| Entity | Key Attributes | Relationships | Lifecycle States |
|--------|---------------|---------------|------------------|
| **ShadowEntity** | shadow_id, entity_id, entity_type (file/conversation/kg_node), embedding (768-dim), summary, structure_metadata (JSONB), last_updated | Generic reference to files/conversations/kg_nodes | active → stale (needs update) → deleted (cascade when source deleted) |
| **Conversation** | conversation_id, parent_id, branch_title, creator, conversation_summary, messages[], explicit_files[], parent_last_message, branching_message_content, shadow_entity_id | has-many Message, has-many ContextReference, belongs-to Conversation (parent), has-one ShadowEntity | draft → active → archived |
| **Message** | message_id, conversation_id, role (user/assistant), content, tool_calls[] (JSONB), timestamp, tokens_used | belongs-to Conversation, has-many ToolCall | pending (streaming) → completed → edited |
| **ConversationMemoryChunk** | chunk_id, conversation_id, message_ids[], embedding (768-dim), summary (localized), timestamp_range, chunk_index | belongs-to Conversation | active → replaced (when conversation re-chunked) |
| **File** | file_id, path, content, provenance (JSONB: created_in_conversation_id, creation_timestamp, context_summary), last_edited, last_edited_by, edited_in_conversation_id, shadow_entity_id | has-one ShadowEntity, has-many ContextReference | draft → active → orphaned (provenance cleared) → deleted |
| **ContextReference** | reference_id, conversation_id, entity_type (file/folder/conversation), entity_reference (file_path/conversation_id), source (inherited/manual/@-mentioned/agent-added), priority_tier (1/2/3) | belongs-to Conversation | active → excluded (didn't fit in context budget) → removed |
| **AgentToolCall** | tool_call_id, message_id, conversation_id, tool_name, tool_input (JSONB), tool_output (JSONB), approval_status (pending/approved/rejected), timestamp | belongs-to Message | pending → approved → executed → completed OR rejected |
| **KnowledgeGraphEdge** | edge_id, source_entity_id, source_type, target_entity_id, target_type, relationship_type, confidence_score | connects ShadowEntity to ShadowEntity | draft (low confidence) → confirmed (high confidence) → deprecated |

**Business rules**:
- **BR-001**: Conversation CANNOT be deleted if child branches exist (prevent orphaned children)
- **BR-002**: File created via `write_file` tool MUST have provenance metadata; manually created files have NULL provenance
- **BR-003**: When file is edited, last_edited timestamp and last_edited_by MUST be updated, but original provenance preserved
- **BR-004**: Shadow entity MUST be regenerated when source entity changes >20% (character diff threshold)
- **BR-005**: Conversation summary MUST be regenerated from scratch on every new message (not incremental)
- **BR-006**: Memory chunks MUST be created in batches of 10 messages (messages 1-10 → chunk 1, 11-20 → chunk 2)
- **BR-007**: Semantic search results MUST be limited to top 10 entities by final relevance score
- **BR-008**: Tool calls MUST pause streaming and wait for user approval before execution
- **BR-009**: Branch context inheritance MUST include: explicit files (references only), parent summary, parent's last message, branching message (if agent-created)
- **BR-010**: When file is renamed/moved, file_id MUST stay same, path updated atomically across all tables

### Storage Strategy

| Data Type | Storage | Reason | Retention |
|-----------|---------|--------|-----------|
| **Conversation data** (messages, metadata) | PostgreSQL (Supabase) | Transactional integrity, real-time subscriptions, complex queries | Until user deletes account (7 years retention post-deletion for compliance) |
| **File content** | PostgreSQL (content column) + Supabase Storage (backup) | Database for fast reads and semantic search, Storage for backup and re-processing | Until user deletes file or account |
| **Embeddings** (shadow entities) | PostgreSQL with pgvector extension | Efficient cosine similarity search (<1s for 1000 entities), integrated with data | Same as source entity (cascade delete) |
| **Conversation summaries** | PostgreSQL (in conversations table) | Fast access for context assembly, embedded with conversation data | Same as conversation |
| **Memory chunks** | PostgreSQL (conversation_memory_chunks table) | Semantic retrieval of old conversation segments, integrated with embeddings | Same as conversation (deleted when conversation deleted) |
| **Tool call audit logs** | PostgreSQL (agent_tool_calls table) | Compliance, debugging, usage analytics | 90 days retention (configurable per plan) |
| **Session cache** (streaming buffers, temp data) | Redis (optional, MVP uses in-memory) | Fast access, TTL expiration | 1 hour TTL |

### Data Flow

**Read operations**:
- **Pattern**: Direct database for most reads (no cache for MVP - real-time is priority), Optional Redis cache for context assembly results (5min TTL, Phase 2+)
- **Caching**: Shadow entity embeddings cached in pgvector (no expiration, updated on source change), Conversation summaries cached in conversations table (updated on every message)

**Write operations**:
- **Pattern**: Write-through to database immediately, Trigger background jobs for shadow entity generation (asynchronous, <2s target), Real-time subscriptions notify all clients
- **Consistency**: Strong consistency for user-facing writes (file creation, message posting), Eventual consistency for shadow entities (background job completes within 2s, UI shows "generating" state)

**Embedding generation flow**:
```
File created → Write to files table → Trigger ShadowEntitySyncJob
    ↓
Background job generates embedding (OpenAI API) + summary (Claude) + structure metadata
    ↓
Write to shadow_entities table → Update file.shadow_entity_id
    ↓
Semantic search now includes this file (available within 2s)
```

**Context assembly flow**:
```
User sends message → ContextAssemblyService.buildPrimeContext()
    ↓
Query explicit references (1.0 weight) → Full content
    ↓
Semantic search shadow_entities (0.5 base + modifiers) → Top 10 matches
    ↓
Load branch context (parent summary, inherited files) (0.7 weight)
    ↓
Load memory chunks (if conversation >40 messages) → Top 3 relevant chunks
    ↓
Prioritize by weight → Fit within 200K token budget → Return prime context
    ↓
Agent execution uses prime context (total assembly time <1s)
```

---

## Integration Architecture

### Frontend ↔ Backend Integration

**Communication pattern**:
- **Agent execution**: Server-Sent Events (SSE) for streaming responses (text chunks, tool calls, approvals in real-time)
- **CRUD operations**: REST API (JSON request/response)
- **Real-time updates**: Supabase Realtime (WebSocket subscriptions for database changes)

**Data flow**:
```
Frontend → POST /execute-agent → API Gateway → Auth Middleware → AgentExecutionService
                                                                          ↓
                                                                   SSE stream opened
                                                                          ↓
                                                   ContextAssemblyService builds prime context
                                                                          ↓
                                                      Claude 3.5 Sonnet generates response
                                                                          ↓
                                            Stream chunks → SSE → Frontend renders incrementally
                                                                          ↓
                                             Tool call requires approval → Pause SSE stream
                                                                          ↓
Frontend → POST /approve-tool-call → ToolCallService executes → Resume SSE stream
```

**Real-time updates** (Supabase Realtime):
- **What updates**: New messages in conversations, file creations/edits, branch creations, shadow entity completions
- **Pattern**: Database triggers → Realtime channel → WebSocket push → Frontend subscription → Valtio state update → UI re-render
- **Channels subscribed**:
  - `conversations:{conversationId}` (messages, metadata)
  - `files:user:{userId}` (file changes user owns)
  - `shadow_entities:user:{userId}` (embedding/summary completions)

**Error handling**:
- **Client errors (4xx)**:
  - 400 Bad Request → Show error toast with validation details
  - 401 Unauthorized → Redirect to login
  - 403 Forbidden → Show "Access denied" message
  - 404 Not Found → Show "Resource not found", suggest navigation to home
  - 422 Validation Error → Highlight invalid fields in form
- **Server errors (5xx)**:
  - 500 Internal Server Error → Show generic error toast, log to Sentry, retry once
  - 503 Service Unavailable → Show "Service temporarily unavailable", retry with exponential backoff (3 attempts)
- **Network errors**:
  - SSE disconnect → Discard partial message, show error prompt, user must retry from beginning (MVP simplicity)
  - WebSocket disconnect → Supabase Realtime handles reconnection automatically
  - API timeout (>30s) → Show timeout message, allow manual retry

### External Service Integration

| Service | Purpose | Integration Pattern | Error Handling |
|---------|---------|---------------------|----------------|
| **OpenAI Embeddings API** | Generate 768-dim embeddings for shadow entities | REST API (async background job) | Retry 3x with exponential backoff, fallback to text search if service unavailable |
| **Claude 3.5 Sonnet** | AI agent intelligence (tool calls, consolidation, summaries) | REST API with streaming (SSE relay to frontend) | Retry once, show error toast if failed, log to Sentry |
| **Supabase Storage** | Backup file content for re-processing | Supabase SDK (async after database write) | Non-critical (database is source of truth), retry in background |
| **Supabase Realtime** | Real-time database change subscriptions | WebSocket subscriptions (managed by Supabase SDK) | Auto-reconnect on disconnect, graceful degradation (poll if WebSocket fails) |

---

## Security Architecture

### Authentication & Authorization

**Authentication**: JWT tokens via Supabase Auth, passed in `Authorization: Bearer <token>` header

**Authorization**:
- **Owner-based**: Users can only access their own conversations, files, shadow entities
- **RLS enforcement**: Database Row Level Security policies check `auth.uid() = user_id` on all user data tables

**Enforcement points**:
- **Frontend**: Hide unauthorized UI (e.g., delete button for non-owned files) - UX only, not security
- **Backend**:
  - Edge Functions verify JWT and extract user_id
  - All database queries use ANON_KEY (respects RLS) - SERVICE_ROLE_KEY NOT used for user operations
  - Services validate ownership before operations (double-check defense-in-depth)
- **Database**: RLS policies enforce user isolation at database level (ultimate authority)

**Tool call authorization**:
- Agent tool calls (`write_file`, `create_branch`) MUST be approved by user before execution
- Approval flow: Agent proposes tool call → Frontend shows modal → User approves/rejects → Backend executes only if approved
- Rejected tool calls are logged but NOT executed
- Agent receives rejection context and can revise plan

### Data Protection

**Sensitive data in this feature**:
- **Conversation content**: Protected by RLS (user_id check), encrypted in transit (TLS 1.3), encrypted at rest (Supabase default encryption)
- **File content**: Same as conversation content (RLS + TLS + at-rest encryption)
- **Embeddings**: Not sensitive (derived from content), but access controlled by RLS
- **API keys** (external services): Stored in Supabase Edge Function secrets (not exposed to frontend), rotated quarterly
- **JWT tokens**: Short-lived (1 hour access token, 30 day refresh token), validated on every request

**Auto-exclusion from AI context**:
- System MUST detect and exclude sensitive files from LLM context: `.env`, `credentials.json`, files containing patterns like `API_KEY=`, `PASSWORD=`, `SECRET=`
- Implemented in ContextAssemblyService with regex scanning before adding files to prime context
- Sensitive files are shown in UI with warning icon, not sent to agent

**Audit logging**:
- All agent tool calls logged: tool_name, input_params, approval_status, user_id, timestamp
- Failed auth attempts logged with IP address
- File access (read/write) logged for compliance
- Logs retained 90 days, exported to Sentry for analysis

---

## Key Architectural Decisions

### Decision 1: Shadow Entities as Unified Semantic Layer

**Context**: Need semantic search across multiple entity types (files, conversations, concepts) without duplicating embedding infrastructure for each type.

**Options considered**:
1. **Separate embeddings per entity type** - Pros: Simple, type-specific columns. Cons: Duplication (3x storage, 3x indexing), complex multi-type search (3 queries + merge), harder to add new types
2. **Unified shadow_entities table** - Pros: Single source of truth, easy multi-type search, extensible (add new types without schema changes), shared vector index. Cons: Slightly more complex queries (filter by entity_type), JSONB for structure_metadata (less type-safe)
3. **No unified layer, embed directly in entity tables** - Pros: Co-located with data. Cons: Massive duplication, no cross-entity search

**Chosen**: Unified shadow_entities table (Option 2)

**Why**:
- Semantic search is core value prop - must be fast and flexible
- Cross-entity-type queries are common ("find files OR conversations about RAG")
- Adding new entity types (e.g., chat threads, user profiles) shouldn't require embedding infrastructure changes
- Single pgvector index is more efficient than 3+ separate indexes
- Storage savings (1x embeddings vs 3x) significant at scale (1000+ entities per user)

**Consequences**:
- All entities MUST have shadow entity entry for searchability
- JSONB structure_metadata requires runtime validation (use Zod schemas)
- Background job MUST handle shadow entity sync for all types
- Adding new entity type requires: (1) Create entity table, (2) Add entity_type to shadow_entities enum, (3) Implement structure_metadata schema, (4) Add sync job trigger

---

### Decision 2: SSE Streaming for Agent Responses (Not WebSocket)

**Context**: Need to stream agent responses (text chunks + tool calls) to frontend in real-time as they're generated by Claude API.

**Options considered**:
1. **WebSocket bidirectional** - Pros: Full duplex, low latency. Cons: More complex (connection management, reconnection), overkill for one-way streaming, harder to debug
2. **Server-Sent Events (SSE)** - Pros: Native browser support, automatic reconnection, simpler protocol (HTTP), unidirectional is sufficient. Cons: One-way only (but we only need server → client), HTTP overhead slightly higher
3. **Polling** - Pros: Simplest. Cons: High latency (1-2s), inefficient (constant requests), poor UX

**Chosen**: Server-Sent Events (SSE)

**Why**:
- Agent responses are inherently one-way (server → client) - no need for full duplex
- SSE reconnection is automatic and built into browser EventSource API
- Simpler to implement than WebSocket (no connection management, no custom protocol)
- Easier to debug (standard HTTP, visible in browser DevTools)
- Works with existing HTTP infrastructure (CDN, load balancers) without special config
- Claude API returns streaming responses that map naturally to SSE events

**Consequences**:
- Edge Function must implement SSE protocol (Content-Type: text/event-stream, keep-alive)
- Frontend must use EventSource API for connection (cannot use fetch)
- Interrupted streams (network disconnect) must be retried from beginning (MVP limitation - partial resume is complex)
- Tool call approvals require separate POST request (not in SSE stream) since SSE is unidirectional

---

### Decision 3: Optimistic Updates + Real-time Reconciliation (No React Query)

**Context**: Users expect instant UI feedback when creating files, sending messages, or creating branches. Need to handle optimistic updates while ensuring consistency with server state.

**Options considered**:
1. **React Query with cache** - Pros: Built-in optimistic updates, automatic refetching, cache management. Cons: Conflicts with Supabase Realtime (dual state), cache invalidation complexity, optimistic updates don't integrate well with real-time subscriptions
2. **Valtio + Supabase Realtime + Custom hooks** - Pros: Single source of truth (Valtio), real-time updates via subscriptions keep state fresh automatically, custom hooks handle loading/error/optimistic. Cons: More manual work (no built-in cache), must implement optimistic update logic per operation
3. **No optimistic updates** - Pros: Simplest. Cons: Poor UX (slow perceived performance), feels unresponsive

**Chosen**: Valtio + Supabase Realtime + Custom hooks (Option 2)

**Why**:
- Real-time subscriptions already keep state fresh - caching library is redundant and creates conflicts
- Valtio is lightweight, reactive, and integrates perfectly with Realtime subscriptions (update state → UI re-renders automatically)
- Custom hooks are purpose-built for our use case (Service layer → Hook → Optimistic update → API → Reconcile with Realtime)
- Follows constitution Principle XVI (Service Layer Architecture for Real-Time Apps) - explicitly forbids React Query/SWR with Realtime
- Simpler architecture: fewer moving parts, clearer data flow, easier to debug

**Consequences**:
- Must implement optimistic update logic manually in each custom hook (useCreateFile, useSendMessage, useCreateBranch)
- Must handle rollback on error (revert Valtio state, show error toast)
- Must reconcile optimistic updates with Realtime events (replace temp IDs with server IDs)
- Loading/error states managed per hook (no global cache status)

---

### Decision 4: Context Assembly with Hybrid Approach (Dynamic Priming + Memory Chunking)

**Context**: Need to fit relevant context within 200K token budget while supporting conversations >40 messages and cross-branch semantic discovery.

**Options considered**:
1. **Dynamic priming only** - Pros: Always optimal context per request, no compression. Cons: Fails when conversation >40 messages (context overflow), loses old conversation history
2. **Memory chunking only** - Pros: Handles long conversations, compresses old messages. Cons: No dynamic optimization (always includes same chunks), can't prioritize based on current request
3. **Hybrid (Dynamic priming + Memory chunking)** - Pros: Dynamic priming for current relevance + memory chunking for long conversation history, best of both worlds. Cons: More complex (two systems)

**Chosen**: Hybrid (Dynamic priming + Memory chunking)

**Why**:
- Conversations will exceed 40 messages frequently (deep exploration over multiple sessions)
- Dynamic priming ensures current request gets best context (semantic matches, relationship modifiers, temporal decay)
- Memory chunking preserves old conversation history without overflow (compress messages 1-30 into chunks, keep 31-40 as full text)
- Semantic retrieval of memory chunks ensures relevant old context is included (not just chronological)
- Excluded items shown in UI for manual re-priming gives users control without auto-including everything

**Consequences**:
- ContextAssemblyService must implement two modes: standard (for <40 messages) and chunked (for >40 messages)
- Background job must compress messages into chunks when conversation crosses 40-message threshold
- Memory chunks must have embeddings for semantic retrieval (additional embedding cost)
- UI must show excluded context items so users understand what's missing
- Target <1s for context assembly requires efficient queries (indexed shadow_entities, cached conversation summaries)

---

### Decision 5: No Full Edit History for Files (Simple Last-Edit Tracking)

**Context**: Need to track file provenance and edits across conversations. Question: Full edit history (array of edits) or simple last-edit tracking (timestamp, editor, conversation)?

**Options considered**:
1. **Full edit history** - Pros: Complete audit trail, can show "who changed what when". Cons: Complex (array updates, migrations), storage overhead (grows unbounded), query complexity (search within array), rarely used in MVP
2. **Simple last-edit tracking** - Pros: Minimal storage (4 fields: last_edited, last_edited_by, edited_in_conversation_id, last_edit_user_id), fast queries, sufficient for provenance transparency. Cons: Lose historical edits (only know last editor)
3. **No edit tracking** - Pros: Simplest. Cons: Can't navigate from file to editing conversation, no provenance transparency

**Chosen**: Simple last-edit tracking (Option 2)

**Why**:
- MVP scope: Full edit history is not required to validate core hypothesis (branching + provenance)
- Provenance transparency achieved with creation context + last edit info (covers 95% of user questions: "where did this come from?", "who last changed it?")
- Storage efficient: 4 fields vs unbounded array (matters at scale with 1000+ files per user)
- Query performance: Simple WHERE clause vs JSONB array search
- Can add full edit history post-MVP without breaking changes (add edit_history JSONB column, backfill with last edit)

**Consequences**:
- Files table has: created_in_conversation_id (provenance), last_edited, last_edited_by (agent/user), edited_in_conversation_id (nullable)
- Provenance UI shows: "Created in [Branch A], Last edited by [agent/user] in [Branch B]" (not full history)
- If user needs full edit history post-MVP, must add separate audit log or edit_history JSONB column
- "Go to source" navigates to creation conversation (not last edit) - matches user mental model

---

## Performance Considerations

**Critical paths** (what needs to be fast):

| Path | Target | Optimization Strategy |
|------|--------|----------------------|
| **Context assembly** | <1s | Indexed shadow_entities (pgvector GiN index), cached conversation summaries, limit semantic search to top 10 |
| **Semantic search** | <1s for 1000 entities, <500ms for <100 entities | pgvector cosine similarity with GiN index, query planner optimization, LIMIT 10 |
| **Agent response latency** | <5s simple queries, <10s consolidation | Claude 3.5 Sonnet (fast model), prime context pre-assembled, streaming starts immediately |
| **Shadow entity sync** | <2s (background, async) | Parallel embedding generation (OpenAI batch API if available), queue-based processing, non-blocking |
| **Tree traversal** | <2s for <50 branches, <5s for <200 branches | Recursive CTE in PostgreSQL, indexed parent_id, cached branch metadata |
| **Real-time propagation** | <100ms | Supabase Realtime (WebSocket), database triggers, minimal payload |
| **SSE streaming** | Chunks arrive <500ms apart | Claude API streaming, no buffering (relay immediately), chunked transfer encoding |

**Optimization strategies**:
- **Database indexes**:
  - `shadow_entities(embedding)` with GiN index for vector similarity (ivfflat with 100 lists for <10K entities)
  - `conversations(parent_id)` B-tree index for tree traversal
  - `files(user_id, created_at)` composite index for file listing
  - `context_references(conversation_id, entity_type)` composite index for context assembly
- **Query optimization**:
  - Use `SELECT` with specific columns (not `SELECT *`) to reduce payload
  - Batch queries where possible (1 query for 10 files vs 10 queries)
  - Use `EXPLAIN ANALYZE` to validate index usage
- **Caching** (Phase 2+):
  - Redis cache for context assembly results (5min TTL, keyed by conversation_id + message count)
  - In-memory cache for conversation summaries (invalidate on new message)
- **Async processing**:
  - Shadow entity generation is async (non-blocking) - UI shows "generating" state, updates when complete
  - Conversation summary regeneration is async - optimistic update with summary from previous message
- **Embedding model choice**:
  - OpenAI text-embedding-3-small (768-dim, not 1536-dim) for cost/speed balance ($0.02/1M tokens vs $0.13/1M)
  - Claude 3.5 Sonnet for agent (fast, high quality), not Claude 3 Opus (slower, overkill for MVP)

**Scalability concerns**:
- **Shadow entity table growth**: Plan for 1000+ entities per user, 500 concurrent users = 500K rows. pgvector handles <1M rows efficiently with ivfflat index
- **Conversation tree depth**: No hard limit enforced (graceful scaling). Tree traversal uses recursive CTE (PostgreSQL optimized, handles 200+ branches)
- **SSE connection limits**: Edge Functions support 1000+ concurrent SSE connections per instance (horizontally scalable)
- **Realtime subscription limits**: Supabase Realtime handles 100K+ concurrent connections (no concern for MVP scale)

---

## Implementation Handoff

> Critical information for /speckit.plan and /speckit.design

**For /speckit.plan**:
- **Data model** → See Domain Model section above, also `data-model.md` for detailed schema
- **API contracts** → See API Surface section, full OpenAPI specs in `/contracts/`
- **Service structure** → See Service Layer section - 8 services to implement with clear dependencies
- **Integration patterns** → SSE streaming, Supabase Realtime subscriptions, background jobs via Edge Functions
- **Key algorithms**:
  - Context assembly: Explicit (1.0) + Semantic (0.5 + modifiers) + Branch (0.7) → Prioritize → Fit in 200K budget
  - Semantic search: Cosine similarity + relationship modifiers (+0.10 sibling, +0.15 parent/child) + temporal decay
  - Tree traversal: Recursive CTE starting from root, collect child artifacts, apply consolidation logic

**For /speckit.design**:
- **Screens to design**: Chat Interface (with context panel, branch selector, message stream), File Editor (with provenance header), Approval Modal, Branch Selector Dropdown, Visual Tree View (Phase 3)
- **User flows**: Message sending with streaming, Branch creation (user/agent/system-initiated), File creation with approval, Cross-branch discovery, Consolidation workflow
- **Component hierarchy**: See Component Structure section - ChatController/ChatView pattern with nested components
- **State visualization**: Context panel shows 5 sections (explicit, semantic, branch, artifacts, excluded) with visual priority indicators
- **Design considerations**:
  - Mobile-first (branch selector as drawer on mobile, tree view desktop-only)
  - Provenance visibility (hover tooltip, click for full details)
  - Streaming feedback (loading indicators, incremental rendering, pause for approval)
  - Context transparency (show what AI sees, allow manual re-priming)

**For /speckit.tasks**:
- **Frontend modules**:
  - Controllers: `apps/web/src/features/ai-agent-system/controllers/` (ChatController, FileEditorController, TreeViewController)
  - Views: `apps/web/src/features/ai-agent-system/views/` (ChatView, FileEditorView, TreeView)
  - State: `apps/web/src/lib/state/aiAgentState.ts` (Valtio store)
  - Hooks: `apps/web/src/lib/hooks/` (useStreamMessage, useCreateBranch, useSemanticSearch, etc.)
- **Backend services**: `apps/api/src/services/` (8 services listed in Service Layer section)
- **Edge Functions**: `apps/api/src/functions/` (execute-agent, approve-tool-call, create-branch, search-entities, consolidate-branches, etc.)
- **Repositories**: `apps/api/src/repositories/` (shadowEntity, conversation, file, contextReference, toolCall, memoryChunk)
- **Database migrations**: `apps/api/supabase/migrations/` (shadow_entities, conversations, files, context_references, agent_tool_calls, conversation_memory_chunks)
- **Integration setup**:
  - OpenAI API client: `apps/api/src/lib/openai.ts`
  - Claude API client: `apps/api/src/lib/anthropic.ts`
  - Supabase Realtime subscriptions: `apps/web/src/providers/RealtimeProvider.tsx`

---

## Validation Checklist

**Completeness**:
- [x] All user stories from spec.md covered (US-1 branching, US-2 provenance, US-3 cross-branch discovery, US-4 consolidation, US-5 provenance transparency)
- [x] Domain model includes all entities from spec.md (ShadowEntity, Conversation, Message, File, ContextReference, ToolCall, MemoryChunk, KnowledgeGraphEdge)
- [x] Frontend architecture complete (screens, flows, components, state management)
- [x] Backend architecture complete (API surface, services, background jobs)
- [x] Integration points documented (SSE streaming, Realtime subscriptions, external services, frontend↔backend)
- [x] At least 2 key decisions documented with rationale (5 decisions covering shadow entities, SSE streaming, optimistic updates, context assembly, edit tracking)

**Consistency**:
- [x] Entity names consistent across frontend/backend/data sections (ShadowEntity, Conversation, File, ContextReference, etc.)
- [x] API endpoints match between backend and integration sections (/execute-agent SSE stream, /approve-tool-call, /create-branch, etc.)
- [x] State management aligns with data flow (Valtio + Realtime subscriptions for optimistic updates + server reconciliation)

**Balance**:
- [x] Frontend and backend have equal detail (full-stack feature with comprehensive coverage of both layers)
- [x] No section dominates (architecture provides complete picture across all layers: frontend, backend, data, integration)
- [x] Each layer has purpose and rationale (frontend for UX, backend for orchestration, data for persistence, integration for real-time)

**Conciseness**:
- [x] No duplication of system-architecture.md patterns (references Controller/View pattern, Three-layer backend, Service layer architecture)
- [x] Focus on feature-specific architecture (shadow entities, SSE streaming, context assembly, provenance tracking are unique to this feature)
- [x] Architecture is scannable and reviewable in 15-20 minutes (key decisions highlighted, tables for quick reference)

---

**Architecture Approved**: [PENDING - awaiting review]

**Next Steps**:
1. Review arch.md for accuracy and completeness (covers full-stack architecture: frontend + backend + data + integration)
2. Run `/speckit.plan` to generate technical implementation plan
   - Plan will use: Domain model, API contracts, service structure, integration patterns
3. Run `/speckit.design` to create UI/UX visual design
   - Design will use: Screen inventory, user flows, component hierarchy
4. `arch.md` is the single source of truth for feature architecture (frontend + backend + data + integration)

**Note**: Architecture bridges requirements (spec.md) and implementation (plan.md, design.md, tasks.md)
