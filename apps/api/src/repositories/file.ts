import { eq } from 'drizzle-orm';
import { getDB } from '../functions/_shared/db.ts';
import { files, folders } from '../db/schema.ts';
import { computeFilePath } from '../utils/pathComputation.ts';

export interface CreateFileInput {
  id?: string; // Optional client-provided UUID
  name: string; // Filename with extension (source of truth)
  folderId?: string | null; // Folder location
  content: string;
  ownerUserId?: string;
  provenance?: {
    createdInThreadId: string;
    contextSummary: string;
  };
}

export interface UpdateFileInput {
  content?: string;
  name?: string; // Rename file
  folderId?: string | null; // Move file
  editMetadata?: {
    lastEditedBy: 'agent' | 'user';
    editedInThreadId?: string;
  };
}

export class FileRepository {
  /**
   * Create a new file
   */
  async create(input: CreateFileInput) {
    const { db, cleanup } = await getDB();
    try {
      // Fetch all folders to compute path
      const userId = input.ownerUserId || '';
      const allFolders = await db
        .select()
        .from(folders)
        .where(eq(folders.userId, userId));

      // Compute path from folder hierarchy + name
      const path = computeFilePath(
        allFolders as any[],
        input.folderId || null,
        input.name
      );

      const values: any = {
        name: input.name,
        path,
        folderId: input.folderId || null,
        content: input.content,
        ownerUserId: userId,
        lastEditedAt: new Date(),
        lastEditedBy: input.provenance ? 'agent' : 'user',
        isAIGenerated: input.provenance ? true : false,
        createdBy: input.provenance ? 'agent' : 'user',
      };

      // Include client-provided ID if present
      if (input.id) {
        values.id = input.id;
      }

      const [file] = await db
        .insert(files)
        .values(values)
        .returning();
      return file;
    } finally {
      await cleanup();
    }
  }

  /**
   * Find file by ID
   */
  async findById(fileId: string) {
    const { db, cleanup } = await getDB();
    try {
      const [file] = await db
        .select()
        .from(files)
        .where(eq(files.id, fileId))
        .limit(1);
      return file || null;
    } finally {
      await cleanup();
    }
  }

  /**
   * Find file by path
   */
  async findByPath(path: string) {
    const { db, cleanup } = await getDB();
    try {
      const [file] = await db
        .select()
        .from(files)
        .where(eq(files.path, path))
        .limit(1);
      return file || null;
    } finally {
      await cleanup();
    }
  }

  /**
   * Find all files for user
   */
  async findByUserId(userId: string) {
    const { db, cleanup } = await getDB();
    try {
      return await db
        .select()
        .from(files)
        .where(eq(files.ownerUserId, userId))
        .orderBy(files.lastEditedAt);
    } finally {
      await cleanup();
    }
  }

  /**
   * Update file
   */
  async update(fileId: string, input: UpdateFileInput, userId?: string) {
    const { db, cleanup } = await getDB();
    try {
      const updateData: any = {
        lastEditedAt: new Date(),
        lastEditedBy: input.editMetadata?.lastEditedBy || 'user',
      };

      // Update content if provided
      if (input.content !== undefined) {
        updateData.content = input.content;
      }

      // Update name and/or folderId (recompute path if either changes)
      if (input.name !== undefined || input.folderId !== undefined) {
        // Get current file to access current values
        const [currentFile] = await db
          .select()
          .from(files)
          .where(eq(files.id, fileId))
          .limit(1);

        if (!currentFile) {
          throw new Error('File not found');
        }

        const newName = input.name !== undefined ? input.name : currentFile.name;
        const newFolderId = input.folderId !== undefined ? input.folderId : currentFile.folderId;
        const fileUserId = userId || currentFile.ownerUserId;

        // Fetch all folders to compute new path
        const allFolders = await db
          .select()
          .from(folders)
          .where(eq(folders.userId, fileUserId));

        // Recompute path
        const newPath = computeFilePath(
          allFolders as any[],
          newFolderId,
          newName
        );

        updateData.name = newName;
        updateData.folderId = newFolderId;
        updateData.path = newPath;
      }

      const [file] = await db
        .update(files)
        .set(updateData)
        .where(eq(files.id, fileId))
        .returning();
      return file || null;
    } finally {
      await cleanup();
    }
  }

  /**
   * Delete file
   */
  async delete(fileId: string) {
    const { db, cleanup } = await getDB();
    try {
      await db.delete(files).where(eq(files.id, fileId));
    } finally {
      await cleanup();
    }
  }

  /**
   * Update provenance
   */
  async updateProvenance(
    fileId: string,
    provenance: {
      createdInThreadId?: string | null;
      creationTimestamp?: Date | null;
      contextSummary?: string | null;
      lastEditedBy?: 'user' | 'agent' | null;
      editedInThreadId?: string | null;
    }
  ) {
    const { db, cleanup } = await getDB();
    try {
      const [file] = await db
        .update(files)
        .set(provenance)
        .where(eq(files.id, fileId))
        .returning();
      return file || null;
    } finally {
      await cleanup();
    }
  }
}

export const fileRepository = new FileRepository();
