import React from 'react';
import { cn } from '../../lib/utils';
import { GitBranch, MoreVertical } from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@centrid/ui/components';

export interface ThreadNode {
  id: string;
  title: string;
  artifactCount: number;
  lastActivity?: Date;
  isActive?: boolean;
  parentThreadId?: string | null;
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
  /** Create branch handler (icon variant) */
  onCreateBranch?: (parentThreadId: string, parentTitle: string) => void;
  /** Rename handler (icon variant) */
  onRename?: (threadId: string, currentTitle: string) => void;
  /** Delete handler (icon variant) */
  onDelete?: (threadId: string, title: string) => void;
  /** Current depth level (for recursion) */
  depth?: number;
  className?: string;
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
  onCreateBranch,
  onRename,
  onDelete,
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
                variant === 'icon' && thread.isActive
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
              )}
              style={{ paddingLeft: `${16 + paddingLeft}px` }}
            >
              {/* 1. Chevron - Expand/Collapse (only if has children) */}
              {hasChildren && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleExpanded(thread.id);
                  }}
                  className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
              )}
              {!hasChildren && <div className="w-4" />}

              {/* 2. Checkbox (checkbox variant only) */}
              {variant === 'checkbox' && (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onCheckboxToggle?.(thread.id)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded shrink-0"
                />
              )}

              {/* 5. Thread Content - Clickable area */}
              <div
                onClick={() => {
                  if (variant === 'icon') {
                    onThreadClick?.(thread.id);
                  }
                }}
                className={cn('flex-1 min-w-0', variant === 'icon' && 'cursor-pointer')}
              >
                <div className="font-medium truncate">{thread.title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {thread.artifactCount} artifact{thread.artifactCount !== 1 ? 's' : ''}
                </div>
              </div>

              {/* 5. Branch Icon - Always visible (icon variant only) */}
              {variant === 'icon' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateBranch?.(thread.id, thread.title);
                  }}
                  className="flex-shrink-0 text-gray-400 hover:text-primary-600 dark:hover:text-primary-500 transition-colors"
                  title="Create branch"
                >
                  <GitBranch className="w-4 h-4 rotate-90" />
                </button>
              )}

              {/* 6. Three-dot Menu - Hover-visible (icon variant only) */}
              {variant === 'icon' && (onRename || onDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onRename && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onRename(thread.id, thread.title);
                        }}
                      >
                        Rename
                      </DropdownMenuItem>
                    )}
                    {onRename && onDelete && <DropdownMenuSeparator />}
                    {onDelete && (
                      <DropdownMenuItem
                        className="text-error-600 focus:text-error-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(thread.id, thread.title);
                        }}
                      >
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
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
                  onCreateBranch={onCreateBranch}
                  onRename={onRename}
                  onDelete={onDelete}
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
