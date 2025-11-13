import React, { useEffect, useRef } from 'react';
import type { MessageProps } from './Message';
import { Message } from './Message';
import { MessageStreamSkeleton } from './MessageStreamSkeleton';
import { ScrollArea } from '../../components/scroll-area';

export interface MessageStreamProps {
  messages: MessageProps[];
  isStreaming?: boolean;
  isLoading?: boolean;
  className?: string;
}

const MessageStreamComponent = ({
  messages,
  isStreaming = false,
  isLoading = false,
  className = '',
}: MessageStreamProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasScrolledInitially = useRef(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    // First scroll: instant (no animation) to avoid visible scrolling during mount/rerenders
    // Subsequent scrolls: smooth animation for better UX when new messages arrive
    if (!hasScrolledInitially.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      hasScrolledInitially.current = true;
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isStreaming]);

  // Show loading skeleton when loading
  if (isLoading) {
    return <MessageStreamSkeleton className={className} />;
  }

  return (
    <ScrollArea className={`h-full ${className}`} data-testid="message-stream">
      <div className="w-full flex flex-col gap-4 p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="text-gray-400 dark:text-gray-600 mb-2">
              <svg
                className="w-16 h-16 mx-auto mb-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Start a Conversation
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
              Ask a question, explore an idea, or create a branch to explore multiple approaches in parallel.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <Message key={message.id} {...message} />
            ))}
            {/* Invisible anchor element for auto-scroll */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
    </ScrollArea>
  );
};

// Export memoized component to prevent re-renders when props unchanged
export const MessageStream = React.memo(MessageStreamComponent);
