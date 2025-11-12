/**
 * UI-specific types not in GraphQL schema
 *
 * These types are computed/derived for UI purposes and don't correspond
 * directly to database entities or GraphQL types.
 */

/**
 * FileSystemNode
 * Tree structure for file/folder hierarchy in UI components
 *
 * Built from flat folder/file lists by buildFileSystemTree() function.
 * Used for rendering hierarchical file trees with expand/collapse.
 */
export interface FileSystemNode {
  id: string;
  name: string;
  type: 'folder' | 'document';
  parentId?: string | null;
  children?: FileSystemNode[];
  path?: string;
  // File-specific fields (only present when type === 'document')
  fileSize?: number;
  mimeType?: string;
  version?: number;
  indexingStatus?: string;
  updatedAt?: string;
}

