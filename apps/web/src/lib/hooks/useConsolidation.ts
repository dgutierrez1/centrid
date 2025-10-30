import { useState, useCallback, useRef, useEffect } from 'react';
import { useSnapshot } from 'valtio';
import { aiAgentState, aiAgentActions } from '../state/aiAgentState';
import { api } from '@/lib/api/client';

// Import types directly to avoid circular dependencies
import type { Branch } from '@centrid/ui/features/ai-agent-system';

// Consolidation progress types
export interface ConsolidationProgress {
  step: string;
  current: number;
  total: number;
}

export interface ConsolidationState {
  isOpen: boolean;
  isProcessing: boolean;
  progress: ConsolidationProgress | null;
  consolidatedContent: string | null;
  sourceProvenanceMap: Record<string, string> | null;
  error: string | null;
  selectedBranchIds: Set<string>;
  fileName: string;
  targetFolder: string;
}

// Consolidation request/response types
export interface ConsolidateRequest {
  threadId: string;
  childBranchIds: string[];
  targetFolder: string;
  fileName: string;
}

export interface ConsolidateResponse {
  data: {
    fileId: string;
    provenance: Array<{
      threadId: string;
      threadTitle: string;
      contribution: string;
    }>;
  };
}

export function useConsolidation() {
  const snapshot = useSnapshot(aiAgentState);
  const [consolidationState, setConsolidationState] = useState<ConsolidationState>({
    isOpen: false,
    isProcessing: false,
    progress: null,
    consolidatedContent: null,
    sourceProvenanceMap: null,
    error: null,
    selectedBranchIds: new Set(),
    fileName: 'consolidated-analysis.md',
    targetFolder: '/workspace',
  });

  const eventSourceRef = useRef<EventSource | null>(null);

  // Get child branches for current thread
  const childBranches = snapshot.branchTree.threads.filter(thread =>
    thread.parentId === snapshot.currentThread?.id
  );

  // Check if current thread has children
  const hasChildren = childBranches.length > 0;

  // Open consolidation modal
  const openConsolidation = useCallback(() => {
    if (!hasChildren) return;

    // Pre-select all child branches
    const childBranchIds = new Set(childBranches.map(branch => branch.id));

    setConsolidationState(prev => ({
      ...prev,
      isOpen: true,
      selectedBranchIds: childBranchIds,
      error: null,
      progress: null,
      consolidatedContent: null,
      sourceProvenanceMap: null,
    }));
  }, [hasChildren, childBranches]);

  // Close consolidation modal
  const closeConsolidation = useCallback(() => {
    // Clean up SSE connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setConsolidationState(prev => ({
      ...prev,
      isOpen: false,
      isProcessing: false,
      progress: null,
      error: null,
    }));
  }, []);

  // Update selected branches
  const updateSelectedBranches = useCallback((branchIds: Set<string>) => {
    setConsolidationState(prev => ({
      ...prev,
      selectedBranchIds: new Set(branchIds),
    }));
  }, []);

  // Update file name and target folder
  const updateFileName = useCallback((fileName: string) => {
    setConsolidationState(prev => ({
      ...prev,
      fileName,
    }));
  }, []);

  const updateTargetFolder = useCallback((targetFolder: string) => {
    setConsolidationState(prev => ({
      ...prev,
      targetFolder,
    }));
  }, []);

  // Start consolidation process
  const startConsolidation = useCallback(async (
    branchIds: string[],
    targetFolder: string,
    fileName: string
  ) => {
    if (!snapshot.currentThread || branchIds.length === 0) {
      setConsolidationState(prev => ({
        ...prev,
        error: 'No branches selected for consolidation',
      }));
      return;
    }

    try {
      setConsolidationState(prev => ({
        ...prev,
        isProcessing: true,
        progress: { step: 'Initializing consolidation', current: 0, total: 100 },
        error: null,
      }));

      // Call consolidate-branches via unified API client
      const result = await api.post<ConsolidateResponse>('/consolidate-branches', {
        childBranchIds: Array.from(branchIds),
        targetFolder,
        fileName,
        threadId: snapshot.currentThread.id,
      } as ConsolidateRequest);

      // Set up SSE for progress updates
      const sseUrl = `/api/consolidations/${result.data.fileId}/stream`;
      const eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;

      eventSource.addEventListener('progress', (event) => {
        try {
          const data = JSON.parse(event.data);
          setConsolidationState(prev => ({
            ...prev,
            progress: data,
          }));
        } catch (error) {
          console.error('Error parsing progress event:', error);
        }
      });

      eventSource.addEventListener('content', (event) => {
        try {
          const data = JSON.parse(event.data);
          setConsolidationState(prev => ({
            ...prev,
            consolidatedContent: data.content,
            sourceProvenanceMap: data.provenance,
          }));
        } catch (error) {
          console.error('Error parsing content event:', error);
        }
      });

      eventSource.addEventListener('complete', (event) => {
        try {
          const data = JSON.parse(event.data);
          setConsolidationState(prev => ({
            ...prev,
            isProcessing: false,
            progress: null,
          }));

          // Clean up SSE connection
          eventSource.close();
          eventSourceRef.current = null;

          // Navigate to the created file
          if (data.fileId) {
            aiAgentActions.setSelectedFile(data.fileId);
            // TODO: Load file content and set as current file
          }

        } catch (error) {
          console.error('Error parsing complete event:', error);
          setConsolidationState(prev => ({
            ...prev,
            isProcessing: false,
            error: 'Failed to process completion event',
          }));
        }
      });

      eventSource.addEventListener('error', (event) => {
        console.error('SSE error:', event);
        setConsolidationState(prev => ({
          ...prev,
          isProcessing: false,
          error: 'Consolidation process encountered an error',
        }));

        // Clean up SSE connection
        eventSource.close();
        eventSourceRef.current = null;
      });

    } catch (error) {
      console.error('Consolidation error:', error);
      setConsolidationState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Failed to start consolidation',
      }));
    }
  }, [snapshot.currentThread]);

  // Approve consolidated content
  const approveConsolidation = useCallback(async (
    targetFolder: string,
    fileName: string
  ) => {
    if (!consolidationState.consolidatedContent) return;

    try {
      setConsolidationState(prev => ({
        ...prev,
        isProcessing: true,
        progress: { step: 'Creating consolidated file', current: 90, total: 100 },
      }));

      // This would typically create the file with the approved content
      // For now, we'll simulate the completion
      setTimeout(() => {
        setConsolidationState(prev => ({
          ...prev,
          isProcessing: false,
          progress: null,
        }));
        closeConsolidation();
      }, 1000);

    } catch (error) {
      console.error('Approval error:', error);
      setConsolidationState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Failed to approve consolidation',
      }));
    }
  }, [consolidationState.consolidatedContent, closeConsolidation]);

  // Reject consolidated content
  const rejectConsolidation = useCallback(() => {
    setConsolidationState(prev => ({
      ...prev,
      consolidatedContent: null,
      sourceProvenanceMap: null,
      progress: null,
      error: null,
    }));
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return {
    // State
    consolidationState,
    childBranches,
    hasChildren,

    // Actions
    openConsolidation,
    closeConsolidation,
    updateSelectedBranches,
    updateFileName,
    updateTargetFolder,
    startConsolidation,
    approveConsolidation,
    rejectConsolidation,
  };
}