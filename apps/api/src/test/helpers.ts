/**
 * Test helper functions for backend tests
 */

import { vi } from 'vitest';

/**
 * Create a mock logger for testing
 * Suppresses console output during tests
 */
export function createMockLogger() {
  return {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    withTiming: vi.fn((label: string, fn: Function) => fn()),
  };
}

/**
 * Create a mock Supabase client for testing
 */
export function createMockSupabase() {
  return {
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn((callback) => callback({ data: [], error: null })),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
  };
}

/**
 * Wait for a specific amount of time
 * Useful for testing async operations
 */
export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Assert that a function throws an error
 */
export async function assertThrows(fn: Function, errorMessage?: string) {
  try {
    await fn();
    throw new Error('Expected function to throw');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (errorMessage && message !== errorMessage) {
      throw new Error(`Expected error "${errorMessage}", got "${message}"`);
    }
  }
}
