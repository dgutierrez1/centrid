# Frontend Architecture Analysis: Direct Supabase Function Calls vs. Centralized API

## Executive Summary

The Centrid frontend currently invokes Supabase Edge Functions in **two competing patterns**:

1. **Legacy Pattern**: Direct `supabase.functions.invoke()` calls scattered across pages and components
2. **New Pattern**: HTTP fetch calls to `/functions/v1/*` endpoints via service layer abstraction

This analysis identifies the scope of migration needed to consolidate around a unified, centralized API approach.

---

## Current State: Direct Supabase Function Invocations

### Files Currently Calling Supabase Functions Directly: 5 files

| File | Function | Pattern | Purpose |
|------|----------|---------|---------|
| `/apps/web/src/pages/signup.tsx` | `create-account` | `supabase.functions.invoke()` | Account creation with profile |
| `/apps/web/src/pages/profile.tsx` | `update-profile` | `supabase.functions.invoke()` | Profile updates (name fields) |
| `/apps/web/src/pages/account/delete.tsx` | `delete-account` | `supabase.functions.invoke()` | Account deletion (GDPR) |
| `/apps/web/src/lib/supabase.ts` | Generic wrapper | `callEdgeFunction()` helper | Generic edge function caller |
| `/apps/web/src/lib/hooks/useConsolidation.ts` | `consolidate-branches` | `supabase.functions.invoke()` | Consolidate AI agent branches |

### Summary of Direct Calls
- **5 edge functions invoked directly** via `supabase.functions.invoke()`
- **3 authentication-related** functions (create-account, update-profile, delete-account)
- **1 AI agent function** (consolidate-branches)
- **1 generic wrapper** providing unified error handling

---

## New Architecture: Service Layer + HTTP Fetch Pattern

### Service Layer Files: 2 services

#### 1. FilesystemService (`/apps/web/src/lib/services/filesystem.service.ts`)
**Uses**: HTTP `fetch()` with direct URL construction
**Endpoints**: `/functions/v1/folders`, `/functions/v1/documents`

```
GET/POST/PUT/DELETE /functions/v1/folders
GET/POST/PUT/PATCH/DELETE /functions/v1/documents
```

**Operations**:
- `createFolder()` - POST
- `renameFolder()` - PUT
- `moveFolder()` - PUT
- `deleteFolder()` - DELETE
- `createDocument()` - POST
- `renameDocument()` - PATCH
- `moveDocument()` - PATCH
- `updateDocument()` - PUT (auto-save)
- `deleteDocument()` - DELETE
- `uploadDocument()` - POST (multipart/form-data with progress)

#### 2. AgentFileService (`/apps/web/src/lib/services/agent-file.service.ts`)
**Uses**: HTTP `fetch()` with direct URL construction
**Endpoints**: `/functions/v1/create-file`, `/functions/v1/delete-file/{id}`

```
POST /functions/v1/create-file
DELETE /functions/v1/delete-file/{id}
```

**Operations**:
- `createFile()` - Creates agent-generated files with provenance
- `deleteFile()` - Deletes files by ID

### Hook Implementations: 12 custom hooks

| Hook | Service Used | UI Concerns |
|------|--------------|-------------|
| `useFilesystemOperations()` | FilesystemService | Toast, optimistic updates, rollback |
| `useCreateAgentFile()` | AgentFileService | Toast, optimistic state, rollback |
| `useDeleteFile()` | AgentFileService | Toast, optimistic state, rollback |
| `useSendMessage()` | Direct HTTP fetch | SSE streaming, optimistic messages |
| `useApproveToolCall()` | Direct HTTP fetch | Toast, loading state |
| `useConsolidation()` | Direct supabase.functions.invoke() | SSE streaming, progress updates |
| `useLoadThreads()` | Direct DB query | State management |
| `useLoadThread()` | Direct DB query | State management |
| `useCreateBranch()| Direct HTTP fetch | State management |
| `useUpdateThread()` | Direct HTTP fetch | State management |
| `useDeleteThread()` | Direct HTTP fetch | State management |
| `useLoadFile()` | Direct DB query | State management |

---

## Edge Function Landscape

### Registered Edge Functions (config.toml): 11 functions

| Function | Type | Routing | Status |
|----------|------|---------|--------|
| `create-account` | Auth | Direct invoke | Direct calls only |
| `update-profile` | Auth | Direct invoke | Direct calls only |
| `delete-account` | Auth | Direct invoke | Direct calls only |
| `documents` | Filesystem | `/functions/v1/documents` | HTTP fetch via service |
| `folders` | Filesystem | `/functions/v1/folders` | HTTP fetch via service |
| `index-document` | Background | Queued from documents | Internal only |
| `api` | Centralized API | `/functions/v1/api` | **NEW - Proposed consolidation point** |
| `thread-messages` | AI Agent | `/functions/v1/thread-messages/threads/{id}/messages` | HTTP fetch (useSendMessage) |
| `stream-agent` | AI Agent | Streaming endpoint | Used via useSendMessage SSE |
| `approve-tool` | AI Agent | `/functions/v1/approve-tool` | HTTP fetch (useApproveToolCall) |

### Missing/Under-Implemented Functions
- No single consolidation function for `/functions/v1/create-file`
- No single consolidation function for `/functions/v1/delete-file`
- Thread operations scattered (useCreateBranch, useUpdateThread, useDeleteThread)

---

## Frontend Service Layer Architecture

### Pattern: Three-Layer Architecture

```
UI Components
    ↓
Custom Hooks (Loading states, toast, optimistic updates)
    ↓
Service Layer (Pure API functions: { data?, error? })
    ↓
HTTP Fetch / supabase.functions.invoke()
    ↓
Edge Functions / Supabase
```

### Current Invocation Methods (by count)

| Method | Count | Files | Status |
|--------|-------|-------|--------|
| `supabase.functions.invoke()` | 5 | 5 files | **Legacy pattern** |
| `fetch()` to `/functions/v1/*` | ~30 | 2 services + 8 hooks | **New pattern** |
| Direct DB queries | ~8 | 5 hooks | **Bypasses API** |

### Issues with Current Approach

1. **Auth Handling Scattered**
   - `getAuthHeaders()` duplicated in two service files
   - Direct `supabase.auth.getSession()` calls in hooks
   - Session token extraction repeated 10+ times

2. **Error Handling Inconsistency**
   - Services use `{ data?, error? }` pattern
   - Direct fetch calls use `response.ok` checks
   - Error messages vary (sometimes response.message, sometimes error.error)

3. **No Unified Request/Response Format**
   - FilesystemService: Uses kebab-case JSON keys
   - AgentFileService: Wraps responses as `{ data: {...} }`
   - Thread operations: Direct payload structures
   - Consolidation: Returns `{ data: { fileId, provenance } }`

4. **Duplicate Logic**
   - `getAuthHeaders()` in 2 services
   - `Bearer token` construction in 5+ places
   - 404/error handling patterns in 8+ hooks

5. **No Request Middleware**
   - No request ID / trace logging
   - No automatic retry logic (except signup.tsx with `withRetry`)
   - No request deduplication across hooks
   - No cache/cache-busting strategy

---

## Inventory: Files Requiring Changes

### Current State: 93 total TypeScript/TSX files in apps/web/src

**Files that need refactoring**:
- **5 files** with direct `supabase.functions.invoke()`
- **12 files** with custom hooks (most use services, some use direct fetch)
- **2 files** with service layers (already HTTP-based)
- **~20 files** with components using hooks (indirect impact)

### Breakdown by Type

#### Pages (direct edge function calls)
1. `/apps/web/src/pages/signup.tsx` - create-account
2. `/apps/web/src/pages/profile.tsx` - update-profile
3. `/apps/web/src/pages/account/delete.tsx` - delete-account

#### Hooks (using services and direct HTTP)
1. `/apps/web/src/lib/hooks/useFilesystemOperations.ts` - FilesystemService
2. `/apps/web/src/lib/hooks/useCreateAgentFile.ts` - AgentFileService
3. `/apps/web/src/lib/hooks/useDeleteFile.ts` - AgentFileService
4. `/apps/web/src/lib/hooks/useSendMessage.ts` - Direct HTTP fetch (SSE)
5. `/apps/web/src/lib/hooks/useApproveToolCall.ts` - Direct HTTP fetch
6. `/apps/web/src/lib/hooks/useConsolidation.ts` - Direct supabase.functions.invoke()
7. `/apps/web/src/lib/hooks/useLoadThreads.ts` - Direct DB query
8. `/apps/web/src/lib/hooks/useLoadThread.ts` - Direct DB query (implied)
9. `/apps/web/src/lib/hooks/useCreateBranch.ts` - Thread operations
10. `/apps/web/src/lib/hooks/useUpdateThread.ts` - Thread operations
11. `/apps/web/src/lib/hooks/useDeleteThread.ts` - Thread operations
12. `/apps/web/src/lib/hooks/useLoadFile.ts` - Direct DB query (implied)

#### Services (existing service layer)
1. `/apps/web/src/lib/services/filesystem.service.ts` - 10 operations
2. `/apps/web/src/lib/services/agent-file.service.ts` - 2 operations

#### Utilities
1. `/apps/web/src/lib/supabase.ts` - Generic `callEdgeFunction()` wrapper
2. `/apps/web/src/lib/utils.ts` - Auth error helpers (used by pages)

---

## Consolidated Edge Function Routing Map

### Current Invocation Endpoints

```
Direct supabase.functions.invoke():
├── create-account
├── update-profile
├── delete-account
└── consolidate-branches

HTTP /functions/v1/* endpoints:
├── /folders
│   ├── POST   - Create
│   ├── PUT    - Update
│   └── DELETE - Delete
├── /documents
│   ├── POST   - Create/Upload
│   ├── PUT    - Update content
│   ├── PATCH  - Update metadata
│   └── DELETE - Delete
├── /create-file
│   └── POST   - Create agent file
├── /delete-file/{id}
│   └── DELETE - Delete file
├── /thread-messages/threads/{id}/messages
│   ├── POST   - Send message (with SSE streaming)
│   └── GET    - List messages (implied)
├── /approve-tool
│   └── POST   - Approve/reject tool call
└── /api (Consolidation point - needs migration)
    ├── /health
    ├── /threads
    ├── /threads/{id}
    ├── /threads/{id}/messages
    └── ... (proposed: consolidate all endpoints here)

Direct database queries (should be API endpoints):
├── GET /threads - useLoadThreads
├── GET /threads/{id} - useLoadThread
├── POST /threads - useCreateBranch
├── PUT /threads/{id} - useUpdateThread
├── DELETE /threads/{id} - useDeleteThread
└── GET /files/{id} - useLoadFile
```

---

## Abstraction Opportunities (Duplicated Logic)

### 1. Auth Header Generation
**Current**: Duplicated in 2 service files + 8 hooks

```typescript
// Appears in:
// - FilesystemService.getAuthHeaders()
// - AgentFileService.getAuthHeaders()
// - useSendMessage.ts (inline)
// - useApproveToolCall.ts (inline)
// - useConsolidation.ts (inline)
// - 4+ other hooks
```

**Should be abstracted to**: Single `lib/api/auth.ts` utility

### 2. Error Handling Pattern
**Current**: Mixed approaches

```typescript
// Pattern 1: Services use { data?, error? }
// Pattern 2: Direct fetch uses response.ok + JSON.parse
// Pattern 3: Pages use getAuthErrorMessage() helper
```

**Should be abstracted to**: Single error wrapper with retry logic

### 3. Request Construction
**Current**: Scattered across files

```typescript
// FilesystemService:
fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/folders`, {
  method: 'POST',
  headers: { ...auth },
  body: JSON.stringify({...})
})

// AgentFileService:
fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-file`, {...})

// useSendMessage:
fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/thread-messages/threads/${threadId}/messages`, {...})
```

**Should be abstracted to**: Single `lib/api/http.ts` with base URL + automatic auth headers

### 4. Optimistic Update Pattern
**Current**: Implemented in 3 hooks

```typescript
// useFilesystemOperations.ts
// useCreateAgentFile.ts
// useDeleteFile.ts

// All follow: Save to Valtio → API call → Rollback on error
```

**Should be abstracted to**: Generic `useOptimisticUpdate()` helper

### 5. SSE Streaming Pattern
**Current**: Implemented in 2 hooks

```typescript
// useSendMessage.ts - Full SSE client
// useConsolidation.ts - SSE listener setup

// Both construct EventSource manually + parse events
```

**Should be abstracted to**: Generic `useServerSentEvents()` hook

---

## Impact Summary

### Files to Update (Direct Impact)

| Category | Count | Files |
|----------|-------|-------|
| Pages (direct calls) | 3 | signup, profile, account/delete |
| Services | 2 | filesystem, agent-file |
| Hooks | 12 | useFilesystem*, useCreate*, useDelete*, useSend*, useApprove*, useConsolidation*, useLoad*, useCreate/Update/DeleteThread, useLoadFile |
| Components (via hooks) | ~20-30 | Estimated (BranchSelector, ThreadView, Workspace, FileEditor, etc.) |
| Utilities | 2 | supabase.ts (callEdgeFunction), utils.ts (auth helpers) |
| **Total** | **~40-50 files** | **Estimated scope** |

### Code Patterns to Abstract (Refactoring Opportunities)

| Pattern | Occurrence | Priority | Abstraction |
|---------|-----------|----------|-------------|
| Auth header generation | 10+ | HIGH | `lib/api/getAuthHeaders.ts` |
| HTTP request wrapper | 30+ lines | HIGH | `lib/api/request.ts` |
| Error handling | 5+ patterns | MEDIUM | `lib/api/errors.ts` |
| Optimistic updates | 3 hooks | MEDIUM | `useOptimisticUpdate.ts` |
| SSE streaming | 2 hooks | MEDIUM | `useServerSentEvents.ts` |
| Response transformation | 8+ places | LOW | `lib/api/transform.ts` |

---

## Current Service Layer Invocation Count

### FilesystemService Used By (Estimated 5-8 hooks)
- useFilesystemOperations
- FileUploadModalContainer
- RenameModal
- CreateDocumentModal
- CreateFolderModal
- DeleteConfirmationModal

### AgentFileService Used By (Estimated 3-5 hooks)
- useCreateAgentFile
- useDeleteFile
- FileEditorPanelContainer (via hooks)
- ToolCallApprovalContainer (via hooks)

### Direct HTTP Calls Used By (Estimated 8+ hooks)
- useSendMessage
- useApproveToolCall
- useConsolidation
- useLoadThread/Threads/File
- useCreateBranch
- useUpdateThread
- useDeleteThread

### Direct DB Queries Used By (Estimated 5+ hooks)
- useLoadThreads
- useLoadThread
- useLoadFile (implied)

---

## Consolidation Strategy Summary

### Phase 1: Abstraction (Reduce duplication)
1. Extract `getAuthHeaders()` → single utility
2. Extract HTTP request logic → single wrapper with auth injection
3. Extract error handling → single converter
4. Extract optimistic update logic → reusable hook
5. Extract SSE streaming → reusable hook

### Phase 2: Service Unification
1. Create `lib/api/client.ts` - Unified HTTP client with auth
2. Update FilesystemService to use unified client
3. Update AgentFileService to use unified client
4. Create new services for thread operations
5. Create new service for auth operations
6. Create new service for consolidation operations

### Phase 3: Hook Simplification
1. Simplify hooks to use unified services
2. Reduce state management boilerplate
3. Extract common UI patterns (toast, loading, rollback)

### Phase 4: Edge Function Consolidation (Future)
1. Consider moving non-streaming operations to `/api` endpoint
2. Keep SSE operations on dedicated endpoints (thread-messages, stream-agent)
3. Consolidate auth operations (create-account, update-profile, delete-account)

---

## Key Observations

1. **Service Layer Pattern is Working** - FilesystemService and AgentFileService demonstrate good separation of concerns
2. **Mixed Invocation Methods** - Pages still use legacy `supabase.functions.invoke()` while services use HTTP fetch
3. **No Request ID Tracking** - Can't trace API calls across frontend/backend logs
4. **Auth Token Handling** - Duplicated 10+ times across codebase
5. **Error Handling Inconsistent** - Different error formats in different layers
6. **SSE Streaming Complex** - Both useSendMessage and useConsolidation reinvent SSE client
7. **Optimistic Updates Inconsistent** - 3 hooks implement independently with variations
8. **Thread Operations Spread** - No centralized thread service (scattered across hooks)

