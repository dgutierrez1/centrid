# Implementation Plan: AI-Powered Exploration Workspace

**Branch**: `004-ai-agent-system` | **Date**: 2025-10-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-ai-agent-system/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build an exploration workspace enabling branching conversations (thread DAG), persistent file artifacts with provenance tracking, and cross-branch semantic discovery. Users can explore complex topics across parallel threads, capture findings as files, reference insights from the entire exploration tree, and consolidate multi-branch findings into coherent outputs. Core integration: threads + filesystem + AI agents unified through provenance and shadow domain semantic search.

## Technical Context

**Language/Version**: TypeScript 5.0+, Node.js 20+, Deno (for Edge Functions)
**Primary Dependencies**: Next.js 14, React 18, Valtio (state), Supabase SDK, Drizzle ORM, Claude 3.5 Sonnet API, OpenAI Embeddings API
**Storage**: PostgreSQL 15+ with pgvector extension (Supabase), Supabase Storage (file backup)
**Testing**: Jest (frontend), Vitest (backend), Playwright (E2E)
**Target Platform**: Web (desktop + mobile PWA), Supabase Edge Functions (Deno runtime)
**Project Type**: Web application (monorepo: apps/web frontend, apps/api backend, packages/ui + packages/shared)
**Performance Goals**: Context assembly <1s, Semantic search <1s for 1000 entities, Agent response <5s (simple) / <10s (consolidation), Shadow entity sync <2s, Tree traversal <2s for 50 branches
**Constraints**: 200K token context budget, 768-dim embeddings (OpenAI text-embedding-3-small), Real-time propagation <100ms, SSE streaming with <500ms chunk interval
**Scale/Scope**: 500 concurrent users, 1000+ files per user, 200+ branches per user, 10K+ messages per user, 1000+ shadow entities per user

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Compliance Status | Justification |
|-----------|-------------------|---------------|
| **I. Component Architecture Discipline** | ✅ PASS | Controllers (smart) handle agent execution, state, API calls. Views (dumb) are pure presentational. Providers for Realtime subscriptions. |
| **II. Universal Platform Strategy** | ✅ PASS | Mobile-first design with PWA delivery. Touch-optimized interactions. API-first backend (RESTful Edge Functions). |
| **III. Persistent Knowledge Graph with RAG** | ✅ PASS | Shadow domain provides persistent semantic layer across all entities. Context assembly uses pgvector for RAG retrieval. |
| **IV. Managed Backend Stack** | ✅ PASS | Supabase PostgreSQL + pgvector, Edge Functions for agent execution, Realtime subscriptions, RLS on all user data. |
| **V. End-to-End Type Safety** | ✅ PASS | TypeScript everywhere. Drizzle for type-safe queries. Zod for runtime validation. Generated DB types. |
| **VI. Live Collaboration Architecture** | ✅ PASS | Realtime subscriptions for file creation, branch creation, message updates. No polling. |
| **VII. MCP-Based Document Access** | ✅ PASS | Agent tools (write_file, read_file, search_files) follow MCP protocol. Database-first writes with Storage backup. |
| **VIII. Zero-Trust Data Access via RLS** | ✅ PASS | RLS policies on all user tables. Edge Functions use ANON_KEY (respects RLS). JWT validation. Sensitive file auto-exclusion. |
| **IX. MVP-First Discipline** | ✅ PASS | Features scoped to validate core hypothesis (branching + provenance). Rule of Three for abstractions. Schema iteration with drizzle-kit push. |
| **X. Monorepo Architecture** | ✅ PASS | apps/web (frontend), apps/api (backend), packages/ui (pure components), packages/shared (types/utils). Import rules enforced. |
| **XI. Visual Design System** | ⏳ PENDING | Design-first workflow required before implementation. Will use apps/design-system + Playwright MCP screenshots. |
| **XII. Defense-in-Depth Security** | ✅ PASS | Input validation (Zod), RLS enforcement, audit logging (tool calls), sensitive file exclusion, auto-rejection after 10min timeout. |
| **XIII. Clean Code & Maintainability** | ✅ PASS | Repository pattern (data access), Service layer (business logic), Clear module organization, Rule of Three for reusability. |
| **XIV. RESTful API Design** | ✅ PASS | Resource-based URLs (/threads, /files, /shadow-domain). Correct HTTP methods/status codes. Stateless design. OpenAPI specs in /contracts/. |
| **XV. Principle of Least Privilege** | ✅ PASS | ANON_KEY for user operations. SERVICE_ROLE_KEY avoided. RLS enforcement. JWT with 1hr expiration. Tool calls require user approval. |
| **XVI. Service Layer Architecture for Real-Time Apps** | ✅ PASS | Three-layer frontend (Services → Hooks → Components). Valtio + Realtime (no React Query). Optimistic updates with rollback. |
| **XVII. Backend Service Architecture** | ✅ PASS | Three-layer backend (Edge Functions → Services → Repositories). Repository pattern for all DB queries. Middleware for auth/validation. |

**Overall**: ✅ **PASS** (Pending design completion via /speckit.design)

**Notes**:
- Design-first workflow (Principle XI) will be executed via `/speckit.design` before implementation
- All other principles aligned with existing architecture patterns
- No violations requiring complexity tracking

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
├── web/                                    # Frontend application
│   ├── src/
│   │   ├── features/ai-agent-system/       # Feature module
│   │   │   ├── controllers/
│   │   │   │   ├── ChatController.tsx      # Agent execution, message streaming
│   │   │   │   ├── FileEditorController.tsx # File editing with provenance
│   │   │   │   └── TreeViewController.tsx   # Visual branch tree (Phase 3)
│   │   │   ├── views/
│   │   │   │   ├── ChatView.tsx             # Chat UI layout
│   │   │   │   ├── MessageStream.tsx        # SSE streaming display
│   │   │   │   ├── ContextPanel.tsx         # Context section (6 groups)
│   │   │   │   ├── BranchSelector.tsx       # Hierarchical branch dropdown
│   │   │   │   ├── FileEditorView.tsx       # File editor with provenance header
│   │   │   │   └── ApprovalModal.tsx        # Tool call approval prompt
│   │   │   └── hooks/
│   │   │       ├── useStreamMessage.ts      # SSE message streaming
│   │   │       ├── useCreateBranch.ts       # Branch creation
│   │   │       ├── useSemanticSearch.ts     # Cross-branch discovery
│   │   │       └── useToolCallApproval.ts   # Approval flow
│   │   ├── lib/
│   │   │   ├── state/
│   │   │   │   └── aiAgentState.ts          # Valtio global state
│   │   │   └── services/
│   │   │       ├── agentService.ts          # Agent API calls
│   │   │       ├── threadService.ts         # Thread operations
│   │   │       └── fileService.ts           # File operations
│   │   └── providers/
│   │       └── RealtimeProvider.tsx         # Supabase Realtime subscriptions
│   └── tests/
│       ├── integration/                     # Feature integration tests
│       └── e2e/                             # Playwright E2E tests
│
├── api/                                     # Backend application
│   ├── src/
│   │   ├── functions/                       # Supabase Edge Functions (source of truth)
│   │   │   ├── execute-agent/
│   │   │   │   └── index.ts                 # POST /threads/:id/messages, SSE streaming
│   │   │   ├── approve-tool-call/
│   │   │   │   └── index.ts                 # POST /agent-requests/:id/approve
│   │   │   ├── create-branch/
│   │   │   │   └── index.ts                 # POST /threads
│   │   │   ├── sync-shadow-domain/
│   │   │   │   └── index.ts                 # POST /shadow-domain/sync (background job)
│   │   │   ├── summarize-thread/
│   │   │   │   └── index.ts                 # POST /threads/:id/summarize (background job)
│   │   │   ├── compress-memory/
│   │   │   │   └── index.ts                 # POST /threads/:id/compress-memory (background job)
│   │   │   └── consolidate-branches/
│   │   │       └── index.ts                 # POST /threads/:id/consolidate
│   │   ├── services/                        # Business logic layer
│   │   │   ├── agentExecution.ts            # Claude 3.5 Sonnet orchestration
│   │   │   ├── contextAssembly.ts           # Multi-domain context gathering
│   │   │   ├── semanticSearch.ts            # Shadow domain search (pgvector)
│   │   │   ├── userPreferences.ts           # Behavioral preference derivation
│   │   │   ├── provenanceTracking.ts        # File provenance management
│   │   │   ├── shadowDomain.ts              # Embedding + summary generation
│   │   │   ├── toolCall.ts                  # MCP tool execution
│   │   │   └── consolidation.ts             # Multi-branch consolidation
│   │   ├── repositories/                    # Data access layer
│   │   │   ├── shadowEntity.ts              # Shadow domain queries
│   │   │   ├── thread.ts                    # Thread CRUD + tree traversal
│   │   │   ├── message.ts                   # Message CRUD
│   │   │   ├── file.ts                      # File CRUD
│   │   │   ├── contextReference.ts          # Context reference CRUD
│   │   │   ├── toolCall.ts                  # Tool call audit logs
│   │   │   ├── memoryChunk.ts               # Thread memory chunks
│   │   │   └── userPreferences.ts           # User preference queries
│   │   ├── middleware/                      # Reusable middleware
│   │   │   ├── auth.ts                      # JWT verification + ownership
│   │   │   ├── validation.ts                # Zod schema validation
│   │   │   ├── errorHandler.ts              # Consistent error formatting
│   │   │   └── cors.ts                      # CORS configuration
│   │   ├── lib/
│   │   │   ├── supabase.ts                  # Supabase client config
│   │   │   ├── openai.ts                    # OpenAI Embeddings API client
│   │   │   └── anthropic.ts                 # Claude 3.5 Sonnet API client
│   │   └── db/
│   │       ├── schema.ts                    # Drizzle schema definitions
│   │       ├── push.ts                      # Schema push script
│   │       └── drop.ts                      # Schema drop script
│   ├── supabase/
│   │   ├── config.toml                      # Edge Function config (custom entrypoints)
│   │   └── migrations/                      # Database migrations (post-MVP)
│   ├── import_map.json                      # Deno import map (@centrid/shared)
│   └── tests/
│       ├── services/                        # Service unit tests
│       ├── repositories/                    # Repository unit tests
│       └── integration/                     # API integration tests
│
└── packages/
    ├── ui/                                  # Pure UI components (no server deps)
    │   └── src/
    │       └── features/ai-agent-system/
    │           ├── ProvenancePill.tsx       # Provenance indicator UI
    │           ├── ContextSection.tsx       # Context panel section
    │           └── StreamingIndicator.tsx   # Loading/streaming feedback
    └── shared/                              # Shared types and utils
        └── src/
            ├── types/
            │   ├── thread.ts                # Thread entity types
            │   ├── message.ts               # Message entity types
            │   ├── file.ts                  # File entity types
            │   ├── shadowDomain.ts          # Shadow domain types
            │   └── toolCall.ts              # Tool call types
            ├── schemas/
            │   ├── thread.ts                # Zod schemas for threads
            │   ├── message.ts               # Zod schemas for messages
            │   └── contextReference.ts      # Zod schemas for context refs
            └── utils/
                ├── provenance.ts            # Provenance formatting helpers
                └── contextAssembly.ts       # Context priority helpers
```

**Structure Decision**: Web application (monorepo) following Principle X (Monorepo Architecture). Frontend in `apps/web`, backend in `apps/api` with three-layer architecture (Edge Functions → Services → Repositories). Shared types/utils in `packages/shared` for frontend-backend reuse. Pure UI components in `packages/ui`.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

No constitution violations. All patterns align with established principles.

## UI Architecture Reference

*SKIP this section if project has no UI (API-only, CLI, library)*

**UI Architecture is documented in `arch.md`** (generated by `/speckit.arch`):
- Screen inventory and user flows → arch.md (6 screens: Chat Interface, Branch Selector, Context Panel, File Editor, Approval Modal, Visual Tree View)
- Component structure and hierarchy → arch.md (ChatController/ChatView pattern with nested components)
- State management strategy → arch.md (Valtio for global state, React useState for UI state, URL for navigation)
- Data flow patterns → arch.md (SSE streaming, Realtime subscriptions, optimistic updates)

**This section (plan.md) focuses on**:
- Technical implementation approach: Three-layer frontend (Services → Hooks → Components), SSE for agent streaming, Valtio + Realtime for state sync
- Tech stack selection and rationale: Next.js 14 (SSR + PWA), React 18 (components), Valtio (reactive state without React Query), Supabase SDK (auth + realtime)
- Integration with backend services: RESTful API calls via service layer, SSE EventSource for streaming, Supabase Realtime WebSocket for cross-device sync
- Implementation-specific concerns: Fire-and-forget background jobs (no await), optimistic updates with rollback, context panel positioned below messages/above input

