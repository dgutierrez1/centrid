/**
 * Claude Conversation Builder
 * Builds Claude API-compliant conversation history from database messages
 *
 * Architecture:
 * - Splits assistant messages at tool_use boundaries
 * - Inserts tool_result blocks immediately after tool_use blocks
 * - Handles approved (success) and rejected (error) tool states
 * - Skips pending and native tools per Claude API spec
 */

import { createLogger } from '../utils/logger.ts';
import { TOOL_REGISTRY } from '../config/tools.ts';
import type { ContentBlock } from '../types/graphql.ts';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a tool is a native Anthropic tool (handled server-side by Anthropic)
 * Native tools have a 'type' field in their configuration (e.g., web_search_20250305)
 */
function isNativeTool(toolName: string): boolean {
  const toolConfig = TOOL_REGISTRY[toolName];
  return !!toolConfig?.type;
}

/**
 * Sanitize content for Claude API
 * Strips internal fields from tool_use blocks, passes text blocks unchanged
 */
function sanitizeContentForClaude(content: ContentBlock[] | string): ContentBlock[] | string {
  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content.map(block => {
      if (block.type === 'tool_use') {
        // Return ONLY Claude-compatible fields
        return {
          type: 'tool_use',
          id: block.id,
          name: block.name,
          input: block.input,
        };
      }
      return block; // text blocks pass through unchanged
    });
  }

  return content;
}

// ============================================================================
// Type Definitions
// ============================================================================

interface ContentSegment {
  type: 'text' | 'tool';
  blocks: any[];
  toolId?: string;
}

interface ToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

// ============================================================================
// Claude Conversation Builder
// ============================================================================

/**
 * Builder for constructing Claude API-compliant conversations
 *
 * Usage:
 *   const builder = new ClaudeConversationBuilder(toolCalls);
 *   for (const msg of dbMessages) {
 *     msg.role === 'user'
 *       ? builder.addUserMessage(msg.content)
 *       : builder.addAssistantMessage(msg);
 *   }
 *   const apiMessages = builder.build();
 */
export class ClaudeConversationBuilder {
  private messages: any[] = [];
  private logger: any;

  constructor(
    private toolCalls: any[],
    loggerName = 'ConversationBuilder'
  ) {
    this.logger = createLogger(loggerName);
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Add a user message to the conversation
   * User messages pass through directly without modification
   */
  addUserMessage(content: any): this {
    this.messages.push({
      role: 'user',
      content,
    });
    return this;
  }

  /**
   * Add an assistant message, splitting at tool_use boundaries
   *
   * Per Claude API spec:
   * - tool_result must IMMEDIATELY follow tool_use
   * - No content can appear between tool_use and tool_result
   *
   * Example:
   *   Input:  [text1, tool_use, text2]
   *   Output: Assistant: [text1, tool_use]
   *           User:      [tool_result]
   *           Assistant: [text2]
   */
  addAssistantMessage(dbMessage: any): this {
    const content = Array.isArray(dbMessage.content)
      ? dbMessage.content
      : [dbMessage.content];

    this.logger.info('🔍 Processing assistant message', {
      messageId: dbMessage.id,
      contentBlocks: content.length,
    });

    // Split content into segments at tool_use boundaries
    const segments = this.splitContent(content);

    this.logger.info('📊 Split into segments', {
      messageId: dbMessage.id,
      segmentCount: segments.length,
      segmentTypes: segments.map(s => s.type),
    });

    // Process each segment
    for (const segment of segments) {
      this.processSegment(segment, dbMessage.id);
    }

    return this;
  }

  /**
   * Build and return the final conversation array
   * Returns messages in Claude API format
   */
  build(): any[] {
    return this.messages;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Split content into segments at tool_use boundaries
   *
   * Algorithm:
   * - Accumulate text blocks
   * - When tool_use found: flush text, add tool, reset accumulator
   * - After loop: flush remaining text
   *
   * Example:
   *   Input:  [text1, text2, tool1, text3, tool2, text4]
   *   Output: [
   *     { type: 'text', blocks: [text1, text2] },
   *     { type: 'tool', blocks: [tool1], toolId: 'id1' },
   *     { type: 'text', blocks: [text3] },
   *     { type: 'tool', blocks: [tool2], toolId: 'id2' },
   *     { type: 'text', blocks: [text4] }
   *   ]
   */
  private splitContent(content: any[]): ContentSegment[] {
    const segments: ContentSegment[] = [];
    let currentTextBlocks: any[] = [];

    for (const block of content) {
      if (block.type === 'tool_use') {
        // Push accumulated text blocks (if any)
        if (currentTextBlocks.length > 0) {
          segments.push({
            type: 'text',
            blocks: currentTextBlocks,
          });
          currentTextBlocks = [];
        }

        // Push tool block
        segments.push({
          type: 'tool',
          blocks: [block],
          toolId: block.id,
        });
      } else {
        // Accumulate text blocks
        currentTextBlocks.push(block);
      }
    }

    // Push remaining text blocks
    if (currentTextBlocks.length > 0) {
      segments.push({
        type: 'text',
        blocks: currentTextBlocks,
      });
    }

    return segments;
  }

  /**
   * Process a single segment (delegate to text or tool handler)
   */
  private processSegment(segment: ContentSegment, messageId: string): void {
    if (segment.type === 'text') {
      this.addTextSegment(segment);
    } else {
      this.addToolSegment(segment, messageId);
    }
  }

  /**
   * Add a text segment as an assistant message
   */
  private addTextSegment(segment: ContentSegment): void {
    this.logger.info('📤 Pushing text segment', {
      blockCount: segment.blocks.length,
    });

    this.messages.push({
      role: 'assistant',
      content: sanitizeContentForClaude(segment.blocks),
    });
  }

  /**
   * Add a tool segment (tool_use + optional tool_result)
   *
   * Steps:
   * 1. Find corresponding tool_call record from database (validate first)
   * 2. If not found: Skip segment to prevent orphaned tool_use block
   * 3. Push assistant message with tool_use block
   * 4. If approved/rejected: Push user message with tool_result
   * 5. If pending/native: Skip tool_result (execution not complete or handled by Anthropic)
   */
  private addToolSegment(segment: ContentSegment, messageId: string): void {
    this.logger.info('🔧 Processing tool segment', {
      messageId,
      toolId: segment.toolId,
    });

    // 1. Find corresponding tool_call record FIRST (validate before modifying state)
    const toolCall = this.toolCalls.find(tc => tc.id === segment.toolId);

    if (!toolCall) {
      this.logger.warn('⚠️ No tool_call record found, skipping segment', {
        toolUseId: segment.toolId,
        messageId,
      });
      return;
    }

    // 2. Push assistant message with tool_use (safe now that we have tool_call)
    this.logger.info('🔧 Pushing tool_use block', {
      messageId,
      toolId: segment.toolId,
    });
    this.messages.push({
      role: 'assistant',
      content: sanitizeContentForClaude(segment.blocks),
    });

    this.logger.info('🔍 Found tool_call record', {
      toolId: toolCall.id,
      approvalStatus: toolCall.approvalStatus,
      hasOutput: toolCall.toolOutput !== null,
      isNative: isNativeTool(toolCall.toolName),
    });

    // 4. Add tool_result if ready
    if (this.shouldAddToolResult(toolCall)) {
      const isRejected = toolCall.approvalStatus === 'rejected';

      this.logger.info('✅ Adding tool_result', {
        toolId: toolCall.id,
        approvalStatus: toolCall.approvalStatus,
        isError: isRejected,
      });

      this.messages.push({
        role: 'user',
        content: [this.createToolResultBlock(toolCall)],
      });
    } else {
      this.logger.info('⏸️ Skipping tool_result', {
        toolId: toolCall.id,
        reason: toolCall.approvalStatus === 'pending' ? 'pending' : 'native',
      });
    }
  }

  /**
   * Check if tool_result should be added for this tool call
   *
   * Add tool_result when:
   * - Tool is approved (success) OR rejected (error)
   * - Tool has output (execution complete) OR rejection reason (for rejected tools)
   * - Tool is NOT native (Anthropic-handled tools don't need results)
   *
   * Skip tool_result when:
   * - Tool is pending (waiting for user decision)
   * - Tool is native (web_search, etc. - Anthropic handles these)
   */
  private shouldAddToolResult(toolCall: any): boolean {
    // For approved tools: check toolOutput
    // For rejected tools: check rejectionReason
    const hasResult = toolCall.approvalStatus === 'approved'
      ? toolCall.toolOutput !== null
      : toolCall.rejectionReason !== null || toolCall.rejectionReason !== undefined;

    return (
      (toolCall.approvalStatus === 'approved' || toolCall.approvalStatus === 'rejected') &&
      hasResult &&
      !isNativeTool(toolCall.toolName)
    );
  }

  /**
   * Create tool_result content block from tool_call record
   *
   * For approved tools:
   * - content: tool output (success message or data)
   * - is_error: undefined (omitted for success)
   *
   * For rejected tools:
   * - content: rejection reason from user
   * - is_error: true (tells Claude execution failed)
   */
  private createToolResultBlock(toolCall: any): ToolResultBlock {
    const isRejected = toolCall.approvalStatus === 'rejected';

    return {
      type: 'tool_result',
      tool_use_id: toolCall.id,
      content: isRejected
        ? `User declined to execute this tool. Reason: ${toolCall.rejectionReason || 'No reason provided'}`
        : typeof toolCall.toolOutput === 'string'
          ? toolCall.toolOutput
          : JSON.stringify(toolCall.toolOutput),
      is_error: isRejected ? true : undefined,
    };
  }
}
