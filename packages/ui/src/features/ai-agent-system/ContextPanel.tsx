import React from 'react';
import { ScrollArea } from '../../components/scroll-area';
import { ContextTypeWidget } from './ContextTypeWidget';
import { ExplicitContextWidget } from './ExplicitContextWidget';
import type { ContextReferenceProps } from './ContextReference';

export interface ContextGroup {
  type: 'explicit' | 'semantic' | 'branch' | 'artifacts';
  title: string;
  /** Context items without isExpanded (they inherit from section) */
  items: Omit<ContextReferenceProps, 'isExpanded'>[];
  emptyMessage?: string;
}

export interface ContextPanelProps {
  /** All context groups */
  contextGroups: ContextGroup[];
  /** Unified collapse state for entire context panel */
  isExpanded: boolean;
  /** Toggle panel expansion */
  onTogglePanel: () => void;
  /** Handle widget click */
  onWidgetClick?: (type: string) => void;
  /** Add explicit reference handler */
  onAddReference?: () => void;
  /** Reference click handler */
  onReferenceClick?: (item: Omit<ContextReferenceProps, 'isExpanded'>) => void;
  /** Remove reference handler */
  onRemoveReference?: (item: Omit<ContextReferenceProps, 'isExpanded'>) => void;
  className?: string;
}

export function ContextPanel({
  contextGroups,
  isExpanded,
  onTogglePanel,
  onWidgetClick,
  onAddReference,
  onReferenceClick,
  onRemoveReference,
  className = '',
}: ContextPanelProps) {
  // Calculate total items across all groups
  const totalCount = (contextGroups || []).reduce((sum, group) => sum + group.items.length, 0);

  return (
    <div
      className={`bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mb-4 ${className}`}
      data-testid="context-panel"
    >
      {/* Unified Context Header */}
      <button
        onClick={onTogglePanel}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        data-testid="context-header"
      >
        <div className="flex items-center gap-3">
          <span
            className="text-gray-600 dark:text-gray-400 transition-transform"
            style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            References
          </h3>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium">
            {totalCount}
          </span>
        </div>
        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
          Information used
        </span>
      </button>

      {/* Context Type Widgets - Always visible, widgets change their display based on isExpanded */}
      <div className={`px-4 pb-4 transition-all duration-300 ${isExpanded ? 'h-[120px]' : 'h-[32px]'}`}>
        {isExpanded ? (
          // Expanded: All widgets aligned horizontally with fixed height (3.75x collapsed: 120px vs 32px)
          <ScrollArea className="w-full h-full">
            <div className="flex items-start gap-3 h-full">
              {(contextGroups || []).map((group) => {
                if (group.type === 'explicit') {
                  return (
                    <ExplicitContextWidget
                      key={group.type}
                      items={group.items}
                      isExpanded={isExpanded}
                      onAddReference={onAddReference}
                      onReferenceClick={onReferenceClick}
                      onRemoveReference={onRemoveReference}
                    />
                  );
                }
                return (
                  <ContextTypeWidget
                    key={group.type}
                    type={group.type}
                    title={group.title}
                    items={group.items}
                    isExpanded={isExpanded}
                    onClick={() => onWidgetClick?.(group.type)}
                  />
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          // Collapsed: All widgets on same row (32px height)
          <ScrollArea className="w-full">
            <div className="flex items-center gap-3" data-testid="context-type-widgets">
              {(contextGroups || []).map((group) => {
                if (group.type === 'explicit') {
                  return (
                    <ExplicitContextWidget
                      key={group.type}
                      items={group.items}
                      isExpanded={isExpanded}
                      onAddReference={onAddReference}
                      onReferenceClick={onReferenceClick}
                      onRemoveReference={onRemoveReference}
                    />
                  );
                }
                return (
                  <ContextTypeWidget
                    key={group.type}
                    type={group.type}
                    title={group.title}
                    items={group.items}
                    isExpanded={isExpanded}
                    onClick={() => onWidgetClick?.(group.type)}
                  />
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
