/**
 * useFilesystemData - Load filesystem data from GraphQL
 *
 * Fetches folders and files from GraphQL API and syncs to Valtio state.
 * Used by FileSystemContext for initial data load and SSR hydration.
 *
 * Features:
 * - Uses cache-and-network policy for instant render + fresh data
 * - Automatically syncs results to filesystemState
 * - Builds file tree structure
 * - Handles loading and error states
 *
 * Usage:
 * ```typescript
 * const { loading, error } = useFilesystemData(!!user);
 * ```
 */

import { useGraphQLQuery } from "@/lib/graphql/useGraphQLQuery";
import { ListFoldersDocument, ListAllFilesDocument } from "@/types/graphql";
import type {
  ListFoldersQuery,
  ListAllFilesQuery,
  File,
  Folder,
} from "@/types/graphql";
import { filesystemState, updateTreeData } from "@/lib/state/filesystem";
import { openFile } from "@/lib/state/fileMetadata";

export interface UseFilesystemDataResult {
  /** Data is being fetched */
  loading: boolean;

  /** Error message if fetch failed */
  error: string | null;

  /** Refetch folders and files */
  refetch: () => void;
}

/**
 * Load filesystem data from GraphQL and sync to Valtio state
 *
 * @param enabled - Enable/disable queries (typically based on user auth)
 * @returns Loading state and error
 */
export function useFilesystemData(enabled = true): UseFilesystemDataResult {
  // Load folders from GraphQL
  const foldersQuery = useGraphQLQuery<ListFoldersQuery>({
    query: ListFoldersDocument,
    // Don't pass variables at all for queries with no variables
    syncToState: (data) => {
      if (data.folders) {
        // Always sync to ensure latest data (real-time subscriptions handle deduplication)
        filesystemState.folders = data.folders as Folder[];
        updateTreeData();
      }
    },
    enabled,
    // cache-first: Instant render from SSR cache, no duplicate network requests
  });

  // Load files from GraphQL
  const filesQuery = useGraphQLQuery<ListAllFilesQuery>({
    query: ListAllFilesDocument,
    // Don't pass variables at all for queries with no variables
    syncToState: (data) => {
      if (data.files) {
        // Always sync to ensure latest data with name field
        filesystemState.files = data.files as File[];

        // Metadata is now initialized per-file when opened (not for all files upfront)
        // See fileMetadataState in fileMetadata.ts - only tracks currently opened file

        updateTreeData();
      }
    },
    enabled,
    // cache-first: Instant render from SSR cache, no duplicate network requests
  });

  return {
    loading: foldersQuery.loading || filesQuery.loading,
    error: foldersQuery.error || filesQuery.error,
    refetch: () => {
      foldersQuery.refetch();
      filesQuery.refetch();
    },
  };
}
