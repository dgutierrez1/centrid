import { messageRepository } from '../repositories/message.ts';
import { threadRepository } from '../repositories/thread.ts';
import { agentRequestRepository } from '../repositories/agentRequest.ts';

export interface CreateMessageInput {
  threadId: string;
  userId: string;
  content: string;
  role: 'user' | 'assistant';
  contextReferences?: any[];
}

export interface MessageResource {
  id: string;
  threadId: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: Date;
  toolCalls?: any[];
  tokensUsed?: number;
  _links: {
    self: { href: string };
    thread: { href: string };
    messages: { href: string };
    stream?: { href: string };
  };
  _embedded?: {
    requestId?: string;
    processingStatus?: string;
  };
}

/**
 * Message Service
 * Orchestrates message creation and AI processing
 * ✅ STATELESS - All methods are static utility functions
 */
export class MessageService {
  /**
   * Create a new message in a thread
   * Returns RESTful resource representation with stream URL
   * For user messages: Creates agent_request for execution tracking
   *
   * ⚠️ VALIDATION IS CALLER'S RESPONSIBILITY
   * Route handler must validate before calling this method
   */
  static async createMessage(input: CreateMessageInput): Promise<MessageResource> {
    console.log('[MessageService] Creating message', {
      threadId: input.threadId,
      role: input.role,
    });

    // Create message in database
    const message = await messageRepository.create({
      threadId: input.threadId,
      ownerUserId: input.userId,
      role: input.role,
      content: input.content,
      toolCalls: [],
    });

    // Create agent_request for user messages
    let requestId: string | undefined;
    if (input.role === 'user') {
      const agentRequest = await agentRequestRepository.create({
        userId: input.userId,
        threadId: input.threadId,
        triggeringMessageId: message.id,
        agentType: 'assistant', // Default type
        content: input.content,
      });
      requestId = agentRequest.id;
      console.log('[MessageService] Created agent_request', { requestId });
    }

    // Build and return resource representation
    const baseUrl = '/api';
    const resourceUrl = `${baseUrl}/threads/${input.threadId}/messages/${message.id}`;
    const streamUrl = requestId
      ? `/api/agent-requests/${requestId}/stream`
      : undefined;

    return {
      id: message.id,
      threadId: input.threadId,
      content: input.content,
      role: input.role,
      createdAt: message.timestamp,
      toolCalls: (message.toolCalls as any[]) || undefined,
      tokensUsed: message.tokensUsed ?? undefined,
      _links: {
        self: { href: resourceUrl },
        thread: { href: `${baseUrl}/threads/${input.threadId}` },
        messages: { href: `${baseUrl}/threads/${input.threadId}/messages` },
        ...(streamUrl && { stream: { href: streamUrl } }),
      },
      _embedded:
        input.role === 'user'
          ? {
              requestId: requestId!,
              processingStatus: 'pending',
            }
          : undefined,
    };
  }

  /**
   * Get a specific message by ID
   */
  static async getMessage(threadId: string, messageId: string, userId: string): Promise<MessageResource> {
    // Verify thread access
    const thread = await threadRepository.findById(threadId);
    if (!thread || thread.ownerUserId !== userId) {
      throw new Error('Thread not found or access denied');
    }

    // Get message
    const message = await messageRepository.findById(messageId);
    if (!message || message.threadId !== threadId) {
      throw new Error('Message not found');
    }

    // Build resource
    const baseUrl = '/api';
    const resourceUrl = `${baseUrl}/threads/${threadId}/messages/${messageId}`;

    return {
      id: message.id,
      threadId: threadId,
      content: message.content,
      role: message.role as 'user' | 'assistant',
      createdAt: message.timestamp,
      toolCalls: (message.toolCalls as any[]) || undefined,
      tokensUsed: message.tokensUsed ?? undefined,
      _links: {
        self: { href: resourceUrl },
        thread: { href: `${baseUrl}/threads/${threadId}` },
        messages: { href: `${baseUrl}/threads/${threadId}/messages` },
      },
    };
  }

  /**
   * Delete a message
   */
  static async deleteMessage(threadId: string, messageId: string, userId: string): Promise<void> {
    const thread = await threadRepository.findById(threadId);
    if (!thread || thread.ownerUserId !== userId) {
      throw new Error('Thread not found or access denied');
    }

    await messageRepository.delete(messageId);
  }

}
