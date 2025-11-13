import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/tooltip';

export interface ReferencePillProps {
  /** Reference type */
  referenceType: 'file' | 'folder' | 'thread';
  /** Display name */
  name: string;
  /** Source branch (for tooltip) */
  sourceBranch?: string;
  /** Timestamp (for tooltip) */
  timestamp?: Date;
  /** Click handler */
  onClick?: () => void;
  /** Remove handler */
  onRemove?: () => void;
  className?: string;
}

export function ReferencePill({
  referenceType,
  name,
  sourceBranch,
  timestamp,
  onClick,
  onRemove,
  className = '',
}: ReferencePillProps) {
  // Icon map
  const iconMap = {
    file: (
      <svg className="w-3.5 h-3.5 text-primary-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    folder: (
      <svg className="w-3.5 h-3.5 text-primary-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
    thread: (
      <svg className="w-3.5 h-3.5 text-primary-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  };

  const pill = (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`group relative flex items-center gap-1.5 px-2.5 py-1 bg-primary-100 dark:bg-primary-800/50 hover:bg-primary-200 dark:hover:bg-primary-700/50 rounded-full transition-colors border border-primary-200 dark:border-primary-700 shadow-sm shrink-0 cursor-pointer ${className}`}
    >
      {/* Icon */}
      {iconMap[referenceType]}

      {/* File name (truncated) - matches primary color scheme */}
      <span className="text-xs font-medium text-primary-700 dark:text-primary-300 truncate max-w-[100px]">
        {name}
      </span>

      {/* Remove button (appears on hover) */}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-primary-300 dark:hover:bg-primary-600 rounded-full shrink-0"
          aria-label="Remove reference"
        >
          <svg className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );

  // Wrap with tooltip if we have metadata
  if (sourceBranch || timestamp) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{pill}</TooltipTrigger>
          <TooltipContent className="bg-gray-800 dark:bg-gray-700 text-gray-100 border-gray-700 dark:border-gray-600">
            <div className="max-w-xs">
              <p className="font-semibold text-sm text-white">{name}</p>
              {sourceBranch && (
                <p className="text-xs text-gray-300 dark:text-gray-300 mt-1">
                  From: {sourceBranch}
                </p>
              )}
              {timestamp && (
                <p className="text-xs text-gray-300 dark:text-gray-300">
                  Added: {timestamp.toLocaleString()}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return pill;
}
