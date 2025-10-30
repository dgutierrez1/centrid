/**
 * Tool Registry and Configuration
 * Defines all available tools, their schemas, and approval requirements
 */

interface ToolInputSchema {
  type: string;
  properties: Record<string, any>;
  required: string[];
}

interface ToolConfig {
  name: string;
  description: string;
  requiresApproval: boolean;
  input_schema: ToolInputSchema;
}

export const TOOL_REGISTRY: Record<string, ToolConfig> = {
  write_file: {
    name: 'write_file',
    description: 'Write content to a file',
    requiresApproval: true,
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path' },
        content: { type: 'string', description: 'File content' },
      },
      required: ['path', 'content'],
    },
  },
  create_branch: {
    name: 'create_branch',
    description: 'Create a new conversation branch',
    requiresApproval: true,
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Branch title' },
        contextFiles: {
          type: 'array',
          items: { type: 'string' },
          description: 'Files to include',
        },
      },
      required: ['title'],
    },
  },
  search_files: {
    name: 'search_files',
    description: 'Search for files',
    requiresApproval: false,
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
      },
      required: ['query'],
    },
  },
  read_file: {
    name: 'read_file',
    description: 'Read file contents',
    requiresApproval: false,
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path' },
      },
      required: ['path'],
    },
  },
  list_directory: {
    name: 'list_directory',
    description: 'List files and folders in a directory',
    requiresApproval: false,
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Directory path' },
      },
      required: ['path'],
    },
  },
};

/**
 * Get all available tools for Claude
 * Returns tools in Claude API format (without approval metadata)
 */
export function getAvailableTools() {
  return Object.values(TOOL_REGISTRY).map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.input_schema,
  }));
}

/**
 * Check if a tool requires user approval before execution
 */
export function toolRequiresApproval(toolName: string): boolean {
  return TOOL_REGISTRY[toolName]?.requiresApproval ?? false;
}

/**
 * Get tool config by name
 */
export function getToolConfig(toolName: string): ToolConfig | null {
  return TOOL_REGISTRY[toolName] || null;
}
