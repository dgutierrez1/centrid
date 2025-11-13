import React from 'react';
import { Skeleton } from '../../components/skeleton';
import { ScrollArea } from '../../components/scroll-area';

export interface MessageStreamSkeletonProps {
  className?: string;
  messageCount?: number;
}

export function MessageStreamSkeleton({
  className = '',
  messageCount = 3
}: MessageStreamSkeletonProps) {
  return (
    <ScrollArea className={`h-full ${className}`} data-testid="message-stream-skeleton">
      <div className="flex flex-col gap-4 p-4">
        {/* Generate skeleton messages */}
        {Array.from({ length: messageCount }).map((_, index) => (
          <div key={index} className="flex gap-3">
            {/* Avatar skeleton */}
            <div className="flex-shrink-0">
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>

            {/* Message content skeleton */}
            <div className="flex-1 space-y-2">
              {/* Role/name */}
              <Skeleton className="h-4 w-20" />

              {/* Message text lines - vary width for realistic look */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[95%]" />
                <Skeleton className="h-4 w-[85%]" />
                {index === 0 && <Skeleton className="h-4 w-[90%]" />}
                {index === 1 && (
                  <>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[75%]" />
                  </>
                )}
              </div>

              {/* Timestamp */}
              <Skeleton className="h-3 w-32 mt-2" />
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}