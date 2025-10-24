/**
 * Filesystem Types for File System & Markdown Editor
 *
 * Shared types used across frontend and backend for file tree operations
 */

// ============================================================================
// Database Entity Types
// ============================================================================

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  parent_folder_id: string | null;
  path: string; // Computed path from hierarchy (e.g., "/Projects/MVP")
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  folder_id: string | null;
  name: string; // Filename with extension
  storage_path: string; // Path in Supabase Storage
  content_text?: string; // Cached markdown content
  file_size: number;
  mime_type: string; // 'text/markdown' or 'text/plain'
  path: string; // Computed path for breadcrumbs (e.g., "/Projects/MVP/spec.md")
  version: number; // Optimistic locking
  indexing_status: 'pending' | 'in_progress' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  content: string; // Markdown text (400-500 tokens)
  position: number; // Order in original document (0, 1, 2, ...)
  // embedding: number[]; // OpenAI text-embedding-3-small (1536 dims) - added via custom SQL
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Frontend Abstraction Types
// ============================================================================

/**
 * FileSystemNode - Abstract representation of file tree for UI rendering
 * Computed from folders + documents, not a database table
 */
export interface FileSystemNode {
  id: string; // folder.id or document.id
  name: string; // folder.name or document.name
  type: 'folder' | 'document';
  parentId: string | null; // folder.parent_folder_id or document.folder_id
  path: string; // folder.path or document.path
  children?: FileSystemNode[]; // Only for folders (recursive)

  // Document-specific fields (when type === 'document')
  fileSize?: number; // document.file_size
  mimeType?: string; // document.mime_type
  version?: number; // document.version
  indexingStatus?: 'pending' | 'in_progress' | 'completed' | 'failed'; // document.indexing_status
  updatedAt?: string; // document.updated_at
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CreateFolderRequest {
  name: string;
  parent_folder_id?: string | null;
}

export interface UpdateFolderRequest {
  name?: string;
  parent_folder_id?: string | null;
}

export interface CreateDocumentRequest {
  name: string;
  folder_id?: string | null;
  content_text: string;
}

export interface UpdateDocumentContentRequest {
  content_text: string;
  version: number; // For optimistic locking
}

export interface UpdateDocumentMetadataRequest {
  name?: string;
  folder_id?: string | null;
}

export interface UploadDocumentRequest {
  file: File;
  folder_id?: string | null;
}

// ============================================================================
// Validation Types
// ============================================================================

export const ALLOWED_MIME_TYPES = ['text/markdown', 'text/plain'] as const;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MIN_FILE_SIZE = 1; // 1 byte

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}
