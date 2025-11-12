/**
 * useFileTreeActions - File tree action handlers with modal state management
 *
 * Encapsulates all file/folder operation logic:
 * - Modal state management (rename, delete, create subfolder, create file)
 * - Action handlers for three-dot menu
 * - Confirmation handlers for modals
 * - Integration with useFilesystemOperations
 *
 * This hook separates UI logic from business logic, making WorkspaceContainer cleaner.
 */

import { useState, useCallback } from 'react';
import { useFilesystemOperations } from './useFilesystemOperations';
import { filesystemState, clearFileSelection } from '@/lib/state/filesystem';

// Modal state types
interface RenameModalState {
  open: boolean;
  itemId: string;
  itemName: string;
  itemType: 'folder' | 'document';
}

interface DeleteModalState {
  open: boolean;
  itemId: string;
  itemName: string;
  itemType: 'folder' | 'document';
}

interface CreateSubfolderModalState {
  open: boolean;
  parentFolderId: string;
  parentFolderName: string;
}

interface CreateFileInFolderModalState {
  open: boolean;
  folderId: string;
  folderName: string;
}

export interface UseFileTreeActionsOptions {
  onFileCreated?: (fileId: string) => void;
}

export function useFileTreeActions(options?: UseFileTreeActionsOptions) {
  const { onFileCreated } = options || {};

  const {
    createDocument,
    createFolder,
    renameDocument,
    renameFolder,
    deleteDocument,
    deleteFolder,
    isCreatingDocument,
    isCreatingFolder,
    isRenaming,
    isDeleting,
  } = useFilesystemOperations();

  // Modal states
  const [renameModal, setRenameModal] = useState<RenameModalState | null>(null);
  const [deleteModal, setDeleteModal] = useState<DeleteModalState | null>(null);
  const [createSubfolderModal, setCreateSubfolderModal] = useState<CreateSubfolderModalState | null>(null);
  const [createFileInFolderModal, setCreateFileInFolderModal] = useState<CreateFileInFolderModalState | null>(null);

  // ===== ACTION HANDLERS (for WorkspaceSidebar) =====

  const handleFileRename = useCallback((fileId: string, fileName: string) => {
    setRenameModal({
      open: true,
      itemId: fileId,
      itemName: fileName,
      itemType: 'document',
    });
  }, []);

  const handleFileDelete = useCallback((fileId: string, fileName: string) => {
    setDeleteModal({
      open: true,
      itemId: fileId,
      itemName: fileName,
      itemType: 'document',
    });
  }, []);

  const handleFolderRename = useCallback((folderId: string, folderName: string) => {
    setRenameModal({
      open: true,
      itemId: folderId,
      itemName: folderName,
      itemType: 'folder',
    });
  }, []);

  const handleFolderDelete = useCallback((folderId: string, folderName: string) => {
    setDeleteModal({
      open: true,
      itemId: folderId,
      itemName: folderName,
      itemType: 'folder',
    });
  }, []);

  const handleCreateSubfolder = useCallback((parentFolderId: string, parentFolderName: string) => {
    setCreateSubfolderModal({
      open: true,
      parentFolderId,
      parentFolderName,
    });
  }, []);

  const handleCreateFileInFolder = useCallback((folderId: string, folderName: string) => {
    setCreateFileInFolderModal({
      open: true,
      folderId,
      folderName,
    });
  }, []);

  const handleUploadToFolder = useCallback((folderId: string, folderName: string) => {
    // TODO: Implement upload modal
    console.warn(`Upload to folder "${folderName}" (${folderId}) not yet implemented`);
  }, []);

  // ===== CONFIRMATION HANDLERS (for modals) =====

  const handleRenameConfirm = useCallback(
    async (newName: string) => {
      if (!renameModal) return;

      if (renameModal.itemType === 'folder') {
        await renameFolder(renameModal.itemId, newName).promise;
      } else {
        await renameDocument(renameModal.itemId, newName).promise;
      }

      setRenameModal(null);
    },
    [renameModal, renameFolder, renameDocument]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteModal) return;

    // Close file editor if deleting the currently open file
    if (deleteModal.itemType === 'document' && filesystemState.selectedFile?.id === deleteModal.itemId) {
      clearFileSelection();
    }

    // Close file editor if deleting a folder containing the currently open file
    if (deleteModal.itemType === 'folder' && filesystemState.selectedFile) {
      const openFile = filesystemState.selectedFile;
      const folderIdToDelete = deleteModal.itemId;

      // Check if the open file is in this folder (direct or nested)
      if (openFile.folderId === folderIdToDelete) {
        clearFileSelection();
      }
      // TODO: Check nested folders recursively if needed
    }

    if (deleteModal.itemType === 'folder') {
      await deleteFolder(deleteModal.itemId).promise;
    } else {
      await deleteDocument(deleteModal.itemId).promise;
    }

    setDeleteModal(null);
  }, [deleteModal, deleteFolder, deleteDocument]);

  const handleCreateSubfolderConfirm = useCallback(
    async (name: string) => {
      if (!createSubfolderModal) return;
      await createFolder(name, createSubfolderModal.parentFolderId).promise;
      setCreateSubfolderModal(null);
    },
    [createSubfolderModal, createFolder]
  );

  const handleCreateFileInFolderConfirm = useCallback(
    async (name: string) => {
      if (!createFileInFolderModal) return;

      // Get permanentId immediately for optimistic UI updates
      const result = createDocument(name, createFileInFolderModal.folderId);

      // Notify parent that file was created (triggers panel opening + tree expansion)
      onFileCreated?.(result.permanentId);

      // Wait for server confirmation before closing modal
      await result.promise;

      setCreateFileInFolderModal(null);
    },
    [createFileInFolderModal, createDocument, onFileCreated]
  );

  // ===== CLOSE HANDLERS =====

  const closeRenameModal = useCallback(() => {
    setRenameModal(null);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setDeleteModal(null);
  }, []);

  const closeCreateSubfolderModal = useCallback(() => {
    setCreateSubfolderModal(null);
  }, []);

  const closeCreateFileInFolderModal = useCallback(() => {
    setCreateFileInFolderModal(null);
  }, []);

  // ===== PUBLIC API =====

  return {
    // Action handlers (for WorkspaceSidebar)
    handleFileRename,
    handleFileDelete,
    handleFolderRename,
    handleFolderDelete,
    handleCreateSubfolder,
    handleCreateFileInFolder,
    handleUploadToFolder,

    // Confirmation handlers (for modals)
    handleRenameConfirm,
    handleDeleteConfirm,
    handleCreateSubfolderConfirm,
    handleCreateFileInFolderConfirm,

    // Modal state
    renameModal,
    deleteModal,
    createSubfolderModal,
    createFileInFolderModal,

    // Close handlers
    closeRenameModal,
    closeDeleteModal,
    closeCreateSubfolderModal,
    closeCreateFileInFolderModal,

    // Loading states
    isRenaming,
    isDeleting,
    isCreating: isCreatingFolder || isCreatingDocument,
  };
}
