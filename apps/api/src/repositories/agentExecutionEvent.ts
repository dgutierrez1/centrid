import { eq, desc } from 'drizzle-orm';
import { getDB } from '../functions/_shared/db.ts';
import { agentExecutionEvents } from '../db/schema.ts';

export interface CreateAgentExecutionEventInput {
  requestId: string;
  userId: string;
  type: string;
  data: any;
}

export class AgentExecutionEventRepository {
  /**
   * Insert execution event
   */
  static async create(input: CreateAgentExecutionEventInput) {
    const { db, cleanup } = await getDB();
    try {
      const [event] = await db
        .insert(agentExecutionEvents)
        .values({
          requestId: input.requestId,
          userId: input.userId,
          type: input.type,
          data: input.data,
        })
        .returning();
      return event;
    } finally {
      await cleanup();
    }
  }

  /**
   * Get all events for a request (for replay on late connection)
   */
  static async findByRequestId(requestId: string) {
    const { db, cleanup } = await getDB();
    try {
      const events = await db
        .select()
        .from(agentExecutionEvents)
        .where(eq(agentExecutionEvents.requestId, requestId))
        .orderBy(agentExecutionEvents.createdAt);
      return events;
    } finally {
      await cleanup();
    }
  }

  /**
   * Get events since a certain timestamp (for incremental polling if needed)
   */
  static async findByRequestIdSinceTimestamp(requestId: string, timestamp: Date) {
    const { db, cleanup } = await getDB();
    try {
      const events = await db
        .select()
        .from(agentExecutionEvents)
        .where(
          eq(agentExecutionEvents.requestId, requestId) &&
          agentExecutionEvents.createdAt > timestamp
        )
        .orderBy(agentExecutionEvents.createdAt);
      return events;
    } finally {
      await cleanup();
    }
  }

  /**
   * Count events for a request
   */
  static async countByRequestId(requestId: string) {
    const { db, cleanup } = await getDB();
    try {
      const result = await db
        .select({ count: agentExecutionEvents.id })
        .from(agentExecutionEvents)
        .where(eq(agentExecutionEvents.requestId, requestId));
      return result[0]?.count || 0;
    } finally {
      await cleanup();
    }
  }

  /**
   * Delete events for a request (cleanup)
   */
  static async deleteByRequestId(requestId: string) {
    const { db, cleanup } = await getDB();
    try {
      await db
        .delete(agentExecutionEvents)
        .where(eq(agentExecutionEvents.requestId, requestId));
    } finally {
      await cleanup();
    }
  }
}

export const agentExecutionEventRepository = AgentExecutionEventRepository;
