---
title: GraphQL Schema Design Pattern
summary: GraphQL types mirror database schema 1:1 for type unification across queries and realtime
domain: data
priority: core
related: [data-type-generation, frontend-graphql-client, integration-realtime-sync]
---

<!-- After editing this file, run: npm run sync-docs -->

# GraphQL Schema Design Pattern

**What**: GraphQL schema exposes database tables as types with exact field matching—no computed fields or nested relations.

**Why**: Realtime subscriptions come directly from database. Single type system eliminates semantic mismatches and guarantees type safety across all data sources.

**How**:

```typescript
// Database schema (files table)
{
  id: uuid,
  path: text,
  content: text,
  owner_user_id: uuid
}

// GraphQL type (exact match, camelCase)
type File {
  id: ID!
  path: String!
  content: String!
  ownerUserId: String!
}

// Derived fields computed in UI layer
const fileName = file.path.split('/').pop();
```

## Type Flow Architecture

```
Database Schema (snake_case)
  ↓ Drizzle ORM
Backend Entity Types (camelCase)
  ↓ Pothos GraphQL Builder
GraphQL Schema (camelCase)
  ↓ GraphQL Codegen
TypeScript Types (apps/web/src/types/graphql.ts)
  ↓ Used by
BOTH GraphQL Queries AND Realtime Subscriptions
```

## Single Source of Truth

Frontend uses GraphQL types for:
- ✅ Query results (`useQuery<ListFilesQuery>`)
- ✅ Mutation inputs/outputs (`createFile`, `updateFile`)
- ✅ Realtime subscription payloads (`payload.new: File`)
- ✅ Valtio state (`filesystemState.documents: Document[]`)

No parallel type systems. No manual type definitions. One source, maintained automatically.

## Where Computation Happens

| Computation Type | Location | Example |
|-----------------|----------|---------|
| Database defaults | Schema | `created_at DEFAULT now()` |
| Field extraction | UI Layer | `file.path.split('/').pop()` |
| Aggregations | UI Layer | `files.filter(f => f.folderId === id).length` |
| Formatting | UI Layer | `new Date(file.createdAt).toLocaleDateString()` |

**Never in GraphQL resolvers**: Keeps types aligned with database reality.

## Rules

- ✅ DO mirror database columns exactly in GraphQL types
- ✅ DO use GraphQL codegen as single source of truth for frontend types
- ✅ DO compute derived values in UI layer when needed
- ✅ DO use camelCase for GraphQL fields (matches TypeScript convention)
- ✅ DO expose all non-sensitive database columns
- ❌ DON'T add computed fields to GraphQL resolvers (e.g., `name` from `path`)
- ❌ DON'T add nested relationship fields requiring separate queries (e.g., `File.folder: Folder`)
- ❌ DON'T create parallel type systems (frontend stubs, manual types)
- ❌ DON'T stringify JSONB fields (expose as JSON scalar, transform in UI if needed)

## Benefits

1. **Type Safety**: GraphQL codegen ensures compile-time safety
2. **Realtime Compatible**: Subscription payloads match query types exactly
3. **Zero Maintenance**: Types auto-update when schema changes
4. **Predictable**: What's in database is what you get in frontend
5. **No Drift**: Single source of truth prevents type fragmentation

## Example: Unified Types

```typescript
import type { File } from '@/types/graphql';

// GraphQL query
const { data } = useQuery(ListFilesDocument);
const files: File[] = data.files;  // ← GraphQL type

// Realtime subscription
createSubscription('files')
  .on('INSERT', (payload) => {
    const file: File = payload.new;  // ← Same type!
    addDocument(file);
  });

// Valtio state
export const filesystemState = proxy<{
  documents: File[];  // ← Same type!
}>({
  documents: [],
});
```

## Used in

- `apps/api/src/graphql/types/` - GraphQL type definitions (mirror database)
- `apps/web/src/types/graphql.ts` - Auto-generated TypeScript types
- `apps/web/src/lib/realtime/types.ts` - Realtime subscriptions reference GraphQL types
- `apps/web/src/lib/state/` - Valtio state uses GraphQL types
