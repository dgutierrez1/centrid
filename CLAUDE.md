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
<!-- Last synced: 2025-11-10T05:57:39.204Z -->
<!-- To update: Edit doc files, then run: npm run sync-docs -->

| Pattern | Summary | File |
|---------|---------|------|
| Auth Token Store Pattern | Synchronous token cache eliminates 5ms async overhead per API call | [View](.specify/docs/frontend-token-store.md) |
| Backend Four-Layer Architecture | GraphQL Resolvers → Controllers → Services → Repositories for clean backend separation | [View](.specify/docs/backend-four-layer.md) |
| GraphQL Backend Integration (Pothos + Yoga) | Pothos schema builder with type-safe resolvers, DataLoaders, and GraphQL Yoga server | [View](.specify/docs/integration-graphql-backend.md) |
| GraphQL Client Integration (urql) | urql configuration with caching, SSR support, and custom hooks for Valtio state sync | [View](.specify/docs/integration-graphql-client.md) |
| GraphQL Client Pattern | urql-based GraphQL client with custom hooks for queries, mutations, and Valtio sync | [View](.specify/docs/frontend-api-client.md) |
| Local Supabase Development Pattern | Committed .env.local files enable zero-config local Supabase development | [View](.specify/docs/backend-local-supabase.md) |
| Pattern Name | One-line description for quick reference table | [View](.specify/docs/_template.md) |
| Real-time Sync with Supabase | Real-time subscriptions keep Valtio state synchronized with server | [View](.specify/docs/integration-realtime-sync.md) |
| Row-Level Security (RLS) Policies | Postgres RLS enforces user isolation at database level | [View](.specify/docs/data-rls-policies.md) |
| State Management with Valtio | Valtio proxy-based state with optimistic updates and real-time sync | [View](.specify/docs/frontend-state-management.md) |

<!-- END AUTO-GENERATED -->

**Updating Docs**: Edit files in `.specify/docs/`, then run `npm run sync-docs`

## Monorepo Structure

**Apps**:
- `apps/web/` - Main Next.js frontend (Pages Router)
- `apps/design-system/` - Component playground (isolated)
- `apps/api/` - Backend (Edge Functions + Services + Repositories + Supabase config)

**Packages**:
- `packages/ui/` - Pure UI components (SOURCE OF TRUTH, no server deps)
- `packages/shared/` - Shared types & utilities (frontend + backend)

**Import Rules**: apps/web → ui,shared | design-system → ui,shared | api → shared | ui → shared | ui ⚠️ NO Supabase/Valtio/apps

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
npm run type-check            # TypeScript check all workspaces
npm run lint                  # Lint all workspaces
```

### Supabase Development

**Zero-config local/remote switching**: Committed `.env.local` files point to localhost. Just start Supabase when you want local dev.

**How it works:**
- `.env` → Remote Supabase (default)
- `.env.local` → Local Supabase (overrides .env when present)
- If local Supabase running → uses localhost automatically
- If local Supabase NOT running → falls back to remote

**Workflow:**

```bash
# One-time: Start local Supabase (if you want local dev)
cd apps/api
supabase start                # Requires Docker

# Daily use: Just run dev (works with local or remote)
npm run dev

# Optional: Check local Supabase status
cd apps/api
supabase status               # Connection info
supabase stop                 # Stop local instance
```

**Local Supabase ports**: API (54321), Database (54322), Studio (54323)

### Component Workflow

```bash
./scripts/add-component.sh <name>   # Add shadcn component to packages/ui
# Then manually export from packages/ui/src/components/index.ts
```

**Never** run `shadcn add` directly in packages/ui - always use the script!

### Edge Functions

**Structure**: All Edge Function code lives in `apps/api/src/functions/` (single source of truth). Each function must be declared in `apps/api/supabase/config.toml` with a custom entrypoint and import map configuration.

**Important**: There is NO `apps/api/supabase/functions/` directory. Supabase CLI deploys functions from `src/functions/` using custom entrypoint configuration.

All Edge Function commands run from `apps/api/`:

```bash
cd apps/api
npm run deploy:functions              # Deploy all functions to remote
npm run deploy:function <name>        # Deploy single function to remote
supabase functions serve              # Serve functions locally
```

**Shared Package Access**: Edge Functions import from `@centrid/shared` via Deno import map (`apps/api/import_map.json`). Allows sharing types, schemas, and utilities without npm publishing.

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
2. Import from `@centrid/shared`: `import { schema } from '@centrid/shared/schemas'`
3. Add to `config.toml` (see pattern above)
4. Deploy: `npm run deploy:function my-function`

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

Run tests after implementation to verify functionality:

```bash
npm run web:dev                  # Start production app (required for tests)
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

**After failures**: Review test-report.md, fix issues, re-run `/speckit.test`

## Environment Configuration

### Backend Environment (`apps/api/.env`)

**Required**:

- `DATABASE_URL` - PostgreSQL connection string (Supabase Dashboard → Settings → Database)
  - Port 5432 (Session Mode): For `db:push` and dev
  - Port 6543 (Transaction Mode): For Edge Functions (set via Supabase Secrets)
  - URL-encode special chars (! = %21, @ = %40, # = %23)

### Frontend Environment (`apps/web/.env`)

**Required**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-side only)

**Optional**: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` (AI agents), `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_WEBHOOK_SECRET` (payments)

**Note**: `.env.local` overrides `.env` (not committed)

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
import { cn } from "@centrid/shared/utils";
import type { Document } from "@centrid/shared/types";
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

**API Client**: urql-based GraphQL client with auth injection, retry, and SSE streaming. See [frontend-api-client.md](.specify/docs/frontend-api-client.md)

**Document Processing**: Upload → Storage → Edge Function → Extract → Chunk → Search Vectors → Real-time update

**AI Agent Execution**: Request → pending → execute → context build → model selection → progress updates → results → usage log

## Do Not Touch

**Protected Files**:
- ❌ Database migrations (`apps/api/drizzle/migrations/`)
- ❌ Auto-generated types (`packages/shared/src/types/database.ts`)
- ❌ CLAUDE.md AUTO-GENERATED section (edit docs in `.specify/docs/`, run `npm run sync-docs`)

**Security-Critical**:
- ❌ RLS policies (defined in `schema.ts`), Edge Function auth middleware, environment handling

**When in doubt**: Ask before modifying migrations, config, auth, or RLS policies.

## Testing Local Changes

```bash
cd apps/api
supabase start               # Start local Supabase
supabase db reset            # Apply migrations
supabase gen types typescript # Generate types

cd ../..                     # Back to root
npm run dev                  # Start all dev servers
```

## Deployment

**Frontend** (`apps/web`): Vercel auto-deploy on git push.

**Backend** (`apps/api`):

```bash
npm run api:deploy              # Deploy all Edge Functions (from root, recommended)
cd apps/api && npm run db:push  # Push database schema changes
```

**Prerequisites**: Run `npm run type-check` before deploying. Ensure `import_map.json` committed and referenced in `config.toml`.

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
