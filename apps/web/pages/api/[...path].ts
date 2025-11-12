/**
 * API Gateway - Catch-all route for Supabase Edge Functions
 *
 * Dumb proxy pattern (Backend as Authority):
 * - Reads auth session from cookies (httpOnly, secure)
 * - Injects token into requests IF available
 * - Backend enforces auth requirements (single source of truth)
 * - No client-side token management needed
 * - Zero race conditions (cookies always available server-side)
 *
 * Routes all requests through Next.js to avoid CORS issues.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient } from '@supabase/ssr'
import axios from 'axios'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path } = req.query
  const endpoint = Array.isArray(path) ? path.join('/') : path

  try {
    // Create Supabase client with cookie handlers (server-side)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies[name]
          },
          set(name: string, value: string, options: any) {
            res.setHeader('Set-Cookie', `${name}=${value}; Path=/; ${options.httpOnly ? 'HttpOnly;' : ''} ${options.secure ? 'Secure;' : ''}`)
          },
          remove(name: string) {
            res.setHeader('Set-Cookie', `${name}=; Path=/; Max-Age=0`)
          },
        },
      }
    )

    // Get auth session from cookies (server-side, no race condition)
    const { data: { session } } = await supabase.auth.getSession()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const fullUrl = `${supabaseUrl}/functions/v1/api/${endpoint}`

    // Log request for debugging
    console.log(`[API Gateway] ${req.method} /api/${endpoint}`)
    console.log(`[API Gateway] Token: ${session?.access_token ? session.access_token.substring(0, 20) + '...' : 'None (backend will enforce if required)'}`)
    console.log(`[API Gateway] Forwarding to: ${fullUrl}`)

    // Build headers - add auth token IF available (backend decides if required)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Add auth token if session exists (optional, backend enforces)
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }

    // Forward request to Supabase Edge Functions
    // Filter out the 'path' parameter from query params - it's for Next.js routing only
    const { path: _, ...queryParams } = req.query

    const response = await axios({
      method: req.method,
      url: fullUrl,
      headers,
      data: req.body,
      params: queryParams,
    })

    console.log(`[API Gateway] Response: ${response.status}`)
    // Return response to client
    res.status(response.status).json(response.data)
  } catch (error: any) {
    console.error(`[API Gateway Error] ${error.message}`)
    console.error(`[API Gateway Error] Status: ${error.response?.status}`)
    console.error(`[API Gateway Error] Data:`, error.response?.data)

    const status = error.response?.status || 500
    const message = error.response?.data?.error || error.message

    res.status(status).json({
      error: message || 'Internal server error'
    })
  }
}
