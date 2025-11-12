import React, { useEffect, useState } from 'react'
import { FileEditorPanel } from '@centrid/ui/features/ai-agent-system'
import { useLoadFile } from '@/lib/hooks/useLoadFile'
import { useUpdateFile } from '@/lib/hooks/useUpdateFile'
import { useDeleteFile } from '@/lib/hooks/useDeleteFile'
import { useNavigateToSource } from '@/lib/hooks/useNavigateToSource'
import { useGetFileProvenanceQuery } from '@/types/graphql'
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

  // Load full provenance data using GraphQL (T086)
  const [provenanceResult] = useGetFileProvenanceQuery({
    variables: { id: fileId || '' },
    pause: !fileId || !isOpen, // Only run when fileId exists and panel is open
  })

  const fullProvenance = provenanceResult.data?.fileProvenance

  // Sync local content with loaded file
  useEffect(() => {
    if (file) {
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
