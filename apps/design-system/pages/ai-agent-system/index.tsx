import React from 'react';
import Link from 'next/link';
import { DesignSystemFrame } from '../../components/DesignSystemFrame';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@centrid/ui/components';

export default function AiAgentSystemIndex() {
  const screens = [
    {
      name: 'Chat Interface',
      route: '/ai-agent-system/chat-interface',
      description: 'Primary conversation UI with message streaming, context panel, and tool approval',
    },
    {
      name: 'Context Panel',
      route: '/ai-agent-system/context-panel',
      description: 'Collapsible context sections showing what the AI sees (explicit, semantic, branch, artifacts)',
    },
    {
      name: 'Branch Selector',
      route: '/ai-agent-system/branch-selector',
      description: 'Hierarchical dropdown for navigating between branches with indentation',
    },
    {
      name: 'Workspace View',
      route: '/ai-agent-system/workspace',
      description: 'Full 3-panel adaptive workspace (sidebar, thread, file editor)',
    },
    {
      name: 'File Editor',
      route: '/ai-agent-system/file-editor',
      description: 'Right panel file editor with provenance header',
    },
    {
      name: 'Components',
      route: '/ai-agent-system/components',
      description: 'Individual component showcase (Message, ThreadInput, ToolCallApproval, ContextReference)',
    },
  ];

  return (
    <DesignSystemFrame title="AI Agent System">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            AI-Powered Exploration Workspace
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
            An exploration workspace where users branch threads to explore multiple approaches in parallel,
            capture findings as persistent files with provenance, and consolidate insights from the entire
            exploration tree.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {screens.map((screen) => (
            <Link key={screen.route} href={screen.route}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-xl">{screen.name}</CardTitle>
                  <CardDescription>{screen.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-primary-600 dark:text-primary-400 font-medium flex items-center gap-2">
                    View Design
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Design Status
          </h3>
          <p className="text-blue-800 dark:text-blue-200">
            All components follow the UX specification from{' '}
            <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded text-sm">
              specs/004-ai-agent-system/ux.md
            </code>
            . Components are pure presentational (data-in/callbacks-out) and located in{' '}
            <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded text-sm">
              packages/ui/src/features/ai-agent-system/
            </code>
            .
          </p>
        </div>
      </div>
    </DesignSystemFrame>
  );
}
