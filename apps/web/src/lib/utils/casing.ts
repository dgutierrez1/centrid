/**
 * Casing Utilities
 *
 * Utilities for converting between different naming conventions
 * (snake_case ↔ camelCase)
 */

/**
 * Convert snake_case to camelCase
 *
 * Recursively transforms all object keys from snake_case to camelCase.
 * Handles arrays, nested objects, and primitive values.
 *
 * @template T - Target type (for type safety)
 * @param obj - Object to transform
 * @returns Transformed object with camelCase keys
 *
 * @example
 * const dbRow = { user_id: '123', created_at: '2024-01-01' };
 * const camelCased = snakeToCamel(dbRow);
 * // Result: { userId: '123', createdAt: '2024-01-01' }
 *
 * @example
 * // With arrays
 * const dbRows = [
 *   { user_id: '1', first_name: 'Alice' },
 *   { user_id: '2', first_name: 'Bob' }
 * ];
 * const camelCased = snakeToCamel(dbRows);
 * // Result: [
 * //   { userId: '1', firstName: 'Alice' },
 * //   { userId: '2', firstName: 'Bob' }
 * // ]
 */
export function snakeToCamel<T = any>(obj: any): T {
  // Handle null/undefined
  if (obj === null || obj === undefined) {
    return obj as T;
  }

  // Handle arrays - recursively transform each element
  if (Array.isArray(obj)) {
    return obj.map((item) => snakeToCamel(item)) as T;
  }

  // Handle Date objects (preserve as-is)
  if (obj instanceof Date) {
    return obj as T;
  }

  // Handle objects - transform keys
  if (typeof obj === 'object') {
    const transformed: any = {};

    for (const [key, value] of Object.entries(obj)) {
      // Convert snake_case to camelCase
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

      // Recursively transform nested objects
      transformed[camelKey] = snakeToCamel(value);
    }

    return transformed as T;
  }

  // Primitive values - return as-is
  return obj as T;
}

/**
 * Convert camelCase to snake_case
 *
 * Recursively transforms all object keys from camelCase to snake_case.
 * Handles arrays, nested objects, and primitive values.
 *
 * @template T - Target type (for type safety)
 * @param obj - Object to transform
 * @returns Transformed object with snake_case keys
 *
 * @example
 * const jsObj = { userId: '123', createdAt: '2024-01-01' };
 * const snakeCased = camelToSnake(jsObj);
 * // Result: { user_id: '123', created_at: '2024-01-01' }
 */
export function camelToSnake<T = any>(obj: any): T {
  // Handle null/undefined
  if (obj === null || obj === undefined) {
    return obj as T;
  }

  // Handle arrays - recursively transform each element
  if (Array.isArray(obj)) {
    return obj.map((item) => camelToSnake(item)) as T;
  }

  // Handle Date objects (preserve as-is)
  if (obj instanceof Date) {
    return obj as T;
  }

  // Handle objects - transform keys
  if (typeof obj === 'object') {
    const transformed: any = {};

    for (const [key, value] of Object.entries(obj)) {
      // Convert camelCase to snake_case
      const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

      // Recursively transform nested objects
      transformed[snakeKey] = camelToSnake(value);
    }

    return transformed as T;
  }

  // Primitive values - return as-is
  return obj as T;
}
