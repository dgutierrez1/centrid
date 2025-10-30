/**
 * Search Routes
 * Handles semantic search across shadow domain
 * ? CLEAN - Delegates to SearchService
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { SearchService } from '../../../services/searchService.ts';
import type { AppContext } from '../types.ts';

const app = new Hono<{ Variables: AppContext }>();

// ============================================================================
// Validation Schemas
// ============================================================================

const searchSchema = z.object({
  query: z.string().min(1, 'Query is required').max(500, 'Query too long'),
  entityTypes: z.array(z.enum(['file', 'thread', 'concept'])).optional(),
  limit: z.number().int().min(1).max(50).optional().default(10),
});

// ============================================================================
// Routes
// ============================================================================

/**
 * POST /api/search
 * Semantic search across shadow domain (files, threads, concepts)
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
  const parsed = searchSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({
      error: 'Validation failed',
      details: parsed.error.format(),
    }, 400);
  }

  try {
    console.log('Semantic search:', {
      userId,
      query: parsed.data.query,
      entityTypes: parsed.data.entityTypes,
      limit: parsed.data.limit,
    });

    // Perform search using SearchService
    const results = await SearchService.search(userId, parsed.data.query, {
      limit: parsed.data.limit,
      entityTypes: parsed.data.entityTypes,
    });

    return c.json({
      data: results,
      meta: {
        query: parsed.data.query,
        limit: parsed.data.limit,
        count: results.length,
        implementation: 'MVP - Basic text search (Vector search in Phase 2)',
      },
    });

  } catch (error) {
    console.error('Search failed:', error);
    return c.json({
      error: 'Search failed',
      details: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});

export { app as searchRoutes };
