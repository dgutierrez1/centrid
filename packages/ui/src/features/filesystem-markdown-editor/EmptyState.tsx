/**
 * Empty State Component
 * Shows when no documents exist yet
 */

import {
  Button,
  DesktopHeader,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@centrid/ui/components';
import {
  FolderIcon,
  FileTextIcon,
  PlusIcon,
  FolderPlusIcon,
  UploadIcon,
  MessageSquareIcon,
} from './icons';

export interface EmptyStateProps {
  onNewDocument?: () => void;
  onNewFolder?: () => void;
  onUploadFiles?: () => void;
  logo?: string;
  appName?: string;
  userInitials?: string;
}

export function EmptyState({
  onNewDocument,
  onNewFolder,
  onUploadFiles,
  logo = 'C',
  appName = 'Centrid',
  userInitials = 'DG',
}: EmptyStateProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DesktopHeader
        logo={logo}
        appName={appName}
        activeTab="documents"
        userInitials={userInitials}
      />

      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* File tree with empty state */}
        <div className="w-1/5 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Files</h2>
            <div className="flex gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onNewDocument}>
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
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onNewFolder}>
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
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onUploadFiles}>
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
          <div className="p-8 text-center">
            <FolderIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">No documents yet</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Create your first document or folder to organize your knowledge
            </p>
            <Button size="sm" className="w-full mb-2" onClick={onNewDocument}>
              <PlusIcon className="h-4 w-4 mr-2" />
              New Document
            </Button>
            <Button size="sm" variant="outline" className="w-full mb-2" onClick={onNewFolder}>
              <FolderPlusIcon className="h-4 w-4 mr-2" />
              New Folder
            </Button>
            <Button size="sm" variant="outline" className="w-full" onClick={onUploadFiles}>
              <UploadIcon className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
          </div>
        </div>

        {/* Editor with empty state */}
        <div className="flex-1 bg-white dark:bg-gray-800 flex items-center justify-center">
          <div className="text-center max-w-md">
            <FileTextIcon className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No document open
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Select a document from the file tree or create a new one to get started
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={onNewDocument}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Create New Document
              </Button>
              <Button variant="outline" onClick={onUploadFiles}>
                <UploadIcon className="h-4 w-4 mr-2" />
                Upload Files
              </Button>
            </div>
          </div>
        </div>

        {/* Chat panel */}
        <div className="w-[30%] border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
            <MessageSquareIcon className="h-5 w-5 text-primary-600" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">AI Assistant</h2>
          </div>
          <div className="p-8 text-center">
            <MessageSquareIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Create documents to start chatting with your AI assistant
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
