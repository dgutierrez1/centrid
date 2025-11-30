import { eq, and, isNull } from 'drizzle-orm';
import { getDB } from '../functions/_shared/db.ts';
import { threads } from '../db/schema.ts';
import { createLogger } from '../utils/logger.ts';
import type { InsertThread } from '../db/types.ts';

const logger = createLogger('repositories/thread');

export class ThreadRepository {
  /**
   * Create a new thread
   */
  async create(input: Pick<InsertThread, 'ownerUserId' | 'creator'> & { id?: string; parentThreadId?: string | null; branchTitle?: string }) {
    const { db, cleanup } = await getDB();
    try {
      const values: any = {
        ownerUserId: input.ownerUserId,
        parentThreadId: input.parentThreadId || null,
        branchTitle: input.branchTitle,
        creator: input.creator,
      };

      // Use client-provided ID if available (for optimistic updates)
      if (input.id) {
        values.id = input.id;
      }

      const [thread] = await db
        .insert(threads)
        .values(values)
        .returning();
      return thread;
    } catch (error) {
      logger.error('Database insert failed', {
        error,
        input: {
          id: input.id,
          parentThreadId: input.parentThreadId,
          branchTitle: input.branchTitle,
        },
      });
      throw error;
    } finally {
      await cleanup();
    }
  }

  /**
   * Find thread by ID
   */
  async findById(threadId: string) {
    const { db, cleanup } = await getDB();
    try {
      const [thread] = await db
        .select()
        .from(threads)
        .where(eq(threads.id, threadId))
        .limit(1);
      return thread || null;
    } finally {
      await cleanup();
    }
  }

  /**
   * Find child threads (branches)
   */
  async findChildren(parentThreadId: string) {
    const { db, cleanup } = await getDB();
    try {
      return await db
        .select()
        .from(threads)
        .where(eq(threads.parentThreadId, parentThreadId))
        .orderBy(threads.createdAt);
    } finally {
      await cleanup();
    }
  }

  /**
   * Find root threads for user
   */
  async findRootThreads(ownerUserId: string) {
    const { db, cleanup } = await getDB();
    try {
      return await db
        .select()
        .from(threads)
        .where(
          and(
            eq(threads.ownerUserId, ownerUserId),
            isNull(threads.parentThreadId)
          )
        )
        .orderBy(threads.createdAt);
    } finally {
      await cleanup();
    }
  }

  /**
   * Find all threads for user (includes root and child threads)
   */
  async findAllThreads(ownerUserId: string) {
    const { db, cleanup } = await getDB();
    try {
      return await db
        .select()
        .from(threads)
        .where(eq(threads.ownerUserId, ownerUserId))
        .orderBy(threads.createdAt);
    } finally {
      await cleanup();
    }
  }

  /**
   * Update thread
   */
  async update(threadId: string, updates: Partial<Pick<InsertThread, 'branchTitle'>>) {
    const { db, cleanup } = await getDB();
    try {
      const [thread] = await db
        .update(threads)
        .set(updates)
        .where(eq(threads.id, threadId))
        .returning();
      return thread || null;
    } catch (error) {
      logger.error('Database update failed', { error, threadId, updates });
      throw error;
    } finally {
      await cleanup();
    }
  }

  /**
   * Delete thread
   */
  async delete(threadId: string) {
    const { db, cleanup } = await getDB();
    try {
      await db.delete(threads).where(eq(threads.id, threadId));
    } catch (error) {
      logger.error('Database delete failed', { error, threadId });
      throw error;
    } finally {
      await cleanup();
    }
  }
}

export const threadRepository = new ThreadRepository();
