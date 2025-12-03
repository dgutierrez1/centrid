/**
 * Login Page
 *
 * Existing user authentication with email/password.
 * Implements client-side validation and session management.
 *
 * Design: apps/design-system/public/screenshots/account-foundation/02-login-*
 */

import type { FormEvent } from 'react';
import { useState } from 'react'
import type { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Button } from '@centrid/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@centrid/ui/components/card'
import { Input } from '@centrid/ui/components/input'
import { Label } from '@centrid/ui/components/label'
import { Alert } from '@centrid/ui/components/alert'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'
import { supabase } from '@/lib/supabase/client'
import { withRetry, getAuthErrorMessage } from '@/lib/utils'

export default function LoginPage() {
  const router = useRouter()

  const [formData, setFormData] = useState<LoginInput>({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Client-side validation using Zod schema
      const validation = loginSchema.safeParse(formData)

      if (!validation.success) {
        setError(validation.error.errors[0].message)
        setLoading(false)
        return
      }

      // Sign in with Supabase Auth (with retry logic)
      const { error: signInError } = await withRetry(() =>
        supabase.auth.signInWithPassword({
          email: validation.data.email,
          password: validation.data.password,
        })
      )

      if (signInError) {
        setError(getAuthErrorMessage(signInError, 'log in'))
        setLoading(false)
        return
      }

      // Success - redirect to dashboard (or redirect parameter if provided)
      const redirect = router.query.redirect as string
      router.push(redirect || '/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      setError(getAuthErrorMessage(error, 'log in'))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <p className="text-sm text-gray-600 mt-1">Log in to your Centrid account</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={loading}
                required
                className="h-11"
                autoComplete="email"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary-600 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={loading}
                required
                className="h-11"
                autoComplete="current-password"
              />
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <p className="text-sm">{error}</p>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-primary-600 hover:bg-primary-700"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </Button>
          </form>

          {/* Footer Link to Signup */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/signup" className="text-primary-600 hover:underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Server-Side Auth Check
 * Redirects authenticated users to dashboard (guest-only page)
 */
import { withServerAuth } from '@/lib/auth/serverAuth'

export const getServerSideProps: GetServerSideProps = withServerAuth(
  async (context) => {
    return { props: {} }
  },
  { requireGuest: true, guestRedirectTo: '/dashboard' }
)
