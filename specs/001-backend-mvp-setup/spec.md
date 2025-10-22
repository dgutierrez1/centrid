# Feature Specification: Backend MVP Setup & Structure

**Feature Branch**: `001-backend-mvp-setup`
**Created**: 2025-10-21
**Status**: Draft
**Input**: Backend setup and structure for MVP - Supabase configuration, database schema, Edge Functions foundation

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Database Schema Foundation with Drizzle ORM (Priority: P1)

Developer defines database schema in TypeScript using Drizzle ORM and runs migrations to establish core tables.

**Why this priority**: Database schema is the foundation for all features. Type-safe schema definition enables faster development.

**Independent Test**: Can be tested by running migration script and verifying all tables exist with proper structure and RLS policies.

**Acceptance Scenarios**:

1. **Given** Drizzle schema is defined in `apps/api/src/db/schema.ts`, **When** developer runs migration script, **Then** all core tables (`user_profiles`, `documents`, `document_chunks`, `agent_requests`, `agent_sessions`, `usage_events`) are created
2. **Given** database schema is applied, **When** user A tries to access user B's documents via query, **Then** RLS policy blocks the access
3. **Given** schema is defined in TypeScript, **When** developer writes queries, **Then** TypeScript provides autocomplete and type safety

---

### User Story 2 - Edge Functions Structure (Priority: P2)

Edge Functions foundation is established with proper directory structure and configuration.

**Why this priority**: Edge Functions will handle AI agent execution and document processing. Setup is needed before implementation.

**Independent Test**: Can be tested by creating a simple Edge Function and verifying it can be invoked.

**Acceptance Scenarios**:

1. **Given** Edge Functions directory structure exists at `apps/api/src/functions/`, **When** developer creates new function, **Then** function is properly structured and discoverable
2. **Given** function structure exists, **When** developer imports from `apps/api/src/db/`, **Then** database schema and client are accessible
3. **Given** Edge Function is created, **When** invoked, **Then** function executes and can query database with type safety

---

### Edge Cases

- **Migration failures**: Migration script wraps entire migration in database transaction for automatic rollback on failure, ensuring database consistency
- How does system handle schema drift between TypeScript definition and actual database?
- **RLS policy management**: RLS policies defined in Drizzle schema using custom SQL helpers alongside table definitions
- **Edge Function connection management**: Single database connection per Edge Function request with automatic cleanup after response

## Clarifications

### Session 2025-10-21

- Q: How should the migration script handle failures to ensure database consistency? → A: Wrap entire migration in database transaction (auto-rollback on failure)
- Q: Where should RLS policies be defined and maintained? → A: Define RLS policies in Drizzle schema using custom SQL helpers
- Q: How should Edge Functions manage database connections? → A: Single connection per Edge Function request (auto-cleanup after response)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST define database schema using Drizzle ORM in TypeScript at `apps/api/src/db/schema.ts`
- **FR-002**: System MUST provide migration script at `apps/api/src/db/migrate.ts` to apply schema changes with transaction-based rollback on failure
- **FR-003**: System MUST include database client configuration at `apps/api/src/db/index.ts` for query execution
- **FR-004**: System MUST enforce Row Level Security (RLS) at database level to isolate user data, with policies defined in Drizzle schema using custom SQL helpers
- **FR-005**: System MUST provide Edge Functions directory structure at `apps/api/src/functions/`
- **FR-006**: System MUST include environment variable configuration with `DATABASE_URL`
- **FR-007**: System MUST create database indexes on frequently queried columns (user_id, status, created_at)
- **FR-008**: System MUST provide automatic `updated_at` triggers on all tables (via SQL triggers)
- **FR-009**: System MUST auto-create user profile when auth user is created (via SQL trigger)
- **FR-010**: System MUST install Drizzle ORM dependencies (`drizzle-orm`, `postgres`, `drizzle-kit`)

### Key Entities *(include if feature involves data)*

- **User Profile**: Extended user data (name, plan type, usage count, subscription status) linked to auth.users
- **Document**: File metadata (filename, type, size, processing status, owner, content text, search vector)
- **Document Chunk**: Text segments for RAG (content, chunk index, section title, parent document)
- **Agent Request**: AI agent execution tracking (type, content, status, progress, results, token costs)
- **Agent Session**: Multi-turn conversation tracking (session ID, request chain, context state)
- **Usage Event**: Usage tracking for billing (user ID, request type, tokens used, cost, timestamp)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Migration script successfully creates all 6 core tables in current environment
- **SC-002**: TypeScript autocomplete works when writing Drizzle queries against schema
- **SC-003**: RLS policies prevent 100% of unauthorized cross-user data access attempts
- **SC-004**: Edge Functions can import and query database with full type safety
- **SC-005**: Database indexes improve query performance by at least 10x on user_id lookups
- **SC-006**: Developer can add new table to schema and run migration in under 2 minutes

## Assumptions

- Supabase project already exists with accessible `DATABASE_URL`
- Node.js 18+ and npm are installed
- Project uses monorepo structure with Turborepo
- Database supports PostgreSQL features (RLS, triggers, indexes)
- Developer has database access credentials
- TypeScript is already configured in the project

## Out of Scope

- Local development environment setup (already exists)
- Production deployment configuration (deferred to deployment phase)
- Supabase configuration and setup (already exists)
- Advanced auth methods (OAuth, social logins) - using existing auth
- Monitoring and analytics setup (deferred post-MVP)
- Payment integration (Mercado Pago) - deferred to billing feature
- Vector embeddings and semantic search (deferred to RAG feature)
- Real-time subscriptions setup (deferred to real-time feature)
- Edge Function feature implementations (structure only, not feature logic)
- API rate limiting and throttling (deferred post-MVP)

## Dependencies

- Existing Supabase project with database access
- Existing monorepo structure at `apps/api/`
- Existing shared types package at `packages/shared/`
- npm package manager for installing Drizzle dependencies

## Configuration Items

### Drizzle ORM Structure

**Schema Definition** (`apps/api/src/db/schema.ts`):
- All table definitions using Drizzle's `pgTable`
- Column types, constraints, and relationships
- RLS policies defined using custom SQL helpers alongside table definitions
- Export all tables for use in queries

**Database Client** (`apps/api/src/db/index.ts`):
- PostgreSQL connection using `postgres` library
- Drizzle client initialization with schema
- Single connection per request (no persistent pooling)
- Export typed `db` client for queries

**Migration Script** (`apps/api/src/db/migrate.ts`):
- Import `migrate` from `drizzle-orm/postgres-js/migrator`
- Execute migrations from generated SQL files
- Run via: `tsx apps/api/src/db/migrate.ts`

**Drizzle Config** (`apps/api/drizzle.config.ts`):
- Database connection string from env
- Migration output directory: `apps/api/drizzle/migrations/`
- Schema path: `apps/api/src/db/schema.ts`

### Environment Variables

**Required for Drizzle**:
- `DATABASE_URL=postgresql://[user]:[pass]@[host]:[port]/[db]`

**Existing Supabase vars** (unchanged):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Edge Functions Structure

**Directory Layout**:
```
apps/api/src/functions/
├── _shared/           # Shared utilities for all functions
│   └── db.ts          # Database client (imports from ../db)
├── hello/             # Example function
│   └── index.ts       # Deno.serve handler
└── [feature-name]/    # Future functions
    └── index.ts
```

**Connection Management**:
- Each Edge Function creates single database connection per request
- Connection automatically cleaned up after response
- No persistent connection pooling across invocations

### Package Dependencies

**Add to `apps/api/package.json`**:
- `drizzle-orm` - ORM library
- `postgres` - PostgreSQL driver
- `drizzle-kit` - Migration generation (dev dependency)
- `tsx` - TypeScript execution for migration script (dev dependency)

