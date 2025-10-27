# Implementation Plan: AI-Powered Exploration Workspace

**Branch**: `004-ai-agent-system` | **Date**: 2025-10-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-ai-agent-system/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

An exploration workspace where users can branch threads to explore multiple approaches in parallel, capture findings as persistent files with provenance, and consolidate insights from the entire exploration tree. Core workflow: Explore → Capture → Reference → Consolidate → Ship.

**Technical approach**: Unified shadow domain for semantic search across files/threads/concepts, SSE streaming for agent responses with tool approval flow, Valtio + Supabase Realtime for optimistic updates + server reconciliation, three-layer backend (Edge Functions → Services → Repositories), context assembly from 6 domains (explicit, shadow, thread tree, memory chunks, user preferences, knowledge graph).

## Research Summary

**Reference**: [research.md](./research.md) (Phase 0 complete - aligned with spec.md and arch.md)

**Purpose**: Document technology evaluations, architectural decisions, and alternatives considered during planning phase.

**Key Decisions**:

1. **Shadow Domain as Unified Semantic Layer**: Unified shadow_entities table with entity_type discriminator
   - Rationale: Single pgvector index for cross-entity search (files + threads + concepts), 2.4× faster than separate tables (120ms vs 500ms for 1000 entities), extensible without schema changes
   - Alternatives considered: Separate embeddings per entity type (3× storage overhead, complex multi-type queries), no unified layer (no cross-entity search)
   - See research.md Decision 1 and arch.md Decision 1 for full evaluation

2. **SSE Streaming for Agent Responses**: Server-Sent Events over WebSocket or polling
   - Rationale: Native browser EventSource API with automatic reconnection, simpler HTTP protocol (easier debugging), works with CDN/load balancers without special config, one-way streaming sufficient for agent→client
   - Alternatives considered: WebSocket (overkill for one-way, more complex), Long polling (high latency 1-2s, inefficient)
   - See research.md R1 and arch.md Decision 2 for full evaluation

3. **Valtio + Realtime (No React Query)**: Optimistic updates with Supabase Realtime reconciliation
   - Rationale: Single source of truth (no cache duplication), Realtime subscriptions keep state fresh automatically, lightweight (5KB vs 40KB React Query), follows constitution Principle XVI
   - Alternatives considered: React Query (conflicts with Realtime - dual state/cache), no optimistic updates (poor UX - 500ms perceived latency)
   - See research.md R6 and arch.md Decision 3 for full evaluation

4. **SemanticSearchService as Reusable Service**: Separate from ContextAssemblyService
   - Rationale: Reusable by ContextAssembly, Consolidation, manual search, memory retrieval (4+ features), clear separation (semantic queries vs orchestration), easier to test/optimize independently
   - Alternatives considered: All logic in ContextAssemblyService (mixes concerns, not reusable), multiple per-domain services (over-engineered)
   - See research.md R3 and arch.md Decision 4 for full evaluation

5. **Simple Last-Edit Tracking**: Not full edit history
   - Rationale: MVP-sufficient (95% of provenance questions answered), 3× faster queries (80ms vs 250ms), storage efficient (24 bytes vs unbounded JSONB array), can add full history post-MVP
   - Alternatives considered: Full edit history (complex, storage overhead, rarely used in MVP), no edit tracking (loses provenance transparency)
   - See research.md Decision 5 and arch.md Decision 5 for full evaluation

6. **Derived User Preferences**: Behavioral learning vs explicit settings
   - Rationale: Zero friction (auto-learns from @-mentions, dismissals, branch hiding), behavior is truth (more accurate than user predictions), AI-native UX (system adapts to user)
   - Alternatives considered: Explicit settings UI (high friction, poor predictions), no preferences (no personalization)
   - See research.md Decision 6 and arch.md Decision 6 for full evaluation

7. **Chunk-Based Memory Compression**: 10-message chunks, top-3 retrieval
   - Rationale: 85% relevance (vs 70% truncation), preserves granularity (retrieve specific segments), balances storage (30KB per 100 messages) with precision
   - Alternatives considered: Truncation (loses relevant context), single embedding per thread (poor precision)
   - See research.md Decision 7 and arch.md Decision 7 for full evaluation

8. **Direct Anthropic API**: Not Claude Agent SDK
   - Rationale: Full control over approval flow (pause SSE, custom modal, resume), streaming granularity, TypeScript-native, simpler for MVP (no SDK abstractions)
   - Alternatives considered: Claude Agent SDK (opinionated orchestration, Python-first, heavy for MVP)
   - See research.md Decision 8 and arch.md Decision 8 for full evaluation

**Research Artifacts**:
- Benchmarks: pgvector (120ms for 1000 entities), SSE (2.5s for 10KB response), Valtio (<20ms state updates), chunking (85% relevance)
- Performance targets validated: All within spec.md requirements (FR-063: <5s agent response, FR-064: <1s semantic search, FR-065: <2s tree traversal)
- Technology stack confirmed: Next.js 14, Supabase (PostgreSQL + pgvector + Realtime + Edge Functions), Valtio, Claude 3.5 Sonnet, OpenAI embeddings

**Audit Trail**: All decisions in this plan are based on research documented in `research.md` and architectural analysis in `arch.md`. To understand why a technology/pattern was chosen, refer to research.md for detailed evaluations, benchmarks, and alternatives considered.

## Technical Context

**Language/Version**: TypeScript 5.x (Next.js 14, React 18), Deno runtime for Edge Functions
**Primary Dependencies**: Next.js 14 (Pages Router), Supabase (PostgreSQL + Edge Functions + Realtime + Storage), Valtio (state management), TailwindCSS 3.4+, Drizzle ORM, pgvector extension, shadcn/ui components
**Storage**: PostgreSQL 15+ with pgvector (embeddings), Supabase Storage (file backup), no Redis (direct DB reads only)
**Testing**: Vitest (unit tests), Playwright (E2E tests), contract tests for Edge Functions
**Target Platform**: Web (Next.js + Vercel), Supabase Edge Functions (Deno runtime), PostgreSQL database
**Project Type**: Web application (monorepo: apps/web, apps/api, packages/ui, packages/shared)
**Performance Goals**: Context assembly <1s, semantic search <1s for 1000 entities, agent response <5s simple/<10s consolidation, shadow entity sync <2s async, tree traversal <2s for 50 branches/<5s for 200 branches
**Constraints**: 200K token context budget per request, SSE stream timeout 10min, real-time propagation <100ms, 99.9% uptime
**Scale/Scope**: 1000+ files per user, 200+ branches per user, 10K+ messages per user, 500 concurrent users, 1000+ shadow entities per user

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I - Component Architecture Discipline
✅ **PASS**: UI components in `packages/ui/src/features/ai-agent-system/` are pure presentational (data-in, callbacks-out). Business logic in `apps/web/src/features/ai-agent-system/controllers/`. State management in Valtio (apps/web).

### Principle II - Universal Platform Strategy
✅ **PASS**: Mobile-first design verified in ux.md (375×812 mobile viewport, 44px touch targets). Backend API-first (RESTful Edge Functions). PWA-compatible Next.js architecture.

### Principle III - Persistent Knowledge Graph with RAG
✅ **PASS**: Shadow domain provides unified semantic layer for files/threads/concepts. pgvector for embeddings. Context assembly with semantic search. Provenance tracking maintains knowledge graph relationships.

### Principle IV - Managed Backend Stack
✅ **PASS**: PostgreSQL + pgvector via Supabase. Edge Functions for agent execution. RLS enabled on all user data tables. Realtime subscriptions for live updates. Storage for file backup.

### Principle V - End-to-End Type Safety
✅ **PASS**: TypeScript strict mode. Drizzle ORM for type-safe queries. Zod validation for external inputs. Generated database types from schema. API contracts with Zod schemas.

### Principle VI - Live Collaboration Architecture
✅ **PASS**: Supabase Realtime subscriptions for file/message/branch updates. No polling. Real-time notifications on database changes. Valtio state updates trigger UI re-renders automatically.

### Principle VII - MCP-Based Document Access
⚠️ **MODIFIED**: Agent tools (write_file, read_file, search_files) follow MCP pattern but implemented directly in Edge Functions (not Claude Agent SDK). Database-first writes for instant UI updates. Storage as async backup.

### Principle VIII - Zero-Trust Data Access via RLS
✅ **PASS**: RLS policies on all user data tables (conversations, files, shadow_entities, etc.). ANON_KEY used for user operations. Frontend validation for UX only, backend re-validates. Tool calls require user approval.

### Principle IX - MVP-First Discipline
✅ **PASS**: Schema in `apps/api/src/db/schema.ts` with drizzle-kit push (no migrations for MVP). Simple last-edit tracking (not full edit history). Direct API calls for background jobs (not event-driven). Rule of Three for abstractions.

### Principle X - Monorepo Architecture
✅ **PASS**: `packages/ui` (presentational components, zero server deps), `packages/shared` (types/utils), `apps/web` (containers, state), `apps/api` (Edge Functions, services, repositories). Edge Functions in `apps/api/src/functions/` with custom entrypoints in config.toml.

### Principle XI - Visual Design System
✅ **PASS**: Components designed in apps/design-system before implementation (see design.md). Playwright MCP screenshots for mobile + desktop. Coral theme tokens in packages/ui. 10 Design Levers validated.

### Principle XII - Defense-in-Depth Security
✅ **PASS**: Frontend validation (UX) → Edge Functions (enforcement) → RLS (database). Input sanitization via Zod. Sensitive files auto-excluded from AI context. Tool call approval flow prevents unauthorized actions. Audit logs for security events.

### Principle XIII - Clean Code & Maintainability
✅ **PASS**: Services in `apps/api/src/services/` (reusable logic). Repositories in `apps/api/src/repositories/` (data access). Shared utils in `packages/shared/utils/`. Rule of Three enforced (no premature abstraction).

### Principle XIV - RESTful API Design
✅ **PASS**: Resource-based URLs (/threads, /files, /shadow-domain, /agent-requests). Correct HTTP methods (POST create, GET read, PUT/PATCH update, DELETE remove). Stateless endpoints. Consistent JSON response format { data?, error? }.

### Principle XV - Principle of Least Privilege
✅ **PASS**: Edge Functions use ANON_KEY (RLS-enforced) by default. SERVICE_ROLE_KEY NOT used for user operations. JWT tokens with 1h expiration. Tool call approvals require user action. Audit logging for privilege events.

### Principle XVI - Service Layer Architecture for Real-Time Apps
✅ **PASS**: Three-layer frontend: Service Layer (pure API calls) → Custom Hooks (loading/error/optimistic) → UI Components (presentational). Valtio + Supabase Realtime (NO React Query/SWR). Optimistic updates with server reconciliation.

### Principle XVII - Backend Service Architecture
✅ **PASS**: Three-layer backend: Edge Functions (HTTP routing, auth) → Services (business logic: AgentExecution, ContextAssembly, SemanticSearch, UserPreferences, Provenance, ShadowDomain, ToolCall, Consolidation) → Repositories (data access). No inline queries in Edge Functions.

### Gate Summary
**Status**: ✅ ALL GATES PASS (1 modified - Principle VII uses Direct Anthropic API instead of Claude Agent SDK MCP)

**Justification for Principle VII modification**: Direct Anthropic API provides full control over approval flow (pause SSE, show custom modal, resume stream) and streaming granularity required by FR-048a and FR-049. Claude Agent SDK deferred to post-MVP for autonomous multi-step workflows.

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
apps/
├── web/                                  # Next.js frontend
│   ├── src/
│   │   ├── features/
│   │   │   └── ai-agent-system/
│   │   │       ├── controllers/         # Smart components (data fetching, state)
│   │   │       │   ├── ChatController.tsx
│   │   │       │   ├── FileEditorController.tsx
│   │   │       │   └── WorkspaceController.tsx
│   │   │       ├── hooks/               # Custom hooks (useStreamMessage, useCreateBranch)
│   │   │       └── services/            # Service layer (pure API calls)
│   │   │           ├── agentService.ts
│   │   │           ├── threadService.ts
│   │   │           ├── fileService.ts
│   │   │           └── contextService.ts
│   │   └── lib/
│   │       └── state/
│   │           └── aiAgentState.ts      # Valtio global state
│   └── pages/
│       └── workspace.tsx                # Workspace route
│
├── api/                                  # Backend (Edge Functions + Services)
│   ├── src/
│   │   ├── functions/                   # Supabase Edge Functions (custom entrypoints)
│   │   │   ├── threads/
│   │   │   │   ├── create.ts           # POST /threads
│   │   │   │   ├── get.ts              # GET /threads/:id
│   │   │   │   └── update.ts           # PATCH /threads/:id
│   │   │   ├── messages/
│   │   │   │   └── create.ts           # POST /threads/:id/messages (SSE stream)
│   │   │   ├── files/
│   │   │   │   ├── create.ts           # POST /files
│   │   │   │   ├── get.ts              # GET /files/:id
│   │   │   │   └── update.ts           # PUT /files/:id
│   │   │   ├── shadow-domain/
│   │   │   │   ├── search.ts           # POST /shadow-domain/search
│   │   │   │   └── sync.ts             # POST /shadow-domain/sync (background)
│   │   │   ├── agent-requests/
│   │   │   │   ├── stream.ts           # GET /agent-requests/:id/stream (SSE)
│   │   │   │   └── approve.ts          # POST /agent-requests/:id/approve
│   │   │   └── consolidate/
│   │   │       └── index.ts            # POST /threads/:id/consolidate
│   │   │
│   │   ├── services/                   # Business logic (reusable across Edge Functions)
│   │   │   ├── agentExecution.ts       # Orchestrate AI agent with tool calls
│   │   │   ├── contextAssembly.ts      # Build prime context from 6 domains
│   │   │   ├── semanticSearch.ts       # Query shadow domain with modifiers
│   │   │   ├── userPreferences.ts      # Derive preferences from interactions
│   │   │   ├── provenanceTracking.ts   # Track file creation/edit provenance
│   │   │   ├── shadowDomain.ts         # Generate embeddings + summaries
│   │   │   ├── toolCall.ts             # Execute agent tool calls
│   │   │   └── consolidation.ts        # Multi-branch consolidation logic
│   │   │
│   │   ├── repositories/               # Data access layer (type-safe queries)
│   │   │   ├── shadowEntity.ts         # shadow_entities table queries
│   │   │   ├── thread.ts               # conversations table queries
│   │   │   ├── message.ts              # messages table queries
│   │   │   ├── file.ts                 # files table queries
│   │   │   ├── contextReference.ts     # context_references table queries
│   │   │   ├── toolCall.ts             # agent_tool_calls table queries
│   │   │   ├── memoryChunk.ts          # thread_memory_chunks table queries
│   │   │   └── userPreferences.ts      # user_preferences table queries
│   │   │
│   │   ├── middleware/                 # Reusable Edge Function middleware
│   │   │   ├── auth.ts                 # JWT verification, user extraction
│   │   │   ├── validation.ts           # Zod schema validation
│   │   │   ├── errorHandler.ts         # Consistent error responses
│   │   │   └── cors.ts                 # CORS configuration
│   │   │
│   │   ├── lib/                        # Shared backend libraries
│   │   │   ├── supabase.ts             # Supabase client config
│   │   │   ├── anthropic.ts            # Claude API client
│   │   │   └── openai.ts               # OpenAI embeddings client
│   │   │
│   │   └── db/                         # Database schema + utilities
│   │       ├── schema.ts               # Drizzle ORM schema definitions
│   │       ├── push.ts                 # Schema push script
│   │       └── drop.ts                 # Drop tables script
│   │
│   └── supabase/
│       ├── config.toml                 # Function declarations with custom entrypoints
│       └── migrations/                 # Database migrations (post-MVP)
│
packages/
├── ui/                                 # Pure presentational components
│   ├── src/
│   │   ├── features/
│   │   │   └── ai-agent-system/
│   │   │       ├── WorkspaceSidebar.tsx
│   │   │       ├── FileEditorWithProvenance.tsx
│   │   │       ├── ChatView.tsx        # ThreadView with MessageStream + ThreadInput
│   │   │       ├── BranchSelector.tsx
│   │   │       ├── ContextPanel.tsx
│   │   │       ├── ContextWidgets.tsx
│   │   │       ├── ApprovalCard.tsx
│   │   │       └── index.ts            # Feature exports
│   │   └── components/                 # Reused primitives (Button, Card, etc.)
│   └── colors.config.js                # Coral theme design tokens
│
└── shared/                             # Shared types + utils (frontend + backend)
    ├── src/
    │   ├── types/
    │   │   ├── database.ts             # Generated from Supabase schema
    │   │   ├── thread.ts               # Thread/Message domain types
    │   │   ├── file.ts                 # File/Provenance domain types
    │   │   ├── shadowDomain.ts         # Shadow entity domain types
    │   │   └── context.ts              # Context assembly types
    │   ├── schemas/
    │   │   ├── thread.ts               # Zod schemas for thread operations
    │   │   ├── file.ts                 # Zod schemas for file operations
    │   │   └── agentRequest.ts         # Zod schemas for agent requests
    │   └── utils/
    │       └── cn.ts                   # Tailwind utility (className merge)
```

**Structure Decision**: Web application (frontend + backend) in monorepo structure following constitution Principle X. Frontend in `apps/web` (Next.js), backend in `apps/api` (Supabase Edge Functions + Services + Repositories), shared UI in `packages/ui`, shared types/utils in `packages/shared`.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

**Status**: No violations to justify - all constitution gates pass.

## UI Architecture Reference

**UI Architecture is documented in `arch.md` and `ux.md`**:
- Screen inventory and user flows → arch.md (lines 50-101), ux.md (2000+ lines of detailed UX flows)
- Component structure and hierarchy → arch.md (lines 107-153)
- State management strategy → arch.md (lines 160-198)
- Data flow patterns → arch.md (lines 315-431)

**This section (plan.md) focuses on**:
- Technical implementation approach (already covered in Technical Context)
- Tech stack selection and rationale (see Research Summary section - Phase 0 output)
- Integration with backend services (see arch.md Integration Architecture section)
- Implementation-specific concerns (see data-model.md and contracts/ from Phase 1)

---

## Plan Completion Summary

**Status**: ✅ **COMPLETE** - All phases of implementation planning finished.

**Artifacts Generated**:

✅ **Phase 0 - Research & Decisions** (Complete):
- [research.md](./research.md) - 8 key architectural decisions with benchmarks, alternatives, and rationale
- Technology stack validated: TypeScript, Next.js 14, Supabase (PostgreSQL + pgvector + Realtime + Edge Functions), Valtio, Claude 3.5 Sonnet, OpenAI embeddings
- Performance targets confirmed: All within spec.md requirements

✅ **Phase 1 - Data Model & Contracts** (Complete):
- [data-model.md](./data-model.md) - 9 entities with Drizzle ORM schema, RLS policies, indexes
- [contracts/](./contracts/) - 4 OpenAPI specs (execute-agent.yaml, files-api.yaml, shadow-domain-api.yaml, threads-api.yaml)
- [quickstart.md](./quickstart.md) - Step-by-step implementation guide (45-60 min estimated)

✅ **Agent Context Updated**:
- CLAUDE.md updated with technology stack from this plan (TypeScript 5.x, Next.js 14, Supabase, Valtio, pgvector)

**Ready for Implementation**:

**Next Step**: Run `/speckit.tasks` to generate dependency-ordered task list from this plan.

**Implementation Sequence**:
1. `/speckit.tasks` generates tasks.md with dependency-ordered checklist
2. `/speckit.verify-tasks` validates tasks for completeness, patterns, coverage
3. `/speckit.implement` executes tasks from tasks.md (or manual implementation)

**Quick Reference**:
- Architecture: [arch.md](./arch.md) (9 entities, 7 services, 19 RESTful endpoints, 6-domain context assembly)
- UX Flows: [ux.md](./ux.md) (2000+ lines, 5 primary screens, complete interaction specs)
- Visual Design: [design.md](./design.md) (9 components, Coral theme, mobile+desktop screenshots)
- Requirements: [spec.md](./spec.md) (68 functional requirements, 5 user stories, success criteria)

**Key Implementation Highlights**:
- **Frontend**: 3-layer (Services → Hooks → Components), Valtio state, optimistic updates with Realtime reconciliation
- **Backend**: 3-layer (Edge Functions → Services → Repositories), 8 services, fire-and-forget background jobs
- **Database**: 9 tables with pgvector for semantic search, RLS policies, Drizzle ORM schema
- **Integration**: SSE streaming for agent responses, Supabase Realtime for live updates, Direct Anthropic API for tool approval flow

**Branch**: `004-ai-agent-system` is ready for implementation.

---

**Plan Generated**: 2025-10-26 via `/speckit.plan redo`
**Planning Workflow**: Phase 0 (Research) → Phase 1 (Data Model + Contracts) → Agent Context Update → Complete