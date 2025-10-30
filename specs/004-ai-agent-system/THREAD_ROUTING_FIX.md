# Thread Routing Fix - Root Cause Analysis

**Date**: 2025-10-28
**Issue**: Threads not opening when clicked or navigated to via URL
**Status**: ✅ FIXED

## Symptoms

User reported:
1. Threads not showing up on load
2. Thread not opening when routed through URL
3. Thread not opening when clicked in sidebar

## Root Causes

### Issue #1: Schema Mismatch in validateThreadOwnership

**File**: `apps/web/src/lib/auth/serverAuth.ts:174-187`

**Problem**: The `validateThreadOwnership` function was querying for incorrect column names.

**Incorrect Code**:
```typescript
.select('id, title, user_id')
.eq('id', threadId)
.eq('user_id', userId)
```

**Database Schema** (`apps/api/src/db/schema.ts:210-211`):
```typescript
export const threads = pgTable('threads', {
  id: uuid('thread_id').primaryKey(),
  ownerUserId: uuid('owner_user_id').notNull(),
  branchTitle: text('branch_title').notNull(),
  // ...
});
```

**Correct Column Names**:
- `id` → `thread_id`
- `title` → `branch_title`
- `user_id` → `owner_user_id`

**Fix Applied**:
```typescript
.select('thread_id, branch_title, owner_user_id')
.eq('thread_id', threadId)
.eq('owner_user_id', userId)
```

**Impact**: This issue was causing 404 errors when navigating directly to thread URLs, but only for the `/thread/[threadId]` route (which shouldn't exist).

### Issue #2: Wrong Table Validation in workspace/[docId]

**File**: `apps/web/src/pages/workspace/[docId].tsx:29-34`

**Problem**: The `/workspace/[docId]` route was validating against the `conversations` table instead of the `threads` table.

**Incorrect Code**:
```typescript
const { data: workspace } = await supabase
  .from('conversations')  // ❌ Wrong table!
  .select('*')
  .eq('id', workspaceId)
  .eq('user_id', workspaceId)
  .single();
```

**Correct Code**:
```typescript
const { data: thread } = await supabase
  .from('threads')  // ✅ Correct table!
  .select('thread_id, branch_title, owner_user_id')
  .eq('thread_id', workspaceId)
  .eq('owner_user_id', user.id)
  .single();
```

**Impact**: This was the PRIMARY cause of threads not opening. After creating a thread:
1. Thread was successfully created in `threads` table
2. User clicked on thread in sidebar
3. App navigated to `/workspace/[threadId]`
4. Server-side validation checked `conversations` table (wrong!)
5. No record found → returned 404
6. Thread never opened

## Routing Architecture

### Correct Routing Structure

**Thread Index**: `/workspace` (or potentially `/thread`)
- Shows thread list
- Empty workspace state
- Create new thread button

**Thread Detail**: `/workspace/[threadId]`
- Opens specific thread
- Shows messages
- AI agent interface
- Branch navigation

### Navigation Flow

1. User clicks "+ New Thread"
2. Modal opens, user enters title
3. `useCreateBranch` hook calls `POST /functions/v1/create-thread`
4. API creates thread in `threads` table
5. Hook navigates to `/workspace/[threadId]` (line 74 in useCreateBranch.ts)
6. Server validates thread ownership against `threads` table
7. WorkspaceContainer renders with thread loaded

### Code References

**Thread Creation**:
- Hook: `apps/web/src/lib/hooks/useCreateBranch.ts:74`
  ```typescript
  router.push(`/workspace/${data.data.threadId}`);
  ```

**Thread Click**:
- Handler: `apps/web/src/components/ai-agent/WorkspaceContainer.tsx:99`
  ```typescript
  const handleThreadClick = useCallback((threadId: string) => {
    router.push(`/workspace/${threadId}`);
  }, [router, isSidebarOpen]);
  ```

**Thread Validation**:
- Page: `apps/web/src/pages/workspace/[docId].tsx:29-34`
  ```typescript
  const { data: thread } = await supabase
    .from('threads')
    .select('thread_id, branch_title, owner_user_id')
    .eq('thread_id', workspaceId)
    .eq('owner_user_id', user.id)
    .single();
  ```

## Files Modified

### 1. `apps/web/src/lib/auth/serverAuth.ts`
**Lines**: 174-187
**Change**: Updated `validateThreadOwnership` to use correct column names
**Status**: ✅ Fixed

### 2. `apps/web/src/pages/workspace/[docId].tsx`
**Lines**: 6-8, 15-16, 29-34
**Changes**:
- Updated comments to reflect thread routing (not workspace/conversation)
- Changed validation from `conversations` table to `threads` table
- Updated column names to match schema
**Status**: ✅ Fixed

## Testing Results

### Before Fix
❌ Thread creation: API succeeds (201 Created)
❌ Thread navigation: Page returns 404
❌ Thread display: Empty "Select a thread to begin" message
❌ Thread click: No navigation or 404 error

### After Fix
✅ Thread creation: API succeeds (201 Created)
✅ Thread navigation: Page loads successfully (200 OK)
✅ Thread validation: Passes ownership check
✅ Thread routing: Navigates to `/workspace/[threadId]` correctly

**Note**: Thread display and messaging functionality still TODO (separate issue)

## Remaining Work

### Thread Content Loading
**Status**: ⏳ TODO

The WorkspaceContainer component needs to:
1. Load thread data when threadId is in URL
2. Fetch messages for the thread
3. Display messages in chronological order
4. Show thread metadata (title, created date, etc.)

**Related Code**:
- `apps/web/src/components/ai-agent/WorkspaceContainer.tsx`
- Need to use `router.query.docId` to get threadId
- Need to create `useLoadThread` hook
- Need to call `aiAgentActions.setCurrentThread(thread)`

### Message Sending
**Status**: ⏳ TODO

See line 136 in WorkspaceContainer.tsx:
```typescript
const handleSendMessage = useCallback(async (content: string) => {
  // TODO: Implement send message with backend
  console.log('Send message:', content);
  setMessageText('');
}, []);
```

Needs:
1. `POST /functions/v1/send-message` endpoint
2. Message storage in `messages` table
3. AI agent invocation
4. Real-time response streaming
5. Message display in UI

## Verification Steps

To verify the fix works:

1. Navigate to `/workspace`
2. Click "+ New Thread"
3. Enter thread title, click "Create Branch"
4. **Expected**: Page navigates to `/workspace/[threadId]` and loads successfully
5. **Expected**: Thread appears in sidebar
6. Click on thread in sidebar
7. **Expected**: Thread opens (currently shows empty state, but no 404)

## Summary

**Root Cause**: Schema mismatch in two critical places
1. `validateThreadOwnership` using wrong column names
2. `/workspace/[docId]` checking wrong table (`conversations` instead of `threads`)

**Fix**: Updated both functions to use correct table and column names matching the database schema

**Result**: Threads now navigate correctly and pass validation. Content loading is next step.
