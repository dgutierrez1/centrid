/**
 * FileUploadModal - Presentational Component
 * Pure UI component with no business logic - all state and handlers passed as props
 */

import React, { ReactNode } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ScrollArea,
} from '@centrid/ui/components';
import { UploadProgress, type UploadFileItem } from '@centrid/ui/components';
import { cn } from '@centrid/shared/utils';

export interface FileUploadModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Called when modal open state changes */
  onOpenChange: (open: boolean) => void;
  /** Files currently being uploaded */
  uploadingFiles?: UploadFileItem[];
  /** Called when files are dropped or selected */
  onFilesSelected?: (files: FileList | File[]) => void;
  /** Called when user clicks retry on a failed upload */
  onRetry?: (fileId: string) => void;
  /** Called when user removes a file from the list */
  onRemove?: (fileId: string) => void;
  /** Called when user clears completed uploads */
  onClearCompleted?: () => void;
  /** Whether drag is currently active */
  isDragging?: boolean;
  /** Called when drag enters the zone */
  onDragEnter?: (e: React.DragEvent<HTMLDivElement>) => void;
  /** Called when drag leaves the zone */
  onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void;
  /** Called when drag is over the zone */
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  /** Upload statistics */
  stats?: {
    total: number;
    completed: number;
    failed: number;
    uploading: number;
    pending: number;
  };
  /** Maximum file size in MB */
  maxFileSizeMB?: number;
  /** Allowed file extensions */
  allowedExtensions?: string[];
  /** Icon components for different upload states */
  icons?: {
    upload?: ReactNode;
    pending?: ReactNode;
    uploading?: ReactNode;
    completed?: ReactNode;
    error?: ReactNode;
    retry?: ReactNode;
    remove?: ReactNode;
  };
  /** Ref for hidden file input (optional - for advanced use cases) */
  fileInputRef?: React.RefObject<HTMLInputElement>;
  /** Target folder ID for uploads (null = root folder) */
  targetFolderId?: string | null;
  /** Target folder name for display in breadcrumb */
  targetFolderName?: string;
}

export function FileUploadModal({
  open,
  onOpenChange,
  uploadingFiles = [],
  onFilesSelected,
  onRetry,
  onRemove,
  onClearCompleted,
  isDragging = false,
  onDragEnter,
  onDragLeave,
  onDragOver,
  stats = { total: 0, completed: 0, failed: 0, uploading: 0, pending: 0 },
  maxFileSizeMB = 10,
  allowedExtensions = ['.md', '.txt'],
  icons,
  fileInputRef,
  targetFolderId,
  targetFolderName,
}: FileUploadModalProps) {
  const hasFiles = uploadingFiles.length > 0;
  const hasActiveUploads = stats.uploading > 0 || stats.pending > 0;

  // Generate stable ID for label/input binding
  const inputId = React.useMemo(() => `file-upload-${Math.random().toString(36).substr(2, 9)}`, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    console.log('[FileUploadModal] File input changed', { filesCount: files?.length });
    if (files && files.length > 0 && onFilesSelected) {
      onFilesSelected(files);
      // Reset input so same file can be selected again
      e.target.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
          <DialogDescription>
            {targetFolderName ? (
              <span className="flex flex-col gap-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Uploading to: <span className="font-medium text-gray-900 dark:text-gray-100">{targetFolderName}</span> &gt;
                </span>
                <span className="text-xs text-gray-500">
                  {allowedExtensions.join(', ')} files (max {maxFileSizeMB}MB each)
                </span>
              </span>
            ) : (
              <span>Upload {allowedExtensions.join(', ')} files (max {maxFileSizeMB}MB each)</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drag & Drop Zone - Hide on mobile when files are already uploading */}
          {/* Mobile: Files selected via native picker before modal opens, so no need for drop zone */}
          {/* Desktop: Modal opened first, need drop zone to select files */}
          {(!hasActiveUploads || uploadingFiles.length === 0) && (
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200',
                'hidden sm:block', // Hide on mobile, show on desktop
                isDragging
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-[1.02]'
                  : 'border-gray-300 dark:border-gray-700 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-900'
              )}
              onDragEnter={onDragEnter}
              onDragLeave={onDragLeave}
              onDragOver={onDragOver}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const files = e.dataTransfer.files;
                console.log('[FileUploadModal] Files dropped', { filesCount: files.length });
                if (files.length > 0 && onFilesSelected) {
                  onFilesSelected(files);
                }
              }}
            >
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              id={inputId}
              type="file"
              multiple
              accept=".md,.txt,text/markdown,text/plain"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
              aria-label="Upload files"
            />

            {/* Clickable label - native browser behavior via htmlFor */}
            <label
              htmlFor={inputId}
              className="cursor-pointer block"
            >
              <div className="flex flex-col items-center">
                {icons?.upload || (
                  <svg
                    className="h-8 w-8 mx-auto text-gray-400 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                )}
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Drop files here or click to browse
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {allowedExtensions.join(', ')} files up to {maxFileSizeMB}MB
                </p>
              </div>
            </label>
          </div>
          )}

          {/* Upload Queue */}
          {hasFiles && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Upload Queue ({stats.total})
                </span>
                {stats.completed > 0 && onClearCompleted && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onClearCompleted}
                    className="text-xs h-6 px-2"
                  >
                    Clear Completed
                  </Button>
                )}
              </div>

              <ScrollArea className="h-48 rounded-md border border-gray-200 dark:border-gray-700 p-2">
                <UploadProgress
                  files={uploadingFiles}
                  onRetry={onRetry}
                  onRemove={onRemove}
                  icons={icons}
                />
              </ScrollArea>

              {/* Stats */}
              <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-400">
                {stats.completed > 0 && (
                  <span className="text-success-600 dark:text-success-400">
                    ✓ {stats.completed} completed
                  </span>
                )}
                {stats.failed > 0 && (
                  <span className="text-error-600 dark:text-error-400">
                    ✗ {stats.failed} failed
                  </span>
                )}
                {stats.uploading > 0 && <span>⬆ {stats.uploading} uploading</span>}
                {stats.pending > 0 && <span>⏳ {stats.pending} pending</span>}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {hasActiveUploads ? 'Close' : 'Done'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
