/**
 * Agent Request Service
 * Business logic layer for agent request operations
 * Routes should call this service instead of repositories directly
 */

import { agentRequestRepository } from '../repositories/agentRequest.ts';
import { agentToolCallRepository } from '../repositories/agentToolCall.ts';
import { agentExecutionEventRepository } from '../repositories/agentExecutionEvent.ts';
import { AgentExecutionService } from './agentExecution.ts';
import { agentExecutionEventBus } from './agentExecutionEventBus.ts';
import { createLogger } from '../utils/logger.ts';
import type {
  AgentRequest,
  AgentToolCall,
  InsertAgentExecutionEvent,
  InsertAgentRequest,
} from '../db/types.js';

const logger = createLogger('AgentRequestService');

export class AgentRequestService {
  /**
   * Get agent request by ID
   */
  static async getById(requestId: string): Promise<AgentRequest | null> {
    return agentRequestRepository.findById(requestId);
  }

  /**
   * Update agent request
   */
  static async update(
    requestId: string,
    updates: Partial<Pick<InsertAgentRequest, 'status' | 'progress' | 'responseMessageId' | 'results' | 'checkpoint' | 'tokenCost' | 'completedAt'>>
  ): Promise<AgentRequest> {
    return agentRequestRepository.update(requestId, updates);
  }

  /**
   * Get pending tool calls for a request
   */
  static async getPendingToolCalls(requestId: string): Promise<AgentToolCall[]> {
    return agentToolCallRepository.findPendingByRequestId(requestId);
  }

  /**
   * Create execution event
   */
  static async createExecutionEvent(event: InsertAgentExecutionEvent): Promise<void> {
    await agentExecutionEventRepository.create(event);
  }

  /**
   * Execute agent request and persist events to database
   * Shared by REST endpoint and GraphQL mutation
   * EXTRACTED FROM: apps/api/src/functions/api/routes/agent-requests.ts lines 91-305
   */
  static async executeRequest(requestId: string): Promise<{
    status: 'completed' | 'failed';
    eventCount: number;
    error?: string;
  }> {
    try {
      const request = await AgentRequestService.getById(requestId);
      if (!request) {
        console.error('[Execute] Request not found:', requestId);
        return { status: 'failed', eventCount: 0, error: 'Request not found' };
      }

      const {userId} = request;

      console.log('[Execute] ===== EXECUTING REQUEST =====');
      logger.info('🔥 Execution starting', {
        requestId,
        timestamp: new Date().toISOString(),
        deployVersion: '2025-11-09-shared'
      });

      console.log('[Execute] Starting execution:', {
        requestId,
        userId,
        status: request.status,
      });

      // ========================================================================
      // Run execution and collect events
      // ========================================================================

      const allEvents: any[] = [];

      try {
        console.log('[Execute] ========== EXECUTION START ==========', {
          requestId,
          userId,
          timestamp: new Date().toISOString(),
        });

        // ✅ STATELESS RESUME: Check if assistant message already exists
        const isResume = request.responseMessageId !== null;
        console.log('[Execute] Execution mode:', {
          requestId,
          isResume,
          hasResponseMessage: !!request.responseMessageId,
          responseMessageId: request.responseMessageId,
        });

        console.log('[Execute] Creating execution generator for request:', {
          requestId,
          userId,
          isResume,
        });

        let generator;
        try {
          generator = AgentExecutionService.executeStreamByRequest(
            requestId,
            userId,
            { isResume }
          );
          console.log('[Execute] Generator created successfully');
        } catch (generatorError) {
          console.error('[Execute] Failed to create generator:', {
            error: generatorError instanceof Error ? generatorError.message : String(generatorError),
            stack: generatorError instanceof Error ? generatorError.stack : undefined,
          });
          throw generatorError;
        }

        let eventCount = 0;
        try {
          for await (const chunk of generator) {
            eventCount++;

            // Create event object with metadata
            const event = {
              type: chunk.type || 'message',
              timestamp: Date.now(),
              data: chunk,
            };

            allEvents.push(event);

            // ✅ Write event to agent_execution_events table (for real-time streaming)
            try {
              await AgentRequestService.createExecutionEvent({
                requestId,
                userId, // Required for realtime RLS policy
                type: event.type,
                data: event.data,
              });
              console.log('[Execute] Event persisted to agent_execution_events:', {
                requestId,
                type: event.type,
                eventNumber: eventCount,
              });
            } catch (eventWriteError) {
              console.error('[Execute] Failed to write event to table:', {
                error: eventWriteError instanceof Error ? eventWriteError.message : String(eventWriteError),
              });
              // Continue execution even if event write fails
            }

            // Write to agent_requests.results for backward compatibility
            await AgentRequestService.update(requestId, {
              results: {
                events: allEvents,
              },
              progress: 0.5 + (allEvents.length * 0.5) / 100,
            });

            // Emit to event bus (for any direct subscribers)
            agentExecutionEventBus.emit(requestId, event as any);

            console.log('[Execute] Event processed:', {
              requestId,
              type: event.type,
              eventNumber: eventCount,
              totalEvents: allEvents.length,
            });
          }
        } catch (generatorError) {
          console.error('[Execute] Generator iteration failed:', {
            error: generatorError instanceof Error ? generatorError.message : String(generatorError),
            stack: generatorError instanceof Error ? generatorError.stack : undefined,
            eventCountBeforeError: eventCount,
          });
          throw generatorError;
        }

        // Check if we got any events at all
        if (eventCount === 0) {
          console.warn('[Execute] WARNING: Generator yielded 0 events!', {
            requestId,
            userId,
          });
        }

        // ========================================================================
        // Final write and completion
        // ========================================================================

        console.log('[Execute] Execution generator complete, finalizing');

        // Mark as completed with all events in one update
        await AgentRequestService.update(requestId, {
          status: 'completed',
          progress: 1.0,
          completedAt: new Date().toISOString(),
          results: {
            events: allEvents,
          },
        });

        console.log('[Execute] Execution completed successfully:', {
          requestId,
          totalEvents: allEvents.length,
        });

        // Clear event bus buffer (no more subscribers expected)
        agentExecutionEventBus.clearBuffer(requestId);

        return { status: 'completed', eventCount: allEvents.length };
      } catch (executionError) {
        console.error('[Execute] Execution failed:', executionError);

        // Mark request as failed
        try {
          await AgentRequestService.update(requestId, {
            status: 'failed',
            progress: 1.0,
            completedAt: new Date().toISOString(),
            results: {
              error:
                executionError instanceof Error
                  ? executionError.message
                  : 'Execution failed',
              events: allEvents, // Persist partial results
            },
          });
        } catch (updateError) {
          console.error('[Execute] Failed to update error status:', updateError);
        }

        // Emit error event to live subscribers
        agentExecutionEventBus.emit(requestId, {
          type: 'error',
          timestamp: Date.now(),
          data: {
            error:
              executionError instanceof Error
                ? executionError.message
                : 'Execution failed',
          },
        } as any);

        return {
          status: 'failed',
          eventCount: allEvents.length,
          error: executionError instanceof Error ? executionError.message : 'Execution failed'
        };
      }
    } catch (error) {
      console.error('[Execute] Unexpected error:', error);
      return {
        status: 'failed',
        eventCount: 0,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}
