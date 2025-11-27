/**
 * FolderService - Business logic for folder operations
 * Stateless service with static methods
 * Orchestrates FolderRepository and validates business rules
 */

import { folderRepository } from '../repositories/folder.ts';
import type { InsertFolder } from '../db/types.ts';

export class FolderService {
  /**
   * Create a new folder
   * Validates parent exists if provided
   */
  static async createFolder(
    userId: string,
    name: string,
    parentFolderId: string | null,
    id?: string // Optional client-provided UUID for optimistic updates
  ) {
    // Validate parent exists if provided
    if (parentFolderId) {
      const parent = await folderRepository.findById(parentFolderId, userId);
      if (!parent) {
        throw new Error('Parent folder not found');
      }
    }

    // Compute path (parent.path + '/' + name)
    let path = `/${name}`;
    if (parentFolderId) {
      const parent = await folderRepository.findById(parentFolderId, userId);
      path = `${parent!.path}/${name}`;
    }

    const folder = await folderRepository.create({
      id, // Pass client-provided ID if present
      userId,
      name,
      parentFolderId,
      path,
    });

    return folder;
  }

  /**
   * Get single folder by ID
   * Validates ownership
   */
  static async getFolder(folderId: string, userId: string) {
    const folder = await folderRepository.findById(folderId, userId);

    if (!folder) {
      throw new Error('Folder not found');
    }

    return folder;
  }

  /**
   * Update folder (rename or move)
   * Validates parent exists if moving
   */
  static async updateFolder(
    folderId: string,
    userId: string,
    updates: Partial<InsertFolder>
  ) {
    // Verify ownership
    const folder = await folderRepository.findById(folderId, userId);
    if (!folder) {
      throw new Error('Folder not found');
    }

    // Validate parent if moving
    if (updates.parentFolderId !== undefined) {
      if (updates.parentFolderId !== null) {
        const parent = await folderRepository.findById(updates.parentFolderId, userId);
        if (!parent) {
          throw new Error('Parent folder not found');
        }
      }
    }

    // Compute new path if name or parent changes
    let path: string | undefined;
    if (updates.name || updates.parentFolderId !== undefined) {
      const newName = updates.name || folder.name;
      const newParentId = updates.parentFolderId !== undefined
        ? updates.parentFolderId
        : folder.parentFolderId;

      if (newParentId) {
        const parent = await folderRepository.findById(newParentId, userId);
        path = `${parent!.path}/${newName}`;
      } else {
        path = `/${newName}`;
      }
    }

    const updated = await folderRepository.update(folderId, {
      name: updates.name,
      parentFolderId: updates.parentFolderId,
      path,
    });

    return updated;
  }

  /**
   * Delete folder
   * Validates folder is empty (no children)
   */
  static async deleteFolder(folderId: string, userId: string) {
    const folder = await folderRepository.findById(folderId, userId);
    if (!folder) {
      throw new Error('Folder not found');
    }

    // Check if folder has children
    const children = await folderRepository.findByParentId(folderId, userId);
    if (children.length > 0) {
      throw new Error('Cannot delete folder with children');
    }

    // TODO: Check if folder contains files (once files have folderId)

    await folderRepository.delete(folderId);
  }

  /**
   * List all folders for user
   */
  static async listFolders(userId: string) {
    return await folderRepository.findByUserId(userId);
  }
}
