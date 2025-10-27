// AI Agent System - Shared Types

export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileTreeNode[];
  provenanceBadge?: {
    sourceBranch: string;
    createdAt: Date;
  };
}

export interface ThreadTreeNode {
  id: string;
  title: string;
  parentId: string | null;
  children?: ThreadTreeNode[];
  metadata: {
    createdAt: Date;
    messageCount: number;
    artifactCount: number;
  };
}

export interface BranchTreeNode extends ThreadTreeNode {}

export interface Message {
  messageId: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
  timestamp: Date;
  tokensUsed: number;
}

export interface StreamingMessage {
  buffer: string;
  toolCalls: ToolCall[];
  isComplete: boolean;
}

export interface ToolCall {
  toolCallId: string;
  toolName: 'create_file' | 'create_folder' | 'edit_file' | 'delete_file' | 'delete_folder' | 'create_branch' | 'delete_branch';
  operationType: 'create' | 'edit' | 'delete';
  resourceType: 'file' | 'folder' | 'branch';
  toolInput: Record<string, unknown>;
  approvalRequired: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  previewContent?: string;
}

export interface ContextReference {
  referenceId: string;
  entityType: 'file' | 'folder' | 'thread';
  entityId: string;
  displayLabel: string;
  source: 'inherited' | 'manual' | 'agent-added' | '@-mentioned';
  addedTimestamp: Date;
  priorityTier: 1 | 2 | 3;
  metadata?: {
    // For files
    filePath?: string;
    fileSize?: number;
    createdAt?: Date;
    // For semantic matches
    relevanceScore?: number;
    sourceBranch?: string;
    relationshipType?: 'sibling' | 'parent' | 'child';
    // For threads
    messageCount?: number;
  };
}

export interface AutocompleteOption {
  id: string;
  type: 'file' | 'thread';
  label: string;
  branchIndicator?: string;
}

export interface ProvenanceMetadata {
  sourceBranch: {
    id: string;
    title: string;
  };
  createdAt: Date;
  contextSummary: string;
  lastEditedBy?: 'user' | 'agent';
  editedInConversation?: {
    id: string;
    title: string;
  };
}
