/**
 * Standardized error codes used across all Edge Functions
 * Allows frontend to handle errors consistently
 */

export const ERROR_CODES = {
  // Validation (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Authentication (401)
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Authorization (403)
  FORBIDDEN: 'FORBIDDEN',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  PLAN_UPGRADE_REQUIRED: 'PLAN_UPGRADE_REQUIRED',

  // Not Found (404)
  NOT_FOUND: 'NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  DOCUMENT_NOT_FOUND: 'DOCUMENT_NOT_FOUND',
  THREAD_NOT_FOUND: 'THREAD_NOT_FOUND',
  FOLDER_NOT_FOUND: 'FOLDER_NOT_FOUND',

  // Conflict (409)
  DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
  RESOURCE_EXISTS: 'RESOURCE_EXISTS',
  CONFLICT: 'CONFLICT',

  // Rate Limit (429)
  RATE_LIMITED: 'RATE_LIMITED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',

  // Server (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  OPERATION_FAILED: 'OPERATION_FAILED',
} as const;

/**
 * Structured application error
 * Used for domain-specific errors that should be returned to client
 */
export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly issues?: Array<{ path: string; message: string; code?: string }>;

  constructor(
    message: string,
    code: string,
    status: number = 500,
    issues?: Array<{ path: string; message: string; code?: string }>,
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.issues = issues;

    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * Database-specific error
 */
export class DatabaseError extends AppError {
  constructor(message: string, _originalError?: Error) {
    super(
      `Database error: ${message}`,
      ERROR_CODES.DATABASE_ERROR,
      500
    );
    this.name = 'DatabaseError';
  }
}

/**
 * Authentication error
 */
export class AuthError extends AppError {
  constructor(message: string, code: string = ERROR_CODES.UNAUTHORIZED) {
    super(message, code, 401);
    this.name = 'AuthError';
  }
}

/**
 * Permission/authorization error
 */
export class PermissionError extends AppError {
  constructor(message: string = 'Permission denied') {
    super(message, ERROR_CODES.PERMISSION_DENIED, 403);
    this.name = 'PermissionError';
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, ERROR_CODES.NOT_FOUND, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Validation error (not caught by Zod at request boundary)
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    issues?: Array<{ path: string; message: string; code?: string }>,
  ) {
    super(message, ERROR_CODES.VALIDATION_ERROR, 400, issues);
    this.name = 'ValidationError';
  }
}

/**
 * Rate limit/quota error
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, ERROR_CODES.RATE_LIMITED, 429);
    this.name = 'RateLimitError';
  }
}

/**
 * Conflict error (resource already exists, etc)
 */
export class ConflictError extends AppError {
  constructor(message: string, code: string = ERROR_CODES.CONFLICT) {
    super(message, code, 409);
    this.name = 'ConflictError';
  }
}
