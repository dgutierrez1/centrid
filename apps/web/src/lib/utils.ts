import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Retry an async operation with exponential backoff
 *
 * @param operation - The async function to retry
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns Result of the operation
 * @throws Error if max retries exceeded
 *
 * @example
 * const result = await withRetry(() =>
 *   supabase.auth.signInWithPassword({ email, password })
 * )
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      if (attempt === maxRetries) throw error

      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt - 1) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw new Error('Max retries exceeded')
}

/**
 * Get user-friendly error message for auth/service errors
 *
 * @param error - Error object from catch block
 * @param operation - Type of operation (signup, login, etc.) for context
 * @returns User-friendly error message
 *
 * @example
 * catch (error) {
 *   setError(getAuthErrorMessage(error, 'signup'))
 * }
 */
export function getAuthErrorMessage(error: unknown, operation: string): string {
  if (!error) return 'An unexpected error occurred. Please try again.'

  const errorObj = error as any

  // Network errors
  if (errorObj.message?.includes('fetch') || errorObj.message?.includes('network')) {
    return 'Cannot connect to authentication service. Check your internet connection and try again.'
  }

  // Rate limiting
  if (errorObj.status === 429 || errorObj.message?.includes('rate limit')) {
    return 'Too many attempts. Please wait a moment and try again.'
  }

  // Service unavailable
  if (errorObj.status === 503 || errorObj.message?.includes('unavailable')) {
    return 'Authentication service is temporarily unavailable. Please try again in a moment.'
  }

  // Specific auth errors
  if (errorObj.message?.includes('Invalid login credentials')) {
    return 'Invalid email or password'
  }

  if (errorObj.message?.includes('Email not confirmed')) {
    return 'Please verify your email address before logging in.'
  }

  if (errorObj.message?.includes('User already registered')) {
    return 'An account with this email already exists. Try logging in instead.'
  }

  // Generic fallback with operation context
  return `Failed to ${operation}. Please try again or contact support if the problem persists.`
}
