import type {
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ToolResultBlock,
  ImageBlock,
} from "@/types/graphql";

/**
 * Type guards for ContentBlock union narrowing.
 *
 * GraphQL codegen types the discriminator as `type: string` instead of literal types,
 * so TypeScript can't automatically narrow the union. These guards enable proper narrowing.
 */

export function isTextBlock(block: ContentBlock): block is TextBlock {
  return block.type === "text";
}

export function isToolUseBlock(block: ContentBlock): block is ToolUseBlock {
  return block.type === "tool_use";
}

export function isToolResultBlock(
  block: ContentBlock
): block is ToolResultBlock {
  return block.type === "tool_result";
}

export function isImageBlock(block: ContentBlock): block is ImageBlock {
  return block.type === "image";
}
