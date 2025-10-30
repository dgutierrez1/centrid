# Schema Changes for Agent Request Streaming

**Reference**: AGENT_REQUEST_STREAMING_MVU_PLAN.md (MVU B1.1)  
**Status**: Required changes documented

---

## 🗄️ Schema Modifications

### **1. agent_requests Table - Add Fields**

```sql
ALTER TABLE agent_requests 
  ADD COLUMN thread_id uuid NOT NULL,
  ADD COLUMN triggering_message_id uuid NOT NULL,
  ADD COLUMN response_message_id uuid,
  ADD COLUMN completed_at timestamptz;

-- Add indexes
CREATE INDEX idx_agent_requests_thread_id ON agent_requests(thread_id);
CREATE INDEX idx_agent_requests_triggering_message_id ON agent_requests(triggering_message_id);

-- Add foreign keys (via Drizzle cascadeDeleteSQL)
-- Will be applied by db:push from schema.ts
```

### **2. agent_tool_calls Table - Add requestId Field**

```sql
ALTER TABLE agent_tool_calls 
  ADD COLUMN request_id uuid,
  ADD COLUMN revision_history jsonb DEFAULT '[]';

-- Add index
CREATE INDEX idx_agent_tool_calls_request_id ON agent_tool_calls(request_id);

-- Update constraint: messageId can now be null (set at end)
ALTER TABLE agent_tool_calls ALTER COLUMN message_id DROP NOT NULL;
```

---

## 📋 Drizzle Schema Changes

All changes in `apps/api/src/db/schema.ts`:

### **agent_requests**
```typescript
export const agentRequests = pgTable('agent_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  threadId: uuid('thread_id').notNull(),  // NEW
  triggeringMessageId: uuid('triggering_message_id').notNull(),  // NEW
  responseMessageId: uuid('response_message_id'),  // NEW
  agentType: text('agent_type').notNull(),
  content: text('content').notNull(),
  status: text('status').notNull().default('pending'),
  progress: real('progress').notNull().default(0),
  results: jsonb('results'),
  tokenCost: integer('token_cost'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),  // NEW
}, (table) => ({
  userIdIdx: index('agent_requests_user_id_idx').on(table.userId),
  threadIdIdx: index('agent_requests_thread_id_idx').on(table.threadId),  // NEW
  triggeringMessageIdx: index('agent_requests_triggering_message_idx').on(table.triggeringMessageId),  // NEW
  statusIdx: index('agent_requests_status_idx').on(table.status),
  createdAtIdx: index('agent_requests_created_at_idx').on(table.createdAt),
}));
```

### **agent_tool_calls**
```typescript
export const agentToolCalls = pgTable('agent_tool_calls', {
  id: uuid('id').primaryKey().defaultRandom(),
  requestId: uuid('request_id'),  // NEW: Can be null for legacy
  messageId: uuid('message_id'),  // CHANGED: Now nullable (set at end)
  threadId: uuid('thread_id').notNull(),
  ownerUserId: uuid('owner_user_id').notNull(),
  toolName: text('tool_name').notNull(),
  toolInput: jsonb('tool_input').notNull(),
  approvalStatus: text('approval_status').default('pending'),
  toolOutput: jsonb('tool_output'),
  rejectionReason: text('rejection_reason'),
  revisionCount: integer('revision_count').default(0),
  revisionHistory: jsonb('revision_history').default([]),  // NEW
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  idIdx: index('idx_agent_tool_calls_id').on(table.id),
  requestIdIdx: index('idx_agent_tool_calls_request_id').on(table.requestId),  // NEW
  threadIdIdx: index('idx_agent_tool_calls_thread_id').on(table.threadId),
  messageIdIdx: index('idx_agent_tool_calls_message_id').on(table.messageId),
  approvalStatusIdx: index('idx_agent_tool_calls_approval_status').on(table.approvalStatus),
  ownerUserIdIdx: index('idx_agent_tool_calls_owner_user_id').on(table.ownerUserId),
  createdAtIdx: index('idx_agent_tool_calls_created_at').on(table.timestamp),
}));
```

---

## 🔄 Relationships

```
messages (user)
    ↓ triggers
agent_requests ───┐
    ↓             │
agent_tool_calls  │ produces
    ↓             ↓
messages (assistant)
```

**Links**:
- `agent_requests.triggering_message_id` → `messages.id` (user)
- `agent_requests.response_message_id` → `messages.id` (assistant)
- `agent_tool_calls.request_id` → `agent_requests.id`
- `agent_tool_calls.message_id` → `messages.id` (assistant, set at end)

---

## ✅ Application Command

```bash
cd apps/api
npm run db:push
```

This will:
1. Add new columns to agent_requests
2. Add new columns to agent_tool_calls
3. Create indexes
4. Apply via Drizzle push (no migration files for MVP)
