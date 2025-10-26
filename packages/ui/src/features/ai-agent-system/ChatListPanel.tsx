import * as React from 'react';
import { cn } from '../../lib/utils';
import { ChatCard, ChatData } from './ChatCard';
import { Button } from '../../components/button';
import { Icons } from '../../components/icon';
import { Input } from '../../components/input';
import { ScrollArea } from '../../components/scroll-area';
import { Skeleton } from '../../components/skeleton';

export interface ChatListPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of chats to display */
  chats: ChatData[];
  /** ID of currently active chat */
  activeChatId?: string;
  /** Callback when chat is selected */
  onSelectChat?: (chatId: string) => void;
  /** Callback when new chat button is clicked */
  onNewChat?: () => void;
  /** Whether chats are loading */
  isLoading?: boolean;
  /** Search query for filtering chats */
  searchQuery?: string;
  /** Callback when search query changes */
  onSearchChange?: (query: string) => void;
}

const ChatListSkeleton: React.FC = () => (
  <div className="space-y-3 p-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

export const ChatListPanel = React.forwardRef<HTMLDivElement, ChatListPanelProps>(
  (
    {
      chats,
      activeChatId,
      onSelectChat,
      onNewChat,
      isLoading,
      searchQuery = '',
      onSearchChange,
      className,
      ...props
    },
    ref
  ) => {
    const filteredChats = React.useMemo(() => {
      if (!searchQuery.trim()) return chats;

      const query = searchQuery.toLowerCase();
      return chats.filter(
        (chat) =>
          chat.title.toLowerCase().includes(query) ||
          chat.lastMessagePreview.toLowerCase().includes(query)
      );
    }, [chats, searchQuery]);

    return (
      <div
        ref={ref}
        className={cn('flex flex-col h-full bg-white dark:bg-gray-900', className)}
        {...props}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Chats
            </h2>
            <Button onClick={onNewChat} size="sm" className="gap-2">
              <Icons.plus className="h-4 w-4" />
              <span>New Chat</span>
            </Button>
          </div>

          {/* Search */}
          {onSearchChange && (
            <div className="relative">
              <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          )}
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <ChatListSkeleton />
          ) : filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              {searchQuery ? (
                <>
                  <Icons.search className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No chats found
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs">
                    Try adjusting your search query
                  </p>
                </>
              ) : (
                <>
                  <Icons.messageSquare className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No chats yet
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs mb-4">
                    Start a new chat to begin exploring your files with AI
                  </p>
                  {onNewChat && (
                    <Button onClick={onNewChat} variant="outline" className="gap-2">
                      <Icons.plus className="h-4 w-4" />
                      <span>Create your first chat</span>
                    </Button>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {filteredChats.map((chat) => (
                <ChatCard
                  key={chat.id}
                  chat={chat}
                  isActive={chat.id === activeChatId}
                  onClick={onSelectChat}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer Stats (optional) */}
        {!isLoading && chats.length > 0 && (
          <div className="shrink-0 border-t border-gray-200 dark:border-gray-700 p-3 text-center text-xs text-gray-500 dark:text-gray-400">
            {filteredChats.length} of {chats.length} chat{chats.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    );
  }
);
ChatListPanel.displayName = 'ChatListPanel';
