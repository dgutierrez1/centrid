/**
 * FileUploadModalContainer - Smart Container Component
 * Connects presentational FileUploadModal with business logic
 *
 * Architecture:
 * - Presentational Component: packages/ui/src/features/filesystem-markdown-editor/FileUploadModal
 * - This Container: Adds drag-and-drop state + icons + converts types
 * - Parent (WorkspaceLayout): Calls useFileUpload hook and passes all state/handlers
 */

import { useRef, useState, DragEvent } from 'react';
import { FileUploadModal } from '@centrid/ui/features/filesystem-markdown-editor';
import {
  UploadIcon,
  FileTextIcon,
  CheckIcon,
  XCircleIcon,
  RefreshCwIcon
} from 'lucide-react';
import type { UploadFileItem } from '@centrid/ui/components';
import type { UploadingFile } from '@/lib/contexts/file-upload.context';

interface FileUploadModalContainerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  uploadingFiles: UploadingFile[];
  onFilesSelected: (files: FileList | File[]) => void;
  onRetry: (fileId: string) => void;
  onRemove: (fileId: string) => void;
  onClearCompleted: () => void;
  stats: {
    total: number;
    completed: number;
    failed: number;
    uploading: number;
    pending: number;
  };
  targetFolderId?: string | null;
  targetFolderName?: string;
}

/**
 * Container component that adds UI-specific state (drag) and wires presentational FileUploadModal
 */
export function FileUploadModalContainer({
  open,
  onOpenChange,
  uploadingFiles,
  onFilesSelected,
  onRetry,
  onRemove,
  onClearCompleted,
  stats,
  targetFolderId,
  targetFolderName,
}: FileUploadModalContainerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Drag handlers
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleFilesSelected = (files: FileList | File[]) => {
    console.log('[FileUploadModalContainer] Files selected:', files.length, 'files');
    setIsDragging(false);
    onFilesSelected(files);
  };

  // Convert UploadingFile to UploadFileItem
  const uploadFileItems: UploadFileItem[] = uploadingFiles.map((file) => ({
    id: file.id,
    name: file.name,
    progress: file.progress,
    status: file.status,
    error: file.error,
  }));

  return (
    <FileUploadModal
      open={open}
      onOpenChange={onOpenChange}
      uploadingFiles={uploadFileItems}
      onFilesSelected={handleFilesSelected}
      onRetry={onRetry}
      onRemove={onRemove}
      onClearCompleted={onClearCompleted}
      isDragging={isDragging}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      stats={stats}
      maxFileSizeMB={10}
      allowedExtensions={['.md', '.txt']}
      icons={{
        upload: <UploadIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />,
        pending: <FileTextIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />,
        uploading: <FileTextIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />,
        completed: <CheckIcon className="h-4 w-4 text-success-600 flex-shrink-0" />,
        error: <XCircleIcon className="h-4 w-4 text-error-600 flex-shrink-0" />,
        retry: <RefreshCwIcon className="h-3 w-3" />,
        remove: <XCircleIcon className="h-3 w-3" />,
      }}
      fileInputRef={fileInputRef}
      targetFolderId={targetFolderId}
      targetFolderName={targetFolderName}
    />
  );
}
