import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { getDB } from '../functions/_shared/db.ts';
import { usageEvents } from '../db/schema.ts';

export interface InsertUsageEvent {
  userId: string;
  eventType: string;
  tokensUsed?: number;
  cost?: number;
  metadata?: any;
}

export class UsageEventRepository {
  /**
   * Create usage event (for billing/analytics)
   */
  async create(input: InsertUsageEvent) {
    const { db, cleanup } = await getDB();
    try {
      const [event] = await db
        .insert(usageEvents)
        .values({
          userId: input.userId,
          eventType: input.eventType,
          tokensUsed: input.tokensUsed || null,
          cost: input.cost || null,
          metadata: input.metadata || null,
        })
        .returning();
      return event;
    } finally {
      await cleanup();
    }
  }

  /**
   * Find events by user ID with optional date range
   * Accepts null for options to support GraphQL optional args
   */
  async findByUserId(
    userId: string,
    options?: {
      startDate?: string | null;
      endDate?: string | null;
      limit?: number | null;
      offset?: number | null;
    }
  ) {
    const { db, cleanup } = await getDB();
    try {
      const conditions = [eq(usageEvents.userId, userId)];

      if (options?.startDate) {
        conditions.push(gte(usageEvents.createdAt, options.startDate));
      }
      if (options?.endDate) {
        conditions.push(lte(usageEvents.createdAt, options.endDate));
      }

      const query = db
        .select()
        .from(usageEvents)
        .where(and(...conditions))
        .orderBy(desc(usageEvents.createdAt))
        .$dynamic();

      if (options?.limit != null) {
        query.limit(options.limit);
      }
      if (options?.offset != null) {
        query.offset(options.offset);
      }

      return await query;
    } finally {
      await cleanup();
    }
  }

  /**
   * Get total tokens used by user (for usage limits)
   */
  async getTotalTokensByUserId(userId: string, startDate?: string) {
    const { db, cleanup } = await getDB();
    try {
      const conditions = [eq(usageEvents.userId, userId)];

      if (startDate) {
        conditions.push(gte(usageEvents.createdAt, startDate));
      }

      const result = await db
        .select()
        .from(usageEvents)
        .where(and(...conditions));

      const total = result.reduce((sum, event) => sum + (event.tokensUsed || 0), 0);
      return total;
    } finally {
      await cleanup();
    }
  }

  /**
   * Get total cost by user (for billing)
   */
  async getTotalCostByUserId(userId: string, startDate?: string) {
    const { db, cleanup } = await getDB();
    try {
      const conditions = [eq(usageEvents.userId, userId)];

      if (startDate) {
        conditions.push(gte(usageEvents.createdAt, startDate));
      }

      const result = await db
        .select()
        .from(usageEvents)
        .where(and(...conditions));

      const total = result.reduce((sum, event) => sum + (event.cost || 0), 0);
      return total;
    } finally {
      await cleanup();
    }
  }
}

export const usageEventRepository = new UsageEventRepository();
