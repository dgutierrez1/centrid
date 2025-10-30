# Backend Refactor Plan - RESTful Architecture

**Date**: 2025-10-29  
**Estimated Time**: ~3h  
**Status**: Ready to Execute

---

## 🔍 ISSUES IDENTIFIED

### ❌ **Issue 1: Non-RESTful Message Routes**

**Current**:
```typescript
POST /api/messages?threadId=xxx  // Query parameter for resource ID
GET  /api/messages?threadId=xxx
```

**Problem**: 
- Resource IDs should be in path, not query params
- Messages are sub-resources of threads

**Target**:
```typescript
POST /api/threads/:threadId/messages
GET  /api/threads/:threadId/messages
```

---

### ❌ **Issue 2: Non-RESTful Agent Routes**

**Current**:
```typescript
GET  /api/agent/stream?requestId=xxx&threadId=xxx&messageId=xxx
POST /api/agent/approve-tool
```

**Problems**:
- Stream route uses query params instead of path hierarchy
- `approve-tool` is action-based (verb in URL)
- Stream should be a sub-resource of messages

**Target**:
```typescript
GET   /api/threads/:threadId/messages/:messageId/stream
PATCH /api/tool-calls/:toolCallId
```

---

### ✅ **Working Correctly**

**Threads** - Fully RESTful:
```typescript
GET    /api/threads              // List all threads
POST   /api/threads              // Create thread
GET    /api/threads/:id          // Get single thread
PUT    /api/threads/:id          // Update thread
DELETE /api/threads/:id          // Delete thread
GET    /api/threads/:id/children // Get child branches
```

**Files** - Fully RESTful:
```typescript
POST   /api/files      // Create file
GET    /api/files/:id  // Get file
PUT    /api/files/:id  // Update file
DELETE /api/files/:id  // Delete file
```

---

### ⚠️ **Stubs Need Implementation**

**Search**:
```typescript
POST /api/search  // SearchService not implemented
```

**Account Management**:
```typescript
POST   /api/auth/account   // AccountService not implemented
PUT    /api/auth/profile
DELETE /api/auth/account
```

---

## 📋 PHASE 1: Make Routes RESTful (~2.5h)

### **Task 1.1: Refactor Message Routes** (~45min)

**Current State**:
- `apps/api/src/functions/api/routes/messages.ts` - Uses query params
- Routes: `POST /` and `GET /` with `threadId` query param

**Changes Needed**:

1. **Move routes to nested structure**:
   - Integrate into `threads.ts` OR
   - Create nested router pattern

2. **Update route handlers**:

```typescript
// In apps/api/src/functions/api/routes/threads.ts

// Create message in thread
app.post('/:threadId/messages', async (c) => {
  const threadId = c.req.param('threadId');  // ✅ From path
  const userId = c.get('userId');
  
  // Validate UUID
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(threadId)) {
    return c.json({ error: 'Invalid thread ID format' }, 400);
  }

  let body;
  try {
    body = await c.req.json();
  } catch (error) {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  // Validate input
  const createMessageSchema = z.object({
    content: z.string().min(1).max(10000),
    contextReferences: z.array(z.any()).optional(),
  });

  const parsed = createMessageSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({
      error: 'Validation failed',
      details: parsed.error.format(),
    }, 400);
  }

  try {
    const message = await MessageService.createMessage({
      threadId,
      userId,
      content: parsed.data.content,
      role: 'user',
      contextReferences: parsed.data.contextReferences || [],
    });

    return c.json({ data: message }, 201);
  } catch (error) {
    console.error('Failed to create message:', error);
    
    if (error instanceof Error && error.message.includes('Thread not found')) {
      return c.json({ error: 'Thread not found or access denied' }, 404);
    }
    
    return c.json({ error: 'Failed to create message' }, 500);
  }
});

// List messages in thread
app.get('/:threadId/messages', async (c) => {
  const threadId = c.req.param('threadId');  // ✅ From path
  const userId = c.get('userId');
  
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(threadId)) {
    return c.json({ error: 'Invalid thread ID format' }, 400);
  }

  try {
    // Verify thread exists and user owns it
    const thread = await threadRepository.findById(threadId);
    
    if (!thread) {
      return c.json({ error: 'Thread not found' }, 404);
    }

    if (thread.ownerUserId !== userId) {
      return c.json({ error: 'Access denied' }, 403);
    }

    const messages = await messageRepository.findByThreadId(threadId);

    return c.json({
      data: messages,
      meta: {
        count: messages.length,
        threadId,
      },
    });
  } catch (error) {
    console.error('Failed to list messages:', error);
    return c.json({ error: 'Failed to fetch messages' }, 500);
  }
});
```

3. **Update `index.ts` route mounting** (if keeping separate file):
```typescript
// Remove old message routes mounting
// app.route('/api/messages', messageRoutes);

// Messages now nested under threads
```

**Files to Modify**:
- ✏️ `apps/api/src/functions/api/routes/threads.ts` (add nested routes)
- 🗑️ `apps/api/src/functions/api/routes/messages.ts` (delete or repurpose)
- ✏️ `apps/api/src/functions/api/index.ts` (update mounting)

---

### **Task 1.2: Refactor Agent/Stream Routes** (~1h)

**Current State**:
- `apps/api/src/functions/api/routes/agent.ts` - Two routes with issues

**Changes Needed**:

1. **Move stream to nested message route**:

```typescript
// In apps/api/src/functions/api/routes/threads.ts

// Stream agent execution for a message
app.get('/:threadId/messages/:messageId/stream', async (c) => {
  const threadId = c.req.param('threadId');
  const messageId = c.req.param('messageId');
  const userId = c.get('userId');

  // Validate UUIDs
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(threadId) || !uuidRegex.test(messageId)) {
    return c.json({ error: 'Invalid UUID format' }, 400);
  }

  try {
    // Return SSE stream
    return streamSSE(c, async (stream) => {
      try {
        console.log('Starting agent stream:', { threadId, messageId, userId });

        // Execute agent and stream responses (static method)
        const generator = AgentExecutionService.executeStream(userId, threadId, messageId);
        
        for await (const chunk of generator) {
          await stream.writeSSE({
            data: JSON.stringify(chunk),
            event: chunk.type || 'message',
            id: String(Date.now()),
          });
        }

        await stream.writeSSE({
          data: JSON.stringify({ status: 'complete' }),
          event: 'done',
        });

        console.log('Agent stream completed');

      } catch (error) {
        console.error('Agent stream error:', error);
        
        await stream.writeSSE({
          data: JSON.stringify({
            error: error instanceof Error ? error.message : 'Stream failed',
          }),
          event: 'error',
        });
      }
    });

  } catch (error) {
    console.error('Failed to start agent stream:', error);
    return c.json({
      error: 'Failed to start agent stream',
      details: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});
```

2. **Create tool-calls resource**:

```typescript
// Create new file: apps/api/src/functions/api/routes/tool-calls.ts

import { Hono } from 'hono';
import { z } from 'zod';
import { AgentExecutionService } from '../../../services/agentExecution.ts';
import type { AppContext } from '../types.ts';

const app = new Hono<{ Variables: AppContext }>();

const approvalSchema = z.object({
  approved: z.boolean(),
  reason: z.string().optional(),
});

/**
 * PATCH /api/tool-calls/:toolCallId
 * Approve or reject a tool call
 */
app.patch('/:toolCallId', async (c) => {
  const toolCallId = c.req.param('toolCallId');
  const userId = c.get('userId');

  // Validate UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(toolCallId)) {
    return c.json({ error: 'Invalid tool call ID format' }, 400);
  }

  let body;
  try {
    body = await c.req.json();
  } catch (error) {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  // Validate input
  const parsed = approvalSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({
      error: 'Validation failed',
      details: parsed.error.format(),
    }, 400);
  }

  try {
    await AgentExecutionService.approveTool(
      userId,
      toolCallId,
      parsed.data.approved,
      parsed.data.reason
    );

    return c.json({
      data: {
        success: true,
        toolCallId,
        approved: parsed.data.approved,
      },
    });

  } catch (error) {
    console.error('Failed to approve tool call:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return c.json({
        error: 'Tool call not found or access denied',
      }, 404);
    }
    
    return c.json({
      error: 'Failed to process tool approval',
      details: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});

export { app as toolCallRoutes };
```

3. **Update `index.ts` route mounting**:
```typescript
import { toolCallRoutes } from './routes/tool-calls.ts';

// Remove old agent routes
// app.route('/api/agent', agentRoutes);

// Add new tool-calls resource
app.route('/api/tool-calls', toolCallRoutes);

// Stream route is now nested under threads/:id/messages/:id/stream
```

**Files to Modify**:
- ✏️ `apps/api/src/functions/api/routes/threads.ts` (add stream route)
- ➕ `apps/api/src/functions/api/routes/tool-calls.ts` (create new)
- 🗑️ `apps/api/src/functions/api/routes/agent.ts` (delete)
- ✏️ `apps/api/src/functions/api/index.ts` (update mounting)

---

### **Task 1.3: Implement Stub Services** (~45min)

**Current State**:
- `routes/search.ts` - Stub (returns placeholder)
- `routes/auth.ts` - Stubs (return placeholders)

**Changes Needed**:

1. **Create SearchService**:

```typescript
// Create: apps/api/src/services/searchService.ts

/**
 * Search Service
 * Handles semantic search across user's files and context
 * ✅ STATELESS - All methods are static utility functions
 */
export class SearchService {
  /**
   * Semantic search across files
   */
  static async search(
    userId: string,
    query: string,
    options?: {
      limit?: number;
      fileTypes?: string[];
    }
  ): Promise<any[]> {
    // TODO: Implement vector search using shadow_domain table
    // For now, basic text search
    const files = await fileRepository.findByUserId(userId);
    
    const results = files
      .filter(f => 
        f.path.toLowerCase().includes(query.toLowerCase()) ||
        f.content.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, options?.limit || 10)
      .map(f => ({
        id: f.id,
        path: f.path,
        excerpt: f.content.substring(0, 200),
        relevance: 0.5, // TODO: Calculate actual relevance
      }));
    
    return results;
  }
}
```

2. **Create AccountService**:

```typescript
// Create: apps/api/src/services/accountService.ts

/**
 * Account Service
 * Handles account management operations
 * ✅ STATELESS - All methods are static utility functions
 */
export class AccountService {
  /**
   * Create user account
   */
  static async createAccount(email: string, password: string): Promise<any> {
    // TODO: Implement account creation
    // May need to call Supabase Auth API
    throw new Error('Account creation not yet implemented');
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string,
    updates: {
      displayName?: string;
      email?: string;
    }
  ): Promise<any> {
    // TODO: Implement profile updates
    throw new Error('Profile update not yet implemented');
  }

  /**
   * Delete user account
   */
  static async deleteAccount(userId: string): Promise<void> {
    // TODO: Implement account deletion
    // Must cascade delete all user data
    throw new Error('Account deletion not yet implemented');
  }
}
```

3. **Update route handlers** to use services instead of returning stubs.

**Files to Create**:
- ➕ `apps/api/src/services/searchService.ts`
- ➕ `apps/api/src/services/accountService.ts`

**Files to Modify**:
- ✏️ `apps/api/src/functions/api/routes/search.ts`
- ✏️ `apps/api/src/functions/api/routes/auth.ts`

---

## 📋 PHASE 2: Test & Document (~30min)

### **Task 2.1: Update Documentation**

**Files to Update**:
- ✏️ `apps/api/RESUME_BACKEND_REFACTOR.md` - Add RESTful changes
- ➕ `apps/api/API_DOCUMENTATION.md` - Create endpoint reference

**API Documentation Structure**:
```markdown
## Threads
- GET    /api/threads
- POST   /api/threads
- GET    /api/threads/:id
- PUT    /api/threads/:id
- DELETE /api/threads/:id
- GET    /api/threads/:id/children

## Messages (nested under threads)
- POST /api/threads/:threadId/messages
- GET  /api/threads/:threadId/messages
- GET  /api/threads/:threadId/messages/:messageId/stream

## Files
- POST   /api/files
- GET    /api/files/:id
- PUT    /api/files/:id
- DELETE /api/files/:id

## Tool Calls
- PATCH /api/tool-calls/:toolCallId

## Search
- POST /api/search

## Auth
- POST   /api/auth/account
- PUT    /api/auth/profile
- DELETE /api/auth/account
```

---

### **Task 2.2: Local Testing**

**Test Script**:
```bash
# Start local Supabase
cd apps/api
supabase start

# Serve API function
supabase functions serve api --env-file .env.local

# In another terminal, test endpoints
export TOKEN="your-jwt-token"

# Test new message endpoint
curl -X POST http://localhost:54321/functions/v1/api/threads/THREAD_ID/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello"}'

# Test new tool-call endpoint
curl -X PATCH http://localhost:54321/functions/v1/api/tool-calls/TOOL_CALL_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"approved": true}'

# Test stream endpoint
curl -N http://localhost:54321/functions/v1/api/threads/THREAD_ID/messages/MESSAGE_ID/stream \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: text/event-stream"
```

---

## 🎯 SUCCESS CRITERIA

- [ ] All routes follow RESTful hierarchy (resources in path)
- [ ] No query parameters for resource IDs
- [ ] No action verbs in URLs
- [ ] Messages nested under threads
- [ ] Stream nested under messages
- [ ] Tool calls as proper resource
- [ ] SearchService created (basic implementation)
- [ ] AccountService created (stubs with TODOs)
- [ ] Zero TypeScript errors
- [ ] Local tests pass
- [ ] API documentation complete

---

## 📊 SUMMARY

**Time Estimate**: ~3h
- Task 1.1: 45min
- Task 1.2: 1h
- Task 1.3: 45min
- Task 2.1: 15min
- Task 2.2: 15min

**Breaking Changes**: Yes
- Message endpoints change
- Stream endpoint changes
- Tool approval endpoint changes
- Frontend must be updated after completion

---

**Ready to execute Phase 1?**
