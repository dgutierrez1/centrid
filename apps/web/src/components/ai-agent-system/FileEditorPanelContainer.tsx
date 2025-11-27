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

  // Sync local content with loaded file
  useEffect(() => {
    if (file && file.content) {
      setLocalContent(file.content)
    }
  }, [file])

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
    if (!file?.createdInThreadId) return

    // Navigate to the thread where the file was created
    navigateToSource(file.createdInThreadId)
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

  if (!isOpen) {
    return null
  }

  // Combine file data with fetched provenance
  const fileWithProvenance = file ? {
    id: file.id || '',
    name: file.name || 'Untitled',
    content: file.content || '',
    // Note: provenance is optional and checked in FileEditorPanel
  } : null

  return (
    <FileEditorPanel
      file={fileWithProvenance}
      isOpen={isOpen}
      isLoading={isLoading}
      onClose={onClose}
      onGoToSource={file?.createdInThreadId ? handleGoToSource : undefined}
      onFileChange={handleContentChange}
      onDelete={handleDelete}
      isDeleting={isDeleting}
    />
  )
}
