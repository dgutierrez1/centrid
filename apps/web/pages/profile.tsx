/**
 * Profile Settings Page
 *
 * Allows authenticated users to edit their profile (firstName, lastName).
 * Email field is disabled (cannot be changed in MVP).
 *
 * Design: apps/design-system/public/screenshots/account-foundation/06-profile-settings-*
 */

import { useState, FormEvent } from 'react'
import { GetServerSideProps } from 'next'
import Link from 'next/link'
import { Button } from '@centrid/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@centrid/ui/components/card'
import { Input } from '@centrid/ui/components/input'
import { Label } from '@centrid/ui/components/label'
import { Alert } from '@centrid/ui/components/alert'
import { Separator } from '@centrid/ui/components/separator'
import { updateProfileSchema, type UpdateProfileInput } from '@/lib/validations/auth'
import { createClient } from '@/lib/supabase/client'
import { createServerClient } from '@/lib/supabase/server'
import { useAuthContext } from '@/components/providers/AuthProvider'
import { getAuthErrorMessage } from '@/lib/utils'
import { useMutation } from 'urql'
import { UpdateProfileDocument } from '@/types/graphql'
import type { User } from '@supabase/supabase-js'

interface ProfileProps {
  user: User
  profile: {
    first_name: string | null
    last_name: string | null
    plan_type: string
  }
}

export default function ProfilePage({ user: initialUser, profile: initialProfile }: ProfileProps) {
  const { user, signOut } = useAuthContext()
  const supabase = createClient()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const currentUser = user || initialUser

  const [formData, setFormData] = useState<UpdateProfileInput>({
    firstName: initialProfile.first_name || '',
    lastName: initialProfile.last_name || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // GraphQL mutation hook
  const [, updateProfile] = useMutation(UpdateProfileDocument)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      // Client-side validation
      const validation = updateProfileSchema.safeParse(formData)

      if (!validation.success) {
        setError(validation.error.errors[0].message)
        setLoading(false)
        return
      }

      // Call GraphQL mutation to update profile
      const result = await updateProfile({
        firstName: validation.data.firstName,
        lastName: validation.data.lastName,
      })

      if (result.error) {
        setError(getAuthErrorMessage(result.error, 'update profile'))
        setLoading(false)
        return
      }

      // Success
      setSuccess(true)
      setLoading(false)

      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('Profile update error:', error)
      setError(getAuthErrorMessage(error, 'update profile'))
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
      <main className="max-w-3xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Profile Settings</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Manage your account information</p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field (Disabled) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={currentUser.email || ''}
                  disabled
                  className="h-11 bg-gray-50"
                />
                <p className="text-xs text-gray-500">Email cannot be changed</p>
              </div>

              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  disabled={loading}
                  className="h-11"
                />
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  disabled={loading}
                  className="h-11"
                />
              </div>

              {/* Success Alert */}
              {success && (
                <Alert className="bg-green-50 border-green-200">
                  <p className="text-sm text-green-800">Profile updated successfully!</p>
                </Alert>
              )}

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <p className="text-sm">{error}</p>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-primary-600 hover:bg-primary-700"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormData({
                      firstName: initialProfile.first_name || '',
                      lastName: initialProfile.last_name || '',
                    })
                    setError('')
                    setSuccess(false)
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>

            {/* Account Plan Section */}
            <Separator className="my-6" />
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-900">Account Plan</h3>
              <p className="text-sm text-gray-600">
                <span className="capitalize">{initialProfile.plan_type}</span> Plan - 100 requests
                per month
              </p>
            </div>

            {/* Danger Zone */}
            <Separator className="my-6" />
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-red-600">Danger Zone</h3>
              <Link href="/account/delete" className="text-sm text-red-600 hover:underline">
                Delete Account →
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

/**
 * Server-Side Auth Check
 * Protects this page and fetches profile data
 */
export const getServerSideProps: GetServerSideProps<ProfileProps> = async (context) => {
  const supabase = createServerClient(context)

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (!user) {
    return {
      redirect: {
        destination: '/login?redirect=/profile',
        permanent: false,
      },
    }
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('first_name, last_name, plan_type')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    // Profile should exist (created during signup), but redirect to dashboard if missing
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    }
  }

  return {
    props: {
      user,
      profile,
    },
  }
}
