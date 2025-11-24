/**
 * GraphQL Route
 * Mounts GraphQL Yoga server at /api/graphql
 */

import { createYoga } from "graphql-yoga";
import { schema } from "../../../graphql/schema.ts";
import type { Context } from "hono";
import { createLogger, setRequestContext } from "../../../utils/logger.ts";

const logger = createLogger('graphql/server');

// Helper to sanitize variables for logging (mask sensitive fields)
function sanitizeVariables(variables: Record<string, any>): Record<string, any> {
  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'accessToken'];
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(variables)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeVariables(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

// Export Hono-compatible handler
export const graphqlHandler = async (c: Context) => {
  // Extract userId from Hono context (set by auth middleware)
  const userId = c.get("userId");

  // Create GraphQL Yoga instance with context from Hono
  // Note: Creating per-request allows direct access to Hono context
  const yoga = createYoga({
    schema,
    graphqlEndpoint: "/api/graphql",
    // Pass userId directly from Hono context to GraphQL context
    context: async ({ request }) => {
      const requestId = c.get('requestId');

      // GET requests are for GraphiQL/introspection (not protected by auth middleware)
      // POST requests go through auth middleware and must have userId
      if (request.method === "POST" && !userId) {
        // This shouldn't happen since POST is protected by auth middleware
        logger.error('POST request without userId - auth middleware may have failed');
        throw new Error("Authentication required");
      }

      if (request.method === "GET") {
        logger.info('Introspection query (GET) - skipping auth');
      }

      // CRITICAL FIX: Never pass empty string as userId
      // If userId is falsy (undefined, null, empty string), throw clear error
      if (request.method === "POST" && (!userId || userId === "")) {
        logger.error('userId is empty or invalid', {
          userId,
          type: typeof userId,
        });
        throw new Error("Invalid user ID from authentication");
      }

      // Update AsyncLocalStorage context with userId (now available after auth middleware)
      // This ensures all child loggers have access to userId + requestId
      if (userId) {
        setRequestContext({
          requestId,
          userId,
          path: '/api/graphql',
          method: request.method,
        });
      }

      return {
        userId: userId as string, // Type assertion - validated above for POST requests
        requestId,
      };
    },
    // Centralized error logging for all GraphQL operations
    plugins: [
      {
        onExecute: () => ({
          onExecuteDone: ({ args, result }: any) => {
            const { operationName, variableValues } = args;

            // Log successful operations with request details
            logger.info('GraphQL operation completed', {
              operationName,
              variableKeys: variableValues ? Object.keys(variableValues) : [],
              hasErrors: result.errors && result.errors.length > 0,
            });

            // Log execution errors with full details
            if (result.errors && result.errors.length > 0) {
              logger.error('GraphQL execution errors', {
                operationName,
                errors: result.errors.map((e: any) => ({
                  message: e.message,
                  path: e.path,
                  extensions: e.extensions,
                  // Log original error for debugging
                  originalError: e.originalError?.message,
                })),
                // Log sanitized variables (mask sensitive fields)
                variables: variableValues ? sanitizeVariables(variableValues) : {},
              });
            }
          },
        }),
      },
    ],
    // @ts-expect-error - formatError exists in GraphQL Yoga but types may not be current
    formatError: (error: any, context: any) => {
      // Enhanced error logging - catches ALL error types (parse, validation, execution)
      logger.error('GraphQL error', {
        type: error.extensions?.code || 'UNKNOWN',
        message: error.message,
        path: error.path,
        locations: error.locations,
        extensions: error.extensions,
        // Log original error details for debugging
        originalError: error.originalError ? {
          message: error.originalError.message,
          name: error.originalError.name,
          stack: error.originalError.stack?.split('\n').slice(0, 3), // First 3 lines of stack
        } : undefined,
        operation: context?.operationName,
        variableKeys: context?.variables ? Object.keys(context.variables) : [],
      });

      return error; // Return original error to client
    },
    // Enable GraphQL Playground in development
    graphiql: {
      title: "Centrid GraphQL API",
    },
    // Enable multipart file uploads (GraphQL Yoga built-in support)
    multipart: true,
    // Allow introspection in development (for codegen)
    maskedErrors: false,
  });

  // Pass request to Yoga
  return await yoga.fetch(c.req.raw);
};
