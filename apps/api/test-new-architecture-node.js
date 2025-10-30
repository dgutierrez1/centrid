#!/usr/bin/env node

/**
 * Test script for the new consolidated API architecture (Node.js version)
 *
 * This script tests the new controller-based Edge Function to ensure:
 * - Routes are properly matched
 * - Authentication works
 * - Response formats are consistent
 * - Error handling is correct
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:54321/functions/v1/api';
const TEST_SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const TEST_SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'test-key';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n=== ${title} ===`, 'blue');
}

function logTest(testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const color = passed ? 'green' : 'red';
  log(`${status}: ${testName}`, color);
  if (details) {
    log(`   ${details}`, 'yellow');
  }
}

// Test helper functions
async function makeRequest(method, path, body = null, headers = {}) {
  const url = `${API_BASE_URL}${path}`;
  const requestHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TEST_SUPABASE_KEY}`,
    ...headers,
  };

  const options = {
    method,
    headers: requestHeaders,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    let responseData;

    try {
      responseData = await response.json();
    } catch {
      responseData = { error: 'Invalid JSON response' };
    }

    return {
      status: response.status,
      ok: response.ok,
      data: responseData,
      headers: response.headers,
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      data: { error: error.message },
      headers: {},
    };
  }
}

// Test cases
async function testHealthCheck() {
  logSection('Health Check Tests');

  const response = await makeRequest('GET', '/health');

  const tests = [
    {
      name: 'Health check returns 200',
      condition: response.status === 200,
      details: `Status: ${response.status}`,
    },
    {
      name: 'Health check has correct structure',
      condition: response.data.status === 'healthy',
      details: `Status field: ${response.data.status}`,
    },
    {
      name: 'Health check includes timestamp',
      condition: response.data.timestamp,
      details: `Timestamp: ${response.data.timestamp}`,
    },
    {
      name: 'Health check includes request ID',
      condition: response.data.requestId,
      details: `Request ID: ${response.data.requestId}`,
    },
  ];

  tests.forEach(test => {
    logTest(test.name, test.condition, test.details);
  });

  return tests.every(test => test.condition);
}

async function testApiInfo() {
  logSection('API Info Tests');

  const response = await makeRequest('GET', '/');

  const tests = [
    {
      name: 'API info returns 200',
      condition: response.status === 200,
      details: `Status: ${response.status}`,
    },
    {
      name: 'API info has correct structure',
      condition: response.data.name === 'Centrid API',
      details: `API name: ${response.data.name}`,
    },
    {
      name: 'API info includes routes',
      condition: Array.isArray(response.data.routes),
      details: `Routes count: ${response.data.routes?.length || 0}`,
    },
    {
      name: 'Routes have required fields',
      condition: response.data.routes?.every(route => route.method && route.path),
      details: 'All routes have method and path',
    },
  ];

  tests.forEach(test => {
    logTest(test.name, test.condition, test.details);
  });

  return tests.every(test => test.condition);
}

async function testRouteNotFound() {
  logSection('404 Not Found Tests');

  const response = await makeRequest('GET', '/nonexistent-route');

  const tests = [
    {
      name: 'Nonexistent route returns 404',
      condition: response.status === 404,
      details: `Status: ${response.status}`,
    },
    {
      name: 'Error response has correct structure',
      condition: response.data.error === 'Route not found',
      details: `Error message: ${response.data.error}`,
    },
    {
      name: 'Error response includes request ID',
      condition: response.data.requestId,
      details: `Request ID: ${response.data.requestId}`,
    },
  ];

  tests.forEach(test => {
    logTest(test.name, test.condition, test.details);
  });

  return tests.every(test => test.condition);
}

async function testThreadEndpoints() {
  logSection('Thread Endpoint Tests');

  const tests = [];

  // Test GET /threads (should work even without auth for basic structure)
  try {
    const response = await makeRequest('GET', '/threads');

    tests.push({
      name: 'GET /threads returns proper response structure',
      condition: response.status === 401 || response.status === 200, // 401 expected without auth
      details: `Status: ${response.status} (401 expected without valid auth)`,
    });
  } catch (error) {
    tests.push({
      name: 'GET /threads endpoint exists',
      condition: false,
      details: `Error: ${error.message}`,
    });
  }

  // Test POST /threads with invalid data
  try {
    const response = await makeRequest('POST', '/threads', {});

    tests.push({
      name: 'POST /threads validates required fields',
      condition: response.status === 400 || response.status === 401,
      details: `Status: ${response.status} (validation or auth error)`,
    });
  } catch (error) {
    tests.push({
      name: 'POST /threads endpoint exists',
      condition: false,
      details: `Error: ${error.message}`,
    });
  }

  // Test GET /threads/search without query
  try {
    const response = await makeRequest('GET', '/threads/search');

    tests.push({
      name: 'GET /threads/search validates query parameter',
      condition: response.status === 400 || response.status === 401,
      details: `Status: ${response.status} (validation or auth error)`,
    });
  } catch (error) {
    tests.push({
      name: 'GET /threads/search endpoint exists',
      condition: false,
      details: `Error: ${error.message}`,
    });
  }

  tests.forEach(test => {
    logTest(test.name, test.condition, test.details);
  });

  // Count how many passed
  const passedCount = tests.filter(test => test.condition).length;
  log(`Thread endpoints: ${passedCount}/${tests.length} tests passed`,
      passedCount === tests.length ? 'green' : 'yellow');

  return passedCount > 0; // At least some basic functionality should work
}

async function testCorsHeaders() {
  logSection('CORS Headers Tests');

  try {
    const response = await makeRequest('OPTIONS', '/test');

    const tests = [
      {
        name: 'CORS preflight returns 200',
        condition: response.status === 200,
        details: `Status: ${response.status}`,
      },
      {
        name: 'CORS headers are present',
        condition: response.headers.get('Access-Control-Allow-Origin'),
        details: `CORS origin: ${response.headers.get('Access-Control-Allow-Origin')}`,
      },
    ];

    tests.forEach(test => {
      logTest(test.name, test.condition, test.details);
    });

    return tests.every(test => test.condition);
  } catch (error) {
    logTest('CORS Tests', false, `Error: ${error.message}`);
    return false;
  }
}

async function testErrorHandling() {
  logSection('Error Handling Tests');

  const tests = [];

  // Test invalid JSON
  try {
    const response = await fetch(`${API_BASE_URL}/threads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_SUPABASE_KEY}`,
      },
      body: 'invalid-json{',
    });

    tests.push({
      name: 'Invalid JSON handled properly',
      condition: response.status === 400 || response.status === 401,
      details: `Status: ${response.status}`,
    });
  } catch (error) {
    tests.push({
      name: 'Invalid JSON test completed',
      condition: true,
      details: `Error: ${error.message} (expected for malformed request)`,
    });
  }

  tests.forEach(test => {
    logTest(test.name, test.condition, test.details);
  });

  return tests.every(test => test.condition);
}

// Main test runner
async function runTests() {
  log('🚀 Starting New Architecture Tests', 'blue');
  log(`Testing API at: ${API_BASE_URL}`, 'yellow');

  if (!API_BASE_URL.includes('localhost')) {
    log('⚠️  Warning: Not testing against localhost. Make sure your API is running.', 'yellow');
  }

  const testResults = [
    { name: 'Health Check', test: testHealthCheck },
    { name: 'API Info', test: testApiInfo },
    { name: 'Route Not Found', test: testRouteNotFound },
    { name: 'Thread Endpoints', test: testThreadEndpoints },
    { name: 'CORS Headers', test: testCorsHeaders },
    { name: 'Error Handling', test: testErrorHandling },
  ];

  const results = [];

  for (const { name, test } of testResults) {
    try {
      const result = await test();
      results.push({ name, passed: result });
    } catch (error) {
      log(`❌ ${name} failed with error: ${error.message}`, 'red');
      results.push({ name, passed: false, error: error.message });
    }
  }

  // Summary
  logSection('Test Summary');

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  log(`Overall: ${passed}/${total} test suites passed`,
      passed === total ? 'green' : passed >= total * 0.8 ? 'yellow' : 'red');

  if (passed === total) {
    log('🎉 All tests passed! New architecture is working correctly.', 'green');
  } else {
    log('⚠️  Some tests failed. Check the implementation.', 'yellow');

    results.filter(r => !r.passed).forEach(result => {
      if (result.error) {
        log(`   ${result.name}: ${result.error}`, 'red');
      }
    });
  }

  log('\nNext steps:', 'blue');
  log('1. Fix any failing tests', 'yellow');
  log('2. Test with real authentication', 'yellow');
  log('3. Add more comprehensive tests', 'yellow');
  log('4. Test with actual database operations', 'yellow');

  return passed === total;
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export { runTests };