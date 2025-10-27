import React, { useState } from 'react';
import { Textarea } from '../../components/textarea';
import { Button } from '../../components/button';

export interface ThreadInputProps {
  messageText: string;
  isStreaming?: boolean;
  isLoading?: boolean;
  characterLimit?: number;
  placeholder?: string;
  onChange: (text: string) => void;
  onSendMessage: (text: string) => void;
  onStopStreaming?: () => void;
  className?: string;
}

export function ThreadInput({
  messageText,
  isStreaming = false,
  isLoading = false,
  characterLimit = 10000,
  placeholder = 'Ask a question...',
  onChange,
  onSendMessage,
  onStopStreaming,
  className = '',
}: ThreadInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleSend = () => {
    if (messageText.trim() && !isLoading && !isStreaming) {
      onSendMessage(messageText.trim());
    }
  };

  const handleStop = () => {
    if (onStopStreaming && isStreaming) {
      onStopStreaming();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isDisabled = isLoading || isStreaming;
  const canSend = messageText.trim().length > 0 && !isLoading && !isStreaming;

  return (
    <div
      className={`border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 ${className}`}
      data-testid="thread-input"
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-end gap-3">
          <Textarea
            value={messageText}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={isDisabled}
            className={`resize-none min-h-[44px] max-h-[200px] transition-shadow ${
              isFocused ? 'ring-1 ring-primary-300 dark:ring-primary-700' : ''
            }`}
            rows={1}
            data-testid="message-input"
          />

          {isStreaming ? (
            <Button
              onClick={handleStop}
              variant="outline"
              size="lg"
              className="shrink-0 h-11 w-11 p-0 border-gray-300 dark:border-gray-600 hover:border-error-500 hover:bg-error-50 dark:hover:bg-error-950 text-gray-600 dark:text-gray-400 hover:text-error-600 dark:hover:text-error-400 transition-colors"
              data-testid="stop-button"
              aria-label="Stop streaming"
            >
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <rect x="6" y="6" width="8" height="8" rx="1" />
              </svg>
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              disabled={!canSend}
              variant="ghost"
              size="lg"
              className={`shrink-0 h-11 w-11 p-0 transition-colors ${
                canSend
                  ? 'text-primary-600 dark:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950'
                  : 'text-gray-300 dark:text-gray-700'
              }`}
              data-testid="send-button"
              aria-label="Send message"
            >
              {isLoading ? (
                <svg
                  className="animate-spin w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </Button>
          )}
        </div>

        {(isStreaming || isLoading || messageText.length > 0) && (
          <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
            <span className="text-gray-500 dark:text-gray-400">
              {isStreaming && 'Agent thinking...'}
              {isLoading && !isStreaming && 'Sending...'}
            </span>
            {messageText.length > 0 && (
              <span className={messageText.length > characterLimit * 0.9 ? 'text-warning-500' : ''}>
                {messageText.length}/{characterLimit}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
