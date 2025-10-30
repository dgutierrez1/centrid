import { eq } from 'drizzle-orm';
import { getDB } from '../functions/_shared/db.ts';
import { files } from '../db/schema.ts';

export interface CreateFileInput {
  path: string;
  content: string;
  ownerUserId?: string;
  provenance?: {
    createdInThreadId: string;
    contextSummary: string;
  };
}

export interface UpdateFileInput {
  content: string;
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
      const [file] = await db
        .insert(files)
        .values({
          path: input.path,
          content: input.content,
          ownerUserId: input.ownerUserId || '',
          lastEditedAt: new Date(),
          lastEditedBy: input.provenance ? 'agent' : 'user',
          isAIGenerated: input.provenance ? true : false,
          createdBy: input.provenance ? 'agent' : 'user',
        })
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
  async update(fileId: string, input: UpdateFileInput) {
    const { db, cleanup } = await getDB();
    try {
      const [file] = await db
        .update(files)
        .set({
          content: input.content,
          lastEditedAt: new Date(),
          lastEditedBy: input.editMetadata?.lastEditedBy || 'user',
        })
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
