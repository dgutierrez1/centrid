import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { AgentFileService } from '@/lib/services/agent-file.service';
import { aiAgentState, aiAgentActions } from '@/lib/state/aiAgentState';
import type { FileData } from '@centrid/ui/features/ai-agent-system';

/**
 * useDeleteFile - Custom hook for deleting files
 *
 * Wraps AgentFileService and provides:
 * - Loading states (useState)
 * - Toast notifications (react-hot-toast)
 * - Optimistic updates (Valtio - aiAgentState)
 * - Error rollback with actual state values
 * - Cleanup of UI state when deleting currently open file
 *
 * Architecture: UI Components → useDeleteFile → AgentFileService → Edge Functions
 */

export function useDeleteFile() {
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Delete a file with optimistic update
   */
  const deleteFile = async (fileId: string) => {
    setIsDeleting(true);

    // Store original state for rollback
    const originalCurrentFile = aiAgentState.currentFile;
    const originalSelectedFileId = aiAgentState.selectedFileId;
    const isCurrentFileBeingDeleted = aiAgentState.selectedFileId === fileId;

    // Optimistic update - remove immediately if it's the current file
    if (isCurrentFileBeingDeleted) {
      aiAgentState.currentFile = null;
      aiAgentState.selectedFileId = null;
    }

    try {
      const { error } = await AgentFileService.deleteFile(fileId);

      if (error) {
        // Rollback optimistic update
        aiAgentState.currentFile = originalCurrentFile;
        aiAgentState.selectedFileId = originalSelectedFileId;
        toast.error(`Failed to delete file: ${error}`);
        return { success: false, error };
      }

      toast.success('File deleted');
      return { success: true };
    } catch (error) {
      // Rollback on unexpected error
      aiAgentState.currentFile = originalCurrentFile;
      aiAgentState.selectedFileId = originalSelectedFileId;
      toast.error('Unexpected error deleting file');
      return { success: false, error: String(error) };
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteFile,
    isDeleting,
  };
}
