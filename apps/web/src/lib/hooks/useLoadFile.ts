import { useEffect } from 'react'
import { useSnapshot } from 'valtio'
import { filesystemState, selectFile, clearFileSelection, updateFile } from '@/lib/state/filesystem'
import { useGraphQLQuery } from '@/lib/graphql/useGraphQLQuery'
import { GetFileDocument } from '@/types/graphql'

export function useLoadFile(fileId: string | null) {
  const filesystemSnap = useSnapshot(filesystemState)

  // Select file immediately when fileId changes (optimistic selection for instant UX)
  useEffect(() => {
    if (fileId) {
      // Always call selectFile - it's idempotent and ensures selectedFile stays in sync
      // This prevents race conditions with Valtio snapshots captured at render time
      selectFile(fileId)
    }
  }, [fileId])

  const { loading, error, refetch } = useGraphQLQuery({
    query: GetFileDocument,
    variables: fileId ? { id: fileId } : undefined,
    enabled: !!fileId, // Only query when fileId exists
    syncToState: (data) => {
      if (data?.file) {
        // Update filesystem state with loaded file data (uses upsert - adds if not exists)
        updateFile(fileId!, data.file)
        // File is already selected by the effect above, just ensure state is fresh
        selectFile(fileId!)
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
