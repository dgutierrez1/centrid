import * as React from 'react';
import { cn } from '../../lib/utils';
import { Card, CardContent } from '../../components/card';
import { Icons } from '../../components/icon';
import { Badge } from '../../components/badge';
import { Button } from '../../components/button';

export interface TreeNode {
  id: string;
  title: string;
  /** Parent node ID (null for root) */
  parentId: string | null;
  /** Artifact count */
  artifactCount: number;
  /** Last activity timestamp */
  lastActivityAt: Date;
  /** Whether this is the currently active branch */
  isActive: boolean;
  /** Creator */
  createdBy: 'user' | 'agent' | 'system';
}

export interface VisualTreeViewProps {
  /** All nodes in the tree */
  nodes: TreeNode[];
  /** Callback when node is clicked */
  onNodeClick?: (nodeId: string) => void;
  /** Callback when node is double-clicked (navigate to branch) */
  onNodeDoubleClick?: (nodeId: string) => void;
  /** Width of the tree view */
  width?: number;
  /** Height of the tree view */
  height?: number;
}

const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;
const HORIZONTAL_SPACING = 80;
const VERTICAL_SPACING = 120;

export const VisualTreeView = React.forwardRef<HTMLDivElement, VisualTreeViewProps>(
  ({ nodes, onNodeClick, onNodeDoubleClick, width = 1200, height = 600 }, ref) => {
    const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);

    // Build tree structure
    const { rootNodes, nodeMap, childrenMap } = React.useMemo(() => {
      const map = new Map(nodes.map((n) => [n.id, n]));
      const children = new Map<string, TreeNode[]>();

      nodes.forEach((node) => {
        if (node.parentId) {
          const siblings = children.get(node.parentId) || [];
          siblings.push(node);
          children.set(node.parentId, siblings);
        }
      });

      const roots = nodes.filter((n) => n.parentId === null);

      return { rootNodes: roots, nodeMap: map, childrenMap: children };
    }, [nodes]);

    // Calculate node positions (simple top-down tree layout)
    const nodePositions = React.useMemo(() => {
      const positions = new Map<string, { x: number; y: number }>();
      let nextXOffset = 0;

      const calculatePosition = (node: TreeNode, depth: number, xOffset: number) => {
        const x = xOffset;
        const y = depth * (NODE_HEIGHT + VERTICAL_SPACING) + 40;

        positions.set(node.id, { x, y });

        const children = childrenMap.get(node.id) || [];
        let childXOffset = xOffset;

        children.forEach((child, index) => {
          calculatePosition(child, depth + 1, childXOffset);
          childXOffset += NODE_WIDTH + HORIZONTAL_SPACING;
        });

        // Update next x offset for sibling branches
        if (children.length === 0) {
          nextXOffset = Math.max(nextXOffset, xOffset + NODE_WIDTH + HORIZONTAL_SPACING);
        } else {
          nextXOffset = childXOffset;
        }
      };

      rootNodes.forEach((root, index) => {
        calculatePosition(root, 0, nextXOffset);
      });

      return positions;
    }, [rootNodes, childrenMap]);

    // Calculate edges
    const edges = React.useMemo(() => {
      const result: Array<{ from: { x: number; y: number }; to: { x: number; y: number } }> = [];

      nodes.forEach((node) => {
        if (node.parentId) {
          const parentPos = nodePositions.get(node.parentId);
          const nodePos = nodePositions.get(node.id);

          if (parentPos && nodePos) {
            result.push({
              from: { x: parentPos.x + NODE_WIDTH / 2, y: parentPos.y + NODE_HEIGHT },
              to: { x: nodePos.x + NODE_WIDTH / 2, y: nodePos.y },
            });
          }
        }
      });

      return result;
    }, [nodes, nodePositions]);

    // Calculate viewBox to fit all nodes
    const viewBox = React.useMemo(() => {
      let minX = 0,
        maxX = width,
        minY = 0,
        maxY = height;

      nodePositions.forEach(({ x, y }) => {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x + NODE_WIDTH);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y + NODE_HEIGHT);
      });

      return {
        x: minX - 40,
        y: minY - 40,
        width: maxX - minX + 80,
        height: maxY - minY + 80,
      };
    }, [nodePositions, width, height]);

    const handleNodeClick = (nodeId: string) => {
      setSelectedNodeId(nodeId);
      onNodeClick?.(nodeId);
    };

    const handleNodeDoubleClick = (nodeId: string) => {
      onNodeDoubleClick?.(nodeId);
    };

    return (
      <div ref={ref} className="relative w-full h-full overflow-auto bg-gray-50 dark:bg-gray-900">
        <svg
          width="100%"
          height="100%"
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
          className="min-w-full min-h-full"
        >
          {/* Edges */}
          {edges.map((edge, i) => (
            <line
              key={i}
              x1={edge.from.x}
              y1={edge.from.y}
              x2={edge.to.x}
              y2={edge.to.y}
              stroke="currentColor"
              strokeWidth={2}
              className="text-gray-300 dark:text-gray-700"
            />
          ))}

          {/* Nodes */}
          {nodes.map((node) => {
            const pos = nodePositions.get(node.id);
            if (!pos) return null;

            const isSelected = selectedNodeId === node.id;

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => handleNodeClick(node.id)}
                onDoubleClick={() => handleNodeDoubleClick(node.id)}
                className="cursor-pointer"
              >
                {/* Node background */}
                <rect
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx={8}
                  fill="currentColor"
                  className={cn(
                    'transition-colors',
                    node.isActive
                      ? 'text-primary-100 dark:text-primary-900'
                      : 'text-white dark:text-gray-800',
                    isSelected && 'text-primary-50 dark:text-primary-950'
                  )}
                  stroke="currentColor"
                  strokeWidth={node.isActive ? 3 : isSelected ? 2 : 1}
                  className={cn(
                    node.isActive
                      ? 'text-primary-500'
                      : isSelected
                        ? 'text-primary-400'
                        : 'text-gray-300 dark:text-gray-600'
                  )}
                />

                {/* Node content */}
                <foreignObject width={NODE_WIDTH} height={NODE_HEIGHT}>
                  <div className="flex flex-col h-full p-3">
                    {/* Title */}
                    <div className="flex-1 min-h-0">
                      <p
                        className={cn(
                          'text-sm font-semibold truncate',
                          node.isActive
                            ? 'text-primary-700 dark:text-primary-300'
                            : 'text-gray-700 dark:text-gray-300'
                        )}
                      >
                        {node.title}
                      </p>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1.5">
                        {node.artifactCount > 0 && (
                          <div className="flex items-center gap-1">
                            <Icons.file className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {node.artifactCount}
                            </span>
                          </div>
                        )}
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(node.lastActivityAt)}
                        </span>
                      </div>
                      {node.createdBy === 'agent' && (
                        <Icons.sparkles className="h-3.5 w-3.5 text-primary-500" />
                      )}
                    </div>
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="absolute top-4 right-4 space-y-2">
          <Card className="w-48">
            <CardContent className="p-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 border-primary-500 bg-primary-100 dark:bg-primary-900" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Active branch</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icons.sparkles className="w-4 h-4 text-primary-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Agent-created
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Icons.file className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">File count</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
);
VisualTreeView.displayName = 'VisualTreeView';

/** Format timestamp as relative time */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
