# Supabase Client Operations (Read-Only)

**Feature**: 003-filesystem-markdown-editor
**Type**: Auto-generated REST API via Supabase Client
**Date**: 2025-10-22
**Last Updated**: 2025-10-22 (Security Architecture Update)

## Overview

**Security Architecture**: Edge Function-First (all mutations via backend)

The Supabase JavaScript client is used **ONLY for READ operations**. ALL mutations (create, update, delete, upload) go through Edge Functions to ensure proper validation, authentication, and authorization.

**Client Operations (Supabase Client SDK)**:
- ✅ List folders (for file tree rendering)
- ✅ List documents (for file tree rendering)
- ✅ Read document content (from `content_text` field)
- ✅ Subscribe to real-time changes (WebSocket)

**Edge Function Operations** (RESTful API):
- ❌ Folders → `POST /folders`, `PUT /folders/:id`, `DELETE /folders/:id`
- ❌ Documents → `POST /documents`, `PUT /documents/:id`, `PATCH /documents/:id`, `DELETE /documents/:id`
- ❌ Storage access → Backend-only (SERVICE_ROLE_KEY)

**Authentication**: All operations require valid JWT token (Supabase Auth session). RLS policies enforce `auth.uid() = user_id` for reads.

---

## Read Operations

### 1. List Folders (for file tree)

**Operation**: Select from `folders` table

**TypeScript**:
```typescript
const { data, error } = await supabase
  .from('folders')
  .select('id, name, parent_folder_id, path, created_at, updated_at')
  .eq('user_id', userId) // RLS filters automatically
  .order('name', { ascending: true });
```

**Response** (200 OK):
```json
[
  {
    "id": "f1a2b3c4-...",
    "name": "Projects",
    "parent_folder_id": null,
    "path": "/Projects",
    "created_at": "2025-10-22T10:30:00Z",
    "updated_at": "2025-10-22T10:30:00Z"
  },
  {
    "id": "f9g8h7i6-...",
    "name": "MVP",
    "parent_folder_id": "f1a2b3c4-...",
    "path": "/Projects/MVP",
    "created_at": "2025-10-22T10:35:00Z",
    "updated_at": "2025-10-22T10:35:00Z"
  }
]
```

**RLS**: Query automatically filtered to `auth.uid() = user_id`

---

### 2. List Documents (for file tree)

**Operation**: Select from `documents` table

**TypeScript**:
```typescript
const { data, error } = await supabase
  .from('documents')
  .select('id, name, folder_id, path, file_size, mime_type, version, indexing_status, created_at, updated_at')
  .eq('user_id', userId) // RLS filters automatically
  .order('name', { ascending: true });
```

**Response** (200 OK):
```json
[
  {
    "id": "d1e2f3g4-...",
    "name": "project-spec.md",
    "folder_id": "f9g8h7i6-...",
    "path": "/Projects/MVP/project-spec.md",
    "file_size": 12345,
    "mime_type": "text/markdown",
    "version": 3,
    "indexing_status": "completed",
    "created_at": "2025-10-22T10:40:00Z",
    "updated_at": "2025-10-22T11:45:00Z"
  }
]
```

**Note**: `content_text` is NOT fetched in list operations (performance optimization). Use separate query to read document content.

**RLS**: Query automatically filtered to `auth.uid() = user_id`

---

### 3. Read Document Content

**Operation**: Select `content_text` from `documents` table

**TypeScript**:
```typescript
const { data, error } = await supabase
  .from('documents')
  .select('id, name, content_text, version, updated_at')
  .eq('id', documentId)
  .eq('user_id', userId)
  .single();
```

**Response** (200 OK):
```json
{
  "id": "d1e2f3g4-...",
  "name": "project-spec.md",
  "content_text": "# Project Specification\n\nThis document describes...",
  "version": 3,
  "updated_at": "2025-10-22T11:45:00Z"
}
```

**Notes**:
- `content_text` field is always populated (cached markdown)
- NO fallback to Storage download (client never accesses Storage)
- If `content_text` is null, Edge Function will backfill from Storage on next read

**RLS**: Query automatically filtered to `auth.uid() = user_id`

---

## Real-Time Subscriptions

### 1. Subscribe to File System Changes

**Operation**: Supabase Realtime subscription on `documents` and `folders` tables

**TypeScript**:
```typescript
const subscription = supabase
  .channel('filesystem_changes')
  .on('postgres_changes', {
    event: '*', // INSERT, UPDATE, DELETE
    schema: 'public',
    table: 'documents',
    filter: `user_id=eq.${userId}`,
  }, (payload) => {
    console.log('Document change:', payload);
    // Update Valtio state based on payload.eventType and payload.new/old
  })
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'folders',
    filter: `user_id=eq.${userId}`,
  }, (payload) => {
    console.log('Folder change:', payload);
    // Update Valtio state
  })
  .subscribe();
```

**Payload Structure**:
```json
{
  "eventType": "INSERT | UPDATE | DELETE",
  "new": { /* new row data */ },
  "old": { /* old row data (for UPDATE/DELETE) */ },
  "schema": "public",
  "table": "documents | folders"
}
```

**Use Cases**:
- Update file tree when folder/document created/renamed/deleted (any device/session)
- Update save status indicator when `document.updated_at` changes
- Refresh open document if version changes (conflict warning)
- Update indexing status (pending → in_progress → completed)

**Note**: Real-time events triggered by Edge Function mutations (create/update/delete)

---

### 2. Unsubscribe on Component Unmount

**TypeScript**:
```typescript
useEffect(() => {
  const subscription = supabase.channel('filesystem_changes')
    .on(/* ... */)
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}, [userId]);
```

---

## Mutation Operations (Edge Functions Only)

**All mutations must go through Edge Functions**. Client does NOT call Supabase mutations directly.

See `edge-functions.openapi.yaml` for complete API specifications.

### Security Field Boundaries

**Client-Provided Fields** (validated by Edge Function):
- Folder: `name`, `parent_folder_id`
- Document: `name`, `content`, `folder_id`

**Server-Controlled Fields** (NEVER from client):
- `id` - Generated by Edge Function (UUID v4)
- `user_id` - Extracted from JWT by Edge Function
- `storage_path` - Computed by Edge Function
- `path` - Computed by Edge Function from parent hierarchy
- `version` - Incremented by Edge Function
- `indexing_status` - Set by background job
- `created_at`, `updated_at` - Set by database

**Validation**:
- Name: No `/`, `\`, or control characters
- File size: 1 byte to 10MB
- File type: Only `.md` and `.txt`
- Parent folder: Must exist and belong to user
- Circular references: Prevented (folders cannot be moved into descendants)

---

### Folder Operations (RESTful)

| Operation | Method | Endpoint |
|-----------|--------|----------|
| Create folder | POST | `/functions/v1/folders` |
| Update folder (rename/move) | PUT | `/functions/v1/folders/:id` |
| Delete folder | DELETE | `/functions/v1/folders/:id` |

**Example** (Create Folder):
```typescript
const response = await fetch(`${SUPABASE_URL}/functions/v1/folders`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'New Folder',
    parent_folder_id: parentId, // null for root
  }),
});

const { data, error } = await response.json();
```

**Example** (Update Folder - Rename):
```typescript
const response = await fetch(`${SUPABASE_URL}/functions/v1/folders/${folderId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Renamed Folder',
    parent_folder_id: currentParentId, // Keep same parent
  }),
});
```

**Example** (Update Folder - Move):
```typescript
const response = await fetch(`${SUPABASE_URL}/functions/v1/folders/${folderId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: currentName, // Keep same name
    parent_folder_id: newParentId, // New parent (triggers path recomputation)
  }),
});
```

**Security** (Field-Level Enforcement):
- **Client provides**: `name`, `parent_folder_id` (validated by Edge Function)
- **Server controls**: `id` (generated), `user_id` (from JWT), `path` (computed), `created_at`/`updated_at` (database)
- Edge Function validates ownership: Folder `:id` must belong to authenticated user
- Edge Function validates name format (no `/`, `\`, control chars)
- Edge Function validates parent exists and belongs to user
- Edge Function checks circular references (folder cannot be moved into itself or descendants)
- Edge Function computes `path` from parent hierarchy (never from client input)

---

### Document Operations (RESTful)

| Operation | Method | Endpoint |
|-----------|--------|----------|
| Upload document | POST | `/functions/v1/documents` |
| Update content | PUT | `/functions/v1/documents/:id` |
| Update metadata (rename/move) | PATCH | `/functions/v1/documents/:id` |
| Delete document | DELETE | `/functions/v1/documents/:id` |

**Example** (Upload Document):
```typescript
const formData = new FormData();
formData.append('file', file); // File object
formData.append('folder_id', folderId); // null for root

const response = await fetch(`${SUPABASE_URL}/functions/v1/documents`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
  },
  body: formData,
});

const { data, error } = await response.json();
```

**Security** (Field-Level Enforcement):
- **Client provides**: `file` (File object), `folder_id` (validated by Edge Function)
- **Server controls**: `id` (generated), `user_id` (from JWT), `storage_path` (constructed), `path` (computed), `version` (set to 1), `indexing_status` (set to pending)
- Edge Function validates file type (only `.md`, `.txt`)
- Edge Function validates file size (1 byte to 10MB)
- Edge Function validates folder exists and belongs to user
- Edge Function generates document `id` (UUID v4)
- Edge Function constructs `storage_path` (server-controlled, never from client)
- Edge Function uploads to Storage using SERVICE_ROLE_KEY (client has ZERO Storage access)
- Edge Function computes `path` from folder hierarchy
- Edge Function inserts metadata and queues indexing

**Example** (Update Document Content):
```typescript
const response = await fetch(`${SUPABASE_URL}/functions/v1/documents/${documentId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    content: newMarkdownContent,
    version: currentVersion, // Optimistic locking
  }),
});

const { data, error } = await response.json();
```

**Example** (Update Document Metadata - Rename):
```typescript
const response = await fetch(`${SUPABASE_URL}/functions/v1/documents/${documentId}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'new-filename.md',
  }),
});
```

**Example** (Update Document Metadata - Move):
```typescript
const response = await fetch(`${SUPABASE_URL}/functions/v1/documents/${documentId}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    folder_id: newFolderId, // Triggers path recomputation
  }),
});
```

**Security** (Field-Level Enforcement):
- **Client provides (PUT)**: `content`, `version` (for optimistic locking)
- **Client provides (PATCH)**: `name` and/or `folder_id` (metadata updates only)
- **Server controls**: `id` (from URL path, not body), `user_id` (from JWT), `storage_path` (updated on content change), `path` (recomputed on folder change), `version` (incremented), `indexing_status` (updated), `updated_at` (database)
- Edge Function validates ownership: Document `:id` must belong to authenticated user
- Edge Function validates name format (no `/`, `\`, control chars)
- Edge Function validates folder exists and belongs to user (for PATCH with folder_id)
- Edge Function validates version matches (optimistic locking for PUT)
- Edge Function syncs content to Storage on PUT (client NEVER touches Storage)
- Edge Function recomputes `path` on folder change (server-controlled)
- Edge Function re-queues indexing on content change

**Optimistic Locking** (PUT only):
- Client sends current `version` with content update
- Edge Function checks version matches database
- If mismatch, returns 409 Conflict
- Client shows merge/overwrite dialog
- Edge Function increments version on successful update

---

## Error Handling

### Common Error Codes (from Edge Functions)

| Status Code | Meaning | Example |
|-------------|---------|---------|
| 400 | Bad Request | Invalid file type, name format, or size |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | User doesn't own resource |
| 409 | Conflict | Version mismatch (optimistic lock), duplicate name |
| 413 | Payload Too Large | File exceeds 10MB limit |
| 422 | Unprocessable Entity | Circular folder reference, invalid parent |
| 500 | Internal Server Error | Edge Function error |

**Example Error Response**:
```json
{
  "error": "VALIDATION_ERROR",
  "message": "File type not allowed. Only .md and .txt files are supported.",
  "details": {
    "field": "file",
    "received_type": "application/pdf",
    "allowed_types": ["text/markdown", "text/plain"]
  }
}
```

### Error Handling (Client)

```typescript
// Edge Function call
const response = await fetch(/* ... */);
const result = await response.json();

if (!response.ok) {
  // Handle error
  switch (response.status) {
    case 400:
      showToast('Invalid input: ' + result.message);
      break;
    case 409:
      // Version conflict
      showConflictDialog(result.details);
      break;
    case 413:
      showToast('File too large. Max size is 10MB.');
      break;
    default:
      showToast('An error occurred. Please try again.');
  }
  return;
}

// Success
const { data } = result;
```

---

## Rate Limiting & Performance

**Supabase Limits**:
- 500 requests/second per project (anon key)
- 2MB max request body for REST API
- 10MB max file size for Storage uploads (configurable)

**Edge Function Limits**:
- 10 second timeout per invocation
- 100MB memory limit
- 50 concurrent executions per project

**Best Practices**:
- ✅ Use Realtime subscriptions instead of polling
- ✅ Batch reads when loading file tree (single query for folders + documents)
- ✅ Cache document content client-side (Valtio state)
- ✅ Debounce auto-save (3s) to reduce Edge Function calls
- ✅ Don't fetch `content_text` in list operations (performance)
- ✅ Show optimistic UI updates before Edge Function response
- ✅ Handle Edge Function timeouts gracefully (show retry option)

**Caching Strategy**:
```typescript
// Cache document content in Valtio state
const documentCache = proxy<Map<string, DocumentContent>>(new Map());

async function loadDocument(documentId: string) {
  // Check cache first
  if (documentCache.has(documentId)) {
    return documentCache.get(documentId);
  }

  // Fetch from database
  const { data } = await supabase
    .from('documents')
    .select('id, name, content_text, version')
    .eq('id', documentId)
    .single();

  // Cache result
  documentCache.set(documentId, data);
  return data;
}
```

---

## Summary

**Client Operations (Read-Only)**:
- List folders and documents for file tree rendering
- Read document content from `content_text` field
- Subscribe to real-time changes via WebSocket

**Edge Function Operations (All Mutations - RESTful)**:
- Folders: `POST /folders`, `PUT /folders/:id`, `DELETE /folders/:id`
- Documents: `POST /documents`, `PUT /documents/:id` (content), `PATCH /documents/:id` (metadata), `DELETE /documents/:id`
- Storage access (backend-only)

**Security Model** (Defense in Depth):
- **Client**: Read operations via Supabase client (RLS enforced)
- **Edge Functions**: ALL mutations with validation, auth, authz (primary security boundary)
- **Storage**: Backend-only access (SERVICE_ROLE_KEY)

**Field-Level Security**:
- **Client-provided fields**: `name`, `content`, `folder_id`, `parent_folder_id` (validated)
- **Server-controlled fields**: `id`, `user_id`, `storage_path`, `path`, `version`, `indexing_status`, `created_at`, `updated_at` (NEVER from client)

**Real-Time Updates**:
- WebSocket subscriptions for instant UI updates
- Events triggered by Edge Function mutations
- No polling required

All operations require valid JWT token from Supabase Auth session. RLS policies automatically filter reads to user's data. Mutations go through Edge Functions for comprehensive security validation.

See `edge-functions.openapi.yaml` for complete Edge Function API specifications.
