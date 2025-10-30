/**
 * ConsolidationService - AI agent consolidation operations
 *
 * Handles consolidating multiple AI agent branches into a single response
 *
 * All requests automatically get:
 * - Auth header injection
 * - Retry on 5xx errors
 * - Consistent error handling
 * - SSE streaming support
 */

import { api } from '@/lib/api/client';

export interface ConsolidationInput {
  thread_id: string;
  branch_ids: string[];
  context_document_ids?: string[];
}

export interface ConsolidationProgress {
  stage: string;
  progress: number; // 0-1
  message?: string;
}

export interface ConsolidatedResult {
  id: string;
  thread_id: string;
  content: string;
  created_at: string;
}

export const ConsolidationService = {
  /**
   * Consolidate multiple branches using AI
   *
   * Streams progress updates via Server-Sent Events
   *
   * @param input - Consolidation parameters
   * @param onProgress - Callback fired for each progress update
   * @returns Consolidated result
   */
  async consolidateBranches(
    input: ConsolidationInput,
    onProgress?: (progress: ConsolidationProgress) => void
  ): Promise<ConsolidatedResult> {
    return new Promise((resolve, reject) => {
      api.stream('/consolidate-branches', (chunk) => {
        try {
          // Parse SSE chunk
          const data = JSON.parse(chunk) as ConsolidationProgress | ConsolidatedResult;

          // Check if it's a progress update or final result
          if ('stage' in data && 'progress' in data) {
            // Progress update
            if (onProgress) {
              onProgress(data as ConsolidationProgress);
            }
          } else if ('id' in data && 'content' in data) {
            // Final result
            resolve(data as ConsolidatedResult);
          }
        } catch (error) {
          reject(error);
        }
      }).catch(reject);
    });
  },
};

// Lowercase alias for convenience
export const consolidationService = ConsolidationService;
