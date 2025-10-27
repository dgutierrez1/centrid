import React from 'react';
import { DesignSystemFrame } from '../../components/DesignSystemFrame';
import { BranchSelector } from '@centrid/ui/features';
import { mockBranches } from '../../components/ai-agent-system/mockData';

export default function BranchSelectorPage() {
  const currentBranch = mockBranches.find((b) => b.isActive)!;

  return (
    <DesignSystemFrame
      title="Branch Selector"
      description="Hierarchical tree dropdown for branch navigation"
      backHref="/ai-agent-system"
    >
      <div className="space-y-6">
        {/* Description */}
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-600 dark:text-gray-400">
            The Branch Selector provides hierarchical navigation between conversation threads. It
            organizes branches by relationship (parent, siblings, children, other) and displays
            metadata (artifact count, child count, last activity).
          </p>
        </div>

        {/* Interactive Demo */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-8 bg-white dark:bg-gray-900">
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Click to open branch selector:
            </label>
            <BranchSelector
              currentBranch={currentBranch}
              branches={mockBranches}
              onSelectBranch={(id) => alert(`Selected branch: ${id}`)}
              onCreateBranch={() => alert('Create new branch')}
              data-testid="branch-selector"
            />
          </div>
        </div>

        {/* Features */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Features</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Relationship Grouping
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Branches organized by: Current → Parent → Siblings → Children → Other
              </p>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Rich Metadata</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Shows artifact count, child count, and indentation for hierarchy
              </p>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Create New Branch
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Quick action at bottom of dropdown to branch from current conversation
              </p>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Visual Indicators
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Active branch highlighted, icons for branch structure, badges for counts
              </p>
            </div>
          </div>
        </div>
      </div>
    </DesignSystemFrame>
  );
}
