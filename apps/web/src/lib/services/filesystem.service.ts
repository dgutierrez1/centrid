import type { Folder, Document } from '@centrid/shared/types';
import { api, ApiError, handleApiError } from '@/lib/api/client';
import { getAuthHeaders } from '@/lib/api/getAuthHeaders';

/**
 * FilesystemService - Pure API functions for folder and document operations
 * Returns data directly or throws ApiError
 *
 * Architecture: Service Layer (pure API calls) → Custom Hooks (UI concerns) → Components
 *
 * All requests automatically get:
 * - Auth header injection
 * - Retry on 5xx errors
 * - Consistent error handling
 */

export const FilesystemService = {
  // ===== FOLDER OPERATIONS =====

  /**
   * Create a new folder
   */
  async createFolder(
    name: string,
    parentFolderId: string | null
  ): Promise<Folder> {
    return api.post<Folder>('/folders', {
      name,
      parent_folder_id: parentFolderId,
    });
  },

  /**
   * Rename a folder
   */
  async renameFolder(
    folderId: string,
    newName: string
  ): Promise<Folder> {
    return api.put<Folder>(`/folders/${folderId}`, { name: newName });
  },

  /**
   * Move a folder to a new parent
   */
  async moveFolder(
    folderId: string,
    newParentId: string | null
  ): Promise<Folder> {
    return api.put<Folder>(`/folders/${folderId}`, { parent_folder_id: newParentId });
  },

  /**
   * Delete a folder (cascade deletes children)
   */
  async deleteFolder(folderId: string): Promise<void> {
    await api.delete(`/folders/${folderId}`);
  },

  // ===== DOCUMENT OPERATIONS =====

  /**
   * Create a new document
   */
  async createDocument(
    name: string,
    folderId: string | null
  ): Promise<Document> {
    return api.post<Document>('/documents', {
      name,
      folder_id: folderId,
      content_text: '', // Empty content for new documents
    });
  },

  /**
   * Rename a document
   */
  async renameDocument(
    documentId: string,
    newName: string
  ): Promise<Document> {
    return api.patch<Document>(`/documents/${documentId}`, { name: newName });
  },

  /**
   * Move a document to a new folder
   */
  async moveDocument(
    documentId: string,
    newFolderId: string | null
  ): Promise<Document> {
    return api.patch<Document>(`/documents/${documentId}`, { folder_id: newFolderId });
  },

  /**
   * Update document content (for auto-save)
   */
  async updateDocument(
    documentId: string,
    content: string,
    version: number
  ): Promise<Document> {
    return api.put<Document>(`/documents/${documentId}`, {
      content_text: content,
      version, // For optimistic locking
    });
  },

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string): Promise<void> {
    await api.delete(`/documents/${documentId}`);
  },

  /**
   * Upload a document file (with progress callback)
   * Uses XMLHttpRequest for progress tracking with multipart/form-data
   */
  async uploadDocument(
    file: File,
    folderId: string | null,
    onProgress?: (progress: number) => void
  ): Promise<Document> {
    try {
      const headers = await getAuthHeaders();
      const authHeader = headers.Authorization;

      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('file', file);
      if (folderId) {
        formData.append('folder_id', folderId);
      }

      // Use XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
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
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data);
            } catch (error) {
              reject(new ApiError('Failed to parse response', 500));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new ApiError(
                errorData.message || 'Upload failed',
                xhr.status,
                errorData
              ));
            } catch (parseError) {
              reject(new ApiError(`Upload failed (${xhr.status})`, xhr.status));
            }
          }
        });

        // Handle errors
        xhr.addEventListener('error', () => {
          reject(new ApiError('Network error during upload', 0));
        });

        xhr.addEventListener('abort', () => {
          reject(new ApiError('Upload cancelled', 0));
        });

        // Open and send request
        xhr.open('POST', `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/documents`);
        xhr.setRequestHeader('Authorization', authHeader);
        // Don't set Content-Type - let browser set it with boundary for multipart
        xhr.send(formData);
      });
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

// Lowercase alias for convenience
export const filesystemService = FilesystemService;
