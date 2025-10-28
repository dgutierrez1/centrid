---
description: Validate design completeness before task generation using browser MCP verification
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

**CRITICAL**: This command ALWAYS runs the complete verification process from scratch and regenerates the validation report.

0. **Delete Existing Artifacts**: Remove `design-validation.md` and all screenshots (ensures fresh validation every time)
1. **Setup**: Run `.specify/scripts/bash/check-prerequisites.sh --json` to get FEATURE_DIR and AVAILABLE_DOCS
2. **Load Context**: Read spec.md, arch.md, ux.md (validation sources - NOT design.md)
3. **Validation Checks**: Verify all screens/components designed, exports correct
4. **Browser MCP Verification**: Navigate to design-system app, generate screenshots, verify layouts
5. **Generate Report**: Create NEW design-validation.md with READY/BLOCKED status
6. **Report Summary**: Show validation results and next steps

## Workflow

### Step 0: Always Delete Existing Artifacts

**CRITICAL - Run FIRST before any other steps**:
```bash
cd /Users/daniel/Projects/misc/centrid
# Get feature directory and feature name
FEATURE_DIR=$(.specify/scripts/bash/check-prerequisites.sh --json | jq -r '.FEATURE_DIR')
FEATURE_NAME=$(basename "$FEATURE_DIR" | sed 's/^[0-9]*-//')

# Delete existing validation report (ignore errors if doesn't exist)
rm -f "$FEATURE_DIR/design-validation.md"
echo "✅ Deleted existing design-validation.md (if it existed)"

# Delete existing screenshots (ignore errors if doesn't exist)
rm -rf "apps/design-system/public/screenshots/$FEATURE_NAME"
echo "✅ Deleted all screenshots for $FEATURE_NAME (if they existed)"
```

**Why this matters**: Every run must start fresh. Previous validation results and screenshots may be stale or incomplete. Deleting ensures we always regenerate everything from scratch with current component state.

---

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

**Check 2: arch.md OR ux.md exists**
```
if "arch.md" NOT in AVAILABLE_DOCS AND "ux.md" NOT in AVAILABLE_DOCS:
  ERROR: Neither arch.md nor ux.md found. Need at least one for screen inventory.
  Run /speckit.arch or /speckit.ux first.
  STOP EXECUTION
```

**Load required context**:
- Read `$FEATURE_DIR/spec.md` (for user stories and acceptance criteria)
- Read `$FEATURE_DIR/arch.md` (for screen inventory - if exists)
- Read `$FEATURE_DIR/ux.md` (for detailed UX flows - if exists, PRIMARY SOURCE)
- ❌ DO NOT read design.md (this is what we're validating, not an input)

**Extract feature name**:
- Parse feature directory name (e.g., "004-ai-agent-system" → "ai-agent-system")
- Store as FEATURE_NAME for component path checks

### Step 2: Extract Screen Inventory

**Primary source: ux.md if available, else arch.md**:

**If "ux.md" in AVAILABLE_DOCS**:
- Parse `ux.md` section "## UX Flows"
- Extract all screens from flow headers (e.g., "### AI-Powered Exploration Workspace")
- Extract all flows per screen (#### Flow N: [Flow Name])
- Create screen inventory: screen name → flows list → components per flow
- Use ux.md as source of truth for screen list

**If "ux.md" NOT in AVAILABLE_DOCS**:
- Parse `arch.md` section "### Screens & Flows" table
- Extract screen names, priorities, routes from table rows
- Create screen inventory from arch.md only

**Cross-reference with arch.md** (if ux.md was used):
- Flag screens in ux.md missing from arch.md (inconsistency)
- Flag screens in arch.md missing from ux.md (incomplete UX)

### Step 2.5: Extract ALL Component References from ux.md

**If ux.md exists**, extract comprehensive component inventory using Grep (handles files >25K tokens):

```bash
# Extract all PascalCase component names
grep -oE '`[A-Z][a-zA-Z]+`' $FEATURE_DIR/ux.md | sed 's/`//g' | sort -u
```

**Categorize by type**:
- **Screen components**: Main views from arch.md
- **Flow components**: Modals, actions, dialogs from flows (e.g., CreateBranchModal, BranchActions)
- **Shared components**: Reused across screens

**Validate each component**:
1. File exists: `packages/ui/src/features/$FEATURE_NAME/[ComponentName].tsx`
2. Exported: `packages/ui/src/features/index.ts`
3. Missing flow components = BLOCKER

**If ux.md missing**: Skip (validate arch.md screens only)

### Step 2.75: Validate design.md Screen-to-Component Mapping ✨ NEW

**CRITICAL**: Verify design.md mapping before generating screenshots (catches issues early)

**Load design.md Screen-to-Component Mapping**:
```
Parse design.md section "### Screen-to-Component Mapping"
Extract table rows: Screen Name, Component (Desktop), Component (Mobile), Location, Reused From, Priority, Screenshots
```

**Validation Checks**:

1. **Component location conflicts**:
   ```bash
   For each mapped component:
     Expected location: {Location column from mapping}
     Check if file exists at location
     If not found:
       Search packages/ui/ for component file
       If found elsewhere: WARNING (component moved or mapping outdated)
       If not found: ERROR (component doesn't exist)
   ```

2. **Cross-reference with ux.md** (if exists):
   ```
   Extract screens from ux.md "Screen-by-Screen UX Flows"
   Compare to design.md mapping:
     - All ux.md screens have mapping row? (completeness)
     - All design.md rows reference ux.md screens? (orphans)
   ```

3. **Partial design status**:
   ```
   Count total screens expected (from ux.md or arch.md)
   Count mapped screens in design.md
   Calculate: {mapped}/{total} = X% complete
   If <100%: Set status PARTIAL
   ```

4. **Screenshot status validation**:
   ```
   For each mapping row:
     Check Screenshots column: ✅ or ❌
     If ❌: Screenshots not yet generated (expected at this step)
     If ✅: Screenshots claimed to exist, verify files on disk
   ```

**Orphan screenshot cleanup** ✨ NEW (Gap #3):
```bash
List existing screenshots: ls apps/design-system/public/screenshots/$FEATURE_NAME/
For each screenshot file:
  Parse screen name from filename (e.g., "workspace-..." → "Workspace")
  Check if screen exists in current design.md mapping
  If not found: Mark as ORPHAN (from previous design iteration)

If orphans found:
  Present list to user: "Found X orphan screenshots from previous iterations"
  Ask: "Delete orphan screenshots? [Y/n]"
  If Y: Delete orphans + remove from design.md Screenshots section
  If n: Keep (user may be iterating)
```

**Report**:
```
Screen-to-Component Mapping Validation:

Components: X/Y exist at mapped locations
Locations: X components found, Y conflicts (wrong location)
Completeness: X/Y screens mapped (X% complete)
Status: READY | PARTIAL | BLOCKED

Issues:
- ⚠️  ContextPanel: Found at packages/ui/components/ (mapping shows features/)
- ❌ ThreadInput: Not found at mapped location (file missing)
- 🔄 PARTIAL: 3/5 screens mapped (60% complete)
```

**If BLOCKED**: Stop before browser verification (fixes required)
**If PARTIAL**: Warn but allow proceed (partial verification possible)
**If conflicts found**: Ask user to update mapping or fix locations

---

### Step 3: Validate Design Coverage

**Check 1: UX.md Alignment ✨ UPDATED** (if ux.md exists):

1. **Load layout specs** from ux.md for each screen:
   - ASCII layout diagrams (desktop + mobile) with pixel/percentage values
   - Panel behavior tables (widths, responsive)
   - Spacing tables (gap, padding, margin values)

2. **Compare design.md to ux.md layout specs**:
   - Check if design.md references ux.md layouts (good practice)
   - Check if screenshots exist showing these layouts
   - Flag significant deviations (>10% difference in dimensions)

3. **Component prop alignment**:
   - Extract component specs from ux.md (TypeScript props with data + callbacks)
   - Check if components in packages/ui match ux.md props specifications
   - Verify all states from ux.md have screenshots (Default, Loading, Error, Empty, Success, Open/Closed, Expanded/Collapsed)

4. **Error scenario coverage**:
   - Extract error scenarios from ux.md flows (error tables with trigger, component, display, recovery, test data)
   - Verify design.md documents error states and recovery flows
   - Check error screenshots exist

5. **Interaction patterns validation**:
   - Extract interaction patterns from ux.md (Modal Workflow, Streaming Response, Approval Workflow, Context Management, Dropdown Navigation, Sliding Panel, Collapsible Section, Provenance Navigation)
   - Verify design implements patterns with correct state changes and keyboard navigation

6. **Accessibility checklist**:
   - Verify keyboard navigation documented (Tab, Enter, Escape, Arrows)
   - Check ARIA labels/roles documented (`aria-label`, `role`, `aria-live`)
   - Verify focus management (trap, restoration)
   - Check color contrast meets WCAG AA (4.5:1 text, 3:1 UI)

7. **Success criteria alignment**:
   - Extract success criteria from ux.md flows (performance targets <2s/<5s, adoption metrics, quality thresholds)
   - Verify design addresses performance/quality constraints

8. **Create alignment matrix**:
```
| Screen      | Layout | Props | States | Errors | Patterns | A11y | Success Criteria | Status |
|-------------|--------|-------|--------|--------|----------|------|------------------|--------|
| Workspace   | ✅     | ✅    | ✅ 5/5 | ✅ 3/3 | ✅ 3/3   | ✅   | ✅               | ALIGNED|
| Settings    | ⚠️     | ✅    | ⚠️ 3/5 | ❌ 0/2 | ✅ 1/1   | ⚠️   | ✅               | PARTIAL|
```

9. **If misalignment found**:
   - Check design.md for "Layout Deviations" section (intentional changes)
   - If documented: Mark as INTENTIONAL DEVIATION
   - If not documented: Mark as BLOCKER (needs resolution)

**Check 2: All Screens Designed with Flow Coverage**

For each screen in arch.md screen inventory:

1. Search design.md for screen name
2. Verify screen has design section with:
   - Layout description or ASCII diagram
   - Component list
   - States documented (default, loading, error, empty)
   - Responsive behavior
3. **If ux.md exists**: Verify all flows for this screen are documented
   - Extract flows from ux.md "### [Screen Name]" section (e.g., "#### Primary Flow 1", "#### Primary Flow 2")
   - Check design.md documents components for ALL flows (not just Flow 1)
   - Verify modals, approval prompts, and flow-specific components are documented

**Create coverage matrix**:
```
| Screen      | Priority | In design.md? | Layout? | Components? | All Flows? | States? | Status |
|-------------|----------|---------------|---------|-------------|------------|---------|--------|
| Workspace   | P1       | ✅            | ✅      | ✅          | ✅ (4/4)   | ✅      | READY  |
| Settings    | P2       | ❌            | -       | -           | -          | -       | MISSING|
```

**Flow Coverage Check** (if ux.md exists):
- Count flows in ux.md for each screen (e.g., "Chat Interface" has Flow 1-4)
- Verify design.md documents components for ALL flows, not just primary flow
- Flag MISSING if flows are documented separately as different "screens" instead of unified in parent screen

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

### Step 4: Parallel Browser Verification & Screenshot Generation

**CRITICAL**: Always verify all screen×flow×state×viewport combinations in parallel (~90s total).

**REQUIRED OUTPUT**: This step MUST return `verification_results` variable containing:
- `screenshots`: Array of generated file paths
- `ready_count`, `skipped_count`, `blocked_count`, `total_count`: Numbers
- `overall_status`: "READY" | "PARTIAL" | "BLOCKED"

**This data is required by Step 7** - if missing, summary will be visibly broken.

#### Setup & Matrix Building

1. **Check design-system app** (port 3001): Start if not running, error if fails

2. **Map production routes to design-system showcase**:
   - Parse ux.md for `**Route**: /path` (e.g., `/thread/:threadId`)
   - Map to design-system showcase path:
     - Common mappings: `/thread/:threadId` → `/ai-agent-system/workspace`
     - Check `apps/design-system/pages/{feature-name}/` for available routes
     - If no showcase route exists: SKIP browser verification, validate components only

3. **Parse flows from ux.md**: Extract flows (#### headers), states (from flow tables: trigger, component)

4. **Build verification matrix**: screen × flow × state × viewport → tasks (e.g., 9 flows × 3 states × 2 viewports = 54 tasks)

#### Parallel Sub-Agent Execution

Spawn all tasks in parallel using Task tool (single message, multiple invocations).

**CRITICAL - Provide complete context to each sub-agent**:
```
You are verifying flow: {flow_name}
Production route: {production_route} (from ux.md)
Design-system showcase: http://localhost:3001{showcase_route}
Viewport: {width}×{height} ({desktop|mobile})
Target state: {state_name}

Flow details from ux.md:
- Steps: {flow_steps_summary}
- Components involved: {component_list}
- Expected behavior: {expected_behavior}

Your task:
1. Navigate to showcase route
2. Trigger the flow state (URL params first, then interactive)
3. Screenshot: {screen}-{flow}-{state}-{viewport}.png
4. Validate layout and check console errors
5. Return result with status

Skip conditions (return SKIPPED):
- Flow requires live backend API (actual agent execution, real consolidation)
- Flow requires file system access (actual file upload, real file creation)
- Component NOT implemented (Phase 3 features)

Do NOT skip (these are testable UI states):
- Mock streaming (pure UI animation)
- Modal open/close (pure UI)
- Form validation errors (pure UI)
- Context panel expand/collapse (pure UI)
```

**Each sub-agent execution** (playwright MCP):
```
Context: {screen-slug}-{flow-slug}-{state-slug}-{viewport}
Showcase route: http://localhost:3001{showcase_route}

Execution:
1. Create context (isolated viewport: {width}×{height})

2. Navigate to showcase

3. **Trigger state** (try in order):
   a. URL params: Navigate to `{route}?flow={flow-slug}&state={state-slug}`
   b. Check if state changed (compare DOM or screenshot before/after)
   c. If no change, use interactive trigger:
      - Flow 1 (Send Message): Type text → Click send → Wait for streaming UI
      - Flow 2 (Create Branch): Click "Create Branch" → Modal opens
      - Flow 3 (Semantic): Message sent → Context panel updates
      - {other flow-specific triggers from ux.md}
   d. If trigger requires backend/filesystem: return SKIPPED

4. Screenshot: {flow-slug}-{state-slug}-{viewport}.png
   - Example: send-message-streaming-desktop.png
   - For single-screen features: use flow name directly
   - For multi-screen features: prefix with screen name (screen-flow-state-viewport.png)

5. Validate layout (JS eval with fallback selectors):
   - Try data-testid first, then class/tag fallbacks
   - Panel widths: ±5% tolerance (>10% = BLOCKER, 5-10% = WARNING)
   - Gap spacing: ±2px tolerance
   - Component visibility

6. Check console errors (filter out favicon 404, check for JS errors)

7. Close context

Return: {
  task_id: string,
  screenshot: string,
  status: "READY" | "SKIPPED" | "BLOCKED",
  skip_reason?: string,
  layout_valid: boolean,
  layout_dimensions?: object,
  issues: string[],
  console_errors: string[]
}
```

**Layout Validation JS**:
```javascript
() => {
  const panels = {
    left: document.querySelector('[data-testid="workspace-sidebar"]'),
    center: document.querySelector('[data-testid="thread-view"]'),
    right: document.querySelector('[data-testid="file-editor"]')
  };
  const total = document.body.clientWidth;
  return {
    leftWidthPct: panels.left ? (panels.left.offsetWidth / total) * 100 : 0,
    centerWidthPct: panels.center ? (panels.center.offsetWidth / total) * 100 : 0,
    rightWidthPct: panels.right ? (panels.right.offsetWidth / total) * 100 : 0,
    gap: panels.center?.parentElement ? parseInt(getComputedStyle(panels.center.parentElement).gap || '0') : 0,
    visible: {left: !!panels.left, center: !!panels.center, right: !!panels.right}
  };
}
```

#### Aggregation

Collect all results, calculate:
- `ready_count`, `skipped_count`, `blocked_count`, `total_count`
- `skipped_percentage` = (skipped_count / total_count) × 100
- `blocked_percentage` = (blocked_count / total_count) × 100

**Determine status**:
- **BLOCKED**: if blocked_percentage ≥ 25% (too many critical failures)
- **PARTIAL**: if blocked_percentage < 25% OR skipped_percentage > 50%
- **READY**: if blocked_percentage < 25% AND skipped_percentage ≤ 50%

Group by route → flow → viewport for reporting

---

### Step 5: Browser Verification Status Check

**MANDATORY**: Verification must complete before generating report.

```
Calculate percentages:
- blocked_percentage = (blocked_count / total_count) × 100
- skipped_percentage = (skipped_count / total_count) × 100

if blocked_percentage ≥ 25:
  STATUS: BLOCKED
  ERROR: "Too many flows blocked (${blocked_count}/${total_count} = ${blocked_percentage}%)"
  ERROR: "Threshold: 25% blocked = BLOCKER. Fix critical issues before proceeding."

  List all BLOCKER issues:
  ${for result in results where status == "BLOCKED":
    - ${result.task_id}: ${result.issues.join(", ")}
  }

  STOP: Cannot proceed to task generation

elif blocked_count > 0 OR skipped_percentage > 50:
  STATUS: PARTIAL
  WARNING: "${blocked_count} flows blocked (${blocked_percentage}%), ${skipped_count} flows skipped (${skipped_percentage}%)"

  If blocked_count > 0:
    WARNING: "Some flows blocked but under 25% threshold - proceed with caution"
    List blocked flows: ${blocked_tasks}

  If skipped_percentage > 50:
    WARNING: "More than 50% states skipped - extensive manual verification needed during implementation"
    List skipped flows: ${skipped_tasks}

  Can proceed to report generation with warnings

else:
  STATUS: READY
  SUCCESS: "All verification tasks passed (${ready_count}/${total_count} ready, ${blocked_percentage}% blocked, ${skipped_percentage}% skipped)"
  Proceed to report generation
```

### Step 6: Generate NEW Validation Report

**CRITICAL**: Create a completely NEW validation report from scratch.

**Requirements**:
- File was already deleted in Step 0
- Use Write tool (NOT Edit tool)
- Generate complete report with all validation results
- Include timestamp of current run

**Location**: `$FEATURE_DIR/design-validation.md`

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

## UX Specification Alignment ✨ UPDATED

**Source**: ux.md (if exists)

**Status**: ALIGNED | PARTIAL | MISALIGNED | N/A (no ux.md)

### Layout Alignment

| Screen      | Desktop Layout | Mobile Layout | Spacing | Deviations | Status |
|-------------|----------------|---------------|---------|------------|--------|
| [Screen]    | ✅/⚠️/❌       | ✅/⚠️/❌      | ✅/⚠️/❌ | Documented?| ALIGNED/PARTIAL/BLOCKED |

**Legend**:
- ✅ = Matches ux.md specs (±5% tolerance)
- ⚠️  = Minor deviation (5-10% difference)
- ❌ = Significant deviation (>10% difference)

### Component Props & States Alignment

| Component       | Props Match | States (D/L/E/S) | Error Scenarios | A11y (KB/ARIA/Focus) | Screenshots | Status |
|-----------------|-------------|------------------|----------------|---------------------|-------------|--------|
| [Component]     | ✅/⚠️/❌    | X/Y states       | X/Y errors     | ✅/⚠️/❌            | ✅/⚠️/❌    | ALIGNED/PARTIAL/BLOCKED |

**Legend**: D/L/E/S = Default/Loading/Error/Success states, KB = Keyboard nav, A11y = Accessibility

**Issues Found**:
- 🔴 BLOCKER: [Component X] props mismatch - ux.md has `onApprove(id)`, design.md has `onConfirm()`
- 🔴 BLOCKER: [Component Y] missing Error state screenshots (documented in ux.md error table)
- 🔴 BLOCKER: [Component Z] missing keyboard navigation (ux.md requires Tab/Enter/Escape)
- ⚠️  WARNING: [Component W] layout 40% width (ux.md: 30%) - NOT DOCUMENTED in design.md deviations
- ℹ️  INTENTIONAL: [Component V] spacing 12px (ux.md: 16px) - Documented in design.md "Layout Deviations"

### Flow Coverage ✨ CRITICAL

**Unified Screen Validation**: Each screen in ux.md may have multiple flows (Flow 1, Flow 2, etc.). ALL flows must be addressed in the SAME screen section in design.md, not split into separate screens.

**Flow Coverage Matrix**:

| Screen         | Total Flows (ux.md) | Flows Documented (design.md) | Missing Components | Unified? | Status |
|----------------|---------------------|------------------------------|-------------------|----------|--------|
| Chat Interface | 4 (Flow 1-4)        | 2 (Flow 1, 3 partial)        | CreateBranchModal, ConsolidateModal | ❌ Split | BLOCKED |
| [Screen]       | X flows             | Y flows                      | [Components]      | ✅/❌    | READY/BLOCKED |

**Consistency Checks**:
- [ ] All screens in ux.md are in arch.md
- [ ] All screens in arch.md are in ux.md (or intentionally deferred)
- [ ] **All flows for each screen documented in SAME design.md screen section (not split)**
- [ ] All flow-specific components documented (modals, approval prompts, etc.)

**Issues Found**:
- 🔴 BLOCKER: [Screen X] has [N] flows in ux.md but design.md only documents [M] flows
- 🔴 BLOCKER: [Flow Y] components split into separate screen sections instead of unified in [Screen X]
- 🔴 BLOCKER: [Component Z] from [Flow N] missing from design.md
- ⚠️  WARNING: [Screen Y] in arch.md but no UX flow in ux.md (consider if UX detail needed)

### Error Scenarios & Recovery

**Source**: ux.md error tables in each flow

| Screen/Flow     | Total Errors (ux.md) | Documented (design.md) | Screenshots | Recovery Flows | Status |
|-----------------|---------------------|------------------------|-------------|---------------|--------|
| Chat Interface  | 4 errors            | 2 documented           | 1/4         | 2/4           | BLOCKED |
| [Flow]          | X errors            | Y documented           | X/Y         | X/Y           | READY/BLOCKED |

**Issues Found**:
- 🔴 BLOCKER: [Error X] from ux.md not documented in design.md (e.g., "SSE interrupts mid-response")
- 🔴 BLOCKER: [Error Y] missing screenshots (e.g., network failure banner)
- 🔴 BLOCKER: [Error Z] missing recovery flow documentation

### Interaction Patterns

**Source**: ux.md lines 1375-1552 (8 patterns)

| Pattern                  | Used In          | State Changes | Keyboard Nav | Documented | Status |
|-------------------------|------------------|---------------|--------------|------------|--------|
| Modal Workflow          | Create Branch    | Hidden→Visible→Hidden | Escape/Enter | ✅/❌ | READY/BLOCKED |
| Streaming Response      | Agent Messages   | Idle→Streaming→Complete | Escape | ✅/❌ | READY/BLOCKED |
| Approval Workflow       | Tool Calls       | Streaming→Paused→Approved | Tab/Enter | ✅/❌ | READY/BLOCKED |
| Context Management      | Context Panel    | Collapsed→Expanded | Enter/Arrows | ✅/❌ | READY/BLOCKED |
| Dropdown Navigation     | Branch Selector  | Closed→Open→Selected | Enter/Arrows/Escape | ✅/❌ | READY/BLOCKED |
| Sliding Panel           | File Editor      | Closed→Open→Closed | Escape | ✅/❌ | READY/BLOCKED |
| Collapsible Section     | Context Sections | Collapsed→Expanded | Enter/Space | ✅/❌ | READY/BLOCKED |
| Provenance Navigation   | Go to Source     | File→Navigate→Highlight | Enter | ✅/❌ | READY/BLOCKED |

**Issues Found**:
- 🔴 BLOCKER: [Pattern X] not implemented/documented in design.md
- 🔴 BLOCKER: [Pattern Y] missing keyboard navigation specification
- 🔴 BLOCKER: [Pattern Z] state changes incomplete (only shows 2/4 states)

### Accessibility Validation

**Source**: ux.md lines 1349-1357 (shared checklist)

| Component       | Keyboard Nav | ARIA Labels | Focus Management | Color Contrast | Screen Reader | Status |
|-----------------|-------------|-------------|------------------|----------------|---------------|--------|
| [Component]     | ✅/❌       | ✅/❌       | ✅/❌            | ✅/❌          | ✅/❌         | READY/BLOCKED |

**Checklist**:
- [ ] Keyboard navigation: Tab, Shift+Tab, Enter, Escape, Arrow keys
- [ ] ARIA labels: `aria-label` for icon buttons, `aria-describedby` for inputs, `role` for custom widgets
- [ ] Focus management: Initial focus, focus trap (modals), focus restoration
- [ ] Color contrast: WCAG AA (4.5:1 text, 3:1 UI)
- [ ] Screen reader: `aria-live="polite"` (updates), `aria-live="assertive"` (errors)

**Issues Found**:
- 🔴 BLOCKER: [Component X] missing keyboard navigation documentation
- 🔴 BLOCKER: [Component Y] missing ARIA labels specification
- ⚠️  WARNING: [Component Z] color contrast not verified (coral on white = needs check)

### Success Criteria Coverage

**Source**: ux.md success criteria sections in flows

| Flow            | Success Criteria (ux.md)      | Design Addresses | Status |
|-----------------|------------------------------|------------------|--------|
| Send Message    | Response starts <5s (p95)    | ✅/❌            | READY/BLOCKED |
| Create Branch   | Completes <2s                | ✅/❌            | READY/BLOCKED |
| Semantic Search | Returns results <1s          | ✅/❌            | READY/BLOCKED |
| Consolidate     | 5 branches <10s (p95)        | ✅/❌            | READY/BLOCKED |

**Issues Found**:
- ⚠️  WARNING: [Flow X] performance target (<2s) not addressed in design notes
- ℹ️  INFO: Design should note performance constraints for implementation phase

---

## Component Export Validation

**Source**: Comprehensive inventory from ux.md (Step 2.5) + packages/ui validation

### All Components

| Component            | Type         | Location              | File Exists? | Exported? | Status |
|----------------------|--------------|-----------------------|--------------|-----------|--------|
| [Component]          | Screen/Flow/Shared | features/[feature]/ | ✅/❌      | ✅/❌     | READY/BLOCKED |

**Summary**:
- Total (ux.md): [N]
- Implemented: [N/N]
- Missing: [N] 🔴

**Issues**:
- 🔴 BLOCKER: [Component X] from [Flow Y] missing
- 🔴 BLOCKER: [Component Z] not exported

---

## Screenshot Generation Report

**Source**: Browser verification (Step 4)

**Status**: GENERATED | SKIPPED | FAILED

**If GENERATED**:

| Screen × Flow       | Desktop | Mobile | States | Layout Valid | Errors | Status |
|---------------------|---------|--------|--------|--------------|--------|--------|
| Workspace × Send Msg| ✅ (3)  | ✅ (3) | 3/3    | ✅           | 0      | READY  |
| Workspace × Branch  | ❌      | ❌     | 0/2    | N/A          | N/A    | MISSING|
| [Screen × Flow]     | ✅/❌(N)| ✅/❌(N)| X/Y   | ✅/⚠️/❌     | N      | READY/BLOCKED |

**Total Screenshots Generated**: [N] files
**Saved to**: `apps/design-system/public/screenshots/[feature-name]/`

**Screenshots List**:
- workspace-send-message-default-desktop.png ✅
- workspace-send-message-default-mobile.png ✅
- workspace-send-message-streaming-desktop.png ✅
- workspace-send-message-streaming-mobile.png ✅
- workspace-branch-selector-open-desktop.png ❌ (component missing)

**If SKIPPED**:
Note: Design-system app not running. Start with `npm run design:dev` and re-run verification.

**Issues Found**:
- 🔴 BLOCKER: [Flow X] failed to render (component missing: CreateBranchModal)
- 🔴 BLOCKER: [Flow Y] console errors: "[error message]"
- ⚠️  WARNING: [Flow Z] layout deviation: Panel width 600px (ux.md: 500px, >10% diff)

---

## Browser MCP Verification

**Status**: ${overall_status} | **Tasks**: ${ready_count}/${total_tasks} ready, ${skipped_count} skipped (${skipped_percentage}%), ${blocked_count} blocked | **Time**: ~90s

${if skipped_percentage > 50: "⚠️ WARNING: >50% skipped - extensive manual verification needed"}

### Route: ${route} (${screen_name})

| Flow | Desktop | Mobile | Layout | Console | Status |
|------|---------|--------|--------|---------|--------|
| ${flow.name} | ${flow.desktop_ready}/${flow.desktop_total} | ${flow.mobile_ready}/${flow.mobile_total} | ${flow.layout_status} | ${flow.errors} | ${flow.status} |

**Summaries**:
- Desktop: ${desktop_ready}/${desktop_total} screenshots, ${desktop_skipped} skipped, ${desktop_console_errors} errors
- Mobile: ${mobile_ready}/${mobile_total} screenshots, ${mobile_skipped} skipped, ${mobile_console_errors} errors

**Layout Issues**: ${layout_issues_summary or "✅ All match ux.md specs"}
**Skipped**: ${skipped_list or "None"}
**Console Errors**: ${console_errors_summary or "✅ None"}

---

## Validation Summary

**READY Criteria** (all must pass):
- [✅/❌] All P1 screens designed
- [✅/❌] All ux.md components exist and exported (includes flow components)
- [✅/❌] All P1 flows screenshotted (generated during browser verification)
- [✅/❌] No console errors (verified during browser verification)
- [✅/❌] Layout validation passed (±5% tolerance to ux.md specs)

**PARTIAL Status**:
- [✅/❌] P2/P3 screens missing
- [✅/❌] Minor warnings

**BLOCKED Status**:
- [✅/❌] P1 screens missing
- [✅/❌] Flow components missing (modals, actions, dialogs)
- [✅/❌] Components not exported
- [✅/❌] Console errors

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

**READY** if ALL of:
- All P1 screens designed in design.md
- All ux.md components exist (Step 2.5 validation passed)
- All components exported from packages/ui
- All P1 screenshots exist
- No console errors

**PARTIAL** if:
- P1 complete, P2/P3 missing
- Minor warnings only

**BLOCKED** if ANY of:
- P1 screen missing
- Flow components missing (Step 2.5 found gaps)
- Component not exported
- Console errors

**Key Rule**: Step 2.5 must pass (all ux.md components validated) before reporting READY

### Step 6.5: Update design.md with Screenshot References ✨ NEW

**CRITICAL**: Update design.md to register generated screenshots (handoff for /speckit.tasks)

**After screenshot generation in Step 4**, update design.md:

1. **Update Screen-to-Component Mapping table**:
   ```
   For each screen with screenshots generated:
     Find mapping row in design.md table
     Update Screenshots column: ❌ → ✅
   ```

2. **Update or create Screenshots section** (if not exists):
   ```markdown
   ## Screenshots

   Generated by `/speckit.verify-design` on [DATE]:

   ### [Screen Name]
   - [screen-name]-[flow]-[state]-desktop.png
   - [screen-name]-[flow]-[state]-mobile.png
   ...

   ### [Screen Name 2]
   - [screen-name2]-[flow]-[state]-desktop.png
   ...
   ```

3. **Preserve existing sections** (don't overwrite):
   - Overview
   - Component Architecture
   - User Flows
   - Screens Designed
   - Layout Deviations
   - Design Tokens Used
   - Implementation Notes

4. **Screenshot idempotency** ✨ (Gap #8 - rollback protection):
   ```
   If Step 4 validation failed AFTER generating screenshots:
     - Keep screenshots on disk (expensive to regenerate)
     - Don't update design.md (maintain consistency)
     - Note: Re-running verify-design will skip existing screenshots
   ```

**Implementation** (use Edit tool):
```typescript
// Find Screen-to-Component Mapping table
// For each generated screenshot:
//   Parse screen name from filename
//   Update corresponding table row: Screenshots column ❌ → ✅
//
// Find or create ## Screenshots section
// Group screenshots by screen
// List filenames under screen headers
//
// Add timestamp: "Generated by /speckit.verify-design on 2025-10-27"
```

**Report**:
```
design.md Updated ✅

Screen-to-Component Mapping:
- Workspace: ❌ → ✅ (4 screenshots registered)
- Context Panel: ❌ → ✅ (2 screenshots registered)
- Settings: Remains ❌ (no screenshots generated)

Screenshots Section:
- Added 6 new screenshot references
- Grouped by screen
- Timestamp: 2025-10-27
```

**If validation failed before completion**: Don't update design.md (prevents inconsistent state)

---

### Step 6.75: Verification Enforcement Check

**MANDATORY before generating summary** - verify Step 4 was actually completed:

```
Check: Does verification_results variable exist with required fields?
- verification_results.screenshots (array)
- verification_results.ready_count (number)
- verification_results.skipped_count (number)
- verification_results.blocked_count (number)
- verification_results.total_count (number)
- verification_results.overall_status (string)

If ANY field is missing or undefined:
  ERROR: "Browser verification was skipped or incomplete"
  ACTION: "Re-executing Step 4 now..."
  STOP: Do not generate summary
  Re-execute Step 4 completely
```

**Only proceed to Step 7 if verification_results is complete**

---

### Step 7: Report Summary

**IMPORTANT**: Update all "Step X" references in report messages to match new numbering (Steps 5→6, 6→7)

**REQUIRED DATA** (populated from Step 4):
- Screenshots: `{verification_results.screenshots.length}` files
- Ready: `{verification_results.ready_count}/{verification_results.total_count}`
- Status: `{verification_results.overall_status}`

**Success message** (if READY):

```
✅ Design Validation: READY

**Feature**: [###-feature-name]

**Validation Results**:
- Screen Coverage: [X/X] screens designed
- Component Exports: [X/X] components ready
- Screenshots: {verification_results.screenshots.length} screenshots generated
- Browser Verification: {verification_results.overall_status} ({verification_results.ready_count}/{verification_results.total_count} ready)

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
- Screenshots: {verification_results.screenshots.length} screenshots exist ({verification_results.skipped_count} skipped)
- Browser Verification: {verification_results.overall_status} ({verification_results.blocked_count} blocked)

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
- Screenshots: {verification_results.screenshots.length} screenshots exist
- Browser Verification: {verification_results.overall_status} ({verification_results.blocked_count}/{verification_results.total_count} blocked)

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
- design.md MUST exist (checked but NOT loaded as context - it's what we validate)
- arch.md MUST exist (loaded as context - screen inventory source)
- ux.md OPTIONAL (if exists, loaded as context + run Step 2.5)

**Critical Validation**:
- **Step 2.5 is MANDATORY** if ux.md exists
- Use Grep to extract ALL components from ux.md (handles files >25K tokens)
- Validate flow components (modals, actions, dialogs)
- Missing flow components = BLOCKER (not WARNING)

**Status**:
- READY: All checks pass (including Step 2.5)
- PARTIAL: P1 complete, P2/P3 issues
- BLOCKED: P1 issues OR flow components missing

**When design.md IS read**:
- Step 2.75: Read Screen-to-Component Mapping table (validation only)
- Step 3: Check for Layout Deviations section (intentional changes)
- Step 6.5: Update Screenshots section after generation (write operation)

**No Improvisation**:
- Don't skip Step 2.5
- Don't downgrade BLOCKERS to WARNINGS
- Don't report READY if Step 2.5 finds gaps
- Don't read design.md as general context (only for specific validation steps)

---

## Integration Points

**Input dependencies (validation sources)**:
- `spec.md` (REQUIRED) - User stories, acceptance criteria
- `arch.md` (REQUIRED) - Screen inventory source
- `ux.md` (OPTIONAL) - UX flow specs, component props, interaction patterns
- `packages/ui/src/features/[feature-name]/` - Component implementations (current state)
- `packages/ui/src/features/index.ts` - Component exports (current state)
- Design-system app (http://localhost:3001) - Live rendering (current state)

**Validation target** (what we validate, not an input):
- `design.md` (REQUIRED) - Screen-to-Component Mapping table, Layout Deviations section

**Output used by**:
- `/speckit.tasks` - Blocks task generation if status is BLOCKED
- `/speckit.implement` - Relies on validated components from packages/ui
- `/speckit.design-iterate` - Uses validation report to prioritize fixes

**Artifact**: `design-validation.md` is validation gate report (prevents bad handoff to tasks)
