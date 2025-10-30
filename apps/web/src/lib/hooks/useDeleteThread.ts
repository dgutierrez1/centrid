import { useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { aiAgentActions, aiAgentState } from '../state/aiAgentState';
import { api } from '../api/client';

export function useDeleteThread() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const deleteThread = async (threadId: string) => {
    setIsLoading(true);

    try {
      // Store parent for navigation
      const thread = aiAgentState.branchTree.threads.find(t => t.id === threadId);
      const parentId = thread?.parentId;

      // Optimistic removal
      aiAgentActions.removeThreadFromBranchTree(threadId);

      // Delete thread via API
      await api.delete(`/threads/${threadId}`);

      toast.success('Branch deleted');

      // Navigate to parent or home
      if (parentId) {
        router.push(`/workspace/${parentId}`);
      } else {
        router.push('/');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete branch');
      // TODO: Rollback optimistic update
    } finally {
      setIsLoading(false);
    }
  };

  return { deleteThread, isLoading };
}
