---
title: Real-time Sync with Supabase
summary: Real-time subscriptions keep Valtio state synchronized with server
domain: integration
priority: core
related: [data-graphql-schema-design, frontend-state-management]
---

<!-- After editing this file, run: npm run sync-docs -->

# Real-time Sync with Supabase

> **Note**: Realtime subscriptions use GraphQL types as source of truth. See [data-graphql-schema-design.md](./data-graphql-schema-design.md) for schema design principles.

**What**: Supabase realtime subscriptions using GraphQL types for type-safe database change notifications.

**Why**: GraphQL types mirror database schema exactly, enabling single type system for both queries and realtime subscriptions.

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

## Type Unification

```typescript
import type { File, Folder } from '@/types/graphql';

// GraphQL query uses GraphQL types
const { data } = useQuery(ListFilesDocument);
const files: File[] = data.files;

// Realtime subscription uses SAME GraphQL types
createSubscription('files')
  .filter({ owner_user_id: userId })
  .on('INSERT', (payload) => {
    const file: File = payload.new;  // ← Same type system!
    addDocument(file);
  });
```

## Implementation with Builder Pattern

```typescript
import { createSubscription } from '@/lib/realtime';
import type { AgentRequest } from '@/types/graphql';

// Type-safe subscription with automatic snake_case → camelCase
const subscription = createSubscription('agent_requests')
  .filter({ user_id: userId })
  .on('UPDATE', (payload) => {
    const request: AgentRequest = payload.new;
    if (request.status === 'completed') {
      updateAgentRequest(request.id, request);
    }
  })
  .subscribe();

// Cleanup on unmount
return () => subscription.unsubscribe();
```

## Optimistic Update Reconciliation

Realtime subscriptions automatically reconcile server state after optimistic updates. See [State Management Pattern](./frontend-state-management.md) for full optimistic update implementation with error handling.

## Performance

- **Propagation**: <100ms from database change to UI update
- **Scale**: Handles 100+ concurrent subscriptions per user
- **Filtering**: Row-Level Security applies to real-time events

## Architecture

```
Two data paths, one type system:

Path 1: GraphQL
  Database → Resolver → GraphQL Response → Frontend State

Path 2: Realtime
  Database → Supabase Realtime → snakeToCamel → Frontend State

Both use: File, Folder, Thread types from @/types/graphql
```

## Rules

- ✅ DO use GraphQL types for realtime subscriptions (`import type { File } from '@/types/graphql'`)
- ✅ DO transform snake_case to camelCase automatically with `snakeToCamel`
- ✅ DO filter subscriptions by user_id (RLS auto-applies)
- ✅ DO reconcile optimistic updates with real-time events
- ✅ DO unsubscribe on component unmount
- ✅ DO reference [GraphQL schema design pattern](./data-graphql-schema-design.md) for type guidelines
- ❌ DON'T create parallel type systems (use GraphQL types only)
- ❌ DON'T subscribe to every table (performance impact)
- ❌ DON'T create duplicate subscriptions

## Used in

- `apps/web/src/lib/realtime/builder.ts` - Subscription builder with snakeToCamel transformation
- `apps/web/src/lib/realtime/hooks.ts` - React hooks for automatic cleanup
- `apps/web/src/lib/realtime/types.ts` - Type-safe subscription types using GraphQL types
- `apps/web/src/lib/contexts/filesystem.context.tsx` - Real-world usage with type unification
- `apps/web/src/lib/utils/casing.ts` - snake_case to camelCase transformation
