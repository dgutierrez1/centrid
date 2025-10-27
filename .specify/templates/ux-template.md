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

## UX Flows

<!-- List all screens from arch.md. Each screen can have multiple flows. -->

### [Screen Name]

**Route**: `/[production-route]`

**Purpose**: [What this screen accomplishes]

**Priority**: [P1/P2/P3 - from arch.md]

**Entry Points**: [How users navigate here]

**Exit Points**: [Where users can navigate to]

**Layout Overview**: [Brief description if complex - e.g., "3-panel adaptive workspace"]

---

#### Flow 1: [Flow Name - e.g., "Send Message with Streaming Response"]

**User Story**: [Reference from spec.md - e.g., US-002]

**Acceptance Criteria**: [Reference from spec.md - e.g., AC-002]

**Steps** (condensed table format):

| # | Action/Response | Component | Interaction | What Happens | Data | Callback | Feedback |
|---|-----------------|-----------|-------------|--------------|------|----------|----------|
| 1 | User types message | `ThreadInput` | Type | Counter updates, button enables | `{text, limit, isLoading}` | `onChange(text)` | Counter shows, button coral |
| 2 | User clicks Send | `ThreadInput` | Click | Submit, input stays enabled | `{text, isStreaming}` | `onSendMessage(text)` | Send→Stop button, input enabled |
| 3 | System adds message | `MessageStream` | Auto (onSend) | Message appears at bottom | `{messages[]}` | - | Scroll to bottom, fade in |
| 4 | Agent streams response | `MessageStream` | SSE event | Text chunks appear | `{streamingBuffer}` | - | Incremental render |
| 5 | Agent requests approval | `ToolCallApproval` | SSE event | Approval prompt inline | `{toolCall, preview}` | - | Stream pauses, prompt slides in |
| 6 | User approves | `ToolCallApproval` | Click | POST approval, stream resumes | `{toolCallId, approved}` | `onApprove(id)` | Button spinner, "Executing..." |
| 7 | File created | `ContextPanel` | Realtime | File in artifacts section | `{file, provenance}` | - | Widget fades in, section expands |
| 8 | Response completes | `ThreadInput` | SSE complete | Stop→Send button, ready for next | - | - | Button transform, input enabled |

**Error Scenarios** (condensed table format):

| Error | Trigger | Component | Display | Recovery | Test Data |
|-------|---------|-----------|---------|----------|-----------|
| Network fail | Timeout 30s / 500 | `ErrorBanner` (above input) | "Unable to send message. Check connection. [Retry]" | Retry button → `onSendMessage` | Mock SSE with `networkError: true` |
| SSE interrupts | Network disconnect mid-stream | `ErrorBanner` (inline in stream) | "Response interrupted. [Retry from beginning]" | Discard partial, user retries | Close SSE after 3 chunks |
| Approval timeout | No action 10min / stop clicked | `ToolCallApproval` or `ThreadInput` | "Approval timed out" / "Request cancelled" | SSE terminated, send new message | Mock with `autoTimeout: 600000` |
| Context overflow | >200K tokens | `ContextPanel` | "Some context excluded. Review below." | Manual re-prime from excluded section | Mock context 250K tokens |

**Success Criteria** (from spec.md):
- ✅ User message appears with timestamp <100ms
- ✅ Agent response starts streaming within 5s (p95)
- ✅ Tool approval flow pauses stream correctly
- ✅ File appears in artifacts within 2s
- ✅ Input re-enables after response completes

**Interaction Patterns Used**:
- Streaming Response Pattern (see Interaction Patterns section)
- Approval Workflow (see Interaction Patterns section)

---

#### Flow 2: [Next Flow Name]

[Repeat for additional flows on this screen]

---

#### Layout & Spatial Design

[Document layout for this screen - skip if simple single-column]

**Layout Type**: [e.g., "3-panel adaptive workspace", "Single-column with sidebar", "Modal overlay"]

**Panel Behavior** (if applicable):

| Panel | Desktop (1440px+) | Mobile (375px) | Purpose | Closeable |
|-------|-------------------|----------------|---------|-----------|
| Left  | 20% fixed | Hidden (drawer) | Files/Threads navigation | No |
| Center | 50-80% adaptive | 100% | Thread interface (always visible) | No |
| Right | 0-30% adaptive | Full-screen modal | File editor with provenance | Yes (X button) |

**Dimensions**:

| Element | Desktop | Mobile | Notes |
|---------|---------|--------|-------|
| Header | Full width, 64px | Full width, 56px | - |
| Sidebar | 20% width (fixed) | Hidden | Drawer toggles on hamburger |
| Main content | 50-80% (adaptive) | 100% | Shrinks when right panel opens |
| Right panel | 0% (hidden) or 30% | Full-screen modal | Slides in from right |

**Component Spacing**:

| Context | Desktop | Mobile |
|---------|---------|--------|
| Component gaps | gap-4 (16px) | gap-3 (12px) |
| Section margins | mb-8 (32px) | mb-6 (24px) |
| Internal padding | p-6 (24px) | p-4 (16px) |

**Responsive Breakpoints**:
- **Mobile** (`< 768px`): Vertical stack, hide sidebar, sticky input, reduced spacing
- **Tablet** (`768px - 1024px`): Sidebar as overlay, moderate spacing
- **Desktop** (`> 1024px`): Full 3-panel layout, maximum spacing

**Components in Layout**: `WorkspaceSidebar`, `ThreadView`, `FileEditorPanel` (see Component Library)

---

### [Screen 2 Name]

[Repeat structure for all screens from arch.md]

---

## Component Library

<!--
  CONDENSED FORMAT: Props as inline comma-separated, states as shorthand.

  REUSABILITY RULE: Check existing → Common (2+ features) → Feature-specific (1 feature)
  - Common → packages/ui/src/components/
  - Feature-specific → packages/ui/src/features/[feature-name]/

  REMOVED: Example usage, "Composed From", "Why Component State" explanations
  KEPT: Location, Purpose, Props (inline), States (shorthand), UI State, Patterns, Accessibility (shared checklist)
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

#### Screen Components (Feature-Specific)

**`[ScreenComponent1].tsx`** - [Screen 1 Name]

**Location**: `packages/ui/src/features/[feature-name]/[ScreenComponent1].tsx` (created during design)

**Purpose**: [What this component displays/enables]

**Reusability**: Feature-specific (1 feature) - [Brief rationale]

**Props** (condensed inline format):
```typescript
{ items: Item[], isLoading: bool, error: Error|null, onItemClick: (id) => void, onRefresh: () => void, className?: string }
```

**States**: Default (with data), Loading (spinner), Error (banner), Empty (placeholder)

**Component UI State** (local, ephemeral):
- `isModalOpen: bool` - Modal visibility
- `selectedId: string|null` - Currently selected item
- [Add others as needed]

**Interaction Patterns**: [Pattern1], [Pattern2] (see Interaction Patterns section)

**Accessibility**: See shared checklist below

---

**`[ScreenComponent2].tsx`** - [Screen 2 Name]

[Repeat condensed structure for each screen component...]

---

#### Shared Feature Components

**`[SharedComponent].tsx`** - [Component Purpose]

**Location**: `packages/ui/src/features/[feature-name]/[SharedComponent].tsx` (created during design)

**Purpose**: [What this component does]

**Reusability**: Feature-specific (used in multiple screens of this feature) - [Brief rationale]

**Props**: `{ data: DataType, onAction: () => void, className?: string }`

**States**: [List states inline]

**Component UI State**: [List local state fields inline]

**Interaction Patterns**: [Pattern names]

**Accessibility**: See shared checklist below

---

#### Common Components (Cross-Feature)

**`[CommonComponent].tsx`** - [Component Purpose]

**Location**: `packages/ui/src/components/[CommonComponent].tsx` (created during design)

**Purpose**: [What this component does]

**Reusability**: Common (used in 2+ features) - [Brief rationale]

**Props**: `{ value: string, onChange: (val) => void, className?: string }`

**States**: [List states inline]

**Component UI State**: [List local state fields inline]

**Interaction Patterns**: [Pattern names]

**Accessibility**: See shared checklist below

---

### Shared Accessibility Checklist

**All components must meet these requirements** (referenced above):
- [x] Keyboard navigation (Tab, Enter, Escape, Arrow keys where applicable)
- [x] ARIA labels for screen readers (`aria-label`, `aria-describedby`, `role`)
- [x] Focus management (initial focus, focus trap for modals, focus restoration)
- [x] Color contrast (WCAG AA: 4.5:1 text, 3:1 UI components)
- [x] Screen reader announcements (aria-live for dynamic content)

---

### Primitives Used (from @centrid/ui/components)

- Button (variants: default, secondary, ghost)
- Input (with validation states)
- Card (for containers)
- Badge (for status indicators)
- Modal/Dialog (for modals)
- Tooltip (for hover info)
- ErrorBanner (for error states)
- [Add other primitives used]

---

## Interaction Patterns

<!--
  CONDENSED FORMAT: Brief description, key points only (no verbose step-by-step).
  REMOVED: Detailed behavior steps already documented in flows
  KEPT: Where used, components involved, state changes, keyboard shortcuts
-->

### [Pattern 1 Name] (e.g., "Modal Workflow")

**Where Used**: [List screens/components - e.g., "Create Branch, Consolidate, File conflicts"]

**Brief Description**: User triggers modal → Modal opens with backdrop and focus trap → User interacts (form/confirmation) → User dismisses (Escape/Cancel/Submit) → Modal closes, focus returns.

**Components**: `Modal`, `ModalHeader`, `ModalBody`, `ModalFooter`

**State Changes**: Hidden → Visible (backdrop, focus trapped) → Hidden (focus restored)

**Keyboard**: `Escape` (close), `Enter` (submit if single input), `Tab` (trapped navigation)

---

### [Pattern 2 Name] (e.g., "Streaming Response")

**Where Used**: [List screens/components]

**Brief Description**: [1-2 sentences summarizing pattern]

**Components**: [List]

**State Changes**: [Before → During → After]

**Keyboard**: [Shortcuts if applicable]

---

## Design Handoff Checklist

### Completeness Check

- [ ] All screens from arch.md have detailed flows (ALL priorities)
- [ ] All user stories from spec.md covered (ALL priorities)
- [ ] All acceptance criteria from spec.md mapped to flows
- [ ] All components have prop specifications
- [ ] All error scenarios documented with test data and recovery paths
- [ ] Each screen has layout dimensions table
- [ ] Interaction patterns documented (condensed, referenced from screens/components)
- [ ] Component UI state specified (not global/URL state)

### Component Architecture Check

- [ ] Component hierarchy matches arch.md
- [ ] Props follow data-in/callbacks-out pattern
- [ ] Component locations specified (common vs feature-specific)
- [ ] Reusability assessment complete
- [ ] Shared accessibility checklist referenced

### Flow Verification

- [ ] Each flow maps to acceptance criteria from spec.md
- [ ] Error scenarios have recovery paths
- [ ] Success criteria defined for each flow
- [ ] Navigation paths complete (entry + exit points)
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

<!--
  COMPONENT WORKFLOW GUIDANCE (template documentation, not feature-specific):

  1. UX Phase (/speckit.ux) - Current:
     - Component prop specifications (inline format)
     - Reusability assessment (table)
     - Placement decisions documented
     - NO component files created yet

  2. Design Phase (/speckit.design) - Next:
     - Presentational components created:
       - Common: packages/ui/src/components/
       - Feature: packages/ui/src/features/[feature-name]/
     - Mock containers for design-system app:
       - apps/design-system/components/[feature-name]/
     - Exported and importable via @centrid/ui/components or @centrid/ui/features

  3. Implementation Phase (/speckit.tasks → /speckit.implement) - Final:
     - Production containers created:
       - apps/web/src/components/[feature-name]/
     - IMPORT presentational components from packages/ui
     - Add business logic (hooks, state, API calls)
     - DO NOT rebuild presentational components

  Key Principle: Presentational components created ONCE (design) and REUSED (implementation).
-->
