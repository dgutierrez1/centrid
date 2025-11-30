import { aiAgentState } from '@/lib/state/aiAgentState';
import { filesystemState, selectFile, clearFileSelection, addFile } from '@/lib/state/filesystem';
import { useGraphQLMutation } from '@/lib/graphql/useGraphQLMutation';
import { CreateFileDocument, type CreateFileMutation, type CreateFileMutationVariables } from '@/types/graphql';
import { useFileSystem } from '@/lib/contexts/filesystem.context';
import type { File } from '@/types/graphql';

/**
 * useCreateAgentFile - Custom hook for creating agent-generated files
 *
 * Uses useGraphQLMutation for:
 * - Optimistic updates with permanent UUID
 * - Automatic rollback on error
 * - Toast notifications
 *
 * Architecture: UI Components → useCreateAgentFile → GraphQL → Edge Functions
 */

export function useCreateAgentFile() {
  const { user } = useFileSystem();

  const { mutate, isLoading } = useGraphQLMutation<CreateFileMutationVariables, CreateFileMutation, { permanentId: string; originalSelectedFile: File | null; name: string }>({
    mutation: CreateFileDocument,
    optimisticUpdate: (permanentId, input) => {
      // Store original state for rollback
      const originalSelectedFile = filesystemState.selectedFile;

      // Optimistic file with permanent UUID
      const optimisticFile: File = {
        id: permanentId, // Server will use same ID
        name: input?.name || 'Untitled',
        content: input?.content || '',
        folderId: input?.folderId || null,
        ownerUserId: user?.id || '',
        version: 0, // New file starts at version 0
        fileSize: 0,
        mimeType: 'text/markdown',
        path: input?.name || 'Untitled',
        indexingStatus: 'pending',
        isAIGenerated: true,
        source: 'ai-generated',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add to filesystem state and select it
      addFile(optimisticFile);
      selectFile(permanentId);

      return { permanentId, originalSelectedFile, name: input?.name || 'Untitled' };
    },
    onSuccess: ({ permanentId }, data) => {
      // Real-time subscription will update with server data via addFile (idempotent)
      // File already added optimistically, so real-time will just confirm
    },
    onError: ({ originalSelectedFile }) => {
      // Rollback optimistic update
      if (originalSelectedFile) {
        filesystemState.selectedFile = originalSelectedFile;
      } else {
        clearFileSelection();
      }
    },
    successMessage: (data) => `File "${data.createFile?.name || 'Untitled'}" created`,
    errorMessage: (error) => `Failed to create file: ${error}`,
  });

  /**
   * Create a new file (typically from agent write_file tool)
   */
  const createFile = async (
    path: string,
    content: string
  ) => {
    // Extract name from path (agent still provides path)
    const name = path.split('/').pop() || path;

    const { promise } = mutate({
      name,
      content,
      threadId: aiAgentState.currentThread?.id,
      folderId: null, // Agent files not associated with folders yet
    });

    const result = await promise;
    return result.success
      ? { success: true, data: result.data?.createFile }
      : { success: false, error: result.error };
  };

  return {
    createFile,
    isCreating: isLoading,
  };
}
