import React from 'react';
import { DesignSystemFrame } from '../../components/DesignSystemFrame';
import { VisualTreeView } from '@centrid/ui/features';
import { mockTreeNodes } from '../../components/ai-agent-system/mockData';

export default function TreeViewPage() {
  return (
    <DesignSystemFrame
      title="Visual Tree View (Phase 3)"
      description="Interactive branch tree visualization"
      backHref="/ai-agent-system"
    >
      <div className="space-y-6">
        {/* Description */}
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-600 dark:text-gray-400">
            The Visual Tree View provides a graph visualization of the entire branch hierarchy,
            showing parent-child relationships, artifact counts, and active branch highlighting.
            This is a Phase 3 feature for advanced users who want to visualize complex branching
            structures.
          </p>
          <p className="text-sm text-warning-600 dark:text-warning-400 mt-2">
            <strong>Note:</strong> This is a Phase 3 feature (deferred post-MVP). Current
            implementation uses simple SVG layout. Production would use React Flow or D3.js for
            advanced interactions (zoom, pan, minimap).
          </p>
        </div>

        {/* Tree View */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden h-[600px]">
          <VisualTreeView
            nodes={mockTreeNodes}
            onNodeClick={(id) => console.log('Selected node:', id)}
            onNodeDoubleClick={(id) => alert(`Navigate to branch: ${id}`)}
            width={1200}
            height={600}
            data-testid="tree-view"
          />
        </div>

        {/* Interactions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Interactions</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Click Node</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Single click to select and highlight node
              </p>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Double Click Node
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Double click to navigate to that branch
              </p>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Visual Encoding</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Active branch has thick border, agent-created branches show sparkle icon
              </p>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Metadata Display</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Each node shows artifact count, last activity timestamp
              </p>
            </div>
          </div>
        </div>

        {/* Phase 3 Enhancements */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Phase 3 Enhancements (Future)
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Zoom & Pan</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Zoom in/out, pan around large tree structures
              </p>
            </div>
            <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Minimap</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Small overview map for navigation in large trees
              </p>
            </div>
            <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Filtering</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Filter by date range, artifact count, creator
              </p>
            </div>
            <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Branch Merging</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Drag-and-drop to consolidate branches visually
              </p>
            </div>
          </div>
        </div>
      </div>
    </DesignSystemFrame>
  );
}
