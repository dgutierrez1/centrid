/**
 * Database Configuration
 * Centralized DB initialization for all modules
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.ts';

let dbInstance: any = null;
let sqlClient: any = null;

/**
 * Get or create database instance
 */
export function getDbInstance() {
  if (!dbInstance) {
    const databaseUrl = Deno.env.get('DB_URL') || Deno.env.get('SUPABASE_DB_URL') || process.env.DB_URL || process.env.SUPABASE_DB_URL;

    if (!databaseUrl) {
      throw new Error('SUPABASE_DB_URL environment variable is not set');
    }

    sqlClient = postgres(databaseUrl, {
      max: 5,
      idle_timeout: 5,
      connect_timeout: 5,
      prepare: false,
    });
    dbInstance = drizzle(sqlClient, { schema });
  }

  return dbInstance;
}

/**
 * Get SQL client
 */
export function getSqlClient() {
  if (!sqlClient) {
    const databaseUrl = Deno.env.get('DB_URL') || Deno.env.get('SUPABASE_DB_URL') || process.env.DB_URL || process.env.SUPABASE_DB_URL;

    if (!databaseUrl) {
      throw new Error('SUPABASE_DB_URL environment variable is not set');
    }

    sqlClient = postgres(databaseUrl, {
      max: 5,
      idle_timeout: 5,
      connect_timeout: 5,
      prepare: false,
    });
  }

  return sqlClient;
}

/**
 * Close database connection
 */
export async function closeDb() {
  if (sqlClient) {
    await sqlClient.end();
    sqlClient = null;
    dbInstance = null;
  }
}
