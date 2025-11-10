---
title: GraphQL Client Integration (urql)
summary: urql configuration with caching, SSR support, and custom hooks for Valtio state sync
---

<!-- After editing this file, run: npm run sync-docs -->

# GraphQL Client Integration (urql)

**What**: urql GraphQL client provides type-safe queries/mutations with automatic caching, SSR support, and custom hooks for Valtio state synchronization.

**Why**: urql is lightweight, framework-agnostic, and supports advanced features (normalized caching, SSR, optimistic updates) without the complexity of Apollo Client.

**How**:

```typescript
// Client Configuration (apps/web/src/lib/graphql/client.ts)
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
})

// Custom Query Hook (apps/web/src/lib/graphql/useGraphQLQuery.ts)
export function useGraphQLQuery({ query, variables, syncToState }) {
  const [result, refetch] = useQuery({ query, variables })

  useEffect(() => {
    if (result.data && !result.error) {
      syncToState(result.data) // Sync to Valtio state
    }
  }, [result.data, result.error])

  return { loading: result.fetching, error: result.error, refetch }
}

// Custom Mutation Hook (apps/web/src/lib/graphql/useGraphQLMutation.ts)
export function useGraphQLMutation({ mutation, optimisticUpdate, onSuccess, onError }) {
  const [result, executeMutation] = useMutation(mutation)

  const mutate = async (input) => {
    const permanentId = crypto.randomUUID() // Permanent UUID (not temp)
    const context = optimisticUpdate(permanentId, input) // Apply optimistic update

    try {
      const response = await executeMutation(input)
      if (response.error) throw new Error(response.error.message)
      onSuccess(context, response.data) // Merge with server response
      toast.success('Success')
    } catch (error) {
      onError(context) // Rollback optimistic update
      toast.error(error.message)
    }
  }

  return { mutate, isLoading }
}
```

**Rules**:
- ✅ DO use `cache-and-network` for instant render from cache + fresh data
- ✅ DO use permanent UUIDs (not temp IDs) for optimistic updates
- ✅ DO sync query results to Valtio state via `syncToState` callback
- ✅ DO implement rollback in `onError` for failed mutations
- ❌ DON'T use `cache-only` policy (prevents fresh data fetching)
- ❌ DON'T use temp IDs for optimistic updates (causes race conditions with real-time)
- ❌ DON'T call urql directly - use `useGraphQLQuery`/`useGraphQLMutation` hooks

**Used in**:
- `apps/web/src/lib/graphql/client.ts` - urql client setup
- `apps/web/src/lib/graphql/useGraphQLQuery.ts` - Query hook with Valtio sync
- `apps/web/src/lib/graphql/useGraphQLMutation.ts` - Mutation hook with optimistic updates
- `apps/web/src/lib/hooks/` - Feature hooks using GraphQL operations
