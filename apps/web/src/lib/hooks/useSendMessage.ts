import { useCallback } from "react";
import { useSnapshot } from "valtio";
import toast from "react-hot-toast";
import { aiAgentState, aiAgentActions } from "@/lib/state/aiAgentState";
import { graphqlClient } from "@/lib/graphql/client";
import { CreateMessageDocument } from "@/types/graphql";
import type { ContentBlock } from "@/types/graphql";
import { useAgentStreaming } from "./useAgentStreaming";
import { useAuthContext } from "@/components/providers/AuthProvider";

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
  const { user } = useAuthContext();

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        toast.error("Message cannot be empty");
        return;
      }

      try {
        aiAgentState.isStreaming = true;
        aiAgentState.hasStreamStarted = false;

        // Generate IDs upfront
        const idempotencyKey = crypto.randomUUID();
        const requestId = crypto.randomUUID();
        const tempUserId = crypto.randomUUID();
        const tempAssistantId = crypto.randomUUID();

        // Track request ID in state
        aiAgentState.currentRequestId = requestId;

        // Add optimistic user message
        const userMessage = {
          id: tempUserId,
          threadId,
          role: "user" as const,
          content: [{ type: "text" as const, text }] as ContentBlock[],
          toolCalls: [],
          timestamp: new Date().toISOString(),
          tokensUsed: 0,
          idempotencyKey,
        };
        aiAgentState.messages.push(userMessage);

        // Add optimistic assistant message
        const optimisticAssistantMessage = {
          id: tempAssistantId,
          threadId,
          role: "assistant" as const,
          content: [{ type: "text" as const, text: "" }] as ContentBlock[],
          timestamp: new Date().toISOString(),
          isStreaming: true,
          isRequestLoading: true,
          tokensUsed: 0,
          requestId,
        } as any;
        aiAgentState.messages.push(optimisticAssistantMessage);
        const optimisticAssistantIndex = aiAgentState.messages.length - 1;

        // Start subscription BEFORE sending mutation (guarantees we catch all events)
        startStreaming(requestId, user!.id, {
          optimisticMessageIndex: optimisticAssistantIndex,
          threadId,
          onToolCall: options?.onToolCall,
          onError: (error) => {
            if (aiAgentState.messages[optimisticAssistantIndex]) {
              const msg = aiAgentState.messages[optimisticAssistantIndex];
              msg.isStreaming = false;
              msg.isRequestLoading = false;
              if (!msg.content?.length) {
                msg.content = [
                  { type: "text" as const, text: "⚠️ Error: " + error.message },
                ] as ContentBlock[];
              }
            }
            toast.error(error.message);
          },
        });

        // Now send the mutation (subscription is already listening)
        const result = await graphqlClient.mutation(CreateMessageDocument, {
          input: {
            threadId,
            role: "user",
            content: text,
            idempotencyKey,
            requestId,
          },
        });

        if (result.error) {
          throw new Error(result.error.message);
        }

        const resource = result.data?.createMessage;
        if (!resource) {
          throw new Error("No message returned from server");
        }

        // Update optimistic user message with real ID
        const userMsgIndex = aiAgentState.messages.findIndex(
          (m) => m.id === tempUserId
        );
        if (userMsgIndex >= 0) {
          aiAgentState.messages[userMsgIndex].id = resource.id;
          aiAgentState.messages[userMsgIndex].timestamp =
            resource.timestamp || aiAgentState.messages[userMsgIndex].timestamp;
        }

        // Update current thread if needed
        if (!aiAgentState.currentThread && resource.threadId) {
          aiAgentActions.setCurrentThread({
            id: resource.threadId,
            title: "New Thread",
            parentThreadId: null,
            depth: 0,
            artifactCount: 0,
            lastActivity: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
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
      }
    },
    [threadId, snap.contextReferences, options, startStreaming, user]
  );

  return {
    sendMessage,
    isStreaming,
    stopStream: stopStreaming,
  };
}
