# [Feature Name] - UX Specification

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

> **Purpose**: Detailed step-by-step user flows for each screen, showing exactly what happens at each interaction point.

### [Screen Name]

**Purpose**: [What this screen accomplishes]

**Entry Points**: [How users navigate to this screen]

**Exit Points**: [Where users can navigate from this screen]

#### Primary Flow: [Flow Name]

**Acceptance Criteria**: [Reference from spec.md - e.g., AC-001]

**User Story**: [Reference from spec.md - e.g., US-002]

**Steps**:

1. **[User Action]** (e.g., "User clicks 'New Chat' button")

   - **Component**: `[ComponentName]` from `[file-path]`
   - **Interaction**: Click/Type/Drag/Hover/Scroll
   - **What Happens**: [Immediate response - modal opens, form appears, etc.]
   - **Data Required**: [What props/state this component needs]
   - **Callback**: `on[Action]` - [What the callback does]
   - **Visual Feedback**: [Loading state, button disabled, etc.]

2. **[Next User Action]**

   - **Component**: `[ComponentName]` from `[file-path]`
   - **Interaction**: [Type of interaction]
   - **What Happens**: [Response]
   - **Data Required**: [Props needed]
   - **Callback**: `on[Action]` - [Purpose]
   - **Visual Feedback**: [State changes]

3. **[System Response]** (automated behavior)
   - **Trigger**: [What triggered this - API response, timeout, etc.]
   - **What Happens**: [Result displayed, navigation, etc.]
   - **Component Updated**: `[ComponentName]`
   - **Data Flow**: [Where data comes from → how it's displayed]

**Error Scenarios**:

- **[Error Case]** (e.g., "Network request fails")
  - **Trigger**: [What causes this error]
  - **Component**: `[ErrorComponent]` or error state in `[MainComponent]`
  - **Display**: [Error message text]
  - **Recovery**: [How user can retry/recover]
  - **Test Data**: [What input/condition triggers this in tests]

**Success Criteria**: [From spec.md - what indicates flow completed successfully]

---

## Component Specifications

> **Purpose**: Define exact props interfaces, callbacks, and data requirements for presentational components.
>
> **IMPORTANT - Component Placement Rules**:
>
> - **Common components** (used in 2+ features) → `packages/ui/src/components/[ComponentName].tsx`
> - **Feature-specific components** (used in 1 feature) → `packages/ui/src/features/[feature-name]/[ComponentName].tsx`
> - **During design phase**: Create presentational components in `packages/ui/` (source of truth)
> - **During design phase**: Create mock containers in `apps/design-system/components/[feature-name]/` (sample data only)
> - **During implementation**: Create production containers in `apps/web/src/components/` (import presentational components, NOT rebuild them)
>
> **Component Reusability Assessment**:
>
> - Before defining a new component, check if similar components exist in `packages/ui/src/components/`
> - If exists: Reuse or extend (document in rationale)
> - If new and reusable (2+ features): Place in `packages/ui/src/components/`
> - If new and feature-specific (1 feature): Place in `packages/ui/src/features/[feature-name]/`

### [ComponentName]

**Location**: `packages/ui/src/[components | features/[feature-name]]/[ComponentName].tsx`

**Purpose**: [What this component displays/enables]

**Reusability**: [Common (2+ features) | Feature-specific (1 feature)]

**Rationale**: [Why this placement - reused across features, feature-specific logic, etc.]

**Props Interface**:

```typescript
interface [ComponentName]Props {
  // Data props (read-only)
  [dataField]: [Type];  // [Description - e.g., "List of messages to display"]
  [dataField2]: [Type]; // [Description]

  // Callback props (events out)
  on[Action]: ([params]) => void;  // [Description - e.g., "Called when user sends message"]
  on[Action2]: ([params]) => void; // [Description]

  // Optional styling
  className?: string;
}
```

**Example Usage**:

```typescript
<[ComponentName]
  [dataField]={[sampleData]}
  on[Action]={[handlerFunction]}
/>
```

**States to Design**:

- Default (normal display)
- Loading (data fetching)
- Error (error message display)
- Empty (no data available)
- [Feature-specific states]

**Accessibility**:

- [ ] Keyboard navigation (Tab, Enter, Escape, Arrow keys)
- [ ] ARIA labels for screen readers
- [ ] Focus management (trap focus in modals, restore focus on close)
- [ ] Color contrast (WCAG AA minimum)

---

## Interaction Patterns

> **Purpose**: Document common interaction behaviors and patterns used across the feature.

### [Pattern Name] (e.g., "Modal Workflow")

**Where Used**: [List of screens/components using this pattern]

**Behavior**:

1. [Step 1 - e.g., "User clicks trigger button"]
2. [Step 2 - e.g., "Modal opens with backdrop overlay"]
3. [Step 3 - e.g., "Focus moves to first input"]
4. [Step 4 - e.g., "User can dismiss with Escape key, backdrop click, or Cancel button"]

**Components Involved**:

- `[Component1]` - [Role in pattern]
- `[Component2]` - [Role in pattern]

**State Changes**:

- [State before interaction]
- [State during interaction]
- [State after interaction]

**Keyboard Shortcuts**:

- `[Key]` - [Action]
- `[Key Combo]` - [Action]

---

## Layout & Spatial Relationships

> **Purpose**: Define how components are arranged in space and how layouts adapt to different viewports.

### Layout Diagrams

#### Desktop (1440px+)

```
┌─────────────────────────────────────────────────────────┐
│ [Header Component]                                       │
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

#### Mobile (375px)

```
┌───────────────────┐
│ [Header]          │
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
│ [Bottom Nav]      │
└───────────────────┘
```

### Spacing & Responsive Behavior

**Component Spacing**:

- Component gaps: [e.g., "gap-6 (24px) between main sections"]
- Internal padding: [e.g., "p-4 (16px) on mobile, p-6 (24px) on desktop"]
- Section margins: [e.g., "mb-8 (32px) between major sections"]

**Responsive Breakpoints**:

- Mobile: `< 768px` - [Describe layout changes - e.g., "Stack vertically, hide sidebar"]
- Tablet: `768px - 1024px` - [Describe layout changes - e.g., "Sidebar as overlay"]
- Desktop: `> 1024px` - [Describe layout changes - e.g., "Full layout with inline sidebar"]

---

## Component UI State

> **Purpose**: Document component-level UI state (NOT global state - that's defined in arch.md).
>
> **IMPORTANT**: Global state strategy, real-time subscriptions, and URL state are defined in arch.md "Frontend State Management" section. DO NOT duplicate here. This section is ONLY for component UI state (accordion open, modal visible, input focused, etc.).

### [ComponentName]

**Component UI State** (local, ephemeral):

- `[stateField]`: [Type] - [Purpose - e.g., "Tracks whether modal is open"]
- `[stateField2]`: [Type] - [Purpose - e.g., "Tracks current accordion panel expanded"]

**Why Component State**: [Rationale - e.g., "UI-only, not persisted, not shared across components"]

**NOT component state** (defined in arch.md instead):
- Global data (messages, users, documents) → See arch.md Global State
- URL state (query params, path params) → See arch.md URL State
- Real-time subscriptions → See arch.md State Management

---

## Design Handoff Checklist

> **Purpose**: Ensure all information needed for high-fidelity design is documented.

### Completeness Check

- [ ] All screens from arch.md have detailed flows
- [ ] All P1/P2 user stories from spec.md are covered
- [ ] All acceptance criteria from spec.md are mapped to flows
- [ ] All components have prop specifications
- [ ] All error scenarios documented with test data
- [ ] Layout relationships defined (desktop + mobile)
- [ ] State management requirements specified
- [ ] Interaction patterns documented

### Component Architecture Check

- [ ] Component hierarchy matches arch.md
- [ ] Props follow data-in/callbacks-out pattern
- [ ] No business logic in presentational component specs
- [ ] Component locations specified (common vs feature-specific)
- [ ] Reusability assessment complete

### Flow Verification

- [ ] Each flow maps to acceptance criteria from spec.md
- [ ] Error scenarios have recovery paths
- [ ] Success criteria defined for each flow
- [ ] Navigation paths complete (entry + exit points)
- [ ] Keyboard navigation specified

### Design System Alignment

- [ ] Uses existing components where possible (from `packages/ui/src/components/`)
- [ ] New components justified (not duplicating existing)
- [ ] Spacing uses design system tokens (8px grid)
- [ ] Interaction patterns align with existing patterns

---

## Notes

**Open Questions**: [Any unresolved UX decisions]

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
