/**
 * Save Coordination Hook
 *
 * Coordinates file save flow using centralized fileMetadata state
 * Handles debouncing, error handling, and state updates
 */

import { useCallback, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  markSaveStarted,
  markSaveSuccess,
  markSaveError,
  getCurrentFileMetadata,
  updateCurrentContent,
} from '@/lib/state/fileMetadata';

interface UseSaveCurrentFileOptions {
  onSave: (fileId: string, content: string) => Promise<void>;
  autoSaveDelay?: number;
}

export function useSaveCurrentFile({
  onSave,
  autoSaveDelay = 3000,
}: UseSaveCurrentFileOptions) {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Save file immediately
   * Uses centralized fileMetadata state for status tracking
   */
  const saveFile = useCallback(
    async (
      fileId: string,
      content: string,
      options: {
        onSuccess?: () => void;
        onError?: (error: Error) => void;
      } = {}
    ): Promise<{ success: boolean }> => {
      // Clear any pending auto-save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }

      // Update centralized state
      markSaveStarted();

      try {
        await onSave(fileId, content);

        // Success - update centralized state
        markSaveSuccess(content);

        options.onSuccess?.();
        return { success: true };
      } catch (error) {
        // Error - update centralized state
        const err = error instanceof Error ? error : new Error(String(error));
        markSaveError(err.message);

        options.onError?.(err);
        return { success: false };
      }
    },
    [onSave]
  );

  /**
   * Handle content change with debounced auto-save
   */
  const handleContentChange = useCallback(
    (fileId: string, content: string) => {
      // Update live content in metadata
      updateCurrentContent(content);

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Only auto-save if content changed from last saved
      const metadata = getCurrentFileMetadata();
      if (metadata && metadata.fileId === fileId && content !== metadata.lastSavedContent) {
        saveTimeoutRef.current = setTimeout(() => {
          saveFile(fileId, content);
        }, autoSaveDelay);
      }
    },
    [autoSaveDelay, saveFile]
  );

  /**
   * Save and execute callback on success (used for close)
   */
  const saveAndThen = useCallback(
    async (
      fileId: string,
      content: string,
      onSuccess: () => void
    ): Promise<{ success: boolean }> => {
      const result = await saveFile(fileId, content, {
        onSuccess,
        onError: () => {
          toast.error('Cannot close: save failed. Please try again.');
        },
      });
      return result;
    },
    [saveFile]
  );

  /**
   * Clear save timeout (used when closing without saving)
   */
  const clearSaveTimeout = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
  }, []);

  /**
   * Check if file has unsaved changes
   */
  const checkHasUnsavedChanges = useCallback(
    (fileId: string): boolean => {
      const metadata = getCurrentFileMetadata();
      if (!metadata || metadata.fileId !== fileId) return false;
      return metadata.currentContent !== metadata.lastSavedContent;
    },
    []
  );

  return {
    // Actions (state is in fileMetadata, accessed via useSnapshot in component)
    saveFile,
    handleContentChange,
    saveAndThen,
    clearSaveTimeout,
    checkHasUnsavedChanges,
  };
}
