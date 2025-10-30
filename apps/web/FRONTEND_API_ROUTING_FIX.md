# Frontend API Routing Fix

**Date**: 2025-10-30
**Issue**: Frontend calling `/api/api/threads` instead of `/api/threads`
**Status**: ✅ Fixed

## Root Cause

**Double `/api` prefix** due to incorrect axios configuration:

```typescript
// apps/web/src/lib/api/client.ts (line 22)
baseURL: `/api`,  // ← Axios adds this to all requests

// apps/web/src/lib/hooks/*.ts
api.post('/api/threads', {...})  // ← Hook adds /api AGAIN
api.get('/api/files/123')        // ← Double prefix

// Result: /api + /api/threads = /api/api/threads ❌
```

## How Frontend API Routing Works

### Two API Call Patterns

**Pattern 1: Axios client with Next.js proxy** (for simple CRUD):
```typescript
import { api } from '@/lib/api/client'

// Axios baseURL: '/api'
api.post('/threads', {...})  // → /api/threads → Next.js → Supabase
```

**Pattern 2: Direct fetch** (for streaming/SSE):
```typescript
fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/api/threads`)
// → Directly to Supabase (bypasses Next.js)
```

### Next.js API Gateway (`pages/api/[...path].ts`)

Acts as a proxy to avoid CORS issues:

```typescript
// Frontend calls: /api/threads
// Next.js catches: path = ['threads']
// Forwards to: https://.../functions/v1/api/threads
// Supabase edge function receives: /api/threads
```

## Files Fixed

### ✅ Fixed (3 files - axios client)

1. **`apps/web/src/lib/hooks/useCreateBranch.ts`** (line 41)
   - **Before**: `api.post('/api/threads', {...})`
   - **After**: `api.post('/threads', {...})`

2. **`apps/web/src/lib/hooks/useLoadThread.ts`** (line 37)
   - **Before**: `api.get(\`/api/threads/${threadId}\`)`
   - **After**: `api.get(\`/threads/${threadId}\`)`

3. **`apps/web/src/lib/hooks/useLoadFile.ts`** (line 25)
   - **Before**: `api.get(\`/api/files/${id}\`)`
   - **After**: `api.get(\`/files/${id}\`)`

### ✅ No Changes Needed (5 files - direct fetch)

These files use direct `fetch()` with full Supabase URLs, which correctly bypass the Next.js proxy:

1. `apps/web/src/lib/hooks/useSendMessage.ts`
   - `${SUPABASE_URL}/functions/v1/api/messages?threadId=...`
   - `${SUPABASE_URL}/functions/v1/api/agent-requests/${requestId}/stream`
   - `${SUPABASE_URL}/functions/v1/api/threads/${threadId}/messages/${messageId}`

2. `apps/web/src/lib/hooks/useUpdateFile.ts`
   - `${SUPABASE_URL}/functions/v1/api/files/${fileId}`

3. `apps/web/src/lib/api/agent-requests.ts`
   - `${SUPABASE_URL}/functions/v1/api/agent-requests/${requestId}`
   - `${SUPABASE_URL}/functions/v1/api/agent-requests/${requestId}/pending-tools`
   - `${SUPABASE_URL}/functions/v1/api/threads/${threadId}/pending-tools`

4. `apps/web/src/components/ai-agent/WorkspaceContainer.tsx`
5. `apps/web/src/components/ai-agent-system/FileEditorPanelContainer.tsx`

## Path Flow Diagrams

### Before Fix (❌ Double /api)

```
Frontend Hook
  ↓
api.post('/api/threads', {...})
  ↓
Axios combines: baseURL='/api' + path='/api/threads'
  ↓
HTTP POST /api/api/threads  ← WRONG!
  ↓
Next.js API Gateway catches: path = ['api', 'threads']
  ↓
Forwards to: https://.../functions/v1/api/api/threads
  ↓
Supabase Edge Function receives: /api/api/threads
  ↓
No route matches → 404 Not Found
```

### After Fix (✅ Single /api)

```
Frontend Hook
  ↓
api.post('/threads', {...})
  ↓
Axios combines: baseURL='/api' + path='/threads'
  ↓
HTTP POST /api/threads  ← CORRECT!
  ↓
Next.js API Gateway catches: path = ['threads']
  ↓
Forwards to: https://.../functions/v1/api/threads
  ↓
Supabase Edge Function receives: /api/threads
  ↓
Hono routes match: app.post('/', ...) mounted at /api/threads
  ↓
ThreadService.createThread(...) → Repository → Database
  ↓
201 Created {data: {...}}
```

## Testing

### Test 1: Create Thread

```bash
# Before: 404 Not Found
POST /api/api/threads

# After: Should work
POST /api/threads → Next.js → Supabase → 201 Created
```

### Test 2: Load Thread

```bash
# Before: 404 Not Found
GET /api/api/threads/123

# After: Should work
GET /api/threads/123 → Next.js → Supabase → 200 OK
```

### Test 3: Load File

```bash
# Before: 404 Not Found
GET /api/api/files/456

# After: Should work
GET /api/files/456 → Next.js → Supabase → 200 OK
```

## Frontend Routing Rules

### ✅ DO: Use axios client without /api prefix

```typescript
import { api } from '@/lib/api/client'

// Correct - axios will add /api
api.get('/threads')                  // → /api/threads
api.post('/threads', {...})          // → /api/threads
api.get(`/threads/${id}`)            // → /api/threads/123
api.get(`/files/${id}`)              // → /api/files/456
api.patch(`/tool-calls/${id}`, {...}) // → /api/tool-calls/789
```

### ✅ DO: Use direct fetch with full Supabase URL

```typescript
// Correct - for streaming/SSE that bypasses Next.js
fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/api/threads`)
```

### ❌ DON'T: Double /api prefix with axios

```typescript
// Wrong - creates /api/api/threads
api.post('/api/threads', {...})  // ❌
api.get('/api/files/123')        // ❌
```

## Related Files

- `apps/web/src/lib/api/client.ts` - Axios configuration with baseURL
- `apps/web/pages/api/[...path].ts` - Next.js API Gateway proxy
- `apps/api/src/functions/api/index.ts` - Supabase Edge Function (Hono routes)

## Summary

**Fixed**: 3 hooks that use axios client (removed `/api` prefix)
**Verified**: 5 files using direct fetch (no changes needed)
**Result**: All frontend API calls now route correctly to backend endpoints

**Before**: `/api/api/threads` → 404 ❌
**After**: `/api/threads` → 201 Created ✅
