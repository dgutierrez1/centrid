/**
 * Reset Password Page
 *
 * Allows user to set a new password after clicking reset link from email.
 * Validates token and updates password via Supabase Auth.
 *
 * Design: apps/design-system/public/screenshots/account-foundation/04-reset-password-*
 */

import type { FormEvent} from 'react';
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Button } from '@centrid/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@centrid/ui/components/card'
import { Input } from '@centrid/ui/components/input'
import { Label } from '@centrid/ui/components/label'
import { Alert } from '@centrid/ui/components/alert'
import { resetPasswordSchema } from '@/lib/validations/auth'
import { createClient } from '@/lib/supabase/client'
import { withRetry, getAuthErrorMessage } from '@/lib/utils'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)

  // Check if token is valid on mount
  useEffect(() => {
    const checkToken = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      // If no session, token might be expired or invalid
      if (!session) {
        setTokenValid(false)
      } else {
        setTokenValid(true)
      }
    }

    checkToken()
  }, [supabase])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Check if passwords match
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        setLoading(false)
        return
      }

      // Client-side validation
      const validation = resetPasswordSchema.safeParse({ password })

      if (!validation.success) {
        setError(validation.error.errors[0].message)
        setLoading(false)
        return
      }

      // Update password (with retry)
      const { error: updateError } = await withRetry(() =>
        supabase.auth.updateUser({
          password: validation.data.password,
        })
      )

      if (updateError) {
        if (updateError.message.includes('expired') || updateError.message.includes('invalid')) {
          setError('This reset link has expired or is invalid.')
          setTokenValid(false)
        } else {
          setError(getAuthErrorMessage(updateError, 'reset password'))
        }
        setLoading(false)
        return
      }

      // Success - redirect to dashboard (user is auto-logged in)
      router.push('/dashboard')
    } catch (error) {
      console.error('Password reset error:', error)
      setError(getAuthErrorMessage(error, 'reset password'))
      setLoading(false)
    }
  }

  // Show loading state while checking token
  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Verifying reset link...</p>
      </div>
    )
  }

  // Show expired link message
  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Link Expired</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <div className="text-sm">
                <p className="font-medium mb-1">This reset link has expired</p>
                <p>Password reset links are valid for 1 hour. Please request a new one.</p>
              </div>
            </Alert>

            <Link href="/forgot-password">
              <Button className="w-full h-11 bg-primary-600 hover:bg-primary-700">
                Request New Link
              </Button>
            </Link>

            <p className="text-center text-sm text-gray-600">
              <Link href="/login" className="text-primary-600 hover:underline">
                Back to login
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Set New Password</CardTitle>
          <p className="text-sm text-gray-600 mt-1">Choose a new password for your account</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                className="h-11"
                autoComplete="new-password"
              />
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
                className="h-11"
                autoComplete="new-password"
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
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
