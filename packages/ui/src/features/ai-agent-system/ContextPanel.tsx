import React from 'react';
import { ContextSection } from './ContextSection';
import { ContextReference, ContextReferenceProps } from './ContextReference';

export interface ContextGroup {
  type: 'explicit' | 'frequently-used' | 'semantic' | 'branch' | 'artifacts' | 'excluded';
  title: string;
  items: ContextReferenceProps[];
  isExpanded: boolean;
  emptyMessage?: string;
}

export interface ContextPanelProps {
  /** All context groups with their state */
  contextGroups: ContextGroup[];
  /** Toggle section expansion */
  onToggleSection: (sectionType: string) => void;
  /** Handle file/thread click */
  onItemClick?: (item: ContextReferenceProps) => void;
  /** Handle add to explicit */
  onAddToExplicit?: (item: ContextReferenceProps) => void;
  /** Handle remove */
  onRemove?: (item: ContextReferenceProps) => void;
  /** Handle dismiss */
  onDismiss?: (item: ContextReferenceProps) => void;
  className?: string;
}

export function ContextPanel({
  contextGroups,
  onToggleSection,
  onItemClick,
  onAddToExplicit,
  onRemove,
  onDismiss,
  className = '',
}: ContextPanelProps) {
  return (
    <div
      className={`bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 ${className}`}
      data-testid="context-panel"
    >
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Context
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            What the AI sees
          </span>
        </div>

        <div className="space-y-3">
          {contextGroups.map((group) => (
            <ContextSection
              key={group.type}
              title={group.title}
              count={group.items.length}
              isExpanded={group.isExpanded}
              onToggle={() => onToggleSection(group.type)}
              sectionType={group.type}
              emptyMessage={group.emptyMessage}
            >
              {group.items.map((item, index) => (
                <ContextReference
                  key={index}
                  {...item}
                  isExpanded={group.isExpanded}
                  onClick={() => onItemClick?.(item)}
                  onAddToExplicit={
                    onAddToExplicit && item.priorityTier !== 1
                      ? () => onAddToExplicit(item)
                      : undefined
                  }
                  onRemove={onRemove ? () => onRemove(item) : undefined}
                  onDismiss={onDismiss ? () => onDismiss(item) : undefined}
                />
              ))}
            </ContextSection>
          ))}
        </div>
      </div>
    </div>
  );
}
