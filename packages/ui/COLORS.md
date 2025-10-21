# Centrid Design System - Color System

## Overview

This document describes the centralized color configuration system for Centrid. All colors are defined in a **single source of truth** to ensure consistency across all applications and components.

## Architecture

```
packages/ui/
├── colors.config.js        ← SINGLE SOURCE OF TRUTH
├── colors.config.d.ts      ← TypeScript definitions
└── src/components/         ← Components use shadcn semantic colors
```

### Files

1. **`colors.config.js`** - Main configuration file
   - CommonJS format (works everywhere: Tailwind, TypeScript, JavaScript)
   - Exports: `colors`, `agentColors`, `shadcnTheme`
   - **This is the ONLY place where color values are defined**

2. **`colors.config.d.ts`** - TypeScript definitions
   - Provides type safety when importing in TypeScript files
   - Auto-generated types for all color scales

## Color Scales

### Primary (Coral) - Brand Color
```js
primary[600] = #ff4d4d  // Main brand color
```
Full scale: 50, 100, 200, 300, 400, 500, **600**, 700, 800, 900

### Success (Green)
```js
success[500] = #34c759  // Main success color
```
Full scale: 50, 100, 200, 300, 400, **500**, 600, 700, 800, 900

### Warning (Orange)
```js
warning[500] = #ff9f0a  // Main warning color
```
Full scale: 50, 100, 200, 300, 400, **500**, 600, 700, 800, 900

### Error (Deep Red)
```js
error[500] = #dc2626  // Main error color - DISTINCT from primary coral
```
Full scale: 50, 100, 200, 300, 400, **500**, 600, 700, 800, 900

**Important**: The error color (#dc2626) is intentionally different from the primary coral (#ff4d4d) to ensure clear visual distinction.

### Gray (Neutral)
```js
gray[600] = #52525B  // Main gray
```
Full scale: 50, 100, 200, 300, 400, 500, **600**, 700, 800, 900

### AI Agent Colors
```js
agentColors = {
  create: '#ff4d4d',    // Matches primary-600
  edit: '#ff6d6d',      // Lighter coral (primary-500)
  research: '#ff7060',  // Softest coral variation
}
```

## Usage

### In tailwind.config.js

```js
// Import from the package export
const { colors, agentColors } = require('@centrid/ui/colors');

module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          ...colors.primary,
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        success: colors.success,
        warning: colors.warning,
        error: colors.error,
        gray: colors.gray,
        'agent-create': agentColors.create,
        'agent-edit': agentColors.edit,
        'agent-research': agentColors.research,
        // ... shadcn semantic colors
      },
    },
  },
};
```

### In React Components

Use Tailwind utility classes:

```tsx
// Primary colors
<div className="bg-primary-600 text-white">Brand Button</div>
<div className="bg-primary-50 text-primary-900">Light background</div>

// Semantic colors
<div className="bg-success-500 text-white">Success</div>
<div className="bg-warning-500 text-white">Warning</div>
<div className="bg-error-500 text-white">Error</div>

// Form error states
<input className="border-error-500 focus-visible:ring-error-500" />
<p className="text-error-600">Error message</p>

// AI Agent colors
<div className="bg-agent-create">Create Agent</div>
```

### With shadcn Components

shadcn components use semantic color names via CSS variables:

```tsx
// These automatically use the correct colors from CSS variables
<Button variant="destructive">Delete</Button>  // Uses error color
<Alert variant="destructive">Error!</Alert>    // Uses error color
<Badge variant="destructive">Error</Badge>     // Uses error color
```

### In TypeScript (Component Logic)

```ts
// Import with full type safety
import { colors, agentColors } from '@centrid/ui/colors';

// Access color values (fully typed!)
const brandColor = colors.primary[600];    // '#ff4d4d'
const errorColor = colors.error[500];      // '#dc2626'
const createColor = agentColors.create;    // '#ff4d4d'
```

## CSS Variables (globals.css)

The color system uses CSS variables for shadcn components:

```css
:root {
  --primary: 0 100% 65%;           /* Coral #ff4d4d */
  --destructive: 0 72% 51%;        /* Deep Red #dc2626 */
  --ring: 0 100% 65%;              /* Coral ring (matches primary) */
  /* ... other variables */
}
```

**Important**: These CSS variables should match the values in `colors.config.js` → `shadcnTheme`.

## Component-Specific Color Usage

### Buttons
- `variant="default"` → Primary coral (`bg-primary`)
- `variant="destructive"` → Error red (`bg-destructive`)
- `variant="secondary"` → Gray (`bg-secondary`)

### Badges
- `variant="default"` → Primary coral
- `variant="destructive"` → Error red
- `variant="success"` → Success green (`bg-success-500`)
- `variant="warning"` → Warning orange (`bg-warning-500`)

### Alerts
- `variant="default"` → Neutral
- `variant="destructive"` → Error red background
- `variant="success"` → Success green background (`bg-success-50`)
- `variant="warning"` → Warning orange background (`bg-warning-50`)

### Form Inputs (Error State)
```tsx
<Input className="border-error-500 focus-visible:ring-error-500" />
<Label className="text-error-600">Error State</Label>
<p className="text-error-600">Error message</p>
```

## Adding New Colors

To add a new color to the system:

1. **Edit `packages/ui/colors.config.js`**:
   ```js
   const colors = {
     // ... existing colors
     info: {
       50: '#eff6ff',
       // ... full scale
       500: '#3b82f6',  // Main info color
       // ... rest of scale
     },
   };
   ```

2. **Update `packages/ui/src/lib/colors.ts`** (TypeScript version) to match

3. **Update all `tailwind.config.js` files** that import the config:
   ```js
   colors: {
     // ... existing
     info: colors.info,
   }
   ```

4. **If adding a shadcn semantic color**, update CSS variables in `globals.css`:
   ```css
   :root {
     --info: 217 91% 60%;  /* #3b82f6 in HSL */
   }
   ```

5. **Add component variants** if needed (e.g., `<Badge variant="info">`)

## Color Consistency Checklist

When modifying colors, ensure consistency across:

- ✅ `packages/ui/colors.config.js` (ONLY place to edit color values)
- ✅ `apps/*/styles/globals.css` (CSS variables for shadcn - update HSL values to match)
- ✅ Component variants (button.tsx, badge.tsx, alert.tsx, etc.)

**Note**: You should NEVER need to edit color values in multiple places. Just edit `colors.config.js` and update CSS variables if needed.

## Design Decisions

### Why Deep Red (#dc2626) for Errors?

The original error color (#ff3b30) was too similar to the primary coral (#ff4d4d), causing confusion. The new deep red (#dc2626) provides clear visual distinction while maintaining semantic meaning.

### Why CSS Variables + Tailwind Classes?

This hybrid approach provides:
- **CSS Variables**: Runtime theme switching (light/dark mode) for shadcn components
- **Tailwind Classes**: Design-time color utilities (`bg-success-500`, `text-error-600`)
- **Best of both**: Type-safe imports in TS + flexible utility classes

### Why a Single `colors.config.js` File?

- **Universal compatibility**: CommonJS works in Tailwind configs, TypeScript, and JavaScript
- **No duplication**: Only one file to maintain
- **Type safety**: TypeScript definitions in `.d.ts` file provide full intellisense
- **Monorepo friendly**: Package export (`@centrid/ui/colors`) works across all apps

## Testing Color Consistency

View the design system to verify all colors render correctly:

```bash
npm run design:dev
```

Then check:
1. Color Palette section - all swatches match expected hex codes
2. Buttons - destructive variant uses deep red (not coral)
3. Badges - error badge uses deep red
4. Alerts - error alert uses light red background
5. Form inputs - error state uses red border/text

## Reference

- Primary Coral: `#ff4d4d` (HSL: 0, 100%, 65%)
- Error Red: `#dc2626` (HSL: 0, 72%, 51%)
- Success Green: `#34c759` (HSL: 145, 63%, 49%)
- Warning Orange: `#ff9f0a` (HSL: 38, 100%, 52%)
- Gray: `#52525B` (HSL: 240, 6%, 33%)
