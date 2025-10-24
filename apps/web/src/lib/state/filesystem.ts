/**
 * Filesystem State (Valtio)
 *
 * Manages file tree data (folders + documents) with real-time updates
 */

import { proxy } from 'valtio';
import { initDocumentMetadata, clearDocumentMetadata } from './documentMetadata';
import type { Folder, Document, FileSystemNode } from '@centrid/shared/types';

// ============================================================================
// State Definition
// ============================================================================

interface FilesystemState {
  folders: Folder[];
  documents: Document[];
  selectedDocument: Document | null;
  selectedFolder: string | null; // folder_id for context menu/operations
  treeData: FileSystemNode[]; // Computed tree structure for UI
  loading: boolean;
  error: string | null;
}

export const filesystemState = proxy<FilesystemState>({
  folders: [],
  documents: [],
  selectedDocument: null,
  selectedFolder: null,
  treeData: [],
  loading: false,
  error: null,
});

// ============================================================================
// State Actions
// ============================================================================

/**
 * Build file tree structure from flat folders + documents arrays
 * Converts flat data into hierarchical FileSystemNode tree
 */
export function buildFileSystemTree(
  folders: Folder[],
  documents: Document[]
): FileSystemNode[] {
  // Convert folders to nodes
  const folderNodes: FileSystemNode[] = folders.map(f => ({
    id: f.id,
    name: f.name,
    type: 'folder' as const,
    parentId: f.parent_folder_id,
    path: f.path,
    children: [],
  }));

  // Convert documents to nodes
  const documentNodes: FileSystemNode[] = documents.map(d => ({
    id: d.id,
    name: d.name,
    type: 'document' as const,
    parentId: d.folder_id,
    path: d.path,
    fileSize: d.file_size,
    mimeType: d.mime_type,
    version: d.version,
    indexingStatus: d.indexing_status,
    updatedAt: d.updated_at,
  }));

  // Build tree by nesting children into parents
  const allNodes = [...folderNodes, ...documentNodes];
  const nodeMap = new Map(allNodes.map(n => [n.id, n]));
  const rootNodes: FileSystemNode[] = [];

  for (const node of allNodes) {
    if (node.parentId === null) {
      rootNodes.push(node);
    } else {
      const parent = nodeMap.get(node.parentId);
      if (parent && parent.type === 'folder') {
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
      if (a.type === 'folder' && b.type === 'document') return -1;
      if (a.type === 'document' && b.type === 'folder') return 1;
      // Alphabetically within same type
      return a.name.localeCompare(b.name);
    });

    // Recursively sort children
    sorted.forEach(node => {
      if (node.children) {
        node.children = sortNodes(node.children);
      }
    });

    return sorted;
  };

  return sortNodes(rootNodes);
}

/**
 * Update tree data from current folders + documents state
 */
export function updateTreeData() {
  filesystemState.treeData = buildFileSystemTree(
    filesystemState.folders,
    filesystemState.documents
  );
}

/**
 * Add folder to state (from INSERT real-time event or HTTP response)
 * IDEMPOTENT: Safe to call multiple times with same folder
 */
export function addFolder(folder: Folder) {
  // Check if folder already exists (prevent duplicates from HTTP + real-time)
  const exists = filesystemState.folders.some(f => f.id === folder.id);
  if (exists) {
    console.log(`[Filesystem] Folder ${folder.id} already exists, skipping duplicate add`);
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
  const index = filesystemState.folders.findIndex(f => f.id === folderId);
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
  filesystemState.folders = filesystemState.folders.filter(f => f.id !== folderId);
  updateTreeData();
}

/**
 * Add document to state (from INSERT real-time event)
 */
/**
 * Add document to state (from INSERT real-time event or HTTP response)
 * IDEMPOTENT: Safe to call multiple times with same document
 * Automatically initializes metadata
 */
export function addDocument(document: Document) {
  // Check if document already exists (prevent duplicates from HTTP + real-time)
  const exists = filesystemState.documents.some(d => d.id === document.id);
  if (exists) {
    console.log(`[Filesystem] Document ${document.id} already exists, skipping duplicate add`);
    return;
  }

  filesystemState.documents.push(document);
  updateTreeData();

  // Automatically initialize metadata when document enters state
  // initDocumentMetadata is idempotent (defensive)
  // NOTE: version is NOT stored in metadata - read from Document.version instead
  initDocumentMetadata(document.id, document.content_text || '');
  console.log(`[Filesystem] Added document ${document.id} and initialized metadata`);
}

/**
 * Update document in state (from UPDATE real-time event)
 */
export function updateDocument(documentId: string, updates: Partial<Document>) {
  const index = filesystemState.documents.findIndex(d => d.id === documentId);
  if (index !== -1) {
    filesystemState.documents[index] = {
      ...filesystemState.documents[index],
      ...updates,
    };

    // Update selected document if it's the one being updated
    if (filesystemState.selectedDocument?.id === documentId) {
      filesystemState.selectedDocument = {
        ...filesystemState.selectedDocument,
        ...updates,
      };
    }

    updateTreeData();
  }
}

/**
 * Remove document from state (from DELETE real-time event)
 * Automatically cleans up metadata to prevent memory leaks
 */
export function removeDocument(documentId: string) {
  filesystemState.documents = filesystemState.documents.filter(d => d.id !== documentId);

  // Clear selection if deleted document was selected
  if (filesystemState.selectedDocument?.id === documentId) {
    filesystemState.selectedDocument = null;
  }

  // CRITICAL: Clean up metadata to prevent memory leaks
  clearDocumentMetadata(documentId);
  console.log(`[Filesystem] Removed document ${documentId} and cleaned up metadata`);

  updateTreeData();
}

/**
 * Select a document (opens in editor)
 */
export function selectDocument(documentId: string) {
  const document = filesystemState.documents.find(d => d.id === documentId);
  if (document) {
    filesystemState.selectedDocument = document;
  }
}

/**
 * Clear selected document (close editor)
 */
export function clearDocumentSelection() {
  filesystemState.selectedDocument = null;
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
  filesystemState.documents = [];
  filesystemState.selectedDocument = null;
  filesystemState.selectedFolder = null;
  filesystemState.treeData = [];
  filesystemState.loading = false;
  filesystemState.error = null;
}
