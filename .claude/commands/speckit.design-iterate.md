---
description: Iterate on existing feature designs by updating components, re-screenshotting, and incorporating feedback into design.md
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

**Purpose**: Allow ad-hoc design iteration after initial design phase. Used when stakeholder feedback arrives, design needs refinement, or implementation reveals UX issues.

**Prerequisites**:
- Initial `/speckit.design` completed (design.md exists with components)
- Components exist in `packages/ui/src/features/[feature-name]/`
- Design showcase exists in `apps/design-system/pages/[feature-name]/`

---

## Workflow

### 1. Setup & Load Context

**Run prerequisites script**: `.specify/scripts/bash/check-prerequisites.sh --json` from repo root
- Parse `FEATURE_DIR` (absolute path to feature directory)
- Parse `AVAILABLE_DOCS` list (which documents exist for this feature)
- All paths must be absolute

**Validate design.md exists**:
- Check if `design.md` exists in AVAILABLE_DOCS
- If missing: Error and tell user to run `/speckit.design` first
- If exists: Load design.md for context

**Load existing design context**:
- Read `design.md` from FEATURE_DIR:
  - Screen-to-Component Mapping table (all designed screens)
  - Component Architecture section (component locations)
  - Existing screenshots (for version tracking)
  - Layout Deviations section (if exists)
- Read `ux.md` from FEATURE_DIR (if exists in AVAILABLE_DOCS - for layout specs)
- Read design tokens from `.specify/design-system/tokens.md`
- Scan `packages/ui/src/features/[feature-name]/` for existing components
- Scan `apps/design-system/pages/[feature-name]/` for showcase pages
- Scan `apps/design-system/public/screenshots/[feature-name]/` for existing screenshots

### 2. Screen Selection

**Present available screens** from Screen-to-Component Mapping table:

```
Available screens for iteration:

1. Desktop Workspace (DesktopWorkspace.tsx)
   Current: 01-desktop-workspace-desktop.png, 01-desktop-workspace-mobile.png
   Route: /[feature-name]/desktop-workspace

2. Mobile Document View (MobileDocumentView.tsx)
   Current: 02-mobile-document-desktop.png, 02-mobile-document-mobile.png
   Route: /[feature-name]/mobile-document

[... all screens from mapping table]

Which screen(s) do you want to iterate on?
- Reply with number(s): "1", "2,3", "all"
- Or screen name: "Desktop Workspace"
- Or "all" to iterate all screens sequentially
```

**Parse user selection**:
- Single number → iterate that screen only
- Multiple numbers → iterate those screens sequentially
- "all" → iterate all screens sequentially
- Screen name → match to table entry

### 3. Iteration Loop (Per Selected Screen)

**For each selected screen**:

#### 3.1. Start Dev Server

**Ensure design-system is running**:
```bash
npm run design:dev  # localhost:3001
```

Wait for server ready confirmation before proceeding.

#### 3.2. Initial Screenshot & Present

1. **Navigate to screen**: `http://localhost:3001/[feature-name]/[screen-route]`
2. **Capture current state**:
   - Desktop viewport (1440×900): `[NN]-[screen-name]-desktop-v[N].png`
   - Mobile viewport (375×812): `[NN]-[screen-name]-mobile-v[N].png`
   - Version number: Increment from existing screenshots (v2, v3, etc.)
3. **Save to**: `apps/design-system/public/screenshots/[feature-name]/`
4. **Quick layout check** ✨ (if ux.md exists):
   - Load layout specs for this screen from ux.md
   - Visual comparison only (panel widths, spacing, layout matches diagram?)
   - Note any obvious deviations for user review
5. **Present to user**:
   - Show both desktop + mobile screenshots
   - Show previous version screenshots for comparison (if available)
   - **If ux.md layout check**: Show brief validation note (✅ matches / ⚠️ differs)
   - Ask: "Review [Screen Name]. Provide feedback, type 'approved' to finalize, or 'skip' to move to next screen."

#### 3.3. Feedback Loop

**Process user response**:

- **If "approved" / "done" / "finalize"**:
  * Archive old screenshots (rename with `-archived-[timestamp]` suffix)
  * Update design.md ✨ (enhanced handoff tracking):
    - **Screen-to-Component Mapping table**: Update screenshot references, keep ✅ status
    - **If new components created**: Add new rows to mapping table with location, reuse info, priority
    - **If layout changed**: Add/update Layout Deviations section (rationale + impact)
    - **If new requirements discovered**: Add to Implementation Notes with ⚠️ NEW REQUIREMENT marker
    - **Screenshots section**: Update with new screenshot filenames, grouped by screen
    - Add iteration note under screen description: `**Iteration [DATE]**: [brief summary of changes]`
  * Save design.md (atomic write using Edit tool)
  * Move to next selected screen (or exit if last)

- **If "skip" / "next"**:
  * Don't update design.md (keep previous version)
  * Move to next selected screen

- **If feedback provided**:
  * **Quick validation** ✨ (before editing):
    - Component in correct location? (`packages/ui/src/features/[feature-name]/` or `packages/ui/src/components/`)
    - Pure presentational? (no data fetching, API calls, auth logic)
    - Props pattern? (data in, callbacks out)
  * **Update component**: Edit file, maintain presentational pattern
  * **Wait for auto-reload**: ~1-2 seconds for design-system to refresh
  * **Re-screenshot**: Same screen, same viewports, increment version suffix if major change
  * **Present updated screenshots**: Show new vs previous
  * **Loop**: Ask for more feedback or approval
  * **Track iterations**: Maintain change log in memory for final design.md update

#### 3.4. Auto-Sync Files ✨ UPDATED

**For each edited component**:

1. **Read .tsx file** → Extract props + states
2. **Update ux.md** (if exists): Find component section → Replace props line → Replace states line → Add `**Iteration [DATE]**: [change]`
3. **Update design.md ✨** (comprehensive handoff update):
   - **Screen-to-Component Mapping**: Update screenshot references
   - **If component location changed**: Update Location column, note in Reused From if relevant
   - **If mobile variant differs**: Document in Component (Mobile) column (e.g., "Drawer" vs desktop "Panel")
   - **Layout Deviations**: Add row if layout changed from ux.md specs (rationale + impact)
   - **Screenshots section**: Replace old screenshot filenames with new ones
   - **Implementation Notes**: Add new requirements if discovered during iteration (mark with ⚠️ NEW REQUIREMENT)
   - Add `**Iteration [DATE]**: [change]` to screen section
4. **Verify**: Read ux.md props → Compare to .tsx props → If mismatch: ERROR and STOP
5. **Write**: ux.md, design.md (use Edit tool for atomic updates)

### 4. Completion Summary

```
✅ Design iteration complete
- Screens: [N], Components: [Names], Screenshots: [N]
- ux.md: ✅ [Component] props/states synced
- design.md: ✅ Mapping + notes + deviations
- Verified: ✅ Props match .tsx files
```

---

## Validation Rules

**Before iteration**:
- ✅ design.md must exist with Screen-to-Component Mapping table
- ✅ Components must exist in packages/ui/src/features/[feature-name]/
- ✅ Design showcase must be accessible at localhost:3001

**During iteration** ✨:
- ✅ Only update selected screens (don't modify others)
- ✅ Preserve component architecture (no file renames without user approval)
- ✅ **Component guidelines**: Keep presentational (no data fetching, API calls, auth)
- ✅ **Props pattern**: Data in, callbacks out (maintain existing pattern)
- ✅ **Location check**: Edit in `packages/ui` only (never `apps/web` or `apps/design-system`)
- ✅ **Layout validation**: Quick visual check against ux.md specs (if exists)
- ✅ Archive old screenshots (don't delete)
- ✅ Atomic writes after each screen approval

**After iteration** (MANDATORY CHECKS):
- ✅ **design.md updated**: Mapping table + iteration notes + deviations (if any)
- ✅ **ux.md updated** (if exists): Component props/states match actual .tsx files
- ✅ **Screenshots**: New versions saved, old versions archived
- ✅ **Components**: Only edited in packages/ui (never apps/)
- ❌ **STOP if**: ux.md props don't match component file (incomplete sync)

---

## Key Differences from `/speckit.design`

| Aspect | `/speckit.design` (Initial) | `/speckit.design-iterate` (Refinement) |
|--------|---------------------------|--------------------------------------|
| **When** | First time creating feature UI | After initial design, need changes |
| **Creates** | Components from scratch | Updates existing components |
| **Screens** | All screens designed together | Select specific screens to iterate |
| **design.md** | Creates new design.md | Updates existing design.md |
| **Screenshots** | First versions (v1) | Versioned iterations (v2, v3...) |
| **Prerequisite** | spec.md + plan.md | design.md must exist |
| **Workflow** | Sequential all screens | User selects which screens |

---

## Error Handling

**If design.md missing**:
```
ERROR: design.md not found in [FEATURE_DIR]

This command requires an existing design specification.
Run /speckit.design first to create the initial feature design.
```

**If components missing**:
```
ERROR: No components found in packages/ui/src/features/[feature-name]/

The Screen-to-Component Mapping table references components that don't exist.
Check if components were moved or deleted, or re-run /speckit.design.
```

**If design-system server not running**:
```
ERROR: Cannot connect to http://localhost:3001

Start the design system with: npm run design:dev
Then re-run /speckit.design-iterate
```

---

## Tips

**Version Management**:
- Keep major versions (v1, v2, v3) for significant changes
- Overwrite minor tweaks within same version
- Archive old versions with timestamps for history

**Incremental Iteration**:
- You don't need to iterate all screens at once
- Run `/speckit.design-iterate` multiple times for different screens
- Each run updates design.md incrementally

**Collaboration**:
- Show screenshots to stakeholders
- Gather feedback asynchronously
- Return to `/speckit.design-iterate` with consolidated feedback
- Iterate screen-by-screen based on priority

**Implementation Sync**:
- If containers already exist in `apps/web`, notify developers of component changes
- Props/interfaces may have changed (check TypeScript errors)
- Re-run affected tasks from tasks.md if needed
