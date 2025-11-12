import { useState, useCallback } from "react";
import { useSnapshot } from "valtio";
import toast from "react-hot-toast";
import { aiAgentState } from "@/lib/state/aiAgentState";
import { supabase } from "@/lib/supabase/client";
import { createSubscription } from "@/lib/realtime";
import { parseJsonbRow } from "@/lib/realtime/config";
import { graphqlClient } from "@/lib/graphql/client";
import { CreateMessageDocument, GetMessagesDocument } from "@/types/graphql";
import type { ContentBlock } from "@/types/agent";

export interface SendMessageOptions {
  onToolCall?: (toolCall: {
    toolCallId: string;
    toolName: string;
    toolInput: any;
  }) => void;
}

export function useSendMessage(threadId: string, options?: SendMessageOptions) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [sseConnection, setSseConnection] = useState<EventSource | null>(null);
  const snap = useSnapshot(aiAgentState);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        toast.error("Message cannot be empty");
        return;
      }

      try {
        setIsStreaming(true);
        aiAgentState.isStreaming = true;
        aiAgentState.hasStreamStarted = false;

        // Generate idempotency key for this request (industry standard practice)
        const idempotencyKey = crypto.randomUUID();

        // Send message to backend using GraphQL
        const result = await graphqlClient.mutation(CreateMessageDocument, {
          input: {
            threadId,
            role: "user",
            content: text,
            // Note: GraphQL mutation doesn't support contextReferences or idempotency-key yet
            // These features will need to be added to the GraphQL schema if needed
          },
        });

        if (result.error) {
          throw new Error(result.error.message);
        }

        const resource = result.data?.createMessage;
        if (!resource) {
          throw new Error("No message returned from server");
        }

        // MVU F1.1: Extract requestId from response for request-based streaming
        const requestId = resource.requestId;
        const messageId = resource.id;

        if (!requestId) {
          throw new Error("No requestId in response");
        }

        // Store for recovery and approval
        localStorage.setItem(`thread-${threadId}-activeRequest`, requestId);
        localStorage.setItem(`request-${requestId}-messageId`, messageId);

        // Track request ID in state for approval handlers
        aiAgentState.currentRequestId = requestId;

        // Add user message with real ID from database
        const userMessage = {
          id: resource.id,
          role: "user" as const,
          content: [{ type: 'text' as const, text }] as ContentBlock[], // Use ContentBlock[] for type consistency
          toolCalls: [],
          timestamp: new Date(resource.timestamp || new Date().toISOString()),
          tokensUsed: 0, // User messages don't have token costs
          idempotencyKey, // Track idempotency key for deduplication
        };

        // Check if message already exists (prevent duplicates)
        const messageExists = aiAgentState.messages.some(
          (m) => m.id === userMessage.id
        );
        if (!messageExists) {
          aiAgentState.messages.push(userMessage);
        }

        // Add optimistic assistant message (streaming state)
        const tempAssistantId = crypto.randomUUID();
        const assistantIdempotencyKey = crypto.randomUUID(); // Separate key for assistant message
        const optimisticAssistantMessage = {
          id: tempAssistantId,
          role: "assistant" as const,
          content: [{ type: 'text' as const, text: '' }] as ContentBlock[], // Initialize with empty text block for streaming
          events: [],
          timestamp: new Date(),
          isStreaming: true,
          isRequestLoading: true,
          tokensUsed: 0,
          idempotencyKey: assistantIdempotencyKey, // Track for deduplication
          requestId: requestId, // Track which request this message responds to (for matching pending tool calls)
        } as any;

        // Check if this optimistic message already exists (prevent duplicates)
        const optimisticExists = aiAgentState.messages.some(
          (m) => m.id === tempAssistantId
        );
        if (!optimisticExists) {
          aiAgentState.messages.push(optimisticAssistantMessage);
        }
        const optimisticAssistantIndex = aiAgentState.messages.length - 1;

        // MVU F1.2: Stream by requestId using Supabase Real-time
        // Subscribe to agent_execution_events for incremental updates

        // Helper function to process events (defined outside try-catch for strict mode compliance)
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
              // Update the optimistic assistant message with streamed content
              if (
                optimisticAssistantIndex >= 0 &&
                aiAgentState.messages[optimisticAssistantIndex]
              ) {
                const msg = aiAgentState.messages[optimisticAssistantIndex];
                // Append to last text block in content (Valtio proxy ensures reactivity)
                if (Array.isArray(msg.content) && msg.content.length > 0) {
                  const lastIndex = msg.content.length - 1;
                  if (msg.content[lastIndex].type === 'text') {
                    msg.content[lastIndex].text += eventData.content;
                  }
                }
              }
              break;
            case "tool_call":
              // Update optimistic message ID to real database ID (for approval banner matching)
              if (
                optimisticAssistantIndex >= 0 &&
                aiAgentState.messages[optimisticAssistantIndex] &&
                eventData.messageId
              ) {
                aiAgentState.messages[optimisticAssistantIndex].id =
                  eventData.messageId;
              }

              if (options?.onToolCall) {
                options.onToolCall({
                  toolCallId: eventData.toolCallId,
                  toolName: eventData.toolName,
                  toolInput: eventData.toolInput,
                  messageId: eventData.messageId, // Include responseMessageId for matching
                });
              }
              break;
            case "completion":
              // Update optimistic assistant message with final state
              if (
                optimisticAssistantIndex >= 0 &&
                aiAgentState.messages[optimisticAssistantIndex]
              ) {
                const optimisticMsg =
                  aiAgentState.messages[optimisticAssistantIndex];
                // Update with actual message ID from database
                optimisticMsg.id = eventData.messageId;
                // Mark as no longer streaming (content already contains final text)
                optimisticMsg.isStreaming = false;
                optimisticMsg.isRequestLoading = false;
                // Set token count
                optimisticMsg.tokensUsed = eventData.totalTokens || 0;
              }
              aiAgentState.isStreaming = false;
              aiAgentState.hasStreamStarted = false;
              setIsStreaming(false);
              setSseConnection(null);
              // Unsubscribe when complete (only if channel exists - null during replay)
              if (channel) {
                supabase.removeChannel(channel);
              }
              localStorage.removeItem(`thread-${threadId}-activeRequest`);
              aiAgentState.currentRequestId = null;
              return;
            case "error":
              throw new Error(eventData.message);
          }
        };

        try {
          // First: Fetch all existing events for replay (late connection support)
          const { data: existingEvents, error: fetchError } = (await supabase
            .from("agent_execution_events")
            .select("*")
            .eq("request_id", requestId)
            .order("created_at", { ascending: true })) as any;

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
          const subscription = createSubscription('agent_execution_events')
            .channel(`agent-events-${requestId}`)
            .filter({ request_id: requestId })
            .on('INSERT', (payload) => {
              // JSONB fields are auto-parsed by builder (data is already an object)
              const eventData = {
                ...payload.new.data,
                __requestId: payload.new.requestId, // camelCase from builder
              };
              processEvent(payload.new.type, eventData, subscription);
            })
            .subscribe();

          // Store subscription reference for cleanup
          setSseConnection(subscription as any);
        } catch (error) {
          // MVU F2.4: Enhanced error handling - check if request actually completed
          try {
            const status = await checkRequestStatus(requestId);

            if (status.status === "completed") {
              // Stream died but request finished

              if (status.responseMessageId) {
                // Load the response message using GraphQL
                const result = await graphqlClient.query(GetMessagesDocument, {
                  threadId,
                  limit: 100, // Load recent messages to find the response
                });

                if (result.data?.messages) {
                  const responseMsg = result.data.messages.find(
                    (m) => m.id === status.responseMessageId
                  );

                  if (responseMsg) {
                    // Update optimistic message with real response
                    if (
                      optimisticAssistantIndex >= 0 &&
                      aiAgentState.messages[optimisticAssistantIndex]
                    ) {
                      aiAgentState.messages[optimisticAssistantIndex] = {
                        ...responseMsg,
                        timestamp: new Date(responseMsg.timestamp),
                        isStreaming: false,
                        isRequestLoading: false,
                      };
                    }
                  }
                }
              }

              localStorage.removeItem(`thread-${threadId}-activeRequest`);
              aiAgentState.currentRequestId = null;
              aiAgentState.isStreaming = false;
              aiAgentState.hasStreamStarted = false;
              setIsStreaming(false);
              setSseConnection(null);
              toast.success("Request completed successfully");
              return;
            } else if (status.status === "in_progress") {
              // Still processing - offer reconnect

              if (
                optimisticAssistantIndex >= 0 &&
                aiAgentState.messages[optimisticAssistantIndex]
              ) {
                aiAgentState.messages[optimisticAssistantIndex].content = [
                  { type: 'text' as const, text: "Connection lost. Attempting to reconnect..." }
                ] as ContentBlock[];
              }

              aiAgentState.currentRequestId = null;
              aiAgentState.isStreaming = false;
              aiAgentState.hasStreamStarted = false;
              setIsStreaming(false);
              setSseConnection(null);

              toast.error("Connection lost. Click to reconnect.", {
                duration: Infinity, // Keep visible until user dismisses
              });
              return;
            } else if (status.status === "failed") {
              // Actually failed

              if (
                optimisticAssistantIndex >= 0 &&
                aiAgentState.messages[optimisticAssistantIndex]
              ) {
                aiAgentState.messages[optimisticAssistantIndex].content = [
                  { type: 'text' as const, text: "⚠️ Error: " + (status.results?.error || "Request failed") }
                ] as ContentBlock[];
              }

              localStorage.removeItem(`thread-${threadId}-activeRequest`);
              aiAgentState.currentRequestId = null;
              aiAgentState.isStreaming = false;
              aiAgentState.hasStreamStarted = false;
              setIsStreaming(false);
              setSseConnection(null);
              toast.error(
                `Request failed: ${status.results?.error || "Unknown error"}`
              );
              return;
            }
          } catch (statusCheckError) {
            // Network error - fallback to generic error
          }

          // Default error handling
          if (
            optimisticAssistantIndex >= 0 &&
            aiAgentState.messages[optimisticAssistantIndex]
          ) {
            aiAgentState.messages[optimisticAssistantIndex].isStreaming = false;
            aiAgentState.messages[optimisticAssistantIndex].isRequestLoading =
              false;
            if (!aiAgentState.messages[optimisticAssistantIndex].content ||
                (Array.isArray(aiAgentState.messages[optimisticAssistantIndex].content) &&
                 aiAgentState.messages[optimisticAssistantIndex].content.length === 0)) {
              aiAgentState.messages[optimisticAssistantIndex].content = [
                { type: 'text' as const, text: "⚠️ Error: " + (error instanceof Error ? error.message : "Streaming error") }
              ] as ContentBlock[];
            }
          }
          aiAgentState.currentRequestId = null;
          aiAgentState.isStreaming = false;
          aiAgentState.hasStreamStarted = false;
          toast.error(
            error instanceof Error ? error.message : "Streaming error"
          );
          setIsStreaming(false);
          setSseConnection(null);
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to send message"
        );

        // Remove only messages that were added (user message not added yet if error before POST)
        // Just remove the last message if it's the optimistic assistant
        if (aiAgentState.messages.length > 0) {
          const lastMessage =
            aiAgentState.messages[aiAgentState.messages.length - 1];
          if (lastMessage.isStreaming) {
            aiAgentState.messages.pop();
          }
        }
        aiAgentState.currentRequestId = null;
        aiAgentState.isStreaming = false;
        aiAgentState.hasStreamStarted = false;
        setIsStreaming(false);
      }
    },
    [threadId, snap.contextReferences, options, supabase]
  );

  const stopStream = useCallback(() => {
    if (sseConnection) {
      sseConnection.close();
      setSseConnection(null);
      setIsStreaming(false);
      toast.success("Stream stopped");
    }
  }, [sseConnection]);

  return {
    sendMessage,
    isStreaming,
    stopStream,
  };
}
