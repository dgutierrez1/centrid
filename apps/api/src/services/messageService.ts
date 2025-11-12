import { messageRepository } from '../repositories/message.ts';
import { agentRequestRepository } from '../repositories/agentRequest.ts';
import type { ContentBlock } from '../types/agent.ts';
import type { Message } from '../db/types.ts';

export interface CreateMessageInput {
  threadId: string;
  userId: string;
  content: string;
  role: 'user' | 'assistant';
  contextReferences?: any[];
}

/**
 * Message Service
 * Orchestrates message creation and AI processing
 * ✅ STATELESS - All methods are static utility functions
 */
export class MessageService {
  /**
   * Create a new message in a thread
   * Returns database Message entity
   * For user messages: Creates agent_request for execution tracking
   *
   * ⚠️ VALIDATION IS CALLER'S RESPONSIBILITY
   * Route handler must validate before calling this method
   */
  static async createMessage(input: CreateMessageInput): Promise<Message> {
    console.log('[MessageService] Creating message', {
      threadId: input.threadId,
      role: input.role,
    });

    // Convert string content to ContentBlock array
    const contentBlocks: ContentBlock[] = [
      {
        type: 'text',
        text: input.content,
      },
    ];

    // Create message in database
    const message = await messageRepository.create({
      threadId: input.threadId,
      ownerUserId: input.userId,
      role: input.role,
      content: contentBlocks,
      toolCalls: [],
    });

    // Create agent_request for user messages
    let updatedMessage = message;
    if (input.role === 'user') {
      const agentRequest = await agentRequestRepository.create({
        userId: input.userId,
        threadId: input.threadId,
        triggeringMessageId: message.id,
        agentType: 'assistant', // Default type
        content: input.content,
      });
      console.log('[MessageService] Created agent_request', { requestId: agentRequest.id });

      // Update message with requestId (save to database for GraphQL exposure)
      updatedMessage = await messageRepository.update(message.id, { requestId: agentRequest.id });
      console.log('[MessageService] Linked message to agent_request', {
        messageId: message.id,
        requestId: agentRequest.id,
      });
    }

    // Return database entity
    return updatedMessage;
  }
}
