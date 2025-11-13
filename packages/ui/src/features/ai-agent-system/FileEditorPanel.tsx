import React from 'react';
import { cn } from '../../lib/utils';
import { MarkdownEditor, SaveIndicator, type SaveStatus } from '@centrid/ui/components';
import { FilePanelSkeleton } from './FilePanelSkeleton';

// Legacy interfaces kept for backwards compatibility
export interface Provenance {
  createdAt: Date;
  createdBy: 'agent' | 'user';
  sourceBranch: string;
  sourceThreadId: string;
  sourceMessageId: string;
  lastEditedAt?: Date;
  lastEditedBy?: 'agent' | 'user';
  lastEditSourceThreadId?: string;
}

export interface FileData {
  id: string;
  name: string;
  content: string;
  provenance?: Provenance | null;
}

// Accept any file-like object with required fields
export interface FileEditorPanelProps {
  file?: (Pick<FileData, 'id' | 'name' | 'content'> & Partial<FileData>) | null;
  isOpen: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onGoToSource?: (branchId: string, messageId: string) => void;
  onFileChange?: (content: string) => void;
  onDelete?: () => Promise<void>;
  isDeleting?: boolean;
  saveStatus?: SaveStatus;
  lastSavedAt?: Date | null;
  hasUnsavedChanges?: boolean;
  className?: string;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
}

export function FileEditorPanel({
  file,
  isOpen,
  isLoading = false,
  onClose,
  onGoToSource,
  onFileChange,
  saveStatus = 'idle',
  lastSavedAt = null,
  hasUnsavedChanges = false,
  className,
}: FileEditorPanelProps) {
  if (!isOpen) return null;

  // Show skeleton while loading
  if (isLoading || !file) {
    return <FilePanelSkeleton className={className} />;
  }

  // Shimmer wrapper when saving
  const isSaving = saveStatus === 'saving';
  const contentWrapperClasses = cn(
    'flex flex-col h-full bg-white dark:bg-gray-800',
    isSaving ? 'border-l-0' : 'border-l border-gray-200 dark:border-gray-700',
    className
  );

  return (
    <div className={cn('relative', contentWrapperClasses)}>
      {/* Provenance Header */}
      {file.provenance && (
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">
                AI-Generated
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Created {formatTimeAgo(file.provenance.createdAt)}
              </span>
            </div>
            {onGoToSource && (
              <button
                onClick={() => onGoToSource(file.provenance!.sourceThreadId, file.provenance!.sourceMessageId)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Go to source →
              </button>
            )}
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            Source: {file.provenance.sourceBranch}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            Created by {file.provenance.createdBy === 'agent' ? 'AI Agent' : 'You'} while exploring in branch "{file.provenance.sourceBranch}".
          </p>
          {file.provenance.lastEditedAt && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>Last edited by: {file.provenance.lastEditedBy === 'agent' ? 'Agent' : 'You'}</span>
              <span>•</span>
              <span>{formatTimeAgo(file.provenance.lastEditedAt)}</span>
            </div>
          )}
        </div>
      )}

      {/* File Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {file.name}
          </h2>
          <SaveIndicator
            status={saveStatus}
            lastSavedAt={lastSavedAt}
            hasUnsavedChanges={hasUnsavedChanges}
            debounceMs={3000}
          />
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors ml-2"
          aria-label="Close file editor"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* File Content */}
      <div className="flex-1 overflow-hidden bg-white dark:bg-gray-900">
        <MarkdownEditor
          content={file.content}
          onChange={onFileChange}
          readOnly={false}
          showToolbar={true}
          className="h-full"
          placeholder="Start writing..."
        />
      </div>

      {/* Shimmer border when saving - 1px left border animation */}
      {isSaving && (
        <div className="absolute inset-y-0 left-0 w-[1px] bg-gradient-to-b from-primary-600/30 via-primary-500 to-primary-600/30 dark:from-primary-400/30 dark:via-primary-300 dark:to-primary-400/30 animate-shimmer bg-[length:100%_200%]" />
      )}
    </div>
  );
}
