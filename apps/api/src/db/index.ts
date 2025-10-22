import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Database Client Configuration
 *
 * Single connection pattern for backend queries.
 * For Edge Functions, use the getDB() function in src/functions/_shared/db.ts instead.
 */

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Query client for backend operations
const queryClient = postgres(connectionString);

// Export Drizzle instance with schema
export const db = drizzle(queryClient, { schema });

/**
 * Migration client with single connection
 * Used by migrate.ts to run migrations safely
 */
export function getMigrationClient() {
  return postgres(connectionString, {
    max: 1,
    connect_timeout: 30,
    idle_timeout: 30,
  });
}

// Export schema and types for use in other modules
export { schema };
export * from './schema';
