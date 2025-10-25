# Implementation Plan: AI Agent Execution System

**Branch**: `004-ai-agent-system` | **Date**: 2025-10-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-ai-agent-system/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement a comprehensive AI agent system that enables natural language interaction with a filesystem-based knowledge management system. The system leverages **Claude Agent SDK** for built-in orchestration, web search, and automatic context management, with custom MCP tools for document operations. Core capabilities include: filesystem-aware chat with automatic context optimization (200k token window via SDK's compact mode), collaborative editing with approval flows, built-in web search (SDK), and real-time progress tracking. The system maintains context through shadow filesystem embeddings (OpenAI text-embedding-3-small + Supabase pgvector), chat direction tracking, and user preference profiling. **Architecture simplified significantly** - Claude Agent SDK eliminates need for custom orchestrator, intent classifier, context optimizer, and external web search API (~2000 lines of code saved).

## Technical Context

**Language/Version**: TypeScript 5.0+, Node.js 20+ (Edge Functions runtime), React 18+
**Primary Dependencies**:
- Frontend: Next.js 14 (Pages Router), React 18, Valtio (state), TailwindCSS 3.4+, TipTap editor, Radix UI
- Backend: Supabase (PostgreSQL 15+, Edge Functions, Auth, Storage, Realtime), Drizzle ORM, Zod validation
- AI: Claude Agent SDK (@anthropic-ai/agent-sdk) with built-in WebSearch, Claude 3.5 Sonnet, OpenAI Embeddings API (text-embedding-3-small 768-dim)
- Real-time: Supabase Realtime (WebSocket), Supabase subscriptions
- State Sync: Three-way merge (Git-style) for cross-device context reference synchronization (see [DECISIONS.md](./DECISIONS.md) Section 2)
- Tool Call Tracking: Unified `agent_interactions` table for all agent tool calls with conflict detection (see [DECISIONS.md](./DECISIONS.md) Section 6)
- Cost Tracking: Unified `usage_events` table for all billable operations (agent, storage, embeddings, bandwidth) (see [DECISIONS.md](./DECISIONS.md) Section 7)

**Storage**: PostgreSQL 15+ with pgvector extension (768-dim embeddings), Supabase Storage (file backup)

**Testing**: Deferred to post-MVP (focus on feature delivery first)

**Target Platform**: Web (desktop + mobile PWA), future native apps (architecture supports)

**Project Type**: Web application (monorepo: apps/web frontend, apps/api backend, apps/design-system sandbox)

**Performance Goals**:
- Agent responses: <10s end-to-end (including RAG retrieval)
- Semantic search: <1s for 1000-file repository (p95 <500ms)
- Shadow filesystem sync: <2s after file save
- Real-time updates: <100ms propagation
- Embedding generation: <5min for 1000 files (background)
- Context building: <500ms for standard queries

**Constraints**:
- 200,000 token context window (Claude 3.5 Sonnet) with 20% buffer (40k tokens reserved)
- Maximum 10 context pills per request
- 10MB per file upload limit
- Storage limits: Free (50MB), Pro (1GB), Enterprise (deferred)
- Request limits: Free (100/mo), Pro (1000/mo), Enterprise (10000/mo)
- Mobile-first UI with 44x44px minimum touch targets
- Fixed three-panel layout (desktop): 20% file tree, 50% editor, 30% chat (no resizing in MVP)

**Scale/Scope**:
- Target: 5,000 files per user repository (MVP)
- Edge case: 10,000+ files (deferred with selective context features)
- Concurrent chats: 500 sessions without degradation
- Average chat: 15 messages/week per active user
- Agent operations: 100 concurrent requests across all users

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Gate 1: Component Architecture Discipline (Principle I) ✅ PASS
- **Requirement**: All UI components MUST be pure presentational components with business logic in containers/services
- **Assessment**: Architecture separates concerns - chat UI components receive props/callbacks, business logic lives in custom hooks and service layer
- **Evidence**: Three-layer frontend (Service Layer → Custom Hooks → UI Components) aligns with principle

### Gate 2: Mobile-First Architecture (Principle II) ✅ PASS
- **Requirement**: All features MUST be designed mobile-first with PWA as MVP delivery
- **Assessment**: UI requirements explicitly define mobile-first responsive behavior, touch-optimized interactions (44x44px targets), mobile context selection patterns
- **Evidence**: Mobile acceptance scenarios (User Story 5), mobile-specific UI patterns (long-press, chat picker, pill scrolling)

### Gate 3: Persistent Knowledge Graph with RAG (Principle III) ✅ PASS
- **Requirement**: Document context MUST be global/persistent, vector embeddings for all chunks, RAG before every request
- **Assessment**: Shadow filesystem maintains embeddings for all files, semantic search retrieves context before agent requests, citation tracking via context pills
- **Evidence**: FR-001 to FR-007 define shadow filesystem, FR-037 defines semantic search, FR-023 defines context prioritization

### Gate 4: Managed Backend Stack (Principle IV) ✅ PASS
- **Requirement**: Supabase-first backend (PostgreSQL + pgvector, Supabase Auth, Storage, Realtime, Edge Functions, RLS)
- **Assessment**: Architecture uses Supabase for all backend services, RLS enforces security, Edge Functions handle agent execution
- **Evidence**: Technical Context specifies Supabase stack, FR-096 to FR-100 define security with RLS

### Gate 5: End-to-End Type Safety (Principle V) ✅ PASS
- **Requirement**: All code MUST be TypeScript, database types auto-generated, runtime validation with Zod
- **Assessment**: TypeScript specified throughout, Zod schemas for API validation, Drizzle ORM for type-safe queries
- **Evidence**: Technical Context lists TypeScript 5.0+, Zod validation, Drizzle ORM

### Gate 6: Live Collaboration Architecture (Principle VI) ✅ PASS
- **Requirement**: All data changes MUST propagate via Supabase Realtime, no polling
- **Assessment**: Real-time subscriptions for agent progress, file changes, chat updates; Valtio state updates automatically
- **Evidence**: FR-067 to FR-071 define real-time progress, FR-006b defines real-time pill updates, FR-071a defines cross-device sync

### Gate 7: MCP-Based Document Access (Principle VII) ✅ PASS
- **Requirement**: Claude Agent SDK MUST access documents via MCP tools (read_document, update_document, search_documents)
- **Assessment**: Research complete - database-first document access via custom MCP tools integrated with Claude Agent SDK
- **Evidence**: research.md Item 3 documents MCP tool implementation strategy with database-first reads (PostgreSQL) for speed, Storage backup for durability, aligns with Principle VII requirements

### Gate 8: Zero-Trust Data Access via RLS (Principle VIII) ✅ PASS
- **Requirement**: All tables MUST have RLS enabled, policies enforce auth.uid() = user_id, Edge Functions use ANON_KEY by default
- **Assessment**: Security requirements mandate RLS, input sanitization, auth verification
- **Evidence**: FR-096 to FR-100 define security model, audit logging, RLS enforcement

### Gate 9: MVP-First Discipline (Principle IX) ✅ PASS with IMPROVED SCOPE
- **Requirement**: Features MUST target minimal viable implementation, scope to deliver in days not weeks, defer abstractions
- **Assessment**: Spec defers many features to post-MVP (diff preview UI, overseer agent, git integration, advanced analytics). **Claude Agent SDK discovery significantly simplifies implementation** - eliminates ~2000 lines of custom code (orchestrator, intent classifier, context optimizer, web search integration).
- **Notes**:
  - **Architecture Simplification**: Claude Agent SDK replaces 4 custom services with built-in capabilities
  - **Reduced Scope**: No custom orchestrator, no external web search API, no manual context management
  - **Faster Delivery**: Focus on core features (MCP tools, RAG, UI) instead of infrastructure
  - Recommendation: Deliver P1 (Chat with Filesystem) first using SDK's built-in orchestration, then P2 (Collaborative Editing), iterate on P3-P5

### Gate 10: Monorepo Architecture (Principle X) ✅ PASS
- **Requirement**: Monorepo with packages/ui (pure UI), packages/shared (types/utils), apps/web, apps/design-system, apps/api
- **Assessment**: Project already uses this structure, new features fit within existing boundaries
- **Evidence**: Technical Context specifies monorepo structure, CLAUDE.md documents package boundaries

### Gate 11: Visual Design System (Principle XI) ⚠️ ACTION REQUIRED
- **Requirement**: All features MUST be visually designed in apps/design-system before implementation
- **Assessment**: Spec has detailed UI/UX requirements but NO design.md or design-checklist.md exists
- **Action Required**: Run `/speckit.design` AFTER Phase 1 to generate UI designs before implementation begins

### Gate 12: Defense-in-Depth Security (Principle XII) ✅ PASS
- **Requirement**: Layered security (frontend → Edge Functions → database → infrastructure), input validation at all layers
- **Assessment**: Security requirements define sanitization (FR-096), sensitive data detection (FR-097), audit logging (FR-098)
- **Evidence**: FR-096 to FR-100, FR-122 to FR-125 (observability), FR-126 to FR-128 (disaster recovery)

### Gate 13: Clean Code & Maintainability (Principle XIII) ✅ PASS
- **Requirement**: Self-documenting code, Single Responsibility, functions <50 lines, Rule of Three for abstractions
- **Assessment**: Architecture promotes reusability (repositories, services, middleware), clean separation of concerns
- **Evidence**: Three-layer backend (Principle XVII), service layer architecture (Principle XVI)

### Gate 14: RESTful API Design (Principle XIV) ✅ PASS
- **Requirement**: RESTful principles, resource-based URLs, correct HTTP methods/status codes, stateless design
- **Assessment**: Edge Functions will expose RESTful endpoints for agent operations (execute-agent, file operations)
- **Evidence**: FR-041 to FR-045 define request processing, validation, quota enforcement
- **Note**: Phase 1 MUST generate API contracts in /contracts/ with OpenAPI specs

### Gate 15: Principle of Least Privilege (Principle XV) ✅ PASS
- **Requirement**: Minimal permissions by default, Edge Functions use ANON_KEY, time-bounded access
- **Assessment**: Security model defaults to read-only (FR-007), write access requires approval (FR-101)
- **Evidence**: FR-101 to FR-108 define permission model, approval flows, access control

### Gate 16: Service Layer Architecture for Real-Time Apps (Principle XVI) ✅ PASS
- **Requirement**: Three-layer frontend (Service Layer → Custom Hooks → UI Components), Valtio + Realtime, NO React Query/SWR
- **Assessment**: Architecture explicitly forbids React Query/SWR, uses Valtio + Supabase Realtime, optimistic updates + real-time sync
- **Evidence**: Frontend architecture documented in CLAUDE.md, Principle XVI, three-layer pattern

### Gate 17: Backend Service Architecture (Principle XVII) ✅ PASS
- **Requirement**: Three-layer backend (Edge Functions → Services → Repositories), repository pattern for data access
- **Assessment**: Backend will use repositories for data access, services for business logic (RAG, context building, agent orchestration)
- **Evidence**: Monorepo structure defines apps/api/src/repositories, apps/api/src/services, apps/api/src/functions

### Summary of Gate Results
- **PASS**: 16/17 gates ✅
- **ACTION REQUIRED**: 1 gate
  1. Visual design in apps/design-system (Gate 11 - run /speckit.design after Phase 1 complete)
- **ARCHITECTURE NOTES**:
  - Claude Agent SDK discovery significantly simplified implementation (4 services eliminated, ~2000 lines saved)
  - Feature scope reduced from 169 requirements → ~120 after SDK simplification
  - Recommend phased delivery: P1 (Chat with Filesystem) → P2 (Collaborative Editing) → P3-P5 (Enhancements)

## Security Architecture

**Approach**: Edge Function-First (all AI operations via backend)

Based on security requirements (FR-096 to FR-100, FR-122 to FR-125), the following architecture decisions ensure defense-in-depth security:

### Core Security Principles

1. **Zero Direct AI Access**: Client NEVER calls AI APIs directly
   - ALL agent requests go through `POST /execute-agent` Edge Function
   - ALL context building happens server-side (RAG retrieval via pgvector)
   - AI API keys (OpenAI, Anthropic) stored in Supabase Secrets (server-only)

2. **Server-Generated Identifiers**: Edge Functions generate all IDs and sensitive fields
   - Agent request IDs: Generated by Edge Function (UUID v4)
   - Chat session IDs: Generated by Edge Function (UUID v4)
   - Context reference IDs: Generated by Edge Function (UUID v4)
   - Artifact IDs: Constructed by Edge Function with server-controlled structure

3. **JWT-Based user_id**: Edge Functions extract user_id from authenticated JWT
   - Client NEVER sends user_id in requests
   - Edge Functions set user_id from `auth.getUser()`
   - Database RLS verifies `auth.uid() = user_id` for all queries
   - MCP tools receive user_id from Edge Function context (not client)

4. **Edge Function Validation**: All security validation happens in Edge Functions
   - Input sanitization (FR-096): Escape special chars, validate JSON structure
   - Sensitive data detection (FR-097): Scan prompts/context for API keys, passwords, tokens
   - Request quota enforcement (FR-041, FR-044): Check `user_profiles.requests_remaining`
   - Context limit validation: Max 10 context pills per request (FR-023a)
   - Approval requirement check (FR-101): Verify user approval for write operations

5. **Defense in Depth**:
   - **Layer 1 (Frontend)**: UX-only validation (instant feedback, no security)
   - **Layer 2 (Edge Functions)**: PRIMARY security boundary (validation, authentication, authorization)
   - **Layer 3 (Database)**: Integrity constraints (RLS for reads, FK cascade, UNIQUE constraints)
   - **Layer 4 (AI Provider)**: Rate limits, content filtering (external to our system)

### Edge Function Responsibilities (RESTful API)

**Unified Message & Agent Flow** (sending message = executing agent):

- `POST /chat-sessions`: Create new chat → extract user_id from JWT → return chat session

- `POST /chats/:chat_id/messages`: **UNIFIED ENDPOINT** - sending message IS executing agent
  1. Validate input → **check request quota** → **scan for sensitive data** → extract user_id from JWT + chat_id from URL
  2. Create `chat_messages` record (user message with role: 'user')
  3. Validate **all referenced files/folders exist** (RLS check) → parse @mentions (additional context)
  4. **Persist context_references to database**:
     - UPSERT to `context_references` table (one record per reference)
     - Set `is_active = true` for all references in request
     - Set `chat_id` from URL, `user_id` from JWT
     - Broadcast to Realtime → triggers three-way merge on other devices
  5. Create linked `agent_requests` record (status: 'pending') with **context_references_snapshot** (audit trail)
  6. Build context via RAG from message's context_references
  7. Call Claude Agent SDK → **stream tool calls via SSE** (also write to `agent_interactions` immediately)
  8. **Track usage** → store results → update request status to 'completed'
  9. Create `chat_messages` record (agent response with role: 'agent', links to agent_request_id)
  10. Broadcast final message + request status via Realtime
  11. Return: `{ message_id, request_id, sse_endpoint: '/agent-requests/:id/stream' }`

**Agent Request Management** (readonly/control operations):

- `GET /agent-requests/:id/stream`: **SSE endpoint** - streams ongoing request progress (tool calls, status updates)
  - If request is ongoing: Stream live events
  - If request is completed: Replay events from `agent_interactions` table
  - Used by: Primary session (lowest latency) and secondary sessions (same data structure)

- `GET /agent-requests/:id`: Verify ownership → fetch request with full details → return with sanitized output

- `PATCH /agent-requests/:id`: Validate **status is 'pending' or 'awaiting_approval'** (reject if 'completed', 'failed', 'cancelled') → verify ownership → update approval_status → trigger request continuation or cancellation

- `POST /agent-requests/:id/cancel`: Validate **status is 'pending' or 'in_progress'** → verify ownership → set status to 'cancelled' → stop SDK execution → close SSE streams

**Cross-Session Visibility** (multiple tabs/devices see same ongoing request):

**Pattern**: Hybrid SSE + Realtime
- **Primary session** (where message was sent): Subscribes to `/agent-requests/:id/stream` SSE endpoint (lowest latency)
- **Secondary sessions** (other tabs/devices with same chat open): Subscribe to `agent_interactions` table via Supabase Realtime
- **Edge Function writes to both**: For each tool call → (1) stream via SSE AND (2) INSERT into `agent_interactions` table (triggers Realtime broadcast)
- **Result**: All sessions see the same progress in the same data structure, with minimal latency

**Why this architecture:**
- Sending message = executing agent (unified flow, single endpoint)
- RESTful resource nesting (`/chats/:chat_id/messages` follows REST conventions)
- Context pills are **local draft state** until message sent, then persisted to database
- Context persistence enables cross-device sync (via three-way merge on Realtime updates)
- Primary session gets SSE (lowest latency)
- Secondary sessions get Realtime (reuses existing WebSocket, consistent experience)
- All events persisted to database (enables replay when user returns to chat)

**MCP Tool Security** (called by Claude Agent SDK within Edge Function):
- `read_document(file_path, user_id)`: **RLS enforced** - reads from `documents` table WHERE `user_id = auth.uid()` (from 003)
- `update_document(file_path, content, user_id)`: **Approval required** (FR-101) - checks `agent_requests.approval_status = 'approved'` before write
- `create_document(file_path, content, user_id)`: **Storage quota check** - validates `user_profiles.storage_used_bytes + file_size <= storage_limit_bytes` (from 003)
- `search_documents(query, user_id)`: **RLS enforced** - semantic search via `document_chunks` WHERE `user_id = auth.uid()` (from 003)

**Approval Flow Enforcement** (inline in chat, not modal):
- Agent requests write operation (create_document, update_document)
- MCP tool checks `agent_requests.approval_status`:
  - If `null` or `awaiting_approval` → Store proposed change in `agent_interactions` table → Set status to 'awaiting_approval' → **Realtime broadcast triggers inline approval card** (below messages, above input)
  - If `approved` → Execute write → Set `documents.last_edit_by = 'agent'` (from 003) → Log interaction → **Realtime broadcast shows success**
  - If `rejected` → Return "operation rejected" error → **Realtime broadcast shows rejection**
- Frontend displays inline ApprovalCard in chat content via Supabase Realtime subscription
- User approves/rejects via `PATCH /agent-requests/:id { approval_status }` (only allowed if status is 'pending' or 'awaiting_approval')
- Send button becomes Stop button when request.status is 'in_progress'

**Progress Streaming** (visible tool calls via hybrid SSE + Realtime):
- `POST /chat-messages` returns: `{ message_id, request_id, sse_endpoint: '/agent-requests/:id/stream' }`
- **Primary session** (sender): Subscribes to SSE endpoint `/agent-requests/:id/stream`
- **Secondary sessions** (other tabs/devices): Subscribe to `agent_interactions` WHERE `request_id` via Realtime
- **Edge Function writes to both simultaneously**:
  - Stream SSE event: `{ type: 'tool_call', toolName, status, description, targetFile }`
  - INSERT into `agent_interactions` table (triggers Realtime broadcast to secondary sessions)
- **All sessions** see tool calls inline in ChatMessage: "Reading /projects/spec.md...", "Searching web for React patterns...", "Creating /drafts/summary.md..."
- **Replay support**: If user returns to chat later, GET `/agent-requests/:id/stream` replays events from `agent_interactions` table
- **Rationale**: Primary session gets lowest latency (SSE), secondary sessions get same data structure (Realtime), all events persisted for replay

### Security Audit Status

All critical security requirements from spec.md addressed:

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| FR-096: Input sanitization | ✅ PLANNED | Edge Functions validate/escape all inputs before processing |
| FR-097: Sensitive data detection | ✅ PLANNED | Scan prompts for API keys/passwords before AI submission |
| FR-098: Audit logging | ✅ PLANNED | `audit_log_entries` table tracks all agent operations |
| FR-099: RLS enforcement | ✅ PLANNED | All tables have RLS policies enforcing `auth.uid() = user_id` |
| FR-100: Auth verification | ✅ PLANNED | Edge Functions use `auth.getUser()` to verify JWT |
| FR-101-108: Approval flows | ✅ PLANNED | MCP tools check `approval_status` before write operations |
| FR-122-125: Observability | ✅ PLANNED | `agent_interactions`, `usage_events`, `audit_log_entries` tables |

## Project Structure

### Documentation (this feature)

```
specs/004-ai-agent-system/
├── spec.md              # ✅ COMPLETE - Feature specification (2025-10-24)
├── plan.md              # ✅ COMPLETE - This file (/speckit.plan command output)
├── research.md          # ✅ COMPLETE - Phase 0 output (6 research items resolved)
├── data-model.md        # ✅ COMPLETE - Phase 1 output (11 tables with full schema + RLS)
├── quickstart.md        # ✅ COMPLETE - Phase 1 output (9-step implementation guide)
├── contracts/           # ✅ COMPLETE - Phase 1 output (API contracts consolidated)
│   └── execute-agent.yaml  # OpenAPI spec with embedded MCP tool contracts
├── DECISIONS.md         # ✅ COMPLETE - 7 architectural decisions documented
└── tasks.md             # ⏳ PENDING - Phase 2 output (run /speckit.tasks to generate)
```

### Source Code (repository root)

```
# Web application structure (monorepo with npm workspaces)

packages/
├── ui/                              # Pure presentational UI components (SOURCE OF TRUTH)
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/               # NEW: Chat interface components
│   │   │   │   ├── ChatMessage.tsx
│   │   │   │   ├── ChatInput.tsx
│   │   │   │   ├── TypingIndicator.tsx
│   │   │   │   └── index.ts
│   │   │   ├── context/            # NEW: Context reference components
│   │   │   │   ├── ContextReference.tsx
│   │   │   │   ├── ContextReferenceBar.tsx
│   │   │   │   └── index.ts
│   │   │   ├── agent/              # NEW: Agent-specific UI components
│   │   │   │   ├── ApprovalPrompt.tsx
│   │   │   │   ├── FileChangePreview.tsx
│   │   │   │   ├── ConflictModal.tsx
│   │   │   │   └── index.ts
│   │   │   └── index.ts            # Export all components
│   │   └── index.ts
│   └── package.json                # Isolated from server deps
│
└── shared/                          # Shared types, utilities, schemas
    ├── src/
    │   ├── types/
    │   │   ├── agent.ts            # NEW: Agent request/response types
    │   │   ├── chat.ts             # NEW: Chat session, message types
    │   │   ├── context.ts          # NEW: Context reference, shadow filesystem types
    │   │   └── index.ts
    │   ├── schemas/
    │   │   ├── agent.ts            # NEW: Zod schemas for agent operations
    │   │   ├── chat.ts             # NEW: Zod schemas for chat operations
    │   │   └── index.ts
    │   └── utils/
    │       ├── context-optimizer.ts # NEW: Context summarization utilities
    │       └── index.ts
    └── package.json

apps/
├── web/                             # Main Next.js frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── agents/             # NEW: Smart agent components (data fetching + logic)
│   │   │   │   ├── AgentInterface.tsx
│   │   │   │   ├── ChatContainer.tsx
│   │   │   │   └── ContextManager.tsx
│   │   │   ├── chat/               # NEW: Smart chat components
│   │   │   │   ├── ChatList.tsx
│   │   │   │   ├── ChatPicker.tsx
│   │   │   │   └── ChatSessionManager.tsx
│   │   │   └── providers/
│   │   │       ├── ChatProvider.tsx # NEW: Real-time chat subscriptions
│   │   │       └── AgentProvider.tsx # NEW: Agent request state management
│   │   ├── lib/
│   │   │   ├── hooks/
│   │   │   │   ├── useAgentRequest.ts # NEW: Agent request hook (loading/error/optimistic)
│   │   │   │   ├── useChatSession.ts  # NEW: Chat session management
│   │   │   │   └── useContextReferences.ts # NEW: Context reference management
│   │   │   ├── services/
│   │   │   │   ├── agentService.ts    # NEW: Pure API calls to Edge Functions
│   │   │   │   ├── chatService.ts     # NEW: Chat operations
│   │   │   │   └── contextService.ts  # NEW: Context management
│   │   │   └── state/
│   │   │       ├── agentState.ts      # NEW: Valtio agent state
│   │   │       └── chatState.ts       # NEW: Valtio chat state
│   │   └── pages/
│   │       └── dashboard.tsx         # Main dashboard with three-panel layout
│   └── package.json
│
├── design-system/                   # Design iteration sandbox
│   ├── components/
│   │   ├── AgentInterface.tsx       # NEW: Design prototype for agent UI
│   │   ├── ChatInterface.tsx        # NEW: Design prototype for chat UI
│   │   └── ContextReferences.tsx    # NEW: Design prototype for context references
│   └── pages/
│       └── index.tsx                # Showcase for design iteration
│
└── api/                             # Self-contained backend application
    ├── src/
    │   ├── repositories/            # NEW: Data access layer
    │   │   ├── agentRepository.ts   # Agent request queries
    │   │   ├── agentInteractionsRepository.ts # Tool call tracking (NEW)
    │   │   ├── chatRepository.ts    # Chat session queries
    │   │   ├── contextRepository.ts # Shadow filesystem queries
    │   │   ├── embeddingRepository.ts # Vector search queries
    │   │   └── usageEventsRepository.ts # Unified usage/cost tracking (NEW)
    │   ├── services/                # NEW: Business logic
    │   │   ├── agentService.ts      # Main agent execution (Claude Agent SDK)
    │   │   ├── ragService.ts        # RAG context retrieval from pgvector
    │   │   ├── embeddingService.ts  # Embedding generation (OpenAI API)
    │   │   ├── mcpTools.ts          # Custom MCP tools (read/update/search/create documents)
    │   │   ├── contextBuilder.ts    # Build context from pills + chat history
    │   │   └── conflictDetectionService.ts # Detect concurrent file modifications (NEW)
    │   ├── middleware/               # Reusable middleware
    │   │   ├── auth.ts              # Auth verification
    │   │   ├── validation.ts        # Zod validation middleware
    │   │   └── errorHandler.ts      # Error formatting
    │   ├── functions/               # Supabase Edge Functions (SINGLE SOURCE OF TRUTH)
    │   │   ├── execute-agent/
    │   │   │   └── index.ts         # NEW: Main agent execution endpoint
    │   │   ├── generate-embedding/
    │   │   │   └── index.ts         # NEW: Async embedding generation
    │   │   ├── search-context/
    │   │   │   └── index.ts         # NEW: Semantic search endpoint
    │   │   └── file-operations/
    │   │       └── index.ts         # NEW: File create/update/delete
    │   ├── db/
    │   │   └── schema.ts            # NEW: Drizzle schema (agent_requests, chat_sessions, shadow_filesystem, etc.)
    │   └── lib/
    │       └── supabase.ts          # Supabase client config
    └── supabase/
        ├── config.toml              # Edge Function declarations with custom entrypoints
        └── migrations/              # Database migrations (deferred post-MVP, using db:push for now)
```

**Structure Decision**: Web application monorepo with three-layer frontend (Service Layer → Custom Hooks → UI Components) and three-layer backend (Edge Functions → Services → Repositories). All server logic self-contained in `apps/api` with business logic (`services/`), data access (`repositories/`), and Edge Functions (`functions/`) co-located. UI components in `packages/ui` are pure presentational with zero server dependencies. Smart components in `apps/web` handle data fetching, state management, and real-time subscriptions. Design iteration happens in `apps/design-system` before implementation in `apps/web`.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

**Status**: No complexity violations detected. All gates passed or identified for research (Gates 7, 11).

**Notes**:
- Feature scope is large (169 functional requirements) but no architectural violations
- Recommendation for phased delivery (P1 → P2 → P3-P5) to maintain MVP-first discipline
- No premature abstractions introduced - three-layer architecture is established pattern from Constitution

## Component Architecture

### 1. Screen Inventory

List all screens/views from spec.md user stories:

| Screen | Route | User Story | Purpose |
|--------|-------|------------|---------|
| **Workspace** | `/workspace?chatId=uuid` | US-001, US-002, US-004 | Main three-panel interface: file tree (20%), editor (50%), **chat (30%)** - right panel shows selected chat |
| **Workspace (No Chat)** | `/workspace` (no chatId) | US-005 | Same workspace - **right panel shows chat list** when no chat selected (ordered by last updated) |
| **Conflict Resolution Modal** | N/A (overlay) | US-002 (FR-007c) | Choose between canceling agent request or discarding user changes when conflicts occur |
| **Context Detail Sheet** | N/A (bottom sheet) | US-005 | Mobile-only bottom sheet for previewing context pill content |

**Key UX Patterns**:
- Approval prompts and agent progress are **inline chat elements** (not modals)
- Chat picker is a **dropdown in panel header** (not modal)
- **Right panel (30%) is dynamic**: Shows chat list OR active chat (same workspace page, controlled by `?chatId` param)
- Agent messages **consolidate text + tool calls + citations** in one message component (like Cursor/Claude Code)

### 2. Component Hierarchy (Per Screen)

For each screen, define component tree (indent = nesting):

**Workspace** (`/workspace?chatId=uuid` OR `/workspace` - same page, dynamic right panel):
```
WorkspaceLayout (container: apps/web/src/components/layout/)
├─ FileTreeContainer (container: apps/web/src/components/filesystem/)
│  └─ FileTree (presenter: packages/ui/src/components/file-tree.tsx)
│     ├─ FileTreeNode (presenter: packages/ui - recursive)
│     └─ IndexingIndicator (presenter: packages/ui/src/components/)
├─ DocumentEditorContainer (container: apps/web/src/components/documents/)
│  └─ MarkdownEditor (presenter: packages/ui/src/components/markdown-editor.tsx)
│     └─ TipTapExtensions (presenter: packages/ui - TipTap plugins)
└─ ChatContainer (container: apps/web/src/components/agents/)
   ├─ ChatPanelHeader (presenter: packages/ui/src/components/chat/)
   │  └─ ChatDropdown (presenter: packages/ui - shadcn DropdownMenu)
   │     └─ ChatList (presenter: packages/ui/src/features/)
   │        └─ ChatCard (presenter: packages/ui/src/features/)
   │
   └─ [CONDITIONAL RENDERING based on chatId]:
      │
      ├─ [IF chatId exists] ChatView:
      │  ├─ ContextReferenceBar (presenter: packages/ui/src/components/context/)
      │  │  └─ ContextReference (presenter: packages/ui/src/components/context/)
      │  ├─ ChatMessageList (presenter: packages/ui/src/features/)
      │  │  └─ ChatMessage (presenter: packages/ui/src/components/chat/)
      │  │     ├─ MessageContent (presenter: packages/ui)
      │  │     │  ├─ MarkdownText (presenter: packages/ui - message text)
      │  │     │  ├─ ToolCallSection (presenter: packages/ui - INLINE tool calls)
      │  │     │  │  └─ ToolCallItem (presenter: packages/ui - "Reading X...", "Searching Y...")
      │  │     │  └─ CitationSection (presenter: packages/ui - INLINE citations)
      │  │     │     └─ CitationItem (presenter: packages/ui - web search results)
      │  │     └─ MessageMetadata (presenter: packages/ui - timestamp, status)
      │  ├─ ApprovalCard (presenter: packages/ui/src/components/agent/) [INLINE - shown when request.status = 'awaiting_approval']
      │  │  ├─ FileChangePreview (presenter: packages/ui/src/components/agent/)
      │  │  │  └─ FileMetadata (presenter: packages/ui - file path, size, timestamp)
      │  │  └─ Button (presenter: packages/ui - "Approve", "Reject")
      │  ├─ TypingIndicator (presenter: packages/ui/src/components/chat/)
      │  └─ ChatInput (presenter: packages/ui/src/components/chat/)
      │     ├─ FileAutocomplete (presenter: packages/ui/src/components/)
      │     └─ SendButton / StopButton (presenter: packages/ui - toggles based on request.status)
      │
      └─ [IF chatId is null] ChatListView:
         └─ ChatListPanel (presenter: packages/ui/src/features/)
            ├─ NewChatButton (presenter: packages/ui - "+ New Chat")
            └─ ChatList (presenter: packages/ui/src/features/)
               └─ ChatCard (presenter: packages/ui/src/features/)
                  ├─ ChatTitle (presenter: packages/ui)
                  ├─ LastMessage (presenter: packages/ui - preview)
                  └─ Timestamp (presenter: packages/ui)
```

**Key Pattern**: ChatContainer handles both views (chat list OR active chat) - same component, conditional rendering based on URL param `?chatId`

**Conflict Resolution Modal**:
```
ConflictModalContainer (container: apps/web/src/components/agents/)
└─ ConflictModal (presenter: packages/ui/src/components/agent/)
   ├─ Alert (presenter: packages/ui/src/components/ - shadcn)
   └─ Button (presenter: packages/ui - "Cancel Request", "Discard Changes")
```

**Context Detail Sheet** (Mobile):
```
ContextDetailContainer (container: apps/web/src/components/agents/)
└─ Sheet (presenter: packages/ui/src/components/ - shadcn bottom sheet)
   ├─ ContextReference (presenter: packages/ui - reused from bar)
   └─ MarkdownContent (presenter: packages/ui - snippet preview)
```

**Legend**:
- `(container)` = Smart component with business logic → `apps/web/src/components/[feature]/`
- `(presenter)` = Pure UI component → `packages/ui/src/components/` or `packages/ui/src/features/[feature]/`

### 3. Container/Presenter Mapping

**Containers** (business logic, data fetching, state):

| Container | Location | Responsibilities |
|-----------|----------|------------------|
| `WorkspaceLayout` | `apps/web/src/components/layout/` | Manages three-panel layout state, responsive breakpoints, real-time subscriptions for file changes |
| `FileTreeContainer` | `apps/web/src/components/filesystem/` | Fetches folder hierarchy, handles CRUD operations (via FileSystemProvider), syncs real-time file tree updates |
| `DocumentEditorContainer` | `apps/web/src/components/documents/` | Fetches document content, handles auto-save (3s debounce), detects conflicts with agent operations |
| `ChatContainer` | `apps/web/src/components/agents/` | Manages chat session state (or chat list when no chat selected), sends agent requests, **subscribes to real-time progress/tool calls**, handles context pills, **shows inline approval prompts**, validates approval actions (only ongoing requests) |
| `ConflictModalContainer` | `apps/web/src/components/agents/` | Detects concurrent modifications (user vs agent), manages conflict resolution flow, updates agent request status |
| `ContextDetailContainer` | `apps/web/src/components/agents/` | Fetches full context pill content (mobile only), handles navigation to source file/folder |

**Presenters** (UI only, props in → JSX out):

| Component | Location | Props Interface | Reusability |
|-----------|----------|-----------------|-------------|
| `FileTree` | `packages/ui/src/components/` | `{ nodes: FileSystemNode[], onSelect, onContextMenu, ... }` | Cross-feature (used in file picker, context selector) |
| `MarkdownEditor` | `packages/ui/src/components/` | `{ content, onChange, onSave, editable, ... }` | Cross-feature (used in editor, preview, chat messages) |
| `ChatMessage` | `packages/ui/src/components/chat/` | `{ message: Message, isUser, ... }` | **Consolidated component** - renders text + tool calls + citations in one message (like Cursor/Claude Code) |
| `MessageContent` | `packages/ui/src/components/chat/` | `{ text, toolCalls, citations, ... }` | Child of ChatMessage - handles layout of content sections |
| `ToolCallSection` | `packages/ui/src/components/agent/` | `{ toolCalls: ToolCall[], ... }` | Inline section within ChatMessage showing agent actions |
| `ToolCallItem` | `packages/ui/src/components/agent/` | `{ toolName, status, description, targetFile, ... }` | Individual tool call display ("Reading X...", "Searching Y...") |
| `CitationSection` | `packages/ui/src/components/agent/` | `{ citations: Citation[], ... }` | Inline section within ChatMessage showing web search results |
| `CitationItem` | `packages/ui/src/components/agent/` | `{ url, title, snippet, ... }` | Individual citation display (web search result) |
| `ChatInput` | `packages/ui/src/components/chat/` | `{ value, onChange, onSubmit, isRequestActive, ... }` | Feature-specific (chat only, send/stop button toggle) |
| `ContextReference` | `packages/ui/src/components/context/` | `{ reference: ContextRef, onRemove, onClick, ... }` | Feature-specific (context pills) |
| `ApprovalCard` | `packages/ui/src/components/agent/` | `{ changes: FileChange[], onApprove, onReject, isOngoing, ... }` | Feature-specific (inline approval, shown when awaiting_approval) |
| `FileChangePreview` | `packages/ui/src/components/agent/` | `{ filePath, action, metadata, ... }` | Feature-specific (approval prompts) |
| `ConflictModal` | `packages/ui/src/components/agent/` | `{ isOpen, conflictFiles, onCancel, onDiscard, ... }` | Feature-specific (conflict resolution) |
| `ChatDropdown` | `packages/ui/src/components/chat/` | `{ chats: Chat[], activeChatId, onSelect, ... }` | Feature-specific (chat switching dropdown) |
| `ChatListPanel` | `packages/ui/src/features/` | `{ chats: Chat[], onSelect, onNewChat, ... }` | Feature-specific (full chat list when no chat selected) |
| `ChatCard` | `packages/ui/src/features/` | `{ chat: Chat, isActive, onClick, ... }` | Feature-specific (chat preview in list/dropdown) |

**Pattern**: Container/Presenter (Smart/Dumb) - Containers in apps/web, presenters in packages/ui

### 4. State Management Strategy

**Global State** (Valtio):

| State Slice | Location | Contains | Updated By |
|-------------|----------|----------|------------|
| `chatState` | `apps/web/src/lib/state/chatState.ts` | `{ activeChatId: uuid \| null, sessions: Record<id, ChatSession>, allChats: Chat[], draftContextReferences: Record<chatId, ContextRef[]> }` | ChatProvider (real-time), local updates for draft context |
| `agentState` | `apps/web/src/lib/state/agentState.ts` | `{ activeRequestId, requests: Record<id, AgentRequest>, toolCalls: ToolCall[], streamingProgress, awaitingApproval }` | AgentProvider (SSE stream + real-time), agentService (optimistic) |
| `fileSystemState` | `apps/web/src/lib/state/filesystem.ts` | `{ nodes: FileSystemNode[], selectedId, indexingStatus: Record<id, status> }` | FileSystemProvider (real-time), documentService (optimistic) |
| `editorState` | `apps/web/src/lib/state/editor.ts` | `{ openDocumentId, unsavedChanges, lastSaveTime, editLockOwner }` | DocumentEditorContainer (local), real-time sync (remote) |

**Component State** (React useState/useReducer):

| Component | State | Scope | Why Local |
|-----------|-------|-------|-----------|
| `ChatInput` | `draftMessage, isSending` | Component only | Typing performance + send/stop button toggle |
| `FileAutocomplete` | `filteredFiles, selectedIndex` | Component only | UI state for autocomplete dropdown, not persisted |
| `ApprovalCard` | `expandedFiles` | Component only | UI state for which file diffs are expanded, not persisted |
| `ContextReferenceBar` | `scrollPosition` | Component only | UI state for horizontal scroll, not persisted |
| `MarkdownEditor` | `cursorPosition, selection` | Component only | Transient editor state, not persisted |
| `ChatDropdown` | `isOpen` | Component only | Dropdown open/close state, not persisted |

**URL State** (Router params/query):

| Param | Location | Synced With |
|-------|----------|-------------|
| `chatId` | `/workspace?chatId=uuid` | `chatState.activeChatId` (null = chat list view in right panel) |
| `documentId` | `/workspace?documentId=uuid` | `editorState.openDocumentId` |

**State Update Patterns**:
- **Real-time (Supabase)**: Database subscriptions → Global state (Valtio) → Component re-renders (useSnapshot)
- **Agent Progress Updates (SSE)**: Edge Function streams tool calls via Server-Sent Events → Client receives events in real-time → Update `agentState.toolCalls` → UI shows inline progress → Events also written to `agent_interactions` table for replay
  - Rationale: Lower latency (no database write latency), industry standard for LLM streaming, immediate feedback
  - Implementation: `POST /execute-agent` returns SSE stream, client subscribes with EventSource API

- **Optimistic**: User action → Update global state (Valtio) → Service call (Edge Function) → On error: rollback + toast | On success: replace temp data + toast
- **Debounced**: Typing in ChatInput → Local state → (300ms debounce) → No service call (just UI)
- **Debounced + Save**: Typing in MarkdownEditor → Local state → (3s debounce) → Service call (auto-save)
- **Approval Validation**: User clicks approve/reject → Validate `request.status IN ('pending', 'awaiting_approval')` → If valid: API call | If invalid: show error toast

### 5. Data Flow Architecture

**Props Down (Parent → Child)**:

```
ChatContainer (apps/web)
  ├─ Fetches: agentService.executeAgent()
  ├─ Reads: chatState (Valtio useSnapshot)
  ├─ Maps: { messages, activeChatId, contextReferences } → props
  └→ ChatMessageList({ messages })
      ├─ Transforms: messages → chronological order
      └→ ChatMessage({ message, isUser, citations })
          ├─ Renders: message content, timestamp, author
          └→ WebSearchCitation({ url, title, snippet })
```

**Callbacks Up (Child → Parent)**:

```
ChatMessage (packages/ui)
  ├─ User clicks citation link
  └→ calls: onCitationClick(url) ↑
      └→ ChatMessageList (packages/ui)
          └→ bubbles: onCitationClick(url) ↑
              └→ ChatContainer (apps/web)
                  ├─ Tracks: Analytics event (citation clicked)
                  └─ Opens: External URL in new tab
```

**Context Pills Flow (local draft state until message sent)**:

```
ChatContainer (apps/web)
  ├─ Reads: chatState.draftContextReferences[chatId] (LOCAL state - array of IDs)
  ├─ Lookups: contextReferences.map(id => contextsById[id]) → objects
  ├─ Maps: objects → { type, sourcePath, displayName } → props
  └→ ContextReferenceBar({ references })
      └─ ContextReference({ reference, onRemove })
          ├─ User clicks X button (remove pill)
          └→ calls: onRemove(referenceId) ↑ (ID not object)
              └→ ChatContainer
                  └─ Updates: chatState.draftContextReferences[chatId] (LOCAL only, no API call)

  Adding pills:
  ├─ User types @filename → FileAutocomplete → Select file
  ├─ User right-clicks file → "Add to chat"
  └─ User drags file onto chat panel
      └→ All trigger: chatState.draftContextReferences[chatId].push(newRef) (LOCAL only)

  Sending message (context persisted here):
  └→ User clicks Send
      └→ ChatContainer.onSendMessage()
          ├─ Reads: chatState.draftContextReferences[chatId]
          └─ Service: chatService.sendMessage(chatId, text, draftContextReferences)
              └─ Edge Function: POST /chats/:chat_id/messages { text, context_references: [...] }
                  ├─ Validates: All referenced files/folders exist (RLS)
                  ├─ Creates: User chat_messages record
                  ├─ Persists: UPSERT to context_references table (is_active = true for all refs)
                  ├─ Stores: agent_requests.context_references_snapshot (audit trail)
                  ├─ Broadcast: context_references via Realtime → Other devices trigger three-way merge
                  └─ Returns: { message_id, request_id, sse_endpoint }

  Benefits:
  - No server calls until message sent (instant local UI updates)
  - Context pills are "draft" state (like typing a message)
  - Database persistence on send enables cross-device sync
  - Three-way merge handles concurrent changes from multiple devices
  - Simpler backend (no PATCH endpoint)
  - Context always tied to a message, not floating state
  - Audit trail in agent_requests.context_references_snapshot
```

**Inline Approval Flow (shown in chat content, not modal)**:

```
ChatContainer (apps/web)
  ├─ Reads: agentState.requests[activeRequestId]
  ├─ Checks: request.status === 'awaiting_approval'
  ├─ Fetches: agent_interactions WHERE request_id (proposed changes)
  ├─ Maps: { changes, requestId, isOngoing } → props
  └→ ApprovalCard({ changes, onApprove, onReject, isOngoing })
      ├─ Positioned: Below messages, above ChatInput and pills
      ├─ User clicks "Approve"
      └→ calls: onApprove(requestId) ↑
          └→ ChatContainer
              ├─ Validates: request.status IN ('pending', 'awaiting_approval') (not 'completed')
              ├─ If invalid: Show toast "Cannot approve completed request"
              ├─ If valid: agentService.approveRequest(requestId)
              │   └─ Edge Function: PATCH /agent-requests/:id { approval_status: 'approved' }
              │       └─ Triggers: MCP tool execution → file write → stream success
              └─ Real-time: Request status updates via Supabase subscription
```

**Unified Message Send & Progress Flow** (cross-session visibility):

```
ChatContainer (apps/web)
  ├─ User sends message: ChatContainer.onSendMessage()
  │   ├─ Reads: chatState.draftContextReferences[chatId]
  │   └─ Service: chatService.sendMessage(chatId, text, draftContextReferences)
  │       └─ Edge Function: POST /chats/:chat_id/messages { text, context_references: [...] }
  │           ├─ Creates user chat_messages record (role: 'user')
  │           ├─ Persists context_references to database (UPSERT, is_active = true)
  │           ├─ Creates agent_requests record with context_references_snapshot
  │           ├─ Starts agent execution (Claude Agent SDK)
  │           └─ Returns: { message_id, request_id, sse_endpoint: '/agent-requests/:id/stream' }
  │
  ├─ PRIMARY SESSION (where message was sent):
  │   └─ Creates EventSource: new EventSource('/agent-requests/:id/stream')
  │       └─ Edge Function streams SSE events (lowest latency):
  │           └─ Event: { type: 'tool_call', toolName, status, description, targetFile }
  │       └─ Also writes to agent_interactions table simultaneously
  │
  ├─ SECONDARY SESSIONS (other tabs/devices with same chat open):
  │   └─ Subscribes: Supabase Realtime on agent_interactions WHERE request_id
  │       └─ Receives same events via Realtime WebSocket
  │       └─ Updates agentState.toolCalls (same data structure as primary session)
  │
  └→ ALL SESSIONS render ChatMessage the same way:
      └→ MessageContent displays:
          ├─ MarkdownText (agent's response text)
          ├─ ToolCallSection (inline tool calls):
          │   └─ ToolCallItem displays:
          │       - "Reading /projects/spec.md..." (status: in_progress)
          │       - "Searching web for React patterns..." (status: in_progress)
          │       - "Creating /drafts/summary.md..." (status: awaiting_approval)
          └─ CitationSection (inline citations if web search used)

  Send Button toggles to Stop Button (all sessions):
  ├─ ChatInput receives: isRequestActive (from agentState.activeRequestId !== null)
  ├─ If true: Shows "Stop" button
  └─ User clicks Stop → ChatContainer.onCancelRequest(requestId)
      ├─ Closes EventSource connection (if primary session)
      └─ Service: agentService.cancelRequest(requestId)
          └─ Edge Function: POST /agent-requests/:id/cancel
              └─ Validates: status IN ('pending', 'in_progress')
              └─ Sets status to 'cancelled' → Broadcasts to all sessions → Stop button disappears

  Benefits of hybrid SSE + Realtime:
  - Unified flow: Sending message = executing agent (one operation)
  - Primary session: Lowest latency via SSE
  - Secondary sessions: Same data structure via Realtime
  - Cross-device consistency: All sessions see identical progress
  - Replay support: Can retrieve past events from agent_interactions table
```

**Critical Rules**:
- **IDs flow** (not objects) - Prevents stale data when objects update via real-time
- **Lookups at container** - Container maps ID → object → props (presenters receive objects)
- **Callbacks minimal** - `onRemove(id)` not `onRemove(object)`
- **Validation in services** - Not components (Edge Functions validate, services call Edge Functions)

### 6. Composition Patterns

**Available Patterns**:

| Pattern | Use When | Example |
|---------|----------|---------|
| **Prop Drilling** | Shallow tree (<3 levels) | `ChatContainer → ChatMessageList → ChatMessage` passing props explicitly |
| **Context** | Deep tree (3+ levels) | `ChatProvider` at WorkspaceLayout, `useChatContext()` in ChatContainer, ChatInput |
| **Render Props** | Custom rendering | `<FileTree render={(node) => <CustomNode />} />` for different file tree displays |
| **Compound Components** | Related UI elements | `<ContextReferenceBar><ContextReference /><AddReferenceButton /></ContextReferenceBar>` |

**This Feature Uses**:

- **Prop Drilling**: For all presenter hierarchies (shallow trees, 2-3 levels max)
  - Example: `ChatContainer → ChatMessageList → ChatMessage` (3 levels, explicit props)
  - Rationale: Clear data flow, easy debugging, no hidden dependencies

- **Context**: For providers managing global subscriptions and auth state
  - `ChatProvider` (real-time chat subscriptions) - Used by ChatContainer, ChatInput, ChatMessageList
  - `AgentProvider` (real-time agent request progress) - Used by ChatContainer, ApprovalPromptContainer
  - `FileSystemProvider` (real-time file changes) - Used by FileTreeContainer, DocumentEditorContainer
  - Rationale: Deep tree (WorkspaceLayout → multiple containers), avoids prop drilling for subscriptions

- **Compound Components**: For ContextReferenceBar
  - Pattern: `<ContextReferenceBar>` manages scroll state, renders `<ContextReference />` children
  - Rationale: Related UI elements (pills) share state (scroll position, overflow)

**NOT USED**:
- **Render Props**: Deferred to post-MVP (no custom rendering needed for MVP file tree)
- **Higher-Order Components**: Avoided in favor of hooks (modern React pattern)

