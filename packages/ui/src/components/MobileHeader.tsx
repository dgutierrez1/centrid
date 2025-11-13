/**
 * MobileHeader Component
 *
 * Application header for mobile views with logo and hamburger menu.
 */

'use client';

import * as React from 'react';
import { Button } from './button';
import { cn } from '../lib/utils';

export interface MobileHeaderProps {
  /** App logo (first letter) */
  logo?: string;
  /** App name */
  appName?: string;
  /** Callback when menu button is clicked */
  onMenuClick?: () => void;
  /** Additional class names */
  className?: string;
}

const MenuIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

export function MobileHeader({
  logo = 'C',
  appName = 'App',
  onMenuClick,
  className,
}: MobileHeaderProps) {
  return (
    <div className={cn(
      'bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700',
      className
    )}>
      <div className="px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">{logo}</span>
          </div>
          <span className="text-lg font-semibold text-gray-900 dark:text-white">{appName}</span>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9"
          onClick={onMenuClick}
        >
          <MenuIcon className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
