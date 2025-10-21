<!--
Sync Impact Report:
- Version: 1.3.0 → 1.4.0
- Rationale: MINOR bump - Added apps/api for self-contained backend application. All server logic (business logic, Edge Functions, migrations) now lives in one place instead of split across packages/ and supabase/.
- Modified principles:
  - Principle X (Monorepo Architecture): Added apps/api structure, removed packages/server, clarified all server logic placement
  - Technology Stack Constraints: Updated package structure (2 packages + 3 apps)
  - Key Architectural Decisions: Updated #13, #15, #19 for apps/api structure
  - Anti-Patterns: Added rules against splitting backend code and placing functions at root
- Added sections:
  - apps/api/ self-contained backend application structure
  - Backend Structure diagram showing apps/api/ organization
  - Server Logic Placement (ALL in apps/api/)
  - Deployment instructions for apps/api
- Removed sections:
  - packages/server (replaced by apps/api)
  - Root supabase/ folder references (moved to apps/api/supabase)
- Templates status:
  ✅ All templates remain compatible
- Follow-up TODOs:
  - Add to CLAUDE.md: Monorepo structure with apps/api and server logic placement rules
  - Create apps/api/package.json and directory structure
  - Configure apps/api/supabase/config.toml to point to src/functions/
-->

# Centrid Constitution

## Core Principles

### I. Component Architecture Discipline

**Separation of Concerns**

All UI components MUST be pure presentational components (dumb) that only receive props and call callbacks. All business logic, state management, and integrations MUST live in container components (smart) or dedicated service layers. Provider components are the ONLY exception for cross-cutting concerns (auth, realtime, theme).

**Rationale**: Enables testability, reusability, and maintainability. Components can be tested with simple prop inputs without mocking complex dependencies. Clear boundaries between presentation and logic improve code quality and developer velocity.

### II. Universal Platform Strategy

**Mobile-First Architecture**

All features MUST be designed mobile-first with PWA as MVP delivery. Backend MUST be API-first with stateless endpoints suitable for both web and future native apps. UI MUST use touch-optimized interactions. Code sharing target: 80%+ between web and future mobile platforms.

**Rationale**: Target users (indie hackers, solo developers, technical writers) need mobile access for on-the-go productivity. PWA enables rapid launch while maintaining native app transition path without architectural rewrites. Mobile-first ensures the most constrained environment works perfectly.

### III. Persistent Knowledge Graph with RAG

**Context-First Data Model**

Document context MUST be global and persistent across ALL user chats. Vector embeddings (pgvector 1536-dim) MUST be generated for all document chunks. RAG context retrieval MUST happen before every AI request using semantic similarity search. Citation tracking MUST record which document chunks informed each response via message_context_chunks table. Context window MUST be limited to 6000 tokens with relevance-ranked chunks.

**Rationale**: Core value proposition - solves the critical context loss problem in ChatGPT and other AI products. When users dive into subtopics across different threads, traditional AI chat loses track of the optimal context. Centrid maintains a persistent knowledge graph so users never have to re-upload or re-contextualize documents. Each conversation, regardless of thread depth or topic shift, has access to the full knowledge base with automatic relevance ranking. This is the "ChatGPT meets Obsidian" innovation - single source of truth for all knowledge enables consistent AI responses with transparent sourcing, eliminating the context degradation problem that plagues traditional chat interfaces.

### IV. Managed Backend Stack

**Supabase-First Backend**

Database MUST use PostgreSQL via Supabase with pgvector extension. Authentication MUST use Supabase Auth with JWT tokens. File storage MUST use Supabase Storage with path-based policies. Real-time updates MUST use Supabase Realtime (WebSocket subscriptions). Edge Functions MUST be used for AI orchestration, document processing, and agent execution. Row Level Security (RLS) MUST be enabled on all user data tables.

**Rationale**: Reduces infrastructure complexity, provides built-in auth/storage/realtime, enables rapid development. RLS provides database-level security that cannot be bypassed. No GraphQL layer needed - Supabase Realtime handles real-time updates with type safety. Optimized for indie hacker velocity.

### V. End-to-End Type Safety

**Type Safety Everywhere**

All code MUST be TypeScript. Database types MUST be auto-generated from Supabase schema. API contracts MUST be type-safe. Runtime validation MUST use Zod for external inputs. Supabase client MUST use generated Database type for all queries.

**Rationale**: Catches bugs at compile time, improves developer experience, enables confident refactoring, self-documenting code. Type safety extends from database → API → UI, eliminating entire classes of runtime errors.

### VI. Live Collaboration Architecture

**Real-Time First**

All user-facing data changes MUST propagate via Supabase Realtime subscriptions. Database updates MUST trigger real-time notifications to subscribed clients. Frontend MUST subscribe to relevant channels (documents, messages, chats) and update Valtio state automatically. Polling MUST NOT be used for data synchronization. Agent modifications to documents MUST be visible in real-time across all user devices.

**Rationale**: Users expect instant updates across devices in modern applications. Real-time subscriptions provide better UX, lower latency, and reduced server load vs polling. Supabase Realtime handles WebSocket management, reconnection, and RLS filtering automatically.

### VII. MCP-Based Document Access

**Agent-First File System**

Claude Agent SDK MUST access documents via MCP (Model Context Protocol) tools. Agent tools MUST read documents from PostgreSQL (content_text field) for speed. Agent write operations MUST update database first (triggering real-time notifications), then Storage asynchronously. File paths in Storage MUST follow structure: documents/{user_id}/{document_id}/{filename}. Agents MUST validate user ownership before all operations. Version field MUST be used for optimistic locking on concurrent updates.

**Rationale**: Agents need reliable file system abstraction. Database-first writes ensure instant UI updates via realtime subscriptions. Storage serves as backup and source for re-processing. MCP provides standard protocol for tool integration with Claude Agent SDK.

### VIII. Zero-Trust Data Access via RLS

**Security by Default**

All database tables with user data MUST have Row Level Security (RLS) enabled. RLS policies MUST enforce auth.uid() = user_id for all operations. All file uploads MUST be validated (type, size, content). Storage policies MUST check folder path includes user_id. Authentication MUST be required for all user data access. Edge Functions MUST use ANON_KEY (respects RLS) for user operations, SERVICE_ROLE_KEY ONLY when necessary with manual ownership validation. JWT tokens MUST be validated by Supabase (signature verification).

**Rationale**: Database-level security cannot be bypassed - more secure than application-level checks. RLS automatically filters all queries. Even direct database access respects policies. Security is enforced, not just checked. Critical for user trust and data privacy.

### IX. MVP-First Discipline

**Ruthless Scope Management**

All features MUST target the minimal viable implementation that validates the core hypothesis. Each feature MUST answer: "What is the simplest version that proves this works?" Features MUST be scoped to deliver value in days, not weeks. All architectural decisions MUST favor shipping speed over theoretical perfection. Complex abstractions MUST be deferred until patterns emerge from real usage (Rule of Three: abstract only after third occurrence). "Nice to have" features MUST be explicitly marked and deferred post-MVP.

**Rationale**: Centrid aims to solve the context loss problem for AI workflows - MVP validates this hypothesis as fast as possible. Over-engineering delays validation and wastes effort on features users may not need. Shipping early enables real user feedback which trumps theoretical architecture. The constitution author acknowledges a tendency to over-engineer; this principle provides explicit guardrails. Time-to-market is competitive advantage - complex solutions can be refactored after product-market fit is proven, but over-engineered MVPs never ship.

### X. Monorepo Architecture

**Enforced Package Boundaries**

Codebase MUST be organized as a monorepo using npm workspaces with the following structure:

**Packages** (shared libraries):
- `packages/ui` (@centrid/ui) - Pure presentational UI components with ZERO server dependencies (no Supabase, no state management, no providers)
- `packages/shared` (@centrid/shared) - Shared utilities, types, and validation schemas (Zod) used across ALL apps (frontend and backend)

**Apps** (deployable applications):
- `apps/web` - Main Next.js frontend application (MAY import from packages/ui, packages/shared)
- `apps/design-system` - Design iteration sandbox (MUST ONLY import from packages/ui, packages/shared)
- `apps/api` - Self-contained backend application with ALL server logic (MAY import from packages/shared only)

**Backend Structure** (`apps/api/`):
```
apps/api/
├── package.json           # Workspace package
├── src/
│   ├── services/          # Business logic (RAG, document processing, AI orchestration)
│   ├── utils/             # Backend utilities (response formatting, error handling)
│   ├── lib/               # Shared backend libraries (Supabase client config, etc)
│   └── functions/         # Supabase Edge Functions
│       ├── process-document/
│       ├── execute-ai-agent/
│       └── handle-webhook/
└── supabase/
    ├── config.toml        # Supabase config (points to src/functions/)
    └── migrations/        # Database schema and migrations
```

**Import Rules**:
- `apps/web` → MAY import from `packages/ui`, `packages/shared`
- `apps/design-system` → ONLY imports from `packages/ui`, `packages/shared` (enforced by package.json)
- `apps/api` → MAY import from `packages/shared` only
- `packages/ui` → MAY import from `packages/shared` only
- `packages/shared` → NO imports from other packages (foundation layer)

**Server Logic Placement** (ALL in `apps/api/`):
- Business logic shared across Edge Functions → `apps/api/src/services/`
- API utilities (response formatting, error handling) → `apps/api/src/utils/`
- Supabase client configuration → `apps/api/src/lib/supabase.ts`
- Edge Function implementations → `apps/api/src/functions/[function-name]/index.ts`
- Database migrations → `apps/api/supabase/migrations/`
- Supabase configuration → `apps/api/supabase/config.toml`

**Deployment**:
- `apps/web` → Vercel (frontend)
- `apps/api/src/functions/` → Supabase Edge Functions (via `supabase functions deploy` from apps/api/)
- `apps/api/supabase/migrations/` → Supabase (via `supabase db push` from apps/api/)

**Rationale**: Self-contained backend in `apps/api` keeps ALL server logic in one place - no splitting between packages and supabase folders. This improves discoverability, makes refactoring easier, and enforces clear app boundaries. Business logic naturally lives alongside the Edge Functions that use it. Package boundaries enforce separation at module level - TypeScript prevents UI code from importing server code. Design sandbox iterates on UI without server dependencies. `packages/shared` enables sharing ONLY types/utils between frontend and backend without coupling. Monorepo provides single-repo convenience with multi-app discipline. Turborepo enables incremental builds and caching. This architecture scales from MVP to multi-platform without rewrites.

### XI. Visual Design System

**Design-First UI Development**

All features MUST be visually designed in `apps/design-system` before implementation in `apps/web`. Design MUST follow a two-layer approach: (1) Global design system established once with `/speckit.design-system`, (2) Feature-specific designs created per feature with `/speckit.design`. All designs MUST be screenshot-validated using Playwright MCP (mobile + desktop viewports). Design feedback MUST use the 10 Design Levers framework (Visual Hierarchy, Consistency, Information Density, Color with Purpose, Typography Hierarchy, Spacing Rhythm, Feedback & Affordance, Mobile-First Responsive, Accessibility, States). Components MUST be approved visually before implementation begins. Design tokens MUST be centralized in `packages/ui` (colors.config.js, tailwind.preset.js).

**Rationale**: Visual-first iteration prevents costly implementation rewrites. Seeing high-fidelity mockups before coding validates UX decisions early. Playwright MCP automation enables rapid design iteration without manual dev server management. 10 Design Levers provide structured feedback language for consistent quality. Centralized design tokens ensure visual consistency across all apps. Design approval gates ensure implementation builds exactly what was approved, reducing back-and-forth during development.

## Technology Stack Constraints

### Frontend & UI

- **Framework**: Next.js 14+, React 18+, TypeScript
- **State Management**: Valtio (reactive, minimal boilerplate)
- **CSS Framework**: TailwindCSS 3.4+ (utility-first, mobile-first)
- **Component Library**: shadcn/ui (copy-paste components, not dependency)
- **UI Primitives**: Radix UI (via shadcn/ui - accessible, touch-friendly)
- **Styling**: Tailwind config and color system centralized in `packages/ui`

### Backend & Infrastructure

- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions + Realtime)
- **Database**: PostgreSQL 15+ with pgvector extension (1536-dim embeddings)
- **Real-time**: Supabase Realtime (WebSocket subscriptions, no GraphQL needed)
- **Deployment**: Vercel (frontend), Supabase (backend)

### AI & Development Tools

- **AI Models**: Claude 3.5 Sonnet (primary via Agent SDK with MCP tools)
- **AI Tooling**: shadcn MCP server (AI-powered component generation)
- **Design Tool**: v0.dev by Vercel (optional, for high-fidelity UI mockups)
- **Icons**: Heroicons or Lucide (tree-shakeable, consistent)

### Design Workflow

- **Design Sandbox**: `apps/design-system` (localhost:3001)
- **Screenshot Tool**: Playwright MCP (automated viewport testing)
- **Design Iteration**: `/speckit.design-system` (global), `/speckit.design` (feature-specific)
- **Design Levers**: 10-point framework for structured feedback
- **Viewports**: Mobile (375×812), Desktop (1440×900)

### Billing & Payments

- **Payment Processor**: Mercado Pago (Colombia market focus)

### Tooling & Build

- **Monorepo**: npm workspaces (workspace protocol for package linking)
- **Build System**: Turborepo (incremental builds, caching)
- **TypeScript**: Strict mode with shared base config
- **Component Management**: Custom script (`scripts/add-component.sh`) for shadcn components
- **Package Structure**: 2 packages (ui, shared) + 3 apps (web, design-system, api)

## Key Architectural Decisions

These decisions are locked and MUST be followed:

1. Multi-chat system with independent conversations
2. RAG-based context retrieval using vector similarity search (pgvector cosine similarity)
3. Full-text search (PostgreSQL tsvector) as supplement to vector search
4. Real-time updates via Supabase Realtime
5. Component-based architecture with clear separation between presentation and logic
6. Agent file access via MCP tools (read_document, update_document, search_documents)
7. Row Level Security (RLS) for database-level security enforcement
8. JWT-based authentication with auth.uid() for ownership validation
9. TailwindCSS + shadcn/ui for rapid UI development with full customization control
10. shadcn MCP + Claude for AI-powered component generation (30min vs 10hr development cycles)
11. Mobile-first component design with 44px minimum touch targets
12. Tailwind configuration and color system centralized in packages/ui
13. **Monorepo structure with npm workspaces: packages/ui, packages/shared, apps/web, apps/design-system, apps/api**
14. **Pure UI components in packages/ui - zero server dependencies (enforced by package.json)**
15. **All server logic self-contained in apps/api - business logic, Edge Functions, and migrations together**
16. **Design system (apps/design-system) isolated from server code - only imports from packages/ui and packages/shared**
17. **Smart components in apps/web/src/components/ handle data fetching, state, and business logic**
18. **Component workflow: shadcn CLI in design-system, auto-moved to packages/ui via script**
19. **Backend structure: apps/api/src/services (business logic), apps/api/src/functions (Edge Functions), apps/api/supabase (migrations)**
20. **Design iteration workflow: apps/design-system → Playwright MCP screenshots → approval → apps/web implementation**
21. **Two-layer design approach: Global design system (once) → Feature designs (per feature)**
22. **10 Design Levers framework for structured design feedback**

## Success Metrics

Performance and quality targets that MUST be met:

- 80%+ code sharing between web and future mobile platforms
- <300ms API response time for standard queries
- <10s for AI agent operations including RAG context retrieval
- 99.5% uptime
- User can upload document and start chatting within 60 seconds
- Context retrieval accuracy >85% (measured by user feedback on AI responses)
- Zero unauthorized data access (enforced by RLS)
- Real-time updates propagate to all devices within 100ms
- UI feature development: 30-45 minutes with shadcn workflow vs 6-8 hours manual
- Component generation: <5 minutes from shadcn add to packages/ui export
- Mobile touch targets: 100% compliance with 44x44px minimum
- Design consistency: All components use shared Tailwind config from packages/ui
- **Time-to-MVP: Core features (document upload + RAG chat + context persistence) functional within 7 days**
- **Iteration speed: Feature hypothesis → deployed validation in <3 days**
- **Package isolation: Zero accidental imports from apps/web to packages/ (TypeScript enforced)**
- **Design iteration: <3 rounds from initial design to approval per feature**
- **Design feedback quality: 80%+ of feedback uses Design Levers framework terminology**

## Anti-Patterns to Avoid

These patterns are FORBIDDEN:

- ❌ Logic in presentational components
- ❌ Direct Supabase calls in UI components (use container layer)
- ❌ Untyped API responses or database queries
- ❌ Missing loading/error states
- ❌ Unvalidated user inputs
- ❌ Missing RLS policies on tables with user data
- ❌ Desktop-first design decisions
- ❌ Monolithic components (keep components focused and composable)
- ❌ Polling for data updates (use Supabase Realtime subscriptions)
- ❌ Application-level security checks instead of RLS
- ❌ Using SERVICE_ROLE_KEY without manual ownership validation
- ❌ GraphQL layer (unnecessary complexity - Supabase provides what's needed)
- ❌ Separate WebSocket server (Supabase Realtime handles it)
- ❌ Storage-only document management (database enables search + real-time)
- ❌ Client-side only security (must be enforced at database level)
- ❌ Heavy component libraries (use shadcn/ui copy-paste approach instead)
- ❌ Building UI components from scratch (leverage shadcn/ui + MCP generation)
- ❌ Desktop hover states on mobile (use active states for touch feedback)
- ❌ Touch targets smaller than 44x44px (iOS/Android accessibility requirement)
- ❌ Inline styles or CSS-in-JS (use Tailwind utilities for consistency)
- ❌ **Premature abstraction (abstract only after Rule of Three: third occurrence)**
- ❌ **Building features "for the future" that aren't needed for MVP**
- ❌ **Perfect architecture over working software (ship first, refactor later)**
- ❌ **Scope creep: Adding "while we're at it" features mid-implementation**
- ❌ **Analysis paralysis: Debating architecture instead of building and testing**
- ❌ **Server dependencies in packages/ui (Supabase, Valtio, providers)**
- ❌ **Design system (apps/design-system) importing from apps/web (breaks isolation)**
- ❌ **Hard-coded values in UI components (use Tailwind classes from shared config)**
- ❌ **Running shadcn CLI directly in packages/ui (use script workflow instead)**
- ❌ **Implementing before visual design approval (design-first workflow)**
- ❌ **Vague design feedback (use 10 Design Levers framework)**
- ❌ **Skipping mobile viewport testing (both viewports required)**
- ❌ **Duplicating business logic across Edge Functions (centralize in apps/api/src/services)**
- ❌ **Splitting backend code across packages/ and apps/api (keep all server logic in apps/api)**
- ❌ **apps/api importing from packages/ui (violates boundaries - use packages/shared only)**
- ❌ **Placing Edge Functions in root supabase/ folder (use apps/api/src/functions)**

## Governance

### Amendment Procedure

Constitution amendments require:

1. Clear rationale for change documented in commit message
2. Impact analysis on existing codebase (automated where possible)
3. Update to all dependent templates and documentation
4. Version bump following semantic versioning (MAJOR for breaking changes, MINOR for additions, PATCH for clarifications)

### Versioning Policy

- MAJOR bump: Principle removals, incompatible governance changes
- MINOR bump: New principles added, material expansions
- PATCH bump: Clarifications, typos, non-semantic refinements

### Compliance Review

- Review architecture decisions against constitution during technical design
- Validate new features against principles before implementation
- Automated checks where possible (TypeScript strict mode, linting, RLS policies)
- Constitution review every quarter or when major technical pivots occur
- **MVP Scope Gate: All features MUST justify necessity for MVP before implementation begins**
- **Package Boundary Check: TypeScript MUST prevent server code imports in packages/ui**
- **Design Approval Gate: Visual designs MUST be approved before implementation begins**

All PRs/reviews MUST verify compliance with principles. Complexity introduced that violates principles MUST be justified with clear rationale and documented in plan.md Complexity Tracking section. Use [CLAUDE.md](../../CLAUDE.md) for runtime development guidance.

**Version**: 1.4.0 | **Ratified**: 2025-01-15 | **Last Amended**: 2025-10-21
