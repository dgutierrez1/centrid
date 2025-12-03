import { useMemo } from "react";
import { useSnapshot } from "valtio";
import { aiAgentState } from "@/lib/state/aiAgentState";
import { isToolUseBlock } from "@/lib/utils/content-block-guards";

/**
 * Stateless hook: derives pending tool call from message content blocks
 *
 * **Architecture**: Frontend derives UI state from backend data (messages)
 * - No queries needed (real-time events already populate messages)
 * - No local state (derived from existing data)
 * - No useEffect (pure derivation)
 *
 * **How it works**:
 * 1. Scan messages for tool blocks with status='pending'
 * 2. Return first pending tool found
 * 3. Re-compute when messages change (Valtio reactivity)
 *
 * **Why this is better than querying**:
 * - Hot path: tool_call event adds block to streamingBuffer → instantly visible
 * - Cold path: hydration loads messages with pending tools → instantly visible
 * - No race conditions (single source of truth: messages)
 * - No unnecessary database queries during execution
 */
export function usePendingToolCall() {
  const snap = useSnapshot(aiAgentState);

  return useMemo(() => {
    // Scan messages for pending tool blocks
    for (const message of snap.messages) {
      if (message.role !== "assistant") continue;

      // Check both streaming buffer (during execution) and content (after completion)
      const blocks = message.streamingBuffer || message.content || [];

      for (const block of blocks) {
        if (isToolUseBlock(block) && block.status === "pending") {
          return {
            toolCallId: block.id,
            toolName: block.name,
            toolInput: block.input,
            responseMessageId: message.id,
          };
        }
      }
    }

    // No pending tools found
    return null;
  }, [snap.messages]);
}
