/**
 * FileSystemContext - Centralized filesystem state management
 *
 * Provides:
 * - Supabase client instance (shared)
 * - Current user from auth
 * - Per-document editing state (version tracking, unsaved changes)
 * - Helpers for safe operations with proper rollback
 * - Real-time subscription management
 */

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { filesystemState, buildFileSystemTree, addFolder, updateFolder, removeFolder, addDocument, updateDocument, removeDocument } from '@/lib/state/filesystem';
import { initDocumentMetadata, markSaveStarted, markSaveSuccess, markSaveError, markSaveConflict, getDocumentMetadata, clearDocumentMetadata } from '@/lib/state/documentMetadata';
import { editorState, clearEditor } from '@/lib/state/editor';
import { FilesystemService } from '@/lib/services/filesystem.service';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Folder, Document } from '@centrid/shared/types';

interface SaveTask {
  documentId: string;
  content: string;
  version: number;
}

interface FileSystemContextValue {
  supabase: SupabaseClient;
  user: User | null;
  loading: boolean;

  // Helpers for operations
  getFolder: (folderId: string) => Folder | undefined;
  getDocument: (documentId: string) => Document | undefined;
  getCurrentDocumentVersion: (documentId: string) => number;

  // Save queue management
  enqueueDocumentSave: (documentId: string, content: string, version: number) => void;
}

const FileSystemContext = createContext<FileSystemContextValue | null>(null);

export interface FileSystemProviderProps {
  children: ReactNode;
}

/**
 * FileSystemProvider - Manages real-time subscriptions and provides context
 */
export function FileSystemProvider({ children }: FileSystemProviderProps) {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Save queue: FIFO queue for document saves
  const saveQueueRef = useRef<SaveTask[]>([]);
  const isProcessingRef = useRef(false);

  // Get folder by ID from current state
  const getFolder = useCallback((folderId: string): Folder | undefined => {
    return filesystemState.folders.find(f => f.id === folderId);
  }, []);

  // Get document by ID from current state
  const getDocument = useCallback((documentId: string): Document | undefined => {
    return filesystemState.documents.find(d => d.id === documentId);
  }, []);

  // Get current version for document from Document (single source of truth)
  const getCurrentDocumentVersion = useCallback((documentId: string): number => {
    // ALWAYS read from Document.version (single source of truth)
    // Metadata no longer stores version to prevent drift
    const doc = filesystemState.documents.find(d => d.id === documentId);
    return doc?.version || 0;
  }, []);

  // Process save queue sequentially
  const processSaveQueue = useCallback(async () => {
    if (isProcessingRef.current || saveQueueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;

    while (saveQueueRef.current.length > 0) {
      const task = saveQueueRef.current[0]; // Peek at first task
      const { documentId, content, version } = task;

      console.log(`[SaveQueue] Processing save for ${documentId} v${version}`);

      const saveStartTime = Date.now();

      try {
        // Call FilesystemService to save document
        const result = await FilesystemService.updateDocument(documentId, content, version);

        if (result.error) {
          // Check if it's a version conflict
          if (result.error.includes('version conflict') || result.error.includes('modified by another')) {
            console.error(`[SaveQueue] Version conflict: ${documentId}`);
            markSaveConflict(documentId);
          } else {
            throw new Error(result.error);
          }
        } else if (result.data) {
          const newVersion = result.data.version || version + 1;
          const elapsed = Date.now() - saveStartTime;
          console.log(`[SaveQueue] Save successful: ${documentId} v${version} -> v${newVersion} (took ${elapsed}ms)`);

          // Update Document state first (single source of truth for version)
          updateDocument(documentId, {
            version: newVersion,
            content_text: content,
            updated_at: new Date().toISOString(),
          });

          // Mark success in metadata (does NOT update version - reads from Document)
          markSaveSuccess(documentId, content);
        }
      } catch (error) {
        console.error(`[SaveQueue] Save error for ${documentId}:`, error);

        // Look up document name for user-friendly error message
        const document = filesystemState.documents.find(d => d.id === documentId);
        const documentName = document?.name || 'Document';
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Show toast notification for background save failure
        toast.error(`Failed to save "${documentName}": ${errorMessage}`, {
          duration: 6000, // Show for 6 seconds (longer than default)
          id: `save-error-${documentId}`, // Prevent duplicate toasts for same document
        });

        markSaveError(documentId, errorMessage);
      }

      // Remove processed task from queue
      saveQueueRef.current.shift();
    }

    isProcessingRef.current = false;
  }, [supabase]);

  // Enqueue document save
  const enqueueDocumentSave = useCallback((documentId: string, content: string, version: number) => {
    console.log(`[SaveQueue] Enqueueing save for ${documentId} v${version}`);

    // Mark save started immediately
    markSaveStarted(documentId);
    console.log(`[SaveQueue] Marked as saving, status should update`);

    // Add to queue
    saveQueueRef.current.push({ documentId, content, version });

    // CRITICAL: Delay save processing to allow React to complete render cycle
    // 100ms ensures React + Valtio have enough time to propagate the 'saving' state
    // and update the UI before we start the HTTP request
    setTimeout(() => {
      console.log(`[SaveQueue] Starting save processing after React render cycle`);
      processSaveQueue();
    }, 100);
  }, [processSaveQueue]);

  // Initialize user and load data
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        // Load initial data
        const [foldersResult, documentsResult] = await Promise.all([
          supabase
            .from('folders')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: true }),
          supabase
            .from('documents')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: true }),
        ]);

        if (foldersResult.data) {
          filesystemState.folders = foldersResult.data as Folder[];
        }
        if (documentsResult.data) {
          filesystemState.documents = documentsResult.data as Document[];

          // Initialize metadata for all loaded documents
          // NOTE: version is NOT stored in metadata - read from Document.version instead
          documentsResult.data.forEach((doc: Document) => {
            initDocumentMetadata(doc.id, doc.content_text || '');
          });
        }

        // Update tree structure
        filesystemState.treeData = buildFileSystemTree(
          filesystemState.folders,
          filesystemState.documents
        );
      }

      setLoading(false);
    };

    initialize();
  }, [supabase]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Subscribe to folders table changes
    const foldersChannel = supabase
      .channel('folders_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'folders',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Folder INSERT:', payload.new);
          addFolder(payload.new as Folder);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'folders',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Folder UPDATE:', payload.new);
          updateFolder((payload.new as Folder).id, payload.new as Partial<Folder>);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'folders',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[FileSystemContext] Folder DELETE event received:', {
            old: payload.old,
            timestamp: new Date().toISOString(),
          });
          if (payload.old && typeof payload.old === 'object' && 'id' in payload.old) {
            const folderId = (payload.old as any).id;
            console.log('[FileSystemContext] Removing folder:', folderId);
            removeFolder(folderId);
            console.log('[FileSystemContext] Folder removed, folders count:', filesystemState.folders.length);
          } else {
            console.error('[FileSystemContext] DELETE payload missing id:', payload);
          }
        }
      )
      .subscribe((status) => {
        console.log('[FileSystemContext] Folders subscription status:', status);
      });

    // Subscribe to documents table changes
    const documentsChannel = supabase
      .channel('documents_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'documents',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[FileSystemContext] Document INSERT event received:', payload.new);
          const doc = payload.new as Document;
          console.log('[FileSystemContext] Calling addDocument with:', {
            id: doc.id,
            name: doc.name,
            folder_id: doc.folder_id,
          });
          // addDocument automatically initializes metadata
          addDocument(doc);
          console.log('[FileSystemContext] addDocument completed, documents count:', filesystemState.documents.length);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'documents',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Document UPDATE:', payload.new);
          updateDocument((payload.new as Document).id, payload.new as Partial<Document>);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'documents',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[FileSystemContext] Document DELETE event received:', {
            old: payload.old,
            timestamp: new Date().toISOString(),
          });
          if (payload.old && typeof payload.old === 'object' && 'id' in payload.old) {
            const docId = (payload.old as any).id;
            console.log('[FileSystemContext] Removing document:', docId);

            // If the deleted document is currently open, clear the editor
            if (editorState.currentDocumentId === docId) {
              console.log('[FileSystemContext] Deleted document was open in editor, clearing editor');
              clearEditor();
            }

            removeDocument(docId);
            // Clear metadata for deleted document
            clearDocumentMetadata(docId);
            console.log('[FileSystemContext] Document removed, documents count:', filesystemState.documents.length);
          } else {
            console.error('[FileSystemContext] DELETE payload missing id:', payload);
          }
        }
      )
      .subscribe((status) => {
        console.log('[FileSystemContext] Documents subscription status:', status);
      });

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(foldersChannel);
      supabase.removeChannel(documentsChannel);
    };
  }, [supabase, user]);

  const value: FileSystemContextValue = {
    supabase,
    user,
    loading,
    getFolder,
    getDocument,
    getCurrentDocumentVersion,
    enqueueDocumentSave,
  };

  return (
    <FileSystemContext.Provider value={value}>
      {children}
    </FileSystemContext.Provider>
  );
}

/**
 * Hook to access FileSystemContext
 */
export function useFileSystem() {
  const context = useContext(FileSystemContext);
  if (!context) {
    throw new Error('useFileSystem must be used within FileSystemProvider');
  }
  return context;
}
