import { Tree } from 'react-arborist';
import type { NodeApi } from 'react-arborist';
import type { FileSystemNode } from '@centrid/shared/types';

export interface FileTreeProps {
  data: readonly FileSystemNode[];
  selectedId?: string | null;
  onSelect?: (node: FileSystemNode) => void;
  onMove?: (draggedId: string, parentId: string | null) => void;
  onRename?: (nodeId: string, newName: string) => void;
  onDelete?: (nodeId: string) => void;
  onContextMenu?: (node: FileSystemNode, event: React.MouseEvent) => void;
  className?: string;
  height?: number;
}

/**
 * FileTree component using react-arborist
 * Supports drag-and-drop, keyboard navigation, and context menus
 */
export function FileTree({
  data,
  selectedId,
  onSelect,
  onMove,
  onRename,
  onDelete,
  onContextMenu,
  className = '',
  height = 600,
}: FileTreeProps) {
  return (
    <div className={`h-full w-full ${className}`}>
      <Tree
        data={data}
        openByDefault={false}
        width="100%"
        height={height}
        indent={0}
        rowHeight={32}
        overscanCount={10}
        selection={selectedId || undefined}
        onSelect={(nodes) => {
          if (nodes.length > 0 && onSelect) {
            onSelect(nodes[0].data);
          }
        }}
        onMove={({ dragIds, parentId }) => {
          if (onMove && dragIds.length > 0) {
            onMove(dragIds[0], parentId);
          }
        }}
        onRename={({ id, name }) => {
          if (onRename) {
            onRename(id as string, name);
          }
        }}
        onDelete={({ ids }) => {
          if (onDelete && ids.length > 0) {
            onDelete(ids[0] as string);
          }
        }}
      >
        {Node}
      </Tree>
    </div>
  );
}

/**
 * Custom node renderer for file tree
 */
function Node({ node, style, dragHandle }: { node: NodeApi<FileSystemNode>; style: React.CSSProperties; dragHandle?: any }) {
  const nodeData = node.data;
  const isFolder = nodeData.type === 'folder';
  const isSelected = node.isSelected;

  return (
    <div
      ref={dragHandle}
      style={style}
      className={`flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-gray-100 ${
        isSelected ? 'bg-primary-50 border-l-2 border-primary-600' : ''
      }`}
      onClick={() => node.select()}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {/* Expand/collapse arrow for folders */}
      {isFolder && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            node.toggle();
          }}
          className="h-4 w-4 flex items-center justify-center flex-shrink-0"
        >
          <svg
            className={`h-3 w-3 transition-transform ${node.isOpen ? 'rotate-90' : ''}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
      {!isFolder && <div className="h-4 w-4 flex-shrink-0" />}

      {/* Icon */}
      {isFolder ? (
        <svg className="h-4 w-4 text-primary-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
        </svg>
      ) : (
        <svg className="h-4 w-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      )}

      {/* Name */}
      <span className="flex-1 truncate text-sm text-gray-700">{nodeData.name}</span>

      {/* Indexing status indicator for documents */}
      {!isFolder && nodeData.indexingStatus && nodeData.indexingStatus !== 'completed' && (
        <span
          className={`h-2 w-2 rounded-full ${
            nodeData.indexingStatus === 'pending' ? 'bg-gray-400' :
            nodeData.indexingStatus === 'in_progress' ? 'bg-primary-400 animate-pulse' :
            nodeData.indexingStatus === 'failed' ? 'bg-error-500' :
            'bg-success-500'
          }`}
          title={`Indexing: ${nodeData.indexingStatus}`}
        />
      )}
    </div>
  );
}
