import type { UseTreeExpansionResult } from './useTreeExpansion';
import { useTreeExpansion } from './useTreeExpansion';
import { useLocalStorageState } from './useLocalStorageState';

/**
 * Thread-specific tree expansion hook with localStorage persistence
 *
 * Provides expansion state management for the thread tree in WorkspaceSidebar.
 * State persists across page reloads using localStorage.
 *
 * @returns Tree expansion operations for thread tree
 *
 * @example
 * ```typescript
 * const threadExpansion = usePersistedThreadExpansion();
 *
 * <ThreadTreeNode
 *   expandedThreads={threadExpansion.expandedSet}
 *   onToggleExpanded={threadExpansion.toggleExpanded}
 * />
 * ```
 */
export function usePersistedThreadExpansion(): UseTreeExpansionResult {
  const [expandedIds, setExpandedIds] = useLocalStorageState<string[]>(
    'workspace-thread-expansion',
    []
  );

  return useTreeExpansion({ expandedIds, setExpandedIds });
}
