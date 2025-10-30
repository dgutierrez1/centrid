import { fileRepository } from '../repositories/file.ts';
import { threadRepository } from '../repositories/thread.ts';

/**
 * Provenance Tracking Service
 * Tracks the origin and editing history of AI-generated files
 * Uses repositories for data access
 */
export class ProvenanceTrackingService {
  /**
   * Create a new file with provenance metadata
   * Tracks: who created it, when, in which thread, from what context
   */
  async createFileWithProvenance(
    userId: string,
    path: string,
    content: string,
    threadId: string,
    contextSummary: string
  ) {
    try {
      // Get thread info for provenance
      const thread = await threadRepository.findById(threadId);

      // Create file with provenance
      const file = await fileRepository.create({
        path,
        content,
        ownerUserId: userId,
        provenance: {
          createdInThreadId: threadId,
          contextSummary: contextSummary || `Created in "${thread?.branchTitle || 'Unknown Thread'}"`,
        },
      });

      return { fileId: file.id };
    } catch (error) {
      console.error('Failed to create file with provenance:', error);
      throw error;
    }
  }

  /**
   * Update last edit metadata when file is modified
   */
  async updateLastEdit(fileId: string, editedBy: 'agent' | 'user', threadId?: string) {
    try {
      const file = await fileRepository.findById(fileId);
      if (!file) {
        throw new Error(`File not found: ${fileId}`);
      }

      await fileRepository.update(fileId, {
        content: file.content,
        editMetadata: {
          lastEditedBy: editedBy,
          editedInThreadId: threadId,
        },
      });
    } catch (error) {
      console.error('Failed to update last edit:', error);
      throw error;
    }
  }

  /**
   * Get full provenance history for a file
   */
  async getProvenance(fileId: string) {
    try {
      const file = await fileRepository.findById(fileId);
      if (!file || !file.isAIGenerated) {
        return null;
      }

      return {
        isAIGenerated: file.isAIGenerated,
        createdBy: file.createdBy || 'unknown',
        lastEditedBy: file.lastEditedBy,
        lastEditedAt: file.lastEditedAt,
        createdAt: file.createdAt,
      };
    } catch (error) {
      console.error('Failed to get provenance:', error);
      return null;
    }
  }

  /**
   * Check if file is AI-generated
   */
  async isAIGenerated(fileId: string): Promise<boolean> {
    try {
      const file = await fileRepository.findById(fileId);
      return !!(file && file.isAIGenerated);
    } catch (error) {
      console.error('Failed to check if AI-generated:', error);
      return false;
    }
  }
}

export const provenanceTrackingService = new ProvenanceTrackingService();
