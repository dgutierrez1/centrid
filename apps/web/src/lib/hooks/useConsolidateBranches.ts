/**
 * useConsolidateBranches Hook
 *
 * GraphQL + realtime pattern for branch consolidation:
 * 1. Call consolidateBranches GraphQL mutation → get requestId
 * 2. Subscribe to agent_execution_events filtered by requestId
 * 3. Process events: consolidation_progress, consolidation_content, consolidation_complete
 *
 * Pattern: Same as useSendMessage (GraphQL mutation + realtime subscription)
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { graphqlClient } from '@/lib/graphql/client';
import { ConsolidateBranchesDocument } from '@/types/graphql';
import toast from 'react-hot-toast';

export interface ConsolidateBranchesInput {
  threadId: string;
  childBranchIds: string[];
  targetFolder: string;
  fileName: string;
}

export interface ConsolidationProgress {
  stage: string;
  progress: number;
}

export interface ConsolidationResult {
  requestId: string;
  fileId: string;
  content?: string;
  provenance?: Record<string, string>;
}

export interface UseConsolidateBranchesResult {
  consolidate: (input: ConsolidateBranchesInput) => Promise<void>;
  isProcessing: boolean;
  progress: ConsolidationProgress | null;
  result: ConsolidationResult | null;
  error: string | null;
}

export function useConsolidateBranches(): UseConsolidateBranchesResult {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ConsolidationProgress | null>(null);
  const [result, setResult] = useState<ConsolidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const consolidate = useCallback(async (input: ConsolidateBranchesInput) => {
    try {
      setIsProcessing(true);
      setProgress(null);
      setResult(null);
      setError(null);

      // ========================================================================
      // Step 1: Call GraphQL mutation to start consolidation
      // ========================================================================
      const mutationResult = await graphqlClient.mutation(ConsolidateBranchesDocument, {
        input: {
          threadId: input.threadId,
          childBranchIds: input.childBranchIds,
          targetFolder: input.targetFolder,
          fileName: input.fileName,
        },
      });

      if (mutationResult.error) {
        throw new Error(mutationResult.error.message);
      }

      const resource = mutationResult.data?.consolidateBranches;
      if (!resource) {
        throw new Error('No response from server');
      }

      const { requestId, fileId } = resource;

      if (!requestId) {
        throw new Error('No requestId in response');
      }

      // Set initial result with requestId and fileId
      setResult({
        requestId,
        fileId,
      });

      // ========================================================================
      // Step 2: Subscribe to agent_execution_events via realtime
      // ========================================================================

      // Helper function to process events
      const processEvent = (eventType: string, eventData: any, channel: any) => {
        switch (eventType) {
          case 'consolidation_progress':
            setProgress({
              stage: eventData.stage || 'Processing...',
              progress: eventData.progress || 0,
            });
            break;

          case 'consolidation_content':
            setResult(prev => ({
              ...prev!,
              content: eventData.content,
              provenance: eventData.provenance,
            }));
            break;

          case 'consolidation_complete':
            setProgress({
              stage: 'Complete',
              progress: 1.0,
            });
            setIsProcessing(false);
            toast.success('Consolidation complete!');
            // Unsubscribe when complete
            supabase.removeChannel(channel);
            break;

          case 'consolidation_error':
            setError(eventData.message || 'Consolidation failed');
            setIsProcessing(false);
            toast.error(eventData.message || 'Consolidation failed');
            // Unsubscribe on error
            supabase.removeChannel(channel);
            break;

          default:
            console.warn('[useConsolidateBranches] Unknown event type:', eventType);
        }
      };

      try {
        // First: Fetch existing events (late connection support)
        const { data: existingEvents, error: fetchError } = await supabase
          .from('agent_execution_events')
          .select('*')
          .eq('request_id', requestId)
          .order('created_at', { ascending: true }) as any;

        if (existingEvents && existingEvents.length > 0) {
          // Process existing events
          for (const event of (existingEvents as Array<{ type: string; data: any }>)) {
            processEvent(event.type, event.data, null);
          }
        }

        // Second: Subscribe to new events in real-time
        const channel = supabase
          .channel(`consolidation-${requestId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'agent_execution_events',
              filter: `request_id=eq.${requestId}`,
            },
            (payload: any) => {
              processEvent(payload.new.type, payload.new.data, channel);
            }
          )
          .subscribe();

      } catch (subscriptionError) {
        console.error('[useConsolidateBranches] Subscription error:', subscriptionError);
        setError(subscriptionError instanceof Error ? subscriptionError.message : 'Subscription failed');
        setIsProcessing(false);
        toast.error('Failed to subscribe to progress updates');
      }

    } catch (err) {
      console.error('[useConsolidateBranches] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start consolidation');
      setIsProcessing(false);
      toast.error(err instanceof Error ? err.message : 'Failed to start consolidation');
    }
  }, []);

  return {
    consolidate,
    isProcessing,
    progress,
    result,
    error,
  };
}
