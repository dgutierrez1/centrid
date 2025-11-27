import { useEffect } from 'react';
import { useRealtimeSubscriptions } from '@/lib/realtime';
import { aiAgentState, aiAgentActions } from '@/lib/state/aiAgentState';
import type { UIThread, UIMessage, UIContextReference } from '@/lib/state/aiAgentState';
import type { Thread as DBThread, Message as DBMessage, ContextReference as DBContextReference } from '@/types/graphql';
import { supabase } from '@/lib/supabase/client';

interface AIAgentRealtimeProviderProps {
  userId: string;
  children: React.ReactNode;
}

export function AIAgentRealtimeProvider({ userId, children }: AIAgentRealtimeProviderProps) {
  // Get current thread for conditional subscriptions
  const currentThread = aiAgentState.currentThread;

  // Message replay: fetch recent messages when thread changes
  useEffect(() => {
    if (!currentThread?.id || !userId) return;

    const replayRecentMessages = async () => {
      // Skip replay if currently streaming (prevents mid-stream content replacement)
      if (aiAgentState.isStreaming) {
        return;
      }

      const sixtySecondsAgo = new Date(Date.now() - 60000).toISOString();

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', currentThread.id)
        .gte('timestamp', sixtySecondsAgo)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Failed to replay recent messages:', error);
        return;
      }

      // Add any missing messages to state
      data?.forEach((message: any) => {
        const exists = aiAgentState.messages.some(m => m.id === message.id);
        if (!exists && message.id) {
          aiAgentActions.addMessage({
            id: message.id,
            role: (message.role as "user" | "assistant") ?? "assistant",
            content: message.content,
            toolCalls: message.toolCalls,
            timestamp: message.timestamp ?? new Date().toISOString(), // ✅ ISO string
            tokensUsed: message.tokensUsed ?? undefined,
            idempotencyKey: message.idempotency_key ?? undefined,
          });
        }
      });
    };

    replayRecentMessages();
  }, [currentThread?.id, userId]);

  // Use unified realtime subscriptions pattern (automatic camelCase + JSONB parsing)
  useRealtimeSubscriptions([
    // Subscribe to threads
    {
      table: 'threads',
      event: '*',
      filter: userId ? { owner_user_id: userId } : undefined,
      callback: (payload) => {
        if (payload.eventType === 'INSERT' && payload.new) {
          // payload.new is automatically camelCase from builder
          const thread = payload.new;

          // Check if thread already exists (prevent duplicates from optimistic updates)
          const threadExists = aiAgentState.branchTree.threads.some(t => t.id === thread.id);

          if (!threadExists) {
            aiAgentActions.addThreadToBranchTree({
              id: thread.id ?? '',
              title: thread.branchTitle ?? '',
              summary: '', // Not in GraphQL type
              parentThreadId: thread.parentThreadId ?? null,
              depth: 0,
              artifactCount: 0,
              lastActivity: thread.updatedAt || thread.createdAt || new Date().toISOString(), // ✅ ISO string
              createdAt: thread.createdAt ?? new Date().toISOString(),
              updatedAt: thread.updatedAt ?? new Date().toISOString(),
            });
          }
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          const thread = payload.new;
          // Update current thread if it matches
          if (currentThread && thread.id === currentThread.id) {
            aiAgentActions.setCurrentThread({
              id: thread.id ?? '',
              title: thread.branchTitle ?? '',
              summary: '',
              parentThreadId: thread.parentThreadId ?? null,
              depth: 0,
              artifactCount: 0,
              lastActivity: new Date(thread.updatedAt || thread.createdAt || Date.now()),
              createdAt: thread.createdAt ?? new Date().toISOString(),
              updatedAt: thread.updatedAt ?? new Date().toISOString(),
            });
          }
          // Update in branch tree
          if (thread.id) {
            aiAgentActions.removeThreadFromBranchTree(thread.id);
            aiAgentActions.addThreadToBranchTree({
              id: thread.id,
              title: thread.branchTitle ?? '',
              summary: '',
              parentThreadId: thread.parentThreadId ?? null,
              depth: 0,
              artifactCount: 0,
              lastActivity: new Date(thread.updatedAt || thread.createdAt || Date.now()),
              createdAt: thread.createdAt ?? new Date().toISOString(),
              updatedAt: thread.updatedAt ?? new Date().toISOString(),
            });
          }
        } else if (payload.eventType === 'DELETE' && payload.old?.id) {
          aiAgentActions.removeThreadFromBranchTree(payload.old.id);
        }
      },
      enabled: !!userId,
    },

    // Subscribe to messages for current thread only
    // NOTE: Only listen for INSERT events. Updates during streaming come from agent_execution_events.
    // This ensures clean event-driven architecture where agent_execution_events is the primary
    // streaming channel and messages table is the final persistent state.
    {
      table: 'messages',
      event: 'INSERT',
      filter: userId && currentThread
        ? { owner_user_id: userId, thread_id: currentThread.id }
        : undefined,
      callback: (payload) => {
        if (payload.eventType === 'INSERT' && payload.new) {
          // payload.new is automatically camelCase with parsed JSONB fields (content, toolCalls)
          const message = payload.new;

          // Check if message already exists by ID, idempotencyKey, or requestId
          const messageExists = aiAgentState.messages.some(m =>
            m.id === message.id ||
            (message.idempotencyKey && m.idempotencyKey === message.idempotencyKey) ||
            // Match by requestId for assistant messages (handles optimistic updates)
            (message.requestId && (m as any).requestId === message.requestId && m.role === 'assistant')
          );

          if (!messageExists && message.id) {
            aiAgentActions.addMessage({
              id: message.id,
              role: (message.role as "user" | "assistant") ?? "assistant",
              content: message.content, // Already parsed from JSONB by builder
              toolCalls: message.toolCalls, // Already parsed from JSONB by builder
              timestamp: message.timestamp ?? new Date().toISOString(), // ✅ ISO string
              tokensUsed: message.tokensUsed ?? undefined,
              idempotencyKey: message.idempotencyKey ?? undefined,
            });
          }
        }
      },
      enabled: !!userId && !!currentThread,
    },

    // Subscribe to context references (filtered by thread_id)
    {
      table: 'context_references',
      event: '*',
      filter: userId && currentThread
        ? { owner_user_id: userId, thread_id: currentThread.id }
        : undefined,
      callback: (payload) => {
        if (payload.eventType === 'INSERT' && payload.new) {
          // payload.new is automatically camelCase from builder
          const ref = payload.new;
          const currentRefs = aiAgentState.contextReferences;
          if (ref.id) {
            aiAgentActions.setContextReferences([
              ...currentRefs,
              {
                id: ref.id,
                entityType: (ref.entityType as "file" | "folder" | "thread") ?? "file",
                entityReference: ref.entityReference ?? '',
                source: (ref.source as "inherited" | "manual" | "@-mentioned" | "agent-added") ?? "manual",
                priorityTier: (ref.priorityTier as 1 | 2 | 3) ?? 2,
                addedTimestamp: new Date(ref.addedAt ?? Date.now()),
              },
            ]);
          }
        } else if (payload.eventType === 'DELETE' && payload.old?.id) {
          const currentRefs = aiAgentState.contextReferences;
          const refs = currentRefs.filter(ref => ref.id !== payload.old?.id);
          aiAgentActions.setContextReferences(refs);
        }
      },
      enabled: !!userId && !!currentThread,
    },

    // Subscribe to files (for provenance updates)
    {
      table: 'files',
      event: 'UPDATE',
      filter: userId ? { owner_user_id: userId } : undefined,
      callback: (payload) => {
        // File provenance updated - could trigger UI updates
        if (payload.new) {
          console.log('File updated:', payload.new);
        }
      },
      enabled: !!userId,
    },
  ]);

  // NOTE: agent_execution_events are subscribed to in useSendMessage hook
  // (not here) because they need to be filtered by requestId which is only
  // known during message send. See useSendMessage.ts lines 227-238 for
  // agent_execution_events subscription and event processing.

  return <>{children}</>;
}
