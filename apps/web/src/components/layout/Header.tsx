// Centrid AI Filesystem - Header Component
// Version: 3.1 - Supabase Plus MVP Architecture
// Pure presentational component - no logic or integrations

import { 
  Bars3Icon,
  BellIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';

interface HeaderProps {
  activeView: string;
  theme: 'light' | 'dark' | 'system';
  unreadNotificationsCount: number;
  userInitial: string;
  onToggleSidebar: () => void;
  onToggleTheme: () => void;
  onNotificationsClick: () => void;
}

export default function Header({
  activeView,
  theme,
  unreadNotificationsCount,
  userInitial,
  onToggleSidebar,
  onToggleTheme,
  onNotificationsClick,
}: HeaderProps) {
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
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side */}
        <div className="flex items-center">
          {/* Mobile menu button */}
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>

          {/* Desktop sidebar toggle */}
          <button
            onClick={onToggleSidebar}
            className="hidden lg:flex p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>

          {/* Current view title */}
          <h2 className="ml-4 text-lg font-medium text-gray-900 dark:text-white capitalize">
            {activeView}
          </h2>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Theme toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            title={`Current theme: ${theme}`}
          >
            <ThemeIcon className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <button
            onClick={onNotificationsClick}
            className="relative p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <BellIcon className="w-5 h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* User avatar placeholder */}
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
