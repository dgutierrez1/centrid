/**
 * Shared types for Hono API
 */

import type { Context } from 'hono';

/**
 * Auth context attached by authMiddleware
 */
export type AuthContext = {
  userId: string;
  userEmail?: string;
  requestId: string;
  startTime: number;
};

/**
 * Hono context with auth variables
 */
export type AppContext = Context<{
  Variables: AuthContext;
}>;
