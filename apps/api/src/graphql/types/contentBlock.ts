/**
 * ContentBlock GraphQL Types
 * Type-only definitions for message content blocks (not used in queries/mutations yet)
 *
 * These types serve as a single source of truth for TypeScript codegen.
 * The actual database stores content as JSON, but these types provide
 * type safety at the application layer.
 */

import { builder } from '../builder.ts';

// ============================================================================
// Type interfaces (for TypeScript typing)
// ============================================================================

interface TextBlockData {
  type: 'text';
  text: string;
}

interface ToolUseBlockData {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, any>;
  status?: string;
  result?: string;
  error?: string;
}

interface ToolResultBlockData {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

interface ImageSourceData {
  type: 'base64';
  media_type: string;
  data: string;
}

interface ImageBlockData {
  type: 'image';
  source: ImageSourceData;
}

type ContentBlockData = TextBlockData | ToolUseBlockData | ToolResultBlockData | ImageBlockData;

// ============================================================================
// ContentBlock Types (Type-Only Definitions)
// ============================================================================

/**
 * Text content block
 */
const TextBlock = builder.objectRef<TextBlockData>('TextBlock').implement({
  description: 'Plain text content block',
  fields: (t) => ({
    type: t.exposeString('type', {
      description: 'Block type discriminator',
    }),
    text: t.exposeString('text', {
      description: 'Text content',
    }),
  }),
});

/**
 * Tool use content block (AI tool invocation)
 */
const ToolUseBlock = builder.objectRef<ToolUseBlockData>('ToolUseBlock').implement({
  description: 'Tool invocation request block',
  fields: (t) => ({
    type: t.exposeString('type', {
      description: 'Block type discriminator',
    }),
    id: t.exposeID('id', {
      description: 'Unique tool call ID',
    }),
    name: t.exposeString('name', {
      description: 'Tool name',
    }),
    input: t.field({
      type: 'JSON',
      description: 'Tool input parameters',
      resolve: (block) => block.input,
    }),
    status: t.exposeString('status', {
      description: 'Tool execution status',
      nullable: true,
    }),
    result: t.exposeString('result', {
      description: 'Tool execution result',
      nullable: true,
    }),
    error: t.exposeString('error', {
      description: 'Tool execution error message',
      nullable: true,
    }),
  }),
});

/**
 * Tool result content block (tool execution output)
 */
const ToolResultBlock = builder.objectRef<ToolResultBlockData>('ToolResultBlock').implement({
  description: 'Tool execution result block',
  fields: (t) => ({
    type: t.exposeString('type', {
      description: 'Block type discriminator',
    }),
    tool_use_id: t.exposeString('tool_use_id', {
      description: 'ID of the tool use this result corresponds to',
    }),
    content: t.exposeString('content', {
      description: 'Tool result content',
    }),
    is_error: t.exposeBoolean('is_error', {
      description: 'Whether this result represents an error',
      nullable: true,
    }),
  }),
});

/**
 * Image source object
 */
const ImageSource = builder.objectRef<ImageSourceData>('ImageSource').implement({
  description: 'Image source data',
  fields: (t) => ({
    type: t.exposeString('type', {
      description: 'Image encoding type',
    }),
    media_type: t.exposeString('media_type', {
      description: 'MIME type (e.g., image/png)',
    }),
    data: t.exposeString('data', {
      description: 'Base64-encoded image data',
    }),
  }),
});

/**
 * Image content block
 */
const ImageBlock = builder.objectRef<ImageBlockData>('ImageBlock').implement({
  description: 'Image content block',
  fields: (t) => ({
    type: t.exposeString('type', {
      description: 'Block type discriminator',
    }),
    source: t.field({
      type: ImageSource,
      description: 'Image source data',
      resolve: (block) => block.source,
    }),
  }),
});

/**
 * ContentBlock union type
 * Discriminated union of all content block types
 */
export const ContentBlock = builder.unionType('ContentBlock', {
  description: 'Message content block (text, tool use, tool result, or image)',
  types: [TextBlock, ToolUseBlock, ToolResultBlock, ImageBlock],
  resolveType: (value) => {
    // Type discrimination based on the 'type' field
    if ('type' in value && typeof value.type === 'string') {
      switch (value.type) {
        case 'text':
          return TextBlock;
        case 'tool_use':
          return ToolUseBlock;
        case 'tool_result':
          return ToolResultBlock;
        case 'image':
          return ImageBlock;
        default:
          throw new Error(`Unknown ContentBlock type: ${value.type}`);
      }
    }
    throw new Error('ContentBlock must have a type field');
  },
});

// ============================================================================
// Dummy Query (ensures types appear in schema introspection for codegen)
// ============================================================================

builder.queryField('_contentBlockTypes', (t) =>
  t.field({
    type: [ContentBlock],
    description: 'Type-only query to expose ContentBlock types for codegen (not meant to be called)',
    nullable: true,
    resolve: () => null,
  })
);
