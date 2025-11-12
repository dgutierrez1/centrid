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

Claude can read pattern files on-demand for full details or use pattern loading commands for domain-specific context.

<!-- AUTO-GENERATED: DO NOT EDIT -->
<!-- Source: .specify/docs/ -->
<!-- Last synced: 2025-11-12T16:40:24.624Z -->
<!-- To update: Edit doc files, then run: npm run sync-docs -->

| Pattern | What | Summary | File |
|---------|------|---------|------|
| Auth Token Store Pattern | Every API call was doing `await supabase.auth.getSession()` = 5ms latency overhead per request. | Synchronous token cache eliminates 5ms async overhead per API call | [View](.specify/docs/frontend-token-store.md) |
| Database Schema Pattern | Database schema defined in `apps/api/src/db/schema.ts` using Drizzle ORM with MVP-first approach—changes pushed directly to remote Supabase without migrations during MVP phase. | Drizzle ORM schema with MVP-first approach and remote-only push workflow | [View](.specify/docs/data-database-schema.md) |
| Design Iteration Workflow | Use `apps/design-system` to design and iterate on UI before implementing in `apps/web`, with Playwright MCP for automated screenshot generation and parallel browser testing. | Design-first workflow using design-system app with Playwright automation for rapid iteration | [View](.specify/docs/design-iteration-workflow.md) |
| Edge Functions Pattern | All Edge Function code lives in `apps/api/src/functions/` (single source of truth). Each function must be declared in `apps/api/supabase/config.toml` with a custom entrypoint and import map configuration. | Deploy-to-remote workflow for Supabase Edge Functions with custom entrypoint configuration | [View](.specify/docs/backend-edge-functions.md) |
| Environment Configuration Pattern | Remote-first environment configuration with explicit `.env.remote` (committed) and `.env.local` (optional, rarely used) files for both backend (`apps/api`) and frontend (`apps/web`). | Remote-first environment files with explicit .env.remote and .env.local for backend and frontend | [View](.specify/docs/devops-environment-configuration.md) |
| GraphQL Backend Architecture | Backend uses Pothos GraphQL schema builder with four-layer separation: Resolvers (field resolution) → Controllers (request/response mapping) → Services (business logic) → Repositories (data access). | Pothos schema builder with four-layer separation (Resolvers → Controllers → Services → Repositories) | [View](.specify/docs/backend-graphql-architecture.md) |
| GraphQL Frontend Client (urql) | All frontend API calls use urql GraphQL client with custom hooks for type-safe queries and mutations synchronized with Valtio state. | urql client with custom hooks for type-safe queries, mutations, optimistic updates, and Valtio sync | [View](.specify/docs/frontend-graphql-client.md) |
| GraphQL Schema Design Pattern | GraphQL schema exposes database tables as types with exact field matching—no computed fields or nested relations. | GraphQL types mirror database schema 1:1 for type unification across queries and realtime | [View](.specify/docs/data-graphql-schema-design.md) |
| Local Development Commands | npm scripts for starting dev servers, building apps, type-checking, code generation, and managing components. | npm scripts for dev servers, builds, validation, and component management | [View](.specify/docs/devops-local-development-commands.md) |
| Monorepo Structure Pattern | Turborepo monorepo with three apps and one shared UI package, enforcing strict import boundaries to prevent circular dependencies and maintain clean architecture. | Turborepo workspace with strict import boundaries and component placement rules | [View](.specify/docs/frontend-monorepo-structure.md) |
| MVP Scope Guardrails | Five-question checklist to evaluate feature necessity before implementation, ensuring MVP-first discipline and preventing scope creep. | Five-question checklist to prevent scope creep and maintain MVP-first discipline | [View](.specify/docs/project-mvp-guardrails.md) |
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

## Pattern Loading Commands

Load domain-specific patterns to reduce context:

```bash
# Load frontend patterns only
.specify/scripts/bash/load-patterns.sh --domain=frontend --priority=core

# Load backend patterns only
.specify/scripts/bash/load-patterns.sh --domain=backend

# Load data patterns only
.specify/scripts/bash/load-patterns.sh --domain=data --priority=core

# Load all patterns
.specify/scripts/bash/load-patterns.sh --all
```

**Quick Commands**:
- `/frontend.pattern` - Load frontend patterns (token-store, graphql-client, state-management)
- `/backend.pattern` - Load backend patterns (graphql-architecture, edge-functions, repositories)
- `/data.pattern` - Load data patterns (schema-design, type-generation, RLS, validation)

## Architecture Quick Reference

### Monorepo Structure

```
apps/web/           - Main Next.js app (can import from packages/ui)
apps/design-system/ - Component playground (can import from packages/ui)
apps/api/           - Backend (Edge Functions + Services + Repositories)
packages/ui/        - Pure UI components (SOURCE OF TRUTH - NO Supabase/Valtio imports)
```

**Critical Import Rules**:
- ✅ `apps/web` → `packages/ui` (allowed)
- ✅ `apps/design-system` → `packages/ui` (allowed)
- ❌ `packages/ui` → Supabase/Valtio/apps (FORBIDDEN - breaks reusability)

See [frontend-monorepo-structure.md](.specify/docs/frontend-monorepo-structure.md) for component placement rules.

### Type Generation

**Workflow**: After schema changes → `npm run db:push` → `npm run codegen`

**Type Sources**:
- Backend: Import from `../db/types.js` (Drizzle-inferred)
- Frontend: Import from `@/types/graphql` (GraphQL Codegen)

**Rules**:
- ✅ Backend imports from `../db/types.js`
- ✅ Frontend imports from `@/types/graphql`
- ❌ NEVER manually redeclare types that exist in generated sources

See [data-type-generation.md](.specify/docs/data-type-generation.md) for type flow architecture.

### Database Schema (MVP - Remote Only)

**Essential Commands**:
```bash
cd apps/api
npm run db:drop     # Drop all tables (safe during MVP)
npm run db:push     # Push schema + RLS + triggers (all-in-one)
npm run codegen     # Regenerate types after schema changes
```

**Rules**:
- ✅ Schema lives in `apps/api/src/db/schema.ts`
- ✅ Push directly to remote during MVP (no migrations yet)
- ✅ Safe to `db:drop` during MVP iteration
- ❌ DON'T target local database (always remote)

See [data-database-schema.md](.specify/docs/data-database-schema.md) for schema features.

### Validation Architecture

**Three-Layer Validation**:
1. **Frontend forms**: Zod schemas in `apps/web/src/lib/validations/`
2. **API contracts**: GraphQL schema validation (NO duplicate Zod on backend)
3. **Final enforcement**: Database constraints (NOT NULL, UNIQUE, FK)

**Rules**:
- ✅ Use Zod for frontend forms only
- ✅ Rely on GraphQL type system for API validation
- ❌ DON'T create duplicate Zod schemas for GraphQL types

See [data-validation-workflow.md](.specify/docs/data-validation-workflow.md) for complete workflow.

### GraphQL Architecture

**Four-Layer Separation**:
```
Resolvers (thin field resolution)
  ↓
Controllers (GraphQL ↔ Service mapping)
  ↓
Services (framework-agnostic business logic)
  ↓
Repositories (Drizzle ORM queries)
```

**Rules**:
- ✅ Keep resolvers thin (field resolution only)
- ✅ Keep services framework-agnostic (no GraphQL types)
- ❌ DON'T put business logic in resolvers
- ❌ DON'T call repositories directly from resolvers

See [backend-graphql-architecture.md](.specify/docs/backend-graphql-architecture.md) for Pothos implementation.

### Other Architecture

**Edge Functions**: See [backend-edge-functions.md](.specify/docs/backend-edge-functions.md)

**Environment Configuration**: See [devops-environment-configuration.md](.specify/docs/devops-environment-configuration.md)

**Design Iteration**: See [design-iteration-workflow.md](.specify/docs/design-iteration-workflow.md)

**MVP Guardrails**: See [project-mvp-guardrails.md](.specify/docs/project-mvp-guardrails.md)

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

## Quick Development Workflow

```bash
# Start development (remote by default)
npm install                    # Install all workspace dependencies
npm run dev                    # Start all apps (web on :3000, design-system on :3001)

# Schema changes workflow
npm run db:push                # Push schema to remote
npm run codegen                # Regenerate GraphQL types (REQUIRED after schema changes)

# Validation (run before commit)
npm run validate               # Type-check + lint all workspaces

# Deployment
npm run api:deploy             # Deploy all Edge Functions (from root, recommended)
cd apps/api && npm run db:push # Push database schema changes
```

**When to use**:
- Run `npm run codegen` after ANY schema changes (rebuilds frontend types)
- Run `npm run validate` before EVERY commit (catches type errors)
- Use `npm run api:deploy` from root (not `cd apps/api`)

## Debugging Tools

**Remote Database Query**:
```bash
# Query with filters
npm run db:query '{"table":"threads","where":{"userId":{"eq":"abc-123"}},"limit":10}'

# Query with multiple conditions
npm run db:query '{"table":"agent_requests","where":{"status":{"in":["failed","pending"]}},"orderBy":{"createdAt":"desc"}}'
```

**API Logs**:
```bash
# Query logs with time window
npm run logs -- --hours=2 --route="/api/threads" --errors

# Search logs
npm run logs -- --search="abc-123" --hours=1
```

See [backend-remote-debugging-tools.md](.specify/docs/backend-remote-debugging-tools.md) for operators and masking.

## /speckit Workflow Commands

Claude Code has access to `/speckit` slash commands for feature development and design iteration:

- `/speckit.pattern` - Extract or create architectural patterns
- `/speckit.specify` → `/speckit.arch` → `/speckit.ux` → `/speckit.plan` → `/speckit.tasks`
- `/speckit.verify-tasks` → `/speckit.implement` → `/speckit.test`
- `/speckit.design-system` - Create/update global design system
- `/speckit.design` - Design feature UI in design-system app
- `/speckit.clarify` - Ask targeted clarification questions
- `/speckit.review` - Multi-agent code review for PR preparation

See command files in `.claude/commands/speckit.*.md` for details.

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

## Deployment

**Frontend** (`apps/web`): Vercel auto-deploy on git push.

**Backend** (`apps/api`):

```bash
npm run api:deploy              # Deploy all Edge Functions (from root, recommended)
cd apps/api && npm run db:push  # Push database schema changes
```

**Prerequisites**: Run `npm run validate` before deploying. Ensure `import_map.json` committed and referenced in `config.toml`.

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
