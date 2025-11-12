/**
 * useFilesystemOperations - Filesystem operations using GraphQL mutations
 *
 * Refactored to use reusable GraphQL mutation factories.
 * Handles all folder and document CRUD operations with:
 * - Optimistic updates
 * - Rollback on error
 * - Toast notifications
 * - Loading states
 *
 * Architecture: UI Components → useFilesystemOperations → GraphQL Mutation Factories → GraphQL API
 */

import { useRouter } from 'next/router';
import { useGraphQLMutation } from '@/lib/graphql/useGraphQLMutation';
import {
  CreateFolderDocument,
  UpdateFolderDocument,
  DeleteFolderDocument,
  CreateFileDocument,
  UpdateFilePartialDocument,
  DeleteFileDocument,
} from '@/types/graphql';
import { useFileSystem } from '@/lib/contexts/filesystem.context';
import {
  addFolder,
  addFile,
  updateFolder,
  updateFile,
  removeFolder,
  removeFile,
} from '@/lib/state/filesystem';
import { editorState, clearEditor, loadDocument } from '@/lib/state/editor';
import { filesystemState } from '@/lib/state/filesystem';
import type { File, Folder } from '@/types/graphql';

export function useFilesystemOperations() {
  const router = useRouter();
  const { user, getFolder, getFile } = useFileSystem();

  // ===== FOLDER OPERATIONS =====

  /**
   * Create folder mutation
   */
  const createFolderMutation = useGraphQLMutation<
    { id?: string; name: string; parentFolderId?: string | null },
    any,
    { permanentId: string }
  >({
    mutation: CreateFolderDocument,
    optimisticUpdate: (permanentId, input) => {
      if (!user) {
        throw new Error('Not authenticated');
      }

      const optimisticFolder: Folder = {
        id: permanentId,
        name: input.name,
        parentFolderId: input.parentFolderId || null,
        path: input.parentFolderId ? `parent/${input.name}` : input.name,
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addFolder(optimisticFolder);

      // Pass permanent ID to GraphQL mutation
      input.id = permanentId;

      return { permanentId };
    },
    onSuccess: ({ permanentId }, data) => {
      // Realtime subscription will confirm with same ID (no need to remove/re-add)
      // Just ensure state is updated with server data
      updateFolder(permanentId, data.createFolder);
    },
    onError: ({ permanentId }) => {
      removeFolder(permanentId);
    },
    successMessage: (data) => `Folder "${data.createFolder.name}" created`,
    errorMessage: (error) => `Failed to create folder: ${error}`,
  });

  /**
   * Rename folder mutation
   */
  const renameFolderMutation = useGraphQLMutation<
    { id: string; name?: string },
    any,
    { folderId: string; originalName: string }
  >({
    mutation: UpdateFolderDocument,
    optimisticUpdate: (tempId, input) => {
      const folder = getFolder(input.id);
      if (!folder) {
        throw new Error('Folder not found');
      }

      const originalName = folder.name;
      if (input.name) {
        updateFolder(input.id, { name: input.name });
      }

      return { folderId: input.id, originalName };
    },
    onSuccess: ({ folderId }, data) => {
      // Realtime subscription will confirm the update
    },
    onError: ({ folderId, originalName }) => {
      updateFolder(folderId, { name: originalName });
    },
    successMessage: (data) => `Folder renamed to "${data.updateFolder.name}"`,
    errorMessage: (error) => `Failed to rename folder: ${error}`,
  });

  /**
   * Move folder mutation
   */
  const moveFolderMutation = useGraphQLMutation<
    { id: string; parentFolderId?: string | null },
    any,
    { folderId: string; originalParentId: string | null }
  >({
    mutation: UpdateFolderDocument,
    optimisticUpdate: (tempId, input) => {
      const folder = getFolder(input.id);
      if (!folder) {
        throw new Error('Folder not found');
      }

      const originalParentId = folder.parentFolderId;
      updateFolder(input.id, { parentFolderId: input.parentFolderId || null });

      return { folderId: input.id, originalParentId };
    },
    onSuccess: ({ folderId }, data) => {
      // Realtime subscription will confirm
    },
    onError: ({ folderId, originalParentId }) => {
      updateFolder(folderId, { parentFolderId: originalParentId });
    },
    successMessage: () => 'Folder moved',
    errorMessage: (error) => `Failed to move folder: ${error}`,
  });

  /**
   * Delete folder mutation
   */
  const deleteFolderMutation = useGraphQLMutation<
    { id: string },
    any,
    { originalFolder: Folder; wasOpenDocInFolder: boolean }
  >({
    mutation: DeleteFolderDocument,
    optimisticUpdate: (tempId, input) => {
      const folder = getFolder(input.id);
      if (!folder) {
        throw new Error('Folder not found');
      }

      // Check if currently open file is in this folder
      const currentDocId = editorState.currentDocumentId;
      const currentFile = currentDocId
        ? filesystemState.files.find((f) => f.id === currentDocId)
        : null;
      const wasOpenDocInFolder = currentFile && currentFile.folderId === input.id;

      removeFolder(input.id);

      if (wasOpenDocInFolder) {
        clearEditor();
        router.push('/workspace');
      }

      return { originalFolder: folder, wasOpenDocInFolder };
    },
    onSuccess: () => {
      // Realtime subscription will confirm
    },
    onError: ({ originalFolder }) => {
      addFolder(originalFolder);
    },
    successMessage: () => 'Folder deleted',
    errorMessage: (error) => `Failed to delete folder: ${error}`,
  });

  // ===== FILE OPERATIONS =====

  /**
   * Create file mutation
   */
  const createFileMutation = useGraphQLMutation<
    { id?: string; name: string; content: string; folderId?: string | null },
    any,
    { permanentId: string }
  >({
    mutation: CreateFileDocument,
    optimisticUpdate: (permanentId, input) => {
      if (!user) {
        throw new Error('Not authenticated');
      }

      const optimisticFile: File = {
        id: permanentId,
        name: input.name,
        folderId: input.folderId || null,
        path: input.name, // Path will be computed by backend
        ownerUserId: user.id,
        content: input.content,
        fileSize: 0,
        mimeType: 'text/markdown',
        version: 0,
        indexingStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addFile(optimisticFile);

      // Pass permanent ID to GraphQL mutation
      input.id = permanentId;

      return { permanentId };
    },
    onSuccess: ({ permanentId }, data) => {
      // Realtime subscription will confirm with same ID (no need to remove/re-add)
      // Just ensure state is updated with server data
      updateFile(permanentId, data.createFile as Partial<File>);
    },
    onError: ({ permanentId }) => {
      removeFile(permanentId);
    },
    successMessage: (data) => `File "${data.createFile.name}" created`,
    errorMessage: (error) => `Failed to create file: ${error}`,
  });

  /**
   * Rename file mutation
   */
  const renameFileMutation = useGraphQLMutation<
    { id: string; name?: string },
    any,
    { fileId: string; originalName: string }
  >({
    mutation: UpdateFilePartialDocument,
    optimisticUpdate: (tempId, input) => {
      const file = getFile(input.id);
      if (!file) {
        throw new Error('File not found');
      }

      const originalName = file.name;
      if (input.name) {
        updateFile(input.id, { name: input.name });
      }

      return { fileId: input.id, originalName };
    },
    onSuccess: ({ fileId }, data) => {
      // Realtime subscription will confirm
    },
    onError: ({ fileId, originalName }) => {
      updateFile(fileId, { name: originalName });
    },
    successMessage: (data) => `File renamed to "${data.updateFilePartial.name}"`,
    errorMessage: (error) => `Failed to rename file: ${error}`,
  });

  /**
   * Move file mutation
   */
  const moveFileMutation = useGraphQLMutation<
    { id: string; folderId?: string | null },
    any,
    { fileId: string; originalFolderId: string | null }
  >({
    mutation: UpdateFilePartialDocument,
    optimisticUpdate: (tempId, input) => {
      const file = getFile(input.id);
      if (!file) {
        throw new Error('File not found');
      }

      const originalFolderId = file.folderId;
      updateFile(input.id, { folderId: input.folderId || null });

      return { fileId: input.id, originalFolderId };
    },
    onSuccess: ({ fileId }, data) => {
      // Realtime subscription will confirm
    },
    onError: ({ fileId, originalFolderId }) => {
      updateFile(fileId, { folderId: originalFolderId });
    },
    successMessage: () => 'File moved',
    errorMessage: (error) => `Failed to move file: ${error}`,
  });

  /**
   * Delete file mutation
   */
  const deleteFileMutation = useGraphQLMutation<
    { id: string },
    any,
    { originalFile: File; wasOpenInEditor: boolean; previousEditorContent: string }
  >({
    mutation: DeleteFileDocument,
    optimisticUpdate: (tempId, input) => {
      const file = getFile(input.id);
      if (!file) {
        throw new Error('File not found');
      }

      const wasOpenInEditor = editorState.currentDocumentId === input.id;
      const previousEditorContent = wasOpenInEditor ? editorState.content : '';

      removeFile(input.id);

      if (wasOpenInEditor) {
        clearEditor();
        router.push('/workspace');
      }

      return { originalFile: file, wasOpenInEditor, previousEditorContent };
    },
    onSuccess: () => {
      // Realtime subscription will confirm
    },
    onError: ({ originalFile, wasOpenInEditor, previousEditorContent }) => {
      addFile(originalFile);
      if (wasOpenInEditor) {
        loadDocument(originalFile.id || '', previousEditorContent);
      }
    },
    successMessage: () => 'File deleted',
    errorMessage: (error) => `Failed to delete file: ${error}`,
  });

  // ===== PUBLIC API =====

  return {
    // Folder operations
    createFolder: async (name: string, parentFolderId: string | null) => {
      return createFolderMutation.mutate({ name, parentFolderId });
    },
    renameFolder: async (folderId: string, newName: string) => {
      return renameFolderMutation.mutate({ id: folderId, name: newName });
    },
    moveFolder: async (folderId: string, newParentId: string | null) => {
      return moveFolderMutation.mutate({ id: folderId, parentFolderId: newParentId });
    },
    deleteFolder: async (folderId: string) => {
      return deleteFolderMutation.mutate({ id: folderId });
    },

    // File operations (keeping public API names as "document" for backward compatibility with UI components)
    createDocument: async (name: string, folderId: string | null) => {
      return createFileMutation.mutate({ name, content: '', folderId });
    },
    renameDocument: async (fileId: string, newName: string) => {
      return renameFileMutation.mutate({ id: fileId, name: newName });
    },
    moveDocument: async (fileId: string, newFolderId: string | null) => {
      return moveFileMutation.mutate({ id: fileId, folderId: newFolderId });
    },
    deleteDocument: async (fileId: string) => {
      return deleteFileMutation.mutate({ id: fileId });
    },

    // Loading states
    isCreatingFolder: createFolderMutation.isLoading,
    isCreatingDocument: createFileMutation.isLoading,
    isRenaming: renameFolderMutation.isLoading || renameFileMutation.isLoading,
    isMoving: moveFolderMutation.isLoading || moveFileMutation.isLoading,
    isDeleting: deleteFolderMutation.isLoading || deleteFileMutation.isLoading,
  };
}
