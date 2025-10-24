/**
 * FileUploadProvider - Global Upload State Management
 *
 * Centralizes all file upload logic using React Context
 * Benefits:
 * - Upload state persists across navigation
 * - Uploads continue in background when modal is closed
 * - Single source of truth for upload queue
 * - Reusable across entire app
 */

import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { toast } from 'react-hot-toast';
import { filesystemService } from '@/lib/services/filesystem.service';
import { addDocument } from '@/lib/state/filesystem';
import type { Document } from '@centrid/shared/types';

export interface UploadingFile {
  id: string;
  file: File;
  folderId: string | null;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
  name: string;
}

interface UploadStats {
  total: number;
  completed: number;
  failed: number;
  uploading: number;
  pending: number;
}

interface FileUploadContextValue {
  // State
  uploadingFiles: UploadingFile[];
  isUploadModalOpen: boolean;
  targetFolderId: string | null;
  targetFolderName: string | undefined;

  // Upload operations
  addFiles: (files: FileList | File[], folderId?: string | null) => void;
  retryUpload: (fileId: string) => void;
  removeFile: (fileId: string) => void;
  clearCompleted: () => void;

  // Modal control
  openUploadModal: (folderId?: string | null, folderName?: string) => void;
  closeUploadModal: () => void;
  setIsUploadModalOpen: (open: boolean) => void;

  // Stats
  getStats: () => UploadStats;
}

const FileUploadContext = createContext<FileUploadContextValue | null>(null);

interface FileUploadProviderProps {
  children: ReactNode;
}

export function FileUploadProvider({ children }: FileUploadProviderProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null);
  const [targetFolderName, setTargetFolderName] = useState<string | undefined>(undefined);
  const isProcessingRef = useRef(false);

  // Validation constants
  const ALLOWED_EXTENSIONS = ['.md', '.txt'];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  /**
   * Validate files before adding to queue
   */
  const validateFiles = useCallback((files: FileList | File[]): { valid: File[]; invalid: Array<{ name: string; reason: string }> } => {
    const valid: File[] = [];
    const invalid: Array<{ name: string; reason: string }> = [];

    Array.from(files).forEach((file) => {
      // Check file extension
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        invalid.push({
          name: file.name,
          reason: `Invalid file type. Only ${ALLOWED_EXTENSIONS.join(', ')} allowed`,
        });
        return;
      }

      // Check file size
      if (file.size === 0) {
        invalid.push({
          name: file.name,
          reason: 'File is empty',
        });
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        const sizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
        invalid.push({
          name: file.name,
          reason: `File too large (max ${sizeMB}MB)`,
        });
        return;
      }

      valid.push(file);
    });

    return { valid, invalid };
  }, []);

  /**
   * Process upload queue sequentially
   */
  const processQueue = useCallback(async () => {
    console.log('[FileUploadProvider] processQueue called, isProcessing:', isProcessingRef.current);
    if (isProcessingRef.current) {
      console.log('[FileUploadProvider] Already processing, returning early');
      return;
    }

    // Find next pending file
    setUploadingFiles((currentFiles) => {
      const nextPending = currentFiles.find((f) => f.status === 'pending');
      console.log('[FileUploadProvider] Looking for pending files, found:', nextPending?.name || 'none');

      if (!nextPending) {
        // No more files to process
        isProcessingRef.current = false;
        console.log('[FileUploadProvider] No pending files, queue complete');
        return currentFiles;
      }

      // Process this file
      console.log('[FileUploadProvider] Setting isProcessing to true for:', nextPending.name);
      isProcessingRef.current = true;

      // Update to uploading status
      const updatedFiles = currentFiles.map((f) =>
        f.id === nextPending.id ? { ...f, status: 'uploading' as const, progress: 0 } : f
      );

      // Start async upload (don't await here, handle in separate async IIFE)
      (async () => {
        try {
          console.log('[FileUploadProvider] Starting upload for:', nextPending.name);

          // Upload via service
          const result = await filesystemService.uploadDocument(
            nextPending.file,
            nextPending.folderId,
            (progress) => {
              setUploadingFiles((prev) =>
                prev.map((f) => (f.id === nextPending.id ? { ...f, progress } : f))
              );
            }
          );

          if (result.success) {
            setUploadingFiles((prev) =>
              prev.map((f) =>
                f.id === nextPending.id
                  ? { ...f, status: 'completed' as const, progress: 100 }
                  : f
              )
            );

            // IMPORTANT: Manually add document to filesystem state
            // Real-time subscription should handle this, but as fallback we add it immediately
            // addDocument is idempotent, so duplicate adds are safe
            if (result.data) {
              console.log('[FileUploadProvider] Manually adding document to filesystem:', result.data.name);
              addDocument(result.data as Document);
            }

            toast.success(`Uploaded ${nextPending.name}`);
          } else {
            throw new Error(result.error || 'Upload failed');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Upload failed';
          console.error('[FileUploadProvider] Upload error:', errorMessage);
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === nextPending.id
                ? { ...f, status: 'error' as const, error: errorMessage }
                : f
            )
          );
          toast.error(`Failed to upload ${nextPending.name}: ${errorMessage}`);
        } finally {
          isProcessingRef.current = false;

          // Check if there are more pending files before recursing
          setUploadingFiles((currentFiles) => {
            const hasMorePending = currentFiles.some((f) => f.status === 'pending');
            if (hasMorePending) {
              setTimeout(() => processQueue(), 100);
            }
            return currentFiles;
          });
        }
      })();

      return updatedFiles;
    });
  }, []);

  /**
   * Auto-process queue when new files are added
   * REMOVED: This was causing duplicate uploads because processQueue is called
   * both from here AND from the async IIFE's finally block
   */
  // useEffect(() => {
  //   const hasPending = uploadingFiles.some((f) => f.status === 'pending');
  //   const isProcessing = isProcessingRef.current;

  //   if (hasPending && !isProcessing) {
  //     processQueue();
  //   }
  // }, [uploadingFiles, processQueue]);

  /**
   * Add files to upload queue
   */
  const addFiles = useCallback((files: FileList | File[], folderId: string | null = null) => {
    console.log('[FileUploadProvider] addFiles called', {
      filesCount: files.length,
      folderId,
    });
    const { valid, invalid } = validateFiles(files);

    // Show validation errors
    invalid.forEach((item) => {
      toast.error(`${item.name}: ${item.reason}`);
    });

    // Add valid files to queue
    // Use provided folderId or fall back to targetFolderId from modal context
    const effectiveFolderId = folderId !== undefined ? folderId : targetFolderId;

    if (valid.length > 0) {
      const newFiles: UploadingFile[] = valid.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        folderId: effectiveFolderId,
        status: 'pending' as const,
        progress: 0,
        name: file.name,
      }));

      setUploadingFiles((prev) => [...prev, ...newFiles]);
      // Don't show "added to queue" toast - upload completion toast is enough

      // Trigger processing if not already processing
      if (!isProcessingRef.current) {
        setTimeout(() => processQueue(), 50);
      }
    }
  }, [validateFiles, targetFolderId]);

  /**
   * Retry failed upload
   */
  const retryUpload = useCallback((fileId: string) => {
    setUploadingFiles((prev) =>
      prev.map((f) =>
        f.id === fileId
          ? { ...f, status: 'pending' as const, progress: 0, error: undefined }
          : f
      )
    );

    // Trigger processing if not already processing
    if (!isProcessingRef.current) {
      setTimeout(() => processQueue(), 50);
    }
  }, [processQueue]);

  /**
   * Remove file from queue
   */
  const removeFile = useCallback((fileId: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  /**
   * Clear completed uploads
   */
  const clearCompleted = useCallback(() => {
    setUploadingFiles((prev) => prev.filter((f) => f.status !== 'completed'));
    toast.success('Cleared completed uploads');
  }, []);

  /**
   * Open upload modal
   */
  const openUploadModal = useCallback((folderId: string | null = null, folderName?: string) => {
    console.log('[FileUploadProvider] Opening upload modal', { folderId, folderName });
    setTargetFolderId(folderId);
    setTargetFolderName(folderName);
    setIsUploadModalOpen(true);
  }, []);

  /**
   * Close upload modal
   */
  const closeUploadModal = useCallback(() => {
    setIsUploadModalOpen(false);
    // Clear target folder when closing modal
    setTargetFolderId(null);
    setTargetFolderName(undefined);
  }, []);

  /**
   * Get upload statistics
   */
  const getStats = useCallback((): UploadStats => {
    return {
      total: uploadingFiles.length,
      completed: uploadingFiles.filter((f) => f.status === 'completed').length,
      failed: uploadingFiles.filter((f) => f.status === 'error').length,
      uploading: uploadingFiles.filter((f) => f.status === 'uploading').length,
      pending: uploadingFiles.filter((f) => f.status === 'pending').length,
    };
  }, [uploadingFiles]);

  const value: FileUploadContextValue = {
    uploadingFiles,
    isUploadModalOpen,
    targetFolderId,
    targetFolderName,
    addFiles,
    retryUpload,
    removeFile,
    clearCompleted,
    openUploadModal,
    closeUploadModal,
    setIsUploadModalOpen,
    getStats,
  };

  return (
    <FileUploadContext.Provider value={value}>
      {children}
    </FileUploadContext.Provider>
  );
}

/**
 * Hook to access FileUpload context
 * Must be used within FileUploadProvider
 */
export function useFileUpload() {
  const context = useContext(FileUploadContext);
  if (!context) {
    throw new Error('useFileUpload must be used within FileUploadProvider');
  }
  return context;
}
