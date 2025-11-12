/**
 * Generic tree traversal and manipulation utilities
 *
 * These functions work with any tree structure by accepting generic
 * accessor functions. They are pure functions with no side effects.
 */

/**
 * Find the path from root to a target node
 *
 * Returns an array of node IDs representing the path from the root
 * to the target node (inclusive). If the node is not found, returns empty array.
 *
 * @param nodeId - The ID of the target node
 * @param items - Flat array of all tree items
 * @param getParentId - Function to extract parent ID from an item
 * @param getId - Function to extract ID from an item
 * @returns Array of node IDs from root to target (inclusive)
 *
 * @example
 * ```typescript
 * const files = [
 *   { id: 'root', parentId: null },
 *   { id: 'folder1', parentId: 'root' },
 *   { id: 'file1', parentId: 'folder1' }
 * ];
 *
 * findPathToNode('file1', files, f => f.parentId, f => f.id);
 * // Returns: ['root', 'folder1', 'file1']
 * ```
 */
export function findPathToNode<T>(
  nodeId: string,
  items: T[],
  getParentId: (item: T) => string | null | undefined,
  getId: (item: T) => string
): string[] {
  // Build a map for O(1) lookups
  const itemMap = new Map<string, T>();
  items.forEach((item) => {
    itemMap.set(getId(item), item);
  });

  // Trace path from target to root
  const path: string[] = [];
  let currentId: string | null | undefined = nodeId;

  while (currentId) {
    const item = itemMap.get(currentId);
    if (!item) {
      // Node not found - return empty path
      return [];
    }

    path.unshift(currentId); // Add to front of array
    currentId = getParentId(item);
  }

  return path;
}

/**
 * Build a parent map for efficient parent lookups
 *
 * Creates a Map where keys are node IDs and values are parent IDs.
 * Useful for repeated parent lookups without re-scanning the tree.
 *
 * @param items - Flat array of all tree items
 * @param getParentId - Function to extract parent ID from an item
 * @param getId - Function to extract ID from an item
 * @returns Map of node ID to parent ID
 *
 * @example
 * ```typescript
 * const parentMap = buildParentMap(files, f => f.parentId, f => f.id);
 * const parentId = parentMap.get('file1'); // Returns 'folder1'
 * ```
 */
export function buildParentMap<T>(
  items: T[],
  getParentId: (item: T) => string | null | undefined,
  getId: (item: T) => string
): Map<string, string | null | undefined> {
  const map = new Map<string, string | null | undefined>();

  items.forEach((item) => {
    map.set(getId(item), getParentId(item));
  });

  return map;
}

/**
 * Get all node IDs in a tree
 *
 * Returns a flat array of all node IDs. Useful for "expand all" operations.
 *
 * @param items - Flat array of all tree items
 * @param getId - Function to extract ID from an item
 * @returns Array of all node IDs
 *
 * @example
 * ```typescript
 * const allIds = getAllNodeIds(files, f => f.id);
 * expansion.expandAll(allIds);
 * ```
 */
export function getAllNodeIds<T>(
  items: T[],
  getId: (item: T) => string
): string[] {
  return items.map(getId);
}

/**
 * Get all parent node IDs (nodes that have children)
 *
 * Returns an array of IDs for nodes that have at least one child.
 * Useful for initializing expansion state (e.g., "expand all parents by default").
 *
 * @param items - Flat array of all tree items
 * @param getParentId - Function to extract parent ID from an item
 * @param getId - Function to extract ID from an item
 * @returns Array of parent node IDs
 *
 * @example
 * ```typescript
 * const parentIds = getParentNodeIds(files, f => f.parentId, f => f.id);
 * // Auto-expand all folders that contain children
 * expansion.expandPath(parentIds);
 * ```
 */
export function getParentNodeIds<T>(
  items: T[],
  getParentId: (item: T) => string | null | undefined,
  getId: (item: T) => string
): string[] {
  const parentIds = new Set<string>();

  items.forEach((item) => {
    const parentId = getParentId(item);
    if (parentId) {
      parentIds.add(parentId);
    }
  });

  return Array.from(parentIds);
}
