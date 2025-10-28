import React from 'react';
import { Button } from '../../components/button';

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

  // Extract primary parameter (file_path or path)
  const primaryParam = toolInput.file_path || toolInput.path || toolInput.name || '';
  const displayParam = typeof primaryParam === 'string' ? primaryParam.split('/').pop() : String(primaryParam);

  return (
    <div
      className={`border-l-4 border-l-primary-600 bg-primary-50 dark:bg-primary-900/10 rounded-lg animate-slide-down ${className}`}
      data-testid="tool-call-approval"
    >
      <div className="px-3 py-2">
        {/* Row 1: Icon, Tool name, Key parameter, Actions */}
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="flex items-center justify-center w-8 h-8 rounded bg-primary-600 text-white shrink-0">
            {icon}
          </div>

          {/* Tool name + key parameter */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-gray-900 dark:text-white text-sm">
                {displayName}
              </span>
              {displayParam && (
                <span className="text-xs text-gray-600 dark:text-gray-400 font-mono truncate">
                  {displayParam}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReject()}
              disabled={isLoading}
              data-testid="reject-button"
              className="h-7 px-2 text-xs"
            >
              Reject
            </Button>
            <Button
              size="sm"
              onClick={onApprove}
              disabled={isLoading}
              className="bg-primary-600 hover:bg-primary-700 h-7 px-2 text-xs"
              data-testid="approve-button"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-1 h-3 w-3"
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

        {/* Row 2 (optional): Additional context - only show if multiple params or preview */}
        {(Object.keys(toolInput).length > 1 || previewContent) && (
          <div className="mt-1 ml-11 text-xs text-gray-600 dark:text-gray-400">
            {previewContent ? (
              <span className="truncate block">Preview: {previewContent.slice(0, 80)}...</span>
            ) : (
              Object.entries(toolInput)
                .filter(([key]) => key !== 'file_path' && key !== 'path' && key !== 'name')
                .slice(0, 1)
                .map(([key, value]) => (
                  <span key={key}>
                    {key.replace(/_/g, ' ')}: <span className="font-mono">{String(value).slice(0, 40)}</span>
                  </span>
                ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
