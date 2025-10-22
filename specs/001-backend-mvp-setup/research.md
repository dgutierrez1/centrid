# Research: Backend MVP Setup & Structure

**Feature**: 001-backend-mvp-setup
**Date**: 2025-10-21
**Phase**: 0 (Research & Best Practices)

## Research Overview

This document consolidates research on Drizzle ORM integration, RLS policy patterns, Edge Function database access, and migration best practices for the Centrid backend setup.

---

## 1. Drizzle ORM Integration with Supabase PostgreSQL

### Decision: Use Drizzle ORM for schema-as-code approach

**Rationale**:
- **Type Safety**: Drizzle generates TypeScript types directly from schema definitions, eliminating manual type sync
- **Lightweight**: ~30KB bundle size vs Prisma's 400KB+, aligns with MVP-first discipline
- **PostgreSQL Native**: First-class support for PostgreSQL-specific features (RLS, triggers, indexes)
- **Migration Control**: Generate SQL migrations from schema changes, full visibility into database operations
- **No Runtime Overhead**: Query builder compiles to SQL, no ORM magic or hidden queries

**Alternatives Considered**:
- **Prisma**: Rejected - heavier (~400KB), less PostgreSQL-specific, schema not in TypeScript
- **TypeORM**: Rejected - Active Record pattern adds complexity, decorators feel heavy
- **Raw SQL**: Rejected - no type safety, manual migration management, error-prone

**Best Practices**:
1. Define schema in `apps/api/src/db/schema.ts` using `pgTable` from Drizzle
2. Use `drizzle-kit generate:pg` to auto-generate SQL migrations
3. Run migrations via custom script with transaction wrapping
4. Export schema types for use across codebase

**References**:
- Drizzle ORM Docs: https://orm.drizzle.team/docs/overview
- PostgreSQL Column Types: https://orm.drizzle.team/docs/column-types/pg

---

## 2. RLS Policies in Drizzle Schema

### Decision: Define RLS policies using custom SQL helpers alongside table definitions

**Rationale**:
- **Co-location**: Security policies live next to schema definition, improving maintainability
- **Visibility**: Developers see RLS policies when modifying tables, reducing security oversights
- **Migration Integration**: RLS SQL exported via Drizzle `sql` template literal, included in generated migrations
- **Type Safety**: Can reference table columns using TypeScript, prevents typos in policy definitions

**Pattern**:
```typescript
import { pgTable, uuid, text, sql } from 'drizzle-orm/pg-core';

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull(),
  filename: text('filename').notNull(),
});

// RLS helper pattern
export const documentsRLS = sql`
  ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can view own documents"
    ON documents FOR SELECT
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert own documents"
    ON documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);
`;
```

**Best Practices**:
1. Group RLS policies immediately after table definition
2. Use template literals for multi-line SQL readability
3. Name policies descriptively: `"Users can {action} {resource}"`
4. Export RLS definitions separately for testing/documentation
5. Include RLS SQL in migration generation step

**Alternatives Considered**:
- **Separate SQL files**: Rejected - loses co-location benefits, harder to maintain
- **Drizzle policy API**: Not available - Drizzle doesn't have first-class RLS API yet

**References**:
- Supabase RLS Guide: https://supabase.com/docs/guides/auth/row-level-security
- PostgreSQL RLS Docs: https://www.postgresql.org/docs/current/ddl-rowsecurity.html

---

## 3. Transaction-Based Migration Rollback

### Decision: Wrap entire migration execution in database transaction

**Rationale**:
- **Atomicity**: Either all migrations succeed or none apply, preventing partial schema states
- **Safety**: Automatic rollback on any error eliminates manual cleanup
- **Standard Practice**: PostgreSQL's transactional DDL supports this pattern natively
- **Confidence**: Developers can run migrations without fear of database corruption

**Implementation Pattern**:
```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

// Migration runs inside transaction automatically via postgres driver
try {
  await migrate(drizzle(sql), { migrationsFolder: './drizzle/migrations' });
  console.log('✅ Migrations applied successfully');
} catch (error) {
  console.error('❌ Migration failed, rolled back:', error);
  process.exit(1);
} finally {
  await sql.end();
}
```

**Best Practices**:
1. Use `postgres` driver (not `pg`) - better transaction handling
2. Set `max: 1` connection to avoid connection pool issues during migration
3. Always call `sql.end()` in finally block to cleanup connection
4. Log success/failure clearly for debugging
5. Exit with non-zero code on failure for CI/CD integration

**References**:
- Drizzle Migrations: https://orm.drizzle.team/docs/migrations
- PostgreSQL Transactional DDL: https://wiki.postgresql.org/wiki/Transactional_DDL_in_PostgreSQL:_A_Competitive_Analysis

---

## 4. Edge Function Database Connection Pattern

### Decision: Single connection per request with automatic cleanup

**Rationale**:
- **Serverless Model**: Edge Functions are ephemeral, don't maintain persistent state
- **Resource Safety**: No connection leaks, each request isolated
- **Simplicity**: No pooling complexity, straightforward connection lifecycle
- **Deno Compatibility**: Works with Deno runtime constraints (no persistent Node.js process)

**Implementation Pattern**:
```typescript
// apps/api/src/functions/_shared/db.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../db/schema.ts';

export async function getDB() {
  const sql = postgres(Deno.env.get('DATABASE_URL')!, {
    max: 1,  // Single connection
    idle_timeout: 20,  // Close after 20s idle
  });

  return {
    db: drizzle(sql, { schema }),
    cleanup: () => sql.end()
  };
}

// Usage in Edge Function
import { getDB } from '../_shared/db.ts';

Deno.serve(async (req) => {
  const { db, cleanup } = await getDB();

  try {
    const result = await db.query.documents.findMany();
    return Response.json(result);
  } finally {
    await cleanup();  // Always cleanup
  }
});
```

**Best Practices**:
1. Create connection at request start, cleanup at request end
2. Use try/finally to guarantee cleanup even on errors
3. Set idle timeout to close unused connections quickly
4. Limit to 1 connection (`max: 1`) for predictable resource usage
5. Consider Supabase connection pooler for high-concurrency scenarios (future optimization)

**Alternatives Considered**:
- **Shared connection pool**: Rejected - doesn't work well with Edge Function lifecycle
- **External pooler (PgBouncer)**: Deferred - overkill for MVP, can add later if needed

**References**:
- Supabase Edge Functions + DB: https://supabase.com/docs/guides/functions/connect-to-postgres
- Deno.env API: https://deno.land/api?s=Deno.env

---

## 5. Drizzle Configuration Best Practices

### Decision: Configure Drizzle with schema introspection and strict output

**Configuration** (`apps/api/drizzle.config.ts`):
```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  verbose: true,  // Log SQL generation
  strict: true,   // Fail on schema inconsistencies
} satisfies Config;
```

**Best Practices**:
1. Use `satisfies Config` for type checking config file
2. Enable `verbose` for debugging migration generation
3. Enable `strict` to catch schema drift early
4. Place config at repository root for discoverability
5. Use relative paths from config location

**Workflow Commands**:
```bash
# Generate migration from schema changes
npx drizzle-kit generate:pg

# Push schema directly to DB (dev only, skip migrations)
npx drizzle-kit push:pg

# Introspect existing DB to generate schema (reverse)
npx drizzle-kit introspect:pg

# Apply migrations
tsx src/db/migrate.ts
```

**References**:
- Drizzle Kit Config: https://orm.drizzle.team/kit-docs/config-reference

---

## 6. Database Schema Column Type Best Practices

### Decision: Use Drizzle's PostgreSQL-specific types for accuracy

**Type Mapping**:
- **UUIDs**: `uuid().defaultRandom()` for primary keys, `uuid().notNull()` for foreign keys
- **Timestamps**: `timestamp({ withTimezone: true }).defaultNow()` for created_at/updated_at
- **Text**: `text()` for unlimited strings, `varchar(255)` for constrained
- **JSON**: `jsonb()` for structured data (better indexing than `json()`)
- **Enums**: `pgEnum()` for type-safe enum columns
- **Integers**: `serial()` for auto-increment, `integer()` for regular numbers
- **Booleans**: `boolean().default(false)`

**Example**:
```typescript
import { pgTable, uuid, text, timestamp, integer, boolean, jsonb } from 'drizzle-orm/pg-core';

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  content_text: text('content_text'),
  processing_status: text('processing_status').default('pending'),  // Consider pgEnum for type safety
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  metadata: jsonb('metadata'),
});
```

**Best Practices**:
1. Always use timezone-aware timestamps
2. Set appropriate defaults (UUIDs, timestamps, booleans)
3. Use cascade delete for foreign keys where appropriate
4. Prefer `text()` over `varchar()` unless length constraint needed
5. Use `jsonb()` not `json()` for better query performance

---

## 7. Package Dependencies Management

### Decision: Add Drizzle deps to apps/api package.json

**Dependencies to Add**:
```json
{
  "dependencies": {
    "drizzle-orm": "^0.29.0",
    "postgres": "^3.4.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.20.0",
    "tsx": "^4.7.0"
  }
}
```

**Rationale**:
- `drizzle-orm`: Core ORM library for schema definitions and queries
- `postgres`: PostgreSQL driver with better transaction support than `pg`
- `drizzle-kit`: CLI tool for migration generation (dev only)
- `tsx`: Execute TypeScript migration script without build step (dev only)

**Installation**:
```bash
cd apps/api
npm install drizzle-orm postgres
npm install -D drizzle-kit tsx
```

---

## Summary

| Research Area | Decision | Key Benefit |
|---------------|----------|-------------|
| ORM Choice | Drizzle ORM | Type-safe, lightweight, PostgreSQL-first |
| RLS Management | SQL helpers in schema | Co-location, maintainability, visibility |
| Migration Safety | Transaction-wrapped | Atomic operations, auto-rollback |
| Edge Function Connections | Single per request | Serverless-compatible, no leaks |
| Configuration | Strict with verbose logging | Early error detection |
| Column Types | PostgreSQL-specific types | Accuracy, performance |
| Dependencies | Drizzle + postgres driver | Minimal, focused stack |

**Next Phase**: Phase 1 (Design & Contracts) - Generate data-model.md with complete table schemas and relationships.
