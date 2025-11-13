import React from 'react';
import { cn } from '../../lib/utils';
import { Skeleton } from '@centrid/ui/components';

export interface FilePanelSkeletonProps {
  className?: string;
}

export function FilePanelSkeleton({ className }: FilePanelSkeletonProps) {
  return (
    <div className={cn('flex flex-col h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700', className)}>
      {/* File Header Skeleton */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* File name skeleton */}
          <Skeleton className="h-6 w-48" />
          {/* Save indicator skeleton */}
          <Skeleton className="h-4 w-20" />
        </div>
        {/* Close button skeleton */}
        <Skeleton className="h-5 w-5 rounded" />
      </div>

      {/* File Content Skeleton */}
      <div className="flex-1 overflow-hidden bg-white dark:bg-gray-900 p-6 space-y-3">
        {/* Multiple line skeletons to simulate content */}
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[95%]" />
        <Skeleton className="h-4 w-[90%]" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[85%]" />
        <div className="pt-4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[92%]" />
        <Skeleton className="h-4 w-[88%]" />
        <Skeleton className="h-4 w-full" />
        <div className="pt-4" />
        <Skeleton className="h-4 w-[93%]" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[87%]" />
      </div>
    </div>
  );
}
