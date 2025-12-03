/**
 * Account Deletion Page
 *
 * Permanent account deletion with two-step confirmation.
 * All user data is deleted via cascade delete (GDPR compliant).
 *
 * Design: apps/design-system/public/screenshots/account-foundation/07-account-deletion-*
 */

import type { FormEvent } from 'react';
import { useState } from 'react'
import type { GetServerSideProps } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Button } from '@centrid/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@centrid/ui/components/card'
import { Input } from '@centrid/ui/components/input'
import { Label } from '@centrid/ui/components/label'
import { Alert } from '@centrid/ui/components/alert'
import { deleteAccountSchema } from '@/lib/validations/auth'
import { createClient } from '@/lib/supabase/client'
import { createServerClient } from '@/lib/supabase/server'
import { useAuthContext } from '@/components/providers/AuthProvider'
import { useMutation } from 'urql'
import { DeleteAccountDocument } from '@/types/graphql'
import type { User } from '@supabase/supabase-js'

interface DeleteAccountProps {
  user: User
}

export default function DeleteAccountPage({ user: initialUser }: DeleteAccountProps) {
  const { user, signOut } = useAuthContext()
  const supabase = createClient()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const currentUser = user || initialUser

  const [step, setStep] = useState<'warning' | 'confirming'>('warning')
  const [confirmation, setConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // GraphQL mutation hook
  const [, deleteAccount] = useMutation(DeleteAccountDocument)

  const handleContinue = () => {
    setStep('confirming')
    setError('')
  }

  const handleCancel = () => {
    router.push('/profile')
  }

  const handleDelete = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate confirmation
      const validation = deleteAccountSchema.safeParse({ confirmation })

      if (!validation.success) {
        setError(validation.error.errors[0].message)
        setLoading(false)
        return
      }

      // Call GraphQL mutation to delete account
      const result = await deleteAccount({})

      if (result.error) {
        setError(result.error.message || 'Failed to delete account')
        setLoading(false)
        return
      }

      // Success - sign out and redirect to confirmation page
      await supabase.auth.signOut()
      router.push('/account-deleted')
    } catch (error) {
      console.error('Account deletion error:', error)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/dashboard" className="text-xl font-bold text-gray-900">
              Centrid
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Dashboard
              </Link>
              <Link href="/profile" className="text-sm font-medium text-primary-600">
                Profile
              </Link>
            </nav>

            {/* Desktop Logout Button */}
            <Button variant="outline" onClick={signOut} className="hidden md:block">
              Log Out
            </Button>

            {/* Mobile Hamburger Menu */}
            <Button
              variant="outline"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden"
            >
              ☰
            </Button>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
              <div className="flex flex-col gap-3">
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-gray-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className="text-sm font-medium text-primary-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <Button variant="outline" onClick={signOut} className="w-full mt-2">
                  Log Out
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-2xl text-red-600">Delete Account</CardTitle>
            <p className="text-sm text-gray-600 mt-1">This action cannot be undone</p>
          </CardHeader>

          <CardContent>
            {/* Warning Alert */}
            <Alert className="bg-red-50 border-red-200 mb-6">
              <div className="space-y-3">
                <p className="font-medium text-red-900">⚠️ Warning: Permanent Data Loss</p>
                <p className="text-sm text-red-800">
                  Deleting your account will permanently remove:
                </p>
                <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                  <li>Your account and profile</li>
                  <li>All uploaded documents</li>
                  <li>All chat conversations and agent sessions</li>
                  <li>All usage history</li>
                </ul>
                <p className="font-medium text-sm text-red-900">
                  This action is irreversible!
                </p>
              </div>
            </Alert>

            {step === 'warning' ? (
              /* Step 1: Warning State */
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Button
                    variant="destructive"
                    onClick={handleContinue}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    I Understand, Continue
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              /* Step 2: Confirmation State */
              <form onSubmit={handleDelete} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="confirmation">
                    Type <strong>DELETE</strong> to confirm
                  </Label>
                  <Input
                    id="confirmation"
                    type="text"
                    placeholder="DELETE"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    disabled={loading}
                    className="h-11"
                    autoFocus
                  />
                </div>

                {/* Error Alert */}
                {error && (
                  <Alert variant="destructive">
                    <p className="text-sm">{error}</p>
                  </Alert>
                )}

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    variant="destructive"
                    disabled={loading || confirmation !== 'DELETE'}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {loading ? 'Deleting Account...' : 'Delete My Account'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

/**
 * Server-Side Auth Check
 * Protects this page - only authenticated users can delete their account
 */
export const getServerSideProps: GetServerSideProps<DeleteAccountProps> = async (context) => {
  const supabase = createServerClient(context)

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (!user) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    }
  }

  return {
    props: {
      user,
    },
  }
}
