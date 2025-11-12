/**
 * useFilesystemRealtime - Real-time synchronization for filesystem data
 *
 * Subscribes to folders and files tables using the reusable real-time system.
 * Replaces manual subscription code (117 lines) with ~40 lines of type-safe hooks.
 *
 * Features:
 * - Type-safe payloads with automatic snake_case to camelCase transformation
 * - Automatic cleanup on unmount
 * - Conditional subscriptions (disabled when userId is null)
 * - Idempotent state updates (prevents duplicates)
 */

import { useRealtimeSubscriptions } from '@/lib/realtime';
import {
  addFolder,
  updateFolder,
  removeFolder,
  addFile,
  updateFile,
  removeFile,
} from '@/lib/state/filesystem';
import type { File, Folder } from '@/types/graphql';

/**
 * Subscribe to real-time updates for folders and files
 *
 * @param userId - User ID for filtering (subscriptions disabled if undefined)
 */
export function useFilesystemRealtime(userId: string | undefined) {
  useRealtimeSubscriptions([
    // Subscribe to folders table
    {
      table: 'folders',
      event: '*', // INSERT, UPDATE, DELETE
      filter: userId ? { user_id: userId } : undefined,
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
      enabled: !!userId,
    },

    // Subscribe to files table
    {
      table: 'files',
      event: '*', // INSERT, UPDATE, DELETE
      filter: userId ? { owner_user_id: userId } : undefined,
      callback: (payload) => {
        if (payload.eventType === 'INSERT' && payload.new) {
          // payload.new already camelCase from builder - no transform needed
          addFile(payload.new as File);
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          // payload.new already camelCase from builder - no transform needed
          updateFile(payload.new.id, payload.new as Partial<File>);
        } else if (payload.eventType === 'DELETE' && payload.old) {
          removeFile(payload.old.id);
        }
      },
      enabled: !!userId,
    },
  ]);
}
