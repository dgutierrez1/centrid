import * as React from 'react';
import { cn } from '../../lib/utils';
import { Icons } from '../../components/icon';
import { Badge } from '../../components/badge';
import { Button } from '../../components/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/tooltip';
import { ScrollArea } from '../../components/scroll-area';

/** Context item that can appear in any section */
export interface ContextItem {
  id: string;
  /** Display label (file name, thread title, etc.) */
  label: string;
  /** Item type */
  type: 'file' | 'thread' | 'folder' | 'snippet';
  /** Relevance score (0-1) for semantic matches */
  relevanceScore?: number;
  /** Source branch name for cross-branch items */
  sourceBranch?: string;
  /** Relationship type for cross-branch items */
  relationship?: 'parent' | 'sibling' | 'child';
  /** Creation timestamp for artifacts */
  createdAt?: Date;
  /** File size for files */
  fileSize?: string;
  /** Whether item can be removed */
  canRemove?: boolean;
  /** Whether item can be manually re-added (for excluded items) */
  canAdd?: boolean;
}

export interface ContextPanelProps {
  /** Explicit context (1.0 weight) - files/threads @-mentioned */
  explicitContext: ContextItem[];
  /** Frequently used items (0.8 weight) - derived from user preferences */
  frequentlyUsed: ContextItem[];
  /** Semantic matches (0.5 base weight + modifiers) - cross-branch discovery */
  semanticMatches: ContextItem[];
  /** Branch context (0.7 weight) - parent summary, inherited files */
  branchContext: ContextItem[];
  /** Artifacts from this thread - files created in current thread */
  artifacts: ContextItem[];
  /** Excluded context - items that didn't fit in 200K budget */
  excludedContext: ContextItem[];

  /** Callback when item is clicked */
  onItemClick?: (item: ContextItem) => void;
  /** Callback when item is removed */
  onItemRemove?: (item: ContextItem) => void;
  /** Callback when excluded item is manually added back */
  onItemAdd?: (item: ContextItem) => void;
  /** Callback when "Hide from [Branch]" is clicked for semantic match */
  onHideBranch?: (item: ContextItem) => void;

  /** Which sections are expanded (section IDs) */
  expandedSections?: string[];
  /** Callback when section expand/collapse state changes */
  onToggleSection?: (sectionId: string) => void;

  className?: string;
}

export const ContextPanel = React.forwardRef<HTMLDivElement, ContextPanelProps>(
  (
    {
      explicitContext,
      frequentlyUsed,
      semanticMatches,
      branchContext,
      artifacts,
      excludedContext,
      onItemClick,
      onItemRemove,
      onItemAdd,
      onHideBranch,
      expandedSections = ['explicit', 'semantic'],
      onToggleSection,
      className,
    },
    ref
  ) => {
    const sections = [
      { id: 'explicit', title: 'Explicit context', items: explicitContext, tier: 1 },
      { id: 'frequent', title: 'Frequently used', items: frequentlyUsed, tier: 2 },
      { id: 'semantic', title: 'Semantic matches', items: semanticMatches, tier: 3, showRelevance: true },
      { id: 'branch', title: 'Branch context', items: branchContext, tier: 4 },
      { id: 'artifacts', title: 'Artifacts from this thread', items: artifacts, tier: 5 },
      { id: 'excluded', title: 'Excluded from context', items: excludedContext, tier: 6, isExcluded: true },
    ].filter((section) => section.items.length > 0);

    if (sections.length === 0) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(
          'shrink-0 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50',
          className
        )}
      >
        <div className="max-w-4xl mx-auto w-full px-4 py-3">
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-3">
              {sections.map((section) => (
                <ContextSection
                  key={section.id}
                  sectionId={section.id}
                  title={section.title}
                  items={section.items}
                  tier={section.tier}
                  isExpanded={expandedSections.includes(section.id)}
                  onToggle={() => onToggleSection?.(section.id)}
                  onItemClick={onItemClick}
                  onItemRemove={onItemRemove}
                  onItemAdd={onItemAdd}
                  onHideBranch={onHideBranch}
                  showRelevance={section.showRelevance}
                  isExcluded={section.isExcluded}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  }
);
ContextPanel.displayName = 'ContextPanel';

/** Individual context section with section-level collapse and horizontal widget layout */
const ContextSection = ({
  sectionId,
  title,
  items,
  tier,
  isExpanded,
  onToggle,
  onItemClick,
  onItemRemove,
  onItemAdd,
  onHideBranch,
  showRelevance,
  isExcluded,
}: {
  sectionId: string;
  title: string;
  items: ContextItem[];
  tier: number;
  isExpanded: boolean;
  onToggle: () => void;
  onItemClick?: (item: ContextItem) => void;
  onItemRemove?: (item: ContextItem) => void;
  onItemAdd?: (item: ContextItem) => void;
  onHideBranch?: (item: ContextItem) => void;
  showRelevance?: boolean;
  isExcluded?: boolean;
}) => {
  const tierColors = {
    1: 'border-l-primary-500',
    2: 'border-l-blue-500',
    3: 'border-l-purple-500',
    4: 'border-l-orange-500',
    5: 'border-l-green-500',
    6: 'border-l-gray-400',
  };

  const visibleItems = isExpanded ? items : items.slice(0, 5);
  const hasMore = items.length > visibleItems.length;

  return (
    <div className={cn('border-l-2 rounded-r-md bg-white/50 dark:bg-gray-900/20', tierColors[tier as keyof typeof tierColors])}>
      <div className="px-3 py-2">
        {/* Section Header - Clickable to expand/collapse */}
        <button
          onClick={onToggle}
          className="flex items-center justify-between w-full mb-2 group"
        >
          <div className="flex items-center gap-2">
            <Icons.chevronRight
              className={cn(
                'h-3.5 w-3.5 text-gray-400 transition-transform',
                isExpanded && 'rotate-90'
              )}
            />
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              {isExpanded ? '▼' : '▶'} {title} ({items.length})
            </span>
          </div>
        </button>

        {/* Horizontal Widget Layout */}
        <div className="flex flex-wrap gap-2">
          {visibleItems.map((item) =>
            isExpanded ? (
              <ExpandedWidget
                key={item.id}
                item={item}
                onItemClick={onItemClick}
                onItemRemove={onItemRemove}
                onItemAdd={onItemAdd}
                onHideBranch={onHideBranch}
                showRelevance={showRelevance}
                isExcluded={isExcluded}
              />
            ) : (
              <CollapsedWidget key={item.id} item={item} onItemClick={onItemClick} />
            )
          )}

          {/* "+X more" indicator when collapsed and there are more items */}
          {hasMore && !isExpanded && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors"
            >
              +{items.length - visibleItems.length} more
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/** Collapsed widget - compact inline view with tooltip */
const CollapsedWidget = ({
  item,
  onItemClick,
}: {
  item: ContextItem;
  onItemClick?: (item: ContextItem) => void;
}) => {
  const icon = item.type === 'file' ? Icons.file : item.type === 'thread' ? Icons.messageSquare : Icons.folder;
  const Icon = icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onItemClick?.(item)}
            className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Icon className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-700 dark:text-gray-300 truncate max-w-[100px]">
              {item.label}
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1 text-xs">
            <div className="font-medium">{item.label}</div>
            {item.sourceBranch && <div className="text-gray-400">From: {item.sourceBranch}</div>}
            {item.createdAt && (
              <div className="text-gray-400">Created: {formatDistanceToNow(item.createdAt)}</div>
            )}
            {item.relevanceScore !== undefined && (
              <div className="text-gray-400">
                Relevance: {Math.round(item.relevanceScore * 100)}%
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/** Expanded widget - detailed card with metadata and action buttons */
const ExpandedWidget = ({
  item,
  onItemClick,
  onItemRemove,
  onItemAdd,
  onHideBranch,
  showRelevance,
  isExcluded,
}: {
  item: ContextItem;
  onItemClick?: (item: ContextItem) => void;
  onItemRemove?: (item: ContextItem) => void;
  onItemAdd?: (item: ContextItem) => void;
  onHideBranch?: (item: ContextItem) => void;
  showRelevance?: boolean;
  isExcluded?: boolean;
}) => {
  const icon = item.type === 'file' ? Icons.file : item.type === 'thread' ? Icons.messageSquare : Icons.folder;
  const Icon = icon;

  return (
    <div
      className={cn(
        'inline-flex flex-col gap-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md hover:border-gray-300 dark:hover:border-gray-600 transition-colors min-w-[140px] max-w-[200px]',
        isExcluded && 'opacity-60',
        onItemClick && 'cursor-pointer'
      )}
      onClick={() => onItemClick?.(item)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
            {item.label}
          </span>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap gap-1 text-xs text-gray-500">
        {item.fileSize && <span>{item.fileSize}</span>}
        {item.createdAt && <span>{formatDistanceToNow(item.createdAt)}</span>}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1">
        {showRelevance && item.relevanceScore !== undefined && (
          <Badge variant="secondary" className="text-xs px-1.5 py-0">
            {Math.round(item.relevanceScore * 100)}%
          </Badge>
        )}
        {item.sourceBranch && (
          <Badge variant="outline" className="text-xs px-1.5 py-0">
            {item.relationship === 'parent' && '↑'}
            {item.relationship === 'sibling' && '↔'}
            {item.relationship === 'child' && '↓'}
            {item.sourceBranch}
          </Badge>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-1 mt-1">
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs flex-1" onClick={(e) => e.stopPropagation()}>
          View
        </Button>

        {isExcluded && item.canAdd && onItemAdd && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onItemAdd(item);
            }}
          >
            Re-prime
          </Button>
        )}

        {item.sourceBranch && onHideBranch && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onHideBranch(item);
            }}
          >
            Hide
          </Button>
        )}

        {item.canRemove && onItemRemove && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onItemRemove(item);
            }}
          >
            <Icons.x className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
};

function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
