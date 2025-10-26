import * as React from 'react';
import { cn } from '../../lib/utils';
import { Badge } from '../../components/badge';
import { Icons } from '../../components/icon';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/tooltip';

export interface ContextReferenceData {
  id: string;
  referenceType: 'file' | 'folder' | 'snippet' | 'all_filesystem' | 'pasted' | 'web' | 'auto_gen';
  displayLabel: string;
  sourceReference?: string;
  contentPreview?: string;
  tokenCount?: number;
  isFileDeleted?: boolean;
  /** For snippets: line range info */
  snippetLineStart?: number;
  snippetLineEnd?: number;
}

export interface ContextReferenceProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Context reference data */
  reference: ContextReferenceData;
  /** Whether reference can be removed (show X button) */
  removable?: boolean;
  /** Callback when remove button clicked */
  onRemove?: (referenceId: string) => void;
  /** Callback when reference is clicked */
  onClick?: (reference: ContextReferenceData) => void;
  /** Whether to show as active/selected */
  isActive?: boolean;
}

function getReferenceIcon(type: ContextReferenceData['referenceType']) {
  switch (type) {
    case 'file':
      return <Icons.file className="h-3 w-3" />;
    case 'folder':
      return <Icons.folder className="h-3 w-3" />;
    case 'snippet':
      return <Icons.code className="h-3 w-3" />;
    case 'all_filesystem':
      return <Icons.globe className="h-3 w-3" />;
    case 'pasted':
      return <Icons.clipboard className="h-3 w-3" />;
    case 'web':
      return <Icons.externalLink className="h-3 w-3" />;
    case 'auto_gen':
      return <Icons.bot className="h-3 w-3" />;
    default:
      return <Icons.file className="h-3 w-3" />;
  }
}

function getReferenceColor(type: ContextReferenceData['referenceType']) {
  switch (type) {
    case 'all_filesystem':
      return 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border-primary-300 dark:border-primary-700';
    case 'snippet':
      return 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700';
    case 'pasted':
      return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700';
    case 'web':
      return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700';
    default:
      return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700';
  }
}

export const ContextReference = React.forwardRef<HTMLDivElement, ContextReferenceProps>(
  ({ reference, removable = true, onRemove, onClick, isActive, className, ...props }, ref) => {
    const icon = getReferenceIcon(reference.referenceType);
    const colorClass = getReferenceColor(reference.referenceType);

    const handleRemove = (e: React.MouseEvent) => {
      e.stopPropagation();
      onRemove?.(reference.id);
    };

    const handleClick = () => {
      onClick?.(reference);
    };

    const tooltipContent = (
      <div className="space-y-1">
        <div className="font-medium">{reference.displayLabel}</div>
        {reference.sourceReference && (
          <div className="text-xs text-gray-400">{reference.sourceReference}</div>
        )}
        {reference.snippetLineStart !== undefined && reference.snippetLineEnd !== undefined && (
          <div className="text-xs text-gray-400">
            Lines {reference.snippetLineStart}-{reference.snippetLineEnd}
          </div>
        )}
        {reference.contentPreview && (
          <div className="text-xs text-gray-400 mt-2 max-w-xs line-clamp-3">
            {reference.contentPreview}
          </div>
        )}
        {reference.tokenCount !== undefined && (
          <div className="text-xs text-gray-500 mt-2">{reference.tokenCount} tokens</div>
        )}
      </div>
    );

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              ref={ref}
              onClick={handleClick}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-sm font-medium transition-all',
                'hover:shadow-sm cursor-pointer',
                colorClass,
                isActive && 'ring-2 ring-primary-500 ring-offset-1',
                reference.isFileDeleted && 'opacity-50 line-through',
                className
              )}
              {...props}
            >
              {icon}
              <span className="max-w-[120px] truncate">{reference.displayLabel}</span>
              {reference.isFileDeleted && (
                <span className="text-xs opacity-75">(Deleted)</span>
              )}
              {removable && (
                <button
                  onClick={handleRemove}
                  className="ml-0.5 hover:bg-white/20 dark:hover:bg-black/20 rounded-full p-0.5 transition-colors"
                  aria-label="Remove reference"
                >
                  <Icons.x className="h-3 w-3" />
                </button>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-sm">
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);
ContextReference.displayName = 'ContextReference';
