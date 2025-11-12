/**
 * Test helper functions for frontend tests
 * Provides utilities for testing React components
 */

import React from 'react';
import type { RenderOptions } from '@testing-library/react';
import { render } from '@testing-library/react';
import { vi } from 'vitest';

/**
 * Custom render function that wraps components with necessary providers
 * Use this instead of RTL's default render
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const AllProviders = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
  };

  return render(ui, { wrapper: AllProviders, ...options });
}

/**
 * Create a mock API client for testing
 */
export function createMockApiClient() {
  return {
    get: vi.fn().mockResolvedValue({ data: [], error: null }),
    post: vi.fn().mockResolvedValue({ data: {}, error: null }),
    patch: vi.fn().mockResolvedValue({ data: {}, error: null }),
    delete: vi.fn().mockResolvedValue({ data: null, error: null }),
    stream: vi.fn(),
  };
}

/**
 * Create a mock router for testing
 */
export function createMockRouter() {
  return {
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    route: '/',
    isReady: true,
  };
}

/**
 * Wait for a specific amount of time
 */
export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fire all pending promises
 * Useful for testing async state updates
 */
export function flushPromises() {
  return new Promise((resolve) => setImmediate(resolve));
}
