# Frontend Architecture Analysis - Executive Summary

## Quick Facts

- **Total Frontend Files**: 93 TypeScript/TSX files
- **Files with Direct Function Calls**: 5 files
- **Files Using HTTP Fetch Services**: 2 services + 8 hooks = 10 files
- **Files Requiring Changes**: ~40-50 files (direct + indirect)
- **Code Duplication**: 10+ instances of same auth/error patterns

---

## Current State

### Pattern 1: Legacy (Direct supabase.functions.invoke)
```typescript
// 5 files use this
const { data, error } = await supabase.functions.invoke('create-account', {
  body: validation.data,
})
```

Files:
- /pages/signup.tsx
- /pages/profile.tsx
- /pages/account/delete.tsx
- /lib/supabase.ts (wrapper)
- /lib/hooks/useConsolidation.ts

### Pattern 2: Modern (HTTP fetch + Service Layer)
```typescript
// 10 files use this
const { data, error } = await FilesystemService.createFolder(name, parentId)
```

Services:
- FilesystemService (10 operations)
- AgentFileService (2 operations)

Supporting Hooks:
- useFilesystemOperations
- useCreateAgentFile
- useDeleteFile
- useSendMessage
- useApproveToolCall
- useLoadThreads
- useCreateBranch
- useUpdateThread
- useDeleteThread

### Pattern 3: Direct DB Queries
```typescript
// 5+ files bypass API entirely
const { data: threads } = await supabase
  .from('threads')
  .select('*')
  .eq('owner_user_id', userId)
```

---

## Problem Areas

### 1. Auth Token Handling (Duplicated 10+ times)
```typescript
// In FilesystemService
async function getAuthHeaders() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return { Authorization: `Bearer ${session.access_token}` };
}

// In AgentFileService (same code)
async function getAuthHeaders() { ... }

// In useSendMessage (inline)
const { data: { session } } = await supabase.auth.getSession()
const headers = { Authorization: `Bearer ${session.access_token}` }

// In useApproveToolCall (same inline)
// In useConsolidation (same inline)
// In 5+ other places...
```

### 2. Error Handling (5 different approaches)
```typescript
// Pattern A: Services return { data?, error? }
const { data, error } = await service.operation()
if (error) { /* handle */ }

// Pattern B: HTTP fetch with response.ok
if (!response.ok) {
  const errorData = await response.json()
  // handle errorData.message or errorData.error
}

// Pattern C: Pages use helper function
getAuthErrorMessage(error, 'operation name')

// Pattern D: Hooks throw errors
throw new Error(data.error || 'Failed')

// Pattern E: Direct DB errors
if (threadsError) { throw threadsError }
```

### 3. No Request Middleware
- No automatic retry (except signup.tsx with manual withRetry wrapper)
- No request ID tracking for logs
- No cache management
- No deduplication of identical requests

### 4. Inconsistent Response Formats
```typescript
// FilesystemService returns raw data
{ data: folder }

// AgentFileService wraps it
{ data: { data: {...} } }

// Consolidation returns different structure
{ data: { fileId, provenance } }

// Thread operations use different nesting
```

### 5. SSE Streaming Duplicated
- useSendMessage.ts: ~150 lines of SSE client code
- useConsolidation.ts: Similar SSE setup with EventSource

---

## Abstraction Opportunities

### High Priority (Appearing 10+ times)
1. **getAuthHeaders()** - Extract to lib/api/getAuthHeaders.ts
2. **HTTP request with auth** - Extract to lib/api/client.ts
3. **Error handling** - Extract to lib/api/errors.ts

### Medium Priority (Appearing 3-5 times)
4. **Optimistic updates** - Extract to useOptimisticUpdate.ts hook
5. **SSE streaming** - Extract to useServerSentEvents.ts hook
6. **Response transformation** - Extract to lib/api/transform.ts

---

## Scope of Changes

### Direct Updates Required

| Type | Count | Complexity | Time |
|------|-------|-----------|------|
| Page components | 3 | Low | 1-2 hours |
| Service layer | 2 | Low | 1-2 hours |
| Custom hooks | 12 | Medium | 4-6 hours |
| Component updates | 20-30 | Low | 0 (use via hooks) |
| New utilities | 3-5 | Medium | 3-4 hours |
| **Total** | **40-50 files** | **Varies** | **~10-15 hours** |

---

## Recommended Approach

### Phase 1: Extract Utilities (2-3 hours)
Create:
- `/apps/web/src/lib/api/client.ts` - Unified HTTP client
- `/apps/web/src/lib/api/getAuthHeaders.ts` - Auth utility
- `/apps/web/src/lib/api/errors.ts` - Error handler

### Phase 2: Update Services (2-3 hours)
Refactor:
- FilesystemService to use api/client.ts
- AgentFileService to use api/client.ts

### Phase 3: Create New Services (3-4 hours)
Add:
- AuthService (create-account, update-profile, delete-account)
- ThreadService (list, get, create, update, delete)
- ConsolidationService (consolidate-branches)

### Phase 4: Simplify Hooks (3-4 hours)
Update:
- 12 existing hooks to use unified services
- Extract useOptimisticUpdate and useServerSentEvents

### Phase 5: Update Pages (1-2 hours)
Migrate:
- signup.tsx to use AuthService
- profile.tsx to use AuthService
- account/delete.tsx to use AuthService

---

## Benefits After Consolidation

1. **Reduced Code Duplication**
   - Auth handling: 1 location instead of 10+
   - Error handling: 1 pattern instead of 5
   - HTTP requests: 1 client instead of scattered code

2. **Easier Maintenance**
   - Change auth logic once, applies everywhere
   - Unified error responses
   - Consistent request/response formats

3. **Better Observability**
   - Request ID tracking for logs
   - Centralized error logging
   - Performance monitoring hook

4. **Improved Testability**
   - Mock API client once
   - Reusable service tests
   - Hook tests simpler

5. **Future-Proof**
   - Easy to add request retry
   - Easy to add request caching
   - Easy to add analytics
   - Easy to migrate to different backend

---

## File Locations

Complete analysis: `/Users/daniel/Projects/misc/centrid/FRONTEND_ARCHITECTURE_ANALYSIS.md`

Key files to review:
- `/apps/web/src/lib/services/filesystem.service.ts` (good pattern to follow)
- `/apps/web/src/lib/services/agent-file.service.ts` (good pattern to follow)
- `/apps/web/src/lib/hooks/useFilesystemOperations.ts` (good hook pattern)
- `/apps/web/src/pages/signup.tsx` (needs migration to service layer)

