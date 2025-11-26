import { messageRepository } from '../repositories/message.ts';
import { agentRequestRepository } from '../repositories/agentRequest.ts';
import type { ContentBlock } from '../types/graphql.ts';
import { createLogger } from '../utils/logger.ts';

const logger = createLogger('MessageOrchestrator');

/**
 * MessageOrchestrator Service
 *
 * Manages message lifecycle with idempotency guarantees.
 * Ensures only ONE assistant message per agent request.
 *
 * Key responsibilities:
 * - Get or create response message (idempotent)
 * - Append content to existing messages
 * - Finalize messages with tool calls and token counts
 */
export class MessageOrchestrator {
  /**
   * Get or create response message for a request (idempotent)
   *
   * If request.responseMessageId exists, returns existing message.
   * Otherwise, creates new message and stores ID in request.
   *
   * This ensures only ONE message per request, even across multiple
   * executions (e.g., after tool approval).
   */
  async getOrCreateResponseMessage(
    requestId: string,
    threadId: string,
    userId: string
  ): Promise<{ id: string; content: ContentBlock[]; isNew: boolean }> {
    logger.info('Getting or creating response message', { requestId });

    // Check if message already exists
    const request = await agentRequestRepository.findById(requestId);
    if (!request) {
      throw new Error(`Request not found: ${requestId}`);
    }

    if (request.responseMessageId) {
      // RESUME: Return existing message
      logger.info('Using existing response message', {
        requestId,
        messageId: request.responseMessageId,
      });

      const existingMessage = await messageRepository.findById(
        request.responseMessageId
      );

      if (!existingMessage) {
        throw new Error(
          `Response message not found: ${request.responseMessageId}`
        );
      }

      return {
        id: existingMessage.id,
        content: Array.isArray(existingMessage.content)
          ? existingMessage.content
          : [],
        isNew: false,
      };
    }

    // FIRST RUN: Create new message
    logger.info('Creating new response message', { requestId, threadId });

    const newMessage = await messageRepository.create({
      threadId,
      ownerUserId: userId,
      role: 'assistant',
      content: [], // Start empty, will append as we stream
      toolCalls: [],
      tokensUsed: 0,
      idempotencyKey: requestId, // Prevent duplicates (requestId is unique per request)
    });

    // Store message ID in request for future resume
    await agentRequestRepository.update(requestId, {
      responseMessageId: newMessage.id,
    });

    logger.info('Created new response message', {
      requestId,
      messageId: newMessage.id,
    });

    return {
      id: newMessage.id,
      content: [],
      isNew: true,
    };
  }

  /**
   * Append content blocks to existing message
   *
   * Fetches current content, appends new blocks, updates message.
   * Thread-safe: fetches latest before updating.
   */
  async appendContent(
    messageId: string,
    newContentBlocks: ContentBlock[]
  ): Promise<void> {
    if (newContentBlocks.length === 0) {
      return; // Nothing to append
    }

    logger.info('Appending content to message', {
      messageId,
      blocksToAppend: newContentBlocks.length,
    });

    // Fetch current message
    const message = await messageRepository.findById(messageId);
    if (!message) {
      throw new Error(`Message not found: ${messageId}`);
    }

    // Append new content blocks
    const currentContent = Array.isArray(message.content)
      ? message.content
      : [];
    const updatedContent = [...currentContent, ...newContentBlocks];

    // Update message
    await messageRepository.update(messageId, {
      content: updatedContent,
    });

    logger.info('Content appended successfully', {
      messageId,
      totalBlocks: updatedContent.length,
    });
  }

  /**
   * Append text to the last text block in message, or create new text block
   *
   * Optimized for streaming: appends to existing text block if possible,
   * avoiding array growth for each chunk.
   */
  async appendText(messageId: string, text: string): Promise<void> {
    if (!text) {
      return;
    }

    // Fetch current message
    const message = await messageRepository.findById(messageId);
    if (!message) {
      throw new Error(`Message not found: ${messageId}`);
    }

    const currentContent = Array.isArray(message.content)
      ? message.content
      : [];

    let updatedContent: ContentBlock[];

    // Try to append to last text block
    const lastBlock = currentContent[currentContent.length - 1];
    if (
      currentContent.length > 0 &&
      lastBlock &&
      lastBlock.type === 'text'
    ) {
      // Append to existing text block
      updatedContent = [
        ...currentContent.slice(0, -1),
        {
          type: 'text',
          text: lastBlock.text + text,
        },
      ];
    } else {
      // Create new text block
      updatedContent = [...currentContent, { type: 'text', text }];
    }

    // Update message
    await messageRepository.update(messageId, {
      content: updatedContent,
    });
  }

  /**
   * Finalize message with tool calls and token count
   *
   * Called when agent execution completes.
   * Updates message with final metadata.
   */
  async finalizeMessage(
    messageId: string,
    toolCalls: Array<{
      id: string;
      toolName: string;
      toolInput: any;
      approved: boolean;
    }>,
    tokensUsed: number
  ): Promise<void> {
    logger.info('Finalizing message', {
      messageId,
      toolCallsCount: toolCalls.length,
      tokensUsed,
    });

    await messageRepository.update(messageId, {
      toolCalls,
      tokensUsed,
    });

    logger.info('Message finalized', { messageId });
  }

  /**
   * Check if message exists for request
   */
  async hasResponseMessage(requestId: string): Promise<boolean> {
    const request = await agentRequestRepository.findById(requestId);
    return !!(request && request.responseMessageId);
  }

  /**
   * Get response message ID for request (if exists)
   */
  async getResponseMessageId(requestId: string): Promise<string | null> {
    const request = await agentRequestRepository.findById(requestId);
    return request?.responseMessageId || null;
  }
}

export const messageOrchestrator = new MessageOrchestrator();
