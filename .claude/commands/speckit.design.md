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
- **Optional**: `ux.md` (if exists in AVAILABLE_DOCS - PREFERRED source for detailed flows)
- **Optional**: `arch.md` (if exists in AVAILABLE_DOCS - fallback for architecture if no ux.md)
- **Optional**: `data-model.md` (if exists in AVAILABLE_DOCS)

**Load design system context**:
- Read `.specify/design-system/tokens.md` (design tokens)
- Read `packages/ui/src/components/index.ts` (available primitives)

**Load UX flows & component architecture**:
- **IF ux.md EXISTS**: Load detailed UX specification from ux.md (PREFERRED):
  - Screen-by-Screen UX Flows (step-by-step interactions with components, props, callbacks)
  - Component Specifications (props interfaces, states to design)
  - Interaction Patterns (common behaviors, keyboard shortcuts)
  - Layout & Spatial Relationships (desktop + mobile diagrams, spacing)
  - State Management Requirements (component/global/URL state)
- **ELSE IF arch.md EXISTS**: Load "User Interface Architecture" section from arch.md (fallback):
  - Screen Inventory (screens, navigation paths, user stories)
  - User Flow Map (navigation patterns, entry/exit points)
  - Module/Component Architecture (hierarchy, responsibilities, composition)
  - State Management Strategy (application/UI/URL/external state, flow patterns)
- **ELSE**: Load "Component Architecture" section from plan.md (last resort):
  1. Screen Inventory (screens, routes, user stories)
  2. Component Hierarchy (per screen trees)
  3. Container/Presenter Mapping (where each component lives)
  4. State Management Strategy (global/component/URL state)
- **IF ALL MISSING**: SKIP architecture-based steps (API/CLI project or no UI)
- Use loaded flows/architecture to guide component creation

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

**Use UX specification from ux.md** (if exists - PREFERRED):
- Follow component specifications (props interfaces, states to design)
- Use exact prop names and types from ux.md
- Design all states listed (default, loading, error, empty, etc.)
- Follow layout diagrams (desktop + mobile spacing)
- Implement interaction patterns documented

**ELSE use component architecture** from arch.md or plan.md (fallback):
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

**4.1. Organize Components by Reusability**

Before creating showcase pages, categorize all components:

**Common Components** (`packages/ui/src/components/`):
- List components that are reusable across multiple features
- Examples: ChatMessage, FileAutocomplete, TypingIndicator

**Feature Components** (`packages/ui/src/features/[feature-name]/`):
- List components specific to this feature
- Examples: ChatView, ChatListPanel, ApprovalCard, ConflictModal

**Screen Components** (`packages/ui/src/features/[feature-name]/`):
- List full screen/layout components
- Examples: DesktopWorkspace, MobileWorkspace, ChatInterface

**4.2. Create Mock Data**

In `apps/design-system/components/[feature-name]/`:
- Create `mockData.ts` - Centralized mock data for all showcase pages
- Create mock containers (if needed) - Barebones wrappers with sample data
- NO business logic, NO real services - just hardcoded sample data

**4.3. Create Screens List**

Create `screens.ts` with screen metadata:
```typescript
export const screens = [
  {
    id: 'screen-id',
    title: '01 - Screen Name',
    route: '/[feature-name]/screen-route',
    description: 'Brief description of what this screen shows',
  },
  // ... more screens
] as const;
```

**4.4. Create Feature Index** (`index.tsx`)

Structure:
- **Feature Overview** - Description of the feature and its purpose
- **Screens Designed** - Grid of cards linking to each screen showcase
- **Component Architecture** - Two-section breakdown:
  - Common Components (if any) - List with descriptions
  - Feature Components - List with descriptions
- Add link to component library page: `/[feature-name]/components`

**4.5. Create Screen Showcase Pages**

For each screen, create `[screen-route].tsx`:
- Import mock data from `mockData.ts`
- Use `DesignSystemFrame` wrapper for navigation
- Add "Design Controls" section with state toggles:
  - Viewport switcher (Desktop 1440px / Mobile 375px)
  - State controls (loading, error, approval, etc.)
- Render screen component with mock props
- Add "Implementation Notes" section documenting:
  - Layout structure (panels, responsive behavior)
  - Key interactions (click, drag, keyboard shortcuts)
  - Mobile adaptations (bottom nav, single panel, touch targets)

**4.6. Create Component Library Pages**

**CRITICAL**: These pages allow viewing/testing components independently from screens.

Create `components.tsx` - Individual component showcase:
```typescript
// Structure:
// - Introduction section
// - For each reusable component:
//   - Component name & description
//   - Grid of state cards showing:
//     - Default state
//     - Loading state
//     - Error state
//     - Empty state
//     - Interactive states (hover, focus, disabled)
//     - Variants (sizes, colors, types)
```

Example sections:
- **ApprovalCard** - Single file, multiple files, delete action, inactive state
- **ConflictModal** - Modal with conflicting files list
- **ContextReferenceBar** - Few references, many references, max limit warning
- **ChatMessage** - Tool calls, citations, user/agent styling

Create `[component]-states.tsx` (if component has many states):
```typescript
// For complex components (ChatView, ChatListPanel, FileAutocomplete)
// Show comprehensive state matrix:
// - Idle, loading, streaming, complete
// - Empty, with data, search results
// - Open, closed, searching, no results
```

**4.7. Update Main Design System Index**

Add feature card to `apps/design-system/pages/index.tsx`:
```typescript
<Card>
  <CardHeader>
    <CardTitle>[Feature Name]</CardTitle>
    <CardDescription>[Feature description]</CardDescription>
  </CardHeader>
  <CardContent>
    <Link href="/[feature-name]">View designs →</Link>
  </CardContent>
</Card>
```

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

**Purpose**: Ensure detailed, automated-testable flows are ready for design.md

**IF ux.md EXISTS** (PREFERRED):
- Flows already documented in ux.md with:
  - Step-by-step interactions
  - Component references
  - Props and callbacks
  - Error scenarios with test data
  - Success criteria
- **Process**: Reference ux.md flows in design.md User Flows section
- **Add**: Playwright `data-testid` selectors to components during design
- **Validation**: Verify ux.md flows cover ALL user stories from spec.md (ALL priorities)

**ELSE** (if no ux.md - create flows from scratch):

1. **Review acceptance criteria** from spec.md:
   - Read ALL User Stories with ALL priorities (P1, P2, P3, P4, etc.)
   - Read all Acceptance Scenarios (Given/When/Then)
   - Read Success Criteria (SC-001, SC-002, etc.)
   - Read Edge Cases

2. **Map flows to criteria**:
   - For EVERY acceptance criterion (ALL priorities), create a testable flow
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
   - Include ALL flows (ALL priorities)

6. **Validation before proceeding**:
   - ALL user stories have corresponding flows (ALL priorities)
   - All flows map to acceptance criteria from spec.md
   - All flows have error scenarios documented
   - All flows have Playwright selectors
   - All flows have test data defined

### 6. Final Validation Gate

**MANDATORY before creating design.md**: Verify architecture alignment and component integrity.

**IF ux.md EXISTS - UX Coverage Check**:
1. Load ux.md Component Specifications section
2. For each component in ux.md:
   - [ ] Component created in packages/ui with matching name
   - [ ] Props interface matches ux.md specification
   - [ ] All states from ux.md designed (default, loading, error, etc.)
   - [ ] Screenshots exist for each state
3. Load ux.md Screen-by-Screen UX Flows section
4. For each screen in ux.md:
   - [ ] Screen designed in design.md
   - [ ] All components from flow exist in packages/ui
   - [ ] Layout matches ux.md diagrams (desktop + mobile)
   - [ ] Interaction patterns implemented

**Component Architecture Check** (always run):
1. Verify common components (if any): `ls packages/ui/src/components/*.tsx` and check exports
2. Verify feature components: `ls packages/ui/src/features/[feature-name]/*.tsx`
3. Verify global export: `grep "[feature-name]" packages/ui/src/features/index.ts`
4. Test imports in showcase:
   - `import { CommonComponent } from '@centrid/ui/components'`
   - `import { Screen1 } from '@centrid/ui/features'`
   - No errors, components render

**Component Pattern Check** (load from constitution.md if exists):
For each component in packages/ui:
- [ ] No data fetching (no fetch, useQuery, etc.)
- [ ] No API client imports (no supabase, axios, etc.)
- [ ] No auth logic (no useAuth, useUser)
- [ ] Props are data-in/callbacks-out
- [ ] Component is in correct location (common vs feature-specific)

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
✅ UX Coverage (if ux.md): [X/Y] components match specs, [X/Y] screens designed
✅ Common: [N] components in packages/ui/src/components/ (if any)
✅ Feature: [N] components in packages/ui/src/features/[feature-name]/
✅ Exports: All components exported from index.ts files
✅ Imports: Verified in showcase, no errors
✅ Component Patterns: [X/Y] components follow presentational pattern
✅ Screenshots: [N] saved to apps/design-system/public/screenshots/
✅ Reusability: Categorization table complete
✅ Design Principles: Verified against 10 levers

Status: READY / NEEDS WORK (with specific gaps listed)
```

**If validation fails**: STOP, list specific gaps, fix issues before Step 7

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

**Avoiding Duplication with ux.md**:

When ux.md exists (PREFERRED workflow):
- **ux.md defines**: Component props interfaces, states to design, interaction patterns, layout specifications
- **design.md documents**: Screenshots of those states, design tokens used, reusability categorization, component locations
- **Pattern**: design.md REFERENCES ux.md (no duplication of component specs)

**What design.md adds** (not in ux.md):
- ✅ Screenshots (desktop + mobile for all states)
- ✅ Design tokens used (which colors, fonts, spacing from design system)
- ✅ Reusability categorization (actual file paths created)
- ✅ Component locations (where files were created in packages/ui)
- ✅ Screen-to-component mapping table (for /speckit.tasks)

**What design.md should NOT duplicate** (already in ux.md):
- ❌ Component props interfaces (reference ux.md instead)
- ❌ States to design (show screenshots, don't re-list)
- ❌ Interaction patterns (reference ux.md, don't rewrite)
- ❌ Layout diagrams (ux.md has ASCII diagrams)

**DO**:
- ✅ Check existing before creating
- ✅ Reuse/extend existing components
- ✅ Import from `@centrid/ui/components`
- ✅ Use Tailwind tokens, props for data, pure presentational
- ✅ Document reusability (categorization table)
- ✅ Reference ux.md for component specs (when ux.md exists)

**DON'T**:
- ❌ Create presenters in `apps/web` or `apps/design-system/components/`
- ❌ Duplicate existing components
- ❌ Add data fetching, state management, or API calls to presenters
- ❌ Make feature-specific when pattern is reusable
- ❌ Duplicate ux.md specs in design.md (reference instead)

**Mock Containers** (design-system only):
- ✅ Create in `apps/design-system/components/[feature-name]/` for visual showcase
- ✅ Use hardcoded sample data (NO real services)
- ✅ Wrap presenters to demonstrate high-fidelity designs
