#!/usr/bin/env node

/**
 * Test Script for Thread GET Endpoint
 * Tests thread retrieval with proper authentication
 */

const https = require('https');
const { execSync } = require('child_process');

// Configuration
const PROJECT_ID = 'xennuhfmnucybtyzfgcl';
const SUPABASE_URL = `https://${PROJECT_ID}.supabase.co`;
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhlbm51aGZtbnVjeWJ0eXpmZ2NsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA4MzUyMCwiZXhwIjoyMDc2NjU5NTIwfQ.Ur5mzg-ZUGfIO31-buAzORvEZH-93b5uAJPa2Z6YI7Q';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhlbm51aGZtbnVjeWJ0eXpmZ2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwODM1MjAsImV4cCI6MjA3NjY1OTUyMH0.C3Y4zGw8hKjM4Xq8jN2PzX7wR6F5kL9m8P2qS1tW5uE';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Helper function to make HTTPS requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            headers: res.headers,
            data: data ? JSON.parse(data) : null
          };
          resolve(result);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// Test 1: Create a test user and get auth token
async function createTestUser() {
  log('\n🔐 Creating test user...', colors.cyan);

  const testUser = {
    email: `test${Date.now()}@example.com`,
    password: 'testpassword123',
    data: {
      first_name: 'Test',
      last_name: 'User'
    }
  };

  try {
    const response = await makeRequest(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });

    if (response.statusCode === 200) {
      log('✅ Test user created successfully', colors.green);
      return response.data;
    } else {
      log(`❌ Failed to create user: ${response.statusCode}`, colors.red);
      log(`Response: ${JSON.stringify(response.data, null, 2)}`, colors.red);
      return null;
    }
  } catch (error) {
    log(`❌ Error creating user: ${error.message}`, colors.red);
    return null;
  }
}

// Test 2: Sign in to get access token
async function signInUser(email, password) {
  log('\n🔑 Signing in user...', colors.cyan);

  try {
    const response = await makeRequest(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (response.statusCode === 200) {
      log('✅ User signed in successfully', colors.green);
      return response.data.access_token;
    } else {
      log(`❌ Failed to sign in: ${response.statusCode}`, colors.red);
      log(`Response: ${JSON.stringify(response.data, null, 2)}`, colors.red);
      return null;
    }
  } catch (error) {
    log(`❌ Error signing in: ${error.message}`, colors.red);
    return null;
  }
}

// Test 3: Test thread GET endpoint
async function testThreadGetEndpoint(accessToken) {
  log('\n🧵 Testing thread GET endpoint...', colors.cyan);

  const endpoint = `${SUPABASE_URL}/functions/v1/api/threads`;

  try {
    const response = await makeRequest(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    log(`\n📊 Response Status: ${response.statusCode}`, colors.blue);

    if (response.statusCode === 200) {
      log('✅ Thread GET endpoint working!', colors.green);
      log('\n📋 Response Data:', colors.bright);
      console.log(JSON.stringify(response.data, null, 2));
      return true;
    } else {
      log(`❌ Request failed with status ${response.statusCode}`, colors.red);
      log('\n📋 Response Data:', colors.bright);
      console.log(JSON.stringify(response.data, null, 2));
      return false;
    }
  } catch (error) {
    log(`❌ Error testing endpoint: ${error.message}`, colors.red);
    return false;
  }
}

// Test 4: Test thread creation
async function testThreadCreation(accessToken) {
  log('\n📝 Testing thread creation...', colors.cyan);

  const threadData = {
    title: 'Test Thread for Realtime',
    content: 'This is a test thread to verify realtime functionality'
  };

  try {
    const response = await makeRequest(`${SUPABASE_URL}/functions/v1/api/threads`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(threadData)
    });

    log(`\n📊 Response Status: ${response.statusCode}`, colors.blue);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      log('✅ Thread creation successful!', colors.green);
      log('\n📋 Response Data:', colors.bright);
      console.log(JSON.stringify(response.data, null, 2));
      return response.data;
    } else {
      log(`❌ Thread creation failed with status ${response.statusCode}`, colors.red);
      log('\n📋 Response Data:', colors.bright);
      console.log(JSON.stringify(response.data, null, 2));
      return null;
    }
  } catch (error) {
    log(`❌ Error creating thread: ${error.message}`, colors.red);
    return null;
  }
}

// Main test function
async function runTests() {
  log('🚀 Starting Thread Endpoint Tests', colors.bright + colors.magenta);
  log('=====================================', colors.magenta);

  try {
    // Step 1: Create test user
    const userData = await createTestUser();
    if (!userData) {
      log('\n❌ Cannot proceed without test user', colors.red);
      process.exit(1);
    }

    // Step 2: Sign in to get access token
    const accessToken = await signInUser(userData.user.email, 'testpassword123');
    if (!accessToken) {
      log('\n❌ Cannot proceed without access token', colors.red);
      process.exit(1);
    }

    // Step 3: Test GET threads
    await testThreadGetEndpoint(accessToken);

    // Step 4: Test POST thread creation
    await testThreadCreation(accessToken);

    // Step 5: Test GET threads again to see created thread
    await testThreadGetEndpoint(accessToken);

    log('\n🎉 All tests completed!', colors.bright + colors.green);
    log('\n💡 Tips:', colors.yellow);
    log('• If endpoints work, your edge function is ready for realtime testing', colors.yellow);
    log('• Use the Supabase dashboard to monitor realtime subscriptions', colors.yellow);
    log('• Check browser console for realtime connection logs', colors.yellow);

  } catch (error) {
    log(`\n💥 Test suite failed: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  runTests();
}

module.exports = { runTests, testThreadGetEndpoint, testThreadCreation };