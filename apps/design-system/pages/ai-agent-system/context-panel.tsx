import React, { useState } from 'react';
import { DesignSystemFrame } from '../../components/DesignSystemFrame';
import { ContextPanel, type ContextGroup } from '@centrid/ui/features';

export default function ContextPanelPage() {
  const [expandedSections, setExpandedSections] = useState<string[]>(['explicit', 'semantic']);

  const contextGroups: ContextGroup[] = [
    {
      type: 'explicit',
      title: 'Explicit Context (@-mentioned)',
      items: [
        {
          id: 'file-1',
          type: 'file',
          title: 'product-requirements.md',
          excerpt: 'Core features: user authentication, file upload, real-time collaboration...',
          priorityTier: 1,
        },
        {
          id: 'conv-1',
          type: 'conversation',
          title: 'Authentication Discussion',
          excerpt: 'User: How should we handle OAuth? Agent: I recommend using Supabase Auth...',
          priorityTier: 1,
        },
      ],
      isExpanded: expandedSections.includes('explicit'),
    },
    {
      type: 'frequently-used',
      title: 'Frequently Used',
      items: [],
      isExpanded: expandedSections.includes('frequently-used'),
      emptyMessage: 'No frequently used items yet',
    },
    {
      type: 'semantic',
      title: 'Semantic Matches',
      items: [
        {
          id: 'file-2',
          type: 'file',
          title: 'database-schema.sql',
          excerpt: 'CREATE TABLE users (id UUID PRIMARY KEY, email TEXT NOT NULL...',
          priorityTier: 3,
          relevanceScore: 0.87,
          branchName: 'Backend Setup',
        },
        {
          id: 'file-3',
          type: 'file',
          title: 'api-design.md',
          excerpt: 'REST endpoints: GET /users, POST /auth/login, PUT /profile...',
          priorityTier: 3,
          relevanceScore: 0.82,
          branchName: 'API Planning',
        },
      ],
      isExpanded: expandedSections.includes('semantic'),
    },
    {
      type: 'branch',
      title: 'Branch Context',
      items: [
        {
          id: 'summary-1',
          type: 'summary',
          title: 'Parent Branch: Feature Planning',
          excerpt: 'Discussed project scope, tech stack decisions (Next.js, Supabase, TypeScript). Decided on MVP features and timeline.',
          priorityTier: 4,
        },
      ],
      isExpanded: expandedSections.includes('branch'),
    },
    {
      type: 'artifacts',
      title: 'Artifacts from This Chat',
      items: [
        {
          id: 'artifact-1',
          type: 'file',
          title: 'user-flow-diagram.md',
          excerpt: 'Login → Dashboard → Upload File → Real-time Collaboration',
          priorityTier: 5,
        },
      ],
      isExpanded: expandedSections.includes('artifacts'),
    },
    {
      type: 'excluded',
      title: 'Excluded Context',
      items: [
        {
          id: 'file-4',
          type: 'file',
          title: 'old-notes.md',
          excerpt: 'Initial brainstorming notes from early project phase...',
          priorityTier: 6,
          relevanceScore: 0.45,
        },
      ],
      isExpanded: expandedSections.includes('excluded'),
    },
  ];

  const handleToggleSection = (sectionType: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionType) ? prev.filter((id) => id !== sectionType) : [...prev, sectionType]
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
            contextGroups={contextGroups}
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
