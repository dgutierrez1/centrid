/**
 * Folder Repository
 * Data access layer for folders table
 */

import { getDB } from '../functions/_shared/db.ts';
import { folders } from '../db/schema.ts';
import { eq, asc, and, isNull } from 'drizzle-orm';

export const folderRepository = {
  /**
   * Get all folders for a user
   */
  async findByUserId(userId: string) {
    const { db, cleanup } = await getDB();
    try {
      return await db
        .select()
        .from(folders)
        .where(eq(folders.userId, userId))
        .orderBy(asc(folders.createdAt));
    } finally {
      await cleanup();
    }
  },

  /**
   * Get folder by ID
   */
  async findById(folderId: string, userId: string) {
    const { db, cleanup } = await getDB();
    try {
      const result = await db
        .select()
        .from(folders)
        .where(eq(folders.id, folderId))
        .limit(1);

      // Verify ownership
      if (result[0] && result[0].userId !== userId) {
        throw new Error('Access denied');
      }

      return result[0] || null;
    } finally {
      await cleanup();
    }
  },

  /**
   * Create a new folder
   */
  async create(input: {
    id?: string; // Optional client-provided UUID
    userId: string;
    name: string;
    parentFolderId: string | null;
    path: string;
  }) {
    const { db, cleanup } = await getDB();
    try {
      const values: any = {
        userId: input.userId,
        name: input.name,
        parentFolderId: input.parentFolderId,
        path: input.path,
      };

      // Include client-provided ID if present
      if (input.id) {
        values.id = input.id;
      }

      const [folder] = await db
        .insert(folders)
        .values(values)
        .returning();
      return folder;
    } finally {
      await cleanup();
    }
  },

  /**
   * Update folder (rename or move)
   */
  async update(folderId: string, updates: { name?: string; parentFolderId?: string | null; path?: string }) {
    const { db, cleanup } = await getDB();
    try {
      const setClause: any = { updatedAt: new Date() };

      if (updates.name !== undefined) setClause.name = updates.name;
      if (updates.parentFolderId !== undefined) setClause.parentFolderId = updates.parentFolderId;
      if (updates.path !== undefined) setClause.path = updates.path;

      const [folder] = await db
        .update(folders)
        .set(setClause)
        .where(eq(folders.id, folderId))
        .returning();
      return folder || null;
    } finally {
      await cleanup();
    }
  },

  /**
   * Delete folder
   */
  async delete(folderId: string) {
    const { db, cleanup } = await getDB();
    try {
      await db.delete(folders).where(eq(folders.id, folderId));
    } finally {
      await cleanup();
    }
  },

  /**
   * Get folders by parent ID (for tree navigation)
   */
  async findByParentId(parentFolderId: string | null, userId: string) {
    const { db, cleanup } = await getDB();
    try {
      return await db
        .select()
        .from(folders)
        .where(
          parentFolderId
            ? and(eq(folders.parentFolderId, parentFolderId), eq(folders.userId, userId))
            : and(isNull(folders.parentFolderId), eq(folders.userId, userId))
        )
        .orderBy(asc(folders.createdAt));
    } finally {
      await cleanup();
    }
  },
};
