import React from 'react'
import { ToolCallApproval } from '@centrid/ui/features/ai-agent-system'
import { useApproveToolCall } from '@/lib/hooks/useApproveToolCall'

interface ToolCallApprovalContainerProps {
  requestId: string
  toolCallId: string
  toolName: string
  toolInput: any
  onApprove?: () => void
  onReject?: () => void
}

export function ToolCallApprovalContainer({
  requestId,
  toolCallId,
  toolName,
  toolInput,
  onApprove,
  onReject,
}: ToolCallApprovalContainerProps) {
  const { approve, reject, isLoading } = useApproveToolCall()

  const handleApprove = async () => {
    try {
      await approve({ id: toolCallId })
      onApprove?.()
    } catch (error) {
      // Error already handled by hook with toast
      console.error('Approval failed:', error)
    }
  }

  const handleReject = async () => {
    try {
      await reject({ id: toolCallId, reason: 'User rejected' })
      onReject?.()
    } catch (error) {
      // Error already handled by hook with toast
      console.error('Rejection failed:', error)
    }
  }

  // Generate preview content based on tool
  let previewContent = ''
  switch (toolName) {
    case 'write_file':
      previewContent = `Path: ${toolInput?.path || ''}\n\nContent:\n${toolInput?.content || ''}`
      break
    case 'create_branch':
      previewContent = `Title: ${toolInput?.title || ''}\n\nContext Files:\n${toolInput?.contextFiles?.join('\n') || 'None'}`
      break
    default:
      previewContent = JSON.stringify(toolInput, null, 2)
  }

  return (
    <ToolCallApproval
      toolName={toolName}
      toolInput={toolInput}
      previewContent={previewContent}
      isLoading={isLoading}
      onApprove={handleApprove}
      onReject={handleReject}
    />
  )
}
