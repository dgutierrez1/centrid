import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/tooltip';

export interface AddReferenceButtonProps {
  onClick?: () => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function AddReferenceButton({
  onClick,
  size = 'sm',
  className = '',
}: AddReferenceButtonProps) {
  const sizeClasses = size === 'sm' ? 'w-5 h-5' : 'w-10 h-10';
  const iconSize = size === 'sm' ? 'w-2.5 h-2.5' : 'w-4 h-4';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={`flex items-center justify-center ${sizeClasses} bg-primary-100 dark:bg-primary-800/30 hover:bg-primary-200 dark:hover:bg-primary-700/40 text-primary-600 dark:text-primary-400 rounded-full transition-colors border border-primary-200 dark:border-primary-700/50 shrink-0 ${className}`}
          >
            <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </TooltipTrigger>
        <TooltipContent className="bg-gray-800 dark:bg-gray-700 text-gray-100 border-gray-700 dark:border-gray-600">
          <p className="text-xs">Add reference</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
