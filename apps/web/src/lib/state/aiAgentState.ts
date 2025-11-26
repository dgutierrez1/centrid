import { proxy } from "valtio";
import type { ContentBlock } from "@/types/graphql";

/**
 * UI-enhanced Thread type with computed fields for state management.
 *
 * Extends GraphQL Thread type with client-side computed properties:
 * - depth: Computed from thread hierarchy (how deep in branch tree)
 * - artifactCount: Computed from associated files/folders
 * - summary: Aggregated from thread messages/context
 * - lastActivity: Computed from latest message timestamp
 *
 * @see apps/web/src/types/graphql.ts for base GraphQL Thread type
 */
export interface UIThread {
  id: string;
  title: string; // Renamed from 'branchTitle' for UI clarity
  summary?: string; // Computed field (not in database)
  parentThreadId: string | null;
  depth: number; // Computed from hierarchy (not in database)
  artifactCount: number; // Computed from files (not in database)
  lastActivity: string; // Computed from messages (not in database)
  createdAt: string;
  updatedAt: string;
}

/**
 * UI-enhanced Message type with client-side state fields.
 *
 * Extends GraphQL Message type with ephemeral UI state:
 * - events: Aggregated from agent_execution_events (computed)
 * - isStreaming: Client-side loading state for real-time updates
 * - isRequestLoading: Client-side state for pending requests
 * - idempotencyKey: Client-side request deduplication
 *
 * @see apps/web/src/types/graphql.ts for base GraphQL Message type
 */
export interface UIMessage {
  id: string;
  threadId: string; // Thread this message belongs to (from GraphQL Message type)
  role: "user" | "assistant";
  content?: ContentBlock[]; // ContentBlock[] from GraphQL JSON scalar
  events?: any[]; // Aggregated from agent_execution_events (not in Message table)
  toolCalls?: any[];
  timestamp: string;
  isStreaming?: boolean; // Client-side state (not in database)
  isRequestLoading?: boolean; // Client-side state (not in database)
  tokensUsed?: number;
  idempotencyKey?: string; // Client-side request ID for deduplication (not in database)
}

/**
 * UI-enhanced ContextReference type.
 *
 * May include computed fields for display purposes.
 * @see apps/web/src/types/graphql.ts for base GraphQL ContextReference type
 */
export interface UIContextReference {
  id: string;
  entityType: "file" | "folder" | "thread";
  entityReference: string;
  source: "inherited" | "manual" | "@-mentioned" | "agent-added";
  priorityTier: 1 | 2 | 3;
  addedTimestamp: string;
  // Optional metadata for display
  name?: string;
  sourceBranch?: string;
  relevanceScore?: number;
  relationship?: "sibling" | "parent" | "child";
}

export interface BranchTreeState {
  threads: UIThread[];
  parentChildMap: Map<string, string[]>;
}

export interface Provenance {
  createdAt: string; // ISO 8601 string from GraphQL
  createdBy: "agent" | "user";
  sourceBranch: string;
  sourceThreadId: string;
  sourceMessageId: string;
  lastEditedAt?: string; // ISO 8601 string from GraphQL
  lastEditedBy?: "agent" | "user";
  lastEditSourceThreadId?: string;
}

export interface AIAgentState {
  // Current thread data
  currentThread: UIThread | null;
  messages: UIMessage[];
  contextReferences: UIContextReference[];

  // Branch tree navigation
  branchTree: BranchTreeState;

  // Streaming state
  sseConnection: EventSource | null;
  isStreaming: boolean;
  hasStreamStarted: boolean;
  currentRequestId: string | null; // Track active agent request for approval handlers

  // Loading states
  isLoadingThread: boolean;
  isCreatingBranch: boolean;
  isConsolidating: boolean;

  // UI state
  sidebarCollapsed: boolean;
  isConsolidateModalOpen: boolean;
  consolidationProgress: {
    step: string;
    current: number;
    total: number;
  } | null;
  consolidatedContent: string | null;
  consolidationError: string | null;
}

/**
 * Global AI Agent State (Valtio)
 */
export const aiAgentState = proxy<AIAgentState>({
  currentThread: null,
  messages: [],
  contextReferences: [],

  branchTree: {
    threads: [],
    parentChildMap: new Map(),
  },

  sseConnection: null,
  isStreaming: false,
  hasStreamStarted: false,
  currentRequestId: null,

  isLoadingThread: false,
  isCreatingBranch: false,
  isConsolidating: false,

  sidebarCollapsed: false,
  isConsolidateModalOpen: false,
  consolidationProgress: null,
  consolidatedContent: null,
  consolidationError: null,
});

/**
 * State Actions
 */
export const aiAgentActions = {
  // Thread actions
  setCurrentThread(thread: UIThread | null) {
    aiAgentState.currentThread = thread;
  },

  setMessages(messages: UIMessage[]) {
    aiAgentState.messages = messages;
  },

  // Batch update for thread data to prevent multiple rerenders
  setThreadData(
    thread: UIThread | null,
    messages: UIMessage[],
    contextRefs: UIContextReference[]
  ) {
    aiAgentState.currentThread = thread;
    aiAgentState.messages = messages;
    aiAgentState.contextReferences = contextRefs;
  },

  addMessage(message: UIMessage) {
    aiAgentState.messages.push(message);
  },

  updateMessage(messageId: string, updates: Partial<UIMessage>) {
    const index = aiAgentState.messages.findIndex((m) => m.id === messageId);
    if (index >= 0) {
      aiAgentState.messages[index] = {
        ...aiAgentState.messages[index],
        ...updates,
      };
    }
  },

  setContextReferences(refs: UIContextReference[]) {
    aiAgentState.contextReferences = refs;
  },

  // Branch tree actions
  setBranchTree(threads: UIThread[]) {
    aiAgentState.branchTree.threads = threads;

    // Build parent-child map
    const map = new Map<string, string[]>();
    for (const thread of threads) {
      if (thread.parentThreadId) {
        const children = map.get(thread.parentThreadId) || [];
        children.push(thread.id);
        map.set(thread.parentThreadId, children);
      }
    }
    aiAgentState.branchTree.parentChildMap = map;
  },

  addThreadToBranchTree(thread: UIThread) {
    aiAgentState.branchTree.threads.push(thread);

    // Update parent-child map
    if (thread.parentThreadId) {
      const children =
        aiAgentState.branchTree.parentChildMap.get(thread.parentThreadId) || [];
      children.push(thread.id);
      aiAgentState.branchTree.parentChildMap.set(thread.parentThreadId, children);
    }
  },

  removeThreadFromBranchTree(threadId: string) {
    const threadIndex = aiAgentState.branchTree.threads.findIndex(
      (t) => t.id === threadId
    );
    if (threadIndex >= 0) {
      const thread = aiAgentState.branchTree.threads[threadIndex];
      aiAgentState.branchTree.threads.splice(threadIndex, 1);

      // Update parent-child map
      if (thread.parentThreadId) {
        const children =
          aiAgentState.branchTree.parentChildMap.get(thread.parentThreadId) || [];
        const childIndex = children.indexOf(threadId);
        if (childIndex >= 0) {
          children.splice(childIndex, 1);
        }
      }
    }
  },

  // Streaming actions
  setSSEConnection(connection: EventSource | null) {
    aiAgentState.sseConnection = connection;
  },

  setIsStreaming(streaming: boolean) {
    aiAgentState.isStreaming = streaming;
  },

  setHasStreamStarted(started: boolean) {
    aiAgentState.hasStreamStarted = started;
  },

  // Loading states
  setIsLoadingThread(loading: boolean) {
    aiAgentState.isLoadingThread = loading;
  },

  setIsCreatingBranch(creating: boolean) {
    aiAgentState.isCreatingBranch = creating;
  },

  setIsConsolidating(consolidating: boolean) {
    aiAgentState.isConsolidating = consolidating;
  },

  // UI actions
  toggleSidebar() {
    aiAgentState.sidebarCollapsed = !aiAgentState.sidebarCollapsed;
  },

  // Consolidation actions
  setConsolidateModalOpen(open: boolean) {
    aiAgentState.isConsolidateModalOpen = open;
    if (!open) {
      aiAgentState.consolidationProgress = null;
      aiAgentState.consolidatedContent = null;
      aiAgentState.consolidationError = null;
    }
  },

  setConsolidationProgress(
    progress: { step: string; current: number; total: number } | null
  ) {
    aiAgentState.consolidationProgress = progress;
  },

  setConsolidatedContent(content: string | null) {
    aiAgentState.consolidatedContent = content;
  },

  setConsolidationError(error: string | null) {
    aiAgentState.consolidationError = error;
  },
};
