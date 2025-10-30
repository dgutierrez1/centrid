/**
 * Tool Call Routes
 * Handles tool call approval/rejection during agent execution
 * ✅ RESTful - Tool calls as proper resource
 * NEW: Approval triggers /execute with checkpoint/resume
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { AgentExecutionService } from '../../../services/agentExecution.ts';
import { agentToolCallRepository } from '../../../repositories/agentToolCall.ts';
import { agentRequestRepository } from '../../../repositories/agentRequest.ts';
import { agentExecutionEventRepository } from '../../../repositories/agentExecutionEvent.ts';
import type { AppContext } from '../types.ts';

const app = new Hono<{ Variables: AppContext }>();

// ============================================================================
// Validation Schemas
// ============================================================================

const approvalSchema = z.object({
  approved: z.boolean(),
  reason: z.string().optional(),
});

// ============================================================================
// Routes
// ============================================================================

/**
 * PATCH /api/tool-calls/:toolCallId
 * Approve or reject a tool call during agent execution
 * NEW: Approval triggers /execute with checkpoint/resume
 */
app.patch('/:toolCallId', async (c) => {
  const toolCallId = c.req.param('toolCallId');
  const userId = c.get('userId');

  // Validate UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(toolCallId)) {
    return c.json({ error: 'Invalid tool call ID format' }, 400);
  }

  let body;
  try {
    body = await c.req.json();
  } catch (error) {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  // Validate input
  const parsed = approvalSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({
      error: 'Validation failed',
      details: parsed.error.format(),
    }, 400);
  }

  try {
    // Fetch tool call and verify ownership
    const toolCall = await agentToolCallRepository.findById(toolCallId);
    if (!toolCall || toolCall.ownerUserId !== userId) {
      return c.json({ error: 'Tool call not found or access denied' }, 404);
    }

    // Get the request ID
    const requestId = toolCall.requestId;
    if (!requestId) {
      return c.json({ error: 'Tool call not associated with a request' }, 400);
    }

    // Fetch the request to verify ownership
    const request = await agentRequestRepository.findById(requestId);
    if (!request || request.userId !== userId) {
      return c.json({ error: 'Request not found or access denied' }, 403);
    }

    if (parsed.data.approved) {
      // NEW: Approve and resume execution
      console.log('[ToolCall] Approving tool call and resuming execution:', {
        toolCallId,
        requestId,
      });

      // NEW: Execute the tool immediately (synchronously)
      console.log('[ToolCall] Executing approved tool:', {
        toolName: toolCall.toolName,
        toolCallId,
      });

      const toolResult = await AgentExecutionService.executeTool(
        toolCall.toolName,
        toolCall.toolInput,
        toolCall.threadId,
        userId
      );

      console.log('[ToolCall] Tool executed, result:', {
        toolCallId,
        resultLength: JSON.stringify(toolResult).length,
      });

      // NEW: Store tool result + status in database (in one call)
      console.log('[ToolCall] Storing tool result and status in database:', { toolCallId });
      await agentToolCallRepository.updateStatus(toolCallId, 'approved', toolResult);

      // NEW: Emit tool_result event
      await agentExecutionEventRepository.create({
        requestId,
        type: 'tool_result',
        data: {
          toolCallId,
          result: toolResult,
        },
      });

      // NEW: Call /execute (resume) to continue execution with tool result
      console.log('[ToolCall] Resuming execution with tool result:', {
        requestId,
        toolCallId,
      });

      // Run execution in background (fire-and-forget)
      // This will load checkpoint and continue the conversation
      setImmediate(async () => {
        try {
          const allEvents: any[] = [];
          const generator = AgentExecutionService.executeStreamByRequest(
            requestId,
            userId,
            { isResume: true } // Resume from checkpoint
          );

          let eventCount = 0;
          for await (const chunk of generator) {
            eventCount++;

            // Create event object
            const event = {
              type: chunk.type || 'message',
              timestamp: Date.now(),
              data: chunk,
            };

            allEvents.push(event);

            // Write event to DB
            try {
              await agentExecutionEventRepository.create({
                requestId,
                type: event.type,
                data: event.data,
              });
              console.log('[ToolCall] Event persisted:', {
                requestId,
                type: event.type,
                eventNumber: eventCount,
              });
            } catch (eventWriteError) {
              console.error('[ToolCall] Failed to write event:', {
                error: eventWriteError instanceof Error ? eventWriteError.message : String(eventWriteError),
              });
            }
          }

          console.log('[ToolCall] Resume execution completed:', {
            requestId,
            totalEvents: allEvents.length,
          });
        } catch (executeError) {
          console.error('[ToolCall] Resume execution failed:', {
            error: executeError instanceof Error ? executeError.message : String(executeError),
            requestId,
          });

          // Mark request as failed
          try {
            await agentRequestRepository.update(requestId, {
              status: 'failed',
              progress: 1.0,
              completedAt: new Date(),
            });
          } catch (updateError) {
            console.error('[ToolCall] Failed to update request status:', updateError);
          }
        }
      });

      return c.json({
        data: {
          success: true,
          toolCallId,
          approved: true,
          message: 'Tool approved and execution resumed',
        },
      });
    } else {
      // Reject tool call
      console.log('[ToolCall] Rejecting tool call:', {
        toolCallId,
        reason: parsed.data.reason,
      });

      // Update tool call status
      await agentToolCallRepository.rejectWithRevisionTracking(
        toolCallId,
        parsed.data.reason
      );

      // Update request status to rejected
      await agentRequestRepository.update(requestId, {
        status: 'rejected',
        checkpoint: null, // Clear checkpoint
        completedAt: new Date(),
      });

      console.log('[ToolCall] Tool call rejected and request marked as rejected:', {
        toolCallId,
        requestId,
      });

      return c.json({
        data: {
          success: true,
          toolCallId,
          approved: false,
          message: 'Tool rejected and request terminated',
        },
      });
    }

  } catch (error) {
    console.error('Failed to process tool approval:', error);
    return c.json({
      error: 'Failed to process tool approval',
      details: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});

export { app as toolCallRoutes };
