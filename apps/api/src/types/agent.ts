/**
 * Agent System Type Definitions
 *
 * Local TypeScript types for backend services.
 * Not exported to GraphQL - content is exposed as JSON scalar.
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
 * Used in message.content field (stored as JSONB array)
 */
export type ContentBlock = TextBlock | ToolUseBlock | ToolResultBlock | ImageBlock;
