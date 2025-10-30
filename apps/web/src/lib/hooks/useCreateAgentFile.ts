import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { AgentFileService } from '@/lib/services/agent-file.service';
import { aiAgentState } from '@/lib/state/aiAgentState';
import type { FileData, Provenance } from '@centrid/ui/features/ai-agent-system';

/**
 * useCreateAgentFile - Custom hook for creating agent-generated files
 *
 * Wraps AgentFileService and provides:
 * - Loading states (useState)
 * - Toast notifications (react-hot-toast)
 * - Optimistic updates (Valtio - aiAgentState)
 * - Error rollback with actual state values
 *
 * Architecture: UI Components → useCreateAgentFile → AgentFileService → Edge Functions
 */

export function useCreateAgentFile() {
  const [isCreating, setIsCreating] = useState(false);

  /**
   * Create a new file (typically from agent write_file tool)
   */
  const createFile = async (
    path: string,
    content: string,
    provenance?: Provenance
  ) => {
    setIsCreating(true);

    // Optimistic update - add temporary file immediately
    const tempId = `temp-file-${Date.now()}`;
    const optimisticFile: FileData = {
      id: tempId,
      name: path.split('/').pop() || 'unknown',
      content,
      provenance: provenance || null,
    };

    // Store original state for rollback
    const originalCurrentFile = aiAgentState.currentFile;
    const originalSelectedFileId = aiAgentState.selectedFileId;

    // Optimistic update - set as current file to show in editor
    aiAgentState.currentFile = optimisticFile;
    aiAgentState.selectedFileId = tempId;

    try {
      const { data, error } = await AgentFileService.createFile(path, content, provenance);

      if (error) {
        // Rollback optimistic update
        aiAgentState.currentFile = originalCurrentFile;
        aiAgentState.selectedFileId = originalSelectedFileId;
        toast.error(`Failed to create file: ${error}`);
        return { success: false, error };
      }

      if (data) {
        // Replace temp with real data
        aiAgentState.currentFile = data;
        aiAgentState.selectedFileId = data.id;
      }

      toast.success(`File "${optimisticFile.name}" created`);
      return { success: true, data };
    } catch (error) {
      // Rollback on unexpected error
      aiAgentState.currentFile = originalCurrentFile;
      aiAgentState.selectedFileId = originalSelectedFileId;
      toast.error('Unexpected error creating file');
      return { success: false, error: String(error) };
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createFile,
    isCreating,
  };
}
