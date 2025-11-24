import { eq } from 'drizzle-orm';
import { getDB } from '../functions/_shared/db.ts';
import { messages } from '../db/schema.ts';
import type { ContentBlock } from '../types/graphql.ts';
import { createLogger } from '../utils/logger.ts';

const logger = createLogger('MessageRepository');

export interface CreateMessageInput {
  threadId: string;
  ownerUserId: string;
  role: 'user' | 'assistant';
  content: ContentBlock[];
  toolCalls?: any[];
  tokensUsed?: number;
  idempotencyKey?: string;
}

export class MessageRepository {
  /**
   * Find message by idempotency key
   */
  async findByIdempotencyKey(idempotencyKey: string) {
    const { db, cleanup } = await getDB();
    try {
      const [message] = await db
        .select()
        .from(messages)
        .where(eq(messages.idempotencyKey, idempotencyKey))
        .limit(1);
      return message || null;
    } finally {
      await cleanup();
    }
  }

  /**
   * Create a new message (idempotent)
   * If idempotencyKey is provided and a message with that key exists, returns existing message
   */
  async create(input: CreateMessageInput) {
    const { db, cleanup } = await getDB();
    try {
      // Check for existing message with same idempotency key
      if (input.idempotencyKey) {
        const existing = await this.findByIdempotencyKey(input.idempotencyKey);
        if (existing) {
          logger.info('Message with idempotency key already exists', {
            idempotencyKey: input.idempotencyKey,
            messageId: existing.id,
          });
          return existing;
        }
      }

      const [message] = await db
        .insert(messages)
        .values({
          threadId: input.threadId,
          ownerUserId: input.ownerUserId,
          role: input.role,
          content: input.content,
          toolCalls: input.toolCalls || [],
          tokensUsed: input.tokensUsed || 0,
          idempotencyKey: input.idempotencyKey || null,
          timestamp: new Date().toISOString(),
        })
        .returning();
      return message;
    } finally {
      await cleanup();
    }
  }

  /**
   * Find message by ID
   */
  async findById(messageId: string) {
    const { db, cleanup } = await getDB();
    try {
      const [message] = await db
        .select()
        .from(messages)
        .where(eq(messages.id, messageId))
        .limit(1);
      return message || null;
    } finally {
      await cleanup();
    }
  }

  /**
   * Find all messages for a thread
   */
  async findByThreadId(threadId: string, limit: number = 50, offset: number = 0) {
    const { db, cleanup } = await getDB();
    try {
      return await db
        .select()
        .from(messages)
        .where(eq(messages.threadId, threadId))
        .orderBy(messages.timestamp)
        .limit(limit)
        .offset(offset);
    } finally {
      await cleanup();
    }
  }

  /**
   * Update message
   */
  async update(messageId: string, updates: Partial<CreateMessageInput>) {
    const { db, cleanup } = await getDB();
    try {
      const [message] = await db
        .update(messages)
        .set(updates)
        .where(eq(messages.id, messageId))
        .returning();
      return message || null;
    } finally {
      await cleanup();
    }
  }

  /**
   * Delete message
   */
  async delete(messageId: string) {
    const { db, cleanup } = await getDB();
    try {
      await db.delete(messages).where(eq(messages.id, messageId));
    } finally {
      await cleanup();
    }
  }
}

export const messageRepository = new MessageRepository();
