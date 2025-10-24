/**
 * Mobile Workspace Layout
 *
 * Smart component that provides mobile-optimized workspace with:
 * - Single-panel view switching (document/chat)
 * - Bottom navigation tabs
 * - Slide-out file tree menu
 * - Integration with workspace data and operations
 */

'use client';

import { useSnapshot } from 'valtio';
import {
  BottomNavigation,
  SlideOutMenu,
  type BottomNavigationTab,
  ScrollArea,
  Button,
  MarkdownEditorMobile,
  SaveIndicator,
} from '@centrid/ui/components';
import {
  FileTextIcon,
  MessageSquareIcon,
  FileTreeNode,
  PlusIcon,
  FolderPlusIcon,
  UploadIcon,
  SearchIcon,
} from '@centrid/ui/features';
import { mobileState, mobileActions, type MobileView } from '@/lib/state/mobile';
import { useWorkspaceData } from '@/lib/hooks/useWorkspaceData';
import { useWorkspaceHandlers } from '@/lib/hooks/useWorkspaceHandlers';
import { useFileUpload } from '@/lib/contexts/file-upload.context';
import * as React from 'react';

export interface MobileWorkspaceLayoutProps {
  className?: string;
  onCreateFile?: () => void;
  onCreateFolder?: () => void;
  onUpload?: (folderId?: string | null) => void;
  onSearch?: () => void;
  onRenameNode?: (nodeId: string, nodeName: string, nodeType: 'folder' | 'file') => void;
  onDeleteNode?: (nodeId: string, nodeName: string, nodeType: 'folder' | 'file') => void;
  onCreateSubfolder?: (folderId: string, folderName: string) => void;
  onCreateFileInFolder?: (folderId: string, folderName: string) => void;
  onUploadToFolder?: (folderId: string, folderName: string) => void;
}

/**
 * MobileWorkspaceLayout - Mobile-optimized workspace
 *
 * Renders single-panel mobile interface with view switching and file tree access.
 * Integrates with workspace state and operations.
 */
export function MobileWorkspaceLayout({
  className,
  onCreateFile,
  onCreateFolder,
  onUpload,
  onSearch,
  onRenameNode,
  onDeleteNode,
  onCreateSubfolder,
  onCreateFileInFolder,
  onUploadToFolder,
}: MobileWorkspaceLayoutProps) {
  const mobile = useSnapshot(mobileState);
  const workspaceData = useWorkspaceData();
  const workspaceHandlers = useWorkspaceHandlers();
  const uploadContext = useFileUpload();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadFolderId, setUploadFolderId] = React.useState<string | null>(null);

  // Handle mobile file upload using native file picker
  const handleMobileUpload = (folderId: string | null = null) => {
    setUploadFolderId(folderId);
    fileInputRef.current?.click();
  };

  // Handle file selection from native picker
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Add files to upload queue
      uploadContext.addFiles(files, uploadFolderId);

      // Auto-open modal to show upload progress (mobile UX pattern)
      uploadContext.setIsUploadModalOpen(true);

      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Bottom navigation tabs
  const tabs: BottomNavigationTab[] = [
    {
      id: 'document',
      label: 'Document',
      icon: <FileTextIcon className="h-5 w-5" />,
      'data-testid': 'mobile-tab-document',
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: <MessageSquareIcon className="h-5 w-5" />,
      'data-testid': 'mobile-tab-chat',
    },
  ];

  // Handle tab change
  const handleTabChange = (tabId: string) => {
    mobileActions.setActiveView(tabId as MobileView);
  };

  return (
    <div className={className} data-testid="mobile-workspace">
      {/* Hidden file input for native mobile file picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.txt"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Upload files"
      />

      {/* Slide-out file tree menu */}
      <SlideOutMenu
        isOpen={mobile.isMenuOpen}
        onClose={mobileActions.closeMenu}
        title="Files"
      >
        {/* File tree toolbar */}
        <div className="p-2 border-b flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              onSearch?.();
              mobileActions.closeMenu();
            }}
            className="flex-1"
            aria-label="Search"
          >
            <SearchIcon className="h-5 w-5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              onCreateFile?.();
              mobileActions.closeMenu();
            }}
            className="flex-1"
            aria-label="Create file"
          >
            <PlusIcon className="h-5 w-5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              onCreateFolder?.();
              mobileActions.closeMenu();
            }}
            className="flex-1"
            aria-label="Create folder"
          >
            <FolderPlusIcon className="h-5 w-5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              handleMobileUpload(null);
              mobileActions.closeMenu();
            }}
            className="flex-1"
            aria-label="Upload files"
          >
            <UploadIcon className="h-5 w-5" />
          </Button>
        </div>

        {/* File tree */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {workspaceData.fileTreeData.map((node) => (
              <FileTreeNode
                key={node.id}
                node={node}
                selectedFile={workspaceData.selectedFile}
                onSelect={(fileId) => {
                  workspaceHandlers.onSelectFile(fileId);
                  mobileActions.closeMenu(); // Close menu after file selection
                }}
                onRename={onRenameNode}
                onDelete={onDeleteNode}
                onCreateSubfolder={onCreateSubfolder}
                onCreateFileInFolder={onCreateFileInFolder}
                onUploadToFolder={(folderId) => {
                  handleMobileUpload(folderId);
                  mobileActions.closeMenu();
                }}
              />
            ))}
            {workspaceData.fileTreeData.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                <p className="mb-2">No files yet</p>
                <p className="text-xs">Create a file or folder to get started</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SlideOutMenu>

      {/* Simple mobile layout - just render content with bottom nav */}
      <div className="h-screen flex flex-col bg-background">
        {/* Header with menu button and document title */}
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-background">
          <button
            onClick={mobileActions.toggleMenu}
            className="p-2 -ml-2 rounded-md hover:bg-muted active:bg-muted/80 transition-colors flex-shrink-0"
            aria-label="Open menu"
            data-testid="mobile-menu-button"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <h1 className="text-base font-semibold truncate flex-1 min-w-0">
            {mobile.activeView === 'document'
              ? (workspaceData.selectedFileName || 'No document')
              : 'AI Chat'
            }
          </h1>
        </div>

        {/* Info bar: folder path and save status */}
        {mobile.activeView === 'document' && workspaceData.selectedFile && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-500 dark:text-gray-400 flex-shrink-0"
              >
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300 truncate">
                {workspaceData.folderPath}
              </span>
            </div>
            <div className="flex-shrink-0 ml-4 pl-4 border-l border-gray-200 dark:border-gray-700">
              <SaveIndicator
                status={workspaceData.saveStatus}
                lastSavedAt={workspaceData.lastSavedAt}
                hasUnsavedChanges={workspaceData.hasUnsavedChanges}
              />
            </div>
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 overflow-hidden">
          {mobile.activeView === 'document' && (
            workspaceData.selectedFile ? (
              <div className="h-full flex flex-col">
                <MarkdownEditorMobile
                  content={workspaceData.editorContent}
                  onChange={workspaceHandlers.onEditorChange}
                  showToolbar={true}
                  touchOptimized={true}
                />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-6 text-center">
                <div className="max-w-sm w-full">
                  <FileTextIcon className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-6" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    No document open
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                    Select a document from the file tree or create a new one to get started
                  </p>
                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={() => {
                        onCreateFile?.();
                      }}
                      className="w-full h-12"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Create New Document
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        onCreateFolder?.();
                      }}
                      className="w-full h-12"
                    >
                      <FolderPlusIcon className="h-5 w-5 mr-2" />
                      Create New Folder
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleMobileUpload(null)}
                      className="w-full h-12"
                    >
                      <UploadIcon className="h-5 w-5 mr-2" />
                      Upload Files
                    </Button>
                  </div>
                </div>
              </div>
            )
          )}

          {mobile.activeView === 'chat' && (
            <div className="h-full flex items-center justify-center p-4 text-center text-muted-foreground">
              <div>
                <MessageSquareIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">AI Chat</p>
                <p className="text-xs mt-1">Coming soon</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom navigation */}
        <BottomNavigation
          tabs={tabs}
          activeTab={mobile.activeView}
          onTabChange={handleTabChange}
        />
      </div>
    </div>
  );
}
