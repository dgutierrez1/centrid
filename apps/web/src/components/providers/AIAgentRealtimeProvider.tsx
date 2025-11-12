import { useEffect } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { aiAgentState, aiAgentActions } from '@/lib/state/aiAgentState';
import type { Thread as StateThread, Message as StateMessage, ContextReference as StateContextReference } from '@/lib/state/aiAgentState';
import type { RealtimePayload } from '@/lib/realtime/types';
import type { Thread as DBThread, Message as DBMessage, ContextReference as DBContextReference } from '@/types/graphql';

interface AIAgentRealtimeProviderProps {
  userId: string;
  children: React.ReactNode;
}

export function AIAgentRealtimeProvider({ userId, children }: AIAgentRealtimeProviderProps) {
  useEffect(() => {
    if (!userId) return;

    const channels: RealtimeChannel[] = [];

    // Subscribe to threads
    const threadsChannel = supabase
      .channel('threads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'threads',
          filter: `owner_user_id=eq.${userId}`,
        },
        (payload: RealtimePayload<'threads'>) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const thread = payload.new;
            aiAgentActions.addThreadToBranchTree({
              id: thread.id ?? '',
              title: thread.branchTitle ?? '',
              summary: '', // Not in GraphQL type
              parentThreadId: thread.parentThreadId ?? null,
              depth: 0,
              artifactCount: 0,
              lastActivity: new Date(thread.updatedAt || thread.createdAt || Date.now()),
              createdAt: thread.createdAt ?? new Date().toISOString(),
              updatedAt: thread.updatedAt ?? new Date().toISOString(),
            });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const thread = payload.new;
            // Update current thread if it matches
            const currentThread = aiAgentState.currentThread;
            if (currentThread && thread.id === currentThread.id) {
              aiAgentActions.setCurrentThread({
                id: thread.id ?? '',
                title: thread.branchTitle ?? '',
                summary: '', // Not in GraphQL type
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
                summary: '', // Not in GraphQL type
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
        }
      )
      .subscribe();

    channels.push(threadsChannel);

    // Subscribe to messages for current thread only
    // Re-subscribe when currentThread changes
    const currentThread = aiAgentState.currentThread;
    let messagesChannel: RealtimeChannel | null = null;

    if (currentThread) {
      messagesChannel = supabase
        .channel(`messages-changes-${currentThread.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',  // Only listen for inserts (new messages)
            schema: 'public',
            table: 'messages',
            filter: `owner_user_id=eq.${userId} AND thread_id=eq.${currentThread.id}`,
          },
          (payload: RealtimePayload<'messages'>) => {
            if (payload.eventType === 'INSERT' && payload.new) {
              const message = payload.new;
              // Check if message already exists (prevent duplicates from optimistic updates)
              const messageExists = aiAgentState.messages.some(m => m.id === message.id);
              if (!messageExists && message.id) {
                aiAgentActions.addMessage({
                  id: message.id,
                  role: (message.role as "user" | "assistant") ?? "assistant",
                  content: message.content as any, // ContentBlock[] from JSON scalar
                  toolCalls: message.toolCalls as any, // ToolCall[] from JSON scalar
                  timestamp: new Date(message.timestamp ?? Date.now()),
                  tokensUsed: message.tokensUsed ?? undefined,
                });
              }
            }
          }
        )
        .subscribe();

      channels.push(messagesChannel);
    }

    // Subscribe to context references (filtered by thread_id)
    let contextRefsChannel: RealtimeChannel | null = null;

    if (currentThread) {
      contextRefsChannel = supabase
        .channel(`context-refs-changes-${currentThread.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'context_references',
            filter: `owner_user_id=eq.${userId} AND thread_id=eq.${currentThread.id}`,
          },
          (payload: RealtimePayload<'context_references'>) => {
            if (payload.eventType === 'INSERT' && payload.new) {
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
          }
        )
        .subscribe();

      channels.push(contextRefsChannel);
    }

    // Subscribe to files (for provenance updates)
    const filesChannel = supabase
      .channel('files-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'files',
          filter: `owner_user_id=eq.${userId}`,
        },
        (payload: RealtimePayload<'files'>) => {
          // File provenance updated - could trigger UI updates
          if (payload.new) {
            console.log('File updated:', payload.new);
          }
        }
      )
      .subscribe();

    channels.push(filesChannel);

    // NOTE: agent_execution_events are subscribed to in useSendMessage hook
    // (not here) because they need to be filtered by requestId which is only
    // known during message send. See useSendMessage.ts lines 141-156 for
    // agent_execution_events subscription and event processing.

    // Cleanup on unmount or when thread changes
    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [userId, aiAgentState.currentThread?.id]);

  return <>{children}</>;
}
