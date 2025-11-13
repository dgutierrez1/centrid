/**
 * MobileMenu Component
 *
 * A slide-out menu for mobile navigation with profile section and navigation items.
 */

'use client';

import * as React from 'react';
import { Button } from './button';
import { cn } from '../lib/utils';

export interface MobileMenuProps {
  /** Whether the menu is open */
  open: boolean;
  /** Callback when menu should close */
  onClose: () => void;
  /** User's initials for avatar */
  userInitials?: string;
  /** User's display name */
  userName?: string;
  /** User's email */
  userEmail?: string;
  /** Navigation items */
  items?: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
  }>;
  /** Additional class names */
  className?: string;
}

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export function MobileMenu({
  open,
  onClose,
  userInitials = 'DG',
  userName = 'User',
  userEmail = 'user@example.com',
  items = [],
  className,
}: MobileMenuProps) {
  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div className={cn(
        'fixed top-0 right-0 bottom-0 w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 z-50 shadow-xl',
        className
      )}>
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Menu</h2>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={onClose}
            >
              <XIcon className="h-5 w-5" />
            </Button>
          </div>

          {/* Profile Section */}
          <div className="flex items-center gap-3 p-3 mb-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{userInitials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{userName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{userEmail}</p>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="space-y-1">
            {items.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  item.onClick();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-gray-900 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {item.icon}
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
