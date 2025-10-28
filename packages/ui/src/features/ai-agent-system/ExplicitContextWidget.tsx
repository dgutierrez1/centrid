import React, { useState, useRef, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/tooltip';
import { ContextReferenceProps } from './ContextReference';
import { ReferencePill } from './ReferencePill';

export interface ExplicitContextWidgetProps {
  /** Context items for explicit references */
  items: Omit<ContextReferenceProps, 'isExpanded'>[];
  /** Collapsed/expanded state */
  isExpanded: boolean;
  /** Add reference handler */
  onAddReference?: () => void;
  /** Reference click handler */
  onReferenceClick?: (item: Omit<ContextReferenceProps, 'isExpanded'>) => void;
  /** Remove reference handler */
  onRemoveReference?: (item: Omit<ContextReferenceProps, 'isExpanded'>) => void;
  className?: string;
}

export function ExplicitContextWidget({
  items,
  isExpanded,
  onAddReference,
  onReferenceClick,
  onRemoveReference,
  className = '',
}: ExplicitContextWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(items.length);
  const [overflowCount, setOverflowCount] = useState(0);

  // Calculate how many items fit in the available space
  useEffect(() => {
    if (!containerRef.current || !isExpanded) {
      setVisibleCount(items.length);
      setOverflowCount(0);
      return;
    }

    const calculateVisibleItems = () => {
      const container = containerRef.current;
      if (!container) return;

      const containerWidth = container.offsetWidth;
      const addButtonWidth = 32; // + button width
      const overflowPillWidth = 60; // "+X" pill width
      const gap = 8; // gap between pills
      const pillWidth = 140; // estimated average pill width

      let availableWidth = containerWidth - addButtonWidth - gap;
      let count = 0;
      let totalWidth = 0;

      for (let i = 0; i < items.length; i++) {
        const itemWidth = pillWidth + gap;
        if (totalWidth + itemWidth <= availableWidth - (i < items.length - 1 ? overflowPillWidth : 0)) {
          count++;
          totalWidth += itemWidth;
        } else {
          break;
        }
      }

      setVisibleCount(Math.max(1, count)); // Show at least 1 item
      setOverflowCount(Math.max(0, items.length - count));
    };

    calculateVisibleItems();

    // Recalculate on window resize
    window.addEventListener('resize', calculateVisibleItems);
    return () => window.removeEventListener('resize', calculateVisibleItems);
  }, [items.length, isExpanded]);

  // Collapsed state: Show individual pills with overflow
  if (!isExpanded) {
    // Show first 1 item as pill, then "+X" if more exist, then "+" button
    const visibleCollapsed = items.slice(0, 1);
    const overflowCollapsed = items.length - 1;
    const hasItems = items.length > 0;

    return (
      <div
        ref={containerRef}
        className={`relative ${hasItems ? 'max-w-[400px]' : 'w-12'} h-12 ${hasItems ? 'px-2' : 'p-0'} py-1.5 bg-primary-50 dark:bg-primary-900/10 rounded-2xl transition-all ${className} flex items-center ${hasItems ? 'gap-2' : 'justify-center'} shrink-0`}
        data-testid="explicit-context-widget-collapsed"
      >
        {/* Individual file pills (first 2) - reusable component */}
        {visibleCollapsed.map((item, index) => (
          <ReferencePill
            key={index}
            referenceType={item.referenceType}
            name={item.name}
            sourceBranch={item.sourceBranch}
            timestamp={item.timestamp}
            onClick={() => onReferenceClick?.(item)}
            onRemove={() => onRemoveReference?.(item)}
          />
        ))}

        {/* Overflow indicator "+X" - matches pill styling */}
        {overflowCollapsed > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="flex items-center justify-center px-3 py-2 bg-primary-100 dark:bg-primary-800/50 hover:bg-primary-200 dark:hover:bg-primary-700/50 rounded-full transition-colors border border-primary-200 dark:border-primary-700 shadow-sm shrink-0"
                >
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    +{overflowCollapsed}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-gray-800 dark:bg-gray-700 text-gray-100 border-gray-700 dark:border-gray-600">
                <div className="max-w-xs">
                  <p className="font-semibold text-sm text-white mb-2">{overflowCollapsed} more reference{overflowCollapsed > 1 ? 's' : ''}</p>
                  <ul className="space-y-1">
                    {items.slice(1, 6).map((item, index) => (
                      <li key={index} className="text-xs text-gray-300 dark:text-gray-300">
                        • {item.name}
                      </li>
                    ))}
                    {items.length > 6 && (
                      <li className="text-xs text-gray-400 dark:text-gray-400 italic">
                        ...and {items.length - 6} more
                      </li>
                    )}
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Add button (always visible) - less prominent, becomes main button when no items */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onAddReference}
                className="flex items-center justify-center w-10 h-10 bg-primary-100 dark:bg-primary-800/30 hover:bg-primary-200 dark:hover:bg-primary-700/40 text-primary-600 dark:text-primary-400 rounded-full transition-colors shrink-0 border border-primary-200 dark:border-primary-700/50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-gray-800 dark:bg-gray-700 text-gray-100 border-gray-700 dark:border-gray-600">
              <p className="text-xs">Add reference</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  // Expanded state: Fixed height with horizontal wrapping pills and overflow
  // Calculate how many pills fit in the container height (96px - 32px padding = 64px available)
  // Each pill row is ~40px (pill height + gap), so we can fit 1-2 rows max
  const maxVisibleExpanded = 8; // Show first 8 pills, then "+X" for overflow
  const visibleExpanded = items.slice(0, maxVisibleExpanded);
  const overflowExpanded = Math.max(0, items.length - maxVisibleExpanded);

  return (
    <div
      ref={containerRef}
      className={`relative max-w-[400px] h-full px-2 py-1.5 bg-primary-50 dark:bg-primary-900/10 rounded-2xl transition-all ${className} flex flex-col`}
      data-testid="explicit-context-widget-expanded"
    >
      {/* Pills wrap horizontally, constrained to container height */}
      <div className="flex flex-wrap gap-2 flex-1 overflow-hidden">
        {/* Show visible pills - reusable component */}
        {visibleExpanded.map((item, index) => (
          <ReferencePill
            key={index}
            referenceType={item.referenceType}
            name={item.name}
            sourceBranch={item.sourceBranch}
            timestamp={item.timestamp}
            onClick={() => onReferenceClick?.(item)}
            onRemove={() => onRemoveReference?.(item)}
          />
        ))}

        {/* Overflow indicator "+X" when too many pills */}
        {overflowExpanded > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="flex items-center justify-center px-3 py-2 bg-primary-100 dark:bg-primary-800/50 hover:bg-primary-200 dark:hover:bg-primary-700/50 rounded-full transition-colors border border-primary-200 dark:border-primary-700 shadow-sm shrink-0 h-10"
                >
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    +{overflowExpanded}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-gray-800 dark:bg-gray-700 text-gray-100 border-gray-700 dark:border-gray-600">
                <div className="max-w-xs">
                  <p className="font-semibold text-sm text-white mb-2">{overflowExpanded} more reference{overflowExpanded > 1 ? 's' : ''}</p>
                  <ul className="space-y-1">
                    {items.slice(maxVisibleExpanded, maxVisibleExpanded + 5).map((item, index) => (
                      <li key={index} className="text-xs text-gray-300 dark:text-gray-300">
                        • {item.name}
                      </li>
                    ))}
                    {items.length > maxVisibleExpanded + 5 && (
                      <li className="text-xs text-gray-400 dark:text-gray-400 italic">
                        ...and {items.length - maxVisibleExpanded - 5} more
                      </li>
                    )}
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Add button (always visible, circular) - less prominent */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onAddReference}
                className="flex items-center justify-center w-10 h-10 bg-primary-100 dark:bg-primary-800/30 hover:bg-primary-200 dark:hover:bg-primary-700/40 text-primary-600 dark:text-primary-400 rounded-full transition-colors border border-primary-200 dark:border-primary-700/50 shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-gray-800 dark:bg-gray-700 text-gray-100 border-gray-700 dark:border-gray-600">
              <p className="text-xs">Add reference</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
