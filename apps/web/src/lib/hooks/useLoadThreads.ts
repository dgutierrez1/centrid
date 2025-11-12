import { useEffect } from "react";
import { aiAgentState, aiAgentActions } from "../state/aiAgentState";
import { useGraphQLQuery } from "../graphql/useGraphQLQuery";
import { ListAllThreadsDocument } from "@/types/graphql";
import type { ListAllThreadsQueryVariables } from "@/types/graphql";

/**
 * Load all threads for the current user to populate branch tree
 * Used on app initialization and after login
 *
 * Auth is handled automatically via cookies - no need to wait for client-side user state
 */
export function useLoadThreads() {
  // Load threads using GraphQL
  // Cookies are sent automatically - backend validates auth
  const { loading, error } = useGraphQLQuery({
    query: ListAllThreadsDocument,
    // Don't pass variables for queries with no variables
    // No enabled gate - trust cookies for auth
    syncToState: (data) => {
      // Transform GraphQL data to match state types
      const threads = data.threads || [];

      // Skip sync if threads already loaded (SSR or previous load)
      if (aiAgentState.branchTree.threads.length > 0) {
        return;
      }

      const transformedThreads = threads.map((thread: any) => ({
        id: thread.id,
        title: thread.branchTitle || "Untitled Thread",
        parentThreadId: thread.parentThreadId,
        depth: 0, // Will be calculated by state manager
        artifactCount: 0, // TODO: count from files
        lastActivity: new Date(thread.updatedAt || thread.createdAt),
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
      }));

      // Update branch tree state
      aiAgentActions.setBranchTree(transformedThreads);
    },
  });

  return { isLoading: loading, error };
}
