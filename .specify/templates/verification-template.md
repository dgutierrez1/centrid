# UI Verification Report: [FEATURE NAME]

**Feature**: `[###-feature-name]`
**Verification Date**: [DATE]
**Status**: PASS ✅ | PARTIAL ⚠️ | FAIL ❌

**Input**: Feature specification from `spec.md`, design specification from `design.md`

**Note**: This template is filled by the `/speckit.verify-ui` command. See `.claude/commands/speckit.verify-ui.md` for execution workflow.

---

## Summary

**Overall Status**: [PASS ✅ | PARTIAL ⚠️ | FAIL ❌]

**Flows**:
- Total flows tested: [N]
- Flows passed: [N] ✅
- Flows failed: [N] ❌
- Flows skipped: [N] (if --flow flag used)

**Acceptance Criteria** (from spec.md):
- Total criteria: [N]
- Criteria met: [N] ✅
- Criteria failed: [N] ❌
- Coverage: [N]% ([N]/[N] criteria verified)

**Issues**:
- Critical: [N] 🔴 (must fix)
- Major: [N] 🟡 (should fix)
- Minor: [N] 🔵 (nice to fix)

**Visual Comparison**:
- Design fidelity: [Excellent | Good | Fair | Poor]
- Significant differences: [N]

---

## Flow Results

<!--
  For each flow tested, document:
  - Flow details (name, priority, maps to)
  - Execution results (steps passed/failed)
  - Success criteria validation
  - Error scenarios tested
  - Screenshots captured
-->

### Flow 1: [Flow Name]

**Priority**: [P1/P2/P3]
**Maps to**: [User Story/SC ID from spec.md]
**Goal**: [What user accomplishes]
**Starting Route**: `/[route]`
**Status**: PASS ✅ | FAIL ❌

#### Steps Executed

**Step 1**: [Action description]
- **Component**: `ComponentName` from `ScreenX.tsx`
- **Selector**: `[data-testid="element-id"]`
- **Expected**: [Expected behavior]
- **Result**: ✅ SUCCESS | ❌ FAILED
- **Actual**: [What actually happened]
- **Screenshot**: `flow-1-step-1.png`

**Step 2**: [Action description]
- **Component**: `ComponentName`
- **Selector**: `[data-testid="element-id"]`
- **Expected**: [Expected behavior]
- **Result**: ✅ SUCCESS | ❌ FAILED
- **Actual**: [What happened]
- **Screenshot**: `flow-1-step-2.png`

[Continue for all steps...]

#### Success Criteria (from spec.md [SC-ID])

- ✅ [Criterion 1]: [Description] - **PASS**
  - Expected: [Expectation]
  - Actual: [Observed result]
  - Evidence: `flow-1-success.png`

- ✅ [Criterion 2]: [Description] - **PASS**
  - Expected: [Expectation]
  - Actual: [Observed result]

- ❌ [Criterion 3]: [Description] - **FAIL**
  - Expected: [Expectation]
  - Actual: [What went wrong]
  - Issue: [Description of issue]
  - Screenshot: `flow-1-failure.png`

**Success Criteria Met**: [N]/[N] ([N]%)

#### Error Scenarios Tested

**Error 1: [Error Type]** (e.g., Invalid file type)
- **Test Data**: [Invalid input used]
- **Expected Error**: "[Expected error message]"
- **Result**: ✅ Correct error shown | ❌ Wrong/missing error
- **Actual**: "[Actual error message shown]"
- **Screenshot**: `flow-1-error-invalid-type.png`

**Error 2: [Error Type]** (e.g., Network failure)
- **Test Data**: [Trigger condition]
- **Expected Error**: "[Expected error message]"
- **Result**: ✅ PASS | ❌ FAIL
- **Actual**: [What happened]
- **Screenshot**: `flow-1-error-network.png`

#### Issues Found

[If any issues found in this flow:]

**Issue 1** 🔴 CRITICAL
- **Description**: [What's wrong]
- **Expected**: [What should happen]
- **Actual**: [What actually happened]
- **Location**: Step [N], Component `[ComponentName]`
- **Error**: [Error message if any]
- **Screenshot**: `flow-1-issue-1.png`

**Issue 2** 🟡 MAJOR
- **Description**: [What's wrong]
- **Severity**: Major
- **Impact**: [How it affects user experience]

---

### Flow 2: [Flow Name]

**Priority**: [P1/P2/P3]
**Maps to**: [SC ID]
**Goal**: [User goal]
**Starting Route**: `/[route]`
**Status**: PASS ✅ | FAIL ❌

[Same structure as Flow 1...]

---

[Repeat for all flows tested]

---

## Visual Comparison

<!--
  Compare implementation screenshots to design screenshots
  Note differences in layout, colors, spacing, typography
-->

### Overall Design Fidelity

**Status**: [Excellent | Good | Fair | Poor]

**Summary**: [Brief assessment of how closely implementation matches design]

### Screen Comparisons

#### Comparison 1: [Screen Name] - [State]

**Design Screenshot**: `apps/design-system/public/screenshots/[feature]/01-screen-1-desktop.png`
**Implementation Screenshot**: `specs/[feature]/verification/flow-1-step-2.png`
**Similarity**: [Excellent | Good | Fair | Poor]

**Differences Noted**:
- ✅ Layout matches design perfectly
- ⚠️ **Color**: Button primary color Design `#ff4d4d` → Actual `#ff5555` (slightly lighter)
- ⚠️ **Spacing**: Gap between sections Design `24px` → Actual `32px` (larger)
- ✅ Typography matches design
- ✅ Component structure matches

**Severity**: Minor 🔵 - Visual differences don't affect functionality

**Recommendation**: [Optional/Should fix/Must fix]

---

#### Comparison 2: [Screen Name] - [State]

**Design Screenshot**: `[path]`
**Implementation Screenshot**: `[path]`
**Similarity**: [Rating]

**Differences Noted**:
- [List differences]

**Severity**: [Critical/Major/Minor]

---

[Repeat for key screen comparisons]

---

## Issues Summary

<!--
  Consolidated list of all issues found across all flows
  Categorized by severity: Critical → Major → Minor
-->

### Critical Issues 🔴 (Must Fix)

[If no critical issues: "None found ✅"]

**Issue 1**: [Issue title]
- **Flow**: Flow [N] - [Flow Name]
- **Description**: [What's wrong]
- **Expected**: [What should happen]
- **Actual**: [What's happening]
- **Location**: [Component/Route]
- **Error**: [Error message]
- **Screenshot**: `[filename]`
- **Impact**: Blocks core functionality, prevents feature completion

---

**Issue 2**: [Issue title]
- **Flow**: Flow [N]
- **Description**: [Description]
- [Same structure...]

---

### Major Issues 🟡 (Should Fix)

[If no major issues: "None found ✅"]

**Issue 1**: [Issue title]
- **Flow**: Flow [N]
- **Description**: [What's wrong]
- **Impact**: Degrades user experience but doesn't block functionality
- **Screenshot**: `[filename]`

---

### Minor Issues 🔵 (Nice to Fix)

[If no minor issues: "None found ✅"]

**Issue 1**: [Issue title]
- **Flow**: Flow [N]
- **Description**: [What's wrong]
- **Impact**: Cosmetic issue, minimal UX impact
- **Screenshot**: `[filename]`

---

## Acceptance Criteria Coverage

<!--
  Map all acceptance criteria from spec.md to verification results
  Show which flows tested which criteria
-->

| Criterion ID | Description | Tested In | Result | Notes |
|-------------|-------------|-----------|--------|-------|
| SC-001 | [Criterion description] | Flow 1 | ✅ PASS | [Optional notes] |
| SC-002 | [Criterion description] | Flow 2 | ❌ FAIL | [Issue description] |
| SC-003 | [Criterion description] | Flow 1, 3 | ✅ PASS | [Notes] |
| SC-004 | [Criterion description] | Flow 2 | ⚠️ PARTIAL | [What passed, what failed] |

**Coverage Summary**:
- Total acceptance criteria: [N]
- Criteria tested: [N] ([N]%)
- Criteria passed: [N] ([N]%)
- Criteria failed: [N]
- Criteria not tested: [N] (if any - list them)

---

## User Story Coverage

<!--
  Map user stories from spec.md to verification results
-->

| User Story | Priority | Flows Tested | Status | Acceptance Rate |
|-----------|----------|--------------|--------|-----------------|
| User Story 1: [Title] | P1 | Flow 1, 2 | ✅ PASS | 100% (3/3) |
| User Story 2: [Title] | P2 | Flow 3 | ❌ FAIL | 50% (1/2) |
| User Story 3: [Title] | P3 | Flow 4 | ✅ PASS | 100% (2/2) |

**Story Coverage**:
- P1 stories: [N]/[N] passed ([N]%)
- P2 stories: [N]/[N] passed ([N]%)
- P3 stories: [N]/[N] passed ([N]%)

---

## Test Evidence

<!--
  Index of all screenshots and artifacts generated during verification
-->

### Flow Screenshots

**Flow 1: [Flow Name]**
- Starting state: `verification/flow-1-start.png`
- Step 1: `verification/flow-1-step-1.png`
- Step 2: `verification/flow-1-step-2.png`
- Success state: `verification/flow-1-success.png`
- Error states: `verification/flow-1-error-*.png`

**Flow 2: [Flow Name]**
- [Same structure...]

### Error Screenshots

- Invalid file type: `verification/flow-1-error-invalid-type.png`
- Network error: `verification/flow-2-error-network.png`
- [List all error screenshots...]

### Issue Screenshots

- Issue 1: `verification/flow-1-issue-1.png`
- Issue 2: `verification/flow-2-issue-1.png`
- [List all issue screenshots...]

---

## Next Steps

**If Status = PASS ✅**:

All acceptance criteria met and all flows working as expected. Feature verification complete.

**Next Action**:
```bash
/speckit.analyze [###-feature-name]
```

This will perform cross-artifact consistency analysis before marking feature complete.

---

**If Status = PARTIAL ⚠️**:

Some flows passed but issues were found that should be addressed.

**Required Actions**:
1. Review major issues and determine if they should be fixed before release
2. Address critical issues if any
3. Re-run verification after fixes:
   ```bash
   /speckit.verify-ui [###-feature-name]
   ```

---

**If Status = FAIL ❌**:

Critical issues found that prevent feature completion.

**Required Actions**:
1. **Fix critical issues** (listed above in Issues Summary):
   - [Issue 1]: [Brief action needed]
   - [Issue 2]: [Brief action needed]

2. **Address major issues** (recommended):
   - [Issue 1]: [Action needed]

3. **Re-run verification** after fixes:
   ```bash
   /speckit.verify-ui [###-feature-name]
   ```

4. **Do NOT proceed** to `/speckit.analyze` until verification passes

---

## Verification Metadata

**Verification Command**: `/speckit.verify-ui [###-feature-name] [flags]`
**Flags Used**: [--flow=N] [--skip-screenshots] or [none]
**Execution Time**: [Duration]
**Playwright Version**: [Version if relevant]
**Browser**: [Browser type and version]
**Viewport**: Desktop (1440×900), Mobile (375×812)

**Test Data Location**: `specs/[###-feature-name]/verification/`
**Screenshots**: [N] screenshots captured
**Flows Executed**: [N]/[Total] flows

---

**Verification Complete**: [DATE]
**Verified By**: Claude Code `/speckit.verify-ui`
