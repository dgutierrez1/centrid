import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { aiAgentState } from '@/lib/state/aiAgentState'
import { api } from '@/lib/api/client'

export function useLoadFile(fileId: string | null) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadFile = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch file from backend using unified /api endpoint
      const response = await api.get<{
        data: {
          file: {
            fileId: string
            path: string
            content: string
          }
          provenance: any
        }
      }>(`/files/${id}`)

      const { data } = response

      // Update state
      aiAgentState.currentFile = {
        id: data.file.fileId,
        name: data.file.path.split('/').pop() || 'Untitled',
        content: data.file.content,
        provenance: data.provenance,
      }

      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load file'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load file when fileId changes
  useEffect(() => {
    if (fileId) {
      loadFile(fileId)
    } else {
      aiAgentState.currentFile = null
    }
  }, [fileId, loadFile])

  return {
    file: aiAgentState.currentFile,
    isLoading,
    error,
    reload: () => fileId && loadFile(fileId),
  }
}
