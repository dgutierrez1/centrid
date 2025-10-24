# Design System Setup - Global Visual Foundation

**Purpose**: Establish the global design system using the design sandbox for visual iteration. This defines design tokens (colors, typography, spacing) and sets up the component showcase.

**When to use**:
- At project start (before implementing features)
- When rebranding or doing major visual overhaul

**Prerequisites**:
- Monorepo structure with `apps/design-system/` and `packages/ui/`
- Tailwind + shadcn/ui installed
- Component script exists (`scripts/add-component.sh`)
- Centralized config in `packages/ui/` (tailwind.preset.js, colors.config.js, styles/globals.css)

---

## Workflow

### Step 1: Setup & Validate Structure

**Validate monorepo structure** (run from repo root):
- Verify `packages/ui/` exists (centralized UI package)
- Verify `apps/design-system/` exists (design sandbox)
- Verify `apps/web/` exists (production app)
- Verify `.specify/design-system/` directory exists or create it
- Ensure we're at repo root for all operations

**Check existing design system**:
- Check for `.specify/design-system/tokens.md`
- If exists, ask user:
  - Update existing?
  - View current system?
  - Proceed with existing?
- If missing, proceed with new design system setup

### Step 2: Interactive Design Questionnaire

Ask user to establish visual foundation:

#### Brand & Personality
1. **Visual personality**: Professional / Modern & Minimal / Playful / Bold / Clean & Elegant
2. **Primary use case**: Mobile-first / Desktop tool / Responsive web app
3. **Reference inspirations** (optional): URLs to analyze with Browser MCP

#### Color Direction
4. **Primary brand color**: Hex code OR Blue / Green / Purple / Red / Orange / Coral / Neutral
5. **Color mood**: Vibrant / Soft & Muted / Dark Mode First / Light Mode First

#### Visual Style
6. **Border radius**: Sharp (0px) / Subtle (4px) / Rounded (8-12px) / Very Rounded (16px+)
7. **Spacing density**: Compact (4px) / Comfortable (8px) / Spacious (12px+)
8. **Shadows**: Flat / Subtle / Bold

#### Typography
9. **Font personality**: Sans-serif Modern / Geometric / Humanist / Serif / Monospace
10. **Type scale**: Tight (1.125) / Standard (1.25) / Expressive (1.333+)

### Step 3: Generate Design Tokens File

Create `.specify/design-system/tokens.md`:

```markdown
# Centrid Design System Tokens

**Version**: 1.0.0
**Last Updated**: [DATE]

## Colors

### Brand Colors
- **Primary**: `#ff4d4d` (coral-600)
- **Primary Hover**: `#e63946` (coral-700)

### System Colors
- **Success**: `#34c759` (green-500)
- **Warning**: `#ff9f0a` (orange-500)
- **Error**: `#ff3b30` (red-500)

### Neutral Colors
- Gray scale: 50-900 (Tailwind defaults)

## Typography

### Font Families
- **Sans**: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', system-ui, sans-serif
- **Mono**: 'JetBrains Mono', 'Menlo', 'Monaco', monospace

### Font Sizes (Tailwind)
- text-xs: 12px
- text-sm: 14px
- text-base: 16px (body default)
- text-lg: 18px
- text-xl: 20px
- text-2xl: 24px (H3)
- text-3xl: 30px (H2)
- text-4xl: 36px (H1)

## Spacing (4px grid)
- 1 = 4px
- 2 = 8px
- 4 = 16px
- 6 = 24px (card padding)
- 8 = 32px (section spacing)

## Border Radius
- rounded-md: 6px (inputs, buttons)
- rounded-lg: 8px (cards)
- rounded-full: 9999px (badges, avatars)

## Shadows
- shadow-sm: Subtle - Cards at rest
- shadow: Default - Elevated cards
- shadow-md: Medium - Dropdowns
- shadow-lg: Large - Modals

## Component Patterns

### Buttons
- Variants: default (primary), secondary, ghost, destructive, outline
- Sizes: sm, default, lg, icon

### Cards
- Border: border-gray-200
- Background: bg-white (dark: bg-gray-800)
- Padding: p-6
- Radius: rounded-lg

### Inputs
- Height: h-10
- Padding: px-3 py-2
- Focus: ring-2 ring-primary-500
```

### Step 4: Update Centralized Color System

Update `packages/ui/colors.config.js` (single source of truth for all apps):

```javascript
// packages/ui/colors.config.js
module.exports = {
  colors: {
    primary: {
      50: '#fff5f5',
      100: '#ffe3e3',
      200: '#ffc9c9',
      300: '#ffa8a8',
      400: '#ff8787',
      500: '#ff6d6d',
      600: '#ff4d4d', // Main brand color
      700: '#e63946', // Hover/dark
      800: '#cc2936',
      900: '#b31f2a',
    },
    success: {
      50: '#f0fdf4',
      500: '#34c759',
      900: '#14532d',
    },
    warning: {
      50: '#fff9e6',
      500: '#ff9f0a',
      900: '#4d3100',
    },
    error: {
      50: '#fff5f5',
      500: '#ff3b30',
      900: '#661310',
    },
    gray: {
      50: '#f8f9fa',
      100: '#e9ecef',
      300: '#adb5bd',
      500: '#6c757d',
      700: '#495057',
      900: '#1a1a1a',
    },
  },
  agentColors: {
    create: '#ff4d4d',
    edit: '#ff6d6d',
    research: '#ff7060',
  },
};
```

**Note**: This file is imported by:
- `packages/ui/tailwind.preset.js` (used by all apps)
- `packages/ui/styles/globals.css` (CSS variables)

### Step 5: Verify Centralized Configs

Ensure these files exist and are correct:

**packages/ui/tailwind.preset.js** - Shared Tailwind configuration:
```javascript
const { colors, agentColors } = require('./colors.config.js');

module.exports = {
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        primary: {
          ...colors.primary,
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        // ... other colors
      },
      // ... fonts, spacing, animations
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

**packages/ui/styles/globals.css** - Shared global styles:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* shadcn/ui semantic colors */
    --primary: 0 100% 65%; /* Coral */
    --foreground: 240 10% 3.9%;
    /* ... other CSS vars */
  }
  
  .dark {
    /* Dark mode overrides */
  }
}
```

**Both apps import these**:
- `apps/design-system/tailwind.config.js` → `require('@centrid/ui/tailwind.preset')`
- `apps/web/tailwind.config.js` → `require('@centrid/ui/tailwind.preset')`
- `apps/design-system/pages/_app.tsx` → `import '@centrid/ui/styles'`
- `apps/web/src/pages/_app.tsx` → `import '@centrid/ui/styles'`

### Step 6: Verify Design System Showcase

**Check available components using shadcn MCP**:
1. Use `mcp__shadcn__get_project_registries` to get configured registries
2. Use `mcp__shadcn__list_items_in_registries` to see all available shadcn components
3. Compare with `packages/ui/src/components/index.ts` to see what's already installed

Check that `apps/design-system/pages/index.tsx` displays all design system elements:

Required sections:
- ✅ Color Palette
- ✅ Button Variants (all 5 variants, all sizes)
- ✅ Input States (default, disabled, error)
- ✅ Card Layouts
- ✅ Badge Variants
- ✅ Typography Scale
- ✅ Spacing Scale
- ✅ Data Visualization (charts)
- ✅ Illustrations/Icons

If missing sections, add them to showcase.

**If missing components needed for showcase**:
- Use `./scripts/add-component.sh <component>` to add from shadcn registry
- Export from `packages/ui/src/components/index.ts`
- Add to showcase page

### Step 7: Visual Review with Browser MCP

**Start design sandbox**:
```bash
npm run design:dev  # localhost:3001
```

**Screenshot showcase**:
1. Navigate to `http://localhost:3001`
2. Screenshot full page (desktop 1440×900)
3. Screenshot full page (mobile 375×812)
4. Screenshot individual sections (colors, buttons, typography, charts)
5. Save to `.specify/design-system/screenshots/`

**Present to user**:
```markdown
## Design System Preview

### Desktop View
[Screenshot of full showcase]

### Mobile View
[Screenshot of mobile showcase]

### Color Palette
[Screenshot of colors section]

### Component Samples
- Buttons: 5 variants × 3 sizes
- Inputs: 4 states
- Cards: 3 layouts
- Typography: 8 scale levels
- Charts: Bar + Line examples

**Review questions**:
1. Do the colors feel on-brand?
2. Is the spacing comfortable to read/use?
3. Do the components look cohesive?
4. Any adjustments needed?
```

**Iteration loop**:
1. User feedback (e.g., "Make primary color darker")
2. Update `packages/ui/colors.config.js`
3. Restart dev server (`npm run design:dev`)
4. Re-screenshot showcase
5. Present delta
6. Repeat until approved

**Approval**:
- User approves design system
- Lock `tokens.md` with approval date
- Design system is now the source of truth

### Step 8: Create Design System README

Create `.specify/design-system/README.md`:

```markdown
# Centrid Design System

Quick reference for using the centralized design system.

## Architecture

### Centralized in packages/ui/
- **colors.config.js** - Color definitions (single source of truth)
- **tailwind.preset.js** - Shared Tailwind config
- **styles/globals.css** - Shared global CSS with CSS variables
- **src/components/** - Shared shadcn/ui components

### Apps consume from @centrid/ui
- `apps/design-system/` - Design iteration sandbox (localhost:3001)
- `apps/web/` - Production app (localhost:3000)

Both apps:
- Import `@centrid/ui/tailwind.preset` in tailwind.config.js
- Import `@centrid/ui/styles` in _app.tsx
- Import components from `@centrid/ui/components`

## Quick Links
- [Design Tokens](./tokens.md) - Colors, typography, spacing
- [Live Showcase](http://localhost:3001) - Run `npm run design:dev`

## Using Design Tokens

### Colors
```tsx
<div className="bg-primary-600 text-white">Primary</div>
<div className="text-error-500">Error message</div>
```

### Spacing
```tsx
<div className="p-6 gap-4">Card with standard padding</div>
```

### Typography
```tsx
<h1 className="text-4xl font-bold">Heading</h1>
<p className="text-base">Body text</p>
```

## Component Usage

### From Centralized UI Package
```tsx
// Always use this import pattern:
import { Button, Card, Input } from '@centrid/ui/components';

<Button variant="default">Primary Action</Button>
```

## Design Iteration Workflow

1. Start design system: `npm run design:dev`
2. Visit: `http://localhost:3001`
3. View all components and tokens
4. Design new features in `apps/design-system/pages/` or `apps/design-system/components/`
5. Screenshot with Playwright MCP for feedback
6. Add new shadcn components:
   ```bash
   ./scripts/add-component.sh [component]
   ```
   - Script runs shadcn CLI in apps/design-system
   - Moves components to packages/ui/src/components
   - Fixes imports automatically
7. Export from `packages/ui/src/components/index.ts`

## Token Updates

1. Edit `.specify/design-system/tokens.md` (documentation)
2. Update `packages/ui/colors.config.js` (implementation)
3. Restart both dev servers
4. Review at localhost:3001 (design system) and localhost:3000 (web app)
```

### Step 9: Output Summary

Report to user:

```
✅ Centralized design system established:
   - Tokens: .specify/design-system/tokens.md
   - README: .specify/design-system/README.md
   - Screenshots: .specify/design-system/screenshots/
   - Showcase: http://localhost:3001

🏗️ Architecture:
   - Colors: packages/ui/colors.config.js (single source of truth)
   - Tailwind: packages/ui/tailwind.preset.js (shared by all apps)
   - CSS: packages/ui/styles/globals.css (shared global styles)
   - Components: packages/ui/src/components/ (shadcn/ui)

🎨 Design Decisions:
   - Primary Color: [color name + hex]
   - Brand Personality: [personality choices]
   - Spacing: [density] (Xpx base unit)
   - Border Radius: [style]
   - Typography: [font choice]

📦 Components Available:
   - Button (5 variants, 4 sizes)
   - Input (with validation states)
   - Card (structured sections)
   - Badge (6 variants)
   - Charts (Bar, Line with recharts)

📸 Screenshots Captured:
   - Desktop: [count] screenshots
   - Mobile: [count] screenshots
   - Status: Approved ([DATE])

Next steps:
   → Design system is ready for feature development
   → Run /speckit.design to design specific features
   → All features will use these centralized tokens
```

---

## shadcn MCP Quick Reference

**List all**: `mcp__shadcn__list_items_in_registries` (registries: ['@shadcn'])
**Search**: `mcp__shadcn__search_items_in_registries` (query: "button", "input", "card")
**View examples**: `mcp__shadcn__get_item_examples_from_registries` (query: "button-demo")
**Add**: `./scripts/add-component.sh <component>` (then export from index.ts)

---

## Design System Updates

To update the design system later:

1. Run `/speckit.design-system` again
2. Choose "Update existing"
3. Answer questionnaire with new values
4. Update `packages/ui/colors.config.js`
5. Review screenshots of changes
6. Approve updates
7. Increment version in `tokens.md`

---

## Integration with Feature Design

When running `/speckit.design` for a feature:
- Features load tokens from `.specify/design-system/tokens.md`
- Features use components from `packages/ui/src/components`
- Features follow same visual patterns
- Consistency is automatic via shared centralized configs

---

## Tips

### Centralization Benefits
- Change colors once in `packages/ui/colors.config.js` → applies everywhere
- Update global styles once in `packages/ui/styles/globals.css` → all apps get it
- Add component once in `packages/ui/src/components` → available to all apps

### Component Discovery with shadcn MCP
- Use `mcp__shadcn__search_items_in_registries` to find components by keyword
- Use `mcp__shadcn__get_item_examples_from_registries` to view usage examples
- Check `packages/ui/src/components/index.ts` to see what's already installed
- Always use `./scripts/add-component.sh <component>` to add new components

### Start Simple
- Use Tailwind defaults where possible
- Only customize what's truly brand-specific
- Fewer custom values = easier maintenance

### Adding shadcn Components
- NEVER run `shadcn add` directly - always use the script
- Script workflow: `./scripts/add-component.sh <component>`
  1. Runs `shadcn add` in `apps/design-system`
  2. Moves files to `packages/ui/src/components`
  3. Fixes import paths automatically
- Remember to export from `packages/ui/src/components/index.ts`

### Test Both Modes
- Always screenshot light AND dark mode
- Ensure contrast ratios are good in both
- Dark mode CSS vars in globals.css

### Document Decisions
- Capture WHY you chose specific values in tokens.md
- Reference inspirations
- Makes future updates easier
