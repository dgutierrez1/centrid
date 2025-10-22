# Data Model: Backend MVP Setup & Structure

**Feature**: 001-backend-mvp-setup
**Date**: 2025-10-21
**Phase**: 1 (Design & Contracts)

## Overview

Complete database schema for Centrid MVP using Drizzle ORM. Defines 6 core tables with relationships, constraints, indexes, triggers, and RLS policies. Schema supports persistent knowledge graph (documents + chunks), AI agent execution tracking, and usage-based billing.

---

## Entity Relationship Diagram

```
┌──────────────┐
│  auth.users  │ (Supabase managed)
└──────┬───────┘
       │
       │ 1:1
       │
       ├─────────────────────┐
       │                     │
       ↓                     ↓
┌──────────────┐      ┌──────────────┐
│user_profiles │      │usage_events  │
└──────┬───────┘      └──────────────┘
       │
       │ 1:N
       │
       ├──────────────┬──────────────┬──────────────┐
       │              │              │              │
       ↓              ↓              ↓              ↓
┌──────────────┐┌──────────────┐┌──────────────┐┌──────────────┐
│  documents   ││agent_requests││agent_sessions││usage_events  │
└──────┬───────┘└──────────────┘└──────────────┘└──────────────┘
       │
       │ 1:N
       │
       ↓
┌──────────────────┐
│ document_chunks  │
└──────────────────┘
```

**Relationships**:
- `auth.users` (1) → (1) `user_profiles`: Extended user data
- `auth.users` (1) → (N) `documents`: User owns multiple documents
- `documents` (1) → (N) `document_chunks`: Document split into chunks for RAG
- `auth.users` (1) → (N) `agent_requests`: User creates AI agent requests
- `auth.users` (1) → (N) `agent_sessions`: User has multiple conversation sessions
- `auth.users` (1) → (N) `usage_events`: User generates usage events for billing

---

## Table Definitions

### 1. user_profiles

**Purpose**: Extended user data beyond Supabase auth.users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT random | Profile ID |
| `user_id` | `uuid` | NOT NULL, UNIQUE, FK → auth.users(id) CASCADE | Link to auth user |
| `name` | `text` | NULL | Display name |
| `plan_type` | `text` | NOT NULL, DEFAULT 'free' | Subscription plan (free/pro/enterprise) |
| `usage_count` | `integer` | NOT NULL, DEFAULT 0 | AI requests this billing period |
| `subscription_status` | `text` | NOT NULL, DEFAULT 'active' | Status (active/cancelled/expired) |
| `created_at` | `timestamp(tz)` | NOT NULL, DEFAULT now() | Profile creation time |
| `updated_at` | `timestamp(tz)` | NOT NULL, DEFAULT now() | Last update time |

**Indexes**:
- `user_id` (unique, for fast lookups)

**Triggers**:
- `updated_at` auto-update on row modification
- Auto-create profile on auth.users insert

**RLS Policies**:
- SELECT: `auth.uid() = user_id`
- UPDATE: `auth.uid() = user_id`
- NO INSERT (handled by trigger)
- NO DELETE (cascade from auth.users)

---

### 2. documents

**Purpose**: File metadata and full-text content for RAG

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT random | Document ID |
| `user_id` | `uuid` | NOT NULL, FK → auth.users(id) CASCADE | Owner |
| `filename` | `text` | NOT NULL | Original filename |
| `file_type` | `text` | NOT NULL | MIME type or extension |
| `file_size` | `integer` | NOT NULL | Size in bytes |
| `processing_status` | `text` | NOT NULL, DEFAULT 'pending' | pending/processing/completed/failed |
| `content_text` | `text` | NULL | Extracted full text |
| `search_vector` | `tsvector` | NULL | Generated column for full-text search |
| `storage_path` | `text` | NULL | Supabase Storage path |
| `created_at` | `timestamp(tz)` | NOT NULL, DEFAULT now() | Upload time |
| `updated_at` | `timestamp(tz)` | NOT NULL, DEFAULT now() | Last modification |

**Indexes**:
- `user_id` (for fast user document queries)
- `processing_status` (for filtering)
- `search_vector` GIN index (for full-text search)
- `created_at` DESC (for recent documents)

**Triggers**:
- `updated_at` auto-update
- `search_vector` auto-generated from `content_text` using `to_tsvector('english', content_text)`

**RLS Policies**:
- SELECT: `auth.uid() = user_id`
- INSERT: `auth.uid() = user_id`
- UPDATE: `auth.uid() = user_id`
- DELETE: `auth.uid() = user_id`

---

### 3. document_chunks

**Purpose**: Text segments for RAG context retrieval

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT random | Chunk ID |
| `document_id` | `uuid` | NOT NULL, FK → documents(id) CASCADE | Parent document |
| `chunk_index` | `integer` | NOT NULL | Order within document (0-based) |
| `content` | `text` | NOT NULL | Chunk text content |
| `section_title` | `text` | NULL | Heading or section name (if applicable) |
| `search_vector` | `tsvector` | NULL | Generated for full-text search |
| `created_at` | `timestamp(tz)` | NOT NULL, DEFAULT now() | Chunk creation time |

**Indexes**:
- `document_id` (for fast document chunk retrieval)
- `search_vector` GIN index (for full-text search across chunks)
- `(document_id, chunk_index)` UNIQUE (prevent duplicate chunks)

**Triggers**:
- `search_vector` auto-generated from `content` using `to_tsvector('english', content)`

**RLS Policies**:
- SELECT: `EXISTS (SELECT 1 FROM documents WHERE documents.id = document_chunks.document_id AND documents.user_id = auth.uid())`
- INSERT: Same as SELECT (user owns parent document)
- UPDATE: Same as SELECT
- DELETE: Same as SELECT

**Note**: RLS uses subquery to check document ownership, ensuring users can only access chunks of their own documents.

---

### 4. agent_requests

**Purpose**: AI agent execution tracking (Create/Edit/Research agents)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT random | Request ID |
| `user_id` | `uuid` | NOT NULL, FK → auth.users(id) CASCADE | Request owner |
| `agent_type` | `text` | NOT NULL | create/edit/research |
| `content` | `text` | NOT NULL | User prompt/request |
| `status` | `text` | NOT NULL, DEFAULT 'pending' | pending/processing/completed/failed |
| `progress` | `real` | NOT NULL, DEFAULT 0 | 0.0 to 1.0 completion |
| `results` | `jsonb` | NULL | Agent output (structured) |
| `token_cost` | `integer` | NULL | Total tokens consumed |
| `created_at` | `timestamp(tz)` | NOT NULL, DEFAULT now() | Request creation time |
| `updated_at` | `timestamp(tz)` | NOT NULL, DEFAULT now() | Last status update |

**Indexes**:
- `user_id` (for user request history)
- `status` (for filtering pending/processing)
- `created_at` DESC (for recent requests)

**Triggers**:
- `updated_at` auto-update

**RLS Policies**:
- SELECT: `auth.uid() = user_id`
- INSERT: `auth.uid() = user_id`
- UPDATE: `auth.uid() = user_id`
- DELETE: `auth.uid() = user_id`

---

### 5. agent_sessions

**Purpose**: Multi-turn conversation tracking for agent context

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT random | Session ID |
| `user_id` | `uuid` | NOT NULL, FK → auth.users(id) CASCADE | Session owner |
| `request_chain` | `jsonb` | NOT NULL, DEFAULT '[]' | Array of request IDs in order |
| `context_state` | `jsonb` | NULL | Persisted context/state between requests |
| `created_at` | `timestamp(tz)` | NOT NULL, DEFAULT now() | Session start time |
| `updated_at` | `timestamp(tz)` | NOT NULL, DEFAULT now() | Last activity |

**Indexes**:
- `user_id` (for user sessions)
- `updated_at` DESC (for recent sessions)

**Triggers**:
- `updated_at` auto-update

**RLS Policies**:
- SELECT: `auth.uid() = user_id`
- INSERT: `auth.uid() = user_id`
- UPDATE: `auth.uid() = user_id`
- DELETE: `auth.uid() = user_id`

---

### 6. usage_events

**Purpose**: Usage tracking for billing and analytics

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT random | Event ID |
| `user_id` | `uuid` | NOT NULL, FK → auth.users(id) CASCADE | User generating event |
| `event_type` | `text` | NOT NULL | agent_request/document_upload/etc |
| `tokens_used` | `integer` | NULL | Tokens consumed (if AI request) |
| `cost` | `real` | NULL | Cost in credits/currency |
| `metadata` | `jsonb` | NULL | Additional event data |
| `created_at` | `timestamp(tz)` | NOT NULL, DEFAULT now() | Event time |

**Indexes**:
- `user_id` (for user usage aggregation)
- `created_at` DESC (for billing period queries)
- `event_type` (for filtering by event type)

**Triggers**:
- None (insert-only table)

**RLS Policies**:
- SELECT: `auth.uid() = user_id`
- INSERT: `auth.uid() = user_id`
- NO UPDATE (immutable events)
- NO DELETE (audit trail)

---

## Data Validation Rules

### user_profiles
- `plan_type` ∈ {'free', 'pro', 'enterprise'}
- `subscription_status` ∈ {'active', 'cancelled', 'expired'}
- `usage_count` ≥ 0

### documents
- `processing_status` ∈ {'pending', 'processing', 'completed', 'failed'}
- `file_size` > 0
- `file_type` NOT NULL (validated at application layer)

### document_chunks
- `chunk_index` ≥ 0
- `content` NOT NULL (no empty chunks)

### agent_requests
- `agent_type` ∈ {'create', 'edit', 'research'}
- `status` ∈ {'pending', 'processing', 'completed', 'failed'}
- `progress` BETWEEN 0.0 AND 1.0
- `token_cost` ≥ 0 OR NULL

### usage_events
- `event_type` NOT NULL
- `tokens_used` ≥ 0 OR NULL
- `cost` ≥ 0 OR NULL

**Note**: Validation enforced via application-level Zod schemas and database CHECK constraints (to be added during implementation).

---

## Common Patterns

### Automatic Timestamps
All tables have `created_at` and (where applicable) `updated_at` with triggers:
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_{table_name}_updated_at
  BEFORE UPDATE ON {table_name}
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Auto User Profile Creation
```sql
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id, name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();
```

### Full-Text Search Vector Generation
```sql
CREATE TRIGGER update_documents_search_vector
  BEFORE INSERT OR UPDATE OF content_text ON documents
  FOR EACH ROW
  EXECUTE FUNCTION tsvector_update_trigger(search_vector, 'pg_catalog.english', content_text);

CREATE TRIGGER update_chunks_search_vector
  BEFORE INSERT OR UPDATE OF content ON document_chunks
  FOR EACH ROW
  EXECUTE FUNCTION tsvector_update_trigger(search_vector, 'pg_catalog.english', content);
```

---

## Migration Strategy

1. **Migration 1**: Create tables (user_profiles, documents, document_chunks, agent_requests, agent_sessions, usage_events)
2. **Migration 2**: Create indexes on all specified columns
3. **Migration 3**: Create triggers (updated_at, search_vector, auto-profile)
4. **Migration 4**: Enable RLS and create policies for all tables

**Order ensures**:
- Tables exist before indexes
- Indexes exist before RLS (for policy performance)
- All structure in place before RLS activation (prevents access issues)

---

## Type Exports for Applications

Drizzle auto-generates TypeScript types from schema. Example usage:

```typescript
import { documents, documentChunks, agentRequests } from '@/db/schema';
import type { InferModel } from 'drizzle-orm';

// Type for selecting from DB
type Document = InferModel<typeof documents, 'select'>;

// Type for inserting to DB
type NewDocument = InferModel<typeof documents, 'insert'>;

// Usage in queries
const doc: Document = await db.query.documents.findFirst({ where: eq(documents.id, docId) });
```

These types will be exported via `packages/shared/src/types/database.ts` for use in frontend and backend.

---

## Next Steps

1. Implement schema in `apps/api/src/db/schema.ts` following this model
2. Generate initial migration via `drizzle-kit generate:pg`
3. Create migration runner script `apps/api/src/db/migrate.ts`
4. Verify RLS policies in generated SQL
5. Run migration and validate table structure
6. Export types to packages/shared

**Phase 2**: Generate tasks.md with step-by-step implementation tasks.
