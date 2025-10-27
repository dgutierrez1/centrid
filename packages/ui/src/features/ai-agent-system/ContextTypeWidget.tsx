import React, { useState } from 'react';
import { Badge } from '../../components/badge';
import { ContextReferenceProps } from './ContextReference';

export interface ContextTypeWidgetProps {
  /** Context type */
  type: 'explicit' | 'frequently-used' | 'semantic' | 'branch' | 'artifacts' | 'excluded';
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
  items,
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

  // Type-specific colors
  const typeColors = {
    explicit: {
      border: 'border-l-primary-600',
      bg: 'bg-primary-50 dark:bg-primary-900/10',
      badge: 'bg-primary-600 text-white',
      text: 'text-primary-700 dark:text-primary-300',
    },
    'frequently-used': {
      border: 'border-l-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-900/10',
      badge: 'bg-orange-600 text-white',
      text: 'text-orange-700 dark:text-orange-300',
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
    excluded: {
      border: 'border-l-gray-400',
      bg: 'bg-gray-50 dark:bg-gray-900/10',
      badge: 'bg-gray-600 text-white',
      text: 'text-gray-700 dark:text-gray-300',
    },
  };

  const colors = typeColors[type];

  // Type-specific icons
  const typeIcons = {
    explicit: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    'frequently-used': (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
    excluded: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
  };

  // Collapsed state: Compact pill with icon and count + tooltip
  if (!isExpanded) {
    return (
      <div
        className="relative"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div
          className={`relative h-7 px-2 ${colors.bg} cursor-pointer hover:opacity-80 transition-all duration-300 ease-in-out shrink-0 rounded-full border ${colors.border} shadow-sm ${className}`}
          onClick={onClick}
          data-testid={`context-widget-${type}-collapsed`}
          style={{
            animation: 'collapse 0.3s ease-in-out',
          }}
        >
          <div className="flex items-center h-full gap-1.5">
            <span className={colors.text}>
              {typeIcons[type]}
            </span>
            <span className={`text-xs font-semibold ${colors.text}`}>
              {count}
            </span>
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

  // Expanded state: Show top items + overflow (narrower width: 140px)
  return (
    <div
      className={`relative min-h-[80px] w-[140px] p-2 border-l-4 ${colors.border} ${colors.bg} cursor-pointer hover:shadow-md transition-all duration-300 ease-in-out shrink-0 rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}
      onClick={onClick}
      data-testid={`context-widget-${type}-expanded`}
      title={title}
      style={{
        animation: 'expand 0.3s ease-in-out',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className={colors.text}>
            {typeIcons[type]}
          </span>
          <span className={`text-xs font-semibold ${colors.text}`}>
            {count}
          </span>
        </div>
      </div>

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
              className="flex items-center gap-1.5 p-1.5 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            >
              {/* Icon */}
              <div className="shrink-0 text-gray-500 dark:text-gray-400">
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
                <div className="text-[10px] font-medium text-gray-900 dark:text-white truncate">
                  {item.name}
                </div>
                {/* Type-specific metadata */}
                {type === 'semantic' && item.relevanceScore !== undefined && (
                  <div className="text-[9px] text-gray-500 dark:text-gray-400">
                    {Math.round(item.relevanceScore * 100)}% match
                  </div>
                )}
                {item.sourceBranch && type !== 'semantic' && (
                  <div className="text-[9px] text-gray-500 dark:text-gray-400 truncate">
                    {item.sourceBranch}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Overflow indicator */}
          {remainingCount > 0 && (
            <div className="text-[10px] text-center py-1 text-gray-600 dark:text-gray-400 font-medium">
              +{remainingCount} more
            </div>
          )}
        </div>
      )}
    </div>
  );
}
