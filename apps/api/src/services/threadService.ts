import { threadRepository } from '../repositories/thread.ts';
import { messageRepository } from '../repositories/message.ts';

export interface CreateThreadInput {
  userId: string;
  title: string;
  parentId?: string;
}

export interface UpdateThreadInput {
  title?: string;
  summary?: string;
}

export interface ThreadWithMessages {
  id: string;
  branchTitle: string;
  ownerUserId: string;
  parentThreadId: string | null;
  creator: 'user' | 'agent' | 'system';
  createdAt: Date;
  updatedAt: Date;
  messages: any[];
  messageCount: number;
  // Optional fields from thread
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
   * Validates parent ownership if parentId provided
   */
  static async createThread(input: CreateThreadInput): Promise<any> {
    // If parent provided, verify it exists and user owns it
    if (input.parentId) {
      const parent = await threadRepository.findById(input.parentId);
      if (!parent) {
        throw new Error('Parent thread not found');
      }
      if (parent.ownerUserId !== input.userId) {
        throw new Error('Access denied to parent thread');
      }
    }

    // Create thread
    const thread = await threadRepository.create({
      ownerUserId: input.userId,
      branchTitle: input.title,
      parentThreadId: input.parentId || null,
      creator: 'user',
    });

    return thread;
  }

  /**
   * Get a single thread with messages
   * Validates ownership
   */
  static async getThread(threadId: string, userId: string): Promise<ThreadWithMessages> {
    const thread = await threadRepository.findById(threadId);
    
    if (!thread) {
      throw new Error('Thread not found');
    }

    if (thread.ownerUserId !== userId) {
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
    // Verify thread exists and user owns it
    const thread = await threadRepository.findById(threadId);
    
    if (!thread) {
      throw new Error('Thread not found');
    }

    if (thread.ownerUserId !== userId) {
      throw new Error('Access denied');
    }

    // Update thread
    const updated = await threadRepository.update(threadId, {
      branchTitle: updates.title,
      threadSummary: updates.summary,
    });

    return updated;
  }

  /**
   * Delete thread
   * Validates ownership and prevents deletion if has children
   */
  static async deleteThread(threadId: string, userId: string): Promise<void> {
    // Verify thread exists and user owns it
    const thread = await threadRepository.findById(threadId);
    
    if (!thread) {
      throw new Error('Thread not found');
    }

    if (thread.ownerUserId !== userId) {
      throw new Error('Access denied');
    }

    // Check for child branches
    const children = await threadRepository.findChildren(threadId);
    if (children.length > 0) {
      throw new Error(
        `Cannot delete thread with ${children.length} child branch${children.length > 1 ? 'es' : ''}`
      );
    }

    // Delete thread
    await threadRepository.delete(threadId);
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
}
