import React from 'react';
import { Badge } from '../../components/badge';
import { ScrollArea } from '../../components/scroll-area';

export interface ContextSectionProps {
  /** Section title */
  title: string;
  /** Number of items in section */
  count: number;
  /** Section collapsed/expanded state */
  isExpanded: boolean;
  /** Toggle handler */
  onToggle: () => void;
  /** Children widgets (ContextReference components) */
  children: React.ReactNode;
  /** Section type for styling */
  sectionType: 'explicit' | 'frequently-used' | 'semantic' | 'branch' | 'artifacts' | 'excluded';
  /** Show "+X more" indicator if items overflow */
  hasMore?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  className?: string;
}

export function ContextSection({
  title,
  count,
  isExpanded,
  onToggle,
  children,
  sectionType,
  hasMore = false,
  emptyMessage = 'No items',
  className = '',
}: ContextSectionProps) {
  // Section colors (left border)
  const sectionColors = {
    explicit: 'border-l-primary-600', // Coral
    'frequently-used': 'border-l-orange-600', // Orange
    semantic: 'border-l-purple-600', // Purple
    branch: 'border-l-blue-600', // Blue
    artifacts: 'border-l-green-600', // Green
    excluded: 'border-l-gray-400', // Gray
  };

  const sectionBgColors = {
    explicit: 'bg-primary-50 dark:bg-primary-900/10',
    'frequently-used': 'bg-orange-50 dark:bg-orange-900/10',
    semantic: 'bg-purple-50 dark:bg-purple-900/10',
    branch: 'bg-blue-50 dark:bg-blue-900/10',
    artifacts: 'bg-green-50 dark:bg-green-900/10',
    excluded: 'bg-gray-50 dark:bg-gray-900/10',
  };

  return (
    <div
      className={`border-l-4 ${sectionColors[sectionType]} ${sectionBgColors[sectionType]} rounded-lg transition-all ${className}`}
      data-testid={`context-section-${sectionType}`}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        data-testid="section-header"
      >
        <div className="flex items-center gap-2">
          <span className="text-gray-600 dark:text-gray-400 transition-transform" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
          <span className="font-semibold text-sm uppercase tracking-wide text-gray-700 dark:text-gray-300">
            {title}
          </span>
          <Badge variant="secondary" className="text-xs">
            {count}
          </Badge>
        </div>
      </button>

      {/* Content - Always visible, widgets inherit section collapse state */}
      {count === 0 ? (
        <div
          className="overflow-hidden transition-all duration-300"
          style={{
            maxHeight: isExpanded ? '100px' : '0px',
            opacity: isExpanded ? 1 : 0,
          }}
        >
          <div className="px-3 pb-3 text-sm text-gray-500 dark:text-gray-400">
            {emptyMessage}
          </div>
        </div>
      ) : (
        <div className="px-3 pb-3">
          {/* Horizontal scrollable widget container - always visible */}
          <ScrollArea className="w-full">
            <div className="flex items-center gap-3" data-testid="widget-container">
              {children}
              {hasMore && (
                <div className="shrink-0 flex items-center justify-center h-20 px-4 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  +{hasMore} more
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
