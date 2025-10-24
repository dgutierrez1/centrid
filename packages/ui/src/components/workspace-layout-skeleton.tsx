/**
 * WorkspaceLayoutSkeleton - Reusable loading skeleton for three-panel workspace
 * Shows placeholder UI while workspace data is loading
 */

import { Skeleton } from './skeleton';

export interface WorkspaceLayoutSkeletonProps {
  /** Optional CSS class name for the container */
  className?: string;
}

/**
 * Comprehensive skeleton loading state for workspace layout
 * Matches the structure of a three-panel workspace:
 * - Header with logo and actions
 * - Left panel: File tree
 * - Center panel: Editor
 * - Right panel: AI Assistant
 */
export function WorkspaceLayoutSkeleton({ className = '' }: WorkspaceLayoutSkeletonProps) {
  return (
    <div className={`flex h-screen flex-col ${className}`}>
      {/* Header Skeleton */}
      <div className="flex h-16 items-center justify-between border-b px-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-24 rounded" />
          <Skeleton className="h-9 w-24 rounded" />
        </div>
      </div>

      {/* Three-panel layout skeleton */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - File Tree Skeleton */}
        <div className="w-64 border-r p-4">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-6 w-16" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-8 w-full rounded" />
            <Skeleton className="h-8 w-full rounded" />
            <Skeleton className="h-8 w-full rounded" />
            <Skeleton className="h-8 w-full rounded" />
            <Skeleton className="h-8 w-full rounded" />
          </div>
        </div>

        {/* Center Panel - Editor Skeleton */}
        <div className="flex-1 p-6">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
          <div className="mb-4 flex gap-2">
            <Skeleton className="h-9 w-9 rounded" />
            <Skeleton className="h-9 w-9 rounded" />
            <Skeleton className="h-9 w-9 rounded" />
            <Skeleton className="h-9 w-9 rounded" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>

        {/* Right Panel - AI Assistant Skeleton */}
        <div className="w-80 border-l p-4">
          <div className="mb-4 flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full rounded" />
            <Skeleton className="h-20 w-full rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
