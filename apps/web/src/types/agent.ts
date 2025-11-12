/**
 * Agent System Type Definitions (Frontend)
 *
 * Local TypeScript types for frontend components.
 * Duplicated from backend (apps/api/src/types/agent.ts) since we don't use shared packages.
 * GraphQL exposes content as JSON scalar (untyped), so we type-assert to these types.
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
 * Used in message.content field (received as JSON from GraphQL)
 */
export type ContentBlock = TextBlock | ToolUseBlock | ToolResultBlock | ImageBlock;

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
