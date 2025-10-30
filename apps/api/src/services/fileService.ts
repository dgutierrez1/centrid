import { fileRepository } from '../repositories/file.ts';

export interface CreateFileInput {
  userId: string;
  path: string;
  content: string;
  provenance?: {
    threadId: string;
    contextSummary?: string;
  };
}

export interface UpdateFileInput {
  content: string;
}

/**
 * File Service
 * Handles file CRUD operations with ownership validation
 * ✅ STATELESS - All methods are static utility functions
 */
export class FileService {
  /**
   * Create a new file
   * Optionally tracks provenance (which thread/context created it)
   */
  static async createFile(input: CreateFileInput): Promise<any> {
    // Map provenance structure if provided
    const provenanceData = input.provenance
      ? {
          createdInThreadId: input.provenance.threadId,
          contextSummary: input.provenance.contextSummary || `Created in thread ${input.provenance.threadId}`,
        }
      : null;

    const file = await fileRepository.create({
      ownerUserId: input.userId,
      path: input.path,
      content: input.content,
      provenance: provenanceData || undefined,
    });

    // TODO: Trigger shadow domain sync (background job)
    // This would index the file for semantic search

    return file;
  }

  /**
   * Get a file by ID
   * Validates ownership
   */
  static async getFile(fileId: string, userId: string): Promise<any> {
    const file = await fileRepository.findById(fileId);
    
    if (!file) {
      throw new Error('File not found');
    }

    if (file.ownerUserId !== userId) {
      throw new Error('Access denied');
    }

    return file;
  }

  /**
   * Update file content
   * Validates ownership
   */
  static async updateFile(
    fileId: string,
    userId: string,
    updates: UpdateFileInput
  ): Promise<any> {
    // Verify file exists and user owns it
    const file = await fileRepository.findById(fileId);
    
    if (!file) {
      throw new Error('File not found');
    }

    if (file.ownerUserId !== userId) {
      throw new Error('Access denied');
    }

    // Update file
    const updated = await fileRepository.update(fileId, {
      content: updates.content,
    });

    // TODO: Trigger shadow domain sync if content changed >20%
    // Calculate diff, if significant, re-index for semantic search

    return updated;
  }

  /**
   * Delete a file
   * Validates ownership
   */
  static async deleteFile(fileId: string, userId: string): Promise<void> {
    // Verify file exists and user owns it
    const file = await fileRepository.findById(fileId);
    
    if (!file) {
      throw new Error('File not found');
    }

    if (file.ownerUserId !== userId) {
      throw new Error('Access denied');
    }

    // Delete file (cascade deletes shadow domain entry)
    await fileRepository.delete(fileId);
  }

  /**
   * List all files for a user
   * Useful for file browsing/search
   */
  static async listFiles(userId: string): Promise<any[]> {
    return await fileRepository.findByUserId(userId);
  }

  /**
   * Find file by path
   * Validates ownership
   */
  static async getFileByPath(path: string, userId: string): Promise<any> {
    const file = await fileRepository.findByPath(path);
    
    if (!file) {
      throw new Error(`File not found: ${path}`);
    }

    if (file.ownerUserId !== userId) {
      throw new Error('Access denied');
    }

    return file;
  }
}
