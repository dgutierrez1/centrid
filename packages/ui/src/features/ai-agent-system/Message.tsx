import React from 'react';
import { Card } from '../../components/card';
import { Badge } from '../../components/badge';

export interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  streamingBuffer?: string;
  className?: string;
}

export function Message({
  role,
  content,
  timestamp,
  isStreaming = false,
  streamingBuffer = '',
  className = '',
}: MessageProps) {
  const displayContent = isStreaming ? streamingBuffer : content;
  const isUser = role === 'user';

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in ${className}`}
      data-testid={`message-${role}`}
    >
      <Card
        className={`max-w-[80%] ${
          isUser
            ? 'bg-primary-600 text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
        } p-4`}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <Badge
            variant={isUser ? 'default' : 'secondary'}
            className={`${isUser ? 'bg-primary-700' : 'bg-gray-200 dark:bg-gray-700'} text-xs`}
          >
            {isUser ? 'You' : 'AI Agent'}
          </Badge>
          <span className="text-xs opacity-70">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none">
          {displayContent}
          {isStreaming && <span className="animate-pulse ml-1">▊</span>}
        </div>
      </Card>
    </div>
  );
}
