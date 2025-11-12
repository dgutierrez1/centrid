import { useMemo } from 'react';

/**
 * Adapter interface for tree expansion state storage
 * Allows different storage implementations (localStorage, memory, remote, etc.)
 */
export interface TreeExpansionAdapter {
  expandedIds: string[];
  setExpandedIds: (ids: string[] | ((prev: string[]) => string[])) => void;
}

/**
 * Result interface for tree expansion operations
 */
export interface UseTreeExpansionResult {
  expandedSet: Set<string>;
  toggleExpanded: (id: string) => void;
  expandPath: (ancestorIds: string[]) => void;
  collapseAll: () => void;
  expandAll: (allIds: string[]) => void;
  isExpanded: (id: string) => boolean;
}

/**
 * Core reusable hook for managing tree expansion state
 *
 * This hook provides a clean, self-contained API for managing which nodes
 * in a tree are expanded or collapsed. It uses dependency injection via
 * the adapter pattern to remain storage-agnostic.
 *
 * @param adapter - Storage adapter providing get/set for expanded IDs
 * @returns Object with expansion state and operations
 *
 * @example
 * ```typescript
 * // With localStorage persistence
 * const [ids, setIds] = useLocalStorageState('my-tree', []);
 * const expansion = useTreeExpansion({ expandedIds: ids, setExpandedIds: setIds });
 *
 * // Use in component
 * <TreeNode
 *   isExpanded={expansion.isExpanded(node.id)}
 *   onToggle={() => expansion.toggleExpanded(node.id)}
 * />
 * ```
 */
export function useTreeExpansion(
  adapter: TreeExpansionAdapter
): UseTreeExpansionResult {
  const { expandedIds, setExpandedIds } = adapter;

  // Convert array to Set for O(1) lookups
  const expandedSet = useMemo(() => new Set(expandedIds), [expandedIds]);

  /**
   * Toggle expansion state for a single node
   */
  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  /**
   * Expand all nodes along a path (e.g., to reveal a selected node)
   * @param ancestorIds - Array of node IDs from root to target (inclusive)
   */
  const expandPath = (ancestorIds: string[]) => {
    setExpandedIds((prev) => {
      const combined = new Set([...prev, ...ancestorIds]);
      return Array.from(combined);
    });
  };

  /**
   * Collapse all nodes in the tree
   */
  const collapseAll = () => {
    setExpandedIds([]);
  };

  /**
   * Expand all nodes in the tree
   * @param allIds - Array of all node IDs in the tree
   */
  const expandAll = (allIds: string[]) => {
    setExpandedIds(allIds);
  };

  /**
   * Check if a node is expanded
   */
  const isExpanded = (id: string): boolean => {
    return expandedSet.has(id);
  };

  return {
    expandedSet,
    toggleExpanded,
    expandPath,
    collapseAll,
    expandAll,
    isExpanded,
  };
}
