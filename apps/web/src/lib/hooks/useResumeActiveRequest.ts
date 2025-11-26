import { useEffect, useRef } from 'react';
import { useSnapshot } from 'valtio';
import { useAgentStreaming } from './useAgentStreaming';
import { aiAgentState } from '@/lib/state/aiAgentState';
import { useGraphQLQuery } from '@/lib/graphql/useGraphQLQuery';
import { ListAgentRequestsByThreadDocument } from '@/types/graphql';
import toast from 'react-hot-toast';

/**
 * Resume active agent requests after page load/navigation
 *
 * Queries the database for pending/in_progress requests for this thread
 * and resumes real-time streaming subscriptions automatically.
 *
 * This enables:
 * - Reload page → continue streaming
 * - Reload page → approve tool call → continue streaming
 * - Open thread in multiple tabs → all stay in sync
 */
export function useResumeActiveRequest(
  threadId: string,
  setPendingToolCall: (toolCall: any) => void
) {
  const { startStreaming } = useAgentStreaming();
  const snap = useSnapshot(aiAgentState);
  const hasResumed = useRef(false); // Prevent double-resume

  // Query active requests for this thread
  const { data, loading } = useGraphQLQuery({
    query: ListAgentRequestsByThreadDocument,
    variables: { threadId },
    enabled: !!threadId && threadId !== 'new',
    syncToState: () => {
      // No automatic state sync - we handle request resumption manually in useEffect below
    },
  });

  useEffect(() => {
    // Skip if already resumed or no data yet
    if (hasResumed.current || loading || !data?.agentRequestsByThread) {
      return;
    }

    // Find active requests (pending or in_progress)
    const activeRequests = data.agentRequestsByThread.filter(
      (req) => req.status === 'pending' || req.status === 'in_progress'
    );

    if (activeRequests.length === 0) {
      console.log('[Recovery] No active requests found for thread:', threadId);
      return;
    }

    // Get most recent active request (sorted by createdAt desc)
    const sortedRequests = [...activeRequests].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const activeRequest = sortedRequests[0];

    console.log('[Recovery] 🔄 Resuming active request', {
      requestId: activeRequest.id,
      status: activeRequest.status,
      progress: activeRequest.progress,
      threadId,
      timestamp: new Date().toISOString(),
    });

    // Mark as resumed to prevent double-resume
    hasResumed.current = true;

    // Find the assistant message index for this request
    // Look for message with matching requestId
    const assistantMessageIndex = snap.messages.findIndex(
      (m) => m.role === 'assistant' && m.requestId === activeRequest.id
    );

    if (assistantMessageIndex === -1) {
      console.warn('[Recovery] No assistant message found for request:', activeRequest.id);
      // Don't resume subscription if we can't find the message to update
      return;
    }

    // Resume streaming subscription
    try {
      startStreaming(activeRequest.id, activeRequest.userId, {
        optimisticMessageIndex: assistantMessageIndex,
        threadId,
        onToolCall: (toolCall) => {
          console.log('[Recovery] Tool call received:', toolCall);
          setPendingToolCall(toolCall);
        },
        onError: (error) => {
          console.error('[Recovery] Streaming error:', error);
          toast.error(`Streaming error: ${error.message}`);
          // Mark message as failed
          if (aiAgentState.messages[assistantMessageIndex]) {
            aiAgentState.messages[assistantMessageIndex].isStreaming = false;
            aiAgentState.messages[assistantMessageIndex].content = [
              { type: 'text' as const, text: '⚠️ Error: ' + error.message }
            ];
          }
        },
      });

      console.log('[Recovery] ✅ Subscription resumed successfully');
    } catch (error) {
      console.error('[Recovery] Failed to resume subscription:', error);
      toast.error('Failed to resume streaming');
    }
  }, [data, loading, threadId, startStreaming, setPendingToolCall, snap.messages]);

  // Reset hasResumed when threadId changes
  useEffect(() => {
    hasResumed.current = false;
  }, [threadId]);
}
