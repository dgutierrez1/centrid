/**
 * ThreadService - Thread/conversation management
 *
 * Handles:
 * - Listing threads
 * - Creating threads
 * - Updating thread metadata
 * - Deleting threads
 * - Creating branches within threads
 *
 * All requests automatically get:
 * - Auth header injection
 * - Retry on 5xx errors
 * - Consistent error handling
 */

import { api } from '@/lib/api/client';

export interface Thread {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
  owner_user_id: string;
}

export interface CreateThreadInput {
  title: string;
  description?: string;
}

export interface UpdateThreadInput {
  title?: string;
  description?: string;
}

export interface Branch {
  id: string;
  thread_id: string;
  created_at: string;
}

export const ThreadService = {
  /**
   * List all threads for current user
   */
  async listThreads(): Promise<Thread[]> {
    return api.get<Thread[]>('/threads');
  },

  /**
   * Get single thread by ID
   */
  async getThread(threadId: string): Promise<Thread> {
    return api.get<Thread>(`/threads/${threadId}`);
  },

  /**
   * Create a new thread
   */
  async createThread(input: CreateThreadInput): Promise<Thread> {
    return api.post<Thread>('/threads', input);
  },

  /**
   * Update thread metadata
   */
  async updateThread(threadId: string, input: UpdateThreadInput): Promise<Thread> {
    return api.put<Thread>(`/threads/${threadId}`, input);
  },

  /**
   * Delete a thread
   */
  async deleteThread(threadId: string): Promise<void> {
    await api.delete(`/threads/${threadId}`);
  },

  /**
   * Create a branch within a thread
   */
  async createBranch(threadId: string): Promise<Branch> {
    return api.post<Branch>(`/threads/${threadId}/branches`, {});
  },
};

// Lowercase alias for convenience
export const threadService = ThreadService;
