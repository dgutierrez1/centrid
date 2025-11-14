import { fileRepository } from '../repositories/file.ts';
import type { UpdateFileInput, UpdateFilePartialInput } from '../types/graphql.js';

/**
 * Service-layer CreateFileInput adds server-side context not in GraphQL Input:
 * - userId: Injected from auth context by GraphQL resolver (prevents client spoofing)
 * - provenance: Internal metadata for tracking file creation context
 *
 * Other fields match GraphQL CreateFileInput type.
 */
export interface CreateFileInput {
  id?: string; // Optional client-provided UUID for optimistic updates
  userId: string; // From auth context (not in GraphQL Input)
  name: string; // Filename with extension
  folderId?: string | null; // Folder location
  content: string;
  threadId?: string; // Thread ID for provenance tracking
  provenance?: {   // Internal metadata (not exposed to clients)
    threadId: string;
    contextSummary?: string;
  };
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
    // Map provenance structure if provided (support both threadId and provenance.threadId)
    const threadId = input.threadId || input.provenance?.threadId;
    const provenanceData = threadId
      ? {
          createdInThreadId: threadId,
          contextSummary: input.provenance?.contextSummary || `Created in thread ${threadId}`,
        }
      : null;

    const file = await fileRepository.create({
      id: input.id, // Pass client-provided ID if present
      ownerUserId: input.userId,
      name: input.name,
      folderId: input.folderId || null,
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

    // TODO: Implement optimistic locking with version check
    // if (updates.version !== undefined && file.version !== updates.version) {
    //   throw new Error('Version conflict');
    // }

    // Update file
    const updated = await fileRepository.update(fileId, {
      content: updates.content,
    }, userId);

    // TODO: Trigger shadow domain sync if content changed >20%
    // Calculate diff, if significant, re-index for semantic search

    return updated;
  }

  /**
   * Partial file update (rename, move, or edit content)
   * Validates ownership
   */
  static async updateFilePartial(
    fileId: string,
    userId: string,
    updates: UpdateFilePartialInput
  ): Promise<any> {
    // Verify file exists and user owns it
    const file = await fileRepository.findById(fileId);

    if (!file) {
      throw new Error('File not found');
    }

    if (file.ownerUserId !== userId) {
      throw new Error('Access denied');
    }

    // Update file (repository will recompute path if name or folderId changes)
    const updated = await fileRepository.update(fileId, updates, userId);

    // TODO: Trigger shadow domain sync if content changed
    // Re-index for semantic search

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

  /**
   * Get file provenance (creation and edit history)
   * Returns thread/message context for navigating back to source
   */
  static async getFileProvenance(fileId: string, userId: string): Promise<{
    createdIn: { threadId: string; messageId: string | null } | null;
    lastModifiedIn: { threadId: string; messageId: string | null } | null;
  }> {
    const file = await fileRepository.findById(fileId);

    if (!file) {
      throw new Error('File not found');
    }

    if (file.ownerUserId !== userId) {
      throw new Error('Access denied');
    }

    // Extract provenance from file metadata
    // TODO: Add messageId tracking when we have that data in the database
    const createdIn = file.createdInThreadId
      ? {
          threadId: file.createdInThreadId,
          messageId: null, // Will be populated when we add messageId to database
        }
      : null;

    // TODO: Add lastModifiedIn tracking when we implement edit history
    const lastModifiedIn = null;

    return {
      createdIn,
      lastModifiedIn,
    };
  }
}
