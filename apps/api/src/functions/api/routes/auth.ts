/**
 * Auth Routes
 * Handles account management (create, update profile, delete)
 * ? CLEAN - Delegates to AccountService
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { AccountService } from '../../../services/accountService.ts';
import type { AppContext } from '../types.ts';

const app = new Hono<{ Variables: AppContext }>();

// ============================================================================
// Validation Schemas
// ============================================================================

const createAccountSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').optional(),
});

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  // Add more profile fields as needed
});

// ============================================================================
// Routes
// ============================================================================

/**
 * POST /api/auth/account
 * Create new account (signup)
 */
app.post('/account', async (c) => {
  let body;
  try {
    body = await c.req.json();
  } catch (error) {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  // Validate input
  const parsed = createAccountSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({
      error: 'Validation failed',
      details: parsed.error.format(),
    }, 400);
  }

  try {
    console.log('Account creation:', {
      email: parsed.data.email,
      name: parsed.data.name,
    });

    // Call AccountService (currently throws with TODO message)
    const account = await AccountService.createAccount(
      parsed.data.email,
      parsed.data.password,
      { name: parsed.data.name }
    );

    return c.json({ data: account }, 201);

  } catch (error) {
    console.error('Account creation failed:', error);
    return c.json({
      error: 'Failed to create account',
      details: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
app.put('/profile', async (c) => {
  const userId = c.get('userId');

  let body;
  try {
    body = await c.req.json();
  } catch (error) {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  // Validate input
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({
      error: 'Validation failed',
      details: parsed.error.format(),
    }, 400);
  }

  try {
    console.log('Profile update:', {
      userId,
      updates: parsed.data,
    });

    // Call AccountService (currently throws with TODO message)
    const result = await AccountService.updateProfile(userId, parsed.data);

    return c.json({ data: result });

  } catch (error) {
    console.error('Profile update failed:', error);
    return c.json({
      error: 'Failed to update profile',
      details: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});

/**
 * DELETE /api/auth/account
 * Delete user account (soft delete with retention period)
 */
app.delete('/account', async (c) => {
  const userId = c.get('userId');

  try {
    console.log('Account deletion requested:', { userId });

    // Call AccountService (currently throws with TODO message)
    const result = await AccountService.deleteAccount(userId);

    return c.json({ data: result });

  } catch (error) {
    console.error('Account deletion failed:', error);
    return c.json({
      error: 'Failed to delete account',
      details: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});

export { app as authRoutes };
