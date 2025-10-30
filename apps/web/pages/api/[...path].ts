/**
 * API Gateway - Catch-all route for Supabase Edge Functions
 *
 * Routes all requests through Next.js to avoid CORS issues.
 * Server-to-server communication (Next.js → Supabase) has no CORS restrictions.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path } = req.query
  const endpoint = Array.isArray(path) ? path.join('/') : path

  try {
    // Extract token from Authorization header sent by client
    const authHeader = req.headers.authorization
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const fullUrl = `${supabaseUrl}/functions/v1/api/${endpoint}`

    // Log request for debugging
    console.log(`[API Gateway] ${req.method} /api/${endpoint}`)
    console.log(`[API Gateway] Token: ${token ? 'present' : 'MISSING'}`)
    console.log(`[API Gateway] Forwarding to: ${fullUrl}`)

    // Verify token is present
    if (!token) {
      console.error('[API Gateway] No token found in Authorization header')
      return res.status(401).json({ error: 'Not authenticated' })
    }

    // Forward request to Supabase Edge Functions
    // Filter out the 'path' parameter from query params - it's for Next.js routing only
    const { path: _, ...queryParams } = req.query

    const response = await axios({
      method: req.method,
      url: fullUrl,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
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
