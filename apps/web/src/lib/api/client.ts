/**
 * Unified API Client
 *
 * Axios-based HTTP client with:
 * - Automatic auth header injection
 * - Retry logic for failed requests
 * - Consistent error handling
 * - Support for streaming responses
 */

import type { AxiosRequestConfig, AxiosError } from 'axios';
import axios from 'axios'
import { getAuthHeaders } from './getAuthHeaders'
import { ApiError, handleApiError } from './errors'

/**
 * Create axios instance with base URL
 *
 * Uses Next.js API Gateway (/api/*) instead of direct Supabase calls
 * This avoids CORS issues since requests are server-to-server (via Next.js)
 */
const axiosInstance = axios.create({
  baseURL: `/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Request interceptor: Inject auth headers (synchronous, no async overhead)
 * Headers are retrieved from TokenStore which is kept in sync via AuthProvider
 */
axiosInstance.interceptors.request.use(
  (config) => {
    try {
      const headers = getAuthHeaders()
      // Set auth headers individually (Axios v1.x type-safe approach)
      Object.entries(headers).forEach(([key, value]) => {
        if (value !== undefined) {
          config.headers.set(key, value)
        }
      })
    } catch (error) {
      return Promise.reject(error)
    }
    return config
  },
  (error) => Promise.reject(error)
)

/**
 * Response interceptor: Handle errors and retry on 5xx
 */
let retryCount = 0
const MAX_RETRIES = 2

axiosInstance.interceptors.response.use(
  (response) => {
    retryCount = 0
    return response
  },
  async (error: AxiosError) => {
    const config = error.config as AxiosRequestConfig & { _retry?: number }

    // Only retry on 5xx server errors
    if (
      error.response?.status &&
      error.response.status >= 500 &&
      (config._retry ?? 0) < MAX_RETRIES
    ) {
      config._retry = (config._retry ?? 0) + 1

      // Exponential backoff: 1s, 2s
      const delay = 1000 * Math.pow(2, config._retry - 1)
      await new Promise((resolve) => setTimeout(resolve, delay))

      return axiosInstance(config)
    }

    // Don't retry on auth errors (401, 403)
    if (error.response?.status === 401 || error.response?.status === 403) {
      return Promise.reject(error)
    }

    return Promise.reject(error)
  }
)

/**
 * API client with typed methods
 */
export const api = {
  /**
   * GET request
   */
  async get<T>(
    path: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await axiosInstance.get<T>(path, config)
      return response.data
    } catch (error) {
      throw handleApiError(error)
    }
  },

  /**
   * POST request
   */
  async post<T>(
    path: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await axiosInstance.post<T>(path, data, config)
      return response.data
    } catch (error) {
      throw handleApiError(error)
    }
  },

  /**
   * PUT request
   */
  async put<T>(
    path: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await axiosInstance.put<T>(path, data, config)
      return response.data
    } catch (error) {
      throw handleApiError(error)
    }
  },

  /**
   * PATCH request
   */
  async patch<T>(
    path: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await axiosInstance.patch<T>(path, data, config)
      return response.data
    } catch (error) {
      throw handleApiError(error)
    }
  },

  /**
   * DELETE request
   */
  async delete<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await axiosInstance.delete<T>(path, config)
      return response.data
    } catch (error) {
      throw handleApiError(error)
    }
  },

  /**
   * Stream response (for Server-Sent Events)
   *
   * Usage:
   *   await api.stream('/consolidate-branches', (chunk) => {
   *     console.log('Received:', chunk)
   *   })
   */
  async stream(
    path: string,
    onChunk: (text: string) => void,
    config?: AxiosRequestConfig
  ): Promise<void> {
    try {
      const headers = await getAuthHeaders()
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1${path}`

      const response = await axios.post(url, undefined, {
        ...config,
        headers,
        responseType: 'stream',
      })

      return new Promise((resolve, reject) => {
        let buffer = ''

        response.data.on('data', (chunk: Buffer) => {
          buffer += chunk.toString('utf8')
          const lines = buffer.split('\n')

          // Process all complete lines
          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i].trim()
            if (line.startsWith('data: ')) {
              onChunk(line.slice(6))
            }
          }

          // Keep incomplete line in buffer
          buffer = lines[lines.length - 1]
        })

        response.data.on('end', () => {
          resolve()
        })

        response.data.on('error', (error: Error) => {
          reject(handleApiError(error))
        })
      })
    } catch (error) {
      throw handleApiError(error)
    }
  },
}

export type { AxiosRequestConfig }
export { ApiError, handleApiError }
