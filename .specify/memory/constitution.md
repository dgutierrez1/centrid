<!--
Sync Impact Report:
- Version: 1.7.0 → 1.8.0
- Rationale: MINOR bump - Added Principle XVII (Backend Service Architecture). Establishes three-layer backend architecture (Edge Functions → Services → Repositories) with clear separation of concerns. Forbids business logic in Edge Functions, enforces reusable data access patterns, and prevents query duplication.
- Modified principles:
  - Principle X (Monorepo Architecture): Cross-referenced with Principle XVII for backend layer organization
  - Principle XIII (Clean Code & Maintainability): Cross-referenced with Principle XVII for reusability patterns
  - Key Architectural Decisions: Added decision #31 for backend three-layer architecture
  - Anti-Patterns: Added "Backend Architecture" section (5 new anti-patterns) forbidding inline queries, business logic in Edge Functions, and duplicated data access
  - Success Metrics: Added 3 new metrics for repository pattern adoption, service layer coverage, and query reusability
- Added sections:
  - Principle XVII: Backend Service Architecture (three-layer backend, repository pattern, service layer, middleware)
  - Backend Architecture anti-patterns (5 patterns including inline queries and mixed concerns)
  - Backend architecture metrics (repository adoption, service coverage, query reuse)
- Removed sections: None
- Templates status:
  ✅ plan-template.md: Constitution Check section compatible (gates apply to new principle)
  ✅ spec-template.md: Requirements sections support backend architecture requirements
  ✅ tasks-template.md: Task structure supports repository and service implementation tasks
- Follow-up TODOs:
  ✅ Update CLAUDE.md with summarized backend architecture guidance (2025-10-23)
  ⬜ Create example repository + service implementation in .analysis/ for reference
  ⬜ Consider scaffolding script for new Edge Functions with boilerplate
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

**Frontend Security Boundaries**

Frontend code MUST assume it is untrusted and hostile. Frontend MUST NOT contain sensitive business logic that could be bypassed. Frontend validation MUST be for UX only (instant feedback) - backend MUST re-validate all inputs. Frontend MUST NOT have access to SERVICE_ROLE_KEY or admin credentials. Frontend MUST use ANON_KEY which enforces RLS policies. API keys in frontend MUST be public-safe keys only (NEXT_PUBLIC_SUPABASE_ANON_KEY). Sensitive operations (payments, admin actions, cross-user operations) MUST be implemented in Edge Functions, never in frontend.

**Rationale**: Database-level security cannot be bypassed - more secure than application-level checks. RLS automatically filters all queries. Even direct database access respects policies. Security is enforced, not just checked. Frontend is inherently untrusted - any logic in frontend JavaScript can be read, modified, or bypassed by users. Defense-in-depth means frontend provides convenience, backend enforces security. Critical for user trust and data privacy. Works in conjunction with Principle XV (Least Privilege) to minimize access at all layers.

### IX. MVP-First Discipline

**Ruthless Scope Management**

All features MUST target the minimal viable implementation that validates the core hypothesis. Each feature MUST answer: "What is the simplest version that proves this works?" Features MUST be scoped to deliver value in days, not weeks. All architectural decisions MUST favor shipping speed over theoretical perfection. Complex abstractions MUST be deferred until patterns emerge from real usage (Rule of Three: abstract only after third occurrence). "Nice to have" features MUST be explicitly marked and deferred post-MVP.

**Database Schema Iteration (MVP Phase)**

For MVP, schema MUST be iterated in `apps/api/src/db/schema.ts` using Drizzle ORM. Schema changes MUST be pushed directly to remote database using `drizzle-kit push` (safe to drop/recreate). Migrations MUST be deferred until schema is stable post-MVP. All database operations MUST target remote Supabase (not local). Reusable deploy scripts MUST be created with migration support for future use.

**Rationale**: Centrid aims to solve the context loss problem for AI workflows - MVP validates this hypothesis as fast as possible. Over-engineering delays validation and wastes effort on features users may not need. Shipping early enables real user feedback which trumps theoretical architecture. Schema migrations add complexity during rapid iteration - direct push enables faster changes. The constitution author acknowledges a tendency to over-engineer; this principle provides explicit guardrails. Time-to-market is competitive advantage - complex solutions can be refactored after product-market fit is proven, but over-engineered MVPs never ship.

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
│   ├── repositories/      # Data access layer (database queries, type-safe wrappers)
│   ├── services/          # Business logic (RAG, document processing, AI orchestration)
│   ├── middleware/        # Reusable middleware (auth, validation, error handling)
│   ├── utils/             # Backend utilities (response formatting, error handling)
│   ├── lib/               # Shared backend libraries (Supabase client config, etc)
│   ├── db/                # Database utilities (push, drop, schema)
│   └── functions/         # Supabase Edge Functions (SINGLE SOURCE OF TRUTH)
│       ├── create-account/
│       │   └── index.ts
│       ├── update-profile/
│       │   └── index.ts
│       ├── delete-account/
│       │   └── index.ts
│       ├── process-document/
│       │   └── index.ts
│       ├── execute-ai-agent/
│       │   └── index.ts
│       └── handle-webhook/
│           └── index.ts
└── supabase/
    ├── config.toml        # Supabase config with custom entrypoints → ../src/functions/
    └── migrations/        # Database schema and migrations
```

**Edge Functions Deployment Structure**:
- **Source Location**: All Edge Function code MUST live in `apps/api/src/functions/[name]/index.ts` (single source of truth)
- **No Duplication**: There MUST NOT be a `apps/api/supabase/functions/` directory
- **Custom Entrypoints**: Each function MUST be declared in `apps/api/supabase/config.toml` with custom entrypoint pointing to `../src/functions/[name]/index.ts`
- **No Auto-Discovery**: Supabase does not support auto-discovery - each function must be explicitly declared in config.toml
- **Deployment Command**: `npm run deploy:functions` from `apps/api/` deploys all functions to remote Supabase

**Example config.toml function declaration**:
```toml
[functions.create-account]
entrypoint = '../src/functions/create-account/index.ts'

[functions.update-profile]
entrypoint = '../src/functions/update-profile/index.ts'
```

**Import Rules**:
- `apps/web` → MAY import from `packages/ui`, `packages/shared`
- `apps/design-system` → ONLY imports from `packages/ui`, `packages/shared` (enforced by package.json)
- `apps/api` → MAY import from `packages/shared` only
- `packages/ui` → MAY import from `packages/shared` only
- `packages/shared` → NO imports from other packages (foundation layer)

**Server Logic Placement** (ALL in `apps/api/`):
- Data access layer (database queries) → `apps/api/src/repositories/`
- Business logic shared across Edge Functions → `apps/api/src/services/`
- Reusable middleware (auth, validation) → `apps/api/src/middleware/`
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

### XII. Defense-in-Depth Security

**Layered Security Architecture**

Security MUST be implemented in multiple layers - frontend (UX convenience), Edge Functions (business logic enforcement), database (RLS policies), and infrastructure (Supabase Auth). Each layer MUST assume the outer layer can be compromised. Frontend validation MUST be duplicated in backend with same or stricter rules. Database policies MUST be the ultimate authority - all other layers are advisory. Secrets MUST never be exposed to frontend (use environment variables with NEXT_PUBLIC_ prefix only for public keys). Rate limiting MUST be implemented for sensitive operations. Authentication tokens MUST have appropriate expiration (JWT refresh flow). Audit logging MUST capture security-relevant events (auth, data access, admin actions).

**Input Validation & Sanitization**

All external inputs MUST be validated before processing. User-provided content MUST be sanitized before storage and display (XSS prevention). File uploads MUST validate file type (magic bytes, not extension), size limits, and content scanning. SQL injection MUST be prevented via parameterized queries (Supabase client handles this automatically). Command injection MUST be prevented by avoiding shell execution with user input. Path traversal MUST be prevented by validating file paths stay within allowed directories. Zod schemas MUST define strict validation rules for all API inputs.

**Attack Surface Minimization**

Public APIs MUST require authentication unless explicitly designed as public endpoints. Error messages MUST NOT leak sensitive information (stack traces, database details, file paths). CORS policies MUST be restrictive (allow only known origins). Dependencies MUST be regularly updated for security patches. Third-party code MUST be reviewed before integration. Debug/development features MUST be disabled in production. Environment-specific secrets MUST be isolated (dev vs production keys).

**Rationale**: Single-layer security is fragile - one bypass compromises the entire system. Defense-in-depth ensures that breaching one layer doesn't grant full access. Frontend is the most vulnerable layer (fully client-controlled), so it must only provide convenience. Database RLS is the most reliable layer since it cannot be bypassed even with direct database access. Proper input validation prevents injection attacks, XSS, and data corruption. Minimizing attack surface reduces the number of potential vulnerability points. Security is everyone's responsibility but must be enforced architecturally, not just culturally. Works in conjunction with Principle XV (Least Privilege) to create comprehensive security posture.

### XIII. Clean Code & Maintainability

**Code Quality Standards**

Code MUST be self-documenting through clear naming and structure. Functions MUST do one thing well (Single Responsibility Principle). Functions MUST be small (prefer <50 lines, max 100 lines). Cyclomatic complexity MUST be kept low (prefer <10 branches per function). Magic numbers and strings MUST be replaced with named constants. Comments MUST explain "why", not "what" (code explains "what"). Dead code MUST be removed immediately. Duplication MUST be eliminated after third occurrence (Rule of Three).

**Clean Architecture Principles**

Dependencies MUST flow inward (UI → Services → Data, never reverse). Business logic MUST be isolated from infrastructure (database, APIs, frameworks). Services MUST have clear contracts (interfaces/types) independent of implementation. Shared logic MUST live in reusable functions/modules, not copy-pasted. Configuration MUST be externalized (environment variables, config files). Hard-coded values MUST be avoided in business logic. Error handling MUST be consistent and predictable across the codebase.

**Maintainability Practices**

File organization MUST follow consistent patterns (feature-based or layer-based, but not mixed). Import statements MUST use path aliases (@/ or @centrid/*) for clarity. Naming conventions MUST be consistent (camelCase for functions/variables, PascalCase for components/types). TypeScript strict mode MUST be enabled with no 'any' types without justification. ESLint and Prettier MUST enforce consistent code style. Code reviews MUST check for clarity, simplicity, and maintainability. Refactoring MUST be done incrementally, not as large rewrites.

**Reusability First**

Shared utilities MUST live in `packages/shared/utils/`. Shared types MUST live in `packages/shared/types/`. Shared UI components MUST live in `packages/ui/components/`. Business logic used by multiple Edge Functions MUST live in `apps/api/src/services/`. Data access logic used by multiple services MUST live in `apps/api/src/repositories/`. Helper functions MUST be extracted when used 3+ times (Rule of Three). Generic solutions MUST be preferred over specific ones when complexity is similar. Reusable code MUST have clear, documented contracts (JSDoc for complex functions).

**Rationale**: Clean code reduces cognitive load, making the codebase easier to understand and modify. Maintainability determines long-term velocity - messy code slows development over time. Clear architecture prevents accidental coupling and makes refactoring safe. Reusability reduces duplication, bugs, and inconsistency. Following these practices pays dividends as the codebase grows. MVP-first doesn't mean messy code - it means simple, clear solutions over complex, "clever" ones. Good code is code that's easy to delete and replace when requirements change.

### XIV. RESTful API Design

**HTTP Semantics & Resource Modeling**

All Edge Functions that expose APIs MUST follow RESTful principles. Resources MUST be modeled as nouns (e.g., `/documents`, `/chats`, `/users`) not verbs. HTTP methods MUST be used correctly: GET (read), POST (create), PUT/PATCH (update), DELETE (remove). GET requests MUST be idempotent and safe (no side effects). POST/PUT/DELETE operations MUST be idempotent where possible. HTTP status codes MUST be used correctly: 200 (success), 201 (created), 204 (no content), 400 (client error), 401 (unauthorized), 403 (forbidden), 404 (not found), 422 (validation error), 500 (server error). Response bodies MUST use consistent JSON structure with clear success/error formats.

**Stateless Design**

API endpoints MUST be stateless - all necessary information MUST be included in each request. Server-side session state MUST NOT be relied upon for API calls. Authentication MUST use stateless JWT tokens. Request context MUST be self-contained (headers, query params, body). Pagination state MUST be cursor-based or offset-based, not server-stored session. This enables horizontal scaling and simplifies caching.

**API Contracts & Documentation**

All API endpoints MUST be documented with OpenAPI/Swagger specifications in `specs/[feature]/contracts/`. Request/response schemas MUST be defined using Zod and auto-generate TypeScript types. Breaking changes MUST be versioned (e.g., `/v1/documents`, `/v2/documents`). Backward compatibility MUST be maintained within a major version. Error responses MUST include machine-readable error codes and human-readable messages. API examples MUST be provided in documentation.

**Resource Hierarchy & Relationships**

Nested resources MUST follow logical hierarchies (e.g., `/users/{userId}/documents/{documentId}`). Sub-resources MUST be accessible both through parent (`/users/{id}/documents`) and independently (`/documents` with filtering). Relationships MUST be expressed through links (HATEOAS where beneficial). Collection endpoints MUST support filtering, sorting, and pagination. Query parameters MUST use consistent naming (e.g., `?sort=created_at&order=desc&limit=20`).

**Rationale**: RESTful design provides predictable, discoverable APIs that are easy to consume from web, mobile, and third-party clients. Correct HTTP semantics leverage existing infrastructure (caching, load balancing, monitoring). Stateless design enables horizontal scaling and reduces server complexity. Clear contracts reduce integration errors and enable automated testing. Consistent patterns reduce cognitive load for API consumers. Well-designed APIs are self-documenting and reduce support burden. This principle complements mobile-first strategy (Principle II) by ensuring APIs work seamlessly across all platforms.

### XV. Principle of Least Privilege

**Minimal Access by Default**

All code, services, and users MUST be granted the minimum permissions necessary to perform their function, and nothing more. Edge Functions MUST use ANON_KEY (RLS-enforced) by default and SERVICE_ROLE_KEY only when absolutely necessary with explicit justification. Database roles MUST be scoped to minimum required tables and operations (SELECT vs INSERT vs UPDATE vs DELETE). API keys MUST be scoped to specific operations (read-only, write-only, admin). User permissions MUST follow role-based access control (RBAC) with clearly defined roles (user, admin, service). Service accounts MUST have narrowly scoped credentials specific to their function.

**Time-Bounded Access**

Elevated permissions MUST be time-bounded wherever possible. JWT tokens MUST have appropriate expiration times (access token: 1 hour, refresh token: 30 days). Temporary admin access MUST expire automatically. Service role keys used in development MUST be rotated regularly. Session tokens MUST be invalidated on logout. One-time access tokens MUST be single-use and expire after short duration (e.g., password reset links: 1 hour).

**Privilege Escalation Controls**

Privilege escalation MUST require explicit approval flows. Admin operations MUST require re-authentication (password confirmation) even for logged-in users. Sensitive operations (account deletion, payment changes, data export) MUST have additional verification steps. Cross-user operations MUST be explicitly forbidden at RLS policy level. Service-to-service calls MUST use scoped service tokens, not user tokens. Audit logs MUST record all privilege escalations with context (who, what, when, why).

**Default Deny**

Access control MUST follow "default deny" - explicitly grant permissions rather than explicitly deny. RLS policies MUST be restrictive by default (no policy = no access). New Edge Functions MUST require authentication unless explicitly designed as public. New database tables MUST have RLS enabled from creation. API endpoints MUST require authentication by default. Frontend features MUST be hidden/disabled for unauthorized users (defense-in-depth with backend enforcement).

**Rationale**: Least privilege minimizes damage from compromised credentials, buggy code, or malicious insiders. Reducing permission scope limits blast radius of security incidents. Time-bounded access ensures credentials don't remain valid indefinitely after compromise. Privilege escalation controls prevent unauthorized elevation of access. Default deny prevents accidental exposure of sensitive data. This principle complements Zero-Trust Data Access (Principle VIII) and Defense-in-Depth Security (Principle XII) to create comprehensive access control. Least privilege is foundational security hygiene that prevents entire classes of vulnerabilities.

### XVI. Service Layer Architecture for Real-Time Apps

**Three-Layer Frontend Integration**

Frontend MUST use a three-layer architecture: (1) Service Layer (pure functions calling Edge Functions), (2) Custom Hooks (loading/error states, toast notifications, optimistic updates), (3) UI Components (presentational). Services MUST return `{ data?, error? }` with no UI concerns. Hooks MUST handle loading states, error toasts, and Valtio state updates. Components MUST receive data and callbacks via props with no direct API calls.

**Real-Time State Synchronization**

State management MUST use Valtio for reactive updates. Real-time subscriptions (FileSystemProvider, etc.) MUST listen to Supabase events and update Valtio state automatically. Custom hooks MUST perform optimistic updates to Valtio state for instant UI feedback, then replace with server response. Server-confirmed changes via real-time subscriptions MUST reconcile with optimistic updates. This ensures UI updates immediately (optimistic) and stays consistent (real-time).

**No React Query / SWR**

React Query and SWR MUST NOT be used in apps with real-time subscriptions. Caching libraries conflict with Supabase Realtime - they create dual state (cache + Valtio), cache invalidation complexity, and optimistic update synchronization issues. Real-time subscriptions handle data freshness automatically. Valtio is the single source of truth. Custom hooks provide loading/error states without caching overhead. This architecture is simpler, lighter, and purpose-built for real-time apps.

**Error Handling & User Feedback**

All API operations MUST show loading states during execution. Errors MUST display toast notifications (react-hot-toast) with actionable messages. Success operations MUST show confirmation toasts. Network errors MUST be retried automatically (configurable, typically 3 attempts with exponential backoff). Optimistic updates MUST rollback on error with user notification. This provides excellent UX without complex error boundaries or query retry logic.

**Rationale**: Traditional data-fetching libraries (React Query, SWR) are designed for RESTful APIs without real-time. Centrid uses Supabase Realtime for instant updates - caching conflicts with this model. Three-layer architecture separates concerns: services handle API calls, hooks handle UI states, components handle presentation. Optimistic updates + real-time sync gives instant feedback with guaranteed consistency. Custom hooks are lightweight, testable, and integrate perfectly with Valtio. This pattern is proven for real-time apps and avoids state duplication. See `.analysis/frontend-backend-architecture.md` for detailed comparison.

### XVII. Backend Service Architecture

**Three-Layer Backend Architecture**

Backend MUST use a three-layer architecture: (1) Edge Functions (HTTP routing, auth verification, request/response handling), (2) Service Layer (business logic, orchestration, validation), (3) Repository Layer (data access, database queries). Edge Functions MUST be thin - only handle HTTP concerns and delegate to services. Services MUST contain business logic and orchestrate multiple repositories. Repositories MUST encapsulate all database queries with type-safe interfaces. This separation enables testability, reusability, and maintainability.

**Repository Pattern for Data Access**

All database queries MUST be encapsulated in repository modules (`apps/api/src/repositories/`). Each repository MUST correspond to a database table or logical data entity (documents, folders, users). Repositories MUST provide reusable query methods (findById, findByUser, create, update, delete). Repositories MUST use Drizzle ORM for type-safe queries. Repositories MUST return typed results with consistent error handling. NO raw SQL queries in Edge Functions or services - all data access goes through repositories.

**Service Layer for Business Logic**

Business logic shared across multiple Edge Functions MUST live in service modules (`apps/api/src/services/`). Services MUST orchestrate multiple repositories and apply business rules. Services MUST handle validation, transformation, and complex operations. Services MUST be pure functions when possible (no side effects except database/API calls). Services MUST have clear, documented contracts with input/output types. Edge Functions MUST call services, NOT repositories directly (except for simple CRUD cases).

**Reusable Middleware**

Common Edge Function concerns MUST be extracted to middleware (`apps/api/src/middleware/`): auth verification, request validation, error handling, CORS. Middleware MUST be composable and reusable across Edge Functions. Auth middleware MUST extract user from JWT and verify ownership. Validation middleware MUST use Zod schemas from `@centrid/shared`. Error middleware MUST provide consistent error response formatting. This eliminates duplication and ensures consistency.

**Rationale**: Three-layer backend prevents mixing HTTP concerns with business logic and data access. Repository pattern eliminates query duplication - write once, use everywhere. Services enable complex business logic to be tested independently of HTTP layer. Middleware eliminates boilerplate code in Edge Functions. Clear separation makes code easier to understand, test, and refactor. This architecture scales from MVP (simple CRUD) to complex features (multi-step workflows, transactions) without rewrites. See Principle XIII (Clean Code) for reusability patterns and Principle X (Monorepo Architecture) for file organization.

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
23. **Defense-in-depth security: Frontend (UX) → Edge Functions (enforcement) → Database (RLS) → Infrastructure (Auth)**
24. **Input validation at all layers: Frontend (UX), Backend (enforcement), Database (constraints)**
25. **Clean architecture: Dependencies flow inward, business logic isolated from infrastructure**
26. **RESTful API design: Resource-based URLs, correct HTTP methods/status codes, stateless endpoints**
27. **Least privilege access: Minimal permissions by default, time-bounded access, explicit privilege escalation**
28. **Three-layer frontend: Service Layer (pure API calls) → Custom Hooks (loading/error/optimistic) → UI Components (presentational)**
29. **Real-time state sync: Valtio + Supabase Realtime, optimistic updates with server reconciliation, NO React Query/SWR**
30. **User feedback: Toast notifications (react-hot-toast), loading states, error rollback, automatic retries**
31. **Three-layer backend: Edge Functions (HTTP routing) → Services (business logic) → Repositories (data access)**

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
- **Security audits: Quarterly security reviews with vulnerability remediation within 7 days for critical, 30 days for high severity**
- **Code quality: Average cyclomatic complexity <8, function length <50 lines for 90%+ of functions**
- **Test coverage guidance: Critical paths (auth, payments, data access) must have integration tests, not a strict % target**
- **RESTful API compliance: 100% of API endpoints use correct HTTP methods and status codes**
- **API documentation: 100% of endpoints documented in OpenAPI spec with request/response schemas**
- **Least privilege compliance: 90%+ of Edge Functions use ANON_KEY, SERVICE_ROLE_KEY usage explicitly justified**
- **Access audit frequency: Monthly review of service account permissions, quarterly review of user role permissions**
- **Token expiration compliance: 100% of access tokens expire within 1 hour, refresh tokens within 30 days**
- **Service layer compliance: 100% of API calls go through service layer (no direct fetch in components)**
- **Loading state coverage: 100% of async operations show loading indicators**
- **Error toast coverage: 100% of failed operations show user-friendly error messages**
- **Optimistic update usage: 90%+ of mutations use optimistic updates for instant feedback**
- **Repository pattern adoption: 90%+ of database queries go through repository layer (no inline queries in Edge Functions)**
- **Service layer coverage: 80%+ of complex business logic lives in services (not Edge Functions)**
- **Query reusability: 70%+ of database queries are used by multiple Edge Functions (via repositories)**

## Anti-Patterns to Avoid

These patterns are FORBIDDEN:

### Architecture & Design
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

### MVP & Scope
- ❌ **Premature abstraction (abstract only after Rule of Three: third occurrence)**
- ❌ **Building features "for the future" that aren't needed for MVP**
- ❌ **Perfect architecture over working software (ship first, refactor later)**
- ❌ **Scope creep: Adding "while we're at it" features mid-implementation**
- ❌ **Analysis paralysis: Debating architecture instead of building and testing**

### Monorepo & Boundaries
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
- ❌ **Creating supabase/functions/ directory (duplicates src/functions/ - use custom entrypoints instead)**
- ❌ **Assuming Supabase auto-discovers functions (must explicitly declare each in config.toml)**

### Security
- ❌ **Trusting frontend validation alone (backend MUST re-validate)**
- ❌ **Exposing SERVICE_ROLE_KEY or sensitive secrets to frontend**
- ❌ **Implementing authorization logic in frontend (backend MUST enforce)**
- ❌ **Storing sensitive data in localStorage/sessionStorage without encryption**
- ❌ **Using user-provided input in SQL queries without parameterization**
- ❌ **Accepting file uploads without type/size/content validation**
- ❌ **Returning detailed error messages to users (leak stack traces, DB details)**
- ❌ **Permissive CORS policies (allow * in production)**
- ❌ **Missing rate limiting on sensitive operations (auth, payments)**
- ❌ **Hard-coding secrets in code (use environment variables)**
- ❌ **Skipping security audits (quarterly reviews required)**
- ❌ **Validating file type by extension only (check magic bytes)**
- ❌ **Building authentication from scratch (use Supabase Auth)**
- ❌ **Bypassing RLS by using SERVICE_ROLE_KEY for user operations**
- ❌ **Missing audit logs for security-relevant operations**

### Code Quality & Maintainability
- ❌ **Functions longer than 100 lines (prefer <50)**
- ❌ **High cyclomatic complexity (>10 branches per function)**
- ❌ **Magic numbers and strings (use named constants)**
- ❌ **Copy-pasted code (extract reusable functions after 3rd occurrence)**
- ❌ **Using 'any' type without justification**
- ❌ **Mixing feature-based and layer-based organization**
- ❌ **Comments explaining "what" instead of "why" (code should explain "what")**
- ❌ **Dead code or commented-out code in commits**
- ❌ **Inconsistent naming conventions**
- ❌ **Business logic coupled to framework/infrastructure details**
- ❌ **Large rewrites instead of incremental refactoring**
- ❌ **Missing JSDoc for complex/reusable functions**

### RESTful API Design
- ❌ **Using verbs in resource URLs (e.g., `/getDocuments`, `/createUser`)**
- ❌ **Using GET requests for operations with side effects (use POST/PUT/DELETE)**
- ❌ **Using POST for everything (RESTful APIs should use appropriate HTTP methods)**
- ❌ **Incorrect HTTP status codes (e.g., returning 200 for errors, 404 for validation failures)**
- ❌ **Inconsistent response formats across endpoints**
- ❌ **Server-side session state for API calls (must be stateless)**
- ❌ **Undocumented API endpoints (all must have OpenAPI specs)**
- ❌ **Breaking API changes without versioning**
- ❌ **Missing pagination on collection endpoints**
- ❌ **Returning entire collections without filtering/limiting (resource exhaustion)**

### Least Privilege Violations
- ❌ **Using SERVICE_ROLE_KEY by default (use ANON_KEY with RLS enforcement)**
- ❌ **Granting broad permissions when narrow scope would suffice**
- ❌ **Using admin credentials for regular operations**
- ❌ **Long-lived or non-expiring access tokens**
- ❌ **Sharing service account credentials across multiple services**
- ❌ **Granting write access when read-only would suffice**
- ❌ **Missing re-authentication for sensitive operations**
- ❌ **Allowing privilege escalation without audit logging**

### Service Layer & Data Fetching
- ❌ **Using React Query or SWR with Supabase Realtime (creates dual state + cache conflicts)**
- ❌ **Direct fetch calls in UI components (must go through service layer)**
- ❌ **Missing loading states for async operations**
- ❌ **Missing error toast notifications for failures**
- ❌ **No optimistic updates for user actions (poor perceived performance)**
- ❌ **Mixing service logic with UI logic in hooks**
- ❌ **Services handling UI concerns (toasts, loading states) instead of hooks**
- ❌ **Components subscribing directly to real-time events (use providers)**

### Backend Architecture
- ❌ **Inline database queries in Edge Functions (use repository layer)**
- ❌ **Business logic in Edge Functions (use service layer)**
- ❌ **Duplicated database queries across Edge Functions (extract to repositories)**
- ❌ **Auth/validation logic duplicated in every Edge Function (use middleware)**
- ❌ **Edge Functions calling other Edge Functions (use shared services instead)**

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
- **Task Validation Gate: All tasks.md MUST be validated via /speckit.verify-tasks before implementation begins to ensure completeness, pattern compliance, dependency order, and full requirement coverage**
- **Security Audit Gate: Quarterly security reviews MUST be completed with documented findings**
- **Code Review Gate: All PRs MUST be reviewed for code quality, security, and maintainability**
- **API Design Review: All new Edge Functions MUST be reviewed for RESTful compliance**
- **Least Privilege Audit: Monthly review of SERVICE_ROLE_KEY usage, quarterly review of all service account permissions**
- **Architecture Review: All new Edge Functions MUST be reviewed for proper layering (repositories → services → functions)**

All PRs/reviews MUST verify compliance with principles. Complexity introduced that violates principles MUST be justified with clear rationale and documented in plan.md Complexity Tracking section. Use [CLAUDE.md](../../CLAUDE.md) for runtime development guidance.

**Version**: 1.8.0 | **Ratified**: 2025-01-15 | **Last Amended**: 2025-10-23
