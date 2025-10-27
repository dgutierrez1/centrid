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
  /** Artifacts from this chat - files created in current thread */
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

  /** Whether panel is collapsed */
  collapsed?: boolean;
  /** Callback when collapse state changes */
  onCollapsedChange?: (collapsed: boolean) => void;
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
      collapsed = false,
      onCollapsedChange,
    },
    ref
  ) => {
    const totalItems =
      explicitContext.length +
      frequentlyUsed.length +
      semanticMatches.length +
      branchContext.length +
      artifacts.length;

    if (totalItems === 0 && excludedContext.length === 0) {
      return null; // Don't show panel if no context
    }

    return (
      <div
        ref={ref}
        className="shrink-0 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50"
      >
        <div className="max-w-4xl mx-auto w-full px-4 py-3">
          {/* Header */}
          <button
            onClick={() => onCollapsedChange?.(!collapsed)}
            className="flex items-center justify-between w-full mb-2 group"
          >
            <div className="flex items-center gap-2">
              <Icons.layers className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Context ({totalItems} items)
              </span>
              {excludedContext.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {excludedContext.length} excluded
                </Badge>
              )}
            </div>
            <Icons.chevronDown
              className={cn(
                'h-4 w-4 text-gray-500 transition-transform',
                collapsed && '-rotate-90'
              )}
            />
          </button>

          {!collapsed && (
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-3">
                {/* Explicit Context (Priority 1 - Highest) */}
                {explicitContext.length > 0 && (
                  <ContextSection
                    title="Explicit"
                    items={explicitContext}
                    priorityTier={1}
                    onItemClick={onItemClick}
                    onItemRemove={onItemRemove}
                  />
                )}

                {/* Frequently Used (Priority 2 - From user preferences) */}
                {frequentlyUsed.length > 0 && (
                  <ContextSection
                    title="Frequently Used"
                    description="Learned from your usage patterns"
                    items={frequentlyUsed}
                    priorityTier={2}
                    onItemClick={onItemClick}
                    onItemRemove={onItemRemove}
                  />
                )}

                {/* Semantic Matches (Priority 3 - Cross-branch discovery) */}
                {semanticMatches.length > 0 && (
                  <ContextSection
                    title="Semantic Matches"
                    description="Relevant files from other branches"
                    items={semanticMatches}
                    priorityTier={3}
                    onItemClick={onItemClick}
                    onItemRemove={onItemRemove}
                    onHideBranch={onHideBranch}
                    showRelevance
                  />
                )}

                {/* Branch Context (Priority 4) */}
                {branchContext.length > 0 && (
                  <ContextSection
                    title="Branch Context"
                    description="Inherited from parent branch"
                    items={branchContext}
                    priorityTier={4}
                    onItemClick={onItemClick}
                  />
                )}

                {/* Artifacts (Priority 5) */}
                {artifacts.length > 0 && (
                  <ContextSection
                    title="Artifacts from This Chat"
                    items={artifacts}
                    priorityTier={5}
                    onItemClick={onItemClick}
                  />
                )}

                {/* Excluded Context */}
                {excludedContext.length > 0 && (
                  <ContextSection
                    title="Excluded from Context"
                    description="Didn't fit in budget"
                    items={excludedContext}
                    priorityTier={6}
                    onItemClick={onItemClick}
                    onItemAdd={onItemAdd}
                    isExcluded
                  />
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    );
  }
);
ContextPanel.displayName = 'ContextPanel';

/** Individual context section with priority indicator */
const ContextSection = ({
  title,
  description,
  items,
  priorityTier,
  onItemClick,
  onItemRemove,
  onItemAdd,
  onHideBranch,
  showRelevance,
  isExcluded,
}: {
  title: string;
  description?: string;
  items: ContextItem[];
  priorityTier: number;
  onItemClick?: (item: ContextItem) => void;
  onItemRemove?: (item: ContextItem) => void;
  onItemAdd?: (item: ContextItem) => void;
  onHideBranch?: (item: ContextItem) => void;
  showRelevance?: boolean;
  isExcluded?: boolean;
}) => {
  const [collapsed, setCollapsed] = React.useState(false);

  // Priority tier colors
  const tierColors = {
    1: 'border-l-primary-500 bg-primary-50/50 dark:bg-primary-900/10', // Explicit
    2: 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10', // Frequently Used
    3: 'border-l-purple-500 bg-purple-50/50 dark:bg-purple-900/10', // Semantic
    4: 'border-l-orange-500 bg-orange-50/50 dark:bg-orange-900/10', // Branch
    5: 'border-l-green-500 bg-green-50/50 dark:bg-green-900/10', // Artifacts
    6: 'border-l-gray-400 bg-gray-50/50 dark:bg-gray-900/10', // Excluded
  };

  return (
    <div className={cn('border-l-2 rounded-r-md', tierColors[priorityTier as keyof typeof tierColors])}>
      <div className="px-3 py-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-between w-full mb-1 group"
        >
          <div className="flex items-center gap-2">
            <Icons.chevronRight
              className={cn(
                'h-3.5 w-3.5 text-gray-400 transition-transform',
                !collapsed && 'rotate-90'
              )}
            />
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              {title} ({items.length})
            </span>
          </div>
          {description && (
            <span className="text-xs text-gray-500 italic">{description}</span>
          )}
        </button>

        {!collapsed && (
          <div className="mt-2 space-y-1.5">
            {items.map((item) => (
              <ContextItemRow
                key={item.id}
                item={item}
                onItemClick={onItemClick}
                onItemRemove={onItemRemove}
                onItemAdd={onItemAdd}
                onHideBranch={onHideBranch}
                showRelevance={showRelevance}
                isExcluded={isExcluded}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/** Individual context item row */
const ContextItemRow = ({
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
        'flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-sm',
        'hover:bg-white/80 dark:hover:bg-gray-800/80 transition-colors',
        isExcluded && 'opacity-60',
        onItemClick && 'cursor-pointer'
      )}
      onClick={() => onItemClick?.(item)}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Icon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        <span className="truncate text-gray-700 dark:text-gray-300">{item.label}</span>

        {/* Source branch indicator */}
        {item.sourceBranch && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  {item.relationship === 'parent' && '↑'}
                  {item.relationship === 'sibling' && '↔'}
                  {item.relationship === 'child' && '↓'}
                  {item.sourceBranch}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">From {item.sourceBranch} branch</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Relevance score */}
        {showRelevance && item.relevanceScore !== undefined && (
          <span className="text-xs text-gray-500">
            {Math.round(item.relevanceScore * 100)}%
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {isExcluded && item.canAdd && onItemAdd && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onItemAdd(item);
            }}
          >
            Add back
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
            Hide branch
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
