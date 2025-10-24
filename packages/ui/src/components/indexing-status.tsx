/**
 * IndexingStatus Component
 *
 * Visual indicator for document indexing status
 * Shows badge with different states: pending, in_progress, completed, failed
 */

import * as React from 'react';
import { cn } from '../lib/utils';

// ============================================================================
// Types
// ============================================================================

export type IndexingStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface IndexingStatusProps {
  status: IndexingStatus;
  className?: string;
  showLabel?: boolean; // Show text label or just icon
  size?: 'sm' | 'md' | 'lg';
}

// ============================================================================
// Status Configuration
// ============================================================================

const statusConfig = {
  pending: {
    label: 'Indexing pending',
    shortLabel: 'Pending',
    icon: '⏳',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    description: 'Waiting to be indexed',
  },
  in_progress: {
    label: 'Indexing in progress',
    shortLabel: 'Indexing',
    icon: '⚡',
    className: 'bg-blue-100 text-blue-800 border-blue-300',
    description: 'Currently being indexed',
  },
  completed: {
    label: 'Indexing completed',
    shortLabel: 'Indexed',
    icon: '✓',
    className: 'bg-green-100 text-green-800 border-green-300',
    description: 'Ready for search and AI context',
  },
  failed: {
    label: 'Indexing failed',
    shortLabel: 'Failed',
    icon: '✗',
    className: 'bg-red-100 text-red-800 border-red-300',
    description: 'Indexing failed - will retry automatically',
  },
};

const sizeClasses = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-1',
  lg: 'text-base px-3 py-1.5',
};

// ============================================================================
// Component
// ============================================================================

export function IndexingStatus({
  status,
  className,
  showLabel = true,
  size = 'sm',
}: IndexingStatusProps) {
  const config = statusConfig[status];

  if (!config) {
    console.warn(`Unknown indexing status: ${status}`);
    return null;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        config.className,
        sizeClasses[size],
        className
      )}
      title={config.description}
    >
      <span className="inline-block">{config.icon}</span>
      {showLabel && <span>{config.shortLabel}</span>}
    </span>
  );
}

// ============================================================================
// Variants
// ============================================================================

/**
 * Minimal icon-only variant (for file tree nodes)
 */
export function IndexingStatusIcon({
  status,
  className,
}: Pick<IndexingStatusProps, 'status' | 'className'>) {
  return <IndexingStatus status={status} showLabel={false} size="sm" className={className} />;
}

/**
 * Full label variant (for document headers)
 */
export function IndexingStatusBadge({
  status,
  className,
  size = 'md',
}: Pick<IndexingStatusProps, 'status' | 'className' | 'size'>) {
  return <IndexingStatus status={status} showLabel={true} size={size} className={className} />;
}
