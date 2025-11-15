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
 * Returns empty headers if user is not authenticated (backend handles auth enforcement).
 */
export function getAuthHeaders(): Record<string, string> {
  const token = TokenStore.getToken()

  if (!token) {
    return {
      'Content-Type': 'application/json',
    }
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}
