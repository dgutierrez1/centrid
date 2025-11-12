import { aiAgentState } from '@/lib/state/aiAgentState';
import { useGraphQLMutation } from '@/lib/graphql/useGraphQLMutation';
import { CreateFileDocument } from '@/types/graphql';
import type { FileData, Provenance } from '@centrid/ui/features/ai-agent-system';

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
  const { mutate, isLoading } = useGraphQLMutation({
    mutation: CreateFileDocument,
    optimisticUpdate: (permanentId, input) => {
      // Store original state for rollback
      const originalCurrentFile = aiAgentState.currentFile;
      const originalSelectedFileId = aiAgentState.selectedFileId;

      // Optimistic file with permanent UUID
      const optimisticFile: FileData = {
        id: permanentId, // Server will use same ID
        name: input?.name || 'Untitled',
        content: input?.content || '',
        provenance: input?.provenance || null,
      };

      // Set as current file to show in editor
      aiAgentState.currentFile = optimisticFile;
      aiAgentState.selectedFileId = permanentId;

      return { permanentId, originalCurrentFile, originalSelectedFileId, name: input?.name || 'Untitled' };
    },
    onSuccess: ({ permanentId }, data) => {
      // Update with server response (real-time will also reconcile)
      if (data.createFile) {
        aiAgentState.currentFile = {
          id: data.createFile.id,
          name: data.createFile.name,
          content: data.createFile.content || '',
          provenance: aiAgentState.currentFile?.provenance || null,
        };
        aiAgentState.selectedFileId = data.createFile.id;
      }
    },
    onError: ({ originalCurrentFile, originalSelectedFileId }) => {
      // Rollback optimistic update
      aiAgentState.currentFile = originalCurrentFile;
      aiAgentState.selectedFileId = originalSelectedFileId;
    },
    successMessage: (data) => `File "${data.createFile?.name || 'Untitled'}" created`,
    errorMessage: (error) => `Failed to create file: ${error}`,
  });

  /**
   * Create a new file (typically from agent write_file tool)
   */
  const createFile = async (
    path: string,
    content: string,
    provenance?: Provenance
  ) => {
    // Extract name from path (agent still provides path)
    const name = path.split('/').pop() || path;

    const result = await mutate({
      name,
      content,
      threadId: aiAgentState.currentThread?.id,
      folderId: null, // Agent files not associated with folders yet
      provenance, // Pass through for context
    });

    return result.success
      ? { success: true, data: result.data?.createFile }
      : { success: false, error: result.error };
  };

  return {
    createFile,
    isCreating: isLoading,
  };
}
