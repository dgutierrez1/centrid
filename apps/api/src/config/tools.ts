/**
 * Tool Registry and Configuration
 * Type-safe tool definitions with discriminated unions
 * 100% aligned with Anthropic Claude API specification
 */

// ============================================================================
// Type Definitions
// ============================================================================

interface ToolInputSchema {
  type: string;
  properties: Record<string, any>;
  required: string[];
}

/**
 * Custom tools (client-defined, executed by our code)
 * Format per Claude API: { name, description, input_schema }
 */
interface CustomToolConfig {
  toolType: 'custom';
  name: string;
  description: string;
  requiresApproval: boolean;
  input_schema: ToolInputSchema;
}

/**
 * Native tools (server-side, executed by Anthropic)
 * Format per Claude API: { type, name, max_uses? }
 */
interface NativeToolConfig {
  toolType: 'native';
  name: string; // Internal reference name
  type: string; // Claude tool type (e.g., 'web_search_20250305')
  requiresApproval: boolean;
  max_uses?: number;
}

/**
 * Discriminated union - ensures type safety
 */
type ToolConfig = CustomToolConfig | NativeToolConfig;

// ============================================================================
// Type Guards
// ============================================================================

function isNativeToolConfig(config: ToolConfig): config is NativeToolConfig {
  return config.toolType === 'native';
}

function isCustomToolConfig(config: ToolConfig): config is CustomToolConfig {
  return config.toolType === 'custom';
}

// ============================================================================
// Tool Registry
// ============================================================================

export const TOOL_REGISTRY: Record<string, ToolConfig> = {
  // Custom Tools (executed by our code)
  write_file: {
    toolType: 'custom',
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
    toolType: 'custom',
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
    toolType: 'custom',
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
    toolType: 'custom',
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
    toolType: 'custom',
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

  // Native Tools (executed by Anthropic server-side)
  web_search: {
    toolType: 'native',
    name: 'web_search',
    type: 'web_search_20250305',
    requiresApproval: false,
    max_uses: 5,
  },
};

// ============================================================================
// Formatting Functions
// ============================================================================

/**
 * Format native tool for Claude API
 * Per Anthropic spec: { type, name, max_uses? }
 */
function formatNativeTool(config: NativeToolConfig) {
  return {
    type: config.type,
    name: config.name,
    ...(config.max_uses && { max_uses: config.max_uses }),
  };
}

/**
 * Format custom tool for Claude API
 * Per Anthropic spec: { name, description, input_schema }
 */
function formatCustomTool(config: CustomToolConfig) {
  return {
    name: config.name,
    description: config.description,
    input_schema: config.input_schema,
  };
}

/**
 * Get all available tools formatted for Claude API
 * Returns properly formatted tools without approval metadata
 */
export function getAvailableTools() {
  return Object.values(TOOL_REGISTRY).map((config) => {
    if (isNativeToolConfig(config)) {
      return formatNativeTool(config);
    }
    return formatCustomTool(config);
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a tool requires user approval before execution
 */
export function toolRequiresApproval(toolName: string): boolean {
  const config = TOOL_REGISTRY[toolName];
  if (!config) {
    console.warn(`[Tools] Unknown tool requested: ${toolName}`);
    return false;
  }
  return config.requiresApproval;
}

/**
 * Get tool config by name
 */
export function getToolConfig(toolName: string): ToolConfig | null {
  return TOOL_REGISTRY[toolName] || null;
}
