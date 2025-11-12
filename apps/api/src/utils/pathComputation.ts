/**
 * Path Computation Utilities
 *
 * Server-side path computation for files based on folder hierarchy.
 * Keeps `name` as source of truth, `path` as computed field.
 */

import type { Folder } from '../db/types.ts';

/**
 * Get folder path by traversing hierarchy
 * @param folders - All folders in the workspace
 * @param folderId - Target folder ID
 * @returns Full path string (e.g., "folder1/folder2")
 */
export function getFolderPath(
  folders: Folder[],
  folderId: string | null
): string {
  if (!folderId) {
    return '';
  }

  const pathParts: string[] = [];
  let currentFolderId: string | null = folderId;
  let depth = 0;
  const maxDepth = 100; // Prevent infinite loops

  while (currentFolderId && depth < maxDepth) {
    const folder = folders.find(f => f.id === currentFolderId);
    if (!folder) {
      console.warn(`[pathComputation] Folder not found: ${currentFolderId}`);
      break;
    }

    pathParts.unshift(folder.name);
    currentFolderId = folder.parentFolderId;
    depth++;
  }

  return pathParts.join('/');
}

/**
 * Compute full file path from folder hierarchy + filename
 * @param folders - All folders in the workspace
 * @param folderId - Folder containing the file (null for root)
 * @param fileName - Filename with extension
 * @returns Full path string (e.g., "folder1/folder2/file.md" or "file.md")
 */
export function computeFilePath(
  folders: Folder[],
  folderId: string | null,
  fileName: string
): string {
  if (!folderId) {
    // Root-level file
    return fileName;
  }

  const folderPath = getFolderPath(folders, folderId);
  return folderPath ? `${folderPath}/${fileName}` : fileName;
}

/**
 * Parse file path into folder path and filename
 * Utility for AI tools that reference files by full path
 * @param path - Full file path (e.g., "folder1/folder2/file.md")
 * @returns Object with folderPath and fileName
 */
export function parseFilePath(path: string): {
  folderPath: string;
  fileName: string;
} {
  const parts = path.split('/');
  const fileName = parts.pop() || path;
  const folderPath = parts.join('/');

  return { folderPath, fileName };
}

/**
 * Resolve folder ID from path (for AI tools)
 * This would need to query the database to find/create folders
 * TODO: Implement in service layer with database access
 */
export async function resolveFolderPath(
  folderPath: string,
  userId: string,
  // Pass repository or service for folder operations
  folderOperations: {
    findByPath: (path: string, userId: string) => Promise<Folder | null>;
    create: (name: string, parentId: string | null, userId: string) => Promise<Folder>;
  }
): Promise<string | null> {
  if (!folderPath) {
    return null; // Root level
  }

  const folderNames = folderPath.split('/');
  let currentParentId: string | null = null;
  let currentPath = '';

  for (const folderName of folderNames) {
    currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;

    // Try to find existing folder
    let folder = await folderOperations.findByPath(currentPath, userId);

    // Create if doesn't exist
    if (!folder) {
      folder = await folderOperations.create(folderName, currentParentId, userId);
    }

    currentParentId = folder.id;
  }

  return currentParentId;
}
