import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@centrid/ui/components';

export default function AccountFoundationIndex() {
  const screens = [
    { name: '1. Signup', href: '/account-foundation/signup', description: 'Account creation with firstName/lastName' },
    { name: '2. Login', href: '/account-foundation/login', description: 'User authentication' },
    { name: '3. Forgot Password', href: '/account-foundation/forgot-password', description: 'Password reset request' },
    { name: '4. Reset Password', href: '/account-foundation/reset-password', description: 'Set new password' },
    { name: '5. Dashboard', href: '/account-foundation/dashboard', description: 'Post-login landing page' },
    { name: '6. Profile Settings', href: '/account-foundation/profile', description: 'Edit profile information' },
    { name: '7. Account Deletion', href: '/account-foundation/delete-account', description: 'Delete account with confirmation' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-sm text-primary-600 hover:underline mb-4 inline-block">
            ← Back to Design System
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">MVP Account Foundation</h1>
          <p className="text-gray-600 mt-2">
            Complete authentication and account management flow for MVP
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Feature: 002-mvp-account-foundation
          </p>
        </div>

        <div className="grid gap-4">
          {screens.map((screen) => (
            <Link key={screen.href} href={screen.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-xl">{screen.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{screen.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Design System:</strong> All screens use components from{' '}
            <code className="px-1 bg-blue-100 rounded">@centrid/ui/components</code>
          </p>
          <p className="text-sm text-blue-900 mt-2">
            <strong>Viewports:</strong> Resize your browser to see responsive behavior (375px mobile, 1440px desktop)
          </p>
        </div>
      </div>
    </div>
  );
}
