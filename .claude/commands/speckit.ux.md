---
description: Create detailed UX specification bridging architecture and visual design (project)
---

# Feature UX Specification - Detailed Interaction & Layout Design

**Purpose**: Create step-by-step user flows, component specifications, interaction patterns, and layout relationships to provide complete context for high-fidelity design.

**Prerequisites**: spec.md (requirements + acceptance criteria), arch.md (component structure + screens)

**Output**: ux.md with detailed flows ready for `/speckit.design` to create pixel-perfect implementations

---

## Workflow

### 1. Setup & Load Context

**Run prerequisites script**: `.specify/scripts/bash/check-prerequisites.sh --json` from repo root

- Parse `FEATURE_DIR` (absolute path to feature directory)
- Parse `AVAILABLE_DOCS` list (which documents exist for this feature)
- All paths must be absolute

**Load feature context** from FEATURE_DIR:

- **Required**: `spec.md` (user stories, acceptance criteria, edge cases, success criteria)
- **Required**: `arch.md` (screens, component structure, data model, state management)
- **Optional**: `data-model.md` (if exists in AVAILABLE_DOCS - for complex data structures)

**Verify prerequisites**:

- [ ] spec.md exists with User Stories section (P1, P2, P3 priorities)
- [ ] spec.md has Acceptance Criteria section (Given/When/Then scenarios)
- [ ] arch.md exists with Screens & Flows section (screen inventory)
- [ ] arch.md has Component Structure section (hierarchy and module locations)

**If prerequisites missing**: STOP, run `/speckit.specify` or `/speckit.arch` first

### 2. Extract Component Architecture

**From arch.md, extract**:

1. **Screen Inventory**:

   - Screen names, purposes, routes, user stories, priorities
   - Entry points (how users navigate to each screen)
   - Exit points (where users can navigate from each screen)

2. **Component Hierarchy** (per screen):

   - Top-level screen component
   - Nested child components
   - Module locations (packages/ui vs apps/web)
   - Container/Presenter mapping

3. **State Management Strategy**:

   - Component state (UI-only, local)
   - Global state (Valtio/Redux/Context)
   - URL state (query params, path params)
   - Real-time subscriptions (Supabase/websockets)

4. **Data Model**:
   - Entities and relationships
   - Key fields and types
   - Data flow patterns (where data comes from, how it flows to UI)

**Create mapping table** (for reference during flow creation):

| Screen | Priority | Component   | Location             | State Type | Data Source |
| ------ | -------- | ----------- | -------------------- | ---------- | ----------- |
| [Name] | P1/P2/P3 | [Component] | packages/ui/features | Component  | Props       |
| [Name] | P1/P2/P3 | [Container] | apps/web/components  | Global     | Valtio      |

### 3. Create Screen-by-Screen UX Flows

**For EVERY screen in arch.md** (ALL priorities - P1, P2, P3, P4, etc.):

#### Step 3.1: Identify User Stories & Acceptance Criteria

**From spec.md**:

- Find user stories related to this screen
- Extract acceptance criteria (Given/When/Then)
- Note edge cases and error scenarios
- Identify success criteria

**Example mapping**:

- **Screen**: Chat Interface
- **User Story**: US-002 "As a user, I want to send messages to the AI agent"
- **Acceptance Criteria**: AC-002 "Given user is on chat screen, When user types message and clicks send, Then message appears in conversation and AI responds"
- **Edge Cases**: Empty message, network failure, rate limit exceeded

#### Step 3.2: Create Primary Flow (Happy Path)

**For the main user journey on this screen**:

1. **Break into granular steps** (5-15 steps typical):

   - Each user action (click, type, drag, scroll)
   - Each system response (loading, display, navigation)
   - Each state transition (pending → loading → success)

2. **For each step, document**:
   - **User Action** or **System Response**
   - **Component**: Which component from arch.md hierarchy
   - **Interaction**: Click/Type/Drag/Hover/Scroll/Auto
   - **What Happens**: Immediate response (modal opens, form submits, etc.)
   - **Data Required**: What props/state this component needs
   - **Callback**: `on[Action]` callback name and purpose
   - **Visual Feedback**: Loading spinner, disabled button, error message, etc.

**Template for each step**:

```
[N]. **[User Action/System Response]**
   - **Component**: `[ComponentName]` from `[file-path]`
   - **Interaction**: [Click/Type/etc.]
   - **What Happens**: [Immediate result]
   - **Data Required**: { [propName]: [Type] }
   - **Callback**: `on[Action]` - [What callback does]
   - **Visual Feedback**: [State change visible to user]
```

**Example**:

```
1. **User clicks "Send" button**
   - **Component**: `MessageInput` from `packages/ui/src/features/ai-chat/MessageInput.tsx`
   - **Interaction**: Click
   - **What Happens**: Form submits, input clears, button disables
   - **Data Required**: { messageText: string, isLoading: boolean }
   - **Callback**: `onSendMessage(text: string)` - Triggers AI agent execution
   - **Visual Feedback**: Button shows spinner, input disabled during send

2. **System adds user message to conversation**
   - **Component**: `ConversationView` from `packages/ui/src/features/ai-chat/ConversationView.tsx`
   - **Interaction**: Auto (triggered by onSendMessage callback)
   - **What Happens**: New message appears at bottom of conversation
   - **Data Required**: { messages: Message[], currentUser: User }
   - **Callback**: None (display only)
   - **Visual Feedback**: Smooth scroll to bottom, message animates in
```

#### Step 3.3: Document Error Scenarios

**For each error case from spec.md Edge Cases**:

1. **Error Case**: [Name - e.g., "Network request fails"]
   - **Trigger**: [What causes this - timeout, 500 error, etc.]
   - **Component**: [Which component shows error - inline or modal]
   - **Display**: [Exact error message text]
   - **Recovery**: [How user can retry - button, auto-retry, etc.]
   - **Test Data**: [What input/condition triggers this in tests]

**Example**:

```
**Error: Network Request Fails**
- **Trigger**: API timeout after 30s or 500 error response
- **Component**: `ErrorBanner` from `packages/ui/src/components/ErrorBanner.tsx`
- **Display**: "Unable to send message. Please check your connection and try again."
- **Recovery**: "Retry" button calls `onSendMessage` again with same text
- **Test Data**: Mock API with `networkError: true` flag
```

#### Step 3.4: Define Success Criteria

**From spec.md Success Criteria**:

- Map each success criterion to flow steps
- Define what "complete" looks like for this flow
- Specify observable outcomes (UI states, data changes, navigation)

**Example**:

```
**Success Criteria** (from SC-002):
- User message appears in conversation with timestamp
- "Sending..." indicator shows during request
- AI response streams in after 2-5 seconds
- Input field re-enables after AI response starts
- Conversation scrolls to show latest message
```

### 4. Define Component Prop Specifications

**For each component in the hierarchy** (from arch.md):

#### Step 4.1: Categorize Component

**Reusability assessment**:

- **Common** (2+ features) → `packages/ui/src/components/`
- **Feature-specific** (1 feature) → `packages/ui/src/features/[feature-name]/`

**Presentational vs Container**:

- **Presentational** (dumb) → Pure UI, props in, callbacks out
- **Container** (smart) → Business logic, data fetching, state management

**Location**:

- Presentational → `packages/ui/` (created during design)
- Container → `apps/web/` (created during implementation)

#### Step 4.2: Define Props Interface

**For presentational components only** (containers defined during implementation):

```typescript
interface [ComponentName]Props {
  // Data props (read-only, passed down)
  [field]: [Type];  // [Description]
  [field2]?: [Type]; // [Description - optional]

  // Callback props (events up)
  on[Action]: ([params]) => void;  // [Description]
  on[Action2]?: ([params]) => void; // [Description - optional]

  // Styling
  className?: string;
}
```

**Example**:

```typescript
interface MessageInputProps {
  // Data props
  placeholder: string; // Input placeholder text
  isLoading: boolean; // Whether message is sending
  maxLength?: number; // Character limit (optional)

  // Callback props
  onSendMessage: (text: string) => void; // Called when user sends message
  onCancel?: () => void; // Called when user cancels (optional)

  // Styling
  className?: string;
}
```

#### Step 4.3: Document States to Design

**For each presentational component**:

List all visual states that need design:

- **Default**: Normal display
- **Loading**: Data fetching or processing
- **Error**: Error message display
- **Empty**: No data available
- **Disabled**: Interaction blocked
- **Focus**: Keyboard focus visible
- **Hover**: Mouse hover (desktop only)
- **Active**: During interaction (button pressed, etc.)
- **[Custom states]**: Feature-specific states

**Example**:

```
**MessageInput States**:
- Default: Empty input, enabled send button
- Typing: Text entered, character count shows, send button enabled
- Sending: Input disabled, send button shows spinner
- Error: Red border, error message below input
- Disabled: Grayed out, not interactive
- Focus: Blue border, keyboard accessible
```

### 5. Document Interaction Patterns

**Identify common patterns used across screens**:

#### Step 5.1: Extract Patterns from Flows

**From the flows created in Step 3, identify recurring patterns**:

- Modal workflows (open → interact → close)
- Form submissions (validate → submit → feedback)
- Drag and drop (pick up → drag → drop → confirm)
- Infinite scroll (scroll → load more → append)
- Real-time updates (subscribe → receive → update UI)
- Keyboard shortcuts (key press → action)

#### Step 5.2: Document Each Pattern

**For each pattern**:

```
### [Pattern Name]

**Where Used**: [List screens/components]

**Behavior**:
1. [Step 1 - trigger]
2. [Step 2 - response]
3. [Step 3 - completion]

**Components Involved**:
- `[Component1]` - [Role]
- `[Component2]` - [Role]

**State Changes**:
- Before: [Initial state]
- During: [Intermediate state]
- After: [Final state]

**Keyboard Shortcuts**:
- `[Key]` - [Action]
```

**Example**:

```
### Modal Workflow

**Where Used**: Create Thread, Edit Profile, Confirm Delete

**Behavior**:
1. User clicks trigger button/link
2. Modal opens with backdrop overlay (focus trapped inside)
3. User interacts with modal content (form, confirmation, etc.)
4. User dismisses via Escape key, backdrop click, Cancel button, or Submit button
5. Modal closes, focus returns to trigger element

**Components Involved**:
- `Modal` - Container with backdrop and focus trap
- `ModalHeader` - Title and close button
- `ModalBody` - Content area (form, text, etc.)
- `ModalFooter` - Action buttons (Cancel, Submit)

**State Changes**:
- Before: Modal hidden, trigger visible
- During: Modal visible, backdrop blocks background interaction, focus inside modal
- After: Modal hidden, focus on trigger element

**Keyboard Shortcuts**:
- `Escape` - Close modal without saving
- `Enter` - Submit form (if single input field)
- `Tab` - Navigate between focusable elements (trapped in modal)
```

### 6. Define Layout & Spatial Relationships

**For each screen, document layout structure**:

#### Step 6.1: Create ASCII Layout Diagrams

**Desktop (1440px+)**:

```
┌─────────────────────────────────────────────────────────┐
│ [Header Component]                                       │
├──────────────┬──────────────────────────────────────────┤
│              │                                           │
│ [Sidebar]    │ [Main Content Area]                      │
│ (fixed px)   │ (flex-1)                                 │
│              │                                           │
└──────────────┴──────────────────────────────────────────┘
```

**Mobile (375px)**:

```
┌───────────────────┐
│ [Header]          │
├───────────────────┤
│ [Main Content]    │
│                   │
│ [Bottom Nav]      │
└───────────────────┘
```

#### Step 6.2: Define Spacing & Responsive Behavior

**Spacing**:

- Component gaps: [e.g., "gap-6 (24px) between sections"]
- Internal padding: [e.g., "p-4 (16px) mobile, p-6 (24px) desktop"]
- Section margins: [e.g., "mb-8 (32px) between major sections"]

**Responsive Breakpoints**:

- Mobile (`< 768px`): [Layout changes - stack vertically, hide sidebar, etc.]
- Tablet (`768px - 1024px`): [Layout changes]
- Desktop (`> 1024px`): [Layout changes]

**Example**:

```
**Chat Interface Layout**

Desktop (1440px+):
- Sidebar: 300px fixed width, left side
- Main content: flex-1, right side
- Gap: 0 (no gap, full screen usage)
- Header: Full width across top, 64px height

Mobile (375px):
- Sidebar: Hidden (hamburger menu toggles overlay)
- Main content: Full width
- Header: Full width, 56px height
- Bottom input: Sticky at bottom, 72px height

Spacing:
- Message gaps: gap-4 (16px) between messages
- Input padding: p-4 (16px) mobile, p-6 (24px) desktop
- Section margins: mb-8 (32px) between major sections

Responsive:
- < 768px: Stack layout, hide sidebar, sticky input at bottom
- 768px - 1024px: Show sidebar as overlay (not inline)
- > 1024px: Show sidebar inline, full layout
```

**Detailed ASCII layout diagrams created in design.md** (not here)

### 7. Document Component UI State

**IMPORTANT**: Global state, URL state, and real-time subscriptions are defined in arch.md "Frontend State Management" section. DO NOT duplicate here. This step is ONLY for component UI state.

**For each component with local UI state**:

```
**[ComponentName]**:
- `[stateField]`: [Type] - [Purpose - e.g., "Tracks whether modal is open"]
- `[stateField2]`: [Type] - [Purpose]

**Why Component State**: [Rationale - e.g., "UI-only, not persisted, not shared"]
```

**Example**:

```
**MessageInput**:
- `inputValue`: string - Tracks current text in input field
- `characterCount`: number - Length of inputValue for display
- `isFocused`: boolean - Whether input has keyboard focus

**Why Component State**: UI-only state, not persisted, no other component needs this data
```

**Global State Reference**: See arch.md section "Frontend State Management" for:

- Global state strategy (Valtio/Redux/Context)
- Real-time subscriptions
- URL state (query params, path params)

### 8. Generate ux.md

**Use template**: `.specify/templates/ux-template.md`

**Create**: `specs/[FEATURE]/ux.md`

**Fill all sections**:

1. **Overview**:

   - Feature summary (from spec.md)
   - User goals (from spec.md user stories)
   - Design approach (UX strategy decided during flow creation)

2. **Screen-by-Screen UX Flows**:

   - For each screen from arch.md
   - Primary flow with detailed steps (from Step 3)
   - Error scenarios with test data (from Step 3)
   - Success criteria (from spec.md)

3. **Component Specifications**:

   - For each presentational component (from Step 4)
   - Props interface with TypeScript types
   - States to design (default, loading, error, etc.)
   - Accessibility requirements

4. **Interaction Patterns**:

   - Common patterns extracted from flows (from Step 5)
   - Keyboard shortcuts
   - State transitions

5. **Layout & Spatial Relationships**:

   - ASCII diagrams for desktop and mobile (from Step 6)
   - Spacing specifications
   - Responsive breakpoints

6. **State Management Requirements**:

   - Component-level UI state only (from Step 7)
   - Reference to arch.md for global/URL state (from Step 7)

7. **Design Handoff Checklist**:
   - Verify all screens covered
   - Verify all user stories mapped
   - Verify all acceptance criteria covered
   - Verify component architecture matches arch.md
   - Verify props follow data-in/callbacks-out pattern

**Validation before saving**:

- [ ] ALL screens from arch.md have flows (not just P1/P2)
- [ ] ALL user stories from spec.md covered (ALL priorities)
- [ ] All presentational components have prop specs
- [ ] Error scenarios documented for all flows
- [ ] Layout diagrams complete (desktop + mobile)
- [ ] Spacing and responsive behavior specified
- [ ] Component UI state documented (not global - that's in arch.md)
- [ ] Design Handoff Checklist complete

**If validation fails**: STOP, complete missing sections before saving ux.md

### 9. Report Summary

**Context Loaded** ✅

- spec.md: [N] user stories, [N] acceptance criteria
- arch.md: [N] screens, [N] components

**Flows Documented** ✅

- [N] screen-by-screen flows created
- [N] error scenarios documented with test data
- [N] success criteria mapped from spec.md

**Components Specified** ✅

- [N] presentational components with prop interfaces
- [N] states per component (default, loading, error, etc.)
- Component/Container mapping complete

**Deliverables** ✅

- ux.md: Complete UX specification
- Ready for `/speckit.design` (high-fidelity design)

**Next Step** ✓

- Run `/speckit.design` to create pixel-perfect designs using ux.md flows

---

## Key Rules

**DO**:

- ✅ Map ALL user stories from spec.md to flows (ALL priorities, not just P1/P2)
- ✅ Extract component hierarchy from arch.md (don't recreate)
- ✅ Define granular steps (5-15 per flow) with exact components
- ✅ Specify props interfaces for presentational components only
- ✅ Document error scenarios with test data
- ✅ Specify spacing and responsive breakpoints
- ✅ Document component UI state only (reference arch.md for global state)
- ✅ Follow data-in/callbacks-out pattern for presentational components

**DON'T**:

- ❌ Skip any user stories (ALL priorities required, not just P1/P2)
- ❌ Skip error scenarios (every flow needs errors documented)
- ❌ Make up components not in arch.md (reference arch.md hierarchy)
- ❌ Define container components (deferred to implementation)
- ❌ Skip accessibility requirements (keyboard nav, ARIA, focus)
- ❌ Use vague steps ("user interacts" - be specific!)
- ❌ Create ASCII layout diagrams (those go in design.md)
- ❌ Duplicate global state strategy (reference arch.md instead)
- ❌ Skip Design Handoff Checklist validation

**Flow Granularity**:

- Each step = 1 user action OR 1 system response
- Be specific: "User clicks 'Send' button" (not "User sends message")
- Include component name, interaction type, data required, callback name
- Document visual feedback at each step

**Component Specs**:

- Presentational only (containers during implementation)
- TypeScript interfaces (typed props)
- All states (default, loading, error, empty, disabled, focus, hover, active)
- Data-in/callbacks-out pattern enforced

**Scope**:

- Cover ALL screens from arch.md (not just high-priority)
- Cover ALL user stories from spec.md (ALL priorities)
- Cover ALL acceptance criteria (ALL priorities)
- Spacing notes (not full layout diagrams)
- Component UI state only (not global/URL state)
