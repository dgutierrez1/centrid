#!/usr/bin/env node

/**
 * Test script for list-threads API endpoint
 * Tests authentication, authorization, and thread listing functionality
 */

const SUPABASE_URL = 'https://xennuhfmnucybtyzfgcl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhlbm51aGZtbnVjeWJ0eXpmZ2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwODM1MjAsImV4cCI6MjA3NjY1OTUyMH0.UEJjyE_i8zlXrjAahejTy8s_3USLqiuivSHYVyzxCr4';

const TEST_USER = {
  email: 'test@centrid.local',
  password: 'TestPassword123!'
};

async function getAuthToken() {
  console.log('\n[AUTH] Logging in as test user...');

  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: TEST_USER.email,
      password: TEST_USER.password
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Login failed: ${response.status} ${error}`);
  }

  const data = await response.json();
  console.log(`[AUTH] ✓ Logged in successfully (user: ${data.user.email})`);
  return data.access_token;
}

async function testListThreads() {
  const startTime = Date.now();
  const scenarios = [];
  const errors = [];

  try {
    // Scenario 1: Auth error (no token)
    console.log('\n[TEST] Scenario 1: Auth error (no token)');
    const res1 = await fetch(`${SUPABASE_URL}/functions/v1/list-threads`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY
      }
    });

    const status1 = res1.status;
    const body1 = await res1.text();

    console.log(`  Status: ${status1}`);
    console.log(`  Body: ${body1.substring(0, 200)}${body1.length > 200 ? '...' : ''}`);

    scenarios.push({
      name: 'auth-error-no-token',
      status: status1 === 401 ? 'PASS' : 'FAIL',
      expected: '401 Unauthorized',
      actual: `${status1} ${res1.statusText}`
    });

    // Scenario 2: Happy path (valid token)
    console.log('\n[TEST] Scenario 2: Happy path (valid auth)');
    const token = await getAuthToken();

    const res2 = await fetch(`${SUPABASE_URL}/functions/v1/list-threads`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`
      }
    });

    const status2 = res2.status;
    const body2 = await res2.json();

    console.log(`  Status: ${status2}`);
    console.log(`  Body: ${JSON.stringify(body2, null, 2)}`);

    let scenario2Status = 'FAIL';
    if (status2 === 200 && body2.data && Array.isArray(body2.data.threads)) {
      scenario2Status = 'PASS';
      console.log(`  ✓ Valid response structure (${body2.data.threads.length} threads)`);
    } else {
      errors.push(`Expected 200 with data.threads array, got ${status2}`);
    }

    scenarios.push({
      name: 'happy-path-valid-auth',
      status: scenario2Status,
      expected: '200 with data.threads array',
      actual: `${status2} with ${body2.data?.threads ? 'valid structure' : 'invalid structure'}`
    });

    // Scenario 3: Query param filtering
    console.log('\n[TEST] Scenario 3: Query param filtering (includeArchived)');
    const res3 = await fetch(`${SUPABASE_URL}/functions/v1/list-threads?includeArchived=false`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`
      }
    });

    const status3 = res3.status;
    const body3 = await res3.json();

    console.log(`  Status: ${status3}`);
    console.log(`  Body: ${JSON.stringify(body3, null, 2)}`);

    let scenario3Status = 'PASS';
    if (status3 !== 200 || !body3.data || !Array.isArray(body3.data.threads)) {
      scenario3Status = 'FAIL';
      errors.push(`Query param filtering failed: ${status3}`);
    }

    scenarios.push({
      name: 'query-param-filtering',
      status: scenario3Status,
      expected: '200 with filtered threads',
      actual: `${status3} with ${body3.data?.threads?.length || 0} threads`
    });

    // Determine overall status
    const duration = Date.now() - startTime;
    const allPassed = scenarios.every(s => s.status === 'PASS');
    const overallStatus = allPassed ? 'PASS' : 'FAIL';

    const result = {
      testId: 'API-GET-/threads',
      status: overallStatus,
      duration,
      scenarios,
      errors
    };

    console.log('\n[RESULT]');
    console.log(JSON.stringify(result, null, 2));

    return result;

  } catch (error) {
    const duration = Date.now() - startTime;
    const result = {
      testId: 'API-GET-/threads',
      status: 'FAIL',
      duration,
      scenarios,
      errors: [error.message]
    };

    console.log('\n[ERROR]');
    console.log(JSON.stringify(result, null, 2));

    return result;
  }
}

// Run the test
testListThreads().catch(console.error);
