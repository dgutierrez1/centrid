import { useCallback } from 'react'
import { filesystemState, updateFile as updateFileInState } from '@/lib/state/filesystem'
import { useGraphQLMutation } from '@/lib/graphql/useGraphQLMutation'
import { UpdateFileDocument } from '@/types/graphql'

export function useUpdateFile() {
  const { mutate, isLoading } = useGraphQLMutation({
    mutation: UpdateFileDocument,
    optimisticUpdate: (permanentId, input) => {
      // Store previous content for rollback
      const previousContent = filesystemState.selectedFile?.content

      // Optimistic update in filesystem state
      if (filesystemState.selectedFile && input?.id) {
        updateFileInState(input.id, { content: input.content || '' })
      }

      return { previousContent, fileId: input?.id }
    },
    onSuccess: ({ previousContent, fileId }, data) => {
      // Update state with server response
      if (fileId && data.updateFile) {
        updateFileInState(fileId, {
          content: data.updateFile.content || undefined,
          version: data.updateFile.version || undefined,
        })
      }
    },
    onError: ({ previousContent, fileId }) => {
      // Rollback optimistic update
      if (fileId && previousContent !== undefined) {
        updateFileInState(fileId, { content: previousContent })
      }
    },
    successMessage: () => 'File saved',
    errorMessage: (error) => `Failed to update file: ${error}`,
  })

  const updateFile = useCallback(async (fileId: string, content: string) => {
    // Read version from filesystem state (single source of truth)
    const file = filesystemState.files.find(f => f.id === fileId)
    const version = file?.version

    const result = await mutate({
      id: fileId,
      content,
      version,
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
