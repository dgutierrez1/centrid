/**
 * Server-Side Auth Helpers
 *
 * Reusable utilities for protecting routes and validating resource ownership
 * at the server level (getServerSideProps).
 */

import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

/**
 * Options for auth middleware
 */
export interface AuthOptions {
  /** Where to redirect if not authenticated (default: /login) */
  redirectTo?: string
  /** If true, allow only unauthenticated users (for login/signup pages) */
  requireGuest?: boolean
  /** Where to redirect authenticated users on guest pages (default: /dashboard) */
  guestRedirectTo?: string
}

/**
 * Result of successful auth check
 */
export interface AuthResult {
  user: User
  supabase: ReturnType<typeof createServerClient>
}

/**
 * High-level wrapper for protecting routes with server-side authentication.
 *
 * @example Protected route
 * export const getServerSideProps = withServerAuth(async (context, { user, supabase }) => {
 *   const documents = await supabase.from('documents').select('*').eq('user_id', user.id)
 *   return { props: { documents } }
 * })
 *
 * @example Guest-only route (login/signup)
 * export const getServerSideProps = withServerAuth(
 *   async (context) => {
 *     return { props: {} }
 *   },
 *   { requireGuest: true, guestRedirectTo: '/dashboard' }
 * )
 */
export function withServerAuth<P extends Record<string, any> = Record<string, any>>(
  handler: (
    context: GetServerSidePropsContext,
    auth: AuthResult
  ) => Promise<GetServerSidePropsResult<P>>,
  options: AuthOptions = {}
): (context: GetServerSidePropsContext) => Promise<GetServerSidePropsResult<P>> {
  return async (context: GetServerSidePropsContext) => {
    const supabase = createServerClient(context)

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()

    // Handle guest-only pages (login, signup)
    if (options.requireGuest) {
      if (user) {
        // Authenticated user trying to access guest page → redirect to dashboard
        return {
          redirect: {
            destination: options.guestRedirectTo || '/dashboard',
            permanent: false,
          },
        }
      }

      // Not authenticated, allow access to guest page
      // Pass dummy auth result (handler might not use it)
      return handler(context, { user: null as any, supabase })
    }

    // Handle protected pages (default behavior)
    if (!user) {
      // Not authenticated → redirect to login
      const currentPath = context.resolvedUrl
      const redirectTo = options.redirectTo || '/login'
      const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`

      return {
        redirect: {
          destination: redirectUrl,
          permanent: false,
        },
      }
    }

    // Authenticated, proceed with handler
    return handler(context, { user, supabase })
  }
}

/**
 * Low-level auth check (for custom logic in getServerSideProps).
 * Returns user and supabase client, or redirects to login.
 *
 * @example Custom auth logic
 * export const getServerSideProps: GetServerSideProps = async (context) => {
 *   const authResult = await requireAuth(context)
 *
 *   if ('redirect' in authResult) {
 *     return authResult // Not authenticated
 *   }
 *
 *   const { user, supabase } = authResult
 *   // Custom logic here...
 * }
 */
export async function requireAuth(
  context: GetServerSidePropsContext,
  options: AuthOptions = {}
): Promise<AuthResult | { redirect: { destination: string; permanent: boolean } }> {
  const supabase = createServerClient(context)

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const currentPath = context.resolvedUrl
    const redirectTo = options.redirectTo || '/login'
    const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`

    return {
      redirect: {
        destination: redirectUrl,
        permanent: false,
      },
    }
  }

  return { user, supabase }
}

/**
 * Validate that a document belongs to the authenticated user.
 * Returns document data if valid, null if not found or unauthorized.
 *
 * @example
 * const document = await validateDocumentOwnership(supabase, user.id, docId)
 * if (!document) {
 *   return { notFound: true }
 * }
 */
export async function validateDocumentOwnership(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  documentId: string
): Promise<{ id: string; name: string; user_id: string } | null> {
  const { data: document } = await supabase
    .from('documents')
    .select('id, name, user_id')
    .eq('id', documentId)
    .eq('user_id', userId)
    .single()

  return document || null
}

/**
 * Validate that a thread belongs to the authenticated user.
 * Returns thread data if valid, null if not found or unauthorized.
 *
 * @example
 * const thread = await validateThreadOwnership(supabase, user.id, threadId)
 * if (!thread) {
 *   return { notFound: true }
 * }
 */
export async function validateThreadOwnership(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  threadId: string
): Promise<{ thread_id: string; branch_title: string; owner_user_id: string } | null> {
  const { data: thread } = await supabase
    .from('threads')
    .select('thread_id, branch_title, owner_user_id')
    .eq('thread_id', threadId)
    .eq('owner_user_id', userId)
    .single()

  return thread || null
}

/**
 * Validate UUID format (basic check to prevent malicious input).
 * Returns true if valid UUID format, false otherwise.
 *
 * @example
 * if (!isValidUUID(docId)) {
 *   return { notFound: true }
 * }
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(value)
}
