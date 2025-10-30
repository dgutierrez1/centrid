import { useState } from 'react';
import { BranchActions } from '@centrid/ui/features/ai-agent-system';
import { ConsolidateModalContainer } from '../ai-agent-system/ConsolidateModalContainer';

interface BranchActionsContainerProps {
  threadId: string;
  threadTitle: string;
  hasChildren: boolean;
  onCreateBranch: () => void;
}

export function BranchActionsContainer({
  threadId,
  threadTitle,
  hasChildren,
  onCreateBranch,
}: BranchActionsContainerProps) {
  const [isConsolidateModalOpen, setIsConsolidateModalOpen] = useState(false);

  const handleConsolidate = () => {
    // Only show consolidate option when thread has children (T085)
    if (!hasChildren) {
      return;
    }

    setIsConsolidateModalOpen(true);
  };

  const handleOpenTreeView = () => {
    // TODO: Implement tree view modal
    console.log('Open tree view for:', threadId);
  };

  return (
    <>
      <BranchActions
        currentBranch={{
          id: threadId,
          title: threadTitle,
          hasChildren,
        }}
        hasChildren={hasChildren}
        onCreateBranch={onCreateBranch}
        onConsolidate={handleConsolidate}
        onOpenTreeView={handleOpenTreeView}
      />

      <ConsolidateModalContainer
        isOpen={isConsolidateModalOpen}
        onClose={() => setIsConsolidateModalOpen(false)}
        currentThreadId={threadId}
      />
    </>
  );
}
