import * as React from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../../components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/dropdown-menu';
import { Icons } from '../../components/icon';
import { Badge } from '../../components/badge';

export interface BranchNode {
  id: string;
  title: string;
  parentId: string | null;
  /** Depth level (0 = root, 1 = child, 2 = grandchild, etc.) */
  depth: number;
  /** Number of child branches */
  childCount: number;
  /** Number of files created in this branch */
  artifactCount: number;
  /** Last activity timestamp */
  lastActivityAt: Date;
  /** Whether this is the currently active branch */
  isActive: boolean;
}

export interface BranchSelectorProps {
  /** Current branch */
  currentBranch: BranchNode;
  /** All branches in hierarchical order (parent before children) */
  branches: BranchNode[];
  /** Callback when branch is selected */
  onSelectBranch: (branchId: string) => void;
  /** Callback when create branch is clicked */
  onCreateBranch?: () => void;
  /** Whether currently loading */
  isLoading?: boolean;
}

export const BranchSelector = React.forwardRef<HTMLButtonElement, BranchSelectorProps>(
  ({ currentBranch, branches, onSelectBranch, onCreateBranch, isLoading }, ref) => {
    const [open, setOpen] = React.useState(false);

    // Group branches by relationship to current branch
    const { parent, siblings, children, other } = React.useMemo(() => {
      const result = {
        parent: branches.find((b) => b.id === currentBranch.parentId),
        siblings: branches.filter(
          (b) => b.parentId === currentBranch.parentId && b.id !== currentBranch.id
        ),
        children: branches.filter((b) => b.parentId === currentBranch.id),
        other: branches.filter(
          (b) =>
            b.id !== currentBranch.id &&
            b.id !== currentBranch.parentId &&
            b.parentId !== currentBranch.parentId &&
            b.parentId !== currentBranch.id
        ),
      };
      return result;
    }, [branches, currentBranch]);

    const handleSelect = (branchId: string) => {
      onSelectBranch(branchId);
      setOpen(false);
    };

    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            className="max-w-[280px] justify-between"
            disabled={isLoading}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Icons.gitBranch className="h-4 w-4 shrink-0 text-gray-500" />
              <span className="truncate font-medium">{currentBranch.title}</span>
            </div>
            <Icons.chevronDown className="h-4 w-4 shrink-0 text-gray-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[320px]">
          {/* Current Branch Header */}
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Current Branch</span>
            {currentBranch.artifactCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {currentBranch.artifactCount} file{currentBranch.artifactCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </DropdownMenuLabel>
          <DropdownMenuItem disabled className="opacity-100">
            <BranchItem branch={currentBranch} isActive />
          </DropdownMenuItem>

          {/* Parent Branch */}
          {parent && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Parent</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleSelect(parent.id)}>
                <BranchItem branch={parent} />
              </DropdownMenuItem>
            </>
          )}

          {/* Sibling Branches */}
          {siblings.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Siblings ({siblings.length})</DropdownMenuLabel>
              {siblings.map((branch) => (
                <DropdownMenuItem key={branch.id} onClick={() => handleSelect(branch.id)}>
                  <BranchItem branch={branch} />
                </DropdownMenuItem>
              ))}
            </>
          )}

          {/* Child Branches */}
          {children.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Children ({children.length})</DropdownMenuLabel>
              {children.map((branch) => (
                <DropdownMenuItem key={branch.id} onClick={() => handleSelect(branch.id)}>
                  <BranchItem branch={branch} />
                </DropdownMenuItem>
              ))}
            </>
          )}

          {/* Other Branches */}
          {other.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Other Branches ({other.length})</DropdownMenuLabel>
              <div className="max-h-[160px] overflow-y-auto">
                {other.map((branch) => (
                  <DropdownMenuItem key={branch.id} onClick={() => handleSelect(branch.id)}>
                    <BranchItem branch={branch} showDepth />
                  </DropdownMenuItem>
                ))}
              </div>
            </>
          )}

          {/* Create Branch Action */}
          {onCreateBranch && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  onCreateBranch();
                  setOpen(false);
                }}
                className="text-primary-600 dark:text-primary-400"
              >
                <Icons.plus className="h-4 w-4 mr-2" />
                <span className="font-medium">Create New Branch</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
);
BranchSelector.displayName = 'BranchSelector';

/** Individual branch item with indentation for hierarchy */
const BranchItem = ({
  branch,
  isActive,
  showDepth,
}: {
  branch: BranchNode;
  isActive?: boolean;
  showDepth?: boolean;
}) => {
  const indentationLevel = showDepth ? branch.depth : 0;

  return (
    <div className="flex items-center justify-between w-full min-w-0">
      <div className="flex items-center gap-2 min-w-0" style={{ paddingLeft: `${indentationLevel * 12}px` }}>
        <Icons.gitBranch className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        <span className={cn('truncate text-sm', isActive && 'font-semibold text-primary-600 dark:text-primary-400')}>
          {branch.title}
        </span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {branch.artifactCount > 0 && (
          <span className="text-xs text-gray-500">{branch.artifactCount}</span>
        )}
        {branch.childCount > 0 && (
          <Badge variant="outline" className="text-xs px-1.5 py-0">
            {branch.childCount}
          </Badge>
        )}
      </div>
    </div>
  );
};
