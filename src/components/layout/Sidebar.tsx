// Centrid AI Filesystem - Sidebar Component
// Version: 3.1 - Supabase Plus MVP Architecture
// Pure presentational component - no logic or integrations

import { 
  DocumentTextIcon, 
  ChatBubbleLeftRightIcon, 
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const navigationItems = [
  {
    id: 'documents' as const,
    name: 'Documents',
    icon: DocumentTextIcon,
  },
  {
    id: 'agents' as const,
    name: 'AI Agents',
    icon: ChatBubbleLeftRightIcon,
  },
  {
    id: 'search' as const,
    name: 'Search',
    icon: MagnifyingGlassIcon,
  },
  {
    id: 'settings' as const,
    name: 'Settings',
    icon: Cog6ToothIcon,
  },
];

interface SidebarProps {
  isOpen: boolean;
  activeView: string;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  userName: string | null;
  userPlan: string | null;
  showUser: boolean;
  onClose: () => void;
  onNavigate: (view: 'documents' | 'agents' | 'search' | 'settings') => void;
}

export default function Sidebar({
  isOpen,
  activeView,
  connectionStatus,
  userName,
  userPlan,
  showUser,
  onClose,
  onNavigate,
}: SidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <div className={clsx(
        'sidebar',
        isOpen ? 'sidebar-open' : 'sidebar-closed'
      )}>
        <div className="flex flex-col h-full">
          {/* Logo and close button */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Centrid
            </h1>
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={clsx(
                  'nav-item w-full',
                  activeView === item.id && 'nav-item-active'
                )}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </button>
            ))}
          </nav>

          {/* User info and connection status */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            {/* Connection Status */}
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
              <div className={clsx(
                'w-2 h-2 rounded-full mr-2',
                connectionStatus === 'connected' ? 'bg-green-500' :
                connectionStatus === 'reconnecting' ? 'bg-yellow-500' :
                'bg-red-500'
              )} />
              {connectionStatus === 'connected' ? 'Connected' :
               connectionStatus === 'reconnecting' ? 'Connecting...' :
               'Disconnected'}
            </div>

            {/* User Profile */}
            {showUser && (
              <div className="text-sm">
                <div className="font-medium text-gray-900 dark:text-white">
                  {userName || 'User'}
                </div>
                <div className="text-gray-500 dark:text-gray-400">
                  {userPlan || 'free'} plan
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
