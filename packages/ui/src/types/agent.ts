/**
 * Agent System Type Definitions (UI Package)
 *
 * Local TypeScript types for UI components.
 * Duplicated across packages since we don't use shared packages.
 * These types are used by pure UI components for rendering.
 */

/**
 * Text content block
 */
export interface TextBlock {
  type: 'text';
  text: string;
}

/**
 * Tool use content block (AI tool invocation)
 */
export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, any>;
}

/**
 * Tool result content block (tool execution output)
 */
export interface ToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

/**
 * Image content block
 */
export interface ImageBlock {
  type: 'image';
  source: {
    type: 'base64';
    media_type: string;
    data: string;
  };
}

/**
 * Content block discriminated union
 */
export type ContentBlock = TextBlock | ToolUseBlock | ToolResultBlock | ImageBlock;

/**
 * Legacy name for ContentBlock (for backward compatibility)
 * @deprecated Use ContentBlock instead
 */
export type ContentBlockDTO = ContentBlock;

/**
 * Pending tool call (derived from ContentBlock)
 * Used by UI components for approval workflow
 */
export interface PendingToolCall {
  toolCallId: string;
  toolName: string;
  toolInput: any;
  messageId: string;
}
