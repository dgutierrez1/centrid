/**
 * Agent Request Routes
 * Handles agent execution tracking and real-time event streaming
 * ✅ CLEAN - Delegates to services
 * ✅ REAL-TIME - Events written to agent_execution_events table, streamed via Supabase Realtime
 */

import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { agentRequestRepository } from '../../../repositories/agentRequest.ts';
import { agentToolCallRepository } from '../../../repositories/agentToolCall.ts';
import { agentExecutionEventRepository } from '../../../repositories/agentExecutionEvent.ts';
import { AgentExecutionService } from '../../../services/agentExecution.ts';
import { agentExecutionEventBus } from '../../../services/agentExecutionEventBus.ts';
import type { AppContext } from '../types.ts';

const app = new Hono<{ Variables: AppContext }>();

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /api/agent-requests/:requestId
 * Get agent request status and results
 */
app.get('/:requestId', async (c) => {
  const requestId = c.req.param('requestId');
  const userId = c.get('userId');

  // Validate UUID
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      requestId
    )
  ) {
    return c.json({ error: 'Invalid request ID format' }, 400);
  }

  try {
    const request = await agentRequestRepository.findById(requestId);

    if (!request) {
      return c.json({ error: 'Request not found' }, 404);
    }

    if (request.userId !== userId) {
      return c.json({ error: 'Access denied' }, 403);
    }

    return c.json({
      data: {
        id: request.id,
        status: request.status,
        progress: request.progress,
        triggeringMessageId: request.triggeringMessageId,
        responseMessageId: request.responseMessageId,
        results: request.results,
        tokenCost: request.tokenCost,
        canResume: request.status === 'in_progress',
        createdAt: request.createdAt,
        completedAt: request.completedAt,
      },
    });
  } catch (error) {
    console.error('Failed to get agent request:', error);
    return c.json({ error: 'Failed to fetch request' }, 500);
  }
});

/**
 * GET /api/agent-requests/:requestId/execute
 * INTERNAL ENDPOINT: Execute agent and batch-write events to DB
 *
 * Called by POST /messages (fire-and-forget)
 * Collects execution events and persists them periodically
 * SSE clients read from DB and get early events
 */
app.get('/:requestId/execute', async (c) => {
  const requestId = c.req.param('requestId');

  // Validate UUID
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      requestId
    )
  ) {
    return c.json({ error: 'Invalid request ID format' }, 400);
  }

  try {
    const request = await agentRequestRepository.findById(requestId);
    if (!request) {
      console.error('[Execute] Request not found:', requestId);
      return c.json({ error: 'Request not found' }, 404);
    }

    const userId = request.userId;

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

      // NEW: Check if we're resuming from checkpoint
      const isResume = request.checkpoint ? true : false;
      console.log('[Execute] Execution mode:', {
        requestId,
        isResume,
        hasCheckpoint: !!request.checkpoint,
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
          { isResume } // NEW: Pass resume option
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
            await agentExecutionEventRepository.create({
              requestId,
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
          await agentRequestRepository.update(requestId, {
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
        throw generatorError; // Re-throw to mark as failed
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
      await agentRequestRepository.update(requestId, {
        status: 'completed',
        progress: 1.0,
        completedAt: new Date(),
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

      return c.json({ status: 'completed', eventCount: allEvents.length });
    } catch (executionError) {
      console.error('[Execute] Execution failed:', executionError);

      // Mark request as failed
      try {
        await agentRequestRepository.update(requestId, {
          status: 'failed',
          progress: 1.0,
          completedAt: new Date(),
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

      return c.json(
        {
          status: 'failed',
          error:
            executionError instanceof Error
              ? executionError.message
              : 'Execution failed',
        },
        500
      );
    }
  } catch (error) {
    console.error('[Execute] Unexpected error:', error);
    return c.json(
      {
        error: 'Execution error',
        details: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

/**
 * GET /api/agent-requests/:requestId/stream
 * Stream agent execution via Server-Sent Events
 *
 * LOADS FROM DB + SUBSCRIBES TO LIVE UPDATES
 * ✅ DB events replayed first (execution may be fast)
 * ✅ New events from event bus streamed live
 * ✅ Complete event history available
 */
app.get('/:requestId/stream', async (c) => {
  const requestId = c.req.param('requestId');
  const userId = c.get('userId');

  // ============================================================================
  // Access Control Checks (lightweight, security only)
  // ============================================================================

  // Validate UUID format
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      requestId
    )
  ) {
    return c.json({ error: 'Invalid request ID format' }, 400);
  }

  try {
    // Load request and verify ownership
    const request = await agentRequestRepository.findById(requestId);
    if (!request) {
      return c.json({ error: 'Request not found' }, 404);
    }

    if (request.userId !== userId) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Note: We don't check for 'completed' status anymore
    // SSE will replay buffered events even if execution is done
    // This allows clients to connect late and see what happened

    // ========================================================================
    // Stream agent execution
    // Replay buffered events + subscribe to new ones
    // ========================================================================

    return streamSSE(c, async (stream) => {
      try {
        console.log('[AgentRequest] Starting agent stream:', {
          requestId,
          userId,
          bufferSize: agentExecutionEventBus.getBufferSize(requestId),
        });

        // ====================================================================
        // STEP 1: Load persisted events from DB (execution may be running)
        // ====================================================================

        const persistedRequest = await agentRequestRepository.findById(requestId);
        const persistedEvents = (persistedRequest?.results as any)?.events || [];

        console.log('[AgentRequest] Replaying persisted events from DB:', {
          requestId,
          count: persistedEvents.length,
          status: persistedRequest?.status,
          hasResults: !!persistedRequest?.results,
          resultsKeys: persistedRequest?.results ? Object.keys(persistedRequest.results) : [],
          firstEventStructure: persistedEvents[0] ? Object.keys(persistedEvents[0]) : 'N/A',
          resultsType: typeof persistedRequest?.results,
          resultsValue: JSON.stringify(persistedRequest?.results).substring(0, 200),
        });

        // Replay all persisted events
        const seenTimestamps = new Set<number>();
        let replayCount = 0;
        for (const event of persistedEvents) {
          replayCount++;
          console.log('[AgentRequest] Replaying event:', {
            eventNumber: replayCount,
            type: event.type,
            timestamp: event.timestamp,
            hasData: !!event.data,
            dataKeys: event.data ? Object.keys(event.data) : 'no data',
            eventStructure: JSON.stringify(event).substring(0, 300),
          });

          try {
            const ssePayload = {
              data: JSON.stringify(event.data),
              event: event.type,
              id: String(event.timestamp),
            };
            console.log('[AgentRequest] Writing SSE:', ssePayload);
            await stream.writeSSE(ssePayload);
            console.log('[AgentRequest] SSE written successfully for event', replayCount);
          } catch (writeError) {
            console.error('[AgentRequest] Failed to write SSE for event', replayCount, {
              error: writeError instanceof Error ? writeError.message : String(writeError),
              stack: writeError instanceof Error ? writeError.stack : undefined,
            });
          }

          seenTimestamps.add(event.timestamp);
        }

        console.log('[AgentRequest] Finished replaying persisted events, sent:', replayCount);

        // ====================================================================
        // STEP 2: Poll DB for new events until execution completes
        // ====================================================================

        let isExecutionComplete = persistedRequest?.status === 'completed';
        let lastEventCount = persistedEvents.length;

        const pollInterval = setInterval(async () => {
          try {
            // Fetch latest request to check for new events
            const latestRequest = await agentRequestRepository.findById(requestId);
            if (!latestRequest) {
              console.warn('[AgentRequest] Request disappeared from DB:', { requestId });
              return;
            }

            const latestEvents = (latestRequest.results as any)?.events || [];
            const newEventCount = latestEvents.length;

            // Check for new events since last poll
            if (newEventCount > lastEventCount) {
              const newEvents = latestEvents.slice(lastEventCount);

              console.log('[AgentRequest] New events detected:', {
                requestId,
                newEventCount: newEvents.length,
                totalEvents: newEventCount,
              });

              // Send new events to client
              for (const event of newEvents) {
                try {
                  console.log('[AgentRequest] Streaming event:', {
                    type: event.type,
                    hasData: !!event.data,
                    dataKeys: event.data ? Object.keys(event.data) : [],
                  });

                  await stream.writeSSE({
                    data: JSON.stringify(event.data),
                    event: event.type,
                    id: String(event.timestamp),
                  });

                  console.log('[AgentRequest] SSE event sent:', {
                    requestId,
                    type: event.type,
                    eventNumber: lastEventCount + 1,
                  });

                  lastEventCount++;
                } catch (writeError) {
                  console.error('[AgentRequest] Failed to write SSE:', {
                    error: writeError instanceof Error ? writeError.message : String(writeError),
                  });
                  break; // Stop polling if SSE write fails
                }
              }
            }

            // Check if execution is complete
            if (latestRequest.status === 'completed' || latestRequest.status === 'failed') {
              isExecutionComplete = true;
              console.log('[AgentRequest] Execution marked as', latestRequest.status);
            }
          } catch (pollError) {
            console.error('[AgentRequest] Poll error:', {
              requestId,
              error: pollError instanceof Error ? pollError.message : String(pollError),
            });
          }
        }, 200); // Poll more frequently for better responsiveness

        // Stop polling when execution completes
        const completionCheckInterval = setInterval(() => {
          if (isExecutionComplete) {
            clearInterval(pollInterval);
            clearInterval(completionCheckInterval);
            console.log('[AgentRequest] Polling stopped, execution complete');
          }
        }, 100);

        // Cleanup on disconnect
        stream.onAbort(() => {
          clearInterval(pollInterval);
          clearInterval(completionCheckInterval);
          console.log('[AgentRequest] Client disconnected', { requestId });
        });
      } catch (error) {
        console.error('[AgentRequest] Agent stream error:', error);

        // Stream error event to client
        await stream.writeSSE({
          data: JSON.stringify({
            error: error instanceof Error ? error.message : 'Stream failed',
          }),
          event: 'error',
        });
      }
    });
  } catch (error) {
    console.error('[AgentRequest] Failed to start stream:', error);
    return c.json(
      {
        error: 'Failed to start agent stream',
        details: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

/**
 * GET /api/agent-requests/:requestId/pending-tools
 * Get pending tool calls for a request
 */
app.get('/:requestId/pending-tools', async (c) => {
  const requestId = c.req.param('requestId');
  const userId = c.get('userId');

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      requestId
    )
  ) {
    return c.json({ error: 'Invalid request ID format' }, 400);
  }

  try {
    const request = await agentRequestRepository.findById(requestId);

    if (!request) {
      return c.json({ error: 'Request not found' }, 404);
    }

    if (request.userId !== userId) {
      return c.json({ error: 'Access denied' }, 403);
    }

    const pendingTools = await agentToolCallRepository.findPendingByRequestId(
      requestId
    );

    return c.json({
      data: pendingTools,
      meta: {
        count: pendingTools.length,
        requestId,
      },
    });
  } catch (error) {
    console.error('Failed to get pending tools:', error);
    return c.json({ error: 'Failed to fetch pending tools' }, 500);
  }
});

export { app as agentRequestRoutes };
