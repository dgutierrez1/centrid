---
description: Validate design completeness before task generation using browser MCP verification
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. **Setup**: Run `.specify/scripts/bash/check-prerequisites.sh --json` to get FEATURE_DIR and AVAILABLE_DOCS
2. **Load Context**: Read arch.md, ux.md (UI features), design.md (REQUIRED), check for design-system components
3. **Validation Checks**: Verify all screens/components designed, exports correct, screenshots exist
4. **Browser MCP Verification**: Navigate to design-system app, verify components render correctly
5. **Generate Report**: Create design-validation.md with READY/BLOCKED status
6. **Report Summary**: Show validation results and next steps

## Workflow

### Step 1: Setup & Load Context

**Run prerequisites**:
```bash
cd /Users/daniel/Projects/misc/centrid
.specify/scripts/bash/check-prerequisites.sh --json
```

**Parse JSON output**:
- FEATURE_DIR (absolute path to specs/[feature]/)
- AVAILABLE_DOCS (list of existing artifacts)

**CRITICAL VALIDATION - Prerequisites**:

**Check 1: design.md exists**
```
if "design.md" NOT in AVAILABLE_DOCS:
  ERROR: design.md not found. Run /speckit.design first.
  Cannot verify design without design.md artifact.
  STOP EXECUTION
```

**Check 2: arch.md exists**
```
if "arch.md" NOT in AVAILABLE_DOCS:
  ERROR: arch.md not found. Run /speckit.arch first.
  Need arch.md to verify all screens are designed.
  STOP EXECUTION
```

**Load required context**:
- Read `$FEATURE_DIR/spec.md` (for user stories and acceptance criteria)
- Read `$FEATURE_DIR/arch.md` (for screen inventory - REQUIRED)
- Read `$FEATURE_DIR/ux.md` (for UX flows - OPTIONAL, check if in AVAILABLE_DOCS)
- Read `$FEATURE_DIR/design.md` (for design documentation - REQUIRED)

**Extract feature name**:
- Parse feature directory name (e.g., "004-ai-agent-system" → "ai-agent-system")
- Store as FEATURE_NAME for component path checks

### Step 2: Extract Screen Inventory

**From arch.md, extract all screens**:

Parse `arch.md` section "### Screens & Flows" table:
- Extract screen names from first column
- Extract priorities (P1, P2, P3, etc.) from fourth column
- Extract routes/entry points from fifth column
- Create screen inventory list

**Example extraction**:
```
From arch.md table:
| Screen | Purpose | User Story | Priority | Route/Entry Point |
|--------|---------|------------|----------|-------------------|
| Workspace | Main interface | US-001 | P1 | /workspace |
| Settings | Configuration | US-005 | P2 | /settings |

Extract:
- Workspace (P1, /workspace)
- Settings (P2, /settings)
```

**If ux.md exists, cross-reference screens**:

Parse `ux.md` section "## Screen-by-Screen UX Flows":
- Extract all screen names (from "### [Screen Name]" headers)
- Verify consistency with arch.md screen list
- Flag any screens in ux.md missing from arch.md (inconsistency)
- Flag any screens in arch.md missing from ux.md (incomplete UX)

**If ux.md missing**: Use arch.md screen list only (UI-only feature without detailed UX flows)

### Step 3: Validate Design Coverage

**Check 1: All Screens Designed**

For each screen in arch.md screen inventory:

1. Search design.md for screen name
2. Verify screen has design section with:
   - Layout description or ASCII diagram
   - Component list
   - States documented (default, loading, error, empty)
   - Responsive behavior

**Create coverage matrix**:
```
| Screen      | Priority | In design.md? | Layout? | Components? | States? | Status |
|-------------|----------|---------------|---------|-------------|---------|--------|
| Workspace   | P1       | ✅            | ✅      | ✅          | ✅      | READY  |
| Settings    | P2       | ❌            | -       | -           | -       | MISSING|
```

**Check 2: Component Exports Verified**

From design.md, extract all component names:
- Parse "Screen-to-Component Mapping" section
- Parse component lists in screen sections
- Create list of all unique components

For each component:
1. **Check component file exists**:
   - Look in `packages/ui/src/features/[FEATURE_NAME]/[ComponentName].tsx`
   - If not found, check `packages/ui/src/components/[ComponentName].tsx`

2. **Check export in index.ts**:
   - Read `packages/ui/src/features/index.ts`
   - Verify component is exported: `export * from './[feature-name]/[ComponentName]'`
   - OR read `packages/ui/src/components/index.ts` if common component

**Create export matrix**:
```
| Component       | Location                          | File Exists? | Exported? | Status |
|-----------------|-----------------------------------|--------------|-----------|--------|
| WorkspaceView   | features/ai-agent-system/         | ✅           | ✅        | READY  |
| SettingsPanel   | features/ai-agent-system/         | ✅           | ❌        | BLOCKED|
| Button          | components/                       | ✅           | ✅        | READY  |
```

**Check 3: Screenshots Exist**

From design.md, check for screenshot references:
- Look for screenshot paths (e.g., `/screenshots/[feature-name]/`)
- Verify files exist at `apps/design-system/public/screenshots/[feature-name]/`

Expected screenshots per screen:
- `[screen-name]-desktop-default.png`
- `[screen-name]-mobile-default.png`
- `[screen-name]-desktop-[state].png` (for each state: loading, error, empty)
- `[screen-name]-mobile-[state].png` (for each state)

**Create screenshot matrix**:
```
| Screen      | Desktop Default | Mobile Default | States Screenshots | Status |
|-------------|-----------------|----------------|--------------------|--------|
| Workspace   | ✅              | ✅             | ✅ (3/3)           | READY  |
| Settings    | ✅              | ❌             | ⚠️  (1/3)           | PARTIAL|
```

### Step 4: Browser MCP Verification

**IMPORTANT**: Only proceed if design-system app is running or can be started

**Step 4.1: Check Design System App Availability**

Try to navigate to design system:
```
Use mcp__playwright__browser_navigate to http://localhost:3001
```

**If navigation succeeds**: Continue to Step 4.2
**If navigation fails**: Skip browser verification, add note to report: "Manual browser verification required - design-system app not running"

**Step 4.2: Navigate to Feature Showcase**

Navigate to feature showcase page:
```
http://localhost:3001/[feature-name]
(e.g., http://localhost:3001/ai-agent-system)
```

**If 404**: Add warning to report: "Feature showcase page not found at apps/design-system/pages/[feature-name]/index.tsx"

**Step 4.3: Take Viewport Snapshots**

For mobile viewport (375×812):
```
1. Resize browser: mcp__playwright__browser_resize(width=375, height=812)
2. Capture snapshot: mcp__playwright__browser_snapshot()
3. Verify components render without errors
```

For desktop viewport (1440×900):
```
1. Resize browser: mcp__playwright__browser_resize(width=1440, height=900)
2. Capture snapshot: mcp__playwright__browser_snapshot()
3. Verify components render without errors
```

**Step 4.4: Check Console Errors**

```
Use mcp__playwright__browser_console_messages(onlyErrors=true)
```

**If errors found**: Document in validation report
**If no errors**: Mark browser verification as PASSED

**Step 4.5: Verify Interactive Components**

For each interactive component (buttons, inputs, modals):
1. Use browser snapshot to identify interactive elements
2. Verify hover states (desktop only)
3. Verify click handlers attached
4. Note any missing interactions in report

### Step 5: Generate Validation Report

**Create validation report**: `$FEATURE_DIR/design-validation.md`

**Report Structure**:

```markdown
# Design Validation Report: [Feature Name]

**Date**: [YYYY-MM-DD]
**Feature**: [###-feature-name]
**Validated By**: /speckit.verify-design

---

## Executive Summary

**Status**: READY | BLOCKED | PARTIAL

**Overall Completeness**: [X/Y] screens designed, [X/Y] components exported, [X/Y] screenshots captured

**Blocker Count**: [N] critical issues preventing task generation

**Warning Count**: [N] non-critical issues for review

---

## Screen Coverage Validation

**Source**: arch.md screen inventory

| Screen      | Priority | In design.md? | Layout? | Components? | States? | Status |
|-------------|----------|---------------|---------|-------------|---------|--------|
| [Screen]    | P1       | ✅/❌         | ✅/❌   | ✅/❌       | ✅/❌   | READY/BLOCKED |

**Issues Found**:
- 🔴 BLOCKER: [Screen X] missing from design.md (P1 screen)
- ⚠️  WARNING: [Screen Y] missing error state documentation (P3 screen)

---

## UX Flow Coverage Validation

**Source**: ux.md screen-by-screen flows

**Status**: CONSISTENT | INCONSISTENT | N/A (no ux.md)

**Consistency Checks**:
- [ ] All screens in ux.md are in arch.md
- [ ] All screens in arch.md are in ux.md (or intentionally deferred)
- [ ] All flows in ux.md have corresponding designs in design.md

**Issues Found**:
- 🔴 BLOCKER: [Flow X] in ux.md but no design in design.md
- ⚠️  WARNING: [Screen Y] in arch.md but no UX flow in ux.md (consider if UX detail needed)

---

## Component Export Validation

**Source**: packages/ui/src/features/index.ts and components/index.ts

| Component       | Location              | File Exists? | Exported? | Status |
|-----------------|-----------------------|--------------|-----------|--------|
| [Component]     | features/[feature]/   | ✅/❌        | ✅/❌     | READY/BLOCKED |

**Issues Found**:
- 🔴 BLOCKER: [Component X] not exported from packages/ui/src/features/index.ts
- 🔴 BLOCKER: [Component Y] file missing at expected location

---

## Screenshot Verification

**Source**: apps/design-system/public/screenshots/[feature-name]/

| Screen      | Desktop Default | Mobile Default | States Screenshots | Status |
|-------------|-----------------|----------------|--------------------|--------|
| [Screen]    | ✅/❌           | ✅/❌          | ✅/⚠️/❌           | READY/PARTIAL/MISSING |

**Expected Screenshot Count**: [N] (based on screens × viewports × states)
**Found Screenshot Count**: [N]
**Missing Screenshots**: [N]

**Issues Found**:
- 🔴 BLOCKER: [Screen X] desktop screenshots missing (P1 screen)
- ⚠️  WARNING: [Screen Y] error state screenshots missing (P3 screen)

---

## Browser MCP Verification

**Design System App**: http://localhost:3001/[feature-name]

**Status**: VERIFIED | SKIPPED | FAILED

**Desktop Viewport** (1440×900):
- Snapshot: ✅/❌
- Render Errors: [N] errors found
- Console Errors: [N] console errors

**Mobile Viewport** (375×812):
- Snapshot: ✅/❌
- Render Errors: [N] errors found
- Console Errors: [N] console errors

**Interactive Component Verification**:
- [ ] Buttons have hover states (desktop)
- [ ] Inputs have focus states
- [ ] Modals open/close correctly
- [ ] Forms validate on submit

**Issues Found**:
- 🔴 BLOCKER: Console error "[error message]" on component [X]
- ⚠️  WARNING: Hover state not visible on [Button Y]

**Note**: [If skipped: "Design-system app not running - manual verification required"]

---

## Validation Summary

**READY Criteria** (all must pass):
- [✅/❌] All P1 screens designed with layouts, components, states
- [✅/❌] All components exist and exported from packages/ui
- [✅/❌] All P1 screens have desktop + mobile default screenshots
- [✅/❌] No console errors in browser MCP verification

**PARTIAL Status** (some pass):
- [✅/❌] P2/P3 screens missing designs or screenshots
- [✅/❌] Minor UX flow inconsistencies
- [✅/❌] Non-critical browser warnings

**BLOCKED Status** (critical failures):
- [✅/❌] P1 screens missing from design.md
- [✅/❌] Components not exported or files missing
- [✅/❌] Console errors preventing component render
- [✅/❌] Design-system showcase page missing

---

## Recommendations

**If READY**:
✅ Design validation passed. Proceed to `/speckit.tasks` to generate implementation tasks.

**If PARTIAL**:
⚠️  Design mostly complete with minor issues. Options:
1. Proceed to `/speckit.tasks` and note warnings in tasks.md
2. Fix warnings first by updating design.md or adding screenshots

**If BLOCKED**:
🔴 Critical issues prevent task generation. Required fixes:
1. [Specific fix 1 - e.g., "Design Workspace screen in design.md"]
2. [Specific fix 2 - e.g., "Export WorkspaceView from packages/ui/src/features/index.ts"]
3. [Specific fix 3 - e.g., "Add desktop screenshots for Settings screen"]

After fixes: Re-run `/speckit.verify-design` to validate

---

## Next Steps

**If READY**: Run `/speckit.tasks` to generate implementation tasks
**If PARTIAL**: Review warnings, decide to proceed or fix first
**If BLOCKED**: Fix critical issues listed above, then re-run `/speckit.verify-design`

**Validation Date**: [YYYY-MM-DD HH:MM]
```

### Step 6: Determine Status

**Calculate final status**:

**READY** if ALL of:
- All P1 screens in arch.md are designed in design.md
- All components are exported from packages/ui
- All P1 screens have desktop + mobile default screenshots
- Browser MCP verification passed (or skipped with note)
- No console errors blocking component render

**PARTIAL** if:
- P1 screens complete BUT P2/P3 screens missing designs
- Screenshots missing for non-critical states
- UX flow inconsistencies (non-blocking)
- Minor browser warnings

**BLOCKED** if ANY of:
- P1 screen missing from design.md
- Component file missing or not exported
- Console errors preventing component render
- design.md completely missing

### Step 7: Report Summary

**Success message** (if READY):

```
✅ Design Validation: READY

**Feature**: [###-feature-name]

**Validation Results**:
- Screen Coverage: [X/X] screens designed
- Component Exports: [X/X] components ready
- Screenshots: [X/X] required screenshots exist
- Browser Verification: PASSED

**Created**:
- Design validation report: specs/[feature]/design-validation.md

**Status**: ✅ READY for task generation

**Next Steps**:
1. Run /speckit.tasks to generate implementation tasks
2. Tasks will reference components from packages/ui/src/features/[feature-name]/
3. Tasks will use screen designs from design.md
```

**Warning message** (if PARTIAL):

```
⚠️  Design Validation: PARTIAL

**Feature**: [###-feature-name]

**Validation Results**:
- Screen Coverage: [X/Y] screens designed ([N] P2/P3 missing)
- Component Exports: [X/Y] components ready ([N] issues)
- Screenshots: [X/Y] screenshots exist ([N] missing)
- Browser Verification: PASSED with [N] warnings

**Created**:
- Design validation report: specs/[feature]/design-validation.md

**Status**: ⚠️  PARTIAL - Can proceed with caution

**Warnings**:
- [Warning 1]
- [Warning 2]

**Next Steps**:
1. Review warnings in design-validation.md
2. Option A: Fix warnings by running /speckit.design-iterate
3. Option B: Proceed to /speckit.tasks (note warnings will carry to tasks)
```

**Error message** (if BLOCKED):

```
🔴 Design Validation: BLOCKED

**Feature**: [###-feature-name]

**Validation Results**:
- Screen Coverage: [X/Y] screens designed
- Component Exports: [X/Y] components ready
- Screenshots: [X/Y] screenshots exist
- Browser Verification: FAILED

**Created**:
- Design validation report: specs/[feature]/design-validation.md

**Status**: 🔴 BLOCKED - Cannot proceed to task generation

**Critical Issues**:
1. [Blocker 1 with specific fix]
2. [Blocker 2 with specific fix]
3. [Blocker 3 with specific fix]

**Required Actions**:
1. Fix critical issues listed above
2. Re-run /speckit.verify-design to validate fixes
3. Only proceed to /speckit.tasks when status is READY

**Suggested Commands**:
- /speckit.design-iterate - Update existing designs
- /speckit.design - Regenerate design.md (if major changes needed)
```

**If user provided input ($ARGUMENTS not empty)**:

Address user input:
- If asking about specific screen: Show validation status for that screen
- If asking about specific component: Show export verification for that component
- If requesting re-validation: Re-run all checks and update report
- If requesting skip: Explain why validation gate is critical before tasks

---

## Key Rules

**Prerequisites**:
- design.md MUST exist - ERROR if missing
- arch.md MUST exist - ERROR if missing
- ux.md OPTIONAL - use if exists to cross-reference flows

**Validation Scope**:
- Verify ALL screens from arch.md (not just P1)
- Mark P1 screens as BLOCKERS if missing
- Mark P2/P3 screens as WARNINGS if missing

**Browser MCP**:
- Only run if design-system app available
- Skip gracefully if app not running (manual verification note)
- Document console errors as BLOCKERS
- Document warnings as non-critical

**Status Determination**:
- READY: All critical checks pass, safe to generate tasks
- PARTIAL: P1 complete, P2/P3 issues, can proceed with caution
- BLOCKED: P1 issues, cannot proceed, requires fixes

**Report Format**:
- Use design-validation.md (not validation-report.md - that's for tasks)
- Include specific fix recommendations for each blocker
- Include all validation matrices for audit trail

**No Improvisation**:
- Follow validation criteria exactly
- Don't skip checks to save time
- Don't downgrade BLOCKERS to WARNINGS
- Don't proceed to next phase if BLOCKED

---

## Integration Points

**Input dependencies**:
- `arch.md` (REQUIRED) - Screen inventory source
- `ux.md` (OPTIONAL) - UX flow cross-reference
- `design.md` (REQUIRED) - Design documentation to validate
- `packages/ui/src/features/[feature-name]/` - Component implementations
- `packages/ui/src/features/index.ts` - Component exports

**Output used by**:
- `/speckit.tasks` - Blocks task generation if status is BLOCKED
- `/speckit.implement` - Relies on validated components from packages/ui
- `/speckit.design-iterate` - Uses validation report to prioritize fixes

**Artifact**: `design-validation.md` is validation gate report (prevents bad handoff to tasks)
