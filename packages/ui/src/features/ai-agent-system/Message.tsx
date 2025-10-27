import React from 'react';
import { AgentStreamMessage, type AgentEvent } from './AgentStreamMessage';

export interface MessageProps {
  role: 'user' | 'assistant';
  content?: string;
  events?: AgentEvent[];
  timestamp: Date;
  isStreaming?: boolean;
  streamingBuffer?: string;
  className?: string;
}

export function Message({
  role,
  content,
  events,
  timestamp,
  isStreaming = false,
  streamingBuffer = '',
  className = '',
}: MessageProps) {
  const displayContent = isStreaming ? streamingBuffer : content;
  const isUser = role === 'user';

  // If this is an assistant message with events, use AgentStreamMessage
  if (role === 'assistant' && events && events.length > 0) {
    return (
      <AgentStreamMessage
        events={events}
        timestamp={timestamp}
        isStreaming={isStreaming}
        autoCollapseOldTools={true}
        className={className}
      />
    );
  }

  return (
    <div
      className={`flex gap-3 items-start animate-fade-in ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      } ${className}`}
      data-testid={`message-${role}`}
    >
      {/* Avatar */}
      <div
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
          isUser
            ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
        }`}
        aria-label={isUser ? 'User avatar' : 'AI Agent avatar'}
      >
        {isUser ? (
          // User icon
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        ) : (
          // AI Agent icon
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
            <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
          </svg>
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 min-w-0 ${isUser ? 'max-w-[80%]' : ''}`}>
        {/* Header */}
        <div className={`flex items-center gap-2 mb-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {isUser ? 'You' : 'AI Agent'}
          </span>
          {timestamp && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* Message Box */}
        <div
          className={`rounded-lg px-3 py-2 ${
            isUser
              ? 'bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800/50'
              : 'bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 shadow-sm'
          }`}
        >
          <div
            className={`prose prose-sm max-w-none ${
              isUser
                ? 'prose-primary dark:prose-invert text-gray-900 dark:text-gray-100'
                : 'prose-gray dark:prose-invert text-gray-900 dark:text-gray-100'
            }`}
          >
            {displayContent}
            {isStreaming && <span className="animate-pulse ml-1">▊</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
