/**
 * Protected Dashboard Page
 *
 * Post-login landing page showing account overview.
 * Requires authentication - redirects to login if not authenticated.
 *
 * Design: apps/design-system/public/screenshots/account-foundation/05-dashboard-*
 */

import { useEffect, useState } from 'react'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Button } from '@centrid/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@centrid/ui/components/card'
import { useAuthContext } from '@/components/providers/AuthProvider'
import { createServerClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

interface DashboardProps {
  user: User | null
  profile: {
    first_name: string | null
    last_name: string | null
    plan_type: string
    usage_count: number
  } | null
}

export default function Dashboard({ user: initialUser, profile }: DashboardProps) {
  const { user, signOut } = useAuthContext()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Use server-side user if client-side user not loaded yet
  const currentUser = user || initialUser

  const displayName = profile?.first_name
    ? `${profile.first_name}${profile.last_name ? ` ${profile.last_name}` : ''}`
    : null

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
                className="text-sm font-medium text-primary-600"
              >
                Dashboard
              </Link>
              <Link
                href="/profile"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Profile
              </Link>
            </nav>

            {/* Desktop Logout Button */}
            <Button
              variant="outline"
              onClick={signOut}
              className="hidden md:block"
            >
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
                  className="text-sm font-medium text-primary-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className="text-sm font-medium text-gray-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <Button
                  variant="outline"
                  onClick={signOut}
                  className="w-full mt-2"
                >
                  Log Out
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {displayName ? `Welcome, ${displayName}!` : 'Welcome!'}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              You're logged in as {currentUser?.email}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Plan Status Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                Your account is active with a{' '}
                <span className="font-semibold capitalize">{profile?.plan_type || 'Free'}</span>{' '}
                Plan
              </p>
            </div>

            {/* Usage Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Usage This Month */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Usage This Month
                </h3>
                <p className="text-2xl font-semibold text-gray-900">
                  {profile?.usage_count || 0} / 100
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  AI requests remaining
                </p>
              </div>

              {/* Documents Uploaded */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Documents Uploaded
                </h3>
                <p className="text-2xl font-semibold text-gray-900">0</p>
                <p className="text-xs text-gray-500 mt-1">
                  Upload documents to get started
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="flex flex-wrap gap-3">
                <Link href="/profile">
                  <Button variant="outline">Edit Profile</Button>
                </Link>
                <Link href="/documents">
                  <Button variant="outline">Upload Documents</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

/**
 * Server-Side Auth Check
 *
 * Protects this page - redirects to login if not authenticated.
 * Fetches user profile data server-side for immediate display.
 */
export const getServerSideProps: GetServerSideProps<DashboardProps> = async (context) => {
  const supabase = createServerClient(context)

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (!user) {
    return {
      redirect: {
        destination: '/login?redirect=/dashboard',
        permanent: false,
      },
    }
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('first_name, last_name, plan_type, usage_count')
    .eq('user_id', user.id)
    .single()

  return {
    props: {
      user,
      profile: profile || null,
    },
  }
}
