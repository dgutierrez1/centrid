import { useState, useCallback } from 'react';
import { aiAgentState } from '@/lib/state/aiAgentState';
import { supabase } from '@/lib/supabase/client';
import { createSubscription } from '@/lib/realtime';
import { parseJsonbRow } from '@/lib/realtime/config';

export interface AgentStreamingOptions {
  optimisticMessageIndex: number;
  threadId?: string;
  onToolCall?: (toolCall: {
    toolCallId: string;
    toolName: string;
    toolInput: any;
    messageId?: string;
  }) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Reusable hook for streaming agent responses via agent_execution_events
 *
 * Handles:
 * - Replaying existing events (late connection support)
 * - Subscribing to new events in real-time
 * - Streaming text chunks to optimistic message
 * - Handling tool calls, completion, and errors
 *
 * @example
 * const { startStreaming, stopStreaming, isStreaming } = useAgentStreaming();
 *
 * // After creating a request:
 * startStreaming(requestId, {
 *   optimisticMessageIndex: 1,
 *   threadId: 'thread-123',
 *   onToolCall: (toolCall) => setPendingToolCall(toolCall),
 * });
 */
export function useAgentStreaming() {
  const [subscription, setSubscription] = useState<any | null>(null);

  const startStreaming = useCallback(
    async (requestId: string, options: AgentStreamingOptions) => {
      const { optimisticMessageIndex, threadId, onToolCall, onComplete, onError } = options;

      aiAgentState.isStreaming = true;
      aiAgentState.hasStreamStarted = false;

      // Store for recovery if needed
      if (threadId) {
        localStorage.setItem(`thread-${threadId}-activeRequest`, requestId);
        localStorage.setItem(`request-${requestId}-messageId`,
          aiAgentState.messages[optimisticMessageIndex]?.id || ''
        );
      }

      // Track request ID in state for approval handlers
      aiAgentState.currentRequestId = requestId;

      // Helper function to process events
      const processEvent = (
        eventType: string,
        eventData: any,
        channel: any
      ) => {
        // Mark stream as started on first event
        if (!aiAgentState.hasStreamStarted) {
          aiAgentState.hasStreamStarted = true;
        }

        switch (eventType) {
          case 'context_ready':
            // Context loaded, ready to process
            break;
          case 'text_chunk':
            // Update the optimistic assistant message with streamed content
            if (
              optimisticMessageIndex >= 0 &&
              aiAgentState.messages[optimisticMessageIndex]
            ) {
              const msg = aiAgentState.messages[optimisticMessageIndex];
              // Append to last text block in content (Valtio proxy ensures reactivity)
              if (Array.isArray(msg.content) && msg.content.length > 0) {
                const lastIndex = msg.content.length - 1;
                if (msg.content[lastIndex].type === 'text') {
                  msg.content[lastIndex].text += eventData.content;
                }
              }
            }
            break;
          case 'tool_call':
            // FIX: Update optimistic message with real database ID + add tool_use content block
            if (
              optimisticMessageIndex >= 0 &&
              aiAgentState.messages[optimisticMessageIndex]
            ) {
              const msg = aiAgentState.messages[optimisticMessageIndex];

              // Update ID to real database ID (from backend)
              if (eventData.messageId) {
                msg.id = eventData.messageId;
              }

              // Add tool_use content block with pending status
              // Backend creates message with this block, but we may not have it in optimistic message yet
              if (Array.isArray(msg.content)) {
                // Check if tool_use block already exists (avoid duplicates)
                const hasToolBlock = msg.content.some(
                  (block) => block.type === 'tool_use' && block.id === eventData.toolCallId
                );

                if (!hasToolBlock) {
                  msg.content.push({
                    type: 'tool_use',
                    id: eventData.toolCallId,
                    name: eventData.toolName,
                    input: eventData.toolInput,
                    status: 'pending',
                  });
                }
              }

              // Mark as no longer streaming (message is now persisted)
              msg.isStreaming = false;
              if ('isRequestLoading' in msg) {
                msg.isRequestLoading = false;
              }
            }

            if (onToolCall) {
              onToolCall({
                toolCallId: eventData.toolCallId,
                toolName: eventData.toolName,
                toolInput: eventData.toolInput,
                messageId: eventData.messageId,
              });
            }
            break;
          case 'completion':
            // Update optimistic assistant message with final state
            if (
              optimisticMessageIndex >= 0 &&
              aiAgentState.messages[optimisticMessageIndex]
            ) {
              const optimisticMsg =
                aiAgentState.messages[optimisticMessageIndex];
              // Update with actual message ID from database (only if provided)
              if (eventData.messageId) {
                optimisticMsg.id = eventData.messageId;
              }
              // Mark as no longer streaming
              optimisticMsg.isStreaming = false;
              if ('isRequestLoading' in optimisticMsg) {
                optimisticMsg.isRequestLoading = false;
              }
              // Set token count
              optimisticMsg.tokensUsed = eventData.totalTokens || 0;
            }
            aiAgentState.isStreaming = false;
            aiAgentState.hasStreamStarted = false;
            setSubscription(null);
            // Unsubscribe when complete (only if channel exists - null during replay)
            if (channel) {
              supabase.removeChannel(channel);
            }
            if (threadId) {
              localStorage.removeItem(`thread-${threadId}-activeRequest`);
            }
            aiAgentState.currentRequestId = null;

            if (onComplete) {
              onComplete();
            }
            return;
          case 'error':
            const error = new Error(eventData.message);
            if (onError) {
              onError(error);
            } else {
              throw error;
            }
        }
      };

      try {
        // First: Fetch all existing events for replay (late connection support)
        const { data: existingEvents } = (await supabase
          .from('agent_execution_events')
          .select('*')
          .eq('request_id', requestId)
          .order('created_at', { ascending: true })) as any;

        if (existingEvents && existingEvents.length > 0) {
          // Process existing events (auto-parse JSONB via helper)
          for (const event of existingEvents as Array<{
            type: string;
            data: any;
            request_id: string;
          }>) {
            // Parse JSONB fields using helper (handles both string and object)
            const parsedEvent = parseJsonbRow('agent_execution_events', event);
            processEvent(parsedEvent.type, { ...parsedEvent.data, __requestId: parsedEvent.request_id }, null);
          }
        }

        // Second: Subscribe to new events in real-time using reusable pattern
        const sub = createSubscription('agent_execution_events')
          .channel(`agent-events-${requestId}`)
          .filter({ request_id: requestId })
          .on('INSERT', (payload) => {
            // JSONB fields are auto-parsed by builder (data is already an object)
            const eventData = {
              ...payload.new.data,
              __requestId: payload.new.requestId, // camelCase from builder
            };
            processEvent(payload.new.type, eventData, sub);
          })
          .subscribe();

        // Store subscription reference for cleanup
        setSubscription(sub);
      } catch (error) {
        aiAgentState.currentRequestId = null;
        aiAgentState.isStreaming = false;
        aiAgentState.hasStreamStarted = false;
        if (onError) {
          onError(error instanceof Error ? error : new Error('Streaming error'));
        } else {
          throw error;
        }
      }
    },
    []
  );

  const stopStreaming = useCallback(() => {
    if (subscription) {
      supabase.removeChannel(subscription);
      setSubscription(null);
      aiAgentState.isStreaming = false;
      aiAgentState.hasStreamStarted = false;
    }
  }, [subscription]);

  return {
    startStreaming,
    stopStreaming,
    isStreaming: aiAgentState.isStreaming,
  };
}
