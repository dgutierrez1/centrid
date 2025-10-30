/**
 * Token Store - Manages auth token state
 *
 * Subscribes to Supabase auth changes ONCE at module initialization.
 * Keeps the token cached in memory to avoid async calls on every API request.
 *
 * This is initialized on app startup (in AuthProvider) and provides
 * synchronous token access for all API calls.
 */

export class TokenStore {
  private static token: string | null = null
  private static isInitialized = false

  /**
   * Initialize token store with initial session
   * Called once during app startup
   */
  static setInitialToken(accessToken: string | null) {
    this.token = accessToken
  }

  /**
   * Update token on auth changes
   * Called automatically by Supabase auth listener
   */
  static setToken(accessToken: string | null) {
    this.token = accessToken
  }

  /**
   * Get cached token synchronously (no async overhead)
   * Returns null if not authenticated
   */
  static getToken(): string | null {
    return this.token
  }

  /**
   * Check if token is available
   */
  static isAuthenticated(): boolean {
    return this.token !== null
  }

  /**
   * Clear token on logout
   */
  static clearToken() {
    this.token = null
  }

  /**
   * Mark as initialized
   */
  static markInitialized() {
    this.isInitialized = true
  }

  static getIsInitialized() {
    return this.isInitialized
  }
}
