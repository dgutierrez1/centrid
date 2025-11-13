import React, { useState } from 'react';
import { Button } from '../../components/button';

export interface ToolCallWidgetProps {
  /** Unique tool call ID */
  id: string;
  /** Tool name (create_file, edit_file, etc.) */
  name: string;
  /** Tool input parameters */
  input: Record<string, any>;
  /** Execution status */
  status: 'pending' | 'executing' | 'completed' | 'error';
  /** Tool result (when completed) */
  result?: Record<string, any>;
  /** Error message (when error) */
  error?: string;
  /** Approve handler (only shown when status is 'pending') */
  onApprove?: () => void;
  /** Reject handler (only shown when status is 'pending') */
  onReject?: () => void;
  className?: string;
}

export function ToolCallWidget({
  id,
  name,
  input,
  status,
  result,
  error,
  onApprove,
  onReject,
  className = '',
}: ToolCallWidgetProps) {
  const [isInputExpanded, setIsInputExpanded] = useState(false);
  const [isOutputExpanded, setIsOutputExpanded] = useState(false);

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

  const displayName = toolDisplayNames[name] || name;
  const icon = toolIcons[name] || toolIcons.create_file;

  // Extract primary parameter (file_path or path)
  const primaryParam = input.file_path || input.path || input.name || '';
  const displayParam = typeof primaryParam === 'string' ? primaryParam.split('/').pop() : String(primaryParam);

  // Status indicator
  const StatusIndicator = () => {
    switch (status) {
      case 'executing':
        return (
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-xs font-medium">Executing...</span>
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-xs font-medium">Completed</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-xs font-medium">Failed</span>
          </div>
        );
      case 'pending':
        return null; // Approval buttons will show instead
      default:
        return null;
    }
  };

  // Background color based on status
  const bgColorClass =
    status === 'error'
      ? 'bg-red-50 dark:bg-red-900/10 border-l-red-600'
      : status === 'completed'
        ? 'bg-gray-50 dark:bg-gray-800/30 border-l-gray-400'
        : status === 'executing'
          ? 'bg-blue-50 dark:bg-blue-900/10 border-l-blue-600'
          : 'bg-primary-50 dark:bg-primary-900/10 border-l-primary-600'; // pending

  return (
    <div
      className={`border-l-4 ${bgColorClass} rounded-lg my-2 ${className}`}
      data-testid="tool-call-widget"
      data-tool-id={id}
      data-tool-status={status}
    >
      <div className="px-3 py-2">
        {/* Row 1: Icon, Tool name, Key parameter, Status/Actions */}
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            className={`flex items-center justify-center w-8 h-8 rounded shrink-0 ${
              status === 'error'
                ? 'bg-red-600 text-white'
                : status === 'completed'
                  ? 'bg-green-600 text-white'
                  : status === 'executing'
                    ? 'bg-blue-600 text-white'
                    : 'bg-primary-600 text-white'
            }`}
          >
            {icon}
          </div>

          {/* Tool name + key parameter */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-gray-900 dark:text-white text-sm">{displayName}</span>
              {displayParam && (
                <span className="text-xs text-gray-600 dark:text-gray-400 font-mono truncate">
                  {displayParam}
                </span>
              )}
            </div>
          </div>

          {/* Status indicator or Approval buttons */}
          {status === 'pending' && onApprove && onReject ? (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={onReject}
                data-testid="reject-button"
                className="h-7 px-2 text-xs"
              >
                Reject
              </Button>
              <Button
                size="sm"
                onClick={onApprove}
                className="bg-primary-600 hover:bg-primary-700 h-7 px-2 text-xs"
                data-testid="approve-button"
              >
                Approve
              </Button>
            </div>
          ) : (
            <StatusIndicator />
          )}
        </div>

        {/* Row 2: Collapsible Input */}
        <div className="mt-2">
          <button
            onClick={() => setIsInputExpanded(!isInputExpanded)}
            className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            <svg
              className={`w-3 h-3 transform transition-transform ${isInputExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="font-medium">Input</span>
          </button>
          {isInputExpanded && (
            <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono overflow-x-auto">
              {JSON.stringify(input, null, 2)}
            </pre>
          )}
        </div>

        {/* Row 3: Collapsible Output (only if result or error exists) */}
        {(result || error) && (
          <div className="mt-2">
            <button
              onClick={() => setIsOutputExpanded(!isOutputExpanded)}
              className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              <svg
                className={`w-3 h-3 transform transition-transform ${isOutputExpanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="font-medium">{error ? 'Error' : 'Result'}</span>
            </button>
            {isOutputExpanded && (
              <pre
                className={`mt-1 p-2 rounded text-xs font-mono overflow-x-auto ${
                  error
                    ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}
              >
                {error || JSON.stringify(result, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
