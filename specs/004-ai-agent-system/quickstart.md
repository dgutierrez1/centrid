# Quickstart Guide: AI Agent Execution System

**Feature**: 004-ai-agent-system
**Prerequisites**: Node.js 20+, npm, Supabase CLI, Docker (for local Supabase - optional)
**Estimated Time**: 30-45 minutes for basic setup

## Overview

This guide walks you through implementing the AI Agent Execution System. The system uses **Claude Agent SDK** for automatic orchestration, web search, and context management, with custom MCP tools for document operations.

**Key Components**:
1. **Database Schema** - 11 tables with pgvector for semantic search
2. **Edge Function** - Single `execute-agent` endpoint using Claude Agent SDK
3. **MCP Tools** - Custom document operations (read, update, search, create)
4. **Frontend** - Three-layer architecture (Service → Hooks → Components)

---

## Step 1: Set Up Dependencies

### Install Claude Agent SDK

```bash
cd apps/api
npm install @anthropic-ai/agent-sdk
```

### Install OpenAI SDK (for embeddings)

```bash
npm install openai
```

### Install Drizzle ORM (database)

```bash
npm install drizzle-orm postgres
npm install -D drizzle-kit
```

---

## Step 2: Configure Environment Variables

### Backend Environment (`apps/api/.env`)

```bash
# Supabase (Remote)
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-X-XX-X.pooler.supabase.com:5432/postgres"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# AI APIs
ANTHROPIC_API_KEY="sk-ant-..."
OPENAI_API_KEY="sk-..."

# Optional: Enable Edge Function secrets in Supabase Dashboard
# Settings → Edge Functions → Add Secret
# - ANTHROPIC_API_KEY
# - OPENAI_API_KEY
# - DATABASE_URL (use port 6543 for Edge Functions)
```

**Important**:
- Local `.env` uses port 5432 (session mode) for `db:push`
- Edge Functions use port 6543 (transaction mode) - configure in Supabase Dashboard → Secrets

---

## Step 3: Create Database Schema

### Define Schema (`apps/api/src/db/schema.ts`)

```typescript
import { pgTable, uuid, text, timestamp, integer, jsonb, real, boolean, vector } from 'drizzle-orm/pg-core';

// Example: chat_sessions table
export const chatSessions = pgTable('chat_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  direction_embedding: vector('direction_embedding', { dimensions: 768 }),
  last_activity_at: timestamp('last_activity_at').notNull().defaultNow(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

// See data-model.md for complete schema with all 11 tables
```

### Push Schema to Remote Supabase

```bash
cd apps/api
npm run db:drop    # Drop existing tables (MVP iteration only - destructive!)
npm run db:push    # Push schema + apply triggers/RLS/foreign keys
```

**Verify**: Check Supabase Dashboard → Table Editor to confirm tables exist

---

## Step 4: Implement MCP Tools

### Create MCP Tools Service (`apps/api/src/services/mcpTools.ts`)

```typescript
import * as documentRepo from '../repositories/documentRepository';

/**
 * MCP Tool: read_document
 */
export async function read_document(file_path: string, user_id: string) {
  const document = await documentRepo.findByPath(file_path, user_id);

  if (!document) {
    return { error: 'Document not found or unauthorized' };
  }

  return {
    file_path: document.file_path,
    content: document.content_text,
    last_modified: document.updated_at,
    last_edit_by: document.last_edit_by,
  };
}

/**
 * MCP Tool: search_documents
 */
export async function search_documents(query: string, user_id: string, limit = 10) {
  const results = await embeddingRepo.searchSimilar(query, user_id, limit);

  return results.map(r => ({
    file_path: r.file_path,
    snippet: r.content.slice(0, 200),
    similarity: r.similarity,
  }));
}

// Implement update_document, create_document similarly
// See research.md Item 3 for complete implementation
```

---

## Step 5: Implement Agent Service

### Create Agent Service (`apps/api/src/services/agentService.ts`)

```typescript
import { Agent } from '@anthropic-ai/agent-sdk';
import { read_document, search_documents, update_document, create_document } from './mcpTools';

export async function sendMessageAndExecuteAgent(
  text: string,
  chat_id: string,
  context_references: ContextReference[],
  user_id: string
) {
  // 1. Create user chat_messages record
  const message = await chatRepository.createMessage({
    chat_id,
    user_id,
    role: 'user',
    content: text,
  });

  // 2. Persist context_references to database (UPSERT, enables cross-device sync)
    // If none exist it might mean some were removed.

    await contextRepository.upsertReferences({
      chat_id,
      user_id,
      references: context_references.map(ref => ({
        ...ref,
        is_active: true,
      })),
    });
    // ^ This INSERT/UPDATE triggers Realtime broadcast → three-way merge on other devices
  
  // 3. Create linked agent_requests record with snapshot
  const agentRequest = await agentRepository.createRequest({
    chat_id,
    user_id,
    user_message: text,
    context_references_snapshot: context_references, // Frozen audit trail
    status: 'pending',
  });

  // 4. Build context from context references + chat history
  const context = await buildContextFromReferences(context_references, chat_id, user_id);

  // Create agent with custom MCP tools
  const agent = new Agent({
    model: 'claude-sonnet-4-5-20250929',

    // Enable automatic context management
    compact: true,

    // Built-in + custom tools
    allowed_tools: [
      'WebSearch',          // Built-in web search
      'WebFetch',           // Built-in URL fetch
      'read_document',      // Custom MCP tool
      'update_document',    // Custom MCP tool
      'search_documents',   // Custom MCP tool
      'create_document',    // Custom MCP tool
    ],

    // System prompt with user preferences
    system: await buildSystemPrompt(user_id),
  });

  // Register custom MCP tools
  agent.registerTool('read_document', {
    description: 'Read document content from filesystem',
    input_schema: {
      type: 'object',
      properties: {
        file_path: { type: 'string', description: 'Path to file' },
      },
      required: ['file_path'],
    },
    handler: async (input) => read_document(input.file_path, user_id),
  });

  agent.registerTool('search_documents', {
    description: 'Search documents using semantic similarity',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        limit: { type: 'number', description: 'Max results', default: 10 },
      },
      required: ['query'],
    },
    handler: async (input) => search_documents(input.query, user_id, input.limit),
  });

  // Register update_document, create_document similarly...

  // 5. Execute agent (SDK handles orchestration, context management, web search)
  // NOTE: This is async - agent execution continues in background
  executeAgentInBackground(agent, agentRequest.id, context);

  // 6. Return immediately with SSE endpoint
  return {
    message_id: message.id,
    request_id: agentRequest.id,
    sse_endpoint: `/agent-requests/${agentRequest.id}/stream`,
    status: 'pending',
  };
}

// Note: Context persistence happens in step 2 above. The context_references
// are written to the database with is_active = true, which triggers Realtime
// broadcast. Other devices receive the update and perform three-way merge
// to handle concurrent changes from multiple sessions.

// Background agent execution with SSE streaming
async function executeAgentInBackground(agent: Agent, request_id: string, context: Context) {
  // Update status to processing
  await agentRepository.updateStatus(request_id, 'processing');

  try {
    // Execute agent (SDK handles orchestration)
    const response = await agent.run({
      messages: context.chatHistory,
      context: context.contextString,
      onToolCall: async (toolCall) => {
        // Stream via SSE AND write to agent_interactions table
        await trackAndStreamToolCall(request_id, toolCall);
      },
    });

    // Update request with final response
    await agentRepository.updateRequest(request_id, {
      agent_response: response.content,
      status: 'completed',
      confidence_score: response.metadata?.confidence || 0.8,
      completed_at: new Date(),
    });

    // Stream completion event via SSE
    streamSSE(request_id, { type: 'completion', status: 'completed' });

  } catch (error) {
    // Update request with error
    await agentRepository.updateRequest(request_id, {
      status: 'failed',
      error_message: error.message,
      completed_at: new Date(),
    });

    streamSSE(request_id, { type: 'error', error: error.message });
  }
}

async function trackAndStreamToolCall(request_id: string, toolCall: ToolCall) {
  // 1. Stream via SSE (primary session - lowest latency)
  streamSSE(request_id, {
    type: 'tool_call',
    tool_name: toolCall.name,
    status: 'running',
    description: toolCall.description,
    target_file: toolCall.input?.file_path,
    sequence_order: toolCall.sequence,
  });

  // 2. Write to agent_interactions table (secondary sessions via Realtime)
  await agentInteractionsRepository.create({
    agent_request_id: request_id,
    tool_name: toolCall.name,
    tool_input: toolCall.input,
    status: 'running',
    sequence_order: toolCall.sequence,
  });
  // ^ This INSERT triggers Realtime broadcast to all secondary sessions
}
```

**Note**: The Claude Agent SDK automatically tracks all tool calls internally. In production, create `agent_interactions` records for each tool call (read_document, update_document, web_search, etc.) for:
- Complete audit trail (see DECISIONS.md Section 6)
- Conflict detection (query pending file operations)
- Web search result storage (tool_output field)
- Message-level traceability (link tool calls to specific messages)

Example agent_interactions record for web_search:
```typescript
{
  agent_request_id: request.id,
  message_id: message.id,
  tool_name: 'web_search',
  tool_input: { query: 'React best practices', limit: 5 },
  tool_output: { results: [...], sources: [...] },
  status: 'completed',
  sequence_order: 1,
}
```

---

## Step 6: Create Edge Function

### Create Edge Function (`apps/api/src/functions/chats-messages/index.ts`)

```typescript
import { createClient } from '@supabase/supabase-js';
import { sendMessageAndExecuteAgent } from '../../services/agentService';
import { validateRequest } from '../../middleware/validation';
import { verifyAuth } from '../../middleware/auth';

Deno.serve(async (req) => {
  // CORS handling
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Extract chat_id from URL path: /chats/:chat_id/messages
    const url = new URL(req.url);
    const pathMatch = url.pathname.match(/^\/chats\/([^/]+)\/messages$/);

    if (!pathMatch) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const chat_id = pathMatch[1]; // Extract from URL (RESTful)

    // Verify authentication
    const user = await verifyAuth(req);

    // Parse and validate request body
    const body = await req.json();
    const validated = validateRequest(body, chatMessageSchema);

    // Send message and execute agent (unified flow)
    const result = await sendMessageAndExecuteAgent(
      validated.text,
      chat_id, // From URL, not body
      validated.context_references || [],
      user.id
    );

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.status || 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

### Register Functions in config.toml (`apps/api/supabase/config.toml`)

```toml
# Unified message + agent endpoint
[functions.chat-messages]
entrypoint = '../src/functions/chat-messages/index.ts'
import_map = '../import_map.json'

# SSE streaming endpoint (separate function for real-time progress)
[functions.agent-requests-stream]
entrypoint = '../src/functions/agent-requests-stream/index.ts'
import_map = '../import_map.json'
```

### Deploy Functions

```bash
cd apps/api
npm run deploy:function chat-messages
npm run deploy:function agent-requests-stream
```

---

## Step 7: Implement Frontend Service Layer

### Create Chat Service (`apps/web/src/lib/services/chatService.ts`)

```typescript
import { supabase } from '@/lib/supabase';

export async function sendMessage(
  chatId: string,
  text: string,
  contextReferences: ContextReference[]
): Promise<{ data?: MessageResponse; error?: Error }> {
  try {
    // RESTful unified endpoint: /chats/:chat_id/messages
    // Sends message AND executes agent in one call
    const { data, error } = await supabase.functions.invoke(`chats/${chatId}/messages`, {
      body: {
        text, // chat_id comes from URL
        context_references: contextReferences,
      },
    });

    if (error) throw error;

    // Returns: { message_id, request_id, sse_endpoint, status }
    // Context references are now persisted to database (enables cross-device sync)
    return { data };
  } catch (error) {
    return { error };
  }
}
```

### Create SSE Subscription Hook (`apps/web/src/lib/hooks/useAgentProgress.ts`)

```typescript
import { useEffect } from 'react';
import { useSnapshot } from 'valtio';
import { agentState, actions } from '../state/agentState';

export function useAgentProgress(requestId: string | null, sseEndpoint: string | null) {
  useEffect(() => {
    if (!requestId || !sseEndpoint) return;

    // Primary session: Subscribe to SSE for lowest latency
    const eventSource = new EventSource(
      `${supabaseUrl}${sseEndpoint}`,
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    eventSource.onmessage = (event) => {
      const toolCall = JSON.parse(event.data);

      // Update agentState with tool call progress
      actions.addToolCall(requestId, toolCall);

      // Handle completion
      if (toolCall.type === 'completion') {
        eventSource.close();
        actions.updateRequestStatus(requestId, 'completed');
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.close();
      actions.updateRequestStatus(requestId, 'failed');
    };

    return () => {
      eventSource.close();
    };
  }, [requestId, sseEndpoint]);
}
```

### Create Valtio State with Three-Way Merge (`apps/web/src/lib/state/chatState.ts`)

```typescript
import { proxy } from 'valtio';

export const chatState = proxy({
  chats: {} as Record<string, Chat>,

  // Three-way merge states
  localContextReferences: {} as Record<string, ContextReference[]>,   // User's current selection
  serverContextReferences: {} as Record<string, ContextReference[]>,  // Last known server state (baseline)
});

// Helper: Calculate diff between two reference lists
function diffReferences(
  base: ContextReference[],
  current: ContextReference[]
): { added: ContextReference[]; removed: string[] } {
  const baseIds = new Set(base.map(r => r.id));
  const currentIds = new Set(current.map(r => r.id));

  const added = current.filter(r => !baseIds.has(r.id));
  const removed = Array.from(baseIds).filter(id => !currentIds.has(id));

  return { added, removed };
}

// Helper: Apply changes to a reference list
function applyChanges(
  base: ContextReference[],
  changes: { added: ContextReference[]; removed: string[] }
): ContextReference[] {
  // Start with base
  let result = [...base];

  // Apply removals
  result = result.filter(r => !changes.removed.includes(r.id));

  // Apply additions (dedupe by id)
  const existingIds = new Set(result.map(r => r.id));
  for (const ref of changes.added) {
    if (!existingIds.has(ref.id)) {
      result.push(ref);
      existingIds.add(ref.id);
    }
  }

  return result;
}

export const actions = {
  // Initialize references for a chat (from database)
  initializeContextReferences(chatId: string, references: ContextReference[]) {
    chatState.localContextReferences[chatId] = [...references];
    chatState.serverContextReferences[chatId] = [...references]; // Set baseline
  },

  // Add reference (local change)
  addContextReference(chatId: string, reference: ContextReference) {
    if (!chatState.localContextReferences[chatId]) {
      chatState.localContextReferences[chatId] = [];
    }
    chatState.localContextReferences[chatId].push(reference);
    // Don't update server state - it's the baseline
  },

  // Remove reference (local change)
  removeContextReference(chatId: string, referenceId: string) {
    if (chatState.localContextReferences[chatId]) {
      chatState.localContextReferences[chatId] =
        chatState.localContextReferences[chatId].filter(r => r.id !== referenceId);
    }
  },

  // Merge remote update (three-way merge)
  mergeRemoteContextReferences(chatId: string, remoteReferences: ContextReference[]) {
    const localState = chatState.localContextReferences[chatId] || [];
    const serverState = chatState.serverContextReferences[chatId] || [];

    // Calculate changes
    const localChanges = diffReferences(serverState, localState);
    const remoteChanges = diffReferences(serverState, remoteReferences);

    // Merge: Start with remote, apply local changes
    let merged = applyChanges(remoteReferences, localChanges);

    // Handle conflicts: If same reference was removed remotely and added locally, remove wins
    const remoteRemovedIds = new Set(remoteChanges.removed);
    merged = merged.filter(r => !remoteRemovedIds.has(r.id));

    // Update states
    chatState.serverContextReferences[chatId] = [...remoteReferences]; // New baseline
    chatState.localContextReferences[chatId] = merged; // Merged result
  },

  // Sync local state to server (after user action)
  async syncContextReferencesToServer(chatId: string) {
    const localState = chatState.localContextReferences[chatId] || [];

    // Send to server
    await supabase
      .from('context_references')
      .upsert(localState.map(ref => ({ ...ref, chat_id: chatId, is_active: true })));

    // Update server baseline
    chatState.serverContextReferences[chatId] = [...localState];
  },
};
```

### Create Custom Hook (`apps/web/src/lib/hooks/useChatMessage.ts`)

```typescript
import { useState } from 'react';
import { sendMessage as sendMessageService } from '../services/chatService';
import { useSnapshot } from 'valtio';
import { chatState, agentState, actions } from '../state/chatState';
import toast from 'react-hot-toast';
import { useAgentProgress } from './useAgentProgress';

export function useChatMessage(chatId: string) {
  const [loading, setLoading] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [sseEndpoint, setSseEndpoint] = useState<string | null>(null);
  const snap = useSnapshot(chatState);

  // Subscribe to SSE progress (primary session)
  useAgentProgress(currentRequestId, sseEndpoint);

  const sendMessage = async (text: string) => {
    setLoading(true);

    // Optimistic update - add user message
    const tempMessageId = `temp-${Date.now()}`;
    actions.addMessage(chatId, {
      id: tempMessageId,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    });

    try {
      // Get current context references (user's local draft state)
      const contextReferences = snap.localContextReferences[chatId] || [];

      // Call unified endpoint (sends message AND executes agent)
      const { data, error } = await sendMessageService(chatId, text, contextReferences);

      if (error) throw error;

      // data: { message_id, request_id, sse_endpoint, status }

      // Replace temp message with real message
      actions.replaceMessage(chatId, tempMessageId, {
        id: data.message_id,
        role: 'user',
        content: text,
        created_at: new Date().toISOString(),
      });

      // Set up SSE subscription for agent progress
      setCurrentRequestId(data.request_id);
      setSseEndpoint(data.sse_endpoint);

      // Agent response will come via SSE stream (useAgentProgress hook)
      toast.success('Message sent');

    } catch (error) {
      // Rollback optimistic update
      actions.removeMessage(chatId, tempMessageId);
      toast.error(`Error sending message: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return { sendMessage, loading, isAgentProcessing: !!currentRequestId };
}
```

---

## Step 8: Test the Flow

### Test Script (`apps/api/test-unified-flow.ts`)

```typescript
import { sendMessageAndExecuteAgent } from './src/services/agentService';

async function test() {
  const contextReferences = [
    { reference_type: 'file', source_reference: 'research/notes.md' }
  ];

  // Unified flow: sends message AND executes agent
  const result = await sendMessageAndExecuteAgent(
    'what are the main themes in my research notes?',
    'test-chat-id',
    contextReferences,
    'test-user-id'
  );

  console.log('Message ID:', result.message_id);
  console.log('Request ID:', result.request_id);
  console.log('SSE Endpoint:', result.sse_endpoint);
  console.log('Status:', result.status);

  // To test SSE streaming, you would:
  // 1. Subscribe to the SSE endpoint
  // 2. Listen for tool_call events
  // 3. Wait for completion event
}

test();
```

### Run Test

```bash
cd apps/api
npx tsx test-unified-flow.ts
```

---

## Step 9: Real-time Subscriptions

### Setup Real-time Provider (`apps/web/src/components/providers/ChatProvider.tsx`)

```typescript
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { actions, chatState, agentState } from '@/lib/state/chatState';

export function ChatProvider({ children, userId }) {
  useEffect(() => {
    // 1. Subscribe to chat messages (from other sessions)
    const messagesSubscription = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Add message from secondary session
          actions.addMessage(payload.new.chat_id, payload.new);
        }
      )
      .subscribe();

    // 2. Subscribe to agent_interactions (for secondary sessions)
    const interactionsSubscription = supabase
      .channel('agent_interactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_interactions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Secondary session receives tool calls via Realtime
          // (Primary session gets same data via SSE)
          const toolCall = {
            type: 'tool_call',
            tool_name: payload.new.tool_name,
            status: payload.new.status,
            description: payload.new.description,
            target_file: payload.new.tool_input?.file_path,
            sequence_order: payload.new.sequence_order,
          };

          // Update agentState with tool call
          actions.addToolCall(payload.new.agent_request_id, toolCall);
        }
      )
      .subscribe();

    // Subscribe to context references (cross-device sync with three-way merge)
    const referencesSubscription = supabase
      .channel('context_references')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'context_references',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const chatId = payload.new?.chat_id || payload.old?.chat_id;

          // Fetch current remote state from database
          const { data: remoteReferences } = await supabase
            .from('context_references')
            .select('*')
            .eq('chat_id', chatId)
            .eq('is_active', true);

          // Perform three-way merge (handles concurrent additions/removals from multiple devices)
          actions.mergeRemoteContextReferences(chatId, remoteReferences || []);
        }
      )
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
      interactionsSubscription.unsubscribe();
      referencesSubscription.unsubscribe();
    };
  }, [userId]);

  return <>{children}</>;
}
```

**Cross-Session Visibility Pattern**:
- **Primary session** (where message was sent): Subscribes to SSE via `useAgentProgress` hook (lowest latency)
- **Secondary sessions** (other tabs/devices): Subscribe to `agent_interactions` via Realtime (above code)
- **Result**: All sessions see identical progress with same data structure
- **Why hybrid?**: SSE has lower latency (no database write delay), Realtime reuses existing WebSocket connection

**Context Persistence & Sync**:
- When user sends message, `POST /chats/:chat_id/messages` persists context_references to database
- Database INSERT/UPDATE triggers Realtime broadcast to all subscribed sessions
- Each session performs three-way merge: `mergeRemoteContextReferences(chatId, remoteReferences)`
- Result: Context pills stay in sync across all devices, concurrent changes merged intelligently



---

## Development Workflow

### Typical Development Loop

1. **Update Schema**: Edit `apps/api/src/db/schema.ts`
2. **Push Changes**: `npm run db:push` from `apps/api/`
3. **Update Repositories**: Add new queries to `apps/api/src/repositories/`
4. **Update Services**: Modify business logic in `apps/api/src/services/`
5. **Deploy Edge Functions**: `npm run deploy:functions` from `apps/api/`
6. **Test Frontend**: `npm run web:dev` from root
7. **Iterate**: Repeat as needed

### Common Commands

```bash
# Backend (run from apps/api/)
npm run db:drop            # Drop all tables (MVP iteration)
npm run db:push            # Push schema to remote
npm run deploy:functions   # Deploy all Edge Functions
npm run deploy:function <name>  # Deploy single function

# Frontend (run from root)
npm run dev                # Start all apps
npm run web:dev            # Start main app only
npm run type-check         # TypeScript check

# Testing (when added post-MVP)
npm test                   # Run all tests
npm run test:watch         # Watch mode
```

---

## Troubleshooting

### Issue: Database connection fails

**Solution**: Verify `DATABASE_URL` in `apps/api/.env` uses port 5432 (session mode) and password is URL-encoded

### Issue: Edge Function deployment fails

**Solution**: Ensure function is declared in `apps/api/supabase/config.toml` with correct entrypoint and import_map

### Issue: Claude Agent SDK errors

**Solution**: Verify `ANTHROPIC_API_KEY` is set in Supabase Dashboard → Edge Functions → Secrets (not local `.env`)

### Issue: pgvector not working

**Solution**: Enable pgvector extension in Supabase Dashboard → Database → Extensions → pgvector

### Issue: RLS blocking queries

**Solution**: Verify RLS policies exist and `auth.uid()` matches `user_id` in queries. Use `SUPABASE_SERVICE_ROLE_KEY` only when necessary with manual ownership checks.

---

## Next Steps

1. **Implement UI Components**: Create chat interface, context pills, approval prompts in `packages/ui/`
2. **Add Real-time Progress**: Implement progress tracking for long-running agent requests
3. **Add File Change Approvals**: Implement approval flow for agent-proposed file modifications
4. **Design Iteration**: Run `/speckit.design` to create visual designs in `apps/design-system`
5. **Testing** (Post-MVP): Add Vitest unit tests, Playwright E2E tests when feature is stable

---

## Resources

- **Spec**: `specs/004-ai-agent-system/spec.md`
- **Plan**: `specs/004-ai-agent-system/plan.md`
- **Research**: `specs/004-ai-agent-system/research.md`
- **Data Model**: `specs/004-ai-agent-system/data-model.md`
- **API Contracts**: `specs/004-ai-agent-system/contracts/execute-agent.yaml`
- **Claude Agent SDK Docs**: https://docs.claude.com/en/api/agent-sdk/overview
- **Constitution**: `.specify/memory/constitution.md`
- **CLAUDE.md**: Root-level development guide

---

**Estimated Implementation Time**: 2-3 days for core functionality (chat + agent execution), 4-5 days including UI

**Ready to Start?** Begin with Step 3 (Database Schema) and work through sequentially.
