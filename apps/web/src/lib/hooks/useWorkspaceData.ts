import { useState, useEffect } from 'react';
import { useSnapshot } from 'valtio';
import { filesystemState } from '@/lib/state/filesystem';
import { editorState } from '@/lib/state/editor';
import { fileMetadataState } from '@/lib/state/fileMetadata';
import type { FileTreeNodeData } from '@centrid/ui/features/filesystem-markdown-editor';

/**
 * Hook to provide data for the DesktopWorkspace component
 * Integrates Valtio state with the designed component props
 */
export function useWorkspaceData() {
  const filesystem = useSnapshot(filesystemState);
  const editor = useSnapshot(editorState);
  const fileMetadata = useSnapshot(fileMetadataState);
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

    // Add files in this folder
    const filesInFolder = filesystem.files.filter(
      (file) => file.folderId === folder.id
    );
    filesInFolder.forEach((file) => {
      node.children!.push({
        id: file.id || '',
        name: file.name || 'Untitled',
        type: 'file' as const,
      });
    });

    // Only add folder if it has children or is root level
    if (node.children!.length > 0 || !folder.parent_folder_id) {
      fileTreeData.push(node);
    }
  });

  // Add root-level files
  const rootFiles = filesystem.files.filter((file) => !file.folderId);
  rootFiles.forEach((file) => {
    fileTreeData.push({
      id: file.id || '',
      name: file.name || 'Untitled',
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

  // Look up selected file name for display (not UUID)
  const currentDocId = editor.currentDocumentId;
  const selectedFileName = currentDocId
    ? filesystem.files.find(f => f.id === currentDocId)?.name || ''
    : '';

  // Compute folder path for current file
  const computeFolderPath = (fileId: string): string => {
    const file = filesystem.files.find(f => f.id === fileId);
    if (!file || !file.folderId) {
      return 'Root';
    }

    const pathParts: string[] = [];
    let currentFolderId: string | null = file.folderId;

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

  // Get metadata for current file (for save status)
  // IMPORTANT: Access through snapshot for Valtio reactivity
  const currentFileMetadata = (currentDocId && fileMetadata.currentFile?.fileId === currentDocId)
    ? fileMetadata.currentFile
    : undefined;

  // Calculate hasUnsavedChanges by comparing editor content with metadata
  const hasUnsavedChanges = currentDocId && currentFileMetadata
    ? editor.content !== currentFileMetadata.lastSavedContent
    : false;

  // Debug log to track status values
  if (currentFileMetadata) {
    console.log('[useWorkspaceData] currentFileMetadata.saveStatus:', currentFileMetadata.saveStatus);
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

    // Save status (read from current file's metadata)
    saveStatus: currentFileMetadata ? mapSaveStatus(currentFileMetadata.saveStatus) : 'idle',

    // Save status metadata (read from current file's metadata)
    lastSavedAt: currentFileMetadata?.lastSavedAt || null,
    hasUnsavedChanges,

    // User info
    user,

    // App info
    logo: 'C',
    appName: 'Centrid',
  };
}
