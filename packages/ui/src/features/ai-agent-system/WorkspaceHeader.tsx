import React from 'react';
import { cn } from '../../lib/utils';

export interface WorkspaceHeaderProps {
  /** Sidebar toggle button click handler */
  onToggleSidebar?: () => void;
  /** Theme toggle button click handler */
  onToggleTheme?: () => void;
  /** Notifications button click handler */
  onNotificationsClick?: () => void;
  /** Current theme */
  theme?: 'light' | 'dark' | 'system';
  /** Number of unread notifications */
  unreadNotificationsCount?: number;
  /** User initial for avatar */
  userInitial?: string;
  /** Active view name */
  activeView?: string;
  className?: string;
}

// Simple icon components (inline SVGs to avoid external dependencies)
function Bars3Icon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  );
}

function ComputerDesktopIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

export function WorkspaceHeader({
  onToggleSidebar,
  onToggleTheme,
  onNotificationsClick,
  theme = 'light',
  unreadNotificationsCount = 0,
  userInitial = 'U',
  activeView = 'Workspace',
  className,
}: WorkspaceHeaderProps) {
  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return SunIcon;
      case 'dark':
        return MoonIcon;
      case 'system':
        return ComputerDesktopIcon;
      default:
        return SunIcon;
    }
  };

  const ThemeIcon = getThemeIcon();

  return (
    <header className={cn('bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700', className)}>
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side */}
        <div className="flex items-center">
          {/* Sidebar toggle (mobile only) */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle sidebar"
            >
              <Bars3Icon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          )}

          {/* Current view title */}
          <h2 className="ml-4 text-lg font-medium text-gray-900 dark:text-white capitalize">
            {activeView}
          </h2>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Theme toggle */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={`Current theme: ${theme}`}
              aria-label="Toggle theme"
            >
              <ThemeIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          )}

          {/* Notifications */}
          {onNotificationsClick && (
            <button
              onClick={onNotificationsClick}
              className="relative p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Notifications"
            >
              <BellIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>
          )}

          {/* User avatar */}
          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {userInitial}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
