/**
 * Push schema to database and apply CASCADE constraints, RLS policies, and triggers
 *
 * This combines drizzle-kit push with:
 * - CASCADE DELETE foreign keys (reference auth.users)
 * - RLS policies (row-level security)
 * - Database triggers (updated_at, search vectors)
 *
 * Run with: npm run db:push
 */
import 'dotenv/config';
import postgres from 'postgres';
import { cascadeDeleteSQL, rlsPolicies, triggers } from './schema.js';
import { execSync } from 'child_process';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

// Helper to run SQL with better error handling
async function runSQL(sql: postgres.Sql, sqlString: string, description: string): Promise<boolean> {
  try {
    await sql.unsafe(sqlString);
    return true;
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log(`ℹ️  ${description} already exists (skipped)`);
      return false;
    }
    throw new Error(`Failed to apply ${description}: ${error.message}`);
  }
}

// Step 1: Push schema using drizzle-kit
function pushSchema() {
  console.log('🔄 Step 1: Pushing schema with drizzle-kit...\n');
  execSync('npx drizzle-kit push --force', { stdio: 'inherit' });
}

// Step 2: Apply CASCADE DELETE constraints
async function applyCascadeDelete(sql: postgres.Sql) {
  console.log('\n🔄 Step 2: Applying CASCADE DELETE foreign keys...');
  await runSQL(sql, cascadeDeleteSQL, 'CASCADE DELETE constraints');
  console.log('✅ CASCADE DELETE constraints applied');
}

// Step 3: Apply RLS policies
async function applyRLSPolicies(sql: postgres.Sql) {
  console.log('\n🔄 Step 3: Applying RLS policies...');

  const policies = [
    { sql: rlsPolicies.userProfiles, name: 'user_profiles' },
    { sql: rlsPolicies.documents, name: 'documents' },
    { sql: rlsPolicies.documentChunks, name: 'document_chunks' },
    { sql: rlsPolicies.agentRequests, name: 'agent_requests' },
    { sql: rlsPolicies.agentSessions, name: 'agent_sessions' },
    { sql: rlsPolicies.usageEvents, name: 'usage_events' }
  ];

  for (const policy of policies) {
    await runSQL(sql, policy.sql, `${policy.name} RLS policies`);
  }

  console.log('✅ RLS policies applied');
}

// Step 4: Apply database triggers
async function applyTriggers(sql: postgres.Sql) {
  console.log('\n🔄 Step 4: Applying database triggers...');

  await runSQL(sql, triggers.updateUpdatedAt, 'updated_at triggers');
  await runSQL(sql, triggers.searchVectors, 'search vector triggers');

  console.log('✅ Database triggers applied');
}

// Main execution
async function main() {
  const sql = postgres(DATABASE_URL!);

  try {
    pushSchema();
    await applyCascadeDelete(sql);
    await applyRLSPolicies(sql);
    await applyTriggers(sql);

    console.log('\n✅ Database schema fully deployed!\n');
  } catch (error) {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
