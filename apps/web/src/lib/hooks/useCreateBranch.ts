import { useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { aiAgentActions } from '../state/aiAgentState';
import { api } from '../api/client';

export function useCreateBranch() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const createBranch = async (parentId: string | null, title: string) => {
    setIsLoading(true);
    aiAgentActions.setIsCreatingBranch(true);

    let tempThread: any;

    try {
      // Optimistic update
      const now = new Date();
      tempThread = {
        id: `temp-${Date.now()}`,
        title,
        parentId: parentId || undefined,
        depth: 0,
        artifactCount: 0,
        lastActivity: now,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      aiAgentActions.addThreadToBranchTree(tempThread);

      // Call API to create thread
      const response = await api.post<{
        data: {
          id: string;
          branch_title: string;
          parent_thread_id: string | null;
          created_at: string;
          updated_at: string;
        };
      }>('/threads', {
        title,
        parentId,
      });

      const newThread = response.data;

      // Replace temp with real thread
      aiAgentActions.removeThreadFromBranchTree(tempThread.id);
      aiAgentActions.addThreadToBranchTree({
        id: newThread.id,
        title: newThread.branch_title || 'Untitled Thread',
        parentId: newThread.parent_thread_id,
        depth: 0,
        artifactCount: 0,
        lastActivity: new Date(newThread.updated_at || newThread.created_at),
        createdAt: newThread.created_at,
        updatedAt: newThread.updated_at,
      });

      toast.success(`Branch "${title}" created`);

      // Navigate to new branch
      // Real-time subscription will reconcile the optimistic update
      router.push(`/workspace/${newThread.id}`);
    } catch (error: any) {
      // Show user-friendly error message
      let errorMessage = 'Failed to create branch. Please try again.';

      if (error.message?.includes('Not authenticated')) {
        errorMessage = 'Authentication expired. Please refresh the page and try again.';
      } else if (error.message?.includes('already exists')) {
        errorMessage = 'A branch with this name already exists. Please choose a different name.';
      } else if (error.message?.toLowerCase().includes('network') || error.message?.toLowerCase().includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }

      toast.error(errorMessage);
      console.error('Branch creation error:', error);

      // Rollback optimistic update on error
      if (tempThread) {
        aiAgentActions.removeThreadFromBranchTree(tempThread.id);
      }
    } finally {
      setIsLoading(false);
      aiAgentActions.setIsCreatingBranch(false);
    }
  };

  return { createBranch, isLoading, isCreating: isLoading };
}
