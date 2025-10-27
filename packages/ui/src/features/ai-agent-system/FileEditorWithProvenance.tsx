import * as React from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../../components/button';
import { Icons } from '../../components/icon';
import { Badge } from '../../components/badge';
import { MarkdownEditor } from '../../components/markdown-editor';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/tooltip';

export interface ProvenanceData {
  /** Source branch where file was created */
  sourceBranch: string;
  /** Source branch ID for navigation */
  sourceBranchId: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Context summary (2-3 sentences) */
  contextSummary: string;
  /** Last edited by (user or agent) */
  lastEditedBy: 'user' | 'agent';
  /** Last edit timestamp */
  lastEditedAt?: Date;
  /** Branch where last edit occurred (if agent edit) */
  editedInBranch?: string;
  /** Branch ID for navigation (if agent edit) */
  editedInBranchId?: string;
}

export interface FileEditorWithProvenanceProps {
  /** File path/name */
  filePath: string;
  /** File content */
  content: string;
  /** Callback when content changes */
  onContentChange?: (content: string) => void;
  /** Provenance data (null for manually created files) */
  provenance: ProvenanceData | null;
  /** Callback when "Go to source" is clicked */
  onGoToSource?: (branchId: string) => void;
  /** Whether editor is read-only */
  readOnly?: boolean;
  /** Whether file is currently saving */
  isSaving?: boolean;
}

export const FileEditorWithProvenance = React.forwardRef<HTMLDivElement, FileEditorWithProvenanceProps>(
  (
    {
      filePath,
      content,
      onContentChange,
      provenance,
      onGoToSource,
      readOnly = false,
      isSaving = false,
    },
    ref
  ) => {
    return (
      <div ref={ref} className="flex flex-col h-full bg-white dark:bg-gray-900">
        {/* Provenance Header */}
        {provenance && (
          <div className="shrink-0 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-50/50 to-transparent dark:from-primary-900/20">
            <div className="px-4 py-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 min-w-0 flex-1">
                  {/* Created In */}
                  <div className="flex items-center gap-2">
                    <Icons.sparkles className="h-4 w-4 shrink-0 text-primary-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      AI-Generated File
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {provenance.sourceBranch}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(provenance.createdAt)}
                    </span>
                  </div>

                  {/* Context Summary */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {provenance.contextSummary}
                  </p>

                  {/* Last Edit Info */}
                  {provenance.lastEditedAt && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Icons.edit className="h-3 w-3" />
                      <span>
                        Last edited by {provenance.lastEditedBy}
                        {provenance.editedInBranch && ` in ${provenance.editedInBranch}`}
                        {' • '}
                        {formatTimeAgo(provenance.lastEditedAt)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Go to Source Button */}
                <div className="shrink-0">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onGoToSource?.(provenance.sourceBranchId)}
                        >
                          <Icons.externalLink className="h-3.5 w-3.5 mr-1.5" />
                          Go to source
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          View the conversation where this file was created
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* File Header (always shown) */}
        <div className="shrink-0 border-b border-gray-200 dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Icons.file className="h-4 w-4 shrink-0 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                {filePath}
              </span>
              {!provenance && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="secondary" className="text-xs">
                        Manual
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Manually created file (no provenance)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            {isSaving && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Icons.loader className="h-3.5 w-3.5 animate-spin" />
                <span>Saving...</span>
              </div>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          <MarkdownEditor
            value={content}
            onChange={onContentChange}
            readOnly={readOnly}
            className="h-full"
          />
        </div>
      </div>
    );
  }
);
FileEditorWithProvenance.displayName = 'FileEditorWithProvenance';

/** Format timestamp as relative time */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString();
}
