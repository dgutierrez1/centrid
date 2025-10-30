import React from 'react';
import { cn } from '@centrid/shared/utils';
import { WorkspaceSidebar, type Thread, type File } from './WorkspaceSidebar';
import { ThreadView, type ThreadViewProps } from './ThreadView';
import { FileEditorPanel, type FileData } from './FileEditorPanel';
import { WorkspaceHeader } from './WorkspaceHeader';

export interface WorkspaceProps extends Omit<ThreadViewProps, 'className'> {
  // Sidebar props
  sidebarActiveTab: 'files' | 'threads';
  onSidebarTabChange: (tab: 'files' | 'threads') => void;
  files: File[];
  threads: Thread[];
  onFileClick: (fileId: string) => void;
  onThreadClick: (threadId: string) => void;
  onCreateThread?: () => void;
  onCreateFile?: () => void;
  onCreateFolder?: () => void;
  isSidebarOpen?: boolean;
  isLoadingThreads?: boolean;

  // File editor props
  currentFile?: FileData | null;
  isFileEditorOpen: boolean;
  onCloseFileEditor: () => void;
  onGoToSource?: (branchId: string, messageId: string) => void;

  // Header props
  onToggleSidebar?: () => void;
  onToggleTheme?: () => void;
  onNotificationsClick?: () => void;
  theme?: 'light' | 'dark' | 'system';
  unreadNotificationsCount?: number;
  userInitial?: string;

  className?: string;
}

export function Workspace({
  // Sidebar props
  sidebarActiveTab,
  onSidebarTabChange,
  files,
  threads,
  onFileClick,
  onThreadClick,
  onCreateThread,
  onCreateFile,
  onCreateFolder,
  isSidebarOpen = false,

  // File editor props
  currentFile,
  isFileEditorOpen,
  onCloseFileEditor,
  onGoToSource,

  // Header props
  onToggleSidebar,
  onToggleTheme,
  onNotificationsClick,
  theme,
  unreadNotificationsCount,
  userInitial,

  // ThreadView props (spread to ThreadView)
  currentBranch,
  branches,
  messages,
  contextGroups,
  messageText,
  isStreaming,
  isLoading,
  pendingToolCall,
  isContextExpanded,
  onSelectBranch,
  onToggleContextPanel,
  onMessageChange,
  onSendMessage,
  onStopStreaming,
  onApproveToolCall,
  onRejectToolCall,
  onBranchThread,
  onAddReference,
  onReferenceClick,
  onRemoveReference,
  onWidgetClick,

  className,
}: WorkspaceProps) {
  return (
    <div className={cn('flex flex-col h-screen bg-white dark:bg-gray-800', className)}>
      {/* Header */}
      <WorkspaceHeader
        onToggleSidebar={onToggleSidebar}
        onToggleTheme={onToggleTheme}
        onNotificationsClick={onNotificationsClick}
        theme={theme}
        unreadNotificationsCount={unreadNotificationsCount}
        userInitial={userInitial}
        activeView="AI Workspace"
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={onToggleSidebar}
              aria-hidden="true"
            />
            {/* Sidebar Panel */}
            <div className="fixed inset-y-0 left-0 w-[80%] max-w-[320px] bg-white dark:bg-gray-900 z-50 md:hidden shadow-xl">
              <WorkspaceSidebar
                activeTab={sidebarActiveTab}
                onTabChange={onSidebarTabChange}
                files={files}
                threads={threads}
                onFileClick={(fileId) => {
                  onFileClick(fileId);
                  onToggleSidebar?.();
                }}
                onThreadClick={(threadId) => {
                  onThreadClick(threadId);
                  onToggleSidebar?.();
                }}
                onCreateThread={onCreateThread}
                onCreateFile={onCreateFile}
                onCreateFolder={onCreateFolder}
              />
            </div>
          </>
        )}

        {/* Desktop Sidebar - 20% */}
        <div className="w-[20%] min-w-[240px] max-w-[320px] hidden md:block">
          <WorkspaceSidebar
            activeTab={sidebarActiveTab}
            onTabChange={onSidebarTabChange}
            files={files}
            threads={threads}
            onFileClick={onFileClick}
            onThreadClick={onThreadClick}
            onCreateThread={onCreateThread}
            onCreateFile={onCreateFile}
            onCreateFolder={onCreateFolder}
          />
        </div>

        {/* ThreadView - 50% or 80% depending on file editor */}
        <div className={cn(
          'flex-1 transition-all duration-300',
          isFileEditorOpen ? 'w-[50%]' : 'w-[80%]'
        )}>
          <ThreadView
            currentBranch={currentBranch}
            branches={branches}
            messages={messages}
            contextGroups={contextGroups}
            messageText={messageText}
            isStreaming={isStreaming}
            isLoading={isLoading}
            pendingToolCall={pendingToolCall}
            showBranchSelector={false}
            isContextExpanded={isContextExpanded}
            onSelectBranch={onSelectBranch}
            onToggleContextPanel={onToggleContextPanel}
            onMessageChange={onMessageChange}
            onSendMessage={onSendMessage}
            onStopStreaming={onStopStreaming}
            onApproveToolCall={onApproveToolCall}
            onRejectToolCall={onRejectToolCall}
            onBranchThread={onBranchThread}
            onWidgetClick={onWidgetClick}
            onAddReference={onAddReference}
            onReferenceClick={onReferenceClick}
            onRemoveReference={onRemoveReference}
          />
        </div>

        {/* FileEditorPanel - 30% (slides in from right) */}
        {isFileEditorOpen && currentFile && (
          <div className="w-[30%] min-w-[400px] max-w-[600px] hidden md:block">
            <FileEditorPanel
              file={currentFile}
              isOpen={isFileEditorOpen}
              onClose={onCloseFileEditor}
              onGoToSource={onGoToSource}
            />
          </div>
        )}
      </div>
    </div>
  );
}
