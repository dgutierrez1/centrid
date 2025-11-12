import { useCallback } from 'react'
import { aiAgentState } from '@/lib/state/aiAgentState'
import { useGraphQLMutation } from '@/lib/graphql/useGraphQLMutation'
import { UpdateFileDocument } from '@/types/graphql'

export function useUpdateFile() {
  const { mutate, isLoading } = useGraphQLMutation({
    mutation: UpdateFileDocument,
    optimisticUpdate: (permanentId, input) => {
      // Store previous content for rollback
      const previousContent = aiAgentState.currentFile?.content

      // Optimistic update
      if (aiAgentState.currentFile) {
        aiAgentState.currentFile.content = input?.content || ''
      }

      return { previousContent }
    },
    onSuccess: ({ previousContent }, data) => {
      // Update state with server response
      if (aiAgentState.currentFile && data.updateFile) {
        aiAgentState.currentFile.content = data.updateFile.content || aiAgentState.currentFile.content
        aiAgentState.currentFile.version = data.updateFile.version
      }
    },
    onError: ({ previousContent }) => {
      // Rollback optimistic update
      if (aiAgentState.currentFile && previousContent !== undefined) {
        aiAgentState.currentFile.content = previousContent
      }
    },
    successMessage: () => 'File saved',
    errorMessage: (error) => `Failed to update file: ${error}`,
  })

  const updateFile = useCallback(async (fileId: string, content: string) => {
    const result = await mutate({
      id: fileId,
      content,
      version: aiAgentState.currentFile?.version,
    })

    if (!result.success) {
      throw new Error(result.error)
    }

    return result.data?.updateFile
  }, [mutate])

  return {
    updateFile,
    isLoading,
    isSaving: isLoading,
  }
}
