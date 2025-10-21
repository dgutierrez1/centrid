// Centrid AI Filesystem - Notification Panel Component
// Version: 3.1 - Supabase Plus MVP Architecture
// Pure presentational component - no logic or integrations

import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/solid';
import clsx from 'clsx';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  read: boolean;
}

interface NotificationPanelProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onClearAll: () => void;
}

export default function NotificationPanel({
  notifications,
  onMarkAsRead,
  onDismiss,
  onClearAll,
}: NotificationPanelProps) {
  if (notifications.length === 0) {
    return null;
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return CheckCircleIcon;
      case 'error':
        return ExclamationCircleIcon;
      case 'warning':
        return ExclamationTriangleIcon;
      case 'info':
        return InformationCircleIcon;
      default:
        return InformationCircleIcon;
    }
  };

  const getNotificationClasses = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700';
      case 'error':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700';
      case 'info':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700';
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700';
    }
  };

  const getIconClasses = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-500 dark:text-green-400';
      case 'error':
        return 'text-red-500 dark:text-red-400';
      case 'warning':
        return 'text-yellow-500 dark:text-yellow-400';
      case 'info':
        return 'text-blue-500 dark:text-blue-400';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.slice(0, 5).map((notification) => {
        const Icon = getNotificationIcon(notification.type);
        
        return (
          <div
            key={notification.id}
            className={clsx(
              'p-4 rounded-lg border shadow-lg transition-all duration-300 animate-slide-down',
              getNotificationClasses(notification.type)
            )}
          >
            <div className="flex">
              <div className="flex-shrink-0">
                <Icon className={clsx('w-5 h-5', getIconClasses(notification.type))} />
              </div>
              
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {notification.title}
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  {notification.message}
                </p>
              </div>
              
              <div className="ml-4 flex-shrink-0 flex">
                {!notification.read && (
                  <button
                    onClick={() => onMarkAsRead(notification.id)}
                    className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
                    title="Mark as read"
                  >
                    <CheckIcon className="w-4 h-4" />
                  </button>
                )}
                
                <button
                  onClick={() => onDismiss(notification.id)}
                  className="ml-2 inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
                  title="Dismiss"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Clear all button when there are many notifications */}
      {notifications.length > 3 && (
        <div className="flex justify-end">
          <button
            onClick={onClearAll}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
