/**
 * Thread Routes
 * Handles thread CRUD operations, branching, and nested message operations
 * ? CLEAN - All business logic delegated to ThreadService and MessageService
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { streamSSE } from 'hono/streaming';
import { ThreadService } from '../../../services/threadService.ts';
import { MessageService } from '../../../services/messageService.ts';
import { AgentExecutionService } from '../../../services/agentExecution.ts';
import { agentExecutionEventBus } from '../../../services/agentExecutionEventBus.ts';
import { messageRepository } from '../../../repositories/message.ts';
import { threadRepository } from '../../../repositories/thread.ts';
import { agentToolCallRepository } from '../../../repositories/agentToolCall.ts';
import { agentRequestRepository } from '../../../repositories/agentRequest.ts';
import type { AppContext } from '../types.ts';

const app = new Hono<{ Variables: AppContext }>();

// ============================================================================
// Validation Schemas
// ============================================================================

const createThreadSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  parentId: z.string().uuid('Invalid parent ID').nullable().optional(),
});

const updateThreadSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  summary: z.string().max(1000).optional(),
});

const createMessageSchema = z.object({
  content: z.string().min(1, 'Content is required').max(10000, 'Message too long'),
  contextReferences: z.array(z.any()).optional(),
});

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /api/threads
 * List all root threads for authenticated user
 */
app.get('/', async (c) => {
  const userId = c.get('userId');
  const includeArchived = c.req.query('includeArchived') === 'true';

  try {
    const threads = await ThreadService.listThreads(userId, includeArchived);
    
    return c.json({
      data: threads,
      meta: {
        count: threads.length,
        includeArchived,
      },
    });
  } catch (error) {
    console.error('Failed to list threads:', error);
    return c.json({ error: 'Failed to fetch threads' }, 500);
  }
});

/**
 * POST /api/threads
 * Create new thread (root or branch)
 */
app.post('/', async (c) => {
  const userId = c.get('userId');
  
  let body;
  try {
    body = await c.req.json();
  } catch (error) {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  // Validate input
  const parsed = createThreadSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({
      error: 'Validation failed',
      details: parsed.error.format(),
    }, 400);
  }

  try {
    const thread = await ThreadService.createThread({
      userId,
      title: parsed.data.title,
      parentId: parsed.data.parentId,
    });

    return c.json({ data: thread }, 201);
  } catch (error) {
    console.error('Failed to create thread:', error);
    
    // Check for specific business logic errors
    if (error instanceof Error) {
      if (error.message.includes('Parent thread not found')) {
        return c.json({ error: error.message }, 404);
      }
      if (error.message.includes('Access denied')) {
        return c.json({ error: error.message }, 403);
      }
    }
    
    return c.json({ error: 'Failed to create thread' }, 500);
  }
});

/**
 * GET /api/threads/:id
 * Get single thread with messages
 */
app.get('/:id', async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');

  // Validate UUID
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return c.json({ error: 'Invalid thread ID format' }, 400);
  }

  try {
    const thread = await ThreadService.getThread(id, userId);
    return c.json({ data: thread });
  } catch (error) {
    console.error('Failed to get thread:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Thread not found')) {
        return c.json({ error: error.message }, 404);
      }
      if (error.message.includes('Access denied')) {
        return c.json({ error: error.message }, 403);
      }
    }
    
    return c.json({ error: 'Failed to fetch thread' }, 500);
  }
});

/**
 * PUT /api/threads/:id
 * Update thread (rename, update summary)
 */
app.put('/:id', async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');

  // Validate UUID
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return c.json({ error: 'Invalid thread ID format' }, 400);
  }

  let body;
  try {
    body = await c.req.json();
  } catch (error) {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  // Validate input
  const parsed = updateThreadSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({
      error: 'Validation failed',
      details: parsed.error.format(),
    }, 400);
  }

  try {
    const updated = await ThreadService.updateThread(id, userId, {
      title: parsed.data.title,
      summary: parsed.data.summary,
    });

    return c.json({ data: updated });
  } catch (error) {
    console.error('Failed to update thread:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Thread not found')) {
        return c.json({ error: error.message }, 404);
      }
      if (error.message.includes('Access denied')) {
        return c.json({ error: error.message }, 403);
      }
    }
    
    return c.json({ error: 'Failed to update thread' }, 500);
  }
});

/**
 * DELETE /api/threads/:id
 * Delete thread (only if no children)
 */
app.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');

  // Validate UUID
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return c.json({ error: 'Invalid thread ID format' }, 400);
  }

  try {
    await ThreadService.deleteThread(id, userId);
    return c.json({ data: { success: true } }, 200);
  } catch (error) {
    console.error('Failed to delete thread:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Thread not found')) {
        return c.json({ error: error.message }, 404);
      }
      if (error.message.includes('Access denied')) {
        return c.json({ error: error.message }, 403);
      }
      if (error.message.includes('Cannot delete thread')) {
        return c.json({ error: error.message }, 400);
      }
    }
    
    return c.json({ error: 'Failed to delete thread' }, 500);
  }
});

/**
 * GET /api/threads/:id/children
 * Get child branches of a thread
 */
app.get('/:id/children', async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');

  // Validate UUID
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return c.json({ error: 'Invalid thread ID format' }, 400);
  }

  try {
    const children = await ThreadService.getChildren(id, userId);

    return c.json({
      data: children,
      meta: {
        count: children.length,
        parentId: id,
      },
    });
  } catch (error) {
    console.error('Failed to get children:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Thread not found')) {
        return c.json({ error: error.message }, 404);
      }
      if (error.message.includes('Access denied')) {
        return c.json({ error: error.message }, 403);
      }
    }
    
    return c.json({ error: 'Failed to fetch child branches' }, 500);
  }
});

// ============================================================================
// Nested Message Routes
// ============================================================================

/**
 * POST /api/threads/:threadId/messages
 * Create message in thread (triggers AI processing)
 *
 * VALIDATION PATTERN:
 * 1. Validate request format (UUID, JSON, schema)
 * 2. Validate preconditions (thread exists, user owns, API configured)
 * 3. If all pass: Create message + agent_request
 * 4. Return 201 immediately (execution happens async via SSE)
 */
app.post('/:threadId/messages', async (c) => {
  const threadId = c.req.param('threadId');
  const userId = c.get('userId');

  // ============================================================================
  // STEP 1: Validate request format
  // ============================================================================

  // Validate UUID
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(threadId)) {
    return c.json({ error: 'Invalid thread ID format' }, 400);
  }

  let body;
  try {
    body = await c.req.json();
  } catch (error) {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  // Validate input schema
  const parsed = createMessageSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({
      error: 'Validation failed',
      details: parsed.error.format(),
    }, 400);
  }

  // ============================================================================
  // STEP 2: Validate preconditions (fail fast before creating records)
  // ============================================================================

  try {
    // Check thread exists and user owns it
    const thread = await threadRepository.findById(threadId);
    if (!thread) {
      return c.json({ error: 'Thread not found' }, 404);
    }
    if (thread.ownerUserId !== userId) {
      return c.json({ error: 'Access denied: You do not own this thread' }, 403);
    }

    // Check agent service is configured
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      return c.json(
        {
          error: 'Agent service unavailable',
          details: 'Server not configured for AI processing',
        },
        503
      );
    }

    // ========================================================================
    // STEP 3: All validation passed - create message + agent_request
    // ========================================================================

    console.log('[ThreadsRoute] POST /messages - Validation passed, creating message', {
      threadId,
      userId,
    });

    const message = await MessageService.createMessage({
      threadId,
      userId,
      content: parsed.data.content,
      role: 'user',
      contextReferences: parsed.data.contextReferences || [],
    });

    console.log('[ThreadsRoute] POST /messages - Message created successfully', {
      messageId: message.id,
      requestId: message._embedded?.requestId,
    });

    // ========================================================================
    // STEP 4: Fire /execute endpoint (fire-and-forget, decoupled execution)
    // ========================================================================

    if (message._embedded?.requestId) {
      const requestId = message._embedded.requestId;

      // Fire internal execute request (don't await - fire and forget)
      // SSE clients will load from DB and get early events
      (async () => {
        try {
          const supabaseUrl = Deno.env.get('SUPABASE_URL');
          const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

          if (!supabaseUrl || !serviceRoleKey) {
            console.error('[ThreadsRoute] Missing Supabase config for execute request');
            return;
          }

          const executeUrl = `${supabaseUrl}/functions/v1/api/agent-requests/${requestId}/execute`;

          console.log('[ThreadsRoute] Firing execute endpoint', {
            requestId,
            url: executeUrl,
          });

          // Set timeout to 30 minutes for long-running executions
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30 * 60 * 1000);

          try {
            const response = await fetch(executeUrl, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': 'application/json',
              },
              signal: controller.signal,
            });

            console.log('[ThreadsRoute] Execute endpoint response:', {
              requestId,
              status: response.status,
              statusText: response.statusText,
            });

            if (!response.ok) {
              const error = await response.text();
              console.error('[ThreadsRoute] Execute endpoint failed:', {
                requestId,
                status: response.status,
                error: error.substring(0, 500),  // First 500 chars of error
              });
            } else {
              const result = await response.json();
              console.log('[ThreadsRoute] Execute endpoint succeeded:', {
                requestId,
                result,
              });
            }
          } finally {
            clearTimeout(timeoutId);
          }
        } catch (error) {
          console.error('[ThreadsRoute] Failed to fire execute endpoint:', error);
          // Continue - execution will fail and mark request as failed
        }
      })();
    }

    // ========================================================================
    // STEP 5: Return 201 immediately
    // Execution is happening in background, SSE will stream updates
    // ========================================================================

    return c.json({ data: message }, 201);
  } catch (error) {
    console.error('[ThreadsRoute] POST /messages - Unexpected error:', error);
    return c.json(
      {
        error: 'Failed to create message',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * GET /api/threads/:threadId/messages
 * List messages for a thread
 */
app.get('/:threadId/messages', async (c) => {
  const threadId = c.req.param('threadId');
  const userId = c.get('userId');

  // Validate UUID
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(threadId)) {
    return c.json({ error: 'Invalid thread ID format' }, 400);
  }

  try {
    // Verify thread exists and user owns it
    const thread = await threadRepository.findById(threadId);
    
    if (!thread) {
      return c.json({ error: 'Thread not found' }, 404);
    }

    if (thread.ownerUserId !== userId) {
      return c.json({ error: 'Access denied' }, 403);
    }

    const messages = await messageRepository.findByThreadId(threadId);

    return c.json({
      data: messages,
      meta: {
        count: messages.length,
        threadId,
      },
    });
  } catch (error) {
    console.error('Failed to list messages:', error);
    return c.json({ error: 'Failed to fetch messages' }, 500);
  }
});

/**
 * GET /api/threads/:threadId/messages/:messageId/stream
 * Stream agent execution via Server-Sent Events
 */
app.get('/:threadId/messages/:messageId/stream', async (c) => {
  const threadId = c.req.param('threadId');
  const messageId = c.req.param('messageId');
  const userId = c.get('userId');

  // Validate UUIDs
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(threadId) || !uuidRegex.test(messageId)) {
    return c.json({ error: 'Invalid UUID format' }, 400);
  }

  try {
    // Return SSE stream
    return streamSSE(c, async (stream) => {
      try {
        console.log('Starting agent stream:', { threadId, messageId, userId });

        // Execute agent and stream responses
        const generator = AgentExecutionService.executeStream(userId, threadId, messageId);
        
        for await (const chunk of generator) {
          await stream.writeSSE({
            data: JSON.stringify(chunk),
            event: chunk.type || 'message',
            id: String(Date.now()),
          });
        }

        await stream.writeSSE({
          data: JSON.stringify({ status: 'complete' }),
          event: 'done',
        });

        console.log('Agent stream completed');

      } catch (error) {
        console.error('Agent stream error:', error);
        
        await stream.writeSSE({
          data: JSON.stringify({
            error: error instanceof Error ? error.message : 'Stream failed',
          }),
          event: 'error',
        });
      }
    });

  } catch (error) {
    console.error('Failed to start agent stream:', error);
    return c.json({
      error: 'Failed to start agent stream',
      details: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});

/**
 * GET /api/threads/:threadId/pending-tools
 * Get all pending tool calls for a thread
 */
app.get('/:threadId/pending-tools', async (c) => {
  const threadId = c.req.param('threadId');
  const userId = c.get('userId');

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      threadId
    )
  ) {
    return c.json({ error: 'Invalid thread ID format' }, 400);
  }

  try {
    // Verify thread access
    const thread = await threadRepository.findById(threadId);

    if (!thread) {
      return c.json({ error: 'Thread not found' }, 404);
    }

    if (thread.ownerUserId !== userId) {
      return c.json({ error: 'Access denied' }, 403);
    }

    const pendingTools = await agentToolCallRepository.findPendingByThreadId(
      threadId
    );

    return c.json({
      data: pendingTools,
      meta: {
        count: pendingTools.length,
        threadId,
      },
    });
  } catch (error) {
    console.error('Failed to get pending tools:', error);
    return c.json({ error: 'Failed to fetch pending tools' }, 500);
  }
});

export { app as threadRoutes };
