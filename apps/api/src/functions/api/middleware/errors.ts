/**
 * Error Handler Middleware
 * Catches and formats all errors consistently
 */

import type { Context } from 'hono';
import type { HTTPException } from 'hono/http-exception';
import { createLogger } from '../../../utils/logger.ts';

const logger = createLogger('middleware/error');

export const errorHandler = (err: Error | HTTPException, c: Context) => {
  // Log error with structured logger (AsyncLocalStorage context auto-injected)
  logger.error('Unhandled error in request', {
    error: err,
    path: c.req.path,
    method: c.req.method,
  });

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
