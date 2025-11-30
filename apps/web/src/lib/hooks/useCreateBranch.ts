import { useRouter } from 'next/router';
import { aiAgentActions, type UIThread } from '../state/aiAgentState';
import { useGraphQLMutation } from '../graphql/useGraphQLMutation';
import { CreateThreadDocument, type CreateThreadMutation, type CreateThreadMutationVariables } from '@/types/graphql';

export function useCreateBranch() {
  const router = useRouter();

  const { mutate, isLoading } = useGraphQLMutation<CreateThreadMutationVariables, CreateThreadMutation, { permanentId: string }>({
    mutation: CreateThreadDocument,
    optimisticUpdate: (permanentId, input) => {
      // Set creating state
      aiAgentActions.setIsCreatingBranch(true);

      // Create optimistic thread with permanent UUID
      const now = new Date().toISOString();
      const thread: UIThread = {
        id: permanentId, // Server will use same ID
        title: input?.input?.branchTitle || 'Untitled',
        parentThreadId: input?.input?.parentThreadId ?? null,
        depth: 0,
        artifactCount: 0,
        lastActivity: now,
        createdAt: now,
        updatedAt: now,
      };

      aiAgentActions.addThreadToBranchTree(thread);

      // Pass permanent ID to GraphQL mutation
      if (input?.input) {
        input.input.id = permanentId;
      }

      return { permanentId };
    },
    onSuccess: ({ permanentId }, data) => {
      // Navigate to new branch
      // Real-time subscription will reconcile the optimistic update
      router.push(`/workspace/${permanentId}`);
      aiAgentActions.setIsCreatingBranch(false);
    },
    onError: ({ permanentId }) => {
      // Rollback optimistic update
      aiAgentActions.removeThreadFromBranchTree(permanentId);
      aiAgentActions.setIsCreatingBranch(false);
    },
    successMessage: (data) => `Branch "${data.createThread?.branchTitle || 'Untitled'}" created`,
    errorMessage: (error) => {
      // User-friendly error messages
      if (error.includes('Not authenticated')) {
        return 'Authentication expired. Please refresh the page and try again.';
      }
      if (error.includes('already exists')) {
        return 'A branch with this name already exists. Please choose a different name.';
      }
      if (error.toLowerCase().includes('network') || error.toLowerCase().includes('fetch')) {
        return 'Network error. Please check your connection and try again.';
      }
      return 'Failed to create branch. Please try again.';
    },
  });

  const createBranch = async (parentThreadId: string | null, title: string) => {
    await mutate({
      input: {
        branchTitle: title,
        parentThreadId: parentThreadId || null,
      },
    });
  };

  return { createBranch, isLoading, isCreating: isLoading };
}
