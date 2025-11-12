import { aiAgentActions, aiAgentState } from '../state/aiAgentState';
import { useGraphQLMutation } from '../graphql/useGraphQLMutation';
import { UpdateThreadDocument } from '@/types/graphql';

export function useUpdateThread() {
  const { mutate, isLoading } = useGraphQLMutation({
    mutation: UpdateThreadDocument,
    optimisticUpdate: (permanentId, input) => {
      const oldThread = aiAgentState.currentThread;

      // Optimistic update
      if (oldThread) {
        aiAgentActions.setCurrentThread({ ...oldThread, title: input?.input?.branchTitle || oldThread.title });
      }

      return { oldThread };
    },
    onSuccess: ({ oldThread }, data) => {
      // Real-time will reconcile with server response
    },
    onError: ({ oldThread }) => {
      // Rollback on error
      if (oldThread) {
        aiAgentActions.setCurrentThread(oldThread);
      }
    },
    successMessage: () => 'Branch title updated',
    errorMessage: (error) => `Failed to update branch: ${error}`,
  });

  const updateThread = async (threadId: string, updates: { title: string }) => {
    await mutate({
      id: threadId,
      input: {
        branchTitle: updates.title,
      },
    });
  };

  return { updateThread, isLoading };
}
