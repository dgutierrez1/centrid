import type { UseTreeExpansionResult } from './useTreeExpansion';
import { useTreeExpansion } from './useTreeExpansion';
import { useLocalStorageState } from './useLocalStorageState';

/**
 * File system tree expansion hook with localStorage persistence
 *
 * Provides expansion state management for the file/folder tree in WorkspaceSidebar.
 * State persists across page reloads using localStorage.
 *
 * @returns Tree expansion operations for file system tree
 *
 * @example
 * ```typescript
 * const fileExpansion = usePersistedFileExpansion();
 *
 * <FileTreeNode
 *   expandedIds={fileExpansion.expandedSet}
 *   onToggleExpanded={fileExpansion.toggleExpanded}
 * />
 * ```
 */
export function usePersistedFileExpansion(): UseTreeExpansionResult {
  const [expandedIds, setExpandedIds] = useLocalStorageState<string[]>(
    'workspace-file-expansion',
    []
  );

  return useTreeExpansion({ expandedIds, setExpandedIds });
}
