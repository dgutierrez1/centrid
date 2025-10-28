import { Button } from '../../components/button';
import { cn } from '@centrid/shared/utils';

export interface BranchActionsProps {
  currentBranch?: {
    id: string;
    title: string;
    hasChildren: boolean;
  };
  hasChildren?: boolean;
  onCreateBranch: () => void;
  onConsolidate: () => void;
  onOpenTreeView?: () => void;
  className?: string;
}

/**
 * BranchActions - Header action buttons for branch operations
 *
 * Features:
 * - Create Branch button (always visible)
 * - Consolidate button (only enabled if branch has children)
 * - Tree View button (optional, Phase 3)
 *
 * UX Spec: ux.md lines 854-865
 */
export function BranchActions({
  currentBranch,
  hasChildren = false,
  onCreateBranch,
  onConsolidate,
  onOpenTreeView,
  className,
}: BranchActionsProps) {
  const branchHasChildren = currentBranch?.hasChildren ?? hasChildren;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Create Branch - Always visible */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onCreateBranch}
        className="gap-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        aria-label="Create new branch"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
          />
        </svg>
        <span className="text-sm">Branch</span>
      </Button>

      {/* Consolidate - Only enabled if branch has children */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onConsolidate}
        disabled={!branchHasChildren}
        className="gap-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-40"
        aria-label="Consolidate from child branches"
        title={
          branchHasChildren
            ? 'Consolidate artifacts from child branches'
            : 'No child branches to consolidate'
        }
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
          />
        </svg>
        <span className="text-sm">Consolidate</span>
      </Button>

      {/* Tree View - Optional, Phase 3 */}
      {onOpenTreeView && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenTreeView}
          className="gap-2"
          aria-label="Open tree view"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
          <span className="hidden md:inline">Tree View</span>
        </Button>
      )}
    </div>
  );
}
