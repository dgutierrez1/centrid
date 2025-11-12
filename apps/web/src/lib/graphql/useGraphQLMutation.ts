/**
 * useGraphQLMutation - Reusable GraphQL mutation hook factory
 *
 * Handles:
 * - Optimistic Valtio state updates
 * - urql mutation execution
 * - Rollback on error with original state
 * - Toast notifications (success/error)
 * - Loading states
 *
 * Usage:
 * ```typescript
 * const { mutate, isLoading } = useGraphQLMutation({
 *   mutation: CreateFolderDocument,
 *   optimisticUpdate: (tempId, input) => {
 *     const folder = { id: tempId, ...input };
 *     addFolder(folder);
 *     return { tempId, folder };
 *   },
 *   onSuccess: ({ tempId, data }) => {
 *     removeFolder(tempId);
 *     addFolder(data.createFolder);
 *   },
 *   onError: ({ tempId }) => {
 *     removeFolder(tempId);
 *   },
 *   successMessage: (data) => `Folder created`,
 *   errorMessage: (error) => `Failed: ${error}`,
 * });
 * ```
 */

import { useState, useCallback } from 'react';
import { useMutation, type TypedDocumentNode, type AnyVariables } from 'urql';
import toast from 'react-hot-toast';

export interface UseGraphQLMutationOptions<
  TInput extends AnyVariables,
  TOutput = any,
  TContext = any
> {
  /** GraphQL mutation document */
  mutation: TypedDocumentNode<TOutput, TInput> | string;

  /**
   * Optimistic update function
   * @param permanentId - Permanent UUID to be used by both client and server
   * @param input - Mutation input variables
   * @returns Context object to pass to onSuccess/onError (e.g., { permanentId, originalValue })
   */
  optimisticUpdate: (permanentId: string, input: TInput) => TContext;

  /**
   * Success callback
   * @param context - Context from optimisticUpdate
   * @param data - Mutation response data
   */
  onSuccess: (context: TContext, data: TOutput) => void;

  /**
   * Error callback (rollback)
   * @param context - Context from optimisticUpdate
   */
  onError: (context: TContext) => void;

  /**
   * Success toast message
   * @param data - Mutation response data
   * @returns Toast message string
   */
  successMessage: (data: TOutput) => string;

  /**
   * Error toast message
   * @param error - Error message
   * @returns Toast message string
   */
  errorMessage: (error: string) => string;
}

export interface UseGraphQLMutationResult<TInput extends AnyVariables, TOutput = any> {
  /** Execute the mutation */
  mutate: (input: TInput) => { permanentId: string; promise: Promise<{ success: boolean; data?: TOutput; error?: string }> };

  /** Mutation is in progress */
  isLoading: boolean;
}

/**
 * Reusable GraphQL mutation hook with optimistic updates and rollback
 */
export function useGraphQLMutation<
  TInput extends AnyVariables,
  TOutput = any,
  TContext = any
>(
  options: UseGraphQLMutationOptions<TInput, TOutput, TContext>
): UseGraphQLMutationResult<TInput, TOutput> {
  const {
    mutation,
    optimisticUpdate,
    onSuccess,
    onError,
    successMessage,
    errorMessage,
  } = options;

  // urql mutation hook
  const [result, executeMutation] = useMutation<TOutput, TInput>(mutation);

  // Local loading state
  const [isLoading, setIsLoading] = useState(false);

  const mutate = useCallback(
    (input: TInput): { permanentId: string; promise: Promise<{ success: boolean; data?: TOutput; error?: string }> } => {
      setIsLoading(true);

      // Generate permanent UUID that will be used by both client and server
      const permanentId = crypto.randomUUID();

      // Execute optimistic update with permanent ID (synchronous)
      let context: TContext;
      try {
        context = optimisticUpdate(permanentId, input);
      } catch (error) {
        setIsLoading(false);
        const errorMsg = error instanceof Error ? error.message : 'Optimistic update failed';
        toast.error(errorMessage(errorMsg));
        return {
          permanentId,
          promise: Promise.resolve({ success: false, error: errorMsg })
        };
      }

      // Return permanentId immediately, promise for async completion
      const promise = (async () => {
        try {
          // Execute GraphQL mutation (server will use same permanentId)
          const response = await executeMutation(input);

          if (response.error) {
            throw new Error(response.error.message);
          }

          if (!response.data) {
            throw new Error('No data returned from mutation');
          }

          // Success: Update state with server response
          // Since server used same ID, realtime will merge cleanly (no race condition)
          try {
            onSuccess(context, response.data);
          } catch (error) {
            console.error('[useGraphQLMutation] onSuccess callback failed:', error);
          }

          // Show success toast
          toast.success(successMessage(response.data));

          return { success: true, data: response.data };
        } catch (error) {
          // Rollback optimistic update
          try {
            onError(context);
          } catch (rollbackError) {
            console.error('[useGraphQLMutation] onError rollback failed:', rollbackError);
          }

          // Show error toast
          const errorMsg = error instanceof Error ? error.message : 'Mutation failed';
          toast.error(errorMessage(errorMsg));

          return { success: false, error: errorMsg };
        } finally {
          setIsLoading(false);
        }
      })();

      return { permanentId, promise };
    },
    [executeMutation, optimisticUpdate, onSuccess, onError, successMessage, errorMessage]
  );

  return { mutate, isLoading };
}
