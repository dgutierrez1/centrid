import { eq, and } from 'drizzle-orm';
import { getDB } from '../functions/_shared/db.ts';
import { agentRequests } from '../db/schema.ts';
import type { InsertAgentRequest, AgentRequest } from '../db/types.ts';

export class AgentRequestRepository {
  /**
   * Create agent request
   */
  static async create(input: Pick<InsertAgentRequest, 'userId' | 'threadId' | 'triggeringMessageId' | 'agentType' | 'content'> & { requestId?: string | null }) {
    const { db, cleanup } = await getDB();
    try {
      const [request] = await db
        .insert(agentRequests)
        .values({
          id: input.requestId ?? undefined, // Use client-provided UUID if available, else defaultRandom()
          userId: input.userId,
          threadId: input.threadId,
          triggeringMessageId: input.triggeringMessageId,
          agentType: input.agentType,
          content: input.content,
          status: 'pending',
          progress: 0.0,
        })
        .returning();
      return request;
    } finally {
      await cleanup();
    }
  }

  /**
   * Find by ID
   */
  static async findById(requestId: string) {
    const { db, cleanup } = await getDB();
    try {
      const [request] = await db
        .select()
        .from(agentRequests)
        .where(eq(agentRequests.id, requestId))
        .limit(1);
      return request || null;
    } finally {
      await cleanup();
    }
  }

  /**
   * Find by triggering message
   */
  static async findByTriggeringMessage(messageId: string) {
    const { db, cleanup } = await getDB();
    try {
      const [request] = await db
        .select()
        .from(agentRequests)
        .where(eq(agentRequests.triggeringMessageId, messageId))
        .limit(1);
      return request || null;
    } finally {
      await cleanup();
    }
  }

  /**
   * Update request
   */
  static async update(requestId: string, updates: Partial<Pick<InsertAgentRequest, 'status' | 'progress' | 'responseMessageId' | 'results' | 'checkpoint' | 'tokenCost' | 'completedAt'>>) {
    const { db, cleanup } = await getDB();
    try {
      const [request] = await db
        .update(agentRequests)
        .set({
          ...updates,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(agentRequests.id, requestId))
        .returning();
      return request;
    } finally {
      await cleanup();
    }
  }

  /**
   * Find all by thread
   */
  static async findByThreadId(threadId: string) {
    const { db, cleanup } = await getDB();
    try {
      return await db
        .select()
        .from(agentRequests)
        .where(eq(agentRequests.threadId, threadId))
        .orderBy(agentRequests.createdAt);
    } finally {
      await cleanup();
    }
  }

  /**
   * Find all by user
   */
  static async findByUserId(userId: string, limit = 50) {
    const { db, cleanup } = await getDB();
    try {
      return await db
        .select()
        .from(agentRequests)
        .where(eq(agentRequests.userId, userId))
        .orderBy(agentRequests.createdAt)
        .limit(limit);
    } finally {
      await cleanup();
    }
  }
}

export const agentRequestRepository = AgentRequestRepository;
