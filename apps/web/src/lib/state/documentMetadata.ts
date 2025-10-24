/**
 * Document Metadata State (Valtio)
 *
 * Per-document state management - tracks versions, save status, etc.
 * This is separate from editor UI state and persists across document switches.
 */

import { proxy } from 'valtio';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'conflict';

/**
 * Document Metadata - UI-only state (NOT duplicated from server)
 *
 * IMPORTANT: This contains ONLY ephemeral UI state.
 * Server data (version, content_text, etc.) lives in Document and is read from there.
 */
export interface DocumentMetadata {
  // UI-only fields (never in database)
  saveStatus: SaveStatus;
  pendingSave: boolean;
  errorMessage: string | null;

  // Client tracking (different from server timestamps)
  lastSavedContent: string;  // What client last sent (to detect unsaved changes)
  lastSavedAt: Date | null;  // When client last saved (UI display only)

  // NOTE: version is NOT here - read from Document.version (single source of truth)
}

interface DocumentMetadataState {
  // Object map of documentId -> metadata
  // Using plain object instead of Map for better Valtio reactivity
  documents: Record<string, DocumentMetadata>;
}

export const documentMetadataState = proxy<DocumentMetadataState>({
  documents: {},
});

// ============================================================================
// State Actions
// ============================================================================

/**
 * Initialize metadata for a document (when first loaded)
 * IDEMPOTENT: Only initializes if metadata doesn't already exist
 *
 * @param documentId - Document ID
 * @param content - Initial content (to track changes)
 *
 * NOTE: version is NOT stored here - read from Document.version instead
 */
export function initDocumentMetadata(documentId: string, content: string) {
  // Check if metadata already exists
  const existing = documentMetadataState.documents[documentId];
  if (existing) {
    console.log(`[DocumentMetadata] Metadata already exists for ${documentId}, skipping re-initialization`);
    return;
  }

  documentMetadataState.documents[documentId] = {
    saveStatus: 'idle',
    lastSavedContent: content,
    lastSavedAt: content ? new Date() : null,
    errorMessage: null,
    pendingSave: false,
  };
  console.log(`[DocumentMetadata] Initialized metadata for ${documentId}`);
}

/**
 * Get metadata for a document (returns undefined if not initialized)
 */
export function getDocumentMetadata(documentId: string): DocumentMetadata | undefined {
  return documentMetadataState.documents[documentId];
}

/**
 * Update metadata for a document
 * IMPORTANT: Replace entire object property for Valtio reactivity
 */
export function updateDocumentMetadata(documentId: string, updates: Partial<DocumentMetadata>) {
  const existing = documentMetadataState.documents[documentId];
  if (existing) {
    // Replace entire object property for Valtio to track changes
    documentMetadataState.documents[documentId] = {
      ...existing,
      ...updates,
    };
  }
}

/**
 * Mark save started
 */
export function markSaveStarted(documentId: string) {
  console.log(`[DocumentMetadata] markSaveStarted called for ${documentId}`);
  const metadata = documentMetadataState.documents[documentId];
  console.log(`[DocumentMetadata] BEFORE update, current status:`, metadata?.saveStatus);

  updateDocumentMetadata(documentId, {
    saveStatus: 'saving',
    pendingSave: true,
    errorMessage: null,
  });

  const afterMetadata = documentMetadataState.documents[documentId];
  console.log(`[DocumentMetadata] AFTER update, new status:`, afterMetadata?.saveStatus);
}

/**
 * Mark save successful
 *
 * NOTE: Does NOT update version - Document.version is updated separately via updateDocument()
 */
export function markSaveSuccess(documentId: string, content: string) {
  updateDocumentMetadata(documentId, {
    saveStatus: 'saved',
    lastSavedContent: content,
    lastSavedAt: new Date(),
    errorMessage: null,
    pendingSave: false,
  });

  // Auto-clear "saved" status after 2 seconds
  setTimeout(() => {
    const metadata = getDocumentMetadata(documentId);
    if (metadata?.saveStatus === 'saved') {
      updateDocumentMetadata(documentId, { saveStatus: 'idle' });
    }
  }, 2000);
}

/**
 * Mark save failed
 */
export function markSaveError(documentId: string, error: string) {
  updateDocumentMetadata(documentId, {
    saveStatus: 'error',
    errorMessage: error,
    pendingSave: false,
  });
}

/**
 * Mark version conflict
 */
export function markSaveConflict(documentId: string) {
  updateDocumentMetadata(documentId, {
    saveStatus: 'conflict',
    errorMessage: 'Document was modified by another user. Please refresh to see changes.',
    pendingSave: false,
  });
}

/**
 * Clear metadata for a document (when document is deleted)
 */
export function clearDocumentMetadata(documentId: string) {
  delete documentMetadataState.documents[documentId];
}
