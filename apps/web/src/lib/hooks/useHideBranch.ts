import { useState } from 'react';
import { aiAgentState } from '@/lib/state/aiAgentState';
import { toast } from 'react-hot-toast';
import { api } from '@/lib/api/client';

export function useHideBranch() {
  const [isLoading, setIsLoading] = useState(false);

  const hideBranch = async (branchId: string) => {
    if (!aiAgentState.currentThread) {
      toast.error('No active thread');
      return;
    }

    setIsLoading(true);

    const threadId = aiAgentState.currentThread.id;

    // Store previous state for rollback
    const previousBlacklist = aiAgentState.currentThread.blacklistedBranches || [];

    try {
      // Optimistic update: Add to blacklisted_branches
      aiAgentState.currentThread.blacklistedBranches = [
        ...previousBlacklist,
        branchId,
      ];

      // Call API to persist change
      await api.patch(`/threads/${threadId}`, {
        blacklistedBranches: [...previousBlacklist, branchId],
      });

      toast.success('Branch hidden from context');
    } catch (error) {
      // Rollback on error
      if (aiAgentState.currentThread) {
        aiAgentState.currentThread.blacklistedBranches = previousBlacklist;
      }
      toast.error('Failed to hide branch');
      console.error('Hide branch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { hideBranch, isLoading };
}
