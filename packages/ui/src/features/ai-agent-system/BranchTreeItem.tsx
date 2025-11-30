import React from 'react';
import { Badge } from '../../components/badge';
import { cn } from '../../lib/utils';

export interface BranchTreeNode {
  id: string;
  title: string;
  parentThreadId: string | null;
  depth: number;
  artifactCount: number;
  lastActivity?: string;
  summary?: string;
  children?: BranchTreeNode[];
}

export interface BranchTreeItemProps {
  /** Branch node data */
  branch: BranchTreeNode;
  /** Tree index (for calculating if this is the last child) */
  index: number;
  /** Next branch in flat list (for determining if this is last child) */
  nextBranch?: BranchTreeNode;
  /** Variant: 'selector' for navigation dropdown, 'checkbox' for multi-select */
  variant: 'selector' | 'checkbox';
  /** Whether this branch is currently selected/active */
  isActive?: boolean;
  /** Whether this branch is checked (checkbox variant only) */
  isChecked?: boolean;
  /** Whether this node is collapsed (checkbox variant only) */
  isCollapsed?: boolean;
  /** Click handler (selector variant - selects branch) */
  onClick?: () => void;
  /** Checkbox change handler (checkbox variant) */
  onCheckboxChange?: () => void;
  /** Collapse toggle handler (checkbox variant) */
  onToggleCollapse?: () => void;
  className?: string;
}

/**
 * BranchTreeItem - Reusable tree node with connecting lines
 *
 * Used by:
 * - BranchSelector (variant='selector') - for branch navigation dropdown
 * - ConsolidateModal (variant='checkbox') - for multi-branch selection
 *
 * Features:
 * - Tree visualization with connecting lines
 * - Depth-based indentation
 * - Two interaction modes: click-to-select or checkbox selection
 * - Collapsible nodes (checkbox variant)
 */
export function BranchTreeItem({
  branch,
  index,
  nextBranch,
  variant,
  isActive = false,
  isChecked = false,
  isCollapsed = false,
  onClick,
  onCheckboxChange,
  onToggleCollapse,
  className = '',
}: BranchTreeItemProps) {
  const indentPx = branch.depth * 24;
  const hasChildren = branch.children && branch.children.length > 0;

  // Check if this is the last child of its parent
  const isLastChild =
    !nextBranch || nextBranch.depth <= branch.depth || nextBranch.parentThreadId !== branch.parentThreadId;

  // Common tree line styles
  const TreeLines = () =>
    branch.depth > 0 ? (
      <>
        {/* Horizontal line connecting to parent */}
        <div
          className="absolute top-1/2 h-px bg-gray-300 dark:bg-gray-600"
          style={{
            left: `${16 + (branch.depth - 1) * 24 + 8}px`,
            width: '12px',
          }}
        />
        {/* Vertical line */}
        <div
          className="absolute bg-gray-300 dark:bg-gray-600 w-px"
          style={{
            left: `${16 + (branch.depth - 1) * 24 + 8}px`,
            top: isLastChild ? '0' : '0',
            bottom: isLastChild ? '50%' : '0',
          }}
        />
        {/* Icon for leaf node */}
        <div
          className="absolute w-2 h-2 rounded-full border-2 border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-800"
          style={{
            left: `${16 + (branch.depth - 1) * 24 + 4}px`,
            top: 'calc(50% - 4px)',
          }}
        />
      </>
    ) : null;

  // Selector variant (BranchSelector usage)
  if (variant === 'selector') {
    return (
      <div
        className={cn(
          'relative flex items-start justify-between gap-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
          isActive && 'bg-primary-50 dark:bg-primary-900/20',
          className
        )}
        style={{ paddingLeft: `${16 + indentPx}px` }}
        onClick={onClick}
        data-testid={`branch-item-${branch.id}`}
      >
        <TreeLines />
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-sm font-medium',
                isActive
                  ? 'text-primary-700 dark:text-primary-400'
                  : 'text-gray-900 dark:text-white'
              )}
            >
              {branch.title}
            </span>
            {isActive && (
              <Badge variant="default" className="bg-primary-600 text-white text-xs">
                Current
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>{branch.artifactCount} artifacts</span>
            {branch.lastActivity && (
              <>
                <span>•</span>
                <span>
                  {new Date(branch.lastActivity).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </>
            )}
          </div>
          {branch.summary && (
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
              {branch.summary}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Checkbox variant (ConsolidateModal usage)
  return (
    <div
      className={cn('relative flex items-center gap-2 py-2', className)}
      style={{ paddingLeft: `${16 + indentPx}px` }}
    >
      <TreeLines />

      {/* Collapse/expand toggle */}
      {hasChildren ? (
        <button
          onClick={onToggleCollapse}
          className="shrink-0 w-4 h-4 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          aria-label={isCollapsed ? 'Expand' : 'Collapse'}
        >
          <svg
            className={cn('w-3 h-3 transition-transform', isCollapsed ? '' : 'rotate-90')}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      ) : (
        <div className="w-4" /> // Spacer for alignment when no collapse button
      )}

      {/* Checkbox */}
      <input
        type="checkbox"
        checked={isChecked}
        onChange={onCheckboxChange}
        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded shrink-0"
      />

      {/* Branch info */}
      <div className="flex items-center justify-between gap-3 flex-1 min-w-0">
        <span className="font-medium text-gray-900 dark:text-gray-100">{branch.title}</span>
        <Badge variant="secondary">{branch.artifactCount} artifacts</Badge>
      </div>
    </div>
  );
}
