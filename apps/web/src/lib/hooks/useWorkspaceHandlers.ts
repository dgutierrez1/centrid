import { useCallback } from 'react';
import { useRouter } from 'next/router';
import { useSnapshot } from 'valtio';
import { useFileSystem } from '@/lib/contexts/filesystem.context';
import { editorState, loadDocument, setContent } from '@/lib/state/editor';
import { fileMetadataState, openFile } from '@/lib/state/fileMetadata';

/**
 * Hook to provide event handlers for the DesktopWorkspace component
 * Integrates designed component callbacks with Valtio state actions
 *
 * NOTE: This hook is DEAD CODE - not imported anywhere except archived components
 * TODO: Move to _archived-components or delete
 */
export function useWorkspaceHandlers(onSaveBeforeSwitch?: (documentId: string, content: string, version: number) => void) {
  const router = useRouter();
  const { getFile, getCurrentFileVersion } = useFileSystem();
  const editorSnap = useSnapshot(editorState);
  const metadataSnap = useSnapshot(fileMetadataState);

  // Handle file selection in tree
  const handleSelectFile = useCallback((fileId: string) => {
    // Check if current document has unsaved changes
    const currentDocId = editorSnap.currentDocumentId;
    if (currentDocId && onSaveBeforeSwitch && metadataSnap.currentFile) {
      const hasUnsavedChanges = editorSnap.content !== (metadataSnap.currentFile.lastSavedContent || '');

      if (hasUnsavedChanges) {
        const currentVersion = getCurrentFileVersion(currentDocId);
        console.log(`[DocumentSwitch] Enqueueing save for ${currentDocId} before switching`);

        // Enqueue save via callback (provider will handle it)
        onSaveBeforeSwitch(currentDocId, editorSnap.content, currentVersion);
      }
    }

    // Load new document (non-blocking)
    const file = getFile(fileId);
    if (file) {
      // Initialize metadata for newly opened file
      if (!metadataSnap.currentFile || metadataSnap.currentFile.fileId !== file.id) {
        openFile(file.id || '', file.content || '');
      }

      // Get latest version from file
      const latestVersion = getCurrentFileVersion(file.id || '');

      // Load document into editor
      loadDocument(file.id || '', file.content || '');

      // Update URL to reflect selected document (shallow routing - no page reload)
      router.push(`/workspace/${file.id}`, undefined, { shallow: true });
    }
  }, [getFile, getCurrentFileVersion, router, editorSnap.currentDocumentId, editorSnap.content, onSaveBeforeSwitch, metadataSnap.currentFile]);

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
