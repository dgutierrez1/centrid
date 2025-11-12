import { aiAgentState, type ContextReference } from '@/lib/state/aiAgentState';
import { useGraphQLMutation } from '@/lib/graphql/useGraphQLMutation';
import { AddContextReferenceDocument } from '@/types/graphql';

export function useAddToExplicit(threadId: string) {
  /**
   * Add to explicit context mutation
   */
  const addToExplicitMutation = useGraphQLMutation<
    {
      input: {
        threadId: string;
        entityType: string;
        entityReference: string;
        source: string;
        priorityTier: number;
      };
    },
    any,
    { previousReferences: ContextReference[]; currentRef: ContextReference }
  >({
    mutation: AddContextReferenceDocument,
    optimisticUpdate: (_permanentId, input) => {
      // Find the current context reference
      const currentRef = aiAgentState.contextReferences.find(
        (ref) => ref.entityReference === input.input.entityReference
      );

      if (!currentRef) {
        throw new Error('File not found in context');
      }

      // Store previous state for rollback
      const previousReferences = [...aiAgentState.contextReferences];

      // Optimistic update: Move from Semantic section to Explicit section
      // Remove from current location and add as explicit context (tier 1, manual source)
      aiAgentState.contextReferences = aiAgentState.contextReferences
        .filter((ref) => ref.id !== currentRef.id)
        .concat({
          ...currentRef,
          source: 'manual',
          priorityTier: 1,
          addedTimestamp: new Date(),
        });

      return { previousReferences, currentRef };
    },
    onSuccess: (_context, _data) => {
      // Realtime subscription will confirm the update
    },
    onError: ({ previousReferences }) => {
      // Rollback to previous state
      aiAgentState.contextReferences = previousReferences;
    },
    successMessage: () => 'Added to explicit context',
    errorMessage: (error) => `Failed to add to explicit context: ${error}`,
  });

  return {
    addToExplicit: (fileId: string) =>
      addToExplicitMutation.mutate({
        input: {
          threadId,
          entityType: 'file',
          entityReference: fileId,
          source: 'manual',
          priorityTier: 1,
        },
      }),
    isLoading: addToExplicitMutation.isLoading,
  };
}
