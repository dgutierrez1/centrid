---
description: Create detailed UX specification bridging architecture and visual design (project)
---

# Feature UX Specification - Detailed Interaction & Layout Design

**Purpose**: Create step-by-step user flows, component specifications, interaction patterns, and layout relationships to provide complete context for high-fidelity design.

**Prerequisites**: spec.md (requirements + acceptance criteria), arch.md (component structure + screens)

**Output**: ux.md with detailed flows ready for `/speckit.design` to create pixel-perfect implementations

---

## Token Optimization Strategy

**Problem**: UX documents can reach 2000+ lines (~50K tokens), causing context limit issues.

**Solution**: Condensed format reduces token usage by 60-80% while preserving all critical information.

**What's Condensed**:
- ✅ Flow steps → Markdown tables (8 columns: #, Action, Component, Interaction, What Happens, Data, Callback, Feedback)
- ✅ Error scenarios → Tables (5 columns: Error, Trigger, Component, Display, Recovery, Test Data)
- ✅ Component props → Inline format `{ prop: Type, onAction: () => void }`
- ✅ States → Inline comma-separated `State1 (brief), State2 (brief)`
- ✅ Interaction patterns → Brief description + key points (no verbose step-by-step)
- ✅ Layout → ASCII diagrams (desktop + mobile) + tables for dimensions/spacing
- ✅ Accessibility → Shared checklist referenced by all components
- ❌ Removed: Example usage code, "Composed From" lists, "Why Component State" explanations, redundant workflow guidance

**Expected Results**:
- Old format: ~2100 lines (~50K tokens)
- New format: ~470 lines (~11K tokens)
- **Savings: 78% reduction**

**What's Preserved** (100%):
- All user flows (table format)
- All error scenarios (table format)
- All component props (inline format)
- All success criteria (kept as-is)
- All layout requirements (dimension tables)
- All interaction patterns (condensed)
- Component reusability decisions (kept as-is)
- Design handoff validation (kept as-is)

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

| Screen/Route | Priority | Component   | Location             | State Type | Data Source |
| ------------ | -------- | ----------- | -------------------- | ---------- | ----------- |
| [Route]      | P1/P2/P3 | [Component] | packages/ui/features | Component  | Props       |
| [Route]      | P1/P2/P3 | [Container] | apps/web/components  | Global     | Valtio      |

### 3. Create UX Flows for Each Screen

**For EVERY screen/route in arch.md** (ALL priorities):

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

**CONDENSED TABLE FORMAT** (to reduce token usage):

Create a markdown table with these columns:
- **#**: Step number
- **Action/Response**: User action or system response (brief, 3-5 words)
- **Component**: Component name only (e.g., `ThreadInput`)
- **Interaction**: Type/Click/Auto/SSE event/Realtime
- **What Happens**: Brief 3-5 word description
- **Data**: Props in shorthand `{field, field2}` format
- **Callback**: Function name only `onAction(params)` or `-` if none
- **Feedback**: Visual change (brief, 3-5 words)

**Example Table**:

```markdown
| # | Action/Response | Component | Interaction | What Happens | Data | Callback | Feedback |
|---|-----------------|-----------|-------------|--------------|------|----------|----------|
| 1 | User types msg | `MessageInput` | Type | Counter updates, button enables | `{text, limit, isLoading}` | `onChange(text)` | Counter shows, button coral |
| 2 | User clicks Send | `MessageInput` | Click | Submit, input stays enabled | `{text, isStreaming}` | `onSendMessage(text)` | Send→Stop button, spinner |
| 3 | System adds msg | `MessageStream` | Auto (onSend) | Message appears at bottom | `{messages[]}` | - | Scroll to bottom, fade in |
```

**Key benefits**: 60-80% token reduction while preserving all critical information.

#### Step 3.3: Document Error Scenarios

**CONDENSED TABLE FORMAT** (to reduce token usage):

Create a markdown table with these columns:
- **Error**: Error name (brief, 2-3 words)
- **Trigger**: What causes this (brief)
- **Component**: Component that shows error
- **Display**: Exact error message text (quoted)
- **Recovery**: How user can retry (brief action)
- **Test Data**: Test condition (brief)

**Example Table**:

```markdown
| Error | Trigger | Component | Display | Recovery | Test Data |
|-------|---------|-----------|---------|----------|-----------|
| Network fail | Timeout 30s / 500 | `ErrorBanner` (above input) | "Unable to send message. Check connection. [Retry]" | Retry button → `onSendMessage` | Mock SSE with `networkError: true` |
| SSE interrupts | Network disconnect mid-stream | `ErrorBanner` (inline in stream) | "Response interrupted. [Retry from beginning]" | Discard partial, user retries | Close SSE after 3 chunks |
| Context overflow | >200K tokens | `ContextPanel` | "Some context excluded. Review below." | Manual re-prime from excluded section | Mock context 250K tokens |
```

**Key benefits**: 60-80% token reduction while preserving all error recovery information.

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

**CONDENSED INLINE FORMAT** (to reduce token usage):

Instead of full TypeScript interfaces, use condensed inline format:

**Format**: `{ prop: Type, prop2?: Type, onAction: (params) => void, className?: string }`

**Example**:

```typescript
// OLD (verbose):
interface MessageInputProps {
  placeholder: string;
  isLoading: boolean;
  maxLength?: number;
  onSendMessage: (text: string) => void;
  onCancel?: () => void;
  className?: string;
}

// NEW (condensed):
{ placeholder: string, isLoading: bool, maxLength?: number, onSendMessage: (text) => void, onCancel?: () => void, className?: string }
```

**Key benefits**: 70% reduction in props documentation while preserving all type information.

#### Step 4.3: Document States to Design

**CONDENSED INLINE FORMAT** (to reduce token usage):

List states as comma-separated inline with brief description in parentheses:

**Format**: `State1 (brief), State2 (brief), State3 (brief)`

**Example**:

```
// OLD (verbose):
**MessageInput States**:
- Default: Empty input, enabled send button
- Typing: Text entered, character count shows, send button enabled
- Sending: Input disabled, send button shows spinner
- Error: Red border, error message below input
- Disabled: Grayed out, not interactive
- Focus: Blue border, keyboard accessible

// NEW (condensed):
**States**: Default (empty, enabled), Typing (counter, button enabled), Sending (disabled, spinner), Error (red border), Disabled (gray), Focus (blue border)
```

**Key benefits**: 70% reduction while preserving all state requirements.

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

**CONDENSED FORMAT** (to reduce token usage):

**For each pattern**:

```
### [Pattern Name]

**Where Used**: [List screens/components - brief]

**Brief Description**: [1-2 sentences summarizing the pattern flow]

**Components**: [List component names only]

**State Changes**: [Before] → [During] → [After]

**Keyboard**: [Key shortcuts if applicable]
```

**Example**:

```
// OLD (verbose - ~20 lines):
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

// NEW (condensed - ~7 lines):
### Modal Workflow
**Where Used**: Create Branch, Consolidate, File conflicts
**Brief Description**: User triggers modal → Modal opens with backdrop and focus trap → User interacts (form/confirmation) → User dismisses (Escape/Cancel/Submit) → Modal closes, focus returns.
**Components**: `Modal`, `ModalHeader`, `ModalBody`, `ModalFooter`
**State Changes**: Hidden → Visible (backdrop, focus trapped) → Hidden (focus restored)
**Keyboard**: `Escape` (close), `Enter` (submit if single input), `Tab` (trapped navigation)
```

**Key benefits**: 60-70% reduction, detailed behavior already documented in flows.

### 6. Define Layout & Spatial Relationships

For each screen, document:
1. **ASCII Layout Diagrams** (desktop + mobile)
2. **Layout Type** (brief description - e.g., "3-panel adaptive workspace")
3. **Panel Behavior Table** (if multi-panel layout)
4. **Dimensions Table** (key measurements)
5. **Component Spacing Table** (gap/margin/padding)
6. **Responsive Breakpoints** (brief inline list)

**Example**:

```
**ASCII Layout**:

Desktop (1440px):
┌──────────────────────────────────────────────────────────────┐
│ Header (64px)                                    [User] [⚙] │
├─────────────┬─────────────────────────────┬──────────────────┤
│             │                             │                  │
│  Sidebar    │  Main Content               │  Right Panel     │
│  (20%)      │  (50-80% adaptive)          │  (0-30%)         │
│             │                             │  [Closeable]     │
│  - Nav      │  - Thread Messages          │  - File Editor   │
│  - Files    │  - Input Field (sticky)     │  - Preview       │
│             │                             │                  │
│             │                             │                  │
└─────────────┴─────────────────────────────┴──────────────────┘

Mobile (375px):
┌─────────────────────────┐
│ Header (56px)     [≡] │
├─────────────────────────┤
│                         │
│  Main Content (100%)    │
│                         │
│  - Thread Messages      │
│  - Vertical Stack       │
│                         │
│                         │
│                         │
├─────────────────────────┤
│ Input Field (sticky)    │
└─────────────────────────┘
Note: Sidebar hidden in drawer, Right panel opens as full-screen modal

**Layout Type**: 3-panel adaptive workspace

**Panel Behavior**:
| Panel | Desktop (1440px+) | Mobile (375px) | Purpose | Closeable |
|-------|-------------------|----------------|---------|-----------|
| Left  | 20% fixed | Hidden (drawer) | Files/Threads nav | No |
| Center | 50-80% adaptive | 100% | Thread interface | No |
| Right | 0-30% adaptive | Full-screen modal | File editor | Yes |

**Dimensions**:
| Element | Desktop | Mobile | Notes |
|---------|---------|--------|-------|
| Header | Full width, 64px | Full width, 56px | - |
| Sidebar | 20% fixed | Hidden | Drawer toggles |
| Main | 50-80% adaptive | 100% | Shrinks when right panel opens |

**Component Spacing**:
| Context | Desktop | Mobile |
|---------|---------|--------|
| Component gaps | gap-4 (16px) | gap-3 (12px) |
| Section margins | mb-8 (32px) | mb-6 (24px) |
| Internal padding | p-6 (24px) | p-4 (16px) |

**Responsive**: Mobile (`< 768px`): Vertical stack, hide sidebar, sticky input | Tablet (`768px-1024px`): Sidebar overlay | Desktop (`> 1024px`): Full 3-panel
```

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

**Structure**:
```
## UX Flows

### [Screen 1 Name]
**Route**: /[route]

#### Flow 1: [Name]
#### Flow 2: [Name]

#### Layout & Spatial Design
[Document layout for this screen]

### [Screen 2 Name]
**Route**: /[route-2]

#### Flow 1: [Name]

## Component Library
[All components used across all screens]
```

**Fill all sections**:

1. **Overview**: Feature summary, user goals, design approach

2. **UX Flows**: For each screen from arch.md, document all flows with detailed steps, error scenarios, success criteria

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

- [ ] ALL screens/routes from arch.md documented
- [ ] ALL flows for each screen documented
- [ ] ALL user stories from spec.md covered (ALL priorities)
- [ ] All presentational components have prop specs
- [ ] Error scenarios documented for all flows
- [ ] Layout documented for each screen
- [ ] ASCII layout diagrams complete (desktop + mobile)
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

- ✅ Document ALL screens/routes from arch.md (not just P1/P2)
- ✅ Document ALL flows for each screen (one screen can have many flows)
- ✅ Map ALL user stories from spec.md to flows
- ✅ Extract component hierarchy from arch.md (don't recreate)
- ✅ Define granular steps (5-15 per flow) with exact components
- ✅ Document error scenarios with test data
- ✅ Document layout for each screen
- ✅ Document component UI state only (reference arch.md for global state)

**DON'T**:

- ❌ Confuse flows with screens (one screen can have many flows)
- ❌ Skip any screens/routes from arch.md
- ❌ Skip error scenarios (every flow needs errors documented)
- ❌ Make up components not in arch.md
- ❌ Use vague steps ("user interacts" - be specific!)

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

- Cover ALL screens/routes from arch.md (not just high-priority)
- Cover ALL flows per screen (don't confuse flows with screens)
- Cover ALL user stories from spec.md (ALL priorities)
- Cover ALL acceptance criteria (ALL priorities)
- Document layout for each screen
- Component UI state only (not global/URL state)
