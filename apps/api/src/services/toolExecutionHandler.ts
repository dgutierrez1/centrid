import { agentToolCallRepository } from '../repositories/agentToolCall.ts';
import { toolRequiresApproval } from '../config/tools.ts';
import { ToolCallService } from './toolCall.ts';
import { createLogger } from '../utils/logger.ts';

const logger = createLogger('ToolExecutionHandler');

export interface ToolExecutionResult {
  needsApproval: boolean;
  toolCallId?: string;
  result?: any;
  error?: string;
}

export interface ToolCallContext {
  threadId: string;
  messageId: string;
  userId: string;
  requestId: string;
}

/**
 * ToolExecutionHandler Service
 *
 * Manages tool execution lifecycle with approval workflow.
 *
 * Key responsibilities:
 * - Determine if tool needs approval
 * - Execute auto-approved tools immediately
 * - Create tool call records for approval-required tools
 * - Execute tools using ToolCallService dispatcher
 */
export class ToolExecutionHandler {
  /**
   * Handle tool call - execute immediately or request approval
   *
   * Returns:
   * - needsApproval: true if user approval required
   * - toolCallId: ID of created tool_call record
   * - result: Tool execution result (for auto-executed tools)
   */
  async handleToolCall(
    toolCall: { name: string; input: Record<string, any>; toolId: string },
    context: ToolCallContext
  ): Promise<ToolExecutionResult> {
    const requiresApproval = this.shouldRequireApproval(toolCall.name);

    logger.info('Handling tool call', {
      toolName: toolCall.name,
      requiresApproval,
      threadId: context.threadId,
    });

    if (requiresApproval) {
      // Create tool call record and wait for approval
      return await this.createToolCallForApproval(toolCall, context);
    } else {
      // Auto-execute and return result
      return await this.autoExecuteTool(toolCall, context);
    }
  }

  /**
   * Check if tool requires user approval
   */
  shouldRequireApproval(toolName: string): boolean {
    return toolRequiresApproval(toolName);
  }

  /**
   * Create tool call record for approval
   */
  private async createToolCallForApproval(
    toolCall: { name: string; input: Record<string, any>; toolId: string },
    context: ToolCallContext
  ): Promise<ToolExecutionResult> {
    logger.info('Creating tool call for approval', {
      toolName: toolCall.name,
      requestId: context.requestId,
    });

    // Create tool_call record in database
    const record = await agentToolCallRepository.create({
      messageId: context.messageId,
      threadId: context.threadId,
      ownerUserId: context.userId,
      toolName: toolCall.name,
      toolInput: toolCall.input,
      requestId: context.requestId,
    });

    logger.info('Tool call created, awaiting approval', {
      toolCallId: record.id,
      toolName: toolCall.name,
    });

    return {
      needsApproval: true,
      toolCallId: record.id,
    };
  }

  /**
   * Auto-execute tool (no approval needed)
   */
  private async autoExecuteTool(
    toolCall: { name: string; input: Record<string, any>; toolId: string },
    context: ToolCallContext
  ): Promise<ToolExecutionResult> {
    logger.info('Auto-executing tool', {
      toolName: toolCall.name,
      threadId: context.threadId,
    });

    try {
      // Create tool_call record (same pattern as approval flow for consistency)
      const toolCallRecord = await agentToolCallRepository.create({
        messageId: context.messageId,
        threadId: context.threadId,
        ownerUserId: context.userId,
        toolName: toolCall.name,
        toolInput: toolCall.input,
        requestId: context.requestId,
      });

      // Execute tool using dispatcher
      const result = await this.executeTool(
        toolCall.name,
        toolCall.input,
        context.threadId,
        context.userId
      );

      logger.info('Tool executed successfully', {
        toolCallId: toolCallRecord.id,
        toolName: toolCall.name,
      });

      // Update tool_call with result
      await agentToolCallRepository.updateStatus(
        toolCallRecord.id,
        'approved',
        result
      );

      return {
        needsApproval: false,
        toolCallId: toolCallRecord.id,
        result,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      logger.error('Tool execution failed', {
        toolName: toolCall.name,
        error: errorMessage,
      });

      return {
        needsApproval: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Execute tool using ToolCallService dispatcher
   *
   * This is the generic dispatcher that routes to specific tool implementations.
   */
  async executeTool(
    toolName: string,
    toolInput: Record<string, any>,
    threadId: string,
    userId: string
  ): Promise<any> {
    switch (toolName) {
      case 'write_file':
        return await ToolCallService.executeWriteFile(
          toolInput.path,
          toolInput.content,
          threadId,
          userId,
          true
        );

      case 'create_branch':
        return await ToolCallService.executeCreateBranch(
          toolInput.title,
          toolInput.contextFiles || [],
          threadId,
          userId,
          true
        );

      case 'search_files':
        return await ToolCallService.executeSearchFiles(
          toolInput.query,
          userId
        );

      case 'read_file':
        return await ToolCallService.executeReadFile(toolInput.path, userId);

      case 'list_directory':
        return await ToolCallService.executeListDirectory(
          toolInput.path,
          userId
        );

      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  }

  /**
   * Update tool call with message ID
   *
   * Called after message is created to link tool calls to message.
   */
  async linkToolCallsToMessage(
    requestId: string,
    messageId: string
  ): Promise<void> {
    logger.info('Linking tool calls to message', { requestId, messageId });

    await agentToolCallRepository.updateMessageIdForRequest(
      requestId,
      messageId
    );

    logger.info('Tool calls linked', { requestId, messageId });
  }
}

export const toolExecutionHandler = new ToolExecutionHandler();
