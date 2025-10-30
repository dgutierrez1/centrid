import { useState, useCallback } from 'react'
import { useSnapshot } from 'valtio'
import toast from 'react-hot-toast'
import { aiAgentState } from '@/lib/state/aiAgentState'
import { api } from '@/lib/api/client'
import { supabase } from '@/lib/supabase/client'
import { checkRequestStatus } from '@/lib/api/agent-requests'

export interface SendMessageOptions {
  onToolCall?: (toolCall: {
    toolCallId: string
    toolName: string
    toolInput: any
  }) => void
}

export function useSendMessage(threadId: string, options?: SendMessageOptions) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [sseConnection, setSseConnection] = useState<EventSource | null>(null)
  const snap = useSnapshot(aiAgentState)

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        toast.error('Message cannot be empty')
        return
      }

      try {
        setIsStreaming(true)
        aiAgentState.isStreaming = true
        aiAgentState.hasStreamStarted = false

        // Generate idempotency key for this request (industry standard practice)
        const idempotencyKey = crypto.randomUUID()

        // Get auth token
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) {
          throw new Error('Not authenticated')
        }

        // Send message to backend using axios client
        const response = await api.post<{ data: any }>(`/threads/${threadId}/messages`, {
          content: text,  // API expects 'content' field
          contextReferences: snap.contextReferences,
        }, {
          headers: {
            'Idempotency-Key': idempotencyKey, // Industry standard header
          },
        })

        const resource = response.data

        // MVU F1.1: Extract requestId from response for request-based streaming
        const requestId = resource._embedded?.requestId;
        const messageId = resource.id;

        if (!requestId) {
          console.error('[useSendMessage] No requestId in response!');
          throw new Error('No requestId in response');
        }

        console.log('[useSendMessage] Got requestId:', requestId);

        // Store for recovery
        localStorage.setItem(`thread-${threadId}-activeRequest`, requestId);
        localStorage.setItem(`request-${requestId}-messageId`, messageId);

        // Add user message with real ID from database
        const userMessage = {
          id: resource.id,
          role: 'user' as const,
          content: text,
          toolCalls: [],
          timestamp: new Date(resource.createdAt),
          tokensUsed: resource.tokensUsed || 0,
          idempotencyKey, // Track idempotency key for deduplication
        }

        console.log('[useSendMessage] Adding user message:', userMessage.id, 'idempotencyKey:', idempotencyKey, 'Total messages before:', aiAgentState.messages.length);

        // Check if message already exists (prevent duplicates)
        const messageExists = aiAgentState.messages.some(m => m.id === userMessage.id);
        if (!messageExists) {
          aiAgentState.messages.push(userMessage);
          console.log('[useSendMessage] User message added. Total messages after:', aiAgentState.messages.length);
        } else {
          console.warn('[useSendMessage] User message already exists, skipping duplicate');
        }

        // Add optimistic assistant message (streaming state)
        const tempAssistantId = crypto.randomUUID()
        const assistantIdempotencyKey = crypto.randomUUID() // Separate key for assistant message
        const optimisticAssistantMessage = {
          id: tempAssistantId,
          role: 'assistant' as const,
          content: '',
          events: [],
          timestamp: new Date(),
          isStreaming: true,
          isRequestLoading: true,
          streamingBuffer: '',
          tokensUsed: 0,
          idempotencyKey: assistantIdempotencyKey, // Track for deduplication
        }

        // Check if this optimistic message already exists (prevent duplicates)
        const optimisticExists = aiAgentState.messages.some(m => m.id === tempAssistantId);
        if (!optimisticExists) {
          aiAgentState.messages.push(optimisticAssistantMessage);
          console.log('[useSendMessage] Optimistic assistant message added. Total messages:', aiAgentState.messages.length);
        }
        const optimisticAssistantIndex = aiAgentState.messages.length - 1

        // MVU F1.2: Stream by requestId using Supabase Real-time
        // Subscribe to agent_execution_events for incremental updates
        console.log('[useSendMessage] Setting up real-time subscription:', { requestId });

        try {
          // First: Fetch all existing events for replay (late connection support)
          const { data: existingEvents, error: fetchError } = await supabase
            .from('agent_execution_events')
            .select('*')
            .eq('request_id', requestId)
            .order('created_at', { ascending: true });

          if (fetchError) {
            console.warn('[useSendMessage] Failed to fetch existing events:', fetchError);
          } else if (existingEvents && existingEvents.length > 0) {
            console.log('[useSendMessage] Replaying', existingEvents.length, 'existing events');
            // Process existing events
            for (const event of existingEvents) {
              processEvent(event.type, event.data);
            }
          }

          // Second: Subscribe to new events in real-time
          const channel = supabase
            .channel(`agent-events-${requestId}`)
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'agent_execution_events',
                filter: `request_id=eq.${requestId}`,
              },
              (payload: any) => {
                console.log('[useSendMessage] Received real-time event:', payload.new.type);
                processEvent(payload.new.type, payload.new.data);
              }
            )
            .subscribe();

          // Helper function to process events (used for both replay and real-time)
          function processEvent(eventType: string, eventData: any) {
            // Mark stream as started on first event
            if (!aiAgentState.hasStreamStarted) {
              aiAgentState.hasStreamStarted = true
            }

            switch (eventType) {
              case 'context_ready':
                console.log('[useSendMessage] Context ready:', eventData)
                break
              case 'text_chunk':
                // Update the optimistic assistant message with streamed content
                if (optimisticAssistantIndex >= 0 && aiAgentState.messages[optimisticAssistantIndex]) {
                  aiAgentState.messages[optimisticAssistantIndex].streamingBuffer += eventData.content
                }
                break
              case 'tool_call':
                if (options?.onToolCall) {
                  options.onToolCall({
                    toolCallId: eventData.toolCallId,
                    toolName: eventData.toolName,
                    toolInput: eventData.toolInput,
                  })
                }
                break
              case 'completion':
                // Update optimistic assistant message with final state
                if (optimisticAssistantIndex >= 0 && aiAgentState.messages[optimisticAssistantIndex]) {
                  const optimisticMsg = aiAgentState.messages[optimisticAssistantIndex]
                  // Update with actual message ID from database
                  optimisticMsg.id = eventData.messageId
                  // Mark as no longer streaming
                  optimisticMsg.isStreaming = false
                  optimisticMsg.isRequestLoading = false
                  // Set final content
                  optimisticMsg.content = optimisticMsg.streamingBuffer || ''
                  // Clear streaming buffer
                  optimisticMsg.streamingBuffer = ''
                  // Set token count
                  optimisticMsg.tokensUsed = eventData.totalTokens || 0
                }
                aiAgentState.isStreaming = false
                aiAgentState.hasStreamStarted = false
                setIsStreaming(false)
                setSseConnection(null)
                // Unsubscribe when complete
                supabase.removeChannel(channel)
                localStorage.removeItem(`thread-${threadId}-activeRequest`);
                return
              case 'error':
                throw new Error(eventData.message)
            }
          }

          // Store channel reference for cleanup
          setSseConnection(channel as any)

        } catch (error) {
          console.error('[useSendMessage] Real-time subscription error:', error)

              // MVU F2.4: Enhanced error handling - check if request actually completed
              try {
                const status = await checkRequestStatus(requestId);

                if (status.status === 'completed') {
                  // Stream died but request finished
                  console.log('[Stream] Request completed despite stream error');

                  if (status.responseMessageId) {
                    // Load the response message from DB
                    const messageResponse = await fetch(
                      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/api/threads/${threadId}/messages/${status.responseMessageId}`,
                      {
                        headers: {
                          'Authorization': `Bearer ${session.access_token}`,
                        }
                      }
                    );

                    if (messageResponse.ok) {
                      const { data: responseMsg } = await messageResponse.json();
                      // Update optimistic message with real response
                      if (optimisticAssistantIndex >= 0 && aiAgentState.messages[optimisticAssistantIndex]) {
                        aiAgentState.messages[optimisticAssistantIndex] = {
                          ...responseMsg,
                          timestamp: new Date(responseMsg.timestamp),
                          isStreaming: false,
                          isRequestLoading: false,
                        };
                      }
                    }
                  }

                  localStorage.removeItem(`thread-${threadId}-activeRequest`);
                  aiAgentState.isStreaming = false
                  aiAgentState.hasStreamStarted = false
                  setIsStreaming(false)
                  setSseConnection(null)
                  toast.success('Request completed successfully');
                  return;
                } else if (status.status === 'in_progress') {
                  // Still processing - offer reconnect
                  console.log('[Stream] Request still in progress');

                  if (optimisticAssistantIndex >= 0 && aiAgentState.messages[optimisticAssistantIndex]) {
                    aiAgentState.messages[optimisticAssistantIndex].content = 'Connection lost. Attempting to reconnect...';
                  }

                  aiAgentState.isStreaming = false
                  aiAgentState.hasStreamStarted = false
                  setIsStreaming(false)
                  setSseConnection(null)

                  toast.error('Connection lost. Click to reconnect.', {
                    duration: Infinity, // Keep visible until user dismisses
                  });
                  return;
                } else if (status.status === 'failed') {
                  // Actually failed
                  console.error('[Stream] Request failed:', status.results?.error);

                  if (optimisticAssistantIndex >= 0 && aiAgentState.messages[optimisticAssistantIndex]) {
                    aiAgentState.messages[optimisticAssistantIndex].content = '? Error: ' + (status.results?.error || 'Request failed');
                  }

                  localStorage.removeItem(`thread-${threadId}-activeRequest`);
                  aiAgentState.isStreaming = false
                  aiAgentState.hasStreamStarted = false
                  setIsStreaming(false)
                  setSseConnection(null)
                  toast.error(`Request failed: ${status.results?.error || 'Unknown error'}`);
                  return;
                }
              } catch (statusCheckError) {
                console.error('[Stream] Failed to check request status:', statusCheckError);
                // Network error - fallback to generic error
              }

              // Default error handling
              if (optimisticAssistantIndex >= 0 && aiAgentState.messages[optimisticAssistantIndex]) {
                aiAgentState.messages[optimisticAssistantIndex].isStreaming = false
                aiAgentState.messages[optimisticAssistantIndex].isRequestLoading = false
                if (!aiAgentState.messages[optimisticAssistantIndex].content) {
                  aiAgentState.messages[optimisticAssistantIndex].content = '? Error: ' + (error instanceof Error ? error.message : 'Streaming error')
                }
              }
              aiAgentState.isStreaming = false
              aiAgentState.hasStreamStarted = false
              toast.error(error instanceof Error ? error.message : 'Streaming error')
              setIsStreaming(false)
              setSseConnection(null)
            }
          }

          processStream()

        } catch (error) {
          console.error('Error starting SSE stream:', error)
          toast.error(error instanceof Error ? error.message : 'Streaming error')
          aiAgentState.isStreaming = false
          aiAgentState.hasStreamStarted = false
          setIsStreaming(false)
        }
      } catch (error) {
        console.error('Error sending message:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to send message')

        // Remove only messages that were added (user message not added yet if error before POST)
        // Just remove the last message if it's the optimistic assistant
        if (aiAgentState.messages.length > 0) {
          const lastMessage = aiAgentState.messages[aiAgentState.messages.length - 1]
          if (lastMessage.isStreaming) {
            aiAgentState.messages.pop()
          }
        }
        aiAgentState.isStreaming = false
        aiAgentState.hasStreamStarted = false
        setIsStreaming(false)
      }
    },
    [threadId, snap.contextReferences, options]
  )

  const stopStream = useCallback(() => {
    if (sseConnection) {
      sseConnection.close()
      setSseConnection(null)
      setIsStreaming(false)
      aiAgentState.streamingBuffer = null
      toast.success('Stream stopped')
    }
  }, [sseConnection])

  return {
    sendMessage,
    isStreaming,
    stopStream,
  }
}
