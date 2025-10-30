/**
 * Authentication Service
 * Validates JWT tokens and extracts user information
 */

import { getSupabase } from '../lib/database.ts';

export interface AuthResult {
  user?: any;
  error?: string;
}

/**
 * Authenticate user from JWT token
 */
export async function authenticateUser(authHeader: string): Promise<AuthResult> {
  try {
    const token = authHeader.replace('Bearer ', '');

    const { supabase } = await getSupabase();

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return { error: error?.message || 'Invalid token' };
    }

    return { user };
  } catch (error) {
    console.error('[AuthService] Error authenticating user:', error);
    return { error: error instanceof Error ? error.message : 'Authentication failed' };
  }
}
