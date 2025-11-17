/**
 * GraphQL Route
 * Mounts GraphQL Yoga server at /api/graphql
 */

import { createYoga } from "graphql-yoga";
import { schema } from "../../../graphql/schema.ts";
import type { Context } from "hono";
import { createLogger, setRequestContext } from "../../../utils/logger.ts";

const logger = createLogger('graphql/server');

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
          onExecuteDone: ({ args }: any) => {
            const { operationName } = args;
            logger.info('GraphQL operation completed', { operationName });
          },
        }),
      },
    ],
    // @ts-expect-error - formatError exists in GraphQL Yoga but types may not be current
    formatError: (error: any, context: any) => {
      // Log all GraphQL errors with full context
      logger.error('GraphQL operation failed', {
        error: {
          message: error.message,
          path: error.path,
          extensions: error.extensions,
        },
        operation: context?.operationName,
        // Don't log full variables (may contain sensitive data), just keys
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
