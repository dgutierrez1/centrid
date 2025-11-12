import { filesystemState, clearFileSelection } from '@/lib/state/filesystem';
import { useGraphQLMutation } from '@/lib/graphql/useGraphQLMutation';
import { DeleteFileDocument } from '@/types/graphql';
import type { File } from '@/types/graphql';

/**
 * useDeleteFile - Custom hook for deleting files
 *
 * Uses useGraphQLMutation for:
 * - Optimistic updates (clear selected file if deleting it)
 * - Automatic rollback on error
 * - Toast notifications
 *
 * Architecture: UI Components → useDeleteFile → GraphQL → Edge Functions
 */

export function useDeleteFile() {
  const { mutate, isLoading } = useGraphQLMutation({
    mutation: DeleteFileDocument,
    optimisticUpdate: (permanentId, input) => {
      // Store original state for rollback
      const originalSelectedFile = filesystemState.selectedFile;
      const isSelectedFileBeingDeleted = filesystemState.selectedFile?.id === input?.id;

      // Optimistic update - clear selection if deleting the selected file
      if (isSelectedFileBeingDeleted) {
        clearFileSelection();
      }

      return { originalSelectedFile };
    },
    onSuccess: () => {
      // Real-time will handle removing from file list via removeFile()
    },
    onError: ({ originalSelectedFile }) => {
      // Rollback optimistic update - restore selection
      if (originalSelectedFile) {
        filesystemState.selectedFile = originalSelectedFile;
      }
    },
    successMessage: () => 'File deleted',
    errorMessage: (error) => `Failed to delete file: ${error}`,
  });

  /**
   * Delete a file with optimistic update
   */
  const deleteFile = async (fileId: string) => {
    const result = await mutate({ id: fileId });
    return result.success
      ? { success: true }
      : { success: false, error: result.error };
  };

  return {
    deleteFile,
    isDeleting: isLoading,
  };
}
