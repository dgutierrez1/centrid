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

| Screen | Purpose | User Stories | Priority | Route/Entry Point |
|--------|---------|--------------|----------|-------------------|
| **AI-Powered Exploration Workspace** | Single adaptive workspace where users interact with AI agent, manage context, navigate branches, and view/edit files. 3-panel layout: Left sidebar (Files/Threads tabs, 20%) + Center panel (Thread interface, 40-80%) + Right panel (File editor, 0-40%) | US-1, US-2, US-3, US-4, US-5 | P1 | `/thread/:threadId` |

**Flows within this screen**:
1. **Send Message with Agent Streaming** (US-2, AC-002) - User types message, sends, AI responds with streaming, tool calls require approval
2. **Create Branch (User-Initiated)** (US-1, AC-001) - User clicks "Create Branch", names it, system creates with inherited context
3. **Cross-Branch File Discovery** (US-3, AC-003) - User asks about topic, system surfaces relevant files from sibling branches via semantic search
4. **Consolidate from Multiple Branches** (US-4, AC-004) - User generates comprehensive document from all child branches
5. **Switch Between Branches** (US-1, AC-003) - User navigates between branches via dropdown, each maintains separate history
6. **Manage Context References** (US-3, AC-003/004) - User views context panel sections (explicit, frequently used, semantic, branch, artifacts, excluded), manually adjusts
7. **View File with Provenance** (US-5, AC-001) - User clicks file, sees provenance metadata, can navigate to source thread
8. **Approve Tool Call** (US-2, AC-001) - User reviews agent tool call preview, approves/rejects, agent executes or revises
9. **Navigate Visual Tree** (US-5, AC-004, Phase 3) - User views interactive graph of branch hierarchy, clicks nodes to navigate

**Key user flow (Send Message with Agent Streaming)**:
```
User types message → Sends → Context assembly (<1s) → Agent streaming (SSE)
    ↓
Text chunks + Tool calls mixed → Tool approval required → Pause stream
    ↓
User approves → Tool executes → Stream resumes → File created with provenance
    ↓
File auto-included in next message context → User continues conversation
```

**Layout & Navigation**:
- **3-panel adaptive workspace**: Left sidebar (20%, collapsible) + Center panel (40-80%, always visible) + Right panel (0-40%, slides in when file opened)
- **Thread-first UX**: Thread interface always visible (primary), file editing optional (closeable right panel)
- **Navigation pattern**: Branch selector dropdown (hierarchical tree), provenance links ("Go to source"), modal overlays for branch creation/consolidation

### Component Structure

**Workspace Layout** (organized by spatial location):

**Center Panel** (Thread interface, 40-80% width, always visible):
```
ThreadView (container)
├─ MessageStream
│  ├─ Message (text content, timestamps, markdown)
│  └─ ToolCallApproval (inline approval during streaming)
├─ ContextPanel (BELOW messages, ABOVE input)
│  ├─ ContextSection (collapsible container with state control)
│  │  └─ ContextReference (stateless widget - collapsed pill or expanded card)
│  └─ 6 sections: Explicit (coral), Frequently Used (blue), Semantic (purple), Branch (orange), Artifacts (green), Excluded (gray)
└─ ThreadInput (sticky bottom, send/stop button)
```

**Header** (Branch navigation and actions):
```
BranchSelector (hierarchical dropdown with tree structure)
BranchActions (create branch, consolidate, tree view buttons)
```

**Right Panel** (File editor, 0-40% width, slides in when file opened):
```
FileEditorPanel
├─ ProvenanceHeader
│  ├─ Source branch pill (clickable → navigate to source)
│  ├─ Creation timestamp + context summary
│  └─ "Go to source" link + last edit info
└─ EditorContent (markdown with syntax highlighting)
```

**Left Sidebar** (Files/Threads navigation, 20% width):
```
WorkspaceSidebar
├─ Tabs (Files | Threads)
├─ File list (when Files tab active)
└─ Thread list (when Threads tab active)
```

**Modal Overlays**:
```
CreateBranchModal (branch name input, validation, create button)
ConsolidateModal (branch selection, progress, preview, approval)
```

**Phase 3** (Visual tree view):
```
TreeView (overlay panel)
├─ BranchNode (clickable, shows artifact count)
├─ FileNode (clickable, highlights provenance)
└─ Edges (parent-child relationships)
```

**Pattern**: Pure presentational components (data-in/callbacks-out) located in `packages/ui/src/features/ai-agent-system/`. No business logic or server dependencies in UI components.

**Module locations**:
- Presentational components: `packages/ui/src/features/ai-agent-system/`
- Production containers: `apps/web/src/components/ai-agent-system/` (add business logic during implementation)
- State management: `apps/web/src/lib/state/aiAgentState.ts` (Valtio)

### Frontend State Management

| State Type | Contains | Scope | Update Pattern |
|------------|----------|-------|----------------|
| **Application** | Current conversation, branch tree structure, shadow entities cache, streaming message buffer | Global (Valtio) | Optimistic updates → API call → Rollback on error or Server reconciliation via Realtime |
| **User Preferences** | Always-include files (from @-mention frequency), excluded patterns (from dismissals), blacklisted branches (from manual hiding) - READ-ONLY to user, derived by backend | Global (Valtio) | Loaded on app init → Cached → Auto-updated daily by backend → Realtime subscription pushes updates to frontend (user sees "Frequently used" in context panel, transparent not hidden) |
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
| `/threads` | POST | Create new thread (root or branch) | `{ title, parentId? }` | `{ data: { threadId, title, parentId } }` | Required (JWT) |
| `/threads/:id` | GET | Fetch thread with messages, context, metadata | None | `{ data: { thread, messages[], contextReferences[], branchMetadata } }` | Required (JWT) |
| `/threads/:id` | PATCH | Update thread (rename branch, archive) | `{ title?, archived? }` | `{ data: { thread } }` | Required (JWT) |
| `/threads/:id` | DELETE | Delete thread (only if no children) | None | `{ data: { success: true } }` | Required (JWT) |
| `/threads/:id/messages` | POST | Send message and execute agent (SSE streaming) | `{ text, contextReferences[] }` | `{ data: { messageId, requestId, sseEndpoint } }` | Required (JWT) |
| `/threads/:id/consolidate` | POST | Consolidate artifacts from child branches | `{ childBranchIds[] }` | `{ data: { fileId, provenance[] } }` | Required (JWT) |
| `/messages/:id` | GET | Fetch single message with metadata | None | `{ data: { message, toolCalls[] } }` | Required (JWT) |
| `/files` | POST | Create file (manual or agent-created) | `{ path, content, provenance? }` | `{ data: { fileId, path, shadowDomainId } }` | Required (JWT) |
| `/files/:id` | GET | Fetch file with content and provenance | None | `{ data: { file, content, provenance, shadowDomain } }` | Required (JWT) |
| `/files/:id` | PUT | Update file content with provenance tracking | `{ content }` | `{ data: { file, shadowDomainUpdated } }` | Required (JWT) |
| `/files/:id` | DELETE | Delete file | None | `{ data: { success: true } }` | Required (JWT) |
| `/files/:id/provenance` | GET | Fetch full provenance metadata for file | None | `{ data: { createdIn, contextSummary, editHistory } }` | Required (JWT) |
| `/shadow-domain/search` | POST | Semantic search across shadow domain | `{ query, entityTypes[], limit? }` | `{ data: { entities[], relevanceScores[] } }` | Required (JWT) |
| `/shadow-domain/sync` | POST | Generate embeddings + summary for entity (async background job) | `{ entityId, entityType }` | `{ data: { shadowDomainId, status: 'queued' } }` | Required (JWT) |
| `/threads/:id/summarize` | POST | Regenerate thread summary (async background job) | None | `{ data: { status: 'queued' } }` | Required (JWT) |
| `/threads/:id/compress-memory` | POST | Compress thread memory into chunks (async background job) | None | `{ data: { chunksCreated, status: 'queued' } }` | Required (JWT) |
| `/context/prune` | POST | Clean up orphaned context references (scheduled job) | None | `{ data: { itemsPruned } }` | Service role only |
| `/agent-requests/:id/stream` | GET | Stream agent progress via SSE | None | SSE stream (tool_call, status_update, completion events) | Required (JWT) |
| `/agent-requests/:id/approve` | POST | Approve/reject pending tool call | `{ toolCallId, approved: boolean, reason? }` | `{ data: { success, resumeStream } }` | Required (JWT) |

**API pattern**: RESTful (resource-oriented) following HTTP semantics:
- **Resources as nouns**: `/threads`, `/messages`, `/files`, `/shadow-domain`, `/agent-requests` (not verbs like `/create-branch`, `/execute-agent`)
- **HTTP methods**: POST (create), GET (read), PUT (replace), PATCH (partial update), DELETE (remove)
- **Nested resources**: `/threads/:id/messages` (messages belong to thread), `/threads/:id/consolidate` (action on thread)
- **Idempotency**: GET/PUT/DELETE are idempotent, POST creates new resources
- **Status codes**: 200 (success), 201 (created), 204 (no content), 400 (client error), 401 (unauthorized), 403 (forbidden), 404 (not found), 422 (validation error), 500 (server error)
- **Response format**: All responses (except SSE) use `{ data?, error? }` with typed data payloads
- **Stateless**: Each request contains all necessary information (JWT in header, params in URL/body)

**Contract location**: `specs/004-ai-agent-system/contracts/` (OpenAPI spec with Zod schemas)

### Service Layer

**Services** (business logic):

| Service | Responsibilities | Dependencies | Location |
|---------|------------------|--------------|----------|
| **AgentExecutionService** | Orchestrate AI agent execution, handle tool calls, manage streaming responses, approval flow | Claude 3.5 Sonnet API, ContextAssemblyService, ToolCallService | `apps/api/src/services/agentExecution.ts` |
| **ContextAssemblyService** | Build prime context from explicit references, semantic matches, thread tree navigation, relationship modifiers, temporal decay, memory chunks, user preferences. Orchestrates all context sources into ranked priority list. | SemanticSearchService, ThreadRepository, FileRepository, UserPreferencesService | `apps/api/src/services/contextAssembly.ts` |
| **SemanticSearchService** | Query shadow domain with cosine similarity (pgvector), apply relationship modifiers based on thread tree position (+0.10 sibling, +0.15 parent/child), temporal decay. Returns ranked semantic matches. | ShadowDomainRepository, pgvector | `apps/api/src/services/semanticSearch.ts` |
| **UserPreferencesService** | Derive user preferences from interaction patterns (files @-mentioned 3+ times → always_include, dismissed matches 3+ times → excluded_patterns, manual branch hiding → blacklisted_branches), recompute daily from last 30 days, apply preferences to context assembly (filtering + weighting) | UserPreferencesRepository, MessageRepository, ContextReferenceRepository, AgentToolCallRepository | `apps/api/src/services/userPreferences.ts` |
| **ProvenanceTrackingService** | Create/update file provenance metadata, track edit history, handle orphaned files | FileRepository, ThreadRepository | `apps/api/src/services/provenanceTracking.ts` |
| **ShadowDomainService** | Generate embeddings, summaries, structure metadata for files/threads/concepts in unified shadow domain | OpenAI Embeddings API, ShadowDomainRepository, Claude for summarization | `apps/api/src/services/shadowDomain.ts` |
| **ToolCallService** | Execute agent tool calls (write_file, create_branch, search_files, read_file), handle approvals | FileRepository, ThreadRepository, ProvenanceTrackingService | `apps/api/src/services/toolCall.ts` |
| **ConsolidationService** | Orchestrate multi-branch consolidation, handle conflicts, generate provenance citations | ContextAssemblyService, AgentExecutionService, ProvenanceTrackingService | `apps/api/src/services/consolidation.ts` |

**Pattern**: Three-layer backend architecture (see system-architecture.md and constitution Principle XVII):
- **Edge Functions** (HTTP routing, auth verification, SSE streaming setup)
- **Services** (business logic, orchestration, validation) ← This layer
- **Repositories** (data access, type-safe queries)

Services contain complex business logic, orchestrate multiple repositories, and are reusable across Edge Functions.

### Background Jobs / Async Processing

**Pattern**: Direct API calls after operation completes (no database triggers for MVP simplicity)

| Endpoint | Method | Trigger | Purpose | Called By |
|----------|--------|---------|---------|-----------|
| `/shadow-domain/sync` | POST | File created/updated (>20% change), Thread message added | Generate embeddings + summary + structure metadata (<2s async) | File creation endpoint, Message endpoint |
| `/threads/:id/summarize` | POST | New message added to thread | Regenerate thread summary from scratch (topics, decisions, artifacts, questions) | Message creation endpoint |
| `/threads/:id/compress-memory` | POST | Thread exceeds 40 messages | Compress oldest messages (1-30) into 10-message chunks with embeddings | Message creation endpoint (when count > 40) |
| `/user-preferences/recompute` | POST | Scheduled (daily via cron) | Derive user preferences from last 30 days of interactions (@-mention frequency, semantic match dismissals, branch hiding) | Supabase pg_cron |
| `/context/prune` | POST | Scheduled (daily via cron) | Clean up orphaned context references, remove orphaned shadow domain entries | Supabase pg_cron |

**Implementation pattern**:
```typescript
// Example: After creating file
const file = await createFile(...)
// Fire-and-forget async job (don't await)
fetch('/shadow-domain/sync', {
  method: 'POST',
  body: JSON.stringify({ entityId: file.id, entityType: 'file' })
}).catch(err => logError(err)) // Log but don't block

return { data: { file } } // Return immediately
```

**Benefits** (vs database triggers):
- ✅ Explicit and debuggable (see exactly when jobs are triggered)
- ✅ No complex database webhook configuration
- ✅ Easier to test (call endpoints directly)
- ✅ Faster iteration (no trigger migration needed)
- ✅ MVP-appropriate (can migrate to event-driven post-MVP if needed)

---

## Data Architecture

### Domain Model

| Entity | Key Attributes | Relationships | Lifecycle States |
|--------|---------------|---------------|------------------|
| **ShadowDomainEntry** | shadow_id, entity_id, entity_type (file/thread/kg_node), embedding (768-dim), summary, structure_metadata (JSONB), last_updated | Generic reference to files/threads/kg_nodes | active → stale (needs update) → deleted (cascade when source deleted) |
| **Thread** | thread_id, parent_id, branch_title, creator, thread_summary, messages[], explicit_files[], parent_last_message, branching_message_content, shadow_domain_id | has-many Message, has-many ContextReference, belongs-to Thread (parent), has-one ShadowDomainEntry | draft → active → archived |
| **Message** | message_id, thread_id, role (user/assistant), content, tool_calls[] (JSONB), timestamp, tokens_used | belongs-to Thread, has-many ToolCall | pending (streaming) → completed → edited |
| **ThreadMemoryChunk** | chunk_id, thread_id, message_ids[], embedding (768-dim), summary (localized), timestamp_range, chunk_index | belongs-to Thread | active → replaced (when thread re-chunked) |
| **File** | file_id, path, content, provenance (JSONB: created_in_thread_id, creation_timestamp, context_summary), last_edited, last_edited_by, edited_in_thread_id, shadow_domain_id | has-one ShadowDomainEntry, has-many ContextReference | draft → active → orphaned (provenance cleared) → deleted |
| **ContextReference** | reference_id, thread_id, entity_type (file/folder/thread), entity_reference (file_path/thread_id), source (inherited/manual/@-mentioned/agent-added), priority_tier (1/2/3) | belongs-to Thread | active → excluded (didn't fit in context budget) → removed |
| **AgentToolCall** | tool_call_id, message_id, thread_id, tool_name, tool_input (JSONB), tool_output (JSONB), approval_status (pending/approved/rejected), timestamp | belongs-to Message | pending → approved → executed → completed OR rejected |
| **UserPreference** | preference_id, user_id, always_include_files[] (paths - files @-mentioned 3+ times in 30 days), excluded_patterns[] (regex - files dismissed 3+ times), blacklisted_branches[] (conversation_ids - manually hidden via "Hide from [Branch]"), context_budget (integer - dynamically adjusted, default 200K), last_updated (timestamp), derived_from_days (default 30) | belongs-to User | computed (daily background job) → active (loaded per request) → stale (>24h old, triggers recompute) |
| **KnowledgeGraphEdge** | edge_id, source_entity_id, source_type, target_entity_id, target_type, relationship_type, confidence_score | connects ShadowDomainEntry to ShadowDomainEntry | draft (low confidence) → confirmed (high confidence) → deprecated |

**Business rules**:
- **BR-001**: Thread CANNOT be deleted if child branches exist (prevent orphaned children)
- **BR-002**: File created via `write_file` tool MUST have provenance metadata; manually created files have NULL provenance
- **BR-003**: When file is edited, last_edited timestamp and last_edited_by MUST be updated, but original provenance preserved
- **BR-004**: Shadow domain entry MUST be regenerated when source entity changes >20% (character diff threshold)
- **BR-005**: Thread summary MUST be regenerated from scratch on every new message (not incremental)
- **BR-006**: Memory chunks MUST be created in batches of 10 messages (messages 1-10 → chunk 1, 11-20 → chunk 2)
- **BR-007**: Semantic search results MUST be limited to top 10 entities by final relevance score
- **BR-008**: Tool calls MUST pause streaming and wait for user approval before execution
- **BR-009**: Branch context inheritance MUST include: explicit files (references only), parent summary, parent's last message, branching message (if agent-created)
- **BR-010**: When file is renamed/moved, file_id MUST stay same, path updated atomically across all tables
- **BR-011**: User preferences MUST be derived from interactions (NOT user-managed settings): Files @-mentioned 3+ times in 30 days → always_include_files, files dismissed 3+ times from semantic matches → excluded_patterns, branches manually hidden → blacklisted_branches
- **BR-012**: User preference domain MUST be loaded for every context assembly (always-include files, excluded patterns, blacklisted branches), preferences cached in memory for request duration to avoid repeated queries
- **BR-013**: Always-include files from user preferences get 0.8 weight (between explicit 1.0 and semantic 0.5), excluded patterns filter out files BEFORE semantic search ranking, blacklisted branches excluded from relationship modifiers
- **BR-014**: User preferences MUST be recomputed daily via background job analyzing last 30 days of interactions, preferences >24h old marked as stale and trigger recompute on next context assembly

### Storage Strategy

| Data Type | Storage | Reason | Retention |
|-----------|---------|--------|-----------|
| **Thread data** (messages, metadata) | PostgreSQL (Supabase) | Transactional integrity, real-time subscriptions, complex queries | Until user deletes account (7 years retention post-deletion for compliance) |
| **File content** | PostgreSQL (content column) + Supabase Storage (backup) | Database for fast reads and semantic search, Storage for backup and re-processing | Until user deletes file or account |
| **Embeddings** (shadow domain) | PostgreSQL with pgvector extension | Efficient cosine similarity search (<1s for 1000 entities), integrated with data | Same as source entity (cascade delete) |
| **Thread summaries** | PostgreSQL (in threads table) | Fast access for context assembly, embedded with thread data | Same as thread |
| **Memory chunks** | PostgreSQL (thread_memory_chunks table) | Semantic retrieval of old thread segments, integrated with embeddings | Same as thread (deleted when thread deleted) |
| **User preferences** | PostgreSQL (user_preferences table) | Context rules, custom prompts, always-include files, excluded patterns | Until user deletes account |
| **Tool call audit logs** | PostgreSQL (agent_tool_calls table) | Compliance, debugging, usage analytics | 90 days retention (configurable per plan) |

### Data Flow

**Read operations**:
- **Pattern**: Direct database for all reads (no external cache for MVP - simplicity and real-time priority)
- **Built-in caching**: Shadow domain embeddings stored in pgvector (no expiration, updated on source change), Thread summaries denormalized in threads table (updated on every message), User preferences cached per-request in memory

**Write operations**:
- **Pattern**: Write-through to database immediately, Trigger background jobs for shadow domain generation (asynchronous, <2s target), Real-time subscriptions notify all clients
- **Consistency**: Strong consistency for user-facing writes (file creation, message posting), Eventual consistency for shadow domain (background job completes within 2s, UI shows "generating" state)

**Embedding generation flow**:
```
File created → Write to files table → Return file to user immediately
    ↓
POST /shadow-domain/sync (fire-and-forget, don't await)
    ↓
Background function generates embedding (OpenAI API) + summary (Claude) + structure metadata
    ↓
Write to shadow_domain table → Update file.shadow_domain_id
    ↓
Semantic search now includes this file (available within 2s)
    ↓
Realtime notification updates UI (shadow domain entry created)
```

**Context assembly flow** (multi-domain data gathering):
```
User sends message → Create message record → Return to user immediately
    ↓
POST /threads/:id/summarize (fire-and-forget) → Regenerate thread summary in background
    ↓
If message count > 40: POST /threads/:id/compress-memory (fire-and-forget) → Compress old messages
    ↓
POST /shadow-domain/sync (fire-and-forget) → Generate embedding for thread update
    ↓
Meanwhile: ContextAssemblyService.buildPrimeContext() - GATHERS FROM MULTIPLE DOMAINS:
    ↓
[1] Explicit Context Domain (1.0 weight)
    → Query explicit references (@-mentioned files, threads, folders)
    → Full content from FileRepository, ThreadRepository
    ↓
[2] Shadow Domain (0.5 base weight + modifiers)
    → SemanticSearchService.search(query, entityTypes, threadTreeMetadata)
    → Returns ranked semantic matches (files, threads, concepts) with cosine similarity
    → Apply relationship modifiers (+0.10 sibling, +0.15 parent/child)
    → Apply temporal decay (newer = higher weight)
    → Top 10 matches
    ↓
[3] Thread Tree Domain (0.7 weight)
    → Load branch context (parent summary, inherited files, sibling threads)
    → ThreadRepository.getTreeContext(threadId)
    ↓
[4] Memory Domain (if thread >40 messages)
    → Load compressed memory chunks (top 3 relevant to current query)
    → SemanticSearchService.searchMemoryChunks(query, threadId)
    ↓
[5] User Preference Domain (0.8 weight for always-include, filtering for excluded)
    → Load DERIVED user preferences (learned from interactions, NOT user-managed settings)
    → UserPreferencesRepository.getContextPreferences(userId)
    → APPLY excluded patterns FIRST (filter out files before semantic search - reduces noise)
        - Files matching excluded_patterns (regex) are removed from semantic search results
        - Blacklisted branches (from "Hide from [Branch]" button) excluded from relationship modifiers
    → ADD always-include files to priority list with 0.8 weight (higher than semantic 0.5, lower than explicit 1.0)
        - Files @-mentioned 3+ times in last 30 days → auto-included (behavioral learning)
        - User sees these as "Frequently used" in context panel (transparent, not hidden magic)
    → PRIORITY ORDER after preference application:
        - Explicit (1.0) > Always-include from preferences (0.8) > Branch context (0.7) > Semantic (0.5 + modifiers)
    → Preferences updated daily via background job analyzing last 30 days of interactions:
        - @-mention frequency → always_include_files
        - Semantic match dismissals (3+) → excluded_patterns
        - Manual "Hide from [Branch]" → blacklisted_branches
        - Avg message complexity → context_budget adjustment
    ↓
[6] Knowledge Graph Domain (Phase 2+ - 0.6 weight)
    → Query KG for related concepts (entity relationships, cross-references)
    → KnowledgeGraphRepository.getRelatedNodes(entities)
    ↓
Merge all domains → Prioritize by weight → Fit within 200K token budget → Return prime context
    ↓
Agent execution uses prime context (total assembly time <1s, all domains queried in parallel)
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

### Decision 1: Shadow Domain as Unified Semantic Layer

**Context**: Need semantic search across multiple entity types (files, threads, concepts) without duplicating embedding infrastructure for each type.

**Options considered**:
1. **Separate embeddings per entity type** - Pros: Simple, type-specific columns. Cons: Duplication (3x storage, 3x indexing), complex multi-type search (3 queries + merge), harder to add new types
2. **Unified shadow_domain table** - Pros: Single source of truth, easy multi-type search, extensible (add new types without schema changes), shared vector index. Cons: Slightly more complex queries (filter by entity_type), JSONB for structure_metadata (less type-safe)
3. **No unified layer, embed directly in entity tables** - Pros: Co-located with data. Cons: Massive duplication, no cross-entity search

**Chosen**: Unified shadow_domain table (Option 2)

**Why**:
- Semantic search is core value prop - must be fast and flexible
- Cross-entity-type queries are common ("find files OR threads about RAG")
- Adding new entity types (e.g., user profiles, knowledge graph nodes) shouldn't require embedding infrastructure changes
- Single pgvector index is more efficient than 3+ separate indexes
- Storage savings (1x embeddings vs 3x) significant at scale (1000+ entities per user)
- Name "shadow domain" emphasizes this is a parallel semantic layer shadowing the primary domain model

**Consequences**:
- All searchable entities MUST have shadow domain entry
- JSONB structure_metadata requires runtime validation (use Zod schemas)
- Background job MUST handle shadow domain sync for all types
- Adding new entity type requires: (1) Create entity table, (2) Add entity_type to shadow_domain enum, (3) Implement structure_metadata schema, (4) Add sync job trigger

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

### Decision 4: Context Assembly with Semantic Search Service

**Context**: Need to fit relevant context within 200K token budget while gathering from multiple domains: (1) semantic discovery (shadow domain), (2) thread tree relationships, (3) long threads >40 messages, (4) user preferences, (5) knowledge graph (Phase 2+).

**Options considered**:
1. **All logic in ContextAssemblyService** - Pros: Single service. Cons: Mixes concerns (semantic search is reusable outside context assembly), harder to test semantic search independently
2. **Separate SemanticSearchService + ContextAssemblyService** - Pros: SemanticSearchService is reusable (by consolidation, manual search, etc.), clear separation (search vs orchestration), easier to test/optimize each independently. Cons: Two services instead of one
3. **Multiple specialized services per domain** - Pros: Maximum separation. Cons: Over-engineered for MVP, too much coordination overhead

**Chosen**: Separate SemanticSearchService + ContextAssemblyService (Option 2)

**Why**:
- **SemanticSearchService is reusable**: Needed by ContextAssemblyService, ConsolidationService, manual user search, memory chunk search. It's a core capability, not just for context.
- **Clear separation of concerns**: SemanticSearchService handles shadow domain queries (cosine similarity, relationship modifiers, temporal decay). ContextAssemblyService orchestrates ALL domains (explicit, semantic, tree, memory, user preferences).
- **Easier to optimize independently**: Can tune semantic search (pgvector index, query parameters) without touching orchestration logic
- **Simpler testing**: Test semantic search with known embeddings, test context assembly with mocked semantic results
- **Architecture pattern**: ContextAssemblyService depends on SemanticSearchService (clean dependency graph)

**Consequences**:
- **7 services total** (was 6 with consolidated approach)
- ContextAssemblyService orchestrates multi-domain gathering: calls SemanticSearchService.search(), ThreadRepository.getTreeContext(), UserPreferencesRepository.getContextPreferences(), SemanticSearchService.searchMemoryChunks()
- SemanticSearchService is focused and reusable: query shadow_domain, apply modifiers, return ranked results
- All domain queries execute in parallel (user preferences, semantic search, thread tree, memory chunks) for <1s total assembly time
- UI must show excluded context items so users understand what's missing

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

### Decision 6: User Preference Domain for Behavioral Learning

**Context**: Need to optimize context assembly for individual users based on their interaction patterns. Some users consistently @-mention certain files, dismiss specific semantic matches, or prefer certain conversation styles. Manually managing preferences creates friction and requires users to predict what they'll need.

**Options considered**:
1. **No user preferences** - Pros: Simplest, no additional storage/logic. Cons: All users get identical context assembly, misses personalization opportunity, doesn't learn from user behavior
2. **Explicit user settings UI** - Pros: Direct user control, transparent. Cons: High friction (users must configure before seeing value), users poor at predicting future needs, maintenance burden (users must update as needs change)
3. **Derived preferences from interactions** - Pros: Zero user friction (learns automatically), accurate (based on actual behavior not predictions), improves over time. Cons: More complex (behavior tracking), potential privacy concerns (mitigated by user ownership via RLS), delayed personalization (needs interaction history)

**Chosen**: Derived preferences from interactions (Option 3)

**Why**:
- **Zero friction personalization**: Users get better context assembly automatically without configuration burden
- **Behavior is truth**: What users actually do (files they @-mention, matches they dismiss, agents they approve) is more accurate than what they think they'll need
- **Improves over time**: More interactions → better preference model → more relevant context
- **AI-native UX**: Aligns with "system learns from you" paradigm vs "you configure the system"
- **Specific derivation patterns**:
  - **Always-include files** (0.8 weight): Files @-mentioned 3+ times in last 30 days → auto-included in future context
  - **Excluded patterns**: Files consistently dismissed from semantic matches (3+ dismissals) → suppressed in future searches
  - **Blacklisted branches**: Branches explicitly hidden via "Hide from [Branch]" button → excluded from semantic context
  - **Context budget**: Dynamically adjusted based on user's typical conversation complexity (median message length, avg file references)

**Consequences**:
- User preferences table stores derived data: always_include_files (array of paths), excluded_patterns (array of regex), blacklisted_branches (array of conversation_ids), context_budget (integer, default 200K)
- UserPreferencesService analyzes user interactions (message history, approval/rejection patterns, semantic match dismissals) to update preferences
- Background job runs daily to recompute preferences from last 30 days of interactions
- Preferences loaded once per context assembly request (cached in memory for request duration)
- Privacy consideration: All preference data scoped to user_id (RLS enforced), never shared across users
- Cold start problem: New users have no preferences (fallback to system defaults) until interaction history builds
- No UI needed for MVP (preferences entirely under the hood) - advanced users could get preference viewer in Phase 3+

---

### Decision 7: Memory Chunking for Long Threads

**Context**: Threads exceeding 40 messages cause context budget overflow (200K token limit per FR-027). Including all messages is impossible, but truncating loses valuable context. Need compression strategy that preserves relevant history while fitting in budget.

**Options considered**:
1. **Truncate old messages** - Pros: Simplest (just take last N messages). Cons: Loses potentially relevant context from early conversation, no semantic awareness (may truncate critical decisions)
2. **Single embedding per thread** - Pros: Minimal storage (1 embedding per thread), simple retrieval. Cons: Loses granularity (can't retrieve specific conversation segments), poor precision (entire thread collapses to single vector)
3. **Chunk-based compression with semantic retrieval** - Pros: Preserves granularity (retrieve relevant segments), semantic awareness (find chunks matching current query), balances storage vs precision. Cons: More complex (chunking logic, multiple embeddings), query overhead (semantic search across chunks)

**Chosen**: Chunk-based compression with semantic retrieval (Option 3)

**Why**:
- **Chunk size: 10 messages** - Balances granularity with coherence. Too small (e.g., 5 messages) creates too many chunks and loses conversation flow. Too large (e.g., 20 messages) reduces precision (chunk may contain multiple unrelated topics). 10 messages ≈ 2-3K tokens ≈ meaningful conversation segment with topic coherence.
- **Retrieval count: Top-3 chunks** - Based on 200K budget allocation: Latest 10 full messages (~5K tokens) + 3 compressed chunks (~6K tokens summary) + files/semantic matches (~180K tokens) = fits budget. More chunks would crowd out files. Fewer chunks would waste budget.
- **Localized summaries** - Each chunk summarized independently (topics + decisions + artifacts + questions from its 10 messages only, not cumulative). Improves retrieval precision - query "what did we decide about RAG?" matches chunk that discussed RAG, not just final chunk with cumulative summary.
- **Trigger threshold: 40 messages** - Keeps 31-40 as full text (recent context), compresses 1-30 into chunks. 40 = 4 chunks (messages 1-10, 11-20, 21-30, 31-40 full). Balances storage (don't chunk too early) with context quality (compress before overflow).

**Consequences**:
- ThreadMemoryChunk table stores: chunk_id, conversation_id, message_ids (array), embedding (768-dim), summary (localized to chunk), timestamp_range, chunk_index
- Memory compression triggered after message 40 via fire-and-forget API call to `/threads/:id/compress-memory`
- Background function generates embeddings + summaries for chunks 1-3, keeps messages 31-40 as full text
- Context assembly queries memory chunks via SemanticSearchService.searchMemoryChunks(query, threadId) - returns top-3 relevant chunks
- Storage scaling: 1000-message thread = 100 chunks = 100 embeddings (manageable with pgvector)
- Retrieval accuracy trade-off: If critical context not in top-3 chunks, may be missed. User can manually re-prime from "Excluded context" section.
- Chunk size is FIXED (10 messages) - not dynamic. Simpler implementation, predictable storage/retrieval. Can tune post-MVP if data shows different optimal size.

---

### Decision 8: Direct Anthropic API Over Claude Agent SDK

**Context**: Need to integrate Claude 3.5 Sonnet for agent intelligence with tool use, streaming responses, and user approval flows. Question: Use Claude Agent SDK (higher-level abstraction) or Direct Anthropic API (lower-level control)?

**Options considered**:
1. **Claude Agent SDK** - Pros: Built-in tool management, permission hooks (PreToolUse), async streaming via query(), MCP integration, production-ready patterns. Cons: Opinionated orchestration (may not fit custom approval UI), Python-first (TypeScript support unclear), less control over streaming granularity, learning curve for SDK abstractions
2. **Direct Anthropic API with Streaming** - Pros: Full control over streaming relay (SSE), explicit approval flow implementation, simpler for MVP (no SDK abstractions), TypeScript-native. Cons: Manual tool orchestration, no built-in permission system, must implement approval logic from scratch

**Chosen**: Direct Anthropic API with Streaming (Option 2)

**Why**:
- **Full control over approval flow**: Direct API allows pausing SSE stream at exact tool call moment, showing custom approval UI (FR-049), and resuming stream after user action (FR-048a requirement)
- **Streaming granularity**: Can relay individual text chunks and tool calls to frontend via SSE without SDK buffering or abstraction layers
- **TypeScript native**: Anthropic SDK is TypeScript-first, avoiding Python SDK dependency and fitting naturally with Next.js/Deno backend
- **Simpler for MVP**: No need to learn SDK patterns, hooks, or permission abstractions - implement exactly what spec requires
- **Approval UX control**: Spec requires custom approval modal with file preview, branch details, approve/reject buttons - Direct API makes this straightforward

**When Agent SDK would be better** (deferred to post-MVP):
- Multi-step autonomous agent workflows (SDK handles orchestration)
- Complex permission rules across many tools (SDK PreToolUse hooks)
- Production-scale agent monitoring and observability (SDK built-in features)

**Consequences**:
- Must manually implement tool orchestration in AgentExecutionService (call tools, handle results, send back to Claude)
- Must implement approval waiting mechanism (SSE stream pauses, waits for user POST to /approve-tool-call endpoint, resumes)
- Must handle tool call timeouts (10-minute auto-reject per FR-048b)
- Can optionally add fine-grained tool streaming (`fine-grained-tool-streaming-2025-05-14` header) post-MVP for large file operations
- Agent SDK remains viable option for Phase 2+ when autonomous multi-step workflows become priority

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
  - Parallel domain queries (user preferences, semantic search, thread tree, memory chunks execute concurrently)
- **Async processing**:
  - Shadow domain generation is async (fire-and-forget API call) - UI shows "generating" state, updates via Realtime when complete
  - Thread summary regeneration is async (fire-and-forget API call) - optimistic update with summary from previous message
  - Fire-and-forget pattern: Main endpoint returns immediately, background jobs run via separate API calls (no await, log errors)
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
- **Data model** → See Domain Model section above, 9 entities including UserPreference for context rules
- **API contracts** → See API Surface section (20 endpoints including 5 background job endpoints), full OpenAPI specs in `/contracts/`
- **Service structure** → See Service Layer section - 8 services to implement (AgentExecution, ContextAssembly, SemanticSearch, UserPreferences, Provenance, ShadowDomain, ToolCall, Consolidation)
- **Multi-domain data gathering** → ContextAssemblyService orchestrates 6 domains: (1) Explicit context, (2) Shadow domain (via SemanticSearchService), (3) Thread tree, (4) Memory chunks, (5) User preferences (via UserPreferencesService - derived from interactions), (6) Knowledge graph (Phase 2+)
- **Integration patterns** → SSE streaming, Supabase Realtime subscriptions, fire-and-forget API calls for background jobs (no database triggers, no Redis)
- **Background job pattern** → Direct API calls after operation completes: POST /shadow-domain/sync, POST /threads/:id/summarize, POST /threads/:id/compress-memory, POST /user-preferences/recompute (fire-and-forget, don't await)
- **Key algorithms**:
  - Context assembly: Multi-domain gathering in parallel → Explicit (1.0) + Semantic (0.5 + modifiers) + User preferences (0.8) + Thread tree (0.7) → Prioritize by weight → Fit in 200K budget
  - Semantic search: Cosine similarity (shadow domain via pgvector) + relationship modifiers (+0.10 sibling, +0.15 parent/child) + temporal decay
  - Tree traversal: Recursive CTE starting from root, collect child artifacts, apply consolidation logic

**For /speckit.design**:
- **Screens to design**:
  - AI-Powered Exploration Workspace (single adaptive workspace at `/thread/:threadId`)
    - 3-panel layout: Left sidebar (Files/Threads tabs, 20%) + Center panel (Thread interface, 40-80%) + Right panel (File editor, 0-40%)
    - 9 flows within this screen: Send Message with Agent Streaming, Create Branch, Cross-Branch File Discovery, Consolidate from Multiple Branches, Switch Between Branches, Manage Context References, View File with Provenance, Approve Tool Call, Navigate Visual Tree (Phase 3)
- **Component hierarchy**:
  - Center Panel: ThreadView, MessageStream, Message, ThreadInput, ContextPanel, ContextSection, ContextReference, ToolCallApproval
  - Header: BranchSelector, BranchActions
  - Right Panel: FileEditorPanel, ProvenanceHeader
  - Modals: CreateBranchModal, ConsolidateModal
  - Sidebar: WorkspaceSidebar
  - Phase 3: TreeView, BranchNode, FileNode
- **Layout & Spatial Design**:
  - Adaptive 3-panel workspace (desktop 1440px+: 20% + 40-80% + 0-40%, mobile 375px: vertical stack)
  - Context panel positioned BELOW message stream, ABOVE input box (keeps context visible while typing)
  - Right panel slides in from right (desktop) or full-screen modal (mobile)
  - Thread-first UX: Thread interface always visible, file editing optional
- **Interaction Patterns**: Modal Workflow, Streaming Response Pattern, Approval Workflow, Context Management Pattern, Dropdown Navigation Pattern, Sliding Panel Pattern, Collapsible Section Pattern, Provenance Navigation Pattern, Graph Navigation Pattern (Phase 3)
- **Design considerations**:
  - Mobile-first responsive (375px → 1440px+)
  - Progressive disclosure (context complexity in collapsible sections with horizontal widget layout)
  - Provenance transparency (hover tooltips, clickable "Go to source" links)
  - Streaming feedback (loading indicators, incremental rendering, pause for approval)
  - Context panel shows 6 sections with tier colors (explicit/coral, frequently used/blue, semantic/purple, branch/orange, artifacts/green, excluded/gray)

**For /speckit.tasks**:
- **Frontend modules**:
  - Controllers: `apps/web/src/features/ai-agent-system/controllers/` (ChatController, FileEditorController, TreeViewController)
  - Views: `apps/web/src/features/ai-agent-system/views/` (ChatView, FileEditorView, TreeView)
  - State: `apps/web/src/lib/state/aiAgentState.ts` (Valtio store)
  - Hooks: `apps/web/src/lib/hooks/` (useStreamMessage, useCreateBranch, useSemanticSearch, etc.)
- **Backend services**: `apps/api/src/services/` (8 services listed in Service Layer section)
- **Edge Functions**: `apps/api/src/functions/` (execute-agent, approve-tool-call, create-branch, search-entities, consolidate-branches, etc.)
- **Repositories**: `apps/api/src/repositories/` (shadowEntity, conversation, file, contextReference, toolCall, memoryChunk, userPreferences)
- **Database migrations**: `apps/api/supabase/migrations/` (shadow_entities, conversations, files, context_references, agent_tool_calls, conversation_memory_chunks, user_preferences)
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
- [x] At least 2 key decisions documented with rationale (8 decisions covering shadow entities, SSE streaming, optimistic updates, context assembly, edit tracking, user preferences, memory chunking, Direct API over Agent SDK)

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

**Architecture Approved**: 2025-10-26

**Final Updates**:
- ✅ RESTful API endpoints (19 total: 15 CRUD + 4 background jobs)
- ✅ Context panel layout (below messages, above input)
- ✅ Renamed conversations/chats → threads
- ✅ Renamed shadow entities → shadow domain
- ✅ SemanticSearchService restored as separate reusable service (used by ContextAssemblyService, ConsolidationService, manual search)
- ✅ Multi-domain data gathering clarified: 6 domains (explicit, shadow domain, thread tree, memory, user preferences, knowledge graph)
- ✅ UserPreference entity added to domain model (always-include files, excluded patterns, custom prompts, context budget)
- ✅ Simplified background jobs: Direct API calls (fire-and-forget) instead of database triggers
- ✅ No Redis caching (MVP simplicity - direct database reads only)

**Architecture Summary**:
- **Entities**: 9 (ShadowDomainEntry, Thread, Message, ThreadMemoryChunk, File, ContextReference, AgentToolCall, UserPreference, KnowledgeGraphEdge)
- **Services**: 7 (AgentExecution, ContextAssembly, SemanticSearch, Provenance, ShadowDomain, ToolCall, Consolidation)
- **API Endpoints**: 19 RESTful endpoints
- **Data Sources**: 6 domains gathered in parallel during context assembly (<1s target)

**Next Steps**:
1. Review arch.md for accuracy and completeness (covers full-stack architecture: frontend + backend + data + integration)
2. Run `/speckit.plan` to generate technical implementation plan
   - Plan will use: Domain model, API contracts, service structure, integration patterns
3. Run `/speckit.design` to create UI/UX visual design
   - Design will use: Screen inventory, user flows, component hierarchy
4. `arch.md` is the single source of truth for feature architecture (frontend + backend + data + integration)

**Note**: Architecture bridges requirements (spec.md) and implementation (plan.md, design.md, tasks.md)
