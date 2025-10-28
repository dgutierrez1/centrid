---
description: Run API and E2E tests to verify implementation matches requirements
---

## User Input

```text
$ARGUMENTS
```

Filter: "api-only", "e2e-only", "AC-001", or empty (run all)

---

## Workflow

### Step 1: Prerequisites

```bash
cd /Users/daniel/Projects/misc/centrid

# Check production app
curl -f http://localhost:3000 || {
  echo "ERROR: Production app not running. Start with: npm run web:dev"
  exit 1
}

# Get feature directory
FEATURE_DIR=$(.specify/scripts/bash/check-prerequisites.sh --json | jq -r '.FEATURE_DIR')
FEATURE_NAME=$(basename "$FEATURE_DIR")
```

---

### Step 2: Extract Test Scenarios

**Load artifacts**:
- spec.md → Acceptance criteria (AC-XXX)
- ux.md → Flow tables, test data, error scenarios
- plan.md → API contracts
- arch.md → Routes

**Parse test matrix**:

**API Tests** (from plan.md "## API Contracts"):
```
For each endpoint:
  - Extract: method, path, auth, request, response, errors
  - Scenarios: happy path + auth error + validation error
  - Test type: API (no browser)
```

**E2E Tests** (from spec.md "## Acceptance Scenarios"):
```
For each AC:
  - Extract: Given/When/Then, priority, user story
  - Find flow: Match AC to ux.md flow (search for AC reference)
  - Extract: Route (arch.md), test data (ux.md), success criteria
  - Scenarios: Desktop (1440×900), Mobile (375×812) if applicable
  - Test type: E2E (browser MCP)
```

**Build complete test scenarios**:
```json
{
  "id": "AC-001-desktop",
  "type": "e2e",
  "priority": "P1",
  "objective": {
    "given": "User is in thread",
    "when": "Click Create Branch, enter name",
    "then": "Branch created with inherited context"
  },
  "route": "/thread/main",
  "viewport": { "width": 1440, "height": 900 },
  "testData": { "branchName": "RAG Deep Dive" },
  "successCriteria": {
    "functional": ["Branch created", "URL changed", "Selector updated"],
    "performance": { "modalOpen": 300, "apiCall": 2000 }
  },
  "apiContract": { "endpoint": "POST /api/threads/:id/branches", ... },
  "errorScenarios": [{ "error": "Empty name", "expected": "Validation error" }]
}
```

---

### Step 3: Spawn Parallel Test Agents

**CRITICAL**: Use Task tool with **multiple invocations in single message** for parallel execution.

**API Test Agents** (one per endpoint):

```markdown
Agent Prompt Template:

You are testing API endpoint: {method} {endpoint}

**Contract** (from plan.md):
- Auth: {required|optional}
- Request: {requestSchema}
- Success: {status} + {responseSchema}
- Errors: {errorCases}

**Scenarios**:
1. Happy path (valid auth + input)
2. Auth error (no token → expect 401)
3. Validation error (invalid input → expect 400)

**Execute**:
```javascript
// Scenario 1: Happy path
const res = await fetch('http://localhost:3000{endpoint}', {
  method: '{method}',
  headers: {
    'Authorization': 'Bearer {testToken}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({testData})
});
// Verify: status, headers, response schema
```

**Return**:
```json
{
  "testId": "API-{method}-{endpoint}",
  "status": "PASS"|"FAIL"|"SKIP",
  "duration": 1200,
  "scenarios": [
    { "name": "happy-path", "status": "PASS", "expected": "201", "actual": "201" },
    { "name": "auth-error", "status": "PASS", "expected": "401", "actual": "401" },
    { "name": "validation-error", "status": "PASS", "expected": "400", "actual": "400" }
  ],
  "errors": []
}
```
```

**E2E Test Agents** (one per AC × viewport):

```markdown
Agent Prompt Template:

You are testing: {AC-ID} - {title} ({viewport})

**Objective**:
- Given: {given}
- When: {when}
- Then: {then}

**Route**: http://localhost:3000{route}
**Test Data**: {testData}
**Viewport**: {width}×{height}

**Success Criteria**:
{successCriteria.functional.map(c => `- ${c}`).join('\n')}

**Performance Targets**:
{Object.entries(successCriteria.performance).map(([k,v]) => `- ${k}: <${v}ms`).join('\n')}

**Execute interactively** (see-think-act loop):

1. **Navigate**:
   ```javascript
   await browser_navigate({ contextId: "{testId}", url: "{route}" });
   ```

2. **See**:
   ```javascript
   snapshot = await browser_snapshot({ contextId: "{testId}" });
   ```

3. **Act** (goal-driven):
   - Goal: {when}
   - Find elements from snapshot (data-testid preferred)
   - Click, type, wait as needed
   - Adapt to actual page state

4. **Verify** (each success criterion):
   ```javascript
   // Check URL, elements, states, performance
   const result = await browser_evaluate({
     contextId: "{testId}",
     function: "() => ({ /* verification logic */ })"
   });
   ```

5. **Screenshot on failure**:
   ```javascript
   await browser_screenshot({
     contextId: "{testId}",
     path: "specs/{feature}/test-failures/{testId}.png"
   });
   ```

**Return**:
```json
{
  "testId": "{testId}",
  "status": "PASS"|"FAIL"|"SKIP",
  "duration": 3800,
  "steps": [
    { "step": 1, "action": "Navigate", "status": "PASS" },
    { "step": 2, "action": "Click Create Branch", "status": "PASS" },
    ...
  ],
  "performance": {
    "modalOpen": { "actual": 180, "target": 300, "status": "PASS" }
  },
  "screenshot": "path/to/failure.png" (if failed),
  "errors": []
}
```

**Be adaptive**:
- Wait for elements (don't fail fast)
- Try fallback selectors: data-testid → aria-label → text content
- Handle timing (animations, API calls)
- Skip if backend not implemented (not a test failure)
```

**Launch all agents** (single Task tool invocation with multiple agents):

```typescript
// Spawn all test agents in parallel
const agents = [
  // API agents
  ...apiTests.map(test => ({
    subagent_type: "general-purpose",
    description: `Test API: ${test.method} ${test.endpoint}`,
    prompt: generateApiAgentPrompt(test)
  })),

  // E2E agents
  ...e2eTests.map(test => ({
    subagent_type: "general-purpose",
    description: `Test ${test.id}`,
    prompt: generateE2EAgentPrompt(test)
  }))
];

// Launch all agents (10-30 agents total)
// Duration: ~5-10 minutes (parallel)
```

---

### Step 4: Aggregate Results

**Collect all agent results**:

```javascript
const results = {
  total: apiResults.length + e2eResults.length,
  apiTests: {
    total: apiResults.length,
    passed: apiResults.filter(r => r.status === "PASS").length,
    failed: apiResults.filter(r => r.status === "FAIL").length,
    skipped: apiResults.filter(r => r.status === "SKIP").length
  },
  e2eTests: {
    total: e2eResults.length,
    passed: e2eResults.filter(r => r.status === "PASS").length,
    failed: e2eResults.filter(r => r.status === "FAIL").length,
    skipped: e2eResults.filter(r => r.status === "SKIP").length
  }
};

results.passRate = Math.round((results.apiTests.passed + results.e2eTests.passed) / results.total * 100);

// Status
results.status = results.passRate >= 90 ? "PASS" :
                 results.passRate >= 70 ? "PARTIAL" : "FAIL";
```

---

### Step 5: Generate Test Report

**Location**: `$FEATURE_DIR/test-report.md`

**Template**:

```markdown
# Test Report: {featureName}

**Date**: {date}
**Duration**: {duration}
**Tested By**: /speckit.test

---

## Summary

**Overall**: {status} ({passed}/{total} passed, {passRate}%)

**API Tests**: {api.passed}/{api.total} ({apiPassRate}%)
**E2E Tests**: {e2e.passed}/{e2e.total} ({e2ePassRate}%)

---

## API Test Results

| Endpoint | Method | Status | Duration | Errors |
|----------|--------|--------|----------|--------|
{apiResults.map(r => `| ${r.endpoint} | ${r.method} | ${r.status} | ${r.duration}ms | ${r.errors.join(', ') || 'None'} |`).join('\n')}

{if failed:}
### Failed API Tests

{failedApiTests.map(r => `
**${r.method} ${r.endpoint}**:
- Expected: ${r.expected}
- Actual: ${r.actual}
- Error: ${r.errors[0]}
- Fix: ${r.suggestedFix}
`).join('\n')}
{endif}

---

## E2E Test Results

| AC | Description | Desktop | Mobile | Status |
|----|-------------|---------|--------|--------|
{e2eResults.map(r => `| ${r.ac} | ${r.title} | ${r.desktop} | ${r.mobile} | ${r.status} |`).join('\n')}

{if failed:}
### Failed E2E Tests

{failedE2ETests.map(r => `
**${r.testId}**:
- Step ${r.failedStep}: ${r.failedAction}
- Expected: ${r.expected}
- Actual: ${r.actual}
- Screenshot: ${r.screenshot}
- Fix: ${r.suggestedFix}
`).join('\n')}
{endif}

---

## Recommendations

{if status === "PASS":}
✅ All tests passed. Ready for production.
{endif}

{if status === "PARTIAL":}
⚠️  Most tests passed. Fix issues before deployment:
{failures.map(f => `- ${f.issue}`).join('\n')}
{endif}

{if status === "FAIL":}
🔴 Critical failures. Not ready for production:
{failures.map(f => `- ${f.issue}`).join('\n')}
{endif}

---

**Next Steps**:
1. Review failed tests (see sections above)
2. Fix issues (suggested fixes provided)
3. Re-run: /speckit.test
4. Deploy when pass rate ≥90%
```

---

### Step 6: Report Summary

Display concise summary to user:

```
✅ Testing Complete: {passed}/{total} passed ({passRate}%)

API Tests: {api.passed}/{api.total} ({apiPassRate}%) {status}
E2E Tests: {e2e.passed}/{e2e.total} ({e2ePassRate}%) {status}

{if failed > 0:}
Issues Found:
{failures.map(f => `- ${f.severity} ${f.testId}: ${f.error}`).join('\n')}
{endif}

Report: specs/{feature}/test-report.md
{if e2eFailures > 0:}Screenshots: specs/{feature}/test-failures/{endif}

Status: {status} {if status !== "PASS": "Fix issues before production"{endif}
```

---

## Key Rules

**Prerequisites**:
- Production app running (localhost:3000)
- spec.md, ux.md, plan.md exist

**Extraction**:
- Systematically parse all sources
- Combine into complete test scenarios
- Include all test details for agents

**Parallel Execution**:
- Launch ALL agents in single Task tool call
- API tests (no browser): ~1-2min
- E2E tests (browser MCP): ~5-10min
- Total: max(api, e2e) = ~5-10min

**Status**:
- PASS: ≥90% (ready for production)
- PARTIAL: 70-89% (fix before deploy)
- FAIL: <70% (not ready)

**Reporting**:
- Single unified report (API + E2E)
- Screenshots for E2E failures
- Suggested fixes for all failures
