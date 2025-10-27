import React, { useState } from 'react';
import { Card } from '../../components/card';
import { Badge } from '../../components/badge';
import { Button } from '../../components/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/tooltip';

export interface ContextReferenceProps {
  /** Reference type (file, folder, thread) */
  referenceType: 'file' | 'folder' | 'thread';
  /** Display name */
  name: string;
  /** Source branch/thread name (for provenance) */
  sourceBranch?: string;
  /** Relevance score (0-1) for semantic matches */
  relevanceScore?: number;
  /** Relationship type (sibling, parent, child) */
  relationship?: 'sibling' | 'parent' | 'child';
  /** Context priority tier (1=explicit, 2=semantic, 3=branch) */
  priorityTier: number;
  /** Timestamp */
  timestamp?: Date;
  /** Collapsed/expanded state inherited from parent section */
  isExpanded: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Add to explicit handler */
  onAddToExplicit?: () => void;
  /** Remove handler */
  onRemove?: () => void;
  /** Dismiss handler */
  onDismiss?: () => void;
  className?: string;
}

export function ContextReference({
  referenceType,
  name,
  sourceBranch,
  relevanceScore,
  relationship,
  priorityTier,
  timestamp,
  isExpanded,
  onClick,
  onAddToExplicit,
  onRemove,
  onDismiss,
  className = '',
}: ContextReferenceProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Tier colors
  const tierColors = {
    1: 'border-l-primary-600', // Explicit (coral)
    2: 'border-l-purple-600', // Semantic (purple)
    3: 'border-l-blue-600', // Branch (blue)
  };

  const tierBadgeColors = {
    1: 'bg-primary-600 text-white',
    2: 'bg-purple-600 text-white',
    3: 'bg-blue-600 text-white',
  };

  const tierLabels = {
    1: 'Explicit',
    2: 'Semantic',
    3: 'Branch',
  };

  const iconMap = {
    file: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
    folder: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
        />
      </svg>
    ),
    thread: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    ),
  };

  // Collapsed state: Compact 32px pill
  if (!isExpanded) {
    const content = (
      <div
        className={`inline-flex items-center gap-2 h-8 px-3 rounded-full bg-gray-100 dark:bg-gray-800 border ${tierColors[priorityTier]} border-l-4 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${className}`}
        onClick={onClick}
        data-testid="context-reference-collapsed"
      >
        <span className="text-gray-700 dark:text-gray-300">{iconMap[referenceType]}</span>
        <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[120px]">
          {name}
        </span>
        {relevanceScore !== undefined && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {Math.round(relevanceScore * 100)}%
          </span>
        )}
      </div>
    );

    // Tooltip for collapsed state
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="flex flex-col gap-1 text-xs">
              <div className="font-semibold">{name}</div>
              {sourceBranch && <div className="text-gray-400">From: {sourceBranch}</div>}
              {relevanceScore !== undefined && (
                <div className="text-gray-400">Relevance: {Math.round(relevanceScore * 100)}%</div>
              )}
              {timestamp && (
                <div className="text-gray-400">
                  {timestamp.toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              )}
              {relationship && (
                <div className="text-gray-400">
                  Relationship: {relationship} (+{relationship === 'sibling' ? 0.15 : 0.10})
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Expanded state: Full 80px card
  return (
    <Card
      className={`relative w-[200px] h-20 p-3 border-l-4 ${tierColors[priorityTier]} cursor-pointer transition-all hover:shadow-md ${
        isHovered ? 'ring-2 ring-primary-500' : ''
      } ${className}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid="context-reference-expanded"
    >
      <div className="flex flex-col h-full justify-between">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-gray-600 dark:text-gray-400 shrink-0">
              {iconMap[referenceType]}
            </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {name}
            </span>
          </div>
          <Badge className={`text-xs shrink-0 ${tierBadgeColors[priorityTier]}`}>
            {tierLabels[priorityTier]}
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {sourceBranch && <span className="truncate">{sourceBranch}</span>}
            {relevanceScore !== undefined && (
              <Badge variant="secondary" className="text-xs">
                {Math.round(relevanceScore * 100)}%
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons on hover (expanded state only) */}
      {isHovered && (
        <div className="absolute top-2 right-2 flex items-center gap-1 animate-slide-in-right">
          {onAddToExplicit && priorityTier !== 1 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onAddToExplicit();
              }}
              data-testid="add-to-explicit-button"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </Button>
          )}
          {onRemove && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              data-testid="remove-button"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
          )}
          {onDismiss && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              data-testid="dismiss-button"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
