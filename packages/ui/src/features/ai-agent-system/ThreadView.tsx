import React from 'react';
import type { Branch } from './BranchSelector';
import { BranchSelector } from './BranchSelector';
import { MessageStream } from './MessageStream';
import type { MessageProps } from './Message';
import type { ContextGroup } from './ContextPanel';
import { ContextPanel } from './ContextPanel';
import type { ContextReferenceProps } from './ContextReference';
import { ThreadInput } from './ThreadInput';

export interface ThreadViewProps {
  /** Current branch */
  currentBranch: Branch | null;
  /** All branches */
  branches: Branch[];
  /** Messages in current thread */
  messages: MessageProps[];
  /** Context groups */
  contextGroups: ContextGroup[];
  /** Current message text */
  messageText: string;
  /** Streaming state */
  isStreaming?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Show branch selector (typically false on desktop with sidebar, true on mobile) */
  showBranchSelector?: boolean;
  /** Context panel expanded state */
  isContextExpanded?: boolean;
  /** Callbacks */
  onSelectBranch: (branchId: string) => void;
  onToggleContextPanel: () => void;
  onMessageChange: (text: string) => void;
  onSendMessage: (text: string) => void;
  onStopStreaming?: () => void;
  onWidgetClick?: (type: string) => void;
  onBranchThread?: () => void;
  onAddReference?: () => void;
  onReferenceClick?: (item: Omit<ContextReferenceProps, 'isExpanded'>) => void;
  onRemoveReference?: (item: Omit<ContextReferenceProps, 'isExpanded'>) => void;
  className?: string;
}

const ThreadViewComponent = ({
  currentBranch,
  branches,
  messages,
  contextGroups,
  messageText,
  isStreaming = false,
  isLoading = false,
  showBranchSelector = true,
  isContextExpanded = true,
  onSelectBranch,
  onToggleContextPanel,
  onMessageChange,
  onSendMessage,
  onStopStreaming,
  onWidgetClick,
  onBranchThread,
  onAddReference,
  onReferenceClick,
  onRemoveReference,
  className = '',
}: ThreadViewProps) => {
  return (
    <div className={`w-full flex flex-col h-full bg-white dark:bg-gray-950 ${className}`} data-testid="thread-view">
      {/* Header - only show when thread exists */}
      {currentBranch && showBranchSelector ? (
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="flex items-center gap-2">
            <BranchSelector
              currentBranch={currentBranch}
              branches={branches}
              onSelectBranch={onSelectBranch}
            />
            {onBranchThread && (
              <button
                onClick={onBranchThread}
                className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors whitespace-nowrap"
                aria-label="Branch from current thread"
                title="Create a new branch from this point in the conversation"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h12M8 12h12m-12 5h12m-12-5H4m0 5H4m0-5H4m4-5H4"
                  />
                </svg>
                Branch
              </button>
            )}
          </div>
        </div>
      ) : currentBranch ? (
        <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {currentBranch.title}
              </h2>
              {currentBranch.summary && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                  {currentBranch.summary}
                </p>
              )}
            </div>
            {onBranchThread && (
              <button
                onClick={onBranchThread}
                className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors whitespace-nowrap"
                aria-label="Branch from current thread"
                title="Create a new branch from this point in the conversation"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h12M8 12h12m-12 5h12m-12-5H4m0 5H4m0-5H4m4-5H4"
                  />
                </svg>
                Branch
              </button>
            )}
          </div>
        </div>
      ) : null}

      {/* Message Stream */}
      <div className="w-full flex-1 overflow-hidden">
        <MessageStream messages={messages} isStreaming={isStreaming} isLoading={isLoading} />
      </div>

      {/* Context Panel */}
      <ContextPanel
        contextGroups={contextGroups}
        isExpanded={isContextExpanded}
        onTogglePanel={onToggleContextPanel}
        onWidgetClick={onWidgetClick}
        onAddReference={onAddReference}
        onReferenceClick={onReferenceClick}
        onRemoveReference={onRemoveReference}
      />

      {/* Input */}
      <ThreadInput
        messageText={messageText}
        isStreaming={isStreaming}
        isLoading={isLoading}
        onChange={onMessageChange}
        onSendMessage={onSendMessage}
        onStopStreaming={onStopStreaming}
      />
    </div>
  );
};

// Export memoized component to prevent re-renders when props unchanged
export const ThreadView = React.memo(ThreadViewComponent);
