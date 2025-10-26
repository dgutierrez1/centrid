import * as React from 'react';
import { cn } from '../lib/utils';

export interface TypingIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {}

export const TypingIndicator = React.forwardRef<HTMLDivElement, TypingIndicatorProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center gap-3 py-4 px-4', className)}
        {...props}
      >
        {/* Avatar */}
        <div className="shrink-0 h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-300">
          A
        </div>

        {/* Typing Animation - Simple three dots without background */}
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse [animation-delay:0ms]" />
          <div className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse [animation-delay:150ms]" />
          <div className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse [animation-delay:300ms]" />
        </div>
      </div>
    );
  }
);
TypingIndicator.displayName = 'TypingIndicator';
