import { useEffect } from "react";
import { aiAgentState, aiAgentActions } from "../state/aiAgentState";
import { useGraphQLQuery } from "../graphql/useGraphQLQuery";
import { GetThreadDocument } from "@/types/graphql";

/**
 * Load thread data via GraphQL
 *
 * With SSR prefetching, this query returns instantly from cache on first render.
 *
 * @param threadId - Thread ID to load
 */
export function useLoadThread(threadId: string | undefined) {
  // Clear state when no thread ID
  useEffect(() => {
    if (!threadId) {
      aiAgentActions.setCurrentThread(null);
      aiAgentActions.setMessages([]);
      aiAgentActions.setContextReferences([]);
      aiAgentActions.setIsLoadingThread(false);
    }
  }, [threadId]);

  // Load thread using GraphQL
  // Cookies sent automatically - backend validates auth
  // Query returns instantly from SSR-prefetched cache
  const { loading, error } = useGraphQLQuery({
    query: GetThreadDocument,
    variables: threadId ? { id: threadId } : { id: "" }, // Provide empty string if no threadId (query will be disabled anyway)
    // Enable query only if threadId exists
    enabled: !!threadId,
    syncToState: (data) => {
      if (!data.thread) {
        // Thread not found
        aiAgentActions.setCurrentThread(null);
        aiAgentActions.setMessages([]);
        aiAgentActions.setContextReferences([]);
        aiAgentActions.setIsLoadingThread(false);
        return;
      }

      const thread = data.thread;

      // Skip sync if this exact thread is already loaded (SSR or previous load)
      if (
        aiAgentState.currentThread?.id === thread.id &&
        aiAgentState.messages.length > 0
      ) {
        // Clear loading state even when skipping sync
        aiAgentActions.setIsLoadingThread(false);
        return;
      }

      // Transform and update state
      const transformedThread = {
        id: thread.id,
        title: thread.branchTitle || "Untitled Thread",
        parentThreadId: thread.parentThreadId,
        depth: 0,
        artifactCount: 0,
        lastActivity: new Date(thread.updatedAt || thread.createdAt),
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
      };

      const transformedMessages = (thread.messages || []).map((msg: any) => ({
        id: msg.id,
        threadId: msg.threadId,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        toolCalls: msg.toolCalls || [],
        tokensUsed: msg.tokensUsed || 0,
      }));

      const transformedRefs = (thread.contextReferences || []).map(
        (ref: any) => ({
          id: ref.id,
          threadId: ref.threadId,
          ownerUserId: ref.ownerUserId,
          entityType: ref.entityType,
          entityReference: ref.entityReference,
          source: ref.source,
          priorityTier: ref.priorityTier || 1,
          addedTimestamp: new Date(ref.addedTimestamp),
        })
      );

      // Batch update to prevent multiple rerenders
      aiAgentActions.setThreadData(
        transformedThread,
        transformedMessages,
        transformedRefs
      );

      // Clear optimistic loading state after successful sync
      aiAgentActions.setIsLoadingThread(false);
    },
  });

  // Clear loading state on error
  useEffect(() => {
    if (error) {
      aiAgentActions.setIsLoadingThread(false);
    }
  }, [error]);

  // Don't sync loading state to Valtio - with SSR prefetching, loading is instant
  // Components that need loading state can use the return value from this hook

  return { isLoading: loading, error };
}
