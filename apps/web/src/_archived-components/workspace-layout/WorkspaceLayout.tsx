/**
 * WorkspaceLayout - Main workspace page with three-panel layout
 *
 * Integration Strategy: Option 1 - Use Designed Feature Components
 * Uses DesktopWorkspace from @centrid/ui/features/filesystem-markdown-editor
 * This is a high-level designed component that includes all UI + layout
 * We just wire it up with data and handlers from our state management
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSnapshot } from 'valtio';
import { DesktopWorkspace } from '@centrid/ui/features/filesystem-markdown-editor';
import { WorkspaceLayoutSkeleton } from '@centrid/ui/components';
import { FileSystemProvider, useFileSystem } from '@/lib/contexts/filesystem.context';
import { useIsDesktop } from '@/lib/hooks/useMediaQuery';
import { useWorkspaceData } from '@/lib/hooks/useWorkspaceData';
import { useWorkspaceHandlers } from '@/lib/hooks/useWorkspaceHandlers';
import { useFilesystemOperations } from '@/lib/hooks/useFilesystemOperations';
import { useFileUpload } from '@/lib/contexts/file-upload.context';
import { useAutoSave, useBeforeUnload } from '@/lib/hooks/useAutoSave';
import { filesystemState } from '@/lib/state/filesystem';
import { CreateFolderModal } from '@/components/filesystem/CreateFolderModal';
import { CreateDocumentModal } from '@/components/filesystem/CreateDocumentModal';
import { FileUploadModalContainer } from '@/components/filesystem/FileUploadModalContainer';
import { RenameModal } from '@/components/filesystem/RenameModal';
import { DeleteConfirmationModal } from '@/components/filesystem/DeleteConfirmationModal';
import { ConflictResolutionModal } from '@/components/filesystem/ConflictResolutionModal';
import { SearchModal, type SearchResult } from '@/components/filesystem/SearchModal';
import { MobileWorkspaceLayout } from '@/components/layout/MobileWorkspaceLayout';

/**
 * Inner component that uses the FileSystem context
 */
function WorkspaceContent() {
  const router = useRouter();
  const isDesktop = useIsDesktop();

  // Get FileSystem provider context (for enqueueDocumentSave and version tracking)
  const { enqueueDocumentSave, getCurrentDocumentVersion, loading } = useFileSystem();

  // Get data from Valtio state (folders, documents, editor content, etc.)
  const workspaceData = useWorkspaceData();

  // Access raw filesystem state for search functionality
  const { documents, folders } = useSnapshot(filesystemState);

  // Auto-save hook - enqueues saves via provider (provider handles execution, retries, metadata)
  useAutoSave({
    documentId: workspaceData.selectedFile || '',
    onSave: enqueueDocumentSave,
    debounceMs: 5000, // 5 seconds after finishing typing
  });

  // Get event handlers (file selection, editor changes, etc.)
  // Pass enqueueDocumentSave so we can save before switching documents
  const workspaceHandlers = useWorkspaceHandlers(enqueueDocumentSave);

  // Warn and save before leaving page
  useBeforeUnload(
    workspaceData.hasUnsavedChanges,
    workspaceData.selectedFile && workspaceData.hasUnsavedChanges
      ? () => {
          const version = getCurrentDocumentVersion(workspaceData.selectedFile);
          enqueueDocumentSave(workspaceData.selectedFile, workspaceData.editorContent, version);
        }
      : undefined
  );

  // Get filesystem operations (create, rename, move, delete)
  const filesystemOps = useFilesystemOperations();

  // Get file upload modal state and handlers
  const uploadModal = useFileUpload();

  // Modal state
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [createDocumentModalOpen, setCreateDocumentModalOpen] = useState(false);
  const [parentFolderContext, setParentFolderContext] = useState<{
    folderId: string;
    folderName: string;
  } | null>(null);

  // Rename modal state
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameItem, setRenameItem] = useState<{
    id: string;
    name: string;
    type: 'folder' | 'file';
  } | null>(null);

  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<{
    id: string;
    name: string;
    type: 'folder' | 'file';
  } | null>(null);

  // Version conflict modal state
  const [conflictModalOpen, setConflictModalOpen] = useState(false);

  // Search modal state
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Detect version conflicts and show modal
  useEffect(() => {
    if ((workspaceData.saveStatus as any) === 'conflict' && workspaceData.selectedFile) {
      setConflictModalOpen(true);
    }
  }, [workspaceData.saveStatus, workspaceData.selectedFile]);

  // Load document from URL on mount
  useEffect(() => {
    if (!router.isReady) return; // Wait for router to be ready

    const docId = router.query.docId as string | undefined;

    // If there's a document ID in URL and it's different from the currently selected one
    if (docId && docId !== workspaceData.selectedFile) {
      // Use the handler to open the document (which also syncs state and version)
      workspaceHandlers.onSelectFile(docId);
    }
  }, [router.isReady, router.query.docId]); // Only run when router is ready or docId param changes

  // Keyboard shortcut for search modal (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers for toolbar actions
  const handleCreateFolder = () => {
    setParentFolderContext(null); // Root folder
    setCreateFolderModalOpen(true);
  };
  const handleCreateDocument = () => {
    setParentFolderContext(null); // Root folder
    setCreateDocumentModalOpen(true);
  };

  // Handler for subfolder creation from context menu
  const handleCreateSubfolder = (folderId: string, folderName: string) => {
    setParentFolderContext({ folderId, folderName });
    setCreateFolderModalOpen(true);
  };

  // Handler for file creation in folder from context menu
  const handleCreateFileInFolder = (folderId: string, folderName: string) => {
    setParentFolderContext({ folderId, folderName });
    setCreateDocumentModalOpen(true);
  };

  // Handler for uploading to a specific folder from context menu
  const handleUploadToFolder = (folderId: string, folderName: string) => {
    uploadModal.openUploadModal(folderId, folderName);
  };

  // Handlers for modal confirmations
  const handleConfirmCreateFolder = async (name: string, parentFolderId?: string) => {
    const result = await filesystemOps.createFolder(name, parentFolderId || null);
    if (result.success) {
      setCreateFolderModalOpen(false);
      setParentFolderContext(null); // Clear parent context
    }
  };

  const handleConfirmCreateDocument = async (name: string, parentFolderId?: string) => {
    const result = await filesystemOps.createDocument(name, parentFolderId || null);
    if (result.success && result.data) {
      setCreateDocumentModalOpen(false);
      setParentFolderContext(null); // Clear parent context

      // Automatically select and open the newly created document
      workspaceHandlers.onSelectFile(result.data.id);
    }
  };

  // Context menu handlers
  const handleRenameNode = (nodeId: string, nodeName: string, nodeType: 'folder' | 'file') => {
    setRenameItem({ id: nodeId, name: nodeName, type: nodeType });
    setRenameModalOpen(true);
  };

  const handleDeleteNode = (nodeId: string, nodeName: string, nodeType: 'folder' | 'file') => {
    setDeleteItem({ id: nodeId, name: nodeName, type: nodeType });
    setDeleteModalOpen(true);
  };

  const handleConfirmRename = async (newName: string) => {
    if (!renameItem) return;

    const result =
      renameItem.type === 'folder'
        ? await filesystemOps.renameFolder(renameItem.id, newName)
        : await filesystemOps.renameDocument(renameItem.id, newName);

    if (result.success) {
      setRenameModalOpen(false);
      setRenameItem(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;

    const result =
      deleteItem.type === 'folder'
        ? await filesystemOps.deleteFolder(deleteItem.id)
        : await filesystemOps.deleteDocument(deleteItem.id);

    if (result.success) {
      setDeleteModalOpen(false);
      setDeleteItem(null);
    }
  };

  // Handle version conflict reload
  const handleReloadDocument = () => {
    if (workspaceData.selectedFile) {
      // Re-fetch document from server (this will get latest version)
      workspaceHandlers.onSelectFile(workspaceData.selectedFile);
    }
  };

  // Search function for SearchModal
  const handleSearch = async (query: string): Promise<SearchResult[]> => {
    // Fuzzy search across folders and documents
    const normalizedQuery = query.toLowerCase();
    const results: SearchResult[] = [];

    // Search documents
    documents.forEach((doc) => {
      if (doc.name.toLowerCase().includes(normalizedQuery)) {
        // Find folder path
        const folder = folders.find((f) => f.id === doc.folder_id);
        const path = folder ? folder.name : 'Root';

        results.push({
          id: doc.id,
          name: doc.name,
          type: 'document',
          path,
          modified: new Date(doc.updated_at),
        });
      }
    });

    // Search folders
    folders.forEach((folder) => {
      if (folder.name.toLowerCase().includes(normalizedQuery)) {
        // Find parent folder path
        const parent = folders.find((f) => f.id === folder.parent_folder_id);
        const path = parent ? parent.name : 'Root';

        results.push({
          id: folder.id,
          name: folder.name,
          type: 'folder',
          path,
          modified: new Date(folder.updated_at),
        });
      }
    });

    // Sort by relevance (exact match first, then modified date)
    return results.sort((a, b) => {
      const aExact = a.name.toLowerCase() === normalizedQuery;
      const bExact = b.name.toLowerCase() === normalizedQuery;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      if (a.modified && b.modified) {
        return b.modified.getTime() - a.modified.getTime();
      }
      return 0;
    });
  };

  // Handler for search result selection
  const handleSelectSearchResult = (resultId: string) => {
    // Check if it's a document
    const document = documents.find((d) => d.id === resultId);
    if (document) {
      workspaceHandlers.onSelectFile(resultId);
      return;
    }

    // If it's a folder, we could expand it in the tree (future enhancement)
    // For now, just close the modal
  };

  // Get recent files (last 5 opened documents)
  const getRecentFiles = (): SearchResult[] => {
    // For MVP, just return the most recently modified documents
    return documents
      .slice()
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5)
      .map((doc) => {
        const folder = folders.find((f) => f.id === doc.folder_id);
        return {
          id: doc.id,
          name: doc.name,
          type: 'document' as const,
          path: folder ? folder.name : 'Root',
          modified: new Date(doc.updated_at),
        };
      });
  };

  // Show skeleton loading state while data is loading
  if (loading) {
    return <WorkspaceLayoutSkeleton />;
  }

  return (
    <>
      {/* Conditional rendering based on viewport size */}
      {isDesktop ? (
        <>
          {/*
            Designed DesktopWorkspace component from design phase
            Complete three-panel layout with file tree, editor, and chat
            Just pass data and handlers - all UI is pre-designed
          */}
          <DesktopWorkspace
        // File tree data from Valtio state
        fileTreeData={workspaceData.fileTreeData}
        selectedFile={workspaceData.selectedFile}
        selectedFileName={workspaceData.selectedFileName}
        onSelectFile={workspaceHandlers.onSelectFile}

        // Editor data and handlers
        editorContent={workspaceData.editorContent}
        onEditorChange={workspaceHandlers.onEditorChange}
        saveStatus={workspaceData.saveStatus}
        lastSavedAt={workspaceData.lastSavedAt}
        hasUnsavedChanges={workspaceData.hasUnsavedChanges}

        // App branding
        logo={workspaceData.logo}
        appName={workspaceData.appName}
        userInitials={workspaceData.user.initials}

        // Filesystem operation handlers
        onCreateFile={handleCreateDocument}
        onCreateFolder={handleCreateFolder}
        onUpload={uploadModal.openUploadModal}
        isCreatingFile={filesystemOps.isCreatingDocument}
        isCreatingFolder={filesystemOps.isCreatingFolder}

        // Context menu handlers
        onRenameNode={handleRenameNode}
        onDeleteNode={handleDeleteNode}
        onCreateSubfolder={handleCreateSubfolder}
        onCreateFileInFolder={handleCreateFileInFolder}
        onUploadToFolder={handleUploadToFolder}
        onSearch={() => setSearchModalOpen(true)}
      />
        </>
      ) : (
        <>
          {/*
            MobileWorkspaceLayout for mobile devices
            Single-panel view with bottom navigation and slide-out menu
            Uses same data and handlers but different UI layout
          */}
          <MobileWorkspaceLayout
            onCreateFile={handleCreateDocument}
            onCreateFolder={handleCreateFolder}
            onUpload={uploadModal.openUploadModal}
            onSearch={() => setSearchModalOpen(true)}
            onRenameNode={handleRenameNode}
            onDeleteNode={handleDeleteNode}
            onCreateSubfolder={handleCreateSubfolder}
            onCreateFileInFolder={handleCreateFileInFolder}
            onUploadToFolder={handleUploadToFolder}
          />
        </>
      )}

      {/* Modals for filesystem operations (shared across desktop/mobile) */}
      <CreateFolderModal
        open={createFolderModalOpen}
        onOpenChange={(open) => {
          setCreateFolderModalOpen(open);
          if (!open) setParentFolderContext(null); // Clear parent context on close
        }}
        onConfirm={handleConfirmCreateFolder}
        isLoading={filesystemOps.isCreatingFolder}
        parentFolderId={parentFolderContext?.folderId}
        parentFolderName={parentFolderContext?.folderName}
      />
      <CreateDocumentModal
        open={createDocumentModalOpen}
        onOpenChange={(open) => {
          setCreateDocumentModalOpen(open);
          if (!open) setParentFolderContext(null); // Clear parent context on close
        }}
        onConfirm={handleConfirmCreateDocument}
        isLoading={filesystemOps.isCreatingDocument}
        parentFolderId={parentFolderContext?.folderId}
        parentFolderName={parentFolderContext?.folderName}
      />
      <FileUploadModalContainer
        open={uploadModal.isUploadModalOpen}
        onOpenChange={uploadModal.setIsUploadModalOpen}
        uploadingFiles={uploadModal.uploadingFiles}
        onFilesSelected={uploadModal.addFiles}
        onRetry={uploadModal.retryUpload}
        onRemove={uploadModal.removeFile}
        onClearCompleted={uploadModal.clearCompleted}
        stats={uploadModal.getStats()}
        targetFolderId={uploadModal.targetFolderId}
        targetFolderName={uploadModal.targetFolderName}
      />

      {/* Context menu modals */}
      {renameItem && (
        <RenameModal
          open={renameModalOpen}
          onOpenChange={setRenameModalOpen}
          onConfirm={handleConfirmRename}
          currentName={renameItem.name}
          itemType={renameItem.type === 'folder' ? 'folder' : 'document'}
          isLoading={filesystemOps.isRenaming}
        />
      )}
      {deleteItem && (
        <DeleteConfirmationModal
          open={deleteModalOpen}
          onOpenChange={setDeleteModalOpen}
          onConfirm={handleConfirmDelete}
          itemName={deleteItem.name}
          itemType={deleteItem.type === 'folder' ? 'folder' : 'document'}
          isLoading={filesystemOps.isDeleting}
        />
      )}

      {/* Version conflict resolution modal */}
      {workspaceData.selectedFile && (
        <ConflictResolutionModal
          open={conflictModalOpen}
          onOpenChange={setConflictModalOpen}
          onReload={handleReloadDocument}
          documentName={workspaceData.selectedFileName || 'Document'}
        />
      )}

      {/* Search modal (Cmd+K / Ctrl+K) */}
      <SearchModal
        open={searchModalOpen}
        onOpenChange={setSearchModalOpen}
        onSelectResult={handleSelectSearchResult}
        recentFiles={getRecentFiles()}
        searchFn={handleSearch}
      />
    </>
  );
}

/**
 * Outer component that provides FileSystem context
 */
export function WorkspaceLayout() {
  return (
    <FileSystemProvider>
      <WorkspaceContent />
    </FileSystemProvider>
  );
}
