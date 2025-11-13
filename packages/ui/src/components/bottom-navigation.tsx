/**
 * BottomNavigation Component
 *
 * Mobile bottom tab navigation for switching between views (e.g., Document/Chat).
 * Follows mobile platform conventions with large touch targets (≥44x44px).
 *
 * Features:
 * - Large touch targets for mobile usability
 * - Active state highlighting
 * - Icon + label tabs
 * - Horizontal tab layout
 */

import React from 'react';
import { cn } from '../lib/utils';

export interface BottomNavigationTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  'data-testid'?: string;
}

export interface BottomNavigationProps {
  tabs: BottomNavigationTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  'data-testid'?: string;
}

/**
 * BottomNavigation - Mobile tab navigation component
 *
 * Provides accessible tab navigation with large touch targets.
 * Commonly used for Document/Chat switching in mobile layouts.
 *
 * @example
 * ```tsx
 * <BottomNavigation
 *   tabs={[
 *     { id: 'document', label: 'Document', icon: <FileTextIcon /> },
 *     { id: 'chat', label: 'Chat', icon: <MessageSquareIcon /> }
 *   ]}
 *   activeTab={activeView}
 *   onTabChange={setActiveView}
 * />
 * ```
 */
export function BottomNavigation({
  tabs,
  activeTab,
  onTabChange,
  className,
  'data-testid': testId = 'bottom-navigation',
}: BottomNavigationProps) {
  return (
    <nav
      data-testid={testId}
      className={cn(
        'flex items-center justify-around',
        'bg-background border-t',
        'safe-area-inset-bottom', // Respect iOS notch/home indicator
        className
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`${tab.id}-panel`}
            data-testid={tab['data-testid'] || `bottom-nav-tab-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex flex-col items-center justify-center gap-1',
              'min-h-[56px] px-4 py-2', // 56px > 44px minimum touch target
              'flex-1', // Equal width tabs
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset',
              isActive
                ? 'text-primary-600 font-medium'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {/* Icon */}
            <span className={cn(
              'text-xl', // Large icon for visibility
              isActive && 'text-primary-600'
            )}>
              {tab.icon}
            </span>

            {/* Label */}
            <span className="text-xs">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
