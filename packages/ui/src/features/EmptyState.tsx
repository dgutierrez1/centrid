import React from 'react';
import { Button } from '../components/button';
import { Icon, type IconName } from '../components/icon';

export interface EmptyStateProps {
  icon: IconName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'default' | 'error';
  className?: string;
}

/**
 * EmptyState - Empty state component with icon, message, and optional action
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon="FileText"
 *   title="No files yet"
 *   description="Upload your first file to get started"
 *   actionLabel="Upload File"
 *   onAction={() => console.log('Upload clicked')}
 * />
 * ```
 */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'default',
  className = '',
}: EmptyStateProps) {
  const iconBgClasses =
    variant === 'error'
      ? 'bg-error-50 dark:bg-error-900/20'
      : 'bg-gray-100 dark:bg-gray-900';

  const iconColorClasses =
    variant === 'error'
      ? 'text-error-500'
      : 'text-gray-400';

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-12 border border-gray-200 dark:border-gray-700 flex flex-col items-center text-center ${className}`}>
      <div className={`w-16 h-16 rounded-full ${iconBgClasses} flex items-center justify-center mb-4`}>
        <Icon name={icon} className={`w-8 h-8 ${iconColorClasses}`} />
      </div>
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">{title}</h3>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button
          size="sm"
          variant={variant === 'error' ? 'outline' : 'default'}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
