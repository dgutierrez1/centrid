# Frontend API Migration - Complete Plan

**Date**: 2025-10-29
**Status**: Phase 1 Complete, Phase 2-3 In Progress
**Estimated Remaining Time**: 1.5-2 hours
**Token Budget**: 13k tokens available (6.4%)

---

## Executive Summary

The frontend is **partially migrated** to use the unified API client. Critical security issues exist in 2 hooks (missing auth headers), and several other hooks still use raw `fetch` without error handling.

**Current Status**:
- ✅ **7 hooks migrated** to api client with proper auth
- ⚠️ **2 hooks critical** (missing auth headers - will fail)
- ❌ **5 hooks remaining** (raw fetch, need migration)
- ✅ **No direct Supabase CRUD** in refactored hooks

---

## Part 1: COMPLETED ✅

### Phase 1: Critical - Stop Bypassing API (DONE)
**Time: 2 hours**

#### Completed Hooks (API Client with Auth)
| Hook | Status | Changes |
|------|--------|---------|
| `useLoadThread.ts` | ✅ | Fixed response wrapper + field mapping + auth |
| `useLoadThreads.ts` | ✅ | Fixed response wrapper + field mapping + auth |
| `useCreateBranch.ts` | ✅ | Fixed response wrapper + field mapping + auth |
| `useDeleteThread.ts` | ✅ | Uses api.delete() with auth |
| `useUpdateThread.ts` | ✅ | Fixed response wrapper + field mapping + auth |
| `useApproveToolCall.ts` | ✅ | Uses api.post() with proper response handling |
| `useSendMessage.ts` | ✅ | Uses fetch for initial POST (api client compatible) + fixed response wrapper |
| `useUpdateFile.ts` | ✅ | Fixed endpoint path `/api/files` + auth via fetch |

**Verification**: No type errors in these hooks ✅

---

## Part 2: REMAINING WORK ⚠️

### Phase 2: CRITICAL - Security Fix (Missing Auth Headers)

**RISK LEVEL**: 🔴 HIGH - These hooks will fail with 401 Unauthorized

#### 2.1: Fix useAddToExplicit.ts
**File**: `apps/web/src/lib/hooks/useAddToExplicit.ts`

**Current Issue**:
```typescript
const response = await fetch(`/api/context-references`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // ❌ NO Authorization header!
  },
  body: JSON.stringify({...})
})
```

**Required Changes**:
1. Add import: `import { api } from '@/lib/api/client'`
2. Replace raw fetch with api.post()
3. Fix response wrapper handling

**Target Implementation**:
```typescript
const response = await api.post<{
  data: {
    success: boolean
    contextReference: any
  }
}>('/api/context-references', {
  threadId,
  entityType: 'file',
  entityReference: fileId,
  source: 'manual',
  priorityTier: 1,
})
```

**Verification**:
- No 401 errors on add-to-explicit
- Context reference added successfully

---

#### 2.2: Fix useHideBranch.ts
**File**: `apps/web/src/lib/hooks/useHideBranch.ts`

**Current Issue**:
```typescript
const response = await fetch(`/api/threads/${threadId}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    // ❌ NO Authorization header!
  },
  body: JSON.stringify({...})
})
```

**Required Changes**:
1. Add import: `import { api } from '@/lib/api/client'`
2. Replace raw fetch with api.patch()
3. Fix response handling

**Target Implementation**:
```typescript
await api.patch(`/api/threads/${threadId}`, {
  blacklistedBranches: [...previousBlacklist, branchId],
})
```

**Verification**:
- No 401 errors on hide-branch
- Branch successfully hidden from context

---

### Phase 3: HIGH - API Client Consistency

#### 3.1: Refactor useLoadFile.ts
**File**: `apps/web/src/lib/hooks/useLoadFile.ts`

**Current Issue**:
- Uses raw `fetch` without unified error handling
- Manual auth header injection (repetitive)
- No retry logic on server errors

**Changes**:
1. Add import: `import { api } from '@/lib/api/client'`
2. Replace fetch with `api.get()`
3. Fix response unwrapping: `const { data } = response.json()`

**Verification**:
- File loads successfully
- Proper error messages on failure
- Automatic retry on 5xx errors

---

#### 3.2: Fix useSendMessage.ts SSE Connection
**File**: `apps/web/src/lib/hooks/useSendMessage.ts`

**Current Status**:
- Initial message POST already uses fetch (acceptable)
- SSE stream connection (line 119) uses raw fetch

**Issue**:
- Auth headers hardcoded, repetitive code
- No unified error handling for stream setup

**Changes**:
1. Extract auth headers to variable using `getAuthHeaders()`
2. Keep raw fetch for SSE (required for EventSource pattern)
3. Add proper error handling for stream setup

**Target Implementation**:
```typescript
const headers = await getAuthHeaders()

const response = await fetch(sseUrl, {
  headers: {
    ...headers,
    'Accept': 'text/event-stream',
  }
})
```

**Verification**:
- SSE stream connects successfully
- No 401 errors on stream
- Proper error handling if stream fails

---

#### 3.3: Refactor useAutocomplete.ts
**File**: `apps/web/src/lib/hooks/useAutocomplete.ts`

**Current Issue**:
- Uses raw fetch without unified error handling
- No consistent response handling pattern

**Changes**:
1. Add import: `import { api } from '@/lib/api/client'`
2. Replace fetch with `api.post()` or `api.get()`
3. Unwrap response data properly

**Verification**:
- Autocomplete suggestions load
- Proper error messages on failure

---

### Phase 4: MEDIUM - Audit Remaining Hooks

#### 4.1: Audit useConsolidation.ts
**File**: `apps/web/src/lib/hooks/useConsolidation.ts`

**Checklist**:
- [ ] Check for direct Supabase calls (`.from()`)
- [ ] Check for raw `fetch` calls
- [ ] Check for proper auth headers
- [ ] Document findings

---

#### 4.2: Audit useDeleteFile.ts
**File**: `apps/web/src/lib/hooks/useDeleteFile.ts`

**Checklist**:
- [ ] Check for direct Supabase calls (`.from()`)
- [ ] Check for raw `fetch` calls
- [ ] Check for proper auth headers
- [ ] Document findings

---

#### 4.3: Audit useCreateAgentFile.ts
**File**: `apps/web/src/lib/hooks/useCreateAgentFile.ts`

**Checklist**:
- [ ] Check for direct Supabase calls (`.from()`)
- [ ] Check for raw `fetch` calls
- [ ] Check for proper auth headers
- [ ] Document findings

---

## Part 3: VERIFICATION CRITERIA

### Type Safety
```bash
cd apps/web && npx tsc --noEmit
```
✅ **REQUIRED**: No type errors in refactored hooks

### Runtime Verification
- [ ] useAddToExplicit: Add to context → No 401 errors
- [ ] useHideBranch: Hide branch → No 401 errors
- [ ] useLoadFile: Load file → File appears in editor
- [ ] useAutocomplete: Type in context panel → Suggestions appear
- [ ] useSendMessage: Send message → Message streams properly

### Code Quality
- [ ] All API calls use `api` client (except SSE which uses raw fetch)
- [ ] All API calls have auth headers (automatic via interceptor)
- [ ] Response unwrapping is consistent (`{ data }` pattern)
- [ ] Error messages are user-friendly

---

## Part 4: RISK ASSESSMENT

### Critical Blockers 🔴
1. **useAddToExplicit** - Missing auth will cause 401
2. **useHideBranch** - Missing auth will cause 401

### High Priority ⚠️
3. **useLoadFile** - Used to display file content
4. **useAutocomplete** - UX feature, used frequently

### Medium Priority 🟡
5. **useConsolidation** - Less critical
6. **useDeleteFile** - Less critical
7. **useCreateAgentFile** - Less critical

---

## Part 5: EXECUTION PLAN

### Phase 2 (CRITICAL - 30 min)
```
[START] → Fix useAddToExplicit → Fix useHideBranch → Type Check → [END]
```

**Go/No-Go**: If type check passes, proceed to Phase 3. Otherwise, fix type errors.

### Phase 3 (HIGH - 45 min)
```
[START] → Fix useLoadFile → Fix useSendMessage SSE → Fix useAutocomplete → Type Check → [END]
```

### Phase 4 (MEDIUM - 30 min)
```
[START] → Audit remaining 3 hooks → Document → Create summary report → [END]
```

---

## Summary Table

| Hook | Phase | Priority | Status | Auth | API Client |
|------|-------|----------|--------|------|------------|
| useLoadThread | 1 | CRITICAL | ✅ DONE | ✅ | ✅ |
| useLoadThreads | 1 | CRITICAL | ✅ DONE | ✅ | ✅ |
| useCreateBranch | 1 | CRITICAL | ✅ DONE | ✅ | ✅ |
| useDeleteThread | 1 | CRITICAL | ✅ DONE | ✅ | ✅ |
| useUpdateThread | 1 | CRITICAL | ✅ DONE | ✅ | ✅ |
| useApproveToolCall | 1 | HIGH | ✅ DONE | ✅ | ✅ |
| useSendMessage | 1 | HIGH | ✅ DONE | ✅ | ✅ |
| useUpdateFile | 1 | HIGH | ✅ DONE | ✅ | ⚠️ fetch |
| **useAddToExplicit** | **2** | **🔴 CRITICAL** | ❌ TODO | ❌ MISSING | ❌ |
| **useHideBranch** | **2** | **🔴 CRITICAL** | ❌ TODO | ❌ MISSING | ❌ |
| useLoadFile | 3 | HIGH | ❌ TODO | ✅ | ❌ |
| useAutocomplete | 3 | HIGH | ❌ TODO | ✅ | ❌ |
| useSendMessage (SSE) | 3 | HIGH | ⚠️ PARTIAL | ✅ | ⚠️ fetch |
| useConsolidation | 4 | MEDIUM | ❌ AUDIT | ? | ? |
| useDeleteFile | 4 | MEDIUM | ❌ AUDIT | ? | ? |
| useCreateAgentFile | 4 | MEDIUM | ❌ AUDIT | ? | ? |

---

## Notes

- All api client calls have **automatic auth header injection** via interceptor
- All api client calls have **automatic retry** on 5xx errors (max 2 retries)
- Raw `fetch` is acceptable only for **SSE streams** (EventSource pattern)
- Response pattern: Backend returns `{ data: {...} }`, frontend unwraps with `const { data } = response`
- Thread state uses `title` (not `branchTitle`), string dates (not Date objects)

---

**Ready to execute Phase 2?** ✅
