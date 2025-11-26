import { messageRepository } from '../repositories/message.ts';
import { agentRequestRepository } from '../repositories/agentRequest.ts';
import type { ContentBlock } from '../types/graphql.ts';
import type { Message } from '../db/types.ts';
import { createLogger } from '../utils/logger.ts';
import { AgentRequestService } from './agentRequestService.ts';

const logger = createLogger('MessageService');

/**
 * Service-layer CreateMessageInput adds server-side context not in GraphQL Input:
 * - userId: Injected from auth context by GraphQL resolver (prevents client spoofing)
 * - contextReferences: Service-layer concern for associating message with context entities
 *
 * GraphQL CreateMessageInput includes: threadId, role, content, toolCalls, tokensUsed, idempotencyKey.
 * Service layer tracks additional metadata (contextReferences) not exposed to clients.
 */
export interface CreateMessageInput {
  threadId: string;
  userId: string; // From auth context (not in GraphQL Input)
  content: string;
  role: 'user' | 'assistant';
  contextReferences?: any[]; // Service-layer metadata (not in GraphQL)
  idempotencyKey?: string; // For deduplication (prevents duplicate messages)
  requestId?: string; // Optional client-provided UUID for agent request (enables optimistic updates)
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
    logger.info('Creating message', {
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

    // Create message in database (idempotent if idempotencyKey provided)
    const message = await messageRepository.create({
      threadId: input.threadId,
      ownerUserId: input.userId,
      role: input.role,
      content: contentBlocks,
      toolCalls: [],
      idempotencyKey: input.idempotencyKey,
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
        requestId: input.requestId, // Use client-provided UUID if available
      });
      logger.info('Created agent_request', { requestId: agentRequest.id });

      // Update message with requestId (save to database for GraphQL exposure)
      updatedMessage = await messageRepository.update(message.id, { requestId: agentRequest.id });
      logger.info('Linked message to agent_request', {
        messageId: message.id,
        requestId: agentRequest.id,
      });
    }

    // Return database entity
    return updatedMessage;
  }

  /**
   * Create a new message and trigger agent execution asynchronously
   *
   * This method:
   * 1. Creates message in database
   * 2. Creates agent_request (for user messages)
   * 3. Triggers execution asynchronously (fire-and-forget)
   * 4. Returns message immediately with requestId
   *
   * Frontend subscribes to realtime agent_execution_events to track progress.
   *
   * @param input - Message creation parameters
   * @returns Message with requestId (execution happens asynchronously)
   */
  static async createMessageWithExecution(input: CreateMessageInput): Promise<Message> {
    logger.info('Creating message with execution', {
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

    // Create message in database (idempotent if idempotencyKey provided)
    const message = await messageRepository.create({
      threadId: input.threadId,
      ownerUserId: input.userId,
      role: input.role,
      content: contentBlocks,
      toolCalls: [],
      idempotencyKey: input.idempotencyKey,
    });

    // Create agent_request and trigger execution for user messages
    if (input.role === 'user') {
      const agentRequest = await agentRequestRepository.create({
        userId: input.userId,
        threadId: input.threadId,
        triggeringMessageId: message.id,
        agentType: 'assistant',
        content: input.content,
        requestId: input.requestId, // Use client-provided UUID if available
      });
      logger.info('Created agent_request', { requestId: agentRequest.id });

      // Update message with requestId
      const updatedMessage = await messageRepository.update(message.id, { requestId: agentRequest.id });
      logger.info('Linked message to agent_request', {
        messageId: message.id,
        requestId: agentRequest.id,
      });

      // Trigger execution asynchronously (fire-and-forget)
      // Frontend subscribes to realtime agent_execution_events for updates
      AgentRequestService.executeRequest(agentRequest.id)
        .then((result) => {
          logger.info('Agent execution completed', {
            requestId: agentRequest.id,
            status: result.status,
            eventCount: result.eventCount,
          });
        })
        .catch((error) => {
          logger.error('Agent execution failed', {
            requestId: agentRequest.id,
            error: error instanceof Error ? error.message : String(error),
          });
        });

      return updatedMessage;
    }

    // Assistant/system messages don't trigger execution
    return message;
  }
}
