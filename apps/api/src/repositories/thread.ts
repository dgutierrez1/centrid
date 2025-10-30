import { eq, and, isNull } from 'drizzle-orm';
import { getDB } from '../functions/_shared/db.ts';
import { threads } from '../db/schema.ts';

export interface CreateThreadInput {
  ownerUserId: string;
  parentThreadId?: string | null;
  branchTitle: string;
  creator: 'user' | 'agent' | 'system';
}

export interface UpdateThreadInput {
  branchTitle?: string;
  threadSummary?: string;
}

export class ThreadRepository {
  /**
   * Create a new thread
   */
  async create(input: CreateThreadInput) {
    const { db, cleanup } = await getDB();
    try {
      const [thread] = await db
        .insert(threads)
        .values({
          ownerUserId: input.ownerUserId,
          parentThreadId: input.parentThreadId || null,
          branchTitle: input.branchTitle,
          creator: input.creator,
        })
        .returning();
      return thread;
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
   * Update thread
   */
  async update(threadId: string, updates: UpdateThreadInput) {
    const { db, cleanup } = await getDB();
    try {
      const [thread] = await db
        .update(threads)
        .set(updates)
        .where(eq(threads.id, threadId))
        .returning();
      return thread || null;
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
    } finally {
      await cleanup();
    }
  }
}

export const threadRepository = new ThreadRepository();
