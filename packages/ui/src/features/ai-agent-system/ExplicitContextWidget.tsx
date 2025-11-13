import React, { useState, useRef, useEffect } from 'react';
import type { ContextReferenceProps } from './ContextReference';
import { ReferencePill } from './ReferencePill';
import { AddReferenceButton } from './AddReferenceButton';
import { OverflowButton } from './OverflowButton';

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

  // Calculate how many items fit in the available space
  useEffect(() => {
    if (!containerRef.current) {
      setVisibleCount(items.length);
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

      const availableWidth = containerWidth - addButtonWidth - gap;
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
    };

    calculateVisibleItems();

    // Recalculate on window resize
    window.addEventListener('resize', calculateVisibleItems);
    return () => window.removeEventListener('resize', calculateVisibleItems);
  }, [items.length, isExpanded]);

  // Detect if overflow exists (determines if expansion is needed)
  const hasOverflow = items.length > visibleCount;

  // Calculate visible items - expanded shows more items (up to 12) due to increased width
  // Collapsed shows calculated fit based on container width
  const maxVisibleExpanded = 12; // More items visible when expanded due to increased max-width
  const visibleItems = isExpanded
    ? items.slice(0, maxVisibleExpanded) // Expanded: show up to 12 pills
    : items.slice(0, visibleCount); // Collapsed: calculated fit

  const overflowCount = isExpanded
    ? Math.max(0, items.length - maxVisibleExpanded)
    : Math.max(0, items.length - visibleCount);

  const overflowStartIndex = isExpanded ? maxVisibleExpanded : visibleCount;

  // Same height for both states - expanded just has more width
  const buttonSize = 'sm'; // Always sm for consistency across all states

  // Max width increases when expanded to show more items
  const maxWidthClass = isExpanded ? 'max-w-[600px]' : 'max-w-[400px]';

  return (
    <div
      ref={containerRef}
      className={`relative w-fit min-w-9 ${maxWidthClass} p-1 h-9 bg-primary-50 dark:bg-primary-900/10 rounded-2xl border border-primary-200 dark:border-primary-700 border-l-4 border-l-primary-600 transition-all duration-300 ${className} flex items-center overflow-hidden shrink-0`}
      data-testid={`explicit-context-widget-${isExpanded ? 'expanded' : 'collapsed'}`}
      style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
    >
      {/* Content container - same layout for both states, just more space when expanded */}
      <div
        className="flex items-center justify-center gap-2.5 flex-1 overflow-hidden"
      >
        {/* Add button (always first) */}
        <AddReferenceButton
          onClick={onAddReference}
          size={buttonSize}
        />

        {/* Individual file pills */}
        {visibleItems.map((item, index) => (
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

        {/* Overflow indicator "+X" */}
        <OverflowButton
          count={overflowCount}
          items={items}
          startIndex={overflowStartIndex}
        />
      </div>
    </div>
  );
}
