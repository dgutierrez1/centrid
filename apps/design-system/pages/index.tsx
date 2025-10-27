import dynamic from 'next/dynamic';
import { Button, Input, Textarea, Label, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Badge, Alert, AlertTitle, AlertDescription, Separator } from '@centrid/ui/components';
import { PageHeader, BrandLogo, StatCard, EmptyState, SectionHeader, PatternShowcase, FeatureGrid, ColorPalette } from '@centrid/ui/features';
import { ExampleLoginScreen } from '../components/ExampleLoginScreen';

// Dynamic imports with SSR disabled to prevent hydration errors
const SimpleBarChart = dynamic(() => import('@centrid/ui/components').then(mod => ({ default: mod.SimpleBarChart })), { ssr: false });
const SimpleLineChart = dynamic(() => import('@centrid/ui/components').then(mod => ({ default: mod.SimpleLineChart })), { ssr: false });

export default function DesignShowcase() {
  return (
    <div className="min-h-screen bg-mesh-light dark:bg-mesh-dark pattern-dots dark:pattern-dots-dark p-8">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header - Using PageHeader component with data */}
        <PageHeader
          titleAccent="Centrid"
          title="Design System"
          description="Premium components for AI-powered knowledge management"
          badges={[
            { label: 'Innovation', variant: 'default', icon: 'Zap' },
            { label: 'Security', variant: 'secondary', icon: 'Lock' },
            { label: 'Performance', variant: 'outline', icon: 'Zap' },
          ]}
        />

        {/* Logo & Brand Mark */}
        <section>
          <SectionHeader title="Logo & Brand Mark" />
          <div className="space-y-8">
            <div className="glass shadow-premium-lg hover-lift transition-premium rounded-xl p-8 border border-white/20 dark:border-gray-700/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-primary-600/5 opacity-50" />
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 relative z-10">
                Primary Logo
              </h3>
              <div className="flex items-center justify-center p-12 bg-gray-50/50 dark:bg-gray-900/50 rounded-lg pattern-grid dark:pattern-grid-dark relative z-10">
                <BrandLogo size="lg" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass shadow-premium hover-lift transition-premium rounded-xl p-6 border border-white/20 dark:border-gray-700/50">
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-4">
                  Icon Only
                </h3>
                <div className="flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 rounded">
                  <BrandLogo variant="icon-only" size="xl" />
                </div>
              </div>

              <div className="bg-gray-900 dark:bg-white shadow-premium hover-lift transition-premium rounded-xl p-6 border border-gray-700 dark:border-gray-200">
                <h3 className="text-xs font-medium text-gray-400 dark:text-gray-600 mb-4">
                  Dark Background
                </h3>
                <div className="flex items-center justify-center p-8">
                  <BrandLogo size="md" variant="minimal" className="[&_span]:!text-white dark:[&_span]:!text-gray-900" />
                </div>
              </div>

              <div className="glass shadow-premium hover-lift transition-premium rounded-xl p-6 border border-white/20 dark:border-gray-700/50">
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-4">
                  Minimum Size
                </h3>
                <div className="flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 rounded">
                  <BrandLogo size="sm" variant="minimal" />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <strong>Spacing Rule:</strong> Maintain minimum clear space equal to the height of the icon around the logo.
                Minimum logo width: 100px. Never distort or rotate the logo.
              </p>
            </div>
          </div>
        </section>

        {/* Color Palette - Using ColorPalette component with data */}
        <section>
          <SectionHeader title="Color Palette" />
          <ColorPalette
            columns={5}
            colors={[
              { name: 'Primary (Coral)', hex: '#ff4d4d', colorClass: 'bg-primary-600' },
              { name: 'Gray', hex: '#52525B', colorClass: 'bg-gray-600' },
              { name: 'Success', hex: '#34c759', colorClass: 'bg-success-500' },
              { name: 'Warning', hex: '#ff9f0a', colorClass: 'bg-warning-500' },
              { name: 'Error', hex: '#dc2626', colorClass: 'bg-error-500' },
            ]}
          />

          <ColorPalette
            className="mt-6"
            title="AI Agent Colors (Harmonized Coral System)"
            columns={3}
            colors={[
              { name: 'Create Agent', hex: '#ff4d4d', colorClass: 'bg-agent-create' },
              { name: 'Edit Agent', hex: '#ff6d6d', colorClass: 'bg-agent-edit' },
              { name: 'Research Agent', hex: '#ff7060' },
            ]}
          />
        </section>

        {/* Iconography */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
            Iconography
          </h2>
          <div className="space-y-6">
            <div className="glass shadow-premium hover-lift transition-premium rounded-xl p-6 border border-white/20 dark:border-gray-700/50">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-6">
                Icon Sizes
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="flex flex-col items-center gap-3">
                  <svg className="w-4 h-4 text-gray-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs text-gray-600 dark:text-gray-400">16px (sm)</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <svg className="w-5 h-5 text-gray-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs text-gray-600 dark:text-gray-400">20px (md)</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <svg className="w-6 h-6 text-gray-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs text-gray-600 dark:text-gray-400">24px (lg)</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <svg className="w-8 h-8 text-gray-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs text-gray-600 dark:text-gray-400">32px (xl)</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {[
                { name: 'Home', path: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                { name: 'Search', path: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
                { name: 'Settings', path: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
                { name: 'User', path: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                { name: 'Bell', path: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
                { name: 'Check', path: 'M5 13l4 4L19 7' },
              ].map((icon, idx) => (
                <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 flex flex-col items-center gap-3">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon.path} />
                  </svg>
                  <span className="text-xs text-gray-600 dark:text-gray-400">{icon.name}</span>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <strong>Usage Guidelines:</strong> Icons should be 24px by default. Use 16px for inline text, 20px for buttons, and 32px+ for feature callouts.
                Always maintain 2px stroke width for consistency. Icons use currentColor for flexible theming.
              </p>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
            Buttons
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Variants
              </h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="default">Primary Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="destructive">Destructive Button</Button>
                <Button variant="outline">Outline Button</Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Sizes
              </h3>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                States
              </h3>
              <div className="flex flex-wrap gap-4">
                <Button>Normal</Button>
                <Button disabled>Disabled</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Form Elements */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
            Form Elements
          </h2>
          <div className="max-w-md space-y-6">
            <div className="space-y-2">
              <Label htmlFor="input-default">Default Input</Label>
              <Input id="input-default" type="text" placeholder="Enter text..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="input-email">Email Input</Label>
              <Input id="input-email" type="email" placeholder="you@example.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="input-password">Password Input</Label>
              <Input id="input-password" type="password" placeholder="••••••••" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="textarea-default">Textarea</Label>
              <Textarea id="textarea-default" placeholder="Enter a longer message..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="input-disabled">Disabled Input</Label>
              <Input id="input-disabled" type="text" placeholder="Disabled..." disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="input-error" className="text-error-600">Error State</Label>
              <Input
                id="input-error"
                type="text"
                placeholder="Invalid input"
                className="border-error-500 focus-visible:ring-error-500"
              />
              <p className="text-sm text-error-600">This field is required</p>
            </div>
          </div>
        </section>

        {/* Alerts */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
            Alerts
          </h2>
          <div className="space-y-4 max-w-2xl">
            <Alert>
              <AlertTitle>Default Alert</AlertTitle>
              <AlertDescription>
                This is a default alert with informational content.
              </AlertDescription>
            </Alert>

            <Alert variant="success">
              <AlertTitle>Success Alert</AlertTitle>
              <AlertDescription>
                Your changes have been saved successfully.
              </AlertDescription>
            </Alert>

            <Alert variant="warning">
              <AlertTitle>Warning Alert</AlertTitle>
              <AlertDescription>
                Please review your input before proceeding.
              </AlertDescription>
            </Alert>

            <Alert variant="destructive">
              <AlertTitle>Error Alert</AlertTitle>
              <AlertDescription>
                An error occurred. Please try again later.
              </AlertDescription>
            </Alert>
          </div>
        </section>

        {/* Separator */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
            Separator
          </h2>
          <div className="space-y-4 max-w-md">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Horizontal Separator</p>
              <div className="space-y-2">
                <p className="text-sm">Section 1</p>
                <Separator />
                <p className="text-sm">Section 2</p>
                <Separator />
                <p className="text-sm">Section 3</p>
              </div>
            </div>
          </div>
        </section>

        {/* Badges */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
            Badges
          </h2>
          <div className="flex flex-wrap gap-3">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="destructive">Error</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </section>

        {/* Cards */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
            Cards
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Simple Card</CardTitle>
                <CardDescription>
                  A basic card with header and content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This is the card content area. You can put any content here.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Card with Footer</CardTitle>
                <CardDescription>
                  Includes a footer section
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Card content goes here.
                </p>
              </CardContent>
              <CardFooter className="justify-between">
                <Button variant="ghost" size="sm">Cancel</Button>
                <Button size="sm">Save</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>Interactive Card</CardTitle>
                    <CardDescription>
                      With badges and buttons
                    </CardDescription>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This card demonstrates multiple components working together.
                </p>
                <Button variant="outline" className="w-full">
                  View Details
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Typography */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
            Typography
          </h2>
          <div className="space-y-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Heading 1
              </h1>
              <p className="text-sm text-gray-500 mt-1">text-4xl font-bold</p>
            </div>
            <div>
              <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">
                Heading 2
              </h2>
              <p className="text-sm text-gray-500 mt-1">text-3xl font-semibold</p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Heading 3
              </h3>
              <p className="text-sm text-gray-500 mt-1">text-2xl font-semibold</p>
            </div>
            <div>
              <p className="text-base text-gray-900 dark:text-white">
                Body text - Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              </p>
              <p className="text-sm text-gray-500 mt-1">text-base</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Small text - Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              </p>
              <p className="text-sm text-gray-500 mt-1">text-sm text-gray-600</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Extra small text - Lorem ipsum dolor sit amet.
              </p>
              <p className="text-sm text-gray-500 mt-1">text-xs text-gray-500</p>
            </div>
          </div>
        </section>

        {/* Spacing */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
            Spacing Scale
          </h2>
          <div className="space-y-3">
            {[1, 2, 4, 6, 8, 12, 16, 24, 32].map((space) => (
              <div key={space} className="flex items-center gap-4">
                <div className="w-16 text-sm text-gray-600">{space * 4}px</div>
                <div
                  className="bg-primary-500 h-8"
                  style={{ width: `${space * 4}px` }}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Grid & Layout System */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
            Grid & Layout System
          </h2>
          <div className="space-y-6">
            <div className="glass shadow-premium hover-lift transition-premium rounded-xl p-6 border border-white/20 dark:border-gray-700/50">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Breakpoints
              </h3>
              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                  <span>sm</span>
                  <span className="text-gray-600 dark:text-gray-400">640px</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                  <span>md</span>
                  <span className="text-gray-600 dark:text-gray-400">768px</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                  <span>lg</span>
                  <span className="text-gray-600 dark:text-gray-400">1024px</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                  <span>xl</span>
                  <span className="text-gray-600 dark:text-gray-400">1280px</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                  <span>2xl</span>
                  <span className="text-gray-600 dark:text-gray-400">1536px</span>
                </div>
              </div>
            </div>

            <div className="glass shadow-premium hover-lift transition-premium rounded-xl p-6 border border-white/20 dark:border-gray-700/50">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                12-Column Grid
              </h3>
              <div className="grid grid-cols-12 gap-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="h-16 bg-primary-100 dark:bg-primary-900/20 rounded flex items-center justify-center text-xs text-primary-700 dark:text-primary-300">
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>

            <div className="glass shadow-premium hover-lift transition-premium rounded-xl p-6 border border-white/20 dark:border-gray-700/50">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Container Widths
              </h3>
              <div className="space-y-4">
                <div className="bg-primary-50 dark:bg-primary-900/10 border-2 border-primary-200 dark:border-primary-800 rounded p-4 max-w-sm">
                  <span className="text-xs text-primary-700 dark:text-primary-300">max-w-sm (384px)</span>
                </div>
                <div className="bg-primary-50 dark:bg-primary-900/10 border-2 border-primary-200 dark:border-primary-800 rounded p-4 max-w-md">
                  <span className="text-xs text-primary-700 dark:text-primary-300">max-w-md (448px)</span>
                </div>
                <div className="bg-primary-50 dark:bg-primary-900/10 border-2 border-primary-200 dark:border-primary-800 rounded p-4 max-w-lg">
                  <span className="text-xs text-primary-700 dark:text-primary-300">max-w-lg (512px)</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Elevation & Shadows */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
            Elevation & Shadows
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'None', class: 'shadow-none' },
              { name: 'Small', class: 'shadow-sm' },
              { name: 'Medium', class: 'shadow-md' },
              { name: 'Large', class: 'shadow-lg' },
              { name: 'Extra Large', class: 'shadow-xl' },
              { name: '2XL', class: 'shadow-2xl' },
            ].map((shadow) => (
              <div key={shadow.name} className="space-y-3">
                <div className={`h-24 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center ${shadow.class}`}>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{shadow.name}</span>
                </div>
                <p className="text-xs text-gray-500 text-center font-mono">{shadow.class}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Premium Design Elements - Using FeatureCard and PatternShowcase */}
        <section>
          <SectionHeader title="Premium Design Elements" />
          <div className="space-y-6">
            <div className="glass shadow-premium-xl hover-lift transition-premium rounded-xl p-8 border border-white/20 dark:border-gray-700/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-primary-600/10" />
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-6 relative z-10">
                Enhanced Glassmorphism with Depth
              </h3>
              <FeatureGrid
                className="relative z-10"
                columns={3}
                features={[
                  { icon: 'Zap', title: 'AI-Powered', description: 'Context-aware intelligence', iconColor: 'primary', variant: 'default' },
                  { icon: 'ShieldCheck', title: 'Secure by Design', description: 'Enterprise-grade security', iconColor: 'success', variant: 'glow' },
                  { icon: 'Zap', title: 'Lightning Fast', description: 'Optimized performance', iconColor: 'warning', variant: 'default' },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PatternShowcase
                title="Mesh Gradient Background"
                description="Multi-layered radial gradients create depth and visual interest while maintaining readability"
                background="mesh"
              />

              <PatternShowcase
                title="Subtle Pattern Overlay"
                description="Knowledge graph-inspired patterns add texture without overwhelming content"
                background="dots"
              />
            </div>

            <div className="glass shadow-premium-lg rounded-xl p-8 border border-white/20 dark:border-gray-700/50">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-6">
                Interactive Hover Effects
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button className="glass shadow-premium hover-lift transition-premium rounded-lg p-4 focus-premium">
                  <span className="text-sm font-medium">Lift Effect</span>
                </button>
                <button className="glass shadow-premium hover-glow transition-premium rounded-lg p-4 focus-premium">
                  <span className="text-sm font-medium">Glow Effect</span>
                </button>
                <button className="glass shadow-premium hover-lift hover-glow transition-premium rounded-lg p-4 focus-premium">
                  <span className="text-sm font-medium">Combined</span>
                </button>
                <button className="border-gradient shadow-premium transition-premium p-4 focus-premium">
                  <span className="text-sm font-medium">Gradient Border</span>
                </button>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <strong>Design Philosophy:</strong> These premium elements combine innovation with predictability.
                Glassmorphism and subtle animations create a modern, engaging feel, while consistent patterns
                and secure design principles build trust. Multi-layer shadows add depth without distraction,
                and all effects are optimized for performance.
              </p>
            </div>
          </div>
        </section>

        {/* Animations & Transitions */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
            Animations & Transitions
          </h2>
          <div className="space-y-6">
            <div className="glass shadow-premium hover-lift transition-premium rounded-xl p-6 border border-white/20 dark:border-gray-700/50">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Duration Scale
              </h3>
              <div className="space-y-3">
                {[
                  { name: 'Fast', duration: '150ms', class: 'duration-150' },
                  { name: 'Normal', duration: '300ms', class: 'duration-300' },
                  { name: 'Slow', duration: '500ms', class: 'duration-500' },
                ].map((item) => (
                  <div key={item.name} className="flex items-center gap-4">
                    <div className="w-32 text-sm">{item.name} ({item.duration})</div>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-900 rounded-lg p-4 flex items-center justify-start overflow-hidden">
                      <div className={`w-12 h-12 bg-primary-600 rounded ${item.class} hover:translate-x-40 transition-transform`} />
                    </div>
                    <span className="text-xs text-gray-500 font-mono">{item.class}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass shadow-premium hover-lift transition-premium rounded-xl p-6 border border-white/20 dark:border-gray-700/50">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Easing Functions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { name: 'Ease In', class: 'ease-in' },
                  { name: 'Ease Out', class: 'ease-out' },
                  { name: 'Ease In Out', class: 'ease-in-out' },
                ].map((easing) => (
                  <Button key={easing.name} className={`transition-all ${easing.class} hover:scale-105`}>
                    {easing.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Loading States */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
            Loading States
          </h2>
          <div className="space-y-6">
            <div className="glass shadow-premium hover-lift transition-premium rounded-xl p-6 border border-white/20 dark:border-gray-700/50">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Spinner
              </h3>
              <div className="flex gap-6 items-center">
                {['w-4 h-4', 'w-6 h-6', 'w-8 h-8', 'w-12 h-12'].map((size, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    <div className={`${size} border-2 border-primary-600 border-t-transparent rounded-full animate-spin`} />
                    <span className="text-xs text-gray-500">{size.split(' ')[0].substring(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass shadow-premium hover-lift transition-premium rounded-xl p-6 border border-white/20 dark:border-gray-700/50">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Progress Bar
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>25%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-600 rounded-full" style={{ width: '25%' }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>50%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-600 rounded-full" style={{ width: '50%' }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>75%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-600 rounded-full" style={{ width: '75%' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="glass shadow-premium hover-lift transition-premium rounded-xl p-6 border border-white/20 dark:border-gray-700/50">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Skeleton Loader
              </h3>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-4/6" />
              </div>
            </div>
          </div>
        </section>

        {/* Empty States - Using EmptyState component with data */}
        <section>
          <SectionHeader title="Empty States" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EmptyState
              icon="Archive"
              title="No documents yet"
              description="Upload your first document to get started"
              actionLabel="Upload Document"
              onAction={() => console.log('Upload clicked')}
            />

            <EmptyState
              icon="AlertCircle"
              title="Connection Error"
              description="Unable to load data. Please check your connection."
              actionLabel="Try Again"
              onAction={() => console.log('Retry clicked')}
              variant="error"
            />
          </div>
        </section>

        {/* Accessibility */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
            Accessibility
          </h2>
          <div className="space-y-6">
            <div className="glass shadow-premium hover-lift transition-premium rounded-xl p-6 border border-white/20 dark:border-gray-700/50">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Focus States
              </h3>
              <div className="flex flex-wrap gap-4">
                <Button>Tab to focus</Button>
                <Input placeholder="Focus with keyboard" className="max-w-xs" />
                <button className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2">
                  Custom Focus Ring
                </button>
              </div>
            </div>

            <div className="glass shadow-premium hover-lift transition-premium rounded-xl p-6 border border-white/20 dark:border-gray-700/50">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Color Contrast
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="bg-primary-600 text-white p-4 rounded">
                    <p className="text-sm font-medium">AA Pass</p>
                    <p className="text-xs">4.5:1 contrast ratio</p>
                  </div>
                  <p className="text-xs text-gray-500">Primary on White</p>
                </div>
                <div className="space-y-2">
                  <div className="bg-success-600 text-white p-4 rounded">
                    <p className="text-sm font-medium">AA Pass</p>
                    <p className="text-xs">4.5:1 contrast ratio</p>
                  </div>
                  <p className="text-xs text-gray-500">Success on White</p>
                </div>
                <div className="space-y-2">
                  <div className="bg-error-600 text-white p-4 rounded">
                    <p className="text-sm font-medium">AA Pass</p>
                    <p className="text-xs">4.5:1 contrast ratio</p>
                  </div>
                  <p className="text-xs text-gray-500">Error on White</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <strong>WCAG 2.1 Compliance:</strong> All components follow WCAG 2.1 Level AA standards.
                Use semantic HTML, provide ARIA labels where needed, and ensure keyboard navigation works throughout.
                Text contrast ratios meet 4.5:1 for normal text and 3:1 for large text.
              </p>
            </div>
          </div>
        </section>

        {/* Data Visualization */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
            Data Visualization
          </h2>
          <div className="space-y-6">
            <div className="glass shadow-premium hover-lift transition-premium rounded-xl p-6 border border-white/20 dark:border-gray-700/50">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Chart Color Palette
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: 'Series 1', color: '#ff4d4d', hex: '#ff4d4d' },
                  { name: 'Series 2', color: '#34c759', hex: '#34c759' },
                  { name: 'Series 3', color: '#ff9f0a', hex: '#ff9f0a' },
                  { name: 'Series 4', color: '#5856d6', hex: '#5856d6' },
                  { name: 'Series 5', color: '#00c7be', hex: '#00c7be' },
                  { name: 'Series 6', color: '#ff375f', hex: '#ff375f' },
                  { name: 'Series 7', color: '#af52de', hex: '#af52de' },
                  { name: 'Series 8', color: '#007aff', hex: '#007aff' },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="h-16 rounded" style={{ backgroundColor: item.color }} />
                    <p className="text-xs font-medium text-gray-900 dark:text-white">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.hex}</p>
                  </div>
                ))}
              </div>
            </div>

            <SimpleBarChart />
            <SimpleLineChart />

            <div className="glass shadow-premium hover-lift transition-premium rounded-xl p-6 border border-white/20 dark:border-gray-700/50">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Example Stat Cards
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  label="Total Requests"
                  value="12,345"
                  change="+12.5%"
                  changeType="positive"
                />
                <StatCard
                  label="Active Users"
                  value="1,234"
                  change="+5.2%"
                  changeType="positive"
                />
                <StatCard
                  label="Error Rate"
                  value="0.5%"
                  change="-2.1%"
                  changeType="positive"
                />
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <strong>Data Visualization Guidelines:</strong> Use the designated chart color palette for multi-series data.
                Maintain 4:1 contrast ratio for text on colored backgrounds. Always provide text alternatives (ARIA labels) for charts.
                Use semantic colors (success/warning/error) for status indicators. Ensure interactive elements have visible focus states.
              </p>
            </div>
          </div>
        </section>

        {/* Illustrations */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
            Illustrations
          </h2>
          <div className="space-y-6">
            <div className="glass shadow-premium hover-lift transition-premium rounded-xl p-6 border border-white/20 dark:border-gray-700/50">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Illustration Style
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8 flex flex-col items-center justify-center min-h-[200px]">
                  <svg className="w-32 h-32 mb-4" viewBox="0 0 200 200" fill="none">
                    <circle cx="100" cy="100" r="80" className="fill-primary-100 dark:fill-primary-900/20" />
                    <path d="M100 50 L140 90 L130 90 L130 130 L70 130 L70 90 L60 90 Z" className="fill-primary-600" />
                    <circle cx="100" cy="150" r="5" className="fill-primary-700" />
                  </svg>
                  <p className="text-xs text-gray-600 dark:text-gray-400 text-center">Upload Illustration</p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8 flex flex-col items-center justify-center min-h-[200px]">
                  <svg className="w-32 h-32 mb-4" viewBox="0 0 200 200" fill="none">
                    <circle cx="100" cy="100" r="80" className="fill-success-100 dark:fill-success-900/20" />
                    <circle cx="100" cy="70" r="25" className="fill-success-600" />
                    <path d="M75 110 Q75 95 100 95 Q125 95 125 110 L125 140 Q125 155 100 155 Q75 155 75 140 Z" className="fill-success-600" />
                    <circle cx="90" cy="65" r="3" className="fill-white" />
                    <circle cx="110" cy="65" r="3" className="fill-white" />
                    <path d="M90 80 Q100 85 110 80" className="stroke-white" strokeWidth="2" strokeLinecap="round" fill="none" />
                  </svg>
                  <p className="text-xs text-gray-600 dark:text-gray-400 text-center">User Profile Illustration</p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8 flex flex-col items-center justify-center min-h-[200px]">
                  <svg className="w-32 h-32 mb-4" viewBox="0 0 200 200" fill="none">
                    <circle cx="100" cy="100" r="80" className="fill-warning-100 dark:fill-warning-900/20" />
                    <rect x="60" y="70" width="80" height="60" rx="4" className="fill-warning-600" />
                    <rect x="70" y="80" width="60" height="4" className="fill-warning-200" />
                    <rect x="70" y="90" width="50" height="4" className="fill-warning-200" />
                    <rect x="70" y="100" width="55" height="4" className="fill-warning-200" />
                  </svg>
                  <p className="text-xs text-gray-600 dark:text-gray-400 text-center">Document Illustration</p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8 flex flex-col items-center justify-center min-h-[200px]">
                  <svg className="w-32 h-32 mb-4" viewBox="0 0 200 200" fill="none">
                    <circle cx="100" cy="100" r="80" className="fill-gray-100 dark:fill-gray-700" />
                    <path d="M60 100 L90 130 L140 70" className="stroke-success-600" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                  <p className="text-xs text-gray-600 dark:text-gray-400 text-center">Success Illustration</p>
                </div>
              </div>
            </div>

            <div className="glass shadow-premium hover-lift transition-premium rounded-xl p-6 border border-white/20 dark:border-gray-700/50">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Color Usage in Illustrations
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-primary-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Primary (Coral)</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Use for brand-focused illustrations, main subjects, and primary actions
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-success-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Success (Green)</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Use for positive states, completed actions, and success messages
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-warning-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Warning (Orange)</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Use for caution states, important notices, and pending actions
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Gray (Neutral)</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Use for backgrounds, secondary elements, and decorative shapes
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass shadow-premium hover-lift transition-premium rounded-xl p-6 border border-white/20 dark:border-gray-700/50">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-6">
                Do's and Don'ts
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm text-gray-700 dark:text-gray-300">Use simple, geometric shapes</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm text-gray-700 dark:text-gray-300">Maintain consistent stroke widths</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm text-gray-700 dark:text-gray-300">Use brand colors from the palette</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm text-gray-700 dark:text-gray-300">Keep illustrations friendly and approachable</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <p className="text-sm text-gray-700 dark:text-gray-300">Don't use overly complex details</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <p className="text-sm text-gray-700 dark:text-gray-300">Don't use colors outside the palette</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <p className="text-sm text-gray-700 dark:text-gray-300">Don't mix illustration styles</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <p className="text-sm text-gray-700 dark:text-gray-300">Don't use gradients excessively</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <strong>Illustration Guidelines:</strong> Illustrations should be simple, geometric, and friendly.
                Use 2-3 colors maximum per illustration from the brand palette. Maintain consistent rounded corners (8px radius).
                All illustrations should work in both light and dark modes. Export as SVG for crisp rendering at any size.
              </p>
            </div>
          </div>
        </section>

        {/* Example Feature: Login Screen */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
            Example Feature Design
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            This demonstrates how to design a complete feature screen in the sandbox.
            View the code in <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">components/ExampleLoginScreen.tsx</code>
          </p>
          <div className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
            <ExampleLoginScreen />
          </div>
        </section>

        {/* MVP Account Foundation Feature */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
            Feature Designs
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Complete feature flows with multiple screens and states.
          </p>

          <div className="grid gap-4">
            <a href="/account-foundation" className="block">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-xl">MVP Account Foundation</CardTitle>
                  <CardDescription>
                    Complete authentication and account management flow (7 screens)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Signup, Login, Password Reset, Dashboard, Profile Settings, Account Deletion
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    Feature: 002-mvp-account-foundation
                  </p>
                </CardContent>
              </Card>
            </a>

            <a href="/filesystem-markdown-editor" className="block">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-xl">File System & Markdown Editor</CardTitle>
                  <CardDescription>
                    Complete workspace with file management, markdown editing, and AI chat (7 screens)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Three-panel desktop workspace, mobile views, file upload, empty states, context menu, search
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    Feature: 003-filesystem-markdown-editor
                  </p>
                </CardContent>
              </Card>
            </a>

            <a href="/ai-agent-system" className="block">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-primary-600">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">AI-Powered Exploration Workspace</CardTitle>
                      <CardDescription>
                        Branching threads, persistent filesystem, provenance tracking, and cross-branch discovery (6 screens)
                      </CardDescription>
                    </div>
                    <Badge className="bg-primary-600 text-white">New</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Thread view with message streaming, context panel (6 sections), branch selector, tool approval workflow, file editor panel
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    Feature: 004-ai-agent-system
                  </p>
                </CardContent>
              </Card>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
