import { useState, useCallback } from "react";
import { aiAgentState } from "@/lib/state/aiAgentState";
import { createSubscription } from "@/lib/realtime/builder";
import { supabase } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface AgentStreamingOptions {
  optimisticMessageIndex: number;
  threadId?: string;
  onToolCall?: (toolCall: {
    toolCallId: string;
    toolName: string;
    toolInput: any;
    responseMessageId?: string;
  }) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Reusable hook for streaming agent responses via agent_execution_events
 *
 * EVENT-DRIVEN ARCHITECTURE:
 * This hook subscribes to agent_execution_events table for real-time streaming updates.
 * It does NOT subscribe to message UPDATE events - messages table is only for final state.
 *
 * Event Processing:
 * - content_block_delta: Updates optimistic message with accumulated text (prevents gaps)
 * - tool_call: Adds tool_use block and triggers approval UI
 * - tool_result_complete: Adds tool_result block after auto-execution
 * - message_complete: Replaces entire message with final database state
 * - completion: Cleanup and unsubscribe
 * - error: Error handling
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
  const [subscription, setSubscription] = useState<RealtimeChannel | null>(
    null
  );
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);

  const startStreaming = useCallback(
    async (
      requestId: string,
      userId: string,
      options: AgentStreamingOptions
    ) => {
      // Prevent duplicate subscriptions
      if (activeRequestId === requestId) {
        return;
      }

      setActiveRequestId(requestId);

      const {
        optimisticMessageIndex,
        threadId,
        onToolCall,
        onComplete,
        onError,
      } = options;

      aiAgentState.isStreaming = true;
      aiAgentState.hasStreamStarted = false;
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
          case "context_ready":
            // Context loaded, ready to process
            break;
          case "text_chunk":
          case "content_block_delta":
            // Update the optimistic assistant message with streamed content
            // NEW: Use accumulatedText for full text replacement (prevents gaps from dropped events)
            if (
              optimisticMessageIndex >= 0 &&
              aiAgentState.messages[optimisticMessageIndex]
            ) {
              const msg = aiAgentState.messages[optimisticMessageIndex];
              const fullText =
                eventData.accumulatedText ||
                eventData.content ||
                eventData.delta;

              // Replace or append to last text block in content (Valtio proxy ensures reactivity)
              if (Array.isArray(msg.content)) {
                if (
                  msg.content.length > 0 &&
                  msg.content[msg.content.length - 1].type === "text"
                ) {
                  // Update existing text block with full accumulated text
                  msg.content[msg.content.length - 1].text = fullText;
                } else {
                  // Create new text block
                  msg.content.push({
                    type: "text",
                    text: fullText,
                  });
                }
              }
            }
            break;
          case "tool_call":
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
                  (block) =>
                    block.type === "tool_use" &&
                    block.id === eventData.toolCallId
                );

                if (!hasToolBlock) {
                  msg.content.push({
                    type: "tool_use",
                    id: eventData.toolCallId,
                    name: eventData.toolName,
                    input: eventData.toolInput,
                    status: "pending",
                  });
                }
              }

              // Mark as no longer streaming (message is now persisted)
              msg.isStreaming = false;
              if ("isRequestLoading" in msg) {
                msg.isRequestLoading = false;
              }
            }

            if (onToolCall) {
              onToolCall({
                toolCallId: eventData.toolCallId,
                toolName: eventData.toolName,
                toolInput: eventData.toolInput,
                responseMessageId: eventData.responseMessageId,
              });
            }
            break;
          case "tool_result_complete":
            // Auto-executed tool completed - add tool_result block to message
            if (
              optimisticMessageIndex >= 0 &&
              aiAgentState.messages[optimisticMessageIndex]
            ) {
              const msg = aiAgentState.messages[optimisticMessageIndex];

              // Update message ID if provided
              if (eventData.messageId) {
                msg.id = eventData.messageId;
              }

              // Add tool_result content block
              if (Array.isArray(msg.content)) {
                // Check if tool_result already exists (avoid duplicates)
                const hasToolResult = msg.content.some(
                  (block) =>
                    block.type === "tool_result" &&
                    block.tool_use_id === eventData.toolCallId
                );

                if (!hasToolResult) {
                  msg.content.push({
                    type: "tool_result",
                    tool_use_id: eventData.toolCallId,
                    content:
                      typeof eventData.result === "string"
                        ? eventData.result
                        : JSON.stringify(eventData.result),
                  });
                }
              }
            }
            break;
          case "message_complete":
            // Final message state - replace with complete content from database
            if (
              optimisticMessageIndex >= 0 &&
              aiAgentState.messages[optimisticMessageIndex]
            ) {
              const msg = aiAgentState.messages[optimisticMessageIndex];
              msg.id = eventData.messageId;
              msg.content = eventData.content || [];
              msg.tokensUsed = eventData.tokensUsed || 0;
              msg.isStreaming = false;
              if ("isRequestLoading" in msg) {
                msg.isRequestLoading = false;
              }
            }

            // Cleanup
            aiAgentState.isStreaming = false;
            aiAgentState.hasStreamStarted = false;
            setSubscription(null);
            setActiveRequestId(null);
            aiAgentState.currentRequestId = null;

            if (channel) {
              supabase.removeChannel(channel);
            }
            if (onComplete) {
              onComplete();
            }
            return;

          case "completion":
            // Update token count only - message_complete handles cleanup
            if (
              optimisticMessageIndex >= 0 &&
              aiAgentState.messages[optimisticMessageIndex]
            ) {
              const msg = aiAgentState.messages[optimisticMessageIndex];
              if (eventData.messageId) {
                msg.id = eventData.messageId;
              }
              msg.tokensUsed = eventData.totalTokens || 0;
            }
            break;
          case "error":
            const error = new Error(eventData.message);
            if (onError) {
              onError(error);
            } else {
              throw error;
            }
        }
      };

      try {
        // Subscribe to realtime events using the reusable builder
        // Builder handles: channel creation, filter formatting, JSONB parsing, key transformation
        const channel = createSubscription("agent_execution_events")
          .filter({ request_id: requestId } as any) // Filter uses snake_case (database column name)
          .channel(`agent-events-${requestId}-${Date.now()}`)
          .on("INSERT", (payload) => {
            const event = payload.new;
            if (!event) return;

            // Builder already parsed JSONB 'data' field and transformed keys to camelCase
            processEvent(event.type, event.data, channel);
          })
          .subscribe();

        setSubscription(channel);
      } catch (error) {
        console.error("[AgentStreaming] Error in startStreaming:", error);
        setActiveRequestId(null); // Clear active request tracking
        aiAgentState.currentRequestId = null;
        aiAgentState.isStreaming = false;
        aiAgentState.hasStreamStarted = false;
        if (onError) {
          onError(
            error instanceof Error ? error : new Error("Streaming error")
          );
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
