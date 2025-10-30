# Frontend Migration Plan - API Integration

**Date**: 2025-10-29  
**Estimated Time**: ~5-7h  
**Status**: Ready to Execute

---

## 🔍 ISSUES IDENTIFIED

### ❌ **CRITICAL: Bypassing API Layer**

**Problem**: Many hooks call Supabase directly, bypassing the entire backend API.

**Why This Is Bad**:
- ❌ No authentication middleware (relies only on RLS policies)
- ❌ No business logic validation
- ❌ No centralized error handling
- ❌ No request logging/monitoring
- ❌ Can't add caching or rate limiting
- ❌ Can't swap backend implementation
- ❌ Brittle security model

**Hooks With This Issue**:
```typescript
// ❌ apps/web/src/lib/hooks/useLoadThread.ts
await supabase.from('threads').select('*')
await supabase.from('messages').select('*')
await supabase.from('context_references').select('*')

// ❌ apps/web/src/lib/hooks/useLoadThreads.ts
await supabase.from('threads').select('*').eq('owner_user_id', userId)

// ❌ apps/web/src/lib/hooks/useCreateBranch.ts
await supabase.from('threads').insert({...})

// ❌ apps/web/src/lib/hooks/useDeleteThread.ts
await supabase.from('threads').delete().eq('id', threadId)

// ❌ apps/web/src/lib/hooks/useUpdateThread.ts
await supabase.from('threads').update({...}).eq('id', threadId)
```

---

### ❌ **Issue 2: Mixed Endpoints**

Some hooks call new `/api/*` endpoints, others call old scattered functions:

```typescript
// ✅ Updated - calls new API
useSendMessage: /functions/v1/api/messages

// ✅ Updated - calls new API
useLoadFile: /functions/v1/api/files/${id}

// ✅ Updated - calls new API  
useApproveToolCall: /functions/v1/api/agent/approve-tool

// ❌ NOT Updated - calls old endpoint
useUpdateFile: /functions/v1/files/${fileId}
```

---

### ⚠️ **Issue 3: Non-RESTful Patterns**

After backend refactor completes, these will need updating:

```typescript
// ❌ CURRENT (query param)
POST /api/messages?threadId=xxx

// ✅ FUTURE (nested resource)
POST /api/threads/:threadId/messages
```

---

## 📋 PHASE 1: Stop Bypassing API (~3-4h)

**Priority**: CRITICAL - This fixes architectural violation

### **Task 1.1: Refactor useLoadThread** (~45min)

**Current State**:
```typescript
// ❌ Direct database access
const { data: thread } = await supabase
  .from('threads')
  .select('*')
  .eq('id', threadId)
  .single();

const { data: messages } = await supabase
  .from('messages')
  .select('*')
  .eq('thread_id', threadId);

const { data: contextRefs } = await supabase
  .from('context_references')
  .select('*')
  .eq('thread_id', threadId);
```

**Target Implementation**:
```typescript
// ✅ API call
const loadThread = async (threadId: string) => {
  setIsLoading(true);
  setError(null);
  aiAgentActions.setIsLoadingThread(true);

  try {
    // Get auth token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    // Fetch thread with messages and context from API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/api/threads/${threadId}`,
      {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        // Thread doesn't exist - show empty state
        aiAgentActions.setCurrentThread(null);
        aiAgentActions.setMessages([]);
        aiAgentActions.setContextReferences([]);
        return;
      }
      throw new Error('Failed to load thread');
    }

    const { data } = await response.json();
    
    // Backend returns: { ...thread, messages: [...], messageCount: N }
    // Transform and update state
    const transformedThread = {
      id: data.id,
      ownerUserId: data.ownerUserId,
      parentThreadId: data.parentThreadId,
      branchTitle: data.branchTitle || 'Untitled Thread',
      creator: data.creator,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      depth: 0,
      artifactCount: 0,
      lastActivity: new Date(data.updatedAt || data.createdAt),
    };

    const transformedMessages = data.messages.map((msg: any) => ({
      id: msg.id,
      threadId: msg.threadId,
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      toolCalls: msg.toolCalls || [],
      tokensUsed: msg.tokensUsed || 0,
    }));

    // Load context references separately (if backend doesn't include them)
    // Or ask backend to include contextReferences in thread response

    aiAgentActions.setCurrentThread(transformedThread);
    aiAgentActions.setMessages(transformedMessages);
    // aiAgentActions.setContextReferences(transformedRefs);
    
  } catch (err: any) {
    console.error('Error loading thread:', err);
    aiAgentActions.setCurrentThread(null);
    aiAgentActions.setMessages([]);
    aiAgentActions.setContextReferences([]);
    setError(err.message || 'Failed to load thread');
  } finally {
    setIsLoading(false);
    aiAgentActions.setIsLoadingThread(false);
  }
};
```

**Files to Modify**:
- ✏️ `apps/web/src/lib/hooks/useLoadThread.ts`

---

### **Task 1.2: Refactor useLoadThreads** (~30min)

**Current State**:
```typescript
// ❌ Direct database access
const { data: threads } = await supabase
  .from('threads')
  .select('*')
  .eq('owner_user_id', userId)
  .order('updated_at', { ascending: false });
```

**Target Implementation**:
```typescript
// ✅ API call
const loadThreads = async () => {
  setIsLoading(true);
  setError(null);

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/api/threads`,
      {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to load threads');
    }

    const { data: threads } = await response.json();

    const transformedThreads = threads.map((thread: any) => ({
      id: thread.id,
      ownerUserId: thread.ownerUserId,
      parentThreadId: thread.parentThreadId,
      branchTitle: thread.branchTitle || 'Untitled Thread',
      creator: thread.creator,
      createdAt: new Date(thread.createdAt),
      updatedAt: new Date(thread.updatedAt),
      depth: 0,
      artifactCount: 0,
      lastActivity: new Date(thread.updatedAt || thread.createdAt),
    }));

    aiAgentActions.setBranchTree(transformedThreads);
    
  } catch (err: any) {
    setError(err.message || 'Failed to load threads');
    console.error('Error loading threads:', err);
    aiAgentActions.setBranchTree([]);
  } finally {
    setIsLoading(false);
  }
};
```

**Files to Modify**:
- ✏️ `apps/web/src/lib/hooks/useLoadThreads.ts`

---

### **Task 1.3: Refactor useCreateBranch** (~30min)

**Current State**:
```typescript
// ❌ Direct database access
const { data: newThread, error } = await supabase
  .from('threads')
  .insert({
    owner_user_id: session.user.id,
    parent_thread_id: parentId,
    branch_title: title,
    creator: 'user',
  })
  .select()
  .single();
```

**Target Implementation**:
```typescript
// ✅ API call
const createBranch = async (parentId: string | null, title: string) => {
  setIsLoading(true);
  aiAgentActions.setIsCreatingBranch(true);

  try {
    // Optimistic update
    const tempThread = {
      id: `temp-${Date.now()}`,
      title,
      parentId: parentId || undefined,
      depth: 0,
      artifactCount: 0,
      lastActivity: new Date(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    aiAgentActions.addThreadToBranchTree(tempThread);

    // Get auth token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    // Create thread via API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/api/threads`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          parentId,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to create thread');
    }

    const { data: newThread } = await response.json();

    // Replace temp with real thread
    aiAgentActions.removeThreadFromBranchTree(tempThread.id);
    aiAgentActions.addThreadToBranchTree({
      id: newThread.id,
      title: newThread.branchTitle,
      parentId: newThread.parentThreadId,
      depth: 0,
      artifactCount: 0,
      lastActivity: new Date(newThread.createdAt),
      createdAt: newThread.createdAt,
      updatedAt: newThread.updatedAt,
    });

    toast.success(`Branch "${title}" created`);
    router.push(`/workspace/${newThread.id}`);
    
  } catch (error: any) {
    toast.error(error.message || 'Failed to create branch');
    aiAgentActions.removeThreadFromBranchTree(tempThread.id);
  } finally {
    setIsLoading(false);
    aiAgentActions.setIsCreatingBranch(false);
  }
};
```

**Files to Modify**:
- ✏️ `apps/web/src/lib/hooks/useCreateBranch.ts`

---

### **Task 1.4: Refactor useDeleteThread** (~20min)

**Current State**:
```typescript
// ❌ Direct database access
const { error } = await supabase
  .from('threads')
  .delete()
  .eq('id', threadId);
```

**Target Implementation**:
```typescript
// ✅ API call
const deleteThread = async (threadId: string) => {
  setIsLoading(true);

  try {
    const thread = aiAgentState.branchTree.threads.find(t => t.id === threadId);
    const parentId = thread?.parentId;

    // Optimistic removal
    aiAgentActions.removeThreadFromBranchTree(threadId);

    // Get auth token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    // Delete via API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/api/threads/${threadId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete thread');
    }

    toast.success('Branch deleted');

    // Navigate to parent or home
    if (parentId) {
      router.push(`/workspace/${parentId}`);
    } else {
      router.push('/');
    }
    
  } catch (error: any) {
    toast.error(error.message || 'Failed to delete branch');
    // TODO: Rollback optimistic update
  } finally {
    setIsLoading(false);
  }
};
```

**Files to Modify**:
- ✏️ `apps/web/src/lib/hooks/useDeleteThread.ts`

---

### **Task 1.5: Refactor useUpdateThread** (~20min)

**Current State**:
```typescript
// ❌ Direct database access
const { error } = await supabase
  .from('threads')
  .update({ branch_title: updates.title })
  .eq('id', threadId);
```

**Target Implementation**:
```typescript
// ✅ API call
const updateThread = async (threadId: string, updates: { title: string }) => {
  setIsLoading(true);

  try {
    // Optimistic update
    const oldThread = aiAgentState.currentThread;
    if (oldThread) {
      aiAgentActions.setCurrentThread({ ...oldThread, title: updates.title });
    }

    // Get auth token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    // Update via API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/api/threads/${threadId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: updates.title }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update thread');
    }

    toast.success('Branch title updated');
    
  } catch (error: any) {
    // Rollback on error
    if (oldThread) {
      aiAgentActions.setCurrentThread(oldThread);
    }
    toast.error(error.message || 'Failed to update branch');
  } finally {
    setIsLoading(false);
  }
};
```

**Files to Modify**:
- ✏️ `apps/web/src/lib/hooks/useUpdateThread.ts`

---

## 📋 PHASE 2: Update to RESTful Endpoints (~1-2h)

**Note**: This phase depends on backend Phase 1 completion.

### **Task 2.1: Update useSendMessage** (~20min)

**Current**:
```typescript
POST /functions/v1/api/messages?threadId=${threadId}
```

**Target** (after backend refactor):
```typescript
POST /functions/v1/api/threads/${threadId}/messages
```

**Changes**:
```typescript
// Change URL from query param to path param
const response = await fetch(
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/api/threads/${threadId}/messages`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: text,  // Not "text"
      contextReferences: snap.contextReferences,
    }),
  }
);

// Backend will return new stream URL in response
const { data: message } = await response.json();
const streamUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/api/threads/${threadId}/messages/${message.id}/stream`;
```

**Files to Modify**:
- ✏️ `apps/web/src/lib/hooks/useSendMessage.ts`

---

### **Task 2.2: Update useApproveToolCall** (~15min)

**Current**:
```typescript
POST /functions/v1/api/agent/approve-tool
```

**Target** (after backend refactor):
```typescript
PATCH /functions/v1/api/tool-calls/${toolCallId}
```

**Changes**:
```typescript
// Change URL and method
const response = await fetch(
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/api/tool-calls/${toolCallId}`,
  {
    method: 'PATCH',  // Changed from POST
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      approved,
      reason,
      // Remove requestId - not needed
    }),
  }
);
```

**Files to Modify**:
- ✏️ `apps/web/src/lib/hooks/useApproveToolCall.ts`

---

### **Task 2.3: Fix useUpdateFile** (~10min)

**Current**:
```typescript
PUT /functions/v1/files/${fileId}  // Missing /api
```

**Target**:
```typescript
PUT /functions/v1/api/files/${fileId}
```

**Changes**:
```typescript
// Just add /api to path
const response = await fetch(
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/api/files/${fileId}`,
  {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  }
);
```

**Files to Modify**:
- ✏️ `apps/web/src/lib/hooks/useUpdateFile.ts`

---

## 📋 PHASE 3: Audit Remaining (~1h)

### **Task 3.1: Audit Other Hooks** (~30min)

**Hooks to Check**:
- [ ] `useDeleteFile.ts` - Verify uses `/api/files/${id}` endpoint
- [ ] `useCreateAgentFile.ts` - Verify uses API (not direct Supabase)
- [ ] `useConsolidation.ts` - Check if needs API integration
- [ ] `useAutocomplete.ts` - Check if needs API integration
- [ ] `useAddToExplicit.ts` - Check if needs API integration
- [ ] `useHideBranch.ts` - Check if needs API integration
- [ ] `useFilesystemOperations.ts` - Check patterns

**For Each Hook**:
1. Read the file
2. Search for `supabase.from(` calls
3. Search for `/functions/v1/` calls
4. If bypassing API → Refactor to call API
5. If calling old endpoint → Update to `/api/*`

---

### **Task 3.2: Audit Services** (~30min)

**Services to Check**:
- [ ] `apps/web/src/lib/services/filesystem.service.ts` - Uses `/documents` endpoint
- [ ] `apps/web/src/lib/services/agent-file.service.ts` - Check patterns
- [ ] `apps/web/src/lib/services/thread.service.ts` - Check patterns
- [ ] `apps/web/src/lib/services/consolidation.service.ts` - Check patterns

**Document Findings** in audit report.

---

## 🎯 SUCCESS CRITERIA

### Phase 1
- [ ] Zero direct Supabase CRUD operations (only auth.getSession allowed)
- [ ] All thread operations call API endpoints
- [ ] Proper error handling with rollback
- [ ] Optimistic updates work correctly

### Phase 2
- [ ] All endpoints use RESTful paths (no query params for resource IDs)
- [ ] All endpoints use `/api/*` prefix
- [ ] HTTP methods match REST semantics (GET/POST/PUT/PATCH/DELETE)

### Phase 3
- [ ] All hooks audited and documented
- [ ] All services audited and documented
- [ ] No remaining old endpoint calls

---

## 📊 SUMMARY

**Time Estimate**: ~5-7h
- Phase 1: 3-4h (Critical - stop bypassing API)
- Phase 2: 1-2h (Update to RESTful endpoints)
- Phase 3: 1h (Audit remaining)

**Dependencies**:
- Phase 1: Can start immediately (independent of backend)
- Phase 2: Requires backend Phase 1 completion
- Phase 3: Can happen anytime

**Breaking Changes**: 
- Users may need to refresh after deployment
- Real-time subscriptions may need adjustment

---

**Ready to execute Phase 1?**
