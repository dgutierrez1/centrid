import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Alert, AlertTitle, AlertDescription } from '@centrid/ui/components';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-18 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 z-50">
        <div className="max-w-7xl mx-auto px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="text-2xl font-bold text-gradient">Centrid</span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost">Sign In</Button>
            <Button className="shadow-premium hover-lift transition-all duration-300">Get Started Free</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-6xl font-bold mb-6 tracking-tight">
            AI For Knowledge Work With{' '}
            <span className="text-gradient">Persistent Context</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Stop Re-Explaining Context. Start Working Smarter.<br />
            Upload your documents once. Work across multiple chats.<br />
            Persistent document context for your knowledge work—reducing re-explanation.
          </p>

          <div className="flex gap-4 justify-center mb-8">
            <Button size="lg" className="shadow-premium hover-lift transition-all duration-300">
              Start Working Smarter
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Button>
            <Button size="lg" variant="outline" className="hover-lift transition-all duration-300">
              Sign In
            </Button>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground mb-12">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Your documents stay private</span>
            </div>
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Powered by Claude AI</span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-16">
            No credit card required • 7-day free trial • Setup in 60 seconds
          </p>

          {/* Workspace Demo Mockup */}
          <div className="glass shadow-premium-lg rounded-2xl overflow-hidden border border-white/20 dark:border-gray-700/50 max-w-6xl mx-auto hover-lift transition-all duration-500">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-12 text-left">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-error-500" />
                  <div className="w-3 h-3 rounded-full bg-warning-500" />
                  <div className="w-3 h-3 rounded-full bg-success-500" />
                </div>
                <h3 className="text-3xl font-bold text-white">AI Marketing Strategy</h3>
                <p className="text-gray-400 text-lg">
                  Artificial intelligence is fundamentally transforming how marketing professionals create, distribute, and optimize content...
                </p>
                <div className="flex gap-2">
                  <Badge className="bg-primary-600/20 text-primary-400 border-primary-600/30">Marketing</Badge>
                  <Badge variant="outline" className="text-gray-400">5 min ago</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-20 px-8 bg-gradient-to-b from-transparent to-gray-50 dark:to-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="glass shadow-premium hover-lift transition-all duration-300 border-white/20 dark:border-gray-700/50">
              <CardHeader>
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <CardTitle>Multiple Conversations</CardTitle>
                <CardDescription>
                  Start separate chats for different topics while maintaining document context
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass shadow-premium hover-lift transition-all duration-300 border-white/20 dark:border-gray-700/50">
              <CardHeader>
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <CardTitle>Persistent Context</CardTitle>
                <CardDescription>
                  Upload once, reference everywhere—your documents stay available across all chats
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass shadow-premium hover-lift transition-all duration-300 border-white/20 dark:border-gray-700/50">
              <CardHeader>
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <CardTitle>Smart Agents</CardTitle>
                <CardDescription>
                  AI automatically selects the best agent based on your request and context
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">
            Context Fragmentation Is Killing Your{' '}
            <span className="text-gradient">Productivity</span>
          </h2>

          <div className="space-y-4 mb-12">
            {[
              'Re-explain the same context in different conversations',
              'Copy-paste documents repeatedly to maintain context',
              'Lose your train of thought when exploring tangents',
              'Manage disconnected threads about related work',
              'Spend more time on context setup than actual work'
            ].map((problem, index) => (
              <div key={index} className="glass shadow-premium hover-lift transition-all duration-300 rounded-xl p-6 border border-white/20 dark:border-gray-700/50 flex items-start gap-4">
                <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-warning-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-lg text-muted-foreground">{problem}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-xl text-foreground mb-4">
            Stop wasting <strong className="text-gradient">hours every week</strong> on context management instead of meaningful knowledge work.
          </p>
          <p className="text-center text-lg text-muted-foreground">
            There's a better way to work with AI.
          </p>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 px-8 bg-gradient-to-b from-transparent to-gray-50 dark:to-gray-900/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">
            Persistent Context For{' '}
            <span className="text-gradient">Knowledge Work</span>
          </h2>

          <div className="space-y-8">
            {[
              {
                number: '1',
                title: 'Upload Your Documents Once',
                description: 'Drop in your documents, notes, research—anything you reference. Centrid maintains this context across all your work.'
              },
              {
                number: '2',
                title: 'Work Across Multiple Chats',
                description: 'Start new conversations for different topics or angles. Each chat maintains access to your document context—automatically.'
              },
              {
                number: '3',
                title: 'Focus on Knowledge Work, Not Context Management',
                description: 'Switch topics, branch conversations, explore tangents—your AI maintains document context. Designed to reduce copy-pasting and re-explaining.'
              }
            ].map((step, index) => (
              <Card key={index} className="glass shadow-premium-lg hover-lift transition-all duration-300 border-white/20 dark:border-gray-700/50">
                <CardContent className="p-8 flex gap-6">
                  <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button size="lg" className="shadow-premium hover-lift transition-all duration-300">
              Start Working Smarter
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Button>
            <p className="text-sm text-muted-foreground mt-3">Free for 7 days • No credit card</p>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">
            Built For How Knowledge Workers{' '}
            <span className="text-gradient">Actually Work</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                ),
                title: 'Create & Generate',
                description: 'Generate blog posts, proposals, reports—grounded in your uploaded documents.'
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                ),
                title: 'Research & Synthesize',
                description: 'Find information across your documents. Different chats can research different angles.'
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
                title: 'Analyze & Decide',
                description: 'Make informed decisions with context. Analyze options, compare approaches.'
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                ),
                title: 'Branch & Explore',
                description: 'Explore tangents without losing context. Your document context travels with you.'
              }
            ].map((useCase, index) => (
              <Card key={index} className="glass shadow-premium hover-lift transition-all duration-300 border-white/20 dark:border-gray-700/50">
                <CardHeader>
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center mb-4 shadow-lg text-white">
                    {useCase.icon}
                  </div>
                  <CardTitle className="text-xl">{useCase.title}</CardTitle>
                  <CardDescription className="text-base">{useCase.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 px-8 bg-gradient-to-b from-transparent to-gray-50 dark:to-gray-900/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">
            Your Data, Your <span className="text-gradient">Control</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {[
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ),
                title: 'Enterprise-grade encryption',
                description: 'All your documents are encrypted at rest and in transit'
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                ),
                title: 'Never train on your data',
                description: 'We never use your content to train AI models'
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'You own your content',
                description: 'Your work stays yours—completely and forever'
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                ),
                title: 'GDPR compliant',
                description: 'Full data portability and transparency'
              }
            ].map((item, index) => (
              <div key={index} className="glass shadow-premium hover-lift transition-all duration-300 rounded-xl p-6 border border-white/20 dark:border-gray-700/50 flex gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-success-600 to-success-700 flex items-center justify-center flex-shrink-0 text-white shadow-lg">
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">{item.title}</h4>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <Alert className="glass border-primary-600/30 bg-primary-600/5">
            <AlertTitle className="text-lg font-bold">Your documents stay private. Your work stays yours.</AlertTitle>
          </Alert>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-8 bg-gradient-to-br from-primary-600 to-primary-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready For AI-Optimized Knowledge Work?
          </h2>
          <p className="text-xl mb-8 opacity-95">
            Try Centrid free for 7 days. No credit card required.<br />
            Upload your documents once. Persistent context across chats.<br />
            Focus on knowledge work, not context management.
          </p>

          <Button size="lg" variant="secondary" className="shadow-premium-lg hover-lift transition-all duration-300 bg-white text-primary-600 hover:bg-gray-50">
            Get Started Now
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Button>

          <div className="flex items-center justify-center gap-8 mt-8 text-sm opacity-90">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Setup in 60 seconds</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Your data stays private</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-8 bg-gray-900 text-gray-400 text-center border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center gap-6 mb-4 text-sm">
            <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Terms of Service</a>
          </div>
          <p className="text-sm">&copy; 2025 Centrid. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
