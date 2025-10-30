import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { aiAgentState } from '@/lib/state/aiAgentState'
import { supabase } from '@/lib/supabase/client'

export function useUpdateFile() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const updateFile = useCallback(async (fileId: string, content: string) => {
    setIsLoading(true)
    setIsSaving(true)

    // Store previous content for rollback
    const previousContent = aiAgentState.currentFile?.content

    try {
      // Optimistic update
      if (aiAgentState.currentFile) {
        aiAgentState.currentFile.content = content
      }

      // Get auth token
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      // Update file on backend using axios client
      const response = await api.put<{ data: any }>(`/files/${fileId}`, { content })

      const data = response.data

      // Update state with server response
      if (aiAgentState.currentFile) {
        aiAgentState.currentFile.content = data.file.content
        aiAgentState.currentFile.updatedAt = data.file.updatedAt
        aiAgentState.currentFile.lastEdited = data.file.lastEdited
      }

      // Show toast if shadow domain was updated
      if (data.shadowDomainUpdated) {
        toast.success('File saved and indexed')
      } else {
        toast.success('File saved')
      }

      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update file'
      toast.error(message)

      // Rollback optimistic update
      if (aiAgentState.currentFile && previousContent !== undefined) {
        aiAgentState.currentFile.content = previousContent
      }

      throw err
    } finally {
      setIsLoading(false)
      setIsSaving(false)
    }
  }, [])

  return {
    updateFile,
    isLoading,
    isSaving,
  }
}
