import React, { useState } from 'react';
import { Badge } from '../../components/badge';
import { ContextReferenceProps } from './ContextReference';

export interface ContextTypeWidgetProps {
  /** Context type (removed frequently-used and excluded) */
  type: 'explicit' | 'semantic' | 'branch' | 'artifacts';
  /** Display title */
  title: string;
  /** Context items for this type */
  items: Omit<ContextReferenceProps, 'isExpanded'>[];
  /** Widget collapsed/expanded state (inherited from panel) */
  isExpanded: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Max items to show when expanded */
  maxItemsExpanded?: number;
  /** Max items to show in collapsed tooltip */
  maxItemsCollapsed?: number;
  className?: string;
}

export function ContextTypeWidget({
  type,
  title,
  items = [],
  isExpanded,
  onClick,
  maxItemsExpanded = 2,
  maxItemsCollapsed = 3,
  className = '',
}: ContextTypeWidgetProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const count = items.length;
  const visibleItems = isExpanded ? items.slice(0, maxItemsExpanded) : [];
  const remainingCount = count > maxItemsExpanded ? count - maxItemsExpanded : 0;

  // For collapsed tooltip
  const tooltipItems = items.slice(0, maxItemsCollapsed);
  const tooltipRemainingCount = count > maxItemsCollapsed ? count - maxItemsCollapsed : 0;

  // Add keyframe animations
  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleId = 'context-widget-animations';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
          @keyframes expand {
            from {
              opacity: 0.7;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes collapse {
            from {
              opacity: 0.7;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(4px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  // Type-specific colors (removed frequently-used and excluded)
  const typeColors = {
    explicit: {
      border: 'border-l-primary-600',
      bg: 'bg-primary-50 dark:bg-primary-900/10',
      badge: 'bg-primary-600 text-white',
      text: 'text-primary-700 dark:text-primary-300',
    },
    semantic: {
      border: 'border-l-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-900/10',
      badge: 'bg-purple-600 text-white',
      text: 'text-purple-700 dark:text-purple-300',
    },
    branch: {
      border: 'border-l-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/10',
      badge: 'bg-blue-600 text-white',
      text: 'text-blue-700 dark:text-blue-300',
    },
    artifacts: {
      border: 'border-l-green-600',
      bg: 'bg-green-50 dark:bg-green-900/10',
      badge: 'bg-green-600 text-white',
      text: 'text-green-700 dark:text-green-300',
    },
  };

  const colors = typeColors[type];

  // Type-specific icons (removed frequently-used and excluded)
  const typeIcons = {
    explicit: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    semantic: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    branch: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    artifacts: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  };

  // Get type label for collapsed state (row 1)
  const getTypeLabel = () => {
    switch (type) {
      case 'explicit':
        return 'Added';
      case 'semantic':
        return 'Related';
      case 'branch':
        return 'Branch';
      case 'artifacts':
        return 'Generated';
      default:
        return 'Context';
    }
  };

  // Get label for collapsed state (count + type-specific label)
  const getCountLabel = () => {
    switch (type) {
      case 'explicit':
      case 'artifacts':
        return count === 1 ? 'File' : 'Files';
      case 'branch':
        return count === 1 ? 'Node' : 'Nodes';
      case 'semantic':
        return count === 1 ? 'Match' : 'Matches';
      default:
        return 'items';
    }
  };

  // Get percentage/metric for collapsed state (semantic only)
  const getMetric = () => {
    if (type === 'semantic' && items.length > 0 && items[0].relevanceScore) {
      const topScore = Math.round(items[0].relevanceScore * 100);
      return `${topScore}%`;
    }
    return null;
  };

  // Generate context summary for collapsed state (type-specific)
  const getContextSummary = () => {
    if (count === 0) return 'No context';

    // Type-specific summary logic that describes what the context contains
    switch (type) {
      case 'explicit':
        // Describe explicit references with file info
        if (count === 1) {
          const fileName = items[0].name;
          const shortName = fileName.length > 14 ? fileName.substring(0, 14) + '...' : fileName;
          return shortName;
        }
        return `${count} files added`;

      case 'semantic':
        // Show relevance-based summary with top match
        if (items.length > 0 && items[0].relevanceScore) {
          const topScore = Math.round(items[0].relevanceScore * 100);
          const semanticFile = items[0].name.substring(0, 10);
          if (count === 1) {
            return `${semanticFile}... (${topScore}%)`;
          }
          return `${semanticFile}... +${count - 1} (${topScore}%)`;
        }
        return `${count} related docs`;

      case 'frequently-used':
        // Show the frequently used file name
        if (count === 1) {
          const fileName = items[0].name;
          const shortName = fileName.length > 14 ? fileName.substring(0, 14) + '...' : fileName;
          return shortName;
        }
        const frequentFile = items[0].name.substring(0, 12);
        return `${frequentFile}... +${count - 1}`;

      case 'branch':
        // Show branch name or count
        const branchName = items[0]?.sourceBranch;
        if (branchName) {
          const shortBranch = branchName.length > 14 ? branchName.substring(0, 14) + '...' : branchName;
          if (count === 1) {
            return shortBranch;
          }
          return `${shortBranch} (${count})`;
        }
        return `${count} branch items`;

      case 'artifacts':
        // Show artifact name
        if (count === 1) {
          const fileName = items[0].name;
          const shortName = fileName.length > 14 ? fileName.substring(0, 14) + '...' : fileName;
          return shortName;
        }
        const artifactFile = items[0].name.substring(0, 12);
        return `${artifactFile}... +${count - 1}`;

      case 'excluded':
        // Show excluded file name
        if (count === 1) {
          const fileName = items[0].name;
          const shortName = fileName.length > 14 ? fileName.substring(0, 14) + '...' : fileName;
          return shortName;
        }
        return `${count} removed`;

      default:
        // Fallback
        return `${count} items`;
    }
  };

  // Generate expanded state summary (type-specific insight)
  const getExpandedSummary = () => {
    if (count === 0) return null;

    switch (type) {
      case 'explicit':
        return 'Directly referenced in conversation';
      case 'semantic':
        if (items.length > 0 && items[0].relevanceScore) {
          const topScore = Math.round(items[0].relevanceScore * 100);
          return `Top match: ${topScore}% relevant`;
        }
        return 'Semantically matched content';
      case 'branch':
        return 'Shared from parent branch';
      case 'artifacts':
        return 'AI-generated files';
      default:
        return null;
    }
  };

  // Collapsed state: Single row with icon, count, and metric
  if (!isExpanded) {
    return (
      <div
        className="relative"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div
          className={`relative w-auto max-w-[160px] h-10 px-3 py-2 ${colors.bg} cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all duration-200 ease-out shrink-0 rounded-full border ${colors.border} shadow-sm ${className}`}
          onClick={onClick}
          data-testid={`context-widget-${type}-collapsed`}
          style={{
            animation: 'collapse 0.3s ease-in-out',
          }}
        >
          {/* Single row: Icon + Count + Label + Metric (if semantic) */}
          <div className="flex items-center gap-2 h-full justify-center">
            <span className={`${colors.text} shrink-0`}>
              {typeIcons[type]}
            </span>
            <span className={`text-sm font-bold ${colors.text} shrink-0`}>
              {count}
            </span>
            <span className={`text-xs font-medium ${colors.text} opacity-70 shrink-0`}>
              {getCountLabel()}
            </span>
            {getMetric() && (
              <span className={`text-xs font-medium ${colors.text} opacity-70 shrink-0`}>
                {getMetric()}
              </span>
            )}
          </div>
        </div>

        {/* Tooltip - Shows top 3 items + "X more" */}
        {showTooltip && count > 0 && (
          <div
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none"
            style={{
              animation: 'fadeIn 0.2s ease-in-out',
            }}
          >
            <div className="bg-gray-900 dark:bg-gray-800 text-white rounded-lg shadow-lg p-3 min-w-[200px] max-w-[280px]">
              {/* Tooltip Header */}
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-700">
                <span className="text-gray-300">
                  {typeIcons[type]}
                </span>
                <span className="text-xs font-semibold">{title}</span>
                <span className="ml-auto text-xs text-gray-400">{count} items</span>
              </div>

              {/* Top items */}
              <div className="space-y-1.5">
                {tooltipItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 text-xs"
                  >
                    {/* Icon */}
                    <div className="shrink-0 text-gray-400 mt-0.5">
                      {item.referenceType === 'file' && (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                      {item.referenceType === 'folder' && (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                      )}
                      {item.referenceType === 'thread' && (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      )}
                    </div>

                    {/* Name and metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate">{item.name}</div>
                      {type === 'semantic' && item.relevanceScore !== undefined && (
                        <div className="text-[10px] text-gray-400">
                          {Math.round(item.relevanceScore * 100)}% match
                        </div>
                      )}
                      {item.sourceBranch && type !== 'semantic' && (
                        <div className="text-[10px] text-gray-400 truncate">
                          {item.sourceBranch}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Remaining count */}
              {tooltipRemainingCount > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-center text-gray-400">
                  +{tooltipRemainingCount} more
                </div>
              )}

              {/* Tooltip arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                <div className="border-4 border-transparent border-t-gray-900 dark:border-t-gray-800"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Expanded state: Show top items + overflow (narrower width: 140px, full height to match container)
  return (
    <div
      className={`relative h-full w-[140px] p-2 border-l-4 ${colors.border} ${colors.bg} cursor-pointer hover:shadow-md transition-all duration-300 ease-in-out shrink-0 rounded-2xl border bg-card text-card-foreground shadow-sm ${className}`}
      onClick={onClick}
      data-testid={`context-widget-${type}-expanded`}
      title={title}
      style={{
        animation: 'expand 0.3s ease-in-out',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className={colors.text}>
            {typeIcons[type]}
          </span>
          <span className={`text-xs font-semibold ${colors.text}`}>
            {count}
          </span>
        </div>
      </div>

      {/* Type-specific summary/insight */}
      {getExpandedSummary() && (
        <div className="mb-2 px-1">
          <p className="text-[9px] text-gray-500 dark:text-gray-400 leading-tight">
            {getExpandedSummary()}
          </p>
        </div>
      )}

      {/* Items list */}
      {count === 0 ? (
        <div className="text-[10px] text-gray-500 dark:text-gray-400 text-center py-2">
          No items
        </div>
      ) : (
        <div className="space-y-1.5">
          {visibleItems.map((item, index) => (
            <div
              key={index}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-full ${colors.bg} border ${colors.border.replace('border-l-', 'border-')} hover:shadow-sm hover:scale-[1.02] transition-all cursor-pointer`}
            >
              {/* Icon */}
              <div className={`shrink-0 ${colors.text}`}>
                {item.referenceType === 'file' && (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                {item.referenceType === 'folder' && (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                )}
                {item.referenceType === 'thread' && (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                )}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <div className={`text-[10px] font-medium ${colors.text} truncate`}>
                  {item.name}
                </div>
                {/* Type-specific metadata */}
                {type === 'semantic' && item.relevanceScore !== undefined && (
                  <div className={`text-[9px] ${colors.text} opacity-70`}>
                    {Math.round(item.relevanceScore * 100)}% match
                  </div>
                )}
                {item.sourceBranch && type !== 'semantic' && (
                  <div className={`text-[9px] ${colors.text} opacity-70 truncate`}>
                    {item.sourceBranch}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Overflow indicator */}
          {remainingCount > 0 && (
            <div className={`text-[10px] text-center py-1 ${colors.text} font-medium opacity-70`}>
              +{remainingCount} more
            </div>
          )}
        </div>
      )}
    </div>
  );
}
