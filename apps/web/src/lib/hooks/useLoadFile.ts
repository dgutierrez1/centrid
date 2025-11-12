import { useEffect } from 'react'
import { useSnapshot } from 'valtio'
import { filesystemState, selectFile, clearFileSelection, updateFile } from '@/lib/state/filesystem'
import { useGraphQLQuery } from '@/lib/graphql/useGraphQLQuery'
import { GetFileDocument } from '@/types/graphql'

export function useLoadFile(fileId: string | null) {
  const filesystemSnap = useSnapshot(filesystemState)

  // Check filesystemState first for optimistically-created files
  useEffect(() => {
    if (fileId) {
      // Look for the file in filesystem state (includes optimistic files)
      // Read snapshot data inside effect - always fresh on each run
      const existingFile = filesystemSnap.files.find(f => f.id === fileId)

      if (existingFile && filesystemSnap.selectedFile?.id !== fileId) {
        // File found in filesystem state - select it immediately
        selectFile(fileId)
      } else if (!existingFile && filesystemSnap.selectedFile?.id !== fileId) {
        // File not found in filesystem state - clear selection
        clearFileSelection()
      }
    }
  }, [fileId])  // Only fileId in deps - snapshot is always fresh when effect runs

  const { loading, error, refetch } = useGraphQLQuery({
    query: GetFileDocument,
    variables: fileId ? { id: fileId } : undefined,
    enabled: !!fileId, // Only query when fileId exists
    syncToState: (data) => {
      if (data?.file) {
        // Update filesystem state with loaded file data
        updateFile(fileId!, data.file)
      }
    },
    requestPolicy: !fileId ? undefined : 'network-only', // Always fetch fresh to prevent stale cache
  })

  // Clear selection when fileId is null
  useEffect(() => {
    if (!fileId) {
      clearFileSelection()
    }
  }, [fileId])

  const computedLoading = loading || (fileId !== null && filesystemSnap.selectedFile?.id !== fileId)

  return {
    file: filesystemSnap.selectedFile,
    // Show loading if query is loading OR if selected file doesn't match requested fileId
    isLoading: computedLoading,
    error: error ? String(error) : null,
    reload: refetch,
  }
}
