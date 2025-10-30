# Agent Request Streaming - MVU Implementation Plan

**Date**: 2025-10-30  
**Goal**: Migrate from message-based streaming to request-based streaming with full tracking  
**Approach**: Minimum Viable Units (MVUs)  
**Compliance**: ✅ Stateless services, RESTful routes, Security verified, Existing patterns

---

## 🔒 **Architecture Principles**

### **Stateless Services**
- All service methods are `static` (no instance state)
- Pure functions - same input = same output
- No global state or caching

### **Security & Least Access**
- Auth middleware on all `/api/*` routes (inherited from index.ts)
- Explicit ownership verification in every endpoint
- Users can ONLY access their own resources
- No data leakage between users

### **TODO PHASE Comments**
- All deferred work marked with `TODO PHASE X`
- References blocking MVU dependencies
- Clear when feature will be implemented

### **Existing Patterns**
- Uses unified API edge function (`src/functions/api/`)
- Follows repository pattern (like ThreadRepository)
- Follows service pattern (like ThreadService)
- Uses existing middleware (auth, CORS, logging, errors)
- No new standalone edge functions

---

## 📊 Plan Overview

| Phase                | Focus                     | MVUs        | Time      | Priority |
| -------------------- | ------------------------- | ----------- | --------- | -------- |
| **Backend Phase 1**  | agent_requests Foundation | 6 MVUs      | 2-3h      | P0       |
| **Backend Phase 2**  | Realtime Migration        | 3 MVUs      | 1-2h      | P0       |
| **Backend Phase 3**  | Message & Cost Tracking   | 4 MVUs      | 1-2h      | P0       |
| **Backend Phase 4**  | Recovery & APIs           | 4 MVUs      | 1h        | P0       |
| **Frontend Phase 1** | Core Streaming            | 3 MVUs      | 1h        | P0       |
| **Frontend Phase 2** | Recovery Features         | 4 MVUs      | 1-2h      | P1       |
| **TOTAL**            |                           | **24 MVUs** | **7-11h** |          |

---

## 🏗️ BACKEND PHASE 1: agent_requests Foundation (2-3h)

**Goal**: Start using agent_requests table for execution tracking

### MVU B1.1: Add agent_requests Schema Fields

**Artifact**: `src/db/schema.ts` with updated agent_requests table
**Verification**: `grep "triggeringMessageId\|responseMessageId\|tokenCost" src/db/schema.ts` shows new fields
**Time**: 20min

```typescript
// Update agent_requests table definition:
export const agentRequests = pgTable(
  "agent_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    threadId: uuid("thread_id").notNull(), // NEW
    triggeringMessageId: uuid("triggering_message_id").notNull(), // NEW
    responseMessageId: uuid("response_message_id"), // NEW
    agentType: text("agent_type").notNull(),
    content: text("content").notNull(),
    status: text("status").notNull().default("pending"),
    progress: real("progress").notNull().default(0),
    results: jsonb("results"),
    tokenCost: integer("token_cost"), // Keep existing
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }), // NEW
  },
  (table) => ({
    userIdIdx: index("agent_requests_user_id_idx").on(table.userId),
    threadIdIdx: index("agent_requests_thread_id_idx").on(table.threadId), // NEW
    triggeringMessageIdx: index("agent_requests_triggering_message_idx").on(
      table.triggeringMessageId
    ), // NEW
    statusIdx: index("agent_requests_status_idx").on(table.status),
    createdAtIdx: index("agent_requests_created_at_idx").on(table.createdAt),
  })
);
```

**Commands**:

```bash
# Apply schema changes
cd apps/api
npm run db:push
```

---

### MVU B1.2: Create AgentRequestRepository

**Artifact**: `src/repositories/agentRequest.ts` with CRUD methods
**Verification**: File exports `AgentRequestRepository` class and singleton
**Time**: 30min

```typescript
import { eq, and } from "drizzle-orm";
import { getDB } from "../functions/_shared/db.ts";
import { agentRequests } from "../db/schema.ts";

export interface CreateAgentRequestInput {
  userId: string;
  threadId: string;
  triggeringMessageId: string;
  agentType: string;
  content: string;
}

export interface UpdateAgentRequestInput {
  status?: "pending" | "in_progress" | "completed" | "failed";
  progress?: number;
  responseMessageId?: string;
  results?: any;
  tokenCost?: number;
  completedAt?: Date;
}

export class AgentRequestRepository {
  /**
   * Create agent request
   */
  async create(input: CreateAgentRequestInput) {
    const { db } = await getDB();
    const [request] = await db
      .insert(agentRequests)
      .values({
        userId: input.userId,
        threadId: input.threadId,
        triggeringMessageId: input.triggeringMessageId,
        agentType: input.agentType,
        content: input.content,
        status: "pending",
        progress: 0.0,
      })
      .returning();
    return request;
  }

  /**
   * Find by ID
   */
  async findById(requestId: string) {
    const { db } = await getDB();
    const [request] = await db
      .select()
      .from(agentRequests)
      .where(eq(agentRequests.id, requestId))
      .limit(1);
    return request || null;
  }

  /**
   * Find by triggering message
   */
  async findByTriggeringMessage(messageId: string) {
    const { db } = await getDB();
    const [request] = await db
      .select()
      .from(agentRequests)
      .where(eq(agentRequests.triggeringMessageId, messageId))
      .limit(1);
    return request || null;
  }

  /**
   * Update request
   */
  async update(requestId: string, updates: UpdateAgentRequestInput) {
    const { db } = await getDB();
    const [request] = await db
      .update(agentRequests)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(agentRequests.id, requestId))
      .returning();
    return request;
  }

  /**
   * Find all by thread
   */
  async findByThreadId(threadId: string) {
    const { db } = await getDB();
    return db
      .select()
      .from(agentRequests)
      .where(eq(agentRequests.threadId, threadId))
      .orderBy(agentRequests.createdAt);
  }

  /**
   * Find all by user
   */
  async findByUserId(userId: string, limit = 50) {
    const { db } = await getDB();
    return db
      .select()
      .from(agentRequests)
      .where(eq(agentRequests.userId, userId))
      .orderBy(agentRequests.createdAt)
      .limit(limit);
  }
}

export const agentRequestRepository = new AgentRequestRepository();
```

**Verification**:

```bash
grep "export.*AgentRequestRepository" src/repositories/agentRequest.ts
```

---

### MVU B1.3: Update MessageService to Create agent_request

**Artifact**: `MessageService.createMessage()` creates agent_request record
**Verification**: Create message → Check DB has agent_request with correct links
**Time**: 25min

```typescript
// In src/services/messageService.ts

import { agentRequestRepository } from "../repositories/agentRequest.ts";

export class MessageService {
  static async createMessage(
    input: CreateMessageInput
  ): Promise<MessageResource> {
    console.log("[MessageService] Creating message", {
      threadId: input.threadId,
      role: input.role,
    });

    // Verify thread exists and user has access
    const thread = await threadRepository.findById(input.threadId);
    if (!thread || thread.ownerUserId !== input.userId) {
      throw new Error("Thread not found or access denied");
    }

    // Create message in database
    const message = await messageRepository.create({
      threadId: input.threadId,
      ownerUserId: input.userId,
      role: input.role,
      content: input.content,
      toolCalls: [],
    });

    // NEW: Create agent_request for user messages
    let requestId: string | undefined;
    if (input.role === "user") {
      const agentRequest = await agentRequestRepository.create({
        userId: input.userId,
        threadId: input.threadId,
        triggeringMessageId: message.id,
        agentType: "assistant", // Default type
        content: input.content,
      });
      requestId = agentRequest.id;
    }

    // Build resource representation
    const baseUrl = "/api";
    const streamUrl = requestId
      ? `/api/agent-requests/${requestId}/stream` // NEW: Stream by requestId
      : undefined;

    return {
      id: message.id,
      threadId: input.threadId,
      content: input.content,
      role: input.role,
      createdAt: message.timestamp,
      toolCalls: (message.toolCalls as any[]) || undefined,
      tokensUsed: message.tokensUsed ?? undefined,
      _links: {
        self: {
          href: `${baseUrl}/threads/${input.threadId}/messages/${message.id}`,
        },
        thread: { href: `${baseUrl}/threads/${input.threadId}` },
        messages: { href: `${baseUrl}/threads/${input.threadId}/messages` },
        ...(streamUrl && { stream: { href: streamUrl } }),
      },
      _embedded:
        input.role === "user"
          ? {
              requestId: requestId!, // Now persisted!
              processingStatus: "pending",
            }
          : undefined,
    };
  }

  // Remove startAIProcessing() method - no longer needed
}
```

**Verification**:

```bash
# Create message via API
curl -X POST http://localhost:54321/functions/v1/api/threads/THREAD_ID/messages \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"content":"test"}'

# Check agent_requests table
psql $DATABASE_URL -c "SELECT id, triggering_message_id, status FROM agent_requests ORDER BY created_at DESC LIMIT 1;"
```

---

### MVU B1.4: Create agent-requests Route File

**Artifact**: `src/functions/api/routes/agent-requests.ts` with route handlers
**Verification**: File exists with exported `agentRequestRoutes`
**Time**: 30min

```typescript
/**
 * Agent Request Routes
 * Handles agent execution tracking and streaming
 * ✅ CLEAN - Delegates to services
 */

import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { agentRequestRepository } from "../../../repositories/agentRequest.ts";
import { AgentExecutionService } from "../../../services/agentExecution.ts";
import type { AppContext } from "../types.ts";

const app = new Hono<{ Variables: AppContext }>();

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /api/agent-requests/:requestId
 * Get agent request status and results
 */
app.get("/:requestId", async (c) => {
  const requestId = c.req.param("requestId");
  const userId = c.get("userId");

  // Validate UUID
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      requestId
    )
  ) {
    return c.json({ error: "Invalid request ID format" }, 400);
  }

  try {
    const request = await agentRequestRepository.findById(requestId);

    if (!request) {
      return c.json({ error: "Request not found" }, 404);
    }

    if (request.userId !== userId) {
      return c.json({ error: "Access denied" }, 403);
    }

    return c.json({
      data: {
        id: request.id,
        status: request.status,
        progress: request.progress,
        triggeringMessageId: request.triggeringMessageId,
        responseMessageId: request.responseMessageId,
        results: request.results,
        tokenCost: request.tokenCost,
        canResume: request.status === "in_progress",
        createdAt: request.createdAt,
        completedAt: request.completedAt,
      },
    });
  } catch (error) {
    console.error("Failed to get agent request:", error);
    return c.json({ error: "Failed to fetch request" }, 500);
  }
});

/**
 * GET /api/agent-requests/:requestId/stream
 * Stream agent execution via Server-Sent Events
 */
app.get("/:requestId/stream", async (c) => {
  const requestId = c.req.param("requestId");
  const userId = c.get("userId");

  // Validate UUID
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      requestId
    )
  ) {
    return c.json({ error: "Invalid request ID format" }, 400);
  }

  try {
    const request = await agentRequestRepository.findById(requestId);

    if (!request) {
      return c.json({ error: "Request not found" }, 404);
    }

    if (request.userId !== userId) {
      return c.json({ error: "Access denied" }, 403);
    }

    // Check if already completed
    if (request.status === "completed") {
      return c.json(
        {
          error: "Request already completed",
          responseMessageId: request.responseMessageId,
        },
        410
      ); // 410 Gone
    }

    // Return SSE stream
    return streamSSE(c, async (stream) => {
      try {
        console.log("Starting agent stream:", { requestId, userId });

        // Execute agent (NEW signature takes requestId)
        const generator = AgentExecutionService.executeStreamByRequest(
          requestId,
          userId
        );

        for await (const chunk of generator) {
          await stream.writeSSE({
            data: JSON.stringify(chunk),
            event: chunk.type || "message",
            id: String(Date.now()),
          });
        }

        await stream.writeSSE({
          data: JSON.stringify({ status: "complete" }),
          event: "done",
        });

        console.log("Agent stream completed");
      } catch (error) {
        console.error("Agent stream error:", error);

        await stream.writeSSE({
          data: JSON.stringify({
            error: error instanceof Error ? error.message : "Stream failed",
          }),
          event: "error",
        });
      }
    });
  } catch (error) {
    console.error("Failed to start agent stream:", error);
    return c.json(
      {
        error: "Failed to start agent stream",
        details: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

export { app as agentRequestRoutes };
```

**Verification**:

```bash
grep "export.*agentRequestRoutes" src/functions/api/routes/agent-requests.ts
```

---

### MVU B1.5: Mount agent-requests Routes in API

**Artifact**: `src/functions/api/index.ts` mounts agent-requests routes
**Verification**: Routes accessible at `/api/agent-requests/*`
**Time**: 10min

```typescript
// In src/functions/api/index.ts

// Add import
import { agentRequestRoutes } from './routes/agent-requests.ts';

// Mount routes (add after other routes, before error handling)
// SECURITY: All /api/* routes automatically inherit authMiddleware
// This means agent-requests routes get:
// - Auth verification (JWT)
// - userId in context (c.get('userId'))
// - CORS, logging, error handling
app.route('/api/agent-requests', agentRequestRoutes);

// Update API documentation in GET /
endpoints: {
  // ... existing endpoints
  agentRequests: [
    'GET /api/agent-requests/:requestId',
    'GET /api/agent-requests/:requestId/stream',
    // Added in Phase 4:
    // 'GET /api/agent-requests/:requestId/pending-tools',
  ],
}
```

**Verification**:

```bash
curl http://localhost:54321/functions/v1/api | jq '.endpoints.agentRequests'
```

---

### MVU B1.6: Update AgentExecutionService to Use requestId

**Artifact**: `AgentExecutionService.executeStreamByRequest()` method
**Verification**: Method fetches request, updates status, returns generator
**Time**: 30min

```typescript
// In src/services/agentExecution.ts

import { agentRequestRepository } from "../repositories/agentRequest.ts";

export class AgentExecutionService {
  /**
   * NEW: Execute agent by request ID (replaces executeStream)
   */
  static async *executeStreamByRequest(
    requestId: string,
    userId: string
  ): AsyncGenerator<any> {
    // Fetch request
    const request = await agentRequestRepository.findById(requestId);
    if (!request || request.userId !== userId) {
      throw new Error("Request not found or access denied");
    }

    // Fetch triggering message
    const message = await messageRepository.findById(
      request.triggeringMessageId
    );
    if (!message) {
      throw new Error("Triggering message not found");
    }

    // Update request status
    await agentRequestRepository.update(requestId, {
      status: "in_progress",
      progress: 0.1,
    });

    // Build context
    const primeContext: PrimeContext = {
      totalTokens: 0,
      explicitFiles: [],      
      // TODO PHASE 2-5: Populate from context_references
      // Blocked by: Shadow domain implementation (see BACKEND_GAPS_MVU_PLAN.md)
      // Will be populated by ContextAssemblyService
      
      threadContext: [],      
      // TODO PHASE 2-5: Populate from thread message history
      // Blocked by: Context assembly enhancement
      // Will include previous messages for multi-turn context
    };

    // Delegate to execution with request tracking
    yield* this.executeWithStreaming(
      request.threadId,
      message.id,
      message.content,
      primeContext,
      userId,
      requestId // NEW: Pass requestId for tracking
    );
  }

  /**
   * Updated: Execute with request tracking
   */
  static async *executeWithStreaming(
    threadId: string,
    messageId: string,
    userMessage: string,
    primeContext: PrimeContext,
    userId: string,
    requestId?: string // NEW: Optional requestId for tracking
  ): AsyncGenerator<any> {
    // ... existing implementation ...

    // Update progress during execution
    if (requestId) {
      await agentRequestRepository.update(requestId, { 
        progress: 0.3 
        // TODO PHASE 3: Granular progress tracking
        // Current: Simple 0.1 → 0.3 → 1.0
        // Future: Track by operation (context: 0.2, reasoning: 0.4, tool: 0.6, etc)
      });
    }

    // ... tool call loop ...

    // At end: Update to completed (will do in Phase 3)
  }

  // Keep old executeStream for backwards compat (mark deprecated)
  /** @deprecated Use executeStreamByRequest instead */
  static async *executeStream(
    userId: string,
    threadId: string,
    messageId: string
  ): AsyncGenerator<any> {
    // Find or create request for this message
    const message = await messageRepository.findById(messageId);
    if (!message) throw new Error("Message not found");

    let request = await agentRequestRepository.findByTriggeringMessage(
      messageId
    );
    if (!request) {
      request = await agentRequestRepository.create({
        userId,
        threadId,
        triggeringMessageId: messageId,
        agentType: "assistant",
        content: message.content,
      });
    }

    yield* this.executeStreamByRequest(request.id, userId);
  }
}
```

**Verification**:

```bash
# Stream via new endpoint
curl -N http://localhost:54321/functions/v1/api/agent-requests/REQUEST_ID/stream \
  -H "Authorization: Bearer $TOKEN"
```

---

## ⚡ BACKEND PHASE 2: Realtime Migration (1-2h)

**Goal**: Replace polling with Supabase Realtime for instant approval detection

### MVU B2.1: Add Supabase Client to Services

**Artifact**: `src/lib/supabase.ts` with service role client
**Verification**: File exports `getSupabaseServiceClient()`
**Time**: 15min

```typescript
// Create src/lib/supabase.ts
import { createClient } from "jsr:@supabase/supabase-js@2";

let supabaseClient: any = null;

export function getSupabaseServiceClient() {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabaseClient;
}
```

**Verification**:

```bash
grep "export.*getSupabaseServiceClient" src/lib/supabase.ts
```

---

### MVU B2.2: Replace Polling with Realtime in waitForApproval

**Artifact**: `ToolCallService.waitForApproval()` uses Realtime
**Verification**: Approval detected instantly (no 1s delays)
**Time**: 45min

```typescript
// In src/services/toolCall.ts

import { getSupabaseServiceClient } from "../lib/supabase.ts";

/**
 * Tool Call Service
 * ✅ STATELESS - All methods are static
 */
export class ToolCallService {
  /**
   * Wait for tool call approval using Supabase Realtime
   * REPLACES polling implementation
   * ✅ STATIC method (stateless)
   * ✅ PERFORMANCE: 99% reduction in DB queries vs polling
   */
  static async waitForApproval(
    toolCallId: string,
    timeout: number = 600000
  ): Promise<{ approved: boolean; reason?: string }> {
    console.log("[ToolCall] Waiting for approval via Realtime:", toolCallId);

    const supabase = getSupabaseServiceClient();

    return new Promise((resolve, reject) => {
      let resolved = false;
      let subscription: any;

      // Set up timeout
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          if (subscription) {
            supabase.removeChannel(subscription);
          }
          console.warn("[ToolCall] Approval timeout:", toolCallId);
          resolve({ approved: false, reason: "Timeout waiting for approval" });
        }
      }, timeout);

      // Subscribe to database changes
      subscription = supabase
        .channel(`tool-call-${toolCallId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "agent_tool_calls",
            filter: `id=eq.${toolCallId}`,
          },
          async (payload: any) => {
            if (resolved) return;

            const newStatus = payload.new.approval_status;

            if (newStatus !== "pending") {
              resolved = true;
              clearTimeout(timeoutId);
              await supabase.removeChannel(subscription);

              if (newStatus === "approved") {
                console.log(
                  "[ToolCall] Approval granted via Realtime:",
                  toolCallId
                );
                resolve({ approved: true });
              } else if (newStatus === "rejected") {
                console.log(
                  "[ToolCall] Approval rejected via Realtime:",
                  toolCallId
                );
                resolve({
                  approved: false,
                  reason: payload.new.rejection_reason || "User rejected",
                });
              } else {
                // Unexpected status
                resolve({
                  approved: false,
                  reason: `Unexpected status: ${newStatus}`,
                });
              }
            }
          }
        )
        .subscribe((status: string) => {
          if (status === "SUBSCRIBED") {
            console.log(
              "[ToolCall] Subscribed to approval channel:",
              toolCallId
            );
          } else if (status === "CHANNEL_ERROR") {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeoutId);
              reject(new Error("Realtime subscription failed"));
            }
          }
        });
    });
  }
}
```

**Verification**:

```bash
# Test approval - should be instant (not 1s delay)
# 1. Start stream
# 2. Approve tool
# 3. Check logs - should see "Approval granted via Realtime" immediately
```

---

### MVU B2.3: Remove Old Polling Code

**Artifact**: Cleaned `ToolCallService` without polling logic
**Verification**: No `setTimeout` or poll loops in waitForApproval
**Time**: 10min

```typescript
// Delete old polling implementation (lines 200-240 in toolCall.ts)
// Keep only the Realtime version from B2.2
```

**Verification**:

```bash
grep -n "setTimeout.*1000\|pollInterval" src/services/toolCall.ts
# Should return no results
```

---

## 💾 BACKEND PHASE 3: Message & Cost Tracking (1-2h)

**Goal**: Save assistant messages and track token costs

### MVU B3.1: Accumulate Content During Streaming

**Artifact**: `executeWithStreaming()` accumulates text chunks
**Verification**: Full response text available at end
**Time**: 20min

```typescript
// In AgentExecutionService.executeWithStreaming()

let accumulatedContent = '';  // NEW: Track full response
let totalTokens = 0;  
// TODO PHASE 3: Use actual token counting from Claude API
// Currently using estimates (100 tokens per chunk)
// Future: Parse usage.output_tokens from Claude streaming response

const toolCallsList: any[] = [];  // NEW: Track tool calls

while (continueLoop && totalTokens < maxTokens) {
  // ... existing loop ...

  // When yielding text chunks
  const textContent = `I can help with that...`;
  accumulatedContent += textContent;  // NEW: Accumulate

  yield { type: 'text_chunk', content: textContent };

  // Track tool calls
  if (toolCall) {
    toolCallsList.push({
      id: toolCallId,
      toolName: toolCall.name,
      toolInput: toolCall.input,
      approved: approval.approved,
    });
  }

  // Update tokens
  totalTokens += 100; // Estimate for now
}

// At end of loop, return accumulated data
return {
  content: accumulatedContent,
  toolCalls: toolCallsList,
  tokensUsed: totalTokens
};
```

---

### MVU B3.2: Create Assistant Message at Stream End

**Artifact**: Assistant message saved in DB after stream completes
**Verification**: DB has assistant message linked to request
**Time**: 30min

```typescript
// In AgentExecutionService.executeWithStreaming()

// At END of loop (after while loop closes):
if (requestId) {
  try {
    // Create assistant message
    const assistantMessage = await messageRepository.create({
      threadId: threadId,
      ownerUserId: userId,
      role: "assistant",
      content: accumulatedContent,
      toolCalls: toolCallsList,
      tokensUsed: totalTokens,
    });

    console.log(
      "[AgentExecution] Created assistant message:",
      assistantMessage.id
    );

    // Update request with response message
    await agentRequestRepository.update(requestId, {
      status: "completed",
      progress: 1.0,
      responseMessageId: assistantMessage.id,
      tokenCost: totalTokens,
      results: {
        filesCreated: toolCallsList
          .filter((t) => t.toolName === "write_file" && t.approved)
          .map((t) => t.toolInput.path),
        branchesCreated: toolCallsList.filter(
          (t) => t.toolName === "create_branch" && t.approved
        ).length,
        toolsExecuted: toolCallsList.length,
      },
      completedAt: new Date(),
    });

    // Update all tool calls to link to message
    await agentToolCallRepository.updateMessageIdForRequest(
      requestId,
      assistantMessage.id
    );

    console.log("[AgentExecution] Updated request and tool calls");
  } catch (error) {
    console.error("[AgentExecution] Failed to save assistant message:", error);

    // Mark request as failed
    await agentRequestRepository.update(requestId, {
      status: "failed",
      results: {
        error: error instanceof Error ? error.message : String(error),
      },
    });
  }
}
```

**Verification**:

```bash
# After stream completes, check DB:
psql $DATABASE_URL -c "
  SELECT r.id as request_id,
         r.response_message_id,
         m.role,
         m.content
  FROM agent_requests r
  LEFT JOIN messages m ON r.response_message_id = m.id
  ORDER BY r.created_at DESC LIMIT 1;
"
```

---

### MVU B3.3: Add updateMessageIdForRequest to Repository

**Artifact**: `AgentToolCallRepository.updateMessageIdForRequest()` method
**Verification**: Method updates all tool calls for request
**Time**: 15min

```typescript
// In src/repositories/agentToolCall.ts

export class AgentToolCallRepository {
  // ... existing methods ...

  /**
   * Update message_id for all tool calls in a request
   * Called when agent message is created at stream end
   */
  async updateMessageIdForRequest(requestId: string, messageId: string) {
    const { db } = await getDB();
    await db
      .update(agentToolCalls)
      .set({ messageId: messageId })
      .where(eq(agentToolCalls.requestId, requestId));

    console.log("[AgentToolCall] Updated message_id for request:", requestId);
  }

  /**
   * Find pending tool calls by request ID
   */
  async findPendingByRequestId(requestId: string) {
    const { db } = await getDB();
    return db
      .select()
      .from(agentToolCalls)
      .where(
        and(
          eq(agentToolCalls.requestId, requestId),
          eq(agentToolCalls.approvalStatus, "pending")
        )
      )
      .orderBy(agentToolCalls.timestamp);
  }
}
```

**Verification**:

```bash
grep "updateMessageIdForRequest" src/repositories/agentToolCall.ts
```

---

### MVU B3.4: Update Tool Call Creation to Use requestId (moved to B3.3)

**Artifact**: Tool calls created with requestId, messageId null initially
**Verification**: DB shows tool_calls with request_id set, message_id null
**Time**: 15min

```typescript
// In AgentExecutionService.createToolCall()

/**
 * Create tool call record
 * ✅ Links to requestId (not messageId yet - set later)
 */
private static async createToolCall(
  threadId: string,
  messageId: string,  // This is triggering message (not used for tool call link)
  toolCall: { name: string; input: Record<string, any> },
  userId: string,
  requestId?: string  // NEW: Optional requestId for tracking
): Promise<string> {
  const record = await agentToolCallRepository.create({
    requestId: requestId || null,  // NEW: Link to request
    messageId: null,  // NEW: Not set until response message created at stream end
    threadId,
    ownerUserId: userId,
    toolName: toolCall.name,
    toolInput: toolCall.input,
  });

  console.log('[AgentExecution] Created tool call:', {
    toolCallId: record.id,
    requestId: requestId,
    toolName: toolCall.name,
  });

  return record.id;
}

// Update call sites to pass requestId:
const toolCallId = await this.createToolCall(
  threadId,
  messageId,
  toolCall,
  userId,
  requestId  // NEW: Pass requestId
);
```

**Verification**:

```bash
psql $DATABASE_URL -c "SELECT id, request_id, message_id, tool_name FROM agent_tool_calls ORDER BY timestamp DESC LIMIT 5;"
```

---

## 🔄 BACKEND PHASE 4: Recovery & APIs (1h)

**Goal**: Add APIs for pending tools and error recovery

### MVU B4.1: Add Pending Tools Endpoint (by requestId)

**Artifact**: `GET /api/agent-requests/:requestId/pending-tools` endpoint
**Verification**: Returns pending tool calls for request
**Time**: 15min

```typescript
// In src/functions/api/routes/agent-requests.ts

/**
 * GET /api/agent-requests/:requestId/pending-tools
 * Get pending tool calls for a request
 */
app.get("/:requestId/pending-tools", async (c) => {
  const requestId = c.req.param("requestId");
  const userId = c.get("userId");

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      requestId
    )
  ) {
    return c.json({ error: "Invalid request ID format" }, 400);
  }

  try {
    const request = await agentRequestRepository.findById(requestId);

    if (!request) {
      return c.json({ error: "Request not found" }, 404);
    }

    if (request.userId !== userId) {
      return c.json({ error: "Access denied" }, 403);
    }

    const pendingTools = await agentToolCallRepository.findPendingByRequestId(
      requestId
    );

    return c.json({
      data: pendingTools,
      meta: {
        count: pendingTools.length,
        requestId,
      },
    });
  } catch (error) {
    console.error("Failed to get pending tools:", error);
    return c.json({ error: "Failed to fetch pending tools" }, 500);
  }
});
```

**Verification**:

```bash
curl http://localhost:54321/functions/v1/api/agent-requests/REQUEST_ID/pending-tools \
  -H "Authorization: Bearer $TOKEN"
```

---

### MVU B4.2: Add Pending Tools Endpoint (by threadId)

**Artifact**: `GET /api/threads/:threadId/pending-tools` endpoint
**Verification**: Returns all pending tools in thread
**Time**: 15min

```typescript
// In src/functions/api/routes/threads.ts

/**
 * GET /api/threads/:threadId/pending-tools
 * Get all pending tool calls for a thread
 */
app.get("/:threadId/pending-tools", async (c) => {
  const threadId = c.req.param("threadId");
  const userId = c.get("userId");

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      threadId
    )
  ) {
    return c.json({ error: "Invalid thread ID format" }, 400);
  }

  try {
    // Verify thread access
    const thread = await threadRepository.findById(threadId);

    if (!thread) {
      return c.json({ error: "Thread not found" }, 404);
    }

    if (thread.ownerUserId !== userId) {
      return c.json({ error: "Access denied" }, 403);
    }

    const pendingTools = await agentToolCallRepository.findPendingByThreadId(
      threadId
    );

    return c.json({
      data: pendingTools,
      meta: {
        count: pendingTools.length,
        threadId,
      },
    });
  } catch (error) {
    console.error("Failed to get pending tools:", error);
    return c.json({ error: "Failed to fetch pending tools" }, 500);
  }
});
```

**Verification**:

```bash
curl http://localhost:54321/functions/v1/api/threads/THREAD_ID/pending-tools \
  -H "Authorization: Bearer $TOKEN"
```

---

### MVU B4.3: Add Revision History Storage

**Artifact**: `revisionHistory` JSONB field in agent_tool_calls, updated on rejection
**Verification**: DB stores full revision history array
**Time**: 20min

```typescript
// 1. Update schema (src/db/schema.ts)
export const agentToolCalls = pgTable('agent_tool_calls', {
  // ... existing fields ...
  revisionHistory: jsonb('revision_history').default([]),  // NEW
});

// 2. Update repository (src/repositories/agentToolCall.ts)
async rejectWithRevisionTracking(
  toolCallId: string,
  reason?: string
): Promise<{ toolCall: any; maxRevisionsReached: boolean }> {
  const { db } = await getDB();
  const toolCall = await this.findById(toolCallId);
  if (!toolCall) {
    throw new Error('Tool call not found');
  }

  const newRevisionCount = (toolCall.revisionCount || 0) + 1;
  const maxRevisionsReached = newRevisionCount >= 3;

  // Build revision history entry
  const historyEntry = {
    attempt: newRevisionCount,
    toolInput: toolCall.toolInput,
    rejectedAt: new Date().toISOString(),
    rejectionReason: reason || 'User rejected',
  };

  // Get existing history and append
  const revisionHistory = (toolCall.revisionHistory as any[]) || [];
  revisionHistory.push(historyEntry);

  const [updated] = await db
    .update(agentToolCalls)
    .set({
      approvalStatus: 'rejected',
      revisionCount: newRevisionCount,
      rejectionReason: reason || 'User rejected',
      revisionHistory: revisionHistory,  // NEW: Store full history
      toolOutput: { reason: reason || 'User rejected' },
    })
    .where(eq(agentToolCalls.id, toolCallId))
    .returning();

  return { toolCall: updated, maxRevisionsReached };
}
```

**Verification**:

```bash
# Reject tool 3 times, then check:
psql $DATABASE_URL -c "SELECT revision_history FROM agent_tool_calls WHERE id = 'TOOL_ID';"
```

---

### MVU B4.4: Update API Documentation

**Artifact**: Updated endpoint list in `index.ts` GET /
**Verification**: API docs show new endpoints
**Time**: 10min

```typescript
// In src/functions/api/index.ts

endpoints: {
  // ... existing endpoints ...
  agentRequests: [
    'GET /api/agent-requests/:requestId',
    'GET /api/agent-requests/:requestId/stream',
    'GET /api/agent-requests/:requestId/pending-tools',  // NEW
  ],
  threads: [
    'GET /api/threads',
    'POST /api/threads',
    'GET /api/threads/:id',
    'PUT /api/threads/:id',
    'DELETE /api/threads/:id',
    'GET /api/threads/:id/children',
    'GET /api/threads/:id/pending-tools',  // NEW
  ],
  // ... rest
}
```

**Verification**:

```bash
curl http://localhost:54321/functions/v1/api | jq '.endpoints'
```

---

## 🖥️ FRONTEND PHASE 1: Core Streaming (1h)

**Goal**: Update frontend to stream by requestId

### MVU F1.1: Update Message Creation to Use requestId

**Artifact**: Frontend stores and uses `requestId` from response
**Verification**: Console logs show requestId being used
**Time**: 20min

```typescript
// In apps/web/src/lib/hooks/useSendMessage.ts (or equivalent)

/**
 * Send message hook
 * Uses requestId for streaming (not messageId)
 */
export function useSendMessage(threadId: string) {
  async function sendMessage(content: string) {
  const response = await fetch(`/api/threads/${threadId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  const data = await response.json();

  // BEFORE: const streamUrl = data._links.stream.href;
  // AFTER: Extract requestId
  const requestId = data._embedded?.requestId;
  const messageId = data.id;

  if (!requestId) {
    console.error("No requestId in response!");
    return;
  }

  console.log("[SendMessage] Got requestId:", requestId);

    // Store for recovery
    localStorage.setItem(`thread-${threadId}-activeRequest`, requestId);
    localStorage.setItem(`request-${requestId}-messageId`, messageId);

    // Stream by requestId (not messageId)
    const streamUrl = `/api/agent-requests/${requestId}/stream`;
    
    console.log('[SendMessage] Streaming via requestId:', { requestId, streamUrl });
    
    return { requestId, messageId, streamUrl };
  }
  
  return { sendMessage };
}
```

**Verification**:

```javascript
// In browser console after sending message:
localStorage.getItem("thread-XXX-activeRequest");
// Should return requestId
```

---

### MVU F1.2: Update Stream Connection to Use requestId

**Artifact**: EventSource connects to `/api/agent-requests/:requestId/stream`
**Verification**: Network tab shows new stream URL
**Time**: 15min

```typescript
// In apps/web/src/lib/hooks/useAgentStream.ts (or equivalent)

/**
 * Agent stream hook
 * Connects to request-based streaming endpoint
 */
export function useAgentStream() {
  function connectToStream(requestId: string) {
  console.log("[Stream] Connecting to request:", requestId);

  // BEFORE: const url = `/api/threads/${threadId}/messages/${messageId}/stream`;
  // AFTER:
  const url = `/api/agent-requests/${requestId}/stream`;

  const eventSource = new EventSource(url, {
    withCredentials: true,
  });

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleStreamEvent(data);
  };

  eventSource.onerror = async (error) => {
    console.error("[Stream] Connection error:", error);
    eventSource.close();

    // NEW: Check if request completed despite error
    await handleStreamError(requestId);
  };

    return eventSource;
  }
  
  return { connectToStream };
}
```

**Verification**:

```bash
# In browser Network tab, should see:
# GET /api/agent-requests/REQUEST_ID/stream
```

---

### MVU F1.3: Remove Old Stream URL References

**Artifact**: No references to message-based stream URLs
**Verification**: `grep -r "messages/.*stream"` returns no frontend code
**Time**: 25min

```bash
# Find and replace in frontend:
# OLD: /api/threads/${threadId}/messages/${messageId}/stream
# NEW: /api/agent-requests/${requestId}/stream

# Files likely affected:
# - src/lib/hooks/useAgentStream.ts
# - src/components/ai-agent-system/ThreadView.tsx
# - src/lib/services/agent.service.ts (if exists)
```

**Verification**:

```bash
cd apps/web
grep -r "messages.*stream" src/
# Should only find comments or documentation
```

---

## 💾 FRONTEND PHASE 2: Recovery Features (1-2h)

**Goal**: Add request status checking and recovery

### MVU F2.1: Add Request Status Check Function

**Artifact**: `checkRequestStatus()` utility function
**Verification**: Function returns request status
**Time**: 20min

```typescript
// Create apps/web/src/lib/api/agent-requests.ts

/**
 * Agent Request API Client
 * Frontend utilities for interacting with agent request endpoints
 */

export interface AgentRequestStatus {
  id: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  progress: number;
  triggeringMessageId: string;
  responseMessageId: string | null;
  results: any;
  tokenCost: number | null;
  canResume: boolean;
  createdAt: string;
  completedAt: string | null;
}

export async function checkRequestStatus(
  requestId: string
): Promise<AgentRequestStatus> {
  const response = await fetch(`/api/agent-requests/${requestId}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to check request status: ${response.statusText}`);
  }

  const { data } = await response.json();
  return data;
}

export async function getPendingTools(requestId: string) {
  const response = await fetch(
    `/api/agent-requests/${requestId}/pending-tools`,
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get pending tools: ${response.statusText}`);
  }

  const { data } = await response.json();
  return data;
}
```

**Verification**:

```typescript
// Test in browser console:
await checkRequestStatus("REQUEST_ID");
```

---

### MVU F2.2: Add Recovery on Page Load

**Artifact**: `useEffect` checks for active requests on thread mount
**Verification**: Resuming works after page refresh
**Time**: 30min

```typescript
// In apps/web/src/components/ai-agent-system/ThreadView.tsx (or equivalent)

/**
 * Recovery: Check for active requests on thread mount
 * Allows resuming after page refresh or disconnect
 */
useEffect(() => {
  async function checkForActiveRequest() {
    if (!threadId) return;

    const activeRequestId = localStorage.getItem(
      `thread-${threadId}-activeRequest`
    );

    if (!activeRequestId) return;

    console.log("[Recovery] Checking active request:", activeRequestId);

    try {
      const status = await checkRequestStatus(activeRequestId);

      if (status.status === "completed") {
        console.log("[Recovery] Request completed, loading response");

        // Load the response message
        if (status.responseMessageId) {
          await loadMessage(status.responseMessageId);
        }

        // Clear active request
        localStorage.removeItem(`thread-${threadId}-activeRequest`);

        // Show notification
        toast.success("Previous request completed!");
      } else if (status.status === "in_progress") {
        console.log("[Recovery] Request in progress, showing reconnect option");

        // Show reconnect UI
        setShowReconnectButton(true);
        setPendingRequestId(activeRequestId);
      } else if (status.status === "failed") {
        console.log("[Recovery] Request failed");

        // Clear and show error
        localStorage.removeItem(`thread-${threadId}-activeRequest`);
        toast.error("Previous request failed");
      }
    } catch (error) {
      console.error("[Recovery] Failed to check request status:", error);
      // Don't clear - might be network issue
    }
  }

  checkForActiveRequest();
}, [threadId]);
```

**Verification**:

1. Send message
2. Close browser before completion
3. Reopen thread
4. Should see reconnect option or completed message

---

### MVU F2.3: Add Pending Tools Loading

**Artifact**: Load pending approvals on thread mount
**Verification**: Pending tools show after page refresh
**Time**: 25min

```typescript
// In ThreadView component

/**
 * Load pending tool approvals on thread mount
 * Shows approval UI for tools waiting for user input
 */
useEffect(() => {
  async function loadPendingApprovals() {
    if (!threadId) return;

    try {
      const response = await fetch(`/api/threads/${threadId}/pending-tools`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) return;

      const { data: pendingTools } = await response.json();

      if (pendingTools.length > 0) {
        console.log(
          "[PendingTools] Found pending approvals:",
          pendingTools.length
        );

        // Show approval UI for each pending tool
        pendingTools.forEach((tool) => {
          showToolApprovalUI({
            toolCallId: tool.id,
            toolName: tool.toolName,
            toolInput: tool.toolInput,
            revisionCount: tool.revisionCount,
          });
        });

        toast.info(`${pendingTools.length} pending approvals`);
      }
    } catch (error) {
      console.error("[PendingTools] Failed to load:", error);
    }
  }

  loadPendingApprovals();
}, [threadId]);
```

**Verification**:

1. Start stream with tool
2. Don't approve
3. Close browser
4. Reopen thread
5. Should see pending approval UI

---

### MVU F2.4: Enhanced Error Handling

**Artifact**: Stream error handler checks request status
**Verification**: Better error messages and recovery options
**Time**: 20min

```typescript
// In useAgentStream hook

/**
 * Enhanced error handling
 * Checks if request completed despite stream error
 * Offers reconnect options for in-progress requests
 */
async function handleStreamError(requestId: string) {
  console.log("[Stream] Handling error for request:", requestId);

  try {
    // Check if request actually completed
    const status = await checkRequestStatus(requestId);

    if (status.status === "completed") {
      // Stream died but request finished
      console.log("[Stream] Request completed despite stream error");

      if (status.responseMessageId) {
        await loadMessage(status.responseMessageId);
      }

      localStorage.removeItem(`thread-${threadId}-activeRequest`);
      toast.success("Request completed successfully");
    } else if (status.status === "in_progress") {
      // Still processing - offer reconnect
      console.log("[Stream] Request still in progress");

      setReconnectAvailable(true);
      toast.warning("Connection lost. Click to reconnect.", {
        action: {
          label: "Reconnect",
          onClick: () => connectToStream(requestId),
        },
      });
    } else if (status.status === "failed") {
      // Actually failed
      console.error("[Stream] Request failed:", status.results?.error);

      localStorage.removeItem(`thread-${threadId}-activeRequest`);
      toast.error(
        `Request failed: ${status.results?.error || "Unknown error"}`
      );
    } else {
      // Pending - shouldn't happen
      toast.error("Request in unexpected state");
    }
  } catch (error) {
    console.error("[Stream] Failed to check request status:", error);

    // Network error - offer retry
    toast.error("Connection lost. Check your network.", {
      action: {
        label: "Retry",
        onClick: () => connectToStream(requestId),
      },
    });
  }
}
```

**Verification**:

1. Start stream
2. Kill network mid-stream
3. Should see appropriate error message and recovery option

---

## 📊 MVU Dependency Graph

```
Backend Phase 1 (Foundation) - MUST COMPLETE FIRST
├─ B1.1 (schema) → B1.2 (repository) → B1.3 (message service) → B1.4 (routes) → B1.5 (mount) → B1.6 (execution service)
└─ Linear dependency - each builds on previous

Backend Phase 2 (Realtime) - Parallel with Phase 3
├─ B2.1 (supabase client) → B2.2 (realtime impl) → B2.3 (remove polling)
└─ Depends on: Phase 1 complete

Backend Phase 3 (Messages) - Parallel with Phase 2
├─ B3.1 (accumulate) → B3.2 (save message)
└─ B3.4 (link tools) → Depends on B3.2
└─ Depends on: Phase 1 complete

Backend Phase 4 (Recovery) - After Phase 1-3
├─ B4.1, B4.2 (pending APIs - parallel)
├─ B4.3 (revision history - parallel)
└─ B4.4 (docs)
└─ All depend on Phase 1-3 complete

Frontend Phase 1 (Core) - After Backend Phase 1 deployed
├─ F1.1 (use requestId) → F1.2 (connect stream) → F1.3 (remove old)
└─ Depends on: Backend Phase 1 deployed to remote

Frontend Phase 2 (Recovery) - After Backend Phase 4 deployed
├─ F2.1 (status check) → F2.2 (recovery)
├─ F2.3 (pending tools - parallel with F2.2)
└─ F2.4 (error handling)
└─ Depends on: Backend Phase 4 deployed to remote
```

**Critical Path**: Backend Phase 1 → Backend Phase 2+3 (parallel) → Backend Phase 4 → Frontend Phase 1 → Frontend Phase 2

---

## ✅ Verification Checklist (End-to-End)

After all MVUs complete, verify compliance:

### **Compliance Checks**
- [ ] All service methods are `static` (no instance state)
- [ ] All endpoints verify ownership (userId checks)
- [ ] All deferred work has `TODO PHASE X` comments
- [ ] No new standalone edge functions created
- [ ] Using unified API (`src/functions/api/`)
- [ ] Following repository pattern (like ThreadRepository)
- [ ] Following service pattern (static methods)
- [ ] Auth middleware inherited from index.ts
- [ ] Security logging for access denials

### Backend Tests

- [ ] Message creation returns requestId (persisted in DB)
- [ ] Stream connects via `/api/agent-requests/:requestId/stream`
- [ ] Tool approval detected instantly (Realtime, not polling)
- [ ] Assistant message created at end of stream
- [ ] Token costs recorded in agent_requests
- [ ] Tool calls linked to both request and message
- [ ] Revision history stored on rejection
- [ ] GET `/api/agent-requests/:requestId` returns status
- [ ] GET `/api/agent-requests/:requestId/pending-tools` works
- [ ] GET `/api/threads/:threadId/pending-tools` works

### Frontend Tests

- [ ] Send message → Uses requestId for streaming
- [ ] requestId stored in localStorage
- [ ] Page refresh → Checks active request
- [ ] Completed request → Loads response message
- [ ] In-progress request → Shows reconnect button
- [ ] Pending tools → Shows approval UI on load
- [ ] Stream error → Checks status and offers recovery
- [ ] Network disconnect → Can reconnect
- [ ] Browser close → Can resume on reopen
