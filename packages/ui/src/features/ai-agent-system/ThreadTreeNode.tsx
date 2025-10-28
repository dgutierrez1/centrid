import React from 'react';
import { cn } from '@centrid/shared/utils';

export interface ThreadNode {
  id: string;
  title: string;
  artifactCount: number;
  lastActivity?: Date;
  isActive?: boolean;
  parentId?: string | null;
  depth?: number;
  children?: ThreadNode[];
}

export interface ThreadTreeNodeProps {
  /** Flat list of threads or nested tree structure */
  threads: ThreadNode[];
  /** Variant: 'icon' for navigation (WorkspaceSidebar), 'checkbox' for selection (ConsolidateModal) */
  variant: 'icon' | 'checkbox';
  /** Expanded thread IDs */
  expandedThreads: Set<string>;
  /** Selected thread IDs (checkbox variant only) */
  selectedThreads?: Set<string>;
  /** Click handler (icon variant - navigates to thread) */
  onThreadClick?: (threadId: string) => void;
  /** Checkbox toggle handler (checkbox variant) */
  onCheckboxToggle?: (threadId: string) => void;
  /** Expand/collapse toggle handler */
  onToggleExpanded: (threadId: string) => void;
  /** Current depth level (for recursion) */
  depth?: number;
  className?: string;
}

// Icon component for thread type (DAG nodes) - icon variant only
function ThreadIcon({ depth, hasChildren }: { depth: number; hasChildren: boolean }) {
  // Root/Branch nodes - circular node icon representing DAG branch points
  if (hasChildren) {
    return (
      <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8" strokeWidth="2" stroke="currentColor" fill="none" />
        <circle cx="12" cy="12" r="3" fill="currentColor" />
      </svg>
    );
  }

  // Leaf nodes - simple leaf icon representing terminal nodes in DAG
  return (
    <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 3c-1.5 4-4 6-7 7 3 1 5.5 3 7 7 1.5-4 4-6 7-7-3-1-5.5-3-7-7z"
      />
    </svg>
  );
}

/**
 * ThreadTreeNode - Unified recursive tree component
 *
 * Used by:
 * - WorkspaceSidebar (variant='icon') - Thread navigation with DAG icons
 * - ConsolidateModal (variant='checkbox') - Multi-thread selection with checkboxes
 *
 * Features:
 * - Recursive tree structure with connecting lines
 * - Expand/collapse functionality
 * - Two interaction modes: navigation or multi-selection
 * - Consistent tree line positioning across all uses
 */
export function ThreadTreeNode({
  threads,
  variant,
  expandedThreads,
  selectedThreads = new Set(),
  onThreadClick,
  onCheckboxToggle,
  onToggleExpanded,
  depth = 0,
  className = '',
}: ThreadTreeNodeProps) {
  return (
    <>
      {threads.map((thread, index) => {
        const hasChildren = thread.children && thread.children.length > 0;
        const isExpanded = expandedThreads.has(thread.id);
        const isSelected = selectedThreads.has(thread.id);
        const paddingLeft = depth * 20; // 20px per depth level for graph spacing
        const isLastChild = index === threads.length - 1;

        return (
          <div key={thread.id} className={cn('relative', className)}>
            {/* Tree lines - Graph style - Higher z-index to stay visible */}
            {depth > 0 && (
              <>
                {/* Vertical line from parent - extends to connect with horizontal line */}
                <div
                  className="absolute w-px bg-gray-300 dark:bg-gray-600 z-20 pointer-events-none"
                  style={{
                    left: `${16 + (depth - 1) * 20 + 8}px`, // parent paddingLeft + icon half-width (8px)
                    top: '-23px', // Start from parent's icon center (negative to go up into parent)
                    height: isLastChild ? '48px' : 'calc(100% + 23px)', // extend to horizontal line
                  }}
                />
                {/* Horizontal line - shortened to not overlap with node icon */}
                <div
                  className="absolute h-px bg-gray-300 dark:bg-gray-600 z-20 pointer-events-none"
                  style={{
                    left: `${16 + (depth - 1) * 20 + 8}px`, // from parent icon center
                    top: '25px', // Align with icon center
                    width: `${12}px`, // shortened to 12px to stop before node icon (8px radius)
                  }}
                />
              </>
            )}

            <div
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors group relative z-10',
                variant === 'icon' && 'cursor-pointer',
                variant === 'icon' && thread.isActive
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 shadow-sm'
                  : variant === 'icon'
                    ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
                    : 'text-gray-700 dark:text-gray-300'
              )}
              style={{ paddingLeft: `${16 + paddingLeft}px` }}
              onClick={() => {
                if (variant === 'icon') {
                  if (hasChildren) {
                    onToggleExpanded(thread.id);
                  }
                  onThreadClick?.(thread.id);
                }
              }}
            >
              {/* Checkbox variant: Expand/collapse chevron + checkbox */}
              {variant === 'checkbox' && (
                <>
                  {/* Collapse/expand toggle */}
                  {hasChildren ? (
                    <button
                      onClick={() => onToggleExpanded(thread.id)}
                      className="shrink-0 w-4 h-4 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      <svg
                        className={cn('w-3 h-3 transition-transform', isExpanded && 'rotate-90')}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ) : (
                    <div className="w-4" /> // Spacer for alignment
                  )}

                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onCheckboxToggle?.(thread.id)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded shrink-0"
                  />
                </>
              )}

              {/* Icon variant: DAG node icon */}
              {variant === 'icon' && (
                <div className="flex-shrink-0">
                  <ThreadIcon depth={depth} hasChildren={hasChildren} />
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{thread.title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {thread.artifactCount} artifact{thread.artifactCount !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {/* Children */}
            {hasChildren && isExpanded && (
              <div className="mt-0.5">
                <ThreadTreeNode
                  threads={thread.children!}
                  variant={variant}
                  expandedThreads={expandedThreads}
                  selectedThreads={selectedThreads}
                  onThreadClick={onThreadClick}
                  onCheckboxToggle={onCheckboxToggle}
                  onToggleExpanded={onToggleExpanded}
                  depth={depth + 1}
                />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
