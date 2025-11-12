/**
 * Auth Routes
 * Public REST endpoint for user account creation
 * Other auth operations handled via GraphQL
 */

import { Hono } from 'hono';
import { UserService } from '../../../services/userService.ts';
import type { AppContext } from '../types.ts';

const app = new Hono<{ Variables: AppContext }>();

/**
 * POST /api/auth/account
 * Create new user account (public endpoint)
 */
app.post('/account', async (c) => {
  let body;
  try {
    body = await c.req.json();
  } catch (error) {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { email, password, firstName, lastName } = body;

  // Basic validation
  if (!email || !password || !firstName || !lastName) {
    return c.json({
      error: 'Missing required fields',
      details: 'email, password, firstName, and lastName are required',
    }, 400);
  }

  if (password.length < 8) {
    return c.json({
      error: 'Validation failed',
      details: 'Password must be at least 8 characters',
    }, 400);
  }

  try {
    const result = await UserService.createUser(email, password, {
      firstName,
      lastName,
    });

    return c.json({ data: result }, 201);
  } catch (error) {
    console.error('Account creation failed:', error);
    return c.json({
      error: 'Failed to create account',
      details: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});

export { app as authRoutes };
