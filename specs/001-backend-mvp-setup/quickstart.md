# Quickstart: Backend MVP Setup & Structure

**Feature**: 001-backend-mvp-setup
**Date**: 2025-10-21
**For**: Developers setting up Drizzle ORM backend infrastructure

## Prerequisites

Before starting, ensure you have:

- [x] Node.js 18+ installed
- [x] npm package manager
- [x] Supabase project with `DATABASE_URL` access
- [x] Git repository cloned at `/Users/daniel/Projects/misc/centrid`
- [x] Existing monorepo structure (`apps/api/` directory exists)

---

## Quick Setup (5 Minutes)

### 1. Install Dependencies

```bash
cd apps/api
npm install drizzle-orm postgres
npm install -D drizzle-kit tsx
```

**Installed**:
- `drizzle-orm` - ORM library for type-safe queries
- `postgres` - PostgreSQL driver
- `drizzle-kit` - Migration CLI tool
- `tsx` - TypeScript execution (for migration script)

---

### 2. Configure Environment Variables

Create or update `.env` file in repository root:

```bash
# apps/api/.env (or root .env.local)
DATABASE_URL=postgresql://user:password@host:port/database

# Existing Supabase vars (unchanged)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Get DATABASE_URL**:
1. Go to Supabase Dashboard → Settings → Database
2. Copy "Connection string" (Transaction mode)
3. Replace `[YOUR-PASSWORD]` with actual database password

---

### 3. Create Drizzle Config

Create `apps/api/drizzle.config.ts`:

```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
```

---

### 4. Create Database Schema

Create `apps/api/src/db/schema.ts`:

```typescript
import { pgTable, uuid, text, integer, timestamp, real, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Example: user_profiles table
export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique(),
  name: text('name'),
  planType: text('plan_type').notNull().default('free'),
  usageCount: integer('usage_count').notNull().default(0),
  subscriptionStatus: text('subscription_status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// RLS policies (will be in migration)
export const userProfilesRLS = sql`
  ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = user_id);
`;

// Add remaining tables: documents, document_chunks, agent_requests, etc.
// See data-model.md for complete schema
```

---

### 5. Create Database Client

Create `apps/api/src/db/index.ts`:

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// For queries
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });

// For migrations (single connection)
export function getMigrationClient() {
  return postgres(connectionString, { max: 1 });
}
```

---

### 6. Create Migration Script

Create `apps/api/src/db/migrate.ts`:

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { getMigrationClient } from './index';

async function main() {
  console.log('🔄 Running migrations...');

  const sql = getMigrationClient();
  const db = drizzle(sql);

  try {
    await migrate(db, { migrationsFolder: './drizzle/migrations' });
    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
```

---

### 7. Generate and Run Migrations

```bash
cd apps/api

# Generate SQL migrations from schema
npx drizzle-kit generate:pg

# Review generated SQL in drizzle/migrations/

# Run migrations
tsx src/db/migrate.ts
```

**Expected output**:
```
🔄 Running migrations...
✅ Migrations completed successfully
```

---

### 8. Verify Database

```bash
# Connect to Supabase DB (via psql or Supabase Dashboard)
# Check tables exist:
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

# Should see: user_profiles, documents, document_chunks, etc.
```

---

## Edge Functions Setup (Optional for MVP)

### Create Example Edge Function

Create `apps/api/src/functions/hello/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  return new Response(
    JSON.stringify({ message: 'Hello from Edge Function!' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

### Create Shared DB Helper

Create `apps/api/src/functions/_shared/db.ts`:

```typescript
import { drizzle } from 'npm:drizzle-orm/postgres-js';
import postgres from 'npm:postgres';

export async function getDB() {
  const sql = postgres(Deno.env.get('DATABASE_URL')!, {
    max: 1,
    idle_timeout: 20,
  });

  return {
    db: drizzle(sql),
    cleanup: () => sql.end()
  };
}
```

### Deploy Edge Function (when ready)

```bash
cd apps/api
supabase functions deploy hello
```

---

## Common Commands

```bash
# Generate migration from schema changes
npx drizzle-kit generate:pg

# Run migrations
tsx src/db/migrate.ts

# Push schema directly to DB (dev only, skip migrations)
npx drizzle-kit push:pg

# Introspect existing DB
npx drizzle-kit introspect:pg

# Deploy Edge Function
cd apps/api && supabase functions deploy <function-name>
```

---

## Troubleshooting

### Migration Fails: "relation already exists"

**Solution**: Database already has tables. Either:
1. Drop existing tables: `DROP TABLE table_name CASCADE;`
2. Or use `drizzle-kit push:pg` to sync schema directly

### Type Errors: "Cannot find module './schema'"

**Solution**: Ensure `schema.ts` is created and exports tables correctly.

### Connection Timeout

**Solution**: Check `DATABASE_URL` is correct. Verify Supabase project is running.

### RLS Policy Errors

**Solution**: Ensure `auth.uid()` function exists (Supabase provides this). Check policies match user_id column names.

---

## Next Steps

After setup completes:

1. ✅ Verify all 6 tables created successfully
2. ✅ Test RLS policies by attempting cross-user queries
3. ✅ Run type-check: `cd apps/api && npm run type-check`
4. ✅ Export types to `packages/shared` (if needed)
5. ⏭️ Proceed to feature implementation (document upload, AI agents, etc.)

---

## Verification Checklist

- [ ] Dependencies installed (`drizzle-orm`, `postgres`, `drizzle-kit`, `tsx`)
- [ ] `DATABASE_URL` configured in environment
- [ ] `drizzle.config.ts` created
- [ ] `src/db/schema.ts` defines all 6 tables
- [ ] `src/db/index.ts` exports db client
- [ ] `src/db/migrate.ts` migration script created
- [ ] Migrations generated (`drizzle/migrations/` directory exists)
- [ ] Migrations executed successfully (✅ log message)
- [ ] Database tables visible in Supabase Dashboard
- [ ] RLS policies enabled on all tables
- [ ] TypeScript types generated (no compilation errors)

**Setup Complete!** 🎉

Backend infrastructure ready for feature development. See [data-model.md](./data-model.md) for complete schema reference.
