import { aiAgentState } from '@/lib/state/aiAgentState';
import { useGraphQLMutation } from '@/lib/graphql/useGraphQLMutation';
import { DeleteFileDocument } from '@/types/graphql';

/**
 * useDeleteFile - Custom hook for deleting files
 *
 * Uses useGraphQLMutation for:
 * - Optimistic updates (clear current file if deleting selected)
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
      const originalCurrentFile = aiAgentState.currentFile;
      const originalSelectedFileId = aiAgentState.selectedFileId;
      const isCurrentFileBeingDeleted = aiAgentState.selectedFileId === input?.id;

      // Optimistic update - remove immediately if it's the current file
      if (isCurrentFileBeingDeleted) {
        aiAgentState.currentFile = null;
        aiAgentState.selectedFileId = null;
      }

      return { originalCurrentFile, originalSelectedFileId };
    },
    onSuccess: () => {
      // Real-time will handle removing from file list
    },
    onError: ({ originalCurrentFile, originalSelectedFileId }) => {
      // Rollback optimistic update
      aiAgentState.currentFile = originalCurrentFile;
      aiAgentState.selectedFileId = originalSelectedFileId;
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
