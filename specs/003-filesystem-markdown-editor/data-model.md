# Data Model: File System & Markdown Editor with AI Context Management

**Feature**: 003-filesystem-markdown-editor
**Date**: 2025-10-22
**Status**: Draft

## Overview

This data model supports hierarchical file organization with separate tables for folders and documents, stores file content in Supabase Storage with metadata in PostgreSQL, and maintains searchable document chunks for AI context retrieval.

---

## Entity Definitions

### 1. Folder

**Purpose**: Container for organizing documents and nested folders in a hierarchical tree structure.

**Schema** (Drizzle ORM):
```typescript
export const folders = pgTable('folders', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  parent_folder_id: uuid('parent_folder_id').references(() => folders.id, { onDelete: 'cascade' }),
  path: text('path').notNull(), // Computed path for breadcrumbs (e.g., "/Projects/MVP")
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});
```

**Indexes**:
```typescript
// Unique name within parent scope (root-level folders have null parent_folder_id)
folders.index('idx_folders_unique_name_in_parent')
  .on(folders.user_id, folders.parent_folder_id, folders.name)
  .unique();

// Fast lookup of folders by user
folders.index('idx_folders_user_id').on(folders.user_id);

// Fast lookup of child folders
folders.index('idx_folders_parent_folder_id').on(folders.parent_folder_id);
```

**RLS Policies**:
```sql
-- Users can read only their own folders
CREATE POLICY "Users can read own folders"
ON folders FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert folders into their own hierarchy
CREATE POLICY "Users can create own folders"
ON folders FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own folders
CREATE POLICY "Users can update own folders"
ON folders FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own folders (cascade to children via FK)
CREATE POLICY "Users can delete own folders"
ON folders FOR DELETE
USING (auth.uid() = user_id);
```

**Constraints**:
- `user_id` required (enforces ownership)
- `name` required (non-empty folder name)
- `parent_folder_id` nullable (null = root-level folder)
- Self-referential FK on `parent_folder_id` with cascade delete (deleting parent removes all children)
- Unique `name` within parent scope per user

**State Transitions** (ALL via Edge Functions - RESTful):
- **Create**: `POST /folders` validates name, sets `user_id` from JWT, generates ID, computes `path` from parent, inserts row
- **Rename**: `PUT /folders/:id` validates name, updates `name`, recomputes `path` for folder and all descendants recursively
- **Move**: `PUT /folders/:id` validates parent, checks for circular references, updates `parent_folder_id`, recomputes `path` for folder and descendants
- **Delete**: `DELETE /folders/:id` validates ownership, deletes row (cascade removes children and documents via FK)

**Validation Rules** (enforced in Edge Functions):
- Name must be 1-255 characters (validated in Edge Function)
- Name cannot contain `/`, `\`, or control characters (validated in Edge Function)
- Name must be unique within parent scope (database UNIQUE constraint enforces)
- Parent folder must belong to same user (validated in Edge Function via JWT)
- Cannot create circular references (validated in Edge Function - recursive parent check)

---

### 2. Document

**Purpose**: Represents a user's markdown file with metadata. Actual content stored in Supabase Storage.

**Schema** (Drizzle ORM):
```typescript
export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  folder_id: uuid('folder_id').references(() => folders.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  storage_path: text('storage_path').notNull(), // Path in Supabase Storage (documents/{user_id}/{doc_id}/{filename})
  content_text: text('content_text'), // Cached markdown content for fast access (synced from Storage)
  file_size: integer('file_size').notNull(), // Bytes
  mime_type: text('mime_type').notNull(), // 'text/markdown' or 'text/plain'
  path: text('path').notNull(), // Computed path for breadcrumbs (e.g., "/Projects/MVP/spec.md")
  version: integer('version').default(0).notNull(), // Optimistic locking for concurrent edits
  indexing_status: text('indexing_status').default('pending').notNull(), // 'pending', 'in_progress', 'completed', 'failed'
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});
```

**Indexes**:
```typescript
// Unique name within folder scope
documents.index('idx_documents_unique_name_in_folder')
  .on(documents.user_id, documents.folder_id, documents.name)
  .unique();

// Fast lookup of documents by user
documents.index('idx_documents_user_id').on(documents.user_id);

// Fast lookup of documents in folder
documents.index('idx_documents_folder_id').on(documents.folder_id);

// Fast lookup by indexing status (for background jobs)
documents.index('idx_documents_indexing_status').on(documents.indexing_status);
```

**RLS Policies**:
```sql
-- Users can read only their own documents
CREATE POLICY "Users can read own documents"
ON documents FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert documents into their own folders
CREATE POLICY "Users can create own documents"
ON documents FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own documents
CREATE POLICY "Users can update own documents"
ON documents FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own documents
CREATE POLICY "Users can delete own documents"
ON documents FOR DELETE
USING (auth.uid() = user_id);
```

**Edge Function Responsibilities** (RESTful API):
```typescript
// ALL document operations go through Edge Functions for security

// CREATE: POST /documents
// - Validates file (type, size, content)
// - Generates document ID (server-side UUID)
// - Uploads to Storage with server-controlled path
// - Inserts metadata row with user_id from JWT
// - Queues background indexing job
// - Returns metadata to client

// UPDATE CONTENT: PUT /documents/:id
// - Validates content changes
// - Updates content_text field
// - Syncs to Storage
// - Increments version (optimistic locking)
// - Re-queues indexing if content changed

// UPDATE METADATA: PATCH /documents/:id
// - Validates new folder/name
// - Updates folder_id or name
// - Recomputes path from parent hierarchy
// - Does NOT change version (metadata only)

// DELETE: DELETE /documents/:id
// - Validates ownership via JWT
// - Deletes from Storage
// - Deletes metadata row (cascade deletes chunks via FK)
```

**Database Triggers** (minimal - only auto-update timestamps):
```sql
-- Auto-update updated_at timestamp on UPDATE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_folders_updated_at
BEFORE UPDATE ON folders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**Constraints**:
- `user_id` required (enforces ownership)
- `name` required (non-empty filename)
- `storage_path` required (path to file in Supabase Storage)
- `file_size` required (>0 bytes)
- `mime_type` required (must be 'text/markdown' or 'text/plain')
- `folder_id` nullable (null = root-level document)
- FK on `folder_id` with cascade delete (deleting folder removes all documents)
- Unique `name` within folder scope per user

**State Transitions** (ALL via Edge Functions - RESTful):
- **Create**: `POST /documents` generates ID, uploads to Storage, inserts row with `indexing_status = 'pending'`, queues indexing
- **Edit**: `PUT /documents/:id` updates `content_text`, increments `version`, syncs to Storage, re-queues indexing
- **Move**: `PATCH /documents/:id` updates `folder_id`, recomputes `path` from parent hierarchy
- **Rename**: `PATCH /documents/:id` updates `name`, recomputes `path`
- **Delete**: `DELETE /documents/:id` deletes from Storage, then deletes metadata row (cascade removes `document_chunks`)

**Validation Rules** (enforced in Edge Functions):
- Name must be 1-255 characters (validated in Edge Function)
- Name must end with `.md` or `.txt` (validated in Edge Function)
- Name cannot contain `/`, `\`, or control characters (validated in Edge Function)
- Name must be unique within folder scope (database UNIQUE constraint enforces)
- File size must be 1 byte to 10MB (validated in Edge Function before upload)
- MIME type must be `text/markdown` or `text/plain` (validated in Edge Function)
- Folder (if specified) must belong to same user (validated in Edge Function via JWT)
- Version must be provided on UPDATE for optimistic locking (Edge Function checks version match)

---

### 3. DocumentChunk

**Purpose**: Searchable segment of document content with embeddings for semantic search and AI context retrieval.

**Schema** (Drizzle ORM):
```typescript
export const document_chunks = pgTable('document_chunks', {
  id: uuid('id').defaultRandom().primaryKey(),
  document_id: uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  content: text('content').notNull(), // Markdown text (400-500 tokens)
  position: integer('position').notNull(), // Order in original document (0, 1, 2, ...)
  embedding: vector('embedding', { dimensions: 1536 }), // OpenAI text-embedding-3-small
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});
```

**Indexes**:
```typescript
// Fast lookup of chunks by document
document_chunks.index('idx_chunks_document_id').on(document_chunks.document_id);

// Fast lookup of chunks by position (for ordered retrieval)
document_chunks.index('idx_chunks_position').on(document_chunks.document_id, document_chunks.position);

// Vector similarity search index (HNSW for pgvector)
CREATE INDEX idx_chunks_embedding ON document_chunks USING hnsw (embedding vector_cosine_ops);
```

**RLS Policies**:
```sql
-- Users can read chunks for their own documents
CREATE POLICY "Users can read own document chunks"
ON document_chunks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = document_chunks.document_id
    AND documents.user_id = auth.uid()
  )
);

-- Only Edge Functions can insert/update/delete chunks (use SERVICE_ROLE_KEY)
-- No INSERT/UPDATE/DELETE policies for regular users (prevent manual manipulation)
```

**Constraints**:
- `document_id` required (FK with cascade delete)
- `content` required (non-empty text)
- `position` required (≥0)
- `embedding` nullable (generated asynchronously by indexing job)
- Unique `position` per document (enforced by index)

**State Transitions**:
- **Create**: Inserted by `index-document` Edge Function during background indexing
- **Update**: Re-generated by Edge Function when document content changes (delete old chunks, insert new ones)
- **Delete**: Cascade deleted when parent document is deleted

**Validation Rules**:
- Content must be 1-2000 characters (400-500 tokens typical)
- Position must be sequential (0, 1, 2, ...)
- Embedding must be 1536-dimensional vector (OpenAI text-embedding-3-small)
- Document must exist and belong to user (enforced by FK + RLS)

---

## Relationships

### Folder ↔ Folder (Self-Referential Hierarchy)
- **Type**: One-to-Many (parent → children)
- **FK**: `folders.parent_folder_id` → `folders.id`
- **Cascade**: DELETE (deleting parent removes all children recursively)
- **Constraint**: Cannot create circular references (enforced by application logic)

### Folder ↔ Document
- **Type**: One-to-Many (folder → documents)
- **FK**: `documents.folder_id` → `folders.id`
- **Cascade**: DELETE (deleting folder removes all documents)
- **Nullable**: `folder_id` can be null (root-level documents)

### Document ↔ DocumentChunk
- **Type**: One-to-Many (document → chunks)
- **FK**: `document_chunks.document_id` → `documents.id`
- **Cascade**: DELETE (deleting document removes all chunks)
- **Order**: Chunks ordered by `position` field (0, 1, 2, ...)

### User ↔ Folder
- **Type**: One-to-Many (user → folders)
- **FK**: `folders.user_id` → `users.id`
- **Cascade**: DELETE (deleting user removes all folders)
- **RLS**: User can only access their own folders

### User ↔ Document
- **Type**: One-to-Many (user → documents)
- **FK**: `documents.user_id` → `users.id`
- **Cascade**: DELETE (deleting user removes all documents)
- **RLS**: User can only access their own documents

---

## Derived Data

### FileSystemNode (Frontend Abstraction)

**Purpose**: Abstract representation of file tree structure for UI rendering. Not a database table, computed from `folders` + `documents`.

**TypeScript Interface**:
```typescript
interface FileSystemNode {
  id: string;              // folder.id or document.id
  name: string;            // folder.name or document.name
  type: 'folder' | 'document';
  parentId: string | null; // folder.parent_folder_id or document.folder_id
  path: string;            // folder.path or document.path
  children?: FileSystemNode[]; // Only for folders (recursive)

  // Document-specific fields (when type === 'document')
  fileSize?: number;       // document.file_size
  mimeType?: string;       // document.mime_type
  version?: number;        // document.version
  indexingStatus?: string; // document.indexing_status
  updatedAt?: string;      // document.updated_at
}
```

**Computation Logic**:
```typescript
function buildFileSystemTree(folders: Folder[], documents: Document[]): FileSystemNode[] {
  // 1. Convert folders to FileSystemNodes with empty children arrays
  const folderNodes = folders.map(f => ({
    id: f.id,
    name: f.name,
    type: 'folder' as const,
    parentId: f.parent_folder_id,
    path: f.path,
    children: [],
  }));

  // 2. Convert documents to FileSystemNodes
  const documentNodes = documents.map(d => ({
    id: d.id,
    name: d.name,
    type: 'document' as const,
    parentId: d.folder_id,
    path: d.path,
    fileSize: d.file_size,
    mimeType: d.mime_type,
    version: d.version,
    indexingStatus: d.indexing_status,
    updatedAt: d.updated_at,
  }));

  // 3. Build tree by nesting children into parents
  const allNodes = [...folderNodes, ...documentNodes];
  const nodeMap = new Map(allNodes.map(n => [n.id, n]));
  const rootNodes: FileSystemNode[] = [];

  for (const node of allNodes) {
    if (node.parentId === null) {
      rootNodes.push(node);
    } else {
      const parent = nodeMap.get(node.parentId);
      if (parent && parent.type === 'folder') {
        parent.children!.push(node);
      }
    }
  }

  return rootNodes;
}
```

**Usage**: FileSystemTree component receives `FileSystemNode[]` and recursively renders folders/documents.

---

## Path Computation

**Strategy**: Compute `path` field from parent hierarchy for breadcrumb display and search context.

**Example**:
- Folder `id=1, name="Projects", parent_folder_id=null` → `path="/Projects"`
- Folder `id=2, name="MVP", parent_folder_id=1` → `path="/Projects/MVP"`
- Document `id=3, name="spec.md", folder_id=2` → `path="/Projects/MVP/spec.md"`

**Computation Logic** (in Edge Functions):
- On INSERT: Edge Function computes path from parent hierarchy before inserting
- On RENAME: Edge Function recomputes path for node and all descendants
- On MOVE: Edge Function recomputes path for node and all descendants

**Implementation** (TypeScript in Edge Functions):
```typescript
// Path computation logic in Edge Functions (shared utility)

async function computeFolderPath(folderId: string | null): Promise<string> {
  if (!folderId) return '/';

  const pathParts: string[] = [];
  let currentId: string | null = folderId;

  while (currentId) {
    const { data: folder } = await supabase
      .from('folders')
      .select('name, parent_folder_id')
      .eq('id', currentId)
      .single();

    if (!folder) break;

    pathParts.unshift(folder.name); // Prepend to array
    currentId = folder.parent_folder_id;
  }

  return '/' + pathParts.join('/');
}

async function computeDocumentPath(folderId: string | null, fileName: string): Promise<string> {
  const folderPath = await computeFolderPath(folderId);
  return folderPath === '/' ? `/${fileName}` : `${folderPath}/${fileName}`;
}

// Example usage in create-folder Edge Function:
const parentPath = await computeFolderPath(parentFolderId);
const newPath = parentPath === '/' ? `/${name}` : `${parentPath}/${name}`;

await supabase.from('folders').insert({
  id: generatedId,
  user_id: userId, // from JWT
  name,
  parent_folder_id: parentFolderId,
  path: newPath, // computed by Edge Function
});
```

---

## Indexing Status Lifecycle

**States**: `pending` → `in_progress` → `completed` (or `failed`)

**Flow**:
1. Document created/updated → `indexing_status = 'pending'`
2. Database trigger fires → Invokes `index-document` Edge Function
3. Edge Function starts → Updates to `indexing_status = 'in_progress'`
4. Edge Function fetches content from Storage → Chunks into 400-500 tokens → Generates embeddings → Inserts into `document_chunks`
5. On success → Updates to `indexing_status = 'completed'`
6. On error → Updates to `indexing_status = 'failed'` (retry up to 3 times)

**Retry Logic** (in Edge Function):
```typescript
async function indexDocument(documentId: string, retryCount = 0) {
  const MAX_RETRIES = 3;

  try {
    await supabase.from('documents').update({ indexing_status: 'in_progress' }).eq('id', documentId);

    // Fetch content, chunk, generate embeddings, insert chunks
    // ... implementation ...

    await supabase.from('documents').update({ indexing_status: 'completed' }).eq('id', documentId);
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      return indexDocument(documentId, retryCount + 1);
    } else {
      await supabase.from('documents').update({ indexing_status: 'failed' }).eq('id', documentId);
      console.error(`Indexing failed for document ${documentId}:`, error);
    }
  }
}
```

---

## Storage Integration

**Supabase Storage Bucket**: `documents`

**Path Structure**: `documents/{user_id}/{document_id}/{filename}`

**Example**:
- User ID: `a1b2c3d4-...`
- Document ID: `e5f6g7h8-...`
- Filename: `project-spec.md`
- Storage Path: `documents/a1b2c3d4-.../e5f6g7h8-.../project-spec.md`

**Storage Access** (Edge Functions ONLY - no direct client access):
```typescript
// Client NEVER accesses Storage directly
// ALL Storage operations go through Edge Functions using SERVICE_ROLE_KEY

// Edge Functions have unrestricted Storage access via service role
// User isolation enforced by Edge Function logic (JWT validation)
// Storage RLS policies can be simplified or removed since only backend accesses it
```

**Content Flow** (Secure - via Edge Functions):
- **Upload**:
  1. Client sends file to `upload-document` Edge Function
  2. Edge Function validates file (type, size, content)
  3. Edge Function uploads to Storage using SERVICE_ROLE_KEY
  4. Edge Function inserts metadata with `user_id` from JWT
  5. Edge Function queues `index-document` job
  6. Client receives metadata via response

- **Edit**:
  1. Client sends content to `update-document` Edge Function
  2. Edge Function validates content
  3. Edge Function updates `content_text` field in database
  4. Edge Function syncs to Storage (async)
  5. Edge Function re-queues indexing if needed

- **Read**:
  1. Client queries `documents` table (RLS enforced)
  2. Client receives `content_text` (cached markdown)
  3. NO fallback to Storage (content_text always populated)
  4. If content_text is null, Edge Function backfills from Storage

- **Delete**:
  1. Client sends request to `delete-document` Edge Function
  2. Edge Function validates ownership via JWT
  3. Edge Function deletes from Storage
  4. Edge Function deletes metadata row (cascade removes chunks)

---

## Search Integration

### Full-Text Search (PostgreSQL)

**Implementation**: Add `tsvector` column to `documents` for keyword search.

**Schema Addition**:
```typescript
export const documents = pgTable('documents', {
  // ... existing fields ...
  search_vector: tsvector('search_vector'), // Auto-generated from name + content_text
});

// Trigger to auto-update search_vector on INSERT/UPDATE
CREATE TRIGGER trigger_documents_search_vector_update
BEFORE INSERT OR UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION tsvector_update_trigger(
  search_vector, 'pg_catalog.english', name, content_text
);

// GIN index for fast full-text search
CREATE INDEX idx_documents_search_vector ON documents USING GIN (search_vector);
```

**Search Query**:
```typescript
const { data } = await supabase
  .from('documents')
  .select('*')
  .textSearch('search_vector', query, { type: 'websearch', config: 'english' })
  .eq('user_id', userId)
  .limit(50);
```

### Vector Similarity Search (pgvector)

**Implementation**: Query `document_chunks` using cosine similarity for semantic search.

**Search Query**:
```typescript
const queryEmbedding = await generateEmbedding(query); // OpenAI API

const { data } = await supabase.rpc('search_document_chunks', {
  query_embedding: queryEmbedding,
  match_threshold: 0.7,
  match_count: 20,
  user_id: userId,
});

// RPC function definition (PostgreSQL)
CREATE OR REPLACE FUNCTION search_document_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  user_id uuid
)
RETURNS TABLE (
  chunk_id uuid,
  document_id uuid,
  content text,
  similarity float
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  INNER JOIN documents d ON dc.document_id = d.id
  WHERE d.user_id = user_id
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
```

---

## Summary

**Tables**: `folders`, `documents`, `document_chunks`

**Relationships**: User owns folders/documents, folders contain folders/documents (hierarchy), documents contain chunks

**Storage**: Supabase Storage bucket `documents` with path `documents/{user_id}/{document_id}/{filename}` (backend-only access)

**Security Architecture**: ALL mutations go through Edge Functions (no direct client access to Storage or document creation)

**Edge Functions** (RESTful API - security boundary):
- `POST /documents`: Validate file, generate ID, upload to Storage, insert metadata, queue indexing
- `PUT /documents/:id`: Validate content, update DB, sync to Storage, re-queue indexing
- `PATCH /documents/:id`: Validate metadata (name/folder), recompute path
- `DELETE /documents/:id`: Validate ownership, delete Storage, delete metadata
- `POST /folders`: Validate name, set user_id from JWT, compute path, insert
- `PUT /folders/:id`: Validate changes (rename/move), check circular refs, recompute paths for descendants
- `DELETE /folders/:id`: Validate ownership, delete (cascade via FK)
- Background: `index-document` job to chunk content and generate embeddings

**Indexing Flow**: Edge Function (upload/update) sets `indexing_status='pending'` → queues `index-document` → generates embeddings → inserts `document_chunks`

**Search**: Full-text (tsvector) for keyword search, vector similarity (pgvector) for semantic search

**RLS**: All database tables enforce `auth.uid() = user_id` for read operations (writes via Edge Functions only)

**Paths**: Computed by Edge Functions from parent hierarchy before insert/update

**Validation Layers**:
1. Frontend: UX-only validation (pre-flight, instant feedback)
2. Edge Functions: Security validation (file type, size, name format, ownership, circular refs)
3. Database: Integrity constraints (UNIQUE, FK cascade, NOT NULL)

Ready for Phase 1 API contracts generation.
