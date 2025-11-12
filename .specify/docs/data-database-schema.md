---
title: Database Schema Pattern
summary: Drizzle ORM schema with MVP-first approach and remote-only push workflow
domain: data
priority: core
related: [data-type-generation, data-rls-policies, backend-remote-first-development]
---

<!-- After editing this file, run: npm run sync-docs -->

# Database Schema Pattern

**What**: Database schema defined in `apps/api/src/db/schema.ts` using Drizzle ORM with MVP-first approach—changes pushed directly to remote Supabase without migrations during MVP phase.

**Why**: Drizzle provides type-safe ORM with automatic TypeScript type inference. MVP-first approach allows rapid iteration without migration complexity. Migrations deferred until post-MVP.

**Core Tables**:

- `user_profiles` - Extended user data (plan, usage_count, subscription_status)
- `documents` - File metadata with full-text search vectors
- `document_chunks` - Text segments for RAG context retrieval
- `agent_requests` - AI agent execution tracking
- `agent_sessions` - Multi-turn conversation management
- `folders` - File/document organization
- `usage_events` - Usage tracking for billing

**Schema Features**:

- Type-safe Drizzle ORM with automatic TypeScript type inference
- Automatic `tsvector` for full-text search (GiN indexes)
- Row Level Security (RLS) policies for user isolation
- Automatic `updated_at` triggers
- Auto user profile creation on signup
- Custom `tsvector` type for full-text search
- All SQL (triggers, RLS, CASCADE foreign keys) defined in `schema.ts` exports

**Database Commands (MVP - Remote Only)**:

```bash
cd apps/api
npm run db:drop            # Drop all tables (MVP iteration only)
npm run db:push            # Push schema + apply triggers/RLS/foreign keys (all-in-one)
npm run deploy:functions   # Deploy all Edge Functions to remote
```

**MVP Approach**:

Schema lives in `apps/api/src/db/schema.ts`. Changes pushed directly to remote Supabase using Drizzle (`drizzle-kit push --force`). Safe to drop/recreate during MVP. Migrations deferred until post-MVP. Always target remote database (not local).

**AI Agents Context**:

- Context: Up to 20 document chunks per request
- Usage limits: Free (100/mo), Pro (1000/mo), Enterprise (10000/mo)

**Rules**:
- ✅ DO define all schema in `apps/api/src/db/schema.ts`
- ✅ DO use Drizzle ORM for type-safe database access
- ✅ DO push directly to remote with `db:push` during MVP
- ✅ DO include RLS policies, triggers, and foreign keys in schema.ts
- ✅ DO run `npm run codegen` after schema changes (regenerate types)
- ✅ DO use `db:drop` freely during MVP iteration
- ❌ DON'T create manual migrations during MVP (use push)
- ❌ DON'T target local database (always remote)
- ❌ DON'T skip type regeneration after schema changes

**Used in**:
- `apps/api/src/db/schema.ts` - Complete database schema definition
- `apps/api/src/db/types.ts` - Drizzle-inferred types (auto-generated)
- `apps/api/drizzle.config.ts` - Drizzle configuration
- `apps/api/package.json` - `db:push`, `db:drop` scripts
