/**
 * API Test: POST /threads
 * Contract from plan.md line 237
 */

const SUPABASE_URL = 'https://xennuhfmnucybtyzfgcl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhlbm51aGZtbnVjeWJ0eXpmZ2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwODM1MjAsImV4cCI6MjA3NjY1OTUyMH0.UEJjyE_i8zlXrjAahejTy8s_3USLqiuivSHYVyzxCr4';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1`;

// Test user credentials
const TEST_USER = {
  email: 'test@centrid.local',
  password: 'TestPassword123!'
};

class APITester {
  constructor() {
    this.accessToken = null;
    this.userId = null;
    this.results = {
      testId: 'API-POST-threads',
      status: 'FAIL',
      duration: 0,
      scenarios: [],
      errors: []
    };
  }

  async authenticate() {
    try {
      // Login to get JWT token
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
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

      if (!res.ok) {
        throw new Error(`Auth failed: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      this.accessToken = data.access_token;
      this.userId = data.user.id;
      console.log('✅ Authenticated as:', TEST_USER.email);
      console.log('   User ID:', this.userId);
      return true;
    } catch (error) {
      console.error('❌ Authentication failed:', error.message);
      this.results.errors.push(`Auth setup failed: ${error.message}`);
      return false;
    }
  }

  async runScenario(name, testFn) {
    const scenario = {
      name,
      status: 'FAIL',
      expected: '',
      actual: '',
      error: null
    };

    try {
      console.log(`\n🧪 Scenario: ${name}`);
      await testFn(scenario);
      scenario.status = 'PASS';
      console.log(`   ✅ PASS`);
    } catch (error) {
      scenario.status = 'FAIL';
      scenario.error = error.message;
      console.log(`   ❌ FAIL: ${error.message}`);
      this.results.errors.push(`${name}: ${error.message}`);
    }

    this.results.scenarios.push(scenario);
  }

  async scenario1_HappyPath(scenario) {
    scenario.expected = '201';

    const res = await fetch(`${FUNCTION_URL}/create-thread`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        title: 'Test Thread ' + Date.now()
      })
    });

    scenario.actual = String(res.status);

    if (res.status !== 201) {
      const body = await res.text();
      throw new Error(`Expected 201, got ${res.status}. Body: ${body}`);
    }

    const data = await res.json();

    if (!data.data) {
      throw new Error('Response missing data field');
    }

    if (!data.data.threadId) {
      throw new Error('Response missing threadId');
    }

    if (!data.data.title) {
      throw new Error('Response missing title');
    }

    console.log('   Thread created:', data.data.threadId);
    this.createdThreadId = data.data.threadId; // Save for branch test
  }

  async scenario2_AuthError(scenario) {
    scenario.expected = '401';

    const res = await fetch(`${FUNCTION_URL}/create-thread`, {
      method: 'POST',
      headers: {
        // No Authorization header
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        title: 'Test Thread'
      })
    });

    scenario.actual = String(res.status);

    if (res.status !== 401) {
      const body = await res.text();
      throw new Error(`Expected 401, got ${res.status}. Body: ${body}`);
    }
  }

  async scenario3_ValidationError(scenario) {
    scenario.expected = '400';

    const res = await fetch(`${FUNCTION_URL}/create-thread`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        title: '' // Empty title
      })
    });

    scenario.actual = String(res.status);

    if (res.status !== 400) {
      const body = await res.text();
      throw new Error(`Expected 400, got ${res.status}. Body: ${body}`);
    }
  }

  async scenario4_BranchCreation(scenario) {
    scenario.expected = '201';

    // First create a parent thread
    const parentRes = await fetch(`${FUNCTION_URL}/create-thread`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        title: 'Parent Thread ' + Date.now()
      })
    });

    if (parentRes.status !== 201) {
      throw new Error(`Failed to create parent thread: ${parentRes.status}`);
    }

    const parentData = await parentRes.json();
    const parentId = parentData.data.threadId;
    console.log('   Parent thread:', parentId);

    // Now create a child branch
    const res = await fetch(`${FUNCTION_URL}/create-thread`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        title: 'Child Branch ' + Date.now(),
        parentId: parentId
      })
    });

    scenario.actual = String(res.status);

    if (res.status !== 201) {
      const body = await res.text();
      throw new Error(`Expected 201, got ${res.status}. Body: ${body}`);
    }

    const data = await res.json();

    if (!data.data.parentId || data.data.parentId !== parentId) {
      throw new Error(`Parent relationship not preserved. Expected: ${parentId}, Got: ${data.data.parentId}`);
    }

    console.log('   Branch created:', data.data.threadId);
    console.log('   Parent linked:', data.data.parentId);
  }

  async run() {
    const startTime = Date.now();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('API Test: POST /threads');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Step 1: Authenticate
    const authSuccess = await this.authenticate();
    if (!authSuccess) {
      this.results.status = 'FAIL';
      this.results.duration = Date.now() - startTime;
      return this.results;
    }

    // Step 2: Run test scenarios
    await this.runScenario('happy-path', (s) => this.scenario1_HappyPath(s));
    await this.runScenario('auth-error', (s) => this.scenario2_AuthError(s));
    await this.runScenario('validation-error', (s) => this.scenario3_ValidationError(s));
    await this.runScenario('branch-creation', (s) => this.scenario4_BranchCreation(s));

    // Step 3: Calculate overall status
    const passCount = this.results.scenarios.filter(s => s.status === 'PASS').length;
    const totalCount = this.results.scenarios.length;

    if (passCount === totalCount) {
      this.results.status = 'PASS';
    } else if (passCount > 0) {
      this.results.status = 'PARTIAL';
    } else {
      this.results.status = 'FAIL';
    }

    this.results.duration = Date.now() - startTime;

    // Step 4: Print summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Test Summary');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Status: ${this.results.status}`);
    console.log(`Passed: ${passCount}/${totalCount}`);
    console.log(`Duration: ${this.results.duration}ms`);

    if (this.results.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.results.errors.forEach(err => console.log(`   - ${err}`));
    }

    console.log('\n');

    return this.results;
  }
}

// Run tests
const tester = new APITester();
tester.run()
  .then(results => {
    console.log(JSON.stringify(results, null, 2));
    process.exit(results.status === 'PASS' ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
