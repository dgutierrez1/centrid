import { proxy } from "valtio";
import type { ContentBlock } from "@/types/agent";

export interface Thread {
  id: string;
  title: string;
  summary?: string;
  parentThreadId: string | null;
  depth: number;
  artifactCount: number;
  lastActivity: Date;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content?: ContentBlock[]; // ContentBlock[] from GraphQL JSON scalar
  events?: any[];
  toolCalls?: any[];
  timestamp: Date;
  isStreaming?: boolean;
  isRequestLoading?: boolean;
  tokensUsed?: number;
  idempotencyKey?: string; // Client-side request ID for deduplication
}

export interface ContextReference {
  id: string;
  entityType: "file" | "folder" | "thread";
  entityReference: string;
  source: "inherited" | "manual" | "@-mentioned" | "agent-added";
  priorityTier: 1 | 2 | 3;
  addedTimestamp: Date;
  // Optional metadata for display
  name?: string;
  sourceBranch?: string;
  relevanceScore?: number;
  relationship?: "sibling" | "parent" | "child";
}

export interface BranchTreeState {
  threads: Thread[];
  parentChildMap: Map<string, string[]>;
}

export interface Provenance {
  createdAt: Date;
  createdBy: "agent" | "user";
  sourceBranch: string;
  sourceThreadId: string;
  sourceMessageId: string;
  lastEditedAt?: Date;
  lastEditedBy?: "agent" | "user";
  lastEditSourceThreadId?: string;
}

export interface AIAgentState {
  // Current thread data
  currentThread: Thread | null;
  messages: Message[];
  contextReferences: ContextReference[];

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
  setCurrentThread(thread: Thread | null) {
    aiAgentState.currentThread = thread;
  },

  setMessages(messages: Message[]) {
    aiAgentState.messages = messages;
  },

  // Batch update for thread data to prevent multiple rerenders
  setThreadData(
    thread: Thread | null,
    messages: Message[],
    contextRefs: ContextReference[]
  ) {
    aiAgentState.currentThread = thread;
    aiAgentState.messages = messages;
    aiAgentState.contextReferences = contextRefs;
  },

  addMessage(message: Message) {
    aiAgentState.messages.push(message);
  },

  setContextReferences(refs: ContextReference[]) {
    aiAgentState.contextReferences = refs;
  },

  // Branch tree actions
  setBranchTree(threads: Thread[]) {
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

  addThreadToBranchTree(thread: Thread) {
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
