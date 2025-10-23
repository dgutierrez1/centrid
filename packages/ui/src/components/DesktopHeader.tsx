/**
 * DesktopHeader Component
 *
 * Application header for desktop views with logo, navigation tabs, and user profile.
 */

'use client';

import * as React from 'react';
import { Button } from './button';
import { cn } from '@centrid/shared/utils';

export interface DesktopHeaderProps {
  /** App logo (first letter) */
  logo?: string;
  /** App name */
  appName?: string;
  /** Active navigation tab */
  activeTab?: 'dashboard' | 'documents';
  /** Navigation tab change callback */
  onTabChange?: (tab: 'dashboard' | 'documents') => void;
  /** User's initials for avatar */
  userInitials?: string;
  /** Callback when notification button is clicked */
  onNotificationClick?: () => void;
  /** Callback when profile is clicked */
  onProfileClick?: () => void;
  /** Additional class names */
  className?: string;
}

const BellIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export function DesktopHeader({
  logo = 'C',
  appName = 'App',
  activeTab = 'documents',
  onTabChange,
  userInitials = 'DG',
  onNotificationClick,
  onProfileClick,
  className,
}: DesktopHeaderProps) {
  return (
    <div className={cn(
      'bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700',
      className
    )}>
      <div className="px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">{logo}</span>
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">{appName}</span>
          </div>
          <nav className="flex items-center gap-1">
            <Button
              variant="ghost"
              className={cn(
                "h-9 px-3 text-sm",
                activeTab === 'dashboard'
                  ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
              onClick={() => onTabChange?.('dashboard')}
            >
              Dashboard
            </Button>
            <Button
              variant="ghost"
              className={cn(
                "h-9 px-3 text-sm",
                activeTab === 'documents'
                  ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
              onClick={() => onTabChange?.('documents')}
            >
              Documents
            </Button>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9"
            onClick={onNotificationClick}
          >
            <BellIcon className="h-5 w-5" />
          </Button>
          <div
            className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg px-2 py-1"
            onClick={onProfileClick}
          >
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{userInitials}</span>
            </div>
            <ChevronDownIcon className="h-4 w-4 text-gray-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
