import React from 'react';
import { DesignSystemFrame } from '../../components/DesignSystemFrame';
import { BranchSelector, type Branch } from '@centrid/ui/features';

const mockBranches: Branch[] = [
  {
    id: 'main',
    title: 'Main Discussion',
    parentId: null,
    depth: 0,
    artifactCount: 3,
    lastActivity: new Date('2025-10-20T10:00:00Z'),
    summary: 'Initial project planning and architecture discussions',
  },
  {
    id: 'branch-1',
    title: 'Authentication Approach',
    parentId: 'main',
    depth: 1,
    artifactCount: 2,
    lastActivity: new Date('2025-10-21T14:30:00Z'),
    summary: 'Exploring different authentication strategies',
  },
  {
    id: 'branch-1-1',
    title: 'OAuth Implementation',
    parentId: 'branch-1',
    depth: 2,
    artifactCount: 1,
    lastActivity: new Date('2025-10-22T09:15:00Z'),
    summary: 'Implementing OAuth 2.0 with Supabase Auth',
  },
  {
    id: 'branch-2',
    title: 'Database Design',
    parentId: 'main',
    depth: 1,
    artifactCount: 4,
    lastActivity: new Date('2025-10-21T16:00:00Z'),
    summary: 'Database schema and migration strategy',
  },
  {
    id: 'branch-2-1',
    title: 'Schema Migrations',
    parentId: 'branch-2',
    depth: 2,
    artifactCount: 2,
    lastActivity: new Date('2025-10-23T11:00:00Z'),
  },
  {
    id: 'branch-2-2',
    title: 'RLS Policies',
    parentId: 'branch-2',
    depth: 2,
    artifactCount: 1,
    lastActivity: new Date('2025-10-23T13:30:00Z'),
  },
];

export default function BranchSelectorPage() {
  const [currentBranchId, setCurrentBranchId] = React.useState('branch-1-1');
  const currentBranch = mockBranches.find((b) => b.id === currentBranchId) || mockBranches[0];

  return (
    <DesignSystemFrame title="AI Agent System - Branch Selector">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Branch Selector
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            Hierarchical dropdown for navigating between conversation branches, showing
            parent-child relationships with metadata.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Branch Selector (Click to open dropdown)
            </label>
            <BranchSelector
              currentBranch={currentBranch}
              branches={mockBranches}
              onSelectBranch={setCurrentBranchId}
            />
          </div>

          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Current Branch Details
            </h3>
            <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
              {JSON.stringify(currentBranch, null, 2)}
            </pre>
          </div>
        </div>

        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Design Notes
          </h3>
          <ul className="list-disc list-inside text-blue-800 dark:text-blue-200 space-y-2">
            <li>Hierarchical tree with indentation showing parent-child relationships</li>
            <li>Metadata badges: message count, artifact count</li>
            <li>Current branch highlighted with coral background</li>
            <li>Chevron icons indicate expand/collapse state</li>
            <li>Desktop: Dropdown menu, Mobile: Full-screen modal</li>
          </ul>
        </div>
      </div>
    </DesignSystemFrame>
  );
}
