import { useState, useEffect } from 'react';
import { aiAgentActions } from '../state/aiAgentState';
import { api } from '../api/client';

export function useLoadThread(threadId: string | undefined) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!threadId) {
      // No thread ID - show empty state
      aiAgentActions.setCurrentThread(null);
      aiAgentActions.setMessages([]);
      aiAgentActions.setContextReferences([]);
      return;
    }

    const loadThread = async () => {
      setIsLoading(true);
      setError(null);
      aiAgentActions.setIsLoadingThread(true);

      try {
        // Fetch thread from API with messages included
        const response = await api.get<{
          data: {
            id: string;
            owner_user_id: string;
            parent_thread_id: string | null;
            branch_title: string;
            creator: string;
            created_at: string;
            updated_at: string;
            messages: any[];
            context_references: any[];
          };
        }>(`/threads/${threadId}`);

        const thread = response.data;

        // Transform and update state
        const transformedThread = {
          id: thread.id,
          title: thread.branch_title || 'Untitled Thread',
          parentId: thread.parent_thread_id,
          depth: 0,
          artifactCount: 0,
          lastActivity: new Date(thread.updated_at || thread.created_at),
          createdAt: thread.created_at,
          updatedAt: thread.updated_at,
        };

        const transformedMessages = (thread.messages || []).map((msg: any) => ({
          id: msg.id,
          threadId: msg.thread_id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
          toolCalls: msg.tool_calls || [],
          tokensUsed: msg.tokens_used || 0,
        }));

        const transformedRefs = (thread.context_references || []).map((ref: any) => ({
          id: ref.id,
          threadId: ref.thread_id,
          ownerUserId: ref.owner_user_id,
          entityType: ref.entity_type,
          entityReference: ref.entity_reference,
          source: ref.source,
          priorityTier: ref.priority_tier || 1,
          addedTimestamp: new Date(ref.added_at),
        }));

        // Update state
        aiAgentActions.setCurrentThread(transformedThread);
        aiAgentActions.setMessages(transformedMessages);
        aiAgentActions.setContextReferences(transformedRefs);
      } catch (err: any) {
        console.error('Error loading thread:', err);
        // On error, show empty state gracefully
        aiAgentActions.setCurrentThread(null);
        aiAgentActions.setMessages([]);
        aiAgentActions.setContextReferences([]);
        setError(err.message || 'Failed to load thread');
      } finally {
        setIsLoading(false);
        aiAgentActions.setIsLoadingThread(false);
      }
    };

    loadThread();
  }, [threadId]);

  return { isLoading, error };
}
