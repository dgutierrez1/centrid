# [Feature Name] - UX Specification

**Feature**: `[###-feature-name]`
**Date**: [DATE]
**Status**: Draft

**Purpose**: Define detailed user experience flows, interactions, layouts, and component behavior to bridge architecture and visual design.

**Prerequisites**: spec.md (requirements), arch.md (structure)

**Output**: Step-by-step flows, component prop specifications, interaction patterns, layout relationships ready for high-fidelity design.

---

## Overview

**Feature Summary**: [1-2 sentence description of the feature]

**User Goals**: [What users need to accomplish with this feature]

**Design Approach**: [High-level UX strategy - e.g., progressive disclosure, task-oriented flow, etc.]

---

## Screen-by-Screen UX Flows

<!--
  PRIMARY SECTION: Complete UX flows for each screen.
  For each screen, document:
  - Purpose, entry/exit points
  - Primary flow (happy path) with detailed steps
  - Error scenarios with recovery paths
  - Success criteria from spec.md
  - Component references (see Component Library below for detailed specs)
-->

### [Screen 1 Name]

**Purpose**: [What this screen accomplishes]

**Route**: `/[production-route]`

**Priority**: [P1/P2/P3 - from arch.md]

**Entry Points**:
- [How users navigate to this screen - e.g., "From main menu", "Deep link from notification"]

**Exit Points**:
- [Where users can navigate from this screen - e.g., "To file editor", "To settings"]

#### Primary Flow 1: [Flow Name - e.g., "Send Message with Streaming Response"]

**User Story**: [Reference from spec.md - e.g., US-002]

**Acceptance Criteria**: [Reference from spec.md - e.g., AC-002]

**Steps**:

1. **[User Action]** (e.g., "User types message in input field")

   - **Component**: `[ComponentName]` (see Component Library below for props)
   - **Interaction**: Type/Click/Drag/Hover/Scroll
   - **What Happens**: [Immediate response - e.g., "Character count updates, send button enables"]
   - **Data Required**: `{ field: Type }` (brief - full props in Component Library)
   - **Callback**: `on[Action](params)` - [What callback does]
   - **Visual Feedback**: [State change visible to user - e.g., "Button color changes, spinner appears"]

2. **[Next User Action]** (e.g., "User clicks Send button")

   - **Component**: `[ComponentName]` (see Component Library)
   - **Interaction**: [Type]
   - **What Happens**: [Response]
   - **Data Required**: `{ field: Type }`
   - **Callback**: `on[Action](params)` - [Purpose]
   - **Visual Feedback**: [State changes]

3. **[System Response]** (e.g., "System adds user message to conversation")

   - **Trigger**: [What triggered this - e.g., "onSendMessage callback fires"]
   - **What Happens**: [Result - e.g., "Message appears at bottom with timestamp"]
   - **Component Updated**: `[ComponentName]` (see Component Library)
   - **Data Flow**: [Brief description - e.g., "Valtio state → messages array → MessageStream renders"]

[Continue for all steps in the happy path - typically 5-15 steps]

**Error Scenarios**:

- **[Error Case 1]** (e.g., "Network request fails")
  - **Trigger**: [What causes this - e.g., "API timeout after 30s or 500 error"]
  - **Component**: `[ErrorComponent]` or error state in `[MainComponent]` (see Component Library)
  - **Display**: "[Exact error message text]"
  - **Recovery**: [How user can retry - e.g., "Retry button calls onSendMessage again"]
  - **Test Data**: [What input/condition triggers this - e.g., "Mock API with networkError: true"]

- **[Error Case 2]** (e.g., "Input validation fails")
  - **Trigger**: [What causes this]
  - **Component**: [Which component shows error]
  - **Display**: "[Error message]"
  - **Recovery**: [Recovery path]
  - **Test Data**: [Test condition]

**Success Criteria** (from spec.md):
- ✅ [Criterion 1 - e.g., "User message appears in conversation with timestamp"]
- ✅ [Criterion 2 - e.g., "AI response streams in after 2-5 seconds"]
- ✅ [Criterion 3 - e.g., "Input field re-enables after response starts"]

**Interaction Patterns Used**:
- [Pattern Name] (see Interaction Patterns section - e.g., "Modal Workflow")
- [Pattern Name] (see Interaction Patterns section - e.g., "Form Validation")

---

#### Layout & Spatial Design

**Desktop (1440px+)**:

```
┌─────────────────────────────────────────────────────────┐
│ [Header Component - 64px height]                        │
├──────────────┬──────────────────────────────────────────┤
│              │                                           │
│ [Sidebar]    │ [Main Content Area]                      │
│ (300px)      │ (flex-1)                                 │
│              │                                           │
│              │ ┌─────────────────────────────────────┐  │
│              │ │ [Component A]                       │  │
│              │ └─────────────────────────────────────┘  │
│              │                                           │
│              │ ┌─────────────────────────────────────┐  │
│              │ │ [Component B]                       │  │
│              │ └─────────────────────────────────────┘  │
└──────────────┴──────────────────────────────────────────┘
```

**Dimensions**:
- Header: Full width, 64px height
- Sidebar: 300px fixed width
- Main content: flex-1 (remaining space)
- Gap: 0 (no gap between sidebar and content)

**Component Spacing**:
- Component gaps: gap-4 (16px) between major components
- Section margins: mb-8 (32px) between major sections
- Internal padding: p-6 (24px) in content areas

**Mobile (375px)**:

```
┌───────────────────┐
│ [Header - 56px]   │
├───────────────────┤
│                   │
│ [Main Content]    │
│                   │
│ ┌───────────────┐ │
│ │ Component A   │ │
│ └───────────────┘ │
│                   │
│ ┌───────────────┐ │
│ │ Component B   │ │
│ └───────────────┘ │
│                   │
│ [Input - sticky]  │
└───────────────────┘
```

**Dimensions**:
- Header: Full width, 56px height
- Main content: Full width
- Input: Full width, 72px height, sticky at bottom

**Component Spacing**:
- Component gaps: gap-3 (12px) between components (tighter than desktop)
- Section margins: mb-6 (24px) between sections
- Internal padding: p-4 (16px) in content areas

**Responsive Breakpoints**:
- **Mobile**: `< 768px` - Stack vertically, hide sidebar, sticky input, reduced spacing
- **Tablet**: `768px - 1024px` - Sidebar as overlay, moderate spacing
- **Desktop**: `> 1024px` - Full layout, sidebar inline, maximum spacing

**Components Used in Layout**:
- `Component1`, `Component2`, `Component3` (see Component Library for detailed specs)

---

#### Primary Flow 2: [Next Flow Name]

[Repeat structure for additional primary flows on this screen]

---

### [Screen 2 Name]

**Purpose**: [What this screen accomplishes]

**Route**: `/[production-route]`

**Priority**: [P1/P2/P3]

**Entry Points**: [List]

**Exit Points**: [List]

#### Primary Flow: [Flow Name]

[Repeat flow structure...]

---

[Repeat for ALL screens from arch.md - ALL priorities]

---

## Component Library

<!--
  REFERENCE SECTION: Detailed component specifications.
  Screens reference components from this section.

  REUSABILITY RULE: Check existing → Common (2+ features) → Feature-specific (1 feature)
  - Common → packages/ui/src/components/
  - Feature-specific → packages/ui/src/features/[feature-name]/

  IMPORTANT: These are SPECIFICATIONS only (no files created yet).
  Actual component files are created during /speckit.design phase.
-->

### Component Reusability Assessment

**Existing components checked** (from `packages/ui/src/components/`):
- [Component] - ✅ Reused / ⚡ Extended / ❌ Not applicable

**New components categorized**:

| Component | Location | Reusability Rationale |
|-----------|----------|----------------------|
| [Component1] | `components/` | Used in 3+ features (common) |
| [Component2] | `features/[feature]/` | Feature-specific screen |

### Component Specifications

<!--
  For each component, define:
  - Location (common vs feature-specific)
  - Purpose
  - Props interface (TypeScript)
  - States to design
  - Accessibility requirements
-->

#### Screen Components (Feature-Specific)

**`[ScreenComponent1].tsx`** - [Screen 1 Name]

**Location**: `packages/ui/src/features/[feature-name]/[ScreenComponent1].tsx` (created during design)

**Purpose**: [What this component displays/enables]

**Reusability**: Feature-specific (1 feature)

**Rationale**: [Why feature-specific - e.g., "Screen-level component with feature-specific layout"]

**Props Interface**:

```typescript
interface [ScreenComponent1]Props {
  // Data props (read-only)
  items: Item[];           // List of items to display
  isLoading: boolean;      // Whether data is loading
  error: Error | null;     // Error state

  // Callback props (events out)
  onItemClick: (id: string) => void;     // Called when user clicks item
  onRefresh: () => void;                 // Called when user refreshes

  // Optional styling
  className?: string;
}
```

**Example Usage**:

```typescript
<ScreenComponent1
  items={[{ id: '1', name: 'Item 1' }]}
  isLoading={false}
  error={null}
  onItemClick={(id) => console.log(id)}
  onRefresh={() => refetch()}
/>
```

**States to Design**:
- Default (normal display with data)
- Loading (data fetching in progress)
- Error (error message display)
- Empty (no data available)
- [Feature-specific states if any]

**Composed From** (other components used):
- `Button`, `Card`, `Input` (from `@centrid/ui/components`)
- `[SharedFeatureComponent]` (from same feature if applicable)

**Component UI State** (local, ephemeral):
- `[stateField]`: [Type] - [Purpose - e.g., "Tracks whether modal is open"]
- `[stateField2]`: [Type] - [Purpose - e.g., "Current text in input field"]

**Why Component State**: [Rationale - e.g., "UI-only state, not persisted, not shared across components"]

**NOT component state** (defined in arch.md):
- Global data (messages, users, documents) → See arch.md Global State
- URL state (query params, path params) → See arch.md URL State
- Real-time subscriptions → See arch.md State Management

**Interaction Patterns Used**:
- [Pattern Name] (see Interaction Patterns section - e.g., "Modal Workflow")
- [Pattern Name] (see Interaction Patterns section - e.g., "Keyboard Shortcuts")

**Accessibility Requirements**:
- [ ] Keyboard navigation (Tab, Enter, Escape, Arrow keys)
- [ ] ARIA labels for screen readers (`aria-label`, `aria-describedby`)
- [ ] Focus management (initial focus, focus trap if modal)
- [ ] Color contrast (WCAG AA: 4.5:1 text, 3:1 UI components)

---

**`[ScreenComponent2].tsx`** - [Screen 2 Name]

[Repeat structure for each screen component...]

---

#### Shared Feature Components

<!--
  Components shared across multiple screens within this feature only.
-->

**`[SharedComponent].tsx`** - [Component Purpose]

**Location**: `packages/ui/src/features/[feature-name]/[SharedComponent].tsx` (created during design)

**Purpose**: [What this component does]

**Reusability**: Feature-specific (used in multiple screens of this feature)

**Rationale**: [Why shared within feature - e.g., "Reusable widget used in 3 screens of this feature"]

**Props Interface**:

```typescript
interface [SharedComponent]Props {
  // Data props
  data: DataType;          // [Description]

  // Callback props
  onAction: () => void;    // [Description]

  // Optional styling
  className?: string;
}
```

**States to Design**: [List states]

**Composed From**: [List primitives/components used]

**Component UI State** (local, ephemeral):
- `[stateField]`: [Type] - [Purpose]

**Why Component State**: [Rationale]

**NOT component state** (defined in arch.md):
- Global data, URL state, real-time subscriptions → See arch.md

**Interaction Patterns Used**:
- [Pattern Name] (see Interaction Patterns section)

**Accessibility Requirements**: [List requirements]

---

#### Common Components (Cross-Feature)

<!--
  New components that will be used across 2+ features.
  If component already exists in packages/ui/src/components/, document as "Reused" instead.
-->

**`[CommonComponent].tsx`** - [Component Purpose]

**Location**: `packages/ui/src/components/[CommonComponent].tsx` (created during design)

**Purpose**: [What this component does]

**Reusability**: Common (used in 2+ features)

**Rationale**: [Why cross-feature reusable - e.g., "Generic file upload widget used in 3 features"]

**Props Interface**:

```typescript
interface [CommonComponent]Props {
  // Data props
  value: string;                    // [Description]

  // Callback props
  onChange: (value: string) => void; // [Description]

  // Optional styling
  className?: string;
}
```

**States to Design**: [List states]

**Composed From**: [List primitives used]

**Component UI State** (local, ephemeral):
- `[stateField]`: [Type] - [Purpose]

**Why Component State**: [Rationale]

**NOT component state** (defined in arch.md):
- Global data, URL state, real-time subscriptions → See arch.md

**Interaction Patterns Used**:
- [Pattern Name] (see Interaction Patterns section)

**Accessibility Requirements**: [List requirements]

---

### Primitives Used (from @centrid/ui/components)

<!--
  List all shadcn/ui primitives used in this feature.
  No need to specify props - these are pre-existing.
-->

- Button (variants: default, secondary, ghost)
- Input (with validation states)
- Card (for containers)
- Badge (for status indicators)
- Dialog (for modals)
- [Add other primitives used]

---

## Interaction Patterns

<!--
  REFERENCE SECTION: Common interaction behaviors used across screens.
  Screens reference patterns from this section.
-->

### [Pattern 1 Name] (e.g., "Modal Workflow")

**Where Used**: [List screens/components - e.g., "Create Thread, Edit Profile, Delete Confirmation"]

**Behavior**:

1. [Step 1 - e.g., "User clicks trigger button/link"]
2. [Step 2 - e.g., "Modal opens with backdrop overlay, focus trapped inside"]
3. [Step 3 - e.g., "User interacts with modal content (form, confirmation, etc.)"]
4. [Step 4 - e.g., "User dismisses via Escape, backdrop click, Cancel, or Submit"]
5. [Step 5 - e.g., "Modal closes, focus returns to trigger element"]

**Components Involved**:
- `Modal` - [Role - e.g., "Container with backdrop and focus trap"]
- `ModalHeader` - [Role - e.g., "Title and close button"]
- `ModalBody` - [Role - e.g., "Content area (form, text, etc.)"]
- `ModalFooter` - [Role - e.g., "Action buttons (Cancel, Submit)"]

**State Changes**:
- **Before**: [Initial state - e.g., "Modal hidden, trigger visible"]
- **During**: [Intermediate state - e.g., "Modal visible, backdrop blocks background, focus inside modal"]
- **After**: [Final state - e.g., "Modal hidden, focus on trigger element"]

**Keyboard Shortcuts**:
- `Escape` - [Action - e.g., "Close modal without saving"]
- `Enter` - [Action - e.g., "Submit form (if single input)"]
- `Tab` - [Action - e.g., "Navigate between focusable elements (trapped in modal)"]

---

### [Pattern 2 Name] (e.g., "Drag and Drop Upload")

[Repeat structure for additional patterns...]

---

## Design Handoff Checklist

<!--
  VALIDATION GATE: Ensure all information needed for design phase is documented.
-->

### Completeness Check

- [ ] All screens from arch.md have detailed flows (ALL priorities)
- [ ] All user stories from spec.md are covered (ALL priorities)
- [ ] All acceptance criteria from spec.md are mapped to flows
- [ ] All components have prop specifications
- [ ] All error scenarios documented with test data and recovery paths
- [ ] Each screen has layout diagrams (desktop + mobile, inline with screen)
- [ ] Interaction patterns documented (separate section, referenced from screens/components)
- [ ] Each component has UI state specified (inline with component, not global/URL state)
- [ ] Interaction patterns referenced from screens and components where used

### Component Architecture Check

- [ ] Component hierarchy matches arch.md
- [ ] Props follow data-in/callbacks-out pattern (no business logic in props)
- [ ] Component locations specified (common vs feature-specific)
- [ ] Reusability assessment complete (checked existing components)
- [ ] All components have accessibility requirements

### Flow Verification

- [ ] Each flow maps to acceptance criteria from spec.md
- [ ] Error scenarios have recovery paths
- [ ] Success criteria defined for each flow (from spec.md)
- [ ] Navigation paths complete (entry + exit points for all screens)
- [ ] Keyboard navigation specified for all interactive patterns

### Design System Alignment

- [ ] Checked existing components in `packages/ui/src/components/` (no duplication)
- [ ] New components justified (not duplicating existing)
- [ ] Spacing uses design system tokens (8px grid system)
- [ ] Interaction patterns align with existing patterns

---

## Notes

**Open Questions**: [Any unresolved UX decisions that need clarification]

**Assumptions**: [Assumptions made during UX specification]

**Deferred**: [Features/flows deferred to later phases]

**Design System Gaps**: [Any needed primitives not yet in design system]

---

## Component Flow Through Workflow

> **IMPORTANT**: This section explains where components are created/used at each workflow stage.

### 1. UX Phase (Current - `/speckit.ux`)

**Deliverables**:

- Component prop specifications (TypeScript interfaces)
- Component reusability assessment (common vs feature-specific)
- Component placement decisions documented

**NOT created**: No actual component files yet, only specifications

### 2. Design Phase (`/speckit.design`)

**Presentational Components Created**:

- **Common**: `packages/ui/src/components/[ComponentName].tsx`
  - Exported from `packages/ui/src/components/index.ts`
  - Imported as `import { ComponentName } from '@centrid/ui/components'`
- **Feature-specific**: `packages/ui/src/features/[feature-name]/[ComponentName].tsx`
  - Exported from `packages/ui/src/features/[feature-name]/index.ts`
  - Feature exported from `packages/ui/src/features/index.ts`
  - Imported as `import { ComponentName } from '@centrid/ui/features'`

**Mock Containers Created** (for visual showcase only):

- **Location**: `apps/design-system/components/[feature-name]/[ComponentName]Mock.tsx`
- **Purpose**: Wrap presentational components with hardcoded sample data for design iteration
- **NOT used in production**: These are ONLY for the design-system app

### 3. Implementation Phase (`/speckit.tasks` → `/speckit.implement`)

**Production Containers Created**:

- **Location**: `apps/web/src/components/[feature-name]/[ComponentName]Container.tsx`
- **Pattern**: Import presentational component from `packages/ui/`, add business logic
- **Example**:

  ```typescript
  import { ChatView } from "@centrid/ui/features"; // Presentational (from design)
  import { useChatState } from "@/hooks/useChatState"; // Business logic (new)

  export function ChatController() {
    const { messages, isLoading, sendMessage } = useChatState();

    return (
      <ChatView
        messages={messages}
        isLoading={isLoading}
        onSendMessage={sendMessage}
      />
    );
  }
  ```

**CRITICAL**: Implementation tasks should **IMPORT** presentational components, **NOT rebuild them**.

### Component Lifecycle Summary

```
ux.md (Specification)
    ↓ Props interfaces, reusability assessment
    ↓
packages/ui (Design Phase - Presentational)
    ├─ src/components/ (common components)
    └─ src/features/[feature-name]/ (feature components)
    ↓
apps/design-system/components/ (Design Phase - Mock Containers)
    └─ [feature-name]/ComponentMock.tsx (sample data only)
    ↓
apps/web/src/components/ (Implementation Phase - Production Containers)
    └─ [feature-name]/ComponentContainer.tsx (imports from packages/ui, adds real business logic)
```

**Key Principle**: Presentational components are created ONCE (during design) and REUSED (during implementation).
