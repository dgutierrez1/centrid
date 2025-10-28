import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/dropdown-menu';
import { Badge } from '../../components/badge';

export interface Branch {
  id: string;
  title: string;
  parentId: string | null;
  depth: number;
  artifactCount: number;
  lastActivity: Date;
  summary?: string;
}

export interface BranchSelectorProps {
  /** Current active branch */
  currentBranch?: Branch;
  /** All branches in hierarchical order */
  branches: Branch[];
  /** Display mode: 'dropdown' for navigation, 'list' for checkbox selection */
  mode?: 'dropdown' | 'list';
  /** Selected branch IDs (for list mode with checkboxes) */
  selectedBranchIds?: string[];
  /** Collapsed branch IDs (for list mode) */
  collapsedBranchIds?: Set<string>;
  /** Branch selection handler (dropdown mode) */
  onSelectBranch?: (branchId: string) => void;
  /** Checkbox toggle handler (list mode) */
  onToggleCheckbox?: (branchId: string) => void;
  /** Collapse toggle handler (list mode) */
  onToggleCollapse?: (branchId: string) => void;
  className?: string;
}

export function BranchSelector({
  currentBranch,
  branches,
  mode = 'dropdown',
  selectedBranchIds = [],
  collapsedBranchIds = new Set(),
  onSelectBranch,
  onToggleCheckbox,
  onToggleCollapse,
  className = '',
}: BranchSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Filter branches based on collapsed state (list mode only)
  const visibleBranches = mode === 'list'
    ? branches.filter((branch) => {
        if (branch.depth === 0) return true;
        // Check if any ancestor is collapsed
        let checkBranch = branch;
        while (checkBranch.parentId) {
          if (collapsedBranchIds.has(checkBranch.parentId)) return false;
          checkBranch = branches.find(b => b.id === checkBranch.parentId)!;
          if (!checkBranch) break;
        }
        return true;
      })
    : branches;

  // List mode (for ConsolidateModal)
  if (mode === 'list') {
    return (
      <div className={className}>
        {visibleBranches.map((branch, index) => {
          const isSelected = selectedBranchIds.includes(branch.id);
          const isCollapsed = collapsedBranchIds.has(branch.id);
          const hasChildren = branches.some(b => b.parentId === branch.id);
          const indentPx = branch.depth * 24;
          const nextBranch = visibleBranches[index + 1];
          const isLastChild = !nextBranch || nextBranch.depth <= branch.depth || nextBranch.parentId !== branch.parentId;

          return (
            <div
              key={branch.id}
              className="relative flex items-center gap-2 py-2"
              style={{ paddingLeft: `${16 + indentPx}px` }}
            >
              {/* Tree lines */}
              {branch.depth > 0 && (
                <>
                  <div
                    className="absolute top-1/2 h-px bg-gray-300 dark:bg-gray-600"
                    style={{
                      left: `${16 + (branch.depth - 1) * 24 + 8}px`,
                      width: '12px',
                    }}
                  />
                  <div
                    className="absolute bg-gray-300 dark:bg-gray-600 w-px"
                    style={{
                      left: `${16 + (branch.depth - 1) * 24 + 8}px`,
                      top: isLastChild ? '0' : '0',
                      bottom: isLastChild ? '50%' : '0',
                    }}
                  />
                  <div
                    className="absolute w-2 h-2 rounded-full border-2 border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-800"
                    style={{
                      left: `${16 + (branch.depth - 1) * 24 + 4}px`,
                      top: 'calc(50% - 4px)',
                    }}
                  />
                </>
              )}

              {/* Collapse/expand toggle */}
              {hasChildren ? (
                <button
                  onClick={() => onToggleCollapse?.(branch.id)}
                  className="shrink-0 w-4 h-4 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <svg
                    className={`w-3 h-3 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <div className="w-4" />
              )}

              {/* Checkbox */}
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleCheckbox?.(branch.id)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded shrink-0"
              />

              {/* Branch info */}
              <div className="flex items-center justify-between gap-3 flex-1 min-w-0">
                <span className="font-medium text-gray-900 dark:text-gray-100">{branch.title}</span>
                <Badge variant="secondary">{branch.artifactCount} artifacts</Badge>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Dropdown mode (original behavior)
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger
        className={`flex items-center justify-between gap-2 min-w-[200px] h-10 px-4 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${className}`}
        data-testid="branch-selector-trigger"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <svg className="w-4 h-4 shrink-0 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7h12M8 12h12m-12 5h12m-12-5H4m0 5H4m0-5H4m4-5H4"
            />
          </svg>
          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {currentBranch.title}
          </span>
          {branches.length > 1 && (
            <Badge variant="secondary" className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs shrink-0">
              {branches.length}
            </Badge>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-[300px] max-h-[400px] overflow-y-auto" data-testid="branch-selector-dropdown">
        {branches.map((branch, index) => {
          const isCurrentBranch = branch.id === currentBranch.id;
          const indentPx = branch.depth * 24;

          // Check if this is the last child of its parent
          const nextBranch = branches[index + 1];
          const isLastChild = !nextBranch || nextBranch.depth <= branch.depth || nextBranch.parentId !== branch.parentId;

          return (
            <DropdownMenuItem
              key={branch.id}
              className={`relative flex items-start justify-between gap-3 py-2 cursor-pointer ${
                isCurrentBranch ? 'bg-primary-50 dark:bg-primary-900/20' : ''
              }`}
              style={{ paddingLeft: `${16 + indentPx}px` }}
              onClick={() => {
                if (!isCurrentBranch) {
                  onSelectBranch(branch.id);
                  setIsOpen(false);
                }
              }}
              data-testid={`branch-item-${branch.id}`}
            >
              {/* Tree lines */}
              {branch.depth > 0 && (
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
              )}
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${isCurrentBranch ? 'text-primary-700 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>
                    {branch.title}
                  </span>
                  {isCurrentBranch && (
                    <Badge variant="default" className="bg-primary-600 text-white text-xs">
                      Current
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>{branch.artifactCount} artifacts</span>
                  <span>•</span>
                  <span>
                    {branch.lastActivity.toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {branch.summary && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    {branch.summary}
                  </p>
                )}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
