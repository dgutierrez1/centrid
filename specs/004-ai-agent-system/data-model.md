# Data Model: AI Agent Execution System

**Feature**: 004-ai-agent-system
**Date**: 2025-10-24
**Database**: PostgreSQL 15+ with pgvector extension
**ORM**: Drizzle ORM (type-safe schema)

## Overview

This document defines the database schema for the AI Agent Execution System. All tables use Row Level Security (RLS) with policies enforcing `auth.uid() = user_id`. Schema is defined in `apps/api/src/db/schema.ts` using Drizzle ORM and pushed to remote Supabase using `drizzle-kit push` (MVP iteration, migrations deferred post-MVP).

### Context References & Client State Strategy

**Database State**: `context_references` table tracks which references are associated with each chat session. The `is_active` field indicates references that are currently selected.

**Client State (Valtio)**: Frontend maintains separate `activeContextReferences` array in Valtio state for immediate UI responsiveness.

**Request Flow**:
1. User selects references → Update client state (Valtio) only
2. User sends agent request → Snapshot client state in `agent_requests.context_references_snapshot`
3. Agent executes → Pulls latest content for those references from database
4. Request completes → Client state unchanged (user's selection preserved)
5. Database state (`is_active`) only synced if user explicitly adds/removes references

**Real-Time Sync Behavior** (Cross-Device) - **Three-Way Merge**:

Track three states for intelligent merging:
1. **Local State**: User's current selection (client-side)
2. **Server State**: Last known database state (baseline for diff)
3. **Remote State**: Incoming update from other device

**Merge Algorithm**:
```typescript
// Calculate changes
localChanges = diff(serverState, localState)    // What user changed locally
remoteChanges = diff(serverState, remoteState)  // What other device changed

// Merge: Apply both sets of changes
mergedState = applyBothChanges(remoteState, localChanges, remoteChanges)

// Update baseline
serverState = remoteState
localState = mergedState
```

**Conflict Resolution Rules**:
- **Add + Add** (same reference): Keep one (dedupe by reference_id)
- **Add + Remove** (different references): Keep both operations
- **Remove + Remove** (same reference): Keep removal (idempotent)
- **Add + Remove** (same reference): **Remove wins** (deletion takes precedence)

**Example Scenario**:
```typescript
// Initial: Both devices have [1, 2, 3]
serverState = [1, 2, 3]
Device A localState = [1, 2, 3]
Device B localState = [1, 2, 3]

// Device A adds 4
Device A: localState = [1, 2, 3, 4]
Device A: localChanges = { added: [4], removed: [] }

// Device B removes 3, sends to server
Device B: localState = [1, 2]
Device B: Triggers request → Server becomes [1, 2]
Device B: remoteChanges = { added: [], removed: [3] }

// Device A receives update: remoteState = [1, 2]
Device A: Calculate merge:
  - serverState = [1, 2, 3] (old baseline)
  - localState = [1, 2, 3, 4] (current)
  - remoteState = [1, 2] (incoming)

  localChanges = diff([1,2,3], [1,2,3,4]) = { added: [4], removed: [] }
  remoteChanges = diff([1,2,3], [1,2]) = { added: [], removed: [3] }

  // Merge: Start with remote, apply local changes
  mergedState = [1, 2] + add(4) - remove(3) = [1, 2, 4] ✅

Device A: Update states:
  - serverState = [1, 2] (new baseline)
  - localState = [1, 2, 4] (merged result)

// Device A triggers request with [1, 2, 4]
Device A: Sends to server → Server becomes [1, 2, 4]

// Device B receives update: remoteState = [1, 2, 4]
Device B: Calculate merge:
  - serverState = [1, 2] (old baseline)
  - localState = [1, 2] (current, no changes)
  - remoteState = [1, 2, 4] (incoming)

  localChanges = diff([1,2], [1,2]) = { added: [], removed: [] }
  remoteChanges = diff([1,2], [1,2,4]) = { added: [4], removed: [] }

  mergedState = [1, 2] + add(4) = [1, 2, 4] ✅

Device B: Update states:
  - serverState = [1, 2, 4] (new baseline)
  - localState = [1, 2, 4] (merged result)

// Final: Both devices have [1, 2, 4] ✅ CONVERGED
```

**Rationale**: Three-way merge handles concurrent operations correctly, similar to Git. Both additions and deletions are preserved. Devices always converge to same state after all updates propagate. No overwrites - changes from both sides are intelligently merged.

---

## Core Entities

### 1. Chat Sessions (`chat_sessions`)

Represents an ongoing conversation with the AI agent.

```typescript
// apps/api/src/db/schema.ts
import { pgTable, uuid, text, timestamp, integer, jsonb, vector } from 'drizzle-orm/pg-core';

export const chatSessions = pgTable('chat_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  title: text('title').notNull(), // Auto-generated from first message or user-editable
  initialization_context: text('initialization_context').notNull(), // 'file', 'folder', 'new_chat'
  initialization_path: text('initialization_path'), // File/folder path if applicable

  // Chat direction tracking (FR-012, FR-013)
  direction_embedding: vector('direction_embedding', { dimensions: 768 }), // OpenAI text-embedding-3-small
  direction_updated_at: timestamp('direction_updated_at'), // Last embedding generation time
  message_count_since_embedding: integer('message_count_since_embedding').default(0), // Trigger re-embed after 5 messages

  // Usage tracking
  total_tokens_used: integer('total_tokens_used').default(0),
  request_count: integer('request_count').default(0),
  session_duration_seconds: integer('session_duration_seconds').default(0), // Tracked on close

  // Activity tracking
  last_message_preview: text('last_message_preview'), // First 100 chars of last message
  last_activity_at: timestamp('last_activity_at').notNull().defaultNow(),

  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

// RLS Policy
// CREATE POLICY "Users can only access their own chat sessions"
// ON chat_sessions FOR ALL
// USING (auth.uid() = user_id);

// Indexes
// CREATE INDEX chat_sessions_user_id_idx ON chat_sessions(user_id);
// CREATE INDEX chat_sessions_last_activity_idx ON chat_sessions(user_id, last_activity_at DESC);
// CREATE INDEX chat_sessions_direction_embedding_idx ON chat_sessions USING ivfflat (direction_embedding vector_cosine_ops);
```

**Fields**:
- `id`: Primary key (UUID)
- `user_id`: Foreign key to users table, CASCADE delete
- `title`: Chat title (editable by user)
- `initialization_context`: How chat was created ('file'|'folder'|'new_chat')
- `initialization_path`: Initial file/folder context (nullable for 'new_chat')
- `direction_embedding`: 768-dim vector representing conversation trajectory
- `direction_updated_at`: Timestamp of last embedding generation
- `message_count_since_embedding`: Counter to trigger re-embed after 5 messages
- `total_tokens_used`: Sum of all tokens used in this chat
- `request_count`: Number of agent requests in this chat
- `session_duration_seconds`: Total time user spent in this chat (tracked on close)
- `last_message_preview`: Preview for chat list UI
- `last_activity_at`: For sorting chat list
- `created_at`: Chat creation time
- `updated_at`: Auto-updated on any change

**Relationships**:
- Many chat_messages (one-to-many)
- Many context_references (one-to-many)

---

### 2. Chat Messages (`chat_messages`)

Represents individual messages in a chat session (user and agent).

**Unified Flow Note**: User messages and agent messages are both created by `POST /chat-messages` endpoint. When a user sends a message:
1. User message record created immediately (role: 'user', agent_request_id: null)
2. Linked agent_requests record created
3. Agent executes in background
4. Agent message record created when agent completes (role: 'agent', agent_request_id: links to request)

```typescript
export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  chat_id: uuid('chat_id').notNull().references(() => chatSessions.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  role: text('role').notNull(), // 'user' | 'agent'
  content: text('content').notNull(), // Message text (markdown for agent responses)

  // Agent-specific fields
  agent_request_id: uuid('agent_request_id').references(() => agentRequests.id), // If role=agent
  confidence_score: real('confidence_score'), // 0-1, agent confidence in response
  tokens_used_input: integer('tokens_used_input'), // Input tokens for this message
  tokens_used_output: integer('tokens_used_output'), // Output tokens for this message

  // File references (FR-071d)
  referenced_files: jsonb('referenced_files').$type<string[]>(), // Array of file paths mentioned in message

  created_at: timestamp('created_at').notNull().defaultNow(),
});

// RLS Policy
// CREATE POLICY "Users can only access their own messages"
// ON chat_messages FOR ALL
// USING (auth.uid() = user_id);

// Indexes
// CREATE INDEX chat_messages_chat_id_idx ON chat_messages(chat_id, created_at);
// CREATE INDEX chat_messages_agent_request_idx ON chat_messages(agent_request_id);
```

**Fields**:
- `id`: Primary key (UUID)
- `chat_id`: Foreign key to chat_sessions, CASCADE delete
- `user_id`: Foreign key to users, CASCADE delete
- `role`: Message author ('user' or 'agent')
- `content`: Message content (markdown for agent responses)
- `agent_request_id`: Link to agent_requests if role=agent (nullable for user messages)
- `confidence_score`: Agent's confidence in response (0-1, nullable for user messages)
- `tokens_used_input`: Input tokens consumed by this message
- `tokens_used_output`: Output tokens generated by this message
- `referenced_files`: Array of file paths mentioned in message (for FR-071d clickable links)
- `created_at`: Message timestamp

**Relationships**:
- Belongs to chat_sessions (many-to-one)
- Optionally links to agent_requests (many-to-one)

---

### 3. Context References (`context_references`)

Represents active context elements in a chat session.

```typescript
export const contextReferences = pgTable('context_references', {
  id: uuid('id').defaultRandom().primaryKey(),
  chat_id: uuid('chat_id').notNull().references(() => chatSessions.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  reference_type: text('reference_type').notNull(), // 'file' | 'folder' | 'snippet' | 'all_filesystem' | 'pasted' | 'web' | 'auto_gen'
  display_label: text('display_label').notNull(), // UI label (e.g., "Button.tsx", "Snippet from Button.tsx (lines 45-67)")

  // Source references (depends on reference_type)
  source_reference: text('source_reference'), // File path, folder path, URL, or 'user-pasted'
  source_file_id: uuid('source_file_id').references(() => documents.id, { onDelete: 'set null' }), // For file/snippet references (from 003)
  source_folder_path: text('source_folder_path'), // For folder references (references 003 folders.path)

  // Snippet-specific (FR-030 to FR-034)
  snippet_line_start: integer('snippet_line_start'), // Nullable, for file snippets
  snippet_line_end: integer('snippet_line_end'), // Nullable, for file snippets
  snippet_content_snapshot: text('snippet_content_snapshot'), // Snapshot at time of creation (for invalidation detection)
  snippet_auto_gen_id: uuid('snippet_auto_gen_id').references(() => autoGenArtifacts.id, { onDelete: 'set null' }), // If snippet converted to auto-gen

  // Metadata
  content_preview: text('content_preview'), // First 100 chars of content
  token_count: integer('token_count'), // Estimated tokens

  // Reference status (FR-006e)
  is_active: boolean('is_active').default(true), // False if removed from active reference list
  is_file_deleted: boolean('is_file_deleted').default(false), // True if source file/folder deleted (FR-006e)

  created_at: timestamp('created_at').notNull().defaultNow(),
});

// RLS Policy
// CREATE POLICY "Users can only access their own context references"
// ON context_references FOR ALL
// USING (auth.uid() = user_id);

// Indexes
// CREATE INDEX context_references_chat_id_idx ON context_references(chat_id, is_active);
// CREATE INDEX context_references_source_file_idx ON context_references(source_file_id);
```

**Fields**:
- `id`: Primary key (UUID)
- `chat_id`: Foreign key to chat_sessions, CASCADE delete
- `user_id`: Foreign key to users, CASCADE delete
- `reference_type`: Type of context ('file', 'folder', 'snippet', 'all_filesystem', 'pasted', 'web', 'auto_gen')
- `display_label`: UI-friendly label shown in reference UI
- `source_reference`: Path/URL/identifier depending on reference_type
- `source_file_id`: Foreign key to **documents.id (from 003)** for file/snippet references (nullable, SET NULL on delete)
- `source_folder_path`: Folder path for folder references (references **folders.path from 003**)
- `snippet_line_start`: Start line number for snippets (nullable)
- `snippet_line_end`: End line number for snippets (nullable)
- `snippet_content_snapshot`: Original snippet content at creation time (for invalidation detection)
- `snippet_auto_gen_id`: Foreign key to auto_gen_artifacts if snippet converted after file change
- `content_preview`: Short preview for hover tooltip
- `token_count`: Estimated tokens consumed by this context
- `is_active`: Whether reference is currently in active reference list (false if user removed it)
- `is_file_deleted`: Whether source file/folder has been deleted (FR-006e)
- `created_at`: Reference creation timestamp

**Relationships**:
- Belongs to chat_sessions (many-to-one, CASCADE delete)
- Optionally links to **documents (from 003)** for file/snippet references (many-to-one, SET NULL on delete)
- Optionally links to **folders (from 003)** via source_folder_path (text reference, no FK)
- Optionally links to auto_gen_artifacts for converted snippets (many-to-one, SET NULL on delete)

---

### 4. Filesystem Integration (from Feature 003)

**Architecture Decision**: AI Agent system leverages Feature 003's filesystem tables as the shadow filesystem, creating a **unified indexing layer** rather than duplicate tables (per spec clarification: "Same indexing layer. Document chunks should work toward being the shadow filesystem - unified system, not separate layers").

**003 Tables Referenced:**

#### `folders` (from 003)
- **Purpose**: Hierarchical folder structure
- **Key Fields**: `id`, `user_id`, `name`, `parent_folder_id`, `path`, `created_at`, `updated_at`
- **RLS**: Users can only access their own folders
- **Used For**: Folder hierarchy navigation, context priming (FR-036)

#### `documents` (from 003)
- **Purpose**: File metadata with cached content and indexing status
- **Key Fields**:
  - `id`: UUID (used in context_references.source_file_id)
  - `user_id`: User ownership
  - `folder_id`: FK to folders (hierarchy)
  - `name`: Filename
  - `path`: Computed absolute path (e.g., "/Projects/MVP/spec.md")
  - `content_text`: **Cached content from Storage** (enables fast MCP reads: 10-50ms vs 100-300ms)
  - `file_size`: Size in bytes
  - `mime_type`: 'text/markdown' or 'text/plain'
  - `version`: Optimistic locking counter
  - `indexing_status`: 'pending' | 'in_progress' | 'completed' | 'failed' (FR-003a, FR-007e)
  - `last_edit_by`: user_id or 'agent' (FR-007d - tracks human vs AI edits)
  - `storage_path`: Reference to Supabase Storage location
  - `created_at`, `updated_at`
- **RLS**: Users can only access their own documents
- **Used For**: File metadata, content access (MCP read_document tool), edit tracking

#### `document_chunks` (from 003)
- **Purpose**: **Chunk-level embeddings** for semantic search (400-500 tokens per chunk)
- **Key Fields**:
  - `id`: UUID
  - `document_id`: FK to documents.id
  - `content`: Text segment (400-500 tokens)
  - `position`: Order in document (0, 1, 2, ...)
  - `embedding`: **768-dim vector** (OpenAI text-embedding-3-small)
  - `created_at`, `updated_at`
- **Indexes**: `ivfflat` index on embedding for fast vector similarity search
- **RLS**: Users can read chunks for their own documents
- **Used For**: **Semantic search** (FR-037), context retrieval, RAG

**Why Chunk-Level Embeddings (Not File-Level)?**

Chunk-based approach provides superior precision and token efficiency:
- **Precision**: Retrieves only relevant sections from large files (e.g., 2 relevant chunks from 50-page doc)
- **Token Efficiency**: 92% savings (2,000 tokens vs 25,000 for entire file)
- **Scalability**: Works for files of any size
- **Industry Standard**: How RAG systems work (LangChain, LlamaIndex)

**Example Query Flow**:
```typescript
// User asks: "What are the pricing decisions?"
// 1. Semantic search on document_chunks
const relevantChunks = await supabase.rpc('search_document_chunks', {
  query_embedding: await generateEmbedding(query),
  match_threshold: 0.7,
  match_count: 20,
  user_id: userId,
});

// Returns: 20 most relevant chunks with file paths
// Result:
// - Chunk from /projects/mvp/decisions.md (lines 120-140): "Pricing Model: $X/month..."
// - Chunk from /projects/mvp/architecture.md (lines 45-67): "Price tier structure..."

// 2. Build context from chunks (10,000 tokens total)
// 3. Agent synthesizes answer from focused, relevant content
```

**Integration Points**:

| 004 Table | References 003 Table | Purpose |
|-----------|---------------------|---------|
| `context_references` | `documents.id` (FK) | Link context pills to files |
| `agent_interactions` | `documents.path` (in tool_input) | File operations reference path |
| `auto_gen_artifacts` | `documents.id` (FK, optional) | Link generated content to source files |

**MCP Tool Implementation**:

```typescript
// read_document tool (fast path via content_text cache)
export async function read_document(file_path: string, user_id: string) {
  const document = await supabase
    .from('documents')
    .select('path, content_text, last_modified, last_edit_by')
    .eq('path', file_path)
    .eq('user_id', user_id)
    .single();

  return {
    file_path: document.path,
    content: document.content_text, // 10-50ms read from DB
    last_modified: document.updated_at,
    last_edit_by: document.last_edit_by,
  };
}

// search_documents tool (semantic search via chunks)
export async function search_documents(query: string, user_id: string) {
  const queryEmbedding = await generateEmbedding(query);

  const chunks = await supabase.rpc('search_document_chunks', {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: 20,
    user_id: user_id,
  });

  // Group chunks by document, return top files with snippets
  return chunks.map(chunk => ({
    file_path: chunk.document_path,
    snippet: chunk.content.substring(0, 200),
    similarity: chunk.similarity,
  }));
}
```

---

### 5. Agent Requests (`agent_requests`)

Represents a single agent execution with full audit trail.

**Unified Flow Note**: Agent requests are automatically created by `POST /chat-messages` endpoint (not a separate API call). Each agent request:
- Links to the user's chat_messages record via agent_request_id foreign key
- Stores context_references_snapshot (frozen context at request time)
- Executes in background while streaming progress via SSE + Realtime
- Creates agent_interactions records for each tool call (read_document, web_search, etc.)
- Final response stored in agent_response field and linked to agent's chat_messages record

```typescript
export const agentRequests = pgTable('agent_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  chat_id: uuid('chat_id').notNull().references(() => chatSessions.id, { onDelete: 'cascade' }),

  // Request details
  user_message: text('user_message').notNull(), // User's original message
  intent_type: text('intent_type').notNull(), // 'question' | 'edit' | 'create' | 'refactor' | 'search' | 'delete' (FR-041)

  // Context at request time (snapshot)
  context_references_snapshot: jsonb('context_references_snapshot').$type<ContextReferenceSnapshot[]>(),
  context_used_tokens: integer('context_used_tokens'), // Total tokens used for context

  // Agent response
  agent_response: text('agent_response'), // Agent's final response (nullable while processing)
  confidence_score: real('confidence_score'), // 0-1 (FR-072 to FR-075)

  // Execution status
  status: text('status').notNull().default('pending'), // 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  progress: real('progress').default(0.0), // 0.0 to 1.0 (FR-067 to FR-071)
  progress_message: text('progress_message'), // Current status message

  // Usage tracking (FR-077 to FR-080, FR-117 to FR-121)
  tokens_used_input: integer('tokens_used_input'),
  tokens_used_output: integer('tokens_used_output'),
  processing_time_ms: integer('processing_time_ms'), // Milliseconds from start to completion
  cost_llm_input: real('cost_llm_input'), // $ cost for input tokens
  cost_llm_output: real('cost_llm_output'), // $ cost for output tokens
  cost_embeddings: real('cost_embeddings'), // $ cost for embedding generation
  cost_web_search: real('cost_web_search'), // $ cost for web search API
  cost_total: real('cost_total'), // Sum of all costs

  // Error handling
  error_message: text('error_message'), // Nullable, set if status='failed'
  retry_count: integer('retry_count').default(0), // Number of retries attempted

  created_at: timestamp('created_at').notNull().defaultNow(),
  completed_at: timestamp('completed_at'), // Nullable until completed/failed
});

// RLS Policy
// CREATE POLICY "Users can only access their own agent requests"
// ON agent_requests FOR ALL
// USING (auth.uid() = user_id);

// Indexes
// CREATE INDEX agent_requests_user_id_idx ON agent_requests(user_id, created_at DESC);
// CREATE INDEX agent_requests_chat_id_idx ON agent_requests(chat_id, created_at);
// CREATE INDEX agent_requests_status_idx ON agent_requests(status, created_at);
```

**Fields**:
- `id`: Primary key (UUID)
- `user_id`: Foreign key to users, CASCADE delete
- `chat_id`: Foreign key to chat_sessions, CASCADE delete
- `user_message`: Original user message
- `intent_type`: Detected intent ('question', 'edit', 'create', 'refactor', 'search', 'delete')
- `context_references_snapshot`: JSON snapshot of context references at request time
- `context_used_tokens`: Total tokens consumed by context
- `agent_response`: Agent's final response text (nullable while processing)
- `confidence_score`: Agent's confidence in response (0-1)
- `status`: Request status ('pending', 'processing', 'completed', 'failed', 'cancelled')
- `progress`: Progress indicator (0.0-1.0)
- `progress_message`: Current status message for UI
- `tokens_used_input`: Input tokens consumed
- `tokens_used_output`: Output tokens generated
- `processing_time_ms`: Total processing time in milliseconds
- `cost_llm_input`: Cost of input tokens ($)
- `cost_llm_output`: Cost of output tokens ($)
- `cost_embeddings`: Cost of embedding generation ($)
- `cost_web_search`: Cost of web search API calls ($)
- `cost_total`: Total cost for this request ($)
- `error_message`: Error description if failed (nullable)
- `retry_count`: Number of retry attempts
- `created_at`: Request creation time
- `completed_at`: Request completion time (nullable)

**Relationships**:
- Belongs to chat_sessions (many-to-one)
- Many agent_interactions reference this (one-to-many)
- Many audit_log_entries reference this (one-to-many)
- Many usage_events reference this (one-to-many)

---

### 6. Agent Interactions (`agent_interactions`)

Unified tracking of all agent tool calls (file operations, web search, confirmations, etc). Provides complete audit trail and enables conflict detection for concurrent file modifications.

```typescript
export const agentInteractions = pgTable('agent_interactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  agent_request_id: uuid('agent_request_id').notNull().references(() => agentRequests.id, { onDelete: 'cascade' }),
  message_id: uuid('message_id').references(() => chatMessages.id, { onDelete: 'set null' }), // Ties tool call to specific message
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Tool execution details
  tool_name: text('tool_name').notNull(), // 'read_document' | 'update_document' | 'create_document' | 'delete_document' | 'search_documents' | 'web_search' | 'list_directory' | etc
  tool_input: jsonb('tool_input').$type<Record<string, any>>().notNull(), // Parameters passed to tool (e.g., {file_path: "...", content: "..."})
  tool_output: jsonb('tool_output').$type<Record<string, any>>(), // Tool execution results (nullable while processing)

  // Approval workflow (for write operations)
  requires_confirmation: boolean('requires_confirmation').default(false), // Does this need user approval?
  confirmation_status: text('confirmation_status'), // 'pending' | 'approved' | 'rejected' | null (for non-write operations)
  confirmed_at: timestamp('confirmed_at'), // When user approved/rejected (nullable)
  applied_at: timestamp('applied_at'), // When change was applied to filesystem (nullable)

  // Execution tracking
  status: text('status').notNull().default('pending'), // 'pending' | 'running' | 'completed' | 'failed' | 'rejected'
  error_message: text('error_message'), // Nullable, set if status='failed'

  // Sequencing (for ordered execution)
  sequence_order: integer('sequence_order').notNull(), // Order within agent_request (1, 2, 3...)

  created_at: timestamp('created_at').notNull().defaultNow(),
  completed_at: timestamp('completed_at'), // Nullable until completed/failed
});

// RLS Policy
// CREATE POLICY "Users can only access their own agent interactions"
// ON agent_interactions FOR ALL
// USING (auth.uid() = user_id);

// Indexes
// CREATE INDEX agent_interactions_request_idx ON agent_interactions(agent_request_id, sequence_order);
// CREATE INDEX agent_interactions_message_idx ON agent_interactions(message_id);
// CREATE INDEX agent_interactions_user_idx ON agent_interactions(user_id, created_at DESC);
// CREATE INDEX agent_interactions_tool_status_idx ON agent_interactions(tool_name, status) WHERE requires_confirmation = true; -- For conflict detection
```

**Fields**:
- `id`: Primary key (UUID)
- `agent_request_id`: Foreign key to agent_requests, CASCADE delete
- `message_id`: Foreign key to chat_messages (ties tool call to specific message, SET NULL on delete)
- `user_id`: Foreign key to users, CASCADE delete
- `tool_name`: Name of MCP tool executed
- `tool_input`: JSON object with tool parameters (file paths, content, search queries, etc)
- `tool_output`: JSON object with tool results (nullable while processing)
- `requires_confirmation`: Whether this operation needs user approval (true for write operations)
- `confirmation_status`: User's approval decision ('pending', 'approved', 'rejected', null for read-only)
- `confirmed_at`: Timestamp when user approved/rejected (nullable)
- `applied_at`: Timestamp when change was applied to filesystem (nullable)
- `status`: Execution status ('pending', 'running', 'completed', 'failed', 'rejected')
- `error_message`: Error description if failed (nullable)
- `sequence_order`: Execution order within agent request (1, 2, 3...)
- `created_at`: Interaction creation time
- `completed_at`: Interaction completion time (nullable)

**Relationships**:
- Belongs to agent_requests (many-to-one)
- Optionally links to chat_messages (many-to-one, SET NULL on delete)

**Conflict Detection Query Example**:
```sql
-- Find all pending file modifications
SELECT DISTINCT tool_input->>'file_path' as conflicting_file
FROM agent_interactions
WHERE tool_name IN ('update_document', 'create_document', 'delete_document')
  AND status IN ('pending', 'running')
  AND confirmation_status IN ('pending', 'approved')
  AND agent_request_id IN (
    SELECT id FROM agent_requests WHERE status = 'processing'
  );
```

**Web Search Storage Strategy**:
- **Always**: Store raw results in `agent_interactions.tool_output` (audit trail)
- **Optionally**: If research is substantial, agent creates formatted artifact → `auto_gen_artifacts` with `source_interaction_id` linking back to this interaction

---

### 7. Auto-Generated Artifacts (`auto_gen_artifacts`)

Represents hidden reference content created automatically.

```typescript
export const autoGenArtifacts = pgTable('auto_gen_artifacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  chat_id: uuid('chat_id').notNull().references(() => chatSessions.id, { onDelete: 'cascade' }),

  artifact_type: text('artifact_type').notNull(), // 'web-source' | 'pasted-code' | 'inline-example' | 'invalidated-snippet' (FR-025 to FR-029, FR-032c)
  source_reference: text('source_reference'), // URL, 'user-pasted', or original file path for snippets
  source_interaction_id: uuid('source_interaction_id').references(() => agentInteractions.id, { onDelete: 'set null' }), // Links to agent_interactions if created from tool call (e.g., web_search)

  content: text('content').notNull(), // Full artifact content
  content_embedding: vector('content_embedding', { dimensions: 768 }), // For similarity search

  // Metadata
  token_count: integer('token_count'), // Estimated tokens

  created_at: timestamp('created_at').notNull().defaultNow(),
});

// RLS Policy
// CREATE POLICY "Users can only access their own auto-generated artifacts"
// ON auto_gen_artifacts FOR ALL
// USING (auth.uid() = user_id);

// Indexes
// CREATE INDEX auto_gen_artifacts_user_id_idx ON auto_gen_artifacts(user_id);
// CREATE INDEX auto_gen_artifacts_chat_id_idx ON auto_gen_artifacts(chat_id);
// CREATE INDEX auto_gen_artifacts_embedding_idx ON auto_gen_artifacts USING ivfflat (content_embedding vector_cosine_ops);
```

**Fields**:
- `id`: Primary key (UUID)
- `user_id`: Foreign key to users, CASCADE delete
- `chat_id`: Foreign key to chat_sessions, CASCADE delete
- `artifact_type`: Type of artifact ('web-source', 'pasted-code', 'inline-example', 'invalidated-snippet')
- `source_reference`: Origin URL, 'user-pasted', or original file path
- `source_interaction_id`: Foreign key to agent_interactions if created from tool call (SET NULL on delete)
- `content`: Full artifact text
- `content_embedding`: 768-dim vector for semantic search
- `token_count`: Estimated token count
- `created_at`: Artifact creation time

**Relationships**:
- Belongs to chat_sessions (many-to-one)
- Optionally links to agent_interactions (many-to-one, SET NULL on delete)
- May be referenced by context_references for invalidated snippets (one-to-many)

---

### 8. User Preference Profile (`user_preference_profiles`)

Represents analyzed user preferences from filesystem (FR-034 to FR-036).

```typescript
export const userPreferenceProfiles = pgTable('user_preference_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),

  // Organizational preferences (FR-034)
  folder_structure_patterns: jsonb('folder_structure_patterns').$type<Record<string, any>>(), // Folder naming conventions, hierarchy patterns
  naming_conventions: jsonb('naming_conventions').$type<Record<string, any>>(), // File naming patterns (camelCase, kebab-case, etc)

  // Content structure (FR-035)
  preferred_content_structure: jsonb('preferred_content_structure').$type<Record<string, any>>(), // Heading hierarchy, section organization
  documentation_organization_style: text('documentation_organization_style'), // 'chronological' | 'topical' | 'project-based'

  // Formatting patterns
  tone_and_formality: text('tone_and_formality'), // 'formal' | 'casual' | 'mixed'
  verbosity_level: text('verbosity_level'), // 'concise' | 'detailed' | 'verbose'

  // Analysis metadata
  last_analysis_at: timestamp('last_analysis_at').notNull(),
  source_files_analyzed_count: integer('source_files_analyzed_count').notNull().default(0),
  analysis_confidence: real('analysis_confidence'), // 0-1, confidence in profile accuracy

  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

// RLS Policy
// CREATE POLICY "Users can only access their own preference profile"
// ON user_preference_profiles FOR ALL
// USING (auth.uid() = user_id);

// Indexes
// CREATE UNIQUE INDEX user_preference_profiles_user_id_idx ON user_preference_profiles(user_id);
```

**Fields**:
- `id`: Primary key (UUID)
- `user_id`: Foreign key to users, CASCADE delete (UNIQUE - one profile per user)
- `folder_structure_patterns`: JSON object with folder organization patterns
- `naming_conventions`: JSON object with file naming patterns
- `preferred_content_structure`: JSON object with content organization preferences
- `documentation_organization_style`: High-level organization approach
- `tone_and_formality`: Detected writing tone
- `verbosity_level`: Detected level of detail in user's writing
- `last_analysis_at`: Last profile update timestamp
- `source_files_analyzed_count`: Number of files analyzed to build profile
- `analysis_confidence`: Confidence in profile accuracy (0-1)
- `created_at`: Profile creation time
- `updated_at`: Auto-updated on change

**Relationships**:
- One user has one profile (one-to-one)

---

### 9. Audit Log Entries (`audit_log_entries`)

Represents logged system events for security and debugging (FR-098).

```typescript
export const auditLogEntries = pgTable('audit_log_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'set null' }), // Nullable for system events
  session_id: uuid('session_id').references(() => chatSessions.id, { onDelete: 'set null' }), // Nullable
  agent_request_id: uuid('agent_request_id').references(() => agentRequests.id, { onDelete: 'set null' }), // Nullable

  event_type: text('event_type').notNull(), // 'request_start' | 'file_read' | 'write_permission_request' | 'user_approval' | 'user_rejection' | 'file_modification' | 'error' | 'completion'
  event_details: jsonb('event_details').$type<Record<string, any>>(), // JSON with event-specific data

  // Related entities (for filtering)
  related_entity_type: text('related_entity_type'), // 'file' | 'folder' | 'chat' | 'user' (nullable)
  related_entity_id: text('related_entity_id'), // File path, folder path, or ID (nullable)

  success_status: boolean('success_status').notNull(), // Whether event succeeded

  created_at: timestamp('created_at').notNull().defaultNow(),
});

// RLS Policy
// CREATE POLICY "Users can only access their own audit logs"
// ON audit_log_entries FOR SELECT
// USING (auth.uid() = user_id);

// Indexes
// CREATE INDEX audit_log_entries_user_id_idx ON audit_log_entries(user_id, created_at DESC);
// CREATE INDEX audit_log_entries_event_type_idx ON audit_log_entries(event_type, created_at DESC);
// CREATE INDEX audit_log_entries_request_id_idx ON audit_log_entries(agent_request_id);
```

**Fields**:
- `id`: Primary key (UUID)
- `user_id`: Foreign key to users (nullable for system events, SET NULL on delete)
- `session_id`: Foreign key to chat_sessions (nullable, SET NULL on delete)
- `agent_request_id`: Foreign key to agent_requests (nullable, SET NULL on delete)
- `event_type`: Type of event logged
- `event_details`: JSON object with event-specific data
- `related_entity_type`: Type of related entity ('file', 'folder', 'chat', 'user')
- `related_entity_id`: ID or path of related entity
- `success_status`: Whether event succeeded
- `created_at`: Event timestamp

**Relationships**:
- Optionally links to users, chat_sessions, agent_requests (many-to-one, SET NULL on delete)

---

### 10. Usage Events (`usage_events`)

Unified tracking for both usage limits (agent execution quotas) and cost breakdown for all billable operations. Supports business analytics and user billing.

```typescript
export const usageEvents = pgTable('usage_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  agent_request_id: uuid('agent_request_id').references(() => agentRequests.id, { onDelete: 'set null' }), // Nullable for non-agent events (e.g., document upload)

  // Event classification
  event_type: text('event_type').notNull(), // 'agent_execution' | 'document_upload' | 'embedding_generation' | 'storage' | 'bandwidth'
  operation_subtype: text('operation_subtype'), // For agent_execution: 'question' | 'edit' | 'create' | 'refactor' | 'search' (nullable for other event types)

  // Usage tracking (for agent execution limits)
  tokens_used: integer('tokens_used'), // AI tokens consumed (nullable for non-AI events)

  // Storage tracking (for storage events)
  storage_bytes: bigint('storage_bytes'), // Bytes stored/transferred (nullable for non-storage events)

  // Cost breakdown (for billing)
  cost_llm_input_tokens: real('cost_llm_input_tokens').default(0),
  cost_llm_output_tokens: real('cost_llm_output_tokens').default(0),
  cost_embedding_generation: real('cost_embedding_generation').default(0),
  cost_vector_storage: real('cost_vector_storage').default(0),
  cost_web_search_api: real('cost_web_search_api').default(0),
  cost_file_storage: real('cost_file_storage').default(0),
  cost_bandwidth: real('cost_bandwidth').default(0),
  cost_other: real('cost_other').default(0), // Miscellaneous costs

  cost_total: real('cost_total').notNull(), // Sum of all costs

  // Event metadata
  event_metadata: jsonb('event_metadata').$type<Record<string, any>>(), // Flexible for event-specific data (file paths, operation details, etc)

  created_at: timestamp('created_at').notNull().defaultNow(),
});

// RLS Policy
// CREATE POLICY "Users can only access their own usage events for agent_execution type"
// ON usage_events FOR SELECT
// USING (auth.uid() = user_id AND event_type = 'agent_execution');
//
// CREATE POLICY "Admins can access all usage events"
// ON usage_events FOR SELECT
// USING (auth.jwt() ->> 'role' = 'admin');

// Indexes
// CREATE INDEX usage_events_user_id_idx ON usage_events(user_id, created_at DESC);
// CREATE INDEX usage_events_event_type_idx ON usage_events(event_type, created_at DESC);
// CREATE INDEX usage_events_agent_request_idx ON usage_events(agent_request_id);
```

**Fields**:
- `id`: Primary key (UUID)
- `user_id`: Foreign key to users, CASCADE delete
- `agent_request_id`: Foreign key to agent_requests (nullable for non-agent events, SET NULL on delete)
- `event_type`: High-level event category
- `operation_subtype`: Detailed operation type (nullable for non-agent events)
- `tokens_used`: AI tokens consumed (nullable for non-AI events)
- `storage_bytes`: Bytes stored/transferred (nullable for non-storage events)
- `cost_llm_input_tokens`: Cost of LLM input tokens ($)
- `cost_llm_output_tokens`: Cost of LLM output tokens ($)
- `cost_embedding_generation`: Cost of embedding API calls ($)
- `cost_vector_storage`: Cost of pgvector storage ($)
- `cost_web_search_api`: Cost of web search API calls ($)
- `cost_file_storage`: Cost of Supabase Storage ($)
- `cost_bandwidth`: Cost of bandwidth/downloads ($)
- `cost_other`: Other miscellaneous costs ($)
- `cost_total`: Total cost for this event ($)
- `event_metadata`: JSON object with event-specific data
- `created_at`: Event timestamp

**Relationships**:
- Belongs to users (many-to-one)
- Optionally links to agent_requests (many-to-one, SET NULL on delete)

**RLS Policy Notes**:
- Users can view their own `agent_execution` events (for usage tracking UI)
- All other event types (storage, embeddings, bandwidth) are admin-only
- Complete cost breakdown is admin-only (business analytics)

**Usage Limit Queries**:
```sql
-- Count user's agent executions this month
SELECT COUNT(*) FROM usage_events
WHERE user_id = ?
  AND event_type = 'agent_execution'
  AND created_at >= date_trunc('month', now());

-- Total tokens used this month
SELECT SUM(tokens_used) FROM usage_events
WHERE user_id = ?
  AND event_type = 'agent_execution'
  AND created_at >= date_trunc('month', now());
```

**Cost Analysis Queries** (Admin):
```sql
-- Total costs by event type (last 30 days)
SELECT event_type, SUM(cost_total) as total_cost
FROM usage_events
WHERE created_at >= now() - interval '30 days'
GROUP BY event_type
ORDER BY total_cost DESC;

-- Per-user costs
SELECT user_id, SUM(cost_total) as total_cost
FROM usage_events
WHERE created_at >= date_trunc('month', now())
GROUP BY user_id
ORDER BY total_cost DESC;
```

---

### 11. User Feedback (`user_feedback`)

Represents user ratings for agent messages (FR-115).

```typescript
export const userFeedback = pgTable('user_feedback', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  agent_request_id: uuid('agent_request_id').notNull().references(() => agentRequests.id, { onDelete: 'cascade' }),
  message_id: uuid('message_id').notNull().references(() => chatMessages.id, { onDelete: 'cascade' }),

  rating_type: text('rating_type').notNull(), // 'thumbs_up' | 'thumbs_down'

  // Optional text feedback (post-MVP)
  feedback_text: text('feedback_text'), // Nullable, deferred to post-MVP

  created_at: timestamp('created_at').notNull().defaultNow(),
});

// RLS Policy
// CREATE POLICY "Users can only access their own feedback"
// ON user_feedback FOR ALL
// USING (auth.uid() = user_id);

// Indexes
// CREATE INDEX user_feedback_user_id_idx ON user_feedback(user_id, created_at DESC);
// CREATE INDEX user_feedback_request_id_idx ON user_feedback(agent_request_id);
// CREATE INDEX user_feedback_message_id_idx ON user_feedback(message_id);
```

**Fields**:
- `id`: Primary key (UUID)
- `user_id`: Foreign key to users, CASCADE delete
- `agent_request_id`: Foreign key to agent_requests, CASCADE delete
- `message_id`: Foreign key to chat_messages, CASCADE delete
- `rating_type`: User's rating ('thumbs_up' or 'thumbs_down')
- `feedback_text`: Optional text feedback (deferred to post-MVP)
- `created_at`: Feedback timestamp

**Relationships**:
- Belongs to users, agent_requests, chat_messages (many-to-one)

---

## Entity Relationships Diagram

```
users (from existing schema)
  ├── chat_sessions (1:many)
  │   ├── chat_messages (1:many)
  │   │   ├── agent_requests (1:many, optional)
  │   │   └── agent_interactions (1:many, optional, SET NULL)
  │   ├── context_references (1:many)
  │   │   ├── documents (from 003) (many:1, optional, SET NULL)
  │   │   └── auto_gen_artifacts (many:1, optional, SET NULL)
  │   ├── auto_gen_artifacts (1:many)
  │   │   └── agent_interactions (many:1, optional, SET NULL)
  │   └── agent_requests (1:many)
  │       ├── agent_interactions (1:many) -- **NEW: Unified tool call tracking**
  │       ├── audit_log_entries (1:many, optional)
  │       └── usage_events (1:many, optional)
  ├── folders (from 003) (1:many) -- Hierarchical folder structure
  ├── documents (from 003) (1:many) -- Files with metadata + content_text cache
  ├── document_chunks (from 003) (1:many) -- Chunk-level embeddings for semantic search
  ├── user_profiles (from 003) (1:1) -- Storage quotas
  ├── user_preference_profiles (1:1) -- AI-detected writing preferences
  ├── audit_log_entries (1:many, optional)
  ├── usage_events (1:many)
  └── user_feedback (1:many)
      ├── agent_requests (many:1)
      └── chat_messages (many:1)
```

---

## RLS Policies Summary

All tables enforce Row Level Security with `auth.uid() = user_id` policies. Foreign key CASCADE deletes ensure data cleanup when users are deleted. Exceptions:

1. **usage_events**: Users can view their own `agent_execution` events; all other event types (storage, embeddings, bandwidth) are admin-only for business analytics
2. **audit_log_entries**: Read-only access for users, admin can write
3. **Foreign key SET NULL**: When referenced entities are deleted, foreign keys are set to NULL instead of cascading (e.g., context_references.source_file_id, agent_interactions.message_id)

---

## Indexes Summary

**Performance-critical indexes**:
1. User-scoped queries: All tables have `(user_id, created_at DESC)` or `(user_id, relevant_field)` indexes
2. Vector search: `ivfflat` indexes on all embedding columns (**document_chunks from 003**, auto_gen_artifacts, chat_sessions)
3. Chat queries: `(chat_id, created_at)` for message/reference retrieval
4. Status filtering: `(status, created_at)` for agent_requests
5. Folder hierarchy: `(user_id, parent_folder_id)` in **folders table (from 003)** for navigation
6. Document lookup: `(user_id, path)` in **documents table (from 003)** for fast MCP tool reads

---

## Storage Estimates (MVP Scale)

**Per User** (5,000 files, 100 chats, 500 agent requests):

### 004 Tables (AI Agent System)

| Table | Rows | Size/Row | Total |
|-------|------|----------|-------|
| chat_sessions | 100 | ~5KB (chat direction embedding) | 0.5MB |
| chat_messages | 5,000 | ~1KB (text + metadata) | 5MB |
| context_references | 1,000 | ~500B (references, minimal data) | 0.5MB |
| agent_requests | 500 | ~3KB (context snapshot, no embedded changes) | 1.5MB |
| agent_interactions | 2,000 | ~2KB (tool calls + input/output) | 4MB |
| auto_gen_artifacts | 500 | ~5KB (3KB embedding + 2KB content) | 2.5MB |
| user_preference_profiles | 1 | ~5KB (JSON preferences) | 0.005MB |
| audit_log_entries | 10,000 | ~500B (event logs) | 5MB |
| usage_events | 600 | ~300B (unified usage + costs) | 0.18MB |
| user_feedback | 500 | ~100B (ratings) | 0.05MB |
| **004 SUBTOTAL** | | | **~19.2MB per user** |

### 003 Tables (Filesystem - Shared)

| Table | Rows | Size/Row | Total |
|-------|------|----------|-------|
| folders | 500 | ~500B (hierarchy metadata) | 0.25MB |
| documents | 5,000 | ~7KB (content_text cache + metadata) | 35MB |
| document_chunks | 50,000 | ~3KB (embedding + content) | 150MB |
| user_profiles | 1 | ~500B (storage quotas) | 0.0005MB |
| **003 SUBTOTAL** | | | **~185MB per user** |

### Combined Total

| Component | Storage |
|-----------|---------|
| 004 AI Agent Tables | ~19.2MB |
| 003 Filesystem Tables | ~185MB |
| **TOTAL** | **~204MB per user** |

**Storage Quota Enforcement** (from 003):
- **Free Tier**: 50MB filesystem limit (enforced in `user_profiles.storage_limit_bytes`)
  - ~714 files at 70KB each OR 357 files at 140KB each
  - AI agent tables (~19MB) don't count toward user's filesystem quota
- **Pro Tier**: 1GB filesystem limit
  - ~14,000 files at 70KB each
  - Enables larger knowledge bases

**Note**: The 50MB free tier limit applies only to user's **filesystem data** (documents + chunks in 003 tables), not AI agent metadata (chats, requests, interactions in 004 tables). This allows users to have unlimited conversations even on free tier, with storage quota controlling only their document library size.

---

## Next Steps

1. ✅ **Data model complete**
2. **Implement schema**: Create `apps/api/src/db/schema.ts` using Drizzle ORM
3. **Generate repositories**: Create type-safe repository modules in `apps/api/src/repositories/`
4. **Test with db:push**: Push schema to remote Supabase using `npm run db:push` from `apps/api/`
5. **Validate RLS**: Test RLS policies enforce user isolation correctly

---

**Authored by**: Claude Code (Sonnet 4.5)
**Reviewed by**: Pending (awaiting user approval before Phase 1 continues)
