/**
 * File Validation Utilities
 *
 * Client-side validation for file uploads (UX-only, security enforced server-side)
 */

import { z } from 'zod';
import type { FileValidationResult } from '../types/filesystem';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE, MIN_FILE_SIZE } from '../types/filesystem';

// ============================================================================
// Zod Schemas
// ============================================================================

export const fileUploadSchema = z.object({
  file: z.instanceof(File),
  folderId: z.string().uuid().nullable().optional(),
});

export const folderNameSchema = z.string()
  .min(1, 'Folder name is required')
  .max(255, 'Folder name must be less than 255 characters')
  .refine(
    (name) => !/[\/\\]/.test(name),
    'Folder name cannot contain / or \\ characters'
  )
  .refine(
    (name) => !/[\x00-\x1F\x7F]/.test(name),
    'Folder name cannot contain control characters'
  );

export const documentNameSchema = z.string()
  .min(1, 'Document name is required')
  .max(255, 'Document name must be less than 255 characters')
  .refine(
    (name) => /\.(md|txt)$/.test(name),
    'Document name must end with .md or .txt'
  )
  .refine(
    (name) => !/[\/\\]/.test(name),
    'Document name cannot contain / or \\ characters'
  )
  .refine(
    (name) => !/[\x00-\x1F\x7F]/.test(name),
    'Document name cannot contain control characters'
  );

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate file for upload (client-side pre-flight check)
 * Server-side validation is the source of truth for security
 */
export function validateFile(file: File): FileValidationResult {
  // Check file type
  if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
    return {
      valid: false,
      error: 'Only .md and .txt files are supported'
    };
  }

  // Check file size (min)
  if (file.size < MIN_FILE_SIZE) {
    return {
      valid: false,
      error: 'File is empty'
    };
  }

  // Check file size (max)
  if (file.size > MAX_FILE_SIZE) {
    const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`
    };
  }

  return { valid: true };
}

/**
 * Validate folder name (client-side pre-flight check)
 */
export function validateFolderName(name: string): FileValidationResult {
  try {
    folderNameSchema.parse(name);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0].message };
    }
    return { valid: false, error: 'Invalid folder name' };
  }
}

/**
 * Validate document name (client-side pre-flight check)
 */
export function validateDocumentName(name: string): FileValidationResult {
  try {
    documentNameSchema.parse(name);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0].message };
    }
    return { valid: false, error: 'Invalid document name' };
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
