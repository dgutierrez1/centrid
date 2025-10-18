# BE-06: Real-Time Progress Updates (WebSocket/SSE)

**Status**: `pending`  
**Estimate**: 2 hours  
**Priority**: High  
**Dependencies**: BE-05

## Description

Implement real-time progress updates for AI agent execution using WebSocket or Server-Sent Events (SSE) to provide live feedback to users.

## Tasks

- [ ] Choose WebSocket vs SSE approach
- [ ] Implement progress update mechanism
- [ ] Update agent execution to emit progress
- [ ] Test connection stability
- [ ] Handle reconnection logic
- [ ] Document client integration

## Tech Spec

### SSE Implementation (Recommended for MVP)

```typescript
// supabase/functions/agent-progress/index.ts
Deno.serve(async (req) => {
  const { requestId } = await req.json();

  const stream = new ReadableStream({
    async start(controller) {
      // Subscribe to agent_requests changes
      const subscription = supabase
        .channel(`request:${requestId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "agent_requests",
            filter: `id=eq.${requestId}`,
          },
          (payload) => {
            const data = `data: ${JSON.stringify(payload.new)}\n\n`;
            controller.enqueue(new TextEncoder().encode(data));

            if (payload.new.status === "completed") {
              controller.close();
            }
          }
        )
        .subscribe();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});
```

### Progress Update in Agent Execution

```typescript
// Update status during execution
async function updateProgress(
  requestId: string,
  progress: number,
  stage: string
) {
  await supabase
    .from("agent_requests")
    .update({
      progress,
      current_stage: stage,
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);
}

// Usage in agent execution
await updateProgress(requestId, 25, "retrieving_context");
// ... search for documents
await updateProgress(requestId, 50, "processing_request");
// ... call Claude
await updateProgress(requestId, 75, "validating_response");
// ... validate
await updateProgress(requestId, 100, "completed");
```

## Acceptance Criteria

- [ ] Real-time updates working
- [ ] Progress stages clearly defined
- [ ] Connection stable for 2+ minutes
- [ ] Reconnection works on disconnect
- [ ] Multiple clients supported
- [ ] Latency <100ms for updates

## Notes

- SSE simpler than WebSocket for one-way communication
- Use Supabase Realtime as alternative if needed
- Test on mobile networks

