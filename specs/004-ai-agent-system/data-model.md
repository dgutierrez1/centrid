# Data Model: AI-Powered Exploration Workspace

**Feature**: `004-ai-agent-system`
**Date**: 2025-10-26
**Database**: PostgreSQL 15+ with pgvector extension (Supabase)
**ORM**: Drizzle ORM (type-safe schema)
**Status**: Aligned with spec.md and arch.md

---

## Overview

This document defines the database schema for the AI-Powered Exploration Workspace. The system supports:
- **Branching threads**: DAG structure with parent-child relationships
- **Provenance tracking**: Files linked to source conversations with context
- **Semantic discovery**: Unified shadow domain for cross-entity search
- **Memory chunking**: Long thread compression with semantic retrieval
- **User preferences**: Behavioral learning from interaction patterns

All tables use **Row Level Security (RLS)** with policies enforcing `auth.uid() = user_id`.

Schema is defined in `apps/api/src/db/schema.ts` using Drizzle ORM and pushed to remote Supabase using `drizzle-kit push --force` (MVP iteration, migrations deferred post-MVP).

---

## Core Entities

### 1. Shadow Entities (`shadow_entities`)

**Purpose**: Unified semantic layer for files, threads, and knowledge graph nodes (FR-010a to FR-010f).

**Why Unified** (arch.md Decision 1):
- Single source of truth for semantic search
- Easy multi-type search ("find files OR threads about RAG")
- Single pgvector index more efficient than 3+ separate indexes
- Adding new types doesn't require infrastructure changes

```typescript
// apps/api/src/db/schema.ts
import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { customType } from 'drizzle-orm/pg-core';

// Custom type for pgvector
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(768)';
  },
  toDriver(value: number[]): string {
    return JSON.stringify(value);
  },
  fromDriver(value: string): number[] {
    return JSON.parse(value);
  }
});

export const shadowEntities = pgTable('shadow_entities', {
  shadow_id: uuid('shadow_id').defaultRandom().primaryKey(),
  owner_user_id: uuid('owner_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Entity reference (polymorphic)
  entity_id: uuid('entity_id').notNull(), // file_id, thread_id, or kg_node_id
  entity_type: text('entity_type').notNull(), // 'file' | 'thread' | 'kg_node'

  // Semantic search
  embedding: vector('embedding').notNull(), // 768-dim (OpenAI text-embedding-3-small)
  summary: text('summary').notNull(), // 2-3 sentence description

  // Entity-specific metadata (JSONB for flexibility)
  structure_metadata: jsonb('structure_metadata').$type<{
    // For files: { outline: string[], key_concepts: string[] }
    // For threads: { topics: string[], decisions: string[], artifacts: string[] }
    // For KG nodes: { relationships: { type: string, target: string }[] }
  }>(),

  // Tracking
  last_updated: timestamp('last_updated').notNull().defaultNow(),

  created_at: timestamp('created_at').notNull().defaultNow(),
});

// RLS Policy
// CREATE POLICY "Users can only access their own shadow entities"
// ON shadow_entities FOR ALL
// USING (auth.uid() = owner_user_id);

// Indexes
// CREATE INDEX shadow_entities_owner_idx ON shadow_entities(owner_user_id);
// CREATE INDEX shadow_entities_entity_idx ON shadow_entities(entity_id, entity_type);
// CREATE INDEX shadow_entities_embedding_idx ON shadow_entities USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

**Fields**:
- `shadow_id`: Primary key
- `owner_user_id`: User ownership (CASCADE delete)
- `entity_id`: Reference to source entity (file/thread/kg_node)
- `entity_type`: Discriminator ('file' | 'thread' | 'kg_node')
- `embedding`: 768-dim vector for semantic search
- `summary`: Human-readable 2-3 sentence summary
- `structure_metadata`: JSONB for entity-specific data
- `last_updated`: Trigger re-generation when source changes >20% (BR-004)

**Relationships**:
- Polymorphic reference to files, threads, or kg_nodes

**Business Rules**:
- BR-004: Regenerate when source entity changes >20%
- BR-007: Semantic search limited to top 10 by final relevance score

---

### 2. Threads (`threads`)

**Purpose**: Conversation threads with branching (DAG structure) supporting exploration across parallel paths (FR-001 to FR-010).

```typescript
export const threads = pgTable('threads', {
  thread_id: uuid('thread_id').defaultRandom().primaryKey(),
  owner_user_id: uuid('owner_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Branching structure (FR-001, FR-002)
  parent_id: uuid('parent_id').references(() => threads.thread_id, { onDelete: 'restrict' }), // NULL for root threads
  branch_title: text('branch_title'), // User-editable branch name (e.g., "Explore RAG architecture")

  // Thread summary (FR-024a, BR-005)
  thread_summary: text('thread_summary'), // Auto-generated from scratch on every message (topics, decisions, artifacts, questions)
  summary_updated_at: timestamp('summary_updated_at'),

  // Context inheritance (BR-009)
  inherited_files: jsonb('inherited_files').$type<string[]>(), // File paths from parent
  parent_last_message: text('parent_last_message'), // Last message from parent thread
  branching_message_content: text('branching_message_content'), // If agent-created, the message that triggered branch

  // Shadow domain reference
  shadow_domain_id: uuid('shadow_domain_id').references(() => shadowEntities.shadow_id),

  // Metadata
  created_by: text('created_by').notNull(), // 'user' | 'agent' | 'system'
  archived: boolean('archived').default(false),
  last_activity_at: timestamp('last_activity_at').notNull().defaultNow(),

  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

// RLS Policy
// CREATE POLICY "Users can only access their own threads"
// ON threads FOR ALL
// USING (auth.uid() = owner_user_id);

// Indexes
// CREATE INDEX threads_owner_idx ON threads(owner_user_id, last_activity_at DESC);
// CREATE INDEX threads_parent_idx ON threads(parent_id); // For tree traversal
// CREATE INDEX threads_shadow_idx ON threads(shadow_domain_id);
```

**Fields**:
- `thread_id`: Primary key
- `owner_user_id`: User ownership
- `parent_id`: Parent thread (NULL for root, FK with RESTRICT to prevent orphans per BR-001)
- `branch_title`: User-editable name
- `thread_summary`: Auto-generated from scratch on every new message (BR-005)
- `inherited_files`: File references copied from parent (BR-009)
- `parent_last_message`: Context from parent thread
- `branching_message_content`: If agent-created branch, the triggering message
- `shadow_domain_id`: Link to shadow entity for semantic search

**Relationships**:
- Self-referential: parent_id → thread_id (DAG structure)
- Has many messages
- Has many context_references
- Has one shadow_entity

**Business Rules**:
- BR-001: Cannot delete if child branches exist (FK RESTRICT)
- BR-005: Summary regenerated from scratch on every message (not incremental)
- BR-009: Inherits explicit files, parent summary, parent's last message, branching message

---

### 3. Messages (`messages`)

**Purpose**: Individual messages in threads (user and assistant messages) (FR-045 to FR-051).

```typescript
export const messages = pgTable('messages', {
  message_id: uuid('message_id').defaultRandom().primaryKey(),
  thread_id: uuid('thread_id').notNull().references(() => threads.thread_id, { onDelete: 'cascade' }),
  owner_user_id: uuid('owner_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  role: text('role').notNull(), // 'user' | 'assistant'
  content: text('content').notNull(), // Markdown for assistant responses

  // Agent request link
  agent_request_id: uuid('agent_request_id'), // NULL for user messages, set for assistant messages

  // Token tracking
  tokens_used_input: integer('tokens_used_input'),
  tokens_used_output: integer('tokens_used_output'),

  created_at: timestamp('created_at').notNull().defaultNow(),
});

// RLS Policy
// CREATE POLICY "Users can only access their own messages"
// ON messages FOR ALL
// USING (auth.uid() = owner_user_id);

// Indexes
// CREATE INDEX messages_thread_idx ON messages(thread_id, created_at ASC);
```

**Fields**:
- `message_id`: Primary key
- `thread_id`: Parent thread (CASCADE delete)
- `role`: 'user' | 'assistant'
- `content`: Message text (markdown for agent)
- `agent_request_id`: Link to agent execution metadata
- `tokens_used_input/output`: Usage tracking

**Relationships**:
- Belongs to thread
- May link to agent_request

---

### 4. Thread Memory Chunks (`thread_memory_chunks`)

**Purpose**: Compressed memory for threads >40 messages (FR-024e to FR-024g, arch.md Decision 7).

```typescript
export const threadMemoryChunks = pgTable('thread_memory_chunks', {
  chunk_id: uuid('chunk_id').defaultRandom().primaryKey(),
  conversation_id: uuid('conversation_id').notNull().references(() => threads.thread_id, { onDelete: 'cascade' }),
  owner_user_id: uuid('owner_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Chunk content
  message_ids: jsonb('message_ids').$type<string[]>().notNull(), // 10 message IDs per chunk
  embedding: vector('embedding').notNull(), // 768-dim for semantic chunk retrieval
  summary: text('summary').notNull(), // Localized summary (topics, decisions, artifacts, questions from this chunk only)

  // Metadata
  timestamp_range: jsonb('timestamp_range').$type<[Date, Date]>().notNull(), // [start, end]
  chunk_index: integer('chunk_index').notNull(), // 1, 2, 3, ...

  created_at: timestamp('created_at').notNull().defaultNow(),
});

// RLS Policy
// CREATE POLICY "Users can only access their own memory chunks"
// ON thread_memory_chunks FOR ALL
// USING (auth.uid() = owner_user_id);

// Indexes
// CREATE INDEX memory_chunks_thread_idx ON thread_memory_chunks(conversation_id);
// CREATE INDEX memory_chunks_embedding_idx ON thread_memory_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);
```

**Fields**:
- `chunk_id`: Primary key
- `conversation_id`: Parent thread
- `message_ids`: Array of 10 message IDs (BR-006)
- `embedding`: For semantic chunk search
- `summary`: Localized (not cumulative) summary
- `timestamp_range`: Temporal bounds
- `chunk_index`: Sequential order

**Business Rules**:
- BR-006: Chunks created in batches of 10 messages (1-10, 11-20, 21-30)
- BR-024f: Trigger at 40 messages, compress messages 1-30, keep 31-40 as full text

---

### 5. Files (`files`)

**Purpose**: File artifacts created during conversations with provenance tracking (FR-011 to FR-020).

```typescript
export const files = pgTable('files', {
  file_id: uuid('file_id').defaultRandom().primaryKey(),
  owner_user_id: uuid('owner_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  path: text('path').notNull(), // Unique per user
  content: text('content').notNull(), // Full file content (database is source of truth)

  // Provenance tracking (BR-002, BR-003)
  created_in_conversation_id: uuid('created_in_conversation_id').references(() => threads.thread_id, { onDelete: 'set null' }), // NULL for manually created files
  creation_timestamp: timestamp('creation_timestamp'),
  context_summary: text('context_summary'), // 2-3 sentences explaining creation context

  // Edit tracking (arch.md Decision 5 - simple last-edit only)
  last_edited: timestamp('last_edited').notNull().defaultNow(),
  last_edited_by: text('last_edited_by').notNull(), // 'user' | 'agent'
  edited_in_conversation_id: uuid('edited_in_conversation_id').references(() => threads.thread_id, { onDelete: 'set null' }), // NULL if manually edited

  // Shadow domain reference
  shadow_domain_id: uuid('shadow_domain_id').references(() => shadowEntities.shadow_id),

  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

// Unique constraint per user
// ALTER TABLE files ADD CONSTRAINT files_user_path_unique UNIQUE (owner_user_id, path);

// RLS Policy
// CREATE POLICY "Users can only access their own files"
// ON files FOR ALL
// USING (auth.uid() = owner_user_id);

// Indexes
// CREATE INDEX files_owner_idx ON files(owner_user_id, created_at DESC);
// CREATE INDEX files_provenance_idx ON files(created_in_conversation_id);
```

**Fields**:
- `file_id`: Primary key
- `path`: File path (unique per user)
- `content`: Full content (database is source of truth, Storage is backup)
- `created_in_conversation_id`: Source thread (NULL for manually created per BR-002)
- `context_summary`: Creation context (2-3 sentences)
- `last_edited/last_edited_by/edited_in_conversation_id`: Simple last-edit tracking (BR-003)
- `shadow_domain_id`: Link to shadow entity for semantic search

**Business Rules**:
- BR-002: Agent-created files MUST have provenance; manually created have NULL
- BR-003: When edited, update last_edited, last_edited_by, edited_in_conversation_id
- BR-010: File rename updates path atomically, file_id stays same

---

### 6. Context References (`context_references`)

**Purpose**: Track which files/threads/folders are referenced in thread context (FR-040 to FR-044).

```typescript
export const contextReferences = pgTable('context_references', {
  reference_id: uuid('reference_id').defaultRandom().primaryKey(),
  thread_id: uuid('thread_id').notNull().references(() => threads.thread_id, { onDelete: 'cascade' }),
  owner_user_id: uuid('owner_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Reference details
  reference_type: text('reference_type').notNull(), // 'file' | 'folder' | 'thread' | 'snippet' | 'all_filesystem' | 'pasted' | 'web' | 'auto_gen'
  source_reference: text('source_reference'), // File path, folder path, thread ID, or URL

  // Snippet details (if reference_type = 'snippet')
  snippet_line_start: integer('snippet_line_start'),
  snippet_line_end: integer('snippet_line_end'),

  // State
  source: text('source').notNull(), // 'inherited' | 'manual' | '@-mentioned' | 'agent-added'
  priority_tier: integer('priority_tier').notNull(), // 1 (explicit), 2 (semantic), 3 (branch)
  is_active: boolean('is_active').default(true), // False if excluded from budget

  created_at: timestamp('created_at').notNull().defaultNow(),
});

// RLS Policy
// CREATE POLICY "Users can only access their own context references"
// ON context_references FOR ALL
// USING (auth.uid() = owner_user_id);

// Indexes
// CREATE INDEX context_refs_thread_idx ON context_references(thread_id, is_active);
```

**Fields**:
- `reference_id`: Primary key
- `thread_id`: Parent thread
- `reference_type`: Type of reference
- `source_reference`: Entity identifier (path, URL, thread ID)
- `snippet_line_start/end`: For code snippets
- `source`: How reference was added ('inherited' | 'manual' | '@-mentioned' | 'agent-added')
- `priority_tier`: 1 (explicit 1.0 weight), 2 (semantic 0.5), 3 (branch 0.7)
- `is_active`: False if didn't fit in 200K budget

**Relationships**:
- Belongs to thread
- References files, folders, threads, or external resources

---

### 7. Agent Tool Calls (`agent_tool_calls`)

**Purpose**: Audit log for agent tool execution with approval flow (FR-048, BR-008).

```typescript
export const agentToolCalls = pgTable('agent_tool_calls', {
  tool_call_id: uuid('tool_call_id').defaultRandom().primaryKey(),
  message_id: uuid('message_id').notNull().references(() => messages.message_id, { onDelete: 'cascade' }),
  thread_id: uuid('thread_id').notNull().references(() => threads.thread_id, { onDelete: 'cascade' }),
  owner_user_id: uuid('owner_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Tool details
  tool_name: text('tool_name').notNull(), // 'write_file', 'create_branch', 'search_files', 'read_file'
  tool_input: jsonb('tool_input').notNull(), // Tool parameters
  tool_output: jsonb('tool_output'), // Tool result (NULL if not executed)

  // Approval flow (FR-048)
  approval_status: text('approval_status').notNull(), // 'pending' | 'approved' | 'rejected'
  approved_at: timestamp('approved_at'),
  rejected_reason: text('rejected_reason'),

  // Tracking
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  sequence_order: integer('sequence_order').notNull(), // Execution order within agent request
});

// RLS Policy
// CREATE POLICY "Users can only access their own tool calls"
// ON agent_tool_calls FOR ALL
// USING (auth.uid() = owner_user_id);

// Indexes
// CREATE INDEX tool_calls_message_idx ON agent_tool_calls(message_id);
// CREATE INDEX tool_calls_thread_idx ON agent_tool_calls(thread_id, timestamp DESC);
```

**Fields**:
- `tool_call_id`: Primary key
- `message_id/thread_id`: Context
- `tool_name`: MCP tool name
- `tool_input/output`: Parameters and results
- `approval_status`: Approval state
- `sequence_order`: Execution order

**Business Rules**:
- BR-008: Tool calls MUST pause streaming and wait for approval before execution
- 90-day retention for audit (arch.md)

---

### 8. User Preferences (`user_preferences`)

**Purpose**: Derived user preferences from behavioral patterns (FR-027, BR-011 to BR-014, arch.md Decision 6).

```typescript
export const userPreferences = pgTable('user_preferences', {
  preference_id: uuid('preference_id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),

  // Derived preferences (not user-managed - learned from behavior)
  always_include_files: jsonb('always_include_files').$type<string[]>().default([]), // Files @-mentioned 3+ times in 30 days
  excluded_patterns: jsonb('excluded_patterns').$type<string[]>().default([]), // Files dismissed 3+ times
  blacklisted_branches: jsonb('blacklisted_branches').$type<string[]>().default([]), // Manually hidden branches

  // Context budget (dynamically adjusted based on median message complexity)
  context_budget: integer('context_budget').default(200000), // Tokens

  // Metadata
  last_updated: timestamp('last_updated').notNull().defaultNow(),
  derived_from_days: integer('derived_from_days').default(30), // Analysis window

  created_at: timestamp('created_at').notNull().defaultNow(),
});

// RLS Policy
// CREATE POLICY "Users can only access their own preferences"
// ON user_preferences FOR ALL
// USING (auth.uid() = user_id);

// Indexes
// CREATE INDEX user_prefs_user_idx ON user_preferences(user_id);
```

**Fields**:
- `preference_id`: Primary key
- `user_id`: Unique user link
- `always_include_files`: Learned from @-mention frequency (0.8 weight in context assembly)
- `excluded_patterns`: Learned from semantic match dismissals (filters out files)
- `blacklisted_branches`: Learned from manual "Hide from [Branch]" actions
- `context_budget`: Dynamically adjusted (150K/200K/250K based on complexity)
- `last_updated`: Staleness check (>24h triggers recompute)
- `derived_from_days`: Analysis window (default 30 days)

**Business Rules**:
- BR-011: Preferences derived from interactions, NOT user-managed settings
- BR-012: Loaded for every context assembly, cached per request
- BR-013: Always-include gets 0.8 weight, excluded patterns filter BEFORE semantic search
- BR-014: Recomputed daily via background job

---

### 9. Knowledge Graph Edges (`knowledge_graph_edges`)

**Purpose**: Relationships between shadow entities for advanced discovery (Phase 2+).

```typescript
export const knowledgeGraphEdges = pgTable('knowledge_graph_edges', {
  edge_id: uuid('edge_id').defaultRandom().primaryKey(),
  owner_user_id: uuid('owner_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  source_entity_id: uuid('source_entity_id').notNull().references(() => shadowEntities.shadow_id, { onDelete: 'cascade' }),
  source_type: text('source_type').notNull(), // 'file' | 'thread' | 'kg_node'

  target_entity_id: uuid('target_entity_id').notNull().references(() => shadowEntities.shadow_id, { onDelete: 'cascade' }),
  target_type: text('target_type').notNull(), // 'file' | 'thread' | 'kg_node'

  relationship_type: text('relationship_type').notNull(), // 'references' | 'derived_from' | 'related_to' | 'contradicts'
  confidence_score: real('confidence_score').notNull(), // 0-1 (auto-generated or user-confirmed)

  created_at: timestamp('created_at').notNull().defaultNow(),
});

// RLS Policy
// CREATE POLICY "Users can only access their own KG edges"
// ON knowledge_graph_edges FOR ALL
// USING (auth.uid() = owner_user_id);

// Indexes
// CREATE INDEX kg_edges_source_idx ON knowledge_graph_edges(source_entity_id);
// CREATE INDEX kg_edges_target_idx ON knowledge_graph_edges(target_entity_id);
```

**Fields**:
- `edge_id`: Primary key
- `source/target_entity_id`: Shadow entity references
- `relationship_type`: Semantic relationship
- `confidence_score`: Auto-generated or user-confirmed (0-1)

**Lifecycle** (from arch.md):
- draft (low confidence <0.5)
- confirmed (high confidence >0.8 or user-confirmed)
- deprecated (replaced by newer edge)

---

## Entity Relationships Diagram

```
users
  ├─► shadow_entities (polymorphic)
  │     └─► knowledge_graph_edges (source/target)
  │
  ├─► threads (parent_id self-ref for DAG)
  │     ├─► shadow_entities (shadow_domain_id)
  │     ├─► messages
  │     │     └─► agent_tool_calls
  │     ├─► thread_memory_chunks
  │     ├─► context_references
  │     └─► files (created_in_conversation_id, edited_in_conversation_id)
  │           └─► shadow_entities (shadow_domain_id)
  │
  └─► user_preferences (unique)
```

---

## RLS Policies Summary

All tables enforce user isolation:
```sql
CREATE POLICY "Users can only access their own {table}"
ON {table} FOR ALL
USING (auth.uid() = owner_user_id);
```

**Service Role Access**: Backend uses `ANON_KEY` (respects RLS). `SERVICE_ROLE_KEY` NOT used for user operations (Principle XV).

---

## Indexes Summary

**Performance-critical indexes**:
1. `shadow_entities_embedding_idx` - ivfflat for <1s semantic search (FR-064)
2. `threads_parent_idx` - Tree traversal (<2s for 50 branches, FR-064)
3. `messages_thread_idx` - Message history loading
4. `memory_chunks_embedding_idx` - ivfflat for chunk retrieval
5. `files_owner_idx` - File listing

**Lookup indexes**:
- All tables: `{table}_owner_idx` for user-scoped queries
- Foreign keys: Auto-indexed by Drizzle

---

## Storage Estimates (MVP Scale)

**Per User (500 concurrent users)**:
- 200 threads × 50 messages = 10K messages × 500 bytes = **5MB**
- 1000 files × 5KB avg = **5MB**
- 1000 shadow entities × 3KB (768-dim embedding) = **3MB**
- 100 memory chunks × 3KB = **300KB**
- Total per user: ~**13.3MB**

**MVP Total (500 users)**:
- Database: 500 × 13.3MB = **6.65GB** (well within Supabase free tier 10GB)
- pgvector indexes: ~2GB (500K shadow entities)
- Total: **~8.65GB**

---

## Database Operations

### Schema Push (MVP)
```bash
cd apps/api
npm run db:drop   # Drop all tables with CASCADE
npm run db:push   # Push schema + apply triggers/RLS/foreign keys
```

### Triggers (Auto-Applied)
- `updated_at` auto-update on all tables
- Shadow domain sync trigger (fire POST /shadow-domain/sync on file/thread change >20%)

### Foreign Key Cascades
- User delete → CASCADE all user data
- Thread delete → RESTRICT if children exist (BR-001), CASCADE messages/chunks/refs
- Shadow entity delete → CASCADE KG edges

---

## Migration Strategy (Post-MVP)

After MVP validation:
1. Generate initial migration: `drizzle-kit generate:pg`
2. Apply: `drizzle-kit push:pg`
3. Version control migrations in `apps/api/drizzle/migrations/`

---

## Next Steps

1. ✅ **Data model complete** - 9 entities aligned with arch.md
2. **Implement Drizzle schema** - `apps/api/src/db/schema.ts`
3. **Push to Supabase** - `npm run db:push`
4. **Generate types** - `supabase gen types typescript`
5. **Implement repositories** - 8 repositories in `apps/api/src/repositories/`

---

**Authored by**: Claude Code (Sonnet 4.5)
**Reviewed by**: Aligned with spec.md (2025-10-26) and arch.md (2025-10-26)
