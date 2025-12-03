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

import type { ReactNode} from 'react';
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { filesystemState, buildFileSystemTree, addFolder, updateFolder, removeFolder, addFile, updateFile, removeFile } from '@/lib/state/filesystem';
import { syncRealtimeUpdate, markSaveStarted, markSaveSuccess, markSaveError, markSaveConflict } from '@/lib/state/fileMetadata';
import { editorState, clearEditor } from '@/lib/state/editor';
import { useFilesystemData } from '@/lib/hooks/useFilesystemData';
import { useRealtimeSubscriptions } from '@/lib/realtime';
import { graphqlClient } from '@/lib/graphql/client';
import { UpdateFileDocument } from '@/types/graphql';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { File, Folder } from '@/types/graphql';

interface SaveTask {
  fileId: string;
  content: string;
  version: number;
}

interface FileSystemContextValue {
  supabase: SupabaseClient;
  user: User | null;
  loading: boolean;

  // Helpers for operations
  getFolder: (folderId: string) => Folder | undefined;
  getFile: (fileId: string) => File | undefined;
  getCurrentFileVersion: (fileId: string) => number;

  // Save queue management
  enqueueFileSave: (fileId: string, content: string, version: number) => void;
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

  // Get file by ID from current state
  const getFile = useCallback((fileId: string): File | undefined => {
    return filesystemState.files.find(f => f.id === fileId);
  }, []);

  // Get current version for file from File (single source of truth)
  const getCurrentFileVersion = useCallback((fileId: string): number => {
    // ALWAYS read from File.version (single source of truth)
    // Metadata no longer stores version to prevent drift
    const file = filesystemState.files.find(f => f.id === fileId);
    return file?.version || 0;
  }, []);

  // Process save queue sequentially
  const processSaveQueue = useCallback(async () => {
    if (isProcessingRef.current || saveQueueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;

    while (saveQueueRef.current.length > 0) {
      const task = saveQueueRef.current[0]; // Peek at first task
      const { fileId, content, version } = task;

      const saveStartTime = Date.now();

      try {
        // Call GraphQL API to save file
        const result = await graphqlClient.mutation(UpdateFileDocument, {
          id: fileId,
          content,
          version,
        });

        if (result.error) {
          throw new Error(result.error.message);
        }

        if (!result.data?.updateFile) {
          throw new Error('No data returned from update');
        }

        const newVersion = result.data.updateFile.version || version + 1;

        // Update File state first (single source of truth for version)
        updateFile(fileId, {
          version: newVersion,
          content: content,
          updatedAt: new Date().toISOString(),
        });

        // Mark success in metadata (does NOT update version - reads from File)
        markSaveSuccess(content);
      } catch (error: any) {
        // Check if it's a version conflict
        if (error.message?.includes('version conflict') || error.message?.includes('modified by another')) {
          console.error(`[SaveQueue] Version conflict: ${fileId}`);
          markSaveConflict();
          continue; // Skip to next task
        }
        console.error(`[SaveQueue] Save error for ${fileId}:`, error);

        // Look up file name for user-friendly error message
        const file = filesystemState.files.find(f => f.id === fileId);
        const fileName = file?.name || 'File';
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Show toast notification for background save failure
        toast.error(`Failed to save "${fileName}": ${errorMessage}`, {
          duration: 6000, // Show for 6 seconds (longer than default)
          id: `save-error-${fileId}`, // Prevent duplicate toasts for same file
        });

        markSaveError(errorMessage);
      }

      // Remove processed task from queue
      saveQueueRef.current.shift();
    }

    isProcessingRef.current = false;
  }, [supabase]);

  // Enqueue file save
  const enqueueFileSave = useCallback((fileId: string, content: string, version: number) => {
    // Mark save started immediately
    markSaveStarted();

    // Add to queue
    saveQueueRef.current.push({ fileId, content, version });

    // CRITICAL: Delay save processing to allow React to complete render cycle
    // 100ms ensures React + Valtio have enough time to propagate the 'saving' state
    // and update the UI before we start the HTTP request
    setTimeout(() => {
      processSaveQueue();
    }, 100);
  }, [processSaveQueue]);

  // Load filesystem data via GraphQL
  // Always enable - SSR already validated auth, and sync functions have skip conditions
  const { loading: filesystemLoading, error: filesystemError, refetch: refetchFilesystem } = useFilesystemData(true);

  // Initialize user
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      setLoading(false);
    };

    initialize();
  }, [supabase]);

  // Set up real-time subscriptions using reusable pattern
  useRealtimeSubscriptions([
    // Subscribe to folders table
    {
      table: 'folders',
      event: '*',
      filter: user ? { user_id: user.id } : undefined,
      callback: (payload) => {
        if (payload.eventType === 'INSERT' && payload.new) {
          // payload.new already camelCase from builder - no transform needed
          addFolder(payload.new as Folder);
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          // payload.new already camelCase from builder - no transform needed
          updateFolder(payload.new.id, payload.new as Partial<Folder>);
        } else if (payload.eventType === 'DELETE' && payload.old) {
          removeFolder(payload.old.id);
        }
      },
      enabled: !!user,
    },

    // Subscribe to files table
    {
      table: 'files',
      event: '*',
      filter: user ? { owner_user_id: user.id } : undefined,
      callback: (payload) => {
        if (payload.eventType === 'INSERT' && payload.new) {
          // payload.new already camelCase from builder - no transform needed
          addFile(payload.new as File);
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          // payload.new already camelCase from builder - no transform needed
          // Validate version field is present (critical for optimistic locking)
          if (payload.new.version === undefined || payload.new.version === null) {
            console.error('[FileSystemContext] Realtime UPDATE missing version field:', payload.new.id);
          }

          // Sync metadata if this is the currently opened file
          const isCurrentFile = filesystemState.selectedFile?.id === payload.new.id;
          if (isCurrentFile && payload.new.content !== undefined) {
            const currentEditorContent = filesystemState.selectedFile?.content || '';
            const result = syncRealtimeUpdate(payload.new.content, currentEditorContent);

            if (result.hasConflict) {
              toast.error(`Conflict detected: ${payload.new.name || 'File'} was modified by another user`);
            }
          }

          updateFile(payload.new.id, payload.new as Partial<File>);
        } else if (payload.eventType === 'DELETE' && payload.old) {
          const fileId = payload.old.id;
          // If the deleted file is currently open, clear the editor
          if (editorState.currentDocumentId === fileId) {
            clearEditor();
          }
          removeFile(fileId);
        }
      },
      enabled: !!user,
    },
  ]);

  // Show error UI if filesystem data failed to load
  if (filesystemError && user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="max-w-md p-6 space-y-4 bg-error-50 border border-error-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-6 h-6 text-error-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-error-900">Failed to Load Workspace</h3>
          </div>
          <p className="text-sm text-error-700">{filesystemError}</p>
          <button
            onClick={() => {
              refetchFilesystem();
            }}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const value: FileSystemContextValue = {
    supabase,
    user,
    loading: loading || filesystemLoading, // Include GraphQL loading state
    getFolder,
    getFile,
    getCurrentFileVersion,
    enqueueFileSave,
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
