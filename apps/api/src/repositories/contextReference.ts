import { eq } from 'drizzle-orm';
import { getDB } from '../functions/_shared/db.ts';
import { contextReferences } from '../db/schema.ts';

export interface CreateContextReferenceInput {
  threadId: string;
  ownerUserId: string;
  entityType: 'file' | 'folder' | 'thread';
  entityReference: string;
  source: 'inherited' | 'manual' | '@-mentioned' | 'agent-added';
  priorityTier: 1 | 2 | 3;
}

export class ContextReferenceRepository {
  /**
   * Create a new context reference
   */
  async create(input: CreateContextReferenceInput) {
    const { db, cleanup } = await getDB();
    try {
      const [reference] = await db
        .insert(contextReferences)
        .values({
          ...input,
          addedAt: new Date().toISOString(),
        })
        .returning();
      return reference;
    } finally {
      await cleanup();
    }
  }

  /**
   * Find all context references for a thread
   */
  async findByThreadId(threadId: string) {
    const { db, cleanup } = await getDB();
    try {
      return await db
        .select()
        .from(contextReferences)
        .where(eq(contextReferences.threadId, threadId))
        .orderBy(contextReferences.priorityTier, contextReferences.addedAt);
    } finally {
      await cleanup();
    }
  }

  /**
   * Delete a context reference
   */
  async delete(referenceId: string) {
    const { db, cleanup } = await getDB();
    try {
      await db.delete(contextReferences).where(eq(contextReferences.id, referenceId));
    } finally {
      await cleanup();
    }
  }

  /**
   * Bulk create context references
   */
  async bulkCreate(references: CreateContextReferenceInput[]) {
    if (references.length === 0) return [];
    const { db, cleanup } = await getDB();
    try {
      return await db
        .insert(contextReferences)
        .values(references.map(r => ({
          ...r,
          addedAt: new Date().toISOString(),
        })))
        .returning();
    } finally {
      await cleanup();
    }
  }

  /**
   * Delete all references for a thread
   */
  async deleteByThreadId(threadId: string) {
    const { db, cleanup } = await getDB();
    try {
      await db
        .delete(contextReferences)
        .where(eq(contextReferences.threadId, threadId));
    } finally {
      await cleanup();
    }
  }

  /**
   * Update priority tier
   */
  async updatePriority(referenceId: string, priorityTier: 1 | 2 | 3) {
    const { db, cleanup } = await getDB();
    try {
      const [reference] = await db
        .update(contextReferences)
        .set({ priorityTier })
        .where(eq(contextReferences.id, referenceId))
        .returning();
      return reference;
    } finally {
      await cleanup();
    }
  }
}

export const contextReferenceRepository = new ContextReferenceRepository();
