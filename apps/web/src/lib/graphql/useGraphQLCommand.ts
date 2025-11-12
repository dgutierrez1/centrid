/**
 * useGraphQLCommand - General-purpose command operation hook
 *
 * For GraphQL mutations that are commands (not CRUD):
 * - No optimistic updates (wait for server confirmation)
 * - No entity creation (no permanent ID pattern)
 * - Built-in loading states and toast notifications
 * - Support single or multiple related commands
 *
 * Examples:
 * ```typescript
 * // Single command
 * const { execute, isLoading } = useGraphQLCommand({
 *   commands: {
 *     execute: {
 *       mutation: ExecuteAgentDocument,
 *       successMessage: "Agent started",
 *     },
 *   },
 * });
 *
 * // Multiple related commands
 * const { approve, reject, isLoading } = useGraphQLCommand({
 *   commands: {
 *     approve: {
 *       mutation: ApproveToolCallDocument,
 *       successMessage: "Tool call approved",
 *     },
 *     reject: {
 *       mutation: RejectToolCallDocument,
 *       successMessage: "Tool call rejected",
 *     },
 *   },
 * });
 * ```
 */

import { useState, useCallback, useMemo } from 'react';
import { useMutation, type TypedDocumentNode, type AnyVariables } from 'urql';
import toast from 'react-hot-toast';

export interface CommandConfig<TInput extends AnyVariables, TOutput = any> {
  /** GraphQL mutation document */
  mutation: TypedDocumentNode<TOutput, TInput> | string;

  /** Success message (string or function of response data) */
  successMessage: string | ((data: TOutput) => string);
}

export interface UseGraphQLCommandOptions {
  /** Map of command names to their configurations */
  commands: Record<string, CommandConfig<any, any>>;

  /** Optional global error message formatter */
  errorMessage?: (error: string) => string;
}

/**
 * General-purpose hook for executing GraphQL command mutations
 */
export function useGraphQLCommand<
  TCommands extends Record<string, CommandConfig<any, any>>
>(options: UseGraphQLCommandOptions & { commands: TCommands }) {
  const { commands, errorMessage = (err) => err } = options;

  // Create urql mutation hooks for each command
  const mutations = useMemo(() => {
    const result: Record<string, ReturnType<typeof useMutation>> = {};
    for (const [name, config] of Object.entries(commands)) {
      // We can't use hooks in a loop, so we'll do this differently
      // Store mutation configs and create the actual hook instances below
    }
    return result;
  }, [commands]);

  // Local loading state (combined from all mutations)
  const [isLoading, setIsLoading] = useState(false);

  // Generate command executor functions
  const commandFunctions = useMemo(() => {
    const functions: Record<string, (input: any) => Promise<any>> = {};

    for (const [commandName, config] of Object.entries(commands)) {
      functions[commandName] = async (input: any) => {
        setIsLoading(true);

        try {
          // For now, we'll import the graphql client for simplicity
          // In a future iteration, we can refactor to use urql hooks properly
          const { graphqlClient } = await import('@/lib/graphql/client');

          const result = await graphqlClient.mutation(config.mutation, input);

          if (result.error) {
            throw new Error(result.error.message);
          }

          if (!result.data) {
            throw new Error('No data returned from mutation');
          }

          // Show success toast
          const successMsg =
            typeof config.successMessage === 'function'
              ? config.successMessage(result.data)
              : config.successMessage;
          toast.success(successMsg);

          return { success: true, data: result.data };
        } catch (error) {
          // Show error toast
          const errorMsg = error instanceof Error ? error.message : 'Command failed';
          toast.error(errorMessage(errorMsg));

          return { success: false, error: errorMsg };
        } finally {
          setIsLoading(false);
        }
      };
    }

    return functions;
  }, [commands, errorMessage]);

  return {
    ...commandFunctions,
    isLoading,
  } as {
    [K in keyof TCommands]: (
      input: TCommands[K] extends CommandConfig<infer TInput, any> ? TInput : never
    ) => Promise<{
      success: boolean;
      data?: TCommands[K] extends CommandConfig<any, infer TOutput> ? TOutput : any;
      error?: string;
    }>;
  } & { isLoading: boolean };
}
