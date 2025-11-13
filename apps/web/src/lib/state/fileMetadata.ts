/**
 * File Metadata State (Valtio)
 *
 * Tracks metadata for the CURRENTLY OPENED file only
 * This is UI-only ephemeral state, not synced to server
 */

import { proxy } from 'valtio';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'conflict';

/**
 * File Metadata - UI-only state for currently opened file
 *
 * IMPORTANT: Only tracks the file currently open in the editor
 * Server data (version, content, etc.) lives in File type from GraphQL
 */
export interface FileMetadata {
  fileId: string;
  // UI-only save tracking
  saveStatus: SaveStatus;
  errorMessage: string | null;
  // Content tracking
  currentContent: string;    // Live editor content (updated on every keystroke)
  lastSavedContent: string;  // What was last saved to server (checkpoint)
  lastSavedAt: Date | null;  // When client last saved (UI display only)
  // NOTE: version is NOT here - read from File.version (single source of truth)
}

interface FileMetadataState {
  // Only track currently opened file, null when no file is open
  currentFile: FileMetadata | null;
}

export const fileMetadataState = proxy<FileMetadataState>({
  currentFile: null,
});

// ============================================================================
// State Actions
// ============================================================================

/**
 * Initialize metadata when opening a file
 * @param fileId - File ID
 * @param initialContent - Initial content from server
 */
export function openFile(fileId: string, initialContent: string) {
  fileMetadataState.currentFile = {
    fileId,
    saveStatus: 'idle',
    currentContent: initialContent,
    lastSavedContent: initialContent,
    lastSavedAt: initialContent ? new Date() : null,
    errorMessage: null,
  };
  console.log(`[FileMetadata] Opened file ${fileId}`);
}

/**
 * Clear metadata when closing file
 */
export function closeFile() {
  console.log(`[FileMetadata] Closed file ${fileMetadataState.currentFile?.fileId}`);
  fileMetadataState.currentFile = null;
}

/**
 * Get current file metadata (returns null if no file open)
 */
export function getCurrentFileMetadata(): FileMetadata | null {
  return fileMetadataState.currentFile;
}

/**
 * Update current editor content (called on every keystroke)
 */
export function updateCurrentContent(content: string) {
  if (!fileMetadataState.currentFile) {
    console.warn('[FileMetadata] updateCurrentContent called but no file is open');
    return;
  }
  fileMetadataState.currentFile.currentContent = content;
}

/**
 * Mark save started
 */
export function markSaveStarted() {
  if (!fileMetadataState.currentFile) {
    console.warn('[FileMetadata] markSaveStarted called but no file is open');
    return;
  }

  console.log(`[FileMetadata] markSaveStarted for ${fileMetadataState.currentFile.fileId}`);
  fileMetadataState.currentFile.saveStatus = 'saving';
  fileMetadataState.currentFile.errorMessage = null;
}

/**
 * Mark save successful
 * NOTE: Does NOT update version - File.version is updated separately via GraphQL
 */
export function markSaveSuccess(content: string) {
  if (!fileMetadataState.currentFile) {
    console.warn('[FileMetadata] markSaveSuccess called but no file is open');
    return;
  }

  fileMetadataState.currentFile.saveStatus = 'saved';
  fileMetadataState.currentFile.lastSavedContent = content;
  fileMetadataState.currentFile.lastSavedAt = new Date();
  fileMetadataState.currentFile.errorMessage = null;

  // Auto-clear "saved" status after 2 seconds
  setTimeout(() => {
    if (fileMetadataState.currentFile?.saveStatus === 'saved') {
      fileMetadataState.currentFile.saveStatus = 'idle';
    }
  }, 2000);
}

/**
 * Mark save failed
 */
export function markSaveError(error: string) {
  if (!fileMetadataState.currentFile) {
    console.warn('[FileMetadata] markSaveError called but no file is open');
    return;
  }

  fileMetadataState.currentFile.saveStatus = 'error';
  fileMetadataState.currentFile.errorMessage = error;
}

/**
 * Mark version conflict
 */
export function markSaveConflict() {
  if (!fileMetadataState.currentFile) {
    console.warn('[FileMetadata] markSaveConflict called but no file is open');
    return;
  }

  fileMetadataState.currentFile.saveStatus = 'conflict';
  fileMetadataState.currentFile.errorMessage = 'File was modified by another user. Please refresh to see changes.';
}

/**
 * Sync metadata when realtime UPDATE event arrives for the currently opened file
 * Handles conflict detection for concurrent edits
 *
 * @param newContent - New content from server
 * @param currentEditorContent - Current content in editor
 * @returns Object indicating if conflict was detected
 */
export function syncRealtimeUpdate(
  newContent: string,
  currentEditorContent: string
): { hasConflict: boolean } {
  if (!fileMetadataState.currentFile) {
    return { hasConflict: false };
  }

  const metadata = fileMetadataState.currentFile;
  const hasLocalEdits = currentEditorContent !== metadata.lastSavedContent;
  const serverContentChanged = newContent !== metadata.lastSavedContent;

  // CONFLICT: User has unsaved edits AND server has new content
  if (hasLocalEdits && serverContentChanged) {
    console.warn('[FileMetadata] Conflict detected: local edits + server update');
    markSaveConflict();
    // Update baseline to new server content (but preserve editor state)
    metadata.lastSavedContent = newContent;
    return { hasConflict: true };
  }

  // NO CONFLICT: Either no local edits, or server content unchanged
  console.log('[FileMetadata] Syncing realtime update, no conflict');
  metadata.lastSavedContent = newContent;
  metadata.saveStatus = 'idle';
  return { hasConflict: false };
}

// Export type for convenience
export type { FileMetadataState };
