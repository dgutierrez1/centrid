/**
 * Error Handler Middleware
 * Catches and formats all errors consistently
 */

import type { Context } from 'hono';
import type { HTTPException } from 'hono/http-exception';

export const errorHandler = (err: Error | HTTPException, c: Context) => {
  // Log error with context
  console.error(JSON.stringify({
    level: 'error',
    message: err.message,
    stack: err.stack,
    requestId: c.get('requestId'),
    userId: c.get('userId'),
    path: c.req.path,
    method: c.req.method,
    timestamp: new Date().toISOString(),
  }));

  // Return formatted error response
  return c.json(
    {
      error: 'Internal server error',
      message: err.message,
      requestId: c.get('requestId'),
    },
    500
  );
};
