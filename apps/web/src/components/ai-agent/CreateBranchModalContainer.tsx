import { useState } from 'react';
import { CreateBranchModal } from '@centrid/ui/features/ai-agent-system';
import { useCreateBranch } from '@/lib/hooks/useCreateBranch';

interface CreateBranchModalContainerProps {
  isOpen: boolean;
  parentThreadId: string | null;
  parentTitle?: string;
  onClose: () => void;
}

export function CreateBranchModalContainer({
  isOpen,
  parentThreadId,
  parentTitle,
  onClose,
}: CreateBranchModalContainerProps) {
  const [titleError, setTitleError] = useState<string | null>(null);
  const { createBranch, isLoading } = useCreateBranch();

  const validateTitle = (value: string): boolean => {
    if (!value.trim()) {
      setTitleError('Title is required');
      return false;
    }
    if (value.trim().length < 3) {
      setTitleError('Title must be at least 3 characters');
      return false;
    }
    if (value.trim().length > 100) {
      setTitleError('Title must be less than 100 characters');
      return false;
    }
    setTitleError(null);
    return true;
  };

  const handleConfirmCreate = async (name: string) => {
    if (!validateTitle(name)) return;

    // Optimistic UX: Close modal immediately for instant feel
    setTitleError(null);
    onClose();

    // Create branch in background (non-blocking)
    // Success/error handled via toast in the hook
    createBranch(parentThreadId, name.trim());
  };

  const handleCancel = () => {
    setTitleError(null);
    onClose();
  };

  return (
    <CreateBranchModal
      isOpen={isOpen}
      currentThreadTitle={parentTitle}
      onConfirmCreate={handleConfirmCreate}
      onCancel={handleCancel}
      isLoading={isLoading}
      validationError={titleError}
    />
  );
}
