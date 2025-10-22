/**
 * Shared Database Helper for Supabase Edge Functions
 *
 * Provides a single-connection-per-request database client for Edge Functions.
 * This pattern ensures proper resource cleanup and prevents connection leaks
 * in the serverless environment.
 *
 * Usage:
 * ```typescript
 * import { getDB } from '../_shared/db.ts';
 *
 * Deno.serve(async (req) => {
 *   const { db, cleanup } = await getDB();
 *
 *   try {
 *     const results = await db.query.documents.findMany();
 *     return Response.json(results);
 *   } finally {
 *     await cleanup();
 *   }
 * });
 * ```
 */

import { drizzle } from 'npm:drizzle-orm@^0.29.0/postgres-js';
import postgres from 'npm:postgres@^3.4.0';
import * as schema from '../../db/schema.ts';

/**
 * Configuration for database connection in Edge Functions
 */
const DB_CONFIG = {
  max: 1,              // Single connection per request
  idle_timeout: 20,    // Close connection after 20s idle
  connect_timeout: 10, // 10s connection timeout
} as const;

/**
 * Get a database client for Edge Function requests
 *
 * @returns Object containing the Drizzle db client and cleanup function
 *
 * @example
 * ```typescript
 * const { db, cleanup } = await getDB();
 * try {
 *   const documents = await db.query.documents.findMany({
 *     where: eq(schema.documents.userId, userId)
 *   });
 *   return Response.json(documents);
 * } finally {
 *   await cleanup();
 * }
 * ```
 */
export async function getDB() {
  const databaseUrl = Deno.env.get('DATABASE_URL');

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
      'Configure it in Supabase Dashboard → Edge Functions → Secrets'
    );
  }

  // Create single connection with postgres driver
  const sql = postgres(databaseUrl, DB_CONFIG);

  // Initialize Drizzle with schema for type-safe queries
  const db = drizzle(sql, { schema });

  return {
    db,
    /**
     * Cleanup function to close database connection
     * MUST be called in a finally block to prevent connection leaks
     */
    cleanup: async () => {
      await sql.end();
    }
  };
}

/**
 * Type exports for use in Edge Functions
 */
export type DB = Awaited<ReturnType<typeof getDB>>['db'];
