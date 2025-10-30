/**
 * Auth Headers Utility
 *
 * Centralized place to get authorization headers for API requests.
 * Uses cached token from TokenStore (updated via Supabase auth listener).
 * This is synchronous - no async overhead on every request.
 */

import { TokenStore } from './tokenStore'
import { ApiError } from './errors'

/**
 * Get auth headers with access token (synchronous, no async overhead)
 *
 * Token is kept in sync via Supabase auth listener in AuthProvider.
 * Throws ApiError if user is not authenticated.
 */
export function getAuthHeaders(): Record<string, string> {
  const token = TokenStore.getToken()

  if (!token) {
    throw new ApiError('Not authenticated', 401)
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}
