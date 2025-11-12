// Centrid AI Filesystem - GraphQL Client Configuration (urql)
// Version: 5.0
// Note: SSR exchange is managed by urql ssrExchange in _app.tsx

import { createClient, cacheExchange, fetchExchange } from "urql";

/**
 * GraphQL Client (urql)
 *
 * Note: This client is now primarily used for direct mutations outside of React components.
 * Most queries/mutations should use useGraphQLQuery/useGraphQLMutation hooks.
 * SSR is handled by urql ssrExchange in _app.tsx with manual hydration.
 *
 * Features:
 * - Automatic caching (cacheExchange)
 * - Cookie-based auth via Next.js API Gateway
 * - POST requests (standard GraphQL practice, required for auth middleware)
 *
 * Auth Flow:
 * 1. Client sends cookies to /api/graphql (Next.js API Gateway)
 * 2. API Gateway extracts Supabase session from cookies
 * 3. API Gateway injects Authorization header
 * 4. API Gateway forwards to Supabase Edge Function
 */
export const graphqlClient = createClient({
  url: "/api/graphql",

  // Force POST requests (disable urql v5 GET default)
  // CRITICAL: Backend auth middleware expects POST requests
  // GET requests are treated as introspection and bypass auth
  preferGetMethod: false,

  // Simplified exchange pipeline (SSR handled in _app.tsx)
  exchanges: [
    cacheExchange, // Cache results in memory
    fetchExchange, // Make HTTP requests
  ],

  // Fetch options - simple cookie-based auth
  fetchOptions: {
    credentials: "include", // Send cookies to API Gateway
    headers: {
      "Content-Type": "application/json",
    },
  },

  // Request policy (default caching behavior)
  // Use cache-first for optimal performance
  requestPolicy: "cache-first",
});
