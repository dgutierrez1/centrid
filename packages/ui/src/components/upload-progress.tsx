/**
 * UploadProgress - Reusable upload progress indicator
 * Pure presentational component with no business logic
 */

import { Progress } from './progress';
import { Button } from './button';
import { cn } from '@centrid/shared/utils';

export interface UploadFileItem {
  id: string;
  name: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface UploadProgressProps {
  /** List of files being uploaded */
  files: UploadFileItem[];
  /** Called when user clicks retry on a failed upload */
  onRetry?: (fileId: string) => void;
  /** Called when user removes a file from the list */
  onRemove?: (fileId: string) => void;
  /** Maximum height for the scrollable list */
  maxHeight?: string;
  /** Additional CSS classes */
  className?: string;
  /** Icons to use for different states */
  icons?: {
    pending?: React.ReactNode;
    uploading?: React.ReactNode;
    completed?: React.ReactNode;
    error?: React.ReactNode;
    retry?: React.ReactNode;
    remove?: React.ReactNode;
  };
}

export function UploadProgress({
  files,
  onRetry,
  onRemove,
  maxHeight = '12rem',
  className,
  icons,
}: UploadProgressProps) {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)} style={{ maxHeight, overflowY: 'auto' }}>
      {files.map((file) => (
        <UploadFileItem
          key={file.id}
          file={file}
          onRetry={onRetry}
          onRemove={onRemove}
          icons={icons}
        />
      ))}
    </div>
  );
}

function UploadFileItem({
  file,
  onRetry,
  onRemove,
  icons,
}: {
  file: UploadFileItem;
  onRetry?: (fileId: string) => void;
  onRemove?: (fileId: string) => void;
  icons?: UploadProgressProps['icons'];
}) {
  const statusIcon = {
    pending: icons?.pending,
    uploading: icons?.uploading,
    completed: icons?.completed,
    error: icons?.error,
  }[file.status];

  return (
    <div
      className={cn(
        'flex items-center gap-2 p-2 rounded transition-colors',
        file.status === 'completed' && 'bg-success-50 dark:bg-success-900/20',
        file.status === 'error' && 'bg-error-50 dark:bg-error-900/20',
        (file.status === 'pending' || file.status === 'uploading') &&
          'bg-gray-50 dark:bg-gray-900'
      )}
    >
      {/* Status icon */}
      {statusIcon && <div className="flex-shrink-0">{statusIcon}</div>}

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-900 dark:text-white truncate font-medium">
          {file.name}
        </p>
        {file.status === 'uploading' && (
          <Progress value={file.progress} className="h-1 mt-1" />
        )}
        {file.status === 'error' && file.error && (
          <p className="text-xs text-error-600 dark:text-error-400 mt-1">
            {file.error}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {file.status === 'uploading' && (
          <span className="text-xs text-gray-500 min-w-[3ch] text-right">
            {file.progress}%
          </span>
        )}
        {file.status === 'error' && onRetry && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRetry(file.id)}
            className="h-6 w-6 p-0"
            title="Retry upload"
          >
            {icons?.retry || '↻'}
          </Button>
        )}
        {(file.status === 'completed' || file.status === 'error') && onRemove && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemove(file.id)}
            className="h-6 w-6 p-0"
            title="Remove from list"
          >
            {icons?.remove || '×'}
          </Button>
        )}
      </div>
    </div>
  );
}
