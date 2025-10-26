import * as React from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../../components/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/card';
import { Icons } from '../../components/icon';
import { Badge } from '../../components/badge';
import { Separator } from '../../components/separator';

export interface FileChangePreview {
  id: string;
  filePath: string;
  action: 'create' | 'update' | 'delete' | 'rename' | 'move';
  /** Estimated file size or line count */
  metadata?: {
    lineCount?: number;
    fileSize?: string;
    newPath?: string; // For rename/move operations
  };
}

export interface ApprovalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of file changes requiring approval */
  changes: FileChangePreview[];
  /** Whether the request is still ongoing (can be approved) */
  isOngoing?: boolean;
  /** Callback when approve button clicked */
  onApprove?: () => void;
  /** Callback when reject button clicked */
  onReject?: () => void;
  /** Loading state for approval action */
  isApproving?: boolean;
  /** Loading state for reject action */
  isRejecting?: boolean;
}

function getActionIcon(action: FileChangePreview['action']) {
  switch (action) {
    case 'create':
      return <Icons.filePlus className="h-4 w-4 text-green-600 dark:text-green-400" />;
    case 'update':
      return <Icons.fileEdit className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
    case 'delete':
      return <Icons.trash className="h-4 w-4 text-red-600 dark:text-red-400" />;
    case 'rename':
    case 'move':
      return <Icons.fileMove className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
    default:
      return <Icons.file className="h-4 w-4" />;
  }
}

function getActionLabel(action: FileChangePreview['action']) {
  switch (action) {
    case 'create':
      return 'Create';
    case 'update':
      return 'Update';
    case 'delete':
      return 'Delete';
    case 'rename':
      return 'Rename';
    case 'move':
      return 'Move';
    default:
      return action;
  }
}

function getActionColor(action: FileChangePreview['action']) {
  switch (action) {
    case 'create':
      return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700';
    case 'update':
      return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700';
    case 'delete':
      return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700';
    case 'rename':
    case 'move':
      return 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700';
    default:
      return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700';
  }
}

const FileChangeItem: React.FC<{ change: FileChangePreview }> = ({ change }) => {
  const icon = getActionIcon(change.action);
  const label = getActionLabel(change.action);
  const colorClass = getActionColor(change.action);

  return (
    <div className="flex items-start gap-3 py-2">
      <div className="shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={cn('text-xs', colorClass)}>
            {label}
          </Badge>
          <span className="text-sm font-mono text-gray-900 dark:text-gray-100 truncate">
            {change.filePath}
          </span>
        </div>
        {change.metadata && (
          <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            {change.metadata.lineCount && `${change.metadata.lineCount} lines`}
            {change.metadata.fileSize && ` • ${change.metadata.fileSize}`}
            {change.metadata.newPath && ` → ${change.metadata.newPath}`}
          </div>
        )}
      </div>
    </div>
  );
};

export const ApprovalCard = React.forwardRef<HTMLDivElement, ApprovalCardProps>(
  (
    {
      changes,
      isOngoing = true,
      onApprove,
      onReject,
      isApproving,
      isRejecting,
      className,
      ...props
    },
    ref
  ) => {
    const changeCount = changes.length;
    const actions = [...new Set(changes.map((c) => c.action))];
    const actionSummary = actions.map(getActionLabel).join(', ');

    // Trim file path to just filename for compact display
    const getDisplayPath = (path: string) => {
      const parts = path.split('/');
      return parts[parts.length - 1];
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg border-l-4 border-l-warning-500 bg-warning-50 dark:bg-warning-900/10',
          !isOngoing && 'opacity-60',
          className
        )}
        {...props}
      >
        {/* Icon + Message */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Icons.alertCircle className="h-3.5 w-3.5 text-warning-600 dark:text-warning-400 shrink-0" />
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-xs font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
              {actionSummary}:
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400 truncate font-mono">
              {getDisplayPath(changes[0]?.filePath || '')}
              {changeCount > 1 && ` +${changeCount - 1}`}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          {!isOngoing ? (
            <span className="text-xs text-gray-500 dark:text-gray-400">Inactive</span>
          ) : (
            <>
              <Button
                onClick={onApprove}
                disabled={isApproving || isRejecting}
                size="icon"
                className="h-7 w-7"
                title="Approve"
              >
                {isApproving ? (
                  <Icons.loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Icons.check className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button
                onClick={onReject}
                disabled={isApproving || isRejecting}
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="Reject"
              >
                <Icons.x className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }
);
ApprovalCard.displayName = 'ApprovalCard';
