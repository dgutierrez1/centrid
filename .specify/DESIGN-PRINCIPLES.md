# Design Principles - What Makes Perfect UI

This document outlines the key levers, considerations, and principles that result in exceptional UI/UX design. These are the foundational decisions that, when made correctly, create cohesive, beautiful, usable interfaces.

---

## The 10 Design Levers for Perfect UI

### 1. **Visual Hierarchy** - Making Important Things Feel Important

**What it is**: The art of making users see the right thing at the right time.

**Key decisions**:
- What's the ONE primary action per screen? (Make it visually dominant)
- What's secondary? (Make it present but not competing)
- What's tertiary? (Make it discoverable but quiet)

**How to achieve it**:
- **Size**: Larger elements draw attention (primary button > secondary button)
- **Color**: High contrast draws attention (primary color button vs. gray button)
- **Weight**: Bold/heavy draws attention (headings vs. body text)
- **Position**: Top-left (in LTR languages) gets seen first, center gets focus
- **Spacing**: More whitespace around element = more important
- **Motion**: Animated elements draw attention (use sparingly)

**Common mistakes**:
- ❌ Everything is bold/big/colorful = nothing stands out
- ❌ Primary action is same size/color as secondary
- ❌ Too many competing focal points

**Perfect UI example**:
- One large primary button (Call-to-Action)
- Supporting text is smaller, lower contrast
- Destructive actions are clearly differentiated (red, outlined)
- Navigation is present but doesn't compete with content

---

### 2. **Consistency** - Building User Confidence Through Predictability

**What it is**: Similar things look similar, behave similarly, appear in similar places.

**Key decisions**:
- What's your button hierarchy? (primary, secondary, tertiary, danger)
- What spacing value for "related items"? (same everywhere)
- What spacing value for "section breaks"? (same everywhere)
- Where do success/error messages appear? (same place every time)

**How to achieve it**:
- **Design tokens**: Use variables, not hard-coded values
  - ✅ `spacing.md` everywhere for "related items"
  - ❌ Sometimes 12px, sometimes 16px for same purpose

- **Component reuse**: Build once, use everywhere
  - ✅ One Button component with variants
  - ❌ Different button styles on different pages

- **Pattern library**: Document "when to use what"
  - Modals for blocking actions
  - Toasts for non-blocking feedback
  - Inline errors for form validation

**Common mistakes**:
- ❌ Same element looks different in different contexts
- ❌ Same action triggered different ways in different places
- ❌ Spacing feels random/haphazard

**Perfect UI example**:
- All primary buttons same color, size, behavior
- All cards have same border radius, shadow, padding
- All form validation errors appear inline below input
- All success notifications appear top-right as toast

---

### 3. **Information Density** - Showing the Right Amount

**What it is**: Balancing how much information appears at once.

**Key decisions**:
- Is this a data-dense tool (analytics dashboard) or content-focused (blog)?
- Mobile: What's essential vs. what can be hidden/collapsed?
- Desktop: What can expand vs. what stays compact?

**How to achieve it**:
- **Progressive disclosure**: Show basics, reveal details on demand
  - List view: Show title + key metadata
  - Detail view: Show full information

- **Chunking**: Group related information visually
  - Cards for distinct items
  - Sections for related groups
  - Whitespace between unrelated groups

- **Truncation with expansion**: Don't hide, but don't overwhelm
  - Truncate long text with "Read more"
  - Collapse long lists with "Show all"

**Spectrum**:
```
Dense                     Balanced                     Spacious
│                         │                            │
Bloomberg Terminal        Gmail                        Apple.com
Analytics Dashboard       Notion                       Portfolio Site
Data Table                Form                         Landing Page
```

**Common mistakes**:
- ❌ Too dense: Wall of text, visual chaos
- ❌ Too sparse: Excessive scrolling, wasted space
- ❌ Inconsistent density across similar screens

**Perfect UI example**:
- Mobile: Show 3 key fields in list, full details on tap
- Desktop: Show 8 fields in table, expandable rows for more
- Settings: Group related options, collapse advanced settings
- Forms: Show required fields, expand optional with toggle

---

### 4. **Color with Purpose** - Every Color Should Mean Something

**What it is**: Colors communicate meaning, not just decoration.

**Key decisions**:
- **Primary color**: Brand moments, primary actions (what's your ONE brand color?)
- **Semantic colors**:
  - Success (green): Confirmations, completion, positive states
  - Warning (yellow/orange): Caution, reversible errors, warnings
  - Error (red): Failures, destructive actions, critical issues
  - Info (blue): Neutral information, hints, education

- **Neutral colors**:
  - Gray scale: Text hierarchy, borders, backgrounds
  - Lightest: Page background
  - Light: Card background, subtle borders
  - Medium: Placeholder text, disabled states
  - Dark: Body text
  - Darkest: Headings, high-emphasis text

**How to achieve it**:
- **Semantic consistency**: Green always means success, red always means error
- **Color restraint**: Use brand color sparingly for impact
  - ✅ Primary button, active states, key icons
  - ❌ Entire sections, multiple elements competing

- **Accessibility first**: 4.5:1 contrast for text, 3:1 for UI elements
- **Dark mode consideration**: Design both modes, not just invert

**Common mistakes**:
- ❌ Using colors randomly "to make it colorful"
- ❌ Red means error on one screen, branding on another
- ❌ Low contrast text (gray on light gray)
- ❌ Too many brand colors (one is enough!)

**Perfect UI example**:
- One primary brand color (blue) for CTAs and active states
- Green exclusively for success states
- Red exclusively for errors/destructive actions
- Grays for everything else (text, borders, backgrounds)
- Consistent in both light and dark modes

---

### 5. **Typography Hierarchy** - Making Text Scannable

**What it is**: Using size, weight, and spacing to create clear content structure.

**Key decisions**:
- **Type scale**: What's your size ratio? (1.25 = subtle, 1.333 = balanced, 1.5 = dramatic)
- **Font pairing**: Display font + body font (or one font family with varied weights?)
- **Line height**: Reading comfort
  - Tight (1.2): Headings, compact text
  - Normal (1.5): Body text, forms
  - Loose (1.8): Long-form reading

**How to achieve it**:
- **Clear heading levels**: H1 > H2 > H3 > Body (obvious size difference)
- **Weight variation**:
  - Bold (700): Headings, emphasis
  - Semibold (600): Subheadings, labels
  - Regular (400): Body text
  - Light (300): Captions, de-emphasized text

- **Size limits**:
  - Mobile: Minimum 16px body text (avoid zoom on focus)
  - Desktop: 14-18px body text (readability)
  - Line length: 50-75 characters per line (optimal reading)

**Common mistakes**:
- ❌ Too many font sizes (6+ sizes = visual chaos)
- ❌ Headings barely larger than body text
- ❌ Tiny text (12px body text on mobile)
- ❌ Overly long lines (100+ characters = hard to track)

**Perfect UI example**:
- H1: 32px / 48px (mobile / desktop), bold
- H2: 24px / 32px, semibold
- H3: 20px / 24px, semibold
- Body: 16px / 18px, regular, line-height 1.5
- Caption: 14px, regular, line-height 1.4
- Max 5 total sizes, clear hierarchy

---

### 6. **Spacing Rhythm** - The Invisible Grid That Creates Harmony

**What it is**: Consistent, mathematical spacing that makes things feel "right."

**Key decisions**:
- **Base unit**: 4px (tight), 8px (balanced), 12px (spacious)
- **Scale**: Multipliers of base unit
  - 8px base: [8, 16, 24, 32, 40, 48, 64, 80, 96]
  - Names: [xs, sm, md, lg, xl, 2xl, 3xl, 4xl, 5xl]

**How to use**:
- **Micro spacing** (xs, sm): Within components
  - Icon + text: 8px gap
  - Form label + input: 8px gap
  - Button padding: 12px horizontal, 8px vertical

- **Macro spacing** (md, lg, xl): Between components
  - Related cards: 16px gap
  - Section breaks: 32px gap
  - Page-level sections: 48-64px gap

- **Layout spacing** (2xl, 3xl+): Page structure
  - Container padding: 24px mobile, 48px desktop
  - Header/footer height: 64px
  - Sidebar width: 256px (16px × 16)

**How to achieve it**:
- **Grid thinking**: Everything aligns to 8px grid
- **Token usage**: Never arbitrary values
  - ✅ `gap-md` (16px from design system)
  - ❌ `gap-[15px]` (arbitrary, breaks rhythm)

**Common mistakes**:
- ❌ Random spacing (13px here, 19px there)
- ❌ Inconsistent gaps between similar elements
- ❌ Too tight everywhere (cramped feeling)
- ❌ Too loose everywhere (disconnected feeling)

**Perfect UI example**:
- All components align to 8px grid
- Related items: 16px gap consistently
- Unrelated sections: 32px gap consistently
- Breathing room without feeling sparse

---

### 7. **Feedback & Affordance** - Making Interactivity Obvious

**What it is**: Users know what's clickable, what happened after an action, and what's happening now.

**Key decisions**:
- **Affordance**: Making interactive elements look interactive
  - Buttons look pressable (shadow, border, hover state)
  - Links look clickable (underline, color, cursor)
  - Disabled looks disabled (low opacity, no hover)

- **Feedback**: Communicating state changes
  - Hover: "This is interactive" (color change, shadow increase)
  - Active/Pressed: "You're clicking me" (shadow decrease, transform)
  - Loading: "I'm working on it" (spinner, skeleton, progress bar)
  - Success: "It worked!" (toast, checkmark, color change)
  - Error: "Something went wrong" (error message, red border, icon)

**How to achieve it**:
- **Every interactive element has 5+ states**:
  1. Default (at rest)
  2. Hover (mouse over)
  3. Focus (keyboard navigation)
  4. Active (being clicked)
  5. Disabled (not available)

- **Transitions for polish** (150-250ms):
  - Hover: color, shadow, transform changes smoothly
  - Loading: fade in spinner after 200ms (avoid flash for quick actions)
  - Success: slide-in toast, fade-out after 3s

- **Timing**:
  - Micro-interactions: 150ms (button hover)
  - Transitions: 250ms (modal open/close)
  - Animations: 400ms (page transitions)

**Common mistakes**:
- ❌ No hover state (user doesn't know it's clickable)
- ❌ No loading state (user doesn't know it's working)
- ❌ No success feedback (user doesn't know it worked)
- ❌ Instant state changes (feels jarring, not polished)

**Perfect UI example**:
- Buttons change color on hover (150ms transition)
- Buttons show spinner on click for async actions
- Success toast appears top-right, auto-dismisses
- Form submissions disable inputs + button during processing
- All states are obvious and expected

---

### 8. **Mobile-First Responsive** - Designing for Constraints First

**What it is**: Start with mobile (most constrained), progressively enhance for larger screens.

**Key decisions**:
- **Mobile (320-768px)**: What's essential?
  - Single column layout
  - Stacked navigation (hamburger or bottom nav)
  - Touch-friendly targets (44x44px minimum)
  - Simplified interactions (no hover states)

- **Tablet (768-1024px)**: What can expand?
  - Two-column layout where appropriate
  - Side navigation can appear
  - More information density

- **Desktop (1024px+)**: What can enhance?
  - Multi-column layouts
  - Persistent navigation
  - Hover interactions
  - Keyboard shortcuts

**How to achieve it**:
- **Fluid typography**: `clamp(16px, 2vw, 18px)` (scales with viewport)
- **Flexible layouts**: CSS Grid with `auto-fit`, `minmax()`
- **Component adaptation**: Same component, different layout
  - Mobile: Vertical stack
  - Desktop: Horizontal row

- **Content priority**:
  - P1 content: Always visible
  - P2 content: Collapsed on mobile, visible on desktop
  - P3 content: Hidden on mobile, expandable on desktop

**Common mistakes**:
- ❌ Designing desktop first, cramming into mobile
- ❌ Hiding critical features on mobile
- ❌ Tiny touch targets on mobile (< 44px)
- ❌ Horizontal scrolling (except intentional carousels)

**Perfect UI example**:
- Mobile: Single column, bottom nav, large touch targets
- Tablet: Two columns, side nav appears
- Desktop: Three columns, persistent sidebar, keyboard shortcuts
- All breakpoints feel intentional, not just "smaller"

---

### 9. **Accessibility** - Designing for Everyone

**What it is**: Ensuring your interface works for users with disabilities.

**Key considerations**:
- **Visual**: Color blindness, low vision, blindness
  - Contrast ratios (WCAG AA: 4.5:1 text, 3:1 UI)
  - Don't rely on color alone (use icons + text)
  - Screen reader support (semantic HTML, ARIA labels)

- **Motor**: Limited dexterity, keyboard-only users
  - Large touch targets (44x44px)
  - Keyboard navigation (tab order, shortcuts)
  - Focus indicators (visible, high contrast)

- **Cognitive**: Dyslexia, ADHD, cognitive impairments
  - Clear language (avoid jargon)
  - Consistent patterns (same action = same result)
  - Error prevention (confirmations for destructive actions)

**How to achieve it**:
- **Semantic HTML**: `<button>` not `<div onclick>`, `<nav>`, `<main>`, `<header>`
- **ARIA labels**: `aria-label`, `aria-labelledby`, `aria-describedby`
- **Keyboard navigation**:
  - Tab order is logical (top-to-bottom, left-to-right)
  - All actions accessible via keyboard
  - Escape closes modals, Enter submits forms
  - Focus trap in modals (can't tab outside)

- **Focus indicators**: 2px outline, high contrast, visible offset
- **Screen reader announcements**: `aria-live` for dynamic content
- **Reduced motion**: Respect `prefers-reduced-motion` media query

**Common mistakes**:
- ❌ Low contrast text (gray on light gray)
- ❌ Color-only indicators (red/green without labels)
- ❌ Div soup (no semantic structure)
- ❌ No focus indicators (keyboard users lost)
- ❌ Animations that can't be disabled

**Perfect UI example**:
- All text meets WCAG AA contrast ratios
- All interactive elements keyboard accessible
- All states announced to screen readers
- All animations respect reduced motion preference
- Error messages are specific, not just "Error occurred"

---

### 10. **Loading, Error, Empty States** - Designing the Gaps

**What it is**: The "between moments" that users experience while waiting, failing, or starting.

**Key decisions**:
- **Loading states**: What users see during async operations
  - < 200ms: No loading indicator (feels instant)
  - 200ms - 1s: Spinner or indeterminate progress
  - 1s+: Skeleton screens (content placeholder) or progress bar

- **Error states**: What users see when something fails
  - What went wrong? (Specific error message)
  - Why did it fail? (Context: network, validation, server)
  - What can I do? (Action: retry, contact support, go back)

- **Empty states**: What users see when no data exists
  - Why is this empty? ("No documents yet")
  - What can I do? ("Upload your first document")
  - Visual: Illustration + helpful text + CTA button

**How to achieve it**:
- **Loading patterns**:
  - Skeleton screens: Gray boxes matching content layout
  - Spinner: Center of container with "Loading..." text
  - Progress bar: For operations with known duration
  - Optimistic UI: Show success immediately, rollback if fails

- **Error patterns**:
  - Inline: For form validation (below input)
  - Toast: For non-blocking errors (top-right, auto-dismiss)
  - Modal: For blocking errors (requires acknowledgment)
  - Boundary: For catastrophic errors (full-page error state)

- **Empty patterns**:
  - Illustration (friendly, on-brand)
  - Heading: "No [items] yet"
  - Subtext: "Get started by [action]"
  - CTA: Primary button to create first item

**Common mistakes**:
- ❌ No loading indicator (users think it's broken)
- ❌ Generic error: "Error occurred" (not helpful)
- ❌ Empty state is just blank white space
- ❌ Loading flashes for instant operations (< 200ms)

**Perfect UI example**:
- Fast actions (<200ms): No spinner, just instant feedback
- Slow actions: Skeleton screen while loading
- Errors: Specific message + suggested action
- Empty states: Welcoming, guide user to first action
- All states feel intentional, not overlooked

---

## The Design System Workflow

### Global Decisions (One-Time)

These establish the foundation and should be made once, refined rarely:

1. **Color Palette**: Primary brand color, semantic colors, gray scale
2. **Typography**: Font families, type scale, weights
3. **Spacing**: Base unit, spacing scale
4. **Border Radius**: Sharp, subtle, rounded scale
5. **Shadows**: Elevation levels (none, subtle, medium, high)
6. **Animation**: Timing scale, easing curves
7. **Breakpoints**: Mobile, tablet, desktop exact values
8. **Component Primitives**: Button, Input, Card, etc. with all variants

**Output**: `.specify/design-system/foundation.md` + component library

### Feature Decisions (Per Feature)

These apply the global system to specific features:

1. **Screen Inventory**: What screens/views does this feature need?
2. **Layout Composition**: How do screens arrange on mobile vs. desktop?
3. **Component Usage**: Which design system components are used where?
4. **Interaction Flows**: What happens when user clicks, types, submits?
5. **State Coverage**: Loading, error, empty, success states for each screen
6. **Accessibility Flow**: Keyboard navigation, screen reader announcements

**Output**: `specs/[FEATURE]/design/design.md` + visual previews

---

## The Visual Iteration Loop (with Browser MCP)

```
1. Make global/feature design decisions
   ↓
2. Generate code (React + Tailwind using design tokens)
   ↓
3. Render in isolation (local dev server)
   ↓
4. Screenshot with Browser MCP (mobile + desktop + all states)
   ↓
5. Present screenshots to user
   ↓
6. User feedback: "Looks perfect!" OR "Change X, Y, Z"
   ↓
7. If changes needed:
   - Update design tokens OR feature design
   - Regenerate code
   - Re-screenshot
   - Back to step 5
   ↓
8. User approves → Lock design → Generate implementation tasks
```

**Key insight**: Visual iteration happens BEFORE implementation begins. Once approved, implementation is just "build what was approved" with design review gates to ensure fidelity.

---

## Perfect UI Checklist

Use this to evaluate any design:

### Visual Foundation
- [ ] Clear visual hierarchy (primary action is obvious)
- [ ] Consistent spacing (uses design system tokens)
- [ ] Consistent typography (uses design system scale)
- [ ] Purposeful color use (not decorative)
- [ ] Appropriate information density for context

### Interactivity
- [ ] All interactive elements have hover/focus/active states
- [ ] All async actions have loading states
- [ ] All actions provide success/error feedback
- [ ] Touch targets meet 44x44px minimum (mobile)
- [ ] Transitions feel smooth (150-250ms)

### Responsive
- [ ] Mobile layout feels intentional (not just cramped desktop)
- [ ] Breakpoint transitions are smooth (no sudden jumps)
- [ ] Content priority is clear (what's essential vs. nice-to-have)
- [ ] Navigation adapts appropriately (bottom nav → sidebar)

### Accessibility
- [ ] Text contrast meets WCAG AA (4.5:1 minimum)
- [ ] Keyboard navigation is logical
- [ ] Focus indicators are visible
- [ ] Screen reader announcements are meaningful
- [ ] Animations respect prefers-reduced-motion

### Edge Cases
- [ ] Loading states are designed (not forgotten)
- [ ] Error states are helpful (specific + actionable)
- [ ] Empty states are welcoming (guide next action)
- [ ] Success states provide closure

### Polish
- [ ] Alignment is precise (no off-by-1px)
- [ ] Spacing feels rhythmic (not random)
- [ ] Visual weight is balanced (not heavy on one side)
- [ ] Feels cohesive (part of same family)

---

## Summary: The Path to Perfect UI

**Foundation**:
1. Establish design system (colors, typography, spacing, components)
2. Make global decisions once, apply consistently

**Per Feature**:
1. Define screens, layouts, interactions in text (design.md)
2. Generate code using design system tokens
3. Render and screenshot with Browser MCP
4. Iterate visually until approved
5. Lock design, generate implementation tasks
6. Build with design review gates

**The Secret**: Perfect UI isn't about making every pixel perfect once. It's about making foundational decisions that create coherence, then applying those decisions consistently across every feature. The visual iteration loop (enabled by Browser MCP) lets you see and refine before committing to implementation.
