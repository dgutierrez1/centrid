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
  currentBranch: Branch;
  /** All branches in hierarchical order */
  branches: Branch[];
  /** Branch selection handler */
  onSelectBranch: (branchId: string) => void;
  className?: string;
}

export function BranchSelector({
  currentBranch,
  branches,
  onSelectBranch,
  className = '',
}: BranchSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);

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
        {branches.map((branch) => {
          const isCurrentBranch = branch.id === currentBranch.id;
          const indentPx = branch.depth * 16;

          return (
            <DropdownMenuItem
              key={branch.id}
              className={`flex items-start justify-between gap-3 py-2 cursor-pointer ${
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
