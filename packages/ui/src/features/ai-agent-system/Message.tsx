import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { ToolCallWidget } from './ToolCallWidget';
import type { ContentBlock, TextBlock, ToolUseBlock, ToolResultBlock } from '../../types/graphql';
import type { PendingToolCall } from '../../types/agent';

export interface MessageProps {
  id: string; // Unique message ID for React keys
  role: 'user' | 'assistant';
  content?: ContentBlock[] | string; // ContentBlock[] for new messages, string for legacy/user messages
  timestamp: string; // ISO 8601 string from GraphQL
  isStreaming?: boolean;
  isRequestLoading?: boolean;
  className?: string;
  // Tool approval props (optional - only present when tool requires approval)
  pendingToolCall?: PendingToolCall;
  onApproveToolCall?: () => void;
  onRejectToolCall?: (reason?: string) => void;
}

const MessageComponent = ({
  role,
  content,
  timestamp,
  isStreaming = false,
  className = '',
  pendingToolCall,
  onApproveToolCall,
  onRejectToolCall,
}: MessageProps) => {
  const isUser = role === 'user';

  // Always use content (no streamingBuffer)
  const displayContent = content;

  // Backwards compatibility: wrap string content in text block
  // Memoize to avoid recreating array on every render
  const contentBlocks: ContentBlock[] = React.useMemo(() => {
    return Array.isArray(displayContent)
      ? displayContent
      : [{ type: 'text', text: displayContent || '' }];
  }, [displayContent]);

  return (
    <div
      className={`w-full flex gap-3 animate-fade-in ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      } ${className}`}
      data-testid={`message-${role}`}
    >
      {/* Avatar - two states: streaming (bouncing dots) or done (minimal sparkle) */}
      <div
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
          isUser
            ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
            : isStreaming
              ? 'bg-primary-100 dark:bg-primary-900/50 ring-2 ring-primary-500/50'
              : 'bg-gray-100 dark:bg-gray-800'
        }`}
        aria-label={isUser ? 'User avatar' : 'AI Agent avatar'}
      >
        {isUser ? (
          // User icon
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        ) : isStreaming ? (
          // AI Agent streaming - three bouncing dots
          <div className="flex gap-[3px]">
            <span className="w-1 h-1 bg-primary-600 dark:bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }}></span>
            <span className="w-1 h-1 bg-primary-600 dark:bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '1s' }}></span>
            <span className="w-1 h-1 bg-primary-600 dark:bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1s' }}></span>
          </div>
        ) : (
          // AI Agent completed - minimal sparkle icon
          <svg className="w-3.5 h-3.5 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 min-w-0 ${isUser ? 'max-w-[80%]' : ''}`}>
        {/* Message Box with shimmer border when streaming (assistant only) */}
        <div
          className={`w-full rounded-lg relative ${
            isUser
              ? 'bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800/50 px-3 py-2'
              : isStreaming
                ? 'bg-gradient-to-r from-primary-600/30 via-primary-300 to-primary-600/30 dark:from-primary-400/30 dark:via-primary-200 dark:to-primary-400/30 animate-shimmer bg-[length:200%_100%] p-[3px]'
                : 'bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 shadow-sm px-3 py-2'
          }`}
        >
          {!isUser && isStreaming && (
            <div className="absolute inset-[3px] bg-white dark:bg-gray-800/50 rounded-lg" />
          )}
          <div className={!isUser && isStreaming ? 'relative z-10 px-3 py-2' : ''}>
            {/* Render content blocks */}
            {contentBlocks.map((block, index) => {
              if (block.type === 'text') {
                // Display full text immediately (no streaming animation)
                const textBlock = block as TextBlock;
                const textToDisplay = textBlock.text;

                return (
                  <div
                    key={index}
                    className={`prose prose-sm max-w-none ${
                      isUser
                        ? 'prose-primary dark:prose-invert text-gray-900 dark:text-gray-100'
                        : 'prose-gray dark:prose-invert text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                    >
                      {textToDisplay}
                    </ReactMarkdown>
                    {/* Streaming cursor - only show on last text block when streaming */}
                    {!isUser && isStreaming && index === contentBlocks.length - 1 && (
                      <span className="inline-block ml-1.5 w-[3px] h-5 bg-gradient-to-b from-primary-400 via-primary-500 to-primary-600 animate-pulse relative top-[3px] rounded-full shadow-lg shadow-primary-500/60 ring-1 ring-primary-300/30"></span>
                    )}
                  </div>
                );
              }

              if (block.type === 'tool_use') {
                const toolBlock = block as ToolUseBlock;

                // Skip if required fields are missing (null handling)
                if (!toolBlock.id || !toolBlock.name) {
                  return null;
                }

                // NEW: Check if this tool_use has a corresponding tool_result block
                // If tool_result exists, the tool has been executed and we don't show the widget
                const toolResult = contentBlocks.find(
                  (b) => b.type === 'tool_result' &&
                         (b as ToolResultBlock).tool_use_id === toolBlock.id
                ) as ToolResultBlock | undefined;

                // Hide widget if tool has been executed (has tool_result)
                if (toolResult) {
                  return null; // Don't render widget for completed tools
                }

                // Tool is pending if no tool_result exists AND matches pending tool call
                const isPendingApproval =
                  !toolResult &&
                  pendingToolCall?.toolCallId === toolBlock.id;

                return (
                  <ToolCallWidget
                    key={toolBlock.id}
                    id={toolBlock.id}
                    name={toolBlock.name}
                    input={toolBlock.input as Record<string, any>}
                    status="pending"
                    onApprove={isPendingApproval ? onApproveToolCall : undefined}
                    onReject={isPendingApproval ? onRejectToolCall : undefined}
                  />
                );
              }

              if (block.type === 'tool_result') {
                const toolResultBlock = block as ToolResultBlock;

                return (
                  <div
                    key={`result-${toolResultBlock.tool_use_id}`}
                    className="my-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {toolResultBlock.is_error ? '❌ Tool execution failed' : '✅ Tool executed successfully'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap">
                      {toolResultBlock.content}
                    </div>
                  </div>
                );
              }

              return null;
            })}

            {/* Timestamp - relocated to bottom right of message box */}
            {timestamp && (
              <div className={`flex mt-2 pt-1 border-t border-gray-100 dark:border-gray-700/50 ${isUser ? 'justify-start' : 'justify-end'}`}>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Export memoized component to prevent re-renders when props unchanged
export const Message = React.memo(MessageComponent);
