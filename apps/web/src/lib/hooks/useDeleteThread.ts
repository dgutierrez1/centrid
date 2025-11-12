import { useRouter } from 'next/router';
import { aiAgentActions, aiAgentState } from '../state/aiAgentState';
import { useGraphQLMutation } from '../graphql/useGraphQLMutation';
import { DeleteThreadDocument } from '@/types/graphql';

export function useDeleteThread() {
  const router = useRouter();

  const { mutate, isLoading } = useGraphQLMutation({
    mutation: DeleteThreadDocument,
    optimisticUpdate: (permanentId, input) => {
      // Store thread for rollback
      const thread = aiAgentState.branchTree.threads.find(t => t.id === input?.id);
      const parentId = thread?.parentThreadId;

      // Optimistic removal
      if (input?.id) {
        aiAgentActions.removeThreadFromBranchTree(input.id);
      }

      return { thread, parentId };
    },
    onSuccess: ({ parentId }) => {
      // Navigate to parent or home
      if (parentId) {
        router.push(`/workspace/${parentId}`);
      } else {
        router.push('/');
      }
    },
    onError: ({ thread }) => {
      // Rollback optimistic update
      if (thread) {
        aiAgentActions.addThreadToBranchTree(thread);
      }
    },
    successMessage: () => 'Branch deleted',
    errorMessage: (error) => `Failed to delete branch: ${error}`,
  });

  const deleteThread = async (threadId: string) => {
    await mutate({ id: threadId });
  };

  return { deleteThread, isLoading };
}
