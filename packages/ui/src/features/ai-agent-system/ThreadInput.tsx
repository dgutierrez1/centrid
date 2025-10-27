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
        <div className="flex items-end gap-2">
          <Textarea
            value={messageText}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={isDisabled}
            className={`resize-none min-h-[44px] max-h-[200px] ${
              isFocused ? 'ring-2 ring-primary-500' : ''
            }`}
            rows={1}
            data-testid="message-input"
          />

          {isStreaming ? (
            <Button
              onClick={handleStop}
              variant="destructive"
              size="lg"
              className="shrink-0 h-11 w-11 p-0"
              data-testid="stop-button"
              aria-label="Stop streaming"
            >
              <svg
                className="w-5 h-5"
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
              size="lg"
              className="shrink-0 h-11 w-11 p-0 bg-primary-600 hover:bg-primary-700"
              data-testid="send-button"
              aria-label="Send message"
            >
              {isLoading ? (
                <svg
                  className="animate-spin w-5 h-5"
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
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            {isStreaming && 'Agent thinking...'}
            {isLoading && !isStreaming && 'Sending...'}
          </span>
          <span>
            {messageText.length}/{characterLimit}
          </span>
        </div>
      </div>
    </div>
  );
}
