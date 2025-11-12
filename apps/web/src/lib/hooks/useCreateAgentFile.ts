import { aiAgentState } from '@/lib/state/aiAgentState';
import { filesystemState, selectFile, clearFileSelection, addFile } from '@/lib/state/filesystem';
import { useGraphQLMutation } from '@/lib/graphql/useGraphQLMutation';
import { CreateFileDocument } from '@/types/graphql';
import type { Provenance } from '@centrid/ui/features/ai-agent-system';
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
  const { mutate, isLoading } = useGraphQLMutation({
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
        version: 0, // New file starts at version 0
        fileSize: 0,
        mimeType: 'text/markdown',
        path: input?.name || 'Untitled',
        indexingStatus: 'pending',
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
