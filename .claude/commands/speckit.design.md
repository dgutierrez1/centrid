# Feature Design - Visual UI/UX Specification with Iteration

**Purpose**: Create high-fidelity visual design for a specific feature, leveraging the global design system and providing visual feedback for iteration.

**When to use**: After `/speckit.plan` completes, before `/speckit.tasks`

**Prerequisites**:
- Feature spec.md exists
- Global design system exists (`.specify/design-system/`)
- Plan.md exists (for technical context)

---

## Workflow

### Step 1: Load Context

```bash
.specify/scripts/bash/check-prerequisites.sh --json
```

Load:
- `specs/[FEATURE]/spec.md` - User stories, requirements
- `specs/[FEATURE]/plan.md` - Technical approach
- `.specify/design-system/foundation.md` - Design tokens
- `.specify/design-system/components.md` - Available components

### Step 2: Extract Design Requirements

From spec.md, identify:
- User-facing screens/views needed
- Interactive elements (buttons, forms, lists, etc.)
- Data display patterns (cards, tables, grids)
- State requirements (loading, error, empty, success)
- Mobile vs desktop differences

From plan.md, identify:
- Frontend framework (React, Vue, etc.)
- Styling approach (Tailwind, CSS-in-JS, etc.)
- Component library constraints

### Step 3: Map to Design System Components

For each screen/view in the feature:

**Analyze what's needed**:
- Which existing components from `components.md` can be used?
- Which components need variants not yet defined?
- Which components are entirely new?

**Create component inventory**:
```markdown
## Component Needs for [Feature]

### Existing Components (use as-is)
- Button (primary variant) - for submit actions
- Input (text variant) - for form fields
- Card (elevated variant) - for content containers

### Existing Components (need new variant)
- Button - need "icon-only" variant for mobile
- Input - need "search" variant with icon

### New Components (not in design system)
- [ComponentName] - [description, why needed]
```

### Step 4: Create Visual Design Specifications

Create `specs/[FEATURE]/design/` directory with:

#### `design.md` - Screen-by-Screen Visual Specification

For each screen/view:

```markdown
# Visual Design: [Feature Name]

## Screen 1: [Screen Name] (e.g., "Login Screen")

### Layout Structure

**Mobile (320-768px)**:
```
┌─────────────────────┐
│   [Logo/Header]     │
│                     │
│   [Main Form]       │
│   - Email Input     │
│   - Password Input  │
│   - Submit Button   │
│                     │
│   [Social Login]    │
│   [Footer Links]    │
└─────────────────────┘
```

**Desktop (1024px+)**:
```
┌──────────────┬──────────────┐
│              │              │
│  [Image/     │  [Logo]      │
│   Branding]  │              │
│              │  [Form]      │
│              │  [Social]    │
│              │              │
└──────────────┴──────────────┘
```

### Visual Specifications

**Header Area**:
- Logo: [dimensions, alignment]
- Background: `color.gray.50` (from design system)
- Padding: `spacing.lg` top/bottom (from design system)

**Form Container**:
- Max width: 400px (desktop), full-width minus `spacing.md` (mobile)
- Background: `color.white`
- Border radius: `borderRadius.medium`
- Shadow: `shadow.level-1`
- Padding: `spacing.xl`

**Email Input**:
- Component: Input (text variant)
- Label: "Email address" - `typography.bodySmall`, `color.gray.600`
- Placeholder: "you@example.com"
- Width: 100%
- Spacing below: `spacing.md`

**Password Input**:
- Component: Input (password variant)
- Label: "Password" - `typography.bodySmall`, `color.gray.600`
- Show/hide toggle: Icon button (eye icon)
- Width: 100%
- Spacing below: `spacing.lg`

**Submit Button**:
- Component: Button (primary variant, size: lg)
- Text: "Sign In"
- Width: 100%
- Loading state: Shows spinner, text changes to "Signing in..."

**Social Login Section**:
- Divider text: "Or continue with" - `typography.caption`, `color.gray.500`
- Button grid: 2 columns on mobile, 3 columns on desktop
- Gap: `spacing.sm`
- Components: Button (ghost variant) with provider logos

### States

**Default State**:
[Visual description or screenshot reference]

**Loading State**:
- Submit button shows spinner
- Form inputs disabled (opacity: 0.5)
- Cursor: wait

**Error State**:
- Invalid input: Red border (`color.error`), error message below in `typography.bodySmall`, `color.error`
- Failed submission: Toast notification (top-right, `shadow.level-4`)

**Success State**:
- Brief success toast, then redirect
- Animation: fade-out (400ms, easing: accelerate)

**Empty State** (if applicable):
[Description]

### Interactions

**On input focus**:
- Border color: `color.primary` (from gray)
- Shadow: `shadow.level-1`
- Transition: 150ms, easing: standard

**On button hover**:
- Background: `color.primary.hover`
- Transition: 150ms, easing: standard

**On form submit**:
- Validate all fields
- Show loading state
- Disable all inputs
- If error: shake animation (from design system)
- If success: fade to next screen

### Accessibility

**Keyboard Navigation**:
- Tab order: Email → Password → Show/Hide → Submit → Social buttons
- Enter key: Submit form from any input
- Escape key: Clear focused input

**Screen Reader**:
- Form has `aria-label="Sign in form"`
- Each input has associated label (for/id)
- Error messages have `aria-live="polite"`
- Loading state announces "Signing in, please wait"

**Focus Indicators**:
- All interactive elements: 2px solid `color.primary`, offset: 2px
- Visible on keyboard focus, not mouse click

### Responsive Behavior

**Breakpoint transitions**:
- 768px: Form transitions from full-width to centered card
- 1024px: Two-column layout appears

**Touch targets** (mobile):
- All buttons: minimum 44x44px
- Input height: 48px minimum
- Spacing between interactive elements: minimum `spacing.md`

### Animation Details

**Page enter**:
- Form fades in (0 → 1 opacity)
- Form slides up (20px → 0)
- Duration: 400ms
- Easing: decelerate
- Delay: 0ms

**Input validation**:
- Invalid shake: translateX(-10px → 10px → 0), 3 iterations
- Duration: 150ms per iteration
- Easing: standard

```

Repeat for each screen/view in the feature.

### Step 5: Generate Feature-Specific Component Code

For each screen, create implementation files:

`specs/[FEATURE]/design/components/[ScreenName].tsx`

```tsx
// Example: LoginScreen.tsx
import { Button, Input, Card } from '@/components/ui'; // Design system components
import { useState } from 'react';

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Implementation using design system components
  // All spacing, colors, typography from design tokens
};
```

**Key principle**: Use design system tokens, not hard-coded values
- ✅ `className="bg-gray-50 p-lg rounded-medium shadow-1"`
- ❌ `className="bg-[#F9FAFB] p-6 rounded-lg"`

### Step 6: Visual Iteration with Browser MCP (If Available)

**Setup**:
1. Copy component code to actual project directory temporarily
2. Create isolation wrapper: `src/app/design-preview/[feature]/page.tsx`
3. Start Next.js dev server (or use existing if running)
4. Get port number

**For each screen/component**:

```javascript
// Use Browser MCP to:
1. Navigate to http://localhost:[port]/design-preview/[feature]
2. Wait for page load (idle network)
3. Screenshot full page (mobile viewport: 375x812)
4. Screenshot full page (desktop viewport: 1440x900)
5. For each interactive state:
   - Trigger state (hover, focus, error, loading)
   - Screenshot
   - Reset
```

**Present to user**:
```markdown
## Visual Preview: [Screen Name]

### Mobile View
![Mobile default state](screenshot-mobile-default.png)

### Desktop View
![Desktop default state](screenshot-desktop-default.png)

### States
![Loading state](screenshot-loading.png)
![Error state](screenshot-error.png)

---
**Feedback questions**:
1. Does the spacing feel balanced?
2. Are the colors working well together?
3. Does the layout feel intuitive?
4. Any elements feeling too large/small?
5. Overall visual quality: approve or iterate?
```

**Iteration loop**:
- User provides feedback: "Make primary button darker", "Increase spacing around form"
- Update `design.md` with new token values OR update `.specify/design-system/foundation.md` if global change
- Regenerate component code
- Re-screenshot
- Present again
- Repeat until user approves

**Approval**:
- User says "approved" or "looks good"
- Mark design.md with `**Status**: Approved - [DATE]`
- Lock visual specifications

### Step 7: Create Design Review Checklist

Generate `specs/[FEATURE]/checklists/design.md`:

```markdown
# Design Quality Checklist: [Feature Name]

**Purpose**: Validate visual design completeness and quality

## Visual Consistency

- [ ] CHK-D01: All colors reference design system tokens (no hard-coded hex values)
- [ ] CHK-D02: All spacing uses design system scale (no arbitrary px values)
- [ ] CHK-D03: All typography uses design system scale (no custom font sizes)
- [ ] CHK-D04: All border radius uses design system values
- [ ] CHK-D05: All shadows use design system elevation levels

## Component States

- [ ] CHK-D06: Every interactive element has hover state defined
- [ ] CHK-D07: Every interactive element has focus state defined (accessibility)
- [ ] CHK-D08: Every interactive element has active/pressed state defined
- [ ] CHK-D09: Every interactive element has disabled state defined (if applicable)
- [ ] CHK-D10: Every async action has loading state defined
- [ ] CHK-D11: Every form/input has error state defined
- [ ] CHK-D12: Every data container has empty state defined (if applicable)

## Responsive Design

- [ ] CHK-D13: Mobile layout (320-768px) is fully specified
- [ ] CHK-D14: Tablet layout (769-1024px) is specified OR explicitly same as mobile
- [ ] CHK-D15: Desktop layout (1025px+) is fully specified
- [ ] CHK-D16: All images/media have responsive behavior defined
- [ ] CHK-D17: Navigation pattern adapts appropriately across breakpoints
- [ ] CHK-D18: Touch targets meet 44x44px minimum on mobile

## Accessibility

- [ ] CHK-D19: Keyboard navigation flow is documented and logical
- [ ] CHK-D20: All interactive elements have visible focus indicators
- [ ] CHK-D21: Color contrast meets WCAG AA (4.5:1 for text, 3:1 for UI)
- [ ] CHK-D22: All form inputs have associated labels (for/id or aria-label)
- [ ] CHK-D23: Error messages have aria-live regions for screen readers
- [ ] CHK-D24: All icons have text alternatives or aria-labels
- [ ] CHK-D25: Page structure uses semantic HTML (not div soup)

## Interaction Design

- [ ] CHK-D26: All transitions have specified duration and easing
- [ ] CHK-D27: Animations respect prefers-reduced-motion
- [ ] CHK-D28: Loading indicators appear for actions >200ms
- [ ] CHK-D29: Success feedback is provided for user actions
- [ ] CHK-D30: Error messages are specific and actionable

## Visual Polish

- [ ] CHK-D31: Alignment is precise (no off-by-1px issues)
- [ ] CHK-D32: Spacing is consistent (same gaps for same element types)
- [ ] CHK-D33: Visual hierarchy is clear (important elements stand out)
- [ ] CHK-D34: Information density is appropriate for context
- [ ] CHK-D35: Empty states are welcoming and guide next actions

## Mobile-Specific

- [ ] CHK-D36: Text is readable without zoom (minimum 16px body text)
- [ ] CHK-D37: Tap targets don't overlap or sit too close
- [ ] CHK-D38: Forms use appropriate input types (email, tel, number)
- [ ] CHK-D39: Horizontal scrolling is avoided (or intentional)
- [ ] CHK-D40: Fixed headers/footers don't obscure content

## Notes

[Space for findings during checklist review]
```

### Step 8: Output Summary

Report to user:

```
✅ Design specifications created:
   - specs/[FEATURE]/design/design.md (screen-by-screen specs)
   - specs/[FEATURE]/design/components/ (implementation code)
   - specs/[FEATURE]/checklists/design.md (quality validation)

📸 Visual previews generated:
   - [Count] screenshots across [Count] screens
   - [Count] state variations captured
   - Status: [Approved/Needs Iteration]

📋 Component inventory:
   - Existing components: [List]
   - New components needed: [List]
   - Design system updates needed: [List if any]

🎨 Design tokens used:
   - Colors: [primary, gray-50, error, etc.]
   - Typography: [h1, body, caption, etc.]
   - Spacing: [md, lg, xl, etc.]

Next steps:
→ Run /speckit.checklist design to validate completeness
→ Run /speckit.analyze to check consistency with spec
→ Run /speckit.tasks to generate implementation tasks (will include design-driven tasks)
```

---

## Browser MCP Integration Details

### Required MCP Capabilities

**Browser control**:
- Navigate to URL
- Set viewport size
- Wait for network idle
- Wait for selector
- Click element (to trigger states)
- Hover element (to capture hover states)
- Focus element (to capture focus states)
- Execute JavaScript (to trigger loading/error states)
- Take screenshot (full page, element-specific, viewport)

### Screenshot Strategy

**Capture types**:
1. **Full page** - Complete screen layout
2. **Component isolation** - Individual components with all variants
3. **State progression** - Before/after interactions
4. **Responsive comparison** - Side-by-side mobile/desktop

**Naming convention**:
- `[feature]-[screen]-[viewport]-[state].png`
- Example: `login-main-mobile-default.png`
- Example: `login-main-desktop-error.png`

**Storage**:
- Save to: `specs/[FEATURE]/design/screenshots/`
- Reference in design.md with relative paths
- Include in git (visual design is part of spec)

### Iteration Workflow with Browser MCP

```
┌─────────────────────────────────────┐
│ 1. Generate design.md + code       │
└───────────┬─────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│ 2. Start dev server, take screenshots│
└───────────┬─────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│ 3. Present to user with screenshots│
└───────────┬─────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│ 4. User feedback (text or specific) │
└───────────┬─────────────────────────┘
            ↓
    ┌───────┴────────┐
    │ Approved?      │
    └───────┬────────┘
            │
     ┌──────┴──────┐
   Yes              No
     │              │
     ↓              ↓
  Lock design    Parse feedback
                    │
                    ↓
              Update design.md/foundation.md
                    │
                    ↓
              Regenerate code
                    │
                    ↓
              Re-screenshot (only changed screens)
                    │
                    ↓
              Present delta ("Here's what changed")
                    │
                    └──────→ Back to step 3
```

### Fallback without Browser MCP

If Browser MCP is not available:

1. Generate design.md and code as normal
2. Instruct user to run dev server manually
3. Provide URLs to visit: `/design-preview/[feature]/[screen]`
4. User reviews in their browser
5. User provides text feedback
6. Update design based on text feedback
7. Notify user to refresh browser
8. Repeat

**Trade-off**: Slower iteration, requires user to context-switch

---

## Example: Login Feature Design

**Input**:
- Feature: "User authentication with email/password and social login"
- User stories: P1: Email login, P2: Social login, P3: Password reset

**Output**:

`specs/003-auth/design/design.md`:
- Screen 1: Login (mobile + desktop layouts, all states, interactions)
- Screen 2: Sign Up (mobile + desktop layouts, all states, interactions)
- Screen 3: Password Reset (mobile + desktop layouts, all states, interactions)

`specs/003-auth/design/components/`:
- LoginScreen.tsx (implementation using design system)
- SignUpScreen.tsx
- PasswordResetScreen.tsx

`specs/003-auth/design/screenshots/`:
- login-main-mobile-default.png
- login-main-mobile-error.png
- login-main-desktop-default.png
- signup-main-mobile-default.png
- ... (all states, all screens, all viewports)

`specs/003-auth/checklists/design.md`:
- 40-item checklist validating design completeness

**Browser MCP output**:
```
📸 Generated 24 screenshots:
   - 3 screens × 2 viewports × 4 states = 24 images

🎨 Preview: Login Screen
   Mobile: [Screenshot embedded]
   Desktop: [Screenshot embedded]

   Feedback? (type 'approved' or describe changes)
```

User: "The primary button feels too bright, can we tone it down? Also increase spacing between inputs"

Claude updates:
- `.specify/design-system/foundation.md`: Primary color #3B82F6 → #2563EB
- `specs/003-auth/design/design.md`: Input spacing `spacing.md` → `spacing.lg`
- Regenerates LoginScreen.tsx
- Re-screenshots only login screens (6 images)

```
📸 Updated screenshots (login screen only):
   Mobile: [New screenshot]
   Desktop: [New screenshot]

   Changes applied:
   ✓ Primary button color darkened
   ✓ Input spacing increased

   Feedback?
```

User: "Perfect! Approved"

Claude locks design.md as approved.

---

## Integration with Existing Workflow

**Updated complete workflow**:

```
/speckit.specify
    ↓ (spec.md with user stories, requirements)

/speckit.plan
    ↓ (plan.md with architecture, tech stack)

/speckit.design ← NEW, VISUAL ITERATION HAPPENS HERE
    ↓ (design.md, component code, screenshots, approval)

/speckit.tasks
    ↓ (generates design-driven implementation tasks)

/speckit.implement
    ↓ (build features using approved designs)
```

**Task generation changes**:
When `/speckit.tasks` runs after `/speckit.design`, it will:
- Read approved design.md
- Extract component requirements
- Generate implementation tasks like:
  ```
  - [ ] T010 [P] [US1] Implement LoginScreen per design/design.md
  - [ ] T011 [US1] Add responsive breakpoints per design/design.md
  - [ ] T012 [US1] Add all component states (hover, focus, active, disabled, loading, error)
  - [ ] T013 [US1] Validate accessibility per checklists/design.md
  - [ ] T014 [US1] DESIGN REVIEW: Verify implementation matches approved screenshots
  ```
