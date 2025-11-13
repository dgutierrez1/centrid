/**
 * Editor State (Valtio)
 *
 * Manages ONLY UI state for the markdown editor
 * File metadata (versions, save status) is managed in fileMetadata.ts
 */

import { proxy } from 'valtio';

// ============================================================================
// State Definition
// ============================================================================

interface EditorState {
  currentDocumentId: string | null; // Which document is currently displayed
  content: string; // Current editor content (what user is typing)
}

export const editorState = proxy<EditorState>({
  currentDocumentId: null,
  content: '',
});

// ============================================================================
// State Actions
// ============================================================================

/**
 * Load document into editor (switches which document is displayed)
 */
export function loadDocument(documentId: string, content: string) {
  editorState.currentDocumentId = documentId;
  editorState.content = content;
}

/**
 * Set editor content (user typing)
 */
export function setContent(content: string) {
  editorState.content = content;
}

/**
 * Clear editor (close document)
 */
export function clearEditor() {
  editorState.currentDocumentId = null;
  editorState.content = '';
}

// ============================================================================
// Actions Object (convenient grouping)
// ============================================================================

export const editorActions = {
  loadDocument,
  setContent,
  clearEditor,
};
