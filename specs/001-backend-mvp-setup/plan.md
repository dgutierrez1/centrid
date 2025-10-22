# Implementation Plan: Backend MVP Setup & Structure

**Branch**: `001-backend-mvp-setup` | **Date**: 2025-10-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-backend-mvp-setup/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Establish backend foundation for Centrid MVP using Drizzle ORM for type-safe database schema management and Edge Functions directory structure. This setup phase focuses on configuration and infrastructure—NOT feature implementation. Core deliverables: (1) Drizzle ORM schema with RLS policies, (2) Transaction-wrapped migration script, (3) Edge Functions directory structure with single-connection-per-request pattern, (4) Complete type safety from database to queries.

## Technical Context

**Language/Version**: TypeScript 5.0+, Node.js 18+, Deno (for Edge Functions)
**Primary Dependencies**: Drizzle ORM (`drizzle-orm`, `drizzle-kit`), `postgres` driver, `tsx` for script execution
**Storage**: PostgreSQL 15+ (via Supabase) with RLS, triggers, indexes
**Testing**: Not applicable for setup phase (infrastructure configuration only)
**Target Platform**: Supabase Edge Functions (Deno runtime), Node.js for migration scripts
**Project Type**: Monorepo (apps/api backend application)
**Performance Goals**: Migration execution <30s for 6 tables, database queries with indexes 10x faster than without
**Constraints**: Single connection per Edge Function request, transaction-based migration rollback, type safety enforced end-to-end
**Scale/Scope**: 6 core tables, ~20-30 columns total, foundation for 1000+ concurrent users

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle Compliance

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Component Architecture Discipline** | ✅ N/A | Backend setup - no UI components |
| **II. Universal Platform Strategy** | ✅ Pass | API-first backend design supports future platforms |
| **III. Persistent Knowledge Graph** | ✅ Pass | Schema includes documents, chunks for RAG foundation |
| **IV. Managed Backend Stack** | ✅ Pass | Using Supabase PostgreSQL, Edge Functions, RLS |
| **V. End-to-End Type Safety** | ✅ Pass | Drizzle provides schema → types → queries type safety |
| **VI. Live Collaboration Architecture** | ✅ Deferred | Real-time setup deferred post-MVP (documented in spec) |
| **VII. MCP-Based Document Access** | ✅ Pass | Schema supports document access patterns for future MCP tools |
| **VIII. Zero-Trust Data Access via RLS** | ✅ Pass | RLS policies defined in schema, enforced at database level |
| **IX. MVP-First Discipline** | ✅ Pass | Setup only—no premature features, focuses on foundation |
| **X. Monorepo Architecture** | ✅ Pass | All code in `apps/api/`, follows enforced boundaries |
| **XI. Visual Design System** | ✅ N/A | Backend setup - no visual design needed |

### Key Decision Gates

**✅ PASS**: Drizzle ORM choice
- **Rationale**: Provides type-safe schema-as-code without heavyweight ORM overhead. Aligns with TypeScript-first approach (Principle V). Lightweight (~30KB) fits MVP-first discipline (Principle IX).
- **Constitution Alignment**: End-to-End Type Safety, MVP-First Discipline

**✅ PASS**: Transaction-based migration rollback
- **Rationale**: Database-level safety prevents partial schema corruption. Aligns with Zero-Trust principles for data integrity.
- **Constitution Alignment**: Zero-Trust Data Access (Principle VIII)

**✅ PASS**: RLS policies in Drizzle schema via SQL helpers
- **Rationale**: Co-location of schema and security policies improves maintainability. RLS enforcement cannot be bypassed (Principle VIII).
- **Constitution Alignment**: Zero-Trust Data Access via RLS (Principle VIII)

**✅ PASS**: Single connection per Edge Function request
- **Rationale**: Matches serverless execution model. No connection leaks, clean resource management. Scales naturally with Edge Function auto-scaling.
- **Constitution Alignment**: Managed Backend Stack (Principle IV)

**✅ PASS**: Setup-only scope (no feature implementations)
- **Rationale**: Foundation before features. Validates MVP-First discipline by avoiding premature implementation.
- **Constitution Alignment**: MVP-First Discipline (Principle IX), specifically "Ship first, refactor later"

### Anti-Pattern Check

**✅ PASS**: No forbidden patterns detected
- ✅ Not splitting backend code across packages (all in apps/api)
- ✅ Not placing Edge Functions at root (using apps/api/src/functions)
- ✅ Not importing from packages/ui (backend only uses packages/shared)
- ✅ Not building for future (setup targets current MVP needs only)
- ✅ Not adding premature abstractions (Drizzle is third-party, not custom ORM)

### Gate Decision: **APPROVED FOR PHASE 0**

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
apps/api/                          # Self-contained backend application
├── package.json                   # Workspace package with Drizzle dependencies
├── drizzle.config.ts              # Drizzle configuration (NEW)
├── drizzle/                       # Generated migrations (NEW)
│   └── migrations/                # SQL migration files
├── src/
│   ├── db/                        # Database layer (NEW)
│   │   ├── schema.ts              # Drizzle schema definitions with RLS helpers
│   │   ├── index.ts               # DB client config (single connection pattern)
│   │   └── migrate.ts             # Transaction-wrapped migration script
│   ├── functions/                 # Edge Functions (STRUCTURE ONLY)
│   │   ├── _shared/               # Shared utilities
│   │   │   └── db.ts              # Database client for Edge Functions
│   │   └── hello/                 # Example Edge Function
│   │       └── index.ts           # Deno.serve handler with DB access demo
│   ├── services/                  # Business logic (future use)
│   ├── utils/                     # Backend utilities (future use)
│   └── lib/                       # Shared libraries (future use)
└── supabase/                      # Supabase configuration (existing)
    ├── config.toml                # Points to src/functions/
    └── migrations/                # Legacy - will use Drizzle migrations instead

packages/shared/                   # Shared types and utilities
└── src/
    └── types/
        └── database.ts            # Type exports (may be updated for Drizzle types)
```

**Structure Decision**: Monorepo backend application structure following Constitution Principle X. All backend logic self-contained in `apps/api/`. New Drizzle infrastructure added at `apps/api/src/db/` and `apps/api/drizzle/`. Edge Functions structure established at `apps/api/src/functions/` but NO feature implementations (setup only). This aligns with Anti-Pattern "Splitting backend code across packages/" - everything stays in apps/api.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

**No violations**: All decisions align with constitution principles. No complexity justification required.

---

## Phase 0: Research & Best Practices (COMPLETED)

✅ **Output**: [research.md](./research.md)

**Completed Research**:
1. Drizzle ORM integration with Supabase PostgreSQL
2. RLS policies in Drizzle schema (SQL helper pattern)
3. Transaction-based migration rollback
4. Edge Function database connection pattern (single per request)
5. Drizzle configuration best practices
6. Database schema column type best practices
7. Package dependencies management

**Key Decisions Documented**:
- Use Drizzle ORM for type-safe schema-as-code
- Define RLS policies using SQL helpers in schema
- Wrap migrations in transactions for automatic rollback
- Single database connection per Edge Function request
- Configure Drizzle with strict mode and verbose logging
- Use PostgreSQL-specific column types for accuracy

---

## Phase 1: Design & Contracts (COMPLETED)

✅ **Outputs**:
- [data-model.md](./data-model.md) - Complete database schema
- [contracts/database-schema.ts](./contracts/database-schema.ts) - TypeScript type contracts
- [quickstart.md](./quickstart.md) - Developer setup guide

**Completed Design**:
1. **Data Model**: 6 core tables with relationships, constraints, indexes, triggers, RLS policies
   - user_profiles (extended user data)
   - documents (file metadata + full-text content)
   - document_chunks (RAG segments)
   - agent_requests (AI execution tracking)
   - agent_sessions (multi-turn conversations)
   - usage_events (billing/analytics)

2. **Type Contracts**: Complete TypeScript interfaces for all tables
   - Insert types (NewX) and Select types (X)
   - Enum constants for validation
   - Database client interface
   - RLS policy documentation

3. **Quickstart Guide**: 5-minute setup instructions
   - Dependency installation
   - Environment configuration
   - Schema creation
   - Migration execution
   - Verification checklist

**Agent Context Updated**:
- ✅ CLAUDE.md updated with Drizzle ORM, PostgreSQL, TypeScript stack info

---

## Implementation Workflow

### Step 1: Install Dependencies

```bash
cd apps/api
npm install drizzle-orm postgres
npm install -D drizzle-kit tsx
```

### Step 2: Create Configuration

1. Create `apps/api/drizzle.config.ts` (see quickstart.md)
2. Add `DATABASE_URL` to environment variables
3. Verify Supabase project accessible

### Step 3: Implement Schema

1. Create `apps/api/src/db/schema.ts` with all 6 tables (see data-model.md)
2. Include RLS policies via SQL helpers
3. Export all tables and RLS definitions

### Step 4: Create Database Client

1. Create `apps/api/src/db/index.ts` with Drizzle client
2. Implement single-connection pattern
3. Export typed db client

### Step 5: Create Migration Runner

1. Create `apps/api/src/db/migrate.ts` with transaction wrapper
2. Test migration execution
3. Verify rollback on error

### Step 6: Generate and Run Migrations

```bash
cd apps/api
npx drizzle-kit generate:pg  # Generate SQL migrations
tsx src/db/migrate.ts          # Run migrations
```

### Step 7: Verify Setup

1. Check all 6 tables exist in Supabase Dashboard
2. Verify RLS policies enabled
3. Test type safety in queries
4. Validate indexes created

### Step 8: Edge Functions Structure

1. Create `apps/api/src/functions/_shared/db.ts` with connection helper
2. Create `apps/api/src/functions/hello/index.ts` as example
3. Test database access from Edge Function
4. Verify automatic connection cleanup

---

## Success Criteria Validation

From spec.md Success Criteria:

| Criterion | Validation Method | Status |
|-----------|-------------------|--------|
| **SC-001**: Migration script creates all 6 tables | Run migration, query information_schema | ⏳ Ready to validate |
| **SC-002**: TypeScript autocomplete works | Write query, check autocomplete | ⏳ Ready to validate |
| **SC-003**: RLS prevents unauthorized access | Cross-user query test | ⏳ Ready to validate |
| **SC-004**: Edge Functions can query with type safety | Create test function, query DB | ⏳ Ready to validate |
| **SC-005**: Indexes improve performance 10x | Query with/without indexes, compare | ⏳ Ready to validate |
| **SC-006**: Add table and migrate in <2 min | Time the workflow | ⏳ Ready to validate |

---

## Next Phase: Implementation Tasks

**Command**: `/speckit.tasks`

This will generate `tasks.md` with:
- Detailed step-by-step implementation tasks
- Task dependencies and ordering
- Acceptance criteria for each task
- Estimated time per task

**Estimated Total Implementation Time**: 2-3 hours

**Task Breakdown Preview**:
1. Install dependencies (5 min)
2. Create Drizzle config (5 min)
3. Implement schema with 6 tables (45 min)
4. Create database client (15 min)
5. Create migration runner (15 min)
6. Generate and run migrations (10 min)
7. Create Edge Functions structure (20 min)
8. Verify setup and test (20 min)

---

## Files Created by This Plan

```
specs/001-backend-mvp-setup/
├── plan.md                          # This file
├── research.md                      # Phase 0 output
├── data-model.md                    # Phase 1 output
├── quickstart.md                    # Phase 1 output
└── contracts/
    └── database-schema.ts           # Phase 1 output
```

**Ready for**: Task generation (`/speckit.tasks`) and implementation.

**Constitution Re-Check**: ✅ All decisions remain compliant post-design. No new violations introduced.

