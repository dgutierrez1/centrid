import React, { useMemo } from 'react';
import { useSnapshot } from 'valtio';
import { ThreadView } from '@centrid/ui/features/ai-agent-system';
import type { Branch } from '@centrid/ui/features/ai-agent-system/BranchSelector';
import type { MessageProps } from '@centrid/ui/features/ai-agent-system/Message';
import type { ContextGroup } from '@centrid/ui/features/ai-agent-system/ContextPanel';
import { aiAgentState } from '@/lib/state/aiAgentState';

interface ThreadViewContainerProps {
  threadId: string | undefined;
  messageText: string;
  isStreaming: boolean;
  isLoading: boolean;
  isContextExpanded: boolean;
  pendingToolCall: {
    toolCallId: string;
    toolName: string;
    toolInput: any;
    messageId?: string;
  } | null;
  onSelectBranch: (branchId: string) => void;
  onToggleContextPanel: () => void;
  onMessageChange: (text: string) => void;
  onSendMessage: (text: string) => void;
  onStopStreaming?: () => void;
  onBranchThread?: () => void;
  onAddReference?: () => void;
  onRemove?: (item: any) => void;
  handleApproveToolCall: (toolCallId: string) => void;
  handleRejectToolCall: (toolCallId: string, reason?: string) => void;
}

/**
 * State-aware wrapper for ThreadView that reads thread data directly from aiAgentState.
 *
 * This container:
 * 1. Finds the current thread from branchTree.threads by ID (instant - no delay)
 * 2. Transforms data for ThreadView props (Branch types with Date conversion)
 * 3. Passes minimal props to pure ThreadView component
 *
 * Benefits:
 * - Thread header renders instantly from existing branchTree state
 * - No prop drilling through multiple layers
 * - ThreadView stays pure and reusable
 */
export function ThreadViewContainer({
  threadId,
  messageText,
  isStreaming,
  isLoading,
  isContextExpanded,
  pendingToolCall,
  onSelectBranch,
  onToggleContextPanel,
  onMessageChange,
  onSendMessage,
  onStopStreaming,
  onBranchThread,
  onAddReference,
  onRemove,
  handleApproveToolCall,
  handleRejectToolCall,
}: ThreadViewContainerProps) {
  const snap = useSnapshot(aiAgentState);

  // Read current thread from state (set by useLoadThread from urql cache)
  const currentBranch: Branch | null = useMemo(() => {
    if (!threadId || threadId === 'new') return null;

    // Single source of truth: snap.currentThread (synced from urql by useLoadThread)
    // If urql cache has data, this is populated instantly
    // If cache is cold, useLoadThread sets this after fetch completes
    if (snap.currentThread && snap.currentThread.id === threadId) {
      return {
        id: snap.currentThread.id,
        title: snap.currentThread.title,
        summary: snap.currentThread.summary,
        parentThreadId: snap.currentThread.parentThreadId,
        depth: snap.currentThread.depth,
        artifactCount: snap.currentThread.artifactCount,
        lastActivity: new Date(snap.currentThread.lastActivity),
        createdAt: new Date(snap.currentThread.createdAt),
        updatedAt: new Date(snap.currentThread.updatedAt),
      };
    }

    // Loading state - thread data not yet synced from urql
    return null;
  }, [snap.currentThread, threadId]);

  // Transform all threads to branches with isActive flag
  const branches = useMemo(() => {
    return snap.branchTree.threads.map(thread => ({
      id: thread.id,
      title: thread.title,
      summary: thread.summary,
      parentThreadId: thread.parentThreadId,
      depth: thread.depth,
      artifactCount: thread.artifactCount,
      lastActivity: new Date(thread.lastActivity), // Convert ISO string to Date
      createdAt: new Date(thread.createdAt),
      updatedAt: new Date(thread.updatedAt),
      isActive: thread.id === threadId,
    }));
  }, [snap.branchTree.threads, threadId]);

  // Transform messages to attach pending tool call to last assistant message
  const messages: MessageProps[] = useMemo(() => {
    return snap.messages.map((m, idx) => {
      const isLastAssistantMessage = m.role === 'assistant' && idx === snap.messages.length - 1;
      if (isLastAssistantMessage && pendingToolCall) {
        return {
          ...m,
          pendingToolCall,
          onApproveToolCall: () => handleApproveToolCall(pendingToolCall.toolCallId),
          onRejectToolCall: (reason?: string) => handleRejectToolCall(pendingToolCall.toolCallId, reason),
        } as MessageProps;
      }
      return m as MessageProps;
    });
  }, [snap.messages, pendingToolCall, handleApproveToolCall, handleRejectToolCall]);

  // Transform context references to context groups format expected by ThreadView
  const contextGroups: ContextGroup[] = useMemo(() => [
    {
      id: 'explicit',
      type: 'explicit' as const,
      title: 'Explicit Context',
      items: snap.contextReferences
        .filter(ref => ref.priorityTier === 1)
        .map(ref => ({
          id: ref.id,
          referenceType: ref.entityType as 'file' | 'folder' | 'thread',
          name: ref.entityReference,
          priorityTier: ref.priorityTier,
          relevance: 1.0,
          source: ref.source,
        })),
    },
    {
      id: 'semantic',
      type: 'semantic' as const,
      title: 'Semantic Matches',
      items: snap.contextReferences
        .filter(ref => ref.priorityTier === 2)
        .map(ref => ({
          id: ref.id,
          referenceType: ref.entityType as 'file' | 'folder' | 'thread',
          name: ref.entityReference,
          priorityTier: ref.priorityTier,
          relevance: 0.85,
          source: ref.source,
        })),
    },
  ], [snap.contextReferences]);

  return (
    <ThreadView
      currentBranch={currentBranch}
      branches={branches}
      messages={messages}
      contextGroups={contextGroups}
      messageText={messageText}
      isStreaming={isStreaming}
      isLoading={isLoading}
      showBranchSelector={false} // Desktop view - sidebar shows branch selector
      isContextExpanded={isContextExpanded}
      onSelectBranch={onSelectBranch}
      onToggleContextPanel={onToggleContextPanel}
      onMessageChange={onMessageChange}
      onSendMessage={onSendMessage}
      onStopStreaming={onStopStreaming}
      onBranchThread={onBranchThread}
      onAddReference={onAddReference}
      onRemoveReference={onRemove}
    />
  );
}
