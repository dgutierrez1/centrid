# Frontend Code Reference - File Locations & Implementation Details

## Complete File Inventory

### Pages Using Direct supabase.functions.invoke()

#### 1. /apps/web/src/pages/signup.tsx
- **Function**: create-account
- **Pattern**: `supabase.functions.invoke('create-account', ...)`
- **Auth Method**: Session token via supabase.auth.getSession()
- **Error Handling**: Uses getAuthErrorMessage() helper
- **Retry**: Uses withRetry() wrapper from utils.ts
- **Lines**: ~90-55 (signup form logic)
- **TODO**: Migrate to AuthService

#### 2. /apps/web/src/pages/profile.tsx
- **Function**: update-profile
- **Pattern**: `supabase.functions.invoke('update-profile', ...)`
- **Auth Method**: Manual Authorization header with session token
- **Error Handling**: Uses getAuthErrorMessage() helper
- **Retry**: Uses withRetry() wrapper
- **Lines**: 77-85 (edge function call)
- **TODO**: Migrate to AuthService

#### 3. /apps/web/src/pages/account/delete.tsx
- **Function**: delete-account
- **Pattern**: `supabase.functions.invoke('delete-account', ...)`
- **Auth Method**: Manual Authorization header with session token
- **Error Handling**: Direct error checking
- **Retry**: None
- **Lines**: 78-86 (edge function call)
- **TODO**: Migrate to AuthService

---

### Service Layer Files

#### 1. /apps/web/src/lib/services/filesystem.service.ts (425 lines)
**Purpose**: Centralized filesystem operations (folders and documents)

**Pattern**: HTTP fetch with auth headers

**Exported Functions**:
```typescript
FilesystemService = {
  createFolder(name, parentFolderId)        // POST /functions/v1/folders
  renameFolder(folderId, newName)           // PUT /functions/v1/folders/{id}
  moveFolder(folderId, newParentId)         // PUT /functions/v1/folders/{id}
  deleteFolder(folderId)                    // DELETE /functions/v1/folders/{id}
  createDocument(name, folderId)            // POST /functions/v1/documents
  renameDocument(documentId, newName)       // PATCH /functions/v1/documents/{id}
  moveDocument(documentId, newFolderId)     // PATCH /functions/v1/documents/{id}
  updateDocument(documentId, content, ver)  // PUT /functions/v1/documents/{id}
  deleteDocument(documentId)                // DELETE /functions/v1/documents/{id}
  uploadDocument(file, folderId, onProgress)// POST /functions/v1/documents (multipart)
}
```

**Auth Handling**:
```typescript
async function getAuthHeaders() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Authentication required');
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  };
}
```

**Error Pattern**: Returns `{ data?, error? }`

**Key Implementation Details**:
- Uses XMLHttpRequest for upload progress tracking (lines 357-414)
- Handles multipart form data for file uploads
- All endpoints return ApiResponse<T> type
- Response.ok check before JSON parsing
- Detailed error logging for debugging

#### 2. /apps/web/src/lib/services/agent-file.service.ts (124 lines)
**Purpose**: Agent-generated file operations

**Pattern**: HTTP fetch with auth headers

**Exported Functions**:
```typescript
AgentFileService = {
  createFile(path, content, provenance?)    // POST /functions/v1/create-file
  deleteFile(fileId)                        // DELETE /functions/v1/delete-file/{id}
}
```

**Auth Handling**: Same getAuthHeaders() duplicated (lines 19-31)

**Response Transformation**: 
- Wraps response as `{ data: { fileId, ...}, provenance }`
- Returns FileData type with provenance metadata

**Key Implementation Details**:
- Separates provenance from content
- Type-safe with FileData and Provenance types
- Simple error handling

---

### Hook Files (12 total)

#### 1. /apps/web/src/lib/hooks/useFilesystemOperations.ts (300+ lines)
**Pattern**: Service layer + Optimistic updates + Toast notifications

**Exported Functions**:
```
createFolder()
renameFolder()
moveFolder()
deleteFolder()
createDocument()
renameDocument()
moveDocument()
deleteDocument()
uploadDocument()
```

**State Management**: 
- Loading states: isCreatingFolder, isCreatingDocument, isRenaming, isMoving, isDeleting
- Optimistic updates via Valtio (addFolder, addDocument, removeFolder, removeDocument)
- Rollback on error

**Auth**: Delegated to FilesystemService

**Key Pattern** (lines 46-94):
```typescript
// Optimistic update
const tempId = `temp-folder-${Date.now()}`;
addFolder(optimisticFolder);

try {
  const { data, error } = await FilesystemService.createFolder(name, parentId);
  if (error) {
    removeFolder(tempId);  // Rollback
    toast.error(`Failed: ${error}`);
    return;
  }
  removeFolder(tempId);    // Replace with real
  if (data) addFolder(data);
  toast.success(`Created`);
} catch (error) {
  removeFolder(tempId);    // Rollback on exception
  toast.error('Unexpected error');
}
```

#### 2. /apps/web/src/lib/hooks/useCreateAgentFile.ts (84 lines)
**Pattern**: Service layer + Optimistic state + Toast

**Exported Function**: `createFile(path, content, provenance?)`

**State Management**: 
- Optimistic: aiAgentState.currentFile, aiAgentState.selectedFileId
- Rollback: Store original state before update

**Key Feature**: Provenance tracking (which thread created file)

#### 3. /apps/web/src/lib/hooks/useDeleteFile.ts (69 lines)
**Pattern**: Service layer + Optimistic state + Toast

**Exported Function**: `deleteFile(fileId)`

**State Management**: 
- Clears currentFile if deleted file is active
- Rollback on error

#### 4. /apps/web/src/lib/hooks/useSendMessage.ts (280+ lines)
**Pattern**: Direct HTTP fetch + SSE streaming

**Exported Function**: `sendMessage(text)`

**Key Implementation**:
- POST to `/functions/v1/thread-messages/threads/{id}/messages`
- Headers: Authorization, Idempotency-Key
- Gets HAL-style _links.stream.href from response (line 114)
- Sets up SSE connection for streaming response
- Parses SSE events: context_ready, text_chunk, tool_call, completion, error
- Updates optimistic message with streamed content

**State Management**:
- Optimistic user message with idempotency key
- Optimistic assistant message that updates as stream arrives
- Cleans up on error

**Key Feature** (lines 137-234):
- Manual EventSource handling with ReadableStream
- SSE line parsing with buffer management
- Incremental content updates (text_chunk event)
- Tool call interception (for approval modal)
- Completion event replaces temp ID with real message ID

#### 5. /apps/web/src/lib/hooks/useApproveToolCall.ts (88 lines)
**Pattern**: Direct HTTP fetch + Toast

**Exported Function**: `approveTool(toolCallId, approved, reason?, requestId?)`

**Key Implementation**:
- POST to `/functions/v1/approve-tool`
- Handles maxRevisionsReached error specially
- Returns revision count (up to 3 attempts)

#### 6. /apps/web/src/lib/hooks/useConsolidation.ts (321 lines)
**Pattern**: Direct supabase.functions.invoke() + SSE + Optimistic updates

**Exported Functions**:
```
openConsolidation()
closeConsolidation()
startConsolidation(branchIds, targetFolder, fileName)
approveConsolidation(targetFolder, fileName)
rejectConsolidation()
```

**Key Implementation**:
- Calls consolidate-branches function via invoke() (line 152)
- Gets SSE stream URL from response (line 169)
- Sets up EventSource for progress updates (lines 170-238)
- Three event types: progress, content, complete
- Automatic file creation on completion

**TODO**: Migrate to ConsolidationService + useServerSentEvents hook

#### 7-12. Thread Operations Hooks
- `/apps/web/src/lib/hooks/useLoadThreads.ts` - Direct DB query
- `/apps/web/src/lib/hooks/useLoadThread.ts` - Direct DB query (implied)
- `/apps/web/src/lib/hooks/useCreateBranch.ts` - HTTP fetch
- `/apps/web/src/lib/hooks/useUpdateThread.ts` - HTTP fetch
- `/apps/web/src/lib/hooks/useDeleteThread.ts` - HTTP fetch
- `/apps/web/src/lib/hooks/useLoadFile.ts` - Direct DB query (implied)

**Issue**: No ThreadService - operations scattered across hooks

---

### Utility Files

#### 1. /apps/web/src/lib/supabase.ts
**Key Functions**:
- `callEdgeFunction(functionName, payload?, options?)` - Generic wrapper (lines 182-204)
- `createRealtimeSubscription()` - Real-time helpers
- `uploadFile()`, `downloadFile()`, `getFileUrl()` - Storage helpers
- `signIn*()`, `signOut()` - Auth helpers
- `withRetry()` - Retry wrapper for operations

**Problem**: Generic callEdgeFunction wrapper not used (legacy)

#### 2. /apps/web/src/lib/utils.ts
**Key Function**: `getAuthErrorMessage(error, operation)`
- Converts various error formats to user-friendly messages
- Used in signup.tsx, profile.tsx (but not in services)

**TODO**: Move to lib/api/errors.ts for consistency

---

### State Management Files

#### /apps/web/src/lib/state/aiAgentState.ts
- Valtio proxy for thread/branch/file state
- Used by optimistic update hooks
- Actions: setBranchTree, setSelectedFile, setCurrentFile, updateMessages

#### /apps/web/src/lib/state/filesystem.ts
- Valtio proxy for folder/document state
- Used by useFilesystemOperations hook
- Actions: addFolder, removeFolder, addDocument, removeDocument, etc.

---

## HTTP Request Patterns

### Pattern 1: Basic Fetch
```typescript
const { data: { session } } = await supabase.auth.getSession();
const response = await fetch(
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/endpoint`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(payload),
  }
);
if (!response.ok) {
  const errorData = await response.json();
  return { error: errorData.message || 'Failed' };
}
const data = await response.json();
return { data };
```

### Pattern 2: Multipart Upload
```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('folder_id', folderId);

const xhr = new XMLHttpRequest();
xhr.upload.addEventListener('progress', (e) => {
  if (e.lengthComputable) {
    onProgress((e.loaded / e.total) * 100);
  }
});
xhr.open('POST', url);
xhr.setRequestHeader('Authorization', `Bearer ${token}`);
xhr.send(formData);
```

### Pattern 3: SSE Streaming
```typescript
const response = await fetch(sseUrl, {
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: 'text/event-stream',
  }
});
const reader = response.body?.getReader();
const decoder = new TextDecoder();
let buffer = '';

const processStream = async () => {
  const { done, value } = await reader.read();
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('event: ')) currentEvent = line.slice(7);
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      // Handle event...
    }
  }
  
  if (!done) processStream();
};
```

---

## Edge Function Endpoints

### Registered Functions (from config.toml)

```
[functions.create-account]
entrypoint = '../src/functions/create-account/index.ts'
Method: invoke() only
Payload: { email, password, firstName, lastName }

[functions.update-profile]
entrypoint = '../src/functions/update-profile/index.ts'
Method: invoke() only
Payload: { firstName, lastName }

[functions.delete-account]
entrypoint = '../src/functions/delete-account/index.ts'
Method: invoke() only
Payload: { confirmation }

[functions.documents]
entrypoint = '../src/functions/documents/index.ts'
HTTP: /functions/v1/documents
Methods: POST (create), PUT (update content), PATCH (update metadata), DELETE

[functions.folders]
entrypoint = '../src/functions/folders/index.ts'
HTTP: /functions/v1/folders
Methods: POST (create), PUT (update), DELETE

[functions.thread-messages]
entrypoint = '../src/functions/thread-messages/index.ts'
HTTP: /functions/v1/thread-messages/threads/{id}/messages
Methods: POST (send message), GET (list messages)
Response: HAL-style with _links.stream.href for SSE

[functions.approve-tool]
entrypoint = '../src/functions/approve-tool/index.ts'
HTTP: /functions/v1/approve-tool
Methods: POST
Payload: { requestId, toolCallId, approved, reason }

[functions.stream-agent]
entrypoint = '../src/functions/stream-agent/index.ts'
HTTP: Internal streaming endpoint
Used by: thread-messages SSE response

[functions.api]
entrypoint = '../src/functions/api/index.ts'
HTTP: /functions/v1/api/*
Methods: GET (/health, /threads, /), POST (/threads)
Status: **Proposed consolidation point - needs routing implementation**
```

---

## Duplicated Code Locations

### getAuthHeaders() Duplication
1. FilesystemService.ts (lines 19-31)
2. AgentFileService.ts (lines 19-31)
3. useSendMessage.ts (lines 36-41)
4. useApproveToolCall.ts (lines 18-23)
5. useConsolidation.ts (inline with supabase.functions.invoke)
6. 5+ other locations

### Error Handling Patterns
1. Service return pattern: `{ data?, error? }`
2. Fetch response.ok pattern: if (!response.ok) { parse JSON }
3. Helper function: getAuthErrorMessage()
4. Direct throw: throw new Error()
5. DB error check: if (error) { throw }

### Response Wrapping Patterns
1. FilesystemService: returns raw data
2. AgentFileService: wraps in { data: {...} }
3. useSendMessage: uses _links from response
4. useConsolidation: returns { data: { fileId, provenance } }

---

## Recommendations for Next Steps

1. **Extract Auth Handling**
   - Create `/apps/web/src/lib/api/getAuthHeaders.ts`
   - One source of truth for Authorization header generation

2. **Create HTTP Client**
   - Create `/apps/web/src/lib/api/client.ts`
   - Wrap fetch with automatic auth injection
   - Centralize error handling and retry logic

3. **Create Auth Service**
   - Consolidate create-account, update-profile, delete-account
   - Replace invoke() calls with service calls
   - Migrate signup.tsx, profile.tsx, account/delete.tsx

4. **Create Thread Service**
   - Consolidate useCreateBranch, useUpdateThread, useDeleteThread
   - Replace direct DB queries with API calls
   - Centralized thread operations

5. **Extract Reusable Hooks**
   - useOptimisticUpdate() - for folder, document, file operations
   - useServerSentEvents() - for message streaming and consolidation
   - useApi() - for generic API calls with loading/error states

