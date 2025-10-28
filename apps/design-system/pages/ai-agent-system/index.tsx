import React, { useState } from 'react';
import Link from 'next/link';
import { DesignSystemFrame } from '../../components/DesignSystemFrame';
import { Card } from '@centrid/ui/components';
import { AiAgentSystemMock } from '../../components/AiAgentSystemMock';

type Viewport = 'desktop' | 'mobile';

export default function AiAgentSystemIndex() {
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [showFileEditor, setShowFileEditor] = useState(true);

  const viewportSizes = {
    desktop: { width: '1440px', height: '900px' },
    mobile: { width: '375px', height: '812px' },
  };

  return (
    <DesignSystemFrame
      title="AI Agent System"
      featureId="ai-agent-system"
    >
      <div className="h-screen overflow-y-auto">
        {/* Header */}
        <div className="pt-6 pb-4 px-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            AI-Powered Exploration Workspace
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400 max-w-3xl mb-4">
            An exploration workspace where users branch threads to explore multiple approaches in parallel,
            capture findings as persistent files with provenance, and consolidate insights from the entire
            exploration tree.
          </p>

          {/* Controls */}
          <div className="flex flex-wrap gap-4 mb-4">
            {/* Viewport Selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewport('desktop')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  viewport === 'desktop'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Desktop (1440×900)
              </button>
              <button
                onClick={() => setViewport('mobile')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  viewport === 'mobile'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Mobile (375×812)
              </button>
            </div>

            {/* File Editor Toggle */}
            <div className="flex gap-2 items-center border-l border-gray-300 dark:border-gray-600 pl-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                File Editor:
              </label>
              <button
                onClick={() => setShowFileEditor(!showFileEditor)}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  showFileEditor
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {showFileEditor ? 'Open (3-panel)' : 'Closed (2-panel)'}
              </button>
            </div>
          </div>
        </div>

        {/* Workspace Preview */}
        <div className="mb-6">
          <div className="mb-3 px-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                Workspace
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Adaptive 3-panel workspace (sidebar, thread, file editor)
              </p>
            </div>
            <Link
              href="/ai-agent-system/workspace"
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium flex items-center gap-1"
            >
              Full Page
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </Link>
          </div>

          {/* Screen Preview - Full width container with more height */}
          <div
            className="bg-white dark:bg-gray-800 overflow-auto border border-gray-200 dark:border-gray-700 transition-all duration-300 w-full"
            style={{
              height: viewport === 'desktop' ? '1200px' : '900px',
            }}
          >
            <AiAgentSystemMock showFileEditor={showFileEditor} />
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 px-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Design Resources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
            <Link href="/ai-agent-system/workspace">
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer p-6">
                <h3 className="text-xl font-semibold mb-2">Full Workspace</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Complete 3-panel adaptive workspace (the actual screen design)
                </p>
              </Card>
            </Link>
            <Link href="/ai-agent-system/components">
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer p-6">
                <h3 className="text-xl font-semibold mb-2">Component Library</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  All components with states (Message, ThreadInput, ContextPanel, etc.)
                </p>
              </Card>
            </Link>
          </div>
        </div>

        {/* Design Status */}
        <div className="mt-6 mx-4 mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
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
