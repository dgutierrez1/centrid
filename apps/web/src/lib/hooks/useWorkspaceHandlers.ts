import { useCallback } from 'react';
import { useRouter } from 'next/router';
import { useSnapshot } from 'valtio';
import { useFileSystem } from '@/lib/contexts/filesystem.context';
import { editorState, loadDocument, setContent } from '@/lib/state/editor';
import { getDocumentMetadata, initDocumentMetadata } from '@/lib/state/documentMetadata';

/**
 * Hook to provide event handlers for the DesktopWorkspace component
 * Integrates designed component callbacks with Valtio state actions
 */
export function useWorkspaceHandlers(onSaveBeforeSwitch?: (documentId: string, content: string, version: number) => void) {
  const router = useRouter();
  const { getDocument, getCurrentDocumentVersion } = useFileSystem();
  const editorSnap = useSnapshot(editorState);

  // Handle file selection in tree
  const handleSelectFile = useCallback((fileId: string) => {
    // Check if current document has unsaved changes
    const currentDocId = editorSnap.currentDocumentId;
    if (currentDocId && onSaveBeforeSwitch) {
      const metadata = getDocumentMetadata(currentDocId);
      const hasUnsavedChanges = editorSnap.content !== (metadata?.lastSavedContent || '');

      if (hasUnsavedChanges) {
        const currentVersion = getCurrentDocumentVersion(currentDocId);
        console.log(`[DocumentSwitch] Enqueueing save for ${currentDocId} before switching`);

        // Enqueue save via callback (provider will handle it)
        onSaveBeforeSwitch(currentDocId, editorSnap.content, currentVersion);
      }
    }

    // Load new document (non-blocking)
    const document = getDocument(fileId);
    if (document) {
      // Ensure metadata is initialized (handles race condition for newly created documents)
      let metadata = getDocumentMetadata(document.id);
      if (!metadata) {
        console.log(`[DocumentSwitch] Initializing metadata for ${document.id} (race condition fix)`);
        // NOTE: version is NOT stored in metadata - read from Document.version instead
        initDocumentMetadata(document.id, document.content_text || '');
      }

      // Get latest version from metadata
      const latestVersion = getCurrentDocumentVersion(document.id);

      // Load document into editor
      loadDocument(document.id, document.content_text || '');

      // Update URL to reflect selected document (shallow routing - no page reload)
      router.push(`/workspace/${document.id}`, undefined, { shallow: true });
    }
  }, [getDocument, getCurrentDocumentVersion, router, editorSnap.currentDocumentId, editorSnap.content, onSaveBeforeSwitch]);

  // Handle editor content changes
  const handleEditorChange = useCallback((content: string) => {
    setContent(content);
    // Auto-save will be triggered by the useAutoSave hook
  }, []);

  return {
    onSelectFile: handleSelectFile,
    onEditorChange: handleEditorChange,
  };
}
