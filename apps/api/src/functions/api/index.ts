/**
 * Centrid API - Unified Edge Function
 * Consolidates all backend routes using Hono framework
 * With DATABASE_URL environment variable support
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';

// Middleware
import { authMiddleware } from './middleware/auth.ts';
import { errorHandler } from './middleware/errors.ts';
import { requestLogger } from './middleware/logging.ts';

// Routes
import { threadRoutes } from './routes/threads.ts';
import { fileRoutes } from './routes/files.ts';
import { toolCallRoutes } from './routes/tool-calls.ts';
import { searchRoutes } from './routes/search.ts';
import { authRoutes } from './routes/auth.ts';
import { agentRequestRoutes } from './routes/agent-requests.ts';

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
    version: '3.0.7',
    architecture: 'Hono + Deno (RESTful) + DB_URL + Fixed 404s',
    status: 'operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      system: [
        'GET /',
        'GET /health',
      ],
      threads: [
        'GET /api/threads',
        'POST /api/threads',
        'GET /api/threads/:id',
        'PUT /api/threads/:id',
        'DELETE /api/threads/:id',
        'GET /api/threads/:id/children',
        'GET /api/threads/:id/pending-tools',
      ],
      messages: [
        'POST /api/threads/:threadId/messages',
        'GET /api/threads/:threadId/messages',
        'GET /api/threads/:threadId/messages/:messageId/stream',
      ],
      files: [
        'POST /api/files',
        'GET /api/files/:id',
        'PUT /api/files/:id',
        'DELETE /api/files/:id',
      ],
      toolCalls: [
        'PATCH /api/tool-calls/:toolCallId',
      ],
      search: [
        'POST /api/search',
      ],
      auth: [
        'POST /api/auth/account',
        'PUT /api/auth/profile',
        'DELETE /api/auth/account',
      ],
      agentRequests: [
        'GET /api/agent-requests/:requestId',
        'GET /api/agent-requests/:requestId/stream',
        'GET /api/agent-requests/:requestId/pending-tools',
      ],
    },
    changes: {
      v3: [
        '? RESTful routes - Resource IDs in path (not query params)',
        '? Messages nested under threads',
        '? Stream nested under messages',
        '? Tool calls as proper resource',
        '? SearchService with basic text search',
        '? AccountService stubs for post-MVP',
      ],
    },
    documentation: 'See apps/api/BACKEND_REFACTOR_PLAN.md',
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
// Protected Routes (require authentication)
// ============================================================================

// NOTE: CORS preflight (OPTIONS) is handled by cors() middleware above
// and is NOT subjected to auth checks - it will work automatically

// Mount route modules with auth middleware applied to each
// This ensures 404s are returned for invalid routes (not 401s)
const protectedThreads = new Hono();
protectedThreads.use('*', authMiddleware);
protectedThreads.route('/', threadRoutes);
app.route('/api/threads', protectedThreads);

const protectedFiles = new Hono();
protectedFiles.use('*', authMiddleware);
protectedFiles.route('/', fileRoutes);
app.route('/api/files', protectedFiles);

const protectedToolCalls = new Hono();
protectedToolCalls.use('*', authMiddleware);
protectedToolCalls.route('/', toolCallRoutes);
app.route('/api/tool-calls', protectedToolCalls);

const protectedSearch = new Hono();
protectedSearch.use('*', authMiddleware);
protectedSearch.route('/', searchRoutes);
app.route('/api/search', protectedSearch);

const protectedAuth = new Hono();
protectedAuth.use('*', authMiddleware);
protectedAuth.route('/', authRoutes);
app.route('/api/auth', protectedAuth);

// Agent Requests: Protected routes (auth required)
// Note: /execute endpoint is called internally with service role key
// It's handled in agent-requests.ts route by checking requestId authorization
const protectedAgentRequests = new Hono();
protectedAgentRequests.use('*', authMiddleware);
protectedAgentRequests.route('/', agentRequestRoutes);
app.route('/api/agent-requests', protectedAgentRequests);

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
