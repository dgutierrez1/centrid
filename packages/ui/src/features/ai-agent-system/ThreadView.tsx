import React from 'react';
import { BranchSelector, Branch } from './BranchSelector';
import { MessageStream } from './MessageStream';
import { MessageProps } from './Message';
import { ContextPanel, ContextGroup } from './ContextPanel';
import { ThreadInput } from './ThreadInput';
import { ToolCallApproval } from './ToolCallApproval';

export interface ThreadViewProps {
  /** Current branch */
  currentBranch: Branch;
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
  /** Pending tool approval */
  pendingToolCall?: {
    toolName: string;
    toolInput: Record<string, any>;
    previewContent?: string;
  };
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
  onApproveToolCall?: () => void;
  onRejectToolCall?: (reason?: string) => void;
  onWidgetClick?: (type: string) => void;
  onBranchThread?: () => void;
  className?: string;
}

export function ThreadView({
  currentBranch,
  branches,
  messages,
  contextGroups,
  messageText,
  isStreaming = false,
  isLoading = false,
  pendingToolCall,
  showBranchSelector = true,
  isContextExpanded = true,
  onSelectBranch,
  onToggleContextPanel,
  onMessageChange,
  onSendMessage,
  onStopStreaming,
  onApproveToolCall,
  onRejectToolCall,
  onWidgetClick,
  onBranchThread,
  className = '',
}: ThreadViewProps) {
  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-950 ${className}`} data-testid="thread-view">
      {/* Header */}
      {showBranchSelector ? (
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
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/50 rounded-md hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors whitespace-nowrap"
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
      ) : (
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
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/50 rounded-md hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors whitespace-nowrap"
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
      )}

      {/* Message Stream */}
      <div className="flex-1 overflow-hidden">
        <MessageStream messages={messages} isStreaming={isStreaming} />
      </div>

      {/* Tool Approval (if pending) */}
      {pendingToolCall && onApproveToolCall && onRejectToolCall && (
        <div className="px-4 pb-4">
          <ToolCallApproval
            toolName={pendingToolCall.toolName}
            toolInput={pendingToolCall.toolInput}
            previewContent={pendingToolCall.previewContent}
            isLoading={isLoading}
            onApprove={onApproveToolCall}
            onReject={onRejectToolCall}
          />
        </div>
      )}

      {/* Context Panel */}
      <ContextPanel
        contextGroups={contextGroups}
        isExpanded={isContextExpanded}
        onTogglePanel={onToggleContextPanel}
        onWidgetClick={onWidgetClick}
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
}
