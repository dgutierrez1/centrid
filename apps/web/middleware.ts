/**
 * Next.js Middleware - Auth Enforcement
 *
 * Runs BEFORE pages render to:
 * - Check authentication status from cookies
 * - Redirect unauthenticated users to login
 * - Redirect authenticated users away from guest-only pages
 * - Refresh auth tokens automatically
 *
 * This eliminates race conditions and "flash of protected content"
 */

import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

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
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
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
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
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

  // Check auth status (from cookies - no race condition)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes - require authentication
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/workspace') ||
    request.nextUrl.pathname.startsWith('/threads') ||
    request.nextUrl.pathname.startsWith('/account')

  if (!user && isProtectedRoute) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Guest-only routes - redirect authenticated users
  const isGuestRoute =
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname === '/signup'

  if (user && isGuestRoute) {
    // Check if there's a redirectTo param
    const redirectTo = request.nextUrl.searchParams.get('redirectTo')
    if (redirectTo) {
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/).*)',
  ],
}
