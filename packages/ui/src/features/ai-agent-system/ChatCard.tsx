import * as React from 'react';
import { cn } from '../../lib/utils';
import { Icons } from '../../components/icon';
import { Badge } from '../../components/badge';

export interface ChatData {
  id: string;
  title: string;
  lastMessagePreview: string;
  lastActivityAt: Date;
  /** Number of context references in this chat */
  contextCount?: number;
  /** Whether chat has unread messages */
  hasUnread?: boolean;
  /** Initialization context type */
  initializationContext?: 'file' | 'folder' | 'new_chat';
}

export interface ChatCardProps extends React.HTMLAttributes<HTMLButtonElement> {
  /** Chat data */
  chat: ChatData;
  /** Whether this chat is currently active/selected */
  isActive?: boolean;
  /** Callback when chat is clicked */
  onClick?: (chatId: string) => void;
}

function getContextIcon(type: ChatData['initializationContext']) {
  switch (type) {
    case 'file':
      return <Icons.file className="h-3 w-3" />;
    case 'folder':
      return <Icons.folder className="h-3 w-3" />;
    case 'new_chat':
      return <Icons.messageSquare className="h-3 w-3" />;
    default:
      return null;
  }
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export const ChatCard = React.forwardRef<HTMLButtonElement, ChatCardProps>(
  ({ chat, isActive, onClick, className, ...props }, ref) => {
    const contextIcon = getContextIcon(chat.initializationContext);
    const timestamp = formatTimestamp(chat.lastActivityAt);

    return (
      <button
        ref={ref}
        onClick={() => onClick?.(chat.id)}
        className={cn(
          'w-full flex items-start gap-3 p-4 rounded-lg border text-left transition-all',
          'hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600',
          isActive
            ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700'
            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700',
          className
        )}
        {...props}
      >
        {/* Icon */}
        <div
          className={cn(
            'shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium',
            isActive
              ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          )}
        >
          <Icons.messageSquare className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Title & Timestamp */}
          <div className="flex items-start justify-between gap-2">
            <h3
              className={cn(
                'font-medium text-sm truncate',
                isActive
                  ? 'text-primary-900 dark:text-primary-100'
                  : 'text-gray-900 dark:text-gray-100'
              )}
            >
              {chat.title}
            </h3>
            <time className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
              {timestamp}
            </time>
          </div>

          {/* Last Message Preview */}
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {chat.lastMessagePreview}
          </p>

          {/* Metadata Footer */}
          <div className="flex items-center gap-2 pt-1">
            {contextIcon && (
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                {contextIcon}
              </div>
            )}
            {chat.contextCount !== undefined && chat.contextCount > 0 && (
              <Badge variant="outline" className="text-xs h-5">
                {chat.contextCount} context{chat.contextCount !== 1 ? 's' : ''}
              </Badge>
            )}
            {chat.hasUnread && (
              <div className="ml-auto shrink-0 h-2 w-2 rounded-full bg-primary-500" />
            )}
          </div>
        </div>
      </button>
    );
  }
);
ChatCard.displayName = 'ChatCard';
