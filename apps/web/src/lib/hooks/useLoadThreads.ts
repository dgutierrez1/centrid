import { useState, useEffect } from 'react';
import { aiAgentActions } from '../state/aiAgentState';
import { api } from '../api/client';

/**
 * Load all threads for the current user to populate branch tree
 * Used on app initialization and after login
 */
export function useLoadThreads(userId: string | undefined) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      // Clear threads when no user
      aiAgentActions.setBranchTree([]);
      return;
    }

    const loadThreads = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch threads from API
        const response = await api.get<{
          data: any[];
        }>('/threads');

        // Transform to match state types
        const threads = response.data || [];
        const transformedThreads = threads.map((thread: any) => ({
          id: thread.id,
          title: thread.branch_title || 'Untitled Thread',
          parentId: thread.parent_thread_id,
          depth: 0, // Will be calculated by state manager
          artifactCount: 0, // TODO: count from files
          lastActivity: new Date(thread.updated_at || thread.created_at),
          createdAt: thread.created_at,
          updatedAt: thread.updated_at,
        }));

        // Update branch tree state
        aiAgentActions.setBranchTree(transformedThreads);
      } catch (err: any) {
        setError(err.message || 'Failed to load threads');
        console.error('Error loading threads:', err);
        // Set empty array on error
        aiAgentActions.setBranchTree([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadThreads();
  }, [userId]);

  return { isLoading, error };
}
