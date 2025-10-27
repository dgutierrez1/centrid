import React from 'react';
import { DesignSystemFrame } from '../../components/DesignSystemFrame';
import { ContextPanel } from '@centrid/ui/features';
import {
  mockExplicitContext,
  mockFrequentlyUsed,
  mockSemanticMatches,
  mockBranchContext,
  mockArtifacts,
  mockExcludedContext,
} from '../../components/ai-agent-system/mockData';

export default function ContextPanelPage() {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <DesignSystemFrame
      title="Context Panel"
      description="6-section context manager with priority indicators"
      backHref="/ai-agent-system"
    >
      <div className="space-y-6">
        {/* Description */}
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-600 dark:text-gray-400">
            The Context Panel displays all context included in the agent's request, organized by
            priority tier. It shows explicit (@-mentioned), frequently used (learned), semantic
            matches (cross-branch), branch context (inherited), artifacts (created files), and
            excluded items (didn't fit in budget).
          </p>
        </div>

        {/* Interactive Demo */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <ContextPanel
            explicitContext={mockExplicitContext}
            frequentlyUsed={mockFrequentlyUsed}
            semanticMatches={mockSemanticMatches}
            branchContext={mockBranchContext}
            artifacts={mockArtifacts}
            excludedContext={mockExcludedContext}
            collapsed={collapsed}
            onCollapsedChange={setCollapsed}
            onItemClick={(item) => console.log('Clicked:', item.label)}
            onItemRemove={(item) => console.log('Removed:', item.label)}
            onItemAdd={(item) => console.log('Added back:', item.label)}
            onHideBranch={(item) => console.log('Hide branch:', item.sourceBranch)}
            data-testid="context-panel"
          />
        </div>

        {/* Priority Tiers Explained */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Priority Tiers
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-1 h-12 bg-primary-500 rounded shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Tier 1: Explicit (1.0 weight)
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Files/threads explicitly @-mentioned by user
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1 h-12 bg-blue-500 rounded shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Tier 2: Frequently Used (0.8 weight)
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Learned from @-mention frequency (3+ times in 30 days)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1 h-12 bg-purple-500 rounded shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Tier 3: Semantic Matches (0.5 base + modifiers)
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Cross-branch discovery via shadow domain search
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1 h-12 bg-orange-500 rounded shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Tier 4: Branch Context (0.7 weight)
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Inherited from parent thread (summary + explicit files)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1 h-12 bg-green-500 rounded shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Tier 5: Artifacts
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Files created in current thread
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1 h-12 bg-gray-400 rounded shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Tier 6: Excluded</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Didn't fit in 200K token budget, can be manually re-added
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DesignSystemFrame>
  );
}
