/**
 * MobileLayout Component
 *
 * Single-panel mobile layout that renders one view at a time (document or chat).
 * Used as a primitive layout component for mobile workspaces.
 *
 * Features:
 * - Single-panel focus view
 * - Vertical stacking layout
 * - Full-height mobile optimization
 * - Touch-friendly spacing
 */

import React from 'react';
import { cn } from '@centrid/shared/utils';

export interface MobileLayoutProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  'data-testid'?: string;
}

/**
 * MobileLayout - Single-panel mobile layout primitive
 *
 * Provides full-height vertical layout optimized for mobile devices.
 * Renders header, main content area, and footer (typically bottom navigation).
 */
export function MobileLayout({
  children,
  className,
  header,
  footer,
  'data-testid': testId = 'mobile-layout',
}: MobileLayoutProps) {
  return (
    <div
      data-testid={testId}
      className={cn(
        'flex flex-col h-screen w-full bg-background',
        'overflow-hidden', // Prevent page scroll, let panels scroll
        className
      )}
    >
      {/* Header (optional) */}
      {header && (
        <div className="flex-shrink-0">
          {header}
        </div>
      )}

      {/* Main content area - single panel */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>

      {/* Footer (typically bottom navigation) */}
      {footer && (
        <div className="flex-shrink-0 border-t">
          {footer}
        </div>
      )}
    </div>
  );
}
