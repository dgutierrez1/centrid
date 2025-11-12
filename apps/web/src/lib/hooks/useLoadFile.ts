import { useEffect } from 'react'
import { aiAgentState } from '@/lib/state/aiAgentState'
import { useGraphQLQuery } from '@/lib/graphql/useGraphQLQuery'
import { GetFileDocument } from '@/types/graphql'

export function useLoadFile(fileId: string | null) {
  const { loading, error, refetch } = useGraphQLQuery({
    query: GetFileDocument,
    variables: fileId ? { id: fileId } : undefined,
    syncToState: (data) => {
      if (data?.file) {
        // Update state with loaded file
        aiAgentState.currentFile = {
          id: data.file.id || fileId!,
          name: data.file.name || 'Untitled',
          content: data.file.content || '',
          version: data.file.version || undefined,
          provenance: null, // GraphQL schema doesn't include provenance yet
        }
      }
    },
    requestPolicy: !fileId ? undefined : 'cache-and-network', // Skip query if no fileId
  })

  // Clear current file when fileId is null
  useEffect(() => {
    if (!fileId) {
      aiAgentState.currentFile = null
    }
  }, [fileId])

  return {
    file: aiAgentState.currentFile,
    isLoading: loading,
    error: error ? String(error) : null,
    reload: refetch,
  }
}
