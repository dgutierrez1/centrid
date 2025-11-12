---
title: GraphQL Frontend Client (urql)
summary: urql client with custom hooks for type-safe queries, mutations, optimistic updates, and Valtio sync
domain: frontend
priority: core
related: [frontend-state-management, data-graphql-schema-design, frontend-token-store]
---

<!-- After editing this file, run: npm run sync-docs -->

# GraphQL Frontend Client (urql)

**What**: All frontend API calls use urql GraphQL client with custom hooks for type-safe queries and mutations synchronized with Valtio state.

**Why**: GraphQL provides type safety, eliminates overfetching, enables optimistic updates with permanent IDs, and supports advanced features (normalized caching, SSR) without Apollo Client's complexity.

**Setup: Client Configuration**

```typescript
// apps/web/pages/_app.tsx
import { createClient, cacheExchange, fetchExchange, ssrExchange } from 'urql'

export const graphqlClient = createClient({
  url: '/api/graphql',
  exchanges: [
    cacheExchange,  // In-memory cache
    ssr,            // SSR for Next.js
    fetchExchange,  // HTTP requests
  ],
  fetchOptions: () => ({
    credentials: 'include', // Send auth cookies
  }),
  requestPolicy: 'cache-and-network', // Instant cache + fresh data
  preferGetMethod: false, // Force POST (urql v5 defaults to GET, bypasses auth)
})
```

**Usage: Query Hook**

```typescript
// apps/web/src/lib/graphql/useGraphQLQuery.ts
import { useQuery } from 'urql'
import { useEffect } from 'react'

export function useGraphQLQuery({ query, variables, syncToState }) {
  const [result, refetch] = useQuery({ query, variables })

  useEffect(() => {
    if (result.data && !result.error) {
      syncToState(result.data) // Sync to Valtio state
    }
  }, [result.data, result.error])

  return { loading: result.fetching, error: result.error, refetch }
}

// Usage in component
import { ListFoldersDocument } from '@/graphql'

const { loading, error } = useGraphQLQuery({
  query: ListFoldersDocument,
  syncToState: (data) => {
    filesystemState.folders = data.folders
  },
  requestPolicy: 'cache-and-network' // Instant render from cache + fresh data
})
```

**Usage: Mutation Hook**

```typescript
// apps/web/src/lib/graphql/useGraphQLMutation.ts
import { useMutation } from 'urql'

export function useGraphQLMutation({
  mutation,
  optimisticUpdate,
  onSuccess,
  onError,
  successMessage,
  errorMessage
}) {
  const [result, executeMutation] = useMutation(mutation)

  const mutate = async (input) => {
    const permanentId = crypto.randomUUID() // Permanent UUID (not temp)
    const context = optimisticUpdate(permanentId, input) // Apply optimistic update

    try {
      const response = await executeMutation(input)
      if (response.error) throw new Error(response.error.message)
      onSuccess(context, response.data) // Merge with server response
      if (successMessage) toast.success(successMessage(response.data))
    } catch (error) {
      onError(context) // Rollback optimistic update
      if (errorMessage) toast.error(errorMessage(error))
    }
  }

  return { mutate, isLoading: result.fetching }
}

// Usage in component
import { CreateFolderDocument } from '@/graphql'

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

**Type Safety**

GraphQL CodeGen generates TypeScript types used by both queries and realtime subscriptions. See [GraphQL Schema Design Pattern](./data-graphql-schema-design.md) for type unification principles.

**Rules**:
- ✅ DO use `useGraphQLQuery` for all queries with Valtio state sync
- ✅ DO use `useGraphQLMutation` for mutations with optimistic updates
- ✅ DO use `cache-and-network` policy for instant render + fresh data
- ✅ DO use permanent UUIDs (not temp IDs) for optimistic updates to avoid race conditions
- ✅ DO set `preferGetMethod: false` in urql client config (urql v5 defaults to GET, bypasses auth)
- ✅ DO omit `variables` property entirely for queries with no variables (don't pass empty object)
- ❌ DON'T create custom urql hooks - use `useGraphQLQuery`/`useGraphQLMutation`
- ❌ DON'T use REST/axios for new features (GraphQL-only migration)
- ❌ DON'T fetch data outside of `useGraphQLQuery` hooks
- ❌ DON'T use `cache-only` policy (prevents fresh data fetching)
- ❌ DON'T pass `variables: {}` for queries with no variables (causes validation errors)

**Used in**:
- `apps/web/pages/_app.tsx` - urql client setup with `preferGetMethod: false`
- `apps/web/src/lib/graphql/client.ts` - urql client configuration
- `apps/web/src/lib/graphql/useGraphQLQuery.ts` - Query hook implementation
- `apps/web/src/lib/graphql/useGraphQLMutation.ts` - Mutation hook implementation
- `apps/web/src/lib/hooks/useFilesystemData.ts` - Example query with no variables
- `apps/web/src/lib/hooks/` - Feature hooks using GraphQL operations
