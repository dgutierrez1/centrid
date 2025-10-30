# Backend Flow Analysis - User Message to AI Response

**Date**: 2025-10-30  
**Status**: Flow documented with gaps identified

---

## 📊 Current Implementation Flow

### **Flow 1: User Sends Message**

```
1. User → POST /api/threads/:threadId/messages
   ↓
2. Route Handler (threads.ts)
   ↓
3. MessageService.createMessage()
   - Verify thread exists + access
   - Create message in DB (role: 'user')
   - Generate requestId (UUID)
   - Start AI processing in background (fire-and-forget)
   - Return message resource with stream URL
   ↓
4. Client receives response:
   {
     id: "message-id",
     _links: {
       stream: { href: "/api/threads/:threadId/messages/:messageId/stream" }
     },
     _embedded: {
       requestId: "uuid",
       processingStatus: "started"
     }
   }
```

**Artifacts Created**:
- ✅ Message record in `messages` table
- ✅ RequestId generated (but **NOT** persisted anywhere)
- ⚠️ AI processing started (fire-and-forget, no tracking)

---

### **Flow 2: Client Connects to Stream**

```
1. Client → GET /api/threads/:threadId/messages/:messageId/stream
   ↓
2. Route Handler (threads.ts)
   ↓
3. AgentExecutionService.executeStream(userId, threadId, messageId)
   - Fetch message from DB
   - Build prime context (basic, TODO)
   - Delegate to executeWithStreaming()
   ↓
4. AgentExecutionService.executeWithStreaming()
   LOOP:
     a. Call AI model (currently simulated)
     b. Yield text chunks → Client
     c. AI proposes tool call
     d. Create tool call record in DB
     e. Yield tool_call event → Client
     f. **PAUSE** - Wait for approval
     g. If approved → Execute tool → Yield result
     h. If rejected → Add rejection context → Loop again (max 3 revisions)
     i. Yield completion event
   ↓
5. Stream closes
```

**Artifacts Created**:
- ✅ Tool call records in `agent_tool_calls` table (for each tool proposed)
- ✅ Tool execution results (files created, branches created, etc)
- ⚠️ Assistant message? (NOT created during stream)

---

### **Flow 3: User Approves/Rejects Tool**

```
1. User → PATCH /api/tool-calls/:toolCallId
   Body: { approved: true/false, reason?: "..." }
   ↓
2. Route Handler (tool-calls.ts)
   ↓
3. AgentExecutionService.approveTool(userId, toolCallId, approved, reason)
   - Fetch tool call from DB
   - Verify user owns it (via ownerUserId)
   - If approved:
       → Update status to 'approved'
   - If rejected:
       → Update status to 'rejected'
       → Increment revision count
       → Store rejection reason
   ↓
4. Return success
```

**How Waiting Works**:
```typescript
// In AgentExecutionService.pauseForApproval():
ToolCallService.waitForApproval(toolCallId, timeout = 600000)
  ↓
// In ToolCallService:
- Poll database every 1 second
- Check if tool call status changed from 'pending'
- If 'approved' → return { approved: true }
- If 'rejected' → return { approved: false, reason }
- If timeout → return { approved: false, reason: 'timeout' }
```

---

## 🚨 CRITICAL GAPS IDENTIFIED

### **Gap 1: No agent_requests Table Used** ❌

**Issue**: The spec defines `agent_requests` table to track AI execution, but it's **NEVER USED**.

**What Should Happen** (per spec):
```sql
CREATE TABLE agent_requests (
  id uuid PRIMARY KEY,
  user_id uuid,
  agent_type text, -- 'create', 'edit', 'research'
  content text,
  status text, -- 'pending', 'in_progress', 'completed', 'failed'
  progress real, -- 0.0 to 1.0
  results jsonb,
  token_cost integer,
  created_at timestamp,
  updated_at timestamp
);
```

**What Actually Happens**:
- ❌ No agent request record created
- ❌ No status tracking (pending → in_progress → completed)
- ❌ No progress tracking (0.1 → 0.5 → 1.0)
- ❌ No results stored
- ❌ No token cost tracking

**Impact**:
- Cannot track agent execution history
- Cannot show progress to user
- Cannot resume failed requests
- Cannot audit/debug agent behavior
- Cannot track costs

**Should We Need It?**: **YES** - It's essential for:
1. Tracking execution state
2. Storing final results
3. Progress updates
4. Cost accounting
5. Error recovery

---

### **Gap 2: requestId Not Persisted** ⚠️

**Issue**: `MessageService.createMessage()` generates a `requestId` but **doesn't save it anywhere**.

**Current**:
```typescript
const requestId = crypto.randomUUID(); // Generated
return {
  _embedded: {
    requestId: requestId, // Returned to client
    processingStatus: 'started'
  }
};
// But requestId is NOT saved to database!
```

**Impact**:
- Client gets requestId but backend doesn't know it
- Cannot query agent execution status by requestId
- Cannot resume or cancel requests
- requestId is meaningless

**Fix**: Store requestId in `agent_requests` table (or add to `messages` table)

---

### **Gap 3: Tool Approval Targeting is Ambiguous** ⚠️

**Current Approach**: User targets tool by `toolCallId`
```
PATCH /api/tool-calls/:toolCallId
{ approved: true }
```

**Questions**:
1. **How does user know the toolCallId?**
   - Answer: Agent sends it in SSE stream
   ```javascript
   yield {
     type: 'tool_call',
     toolCallId: "uuid-here",
     toolName: "write_file",
     toolInput: { ... }
   }
   ```

2. **What if multiple tools pending?**
   - Current: User must approve each individually
   - Gap: No batch approval API
   - Gap: No "approve all" option

3. **What if user disconnects during approval?**
   - Gap: Stream times out after 10min
   - Gap: Pending tools left orphaned
   - Gap: No way to resume approval later

4. **Can user see pending approvals?**
   - Current: **NO** - No API to list pending tool calls
   - Gap: No `GET /api/threads/:id/pending-tools` endpoint

---

### **Gap 4: Agent Response Message Not Created** ❌

**Issue**: After agent completes, **no assistant message is saved to DB**.

**Current Flow**:
```
User message created ✅
  ↓
Agent streams response ✅
  ↓
Tool calls executed ✅
  ↓
Stream closes
  ↓
Assistant message saved? ❌ NO!
```

**Impact**:
- Thread history incomplete
- Cannot display conversation history
- Cannot use past responses as context
- Breaks multi-turn conversations

**Fix**: After stream completes, save assistant message with:
- Full response text
- Tool calls executed
- Tokens used

---

### **Gap 5: No Revision History Tracking** ⚠️

**Current**: Revision count stored in `agent_tool_calls.revision_count`

**Gap**: Only count stored, not history:
- ❌ Cannot see what previous attempts were
- ❌ Cannot see why each attempt was rejected
- ❌ Cannot replay revision sequence
- ❌ Cannot learn from rejected patterns

**Should Track**:
```json
{
  "revision_history": [
    {
      "attempt": 1,
      "tool_input": { "path": "wrong.md", "content": "..." },
      "rejected_at": "2025-10-30T10:00:00Z",
      "rejection_reason": "Wrong filename"
    },
    {
      "attempt": 2,
      "tool_input": { "path": "correct.md", "content": "..." },
      "approved_at": "2025-10-30T10:02:00Z"
    }
  ]
}
```

---

### **Gap 6: Polling for Approval is Inefficient** ⚠️

**Current Approach** (ToolCallService.waitForApproval):
```typescript
// Poll every 1 second for 10 minutes
for (let i = 0; i < maxAttempts; i++) {
  const toolCall = await repository.findById(toolCallId);
  if (toolCall.approvalStatus !== 'pending') {
    return { approved: toolCall.approvalStatus === 'approved' };
  }
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s
}
```

**Problems**:
- 🔥 600 database queries per approval (1 per second for 10 minutes)
- 🔥 Wastes database connections
- 🔥 Delays response (up to 1 second latency)

**Better Approach**: Use database triggers + real-time subscriptions
```typescript
// Listen for approval via Supabase Realtime
const subscription = supabase
  .channel(`tool-call-${toolCallId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'agent_tool_calls',
    filter: `id=eq.${toolCallId}`
  }, (payload) => {
    if (payload.new.approval_status !== 'pending') {
      resolve({ approved: payload.new.approval_status === 'approved' });
    }
  })
  .subscribe();
```

---

### **Gap 7: No Way to List Pending Approvals** ❌

**Missing API**:
```
GET /api/threads/:threadId/pending-tools
GET /api/tool-calls?status=pending&userId=xxx
```

**Use Case**: User closes browser, comes back later, needs to see pending tools

**Current**: User must reconnect to stream (but stream already timed out)

---

### **Gap 8: Multi-Turn Context Not Fully Implemented** ⚠️

**Current Context Assembly**:
```typescript
const primeContext: PrimeContext = {
  totalTokens: 0,
  explicitFiles: [], // Empty
  threadContext: [], // Empty
};
// TODO: enhance with ContextAssemblyService
```

**Gap**: Context is minimal - doesn't include:
- ❌ Previous messages in thread
- ❌ Explicit files from context references
- ❌ Semantic matches (shadow domain)
- ❌ Parent thread context
- ❌ Thread tree relationships

---

## 📊 Summary: What Works vs What's Missing

### ✅ **What Works**

1. **Message Creation**: Messages stored in DB
2. **SSE Streaming**: Real-time updates to client
3. **Tool Call Creation**: Tool calls stored in DB
4. **Tool Execution**: All 5 tools implemented
5. **Approval/Rejection**: Status updates in DB
6. **Revision Tracking**: Count increments on rejection

### ❌ **What's Missing**

1. **agent_requests table**: Not used (but needed for tracking)
2. **requestId persistence**: Generated but not stored
3. **Assistant messages**: Not saved after stream completes
4. **Pending tools API**: Cannot list/query pending approvals
5. **Revision history**: Only count tracked, no details
6. **Efficient approval**: Polling instead of real-time
7. **Full context assembly**: Minimal context provided
8. **Progress tracking**: No progress updates (0.1 → 1.0)
9. **Error recovery**: Cannot resume failed requests
10. **Cost tracking**: No token cost recorded

---

## 🎯 Recommended Fixes (Priority Order)

### **P0 - Critical (Breaks Core Flow)**

1. **Create assistant messages after stream completes**
   - MVU: Save assistant message with full response + tool calls
   - Impact: Fixes conversation history

2. **Implement agent_requests tracking**
   - MVU: Create agent request on message creation
   - MVU: Update status during execution
   - MVU: Store results on completion
   - Impact: Enables tracking, progress, error recovery

3. **Add pending tools API**
   - MVU: `GET /api/threads/:id/pending-tools`
   - MVU: `GET /api/tool-calls?status=pending`
   - Impact: Allows resuming approvals

### **P1 - High (Performance/UX)**

4. **Replace polling with real-time subscriptions**
   - MVU: Use Supabase Realtime for approval detection
   - Impact: 99% reduction in database queries

5. **Persist requestId properly**
   - MVU: Store requestId in agent_requests or messages
   - Impact: Enables request tracking

### **P2 - Medium (Nice to Have)**

6. **Track revision history details**
   - MVU: Store full revision history in JSONB
   - Impact: Better debugging and learning

7. **Enhance context assembly**
   - MVU: Implement ContextAssemblyService fully
   - Impact: Better AI responses

---

## 🔄 Revised Flow (After Fixes)

### **Correct Flow with agent_requests**:

```
1. User sends message
   ↓
2. Create message in DB
   ↓
3. Create agent_request record:
   {
     id: "request-uuid",
     message_id: "message-uuid",
     status: "pending",
     progress: 0.0
   }
   ↓
4. Return to client with requestId
   ↓
5. Client connects to stream
   ↓
6. Update agent_request.status = "in_progress"
   ↓
7. Stream AI response
   - Update agent_request.progress: 0.1 → 0.5 → 0.8
   ↓
8. Tool proposed
   - Create tool_call record
   - Yield to client
   ↓
9. Wait for approval (use Realtime, not polling)
   ↓
10. Execute tool
   ↓
11. Update agent_request:
    - status = "completed"
    - progress = 1.0
    - results = { ... }
    - token_cost = 1234
   ↓
12. Create assistant message in DB
   ↓
13. Close stream
```

---

## 📋 Gap Checklist

- [ ] **agent_requests table used for tracking**
- [ ] **requestId persisted in agent_requests**
- [ ] **Assistant messages saved after completion**
- [ ] **GET /api/threads/:id/pending-tools endpoint**
- [ ] **Real-time approval detection (no polling)**
- [ ] **Revision history details stored**
- [ ] **Context assembly fully implemented**
- [ ] **Progress updates sent during execution**
- [ ] **Token costs tracked**
- [ ] **Error recovery mechanism**

---

**Conclusion**: The basic flow works (message → stream → tool approval → execution), but **tracking and observability are completely missing**. The `agent_requests` table exists in the schema but is never used, breaking the ability to track execution state, progress, results, and costs.
