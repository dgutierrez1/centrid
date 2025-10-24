import { useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { useFileSystem } from '@/lib/contexts/filesystem.context';
import { FilesystemService } from '@/lib/services/filesystem.service';
import {
  filesystemState,
  addFolder,
  addDocument,
  updateFolder,
  updateDocument,
  removeFolder,
  removeDocument,
} from '@/lib/state/filesystem';
import { editorState, clearEditor, loadDocument } from '@/lib/state/editor';
import type { Folder, Document } from '@centrid/shared/types';

/**
 * useFilesystemOperations - Custom hook for filesystem operations
 *
 * Wraps FilesystemService and provides:
 * - Loading states (useState)
 * - Toast notifications (react-hot-toast)
 * - Optimistic updates (Valtio)
 * - Error rollback with actual state values
 *
 * Architecture: UI Components → useFilesystemOperations → FilesystemService → Edge Functions
 */

export function useFilesystemOperations() {
  const router = useRouter();
  const { user, getFolder, getDocument } = useFileSystem();

  // Loading states (per operation)
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isCreatingDocument, setIsCreatingDocument] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ===== FOLDER OPERATIONS =====

  /**
   * Create a new folder with optimistic update
   */
  const createFolder = async (name: string, parentFolderId: string | null) => {
    if (!user) {
      toast.error('You must be logged in to create folders');
      return { success: false, error: 'Not authenticated' };
    }

    setIsCreatingFolder(true);

    // Optimistic update - add temporary folder immediately
    const tempId = `temp-folder-${Date.now()}`;
    const optimisticFolder: Folder = {
      id: tempId,
      name,
      parent_folder_id: parentFolderId,
      path: parentFolderId ? `parent/${name}` : name,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addFolder(optimisticFolder);

    try {
      const { data, error } = await FilesystemService.createFolder(name, parentFolderId);

      if (error) {
        // Rollback optimistic update
        removeFolder(tempId);
        toast.error(`Failed to create folder: ${error}`);
        return { success: false, error };
      }

      // Replace temp with real data (real-time subscription will also update)
      removeFolder(tempId);
      if (data) {
        addFolder(data);
      }

      toast.success(`Folder "${name}" created`);
      return { success: true, data };
    } catch (error) {
      // Rollback on unexpected error
      removeFolder(tempId);
      toast.error('Unexpected error creating folder');
      return { success: false, error: String(error) };
    } finally {
      setIsCreatingFolder(false);
    }
  };

  /**
   * Rename a folder with optimistic update
   */
  const renameFolder = async (folderId: string, newName: string) => {
    setIsRenaming(true);

    // Store original name for rollback
    const originalFolder = getFolder(folderId);
    if (!originalFolder) {
      toast.error('Folder not found');
      setIsRenaming(false);
      return { success: false, error: 'Folder not found' };
    }
    const originalName = originalFolder.name;

    // Optimistic update
    updateFolder(folderId, { name: newName });

    try {
      const { data, error } = await FilesystemService.renameFolder(folderId, newName);

      if (error) {
        // Rollback optimistic update
        updateFolder(folderId, { name: originalName });
        toast.error(`Failed to rename folder: ${error}`);
        return { success: false, error };
      }

      // Real-time subscription will confirm
      toast.success(`Folder renamed to "${newName}"`);
      return { success: true, data };
    } catch (error) {
      // Rollback on unexpected error
      updateFolder(folderId, { name: originalName });
      toast.error('Unexpected error renaming folder');
      return { success: false, error: String(error) };
    } finally {
      setIsRenaming(false);
    }
  };

  /**
   * Move a folder with optimistic update
   */
  const moveFolder = async (folderId: string, newParentId: string | null) => {
    setIsMoving(true);

    // Store original parent for rollback
    const originalFolder = getFolder(folderId);
    if (!originalFolder) {
      toast.error('Folder not found');
      setIsMoving(false);
      return { success: false, error: 'Folder not found' };
    }
    const originalParentId = originalFolder.parent_folder_id;

    // Optimistic update
    updateFolder(folderId, { parent_folder_id: newParentId });

    try {
      const { data, error } = await FilesystemService.moveFolder(folderId, newParentId);

      if (error) {
        // Rollback optimistic update
        updateFolder(folderId, { parent_folder_id: originalParentId });
        toast.error(`Failed to move folder: ${error}`);
        return { success: false, error };
      }

      // Real-time subscription will confirm
      toast.success('Folder moved');
      return { success: true, data };
    } catch (error) {
      // Rollback on unexpected error
      updateFolder(folderId, { parent_folder_id: originalParentId });
      toast.error('Unexpected error moving folder');
      return { success: false, error: String(error) };
    } finally {
      setIsMoving(false);
    }
  };

  /**
   * Delete a folder with optimistic update
   */
  const deleteFolder = async (folderId: string) => {
    setIsDeleting(true);

    // Store original folder for rollback
    const originalFolder = getFolder(folderId);
    if (!originalFolder) {
      toast.error('Folder not found');
      setIsDeleting(false);
      return { success: false, error: 'Folder not found' };
    }

    // Check if currently open document is in this folder
    const currentDocId = editorState.currentDocumentId;
    const currentDoc = currentDocId ? filesystemState.documents.find(d => d.id === currentDocId) : null;
    const wasOpenDocInFolder = currentDoc && currentDoc.folder_id === folderId;

    // Optimistic update - remove immediately
    removeFolder(folderId);

    // If currently open document was in the folder, clear editor and navigate
    if (wasOpenDocInFolder) {
      clearEditor();
      router.push('/workspace');
    }

    try {
      const { error } = await FilesystemService.deleteFolder(folderId);

      if (error) {
        // Rollback optimistic update
        if (originalFolder) {
          addFolder(originalFolder);
        }
        toast.error(`Failed to delete folder: ${error}`);
        return { success: false, error };
      }

      // Real-time subscription will confirm
      toast.success('Folder deleted');
      return { success: true };
    } catch (error) {
      // Rollback on unexpected error
      if (originalFolder) {
        addFolder(originalFolder);
      }
      toast.error('Unexpected error deleting folder');
      return { success: false, error: String(error) };
    } finally {
      setIsDeleting(false);
    }
  };

  // ===== DOCUMENT OPERATIONS =====

  /**
   * Create a new document with optimistic update
   */
  const createDocument = async (name: string, folderId: string | null) => {
    if (!user) {
      toast.error('You must be logged in to create documents');
      return { success: false, error: 'Not authenticated' };
    }

    setIsCreatingDocument(true);

    // Optimistic update - add temporary document immediately
    const tempId = `temp-document-${Date.now()}`;
    const optimisticDocument: Document = {
      id: tempId,
      name,
      folder_id: folderId,
      path: folderId ? `folder/${name}` : name,
      user_id: user.id,
      content_text: '',
      content_markdown: '',
      file_size: 0,
      mime_type: 'text/markdown',
      version: 0,
      indexing_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addDocument(optimisticDocument);

    try {
      const { data, error } = await FilesystemService.createDocument(name, folderId);

      if (error) {
        // Rollback optimistic update
        removeDocument(tempId);
        toast.error(`Failed to create document: ${error}`);
        return { success: false, error };
      }

      // Replace temp with real data (real-time subscription will also update)
      removeDocument(tempId);
      if (data) {
        // addDocument automatically initializes metadata
        addDocument(data);
      }

      toast.success(`Document "${name}" created`);
      return { success: true, data };
    } catch (error) {
      // Rollback on unexpected error
      removeDocument(tempId);
      toast.error('Unexpected error creating document');
      return { success: false, error: String(error) };
    } finally {
      setIsCreatingDocument(false);
    }
  };

  /**
   * Rename a document with optimistic update
   */
  const renameDocument = async (documentId: string, newName: string) => {
    setIsRenaming(true);

    // Store original name for rollback
    const originalDocument = getDocument(documentId);
    if (!originalDocument) {
      toast.error('Document not found');
      setIsRenaming(false);
      return { success: false, error: 'Document not found' };
    }
    const originalName = originalDocument.name;

    // Optimistic update
    updateDocument(documentId, { name: newName });

    try {
      const { data, error } = await FilesystemService.renameDocument(documentId, newName);

      if (error) {
        // Rollback optimistic update
        updateDocument(documentId, { name: originalName });
        toast.error(`Failed to rename document: ${error}`);
        return { success: false, error };
      }

      // Real-time subscription will confirm
      toast.success(`Document renamed to "${newName}"`);
      return { success: true, data };
    } catch (error) {
      // Rollback on unexpected error
      updateDocument(documentId, { name: originalName });
      toast.error('Unexpected error renaming document');
      return { success: false, error: String(error) };
    } finally {
      setIsRenaming(false);
    }
  };

  /**
   * Move a document with optimistic update
   */
  const moveDocument = async (documentId: string, newFolderId: string | null) => {
    setIsMoving(true);

    // Store original folder for rollback
    const originalDocument = getDocument(documentId);
    if (!originalDocument) {
      toast.error('Document not found');
      setIsMoving(false);
      return { success: false, error: 'Document not found' };
    }
    const originalFolderId = originalDocument.folder_id;

    // Optimistic update
    updateDocument(documentId, { folder_id: newFolderId });

    try {
      const { data, error } = await FilesystemService.moveDocument(documentId, newFolderId);

      if (error) {
        // Rollback optimistic update
        updateDocument(documentId, { folder_id: originalFolderId });
        toast.error(`Failed to move document: ${error}`);
        return { success: false, error };
      }

      // Real-time subscription will confirm
      toast.success('Document moved');
      return { success: true, data };
    } catch (error) {
      // Rollback on unexpected error
      updateDocument(documentId, { folder_id: originalFolderId });
      toast.error('Unexpected error moving document');
      return { success: false, error: String(error) };
    } finally {
      setIsMoving(false);
    }
  };

  /**
   * Delete a document with optimistic update
   */
  const deleteDocument = async (documentId: string) => {
    setIsDeleting(true);

    // Store original document for rollback
    const originalDocument = getDocument(documentId);
    if (!originalDocument) {
      toast.error('Document not found');
      setIsDeleting(false);
      return { success: false, error: 'Document not found' };
    }

    // Check if this document is currently open in editor
    const wasOpenInEditor = editorState.currentDocumentId === documentId;
    const previousEditorContent = wasOpenInEditor ? editorState.content : '';

    // Optimistic update - remove immediately
    removeDocument(documentId);

    // If document was open, clear the editor and navigate to workspace
    if (wasOpenInEditor) {
      clearEditor();
      router.push('/workspace');
    }

    try {
      const { error } = await FilesystemService.deleteDocument(documentId);

      if (error) {
        // Rollback optimistic update
        if (originalDocument) {
          addDocument(originalDocument);
          // If document was open, restore it in editor
          if (wasOpenInEditor) {
            loadDocument(documentId, previousEditorContent);
          }
        }
        toast.error(`Failed to delete document: ${error}`);
        return { success: false, error };
      }

      // Real-time subscription will confirm
      toast.success('Document deleted');
      return { success: true };
    } catch (error) {
      // Rollback on unexpected error
      if (originalDocument) {
        addDocument(originalDocument);
        // If document was open, restore it in editor
        if (wasOpenInEditor) {
          loadDocument(documentId, previousEditorContent);
        }
      }
      toast.error('Unexpected error deleting document');
      return { success: false, error: String(error) };
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    // Folder operations
    createFolder,
    renameFolder,
    moveFolder,
    deleteFolder,

    // Document operations
    createDocument,
    renameDocument,
    moveDocument,
    deleteDocument,

    // Loading states
    isCreatingFolder,
    isCreatingDocument,
    isRenaming,
    isMoving,
    isDeleting,
  };
}
