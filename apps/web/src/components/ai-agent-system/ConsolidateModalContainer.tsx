import React, { useMemo } from 'react';
import { ConsolidateModal, type Branch } from '@centrid/ui/features/ai-agent-system';
import { useConsolidation } from '@/lib/hooks/useConsolidation';

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
 * - Manages consolidation workflow via useConsolidation hook
 * - Handles SSE streaming for real-time progress updates
 * - Integrates with Valtio state management
 *
 * UX Spec: ux.md lines 936-965
 * Implementation: plan.md "ConsolidateModalContainer Implementation"
 */
export function ConsolidateModalContainer({
  isOpen,
  onClose,
  currentThreadId,
}: ConsolidateModalContainerProps) {
  const {
    consolidationState,
    childBranches,
    updateSelectedBranches,
    updateFileName,
    updateTargetFolder,
    startConsolidation,
    approveConsolidation,
    rejectConsolidation,
  } = useConsolidation();

  // Convert child branches to Branch format for ConsolidateModal
  const childBranchesForModal = useMemo(() => {
    return childBranches.map(branch => ({
      id: branch.id,
      title: branch.title,
      parentId: branch.parentId ?? null,
      depth: branch.depth,
      artifactCount: branch.artifactCount,
      lastActivity: new Date(branch.lastActivity),
      summary: branch.summary,
    })) satisfies Branch[];
  }, [childBranches]);

  // Current branch for modal context
  const currentBranch = useMemo(() => {
    return {
      id: currentThreadId,
      title: '', // This would be populated from state
    };
  }, [currentThreadId]);

  // Handle branch selection changes
  const handleBranchSelectionChange = (selectedIds: Set<string>) => {
    updateSelectedBranches(selectedIds);
  };

  // Handle file name and folder changes
  const handleFileNameChange = (fileName: string) => {
    updateFileName(fileName);
  };

  const handleTargetFolderChange = (targetFolder: string) => {
    updateTargetFolder(targetFolder);
  };

  // Handle consolidation start
  const handleConfirmConsolidate = (
    branchIds: string[],
    targetFolder: string,
    fileName: string
  ) => {
    startConsolidation(branchIds, targetFolder, fileName);
  };

  // Handle approval
  const handleApproveConsolidation = (
    targetFolder: string,
    fileName: string
  ) => {
    approveConsolidation(targetFolder, fileName);
  };

  // Handle rejection
  const handleRejectConsolidation = () => {
    rejectConsolidation();
  };

  // Convert selected branch IDs to Set for modal
  const selectedBranchIdsForModal = useMemo(() => {
    return new Set(consolidationState.selectedBranchIds);
  }, [consolidationState.selectedBranchIds]);

  // Modal is open when parent passes isOpen prop
  const isModalOpen = isOpen;

  // Pass all child branches to modal (user selects which ones to consolidate)
  const modalChildBranches = childBranchesForModal;

  return (
    <ConsolidateModal
      isOpen={isModalOpen}
      currentBranch={currentBranch}
      childBranches={modalChildBranches}
      onConfirmConsolidate={handleConfirmConsolidate}
      onApproveConsolidation={handleApproveConsolidation}
      onRejectConsolidation={handleRejectConsolidation}
      onClose={onClose}
      consolidationProgress={consolidationState.progress}
      consolidatedContent={consolidationState.consolidatedContent}
      sourceProvenanceMap={consolidationState.sourceProvenanceMap || undefined}
    />
  );
}