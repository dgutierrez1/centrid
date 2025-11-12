/**
 * Signup Page
 *
 * New user account creation with optional name fields.
 * Implements client-side validation and server-side account creation via Edge Function.
 *
 * Design: apps/design-system/public/screenshots/account-foundation/01-signup-*
 */

import { useState, FormEvent } from 'react'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Button } from '@centrid/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@centrid/ui/components/card'
import { Input } from '@centrid/ui/components/input'
import { Label } from '@centrid/ui/components/label'
import { Alert } from '@centrid/ui/components/alert'
import { signupSchema, type SignupInput } from '@/lib/validations/auth'
import { supabase } from '@/lib/supabase/client'
import { api } from '@/lib/api/client'
import { getAuthErrorMessage } from '@/lib/utils'

export default function SignupPage() {
  const router = useRouter()

  const [formData, setFormData] = useState<SignupInput>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Client-side validation using Zod schema
      const validation = signupSchema.safeParse(formData)

      if (!validation.success) {
        setError(validation.error.errors[0].message)
        setLoading(false)
        return
      }

      // Call REST API endpoint for atomic account+profile creation
      await api.post('/auth/account', validation.data)

      // Now sign in the user with the credentials they just created
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: validation.data.email,
        password: validation.data.password,
      })

      if (signInError) {
        setError('Account created, but sign-in failed. Please try logging in.')
        setLoading(false)
        return
      }

      // Success - redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Signup error:', error)
      setError(getAuthErrorMessage(error, 'create account'))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <p className="text-sm text-gray-600 mt-1">Start using Centrid for free</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
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
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={loading}
                required
                className="h-11"
              />
            </div>

            {/* First Name Input */}
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                disabled={loading}
                required
                className="h-11"
              />
            </div>

            {/* Last Name Input */}
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                disabled={loading}
                required
                className="h-11"
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
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 space-y-2 text-center text-sm text-gray-600">
            <p>
              Already have an account?{' '}
              <Link href="/login" className="text-primary-600 hover:underline">
                Log in
              </Link>
            </p>
            <p>
              <Link href="/forgot-password" className="text-primary-600 hover:underline">
                Forgot your password?
              </Link>
            </p>
          </div>
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
