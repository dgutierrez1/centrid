import { eq, desc } from 'drizzle-orm';
import { getDB } from '../functions/_shared/db.ts';
import { agentSessions } from '../db/schema.ts';

export interface InsertAgentSession {
  userId: string;
  requestChain: unknown[];
  contextState?: unknown;
}

export interface UpdateAgentSession {
  requestChain?: unknown[];
  contextState?: unknown;
}

export class AgentSessionRepository {
  /**
   * Create new agent session
   */
  async create(input: InsertAgentSession) {
    const { db, cleanup } = await getDB();
    try {
      const [session] = await db
        .insert(agentSessions)
        .values({
          userId: input.userId,
          requestChain: input.requestChain,
          contextState: input.contextState || null,
        })
        .returning();
      return session;
    } finally {
      await cleanup();
    }
  }

  /**
   * Find session by ID
   */
  async findById(id: string) {
    const { db, cleanup } = await getDB();
    try {
      const [session] = await db
        .select()
        .from(agentSessions)
        .where(eq(agentSessions.id, id));
      return session || null;
    } finally {
      await cleanup();
    }
  }

  /**
   * Find sessions by user ID
   */
  async findByUserId(userId: string, limit?: number, offset?: number) {
    const { db, cleanup } = await getDB();
    try {
      let query = db
        .select()
        .from(agentSessions)
        .where(eq(agentSessions.userId, userId))
        .orderBy(desc(agentSessions.updatedAt));

      if (limit !== undefined) {
        query = query.limit(limit);
      }
      if (offset !== undefined) {
        query = query.offset(offset);
      }

      return await query;
    } finally {
      await cleanup();
    }
  }

  /**
   * Update agent session
   */
  async update(id: string, input: UpdateAgentSession) {
    const { db, cleanup } = await getDB();
    try {
      const [session] = await db
        .update(agentSessions)
        .set({
          requestChain: input.requestChain,
          contextState: input.contextState,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(agentSessions.id, id))
        .returning();
      return session || null;
    } finally {
      await cleanup();
    }
  }

  /**
   * Delete agent session
   */
  async delete(id: string) {
    const { db, cleanup } = await getDB();
    try {
      await db
        .delete(agentSessions)
        .where(eq(agentSessions.id, id));
      return true;
    } finally {
      await cleanup();
    }
  }
}

export const agentSessionRepository = new AgentSessionRepository();
