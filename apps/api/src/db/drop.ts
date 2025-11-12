/**
 * Drop all tables from the database
 *
 * This script drops all tables in the public schema.
 * Used during MVP iteration when safe to recreate schema.
 *
 * Run with: npm run db:drop
 */
import 'dotenv/config';
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

console.log('🗑️  Dropping all tables from remote database...\n');

const sql = postgres(DATABASE_URL);

try {
  // Drop all tables in the public schema with CASCADE
  await sql.unsafe(`
    DROP TABLE IF EXISTS user_profiles CASCADE;
    DROP TABLE IF EXISTS folders CASCADE;
    DROP TABLE IF EXISTS documents CASCADE;
    DROP TABLE IF EXISTS document_chunks CASCADE;
    DROP TABLE IF EXISTS agent_requests CASCADE;
    DROP TABLE IF EXISTS agent_execution_events CASCADE;
    DROP TABLE IF EXISTS agent_sessions CASCADE;
    DROP TABLE IF EXISTS usage_events CASCADE;
    DROP TABLE IF EXISTS threads CASCADE;
    DROP TABLE IF EXISTS messages CASCADE;
    DROP TABLE IF EXISTS agent_tool_calls CASCADE;
    DROP TABLE IF EXISTS context_references CASCADE;
    DROP TABLE IF EXISTS files CASCADE;
    DROP TABLE IF EXISTS shadow_entities CASCADE;
  `);

  console.log('✅ All tables dropped successfully!\n');
  await sql.end();
  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error);
  await sql.end();
  process.exit(1);
}
