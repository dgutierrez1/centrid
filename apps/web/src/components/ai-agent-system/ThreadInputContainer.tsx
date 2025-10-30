import React, { useState } from 'react'
import { ThreadInput } from '@centrid/ui/features/ai-agent-system'
import { useSendMessage } from '@/lib/hooks/useSendMessage'
import { useAutocomplete } from '@/lib/hooks/useAutocomplete'
import type { FileItem } from '@centrid/ui/components/file-autocomplete'

interface ThreadInputContainerProps {
  threadId: string
  onToolCall?: (toolCall: {
    toolCallId: string
    toolName: string
    toolInput: any
  }) => void
}

export function ThreadInputContainer({
  threadId,
  onToolCall,
}: ThreadInputContainerProps) {
  const [messageText, setMessageText] = useState('')
  const { sendMessage, isStreaming, stopStream } = useSendMessage(threadId, {
    onToolCall,
  })

  // @-mention autocomplete
  const autocomplete = useAutocomplete(threadId, {
    entityType: 'all',
    minQueryLength: 1,
    debounceMs: 300,
  })

  const handleSendMessage = async () => {
    if (!messageText.trim()) return

    await sendMessage(messageText)
    setMessageText('') // Clear input after sending
  }

  const handleStopStreaming = () => {
    stopStream()
  }

  const handleAutocompleteSelect = (item: FileItem) => {
    // Format the selected item for insertion
    const formattedItem = autocomplete.insertReference(item)

    // This will be handled by the ThreadInput component directly
    // But we keep this for any additional container-level logic
    console.log('Selected autocomplete item:', formattedItem)
  }

  // Transform autocomplete items to FileItem format
  const autocompleteItems: FileItem[] = autocomplete.items.map(item => ({
    id: item.id,
    name: item.name,
    path: item.path,
    type: item.type,
    branchName: item.branchName,
    branchId: item.branchId,
    relevanceScore: item.relevanceScore,
    lastModified: item.lastModified,
  }))

  return (
    <ThreadInput
      messageText={messageText}
      isStreaming={isStreaming}
      characterLimit={10000}
      placeholder="Type your message... (use @ to mention files, folders, or threads)"
      onChange={(text) => setMessageText(text)}
      onSendMessage={handleSendMessage}
      onStopStreaming={handleStopStreaming}
      // @-mention autocomplete props
      autocompleteItems={autocompleteItems}
      autocompleteIsOpen={autocomplete.isOpen}
      autocompleteIsLoading={autocomplete.isLoading}
      autocompleteQuery={autocomplete.query}
      onAutocompleteQueryChange={autocomplete.setQuery}
      onAutocompleteSelect={handleAutocompleteSelect}
      onAutocompleteClose={autocomplete.closeAutocomplete}
    />
  )
}
