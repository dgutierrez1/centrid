import React from 'react';
import { Card } from '../../components/card';
import { Button } from '../../components/button';
import { Badge } from '../../components/badge';
import { ScrollArea } from '../../components/scroll-area';

export interface ToolCallApprovalProps {
  /** Tool name (create_file, edit_file, delete_file, create_folder, create_branch, etc.) */
  toolName: string;
  /** Tool input parameters */
  toolInput: Record<string, any>;
  /** Optional preview content (for file creation/editing) */
  previewContent?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Approve handler */
  onApprove: () => void;
  /** Reject handler */
  onReject: (reason?: string) => void;
  className?: string;
}

export function ToolCallApproval({
  toolName,
  toolInput,
  previewContent,
  isLoading = false,
  onApprove,
  onReject,
  className = '',
}: ToolCallApprovalProps) {
  // Tool display names
  const toolDisplayNames: Record<string, string> = {
    create_file: 'Create File',
    edit_file: 'Edit File',
    delete_file: 'Delete File',
    create_folder: 'Create Folder',
    delete_folder: 'Delete Folder',
    create_branch: 'Create Branch',
    read_file: 'Read File',
    search_files: 'Search Files',
  };

  // Tool icons
  const toolIcons: Record<string, React.ReactNode> = {
    create_file: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
    edit_file: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
    ),
    delete_file: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
    ),
    create_folder: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
        />
      </svg>
    ),
    create_branch: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7h12M8 12h12m-12 5h12m-12-5H4m0 5H4m0-5H4m4-5H4"
        />
      </svg>
    ),
  };

  const displayName = toolDisplayNames[toolName] || toolName;
  const icon = toolIcons[toolName] || toolIcons.create_file;

  return (
    <Card
      className={`border-l-4 border-l-primary-600 bg-primary-50 dark:bg-primary-900/10 animate-slide-down ${className}`}
      data-testid="tool-call-approval"
    >
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-600 text-white">
              {icon}
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">{displayName}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI agent is requesting permission to perform this action
              </p>
            </div>
          </div>
          <Badge className="bg-primary-600 text-white shrink-0">Approval Required</Badge>
        </div>

        {/* Tool parameters */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-3 space-y-2">
          {Object.entries(toolInput).map(([key, value]) => (
            <div key={key} className="flex items-start gap-2 text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                {key.replace(/_/g, ' ')}:
              </span>
              <span className="text-gray-900 dark:text-white font-mono">{String(value)}</span>
            </div>
          ))}
        </div>

        {/* Preview */}
        {previewContent && (
          <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
            <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Preview
            </div>
            <ScrollArea className="max-h-[200px]">
              <pre className="p-3 text-xs text-gray-900 dark:text-white overflow-x-auto">
                {previewContent}
              </pre>
            </ScrollArea>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onReject()}
            disabled={isLoading}
            data-testid="reject-button"
          >
            Reject
          </Button>
          <Button
            onClick={onApprove}
            disabled={isLoading}
            className="bg-primary-600 hover:bg-primary-700"
            data-testid="approve-button"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Executing...
              </>
            ) : (
              'Approve'
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
