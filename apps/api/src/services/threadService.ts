import { threadRepository } from '../repositories/thread.ts';
import { messageRepository } from '../repositories/message.ts';
import { createLogger } from '../utils/logger.ts';
import { MessageService } from './messageService.ts';
import type { Message } from '../db/types.ts';

const logger = createLogger('ThreadService');

/**
 * Service-layer CreateThreadInput adds server-side context not in GraphQL Input:
 * - userId: Injected from auth context by GraphQL resolver (prevents client spoofing)
 * - title: Domain term used by service layer (maps to 'branchTitle' in database/GraphQL)
 *
 * GraphQL CreateThreadInput uses 'branchTitle' (database field name).
 * Service layer uses 'title' (domain term) and maps to 'branchTitle' in repository calls.
 */
export interface CreateThreadInput {
  userId: string; // From auth context (not in GraphQL Input)
  title: string; // Domain term (maps to 'branchTitle' in DB)
  parentThreadId?: string;
}

/**
 * Service-layer UpdateThreadInput uses domain terms:
 * - title: Maps to 'branchTitle' in database
 * - summary: Maps to 'threadSummary' in database
 *
 * GraphQL UpdateThreadInput uses database field names (branchTitle, not title).
 */
export interface UpdateThreadInput {
  title?: string; // Domain term (maps to 'branchTitle')
  summary?: string; // Domain term (maps to 'threadSummary')
}

/**
 * Service-layer response type with aggregated data.
 * Includes thread entity + computed fields (messageCount, messages array).
 */
export interface ThreadWithMessages {
  id: string;
  branchTitle: string;
  ownerUserId: string;
  parentThreadId: string | null;
  creator: 'user' | 'agent' | 'system';
  createdAt: string;
  updatedAt: string;
  messages: any[];
  messageCount: number;
  threadSummary?: string | null;
}

/**
 * Thread Service
 * Handles thread CRUD operations with business logic
 * ✅ STATELESS - All methods are static utility functions
 */
export class ThreadService {
  /**
   * List all root threads for a user
   */
  static async listThreads(userId: string, includeArchived: boolean = false): Promise<any[]> {
    const threads = await threadRepository.findRootThreads(userId);
    
    // TODO: Filter archived when schema supports it
    if (!includeArchived) {
      // return threads.filter(t => !t.archived);
    }
    
    return threads;
  }

  /**
   * Create a new thread (root or branch)
   * Validates parent ownership if parentThreadId provided
   */
  static async createThread(input: CreateThreadInput): Promise<any> {
    logger.info('Creating thread', {
      title: input.title,
      parentThreadId: input.parentThreadId || null,
      isRootThread: !input.parentThreadId,
    });

    // If parent provided, verify it exists and user owns it
    if (input.parentThreadId) {
      const parent = await threadRepository.findById(input.parentThreadId);
      if (!parent) {
        logger.warn('Parent thread not found', { parentThreadId: input.parentThreadId });
        throw new Error('Parent thread not found');
      }
      if (parent.ownerUserId !== input.userId) {
        logger.warn('Access denied to parent thread', {
          parentThreadId: input.parentThreadId,
          parentOwnerId: parent.ownerUserId,
          requestUserId: input.userId,
        });
        throw new Error('Access denied to parent thread');
      }
    }

    // Create thread
    const thread = await threadRepository.create({
      ownerUserId: input.userId,
      branchTitle: input.title,
      parentThreadId: input.parentThreadId || null,
      creator: 'user',
    });

    logger.info('Thread created successfully', { threadId: thread.id });

    return thread;
  }

  /**
   * Get a single thread with messages
   * Validates ownership
   */
  static async getThread(threadId: string, userId: string): Promise<ThreadWithMessages> {
    const thread = await threadRepository.findById(threadId);

    if (!thread) {
      logger.warn('Thread not found', { threadId });
      throw new Error('Thread not found');
    }

    if (thread.ownerUserId !== userId) {
      logger.warn('Access denied to thread', {
        threadId,
        ownerId: thread.ownerUserId,
        requestUserId: userId,
      });
      throw new Error('Access denied');
    }

    // Load messages for this thread
    const messages = await messageRepository.findByThreadId(threadId);

    return {
      ...thread,
      messages,
      messageCount: messages.length,
    } as ThreadWithMessages;
  }

  /**
   * Update thread title or summary
   * Validates ownership
   */
  static async updateThread(
    threadId: string,
    userId: string,
    updates: UpdateThreadInput
  ): Promise<any> {
    logger.info('Updating thread', { threadId, updates });

    // Verify thread exists and user owns it
    const thread = await threadRepository.findById(threadId);

    if (!thread) {
      logger.warn('Thread not found', { threadId });
      throw new Error('Thread not found');
    }

    if (thread.ownerUserId !== userId) {
      logger.warn('Access denied to thread', {
        threadId,
        ownerId: thread.ownerUserId,
        requestUserId: userId,
      });
      throw new Error('Access denied');
    }

    // Update thread
    const updated = await threadRepository.update(threadId, {
      branchTitle: updates.title,
      threadSummary: updates.summary,
    });

    logger.info('Thread updated successfully', { threadId });

    return updated;
  }

  /**
   * Delete thread
   * Validates ownership and prevents deletion if has children
   */
  static async deleteThread(threadId: string, userId: string): Promise<void> {
    logger.info('Deleting thread', { threadId });

    // Verify thread exists and user owns it
    const thread = await threadRepository.findById(threadId);

    if (!thread) {
      logger.warn('Thread not found', { threadId });
      throw new Error('Thread not found');
    }

    if (thread.ownerUserId !== userId) {
      logger.warn('Access denied to thread', {
        threadId,
        ownerId: thread.ownerUserId,
        requestUserId: userId,
      });
      throw new Error('Access denied');
    }

    // Check for child branches
    const children = await threadRepository.findChildren(threadId);
    if (children.length > 0) {
      logger.warn('Cannot delete thread with children', {
        threadId,
        childCount: children.length,
      });
      throw new Error(
        `Cannot delete thread with ${children.length} child branch${children.length > 1 ? 'es' : ''}`
      );
    }

    // Delete thread
    await threadRepository.delete(threadId);

    logger.info('Thread deleted successfully', { threadId });
  }

  /**
   * Get child branches of a thread
   * Validates ownership of parent
   */
  static async getChildren(threadId: string, userId: string): Promise<any[]> {
    // Verify thread exists and user owns it
    const thread = await threadRepository.findById(threadId);
    
    if (!thread) {
      throw new Error('Thread not found');
    }

    if (thread.ownerUserId !== userId) {
      throw new Error('Access denied');
    }

    // Get child branches
    const children = await threadRepository.findChildren(threadId);

    return children;
  }

  /**
   * Create thread with initial user message and trigger execution
   *
   * This method:
   * 1. Validates parent ownership (if parentThreadId provided)
   * 2. Creates thread
   * 3. Creates initial user message with agent_request
   * 4. Triggers agent execution asynchronously
   * 5. Returns { thread, message } immediately
   *
   * Frontend subscribes to realtime agent_execution_events for progress.
   *
   * @param input - Thread creation + initial message
   * @returns { thread, message } - Both with IDs, execution happens asynchronously
   */
  static async createThreadWithMessage(input: {
    userId: string;
    title: string;
    messageContent: string;
    parentThreadId?: string;
    messageIdempotencyKey?: string;
    requestId?: string; // Optional client-provided UUID for agent request
  }): Promise<{ thread: any; message: Message }> {
    logger.info('Creating thread with initial message', {
      title: input.title,
      parentThreadId: input.parentThreadId || null,
    });

    // Validate parent ownership if provided
    if (input.parentThreadId) {
      const parent = await threadRepository.findById(input.parentThreadId);
      if (!parent) {
        logger.warn('Parent thread not found', { parentThreadId: input.parentThreadId });
        throw new Error('Parent thread not found');
      }
      if (parent.ownerUserId !== input.userId) {
        logger.warn('Access denied to parent thread', {
          parentThreadId: input.parentThreadId,
          parentOwnerId: parent.ownerUserId,
          requestUserId: input.userId,
        });
        throw new Error('Access denied to parent thread');
      }
    }

    // Create thread
    const thread = await threadRepository.create({
      ownerUserId: input.userId,
      branchTitle: input.title,
      parentThreadId: input.parentThreadId || null,
      creator: 'user',
    });

    logger.info('Thread created successfully', { threadId: thread.id });

    // Create initial message with execution
    const message = await MessageService.createMessageWithExecution({
      threadId: thread.id,
      userId: input.userId,
      role: 'user',
      content: input.messageContent,
      idempotencyKey: input.messageIdempotencyKey,
      requestId: input.requestId, // Pass through client-provided UUID
    });

    logger.info('Thread and message created successfully', {
      threadId: thread.id,
      messageId: message.id,
      requestId: message.requestId,
    });

    return { thread, message };
  }
}
