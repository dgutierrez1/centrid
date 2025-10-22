/**
 * Auth Callback Page
 *
 * Handles OAuth callbacks and email confirmation links from Supabase Auth.
 * Exchanges the auth code for a session and redirects to the appropriate page.
 *
 * Used by:
 * - Password reset email links
 * - OAuth providers (if enabled in future)
 * - Email confirmation links (if enabled in future)
 */

import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient()

      // Exchange the code for a session
      const { error } = await supabase.auth.exchangeCodeForSession(
        window.location.href
      )

      if (error) {
        console.error('Error exchanging code for session:', error)
        // Redirect to login with error
        router.push('/login?error=auth_callback_failed')
        return
      }

      // Success - redirect to dashboard or original destination
      const redirectTo = router.query.redirectTo as string
      router.push(redirectTo || '/dashboard')
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Completing sign in...</h2>
        <p className="text-gray-600">Please wait while we log you in.</p>
      </div>
    </div>
  )
}
