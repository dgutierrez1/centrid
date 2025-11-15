/**
 * Validation utilities for common data formats
 */

// UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
// where x is any hexadecimal digit and y is one of 8, 9, A, or B
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Relaxed UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Check if a string is a valid UUID format
 * Accepts any UUID version (v1, v4, etc.)
 */
export function isValidUUID(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  return UUID_REGEX.test(value);
}

/**
 * Check if a string is a valid UUID v4 format (strict)
 */
export function isValidUUIDv4(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  return UUID_V4_REGEX.test(value);
}

/**
 * Validate UUID format and throw descriptive error if invalid
 * @throws Error with user-friendly message
 */
export function validateUUID(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error('UUID must be a string');
  }

  if (!UUID_REGEX.test(value)) {
    throw new Error(
      `Invalid UUID format: "${value}". Expected format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
    );
  }
}

/**
 * Validate UUID v4 format (strict) and throw descriptive error if invalid
 * @throws Error with user-friendly message
 */
export function validateUUIDv4(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error('UUID must be a string');
  }

  if (!UUID_V4_REGEX.test(value)) {
    throw new Error(
      `Invalid UUID v4 format: "${value}". Expected format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`
    );
  }
}
