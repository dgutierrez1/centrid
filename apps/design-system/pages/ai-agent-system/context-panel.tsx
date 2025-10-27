import React, { useState } from 'react';
import { DesignSystemFrame } from '../../components/DesignSystemFrame';
import { ContextPanel } from '@centrid/ui/features';

const mockExplicitContext = [
  {
    id: 'file-1',
    type: 'file' as const,
    title: 'product-requirements.md',
    path: '/workspace/product-requirements.md',
    relevanceScore: 1.0,
    excerpt: 'Core features: user authentication, file upload, real-time collaboration...',
  },
  {
    id: 'conv-1',
    type: 'conversation' as const,
    title: 'Authentication Discussion',
    path: '/chat/conv-1',
    relevanceScore: 1.0,
    excerpt: 'User: How should we handle OAuth? Agent: I recommend using Supabase Auth...',
  },
];

const mockSemanticMatches = [
  {
    id: 'file-2',
    type: 'file' as const,
    title: 'database-schema.sql',
    path: '/workspace/db/schema.sql',
    relevanceScore: 0.87,
    excerpt: 'CREATE TABLE users (id UUID PRIMARY KEY, email TEXT NOT NULL...',
    branchName: 'Backend Setup',
  },
  {
    id: 'file-3',
    type: 'file' as const,
    title: 'api-design.md',
    path: '/workspace/api-design.md',
    relevanceScore: 0.82,
    excerpt: 'REST endpoints: GET /users, POST /auth/login, PUT /profile...',
    branchName: 'API Planning',
  },
];

const mockBranchContext = [
  {
    id: 'summary-1',
    type: 'summary' as const,
    title: 'Parent Branch: Feature Planning',
    content: 'Discussed project scope, tech stack decisions (Next.js, Supabase, TypeScript). Decided on MVP features and timeline.',
    relevanceScore: 0.9,
  },
];

const mockArtifacts = [
  {
    id: 'artifact-1',
    type: 'file' as const,
    title: 'user-flow-diagram.md',
    path: '/workspace/user-flow-diagram.md',
    relevanceScore: 0.95,
    excerpt: 'Login → Dashboard → Upload File → Real-time Collaboration',
  },
];

const mockExcludedContext = [
  {
    id: 'file-4',
    type: 'file' as const,
    title: 'old-notes.md',
    path: '/workspace/archive/old-notes.md',
    relevanceScore: 0.45,
    excerpt: 'Initial brainstorming notes from early project phase...',
    reason: 'Low relevance score (0.45)',
  },
];

export default function ContextPanelPage() {
  const [expandedSections, setExpandedSections] = useState<string[]>(['explicit', 'semantic']);

  const handleToggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]
    );
  };

  return (
    <DesignSystemFrame title="AI Agent System - Context Panel">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Context Panel</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            Shows what context the AI sees, organized by priority tier. Sections collapse/expand as
            units, with widgets displayed horizontally.
          </p>
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setExpandedSections(['explicit', 'semantic', 'branch'])}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Expand All
            </button>
            <button
              onClick={() => setExpandedSections([])}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Collapse All
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <ContextPanel
            explicitContext={mockExplicitContext}
            frequentlyUsed={[]}
            semanticMatches={mockSemanticMatches}
            branchContext={mockBranchContext}
            artifacts={mockArtifacts}
            excludedContext={mockExcludedContext}
            expandedSections={expandedSections}
            onToggleSection={handleToggleSection}
          />
        </div>

        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Design Notes
          </h3>
          <ul className="list-disc list-inside text-blue-800 dark:text-blue-200 space-y-2">
            <li>Sections collapse/expand as units (not individual items)</li>
            <li>Collapsed: Compact inline widgets with tooltips</li>
            <li>Expanded: Detailed horizontal cards with action buttons</li>
            <li>Priority tier colors on left border (coral, blue, purple, orange, green, gray)</li>
            <li>Positioned below messages, above input (upward expansion)</li>
          </ul>
        </div>
      </div>
    </DesignSystemFrame>
  );
}
