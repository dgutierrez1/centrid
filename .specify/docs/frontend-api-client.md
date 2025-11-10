---
title: GraphQL Client Pattern
summary: urql-based GraphQL client with custom hooks for queries, mutations, and Valtio sync
---

<!-- After editing this file, run: npm run sync-docs -->

# GraphQL Client Pattern

**What**: All frontend API calls use urql GraphQL client with custom hooks for type-safe queries and mutations.

**Why**: GraphQL provides type safety, eliminates overfetching, enables optimistic updates with permanent IDs, and integrates seamlessly with Valtio state management.

**How**:

```typescript
import { useGraphQLQuery, useGraphQLMutation } from '@/lib/graphql'
import { ListFoldersDocument, CreateFolderDocument } from '@/graphql'

// Query with Valtio state sync
const { loading, error } = useGraphQLQuery({
  query: ListFoldersDocument,
  syncToState: (data) => {
    filesystemState.folders = data.folders
  },
  requestPolicy: 'cache-and-network' // Instant render from cache + fresh data
})

// Mutation with optimistic update + rollback
const { mutate, isLoading } = useGraphQLMutation({
  mutation: CreateFolderDocument,
  optimisticUpdate: (permanentId, input) => {
    const folder = { id: permanentId, ...input, createdAt: new Date().toISOString() }
    filesystemState.folders.push(folder)
    return { permanentId, folder }
  },
  onSuccess: ({ permanentId }, data) => {
    // Server uses same ID - no replacement needed, just sync
    filesystemState.folders = data.folders
  },
  onError: ({ permanentId }) => {
    // Rollback: remove optimistic folder
    filesystemState.folders = filesystemState.folders.filter(f => f.id !== permanentId)
  },
  successMessage: () => 'Folder created',
  errorMessage: (err) => `Failed to create folder: ${err}`
})
```

**Rules**:
- ✅ DO use `useGraphQLQuery` for all queries with Valtio state sync
- ✅ DO use `useGraphQLMutation` for mutations with optimistic updates
- ✅ DO use `cache-and-network` policy for instant render + fresh data
- ✅ DO use permanent UUIDs (not temp IDs) for optimistic updates to avoid race conditions
- ❌ DON'T create custom urql hooks - use `useGraphQLQuery`/`useGraphQLMutation`
- ❌ DON'T use REST/axios for new features (GraphQL-only migration)
- ❌ DON'T fetch data outside of `useGraphQLQuery` hooks

**Used in**:
- `apps/web/src/lib/graphql/client.ts` - urql client configuration
- `apps/web/src/lib/graphql/useGraphQLQuery.ts` - Query hook implementation
- `apps/web/src/lib/graphql/useGraphQLMutation.ts` - Mutation hook implementation
- `apps/web/src/lib/hooks/` - Custom hooks using GraphQL queries/mutations
