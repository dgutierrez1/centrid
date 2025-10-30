import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Alert, AlertTitle, AlertDescription } from '@centrid/ui/components';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Centrid Web App
          </h1>
          <p className="text-muted-foreground text-lg">
            Centralized UI Package Test - Coral Theme
          </p>
        </div>

        {/* Color Showcase */}
        <Card>
          <CardHeader>
            <CardTitle>Centralized Styles Working!</CardTitle>
            <CardDescription>
              All styles are now managed from @centrid/ui package
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button>Primary Button</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
          </CardContent>
        </Card>

        {/* Theme Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Coral Theme Colors</CardTitle>
            <CardDescription>
              From packages/ui/colors.config.js
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-20 rounded-lg bg-primary-600" />
                <p className="text-sm font-medium">Primary</p>
                <p className="text-xs text-muted-foreground">#ff4d4d</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg bg-success-500" />
                <p className="text-sm font-medium">Success</p>
                <p className="text-xs text-muted-foreground">#34c759</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg bg-warning-500" />
                <p className="text-sm font-medium">Warning</p>
                <p className="text-xs text-muted-foreground">#ff9f0a</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg bg-error-500" />
                <p className="text-sm font-medium">Error</p>
                <p className="text-xs text-muted-foreground">#ff3b30</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Alert>
          <AlertTitle>Configuration Centralized!</AlertTitle>
          <AlertDescription>
            Both apps (web + design-system) now share:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Tailwind config → @centrid/ui/tailwind.preset</li>
              <li>Global CSS → @centrid/ui/styles</li>
              <li>UI Components → @centrid/ui/components</li>
              <li>Colors → @centrid/ui/colors</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Links */}
        <div className="flex gap-4 justify-center">
          <a 
            href="/dashboard" 
            className="text-primary-600 hover:text-primary-700 underline"
          >
            Go to Dashboard →
          </a>
          <a 
            href="http://localhost:3001" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:text-primary-700 underline"
          >
            View Design System →
          </a>
        </div>
      </div>
    </div>
  );
}
