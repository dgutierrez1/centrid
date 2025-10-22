import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { getMigrationClient } from './index';

/**
 * Database Migration Runner
 *
 * Runs all pending migrations from drizzle/migrations/ directory.
 * Uses transaction-based migration for automatic rollback on failure.
 *
 * Usage:
 *   tsx src/db/migrate.ts
 */

async function main() {
  console.log('🔄 Running migrations...');

  const sql = getMigrationClient();
  const db = drizzle(sql);

  try {
    await migrate(db, { migrationsFolder: './drizzle/migrations' });
    console.log('✅ Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
