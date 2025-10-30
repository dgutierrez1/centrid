/**
 * Request Logger Middleware
 * Logs all incoming requests with context
 */

import type { Context, Next } from 'hono';

export const requestLogger = async (c: Context, next: Next) => {
  const startTime = performance.now();
  const requestId = crypto.randomUUID();
  
  // Attach to context
  c.set('requestId', requestId);
  c.set('startTime', startTime);

  // Log incoming request
  console.log(JSON.stringify({
    level: 'info',
    message: 'Request received',
    requestId,
    method: c.req.method,
    path: c.req.path,
    userAgent: c.req.header('user-agent'),
    origin: c.req.header('origin'),
    timestamp: new Date().toISOString(),
  }));

  await next();
};
