# Tool Approval Architecture

**Date**: October 30, 2024
**Status**: Design Phase
**Effort**: 2.5-3 hours

---

## Problem Statement

Claude agents need to request user approval before executing tools (file edits, branch creation). Current architecture blocks the edge function waiting for approval, hitting the 400s Supabase timeout constraint. This causes issues with long approval waits or multiple sequential tool calls.

---

## Architecture Decision

### Why This Approach

**Chosen**: Unified execute endpoint + realtime events + checkpoint/resume

**Rejected alternatives**:
- **SSE streaming**: Added complexity without benefit over Realtime
- **Multi-turn with timeout guards**: Increased token cost (75% overhead) and complexity
- **MCP**: Requires Node.js worker process, incompatible with Supabase Edge Functions
- **PgBoss/background workers**: Unnecessary infrastructure for MVP scope
- **Polling**: Database load and latency issues vs Realtime's instant updates

**Why this works**:
- Execution decoupled from approval (no edge timeout blocking)
- Realtime already implemented, reuse existing infrastructure
- Single endpoint handles fresh start + resume (reduces cognitive load)
- Checkpoint pattern is standard and testable
- Rejection is just a DB update (clean separation)

---

## Architecture Overview

### Request Lifecycle

```
Fresh Start:
  POST /execute (no checkpoint)
    → executeWithStreaming() runs fresh while loop
    → Claude turn 1 → tool_use event
    → Save checkpoint
    → Emit tool_call event → agent_execution_events
    → Realtime publishes to frontend
    → Return (exit edge function)

Approval:
  Frontend receives tool_call via Realtime
    → User clicks approve/reject
    → POST /approve-tool

  If Approved:
    → Update agent_tool_calls.status = 'approved'
    → POST /execute (resume = true)
    → executeWithStreaming() loads checkpoint
    → Execute approved tool
    → Feed result to Claude
    → Continue while loop (Claude turn 2)
    → Emit events → agent_execution_events → Realtime
    → Loop continues until completion or next tool_call

  If Rejected:
    → Update agent_tool_calls.status = 'rejected'
    → Update agent_requests.status = 'rejected'
    → No /execute call
    → End execution
```

### Data Flow

```
POST /execute
  ↓
executeWithStreaming()
  ├─ Load checkpoint (if resume) or init fresh
  ├─ While loop (max 5 iterations per session)
  │  ├─ Claude API call
  │  ├─ Yield events:
  │  │  ├─ text_chunk → agent_execution_events
  │  │  ├─ tool_call → agent_execution_events
  │  │  ├─ tool_result → agent_execution_events
  │  │  └─ completion → agent_execution_events
  │  ├─ Save checkpoint before returning on tool_call
  │  └─ Continue (if resume) or return (if first turn hit tool_call)
  └─ Return

agent_execution_events INSERT triggers:
  ↓
Supabase Realtime publishes
  ↓
Frontend subscribed to channel receives event
  ↓
UI updates (tool_call shows approval modal, completion shows final response)
```

---

## Implementation Details

### 1. Modify `executeWithStreaming()` (agentExecution.ts)

**Key Changes**:
- Accept `options: { isResume?: boolean }` parameter
- Load checkpoint if resuming: `messages = checkpoint.conversationHistory`
- Load iteration count if resuming: `iterationCount = checkpoint.iterationCount`
- On tool_call: Save checkpoint BEFORE returning
- After resuming: Execute tool, continue while loop without returning

**Checkpoint Structure**:
```typescript
interface Checkpoint {
  conversationHistory: Message[];  // Full messages array for Claude
  lastToolCall: {
    id: string;
    name: string;
    input: Record<string, any>;
  };
  iterationCount: number;
  status: 'awaiting_approval';
}
```

### 2. Modify `/execute` Endpoint (agent-requests.ts)

**Current**: `POST /api/agent-requests/:requestId/execute`

**New logic**:
```typescript
1. Check for checkpoint on request
2. If checkpoint exists → isResume = true
3. Pass to executeWithStreaming(threadId, messageId, userMessage, primeContext, userId, requestId, { isResume })
4. Consume generator, persist events to agent_execution_events
5. Return immediately
```

No SSE needed - all events persisted to DB and published via Realtime.

### 3. Modify `/approve-tool` Endpoint

**Current**: Updates agent_tool_calls.status

**New logic**:
```typescript
POST /approve-tool/:toolCallId
Body: { approved: boolean }

1. Fetch toolCall and requestId
2. If approved:
   a. Update agent_tool_calls.status = 'approved'
   b. Fetch request with checkpoint
   c. Call executeWithStreaming(..., { isResume: true })
   d. Consume generator → persist events
   e. Return success
3. If rejected:
   a. Update agent_tool_calls.status = 'rejected'
   b. Update agent_requests: status = 'rejected', checkpoint = null
   c. Return success (no execute call)
```

### 4. System Prompt Modification

**Current**: Generic system prompt

**New guidance**:
```
"When you need to use tools:
- Suggest ONE tool at a time
- Wait for the result before suggesting the next tool
- Use the result to inform your next decision"
```

Ensures Claude returns max 1 tool_use per response, enabling sequential approvals.

### 5. Prompt Caching (Optional, Phase 2)

Add cache_control headers to Claude API calls:
```typescript
system: [
  {
    type: "text",
    text: systemPrompt,
    cache_control: { type: "ephemeral" }
  }
]
```

**Benefit**: 87% token savings on multi-turn workflows (87% fewer tokens on cached content).

---

## Edge Cases & Mitigations

| Case | Mitigation |
|------|-----------|
| **Approval comes after first /execute exits** | Checkpoint saved; /approve-tool calls /execute (resume) with checkpoint |
| **Approval takes >400s** | Not a problem; checkpoint persisted, /approve-tool can call /execute anytime |
| **Multiple tool calls in sequence** | While loop continues, each tool_call saves checkpoint, each approval resumes |
| **User rejects tool** | /approve-tool updates status to 'rejected', updates request status, no /execute call |
| **Network failure during resume** | /execute retries with same checkpoint (idempotent) |
| **Concurrent approvals** | Each /approve-tool call serializes via /execute (edge function is single-threaded per request) |

---

## Frontend Impact

**No changes to frontend logic needed**:
- Already subscribes to agent_execution_events via Realtime
- Already receives tool_call events and shows approval UI
- Already calls POST /approve-tool on user action
- Realtime updates from resumed execution work seamlessly

---

## Testing Strategy

### Unit Tests
- [ ] Fresh start: No checkpoint, executeWithStreaming runs loop, saves checkpoint on tool_call
- [ ] Resume: Checkpoint loaded, tool executed, loop continues
- [ ] Rejection: Status updated, request marked rejected, no execution

### Integration Tests
- [ ] Send request → tool_call event appears in agent_execution_events
- [ ] Approve → /execute called, events persisted, Realtime publishes
- [ ] Multiple approvals → each /approve-tool triggers execution, all events streamed
- [ ] Rejection → request marked rejected, no further events

### Manual Testing
1. Send request with tool_call
2. Verify tool_call appears in UI (via Realtime)
3. Approve immediately → execution continues in same /execute
4. Verify tool_result and final response via Realtime
5. Test rejection → request marked failed, no execution
6. Test approval delay → checkpoint persists, approval anytime works

---

## Deployment Checklist

- [ ] Update `executeWithStreaming()` with checkpoint logic
- [ ] Update `/execute` endpoint to detect resume
- [ ] Update `/approve-tool` to conditional execute call
- [ ] Update system prompt with tool guidance
- [ ] Verify agent_execution_events has Realtime publication enabled
- [ ] Test fresh start flow
- [ ] Test resume flow (approval after edge timeout)
- [ ] Test rejection flow
- [ ] Monitor token usage (baseline for caching optimization later)

---

## Future Optimizations

**Phase 2** (Post-MVP):
- Prompt caching (87% token savings on multi-turn)
- Approval timeout alerts (5-minute mark)
- Multi-provider support (Gemini Flash, GPT-4o mini fallback)

**Phase 3** (Scaling):
- Tool result caching (same tool called twice)
- Batch tool execution (parallel execution of independent tools)
- Archive old events (cleanup older than 30 days)

---

## Implementation Order

1. **Core**: Modify executeWithStreaming() with checkpoint/resume logic (1 hour)
2. **Integration**: Update /execute and /approve-tool endpoints (1 hour)
3. **System Prompt**: Add tool guidance (5 min)
4. **Testing**: Unit + integration tests (30 min)
5. **Manual Verification**: Fresh start, resume, rejection flows (30 min)

**Total**: 2.5-3 hours

---

## Design Rationale Summary

| Decision | Why |
|----------|-----|
| Unified /execute endpoint | Simpler codebase, reuses existing endpoint, handles both fresh + resume |
| Checkpoint before tool_call | Enables resume from exact point, not lost context |
| Realtime only (no SSE) | Already implemented, cleaner than dual streaming patterns |
| Rejection updates DB only | Simpler than orchestrating reject + resume; separation of concerns |
| One tool per Claude response | Better UX (user reviews each action), better quality (Claude adapts per result) |
| No polling | Realtime instant; polling adds latency and DB load |
| No background workers | Supabase Edge Functions compatible, simpler deployment, no infrastructure |

