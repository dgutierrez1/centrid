import { useEffect } from "react";
import { aiAgentState, aiAgentActions } from "../state/aiAgentState";
import { useGraphQLQuery } from "../graphql/useGraphQLQuery";
import { GetThreadDocument } from "@/types/graphql";
import { parseJsonbRow } from "@/lib/realtime/config";

/**
 * Load thread data via GraphQL
 *
 * With SSR prefetching, this query returns instantly from cache on first render.
 *
 * @param threadId - Thread ID to load
 */
export function useLoadThread(threadId: string | undefined) {
  // Handle "new" thread route (empty state)
  useEffect(() => {
    if (threadId === 'new') {
      aiAgentActions.setCurrentThread(null);
      aiAgentActions.setMessages([]);
      aiAgentActions.setContextReferences([]);
      aiAgentActions.setIsLoadingThread(false);
      return;
    }
  }, [threadId]);

  // Clear state when no thread ID
  useEffect(() => {
    if (!threadId) {
      aiAgentActions.setCurrentThread(null);
      aiAgentActions.setMessages([]);
      aiAgentActions.setContextReferences([]);
      aiAgentActions.setIsLoadingThread(false);
    }
  }, [threadId]);

  // Check if thread data already exists in state (data-aware loading)
  const alreadyLoaded =
    aiAgentState.currentThread?.id === threadId &&
    aiAgentState.messages.length > 0;

  // Load thread using GraphQL
  // Cookies sent automatically - backend validates auth
  // Query returns instantly from SSR-prefetched cache
  const { loading, error } = useGraphQLQuery({
    query: GetThreadDocument,
    variables: threadId ? { id: threadId } : { id: "" }, // Provide empty string if no threadId (query will be disabled anyway)
    // Enable query only if threadId exists, is not 'new', and not already loaded
    enabled: !!threadId && threadId !== 'new' && !alreadyLoaded,
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
        lastActivity: thread.updatedAt || thread.createdAt,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
      };

      const transformedMessages = (thread.messages || []).map((msg: any) => {
        // Parse JSONB fields (content, toolCalls) using shared helper
        const parsed = parseJsonbRow('messages', msg);
        return {
          id: parsed.id,
          threadId: parsed.threadId,
          role: parsed.role,
          content: parsed.content,        // ✅ JSONB parsed
          timestamp: parsed.timestamp,    // ✅ Keep as ISO string
          toolCalls: parsed.toolCalls || [],  // ✅ JSONB parsed
          tokensUsed: parsed.tokensUsed || 0,
        };
      });

      const transformedRefs = (thread.contextReferences || []).map(
        (ref: any) => ({
          id: ref.id,
          threadId: ref.threadId,
          ownerUserId: ref.ownerUserId,
          entityType: ref.entityType,
          entityReference: ref.entityReference,
          source: ref.source,
          priorityTier: ref.priorityTier || 1,
          addedTimestamp: ref.addedTimestamp,
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

  // Return false for loading if data already exists (data-aware loading)
  // This prevents skeleton flashing when we already have the data in state
  return { isLoading: alreadyLoaded ? false : loading, error };
}
