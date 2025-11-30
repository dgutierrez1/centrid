import React, { useMemo, useState } from 'react';
import { ConsolidateModal, type Branch } from '@centrid/ui/features/ai-agent-system';
import { useConsolidateBranches } from '@/lib/hooks/useConsolidateBranches';
import { useSnapshot } from 'valtio';
import { aiAgentState } from '@/lib/state/aiAgentState';

interface ConsolidateModalContainerProps {
  isOpen: boolean;
  onClose: () => void;
  currentThreadId: string;
}

/**
 * ConsolidateModalContainer - Smart container for ConsolidateModal
 *
 * Features:
 * - Filters child branches from global state
 * - Manages consolidation workflow via GraphQL + realtime
 * - Handles real-time progress updates via Supabase subscriptions
 * - Integrates with Valtio state management
 *
 * UX Spec: ux.md lines 936-965
 * Implementation: GraphQL mutation + realtime subscription pattern
 */
export function ConsolidateModalContainer({
  isOpen,
  onClose,
  currentThreadId,
}: ConsolidateModalContainerProps) {
  const snap = useSnapshot(aiAgentState);
  const {
    consolidate,
    isProcessing,
    progress,
    result,
    error,
  } = useConsolidateBranches();

  // Get child branches from state
  const childBranches = useMemo(() => {
    // Find all threads that have currentThreadId as parent
    return snap.branchTree.threads.filter(thread => thread.parentThreadId === currentThreadId);
  }, [snap.branchTree.threads, currentThreadId]);

  // Convert child branches to Branch format for ConsolidateModal
  const childBranchesForModal = useMemo(() => {
    return childBranches.map(thread => ({
      id: thread.id,
      title: thread.title || 'Untitled',
      parentThreadId: thread.parentThreadId || null,
      depth: thread.depth,
      artifactCount: thread.artifactCount,
      lastActivity: thread.lastActivity,
      summary: thread.summary || undefined,
    })) satisfies Branch[];
  }, [childBranches]);

  // Current branch for modal context
  const currentBranch = useMemo(() => {
    const thread = snap.branchTree.threads.find(t => t.id === currentThreadId);
    return {
      id: currentThreadId,
      title: thread?.title || 'Main Thread',
    };
  }, [currentThreadId, snap.branchTree.threads]);

  // Handle consolidation start
  const handleConfirmConsolidate = async (
    branchIds: string[],
    targetFolder: string,
    fileName: string
  ) => {
    await consolidate({
      threadId: currentThreadId,
      childBranchIds: branchIds,
      targetFolder,
      fileName,
    });
  };

  // Handle approval (with new pattern, approval happens automatically)
  const handleApproveConsolidation = () => {
    // In the new pattern, consolidation is automatically approved after generation
    // Just close the modal
    onClose();
  };

  // Handle rejection
  const handleRejectConsolidation = () => {
    // Close modal and reset state
    onClose();
  };

  return (
    <ConsolidateModal
      isOpen={isOpen}
      currentBranch={currentBranch}
      childBranches={childBranchesForModal}
      onConfirmConsolidate={handleConfirmConsolidate}
      onApproveConsolidation={handleApproveConsolidation}
      onRejectConsolidation={handleRejectConsolidation}
      onClose={onClose}
      consolidationProgress={progress ? {
        step: progress.stage,
        current: Math.round(progress.progress * 100),
        total: 100,
      } : null}
      consolidatedContent={result?.content || undefined}
      sourceProvenanceMap={result?.provenance || undefined}
    />
  );
}