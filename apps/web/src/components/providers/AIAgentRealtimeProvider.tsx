import { useRealtimeSubscriptions } from '@/lib/realtime';
import { aiAgentState, aiAgentActions } from '@/lib/state/aiAgentState';
import type { UIThread, UIMessage, UIContextReference } from '@/lib/state/aiAgentState';
import type { Thread as DBThread, Message as DBMessage, ContextReference as DBContextReference } from '@/types/graphql';

interface AIAgentRealtimeProviderProps {
  userId: string;
  children: React.ReactNode;
}

export function AIAgentRealtimeProvider({ userId, children }: AIAgentRealtimeProviderProps) {
  // Get current thread for conditional subscriptions
  const currentThread = aiAgentState.currentThread;

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
    {
      table: 'messages',
      event: 'INSERT', // Only listen for inserts (new messages)
      filter: userId && currentThread
        ? { owner_user_id: userId, thread_id: currentThread.id }
        : undefined,
      callback: (payload) => {
        if (payload.eventType === 'INSERT' && payload.new) {
          // payload.new is automatically camelCase with parsed JSONB fields (content, toolCalls)
          const message = payload.new;
          // Check if message already exists (prevent duplicates from optimistic updates)
          const messageExists = aiAgentState.messages.some(m => m.id === message.id);
          if (!messageExists && message.id) {
            aiAgentActions.addMessage({
              id: message.id,
              role: (message.role as "user" | "assistant") ?? "assistant",
              content: message.content, // Already parsed from JSONB by builder
              toolCalls: message.toolCalls, // Already parsed from JSONB by builder
              timestamp: new Date(message.timestamp ?? Date.now()),
              tokensUsed: message.tokensUsed ?? undefined,
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
