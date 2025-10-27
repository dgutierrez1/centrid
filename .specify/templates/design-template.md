# Design Specification: [FEATURE NAME]

**Feature**: `[###-feature-name]`
**Design Date**: [DATE]
**Status**: Draft
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`, implementation plan from `/specs/[###-feature-name]/plan.md`, and (if exists) UX specification from `/specs/[###-feature-name]/ux.md`

**Note**: This template is filled in by the `/speckit.design` command. See `.claude/commands/speckit.design.md` for the execution workflow. If ux.md exists, component specifications and flows are loaded from there; otherwise, they're created during the design process.

## Overview

<!--
  ACTION REQUIRED: Brief description of the feature UI/UX approach.
  Focus on visual design decisions and user interaction patterns.
-->

[Brief description of the feature's visual design approach and key interaction patterns]

## Component Architecture

<!--
  REUSABILITY RULE: Check existing → Common (2+ features) → Feature-specific (1 feature)
  - Common → packages/ui/src/components/
  - Feature → packages/ui/src/features/[feature-name]/
-->

### Component Reusability Assessment

**Existing components checked**:
- [Component] - ✅ Reused / ⚡ Extended / ❌ N/A

**Component categorization**:

| Component | Location | Reusability Rationale |
|-----------|----------|----------------------|
| FileUpload | `components/` | Used in 3+ features |
| Screen1 | `features/[feature]/` | Feature-specific screen |

**Created**:

Common (if any) in `packages/ui/src/components/`:
- [CommonComponent].tsx - [Why cross-feature reusable]

Feature-specific in `packages/ui/src/features/[feature-name]/`:
- Screen1.tsx, Screen2.tsx - [Purpose]

**Import paths**:
- Common: `import { X } from '@centrid/ui/components'`
- Feature: `import { Y } from '@centrid/ui/features'`

### Design System Showcase

**Location**: `apps/design-system/pages/[feature-name]/`

**Routes**:
- http://localhost:3001/[feature-name]/ (feature overview + architecture)
- http://localhost:3001/[feature-name]/components (component library with all states)
- http://localhost:3001/[feature-name]/[component]-states (detailed state showcase for complex components)
- http://localhost:3001/[feature-name]/screen-1 (screen showcase with controls)
- http://localhost:3001/[feature-name]/screen-2
- http://localhost:3001/[feature-name]/screen-3

**Structure**:
- `index.tsx` - Feature overview with screens grid and component architecture list
- `components.tsx` - Component library showing individual components with all states
- `[component]-states.tsx` - Comprehensive state variations for complex components (optional)
- `[screen-route].tsx` - Screen showcases with design controls and implementation notes
- `screens.ts` - Shared screen metadata used by DesignSystemFrame navigation

### Component Library Pages

<!--
  CRITICAL: Component library pages allow viewing/testing components independently.
  This is essential for development - developers reference these pages when using components.
-->

**Component Library** (`components.tsx`):
Document each reusable component with its states:

| Component | States Shown | Purpose |
|-----------|-------------|---------|
| ApprovalCard | Default, Multiple files, Delete action, Inactive | File change approval banner |
| ConflictModal | Open with conflicting files | Modal for resolving edit conflicts |
| ContextReferenceBar | Few items, Many items, Max limit | Horizontal scrollable context pills |
| ChatMessage | User message, Agent message, Tool calls, Citations | Message display with interleaved content |
| [Add other components] | [States] | [Purpose] |

**State Pages** (`[component]-states.tsx`):
For complex components with many state combinations, create dedicated pages:

| Page | Component | States Documented |
|------|-----------|------------------|
| `chat-states.tsx` | ChatView, ChatListPanel, FileAutocomplete | Streaming states (idle → user message → streaming → tool progress → complete), List states (empty, loading, with chats, search results), Autocomplete states (closed, open empty, searching, with results) |
| [Add other state pages] | [Components] | [State matrix] |

### Screen-to-Component Mapping

<!--
  CRITICAL: This table is used by /speckit.tasks to generate implementation tasks.
  Each row maps a screen to its component file and screenshots.
  Ensure all paths are accurate and screenshots exist.
-->

| Screen Name | Component File | Showcase Route | Screenshots |
|-------------|---------------|----------------|-------------|
| [Screen 1 Name] | `Screen1.tsx` | `/[feature-name]/screen-1` | `01-screen-1-desktop.png`, `01-screen-1-mobile.png` |
| [Screen 2 Name] | `Screen2.tsx` | `/[feature-name]/screen-2` | `02-screen-2-desktop.png`, `02-screen-2-mobile.png` |
| [Screen 3 Name] | `Screen3.tsx` | `/[feature-name]/screen-3` | `03-screen-3-desktop.png`, `03-screen-3-mobile.png` |

### Primitives Used (from @centrid/ui/components)

<!--
  ACTION REQUIRED: List all shadcn/ui primitives used in this feature.
  This helps track component dependencies.
-->

- Button (variants: default, secondary, ghost)
- Input (with validation states)
- Card (for containers)
- Badge (for status indicators)
- Dialog (for modals)
- [Add other primitives used]

## Test Prerequisites

<!--
  CRITICAL: Used by /speckit.verify-ui to setup test environment before running flows.
  If your feature requires any setup (auth, test data, etc), document steps here.
  Keep steps concise and executable.
-->

**Prerequisites** (if any):
1. [Step to setup - e.g., "Login with test@centrid.local / TestPassword123!"]
2. [Another step - e.g., "Navigate to /workspace"]

**Skip this section if**: Feature has no prerequisites (works without auth, test data, etc)

---

## User Flows

<!--
  CRITICAL: These flows are used by /speckit.verify-ui for automated acceptance testing.

  IF ux.md EXISTS:
  - Flows are already documented in ux.md with step-by-step interactions, props, callbacks
  - Reference ux.md flows here and add Playwright data-testid selectors
  - Ensure all ux.md flows are covered with screenshots

  IF NO ux.md:
  - Create flows from scratch during design process

  Each flow must:
  - Map to acceptance criteria from spec.md
  - Reference specific components and routes
  - Include Playwright selectors (use data-testid attributes)
  - Define success criteria
  - Document error scenarios
  - Include test data (valid + invalid cases)
-->

### Flow 1: [Descriptive Flow Name]

**Maps to**: [User Story/Acceptance Criterion ID from spec.md - e.g., "User Story 1", "SC-001"]

**Goal**: [What user accomplishes - should match acceptance criteria]

**Priority**: [P1/P2/P3 - from spec.md user story]

**Starting Route**: `/[production-route]` ([Screen Name])

**Steps**:

1. **Action**: [User action - Click, Type, Fill, Drag, Upload, etc.]
   - **Component**: `ComponentName` from `ScreenX.tsx`
   - **Selector**: `[data-testid="element-id"]` (preferred) or `.class-name`
   - **Expected Behavior**: [What happens immediately after action]
   - **Playwright**: `await page.click('[data-testid="element-id"]')`

2. **Action**: [Next user action]
   - **Component**: `ComponentName` from `ScreenY.tsx`
   - **Selector**: `[data-testid="input-field"]`
   - **Expected Behavior**: [What happens]
   - **Playwright**: `await page.fill('[data-testid="input-field"]', 'test value')`

3. **Action**: [Next user action]
   - **Component**: `ComponentName`
   - **Selector**: `[data-testid="submit-button"]`
   - **Expected Behavior**: [Loading state appears, then success state]
   - **Playwright**: `await page.click('[data-testid="submit-button"]')`

[Continue for all steps in the flow...]

**Success Criteria** (from spec.md):
- ✅ [Measurable outcome 1 - e.g., "Action completes in < 5 seconds"]
- ✅ [Measurable outcome 2 - e.g., "Result appears in sidebar"]
- ✅ [Measurable outcome 3 - e.g., "Success message displayed"]

**Error Scenarios**:
- **[Error Type]**: [Expected error message and UI state - e.g., "Invalid file type: 'Only PDF, TXT, MD supported'"]
- **[Error Type]**: [Expected error message - e.g., "File too large: 'File must be under 10MB'"]
- **[Error Type]**: [Expected error message - e.g., "Network error: Retry button appears"]

**Test Data**:
- **Valid**: [Sample data that should succeed - e.g., "test-document.pdf (2MB)"]
- **Invalid Type**: [Sample data for error scenario - e.g., "test.exe"]
- **Invalid Size**: [Sample data for error scenario - e.g., "large-file.pdf (15MB)"]

**Screenshots**:
- Success: `flow-1-success-desktop.png`, `flow-1-success-mobile.png`
- Error: `flow-1-error-[type]-desktop.png`

---

### Flow 2: [Next Flow Name]

**Maps to**: [User Story/SC ID from spec.md]

**Goal**: [User goal]

**Priority**: [P1/P2/P3]

**Starting Route**: `/[route]` ([Screen Name])

**Steps**:
[Same detailed structure as Flow 1...]

**Success Criteria** (from spec.md):
- ✅ [Criterion 1]
- ✅ [Criterion 2]

**Error Scenarios**:
- **[Error Type]**: [Expected message]

**Test Data**:
- **Valid**: [Data]
- **Invalid**: [Data]

---

[Add additional flows - typically 3-5 primary flows per feature]

### Navigation Map

<!--
  Visual overview of how all flows connect screens together
-->

```
[Starting Screen]
    ├─ Flow 1: [Action] → [Screen 2] → [Action] → [Screen 3] ✓
    ├─ Flow 2: [Action] → [Screen 4] → [Action] → [Screen 2] ✓
    └─ Flow 3: [Action] → [Modal] → [Confirm] → [Screen 5] ✓
```

## Screens Designed

<!--
  ACTION REQUIRED: For each screen, describe purpose, layout, components, states, and interactions.
-->

### 1. [Screen 1 Name]

**Showcase Route**: `/[feature-name]/screen-1`
**Production Route**: `/actual-production-route`

**Purpose**: [What this screen accomplishes for the user]

**Layout**: [Single column / Two-panel / Grid / etc.]

**Component Composition**:
- **This screen**: `Screen1.tsx` (from `@centrid/ui/features`)
- **Uses common**: Button, Input, Card (from `@centrid/ui/components`)
- **Uses feature**: [SharedComponent] (from same feature if applicable)

**User Interactions**:
- **Click** [Button/Link]: [What happens - navigate, open modal, submit]
- **Type** [Input field]: [Validation, auto-complete, search]
- **Drag** [Element]: [Reorder, upload]
- **Hover** [Element]: [Tooltip, preview]
- **Scroll** [Area]: [Load more, infinite scroll]

**States**: Default, Loading, Error, Empty, Success

**Screenshots**: `01-screen-1-desktop.png`, `01-screen-1-mobile.png`

**Flow Connections**:
- From: [Previous screen] via [Action]
- To: [Next screen(s)] via [Action(s)]

---

### 2. [Screen 2 Name]

**Showcase Route**: `/[feature-name]/screen-2`
**Production Route**: `/actual-production-route`

**Purpose**: [What this screen accomplishes]

**Layout**: [Layout type]

**Component Composition**:
- **This screen**: `Screen2.tsx` (from `@centrid/ui/features`)
- **Uses common**: [List common components] (from `@centrid/ui/components`)
- **Uses feature**: [SharedComponent] (from same feature if applicable)

**User Interactions**:
- **Click** [Element]: [Outcome]
- **Type** [Field]: [Validation/behavior]

**States**: Default, Loading, Error, Empty, Success

**Screenshots**: `02-screen-2-desktop.png`, `02-screen-2-mobile.png`

**Flow Connections**:
- From: [Screen] via [Action]
- To: [Screen(s)] via [Action(s)]

---

[Repeat for each additional screen]

## Design Tokens Used

<!--
  ACTION REQUIRED: Document which design tokens from .specify/design-system/tokens.md
  were used in this feature. This ensures consistency with global design system.
-->

### Colors

**Primary Palette**:
- `primary-600` (#[HEX]) - [Usage: buttons, links, etc.]
- `primary-700` (#[HEX]) - [Usage: hover states]

**Semantic Colors**:
- `success-500` (#[HEX]) - [Usage: success states]
- `warning-500` (#[HEX]) - [Usage: warnings]
- `error-500` (#[HEX]) - [Usage: errors]

**Neutral Palette**:
- `gray-50` - [Usage: backgrounds]
- `gray-900` - [Usage: text]

### Typography

**Font Sizes**:
- `text-4xl` (36px) - [Usage: H1 headings]
- `text-2xl` (24px) - [Usage: H2 headings]
- `text-base` (16px) - [Usage: body text]
- `text-sm` (14px) - [Usage: labels, captions]

**Font Weights**:
- `font-bold` - [Usage: headings]
- `font-medium` - [Usage: labels]
- `font-normal` - [Usage: body]

### Spacing

**Common Spacing Values**:
- `p-6` (24px) - [Usage: card padding]
- `gap-4` (16px) - [Usage: element spacing]
- `mb-8` (32px) - [Usage: section spacing]

### Border Radius

- `rounded-md` (6px) - [Usage: inputs, buttons]
- `rounded-lg` (8px) - [Usage: cards]
- `rounded-full` - [Usage: avatars, badges]

### Shadows

- `shadow-sm` - [Usage: cards at rest]
- `shadow-md` - [Usage: dropdowns]
- `shadow-lg` - [Usage: modals]

## Design Principles Verification

<!--
  CRITICAL: Verify against .specify/DESIGN-PRINCIPLES.md (10 levers for perfect UI).
  These principles ensure cohesive, beautiful, usable interfaces.
-->

- [ ] **Visual Hierarchy**: Primary actions prominent (size, color, weight, position), clear focal points, no competing elements
- [ ] **Consistency**: Design tokens used throughout (spacing, colors, typography), no arbitrary values, predictable patterns
- [ ] **Information Density**: Appropriate for feature type (data-dense vs. content-focused), progressive disclosure where needed
- [ ] **Color with Purpose**: Semantic colors correct (success=green, error=red, warning=yellow), brand color used sparingly
- [ ] **Typography Hierarchy**: Clear heading levels (H1 > H2 > H3 > Body), scannable text structure, minimum 16px body text
- [ ] **Spacing Rhythm**: 8px grid system maintained, consistent gaps between similar elements, mathematical spacing
- [ ] **Feedback & Affordance**: All interactive elements have hover/focus/active/disabled states, transitions smooth (150-250ms)
- [ ] **Mobile-First Responsive**: Layouts intentional at all breakpoints (not just "cramped desktop"), touch targets 44x44px minimum
- [ ] **Accessibility**: Contrast ratios meet WCAG AA (4.5:1 text, 3:1 UI), keyboard navigation logical, focus indicators visible
- [ ] **States Coverage**: Loading, error, empty, success states designed and intentional

**Reference**: See `.specify/DESIGN-PRINCIPLES.md` for detailed guidance on each lever.

## Implementation Notes

<!--
  CRITICAL: Essential handoff information for /speckit.tasks and /speckit.implement.
  Detailed implementation tasks will be generated by /speckit.tasks.
-->

**Container Pattern**: Implementation creates containers in `apps/web/src/components/[feature]/` that wrap designed components with business logic (hooks, state, API calls).

**Import Paths**:
- Common components: `import { FileUpload } from '@centrid/ui/components'`
- Feature components: `import { Screen1, Screen2 } from '@centrid/ui/features'`

**Key Principle**: Designed components are pure presentational. Containers add all business logic, data fetching, and state management.

## Validation Checklist

<!--
  VALIDATION GATE: All items must pass before design.md is considered complete.
  This checklist is verified by /speckit.design in Step 6.
-->

### Component Location ✅

- [ ] All `.tsx` files exist in `packages/ui/src/features/[feature-name]/`
- [ ] NO files in `apps/design-system/components/` (except showcase wrappers)
- [ ] Feature `index.ts` exists and exports all components
- [ ] Global `packages/ui/src/features/index.ts` exports this feature

### Import Verification ✅

- [ ] Showcase pages successfully import from `@centrid/ui/features`
- [ ] No import errors in design-system app
- [ ] Components render correctly in showcase

### Screenshots ✅

- [ ] All screenshots saved to `apps/design-system/public/screenshots/[feature-name]/`
- [ ] Desktop versions: 1440×900 viewport
- [ ] Mobile versions: 375×812 viewport
- [ ] File naming convention: `NN-screen-name-{desktop|mobile}.png`

### Documentation ✅

- [ ] Screen-to-Component Mapping table complete and accurate
- [ ] All component paths verified
- [ ] Design tokens documented
- [ ] Design principles verified (10 levers from `.specify/DESIGN-PRINCIPLES.md`)
- [ ] Implementation guide provided

---

**Design Approved**: [DATE]
**Approved By**: [NAME/ROLE]

**Next Steps**:
- Run `/speckit.tasks` to generate implementation tasks
- Tasks will use Screen-to-Component Mapping to create integration tasks
- Run `/speckit.implement` to execute implementation with designed components
