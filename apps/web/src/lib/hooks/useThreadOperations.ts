import { useRouter } from 'next/router';
import { useGraphQLMutation } from '@/lib/graphql/useGraphQLMutation';
import { UpdateThreadDocument, DeleteThreadDocument, type UpdateThreadMutation, type UpdateThreadMutationVariables, type DeleteThreadMutation, type DeleteThreadMutationVariables } from '@/types/graphql';
import { aiAgentActions, aiAgentState, type UIThread } from '@/lib/state/aiAgentState';

export function useThreadOperations() {
  const router = useRouter();

  // Rename operation
  const { mutate: renameThreadMutation, isLoading: isRenaming } = useGraphQLMutation<UpdateThreadMutationVariables, UpdateThreadMutation, { threadId: string; previousTitle: string | undefined }>({
    mutation: UpdateThreadDocument,
    optimisticUpdate: (permanentId, input) => {
      // Store previous title for rollback
      const thread = aiAgentState.branchTree.threads.find(t => t.id === input?.id);
      const previousTitle = thread?.title;
      const threadId = input?.id || '';
      const newTitle = input?.input?.branchTitle || '';

      // Optimistic update (manually update thread in tree)
      const updatedThreads = aiAgentState.branchTree.threads.map(t =>
        t.id === threadId ? { ...t, title: newTitle } : t
      );
      aiAgentState.branchTree = { ...aiAgentState.branchTree, threads: updatedThreads };

      return { threadId, previousTitle };
    },
    onSuccess: () => {
      // Real-time will reconcile with server response
    },
    onError: ({ threadId, previousTitle }) => {
      // Rollback on error
      if (previousTitle) {
        const updatedThreads = aiAgentState.branchTree.threads.map(t =>
          t.id === threadId ? { ...t, title: previousTitle } : t
        );
        aiAgentState.branchTree = { ...aiAgentState.branchTree, threads: updatedThreads };
      }
    },
    successMessage: () => 'Thread renamed',
    errorMessage: (error) => `Failed to rename thread: ${error}`,
  });

  // Delete operation
  const { mutate: deleteThreadMutation, isLoading: isDeleting } = useGraphQLMutation<DeleteThreadMutationVariables, DeleteThreadMutation, { thread: UIThread | undefined }>({
    mutation: DeleteThreadDocument,
    optimisticUpdate: (permanentId, input) => {
      // Store thread for rollback
      const thread = aiAgentState.branchTree.threads.find(t => t.id === input?.id);

      // Optimistic removal
      if (input?.id) {
        aiAgentActions.removeThreadFromBranchTree(input.id);
      }

      return { thread };
    },
    onSuccess: ({ thread }, data) => {
      // Real-time will handle final reconciliation
    },
    onError: ({ thread }) => {
      // Rollback on error
      if (thread) {
        aiAgentActions.addThreadToBranchTree(thread);
      }
    },
    successMessage: () => 'Thread deleted',
    errorMessage: (error) => `Failed to delete thread: ${error}`,
  });

  const renameThread = async (id: string, newTitle: string) => {
    const { promise } = renameThreadMutation({
      id,
      input: { branchTitle: newTitle },
    });

    const result = await promise;
    if (!result.success) {
      throw new Error(result.error);
    }
  };

  const deleteThread = async (id: string, currentThreadId?: string) => {
    const { promise } = deleteThreadMutation({ id });

    const result = await promise;
    if (!result.success) {
      throw new Error(result.error);
    }

    // Navigate away if deleting current thread
    if (id === currentThreadId) {
      router.push('/workspace');
    }
  };

  return { renameThread, deleteThread, isLoading: isRenaming || isDeleting, isRenaming, isDeleting };
}
