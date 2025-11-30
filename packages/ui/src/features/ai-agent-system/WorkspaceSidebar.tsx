import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { FileTreeNode, type FileTreeNodeData } from '../filesystem-markdown-editor';
import { ThreadTreeNode as SharedThreadTreeNode, type ThreadNode } from './ThreadTreeNode';

export interface Thread {
  id: string;
  title: string;
  artifactCount: number;
  lastActivity: string;
  isActive?: boolean;
  parentThreadId?: string | null;
  depth?: number;
  children?: Thread[];
}

export interface File {
  id: string;
  name: string;
  path: string;
  size?: number;
  lastModified: Date;
  type: 'file' | 'folder';
  parentId?: string | null;
  depth?: number;
  children?: File[];
}

export interface WorkspaceSidebarProps {
  activeTab: 'files' | 'threads';
  onTabChange: (tab: 'files' | 'threads') => void;
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
  className?: string;
  isLoadingFiles?: boolean;
  isLoadingThreads?: boolean;
  // Tree expansion state (parent-controlled)
  threadExpandedIds?: Set<string>;
  onThreadToggleExpanded?: (threadId: string) => void;
  fileExpandedIds?: Set<string>;
  onFileToggleExpanded?: (fileId: string) => void;
}

// Helper function to build thread tree structure
function buildThreadTree(threads: Thread[]): (Thread & { children: Thread[] })[] {
  const itemMap = new Map<string, Thread & { children: Thread[] }>();
  const rootItems: (Thread & { children: Thread[] })[] = [];

  // First pass: create map with children arrays
  threads.forEach(thread => {
    itemMap.set(thread.id, { ...thread, children: [] });
  });

  // Second pass: build parent-child relationships
  threads.forEach(thread => {
    const itemWithChildren = itemMap.get(thread.id)!;
    if (thread.parentThreadId === null || thread.parentThreadId === undefined) {
      rootItems.push(itemWithChildren);
    } else {
      const parent = itemMap.get(thread.parentThreadId);
      if (parent) {
        parent.children.push(itemWithChildren);
      } else {
        // Parent not found, treat as root
        rootItems.push(itemWithChildren);
      }
    }
  });

  return rootItems;
}

// File tree builder
function buildFileTree(files: File[]): (File & { children: File[] })[] {
  const itemMap = new Map<string, File & { children: File[] }>();
  const rootItems: (File & { children: File[] })[] = [];

  // First pass: create map with children arrays
  files.forEach(file => {
    itemMap.set(file.id, { ...file, children: [] });
  });

  // Second pass: build parent-child relationships
  files.forEach(file => {
    const itemWithChildren = itemMap.get(file.id)!;
    if (file.parentId === null || file.parentId === undefined) {
      rootItems.push(itemWithChildren);
    } else {
      const parent = itemMap.get(file.parentId);
      if (parent) {
        parent.children.push(itemWithChildren);
      } else {
        // Parent not found, treat as root
        rootItems.push(itemWithChildren);
      }
    }
  });

  return rootItems;
}

// Convert flat File array to nested FileTreeNodeData structure
function convertToFileTreeNodes(files: File[]): FileTreeNodeData[] {
  const fileMap = new Map<string, FileTreeNodeData>();
  const rootNodes: FileTreeNodeData[] = [];

  // First pass: create all nodes
  files.forEach(file => {
    fileMap.set(file.id, {
      id: file.id,
      name: file.name,
      type: file.type,
      expanded: true, // Auto-expand folders
      children: [],
    });
  });

  // Second pass: build parent-child relationships
  files.forEach(file => {
    const node = fileMap.get(file.id)!;
    if (file.parentId === null || file.parentId === undefined) {
      rootNodes.push(node);
    } else {
      const parent = fileMap.get(file.parentId);
      if (parent) {
        if (!parent.children) parent.children = [];
        parent.children.push(node);
      } else {
        // Parent not found, treat as root
        rootNodes.push(node);
      }
    }
  });

  return rootNodes;
}

// Icon component for files and folders
function FileIcon({ type }: { type: 'file' | 'folder' }) {
  if (type === 'folder') {
    return (
      <svg className="w-4 h-4 text-blue-500 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
      </svg>
    );
  }

  return (
    <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

// Recursive component to render file tree
interface LocalFileTreeNodeProps {
  files: File[];
  expandedFiles: Set<string>;
  onFileClick: (fileId: string) => void;
  onToggleExpanded: (fileId: string) => void;
  depth: number;
}

function LocalFileTreeNode({
  files,
  expandedFiles,
  onFileClick,
  onToggleExpanded,
  depth,
}: LocalFileTreeNodeProps) {
  return (
    <>
      {files.map((file) => {
        const hasChildren = file.children && file.children.length > 0;
        const isExpanded = expandedFiles.has(file.id);
        const isFolder = file.type === 'folder';
        const paddingLeft = depth * 16; // 16px per depth level

        return (
          <div key={file.id} className="mb-0.5">
            <button
              onClick={() => {
                if (isFolder && hasChildren) {
                  onToggleExpanded(file.id);
                } else if (!isFolder) {
                  onFileClick(file.id);
                }
              }}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-2.5 rounded-lg text-sm transition-all group',
                'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
              style={{ paddingLeft: `${8 + paddingLeft}px` }}
            >
              {/* Expand/Collapse Button */}
              {hasChildren && isFolder && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleExpanded(file.id);
                  }}
                  className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 -ml-1"
                >
                  <svg
                    className={cn('w-3 h-3 transition-transform', isExpanded && 'rotate-90')}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}

              {/* Icon */}
              <div className={cn('flex-shrink-0', !hasChildren && 'ml-4')}>
                <FileIcon type={file.type} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 text-left">
                <div className="font-medium truncate text-left">{file.name}</div>
                {!isFolder && file.path && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 text-left truncate">
                    {file.path}
                  </div>
                )}
              </div>
            </button>

            {/* Children */}
            {hasChildren && isExpanded && (
              <div className="mt-0.5">
                <LocalFileTreeNode
                  files={file.children || []}
                  expandedFiles={expandedFiles}
                  onFileClick={onFileClick}
                  onToggleExpanded={onToggleExpanded}
                  depth={depth + 1}
                />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

export function WorkspaceSidebar({
  activeTab,
  onTabChange,
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
  className,
  isLoadingFiles = false,
  isLoadingThreads = false,
  threadExpandedIds,
  onThreadToggleExpanded,
  fileExpandedIds,
  onFileToggleExpanded,
}: WorkspaceSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  // Fallback to local state if parent doesn't provide expansion control
  const [localExpandedThreads, setLocalExpandedThreads] = useState<Set<string>>(() => {
    const parentsWithChildren = threads.filter(t =>
      threads.some(child => child.parentThreadId === t.id)
    );
    return new Set(parentsWithChildren.map(t => t.id));
  });

  const [localExpandedFiles, setLocalExpandedFiles] = useState<Set<string>>(new Set());

  // Use parent-controlled state if provided, otherwise use local state
  const expandedThreads = threadExpandedIds ?? localExpandedThreads;
  const expandedFiles = fileExpandedIds ?? localExpandedFiles;

  const filteredFiles = files.filter((file) =>
    file.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredThreads = threads.filter((thread) =>
    thread.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const threadTree = buildThreadTree(filteredThreads);
  const fileTreeNodes = convertToFileTreeNodes(filteredFiles);

  const toggleThreadExpanded = (threadId: string) => {
    if (onThreadToggleExpanded) {
      // Use parent-controlled callback if provided
      onThreadToggleExpanded(threadId);
    } else {
      // Otherwise update local state
      setLocalExpandedThreads(prev => {
        const next = new Set(prev);
        if (next.has(threadId)) {
          next.delete(threadId);
        } else {
          next.add(threadId);
        }
        return next;
      });
    }
  };

  const toggleFileExpanded = (fileId: string) => {
    if (onFileToggleExpanded) {
      // Use parent-controlled callback if provided
      onFileToggleExpanded(fileId);
    } else {
      // Otherwise update local state
      setLocalExpandedFiles(prev => {
        const next = new Set(prev);
        if (next.has(fileId)) {
          next.delete(fileId);
        } else {
          next.add(fileId);
        }
        return next;
      });
    }
  };

  const handleFileSelect = (fileId: string) => {
    onFileClick(fileId);
  };

  return (
    <div className={cn('flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700', className)}>
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <button
          onClick={() => onTabChange('threads')}
          className={cn(
            'flex-1 px-4 py-3 text-sm font-medium transition-colors',
            activeTab === 'threads'
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          )}
        >
          Threads
        </button>
        <button
          onClick={() => onTabChange('files')}
          className={cn(
            'flex-1 px-4 py-3 text-sm font-medium transition-colors',
            activeTab === 'files'
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          )}
        >
          Files
        </button>
      </div>

      {/* Icon Button Row */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
          {activeTab === 'threads' ? 'Threads' : 'Files'}
        </h2>
        <div className="flex gap-1">
          {/* Search Icon Button */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="flex-shrink-0 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors h-8 w-8 flex items-center justify-center"
            title="Search"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* New Button - Different per tab */}
          {activeTab === 'threads' && onCreateThread && (
            <button
              onClick={onCreateThread}
              className="flex-shrink-0 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors h-8 w-8 flex items-center justify-center"
              title="New Thread"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}

          {activeTab === 'files' && onCreateFile && (
            <button
              onClick={onCreateFile}
              className="flex-shrink-0 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors h-8 w-8 flex items-center justify-center"
              title="New File"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}

          {/* New Folder Button - Files tab only */}
          {activeTab === 'files' && onCreateFolder && (
            <button
              onClick={onCreateFolder}
              className="flex-shrink-0 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors h-8 w-8 flex items-center justify-center"
              title="New Folder"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </button>
          )}

          {/* Upload Button - Files tab only */}
          {activeTab === 'files' && onUploadFiles && (
            <button
              onClick={onUploadFiles}
              className="flex-shrink-0 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors h-8 w-8 flex items-center justify-center"
              title="Upload Files"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Filter Input */}
      {searchOpen && (
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
            <button
              onClick={() => setSearchOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-400"
              title="Close search"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'threads' && (
          <div className="p-2">
            {isLoadingThreads ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Loading threads...</span>
                </div>
              </div>
            ) : threadTree.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                No threads found
              </div>
            ) : (
              <SharedThreadTreeNode
                threads={threadTree as ThreadNode[]}
                variant="icon"
                expandedThreads={expandedThreads}
                onThreadClick={onThreadClick}
                onThreadHover={onThreadHover}
                onToggleExpanded={toggleThreadExpanded}
                onCreateBranch={onThreadCreateBranch}
                onRename={onThreadRename}
                onDelete={onThreadDelete}
                depth={0}
              />
            )}
          </div>
        )}

        {activeTab === 'files' && (
          <div className="p-2">
            {isLoadingFiles ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Loading files...</span>
                </div>
              </div>
            ) : fileTreeNodes.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                No files found
              </div>
            ) : (
              fileTreeNodes.map(node => (
                <FileTreeNode
                  key={node.id}
                  node={node}
                  selectedFile={selectedFileId || ''}
                  onSelect={handleFileSelect}
                  onRename={(id: string, name: string, type: 'file' | 'folder') => {
                    if (type === 'file') onFileRename?.(id, name);
                    if (type === 'folder') onFolderRename?.(id, name);
                  }}
                  onDelete={(id: string, name: string, type: 'file' | 'folder') => {
                    if (type === 'file') onFileDelete?.(id, name);
                    if (type === 'folder') onFolderDelete?.(id, name);
                  }}
                  onCreateSubfolder={onCreateSubfolder}
                  onCreateFileInFolder={onCreateFileInFolder}
                  onUploadToFolder={onUploadToFolder}
                  level={0}
                  expandedIds={expandedFiles}
                  onToggleExpanded={toggleFileExpanded}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
