# CLAUDE.md

Development guide for Claude Code working with Centrid.

## Project Overview

Centrid solves the context loss problem in AI chat applications by maintaining a **persistent knowledge graph**. Upload documents once, use them across all conversations forever.

**MVP Target**: Core features (document upload + RAG chat + context persistence) functional within 7 days.

**Tech Stack**: Next.js 14 (Pages Router), React 18, TypeScript, Supabase (PostgreSQL + Edge Functions + Auth + Storage), Valtio, Tailwind CSS

**Critical Principle**: MVP-first discipline. Scope features to deliver value in days, not weeks. Abstract only after third occurrence (Rule of Three).

**File Creation Policy**:

- DO NOT create reports, summaries, or test documentation unless explicitly requested
- DO NOT take screenshots or save artifacts unless explicitly requested
- Clean up temporary test files immediately after verification
- Prefer verbal summaries over written documents
- `/speckit` commands are workflow automation tools that generate files by design - avoid unless formal verification is needed
- When in doubt: Just make the code change, don't document it

## Pattern Quick Reference

**Before implementing features, check these core patterns to avoid reinventing solutions.**

Claude can read pattern files on-demand for full details. Quick summaries below:

<!-- AUTO-GENERATED: DO NOT EDIT -->
<!-- Source: .specify/docs/ -->
<!-- Last synced: 2025-11-12T00:16:46.216Z -->
<!-- To update: Edit doc files, then run: npm run sync-docs -->

| Pattern | What | Summary | File |
|---------|------|---------|------|
| Auth Token Store Pattern | Every API call was doing `await supabase.auth.getSession()` = 5ms latency overhead per request. | Synchronous token cache eliminates 5ms async overhead per API call | [View](.specify/docs/frontend-token-store.md) |
| GraphQL Backend Architecture | Backend uses Pothos GraphQL schema builder with four-layer separation: Resolvers (field resolution) → Controllers (request/response mapping) → Services (business logic) → Repositories (data access). | Pothos schema builder with four-layer separation (Resolvers → Controllers → Services → Repositories) | [View](.specify/docs/backend-graphql-architecture.md) |
| GraphQL Frontend Client (urql) | All frontend API calls use urql GraphQL client with custom hooks for type-safe queries and mutations synchronized with Valtio state. | urql client with custom hooks for type-safe queries, mutations, optimistic updates, and Valtio sync | [View](.specify/docs/frontend-graphql-client.md) |
| GraphQL Schema Design Pattern | GraphQL schema exposes database tables as types with exact field matching—no computed fields or nested relations. | GraphQL types mirror database schema 1:1 for type unification across queries and realtime | [View](.specify/docs/data-graphql-schema-design.md) |
| Pattern Name | [1 sentence describing what this pattern is] | One-line description for quick reference table | [View](.specify/docs/_template.md) |
| Real-time Sync with Supabase | Supabase realtime subscriptions using GraphQL types for type-safe database change notifications. | Real-time subscriptions keep Valtio state synchronized with server | [View](.specify/docs/integration-realtime-sync.md) |
| Remote Database Debugging Scripts | Command-line tools that query remote Supabase databases and logs using SQL-like JSON queries and flexible filtering | Standalone TypeScript scripts for querying remote database and API logs during development | [View](.specify/docs/backend-remote-debugging-tools.md) |
| Remote-First Development Pattern | Remote Supabase instance as the primary development target with seamless type generation and edge function deployment for testing. | Remote Supabase as default for type generation, edge function testing, and zero-config workflows | [View](.specify/docs/backend-remote-first-development.md) |
| Row-Level Security (RLS) Policies | All database tables use PostgreSQL Row-Level Security (RLS) to enforce user isolation at the database level. | Postgres RLS enforces user isolation at database level | [View](.specify/docs/data-rls-policies.md) |
| State Management with Valtio | Real-time subscriptions already keep data fresh. | Valtio proxy-based state with optimistic updates and real-time sync | [View](.specify/docs/frontend-state-management.md) |
| Type Generation Pattern | Backend uses Drizzle-inferred types from `db/types.ts`, frontend uses GraphQL Codegen types from `@/types/graphql` | Drizzle-inferred types for backend, GraphQL Codegen types for frontend—never redeclare | [View](.specify/docs/data-type-generation.md) |
| Validation Workflow Pattern | Three-layer validation architecture using Zod for frontend forms, GraphQL schema for API contracts, and database constraints for final enforcement. | Three-layer validation with GraphQL as source of truth, no duplicate Zod schemas | [View](.specify/docs/data-validation-workflow.md) |

<!-- END AUTO-GENERATED -->

**Updating Docs**: Edit files in `.specify/docs/`, then run `npm run sync-docs`

## Monorepo Structure

**Apps**:
- `apps/web/` - Main Next.js frontend (Pages Router)
- `apps/design-system/` - Component playground (isolated)
- `apps/api/` - Backend (Edge Functions + Services + Repositories + Supabase config)

**Packages**:
- `packages/ui/` - Pure UI components (SOURCE OF TRUTH, no server deps)

**Import Rules**: apps/web → ui | design-system → ui | ui ⚠️ NO Supabase/Valtio/apps

**Component Placement**: Pure UI (no server deps) → packages/ui | Business logic → apps/web/src/components | Backend → apps/api/src/services

**Backend Architecture**: Edge Functions (thin handlers) → Services (business logic) → Repositories (Drizzle ORM). Edge Functions MUST NOT contain business logic or inline queries.

## Development Commands

### Local Development

```bash
npm install                    # Install all workspace dependencies
npm run dev                    # Start all apps in parallel
npm run web:dev               # Start main app (http://localhost:3000)
npm run design:dev            # Start design system (http://localhost:3001)
npm run build                 # Build all apps
npm run validate              # Type-check + lint all workspaces
npm run codegen               # Generate GraphQL types from schema
npm run codegen:watch         # Watch mode for GraphQL codegen
```

### Supabase Development

**Remote-First Development**: Use remote Supabase for all development unless you have a specific need for local (offline work, testing destructive migrations).

**Why Remote?**
- ✅ Automatic type generation from production schema
- ✅ Realistic edge function testing (deploy to remote, test with frontend)
- ✅ No Docker or port conflicts
- ✅ Consistent environment across team
- ✅ RLS policies work correctly

**Default Workflow (Remote)**:

```bash
npm run dev                    # Start all apps (uses remote by default)
npm run codegen               # Generate GraphQL types from remote schema
npm run deploy:function api   # Deploy edge function to remote for testing
```

**Type Generation After Schema Changes**:

```bash
npm run db:push               # Push schema changes to remote
npm run codegen               # Regenerate types from updated schema
```

**Local Development (Rarely Needed)**:

Local Supabase exists for edge cases but adds Docker complexity. Only use if:
- You're offline and need to continue development
- Testing destructive migrations before running on remote

```bash
# One-time setup (requires Docker)
cd apps/api && supabase start
cd ../.. && npm run dev:local

# Check status or stop
cd apps/api
supabase status               # Connection info
supabase stop                 # Stop local instance
```

**Available Commands**:

Note: Local commands exist but are rarely needed - remote is sufficient for 95% of workflows.

```bash
# Development (use remote by default)
npm run dev              # Remote (recommended)
npm run dev:local        # Local (rarely needed)

# Database Operations (use remote for type generation)
npm run db:push          # Remote (recommended)
npm run db:push:local    # Local (rarely needed)
npm run db:drop          # Remote
npm run db:drop:local    # Local
npm run db:query         # Remote
npm run db:query:local   # Local

# Testing (use remote for accurate results)
npm run test             # Remote (recommended)
npm run test:local       # Local (rarely needed)
npm run test:watch       # Remote
npm run test:watch:local # Local
```

**Remote-only commands** (no `:local` variant):
- `deploy*` - Deploy to production
- `supabase:start/stop/status` - Already local by default

**Environment Files**:
- `apps/web/.env.remote` - Remote Supabase config (committed, default)
- `apps/api/.env.remote` - Remote database config (committed, default)
- `apps/web/.env.local` - Optional local Supabase config (committed, rarely used)
- `apps/api/.env.local` - Optional local database config (committed, rarely used)

### Debugging Tools

**Database queries** (`npm run db:query`): JSON-based queries with SQL-like operators. Auto-masks sensitive fields.

```bash
npm run db:query '{"table":"threads","where":{"userId":{"eq":"abc-123"}}}'
npm run db:query '{"table":"agent_requests","where":{"status":{"in":["failed","pending"]}},"orderBy":{"createdAt":"desc"}}'
```

**Operators**: eq, ne, gt, gte, lt, lte, like, ilike, in, notIn, isNull, isNotNull

**Log queries** (`npm run logs`): Remote Edge Function logs with filtering. Merges HTTP + console logs.

```bash
npm run logs                                    # Last hour
npm run logs -- --hours=2 --errors             # Errors only
npm run logs -- --search="abc-123" --route="/api/threads"
```

See [backend-remote-debugging-tools.md](.specify/docs/backend-remote-debugging-tools.md) for full examples.

### Component Workflow

```bash
./scripts/add-component.sh <name>   # Add shadcn component to packages/ui
# Then manually export from packages/ui/src/components/index.ts
```

**Never** run `shadcn add` directly in packages/ui - always use the script!

### Edge Functions

**Structure**: All Edge Function code lives in `apps/api/src/functions/` (single source of truth). Each function must be declared in `apps/api/supabase/config.toml` with a custom entrypoint and import map configuration.

**Important**: There is NO `apps/api/supabase/functions/` directory. Supabase CLI deploys functions from `src/functions/` using custom entrypoint configuration.

**Testing Workflow (Deploy to Remote)**:

Edge functions should be deployed to remote for testing, not run locally. This ensures accurate testing with the real Deno runtime, environment variables, and secrets.

```bash
# Iterative development workflow (from root)
npm run deploy:function api           # Deploy to remote for testing
# Test with frontend at http://localhost:3000

# Or deploy all functions
cd apps/api
npm run deploy:functions              # Deploy all functions to remote
```

**Local Serving (Rarely Needed)**:

```bash
cd apps/api
supabase functions serve              # Serve functions locally (not recommended)
```

**Configuration** (`apps/api/supabase/config.toml`):

```toml
[edge_runtime]
enabled = true
policy = "per_worker"

# Each function must be declared with custom entrypoint and import_map
[functions.my-function]
entrypoint = '../src/functions/my-function/index.ts'
import_map = '../import_map.json'
# (Repeat pattern for all functions)
```

**Creating new Edge Functions**:

1. Create directory `apps/api/src/functions/my-function/` with `index.ts` (Deno.serve handler)
2. Add to `config.toml` (see pattern above)
3. Deploy and test: `npm run deploy:function my-function` (test with frontend)

**Note**: Functions must be explicitly declared in `config.toml` (no auto-discovery). Import map is auto-used during deployment.

### Documentation Workflow

**Pattern Management** (Single Source of Truth):

All implementation documentation is stored in `.specify/docs/` as markdown files. The quick reference table in CLAUDE.md is auto-generated.

**Creating Patterns**:

Use `/speckit.pattern [file]` to extract from docs/code or create from scratch (interactive). Auto-suggests pattern name, extracts What/Why/How/Rules, shows diff if exists.

**Manual Workflow**:

1. Create `.specify/docs/[name].md` following template (see `.specify/docs/_template.md`)
2. Run `npm run sync-docs` to update CLAUDE.md
3. Commit both files together

**Rules**: Run `npm run sync-docs` after doc changes. Keep docs concise (1 sentence for What/Why). Never edit AUTO-GENERATED section manually.

### /speckit Workflow Commands

Claude Code has access to `/speckit` slash commands for feature development and design iteration:

- `/speckit.pattern` - Extract or create architectural patterns (from docs/code or scratch)
- `/speckit.specify` - Create/update feature specifications
- `/speckit.plan` - Generate implementation plans
- `/speckit.tasks` - Generate dependency-ordered task lists
- `/speckit.verify-tasks` - Validate tasks before implementation (completeness, patterns, coverage)
- `/speckit.implement` - Execute implementation from tasks.md
- `/speckit.test` - Run API and E2E tests to verify implementation (parallel agents)
- `/speckit.design` - Design feature UI in design-system app
- `/speckit.design-system` - Create/update global design system
- `/speckit.clarify` - Ask targeted clarification questions
- `/speckit.analyze` - Cross-artifact consistency analysis

See [.specify/design-system/SETUP.md](.specify/design-system/SETUP.md) for design workflow details.

### Testing Workflow

Run tests after implementation to verify functionality. Tests run against remote Supabase for realistic validation.

```bash
npm run web:dev                  # Start production app (uses remote, required for tests)
/speckit.test                    # Run API + E2E tests (parallel agents)
/speckit.test api-only           # Run only API tests
/speckit.test e2e-only           # Run only E2E tests
/speckit.test AC-001             # Run specific acceptance criterion
```

**Test Process**:

1. `/speckit.test` extracts test scenarios from spec.md + ux.md + plan.md
2. Spawns parallel test agents: API tests (fetch) + E2E tests (browser MCP)
3. API tests verify contracts from plan.md (~1-2min)
4. E2E tests verify acceptance criteria from spec.md (~5-10min)
5. Generates unified test-report.md with both results

**Test Status**:

- ✅ PASS (≥90%): Ready for production
- ⚠️ PARTIAL (70-89%): Fix issues before deploy
- 🔴 FAIL (<70%): Not ready

**Note**: Tests run against remote Supabase (not local). Deploy edge functions to remote before testing.

**After failures**: Review test-report.md, fix issues, re-run `/speckit.test`

## Environment Configuration

### Backend Environment (`apps/api/.env`)

**Required**:

- `DATABASE_URL` - PostgreSQL connection string (Supabase Dashboard → Settings → Database)
  - Port 5432 (Session Mode): For `db:push` and dev
  - Port 6543 (Transaction Mode): For Edge Functions (set via Supabase Secrets)
  - URL-encode special chars (! = %21, @ = %40, # = %23)

**Environment Files**:
- `apps/api/.env.remote` - Remote database config (committed, used by default)
- `apps/api/.env.local` - Optional local database config (committed, rarely used)

### Frontend Environment (`apps/web/.env`)

**Required**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-side only)

**Optional**: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` (AI agents), `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_WEBHOOK_SECRET` (payments)

**Environment Files**:
- `apps/web/.env.remote` - Remote Supabase config (committed, used by default)
- `apps/web/.env.local` - Optional local overrides (NOT committed, for personal dev config only)

**Note**: For apps/web, `.env.local` is NOT committed and overrides `.env` (Next.js standard). For apps/api, both `.env.remote` and `.env.local` are committed for explicit remote/local switching.

## Database Schema

Defined in `apps/api/src/db/schema.ts` using **Drizzle ORM**:

**Core Tables**:

- `user_profiles` - Extended user data (plan, usage_count, subscription_status)
- `documents` - File metadata with full-text search vectors
- `document_chunks` - Text segments for RAG context retrieval
- `agent_requests` - AI agent execution tracking
- `agent_sessions` - Multi-turn conversation management
- `usage_events` - Usage tracking for billing

**Schema Features**: Type-safe Drizzle ORM, automatic `tsvector` for full-text search, Row Level Security (RLS), automatic `updated_at` triggers, auto user profile creation, custom `tsvector` type, all SQL (triggers, RLS, CASCADE foreign keys) in `schema.ts` exports

**Database Commands (MVP - Remote Only)**:

```bash
cd apps/api
npm run db:drop            # Drop all tables (MVP iteration only)
npm run db:push            # Push schema + apply triggers/RLS/foreign keys (all-in-one)
npm run deploy:functions   # Deploy all Edge Functions to remote
```

**MVP Approach**: Schema lives in `apps/api/src/db/schema.ts`. Changes pushed directly to remote Supabase using Drizzle (`drizzle-kit push --force`). Safe to drop/recreate during MVP. Migrations deferred until post-MVP. Always target remote database (not local).

**AI Agents**:

Context: Up to 20 document chunks per request
Usage limits: Free (100/mo), Pro (1000/mo), Enterprise (10000/mo)

## TypeScript Path Aliases

Configured in `tsconfig.json`:

```typescript
// In apps/web
import { Component } from "@/components/ui/Component";
import { supabase } from "@/lib/supabase";
import { appState } from "@/lib/state";
import type { Database } from "@/types/database.types";

// Shared packages (works in all apps)
import { Button, Card } from "@centrid/ui/components";
```

## Design System Quick Reference

All apps use the **Coral Theme** from `packages/ui`:

```tsx
import { Button, Card, Input, SimpleBarChart } from "@centrid/ui/components";

<Card className="p-6">
  <Input className="mb-4" />
  <Button className="bg-primary-600">Submit</Button>
</Card>;
```

**Color Classes**: `bg-primary-600` (#ff4d4d coral), `text-success-500` (#34c759), `text-warning-500` (#ff9f0a), `text-error-500` (#ff3b30)

**Typography**: `text-4xl` (36px), `text-2xl` (24px), `text-base` (16px), `text-sm` (14px)

**Spacing**: `p-6` (24px), `gap-4` (16px), `mb-8` (32px)

Full design tokens: `.specify/design-system/tokens.md`

## Design Iteration Workflow

Use `apps/design-system` to design and iterate on UI before implementing in `apps/web`.

**Two-Layer Approach:**

1. **Global Design System** (`/speckit.design-system`) - Run once at project start to establish colors, typography, spacing, components
2. **Feature-Specific Design** (`/speckit.design`) - Run per feature to design screens/interactions using the global system

### Design Loop

1. Create component in `apps/design-system/components/[Feature].tsx`
2. Add to showcase in `apps/design-system/pages/index.tsx`
3. Run `npm run design:dev` → http://localhost:3001
4. Screenshot with Playwright MCP (mobile + desktop)
5. Get feedback → edit → auto-reload → re-screenshot
6. Approve → implement in `apps/web`

### Browser Automation with MCP

**Playwright Contexts MCP** (`.specify/mcp-servers/playwright-contexts/`):

- Parallel browser contexts for simultaneous testing (7-10x faster)
- Full Playwright API (navigate, click, type, screenshot, evaluate)
- Sub-agents run different flows independently

**Standard Viewports**: Mobile (375×812), Desktop (1440×900)

**Screenshots**: Save to `apps/design-system/public/screenshots/[feature-name]/` with naming pattern: `[viewport]-[state].png` (e.g., `mobile-default.png`, `desktop-hover.png`)

### Providing Design Feedback

**10 Design Levers** (use these when iterating):

1. **Visual Hierarchy** - Is the primary action obvious?
2. **Consistency** - Do similar things look similar?
3. **Information Density** - Right amount of info?
4. **Color with Purpose** - Every color means something?
5. **Typography Hierarchy** - Scannable text structure?
6. **Spacing Rhythm** - Consistent, mathematical spacing?
7. **Feedback & Affordance** - Interactivity obvious?
8. **Mobile-First Responsive** - Designed for constraints first?
9. **Accessibility** - Works for everyone?
10. **States** - Loading, error, empty states designed?

**Example feedback:**

- "Visual hierarchy: Make submit button more prominent"
- "Spacing: Feels cramped, increase gap between sections"
- "Accessibility: Focus state hard to see, needs stronger contrast"
- "States: Add loading spinner for AI response"

## Key Implementation Patterns

See [.specify/docs/](.specify/docs/) for detailed code examples.

**Frontend-Backend Integration**: UI → Hook → Service → Edge Function (optimistic updates + real-time reconciliation)

**Real-time Subscriptions**: Supabase subscriptions keep Valtio state synchronized. See [integration-realtime-sync.md](.specify/docs/integration-realtime-sync.md)

**API Client**: urql-based GraphQL client with auth injection, retry, and SSE streaming. See [frontend-graphql-client.md](.specify/docs/frontend-graphql-client.md)

**Document Processing**: Upload → Storage → Edge Function → Extract → Chunk → Search Vectors → Real-time update

**AI Agent Execution**: Request → pending → execute → context build → model selection → progress updates → results → usage log

## Do Not Touch

**Protected Files**:
- ❌ Database migrations (`apps/api/drizzle/migrations/`)
- ❌ Auto-generated types (`apps/web/src/types/graphql.ts`)
- ❌ CLAUDE.md AUTO-GENERATED section (edit docs in `.specify/docs/`, run `npm run sync-docs`)

**Security-Critical**:
- ❌ RLS policies (defined in `schema.ts`), Edge Function auth middleware, environment handling

**When in doubt**: Ask before modifying migrations, config, auth, or RLS policies.

## Testing Local Changes

```bash
cd apps/api
supabase start               # Start local Supabase
supabase db reset            # Apply migrations

cd ../..                     # Back to root
npm run codegen              # Generate GraphQL types
npm run dev                  # Start all dev servers
```

## Deployment

**Frontend** (`apps/web`): Vercel auto-deploy on git push.

**Backend** (`apps/api`):

```bash
npm run api:deploy              # Deploy all Edge Functions (from root, recommended)
cd apps/api && npm run db:push  # Push database schema changes
```

**Prerequisites**: Run `npm run validate` before deploying. Ensure `import_map.json` committed and referenced in `config.toml`.

## MVP Scope Guardrails

Before implementing any feature:

1. **Necessity**: Required to prove core hypothesis?
2. **Complexity**: Can this be simpler? Minimal version?
3. **Timeline**: Completable in days (not weeks)?
4. **Abstraction**: Premature? Wait for Rule of Three
5. **Scope Creep**: "While we're at it" feature? Defer!

**MVP Core Features**:

- Document upload (Markdown, Text, PDF)
- Vector embeddings (pgvector)
- RAG chat with context retrieval
- Multi-chat/thread support
- Real-time updates
- Basic auth (email/password)

**Deferred Post-MVP**:

- Advanced formats (DOCX, Excel)
- Social auth (Google, GitHub)
- Complex billing
- Multi-user collaboration
- Advanced analytics
- Document versioning

## Performance Targets

- Search: <300ms (tsvector with GiN indexes)
- AI operations: <10s
- Real-time propagation: <100ms
- Document upload to chat: <60s

## Common Pitfalls

1. **Valtio Maps**: Use objects with `state.items[id]`, not `Map.get()` (reactivity breaks)
2. **Fast async ops**: Add 100ms delay for UI feedback (loading states)
3. **Docs table**: Auto-generated - edit `.specify/docs/`, run `npm run sync-docs`
4. **Edge Functions**: Must declare in `config.toml` (no auto-discovery)
5. **Local Supabase**: Use `npm run dev:local` (auto-generates `.env.local`)
6. **Import paths**: `@/` for apps/web, `@centrid/` for packages
7. **Component placement**: Pure UI → packages/ui (NO Supabase/Valtio imports)

---

**Remember**: Ship first, refactor later. MVP-first discipline over perfect architecture.

## Constitution Summary

See [.specify/memory/constitution.md](.specify/memory/constitution.md) for complete project principles.
