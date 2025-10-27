---
description: Verify UI implementation against acceptance criteria using automated testing
---

## User Input

```text
$ARGUMENTS
```

**Arguments**:
- `[feature-name]` - Feature to verify (e.g., "003-filesystem-markdown-editor" or just "003")
- `--flow=[N]` - (Optional) Test specific flow only (e.g., `--flow=1`)
- `--skip-screenshots` - (Optional) Skip visual comparison to design screenshots

**Examples**:
```bash
/speckit.verify-ui 003-filesystem-markdown-editor
/speckit.verify-ui 003
/speckit.verify-ui 003 --flow=1
/speckit.verify-ui 003 --skip-screenshots
```

---

## Outline

1. Parse arguments and locate feature
2. Load verification context (spec.md, design.md, tasks.md)
3. Setup authentication (if required)
4. Start application and verify accessibility
5. Execute user flows with Playwright MCP
6. Compare screenshots (implementation vs design) - optional
7. Generate verification report
8. Validation gate
9. Report summary and next steps

---

## Workflow

### 1. Parse Arguments & Locate Feature

**Parse input**:
```bash
FEATURE_ARG="$ARGUMENTS"
# Extract feature name (handle --flags)
# Examples: "003-filesystem-markdown-editor", "003", etc.
```

**Run prerequisites script**:
```bash
cd /Users/daniel/Projects/misc/centrid
.specify/scripts/bash/check-prerequisites.sh "$FEATURE_ARG" --json
```

**Parse JSON output**:
- `FEATURE_DIR` - Absolute path to feature directory
- `FEATURE_NAME` - Feature identifier (e.g., "003-filesystem-markdown-editor")
- `AVAILABLE_DOCS` - List of existing documents

**Validate prerequisites exist**:
- ✅ `spec.md` exists (has acceptance criteria and user stories)
- ✅ `design.md` exists (has testable user flows with Playwright selectors)
- ✅ `tasks.md` exists (implementation tasks)

**Verify implementation complete**:
- Read `tasks.md` and check status field
- **If status != "completed"**: WARN user but continue (allow testing partial implementations)

**Parse optional flags**:
- `--flow=[N]`: Extract flow number to test only that flow
- `--skip-screenshots`: Set flag to skip visual comparison

### 2. Load Verification Context

**From spec.md**:
- Parse **User Stories** (with P1/P2/P3 priorities)
- Parse **Acceptance Scenarios** (Given/When/Then format)
- Parse **Success Criteria** (SC-001, SC-002, etc.)
- Parse **Edge Cases** (for error scenario testing)

**From design.md**:
- Parse **User Flows section** (detailed testable flows)
  - For each flow, extract:
    - Flow name and ID
    - Maps to (acceptance criterion ID)
    - Goal and priority
    - Starting route
    - Steps (with actions, components, selectors, Playwright commands)
    - Success criteria
    - Error scenarios
    - Test data
- Parse **Screen-to-Component Mapping table**
- Parse **Production Routes** for each screen

**From tasks.md**:
- Verify implementation status
- Extract implemented routes (for validation)

**Build verification matrix**:
```
Flows to test: [N] flows (or [1] if --flow flag used)
Routes to verify: [list of routes from design.md]
Acceptance criteria: [list of SC IDs from spec.md]
```

**VALIDATION CHECKPOINT**:
- User Flows section exists in design.md?
- Flows have Playwright selectors defined?
- Flows map to acceptance criteria from spec.md?

**If validation fails**: ERROR - design.md missing testable flows. Run `/speckit.design` first to create flows.

### 3. Execute Test Prerequisites

**Check for prerequisites in design.md**:
- Look for "Test Prerequisites" or "Verification Prerequisites" section
- If section exists with steps, execute each step in order
- Common prerequisites: authentication, test data setup, feature flags, API mocking

**If prerequisites fail**: ERROR and STOP - document the failure and required manual steps

**Example prerequisites** (from design.md):
```markdown
## Test Prerequisites
1. Ensure test user exists: test@centrid.local / TestPassword123!
2. Login at /auth/login and verify authentication
3. Navigate to /workspace
```

### 4. Start Application

**Check if dev server running on port 3000**:
```bash
lsof -i :3000 | grep LISTEN
```

**If not running**, start web dev server:
```bash
npm run web:dev &
# Wait for server ready (check for "ready" in output)
```

**Verify app accessible**:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# Should return 200
```

**If server fails to start**: ERROR and STOP - cannot verify without running application

### 5. Execute User Flows

**Determine flows to test**:
- If `--flow=[N]` flag: Test only Flow N
- Otherwise: Test all flows in priority order (P1 → P2 → P3)

**Parallel (preferred)**: Use `playwright-contexts` with sub-agents per flow:
```
For each flow, spawn sub-agent:
  browser_create_context(contextId: "flow-{N}-{viewport}", viewport: ...)
  → navigate → execute steps → verify → screenshot → close
```

**Main agent must**:
- Spawn sub-agents for all flows (parallel execution)
- Wait for ALL to complete
- Collect results from each
- Report FAILED if any flow failed

**Sequential (fallback)**: Use standard `playwright`:
```
For each flow:
  resize → navigate → execute steps → verify → screenshot
```

**For each flow (executed by sub-agent or main agent)**:

#### 5.1. Setup Flow Execution

**Load flow details**:
- Flow ID, name, goal
- Starting route
- Steps with selectors
- Success criteria
- Error scenarios
- Test data

**Navigate to starting route**:
```javascript
mcp__playwright__browser_navigate({
  url: `http://localhost:3000${flow.starting_route}`
})
```

**Wait for page load**:
```javascript
mcp__playwright__browser_wait_for({ time: 2 })
```

**Take initial screenshot** (saved to verification directory):
```javascript
mcp__playwright__browser_take_screenshot({
  filename: `specs/${FEATURE_NAME}/verification/flow-${flow.id}-start.png`
})
```

**Report to user**:
```
Testing Flow ${flow.id}: ${flow.name}
Maps to: ${flow.maps_to}
Priority: ${flow.priority}
Starting route: ${flow.starting_route}
```

#### 5.2. Execute Flow Steps

**For each step in flow.steps**:

**Parse step details**:
- Action type (click, type, fill, upload, select, hover, etc.)
- Component name
- Selector (data-testid or class)
- Expected behavior
- Playwright command

**Execute action based on type**:

```javascript
// Click action
if (step.action.toLowerCase().includes("click")) {
  mcp__playwright__browser_click({
    element: step.component,
    ref: step.selector
  })
}

// Type/Fill action
if (step.action.toLowerCase().includes("type") ||
    step.action.toLowerCase().includes("fill")) {
  mcp__playwright__browser_type({
    element: step.component,
    ref: step.selector,
    text: step.test_data || "test value"
  })
}

// Upload action
if (step.action.toLowerCase().includes("upload")) {
  mcp__playwright__browser_file_upload({
    paths: [step.test_file_path]
  })
}

// Select dropdown
if (step.action.toLowerCase().includes("select")) {
  mcp__playwright__browser_select_option({
    element: step.component,
    ref: step.selector,
    values: [step.option_value]
  })
}

// Hover action
if (step.action.toLowerCase().includes("hover")) {
  mcp__playwright__browser_hover({
    element: step.component,
    ref: step.selector
  })
}
```

**Wait for expected behavior** (if specified):
- If step defines expected text to appear:
  ```javascript
  mcp__playwright__browser_wait_for({
    text: step.expected_text,
    time: 5 // max 5 seconds
  })
  ```
- Otherwise wait 1 second for UI to update:
  ```javascript
  mcp__playwright__browser_wait_for({ time: 1 })
  ```

**Take screenshot after step**:
```javascript
mcp__playwright__browser_take_screenshot({
  filename: `specs/${FEATURE_NAME}/verification/flow-${flow.id}-step-${step.number}.png`
})
```

**Record step result**:
```
✅ Step ${step.number}: ${step.action} - SUCCESS
   Component: ${step.component}
   Expected: ${step.expected_behavior}
   [Screenshot: flow-${flow.id}-step-${step.number}.png]
```

**If step fails** (element not found, timeout, etc.):
```
❌ Step ${step.number}: ${step.action} - FAILED
   Component: ${step.component}
   Selector: ${step.selector}
   Error: [error message from Playwright]
   [Screenshot: flow-${flow.id}-step-${step.number}-error.png]
```

**Handle step failure**:
- Record failure in flow results
- Take error screenshot
- SKIP remaining steps in this flow
- Continue to next flow (don't stop entire verification)

#### 5.3. Validate Success Criteria

**After all steps complete successfully**:

**For each success criterion in flow.success_criteria**:

```javascript
// Take snapshot of current page state
const snapshot = mcp__playwright__browser_snapshot()

// Check for expected elements/text
// Example: "File appears in sidebar within 5 seconds"
// - Look for file name in snapshot
// - Verify element exists

// Example: "Success message displayed"
// - Look for success message text in snapshot
```

**Record criterion validation**:
```
Success Criterion: ${criterion.description}
Expected: ${criterion.expected_outcome}
Actual: ${observed_outcome}
Status: ✅ PASS | ❌ FAIL
```

**Calculate overall flow status**:
- All steps passed AND all criteria met = PASS ✅
- Any step failed OR any criterion unmet = FAIL ❌

**Take final success screenshot**:
```javascript
mcp__playwright__browser_take_screenshot({
  filename: `specs/${FEATURE_NAME}/verification/flow-${flow.id}-success.png`
})
```

#### 5.4. Test Error Scenarios (Optional)

**For each error scenario in flow.error_scenarios**:

**Reset to starting state**:
```javascript
mcp__playwright__browser_navigate({
  url: `http://localhost:3000${flow.starting_route}`
})
mcp__playwright__browser_wait_for({ time: 2 })
```

**Trigger error** using invalid test data:
```javascript
// Example: Upload invalid file type
mcp__playwright__browser_file_upload({
  paths: [error_scenario.invalid_test_file]
})
```

**Wait for error message**:
```javascript
mcp__playwright__browser_wait_for({
  text: error_scenario.expected_error_message,
  time: 5
})
```

**Verify error state**:
```javascript
const snapshot = mcp__playwright__browser_snapshot()
// Verify error message appears in snapshot
// Verify error UI state (red text, error icon, etc.)
```

**Take error screenshot**:
```javascript
mcp__playwright__browser_take_screenshot({
  filename: `specs/${FEATURE_NAME}/verification/flow-${flow.id}-error-${error_scenario.type}.png`
})
```

**Record error scenario result**:
```
Error Scenario: ${error_scenario.type}
Expected Error: "${error_scenario.expected_message}"
Status: ✅ Correct error shown | ❌ Wrong/missing error
[Screenshot: flow-${flow.id}-error-${type}.png]
```

### 6. Visual Comparison (if not --skip-screenshots)

**For each flow with design screenshots**:

**Compare implementation screenshots to design screenshots**:

```
Design screenshot: apps/design-system/public/screenshots/${FEATURE_NAME}/...
Implementation screenshot: specs/${FEATURE_NAME}/verification/flow-${flow.id}-...
```

**Manual visual comparison** (automated pixel diff deferred to post-MVP):
- Load both screenshots
- Note differences in:
  - Layout (positioning, spacing)
  - Colors (exact vs similar)
  - Typography (sizes, weights)
  - Component appearance

**Record visual differences**:
```json
{
  "screen": "Flow ${flow.id} - Step ${step.number}",
  "design_screenshot": "${design_screenshot_path}",
  "implementation_screenshot": "${impl_screenshot_path}",
  "differences": [
    "Button color: Design #ff4d4d → Actual #ff5555 (slightly lighter)",
    "Spacing: Design 24px → Actual 32px (larger gap)"
  ],
  "severity": "minor" | "major" | "critical"
}
```

**Severity guidelines**:
- **Minor**: Visual differences that don't affect usability (slight color variation, minor spacing)
- **Major**: Noticeable differences that may affect UX (wrong layout, missing states)
- **Critical**: Broken UI, missing components, unusable interface

### 7. Generate Verification Report

**Use template**: `.specify/templates/verification-template.md`

**Create**: `specs/${FEATURE_NAME}/verification.md`

**Fill template sections**:

1. **Summary**: Overall status, counts (flows passed/failed, criteria met/failed)

2. **Flow Results**: For each flow tested:
   - Flow name, priority, maps to
   - Status (PASS/FAIL)
   - Steps executed (with results)
   - Success criteria validation
   - Error scenarios tested
   - Screenshots

3. **Visual Comparison**: Design vs implementation differences (if not skipped)

4. **Issues Summary**:
   - Critical issues (must fix before feature complete)
   - Major issues (should fix)
   - Minor issues (nice to fix)

5. **Acceptance Criteria Coverage**:
   - Table mapping SC IDs to flow results
   - Coverage percentage

6. **Next Steps**:
   - If PASS: Proceed to `/speckit.analyze`
   - If FAIL: Fix issues and re-run verification

**Save report**: `specs/${FEATURE_NAME}/verification.md`

### 8. Validation Gate

**Determine overall verification status**:

**PASS ✅** if:
- All flows executed successfully
- All success criteria met
- No critical issues found
- Only minor visual differences (if any)

**PARTIAL ⚠️** if:
- Most flows passed
- Some major issues but no critical issues
- Significant visual differences

**FAIL ❌** if:
- Any flow failed completely
- Critical issues found (API errors, broken functionality, missing features)
- Any acceptance criterion unmet

**Report status to user**:

```
╔════════════════════════════════════════════════════╗
║  VERIFICATION RESULT: ${STATUS}                    ║
╚════════════════════════════════════════════════════╝

Flows Tested: ${total_flows}
Flows Passed: ${passed_flows} ✅
Flows Failed: ${failed_flows} ❌

Acceptance Criteria: ${total_criteria}
Criteria Met: ${met_criteria} ✅
Criteria Failed: ${failed_criteria} ❌

Issues Found:
  Critical: ${critical_count}
  Major: ${major_count}
  Minor: ${minor_count}
```

**If FAIL or PARTIAL**:
```
REQUIRED ACTION:
${list_of_critical_and_major_issues}

Fix these issues and re-run:
/speckit.verify-ui ${FEATURE_NAME}
```

**If PASS**:
```
✅ All acceptance criteria met
✅ All flows working as expected
✅ Ready to proceed

Next Step:
/speckit.analyze ${FEATURE_NAME}
```

### 9. Report Summary

**Deliverables** ✅
- Verification report: `specs/${FEATURE_NAME}/verification.md`
- Flow screenshots: `specs/${FEATURE_NAME}/verification/flow-*.png`
- Test execution log

**Flows Executed** ✅
- Total flows: ${total_flows}
- Passed: ${passed_flows}
- Failed: ${failed_flows}

**Acceptance Validation** ✅
- Criteria coverage: ${met_criteria}/${total_criteria} (${percentage}%)
- Status: ${PASS|PARTIAL|FAIL}

**Issues Identified** ⚠️
- Critical: ${critical_issues}
- Major: ${major_issues}
- Minor: ${minor_issues}

**Next Action**:
- If PASS: Run `/speckit.analyze` for cross-artifact consistency check
- If FAIL: Fix issues, re-run `/speckit.verify-ui ${FEATURE_NAME}`

**Report Location**: `specs/${FEATURE_NAME}/verification.md`

---

## Key Rules

**DO**:
- ✅ Test all flows in priority order (P1 → P2 → P3)
- ✅ Verify ALL acceptance criteria from spec.md
- ✅ Test error scenarios (invalid inputs, edge cases)
- ✅ Screenshot all states (start, steps, success, error)
- ✅ Compare to design screenshots (unless --skip-screenshots)
- ✅ STOP and report if critical issues found
- ✅ Record detailed failure information (selectors, errors, screenshots)

**DON'T**:
- ❌ Skip error scenario testing
- ❌ Continue if critical issues found (mark as FAIL)
- ❌ Guess expected behavior (read from spec.md and design.md)
- ❌ Ignore visual differences from design
- ❌ Mark as PASS if any acceptance criterion fails
- ❌ Test without reviewing testable flows from design.md first
- ❌ Assume selectors - use exact selectors from design.md

**Error Handling**:
- Element not found → Record failure, screenshot, continue to next flow
- Timeout waiting for element → Record failure, continue
- Playwright error → Record error details, screenshot, continue
- Server not running → ERROR and STOP (cannot verify)
- design.md missing flows → ERROR and STOP (run /speckit.design first)

**Success Criteria**:
- Feature verification PASSES only if ALL acceptance criteria met
- Visual differences are noted but don't cause FAIL (unless critical)
- Error scenarios must show correct error messages to PASS
