import React from 'react';
import { cn } from '../../lib/utils';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { WorkspaceSidebar, type Thread, type File } from './WorkspaceSidebar';
import { ThreadView, type ThreadViewProps } from './ThreadView';
import { FileEditorPanel, type FileData, type FileEditorPanelProps } from './FileEditorPanel';
import { WorkspaceHeader } from './WorkspaceHeader';

export interface WorkspaceProps extends Omit<ThreadViewProps, 'className'> {
  // Sidebar props
  sidebarActiveTab: 'files' | 'threads';
  onSidebarTabChange: (tab: 'files' | 'threads') => void;
  files: File[];
  threads: Thread[];
  selectedFileId?: string | null;
  onFileClick: (fileId: string) => void;
  onThreadClick: (threadId: string) => void;
  onThreadHover?: (threadId: string) => void;
  onCreateThread?: () => void;
  onCreateFile?: () => void;
  onCreateFolder?: () => void;
  onUploadFiles?: () => void;
  onThreadCreateBranch?: (parentThreadId: string, parentTitle: string) => void;
  onThreadRename?: (threadId: string, currentTitle: string) => void;
  onThreadDelete?: (threadId: string, title: string) => void;
  // File/folder operation handlers
  onFileRename?: (fileId: string, fileName: string) => void;
  onFileDelete?: (fileId: string, fileName: string) => void;
  onFolderRename?: (folderId: string, folderName: string) => void;
  onFolderDelete?: (folderId: string, folderName: string) => void;
  onCreateSubfolder?: (parentFolderId: string, parentFolderName: string) => void;
  onCreateFileInFolder?: (folderId: string, folderName: string) => void;
  onUploadToFolder?: (folderId: string, folderName: string) => void;
  isSidebarOpen?: boolean;
  isLoadingThreads?: boolean;
  isLoadingFiles?: boolean;
  // Tree expansion state (parent-controlled)
  threadExpandedIds?: Set<string>;
  onThreadToggleExpanded?: (threadId: string) => void;
  fileExpandedIds?: Set<string>;
  onFileToggleExpanded?: (fileId: string) => void;

  // File editor props - accepts any file-like object
  currentFile?: FileEditorPanelProps['file'];
  isFileEditorOpen: boolean;
  isFileLoading?: boolean;
  onCloseFileEditor: () => void;
  onGoToSource?: (branchId: string, messageId: string) => void;
  onFileChange?: (content: string) => void;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error' | 'offline';
  lastSavedAt?: string | null; // ISO 8601 string from GraphQL
  hasUnsavedChanges?: boolean;
  sidebarWidth?: number;
  onSidebarResize?: (width: number) => void;
  fileEditorWidth?: number;
  onFileEditorResize?: (width: number) => void;

  // Header props
  onToggleSidebar?: () => void;
  onToggleTheme?: () => void;
  onNotificationsClick?: () => void;
  theme?: 'light' | 'dark' | 'system';
  unreadNotificationsCount?: number;
  userInitial?: string;

  // Custom ThreadView content (optional - overrides default ThreadView rendering)
  threadViewContent?: React.ReactNode;

  className?: string;
}

export function Workspace({
  // Sidebar props
  sidebarActiveTab,
  onSidebarTabChange,
  files,
  threads,
  selectedFileId,
  onFileClick,
  onThreadClick,
  onThreadHover,
  onCreateThread,
  onCreateFile,
  onCreateFolder,
  onUploadFiles,
  onThreadCreateBranch,
  onThreadRename,
  onThreadDelete,
  onFileRename,
  onFileDelete,
  onFolderRename,
  onFolderDelete,
  onCreateSubfolder,
  onCreateFileInFolder,
  onUploadToFolder,
  isSidebarOpen = false,
  isLoadingThreads = false,
  isLoadingFiles = false,
  threadExpandedIds,
  onThreadToggleExpanded,
  fileExpandedIds,
  onFileToggleExpanded,

  // File editor props
  currentFile,
  isFileEditorOpen,
  isFileLoading = false,
  onCloseFileEditor,
  onGoToSource,
  onFileChange,
  saveStatus = 'idle',
  lastSavedAt = null,
  hasUnsavedChanges = false,
  sidebarWidth = 20,
  onSidebarResize,
  fileEditorWidth = 30,
  onFileEditorResize,

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
  isContextExpanded,
  onSelectBranch,
  onToggleContextPanel,
  onMessageChange,
  onSendMessage,
  onStopStreaming,
  onBranchThread,
  onAddReference,
  onReferenceClick,
  onRemoveReference,
  onWidgetClick,

  threadViewContent,

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
                selectedFileId={selectedFileId}
                onFileClick={(fileId) => {
                  onFileClick(fileId);
                  onToggleSidebar?.();
                }}
                onThreadClick={(threadId) => {
                  onThreadClick(threadId);
                  onToggleSidebar?.();
                }}
                onThreadHover={onThreadHover}
                onCreateThread={onCreateThread}
                onCreateFile={onCreateFile}
                onCreateFolder={onCreateFolder}
                onUploadFiles={onUploadFiles}
                onThreadCreateBranch={onThreadCreateBranch}
                onThreadRename={onThreadRename}
                onThreadDelete={onThreadDelete}
                onFileRename={onFileRename}
                onFileDelete={onFileDelete}
                onFolderRename={onFolderRename}
                onFolderDelete={onFolderDelete}
                onCreateSubfolder={onCreateSubfolder}
                onCreateFileInFolder={onCreateFileInFolder}
                onUploadToFolder={onUploadToFolder}
                isLoadingFiles={isLoadingFiles}
                isLoadingThreads={isLoadingThreads}
                threadExpandedIds={threadExpandedIds}
                onThreadToggleExpanded={onThreadToggleExpanded}
                fileExpandedIds={fileExpandedIds}
                onFileToggleExpanded={onFileToggleExpanded}
              />
            </div>
          </>
        )}

        {/* Desktop Layout with Resizable Panels */}
        <div className="hidden md:flex flex-1 overflow-hidden">
          <PanelGroup direction="horizontal">
            {/* Sidebar Panel - Resizable with localStorage */}
            <Panel
              defaultSize={sidebarWidth}
              minSize={15}
              maxSize={25}
              onResize={(size) => {
                onSidebarResize?.(size);
              }}
            >
              <WorkspaceSidebar
                activeTab={sidebarActiveTab}
                onTabChange={onSidebarTabChange}
                files={files}
                threads={threads}
                selectedFileId={selectedFileId}
                onFileClick={onFileClick}
                onThreadClick={onThreadClick}
                onThreadHover={onThreadHover}
                onCreateThread={onCreateThread}
                onCreateFile={onCreateFile}
                onCreateFolder={onCreateFolder}
                onUploadFiles={onUploadFiles}
                onThreadCreateBranch={onThreadCreateBranch}
                onThreadRename={onThreadRename}
                onThreadDelete={onThreadDelete}
                onFileRename={onFileRename}
                onFileDelete={onFileDelete}
                onFolderRename={onFolderRename}
                onFolderDelete={onFolderDelete}
                onCreateSubfolder={onCreateSubfolder}
                onCreateFileInFolder={onCreateFileInFolder}
                onUploadToFolder={onUploadToFolder}
                isLoadingFiles={isLoadingFiles}
                isLoadingThreads={isLoadingThreads}
                threadExpandedIds={threadExpandedIds}
                onThreadToggleExpanded={onThreadToggleExpanded}
                fileExpandedIds={fileExpandedIds}
                onFileToggleExpanded={onFileToggleExpanded}
              />
            </Panel>

            <PanelResizeHandle className="w-1 bg-gray-200 dark:bg-gray-700 hover:bg-primary-500 transition-colors" />

            {/* ThreadView Panel - Flexible (calculated size) */}
            <Panel
              defaultSize={isFileEditorOpen ? (100 - sidebarWidth - fileEditorWidth) : (100 - sidebarWidth)}
              minSize={30}
            >
              {threadViewContent || (
                <ThreadView
                  currentBranch={currentBranch}
                  branches={branches}
                  messages={messages}
                  contextGroups={contextGroups}
                  messageText={messageText}
                  isStreaming={isStreaming}
                  isLoading={isLoading}
                  showBranchSelector={false}
                  isContextExpanded={isContextExpanded}
                  onSelectBranch={onSelectBranch}
                  onToggleContextPanel={onToggleContextPanel}
                  onMessageChange={onMessageChange}
                  onSendMessage={onSendMessage}
                  onStopStreaming={onStopStreaming}
                  onBranchThread={onBranchThread}
                  onWidgetClick={onWidgetClick}
                  onAddReference={onAddReference}
                  onReferenceClick={onReferenceClick}
                  onRemoveReference={onRemoveReference}
                />
              )}
            </Panel>

            {/* FileEditorPanel - Resizable */}
            {isFileEditorOpen && (
              <>
                <PanelResizeHandle className="w-1 bg-gray-200 dark:bg-gray-700 hover:bg-primary-500 transition-colors" />
                <Panel
                  defaultSize={fileEditorWidth}
                  minSize={20}
                  maxSize={50}
                  onResize={(size) => {
                    onFileEditorResize?.(size);
                  }}
                >
                  <FileEditorPanel
                    file={currentFile}
                    isOpen={isFileEditorOpen}
                    isLoading={isFileLoading}
                    onClose={onCloseFileEditor}
                    onGoToSource={onGoToSource}
                    onFileChange={onFileChange}
                    saveStatus={saveStatus}
                    lastSavedAt={lastSavedAt}
                    hasUnsavedChanges={hasUnsavedChanges}
                  />
                </Panel>
              </>
            )}
          </PanelGroup>
        </div>
      </div>
    </div>
  );
}
