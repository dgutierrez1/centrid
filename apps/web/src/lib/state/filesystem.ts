/**
 * Filesystem State (Valtio)
 *
 * Manages file tree data (folders + files) with real-time updates
 */

import { proxy } from "valtio";
import type { File, Folder } from "@/types/graphql";
import type { FileSystemNode } from "@/lib/types/ui";

// ============================================================================
// State Definition
// ============================================================================

interface FilesystemState {
  folders: Folder[];
  files: File[];
  selectedFile: File | null;
  selectedFolder: string | null; // folder_id for context menu/operations
  treeData: FileSystemNode[]; // Computed tree structure for UI
  loading: boolean;
  error: string | null;
}

export const filesystemState = proxy<FilesystemState>({
  folders: [],
  files: [],
  selectedFile: null,
  selectedFolder: null,
  treeData: [],
  loading: false,
  error: null,
});

// ============================================================================
// State Actions
// ============================================================================

/**
 * Build file tree structure from flat folders + files arrays
 * Converts flat data into hierarchical FileSystemNode tree
 */
export function buildFileSystemTree(
  folders: Folder[],
  files: File[]
): FileSystemNode[] {
  // Convert folders to nodes
  const folderNodes: FileSystemNode[] = folders.map((f) => ({
    id: f.id || '',
    name: f.name || 'Untitled',
    type: "folder" as const,
    parentId: f.parentFolderId || null,
    path: f.path || '',
    children: [],
  }));

  // Convert files to nodes
  const fileNodes: FileSystemNode[] = files.map((f) => ({
    id: f.id || '',
    name: f.name || 'Untitled',
    type: "document" as const,
    parentId: f.folderId || null,
    path: f.path || '',
    fileSize: f.fileSize || undefined,
    mimeType: f.mimeType || undefined,
    version: f.version || undefined,
    indexingStatus: f.indexingStatus || undefined,
    updatedAt: f.updatedAt || undefined,
  }));

  // Build tree by nesting children into parents
  const allNodes = [...folderNodes, ...fileNodes];
  const nodeMap = new Map(allNodes.map((n) => [n.id, n]));
  const rootNodes: FileSystemNode[] = [];

  for (const node of allNodes) {
    if (node.parentId === null || node.parentId === undefined) {
      rootNodes.push(node);
    } else {
      const parent = nodeMap.get(node.parentId);
      if (parent && parent.type === "folder") {
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(node);
      }
    }
  }

  // Sort: folders first, then alphabetically
  const sortNodes = (nodes: FileSystemNode[]): FileSystemNode[] => {
    const sorted = nodes.sort((a, b) => {
      // Folders before documents
      if (a.type === "folder" && b.type === "document") return -1;
      if (a.type === "document" && b.type === "folder") return 1;
      // Alphabetically within same type
      return a.name.localeCompare(b.name);
    });

    // Recursively sort children
    sorted.forEach((node) => {
      if (node.children) {
        node.children = sortNodes(node.children);
      }
    });

    return sorted;
  };

  return sortNodes(rootNodes);
}

/**
 * Update tree data from current folders + files state
 */
export function updateTreeData() {
  filesystemState.treeData = buildFileSystemTree(
    filesystemState.folders,
    filesystemState.files
  );
}

/**
 * Add folder to state (from INSERT real-time event or HTTP response)
 * IDEMPOTENT: Safe to call multiple times with same folder
 */
export function addFolder(folder: Folder) {
  // Check if folder already exists (prevent duplicates from HTTP + real-time)
  const exists = filesystemState.folders.some((f) => f.id === folder.id);
  if (exists) {
    console.log(
      `[Filesystem] Folder ${folder.id} already exists, skipping duplicate add`
    );
    return;
  }

  filesystemState.folders.push(folder);
  updateTreeData();
  console.log(`[Filesystem] Added folder ${folder.id}`);
}

/**
 * Update folder in state (from UPDATE real-time event)
 */
export function updateFolder(folderId: string, updates: Partial<Folder>) {
  const index = filesystemState.folders.findIndex((f) => f.id === folderId);
  if (index !== -1) {
    filesystemState.folders[index] = {
      ...filesystemState.folders[index],
      ...updates,
    };
    updateTreeData();
  }
}

/**
 * Remove folder from state (from DELETE real-time event)
 */
export function removeFolder(folderId: string) {
  filesystemState.folders = filesystemState.folders.filter(
    (f) => f.id !== folderId
  );
  updateTreeData();
}

/**
 * Add file to state (from INSERT real-time event or HTTP response)
 * IDEMPOTENT: Safe to call multiple times with same file
 * Automatically initializes metadata
 */
export function addFile(file: File) {
  // Check if file already exists (prevent duplicates from HTTP + real-time)
  const exists = filesystemState.files.some((f) => f.id === file.id);
  if (exists) {
    console.log(
      `[Filesystem] File ${file.id} already exists, skipping duplicate add`
    );
    return;
  }

  filesystemState.files.push(file);
  updateTreeData();
  console.log(`[Filesystem] Added file ${file.id}`);
}

/**
 * Update file in state (from UPDATE real-time event or GraphQL fetch)
 * Uses upsert pattern: updates existing file or adds new one
 */
export function updateFile(fileId: string, updates: Partial<File>) {
  const index = filesystemState.files.findIndex((f) => f.id === fileId);
  if (index !== -1) {
    // File exists, update it
    filesystemState.files[index] = {
      ...filesystemState.files[index],
      ...updates,
    };

    // Update selected file if it's the one being updated
    if (filesystemState.selectedFile?.id === fileId) {
      filesystemState.selectedFile = {
        ...filesystemState.selectedFile,
        ...updates,
      };
    }

    updateTreeData();
    console.log(`[Filesystem] Updated file ${fileId}`);
  } else {
    // File doesn't exist, add it if we have a complete file object
    // This handles the case where a file is fetched individually before being in the list
    if (updates.id) {
      console.log(`[Filesystem] File ${fileId} not found, adding as new file`);
      addFile(updates as File);
    } else {
      console.warn(`[Filesystem] Cannot add file ${fileId}: missing id field`);
    }
  }
}

/**
 * Remove file from state (from DELETE real-time event)
 * Automatically cleans up metadata to prevent memory leaks
 */
export function removeFile(fileId: string) {
  filesystemState.files = filesystemState.files.filter(
    (f) => f.id !== fileId
  );

  // Clear selection if deleted file was selected
  if (filesystemState.selectedFile?.id === fileId) {
    filesystemState.selectedFile = null;
  }

  updateTreeData();
  console.log(`[Filesystem] Removed file ${fileId}`);
}

/**
 * Select a file (opens in editor)
 */
export function selectFile(fileId: string) {
  const file = filesystemState.files.find((f) => f.id === fileId);
  if (file) {
    filesystemState.selectedFile = file;
  }
}

/**
 * Clear selected file (close editor)
 */
export function clearFileSelection() {
  filesystemState.selectedFile = null;
}

/**
 * Select a folder (for context menu operations)
 */
export function selectFolder(folderId: string | null) {
  filesystemState.selectedFolder = folderId;
}

/**
 * Set error state
 */
export function setError(error: string | null) {
  filesystemState.error = error;
}

/**
 * Set loading state
 */
export function setLoading(loading: boolean) {
  filesystemState.loading = loading;
}

/**
 * Reset state (e.g., on logout)
 */
export function resetFilesystemState() {
  filesystemState.folders = [];
  filesystemState.files = [];
  filesystemState.selectedFile = null;
  filesystemState.selectedFolder = null;
  filesystemState.treeData = [];
  filesystemState.loading = false;
  filesystemState.error = null;
}
