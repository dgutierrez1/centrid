import React, { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSnapshot } from 'valtio'
import { MessageStream } from '@centrid/ui/features/ai-agent-system'
import { aiAgentState } from '@/lib/state/aiAgentState'
import { useNavigateToSource } from '@/lib/hooks/useNavigateToSource'
import type { MessageProps } from '@centrid/ui/features/ai-agent-system'

export function MessageStreamContainer() {
  const router = useRouter()
  const snap = useSnapshot(aiAgentState)
  const { handleMessageHighlight } = useNavigateToSource()

  // Get highlight message ID from URL query params (T089)
  const highlightMessageId = router.query.highlightMessage as string | undefined

  // Handle message highlighting after render (T089)
  useEffect(() => {
    if (highlightMessageId && snap.messages.length > 0) {
      // Wait for messages to render
      setTimeout(() => {
        handleMessageHighlight(highlightMessageId)
      }, 300)
    }
  }, [highlightMessageId, snap.messages.length])

  // Smart deduplication: Build message list with ID tracking
  const messages: MessageProps[] = []
  const messageIds = new Set<string>()

  // Transform messages and track IDs to prevent duplicates
  for (const msg of snap.messages) {
    if (!messageIds.has(msg.id)) {
      messageIds.add(msg.id)
      messages.push({
        role: msg.role,
        content: msg.isStreaming && msg.streamingBuffer ? msg.streamingBuffer : msg.content,
        events: msg.events as any[] | undefined,
        timestamp: msg.timestamp,
        isStreaming: msg.isStreaming,
        isRequestLoading: msg.isRequestLoading,
      })
    } else {
      console.warn('[MessageStreamContainer] Duplicate message ID detected:', msg.id)
    }
  }

  // Check if a streaming assistant message already exists in the dedup set
  const hasStreamingAssistantMessage = Array.from(messageIds).some(id => {
    const msg = snap.messages.find(m => m.id === id)
    return msg?.role === 'assistant' && msg?.isStreaming
  })

  // Add streaming indicator if streaming is active but no assistant message exists yet
  // - isRequestLoading is true when streaming hasn't actually started yet (no content)
  // - hasStreamStarted is true when we've received the first stream event
  if (snap.isStreaming && !hasStreamingAssistantMessage) {
    const isRequestLoading = !snap.hasStreamStarted && !snap.streamingBuffer
    messages.push({
      role: 'assistant',
      content: snap.streamingBuffer || undefined,
      timestamp: new Date(),
      isStreaming: true,
      isRequestLoading,
    })
  }

  return (
    <MessageStream
      messages={messages}
      isStreaming={snap.isStreaming}
    />
  )
}
