/**
 * File Tree Node Component
 * Recursive component for displaying file/folder hierarchy
 */

import React from 'react';
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  IndexingStatusIcon,
} from '@centrid/ui/components';
import {
  ChevronRightIcon,
  FolderIcon,
  FileTextIcon,
  MoreVerticalIcon,
  UploadIcon,
} from './icons';

export type IndexingStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface FileTreeNodeData {
  id: string;
  name: string;
  type: 'folder' | 'file';
  expanded?: boolean;
  children?: FileTreeNodeData[];
  indexingStatus?: IndexingStatus; // For documents only
}

export interface FileTreeNodeProps {
  node: FileTreeNodeData;
  selectedFile: string;
  onSelect: (name: string) => void;
  onRename?: (nodeId: string, nodeName: string, nodeType: 'folder' | 'file') => void;
  onDelete?: (nodeId: string, nodeName: string, nodeType: 'folder' | 'file') => void;
  onCreateSubfolder?: (folderId: string, folderName: string) => void;
  onCreateFileInFolder?: (folderId: string, folderName: string) => void;
  onUploadToFolder?: (folderId: string, folderName: string) => void;
  level?: number;
  // Parent-controlled expansion state
  expandedIds?: Set<string>;
  onToggleExpanded?: (id: string) => void;
}

export function FileTreeNode({
  node,
  selectedFile,
  onSelect,
  onRename,
  onDelete,
  onCreateSubfolder,
  onCreateFileInFolder,
  onUploadToFolder,
  level = 0,
  expandedIds,
  onToggleExpanded
}: FileTreeNodeProps) {
  const isFolder = node.type === 'folder';
  const isSelected = node.id === selectedFile;

  // Use parent-controlled state if provided, otherwise fall back to node.expanded
  const expanded = expandedIds ? expandedIds.has(node.id) : (node.expanded ?? false);

  return (
    <div>
      <div
        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-all duration-150 ease-in group ${
          isSelected
            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 scale-[1.02]'
            : 'hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-900 dark:text-white scale-100'
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => {
          if (isFolder) {
            // Use parent-controlled toggle if provided, otherwise no-op (backward compatible)
            if (onToggleExpanded) {
              onToggleExpanded(node.id);
            }
          } else {
            onSelect(node.id);
          }
        }}
      >
        {isFolder && (
          <ChevronRightIcon
            className={`h-4 w-4 transition-transform ${
              expanded ? 'rotate-90' : ''
            } ${isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500'}`}
          />
        )}
        {isFolder ? (
          <FolderIcon className={`h-4 w-4 flex-shrink-0 ${isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500'}`} />
        ) : (
          <FileTextIcon className={`h-4 w-4 flex-shrink-0 ${isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500'}`} />
        )}
        <span className="text-sm truncate flex-1">{node.name}</span>
        {!isFolder && node.indexingStatus && (
          <IndexingStatusIcon status={node.indexingStatus} className="ml-auto mr-1 flex-shrink-0" />
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 ml-auto opacity-100 md:opacity-0 md:group-hover:opacity-100"
            >
              <MoreVerticalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {isFolder && (
              <>
                <DropdownMenuItem
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onCreateSubfolder?.(node.id, node.name);
                  }}
                >
                  New Subfolder
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onCreateFileInFolder?.(node.id, node.name);
                  }}
                >
                  New File
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onUploadToFolder?.(node.id, node.name);
                  }}
                >
                  <UploadIcon className="h-4 w-4 mr-2" />
                  Upload Files...
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onRename?.(node.id, node.name, node.type);
              }}
            >
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-error-600"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onDelete?.(node.id, node.name, node.type);
              }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {isFolder && expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.id}
              node={child}
              selectedFile={selectedFile}
              onSelect={onSelect}
              onRename={onRename}
              onDelete={onDelete}
              onCreateSubfolder={onCreateSubfolder}
              onCreateFileInFolder={onCreateFileInFolder}
              onUploadToFolder={onUploadToFolder}
              level={level + 1}
              expandedIds={expandedIds}
              onToggleExpanded={onToggleExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
}
