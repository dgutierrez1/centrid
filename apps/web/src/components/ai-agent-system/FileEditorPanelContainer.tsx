import React, { useEffect, useState } from 'react'
import { FileEditorPanel } from '@centrid/ui/features/ai-agent-system'
import { useLoadFile } from '@/lib/hooks/useLoadFile'
import { useUpdateFile } from '@/lib/hooks/useUpdateFile'
import { useDeleteFile } from '@/lib/hooks/useDeleteFile'
import { useNavigateToSource } from '@/lib/hooks/useNavigateToSource'
import type { FileData, Provenance } from '@centrid/ui/features/ai-agent-system'

interface FileEditorPanelContainerProps {
  fileId: string | null
  isOpen: boolean
  onClose: () => void
  onFileDeleted?: () => void
}

export function FileEditorPanelContainer({
  fileId,
  isOpen,
  onClose,
  onFileDeleted,
}: FileEditorPanelContainerProps) {
  const { file, isLoading } = useLoadFile(fileId)
  const { updateFile, isSaving } = useUpdateFile()
  const { deleteFile, isDeleting } = useDeleteFile()
  const { navigateToSource } = useNavigateToSource()
  const [localContent, setLocalContent] = useState('')
  const [fullProvenance, setFullProvenance] = useState<any>(null)
  const [isLoadingProvenance, setIsLoadingProvenance] = useState(false)

  // Sync local content with loaded file
  useEffect(() => {
    if (file) {
      setLocalContent(file.content)
    }
  }, [file])

  // Load full provenance data (T086)
  useEffect(() => {
    if (fileId && isOpen) {
      loadFullProvenance(fileId)
    }
  }, [fileId, isOpen])

  const loadFullProvenance = async (id: string) => {
    setIsLoadingProvenance(true)

    try {
      const response = await fetch(`/api/files/${id}/provenance`)
      if (!response.ok) {
        throw new Error('Failed to load provenance')
      }

      const { data } = await response.json()
      setFullProvenance(data)
    } catch (error) {
      console.error('Failed to load provenance:', error)
    } finally {
      setIsLoadingProvenance(false)
    }
  }

  const handleContentChange = (newContent: string) => {
    setLocalContent(newContent)
  }

  const handleSave = async () => {
    if (!fileId || !file) return

    try {
      await updateFile(fileId, localContent)
    } catch (error) {
      // Error already handled by hook with toast
      console.error('Save failed:', error)
    }
  }

  const handleGoToSource = () => {
    if (!fullProvenance?.createdIn?.threadId) return

    // Navigate with highlight to creation message (T086)
    navigateToSource(
      fullProvenance.createdIn.threadId,
      fullProvenance.createdIn.messageId // Will highlight and scroll to this message
    )
  }

  const handleDelete = async () => {
    if (!fileId) return

    const confirmed = window.confirm(`Delete "${file?.name || 'file'}"? This action cannot be undone.`)
    if (!confirmed) return

    const result = await deleteFile(fileId)
    if (result.success) {
      onClose()
      onFileDeleted?.()
    }
  }

  if (!file || !isOpen) {
    return null
  }

  // File data already includes provenance from state
  return (
    <FileEditorPanel
      file={file}
      isOpen={isOpen}
      onClose={onClose}
      onGoToSource={file.provenance ? handleGoToSource : undefined}
      onFileChange={handleContentChange}
      onDelete={handleDelete}
      isDeleting={isDeleting}
    />
  )
}
