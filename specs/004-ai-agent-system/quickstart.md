# Quickstart Guide: AI-Powered Exploration Workspace

**Feature**: `004-ai-agent-system`
**Prerequisites**: Node.js 20+, npm, Supabase CLI, Docker (optional for local Supabase)
**Estimated Time**: 45-60 minutes
**Status**: Aligned with spec.md and arch.md

---

## Overview

This guide walks you through implementing the AI-Powered Exploration Workspace with:
- **Branching threads**: DAG structure for parallel exploration
- **Provenance tracking**: Files linked to source conversations
- **Semantic discovery**: pgvector-powered cross-branch search
- **Memory chunking**: Long thread compression with semantic retrieval
- **User preferences**: Behavioral learning from interactions

**Architecture**:
- **Backend**: 3-layer (Edge Functions → Services → Repositories)
- **Frontend**: 3-layer (Services → Hooks → Components)
- **Database**: 9 entities with pgvector for semantic search

---

## Step 1: Install Dependencies

### Backend Dependencies

```bash
cd apps/api

# Core dependencies
npm install drizzle-orm postgres
npm install @anthropic-ai/sdk
npm install openai
npm install @supabase/supabase-js

# Dev dependencies
npm install -D drizzle-kit @types/node
```

### Frontend Dependencies

```bash
cd apps/web

# State management & API
npm install valtio
npm install @supabase/supabase-js

# UI (if not already installed)
npm install react-hot-toast
```

---

## Step 2: Configure Environment

### Backend Environment (`apps/api/.env`)

```bash
# Supabase (Remote - use port 5432 for drizzle-kit push)
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-X-XX-X.pooler.supabase.com:5432/postgres"

# API Keys
ANTHROPIC_API_KEY="sk-ant-..."  # Claude 3.5 Sonnet
OPENAI_API_KEY="sk-..."         # For embeddings (text-embedding-3-small)

# Supabase
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."  # Only for admin operations, NOT user operations
```

**Important**: URL-encode special characters in DATABASE_URL password (! = %21, @ = %40, # = %23).

### Frontend Environment (`apps/web/.env`)

```bash
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."  # Server-side only
```

---

## Step 3: Define Database Schema

Create the schema with all 9 entities in `apps/api/src/db/schema.ts`:

```typescript
// apps/api/src/db/schema.ts
import { pgTable, uuid, text, timestamp, integer, real, boolean, jsonb } from 'drizzle-orm/pg-core';
import { customType } from 'drizzle-orm/pg-core';
import { users } from './auth'; // Assuming auth schema exists

// Custom pgvector type
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(768)';
  },
  toDriver(value: number[]): string {
    return JSON.stringify(value);
  },
  fromDriver(value: string): number[] {
    return JSON.parse(value);
  }
});

// 1. Shadow Entities (unified semantic layer)
export const shadowEntities = pgTable('shadow_entities', {
  shadow_id: uuid('shadow_id').defaultRandom().primaryKey(),
  owner_user_id: uuid('owner_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  entity_id: uuid('entity_id').notNull(),
  entity_type: text('entity_type').notNull(), // 'file' | 'thread' | 'kg_node'
  embedding: vector('embedding').notNull(), // 768-dim
  summary: text('summary').notNull(),
  structure_metadata: jsonb('structure_metadata'),
  last_updated: timestamp('last_updated').notNull().defaultNow(),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

// 2. Threads (branching DAG)
export const threads = pgTable('threads', {
  thread_id: uuid('thread_id').defaultRandom().primaryKey(),
  owner_user_id: uuid('owner_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  parent_id: uuid('parent_id').references(() => threads.thread_id, { onDelete: 'restrict' }),
  branch_title: text('branch_title'),
  thread_summary: text('thread_summary'),
  summary_updated_at: timestamp('summary_updated_at'),
  inherited_files: jsonb('inherited_files').$type<string[]>(),
  parent_last_message: text('parent_last_message'),
  branching_message_content: text('branching_message_content'),
  shadow_domain_id: uuid('shadow_domain_id').references(() => shadowEntities.shadow_id),
  created_by: text('created_by').notNull(),
  archived: boolean('archived').default(false),
  last_activity_at: timestamp('last_activity_at').notNull().defaultNow(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

// 3. Messages
export const messages = pgTable('messages', {
  message_id: uuid('message_id').defaultRandom().primaryKey(),
  thread_id: uuid('thread_id').notNull().references(() => threads.thread_id, { onDelete: 'cascade' }),
  owner_user_id: uuid('owner_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  content: text('content').notNull(),
  agent_request_id: uuid('agent_request_id'),
  tokens_used_input: integer('tokens_used_input'),
  tokens_used_output: integer('tokens_used_output'),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

// 4. Thread Memory Chunks
export const threadMemoryChunks = pgTable('thread_memory_chunks', {
  chunk_id: uuid('chunk_id').defaultRandom().primaryKey(),
  conversation_id: uuid('conversation_id').notNull().references(() => threads.thread_id, { onDelete: 'cascade' }),
  owner_user_id: uuid('owner_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  message_ids: jsonb('message_ids').$type<string[]>().notNull(),
  embedding: vector('embedding').notNull(),
  summary: text('summary').notNull(),
  timestamp_range: jsonb('timestamp_range').$type<[Date, Date]>().notNull(),
  chunk_index: integer('chunk_index').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

// 5. Files (with provenance)
export const files = pgTable('files', {
  file_id: uuid('file_id').defaultRandom().primaryKey(),
  owner_user_id: uuid('owner_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  path: text('path').notNull(),
  content: text('content').notNull(),
  created_in_conversation_id: uuid('created_in_conversation_id').references(() => threads.thread_id, { onDelete: 'set null' }),
  creation_timestamp: timestamp('creation_timestamp'),
  context_summary: text('context_summary'),
  last_edited: timestamp('last_edited').notNull().defaultNow(),
  last_edited_by: text('last_edited_by').notNull(),
  edited_in_conversation_id: uuid('edited_in_conversation_id').references(() => threads.thread_id, { onDelete: 'set null' }),
  shadow_domain_id: uuid('shadow_domain_id').references(() => shadowEntities.shadow_id),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

// 6. Context References
export const contextReferences = pgTable('context_references', {
  reference_id: uuid('reference_id').defaultRandom().primaryKey(),
  thread_id: uuid('thread_id').notNull().references(() => threads.thread_id, { onDelete: 'cascade' }),
  owner_user_id: uuid('owner_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  reference_type: text('reference_type').notNull(),
  source_reference: text('source_reference'),
  snippet_line_start: integer('snippet_line_start'),
  snippet_line_end: integer('snippet_line_end'),
  source: text('source').notNull(),
  priority_tier: integer('priority_tier').notNull(),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

// 7. Agent Tool Calls
export const agentToolCalls = pgTable('agent_tool_calls', {
  tool_call_id: uuid('tool_call_id').defaultRandom().primaryKey(),
  message_id: uuid('message_id').notNull().references(() => messages.message_id, { onDelete: 'cascade' }),
  thread_id: uuid('thread_id').notNull().references(() => threads.thread_id, { onDelete: 'cascade' }),
  owner_user_id: uuid('owner_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tool_name: text('tool_name').notNull(),
  tool_input: jsonb('tool_input').notNull(),
  tool_output: jsonb('tool_output'),
  approval_status: text('approval_status').notNull(),
  approved_at: timestamp('approved_at'),
  rejected_reason: text('rejected_reason'),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  sequence_order: integer('sequence_order').notNull(),
});

// 8. User Preferences
export const userPreferences = pgTable('user_preferences', {
  preference_id: uuid('preference_id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  always_include_files: jsonb('always_include_files').$type<string[]>().default([]),
  excluded_patterns: jsonb('excluded_patterns').$type<string[]>().default([]),
  blacklisted_branches: jsonb('blacklisted_branches').$type<string[]>().default([]),
  context_budget: integer('context_budget').default(200000),
  last_updated: timestamp('last_updated').notNull().defaultNow(),
  derived_from_days: integer('derived_from_days').default(30),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

// 9. Knowledge Graph Edges (Phase 2+)
export const knowledgeGraphEdges = pgTable('knowledge_graph_edges', {
  edge_id: uuid('edge_id').defaultRandom().primaryKey(),
  owner_user_id: uuid('owner_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  source_entity_id: uuid('source_entity_id').notNull().references(() => shadowEntities.shadow_id, { onDelete: 'cascade' }),
  source_type: text('source_type').notNull(),
  target_entity_id: uuid('target_entity_id').notNull().references(() => shadowEntities.shadow_id, { onDelete: 'cascade' }),
  target_type: text('target_type').not Null(),
  relationship_type: text('relationship_type').notNull(),
  confidence_score: real('confidence_score').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
});
```

---

## Step 4: Push Schema to Supabase

```bash
cd apps/api

# Drop existing tables (MVP iteration)
npm run db:drop

# Push schema + apply RLS policies + create indexes
npm run db:push
```

**Post-push SQL** (run in Supabase SQL Editor):

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create ivfflat indexes for semantic search
CREATE INDEX shadow_entities_embedding_idx
ON shadow_entities
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX memory_chunks_embedding_idx
ON thread_memory_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 50);

-- RLS policies (apply for all tables)
CREATE POLICY "Users can only access their own shadow entities"
ON shadow_entities FOR ALL
USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can only access their own threads"
ON threads FOR ALL
USING (auth.uid() = owner_user_id);

-- Repeat for all 9 tables...
```

---

## Step 5: Implement Edge Function (threads-messages)

Create `apps/api/src/functions/threads-messages/index.ts` for `POST /threads/:id/messages`:

```typescript
// apps/api/src/functions/threads-messages/index.ts
// RESTful endpoint: POST /threads/:id/messages
// Creates message and returns SSE endpoint for agent streaming
import Anthropic from '@anthropic-ai/sdk';
import { ContextAssemblyService } from '../../services/contextAssembly';
import { agentExecutionService } from '../../services/agentExecution';

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY')!
});

Deno.serve(async (req: Request) => {
  try {
    // Extract threadId from URL path: /threads/:id/messages
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const threadId = pathParts[pathParts.indexOf('threads') + 1];

    const { text, contextReferences } = await req.json();

    // Verify auth
    const userId = await verifyAuth(req);

    // Build prime context from all 6 domains
    const primeContext = await ContextAssemblyService.assemble(threadId, text, userId);

    // Create SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        // Keep-alive
        const keepAlive = setInterval(() => {
          controller.enqueue(`: ping\n\n`);
        }, 30000);

        try {
          // Stream Claude 3.5 Sonnet
          const claudeStream = await anthropic.messages.stream({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 4096,
            messages: [{ role: 'user', content: primeContext + '\n\n' + text }],
            tools: mcpTools
          });

          for await (const chunk of claudeStream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              // Text chunk
              controller.enqueue(`data: ${JSON.stringify({
                type: 'text',
                content: chunk.delta.text
              })}\n\n`);
            } else if (chunk.type === 'content_block_start' && chunk.content_block.type === 'tool_use') {
              // Tool call - pause for approval
              const approved = await waitForApproval(chunk.content_block.id);

              if (!approved) {
                controller.enqueue(`data: ${JSON.stringify({ type: 'error' })}\n\n`);
                break;
              }
            }
          }

          controller.enqueue(`data: ${JSON.stringify({ type: 'completion' })}\n\n`);
        } finally {
          clearInterval(keepAlive);
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
```

Add to `apps/api/supabase/config.toml`:

```toml
# RESTful endpoint: POST /threads/:id/messages
[functions.threads-messages]
entrypoint = '../src/functions/threads-messages/index.ts'
import_map = '../import_map.json'

# Additional RESTful endpoints (to be implemented)
[functions.threads]
entrypoint = '../src/functions/threads/index.ts'  # POST /threads, GET /threads/:id, etc.
import_map = '../import_map.json'
```

---

## Step 6: Implement Services Layer

Create `apps/api/src/services/contextAssembly.ts`:

```typescript
// apps/api/src/services/contextAssembly.ts
import { semanticSearchService } from './semanticSearch';
import { userPreferencesService } from './userPreferences';
import { threadRepository } from '../repositories/thread';

export class ContextAssemblyService {
  static async assemble(threadId: string, query: string, userId: string) {
    // Execute all 6 domains in parallel (<1s target)
    const [explicit, semantic, tree, memory, preferences] = await Promise.all([
      this.loadExplicitReferences(threadId),
      semanticSearchService.search(query, userId, threadId),
      threadRepository.getTreeContext(threadId),
      this.loadMemoryChunks(threadId, query),
      userPreferencesService.loadPreferences(userId)
    ]);

    // Apply user preferences (filtering + always-include)
    const filteredSemantic = semantic.filter(item =>
      !preferences.excluded_patterns.some(p => new RegExp(p).test(item.path)) &&
      !preferences.blacklisted_branches.includes(item.source_thread_id)
    );

    const alwaysInclude = preferences.always_include_files.map(path => ({
      path,
      weight: 0.8,
      source: 'user_preference'
    }));

    // Merge and prioritize
    const allContext = [
      ...explicit.map(i => ({ ...i, weight: 1.0, group: 'explicit' })),
      ...alwaysInclude.map(i => ({ ...i, group: 'frequently_used' })),
      ...tree.map(i => ({ ...i, weight: 0.7, group: 'branch' })),
      ...filteredSemantic.map(i => ({ ...i, group: 'semantic' })),
      ...memory.map(i => ({ ...i, weight: 0.6, group: 'memory' }))
    ];

    // Fit within 200K token budget
    const { included, excluded } = this.fitWithinBudget(allContext, 200000);

    return this.buildPrimeContext(included);
  }
}
```

---

## Step 7: Frontend Integration

Create Valtio state in `apps/web/src/lib/state/aiAgentState.ts`:

```typescript
// apps/web/src/lib/state/aiAgentState.ts
import { proxy } from 'valtio';

export const aiAgentState = proxy({
  threads: [],
  currentThread: null,
  messages: [],
  streamingBuffer: '',
  contextReferences: [],
  pendingApproval: null
});
```

Create custom hook in `apps/web/src/lib/hooks/useStreamMessage.ts`:

```typescript
// apps/web/src/lib/hooks/useStreamMessage.ts
import { useSnapshot } from 'valtio';
import { aiAgentState } from '../state/aiAgentState';

export function useStreamMessage() {
  const state = useSnapshot(aiAgentState);

  const streamMessage = async (threadId: string, text: string) => {
    // Create message, get SSE endpoint
    const { sseEndpoint } = await threadService.sendMessage(threadId, text);

    // Subscribe to SSE
    const eventSource = new EventSource(sseEndpoint);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'text') {
        aiAgentState.streamingBuffer += data.content;
      } else if (data.type === 'tool_call' && data.status === 'awaiting_approval') {
        aiAgentState.pendingApproval = data;
      } else if (data.type === 'completion') {
        aiAgentState.messages.push({
          role: 'assistant',
          content: aiAgentState.streamingBuffer
        });
        aiAgentState.streamingBuffer = '';
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      toast.error('Stream interrupted');
      eventSource.close();
    };
  };

  return { streamMessage, streamingBuffer: state.streamingBuffer };
}
```

---

## Step 8: Test the Feature

### Create Test Thread

```bash
# RESTful: POST /threads (resource-based, not verb-based)
curl -X POST https://your-project.supabase.co/functions/v1/threads \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Exploration", "parentId": null}'
```

**Response**:
```json
{
  "data": {
    "threadId": "uuid-here",
    "title": "Test Exploration",
    "parentId": null
  }
}
```

### Send Message (Triggers Agent Execution)

```bash
# RESTful: POST /threads/:id/messages (nested resource for creating message)
# This triggers agent execution and returns SSE endpoint
curl -X POST https://your-project.supabase.co/functions/v1/threads/UUID_HERE/messages \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"text": "Explain RAG architecture", "contextReferences": []}'
```

**Response**:
```json
{
  "data": {
    "messageId": "uuid-here",
    "requestId": "uuid-here",
    "sseEndpoint": "/agent-requests/uuid-here/stream"
  }
}
```

### Subscribe to Agent Stream (SSE)

```bash
# Connect to SSE stream returned from message creation
curl -N https://your-project.supabase.co/functions/v1/agent-requests/UUID_HERE/stream \
  -H "Authorization: Bearer YOUR_JWT"
```

Expected SSE output:
```
data: {"type":"text","content":"RAG (Retrieval-Augmented Generation)..."}

data: {"type":"completion"}
```

---

## Step 9: Deploy

```bash
cd apps/api

# Deploy all Edge Functions
npm run deploy:functions

# Or deploy single function (RESTful endpoint)
npm run deploy:function threads-messages
npm run deploy:function threads
```

---

## Troubleshooting

### Issue: "pgvector extension not found"
```sql
-- Run in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS vector;
```

### Issue: "Schema push fails with foreign key errors"
```bash
# Drop all tables first
npm run db:drop

# Then push
npm run db:push
```

### Issue: "SSE stream closes immediately"
- Check keep-alive interval (should be 30s)
- Verify `Content-Type: text/event-stream` header
- Check Edge Function logs in Supabase Dashboard

### Issue: "Semantic search is slow (>1s)"
```sql
-- Verify index exists
\d shadow_entities

-- If missing, create:
CREATE INDEX shadow_entities_embedding_idx
ON shadow_entities
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

---

## Next Steps

1. **Implement remaining services**: SemanticSearchService, UserPreferencesService, ProvenanceTrackingService
2. **Add background jobs**: `/sync-shadow-domain`, `/summarize-thread`, `/compress-memory`
3. **Build frontend UI**: ChatView, ContextPanel, BranchSelector, FileEditorView
4. **Test consolidation workflow**: Multi-branch artifact gathering
5. **Run `/speckit.verify-ui`**: Automated UI testing against acceptance criteria

---

**Authored by**: Claude Code (Sonnet 4.5)
**Reviewed by**: Aligned with spec.md (2025-10-26) and arch.md (2025-10-26)
