/**
 * Centrid API - Unified Edge Function
 * Consolidates all backend routes using Hono framework
 * With DATABASE_URL environment variable support
 * Updated: 2025-11-14 - Timestamp standardization (rebuild #4 - Date conversion)
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';

// Middleware
import { authMiddleware } from './middleware/auth.ts';
import { errorHandler } from './middleware/errors.ts';
import { requestLogger } from './middleware/logging.ts';

// Routes
import { authRoutes } from './routes/auth.ts';
import { graphqlHandler } from './routes/graphql.ts';

const app = new Hono();

// ============================================================================
// Global Middleware
// ============================================================================

// CORS - Allow frontend origins
app.use('*', cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://centrid.vercel.app', // Update with your production domain
  ],
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Pretty JSON formatting (development)
// Note: prettyJSON middleware removed due to import issues
// app.use('*', prettyJSON());

// Request logging
app.use('*', requestLogger);

// ============================================================================
// Public Routes (no auth required)
// ============================================================================

app.get('/api', (c) => {
  return c.json({
    name: 'Centrid API',
    version: '4.0.0',
    architecture: 'GraphQL-First + Hono + Deno',
    status: 'operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      system: [
        'GET /',
        'GET /health',
      ],
      auth: [
        'POST /api/auth/account (REST - account creation only)',
      ],
      graphql: [
        'POST /api/graphql (all queries/mutations - protected)',
        'GET /api/graphql (introspection/GraphiQL - public)',
      ],
    },
    note: 'All business operations use GraphQL. REST only for account creation.',
  });
});

app.get('/api/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: performance.now(),
    memory: Deno.memoryUsage ? {
      rss: Math.round(Deno.memoryUsage().rss / 1024 / 1024) + 'MB',
      heapTotal: Math.round(Deno.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
      heapUsed: Math.round(Deno.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
    } : null,
    environment: Deno.env.get('ENVIRONMENT') || 'development',
  });
});

// ============================================================================
// Routes
// ============================================================================

// Auth routes - PUBLIC (no auth required for account creation)
app.route('/api/auth', authRoutes);

// GraphQL API - Mixed auth (GET public for introspection, POST protected for mutations)
const graphql = new Hono();
graphql.get('/graphql', graphqlHandler);  // Public: GraphiQL introspection
graphql.post('/graphql', authMiddleware, graphqlHandler);  // Protected: mutations/queries
app.route('/api', graphql);

// ============================================================================
// Error Handling
// ============================================================================

// Global error handler (must be registered last)
app.onError(errorHandler);

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      error: 'Route not found',
      path: c.req.path,
      method: c.req.method,
      availableRoutes: 'See GET / for full API documentation',
    },
    404
  );
});

// ============================================================================
// Export Deno Handler
// ============================================================================

Deno.serve(app.fetch);
