---
title: Real-time Sync with Supabase
summary: Real-time subscriptions keep Valtio state synchronized with server
---

<!-- After editing this file, run: npm run sync-docs -->

# Real-time Sync with Supabase

## Pattern

Supabase real-time subscriptions automatically update Valtio state when database changes occur.

## How It Works

```
1. User performs action (create/update/delete)
2. Optimistic update to Valtio state
3. API call to backend
4. Backend updates database
5. Database triggers real-time event
6. Frontend subscription receives event
7. Valtio state reconciles with server data
```

## Implementation

```typescript
import { createRealtimeSubscription } from "@/lib/supabase";

const subscription = createRealtimeSubscription(
  "agent_requests",
  (payload) => {
    if (payload.new.status === "completed") {
      actions.updateAgentRequest(payload.new.id, payload.new);
    }
  },
  { user_id: userId }
);
```

## Reconciliation Pattern

```typescript
// Optimistic update
folderState.folders[tempId] = { id: tempId, name: 'New Folder' }

// API call
const folder = await api.post('/folders', { name: 'New Folder' })

// Replace temp with real data
delete folderState.folders[tempId]
folderState.folders[folder.id] = folder

// Real-time subscription confirms (redundant but ensures consistency)
subscription.on('INSERT', (payload) => {
  folderState.folders[payload.new.id] = payload.new
})
```

## Performance

- **Propagation**: <100ms from database change to UI update
- **Scale**: Handles 100+ concurrent subscriptions per user
- **Filtering**: Row-Level Security applies to real-time events

## Rules

- ✅ Subscribe to tables with frequent updates
- ✅ Filter subscriptions by user_id (RLS auto-applies)
- ✅ Reconcile optimistic updates with real-time events
- ✅ Unsubscribe on component unmount
- ❌ NEVER subscribe to every table (performance impact)
- ❌ NEVER create duplicate subscriptions

## References

- Subscription helper: `apps/web/src/lib/supabase/client.ts`
- Context with subscriptions: `apps/web/src/lib/contexts/filesystem.context.tsx`
- Optimistic updates: See `frontend-state-management.md` pattern
