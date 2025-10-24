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
- Read `plan.md` from FEATURE_DIR (architecture context)
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
4. **Present to user**:
   - Show both desktop + mobile screenshots
   - Show previous version screenshots for comparison (if available)
   - Ask: "Review [Screen Name]. Provide feedback, type 'approved' to finalize, or 'skip' to move to next screen."

#### 3.3. Feedback Loop

**Process user response**:

- **If "approved" / "done" / "finalize"**:
  * Archive old screenshots (rename with `-archived-[timestamp]` suffix)
  * Update design.md:
    - Screen-to-Component Mapping table with new screenshot paths
    - Add iteration note under screen description: `**Iteration [DATE]**: [brief summary of changes]`
  * Save design.md (atomic write)
  * Move to next selected screen (or exit if last)

- **If "skip" / "next"**:
  * Don't update design.md (keep previous version)
  * Move to next selected screen

- **If feedback provided**:
  * **Capture feedback context**: What changed? Why? (for iteration notes)
  * **Update component**: Edit file in `packages/ui/src/features/[feature-name]/`
  * **Wait for auto-reload**: ~1-2 seconds for design-system to refresh
  * **Re-screenshot**: Same screen, same viewports, increment version suffix if major change
  * **Present updated screenshots**: Show new vs previous
  * **Loop**: Ask for more feedback or approval
  * **Track iterations**: Maintain change log in memory for final design.md update

#### 3.4. After Screen Approved/Skipped

**Incremental design.md update**:
- Update Screen-to-Component Mapping table with finalized screenshot paths
- Add iteration note under relevant screen section:
  ```markdown
  **Iteration 2024-10-23**: Improved spacing in file tree, added hover states to markdown editor toolbar
  ```
- Preserve all other sections unchanged
- Atomic write to FEATURE_DIR/design.md

### 4. Completion Summary

**After all selected screens processed**:

Report to user:

```
✅ Design iteration complete:
   - Screens iterated: [N]
   - Components updated: [list of .tsx files modified]
   - New screenshots: [count] desktop + [count] mobile
   - Previous screenshots: Archived with timestamp
   - design.md: Updated with iteration notes

📸 Screenshot versions:
   - [Screen Name]: v1 → v3 (2 iterations)
   - [Screen Name]: v2 → v2 (approved as-is)

📝 Changes summary:
   [Brief bullet list of what changed per screen]

📂 Updated files:
   - packages/ui/src/features/[feature-name]/[Component].tsx
   - specs/[FEATURE]/design.md
   - apps/design-system/public/screenshots/[feature-name]/

Next steps:
   → If implementation ongoing: Containers may need updates in apps/web
   → If not started: Run /speckit.tasks to regenerate with updated designs
   → To iterate more: Run /speckit.design-iterate again
```

---

## Validation Rules

**Before iteration**:
- ✅ design.md must exist with Screen-to-Component Mapping table
- ✅ Components must exist in packages/ui/src/features/[feature-name]/
- ✅ Design showcase must be accessible at localhost:3001

**During iteration**:
- ✅ Only update selected screens (don't modify others)
- ✅ Preserve component architecture (no file renames without user approval)
- ✅ Archive old screenshots (don't delete)
- ✅ Atomic writes after each screen approval

**After iteration**:
- ✅ design.md Screen-to-Component Mapping table is current
- ✅ All new screenshots referenced in design.md exist on disk
- ✅ Iteration notes added to design.md with dates
- ✅ Old screenshots archived (not lost)

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
