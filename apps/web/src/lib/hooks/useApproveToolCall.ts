import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api/client'

export function useApproveToolCall() {
  const [isLoading, setIsLoading] = useState(false)

  const approveTool = useCallback(
    async (toolCallId: string, approved: boolean, reason?: string, requestId?: string) => {
      setIsLoading(true)

      try {
        console.log('[useApproveToolCall] Sending approval request with:', {
          requestId,
          toolCallId,
          approved,
          reason,
        })

        // Send approval to backend using current API endpoint
        const response = await api.post<{
          data: {
            success: boolean
            toolCallId: string
            approved: boolean
          }
        }>('/api/agent/approve-tool', {
          toolCallId,
          approved,
          reason,
        })

        const result = response.data

        if (result.success) {
          const message = approved ? 'Tool call approved' : 'Tool call rejected'
          toast.success(message)
        }

        return result
      } catch (error) {
        console.error('Error approving tool call:', error)
        toast.error(
          error instanceof Error ? error.message : 'Failed to approve tool call'
        )
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  return {
    approveTool,
    isLoading,
  }
}
