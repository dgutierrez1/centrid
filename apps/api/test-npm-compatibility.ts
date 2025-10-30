/**
 * Test npm package compatibility in Deno
 * Run: deno run --allow-net --allow-env test-npm-compatibility.ts
 */

console.log('🧪 Testing npm package compatibility in Deno...\n');

let passCount = 0;
let failCount = 0;

// Test 1: Drizzle ORM (database)
try {
  const { drizzle } = await import('npm:drizzle-orm@0.30.0/node-postgres');
  console.log('✅ drizzle-orm: PASS');
  passCount++;
} catch (error) {
  console.error('❌ drizzle-orm: FAIL');
  console.error('   Error:', error.message);
  failCount++;
}

// Test 2: Anthropic SDK (AI)
try {
  const Anthropic = await import('npm:@anthropic-ai/sdk@0.20.0');
  console.log('✅ @anthropic-ai/sdk: PASS');
  passCount++;
} catch (error) {
  console.error('❌ @anthropic-ai/sdk: FAIL');
  console.error('   Error:', error.message);
  failCount++;
}

// Test 3: Supabase Client
try {
  const { createClient } = await import('npm:@supabase/supabase-js@2.39.0');
  console.log('✅ @supabase/supabase-js: PASS');
  passCount++;
} catch (error) {
  console.error('❌ @supabase/supabase-js: FAIL');
  console.error('   Error:', error.message);
  failCount++;
}

// Test 4: Zod (validation)
try {
  const { z } = await import('npm:zod@3.22.4');
  const schema = z.object({ name: z.string() });
  schema.parse({ name: 'test' });
  console.log('✅ zod: PASS');
  passCount++;
} catch (error) {
  console.error('❌ zod: FAIL');
  console.error('   Error:', error.message);
  failCount++;
}

// Test 5: OpenAI (embeddings)
try {
  const OpenAI = await import('npm:openai@4.20.0');
  console.log('✅ openai: PASS');
  passCount++;
} catch (error) {
  console.error('❌ openai: FAIL');
  console.error('   Error:', error.message);
  failCount++;
}

// Test 6: Hono Framework (our web framework)
try {
  const { Hono } = await import('https://deno.land/x/hono@v3.11.7/mod.ts');
  const app = new Hono();
  console.log('✅ hono: PASS');
  passCount++;
} catch (error) {
  console.error('❌ hono: FAIL');
  console.error('   Error:', error.message);
  failCount++;
}

// Summary
console.log('\n' + '='.repeat(50));
console.log(`✨ Compatibility Test Complete!`);
console.log(`   Passed: ${passCount}/6`);
console.log(`   Failed: ${failCount}/6`);
console.log('='.repeat(50));

if (failCount === 0) {
  console.log('\n🎉 All packages compatible! Safe to proceed with Hono implementation.');
  Deno.exit(0);
} else {
  console.log('\n⚠️  Some packages failed. Review errors above before proceeding.');
  Deno.exit(1);
}
