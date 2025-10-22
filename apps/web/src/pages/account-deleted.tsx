/**
 * Account Deleted Confirmation Page
 *
 * Shown after successful account deletion.
 * Public page (no auth required).
 */

import Link from 'next/link'
import { Button } from '@centrid/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@centrid/ui/components/card'

export default function AccountDeletedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Account Deleted</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Your account has been permanently deleted. All your data has been removed from our
            systems.
          </p>

          <p className="text-gray-600">
            We're sorry to see you go. If you change your mind, you're always welcome to create a
            new account.
          </p>

          <div className="pt-4">
            <Link href="/signup">
              <Button className="w-full bg-primary-600 hover:bg-primary-700">
                Create New Account
              </Button>
            </Link>
          </div>

          <div className="text-center">
            <Link href="/" className="text-sm text-primary-600 hover:underline">
              Return to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
