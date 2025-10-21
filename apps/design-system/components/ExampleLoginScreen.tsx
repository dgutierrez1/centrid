import { Button, Input, Label, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@centrid/ui/components';
import { BrandLogo } from '@centrid/ui/features';

export function ExampleLoginScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <BrandLogo variant="icon-only" size="xl" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to Centrid</CardTitle>
          <CardDescription>
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" />
          </div>
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded border-gray-300" />
              <span className="text-gray-600 dark:text-gray-400">Remember me</span>
            </label>
            <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
              Forgot password?
            </a>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button className="w-full">Sign In</Button>
          <p className="text-sm text-center text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign up
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
