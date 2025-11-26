import { messageRepository } from '../repositories/message.ts';
import { agentToolCallRepository } from '../repositories/agentToolCall.ts';
import { agentRequestRepository } from '../repositories/agentRequest.ts';
import { ClaudeConversationBuilder } from './conversationBuilder.ts';
import { createLogger } from '../utils/logger.ts';

const logger = createLogger('ConversationLoader');

export interface ConversationState {
  messages: any[]; // Claude-formatted messages
  responseMessageId: string | null;
  isResume: boolean;
  accumulatedText: string; // Text content from response message (for resume)
  toolCallsList: Array<{
    id: string;
    toolName: string;
    toolInput: any;
    approved: boolean;
  }>;
}

/**
 * ConversationLoader Service
 *
 * Loads conversation state from database and builds Claude-compatible messages.
 *
 * Key responsibilities:
 * - Load messages and tool calls from database
 * - Detect if this is a fresh execution or resume
 * - Build Claude-compatible conversation using ConversationBuilder
 * - Skip pending tools on resume (prevent re-prompting)
 * - Extract accumulated text from response message
 */
export class ConversationLoader {
  /**
   * Load conversation state for agent execution
   *
   * Returns conversation ready for Claude API, with resume detection.
   * On resume, excludes pending tool_use blocks to prevent Claude from
   * re-suggesting the same tool.
   */
  async loadConversation(
    threadId: string,
    requestId: string
  ): Promise<ConversationState> {
    logger.info('Loading conversation', { threadId, requestId });

    const request = await agentRequestRepository.findById(requestId);
    const isResume = !!(request && request.responseMessageId);

    logger.info('Conversation mode detected', {
      requestId,
      isResume,
      responseMessageId: request?.responseMessageId,
    });

    // Fetch all messages for thread
    const threadMessages = await messageRepository.findByThreadId(
      threadId,
      20,
      0
    );

    // Fetch all tool calls for thread
    const threadToolCalls = await agentToolCallRepository.findByThreadId(
      threadId
    );

    logger.info('Database query results', {
      messagesCount: threadMessages.length,
      toolCallsCount: threadToolCalls.length,
    });

    // DEBUG: Log tool call states for conversation building
    if (threadToolCalls.length > 0) {
      logger.info('🔧 Tool calls loaded for conversation', {
        toolCalls: threadToolCalls.map(tc => ({
          id: tc.id,
          toolName: tc.toolName,
          approvalStatus: tc.approvalStatus,
          hasOutput: tc.toolOutput !== null,
          timestamp: tc.timestamp,
        })),
      });
    }

    // Extract accumulated text and tool calls from response message (if exists)
    let accumulatedText = '';
    const toolCallsList: Array<{
      id: string;
      toolName: string;
      toolInput: any;
      approved: boolean;
    }> = [];

    // On resume, load tool calls list (but NOT accumulatedText - that should always start empty)
    // accumulatedText only tracks NEW text from current execution run
    // Historical text is already saved in DB and included in Claude's conversation via conversationBuilder
    if (isResume && request.responseMessageId) {
      const responseMessage = threadMessages.find(
        (m) => m.id === request.responseMessageId
      );

      if (responseMessage) {
        // Extract tool calls (needed to track which tools have been executed)
        if (Array.isArray(responseMessage.toolCalls)) {
          toolCallsList.push(...responseMessage.toolCalls);
        }

        logger.info('Loaded state from response message', {
          responseMessageId: request.responseMessageId,
          toolCallsCount: toolCallsList.length,
        });
      }
    }

    // Build Claude-compliant conversation
    const builder = new ClaudeConversationBuilder(
      threadToolCalls,
      'ConversationLoader'
    );

    // Include ALL messages (including response message on resume)
    // The conversation builder will properly add tool_result blocks
    // for approved/rejected tools based on threadToolCalls
    const messagesToBuild = threadMessages;

    logger.info('Building conversation', {
      messagesCount: messagesToBuild.length,
      isResume,
      responseMessageIncluded: isResume && request.responseMessageId
        ? threadMessages.some(m => m.id === request.responseMessageId)
        : false,
    });

    for (const msg of messagesToBuild) {
      if (msg.role === 'user') {
        builder.addUserMessage(msg.content);
      } else {
        builder.addAssistantMessage(msg);
      }
    }

    const messages = builder.build();

    logger.info('Conversation built', {
      claudeMessagesCount: messages.length,
      isResume,
    });

    return {
      messages,
      responseMessageId: request?.responseMessageId || null,
      isResume,
      accumulatedText,
      toolCallsList,
    };
  }

  /**
   * Check if request is in resume mode
   */
  async isResume(requestId: string): Promise<boolean> {
    const request = await agentRequestRepository.findById(requestId);
    return !!(request && request.responseMessageId);
  }

  /**
   * Get response message for request (if exists)
   */
  async getResponseMessage(requestId: string): Promise<any | null> {
    const request = await agentRequestRepository.findById(requestId);
    if (!request || !request.responseMessageId) {
      return null;
    }

    return await messageRepository.findById(request.responseMessageId);
  }
}

export const conversationLoader = new ConversationLoader();
