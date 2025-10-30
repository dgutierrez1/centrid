import { useState } from 'react';
import toast from 'react-hot-toast';
import { aiAgentActions, aiAgentState } from '../state/aiAgentState';
import { api } from '../api/client';

export function useUpdateThread() {
  const [isLoading, setIsLoading] = useState(false);

  const updateThread = async (threadId: string, updates: { title: string }) => {
    setIsLoading(true);
    const oldThread = aiAgentState.currentThread;

    try {
      // Optimistic update
      if (oldThread) {
        aiAgentActions.setCurrentThread({ ...oldThread, title: updates.title });
      }

      // Update thread via API
      await api.put(`/threads/${threadId}`, {
        title: updates.title,
      });

      toast.success('Branch title updated');
    } catch (error: any) {
      // Rollback on error
      if (oldThread) {
        aiAgentActions.setCurrentThread(oldThread);
      }
      toast.error(error.message || 'Failed to update branch');
    } finally {
      setIsLoading(false);
    }
  };

  return { updateThread, isLoading };
}
