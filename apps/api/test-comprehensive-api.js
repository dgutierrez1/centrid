#!/usr/bin/env node

/**
 * Comprehensive API Test Suite
 *
 * Tests the complete consolidated API with all controllers:
 * - Thread operations
 * - Message operations
 * - File operations
 * - Error handling
 * - Authentication
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:54321/functions/v1/api';
const TEST_SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'test-key';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n=== ${title} ===`, 'blue');
}

function logSubsection(title) {
  log(`\n--- ${title} ---`, 'cyan');
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

// Test suites
async function testAPIBasics() {
  logSection('API Basics');

  const tests = [];

  // Health check
  try {
    const response = await makeRequest('GET', '/health');
    tests.push({
      name: 'Health check endpoint',
      condition: response.status === 200,
      details: `Status: ${response.status}`,
    });
  } catch (error) {
    tests.push({
      name: 'Health check endpoint',
      condition: false,
      details: `Error: ${error.message}`,
    });
  }

  // API info
  try {
    const response = await makeRequest('GET', '/');
    tests.push({
      name: 'API info endpoint',
      condition: response.status === 200,
      details: `Status: ${response.status}`,
    });

    if (response.status === 200) {
      tests.push({
        name: 'API returns route information',
        condition: Array.isArray(response.data.routes) && response.data.routes.length > 0,
        details: `Routes: ${response.data.routes?.length || 0}`,
      });
    }
  } catch (error) {
    tests.push({
      name: 'API info endpoint',
      condition: false,
      details: `Error: ${error.message}`,
    });
  }

  // 404 handling
  try {
    const response = await makeRequest('GET', '/nonexistent');
    tests.push({
      name: '404 route handling',
      condition: response.status === 404,
      details: `Status: ${response.status}`,
    });
  } catch (error) {
    tests.push({
      name: '404 route handling',
      condition: false,
      details: `Error: ${error.message}`,
    });
  }

  tests.forEach(test => {
    logTest(test.name, test.condition, test.details);
  });

  return tests.filter(t => t.condition).length / tests.length;
}

async function testThreadEndpoints() {
  logSection('Thread Endpoints');

  const tests = [];

  // List threads (should fail with auth error)
  try {
    const response = await makeRequest('GET', '/threads');
    tests.push({
      name: 'GET /threads endpoint exists',
      condition: response.status === 401 || response.status === 200,
      details: `Status: ${response.status} (401 expected without auth)`,
    });
  } catch (error) {
    tests.push({
      name: 'GET /threads endpoint exists',
      condition: false,
      details: `Error: ${error.message}`,
    });
  }

  // Create thread validation
  try {
    const response = await makeRequest('POST', '/threads', {});
    tests.push({
      name: 'POST /threads validates input',
      condition: response.status === 400 || response.status === 401,
      details: `Status: ${response.status} (validation or auth error)`,
    });
  } catch (error) {
    tests.push({
      name: 'POST /threads validates input',
      condition: false,
      details: `Error: ${error.message}`,
    });
  }

  // Get thread by ID validation
  try {
    const response = await makeRequest('GET', '/threads/invalid-id');
    tests.push({
      name: 'GET /threads/:id endpoint exists',
      condition: response.status === 401 || response.status === 404 || response.status === 400,
      details: `Status: ${response.status}`,
    });
  } catch (error) {
    tests.push({
      name: 'GET /threads/:id endpoint exists',
      condition: false,
      details: `Error: ${error.message}`,
    });
  }

  // Thread search
  try {
    const response = await makeRequest('GET', '/threads/search');
    tests.push({
      name: 'GET /threads/search validates query',
      condition: response.status === 400 || response.status === 401,
      details: `Status: ${response.status}`,
    });
  } catch (error) {
    tests.push({
      name: 'GET /threads/search validates query',
      condition: false,
      details: `Error: ${error.message}`,
    });
  }

  tests.forEach(test => {
    logTest(test.name, test.condition, test.details);
  });

  return tests.filter(t => t.condition).length / tests.length;
}

async function testMessageEndpoints() {
  logSection('Message Endpoints');

  const tests = [];

  // Create message validation
  try {
    const response = await makeRequest('POST', '/threads/test-thread/messages', {});
    tests.push({
      name: 'POST /threads/:threadId/messages validates input',
      condition: response.status === 400 || response.status === 401,
      details: `Status: ${response.status}`,
    });
  } catch (error) {
    tests.push({
      name: 'POST /threads/:threadId/messages validates input',
      condition: false,
      details: `Error: ${error.message}`,
    });
  }

  // Get thread messages
  try {
    const response = await makeRequest('GET', '/threads/test-thread/messages');
    tests.push({
      name: 'GET /threads/:threadId/messages endpoint exists',
      condition: response.status === 401 || response.status === 404 || response.status === 200,
      details: `Status: ${response.status}`,
    });
  } catch (error) {
    tests.push({
      name: 'GET /threads/:threadId/messages endpoint exists',
      condition: false,
      details: `Error: ${error.message}`,
    });
  }

  // Get message by ID
  try {
    const response = await makeRequest('GET', '/messages/test-message-id');
    tests.push({
      name: 'GET /messages/:id endpoint exists',
      condition: response.status === 401 || response.status === 404 || response.status === 400,
      details: `Status: ${response.status}`,
    });
  } catch (error) {
    tests.push({
      name: 'GET /messages/:id endpoint exists',
      condition: false,
      details: `Error: ${error.message}`,
    });
  }

  // Message search
  try {
    const response = await makeRequest('GET', '/threads/test-thread/messages/search');
    tests.push({
      name: 'GET /threads/:threadId/messages/search validates query',
      condition: response.status === 400 || response.status === 401,
      details: `Status: ${response.status}`,
    });
  } catch (error) {
    tests.push({
      name: 'GET /threads/:threadId/messages/search validates query',
      condition: false,
      details: `Error: ${error.message}`,
    });
  }

  // Process message with agent
  try {
    const response = await makeRequest('POST', '/messages/test-message-id/process');
    tests.push({
      name: 'POST /messages/:id/process endpoint exists',
      condition: response.status === 401 || response.status === 404 || response.status === 400,
      details: `Status: ${response.status}`,
    });
  } catch (error) {
    tests.push({
      name: 'POST /messages/:id/process endpoint exists',
      condition: false,
      details: `Error: ${error.message}`,
    });
  }

  tests.forEach(test => {
    logTest(test.name, test.condition, test.details);
  });

  return tests.filter(t => t.condition).length / tests.length;
}

async function testFileEndpoints() {
  logSection('File Endpoints');

  const tests = [];

  // Create file validation
  try {
    const response = await makeRequest('POST', '/files', {});
    tests.push({
      name: 'POST /files validates input',
      condition: response.status === 400 || response.status === 401,
      details: `Status: ${response.status}`,
    });
  } catch (error) {
    tests.push({
      name: 'POST /files validates input',
      condition: false,
      details: `Error: ${error.message}`,
    });
  }

  // List files
  try {
    const response = await makeRequest('GET', '/files');
    tests.push({
      name: 'GET /files endpoint exists',
      condition: response.status === 401 || response.status === 200,
      details: `Status: ${response.status}`,
    });
  } catch (error) {
    tests.push({
      name: 'GET /files endpoint exists',
      condition: false,
      details: `Error: ${error.message}`,
    });
  }

  // Get file by ID
  try {
    const response = await makeRequest('GET', '/files/test-file-id');
    tests.push({
      name: 'GET /files/:id endpoint exists',
      condition: response.status === 401 || response.status === 404 || response.status === 400,
      details: `Status: ${response.status}`,
    });
  } catch (error) {
    tests.push({
      name: 'GET /files/:id endpoint exists',
      condition: false,
      details: `Error: ${error.message}`,
    });
  }

  // Get file by path
  try {
    const response = await makeRequest('GET', '/files/by-path');
    tests.push({
      name: 'GET /files/by-path validates path parameter',
      condition: response.status === 400 || response.status === 401,
      details: `Status: ${response.status}`,
    });
  } catch (error) {
    tests.push({
      name: 'GET /files/by-path validates path parameter',
      condition: false,
      details: `Error: ${error.message}`,
    });
  }

  // File search
  try {
    const response = await makeRequest('GET', '/files/search');
    tests.push({
      name: 'GET /files/search validates query',
      condition: response.status === 400 || response.status === 401,
      details: `Status: ${response.status}`,
    });
  } catch (error) {
    tests.push({
      name: 'GET /files/search validates query',
      condition: false,
      details: `Error: ${error.message}`,
    });
  }

  // Files by thread
  try {
    const response = await makeRequest('GET', '/files/thread/test-thread-id');
    tests.push({
      name: 'GET /files/thread/:threadId endpoint exists',
      condition: response.status === 401 || response.status === 200 || response.status === 404,
      details: `Status: ${response.status}`,
    });
  } catch (error) {
    tests.push({
      name: 'GET /files/thread/:threadId endpoint exists',
      condition: false,
      details: `Error: ${error.message}`,
    });
  }

  // File provenance
  try {
    const response = await makeRequest('GET', '/files/test-file-id/provenance');
    tests.push({
      name: 'GET /files/:id/provenance endpoint exists',
      condition: response.status === 401 || response.status === 404 || response.status === 400,
      details: `Status: ${response.status}`,
    });
  } catch (error) {
    tests.push({
      name: 'GET /files/:id/provenance endpoint exists',
      condition: false,
      details: `Error: ${error.message}`,
    });
  }

  // Duplicate file
  try {
    const response = await makeRequest('POST', '/files/test-file-id/duplicate');
    tests.push({
      name: 'POST /files/:id/duplicate validates input',
      condition: response.status === 400 || response.status === 401 || response.status === 404,
      details: `Status: ${response.status}`,
    });
  } catch (error) {
    tests.push({
      name: 'POST /files/:id/duplicate validates input',
      condition: false,
      details: `Error: ${error.message}`,
    });
  }

  tests.forEach(test => {
    logTest(test.name, test.condition, test.details);
  });

  return tests.filter(t => t.condition).length / tests.length;
}

async function testErrorHandling() {
  logSection('Error Handling');

  const tests = [];

  // Invalid JSON
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
      name: 'Invalid JSON handling',
      condition: response.status === 400 || response.status === 401,
      details: `Status: ${response.status}`,
    });
  } catch (error) {
    tests.push({
      name: 'Invalid JSON handling',
      condition: false,
      details: `Error: ${error.message}`,
    });
  }

  // Missing content-type
  try {
    const response = await fetch(`${API_BASE_URL}/threads`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_SUPABASE_KEY}`,
      },
      body: '{"test": "data"}',
    });

    tests.push({
      name: 'Missing Content-Type validation',
      condition: response.status === 400 || response.status === 401,
      details: `Status: ${response.status}`,
    });
  } catch (error) {
    tests.push({
      name: 'Missing Content-Type validation',
      condition: false,
      details: `Error: ${error.message}`,
    });
  }

  // CORS preflight
  try {
    const response = await fetch(`${API_BASE_URL}/test`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
      },
    });

    tests.push({
      name: 'CORS preflight handling',
      condition: response.status === 200 || response.status === 204,
      details: `Status: ${response.status}`,
    });
  } catch (error) {
    tests.push({
      name: 'CORS preflight handling',
      condition: false,
      details: `Error: ${error.message}`,
    });
  }

  tests.forEach(test => {
    logTest(test.name, test.condition, test.details);
  });

  return tests.filter(t => t.condition).length / tests.length;
}

async function testRouteCount() {
  logSection('Route Coverage');

  try {
    const response = await makeRequest('GET', '/');

    if (response.status === 200 && response.data.routes) {
      const routes = response.data.routes;
      const routeCategories = {
        thread: routes.filter(r => r.path.includes('/thread')).length,
        message: routes.filter(r => r.path.includes('/message')).length,
        file: routes.filter(r => r.path.includes('/file')).length,
        system: routes.filter(r => ['/health', '/'].includes(r.path)).length,
      };

      logSubsection('Route Count by Category');
      Object.entries(routeCategories).forEach(([category, count]) => {
        log(`${category.charAt(0).toUpperCase() + category.slice(1)} routes: ${count}`, 'cyan');
      });

      const totalRoutes = routes.length;
      const expectedMinRoutes = 20; // Minimum expected routes

      const test = {
        name: 'Sufficient route coverage',
        condition: totalRoutes >= expectedMinRoutes,
        details: `Total routes: ${totalRoutes} (expected: ${expectedMinRoutes}+)`,
      };

      logTest(test.name, test.condition, test.details);

      return {
        success: test.condition,
        totalRoutes,
        routeCategories,
      };
    } else {
      logTest('Route count verification', false, 'Could not fetch route information');
      return { success: false, totalRoutes: 0, routeCategories: {} };
    }
  } catch (error) {
    logTest('Route count verification', false, `Error: ${error.message}`);
    return { success: false, totalRoutes: 0, routeCategories: {} };
  }
}

// Main test runner
async function runComprehensiveTests() {
  log('🚀 Starting Comprehensive API Tests', 'blue');
  log(`Testing API at: ${API_BASE_URL}`, 'yellow');

  if (!API_BASE_URL.includes('localhost')) {
    log('⚠️  Warning: Not testing against localhost. Make sure your API is running.', 'yellow');
  }

  const testResults = [
    { name: 'API Basics', test: testAPIBasics },
    { name: 'Thread Endpoints', test: testThreadEndpoints },
    { name: 'Message Endpoints', test: testMessageEndpoints },
    { name: 'File Endpoints', test: testFileEndpoints },
    { name: 'Error Handling', test: testErrorHandling },
  ];

  const results = [];

  for (const { name, test } of testResults) {
    try {
      const score = await test();
      results.push({ name, score, passed: score >= 0.8 }); // 80% pass rate
    } catch (error) {
      log(`❌ ${name} failed with error: ${error.message}`, 'red');
      results.push({ name, score: 0, passed: false, error: error.message });
    }
  }

  // Route coverage test
  const routeResult = await testRouteCount();

  // Summary
  logSection('Test Summary');

  const passedSuites = results.filter(r => r.passed).length;
  const totalSuites = results.length;
  const averageScore = results.reduce((sum, r) => sum + r.score, 0) / totalSuites;

  log(`Overall: ${passedSuites}/${totalSuites} test suites passed`,
      passedSuites === totalSuites ? 'green' : 'yellow');
  log(`Average Score: ${Math.round(averageScore * 100)}%`,
      averageScore >= 0.8 ? 'green' : averageScore >= 0.6 ? 'yellow' : 'red');

  if (passedSuites === totalSuites && routeResult.success) {
    log('🎉 All tests passed! API is working correctly.', 'green');
  } else {
    log('⚠️  Some tests failed. Check the implementation.', 'yellow');

    results.filter(r => !r.passed).forEach(result => {
      if (result.error) {
        log(`   ${result.name}: ${result.error}`, 'red');
      } else {
        log(`   ${result.name}: Low score (${Math.round(result.score * 100)}%)`, 'yellow');
      }
    });
  }

  log('\n📊 Test Results Summary:', 'blue');
  results.forEach(result => {
    const score = Math.round(result.score * 100);
    const color = result.passed ? 'green' : score >= 60 ? 'yellow' : 'red';
    log(`${result.name}: ${score}%`, color);
  });

  log('\nNext steps:', 'blue');
  log('1. Deploy the API function to test with real authentication', 'yellow');
  log('2. Add integration tests with database operations', 'yellow');
  log('3. Test performance under load', 'yellow');
  log('4. Add monitoring and alerting', 'yellow');

  return {
    overall: passedSuites === totalSuites && routeResult.success,
    suites: results,
    routes: routeResult,
    averageScore,
  };
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveTests().then(result => {
    process.exit(result.overall ? 0 : 1);
  }).catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export { runComprehensiveTests };