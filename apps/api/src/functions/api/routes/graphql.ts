/**
 * GraphQL Route
 * Mounts GraphQL Yoga server at /api/graphql
 */

import { createYoga } from 'graphql-yoga';
import { schema } from '../../../graphql/schema.ts';
import type { Context } from 'hono';

// Export Hono-compatible handler
export const graphqlHandler = async (c: Context) => {
  // Extract userId from Hono context (set by auth middleware)
  const userId = c.get('userId') || '';

  // Create GraphQL Yoga instance with context from Hono
  // Note: Creating per-request allows direct access to Hono context
  const yoga = createYoga({
    schema,
    graphqlEndpoint: '/api/graphql',
    // Pass userId directly from Hono context to GraphQL context
    context: async () => ({
      userId,
    }),
    // Enable GraphQL Playground in development
    graphiql: {
      title: 'Centrid GraphQL API',
    },
    // Enable multipart file uploads (GraphQL Yoga built-in support)
    multipart: true,
    // Allow introspection in development (for codegen)
    maskedErrors: false,
  });

  // Pass request to Yoga
  return await yoga.fetch(c.req.raw);
};
