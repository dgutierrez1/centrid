import type { FileData, Provenance } from '@centrid/ui/features/ai-agent-system';
import { api } from '@/lib/api/client';

/**
 * AgentFileService - Pure API functions for agent file operations
 * Returns data directly or throws ApiError
 *
 * Handles files created by agents (via write_file tool) and user file deletion
 *
 * All requests automatically get:
 * - Auth header injection
 * - Retry on 5xx errors
 * - Consistent error handling
 */

export const AgentFileService = {
  /**
   * Create a new file (for agent-generated content)
   *
   * @param path - Full file path (e.g., "/workspace/generated-code.ts")
   * @param content - File content
   * @param provenance - Origin metadata (which thread/agent created it)
   */
  async createFile(
    path: string,
    content: string,
    provenance?: Provenance
  ): Promise<FileData> {
    const response = await api.post<{ data: { fileId: string } }>('/create-file', {
      path,
      content,
      provenance: provenance ? {
        createdAt: provenance.createdAt?.toISOString(),
        createdBy: provenance.createdBy,
        sourceBranch: provenance.sourceBranch,
        sourceThreadId: provenance.sourceThreadId,
        sourceMessageId: provenance.sourceMessageId,
      } : undefined,
    });

    // Transform response to FileData format
    return {
      id: response.data.fileId,
      name: path.split('/').pop() || 'unknown',
      content,
      provenance: provenance || null,
    };
  },

  /**
   * Delete a file
   */
  async deleteFile(fileId: string): Promise<void> {
    await api.delete(`/delete-file/${fileId}`);
  },
};

// Lowercase alias for convenience
export const agentFileService = AgentFileService;
