/**
 * Upload State (Valtio)
 *
 * Manages file upload progress and errors
 */

import { proxy } from 'valtio';
import type { Document } from '@centrid/shared/types';

// ============================================================================
// Types
// ============================================================================

export interface UploadProgress {
  uploadId: string;
  fileName: string;
  progress: number; // 0-100
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  document?: Document; // Populated on successful upload
}

// ============================================================================
// State Definition
// ============================================================================

interface UploadState {
  uploads: Map<string, UploadProgress>;
  activeUploadCount: number;
}

export const uploadState = proxy<UploadState>({
  uploads: new Map(),
  activeUploadCount: 0,
});

// ============================================================================
// State Actions
// ============================================================================

/**
 * Start a new upload
 */
export function startUpload(uploadId: string, fileName: string) {
  uploadState.uploads.set(uploadId, {
    uploadId,
    fileName,
    progress: 0,
    status: 'pending',
  });
  uploadState.activeUploadCount++;
}

/**
 * Update upload progress
 */
export function updateUploadProgress(uploadId: string, progress: number) {
  const upload = uploadState.uploads.get(uploadId);
  if (upload) {
    upload.progress = progress;
    upload.status = 'uploading';
  }
}

/**
 * Mark upload completed
 */
export function uploadCompleted(uploadId: string, document: Document) {
  const upload = uploadState.uploads.get(uploadId);
  if (upload) {
    upload.progress = 100;
    upload.status = 'completed';
    upload.document = document;
    uploadState.activeUploadCount--;
  }
}

/**
 * Mark upload failed
 */
export function uploadError(uploadId: string, error: string) {
  const upload = uploadState.uploads.get(uploadId);
  if (upload) {
    upload.status = 'error';
    upload.error = error;
    uploadState.activeUploadCount--;
  }
}

/**
 * Remove upload from state (clear completed/error)
 */
export function removeUpload(uploadId: string) {
  const upload = uploadState.uploads.get(uploadId);
  if (upload && (upload.status === 'completed' || upload.status === 'error')) {
    uploadState.uploads.delete(uploadId);
  }
}

/**
 * Clear all completed uploads
 */
export function clearCompletedUploads() {
  const completed = Array.from(uploadState.uploads.values())
    .filter(u => u.status === 'completed')
    .map(u => u.uploadId);

  completed.forEach(id => uploadState.uploads.delete(id));
}

/**
 * Clear all uploads (e.g., on logout)
 */
export function resetUploadState() {
  uploadState.uploads.clear();
  uploadState.activeUploadCount = 0;
}

/**
 * Get all active uploads (pending or uploading)
 */
export function getActiveUploads(): UploadProgress[] {
  return Array.from(uploadState.uploads.values())
    .filter(u => u.status === 'pending' || u.status === 'uploading');
}

/**
 * Get all completed uploads
 */
export function getCompletedUploads(): UploadProgress[] {
  return Array.from(uploadState.uploads.values())
    .filter(u => u.status === 'completed');
}

/**
 * Get all failed uploads
 */
export function getFailedUploads(): UploadProgress[] {
  return Array.from(uploadState.uploads.values())
    .filter(u => u.status === 'error');
}
