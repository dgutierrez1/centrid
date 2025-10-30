/**
 * API Error Handling
 *
 * Unified error class and handlers for all API requests
 */

import axios from 'axios'

export class ApiError extends Error {
  constructor(
    public message: string,
    public status: number,
    public data?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Transform axios errors into consistent ApiError format
 */
export function handleApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status || 500
    const message = error.response?.data?.message || error.message || 'Request failed'
    const data = error.response?.data

    return new ApiError(message, status, data)
  }

  if (error instanceof Error) {
    return new ApiError(error.message, 500)
  }

  return new ApiError('Unknown error', 500)
}

/**
 * User-friendly error message based on API error
 */
export function getErrorMessage(error: unknown, operation: string): string {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return 'Authentication required. Please sign in.'
    }
    if (error.status === 403) {
      return 'You do not have permission to perform this operation.'
    }
    if (error.status === 404) {
      return `${operation} not found.`
    }
    if (error.status >= 500) {
      return 'Server error. Please try again later.'
    }
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return `Failed to ${operation}. Please try again.`
}
