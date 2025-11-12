/**
 * GraphQL Route
 * Mounts GraphQL Yoga server at /api/graphql
 */

import { createYoga } from "graphql-yoga";
import { schema } from "../../../graphql/schema.ts";
import type { Context } from "hono";

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
      // GET requests are for GraphiQL/introspection (not protected by auth middleware)
      // POST requests go through auth middleware and must have userId
      if (request.method === "POST" && !userId) {
        // This shouldn't happen since POST is protected by auth middleware
        console.error(
          "[GraphQL] POST request without userId - auth middleware may have failed"
        );
        throw new Error("Authentication required");
      }

      if (request.method === "GET") {
        console.log("[GraphQL] Introspection query (GET) - skipping auth");
      }

      // CRITICAL FIX: Never pass empty string as userId
      // If userId is falsy (undefined, null, empty string), throw clear error
      if (request.method === "POST" && (!userId || userId === "")) {
        console.error("[GraphQL] userId is empty or invalid:", {
          userId,
          type: typeof userId,
        });
        throw new Error("Invalid user ID from authentication");
      }

      return {
        userId: userId as string, // Type assertion - validated above for POST requests
      };
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
