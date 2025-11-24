import { useCallback } from "react";
import { useSnapshot } from "valtio";
import toast from "react-hot-toast";
import { aiAgentState, aiAgentActions } from "@/lib/state/aiAgentState";
import { graphqlClient } from "@/lib/graphql/client";
import { CreateMessageDocument, GetMessagesDocument } from "@/types/graphql";
import type { ContentBlock } from "@/types/graphql";
import { useAgentStreaming } from "./useAgentStreaming";
import { parseJsonbRow } from "@/lib/realtime/config";

export interface SendMessageOptions {
  onToolCall?: (toolCall: {
    toolCallId: string;
    toolName: string;
    toolInput: any;
    messageId?: string;
  }) => void;
}

export function useSendMessage(threadId: string, options?: SendMessageOptions) {
  const { startStreaming, stopStreaming, isStreaming } = useAgentStreaming();
  const snap = useSnapshot(aiAgentState);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        toast.error("Message cannot be empty");
        return;
      }

      try {
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
        const responseThreadId = resource.threadId;

        if (!requestId) {
          throw new Error("No requestId in response");
        }

        // Store for recovery and approval
        localStorage.setItem(`thread-${threadId}-activeRequest`, requestId);
        localStorage.setItem(`request-${requestId}-messageId`, messageId);

        // Track request ID in state for approval handlers
        aiAgentState.currentRequestId = requestId;

        // FIX: If we're on a new thread (currentThread is null), update it with real thread
        // This enables the messages real-time subscription in AIAgentRealtimeProvider
        if (!aiAgentState.currentThread && responseThreadId) {
          aiAgentActions.setCurrentThread({
            id: responseThreadId,
            title: "New Thread", // Will be updated by real-time subscription
            parentThreadId: null,
            depth: 0,
            artifactCount: 0,
            lastActivity: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }

        // Add user message with real ID from database
        const userMessage = {
          id: resource.id,
          role: "user" as const,
          content: [{ type: "text" as const, text }] as ContentBlock[], // Use ContentBlock[] for type consistency
          toolCalls: [],
          timestamp: resource.timestamp || new Date().toISOString(), // ✅ Keep as ISO string
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
          content: [{ type: "text" as const, text: "" }] as ContentBlock[], // Initialize with empty text block for streaming
          events: [],
          timestamp: new Date().toISOString(), // ✅ ISO string
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

        // Start streaming agent response using reusable hook
        startStreaming(requestId, {
          optimisticMessageIndex: optimisticAssistantIndex,
          threadId,
          onToolCall: options?.onToolCall,
          onError: (error) => {
            // Error handling - update optimistic message
            if (
              optimisticAssistantIndex >= 0 &&
              aiAgentState.messages[optimisticAssistantIndex]
            ) {
              aiAgentState.messages[optimisticAssistantIndex].isStreaming =
                false;
              aiAgentState.messages[optimisticAssistantIndex].isRequestLoading =
                false;
              if (
                !aiAgentState.messages[optimisticAssistantIndex].content ||
                (Array.isArray(
                  aiAgentState.messages[optimisticAssistantIndex].content
                ) &&
                  aiAgentState.messages[optimisticAssistantIndex].content
                    .length === 0)
              ) {
                aiAgentState.messages[optimisticAssistantIndex].content = [
                  { type: "text" as const, text: "⚠️ Error: " + error.message },
                ] as ContentBlock[];
              }
            }
            toast.error(error.message);
          },
        });
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
      }
    },
    [threadId, snap.contextReferences, options, startStreaming]
  );

  return {
    sendMessage,
    isStreaming,
    stopStream: stopStreaming,
  };
}

// Helper function for checking request status (not currently used, but kept for future recovery features)
async function checkRequestStatus(requestId: string) {
  // This function would query the agent_requests table to check request status
  // Implementation depends on GraphQL schema
  return { status: "unknown", responseMessageId: null, results: null };
}
