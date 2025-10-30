# Visual Flow Analysis - Step by Step

**Date**: 2025-10-30

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: User Sends Message                                     │
└─────────────────────────────────────────────────────────────────┘
        │
        ↓ POST /api/threads/:threadId/messages
        │ { content: "Create a README file" }
        │
┌───────▼─────────────────────────────────────────────────────────┐
│ STEP 2: MessageService.createMessage()                          │
│                                                                  │
│  1. Verify thread exists + user owns it                         │
│  2. Create message in DB:                                       │
│     messages table:                                             │
│     {                                                            │
│       id: "msg-uuid",                                           │
│       threadId: "thread-uuid",                                  │
│       role: "user",                                             │
│       content: "Create a README file",                          │
│       timestamp: NOW()                                          │
│     }                                                            │
│                                                                  │
│  3. Generate requestId (NOT SAVED ❌)                           │
│     requestId = crypto.randomUUID()                             │
│                                                                  │
│  4. Fire-and-forget AI processing start                         │
│     (just a log, no actual work)                                │
│                                                                  │
│  5. Return response to client:                                  │
│     {                                                            │
│       id: "msg-uuid",                                           │
│       _links: {                                                 │
│         stream: {                                               │
│           href: "/api/threads/.../messages/msg-uuid/stream"    │
│         }                                                        │
│       },                                                         │
│       _embedded: {                                              │
│         requestId: "request-uuid",  ← NOT IN DATABASE!         │
│         processingStatus: "started"                             │
│       }                                                          │
│     }                                                            │
└──────────────────────────────────────────────────────────────────┘
        │
        │ ⚠️ GAP: No agent_request record created!
        │ ⚠️ GAP: requestId not persisted!
        │
┌───────▼─────────────────────────────────────────────────────────┐
│ STEP 3: Client Connects to Stream                               │
└──────────────────────────────────────────────────────────────────┘
        │
        ↓ GET /api/threads/:threadId/messages/:messageId/stream
        │
┌───────▼─────────────────────────────────────────────────────────┐
│ STEP 4: AgentExecutionService.executeStream()                   │
│                                                                  │
│  1. Fetch message from DB                                       │
│  2. Build primeContext:                                         │
│     {                                                            │
│       totalTokens: 0,                                           │
│       explicitFiles: [],    ← EMPTY ❌                         │
│       threadContext: []     ← EMPTY ❌                         │
│     }                                                            │
│  3. Call executeWithStreaming()                                 │
└──────────────────────────────────────────────────────────────────┘
        │
        │ ⚠️ GAP: Context is minimal, no files/history
        │
┌───────▼─────────────────────────────────────────────────────────┐
│ STEP 5: Streaming Loop Begins                                   │
│                                                                  │
│  ITERATION 1:                                                   │
│  ───────────                                                    │
│  a) Call AI model (currently simulated)                         │
│     → Returns: "I can help with that. Let me create..."        │
│                                                                  │
│  b) Yield text chunks to client:                                │
│     SSE → { type: "text_chunk", content: "..." }               │
│           ↓ Client displays streaming text                      │
│                                                                  │
│  c) AI proposes tool call:                                      │
│     {                                                            │
│       name: "write_file",                                       │
│       input: {                                                  │
│         path: "README.md",                                      │
│         content: "# Project\n..."                              │
│       }                                                          │
│     }                                                            │
│                                                                  │
│  d) Create tool call record in DB:                              │
│     agent_tool_calls table:                                     │
│     {                                                            │
│       id: "tool-call-uuid",                                     │
│       messageId: "msg-uuid",                                    │
│       threadId: "thread-uuid",                                  │
│       ownerUserId: "user-uuid",                                 │
│       toolName: "write_file",                                   │
│       toolInput: { path: "README.md", content: "..." },        │
│       approvalStatus: "pending",  ← WAITING                    │
│       revisionCount: 0,                                         │
│       timestamp: NOW()                                          │
│     }                                                            │
│                                                                  │
│  e) Yield tool call event to client:                            │
│     SSE → {                                                     │
│       type: "tool_call",                                        │
│       toolCallId: "tool-call-uuid",  ← Client needs this!     │
│       toolName: "write_file",                                   │
│       toolInput: { path: "README.md", content: "..." },        │
│       approval_required: true,                                  │
│       revision_count: 0                                         │
│     }                                                            │
│           ↓ Client shows approval UI with this toolCallId       │
│                                                                  │
│  f) **PAUSE** - Wait for approval:                              │
│     ToolCallService.waitForApproval(toolCallId, 600000ms)      │
│     → Polls database every 100ms-2s (exponential backoff)       │
│     → Checks if approvalStatus changed from "pending"          │
│     → Continues for up to 10 minutes                            │
│                                                                  │
│     ⚠️ STREAM BLOCKS HERE - Waiting for user input             │
└──────────────────────────────────────────────────────────────────┘
        │
        │ Meanwhile, in parallel...
        │
┌───────▼─────────────────────────────────────────────────────────┐
│ STEP 6: User Approves/Rejects (Separate Request)                │
└──────────────────────────────────────────────────────────────────┘
        │
        │ User clicks "Approve" in UI
        ↓
        │ PATCH /api/tool-calls/tool-call-uuid
        │ { approved: true }
        │
┌───────▼─────────────────────────────────────────────────────────┐
│ STEP 7: AgentExecutionService.approveTool()                     │
│                                                                  │
│  1. Fetch tool call from DB:                                    │
│     toolCall = await repository.findById("tool-call-uuid")      │
│                                                                  │
│  2. Verify ownership:                                           │
│     if (toolCall.ownerUserId !== userId) throw Error           │
│                                                                  │
│  3. Update status in DB:                                        │
│     agent_tool_calls:                                           │
│     {                                                            │
│       id: "tool-call-uuid",                                     │
│       approvalStatus: "approved"  ← Changed from "pending"     │
│     }                                                            │
│                                                                  │
│  4. Return success to client                                    │
└──────────────────────────────────────────────────────────────────┘
        │
        │ Back in the streaming loop...
        │
┌───────▼─────────────────────────────────────────────────────────┐
│ STEP 8: Polling Detects Approval                                │
│                                                                  │
│  ToolCallService.waitForApproval() detects change:              │
│  - Polls database                                               │
│  - Sees approvalStatus = "approved"                             │
│  - Returns { approved: true }                                   │
│                                                                  │
│  Stream unblocks and continues...                               │
└──────────────────────────────────────────────────────────────────┘
        │
┌───────▼─────────────────────────────────────────────────────────┐
│ STEP 9: Execute Approved Tool                                   │
│                                                                  │
│  executeTool("write_file", toolInput, threadId, userId):        │
│  → ToolCallService.executeWriteFile()                           │
│  → FileService.createFile()                                     │
│  → FileRepository.create()                                      │
│  → Database: files table insert                                 │
│                                                                  │
│  Result: {                                                       │
│    success: true,                                               │
│    fileId: "file-uuid",                                         │
│    path: "README.md"                                            │
│  }                                                               │
│                                                                  │
│  Update tool call record:                                       │
│  agent_tool_calls:                                              │
│  {                                                               │
│    id: "tool-call-uuid",                                        │
│    approvalStatus: "approved",                                  │
│    toolOutput: { success: true, fileId: "..." }                │
│  }                                                               │
│                                                                  │
│  Yield result to client:                                        │
│  SSE → {                                                        │
│    type: "tool_result",                                         │
│    toolCallId: "tool-call-uuid",                                │
│    result: { success: true, fileId: "..." }                    │
│  }                                                               │
└──────────────────────────────────────────────────────────────────┘
        │
┌───────▼─────────────────────────────────────────────────────────┐
│ STEP 10: Stream Completion                                      │
│                                                                  │
│  Yield completion event:                                        │
│  SSE → {                                                        │
│    type: "completion",                                          │
│    usage: { output_tokens: 100 }                               │
│  }                                                               │
│                                                                  │
│  Loop ends (continueLoop = false)                               │
│  Stream closes                                                  │
│                                                                  │
│  ⚠️ GAP: No assistant message created! ❌                       │
│  ⚠️ GAP: No agent_request updated! ❌                           │
│  ⚠️ GAP: No final results stored! ❌                            │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔁 Rejection Flow (If User Rejects)

```
STEP 6 Alternative: User Rejects
        │
        ↓ PATCH /api/tool-calls/tool-call-uuid
        │ { approved: false, reason: "Wrong filename" }
        │
┌───────▼─────────────────────────────────────────────────────────┐
│ AgentExecutionService.approveTool()                             │
│                                                                  │
│  Update DB:                                                     │
│  agent_tool_calls:                                              │
│  {                                                               │
│    id: "tool-call-uuid",                                        │
│    approvalStatus: "rejected",                                  │
│    revisionCount: 1,  ← Incremented                            │
│    rejectionReason: "Wrong filename"                            │
│  }                                                               │
└──────────────────────────────────────────────────────────────────┘
        │
┌───────▼─────────────────────────────────────────────────────────┐
│ Stream Continues (Revision Workflow)                            │
│                                                                  │
│  waitForApproval() returns:                                     │
│  { approved: false, reason: "Wrong filename" }                  │
│                                                                  │
│  Increment revision count: revisionCount++                      │
│                                                                  │
│  Check if max revisions reached (3):                            │
│  if (revisionCount >= 3) {                                      │
│    Yield: { type: "tool_rejected", maxRevisionsReached: true } │
│    Break loop                                                   │
│  }                                                               │
│                                                                  │
│  Otherwise, yield:                                              │
│  SSE → {                                                        │
│    type: "agent_revising",                                      │
│    toolCallId: "tool-call-uuid",                                │
│    reason: "Wrong filename",                                    │
│    revisionAttempt: 1                                           │
│  }                                                               │
│                                                                  │
│  Add rejection context to messages:                             │
│  messages.push({                                                │
│    role: "user",                                                │
│    content: "The write_file tool was rejected.                  │
│               Reason: 'Wrong filename'.                          │
│               Please revise your approach."                      │
│  })                                                              │
│                                                                  │
│  Loop restarts (ITERATION 2)                                    │
│  → AI gets rejection context                                    │
│  → Proposes revised tool call                                   │
│  → Creates new tool call record                                 │
│  → Waits for approval again                                     │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📊 Database State at Each Step

```
BEFORE:
  messages: []
  agent_tool_calls: []
  files: []

AFTER STEP 2 (Message Created):
  messages: [
    { id: "msg-uuid", role: "user", content: "Create README", ... }
  ]
  agent_tool_calls: []
  files: []

AFTER STEP 5d (Tool Call Proposed):
  messages: [
    { id: "msg-uuid", role: "user", content: "Create README", ... }
  ]
  agent_tool_calls: [
    { id: "tool-uuid", approvalStatus: "pending", ... }
  ]
  files: []

AFTER STEP 7 (User Approves):
  messages: [
    { id: "msg-uuid", role: "user", content: "Create README", ... }
  ]
  agent_tool_calls: [
    { id: "tool-uuid", approvalStatus: "approved", ... }
  ]
  files: []

AFTER STEP 9 (Tool Executed):
  messages: [
    { id: "msg-uuid", role: "user", content: "Create README", ... }
  ]
  agent_tool_calls: [
    { id: "tool-uuid", approvalStatus: "approved", toolOutput: {...} }
  ]
  files: [
    { id: "file-uuid", path: "README.md", content: "...", ... }
  ]

AFTER STEP 10 (Stream Closes):
  messages: [
    { id: "msg-uuid", role: "user", content: "Create README", ... }
    ❌ MISSING: Assistant message!
  ]
  agent_tool_calls: [
    { id: "tool-uuid", approvalStatus: "approved", toolOutput: {...} }
  ]
  files: [
    { id: "file-uuid", path: "README.md", content: "...", ... }
  ]
  
  ❌ MISSING: agent_requests record!
```

---

## 🎯 How Targeting Works

### **Q1: How does the user know which tool call to approve?**

**A**: The SSE stream sends the `toolCallId` to the client:

```javascript
// Frontend receives this SSE event:
{
  type: "tool_call",
  toolCallId: "abc-123",  ← Use this ID
  toolName: "write_file",
  toolInput: { path: "README.md", content: "..." }
}

// Frontend displays approval UI:
<ApprovalButton 
  toolCallId="abc-123" 
  onClick={() => approveToolCall("abc-123")}
/>

// Frontend calls:
fetch(`/api/tool-calls/abc-123`, {
  method: 'PATCH',
  body: JSON.stringify({ approved: true })
})
```

### **Q2: Can multiple tools be pending simultaneously?**

**A**: **NO** - Current implementation is sequential:
- Stream proposes one tool
- Blocks until approved/rejected
- Only then proposes next tool

**Gap**: No batch approval, no parallel tools

### **Q3: What if user disconnects during approval?**

**A**: **PROBLEM**:
- Stream timeout after 10 minutes
- Tool call stays "pending" forever in database
- No way to resume approval later
- **Gap**: No orphan cleanup, no resume mechanism

### **Q4: How does backend verify ownership?**

**A**: Via `ownerUserId` field:

```typescript
// In approveTool():
const toolCall = await repository.findById(toolCallId);
if (toolCall.ownerUserId !== userId) {
  throw new Error('Access denied');
}
```

Each tool call stores the `ownerUserId`, so only the thread owner can approve.

---

## 🚨 Critical Questions Answered

### **Q: Do we need the agent_requests table?**

**A: YES, ABSOLUTELY** ✅

**Why**:
1. **Track execution state**: pending → in_progress → completed
2. **Store results**: Final output after stream closes
3. **Progress updates**: Show 0% → 50% → 100% to user
4. **Error recovery**: Resume failed requests
5. **Cost accounting**: Track token usage and costs
6. **Audit trail**: What was executed, when, by whom
7. **Query by requestId**: Client needs to check status

**Current Problem**: Table exists in schema but **NEVER USED** ❌

### **Q: How does tool approval/rejection work?**

**A**: Via database polling:

1. Agent creates tool call with `approvalStatus = 'pending'`
2. Stream **blocks** and polls database every 100ms-2s
3. User sends PATCH request to update status
4. Polling detects change and unblocks
5. Stream continues with approved or loops with rejection

**Gap**: Polling is inefficient (should use Realtime subscriptions)

### **Q: How is the tool call targeted?**

**A**: By `toolCallId`:
- Agent generates UUID for each tool call
- Sends ID to client via SSE
- Client uses ID in PATCH request
- Backend verifies ownership via `ownerUserId`

### **Q: Do we persist approval/rejection?**

**A: YES** ✅

Everything persisted in `agent_tool_calls`:
- `approvalStatus`: 'pending' → 'approved'/'rejected'
- `rejectionReason`: Why rejected
- `revisionCount`: Number of attempts
- `toolOutput`: Execution result

**Gap**: No revision history details (only count)

### **Q: Are there gaps?**

**A: YES, MAJOR GAPS** 🚨

See FLOW_ANALYSIS.md for full list:
1. agent_requests not used
2. requestId not persisted
3. Assistant messages not created
4. No pending tools API
5. Polling inefficient
6. No revision history details
7. Context assembly minimal
8. No progress tracking
9. No cost tracking
10. No error recovery

---

## 🎯 Next Steps

1. **Read**: `FLOW_ANALYSIS.md` - Full gap analysis
2. **Implement**: agent_requests table usage
3. **Implement**: Assistant message creation
4. **Implement**: Pending tools API
5. **Optimize**: Replace polling with Realtime
6. **Enhance**: Context assembly
7. **Add**: Progress and cost tracking
