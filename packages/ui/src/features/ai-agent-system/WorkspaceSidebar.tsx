import React, { useState } from 'react';
import { cn } from '@centrid/shared/utils';
import { FileTreeNode, type FileTreeNodeData } from '@centrid/ui/features/filesystem-markdown-editor';

export interface Thread {
  id: string;
  title: string;
  artifactCount: number;
  lastActivity: Date;
  isActive?: boolean;
  parentId?: string | null;
  depth?: number;
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
}

export interface WorkspaceSidebarProps {
  activeTab: 'files' | 'threads';
  onTabChange: (tab: 'files' | 'threads') => void;
  files: File[];
  threads: Thread[];
  onFileClick: (fileId: string) => void;
  onThreadClick: (threadId: string) => void;
  onCreateThread?: () => void;
  onCreateFile?: () => void;
  onCreateFolder?: () => void;
  className?: string;
}

// Helper function to build tree structure (generic for both threads and files)
function buildTree<T extends { id: string; parentId?: string | null }>(
  items: T[]
): (T & { children: T[] })[] {
  const itemMap = new Map<string, T & { children: T[] }>();
  const rootItems: (T & { children: T[] })[] = [];

  // First pass: create map with children arrays
  items.forEach(item => {
    itemMap.set(item.id, { ...item, children: [] });
  });

  // Second pass: build parent-child relationships
  items.forEach(item => {
    const itemWithChildren = itemMap.get(item.id)!;
    if (item.parentId === null || item.parentId === undefined) {
      rootItems.push(itemWithChildren);
    } else {
      const parent = itemMap.get(item.parentId);
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

// Thread tree builder
function buildThreadTree(threads: Thread[]): (Thread & { children: Thread[] })[] {
  return buildTree(threads);
}

// File tree builder
function buildFileTree(files: File[]): (File & { children: File[] })[] {
  return buildTree(files);
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

// Recursive component to render thread tree
interface ThreadTreeNodeProps {
  threads: (Thread & { children: Thread[] })[];
  expandedThreads: Set<string>;
  onThreadClick: (threadId: string) => void;
  onToggleExpanded: (threadId: string) => void;
  depth: number;
}

// Icon component for thread type (DAG nodes)
function ThreadIcon({ depth, hasChildren }: { depth: number; hasChildren: boolean }) {
  // Root/Branch nodes - circular node icon representing DAG branch points
  if (hasChildren) {
    return (
      <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8" strokeWidth="2" stroke="currentColor" fill="none" />
        <circle cx="12" cy="12" r="3" fill="currentColor" />
      </svg>
    );
  }

  // Leaf nodes - simple leaf icon representing terminal nodes in DAG
  return (
    <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 3c-1.5 4-4 6-7 7 3 1 5.5 3 7 7 1.5-4 4-6 7-7-3-1-5.5-3-7-7z"
      />
    </svg>
  );
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

function ThreadTreeNode({
  threads,
  expandedThreads,
  onThreadClick,
  onToggleExpanded,
  depth,
}: ThreadTreeNodeProps) {
  return (
    <>
      {threads.map((thread, index) => {
        const hasChildren = thread.children && thread.children.length > 0;
        const isExpanded = expandedThreads.has(thread.id);
        const paddingLeft = depth * 20; // 20px per depth level for graph spacing
        const isLastChild = index === threads.length - 1;

        return (
          <div key={thread.id} className="relative">
            {/* Tree lines - Graph style */}
            {depth > 0 && (
              <>
                {/* Vertical line from parent */}
                <div
                  className="absolute top-0 w-px bg-gray-300 dark:bg-gray-600 z-0"
                  style={{
                    left: `${20 + (depth - 1) * 20}px`,
                    height: isLastChild ? '20px' : '100%'
                  }}
                />
                {/* Horizontal line to icon */}
                <div
                  className="absolute h-px bg-gray-300 dark:bg-gray-600 z-0"
                  style={{
                    left: `${20 + (depth - 1) * 20}px`,
                    top: '20px',
                    width: '8px'
                  }}
                />
              </>
            )}

            <div
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors group cursor-pointer relative z-10',
                thread.isActive
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
              )}
              style={{ paddingLeft: `${16 + paddingLeft}px` }}
              onClick={() => {
                if (hasChildren) {
                  onToggleExpanded(thread.id);
                }
                onThreadClick(thread.id);
              }}
            >
              {/* Icon - Tree lines connect directly */}
              <div className="flex-shrink-0">
                <ThreadIcon depth={depth} hasChildren={hasChildren} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{thread.title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {thread.artifactCount} artifact{thread.artifactCount !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {/* Children */}
            {hasChildren && isExpanded && (
              <div className="mt-0.5">
                <ThreadTreeNode
                  threads={thread.children}
                  expandedThreads={expandedThreads}
                  onThreadClick={onThreadClick}
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

// Recursive component to render file tree
interface LocalFileTreeNodeProps {
  files: (File & { children: File[] })[];
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
                  files={file.children}
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
  onFileClick,
  onThreadClick,
  onCreateThread,
  onCreateFile,
  onCreateFolder,
  className,
}: WorkspaceSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFileId, setSelectedFileId] = useState<string>('');

  // Initialize with all parent threads expanded by default
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(() => {
    const parentsWithChildren = threads.filter(t =>
      threads.some(child => child.parentId === t.id)
    );
    return new Set(parentsWithChildren.map(t => t.id));
  });

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredThreads = threads.filter((thread) =>
    thread.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const threadTree = buildThreadTree(filteredThreads);
  const fileTreeNodes = convertToFileTreeNodes(filteredFiles);

  const toggleThreadExpanded = (threadId: string) => {
    setExpandedThreads(prev => {
      const next = new Set(prev);
      if (next.has(threadId)) {
        next.delete(threadId);
      } else {
        next.add(threadId);
      }
      return next;
    });
  };

  const handleFileSelect = (fileId: string) => {
    setSelectedFileId(fileId);
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

      {/* Search & Actions */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <input
          type="text"
          placeholder={`Search ${activeTab}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />

        {/* Action Buttons */}
        <div className="mt-2 flex gap-2">
          {activeTab === 'threads' && onCreateThread && (
            <button
              onClick={onCreateThread}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/50 rounded-md hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
              aria-label="Create new thread"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Thread
            </button>
          )}

          {activeTab === 'files' && (
            <>
              {onCreateFile && (
                <button
                  onClick={onCreateFile}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/50 rounded-md hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                  aria-label="Create new file"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  New File
                </button>
              )}

              {onCreateFolder && (
                <button
                  onClick={onCreateFolder}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  aria-label="Create new folder"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                  </svg>
                  New Folder
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'threads' && (
          <div className="p-2">
            {threadTree.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                No threads found
              </div>
            ) : (
              <ThreadTreeNode
                threads={threadTree as any}
                expandedThreads={expandedThreads}
                onThreadClick={onThreadClick}
                onToggleExpanded={toggleThreadExpanded}
                depth={0}
              />
            )}
          </div>
        )}

        {activeTab === 'files' && (
          <div className="p-2">
            {fileTreeNodes.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                No files found
              </div>
            ) : (
              fileTreeNodes.map(node => (
                <FileTreeNode
                  key={node.id}
                  node={node}
                  selectedFile={selectedFileId}
                  onSelect={handleFileSelect}
                  level={0}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
