# Feature Design - Visual UI/UX Specification

**Purpose**: Create reusable presentational components in `packages/ui` following component architecture from plan.md, create mock containers with sample data in `apps/design-system`, iterate visually until approved.

**Prerequisites**: spec.md, plan.md (with Component Architecture section for UI projects) OR arch.md (preferred for UI Architecture), global design system exists

---

## Workflow

### 1. Setup & Load Context
**Run prerequisites script**: `.specify/scripts/bash/check-prerequisites.sh --json` from repo root
- Parse `FEATURE_DIR` (absolute path to feature directory)
- Parse `AVAILABLE_DOCS` list (which documents exist for this feature)
- All paths must be absolute

**Load feature context** from FEATURE_DIR:
- **Required**: `spec.md` (user stories, requirements)
- **Required**: `plan.md` (tech stack, architecture, component architecture)
- **Optional**: `arch.md` (if exists in AVAILABLE_DOCS - preferred source for architecture)
- **Optional**: `data-model.md` (if exists in AVAILABLE_DOCS)

**Load design system context**:
- Read `.specify/design-system/tokens.md` (design tokens)
- Read `packages/ui/src/components/index.ts` (available primitives)

**Load component architecture**:
- **IF arch.md EXISTS**: Load "User Interface Architecture" section from arch.md (preferred):
  - Screen Inventory (screens, navigation paths, user stories)
  - User Flow Map (navigation patterns, entry/exit points)
  - Information Architecture (content hierarchy, organization)
  - Module/Component Architecture (hierarchy, responsibilities, composition)
  - State Management Strategy (application/UI/URL/external state, flow patterns)
  - Interaction Patterns (user interactions, state transitions, feedback)
- **ELSE**: Load "Component Architecture" section from plan.md (fallback):
  1. Screen Inventory (screens, routes, user stories)
  2. Component Hierarchy (per screen trees)
  3. Container/Presenter Mapping (where each component lives)
  4. State Management Strategy (global/component/URL state)
  5. Data Flow Architecture (props down, callbacks up)
  6. Composition Patterns (prop drilling vs context, etc.)
- **IF BOTH MISSING**: SKIP architecture-based steps (API/CLI project or no UI)
- Use loaded architecture to guide component creation

### 2. Component Reusability Assessment

**Before creating components**:

1. Read `packages/ui/src/components/index.ts` - check for existing similar components
2. Use shadcn MCP if needed: `mcp__shadcn__search_items_in_registries`, `mcp__shadcn__get_item_examples_from_registries`
3. Categorize each component:
   - **Reuse**: Existing component works as-is
   - **Extend**: Compose/wrap existing component
   - **Create common**: New, will be used in 2+ features → `packages/ui/src/components/`
   - **Create feature-specific**: New, only this feature → `packages/ui/src/features/[feature-name]/`

**Build categorization table** (for design.md):

| Component | Location | Reusability Rationale |
|-----------|----------|----------------------|
| FileUpload | `components/` | Used in 3+ features |
| DesktopWorkspace | `features/[feature]/` | Feature-specific screen |

### 3. Create Components

**Use component architecture** from plan.md (if exists):
- Follow component hierarchy (containers vs presenters, nesting levels)
- Follow container/presenter mapping (where to place each component)
- Use state management strategy (define props interfaces to receive state)
- Apply data flow patterns (IDs in props, callbacks for events)
- Match composition patterns (how components nest/compose)

**Common components** (if any) → `packages/ui/src/components/`:
- Create `ComponentName.tsx` with generic, reusable props
- Export from `packages/ui/src/components/index.ts`

**Feature-specific presenters** → `packages/ui/src/features/[feature-name]/`:
- Create separate files: `Screen1.tsx`, `Screen2.tsx`, etc.
- Import from `@centrid/ui/components` (primitives + common components)
- Pure presentational (props for data, callbacks for events)
- Use Tailwind tokens, NO data fetching
- Create `index.ts` and export all components
- Update `packages/ui/src/features/index.ts` to export feature

**VALIDATION CHECKPOINT**:
- [ ] Common components (if any) in `packages/ui/src/components/` and exported
- [ ] Feature components in `packages/ui/src/features/[feature-name]/`
- [ ] NO components in `apps/design-system/components/` (except showcase wrappers)
- [ ] Feature exported from `packages/ui/src/features/index.ts`

**If validation fails**: STOP - fix locations before proceeding to Step 4

### 4. Create Design System Showcase
**Location**: `apps/design-system/pages/[feature-name]/`

1. **Create mock containers** in `apps/design-system/components/[feature-name]/`:
   - Barebones container components with mock data (NOT in packages/ui)
   - Wrap presenters from `@centrid/ui/features` with sample props
   - Example: `WorkspaceContainerMock.tsx` provides mock files/handlers to `DesktopWorkspace`
   - NO business logic, NO real services - just hardcoded sample data for visual design

2. **Create shared screens list**: `screens.ts`
3. **Create feature index**: `index.tsx` (overview with links to screens)
4. **Create screen showcases**: `screen-1.tsx`, `screen-2.tsx`, etc.
   - Import mock containers from `apps/design-system/components/[feature-name]/`
   - Use `DesignSystemFrame` wrapper for navigation
   - Add state controls (toggle loading, error, etc.)
5. **Update main index**: Add feature card to `apps/design-system/pages/index.tsx`

### 5. Visual Iteration & Interaction Documentation

**Start dev server**: `npm run design:dev` (localhost:3001)

**For each screen sequentially**:

1. **Navigate & Screenshot**:
   - Navigate to `http://localhost:3001/[feature-name]/[screen-route]`
   - Screenshot desktop (1440×900) + mobile (375×812)
   - Save to `apps/design-system/public/screenshots/[feature-name]/`

2. **Document interactions & composition** (while reviewing):
   - Component composition: Screen component + common/feature components used
   - User actions: Click (buttons, links), Type (inputs), Drag (files, items), Hover (tooltips), Scroll
   - What happens: Navigate, open modal, submit form, trigger validation, show/hide elements
   - Navigation: From which screen(s), to which screen(s)

3. **Verify design principles** (quick check):
   - Visual hierarchy: Primary action obvious?
   - Consistency: Matches design system tokens?
   - Spacing: Uses design system scale (8px grid)?
   - Color: Purposeful, semantic usage?
   - States: Loading/error/empty designed?
   - Reference: `.specify/DESIGN-PRINCIPLES.md` (10 levers)

4. **Present to user**:
   - Show screenshots + interaction summary
   - Ask: "Review [Screen Name]. Provide feedback or 'approved' to continue."

5. **Process response**:
   - **If approved**: Update design.md (screen mapping + composition + interactions), save, next screen
   - **If feedback**: Update component, re-screenshot, re-document, loop

6. **After all screens approved**:
   - Proceed to Step 5.5 for testable user flows documentation
   - Then proceed to validation gate

### 5.5. Document Testable User Flows

**Purpose**: Create detailed, automated-testable flows that map to acceptance criteria from spec.md

**Process**:

1. **Review acceptance criteria** from spec.md:
   - Read all User Stories with priorities (P1, P2, P3)
   - Read all Acceptance Scenarios (Given/When/Then)
   - Read Success Criteria (SC-001, SC-002, etc.)
   - Read Edge Cases

2. **Map flows to criteria**:
   - For each high-priority acceptance criterion (P1, P2), create a testable flow
   - Identify which screens are involved in the flow
   - List specific components used at each step
   - Define Playwright selectors using `data-testid` attributes (recommended pattern)
   - Document expected behavior at each step

3. **Document error scenarios** for each flow:
   - Identify error cases from spec.md Edge Cases section
   - Document expected error messages (from FR requirements if specified)
   - Map error states to screen designs (Loading, Error, Empty, Success states)
   - Define test data that triggers each error (invalid files, network errors, etc.)

4. **Create detailed flow documentation**:
   - Follow User Flows template structure from design-template.md
   - For each step, include:
     - User action (Click, Type, Fill, Upload, Drag, etc.)
     - Component name and source file
     - Playwright selector (prefer `data-testid`)
     - Expected immediate behavior
     - Playwright command syntax
   - Map each flow to its acceptance criterion ID
   - Define test data (valid cases + invalid cases for errors)
   - List success criteria from spec.md

5. **Create navigation map**:
   - Visual overview showing how flows connect screens
   - Include primary flows (P1, P2) and key secondary flows (P3)

6. **Validation before proceeding**:
   - All P1 user stories have corresponding flows
   - All flows map to acceptance criteria from spec.md
   - All flows have error scenarios documented
   - All flows have Playwright selectors
   - All flows have test data defined

### 6. Final Validation Gate

**MANDATORY before creating design.md**: Verify component architecture integrity.

**Run validation**:

1. Verify common components (if any): `ls packages/ui/src/components/*.tsx` and check exports
2. Verify feature components: `ls packages/ui/src/features/[feature-name]/*.tsx`
3. Verify global export: `grep "[feature-name]" packages/ui/src/features/index.ts`
4. Test imports in showcase:
   - `import { CommonComponent } from '@centrid/ui/components'`
   - `import { Screen1 } from '@centrid/ui/features'`
   - No errors, components render

**Design principles check** (`.specify/DESIGN-PRINCIPLES.md`):
- [ ] Visual hierarchy: Primary actions prominent, clear focal points
- [ ] Consistency: Design tokens used throughout (no arbitrary values)
- [ ] Information density: Appropriate for feature type (data-dense vs. content-focused)
- [ ] Color with purpose: Semantic colors (success/error/warning) used correctly
- [ ] Spacing rhythm: 8px grid system maintained
- [ ] Feedback & affordance: All interactive elements have hover/focus/active states
- [ ] Mobile-first responsive: Layouts intentional at all breakpoints
- [ ] States coverage: Loading, error, empty, success states designed

**Report**:
```
✅ Common: [N] components in packages/ui/src/components/ (if any)
✅ Feature: [N] components in packages/ui/src/features/[feature-name]/
✅ Exports: All components exported from index.ts files
✅ Imports: Verified in showcase, no errors
✅ Screenshots: [N] saved to apps/design-system/public/screenshots/
✅ Reusability: Categorization table complete
✅ Design Principles: Verified against 10 levers

Status: READY for design.md
```

**If validation fails**: STOP, fix issues, re-validate before Step 7

### 7. Document Design Spec

**Use template**: `.specify/templates/design-template.md`

**Create**: `specs/[FEATURE]/design.md`

**Template sections to fill**:

1. **Overview**: Visual design approach
2. **Component Architecture**: Reusability assessment, component categorization, mapping table
3. **User Flows**: CRITICAL - Detailed testable flows from Step 5.5:
   - Each flow with component references, Playwright selectors, test data
   - Maps to acceptance criteria from spec.md
   - Includes success criteria and error scenarios
   - Navigation map showing screen connections
4. **Screens Designed**: For each screen:
   - Purpose, layout, states, screenshots
   - **Component Composition**: Screen component + common/feature components used
   - **User Interactions**: Click, Type, Drag, Hover, Scroll actions and outcomes
   - **Flow Connections**: From/to which screens
5. **Design Tokens Used**: Colors, typography, spacing from global design system
6. **Design Principles Verification**: Checklist of 10 levers from `.specify/DESIGN-PRINCIPLES.md`
7. **Implementation Notes**: Container pattern, import paths, key principles
8. **Validation Checklist**: All gates passed, design approved

**Reference**: See `.specify/templates/design-template.md` for complete structure

### 8. Report Summary

**Validation** ✅
- Components: [N] common + [N] feature in correct locations, all exported
- Reusability categorization documented

**Deliverables** ✅
- Presenters: [N] common + [N] feature-specific in `packages/ui`
- Mock Containers: [N] in `apps/design-system/components/[feature-name]/` (with sample data)
- Showcase: [N] screens at `apps/design-system/pages/[feature-name]/`
- Screenshots: [N] desktop + [N] mobile
- design.md: Architecture, User Flows, Screen Interactions, Mapping table

**Interactions Documented** ✅
- User actions documented per screen (Click, Type, Drag, Hover, Scroll)
- Navigation flows mapped (primary + secondary paths)
- Screen connections documented

**Testable User Flows Documented** ✅
- [N] flows mapping to acceptance criteria from spec.md
- Playwright selectors defined (using data-testid)
- Error scenarios and test data documented
- Success criteria mapped from spec.md

**Ready** ✓
- Import paths verified
- Ready for `/speckit.tasks` (implementation)
- Ready for `/speckit.verify-ui` (acceptance testing after implementation)

---

## Key Rules

**Reusability**: Check existing → Common (2+ features) → Feature-specific (1 feature)
- Common → `packages/ui/src/components/`
- Feature → `packages/ui/src/features/[feature-name]/`

**DO**:
- ✅ Check existing before creating
- ✅ Reuse/extend existing components
- ✅ Import from `@centrid/ui/components`
- ✅ Use Tailwind tokens, props for data, pure presentational
- ✅ Document reusability (categorization table)

**DON'T**:
- ❌ Create presenters in `apps/web` or `apps/design-system/components/`
- ❌ Duplicate existing components
- ❌ Add data fetching, state management, or API calls to presenters
- ❌ Make feature-specific when pattern is reusable

**Mock Containers** (design-system only):
- ✅ Create in `apps/design-system/components/[feature-name]/` for visual showcase
- ✅ Use hardcoded sample data (NO real services)
- ✅ Wrap presenters to demonstrate high-fidelity designs
