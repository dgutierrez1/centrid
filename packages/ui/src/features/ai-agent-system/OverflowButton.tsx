import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/tooltip';

export interface OverflowButtonProps {
  count: number;
  items: Array<{ name: string; [key: string]: any }>;
  startIndex: number;
  className?: string;
}

export function OverflowButton({
  count,
  items,
  startIndex,
  className = '',
}: OverflowButtonProps) {
  if (count <= 0) return null;

  const tooltipItems = items.slice(startIndex, startIndex + 5);
  const remainingCount = Math.max(0, items.length - startIndex - 5);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={`flex items-center justify-center px-3 py-2 bg-primary-100 dark:bg-primary-800/50 hover:bg-primary-200 dark:hover:bg-primary-700/50 rounded-full transition-colors border border-primary-200 dark:border-primary-700 shadow-sm shrink-0 ${className}`}
          >
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              +{count}
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent className="bg-gray-800 dark:bg-gray-700 text-gray-100 border-gray-700 dark:border-gray-600">
          <div className="max-w-xs">
            <p className="font-semibold text-sm text-white mb-2">
              {count} more reference{count > 1 ? 's' : ''}
            </p>
            <ul className="space-y-1">
              {tooltipItems.map((item, index) => (
                <li key={index} className="text-xs text-gray-300 dark:text-gray-300">
                  • {item.name}
                </li>
              ))}
              {remainingCount > 0 && (
                <li className="text-xs text-gray-400 dark:text-gray-400 italic">
                  ...and {remainingCount} more
                </li>
              )}
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
