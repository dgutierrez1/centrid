import { useState, useEffect } from 'react';
import { useSnapshot } from 'valtio';
import { filesystemState } from '@/lib/state/filesystem';
import { editorState } from '@/lib/state/editor';
import { documentMetadataState } from '@/lib/state/documentMetadata';
import type { FileTreeNodeData } from '@centrid/ui/features/filesystem-markdown-editor';

/**
 * Hook to provide data for the DesktopWorkspace component
 * Integrates Valtio state with the designed component props
 */
export function useWorkspaceData() {
  const filesystem = useSnapshot(filesystemState);
  const editor = useSnapshot(editorState);
  const documentMetadata = useSnapshot(documentMetadataState);
  const [user, setUser] = useState({ initials: 'U', name: 'User' });

  // Convert filesystem state to file tree format expected by DesktopWorkspace
  const fileTreeData: FileTreeNodeData[] = [];

  // Add folders to tree
  filesystem.folders.forEach((folder) => {
    const node: FileTreeNodeData = {
      id: folder.id,
      name: folder.name,
      type: 'folder' as const,
      expanded: true, // TODO: track expansion state
      children: [],
    };

    // Add documents in this folder
    const docsInFolder = filesystem.documents.filter(
      (doc) => doc.folder_id === folder.id
    );
    docsInFolder.forEach((doc) => {
      node.children!.push({
        id: doc.id,
        name: doc.name,
        type: 'file' as const,
      });
    });

    // Only add folder if it has children or is root level
    if (node.children!.length > 0 || !folder.parent_folder_id) {
      fileTreeData.push(node);
    }
  });

  // Add root-level documents
  const rootDocs = filesystem.documents.filter((doc) => !doc.folder_id);
  rootDocs.forEach((doc) => {
    fileTreeData.push({
      id: doc.id,
      name: doc.name,
      type: 'file' as const,
    });
  });

  // Get current user info (placeholder - should come from auth)
  useEffect(() => {
    // TODO: Fetch from auth session
    setUser({ initials: 'DG', name: 'User' });
  }, []);

  // Map save status from document metadata to component props
  const mapSaveStatus = (
    status: 'idle' | 'saving' | 'saved' | 'error' | 'conflict'
  ): 'saving' | 'saved' | 'error' | 'idle' => {
    if (status === 'saving') return 'saving';
    if (status === 'saved') return 'saved';
    if (status === 'error' || status === 'conflict') return 'error';
    return 'idle'; // idle state (document at rest, saved)
  };

  // Look up selected document name for display (not UUID)
  const currentDocId = editor.currentDocumentId;
  const selectedFileName = currentDocId
    ? filesystem.documents.find(d => d.id === currentDocId)?.name || ''
    : '';

  // Compute folder path for current document
  const computeFolderPath = (documentId: string): string => {
    const document = filesystem.documents.find(d => d.id === documentId);
    if (!document || !document.folder_id) {
      return 'Root';
    }

    const pathParts: string[] = [];
    let currentFolderId: string | null = document.folder_id;

    // Traverse up the folder hierarchy (limit to 10 to prevent infinite loops)
    let depth = 0;
    while (currentFolderId && depth < 10) {
      const folder = filesystem.folders.find(f => f.id === currentFolderId);
      if (!folder) break;

      pathParts.unshift(folder.name);
      currentFolderId = folder.parent_folder_id;
      depth++;
    }

    return pathParts.length > 0 ? pathParts.join(' / ') : 'Root';
  };

  const folderPath = currentDocId ? computeFolderPath(currentDocId) : 'Root';

  // Get metadata for current document (for save status)
  // IMPORTANT: Access through snapshot for Valtio reactivity
  const currentDocMetadata = currentDocId ? documentMetadata.documents[currentDocId] : undefined;

  // Calculate hasUnsavedChanges by comparing editor content with metadata
  const hasUnsavedChanges = currentDocId && currentDocMetadata
    ? editor.content !== currentDocMetadata.lastSavedContent
    : false;

  // Debug log to track status values
  if (currentDocMetadata) {
    console.log('[useWorkspaceData] currentDocMetadata.saveStatus:', currentDocMetadata.saveStatus);
  }

  return {
    // File tree data
    fileTreeData,

    // Selected file state (returns document ID for logic)
    selectedFile: currentDocId || '',

    // Selected file name (returns friendly name for display)
    selectedFileName,

    // Folder path for selected file
    folderPath,

    // Editor content
    editorContent: editor.content,

    // Save status (read from current document's metadata)
    saveStatus: currentDocMetadata ? mapSaveStatus(currentDocMetadata.saveStatus) : 'idle',

    // Save status metadata (read from current document's metadata)
    lastSavedAt: currentDocMetadata?.lastSavedAt || null,
    hasUnsavedChanges,

    // User info
    user,

    // App info
    logo: 'C',
    appName: 'Centrid',
  };
}
