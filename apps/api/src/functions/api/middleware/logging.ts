/**
 * Request Logger Middleware
 * Logs all incoming requests with context and sets AsyncLocalStorage context for all loggers
 */

import type { Context, Next } from 'hono';
import { createLogger, setRequestContext } from '../../../utils/logger.ts';

const logger = createLogger('middleware/request');

export const requestLogger = async (c: Context, next: Next) => {
  const startTime = performance.now();
  const requestId = crypto.randomUUID();

  // Attach to context
  c.set('requestId', requestId);
  c.set('startTime', startTime);

  // Get userId if available (set by auth middleware)
  const userId = c.get('userId') || undefined;

  // Set AsyncLocalStorage context for all child loggers in this request
  setRequestContext({
    requestId,
    userId,
    path: c.req.path,
    method: c.req.method,
  });

  // Log incoming request
  logger.info('Request received', {
    userAgent: c.req.header('user-agent'),
    origin: c.req.header('origin'),
  });

  await next();
};
