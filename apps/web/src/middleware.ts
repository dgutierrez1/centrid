import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Next.js Middleware for Supabase Auth Token Refresh
 *
 * This middleware runs on every request to:
 * 1. Refresh expired auth tokens by calling supabase.auth.getUser()
 * 2. Write refreshed tokens to cookies for server components (request.cookies)
 * 3. Write refreshed tokens to cookies for client (response.cookies)
 *
 * Security: Always use getUser() instead of getSession() because getUser()
 * revalidates the token with the Supabase Auth server on every request.
 *
 * Pattern from: https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Set cookie for server components (request)
          request.cookies.set({
            name,
            value,
            ...options,
          })
          // Set cookie for client (response)
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          // Remove cookie from server components (request)
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          // Remove cookie from client (response)
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // IMPORTANT: Use getUser() not getSession() for security
  // getUser() revalidates the token with the auth server
  await supabase.auth.getUser()

  return response
}

/**
 * Matcher Configuration
 *
 * Run middleware on all routes except:
 * - _next/static (static files)
 * - _next/image (image optimization)
 * - favicon.ico (favicon)
 * - Public files (images, etc.)
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
