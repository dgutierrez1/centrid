import { useEffect } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { aiAgentState, aiAgentActions } from '@/lib/state/aiAgentState';
import type { Thread, Message, ContextReference } from '@/lib/state/aiAgentState';

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
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const thread = payload.new;
            aiAgentActions.addThreadToBranchTree({
              id: thread.id,
              title: thread.title,
              summary: thread.summary,
              parentId: thread.parentId,
              depth: 0,
              artifactCount: 0,
              lastActivity: new Date(thread.updated_at || thread.created_at),
              createdAt: thread.created_at,
              updatedAt: thread.updated_at,
            });
          } else if (payload.eventType === 'UPDATE') {
            const thread = payload.new;
            // Update current thread if it matches
            const currentThread = aiAgentState.currentThread;
            if (currentThread && thread.id === currentThread.id) {
              aiAgentActions.setCurrentThread({
                id: thread.id,
                title: thread.title,
                summary: thread.summary,
                parentId: thread.parentId,
                depth: 0,
                artifactCount: 0,
                lastActivity: new Date(thread.updated_at || thread.created_at),
                createdAt: thread.created_at,
                updatedAt: thread.updated_at,
              });
            }
            // Update in branch tree
            aiAgentActions.removeThreadFromBranchTree(thread.id);
            aiAgentActions.addThreadToBranchTree({
              id: thread.id,
              title: thread.title,
              summary: thread.summary,
              parentId: thread.parentId,
              depth: 0,
              artifactCount: 0,
              lastActivity: new Date(thread.updated_at || thread.created_at),
              createdAt: thread.created_at,
              updatedAt: thread.updated_at,
            });
          } else if (payload.eventType === 'DELETE') {
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
          (payload: any) => {
            if (payload.eventType === 'INSERT') {
              const message = payload.new;
              // Check if message already exists (prevent duplicates from optimistic updates)
              const messageExists = aiAgentState.messages.some(m => m.id === message.id);
              if (!messageExists) {
                aiAgentActions.addMessage({
                  id: message.id,
                  role: message.role,
                  content: message.content,
                  toolCalls: message.tool_calls,
                  timestamp: new Date(message.timestamp),
                  tokensUsed: message.tokens_used,
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
          (payload: any) => {
            if (payload.eventType === 'INSERT') {
              const ref = payload.new;
              const currentRefs = aiAgentState.contextReferences;
              aiAgentActions.setContextReferences([
                ...currentRefs,
                {
                  id: ref.id,
                  entityType: ref.entity_type,
                  entityReference: ref.entity_reference,
                  source: ref.source,
                  priorityTier: ref.priority_tier,
                  addedTimestamp: new Date(ref.added_timestamp),
                },
              ]);
            } else if (payload.eventType === 'DELETE') {
              const currentRefs = aiAgentState.contextReferences;
              const refs = currentRefs.filter((ref: any) => ref.id !== payload.old.id);
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
        (payload: any) => {
          // File provenance updated - could trigger UI updates
          console.log('File updated:', payload.new);
        }
      )
      .subscribe();

    channels.push(filesChannel);

    // Cleanup on unmount or when thread changes
    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [userId, aiAgentState.currentThread?.id]);

  return <>{children}</>;
}
