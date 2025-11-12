import { aiAgentState } from '@/lib/state/aiAgentState';
import { useGraphQLMutation } from '@/lib/graphql/useGraphQLMutation';
import { UpdateThreadDocument } from '@/types/graphql';
import toast from 'react-hot-toast';

export function useHideBranch() {
  const { mutate, isLoading } = useGraphQLMutation({
    mutation: UpdateThreadDocument,
    optimisticUpdate: (permanentId, input) => {
      // Store previous state for rollback (using any to bypass type checking for blacklistedBranches)
      const currentThread = aiAgentState.currentThread as any;
      const previousBlacklist = currentThread?.blacklistedBranches || [];

      // Optimistic update: Add to blacklisted_branches
      if (currentThread) {
        currentThread.blacklistedBranches = input?.input?.blacklistedBranches || [];
      }

      return { previousBlacklist };
    },
    onSuccess: () => {
      // Real-time will reconcile with server response
    },
    onError: ({ previousBlacklist }) => {
      // Rollback on error
      const currentThread = aiAgentState.currentThread as any;
      if (currentThread) {
        currentThread.blacklistedBranches = previousBlacklist;
      }
    },
    successMessage: () => 'Branch hidden from context',
    errorMessage: (error) => `Failed to hide branch: ${error}`,
  });

  const hideBranch = async (branchId: string) => {
    if (!aiAgentState.currentThread) {
      toast.error('No active thread');
      return;
    }

    const threadId = aiAgentState.currentThread.id;
    const currentThread = aiAgentState.currentThread as any;
    const previousBlacklist = currentThread.blacklistedBranches || [];

    await mutate({
      id: threadId,
      input: {
        blacklistedBranches: [...previousBlacklist, branchId],
      },
    });
  };

  return { hideBranch, isLoading };
}
