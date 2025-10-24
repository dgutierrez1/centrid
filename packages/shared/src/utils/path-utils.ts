/**
 * Path Computation Utilities
 *
 * Utilities for computing file system paths from folder hierarchy
 * Used by both frontend (for display) and backend (for database operations)
 */

import type { Folder, Document } from '../types/filesystem';

// ============================================================================
// Path Computation
// ============================================================================

/**
 * Compute folder path from parent hierarchy
 * Example: parent_path="/Projects" + name="MVP" → "/Projects/MVP"
 */
export function computeFolderPath(parentPath: string | null, folderName: string): string {
  if (!parentPath || parentPath === '/') {
    return `/${folderName}`;
  }
  return `${parentPath}/${folderName}`;
}

/**
 * Compute document path from folder path and filename
 * Example: folder_path="/Projects/MVP" + filename="spec.md" → "/Projects/MVP/spec.md"
 */
export function computeDocumentPath(folderPath: string | null, fileName: string): string {
  if (!folderPath || folderPath === '/') {
    return `/${fileName}`;
  }
  return `${folderPath}/${fileName}`;
}

/**
 * Compute breadcrumb segments from path
 * Example: "/Projects/MVP/spec.md" → ["Projects", "MVP", "spec.md"]
 */
export function pathToBreadcrumbs(path: string): string[] {
  if (!path || path === '/') {
    return [];
  }
  return path.split('/').filter(segment => segment.length > 0);
}

/**
 * Compute parent path from full path
 * Example: "/Projects/MVP/spec.md" → "/Projects/MVP"
 */
export function getParentPath(path: string): string | null {
  if (!path || path === '/') {
    return null;
  }

  const segments = path.split('/').filter(segment => segment.length > 0);
  if (segments.length <= 1) {
    return '/';
  }

  segments.pop(); // Remove last segment
  return '/' + segments.join('/');
}

/**
 * Get name from path (last segment)
 * Example: "/Projects/MVP/spec.md" → "spec.md"
 */
export function getNameFromPath(path: string): string {
  if (!path || path === '/') {
    return '';
  }

  const segments = path.split('/').filter(segment => segment.length > 0);
  return segments[segments.length - 1] || '';
}

/**
 * Check if a path is an ancestor of another path
 * Example: "/Projects" is ancestor of "/Projects/MVP/spec.md"
 */
export function isAncestorPath(ancestorPath: string, descendantPath: string): boolean {
  if (!ancestorPath || !descendantPath) {
    return false;
  }

  if (ancestorPath === '/') {
    return true; // Root is ancestor of everything
  }

  return descendantPath.startsWith(ancestorPath + '/');
}

/**
 * Compute new paths for all descendants when a folder is renamed or moved
 * Used by backend Edge Functions for path recomputation
 */
export function recomputeDescendantPaths(
  oldPath: string,
  newPath: string,
  descendantPaths: string[]
): Map<string, string> {
  const pathMap = new Map<string, string>();

  for (const descendantPath of descendantPaths) {
    if (descendantPath.startsWith(oldPath + '/')) {
      const relativePath = descendantPath.substring(oldPath.length);
      const newDescendantPath = newPath + relativePath;
      pathMap.set(descendantPath, newDescendantPath);
    }
  }

  return pathMap;
}

// ============================================================================
// Folder Hierarchy Utilities
// ============================================================================

/**
 * Build a map of folder ID → folder path for fast lookup
 * Used by backend to avoid recursive queries
 */
export function buildFolderPathMap(folders: Folder[]): Map<string, string> {
  const pathMap = new Map<string, string>();

  for (const folder of folders) {
    pathMap.set(folder.id, folder.path);
  }

  return pathMap;
}

/**
 * Find all descendant folder IDs for a given folder ID
 * Used for checking circular references and cascade operations
 */
export function findDescendantFolderIds(
  folderId: string,
  folders: Folder[]
): Set<string> {
  const descendants = new Set<string>();
  const queue: string[] = [folderId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    descendants.add(currentId);

    // Find children
    const children = folders.filter(f => f.parent_folder_id === currentId);
    for (const child of children) {
      if (!descendants.has(child.id)) {
        queue.push(child.id);
      }
    }
  }

  descendants.delete(folderId); // Remove self from descendants
  return descendants;
}

/**
 * Check if moving a folder would create a circular reference
 * Example: Cannot move "/Projects" into "/Projects/MVP"
 */
export function wouldCreateCircularReference(
  folderId: string,
  newParentId: string,
  folders: Folder[]
): boolean {
  if (folderId === newParentId) {
    return true; // Cannot be parent of itself
  }

  const descendants = findDescendantFolderIds(folderId, folders);
  return descendants.has(newParentId);
}
