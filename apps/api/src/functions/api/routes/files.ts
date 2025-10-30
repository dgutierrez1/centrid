/**
 * File Routes
 * Handles file CRUD operations with provenance tracking
 * ? CLEAN - All business logic delegated to FileService
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { FileService } from '../../../services/fileService.ts';
import type { AppContext } from '../types.ts';

const app = new Hono<{ Variables: AppContext }>();

// ============================================================================
// Validation Schemas
// ============================================================================

const createFileSchema = z.object({
  path: z.string().min(1, 'Path is required'),
  content: z.string(),
  provenance: z.object({
    threadId: z.string().uuid(),
    contextSummary: z.string().optional(),
  }).optional(),
});

const updateFileSchema = z.object({
  content: z.string().min(0),
});

// ============================================================================
// Routes
// ============================================================================

/**
 * POST /api/files
 * Create new file (manual or agent-created)
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
  const parsed = createFileSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({
      error: 'Validation failed',
      details: parsed.error.format(),
    }, 400);
  }

  try {
    const file = await FileService.createFile({
      userId,
      path: parsed.data.path,
      content: parsed.data.content,
      provenance: parsed.data.provenance,
    });

    return c.json({ data: file }, 201);
  } catch (error) {
    console.error('Failed to create file:', error);
    return c.json({ error: 'Failed to create file' }, 500);
  }
});

/**
 * GET /api/files/:id
 * Get file by ID with content and provenance
 */
app.get('/:id', async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');

  // Validate UUID
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return c.json({ error: 'Invalid file ID format' }, 400);
  }

  try {
    const file = await FileService.getFile(id, userId);
    return c.json({ data: file });
  } catch (error) {
    console.error('Failed to get file:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('File not found')) {
        return c.json({ error: error.message }, 404);
      }
      if (error.message.includes('Access denied')) {
        return c.json({ error: error.message }, 403);
      }
    }
    
    return c.json({ error: 'Failed to fetch file' }, 500);
  }
});

/**
 * PUT /api/files/:id
 * Update file content
 */
app.put('/:id', async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');

  // Validate UUID
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return c.json({ error: 'Invalid file ID format' }, 400);
  }

  let body;
  try {
    body = await c.req.json();
  } catch (error) {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  // Validate input
  const parsed = updateFileSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({
      error: 'Validation failed',
      details: parsed.error.format(),
    }, 400);
  }

  try {
    const updated = await FileService.updateFile(id, userId, {
      content: parsed.data.content,
    });

    return c.json({ data: updated });
  } catch (error) {
    console.error('Failed to update file:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('File not found')) {
        return c.json({ error: error.message }, 404);
      }
      if (error.message.includes('Access denied')) {
        return c.json({ error: error.message }, 403);
      }
    }
    
    return c.json({ error: 'Failed to update file' }, 500);
  }
});

/**
 * DELETE /api/files/:id
 * Delete file
 */
app.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');

  // Validate UUID
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return c.json({ error: 'Invalid file ID format' }, 400);
  }

  try {
    await FileService.deleteFile(id, userId);
    return c.json({ data: { success: true } }, 200);
  } catch (error) {
    console.error('Failed to delete file:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('File not found')) {
        return c.json({ error: error.message }, 404);
      }
      if (error.message.includes('Access denied')) {
        return c.json({ error: error.message }, 403);
      }
    }
    
    return c.json({ error: 'Failed to delete file' }, 500);
  }
});

export { app as fileRoutes };
