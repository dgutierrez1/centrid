/**
 * File Metadata State (Valtio)
 *
 * Per-file state management - tracks versions, save status, etc.
 * This is separate from editor UI state and persists across file switches.
 */

import { proxy } from 'valtio';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'conflict';

/**
 * File Metadata - UI-only state (NOT duplicated from server)
 *
 * IMPORTANT: This contains ONLY ephemeral UI state.
 * Server data (version, content_text, etc.) lives in File and is read from there.
 */
export interface FileMetadata {
  // UI-only fields (never in database)
  saveStatus: SaveStatus;
  pendingSave: boolean;
  errorMessage: string | null;

  // Client tracking (different from server timestamps)
  lastSavedContent: string;  // What client last sent (to detect unsaved changes)
  lastSavedAt: Date | null;  // When client last saved (UI display only)

  // NOTE: version is NOT here - read from File.version (single source of truth)
}

interface FileMetadataState {
  // Object map of fileId -> metadata
  // Using plain object instead of Map for better Valtio reactivity
  files: Record<string, FileMetadata>;
}

export const fileMetadataState = proxy<FileMetadataState>({
  files: {},
});

// ============================================================================
// State Actions
// ============================================================================

/**
 * Initialize metadata for a file (when first loaded)
 * IDEMPOTENT: Only initializes if metadata doesn't already exist
 *
 * @param fileId - File ID
 * @param content - Initial content (to track changes)
 *
 * NOTE: version is NOT stored here - read from File.version instead
 */
export function initFileMetadata(fileId: string, content: string) {
  // Check if metadata already exists
  const existing = fileMetadataState.files[fileId];
  if (existing) {
    console.log(`[FileMetadata] Metadata already exists for ${fileId}, skipping re-initialization`);
    return;
  }

  fileMetadataState.files[fileId] = {
    saveStatus: 'idle',
    lastSavedContent: content,
    lastSavedAt: content ? new Date() : null,
    errorMessage: null,
    pendingSave: false,
  };
  console.log(`[FileMetadata] Initialized metadata for ${fileId}`);
}

/**
 * Get metadata for a file (returns undefined if not initialized)
 */
export function getFileMetadata(fileId: string): FileMetadata | undefined {
  return fileMetadataState.files[fileId];
}

/**
 * Update metadata for a file
 * IMPORTANT: Replace entire object property for Valtio reactivity
 */
export function updateFileMetadata(fileId: string, updates: Partial<FileMetadata>) {
  const existing = fileMetadataState.files[fileId];
  if (existing) {
    // Replace entire object property for Valtio to track changes
    fileMetadataState.files[fileId] = {
      ...existing,
      ...updates,
    };
  }
}

/**
 * Mark save started
 */
export function markSaveStarted(fileId: string) {
  console.log(`[FileMetadata] markSaveStarted called for ${fileId}`);
  const metadata = fileMetadataState.files[fileId];
  console.log(`[FileMetadata] BEFORE update, current status:`, metadata?.saveStatus);

  updateFileMetadata(fileId, {
    saveStatus: 'saving',
    pendingSave: true,
    errorMessage: null,
  });

  const afterMetadata = fileMetadataState.files[fileId];
  console.log(`[FileMetadata] AFTER update, new status:`, afterMetadata?.saveStatus);
}

/**
 * Mark save successful
 *
 * NOTE: Does NOT update version - File.version is updated separately via updateFile()
 */
export function markSaveSuccess(fileId: string, content: string) {
  updateFileMetadata(fileId, {
    saveStatus: 'saved',
    lastSavedContent: content,
    lastSavedAt: new Date(),
    errorMessage: null,
    pendingSave: false,
  });

  // Auto-clear "saved" status after 2 seconds
  setTimeout(() => {
    const metadata = getFileMetadata(fileId);
    if (metadata?.saveStatus === 'saved') {
      updateFileMetadata(fileId, { saveStatus: 'idle' });
    }
  }, 2000);
}

/**
 * Mark save failed
 */
export function markSaveError(fileId: string, error: string) {
  updateFileMetadata(fileId, {
    saveStatus: 'error',
    errorMessage: error,
    pendingSave: false,
  });
}

/**
 * Mark version conflict
 */
export function markSaveConflict(fileId: string) {
  updateFileMetadata(fileId, {
    saveStatus: 'conflict',
    errorMessage: 'File was modified by another user. Please refresh to see changes.',
    pendingSave: false,
  });
}

/**
 * Clear metadata for a file (when file is deleted)
 */
export function clearFileMetadata(fileId: string) {
  delete fileMetadataState.files[fileId];
}
