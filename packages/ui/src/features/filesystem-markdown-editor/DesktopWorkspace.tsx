/**
 * Desktop Workspace Component
 * Three-panel layout: File Tree | Editor | AI Chat
 */

import { useState } from 'react';
import {
  Button,
  Input,
  ScrollArea,
  DesktopHeader,
  MarkdownEditor,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  SaveIndicator,
} from '@centrid/ui/components';
import {
  SearchIcon,
  XIcon,
  PlusIcon,
  FolderPlusIcon,
  UploadIcon,
  MessageSquareIcon,
  FolderIcon,
  FileTextIcon,
} from './icons';
import { FileTreeNode } from './FileTreeNode';

export interface FileTreeNodeData {
  id: string;
  name: string;
  type: 'folder' | 'file';
  expanded?: boolean;
  children?: FileTreeNodeData[];
}

export interface DesktopWorkspaceProps {
  fileTreeData: FileTreeNodeData[];
  selectedFile: string;
  selectedFileName?: string; // Friendly name to display in header (not UUID)
  onSelectFile: (name: string) => void;
  editorContent: string;
  onEditorChange?: (content: string) => void;
  saveStatus?: 'saved' | 'saving' | 'error' | 'idle';
  lastSavedAt?: Date | null;
  hasUnsavedChanges?: boolean;
  logo?: string;
  appName?: string;
  userInitials?: string;
  // New handler props for filesystem operations
  onCreateFile?: () => void;
  onCreateFolder?: () => void;
  onUpload?: () => void;
  onRenameNode?: (nodeId: string, nodeName: string, nodeType: 'folder' | 'file') => void;
  onDeleteNode?: (nodeId: string, nodeName: string, nodeType: 'folder' | 'file') => void;
  onCreateSubfolder?: (folderId: string, folderName: string) => void;
  onCreateFileInFolder?: (folderId: string, folderName: string) => void;
  onUploadToFolder?: (folderId: string, folderName: string) => void;
  isCreatingFile?: boolean;
  isCreatingFolder?: boolean;
  onSearch?: () => void; // Callback to open search modal
}

export function DesktopWorkspace({
  fileTreeData,
  selectedFile,
  selectedFileName,
  onSelectFile,
  editorContent,
  onEditorChange,
  saveStatus = 'idle',
  lastSavedAt = null,
  hasUnsavedChanges = false,
  logo = 'C',
  appName = 'Centrid',
  userInitials = 'DG',
  onCreateFile,
  onCreateFolder,
  onUpload,
  onRenameNode,
  onDeleteNode,
  onCreateSubfolder,
  onCreateFileInFolder,
  onUploadToFolder,
  isCreatingFile = false,
  isCreatingFolder = false,
  onSearch,
}: DesktopWorkspaceProps) {

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DesktopHeader
        logo={logo}
        appName={appName}
        activeTab="documents"
        userInitials={userInitials}
      />

      {/* Three-panel layout */}
      <div className="flex h-[calc(100vh-3.5rem)] flex-col">
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel: File Tree (20%) */}
          <div className="w-1/5 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Files</h2>
              <div className="flex gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={onSearch}
                        disabled={!onSearch}
                      >
                        <SearchIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">
                        Search<span className="ml-2 text-gray-400">⌘K</span>
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onCreateFile} disabled={isCreatingFile}>
                        <PlusIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>New File</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onCreateFolder} disabled={isCreatingFolder}>
                        <FolderPlusIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>New Folder</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onUpload}>
                        <UploadIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Upload Files</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <ScrollArea className="flex-1">
              {fileTreeData.length === 0 ? (
                <div className="p-8 text-center">
                  <FolderIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">No files yet</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    Create your first folder or document to get started
                  </p>
                  <Button size="sm" className="w-full mb-2" onClick={onCreateFile} disabled={isCreatingFile}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    New Document
                  </Button>
                  <Button size="sm" variant="outline" className="w-full mb-2" onClick={onCreateFolder} disabled={isCreatingFolder}>
                    <FolderPlusIcon className="h-4 w-4 mr-2" />
                    New Folder
                  </Button>
                  <Button size="sm" variant="outline" className="w-full" onClick={onUpload}>
                    <UploadIcon className="h-4 w-4 mr-2" />
                    Upload Files
                  </Button>
                </div>
              ) : (
                <div className="p-2">
                  {fileTreeData.map((node) => (
                    <FileTreeNode
                      key={node.id}
                      node={node}
                      selectedFile={selectedFile}
                      onSelect={onSelectFile}
                      onRename={onRenameNode}
                      onDelete={onDeleteNode}
                      onCreateSubfolder={onCreateSubfolder}
                      onCreateFileInFolder={onCreateFileInFolder}
                      onUploadToFolder={onUploadToFolder}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Center Panel: Editor (50%) */}
          <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{selectedFileName || 'Editor'}</h2>
              </div>
              {selectedFile && (
                <SaveIndicator
                  status={saveStatus}
                  lastSavedAt={lastSavedAt}
                  hasUnsavedChanges={hasUnsavedChanges}
                  debounceMs={3000}
                />
              )}
            </div>

            {/* Document viewer - empty state or editor */}
            {!selectedFile || selectedFile === '' ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-sm">
                  <FileTextIcon className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">No document open</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Select a document from the file tree or create a new one to start editing
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button onClick={onCreateFile} disabled={isCreatingFile}>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create New Document
                    </Button>
                    <Button variant="outline" onClick={onUpload}>
                      <UploadIcon className="h-4 w-4 mr-2" />
                      Upload Files
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <MarkdownEditor
                content={editorContent}
                showToolbar={true}
                onChange={onEditorChange}
              />
            )}
          </div>

          {/* Right Panel: AI Chat (30%) */}
          <div className="w-[30%] bg-white dark:bg-gray-800 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 flex-shrink-0">
              <MessageSquareIcon className="h-5 w-5 text-primary-600" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">AI Assistant</h2>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Hello! I can help you with your documents. Try asking me about your notes or request analysis.
                  </p>
                </div>
              </div>
            </ScrollArea>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
              <Input
                placeholder="Ask about your documents..."
                className="w-full h-11"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
