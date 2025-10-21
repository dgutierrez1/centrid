I ca# Brand & Design System

**Last Updated**: 2025-01-15
**Status**: MVP Implementation Ready

---

## Quick Reference

**Brand Name**: Centrid
**Domain**: centrid.ai
**Tagline**: "Your central intelligence for content creation"
**Positioning**: AI for knowledge work with persistent context
**Primary Color**: `#ff4d4d` (Soft Coral-Red)

---

## Brand Foundation

### Core Brand Promise

**"Your central intelligence for content creation"**

Centrid is a mobile-first AI agent workspace where intelligent agents work with your documents.

### Key Messaging

**One-Liner** (Use everywhere):

```
AI For Knowledge Work With Persistent Context.
Stop Re-Explaining Context. Start Working Smarter.
```

**What We Do**:

- Upload documents once → AI maintains context → Work across multiple chats with shared document access

**For Whom**:

- Knowledge workers tired of re-explaining context to AI tools
- Power users experiencing context fragmentation across AI conversations

**Why It Matters**:

- Focus on knowledge work, not context management
- Eliminate the 12+ hours/week spent re-explaining context

### Positioning Strategy

**Market Framing**: "Knowledge work" (who it's for)
**Technical Benefit**: "Persistent context" (what we do differently)

| Situation           | Use This                | Avoid                       |
| ------------------- | ----------------------- | --------------------------- |
| Describing audience | "Knowledge workers"     | "Content creators", "Users" |
| Describing problem  | "Context fragmentation" | "Knowledge loss"            |
| Describing solution | "Persistent context"    | "Remembers everything"      |
| Describing benefit  | "Better knowledge work" | "More productive"           |

---

## Design Tokens

### Colors

```css
:root {
  /* Brand Colors */
  --color-centrid-primary: #ff4d4d;
  --color-centrid-dark: #27272a;
  --color-centrid-light: #f8f9fa;

  /* AI Agent Colors - Harmonized Coral System */
  --color-create: #ff4d4d; /* Primary coral for creation */
  --color-edit: #ff6d6d; /* Lighter coral for editing */
  --color-research: #ff7060; /* Warm coral for research */

  /* Semantic Colors */
  --color-success: #34c759;
  --color-warning: #ff9f0a;
  --color-error: #ff3b30;

  /* Neutrals */
  --gray-50: #f8f9fa;
  --gray-100: #e9ecef;
  --gray-200: #dee2e6;
  --gray-300: #adb5bd;
  --gray-500: #6c757d;
  --gray-700: #495057;
  --gray-900: #27272a;
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  :root {
    --color-centrid-light: #0d0d0d;
    --color-centrid-dark: #f2f2f7;
    --gray-50: #1c1c1e;
    --gray-100: #2c2c2e;
    --gray-900: #f2f2f7;

    /* Enhanced for dark mode visibility */
    --color-create: #ff6060;
    --color-edit: #ff8080;
    --color-research: #ff8570;
  }
}
```

**Brand Philosophy**: Harmonized coral system creates warmth and energy - techy yet approachable, unique without being common.

### Typography

```css
:root {
  /* Font Family */
  --font-primary: -apple-system, BlinkMacSystemFont, "SF Pro Text",
    "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif;

  /* Font Sizes */
  --font-display-lg: 57px;
  --font-display-md: 45px;
  --font-headline-lg: 32px;
  --font-headline-md: 24px;
  --font-body-lg: 16px;
  --font-body-md: 14px;
  --font-body-sm: 12px;

  /* Line Heights */
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
}
```

### Spacing & Layout

```css
:root {
  /* Spacing (4px grid) */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-xxl: 48px;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0px 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0px 2px 8px rgba(0, 0, 0, 0.04);
  --shadow-lg: 0px 4px 16px rgba(0, 0, 0, 0.08);
}
```

---

## Key Components

### Buttons

```css
/* Primary Button */
.btn-primary {
  background-color: var(--color-centrid-primary);
  color: white;
  padding: 12px 24px;
  border-radius: var(--radius-md);
  min-height: 44px;
  font-size: var(--font-body-md);
  font-weight: 600;
  transition: all 0.2s ease;
}

/* Agent-Specific */
.btn-agent-create {
  background-color: var(--color-create);
}
.btn-agent-edit {
  background-color: var(--color-edit);
}
.btn-agent-research {
  background-color: var(--color-research);
}
```

**Touch Targets**: Minimum 44px height/width for all interactive elements (mobile-first).

### Input Fields

```css
.input {
  height: 44px;
  padding: 12px 16px;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  font-size: var(--font-body-md);
}

.input:focus {
  border: 2px solid var(--color-centrid-primary);
  box-shadow: 0 0 0 2px rgba(255, 77, 77, 0.2);
}
```

### Cards

```css
.card {
  background-color: var(--gray-50);
  border: 1px solid var(--gray-100);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  box-shadow: var(--shadow-sm);
}

/* Agent-specific cards */
.card-agent {
  border-left: 3px solid var(--color-create);
}
```

---

## Mobile-First Responsive Design

### Breakpoints

```css
/* Base styles: 320px+ (mobile) */

@media (min-width: 768px) {
  /* Tablet styles */
}

@media (min-width: 1024px) {
  /* Desktop styles */
}
```

### Layout Patterns

```css
.container {
  width: 100%;
  padding: 0 var(--space-md);
  margin: 0 auto;
}

@media (min-width: 768px) {
  .container {
    max-width: 768px;
    padding: 0 var(--space-lg);
  }
}
```

---

## UX Principles

### Core UX Challenge

Users need seamless flow between three key workflows:

1. **AI Conversations** - Chat with agents about documents
2. **Document Work** - Read, edit, and manage files
3. **Change Management** - Review and approve AI-generated changes

### MVP UX Solution

**Simple Context-Aware Interface** - No complex state management, just essential functionality.

**Design Principles**:

1. **Simple Navigation** - Clear sections with basic back/forward
2. **Minimal Context** - Just show essential related information
3. **Linear Flows** - One task at a time, especially on mobile
4. **Basic Cross-References** - Simple clickable links between sections

### Key User Flows

**Flow 1: Basic AI Chat with Document Reference**

**Desktop**:

```
┌─ Header ────────────────────────────────┐
│ Chat Sidebar │ Main Chat Area          │
│ Recent Chats │ User: "Add metrics..."  │
│ Documents    │ AI: "I'll reference..." │
│              │ Referenced: 📄 doc.md   │
│              │ [Open Document]         │
└──────────────────────────────────────────┘
```

**Mobile**:

```
┌─ Header ─────────────────┐
│ User: Add metrics...     │
│ AI: I'll reference...    │
│ 📄 project.md            │
│ [Tap to Open]            │
│ [Type message...] [Send] │
│ [💬 Chat] [📂 Files]    │
└──────────────────────────┘
```

**Flow 2: AI Suggestions**

```
┌─ Document View ──────────────────┐
│ ## Overview                      │
│ • Monthly users: 50K             │
│                                  │
│ ┌─ AI Suggestion ──────────────┐ │
│ │ 💡 Add customer satisfaction │ │
│ │ "• Customer satisfaction..." │ │
│ │ [✅ Apply] [❌ Dismiss]      │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

---

## MVP Implementation Notes

### Accessibility

- Maintain color contrast ratios above 4.5:1
- Use semantic HTML elements
- Provide focus states for all interactive elements
- Support keyboard navigation

### Performance

- Optimize images (< 100KB each)
- Use WebP format with PNG fallback
- Lazy load below-the-fold content
- Maintain First Contentful Paint < 1s

### Mobile Optimization

- Single column layout on mobile
- Full-width CTA buttons
- Touch targets minimum 44px × 44px
- Readable text without zooming (16px minimum)

---

## Quick Start Checklist

### For Developers

```typescript
// Import design tokens
import "@/styles/design-tokens.css";

// Use CSS variables
const Button = styled.button`
  background: var(--color-centrid-primary);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  min-height: 44px;
`;
```

### For Designers

- Use Figma with design tokens file
- Follow 4px grid system
- Test designs at 320px, 768px, 1024px widths
- Ensure touch targets meet 44px minimum

### Implementation Priority

**Phase 1 (Launch MVP)**:

- [ ] Core color system
- [ ] Typography setup
- [ ] Button variants (primary, secondary, agent-specific)
- [ ] Input fields with focus states
- [ ] Card components
- [ ] Mobile-responsive layout

**Phase 2 (Post-Launch)**:

- [ ] Advanced animations
- [ ] Complex component variations
- [ ] Extended color palette
- [ ] Custom illustrations

---

## Reference Links

- Design tokens: `/src/styles/design-tokens.css`
- Component library: `/src/components/ui/`
- Mobile-first examples: See [UX flows](#key-user-flows) above

---

_This is a living document. Update as the brand evolves, but maintain consistency with core principles._
