# Centrid Design System Tokens

**Version**: 2.0.0
**Last Updated**: 2025-10-20
**Status**: Updated to match brand identity (coral-red system)

This file is the **single source of truth** for all design tokens in Centrid.

---

## Colors

### Brand Colors

**Primary (Centrid Coral)**
- Used for: Primary actions, links, active states, branding
- Tailwind: `primary-*` / `centrid-*`
- Main: `#ff4d4d` (centrid-primary) - Soft Coral-Red
- Hover/Dark: `#e63946` (darker coral for hover states)
- Light: `#ff6d6d` (lighter coral for backgrounds)

**Philosophy**: Harmonized coral system creates warmth and energy - techy yet approachable, unique without being common. Stands out from typical blue/purple AI tools.

**Agent Colors** (Harmonized Coral System)
- Create Agent: `#ff4d4d` (agent-create) - Primary coral for creation
- Edit Agent: `#ff6d6d` (agent-edit) - Lighter coral for editing
- Research Agent: `#ff7060` (agent-research) - Warm coral for research

**Dark Mode Adjustments**:
- Create: `#ff6060` (enhanced visibility)
- Edit: `#ff8080` (enhanced visibility)
- Research: `#ff8570` (enhanced visibility)

### System Colors

**Success (Green)**
- Main: `#34c759` (success-500) - iOS-inspired green
- Use for: Success messages, confirmations, positive states

**Warning (Yellow/Orange)**
- Main: `#ff9f0a` (warning-500) - iOS-inspired orange
- Use for: Warnings, caution states

**Error (Red)**
- Main: `#ff3b30` (error-500) - iOS-inspired red (distinct from coral)
- Use for: Error messages, destructive actions

### Neutral Colors

**Gray Scale** (secondary-* / gray-*)
- Use for: Backgrounds, borders, text hierarchy
- Centrid Dark: `#27272a` (zinc-800) - Primary dark background
- Centrid Light: `#f8f9fa` (gray-50) - Primary light background
- Full 50-900 scale available in Tailwind config

---

## Typography

### Font Families

**Sans Serif** (Primary)
- Stack: `-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif`
- Philosophy: Apple system fonts first (mobile-first), fallback to Inter
- Use for: All UI text, headings, body

**Monospace** (Code)
- Stack: `'JetBrains Mono', 'Menlo', 'Monaco', monospace`
- Use for: Code blocks, technical text

### Font Sizes

Based on brand spec (mobile-first):
- `text-xs`: 12px (0.75rem) - body-sm
- `text-sm`: 14px (0.875rem) - body-md
- `text-base`: 16px (1rem) - body-lg (default)
- `text-lg`: 18px (1.125rem)
- `text-xl`: 20px (1.25rem)
- `text-2xl`: 24px (1.5rem) - headline-md / H3
- `text-3xl`: 32px (2rem) - headline-lg / H2
- `text-4xl`: 45px (2.8125rem) - display-md / H1 (mobile)
- `text-5xl`: 57px (3.5625rem) - display-lg / Hero (desktop)

### Font Weights

- `font-normal`: 400 - Body text
- `font-medium`: 500 - Emphasis
- `font-semibold`: 600 - Subheadings
- `font-bold`: 700 - Headings

---

## Spacing

Use Tailwind's 4px-based scale (default):
- `1` = 4px
- `2` = 8px
- `3` = 12px
- `4` = 16px
- `6` = 24px
- `8` = 32px
- `12` = 48px
- `16` = 64px

**Common patterns**:
- Card padding: `p-6` (24px)
- Section spacing: `space-y-8` or `gap-8` (32px)
- Button padding: `px-4 py-2` (16px × 8px)

---

## Border Radius

Mobile-optimized (brand spec: 4px-12px range):
- `rounded-sm`: 2px
- `rounded`: 4px (brand: radius-sm)
- `rounded-md`: 8px (brand: radius-md) - **Default for inputs, buttons**
- `rounded-lg`: 12px (brand: radius-lg) - **Default for cards**
- `rounded-xl`: 16px (brand: radius-xl)
- `rounded-full`: 9999px - Badges, avatars, circular buttons

---

## Shadows

Subtle shadows (brand spec: 0.04-0.08 opacity):
- `shadow-sm`: 0px 1px 2px rgba(0, 0, 0, 0.04) - Cards at rest, inputs
- `shadow`: 0px 2px 4px rgba(0, 0, 0, 0.04) - Slight elevation
- `shadow-md`: 0px 2px 8px rgba(0, 0, 0, 0.04) - Dropdowns, popovers
- `shadow-lg`: 0px 4px 16px rgba(0, 0, 0, 0.08) - Modals, overlays
- `shadow-xl`: 0px 8px 24px rgba(0, 0, 0, 0.12) - Max elevation (dialogs)

---

## Animations

### Transitions

Use Tailwind utilities:
- `transition-colors`: Color changes (buttons, links)
- `transition-all`: Multiple properties
- Duration: `duration-150` (default for interactions)
- Easing: Tailwind defaults (ease-in-out)

### Keyframe Animations

Defined in `tailwind.config.js`:
- `animate-fade-in`: Fade in (0.5s)
- `animate-slide-up`: Slide up with fade (0.3s)
- `animate-slide-down`: Slide down with fade (0.3s)
- `animate-pulse-slow`: Slow pulse (3s)

---

## Breakpoints

Mobile-first (brand spec: 320px+ base):
- **Base**: 320px+ (mobile default)
- `xs`: 475px (custom - large phones)
- `sm`: 640px (small tablets)
- `md`: 768px (tablets) - **Brand spec tablet breakpoint**
- `lg`: 1024px (desktop) - **Brand spec desktop breakpoint**
- `xl`: 1280px (large desktop)
- `2xl`: 1536px (extra large desktop)

**Mobile-first approach**: Always design for mobile (320px) first, then enhance for larger screens.

---

## Component Patterns

### Buttons

**Variants**:
- Default (primary): Coral background (#ff4d4d), white text
- Secondary: Gray background
- Ghost: Transparent, hover background
- Destructive: Red background (#ff3b30)
- Outline: Border only

**Sizes** (mobile-optimized, 44px+ touch targets):
- `sm`: h-9 (36px), px-3 - Use sparingly
- `default`: h-10 (40px), px-4 - Close to 44px minimum
- `lg`: h-11 (44px), px-8 - **Recommended for mobile primary actions**
- `icon`: h-10 w-10 (40px square) - Icon-only buttons

### Inputs

**Base style** (mobile-optimized, 44px touch target):
- Height: `h-11` (44px) - **Mobile touch target minimum**
- Padding: `px-4 py-3` (12px vertical, 16px horizontal - brand spec)
- Border: `1px solid gray-300` (brand spec)
- Radius: `rounded-md` (8px - brand spec)
- Focus: `ring-2 ring-primary-500` (coral glow)
- Focus shadow: `0 0 0 2px rgba(255, 77, 77, 0.2)` - Coral focus ring

### Cards

**Structure** (brand spec):
- Border: `1px solid gray-100` (brand spec)
- Background: `bg-gray-50` light / `bg-gray-800` dark (brand spec)
- Shadow: `shadow-sm` (subtle - 0px 1px 2px rgba(0, 0, 0, 0.04))
- Radius: `rounded-lg` (12px - brand spec)
- Padding: `p-6` (24px - brand spec var(--space-lg))

**Agent-specific cards**:
- Border-left accent: `border-l-3 border-l-agent-create` (3px left border)

**Sections**:
- Header: `p-6` (24px all sides)
- Content: `p-6 pt-0` (24px sides, no top)
- Footer: `p-6 pt-0` (24px sides, no top)

---

## Dark Mode

**Strategy**: System preference-based (`prefers-color-scheme: dark`)

All components use Tailwind's `dark:` variant for dark mode styles.

**Key dark mode tokens**:
- Background: `dark:bg-gray-900`
- Card background: `dark:bg-gray-800`
- Text: `dark:text-white`
- Muted text: `dark:text-gray-400`
- Borders: `dark:border-gray-700`

---

## Accessibility

### Focus States

All interactive elements must have visible focus indicators:
- Ring: `focus-visible:ring-2 focus-visible:ring-primary-500`
- Offset: `focus-visible:ring-offset-2`

### Touch Targets

Minimum touch target size: **44×44px**

### Color Contrast

- Text on white: Minimum 4.5:1 ratio (WCAG AA)
- UI elements: Minimum 3:1 ratio

### Motion

Respect reduced motion preference:
- Handled automatically via Tailwind's `prefers-reduced-motion` support

---

## Usage Guidelines

### When to Use This File

✅ **Before** designing new features
✅ **During** design iterations
✅ **As reference** when implementing

### How to Update

1. Edit this file directly (it's the source of truth)
2. Update `tailwind.config.js` if adding new custom tokens
3. Update component implementations if token usage changes
4. Regenerate screenshots in design-sandbox after changes

### What NOT to Do

❌ Hard-code colors in components (use Tailwind classes)
❌ Create custom spacing values (use Tailwind scale)
❌ Skip dark mode variants
❌ Use arbitrary values unless absolutely necessary

---

## Centrid-Specific Tokens

These are unique to Centrid and extend Tailwind's defaults:

### Agent Colors

```css
agent: {
  create: '#7C3AED',
  edit: '#A855F7',
  research: '#6366F1',
}
```

Usage: `bg-agent-create`, `text-agent-edit`, `border-agent-research`

### Custom Breakpoint

```css
xs: '475px'
```

Usage: `xs:hidden`, `xs:flex`

---

## References

- **Tailwind Config**: `/tailwind.config.js`
- **Global CSS**: `/src/styles/globals.css`
- **shadcn Components**: `/src/components/ui/`
- **Design Showcase**: `/design-sandbox/pages/index.tsx`

---

**Next Steps**:
1. Use these tokens when creating feature designs
2. Reference this file in `/speckit.design` workflow
3. Update this file as design system evolves
4. Keep components in sync with tokens
