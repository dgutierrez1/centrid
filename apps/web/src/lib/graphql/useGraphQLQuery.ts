/**
 * useGraphQLQuery - Reusable GraphQL query hook factory
 *
 * Handles:
 * - urql query execution with cache-and-network policy (instant cache + fresh data)
 * - Automatic Valtio state synchronization
 * - Loading and error states
 * - SSR compatibility
 *
 * Usage:
 * ```typescript
 * const { loading, error } = useGraphQLQuery<ListFoldersQuery, ListFoldersQueryVariables>({
 *   query: ListFoldersDocument,
 *   variables: { userId },
 *   syncToState: (data) => {
 *     filesystemState.folders = data.folders;
 *   },
 * });
 * ```
 */

import { useEffect, useRef } from "react";
import { useQuery, type AnyVariables } from "urql";
import type { DocumentNode } from "graphql";

/** Query options with explicit type parameters */
export interface UseGraphQLQueryOptions<
  TData,
  TVariables extends AnyVariables = AnyVariables
> {
  /** GraphQL query document */
  query: DocumentNode;

  /** Query variables */
  variables?: TVariables;

  /** Callback to sync query result to Valtio state */
  syncToState: (data: TData) => void;

  /** Enable/disable query execution */
  enabled?: boolean;

  /** Request policy (defaults to cache-and-network for instant cache + fresh data) */
  requestPolicy?:
    | "cache-first"
    | "cache-only"
    | "network-only"
    | "cache-and-network";
}

export interface UseGraphQLQueryResult<TData> {
  /** Query is fetching data */
  loading: boolean;

  /** Error message if query failed */
  error: string | null;

  /** Query result data */
  data: TData | undefined;

  /** Refetch the query */
  refetch: () => void;
}

/**
 * Reusable GraphQL query hook with Valtio state sync
 *
 * Requires explicit type parameters for type safety:
 * - TData: The query result type (e.g., GetFileQuery)
 * - TVariables: The query variables type (e.g., GetFileQueryVariables)
 */
export function useGraphQLQuery<
  TData,
  TVariables extends AnyVariables = AnyVariables
>(
  options: UseGraphQLQueryOptions<TData, TVariables>
): UseGraphQLQueryResult<TData> {
  const {
    query,
    variables,
    syncToState,
    enabled = true,
    // Use cache-and-network by default - returns cache instantly + always fetches fresh data
    requestPolicy = "cache-and-network",
  } = options;

  // Track last synced data to prevent duplicate state updates
  const lastSyncedDataRef = useRef<TData | undefined>();

  // Execute urql query
  // Build query args - urql handles undefined variables correctly
  const [result, refetch] = useQuery<TData, TVariables>({
    query,
    pause: !enabled,
    requestPolicy,
    // Only pass variables if they exist and have properties
    // to avoid GraphQL UNDEFINED_VALUE errors
    variables:
      variables !== undefined && Object.keys(variables || {}).length > 0
        ? variables
        : (undefined as TVariables),
  });

  // Sync result to Valtio state when data changes
  // Only sync if data is different from last sync to prevent duplicate renders
  useEffect(() => {
    if (
      result.data &&
      !result.error &&
      result.data !== lastSyncedDataRef.current
    ) {
      try {
        syncToState(result.data);
        lastSyncedDataRef.current = result.data;
      } catch (error) {
        console.error("[useGraphQLQuery] Failed to sync to state:", error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.data, result.error]);

  // Smart loading state: only true if fetching AND no data yet
  // With SSR cache, data exists immediately, so loading = false
  // During navigation to new data, fetching = true and data = undefined, so loading = true
  const isTrulyLoading = result.fetching && !result.data;

  return {
    loading: isTrulyLoading,
    error: result.error?.message || null,
    data: result.data,
    refetch: () => refetch({ requestPolicy: "network-only" }),
  };
}
