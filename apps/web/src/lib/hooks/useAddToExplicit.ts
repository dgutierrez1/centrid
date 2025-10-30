import { useState } from 'react';
import { aiAgentState } from '@/lib/state/aiAgentState';
import { toast } from 'react-hot-toast';
import { api } from '@/lib/api/client';

export function useAddToExplicit(threadId: string) {
  const [isLoading, setIsLoading] = useState(false);

  const addToExplicit = async (fileId: string) => {
    setIsLoading(true);

    // Find the current context reference
    const currentRef = aiAgentState.contextReferences.find(
      (ref) => ref.entityReference === fileId
    );

    if (!currentRef) {
      toast.error('File not found in context');
      setIsLoading(false);
      return;
    }

    // Store previous state for rollback
    const previousReferences = [...aiAgentState.contextReferences];

    try {
      // Optimistic update: Move from Semantic section to Explicit section
      // Remove from current location
      aiAgentState.contextReferences = aiAgentState.contextReferences.filter(
        (ref) => ref.id !== currentRef.id
      );

      // Add as explicit context (tier 1, manual source)
      aiAgentState.contextReferences.push({
        ...currentRef,
        source: 'manual',
        priorityTier: 1,
        addedTimestamp: new Date(),
      });

      // Call API to persist change
      await api.post('/context-references', {
        threadId,
        entityType: 'file',
        entityReference: fileId,
        source: 'manual',
        priorityTier: 1,
      });

      toast.success('Added to explicit context');
    } catch (error) {
      // Rollback on error
      aiAgentState.contextReferences = previousReferences;
      toast.error('Failed to add to explicit context');
      console.error('Add to explicit error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { addToExplicit, isLoading };
}
