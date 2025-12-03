import { useEffect } from "react";
import { aiAgentState, aiAgentActions } from "../state/aiAgentState";
import { useGraphQLQuery } from "../graphql/useGraphQLQuery";
import {
  GetThreadDocument,
  type GetThreadQuery,
  type GetThreadQueryVariables,
} from "@/types/graphql";
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
    if (threadId === "new") {
      aiAgentActions.setCurrentThread(null);
      aiAgentActions.setMessages([]);
      aiAgentActions.setContextReferences([]);
      aiAgentActions.setIsLoadingThread(false);
      return;
    }
  }, [threadId]);

  // Load thread using GraphQL with urql cache-and-network
  // - Returns cached data INSTANTLY if available (no loading state)
  // - Fetches fresh data in background
  // - urql handles request deduplication automatically
  const { loading, error } = useGraphQLQuery<
    GetThreadQuery,
    GetThreadQueryVariables
  >({
    query: GetThreadDocument,
    variables: threadId ? { id: threadId } : { id: "" },
    // Enable query for any valid threadId - trust urql's cache
    enabled: !!threadId && threadId !== "new",
    syncToState: (data) => {
      if (!data.thread) {
        // Thread not found
        aiAgentActions.setCurrentThread(null);
        aiAgentActions.setMessages([]);
        aiAgentActions.setContextReferences([]);
        aiAgentActions.setIsLoadingThread(false);
        return;
      }

      // Skip sync if streaming is active - preserves optimistic state being updated in real-time
      // The streaming completion (message_complete event) will provide the final accurate state
      if (aiAgentState.isStreaming) {
        aiAgentActions.setIsLoadingThread(false);
        return;
      }

      const thread = data.thread;
      // Transform and update state
      const transformedThread = {
        id: thread.id,
        title: thread.branchTitle || "Untitled Thread",
        parentThreadId: thread.parentThreadId ?? null,
        depth: 0,
        artifactCount: 0,
        lastActivity: thread.updatedAt || thread.createdAt,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
      };

      const transformedMessages = (thread.messages || []).map((msg: any) => {
        // Parse JSONB fields (content, toolCalls) using shared helper
        const parsed = parseJsonbRow("messages", msg);
        return {
          id: parsed.id,
          threadId: parsed.threadId,
          role: parsed.role,
          content: parsed.content, // ✅ JSONB parsed
          timestamp: parsed.timestamp, // ✅ Keep as ISO string
          toolCalls: parsed.toolCalls || [], // ✅ JSONB parsed
          tokensUsed: parsed.tokensUsed || 0,
        };
      });

      // TODO: contextReferences field not yet implemented in GraphQL Thread type
      // For now, use empty array - will be populated when Thread.contextReferences resolver is added
      const transformedRefs: any[] = [];

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

  // Return loading state from urql
  // urql's cache-and-network returns loading=false when returning cached data
  return { isLoading: loading, error };
}
