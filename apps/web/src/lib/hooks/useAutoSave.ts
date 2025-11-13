import { useEffect, useRef } from 'react';
import { useSnapshot } from 'valtio';
import { editorState } from '../state/editor';
import { fileMetadataState } from '../state/fileMetadata';
import { useFileSystem } from '../contexts/filesystem.context';

export interface UseAutoSaveOptions {
  documentId: string;
  onSave: (documentId: string, content: string, version: number) => void;
  debounceMs?: number;
}

/**
 * Auto-save hook with debounced saving
 * Automatically enqueues saves after 5 seconds of inactivity
 * Provider handles actual save execution, retries, and metadata updates
 *
 * NOTE: This hook is DEAD CODE - not imported anywhere except archived components
 * TODO: Move to _archived-components or delete
 */
export function useAutoSave({ documentId, onSave, debounceMs = 5000 }: UseAutoSaveOptions) {
  const snap = useSnapshot(editorState);
  const metadataSnap = useSnapshot(fileMetadataState);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { getCurrentFileVersion } = useFileSystem();

  // Debounced save effect
  useEffect(() => {
    // Only track saves for the current document
    if (snap.currentDocumentId !== documentId) {
      return;
    }

    const metadata = metadataSnap.currentFile;
    if (!metadata || metadata.fileId !== documentId) {
      return; // Metadata not initialized yet or different file
    }

    // Check if content has changed since last save
    const hasUnsavedChanges = snap.content !== metadata.lastSavedContent;
    if (!hasUnsavedChanges) {
      return; // No changes to save
    }

    // Don't queue another save if one is already saving
    if (metadata.saveStatus === 'saving') {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debounced save
    timeoutRef.current = setTimeout(() => {
      const currentMetadata = metadataSnap.currentFile;
      if (currentMetadata && currentMetadata.fileId === documentId) {
        // Read version from File (single source of truth)
        const currentVersion = getCurrentFileVersion(documentId);
        onSave(documentId, snap.content, currentVersion);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [snap.content, snap.currentDocumentId, documentId, onSave, debounceMs, getCurrentFileVersion, metadataSnap.currentFile]);
}

/**
 * Hook to save and warn user about unsaved changes before leaving page
 */
export function useBeforeUnload(
  hasUnsavedChanges: boolean,
  onSave?: () => void
) {
  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Attempt to save if callback provided
      if (onSave) {
        onSave();
      }

      // Warn user about unsaved changes
      e.preventDefault();
      e.returnValue = ''; // Chrome requires returnValue to be set
      return ''; // Some browsers require a return value
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, onSave]);
}
