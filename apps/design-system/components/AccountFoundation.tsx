import React, { useState } from 'react';
import { Button } from '@centrid/ui/components/button';
import { Input } from '@centrid/ui/components/input';
import { Label } from '@centrid/ui/components/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@centrid/ui/components/card';
import { Alert } from '@centrid/ui/components/alert';

/**
 * Account Foundation Design System
 * Feature: MVP Account Foundation (002-mvp-account-foundation)
 *
 * Screens:
 * 1. Signup (with firstName/lastName optional)
 * 2. Login
 * 3. Forgot Password
 * 4. Reset Password
 * 5. Dashboard (protected)
 * 6. Profile Settings (edit firstName/lastName)
 * 7. Account Deletion (with confirmation)
 */

// ============================================================================
// REUSABLE APP HEADER COMPONENT
// ============================================================================

interface AppHeaderProps {
  currentPath?: 'dashboard' | 'profile';
}

function AppHeader({ currentPath }: AppHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <button className="text-xl font-semibold text-gray-900 hover:text-gray-700">
            Centrid
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              className={`text-sm font-medium transition-colors ${
                currentPath === 'dashboard'
                  ? 'text-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Dashboard
            </button>
            <button
              className={`text-sm font-medium transition-colors ${
                currentPath === 'profile'
                  ? 'text-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Profile
            </button>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="hidden md:flex">
              Log Out
            </Button>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-gray-200 space-y-3">
            <button
              className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                currentPath === 'dashboard'
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Dashboard
            </button>
            <button
              className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                currentPath === 'profile'
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Profile
            </button>
            <Button variant="outline" size="sm" className="w-full">
              Log Out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}

// ============================================================================
// 1. SIGNUP PAGE
// ============================================================================

export function SignupScreen() {
  const [state, setState] = useState<'default' | 'loading' | 'error' | 'service-error'>('default');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Create Account</CardTitle>
            <p className="text-sm text-gray-600 text-center mt-2">
              Start using Centrid for free
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {state === 'error' && (
              <Alert variant="destructive">
                <p className="text-sm">Invalid email address format</p>
              </Alert>
            )}
            {state === 'service-error' && (
              <Alert variant="destructive">
                <p className="text-sm font-medium mb-2">Service temporarily unavailable</p>
                <p className="text-xs mb-3">Please try again in a moment.</p>
                <Button size="sm" variant="outline" className="w-full">
                  Retry
                </Button>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="h-11"
                disabled={state === 'loading'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 6 characters"
                className="h-11"
                disabled={state === 'loading'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name (Optional)</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="John"
                className="h-11"
                disabled={state === 'loading'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name (Optional)</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                className="h-11"
                disabled={state === 'loading'}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              className="w-full h-11 bg-primary-600 hover:bg-primary-700"
              disabled={state === 'loading'}
            >
              {state === 'loading' ? 'Creating account...' : 'Create Account'}
            </Button>
            <div className="text-center text-sm">
              <span className="text-gray-600">Already have an account? </span>
              <button className="text-primary-600 hover:underline font-medium">
                Log in
              </button>
            </div>
          </CardFooter>
        </Card>

        {/* State Controls for Design Review */}
        <div className="mt-6 p-4 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-xs font-medium text-gray-700 mb-2">Design Controls (Remove in Production)</p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setState('default')}
              className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
            >
              Default
            </button>
            <button
              onClick={() => setState('loading')}
              className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
            >
              Loading
            </button>
            <button
              onClick={() => setState('error')}
              className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
            >
              Validation Error
            </button>
            <button
              onClick={() => setState('service-error')}
              className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
            >
              Service Error
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. LOGIN PAGE
// ============================================================================

export function LoginScreen() {
  const [state, setState] = useState<'default' | 'loading' | 'error'>('default');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
            <p className="text-sm text-gray-600 text-center mt-2">
              Log in to your Centrid account
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {state === 'error' && (
              <Alert variant="destructive">
                <p className="text-sm">Invalid email or password</p>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                className="h-11"
                disabled={state === 'loading'}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="login-password">Password</Label>
                <button className="text-sm text-primary-600 hover:underline">
                  Forgot password?
                </button>
              </div>
              <Input
                id="login-password"
                type="password"
                placeholder="Enter your password"
                className="h-11"
                disabled={state === 'loading'}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              className="w-full h-11 bg-primary-600 hover:bg-primary-700"
              disabled={state === 'loading'}
            >
              {state === 'loading' ? 'Logging in...' : 'Log In'}
            </Button>
            <div className="text-center text-sm">
              <span className="text-gray-600">Don't have an account? </span>
              <button className="text-primary-600 hover:underline font-medium">
                Sign up
              </button>
            </div>
          </CardFooter>
        </Card>

        {/* State Controls */}
        <div className="mt-6 p-4 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-xs font-medium text-gray-700 mb-2">Design Controls</p>
          <div className="flex gap-2">
            <button onClick={() => setState('default')} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">Default</button>
            <button onClick={() => setState('loading')} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">Loading</button>
            <button onClick={() => setState('error')} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">Error</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. FORGOT PASSWORD PAGE
// ============================================================================

export function ForgotPasswordScreen() {
  const [state, setState] = useState<'default' | 'loading' | 'success'>('default');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
            <p className="text-sm text-gray-600 text-center mt-2">
              Enter your email to receive a password reset link
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {state === 'success' ? (
              <Alert className="bg-green-50 border-green-200">
                <div className="text-green-800">
                  <p className="text-sm font-medium mb-1">Check your email</p>
                  <p className="text-xs">
                    We've sent a password reset link to your email address.
                    The link will expire in 1 hour.
                  </p>
                </div>
              </Alert>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="you@example.com"
                  className="h-11"
                  disabled={state === 'loading'}
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            {state !== 'success' && (
              <Button
                className="w-full h-11 bg-primary-600 hover:bg-primary-700"
                disabled={state === 'loading'}
              >
                {state === 'loading' ? 'Sending...' : 'Send Reset Link'}
              </Button>
            )}
            <div className="text-center text-sm">
              <button className="text-primary-600 hover:underline font-medium">
                Back to login
              </button>
            </div>
          </CardFooter>
        </Card>

        {/* State Controls */}
        <div className="mt-6 p-4 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-xs font-medium text-gray-700 mb-2">Design Controls</p>
          <div className="flex gap-2">
            <button onClick={() => setState('default')} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">Default</button>
            <button onClick={() => setState('loading')} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">Loading</button>
            <button onClick={() => setState('success')} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">Success</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. RESET PASSWORD PAGE
// ============================================================================

export function ResetPasswordScreen() {
  const [state, setState] = useState<'default' | 'loading' | 'error' | 'expired'>('default');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Set New Password</CardTitle>
            <p className="text-sm text-gray-600 text-center mt-2">
              Choose a new password for your account
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {state === 'expired' && (
              <Alert variant="destructive">
                <p className="text-sm">This reset link has expired. Please request a new one.</p>
              </Alert>
            )}
            {state === 'error' && (
              <Alert variant="destructive">
                <p className="text-sm">Passwords must match and be at least 6 characters</p>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Minimum 6 characters"
                className="h-11"
                disabled={state === 'loading' || state === 'expired'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Re-enter your password"
                className="h-11"
                disabled={state === 'loading' || state === 'expired'}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              className="w-full h-11 bg-primary-600 hover:bg-primary-700"
              disabled={state === 'loading' || state === 'expired'}
            >
              {state === 'loading' ? 'Resetting...' : 'Reset Password'}
            </Button>
            {state === 'expired' && (
              <Button variant="outline" className="w-full h-11">
                Request New Link
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* State Controls */}
        <div className="mt-6 p-4 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-xs font-medium text-gray-700 mb-2">Design Controls</p>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setState('default')} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">Default</button>
            <button onClick={() => setState('loading')} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">Loading</button>
            <button onClick={() => setState('error')} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">Error</button>
            <button onClick={() => setState('expired')} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">Expired</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 5. DASHBOARD PAGE (Protected)
// ============================================================================

export function DashboardScreen() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader currentPath="dashboard" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Welcome!</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              You're logged in as <span className="font-medium">user@example.com</span>
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  Your account is active with a <span className="font-medium">Free Plan</span>
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Usage this month</p>
                  <p className="text-2xl font-semibold">0 / 100</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Documents uploaded</p>
                  <p className="text-2xl font-semibold">0</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

// ============================================================================
// 6. PROFILE SETTINGS PAGE (Protected)
// ============================================================================

export function ProfileSettingsScreen() {
  const [state, setState] = useState<'default' | 'editing' | 'saving' | 'success' | 'error'>('default');

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader currentPath="profile" />

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Profile Settings</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Manage your account information
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {state === 'success' && (
              <Alert className="bg-green-50 border-green-200">
                <p className="text-sm text-green-800">Profile updated successfully!</p>
              </Alert>
            )}
            {state === 'error' && (
              <Alert variant="destructive">
                <p className="text-sm">Name contains invalid characters</p>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value="user@example.com"
                  disabled
                  className="h-11 bg-gray-50"
                />
                <p className="text-xs text-gray-500">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-firstName">First Name</Label>
                <Input
                  id="profile-firstName"
                  type="text"
                  placeholder="John"
                  className="h-11"
                  disabled={state === 'saving'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-lastName">Last Name</Label>
                <Input
                  id="profile-lastName"
                  type="text"
                  placeholder="Doe"
                  className="h-11"
                  disabled={state === 'saving'}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium mb-2">Account Plan</h3>
              <p className="text-sm text-gray-600">Free Plan - 100 requests per month</p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-red-600 mb-2">Danger Zone</h3>
              <button className="text-sm text-red-600 hover:underline">
                Delete Account
              </button>
            </div>
          </CardContent>
          <CardFooter className="flex gap-3">
            <Button
              className="bg-primary-600 hover:bg-primary-700"
              disabled={state === 'saving'}
            >
              {state === 'saving' ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button variant="outline">
              Cancel
            </Button>
          </CardFooter>
        </Card>

        {/* State Controls */}
        <div className="mt-6 p-4 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-xs font-medium text-gray-700 mb-2">Design Controls</p>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setState('default')} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">Default</button>
            <button onClick={() => setState('saving')} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">Saving</button>
            <button onClick={() => setState('success')} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">Success</button>
            <button onClick={() => setState('error')} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">Error</button>
          </div>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// 7. ACCOUNT DELETION PAGE (Protected)
// ============================================================================

export function AccountDeletionScreen() {
  const [state, setState] = useState<'warning' | 'confirming' | 'processing' | 'error'>('warning');
  const [confirmText, setConfirmText] = useState('');

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader currentPath="profile" />

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-2xl text-red-600">Delete Account</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              This action cannot be undone
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive" className="bg-red-50">
              <div className="text-red-900">
                <p className="text-sm font-medium mb-2">⚠️ Warning: Permanent Data Loss</p>
                <p className="text-sm mb-2">Deleting your account will permanently remove:</p>
                <ul className="text-sm space-y-1 ml-4 list-disc">
                  <li>Your account and profile</li>
                  <li>All uploaded documents</li>
                  <li>All chat conversations and agent sessions</li>
                  <li>All usage history</li>
                </ul>
                <p className="text-sm mt-3 font-medium">This action is irreversible!</p>
              </div>
            </Alert>

            {state === 'error' && (
              <Alert variant="destructive">
                <p className="text-sm">Confirmation phrase must be "DELETE"</p>
              </Alert>
            )}

            {state !== 'warning' && (
              <div className="space-y-2">
                <Label htmlFor="confirm-delete">
                  Type <span className="font-mono font-bold">DELETE</span> to confirm
                </Label>
                <Input
                  id="confirm-delete"
                  type="text"
                  placeholder="Type DELETE"
                  className="h-11"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  disabled={state === 'processing'}
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-3">
            {state === 'warning' ? (
              <>
                <Button
                  variant="destructive"
                  onClick={() => setState('confirming')}
                  className="bg-red-600 hover:bg-red-700"
                >
                  I Understand, Continue
                </Button>
                <Button variant="outline">
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="destructive"
                  disabled={state === 'processing' || confirmText !== 'DELETE'}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {state === 'processing' ? 'Deleting Account...' : 'Delete My Account'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setState('warning');
                    setConfirmText('');
                  }}
                  disabled={state === 'processing'}
                >
                  Cancel
                </Button>
              </>
            )}
          </CardFooter>
        </Card>

        {/* State Controls */}
        <div className="mt-6 p-4 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-xs font-medium text-gray-700 mb-2">Design Controls</p>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => { setState('warning'); setConfirmText(''); }} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">Warning</button>
            <button onClick={() => setState('confirming')} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">Confirming</button>
            <button onClick={() => setState('processing')} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">Processing</button>
            <button onClick={() => setState('error')} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">Error</button>
          </div>
        </div>
      </main>
    </div>
  );
}
