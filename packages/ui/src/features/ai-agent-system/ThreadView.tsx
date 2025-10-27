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
  /** Callbacks */
  onSelectBranch: (branchId: string) => void;
  onToggleContextSection: (sectionType: string) => void;
  onMessageChange: (text: string) => void;
  onSendMessage: (text: string) => void;
  onStopStreaming?: () => void;
  onApproveToolCall?: () => void;
  onRejectToolCall?: (reason?: string) => void;
  onFileClick?: (item: any) => void;
  onAddToExplicit?: (item: any) => void;
  onRemove?: (item: any) => void;
  onDismiss?: (item: any) => void;
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
  onSelectBranch,
  onToggleContextSection,
  onMessageChange,
  onSendMessage,
  onStopStreaming,
  onApproveToolCall,
  onRejectToolCall,
  onFileClick,
  onAddToExplicit,
  onRemove,
  onDismiss,
  className = '',
}: ThreadViewProps) {
  return (
    <div className={`flex flex-col h-full bg-gray-50 dark:bg-gray-950 ${className}`} data-testid="thread-view">
      {/* Header with Branch Selector */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <BranchSelector
          currentBranch={currentBranch}
          branches={branches}
          onSelectBranch={onSelectBranch}
        />
      </div>

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
        onToggleSection={onToggleContextSection}
        onItemClick={onFileClick}
        onAddToExplicit={onAddToExplicit}
        onRemove={onRemove}
        onDismiss={onDismiss}
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
