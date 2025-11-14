/**
 * Agent System Type Definitions (Frontend)
 *
 * ⚠️ INTENTIONALLY DUPLICATED TYPES ⚠️
 *
 * These types (TextBlock, ToolUseBlock, ToolResultBlock, ImageBlock, ContentBlock, PendingToolCall)
 * are duplicated across THREE locations and must be manually synchronized:
 *
 * 1. apps/api/src/types/agent.ts (backend)
 * 2. apps/web/src/types/agent.ts (THIS FILE - frontend)
 * 3. packages/ui/src/types/agent.ts (shared UI)
 *
 * Why duplicated?
 * - These types span runtime boundaries (Deno backend / Node build / Browser)
 * - MVP pragmatism: Duplication is simpler than shared package setup
 * - GraphQL exposes content as JSON scalar (untyped), so we type-assert to these types
 *
 * When updating these types:
 * 1. Make the change in ALL THREE files
 * 2. Verify no drift with diff/grep
 * 3. Run `npm run validate` to catch type mismatches
 *
 * TODO (Post-MVP): Consider GraphQL union types or shared types package
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
