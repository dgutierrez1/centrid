import { useGraphQLCommand } from '@/lib/graphql/useGraphQLCommand'
import { ApproveToolCallDocument, RejectToolCallDocument } from '@/types/graphql'

/**
 * Hook for approving or rejecting tool calls
 *
 * Usage:
 * ```typescript
 * const { approve, reject, isLoading } = useApproveToolCall()
 *
 * await approve({ id: toolCallId })
 * await reject({ id: toolCallId, reason: 'User rejected' })
 * ```
 */
export function useApproveToolCall() {
  return useGraphQLCommand({
    commands: {
      approve: {
        mutation: ApproveToolCallDocument,
        successMessage: 'Tool call approved',
      },
      reject: {
        mutation: RejectToolCallDocument,
        successMessage: 'Tool call rejected',
      },
    },
    errorMessage: (error) => `Failed to process tool call: ${error}`,
  })
}
