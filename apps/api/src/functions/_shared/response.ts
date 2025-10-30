/**
 * Standard response format for all Edge Functions
 * Ensures consistent success/error responses across endpoints
 */

interface SuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  status: number;
  timestamp: string;
  issues?: Array<{ path: string; message: string; code?: string }>;
}

/**
 * Return a successful response with consistent format
 */
export function jsonResponse<T>(
  data: T,
  status = 200,
): Response {
  return new Response(
    JSON.stringify({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    } as SuccessResponse<T>),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}

/**
 * Return an error response with consistent format
 */
export function errorResponse(
  message: string,
  code: string,
  status = 500,
  issues?: Array<{ path: string; message: string; code?: string }>,
): Response {
  const response: ErrorResponse = {
    success: false,
    error: message,
    code,
    status,
    timestamp: new Date().toISOString(),
  };

  if (issues && issues.length > 0) {
    response.issues = issues;
  }

  return new Response(JSON.stringify(response), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

/**
 * Handle both known and unknown errors uniformly
 * Routes to appropriate error response format
 */
export function handleError(err: unknown): Response {
  // Handle validation errors from validateRequest middleware
  if (
    err &&
    typeof err === 'object' &&
    'type' in err &&
    err.type === 'VALIDATION_ERROR'
  ) {
    return errorResponse(
      (err as Record<string, unknown>).message as string ||
        'Validation failed',
      'VALIDATION_ERROR',
      400,
      (err as Record<string, unknown>).issues as Array<{
        path: string;
        message: string;
        code?: string;
      }> | undefined
    );
  }

  // Handle app errors (custom errors with code + status)
  if (
    err &&
    typeof err === 'object' &&
    'code' in err &&
    'status' in err &&
    typeof (err as Record<string, unknown>).status === 'number'
  ) {
    return errorResponse(
      (err as Record<string, unknown>).message as string ||
        'An error occurred',
      (err as Record<string, unknown>).code as string,
      (err as Record<string, unknown>).status as number,
      (err as Record<string, unknown>).issues as Array<{
        path: string;
        message: string;
        code?: string;
      }> | undefined
    );
  }

  // Handle standard Error objects
  if (err instanceof Error) {
    console.error('Unhandled error:', err);
    return errorResponse(
      'Internal server error',
      'INTERNAL_ERROR',
      500
    );
  }

  // Handle unknown errors
  console.error('Unknown error:', err);
  return errorResponse(
    'Internal server error',
    'INTERNAL_ERROR',
    500
  );
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsPreFlight(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
