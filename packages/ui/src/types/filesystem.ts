/**
 * File system node types
 * Used by file tree components
 *
 * Tree structure for file/folder hierarchy in UI components.
 * Built from flat folder/file lists by buildFileSystemTree() function.
 * Used for rendering hierarchical file trees with expand/collapse.
 */

export interface FileSystemNode {
  id: string;
  name: string;
  type: 'file' | 'folder' | 'document'; // 'document' is alias for 'file'
  parentId?: string | null;
  children?: FileSystemNode[];
  path?: string;
  // File-specific fields (only present when type === 'document' or 'file')
  fileSize?: number;
  mimeType?: string;
  version?: number;
  indexingStatus?: 'pending' | 'in_progress' | 'completed' | 'failed' | string;
  updatedAt?: string;
}
