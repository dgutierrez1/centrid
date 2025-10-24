import { createClient } from '@/lib/supabase/client';
import type { Folder, Document } from '@centrid/shared/types';

/**
 * FilesystemService - Pure API functions for folder and document operations
 * Returns { data?, error? } with NO UI concerns (loading, toasts, state updates)
 *
 * Architecture: Service Layer (pure API calls) → Custom Hooks (UI concerns) → Components
 */

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

/**
 * Helper to get auth headers for Edge Function calls
 */
async function getAuthHeaders() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    console.error('No session found - user may not be authenticated');
    throw new Error('Authentication required');
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  };
}

export const FilesystemService = {
  // ===== FOLDER OPERATIONS =====

  /**
   * Create a new folder
   */
  async createFolder(
    name: string,
    parentFolderId: string | null
  ): Promise<ApiResponse<Folder>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/folders`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name,
            parent_folder_id: parentFolderId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.message || 'Failed to create folder' };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to create folder',
      };
    }
  },

  /**
   * Rename a folder
   */
  async renameFolder(
    folderId: string,
    newName: string
  ): Promise<ApiResponse<Folder>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/folders/${folderId}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({ name: newName }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.message || 'Failed to rename folder' };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to rename folder',
      };
    }
  },

  /**
   * Move a folder to a new parent
   */
  async moveFolder(
    folderId: string,
    newParentId: string | null
  ): Promise<ApiResponse<Folder>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/folders/${folderId}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({ parent_folder_id: newParentId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.message || 'Failed to move folder' };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to move folder',
      };
    }
  },

  /**
   * Delete a folder (cascade deletes children)
   */
  async deleteFolder(folderId: string): Promise<ApiResponse<void>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/folders/${folderId}`,
        {
          method: 'DELETE',
          headers,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.message || 'Failed to delete folder' };
      }

      return { data: undefined };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to delete folder',
      };
    }
  },

  // ===== DOCUMENT OPERATIONS =====

  /**
   * Create a new document
   */
  async createDocument(
    name: string,
    folderId: string | null
  ): Promise<ApiResponse<Document>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/documents`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name,
            folder_id: folderId,
            content_text: '', // Empty content for new documents
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.message || 'Failed to create document' };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : 'Failed to create document',
      };
    }
  },

  /**
   * Rename a document
   */
  async renameDocument(
    documentId: string,
    newName: string
  ): Promise<ApiResponse<Document>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/documents/${documentId}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ name: newName }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.message || 'Failed to rename document' };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : 'Failed to rename document',
      };
    }
  },

  /**
   * Move a document to a new folder
   */
  async moveDocument(
    documentId: string,
    newFolderId: string | null
  ): Promise<ApiResponse<Document>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/documents/${documentId}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ folder_id: newFolderId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.message || 'Failed to move document' };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : 'Failed to move document',
      };
    }
  },

  /**
   * Update document content (for auto-save)
   */
  async updateDocument(
    documentId: string,
    content: string,
    version: number
  ): Promise<ApiResponse<Document>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/documents/${documentId}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            content_text: content,
            version, // For optimistic locking
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.message || 'Failed to update document' };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : 'Failed to update document',
      };
    }
  },

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string): Promise<ApiResponse<void>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/documents/${documentId}`,
        {
          method: 'DELETE',
          headers,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.message || 'Failed to delete document' };
      }

      return { data: undefined };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : 'Failed to delete document',
      };
    }
  },

  /**
   * Upload a document file (with progress callback)
   * Uses multipart/form-data to upload files to Edge Function
   */
  async uploadDocument(
    file: File,
    folderId: string | null,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<Document>> {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Authentication required');
      }

      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('file', file);
      if (folderId) {
        formData.append('folder_id', folderId);
      }

      // Use XMLHttpRequest for progress tracking
      return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && onProgress) {
            const percentComplete = (e.loaded / e.total) * 100;
            onProgress(Math.round(percentComplete));
          }
        });

        // Handle completion
        xhr.addEventListener('load', () => {
          console.log('[FilesystemService] Upload response:', {
            status: xhr.status,
            statusText: xhr.statusText,
            responseLength: xhr.responseText.length,
            responseText: xhr.responseText,
          });

          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              console.log('[FilesystemService] Parsed response data:', data);
              resolve({ data, success: true });
            } catch (error) {
              console.error('[FilesystemService] Failed to parse success response:', error);
              console.error('[FilesystemService] Raw response text:', xhr.responseText);
              resolve({ error: `Failed to parse response: ${error}` });
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              resolve({ error: errorData.message || errorData.error || 'Upload failed' });
            } catch (parseError) {
              console.error('[FilesystemService] Failed to parse error response:', parseError);
              console.error('[FilesystemService] Raw response:', xhr.responseText);
              resolve({ error: `Upload failed (${xhr.status}): ${xhr.responseText.substring(0, 100)}` });
            }
          }
        });

        // Handle errors
        xhr.addEventListener('error', () => {
          resolve({ error: 'Network error during upload' });
        });

        xhr.addEventListener('abort', () => {
          resolve({ error: 'Upload cancelled' });
        });

        // Open and send request
        xhr.open('POST', `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/documents`);
        xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
        // Don't set Content-Type - let browser set it with boundary for multipart
        xhr.send(formData);
      });
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to upload document',
      };
    }
  },
};

// Lowercase alias for convenience
export const filesystemService = FilesystemService;
