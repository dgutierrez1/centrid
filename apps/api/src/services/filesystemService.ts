/**
 * Filesystem Service
 * Business logic for folders and files listing
 */

import { folderRepository } from '../repositories/folder.ts';
import { fileRepository } from '../repositories/file.ts';
import type { File } from '../db/types.js';

export const FilesystemService = {
  /**
   * Get all folders and files for a user
   * Returns tree-ready data structure
   */
  async getFilesystem(userId: string) {
    console.log('[FilesystemService] Loading filesystem for user:', userId);

    const [folders, files] = await Promise.all([
      folderRepository.findByUserId(userId),
      fileRepository.findByUserId(userId),
    ]);

    console.log('[FilesystemService] Found:', { folders: folders.length, files: files.length });

    return {
      folders,
      files,
    };
  },

  /**
   * Get all folders for a user
   */
  async getFolders(userId: string) {
    console.log('[FilesystemService] Loading folders for user:', userId);
    const folders = await folderRepository.findByUserId(userId);
    console.log('[FilesystemService] Found folders:', folders.length);
    return folders;
  },

  /**
   * Get all files for a user
   */
  async getFiles(userId: string): Promise<File[]> {
    console.log('[FilesystemService] Loading files for user:', userId);
    const files = await fileRepository.findByUserId(userId);
    console.log('[FilesystemService] Found files:', files.length);
    return files;
  },
};
