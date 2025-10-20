# Design System Setup - Global Visual Foundation

**Purpose**: Establish the global design system foundation that all features will use. This is a ONE-TIME setup that defines the visual DNA of your application.

**When to use**:
- At project start (before implementing features)
- When rebranding or doing major visual overhaul
- When establishing design consistency across the application

**Prerequisites**: None (this is typically the first design step)

---

## Workflow

### Step 1: Check for Existing Design System

```bash
.specify/scripts/bash/check-prerequisites.sh --json --paths-only
```

Look for `.specify/design-system/` directory. If it exists, ask user if they want to:
- Update existing design system
- View current design system
- Proceed with existing system

### Step 2: Interactive Design Foundation Questionnaire

Ask the user these questions to establish the visual foundation:

#### Brand & Personality
1. **What's the visual personality?** (Choose 1-2)
   - [ ] Professional & Trustworthy (banking, healthcare, enterprise)
   - [ ] Modern & Minimal (productivity, SaaS, tech)
   - [ ] Playful & Friendly (consumer apps, social, gaming)
   - [ ] Bold & Expressive (creative tools, media, entertainment)
   - [ ] Clean & Elegant (luxury, design-focused, premium)

2. **What's the primary use case?**
   - [ ] Mobile-first consumer app
   - [ ] Desktop productivity tool
   - [ ] Cross-platform responsive web app
   - [ ] Native mobile app (iOS/Android)

3. **Reference inspirations** (optional):
   - Provide URLs to apps/sites with similar desired aesthetic
   - Will use Browser MCP to analyze visual patterns

#### Color Direction
4. **Primary brand color** (choose one):
   - Provide hex code OR choose from: Blue (trust), Green (growth), Purple (creative), Red (energy), Orange (friendly), Neutral (minimal)

5. **Color mood**:
   - [ ] Vibrant & Saturated (high energy, bold)
   - [ ] Soft & Muted (calm, sophisticated)
   - [ ] Dark Mode First (dark backgrounds, light text)
   - [ ] Light Mode First (light backgrounds, dark text)

#### Visual Style
6. **Border radius preference**:
   - [ ] Sharp (0px - modern, minimal)
   - [ ] Subtle (4px - balanced)
   - [ ] Rounded (8-12px - friendly)
   - [ ] Very Rounded (16px+ - playful)

7. **Spacing density**:
   - [ ] Compact (4px base unit - dense, data-heavy)
   - [ ] Comfortable (8px base unit - balanced)
   - [ ] Spacious (12px+ base unit - minimal, editorial)

8. **Shadow/Elevation style**:
   - [ ] Flat (no shadows - minimal, modern)
   - [ ] Subtle (soft shadows - material design)
   - [ ] Bold (prominent shadows - depth, layering)

#### Typography
9. **Font personality**:
   - [ ] Sans-serif Modern (clean, tech-forward)
   - [ ] Sans-serif Geometric (precise, structured)
   - [ ] Sans-serif Humanist (friendly, approachable)
   - [ ] Serif (editorial, sophisticated)
   - [ ] Monospace (technical, developer-focused)

10. **Type scale**:
    - [ ] Tight (1.125 ratio - subtle hierarchy)
    - [ ] Standard (1.25 ratio - balanced)
    - [ ] Expressive (1.333+ ratio - strong hierarchy)

### Step 3: Generate Design System Files

Create `.specify/design-system/` directory with:

#### `foundation.md` - Core Design Tokens

```markdown
# Design System Foundation

**Version**: 1.0.0
**Last Updated**: [DATE]
**Status**: Active

## Visual Personality

[Selected personality with rationale]

## Color Palette

### Brand Colors
- **Primary**: `#[HEX]` - [Usage: main actions, brand moments]
- **Primary Hover**: `#[HEX]` - [Interactive states]
- **Primary Active**: `#[HEX]` - [Pressed states]

### Semantic Colors
- **Success**: `#[HEX]` - [Confirmations, success states]
- **Warning**: `#[HEX]` - [Cautions, warnings]
- **Error**: `#[HEX]` - [Errors, destructive actions]
- **Info**: `#[HEX]` - [Informational messages]

### Neutrals
- **Gray 50**: `#[HEX]` - [Backgrounds, subtle fills]
- **Gray 100**: `#[HEX]` - [Hover states, borders]
- **Gray 200**: `#[HEX]` - [Disabled states]
- **Gray 300**: `#[HEX]` - [Borders, dividers]
- **Gray 400**: `#[HEX]` - [Placeholder text]
- **Gray 500**: `#[HEX]` - [Secondary text]
- **Gray 600**: `#[HEX]` - [Primary text]
- **Gray 700**: `#[HEX]` - [Headings]
- **Gray 800**: `#[HEX]` - [High emphasis text]
- **Gray 900**: `#[HEX]` - [Maximum contrast]

### Dark Mode Variants (if applicable)
[Mirror palette for dark backgrounds]

## Typography Scale

### Font Families
- **Display/Heading**: [Font name, fallback stack]
- **Body**: [Font name, fallback stack]
- **Monospace**: [Font name, fallback stack]

### Type Scale ([ratio])
- **Heading 1**: [size]px / [line-height] - [weight] - [usage]
- **Heading 2**: [size]px / [line-height] - [weight] - [usage]
- **Heading 3**: [size]px / [line-height] - [weight] - [usage]
- **Heading 4**: [size]px / [line-height] - [weight] - [usage]
- **Body Large**: [size]px / [line-height] - [weight] - [usage]
- **Body**: [size]px / [line-height] - [weight] - [usage]
- **Body Small**: [size]px / [line-height] - [weight] - [usage]
- **Caption**: [size]px / [line-height] - [weight] - [usage]

## Spacing System

**Base Unit**: [4px/8px/12px]

### Scale
- **xs**: [value]px - [usage: tight gaps, icon padding]
- **sm**: [value]px - [usage: compact spacing]
- **md**: [value]px - [usage: default spacing]
- **lg**: [value]px - [usage: section spacing]
- **xl**: [value]px - [usage: major section breaks]
- **2xl**: [value]px - [usage: page-level spacing]

## Border Radius

- **None**: 0px - [usage]
- **Small**: [value]px - [usage: buttons, inputs]
- **Medium**: [value]px - [usage: cards, modals]
- **Large**: [value]px - [usage: prominent containers]
- **Full**: 9999px - [usage: pills, avatars]

## Shadows/Elevation

- **Level 1**: [CSS shadow] - [usage: cards, hover states]
- **Level 2**: [CSS shadow] - [usage: dropdowns, popovers]
- **Level 3**: [CSS shadow] - [usage: modals, drawers]
- **Level 4**: [CSS shadow] - [usage: notifications, toasts]

## Animation

### Timing
- **Fast**: 150ms - [usage: micro-interactions]
- **Normal**: 250ms - [usage: standard transitions]
- **Slow**: 400ms - [usage: page transitions]

### Easing
- **Standard**: cubic-bezier(0.4, 0.0, 0.2, 1) - [usage: most transitions]
- **Decelerate**: cubic-bezier(0.0, 0.0, 0.2, 1) - [usage: entering elements]
- **Accelerate**: cubic-bezier(0.4, 0.0, 1, 1) - [usage: exiting elements]
```

#### `components.md` - Component Specifications

Document each primitive component with:
- Visual description
- All variants (sizes, colors, states)
- States (default, hover, focus, active, disabled, loading, error)
- Anatomy (parts breakdown)
- Usage rules
- Code example

Components to define:
- Button (primary, secondary, ghost, danger - all states)
- Input (text, textarea, select - all states)
- Checkbox & Radio
- Card (elevated, outlined, interactive)
- Badge/Tag
- Avatar
- Loading indicators (spinner, skeleton, progress)
- Tooltip
- Dropdown/Menu
- Modal/Dialog
- Toast/Notification

#### `patterns.md` - Layout Patterns

Document:
- Grid system (columns, gutters, breakpoints)
- Container widths (mobile, tablet, desktop)
- Navigation patterns (mobile bottom nav, desktop sidebar)
- Form layouts
- List/table patterns
- Empty states template
- Error states template
- Loading states template

### Step 4: Generate Tailwind Config

Create `.specify/design-system/tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#[HEX]',
          hover: '#[HEX]',
          active: '#[HEX]',
        },
        // ... all colors from foundation.md
      },
      fontFamily: {
        display: ['[Font]', 'sans-serif'],
        body: ['[Font]', 'sans-serif'],
        mono: ['[Font]', 'monospace'],
      },
      fontSize: {
        // ... type scale
      },
      spacing: {
        // ... spacing scale
      },
      borderRadius: {
        // ... border radius
      },
      boxShadow: {
        // ... shadows
      },
      transitionDuration: {
        // ... timing
      },
      transitionTimingFunction: {
        // ... easing
      },
    },
  },
};
```

### Step 5: Generate Component Starter Code

For each primitive component in `components.md`, generate:

`.specify/design-system/components/[ComponentName].tsx`

```tsx
// Example: Button component with all variants and states
import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  onClick,
}) => {
  // Implementation with Tailwind classes from design system
};
```

### Step 6: Visual Validation with Browser MCP

**IF Browser MCP is available:**

1. Create temporary preview file: `.specify/design-system/preview.html`
2. Render each component in isolation with all variants
3. Use Browser MCP to take screenshots
4. Present screenshots to user: "Does this match your vision?"
5. Iterate on foundation.md values based on feedback
6. Regenerate Tailwind config and components
7. Repeat until approved

**Screenshot Grid Layout**:
```
Button Variants:
[Primary] [Secondary] [Ghost] [Danger]
[Primary Hover] [Secondary Hover] [Ghost Hover] [Danger Hover]
[Primary Disabled] [Loading State]

Color Palette:
[Primary] [Success] [Warning] [Error] [Info]
[Gray Scale: 50-900]

Typography:
[H1 Sample] [H2 Sample] [H3 Sample]
[Body Large] [Body] [Body Small] [Caption]

Cards:
[Elevated Card] [Outlined Card] [Interactive Card]
```

### Step 7: Output Summary

Report:
- ✅ Design system created at `.specify/design-system/`
- ✅ Core tokens defined in `foundation.md`
- ✅ Component library specified in `components.md`
- ✅ Tailwind config generated
- ✅ Component starter code created
- 📸 Visual previews (if Browser MCP used)

**Next Steps**:
- Run `/speckit.specify` to start your first feature
- Run `/speckit.design` on that feature to create feature-specific UI
- Components will automatically use design system tokens

---

## Update Existing Design System

If updating, ask user:
1. What's changing? (colors, typography, spacing, components)
2. Is this a breaking change?
3. Version bump (major, minor, patch)

Update relevant files and regenerate dependent files (Tailwind config, component code).

---

## Browser MCP Integration Notes

**Required capabilities**:
- `playwright://localhost:3000` - Navigate to local dev server
- Screenshot capability - Capture component renders
- Wait for idle - Ensure animations/loads complete before screenshot

**Workflow enhancement**:
```
1. Generate design system code
2. Start Next.js dev server on random port
3. Mount isolated component viewer
4. For each component:
   - Render all variants in grid
   - Screenshot with Browser MCP
   - Add to preview gallery
5. Present gallery to user
6. Collect feedback
7. Update foundation.md
8. Regenerate + re-screenshot
```

**Fallback without Browser MCP**:
- Generate code only
- User manually runs `npm run dev`
- User manually reviews in browser
- User provides text feedback
- Update and regenerate
