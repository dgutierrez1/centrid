/**
 * Forgot Password Page
 *
 * Initiates password reset flow by sending reset email.
 * Uses Supabase Auth built-in password reset functionality.
 *
 * Design: apps/design-system/public/screenshots/account-foundation/03-forgot-password-*
 */

import type { FormEvent } from 'react';
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@centrid/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@centrid/ui/components/card'
import { Input } from '@centrid/ui/components/input'
import { Label } from '@centrid/ui/components/label'
import { Alert } from '@centrid/ui/components/alert'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations/auth'
import { createClient } from '@/lib/supabase/client'
import { withRetry, getAuthErrorMessage } from '@/lib/utils'

export default function ForgotPasswordPage() {
  const supabase = createClient()

  const [formData, setFormData] = useState<ForgotPasswordInput>({
    email: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      // Client-side validation
      const validation = forgotPasswordSchema.safeParse(formData)

      if (!validation.success) {
        setError(validation.error.errors[0].message)
        setLoading(false)
        return
      }

      // Send password reset email (with retry)
      const { error: resetError } = await withRetry(() =>
        supabase.auth.resetPasswordForEmail(validation.data.email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
      )

      if (resetError) {
        setError(getAuthErrorMessage(resetError, 'send reset email'))
        setLoading(false)
        return
      }

      // Success
      setSuccess(true)
      setLoading(false)
    } catch (error) {
      console.error('Password reset error:', error)
      setError(getAuthErrorMessage(error, 'send reset email'))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Enter your email to receive a password reset link
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={loading || success}
                required
                className="h-11"
                autoComplete="email"
              />
            </div>

            {/* Success Alert */}
            {success && (
              <Alert className="bg-green-50 border-green-200">
                <div className="text-sm text-green-800">
                  <p className="font-medium mb-1">Check your email</p>
                  <p>
                    We've sent a password reset link to your email address. The link will expire
                    in 1 hour.
                  </p>
                </div>
              </Alert>
            )}

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <p className="text-sm">{error}</p>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || success}
              className="w-full h-11 bg-primary-600 hover:bg-primary-700"
            >
              {loading ? 'Sending...' : success ? 'Email Sent' : 'Send Reset Link'}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 space-y-2 text-center text-sm text-gray-600">
            <p>
              <Link href="/login" className="text-primary-600 hover:underline">
                Back to login
              </Link>
            </p>
            <p>
              Don't have an account?{' '}
              <Link href="/signup" className="text-primary-600 hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
