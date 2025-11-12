---
title: Row-Level Security (RLS) Policies
summary: Postgres RLS enforces user isolation at database level
domain: data
priority: core
related: [backend-graphql-architecture]
---

<!-- After editing this file, run: npm run sync-docs -->

# Row-Level Security (RLS) Policies

## Pattern

All database tables use PostgreSQL Row-Level Security (RLS) to enforce user isolation at the database level.

## Why RLS

- **Security**: Defense-in-depth - even if application logic fails, database enforces access control
- **Simplicity**: No need to add `WHERE user_id = auth.uid()` to every query
- **Consistency**: Access control in one place (database) not scattered across services

## Implementation

RLS policies defined in `apps/api/src/db/schema.ts` and applied via `npm run db:push`.

```sql
-- Enable RLS on table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own documents
CREATE POLICY "Users can view their own documents"
ON documents FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can only insert their own documents
CREATE POLICY "Users can insert their own documents"
ON documents FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

## Tables with RLS

- `user_profiles` - User data
- `documents` - File metadata
- `document_chunks` - Text segments
- `agent_requests` - AI execution tracking
- `agent_sessions` - Conversation management
- `folders` - File organization
- `usage_events` - Billing tracking

## Rules

- ✅ All user-scoped tables MUST have RLS enabled
- ✅ Policies applied via `db:push` (in schema.ts)
- ✅ Service role bypasses RLS (for admin operations)
- ❌ NEVER disable RLS on production tables
- ❌ NEVER rely solely on application-level filtering

## Testing RLS

```typescript
// This query automatically filtered by RLS
const docs = await db.select().from(documents)
// Only returns documents where user_id = auth.uid()

// Service role bypasses RLS (admin operations)
const allDocs = await adminDb.select().from(documents)
// Returns ALL documents (use with caution)
```

## References

- Schema with RLS: `apps/api/src/db/schema.ts`
- Database commands: `CLAUDE.md` → Database Schema section
- Supabase RLS docs: https://supabase.com/docs/guides/auth/row-level-security
