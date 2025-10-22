# Feature Design - Visual UI/UX Specification with Iteration

**Purpose**: Create high-fidelity visual design for a specific feature using the design sandbox for rapid iteration, leveraging the centralized design system.

**When to use**: After `/speckit.plan` completes, before `/speckit.tasks`

**Prerequisites**:
- Feature spec.md exists
- Global design system exists (`.specify/design-system/tokens.md`)
- Plan.md exists (for technical context)
- Design system app ready (`apps/design-system/`)
- Centralized UI package configured (`packages/ui/`)

---

## Workflow

### Step 1: Load Context

Load:
- `specs/[FEATURE]/spec.md` - User stories, requirements
- `specs/[FEATURE]/plan.md` - Technical approach
- `.specify/design-system/tokens.md` - Design tokens reference
- `apps/design-system/pages/index.tsx` - Available components showcase
- `packages/ui/src/components/index.ts` - Available components list

### Step 2: Extract Design Requirements

From spec.md, identify:
- User-facing screens/views needed
- Interactive elements (buttons, forms, lists, etc.)
- Data display patterns (cards, tables, grids, charts)
- State requirements (loading, error, empty, success)
- Mobile vs desktop differences

From plan.md, identify:
- Component structure (packages/ui vs apps/web)
- Available shadcn/ui components
- Design token constraints
- Data flow and state management

### Step 3: Map to Centralized Design System Components

For each screen/view in the feature:

**Analyze what's available using shadcn MCP**:
1. Use `mcp__shadcn__get_project_registries` to get configured registries
2. Use `mcp__shadcn__list_items_in_registries` to see all available shadcn components
3. Use `mcp__shadcn__search_items_in_registries` to find specific components (e.g., "dialog", "form", "table")
4. Use `mcp__shadcn__view_items_in_registries` to inspect component details
5. Use `mcp__shadcn__get_item_examples_from_registries` to see usage examples (search for "demo" or "example")

**Check what's already installed**:
- Read `packages/ui/src/components/index.ts` to see which components are already available locally
- Which components need composition from existing primitives?
- Which are entirely new and need to be added via `./scripts/add-component.sh`?

**Create component inventory**:
```markdown
## Component Needs for [Feature]

### Existing Primitives (use as-is from @centrid/ui/components)
- Button - Primary actions
- Input - Form fields
- Card, CardHeader, CardTitle, CardContent - Content containers
- Badge - Status indicators
- Alert - Notifications
- SimpleBarChart, SimpleLineChart - Data visualization

### New Compositions (build from primitives)
- DocumentCard - Card + Badge + Button for document display
- AgentRequestCard - Card + Progress + Status for agent requests
- SearchResultCard - Card + Input + Badge for search results

### New Components (if truly needed)
- [ComponentName] - [description, justification why primitives aren't sufficient]

### Components to Add (using add-component script)
- [Component] - Use `./scripts/add-component.sh [component]` to add from shadcn registry
```

**If new components are needed from shadcn/ui**:
1. Use `mcp__shadcn__get_add_command_for_items` to get the CLI command
2. OR run `./scripts/add-component.sh <component-name>` (e.g., `./scripts/add-component.sh avatar`)
3. The script automatically:
   - Runs `shadcn add` in `apps/design-system`
   - Moves files to `packages/ui/src/components`
   - Fixes import paths
4. Manually export the new component from `packages/ui/src/components/index.ts`
5. Component is now available via `import { Component } from '@centrid/ui/components'`

### Step 4: Create Feature Component in Design Sandbox

**Location**: `apps/design-system/components/[FeatureName].tsx`

Export all screen components from a single file:

```tsx
/**
 * Feature Design: [Feature Name]
 *
 * Created during /speckit.design workflow
 * Status: Draft / Approved
 * Approved Date: [if approved]
 */

import { useState } from 'react';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Badge } from '@centrid/ui/components';

export function Screen1() {
  const [state, setState] = useState<'default' | 'loading' | 'error'>('default');

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>[Screen Title]</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Use design tokens via Tailwind classes */}
          <Input
            type="text"
            placeholder="Example input..."
            className="w-full h-11"
          />

          <Button
            className="w-full h-11 bg-primary-600"
            disabled={state === 'loading'}
          >
            {state === 'loading' ? 'Processing...' : 'Primary Action'}
          </Button>
        </CardContent>
      </Card>

      {/* State controls for design review */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur p-4 rounded-lg shadow-lg">
        <p className="text-xs font-semibold mb-2">State Controls</p>
        <div className="flex gap-2">
          <button onClick={() => setState('default')} className="px-2 py-1 text-xs bg-gray-200 rounded">Default</button>
          <button onClick={() => setState('loading')} className="px-2 py-1 text-xs bg-gray-200 rounded">Loading</button>
          <button onClick={() => setState('error')} className="px-2 py-1 text-xs bg-gray-200 rounded">Error</button>
        </div>
      </div>
    </div>
  );
}

// Export additional screens as needed
export function Screen2() { /* ... */ }
export function Screen3() { /* ... */ }
```

**Key principles**:
- ✅ Import from `@centrid/ui/components` (centralized package)
- ✅ Use Tailwind classes with design tokens (e.g., `bg-primary-600`, `p-6`, `gap-4`)
- ✅ Pure presentational component - all data via props, all events via callbacks
- ✅ Include state controls for design review (toggle loading, error, success states)
- ❌ NO server imports (Supabase, state management, providers)
- ❌ NO hard-coded values (use Tailwind tokens from centralized config)

### Step 5: Create Feature Directory with Routes

Create a feature directory with individual page routes for each screen:

**1. Create feature directory**: `apps/design-system/pages/[feature-name]/`

**2. Create feature index page**: `apps/design-system/pages/[feature-name]/index.tsx`

```tsx
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@centrid/ui/components';

export default function FeatureIndex() {
  const screens = [
    { name: '1. Screen Name', href: '/[feature-name]/screen-1', description: 'Screen description' },
    { name: '2. Screen Name', href: '/[feature-name]/screen-2', description: 'Screen description' },
    // ... add all screens
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-sm text-primary-600 hover:underline mb-4 inline-block">
            ← Back to Design System
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">[Feature Name]</h1>
          <p className="text-gray-600 mt-2">[Feature description]</p>
          <p className="text-sm text-gray-500 mt-1">Feature: [feature-id]</p>
        </div>

        <div className="grid gap-4">
          {screens.map((screen) => (
            <Link key={screen.href} href={screen.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-xl">{screen.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{screen.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**3. Create individual screen pages**: `apps/design-system/pages/[feature-name]/screen-1.tsx`

```tsx
import Link from 'next/link';
import { Screen1 } from '../../components/[FeatureName]';

export default function Screen1Page() {
  return (
    <div>
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur px-3 py-1 rounded">
        <Link href="/[feature-name]" className="text-sm text-primary-600 hover:underline">
          ← Back to [Feature Name]
        </Link>
      </div>
      <Screen1 />
    </div>
  );
}
```

Repeat for all screens (screen-2.tsx, screen-3.tsx, etc.)

**4. Update main design system index**: Edit `apps/design-system/pages/index.tsx`

```tsx
// Add link card to feature designs section
<section>
  <h2 className="text-2xl font-semibold mb-6">Feature Designs</h2>
  <div className="grid gap-4">
    <a href="/[feature-name]">
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <CardTitle>[Feature Name]</CardTitle>
          <CardDescription>[Feature description] ([N] screens)</CardDescription>
        </CardHeader>
      </Card>
    </a>
  </div>
</section>
```

### Step 6: Visual Iteration with Playwright MCP

**Start Design Sandbox**:
```bash
npm run design:dev  # Starts on localhost:3001
```

**Screenshot Workflow**:

1. **Navigate to feature index**: `http://localhost:3001/[feature-name]`
2. **For each screen**:
   - Navigate to individual screen route (e.g., `/[feature-name]/screen-1`)
   - Screenshot desktop viewport (1440×900):
     - Use state controls to toggle states if needed
     - Capture: `[NN]-[screen-name]-desktop.png`
   - Switch to mobile viewport (375×812)
   - Screenshot mobile:
     - Capture: `[NN]-[screen-name]-mobile.png`
   - Navigate back to feature index
   - Move to next screen
3. **Save screenshots** to `apps/design-system/public/screenshots/[feature-name]/`

**Screenshot naming pattern**: `[NN]-[screen-name]-[viewport].png`
- Example: `01-signup-desktop-default.png`, `01-signup-mobile.png`

**Present to user**:
```markdown
## Visual Preview: [Feature Name]

View all screens at: http://localhost:3001/[feature-name]

### Screen 1: [Screen Name]
**Route**: /[feature-name]/screen-1

Desktop (1440×900):
[Show screenshot: 01-[screen-name]-desktop.png]

Mobile (375×812):
[Show screenshot: 01-[screen-name]-mobile.png]

### Screen 2: [Screen Name]
[Repeat for each screen...]

---
**Feedback questions**:
1. Does the spacing feel balanced across all screens?
2. Are the colors working well together?
3. Does the layout feel intuitive?
4. Any elements feeling too large/small?
5. Is the navigation between screens clear?
6. Overall visual quality: approve or iterate?
```

**Iteration loop**:
1. User provides feedback
2. Update component in `apps/design-system/components/[FeatureName].tsx`
3. Browser auto-reloads (hot reload)
4. Re-screenshot changed screens only
5. Present delta to user
6. Repeat until approved

**Approval**:
- User says "approved" or "looks good"
- Mark component file with approval date in header comment
- Lock design for implementation
- Move to Step 7 (documentation)

### Step 7: Document Design Spec

Create `specs/[FEATURE]/design.md`:

```markdown
# Design Specification: [Feature Name]

**Feature**: [Feature Name] ([feature-id])
**Created**: [DATE]
**Status**: Approved
**Design System**: Centrid Design System (Coral Theme)

## Overview

[Brief description of the feature and design approach]

## Design System Structure

### File Organization

\`\`\`
apps/design-system/
├── components/
│   └── [FeatureName].tsx       # All screen components
├── pages/
│   └── [feature-name]/
│       ├── index.tsx           # Feature index/overview
│       ├── screen-1.tsx        # Individual screen pages
│       ├── screen-2.tsx
│       └── ...
└── public/
    └── screenshots/
        └── [feature-name]/     # Desktop & mobile screenshots
\`\`\`

### Navigation

**Feature Index**: http://localhost:3001/[feature-name]
- Overview page with clickable cards linking to all screens
- Each screen has its own dedicated route
- Easy navigation between screens for design review
- Back navigation links on every screen

**Individual Screen Routes**:
- `/[feature-name]/screen-1` - [Screen description]
- `/[feature-name]/screen-2` - [Screen description]
- ...

## Screens Designed

### 1. [Screen Name]

**Route**: `/[feature-name]/screen-1`
**Production Route**: `/actual-route`

**Purpose**: [What this screen does]
**Layout**: [Layout description]
**Components Used**: [List from @centrid/ui/components]

**Key Elements**:
- [Element 1 with styling classes]
- [Element 2 with styling classes]
- ...

**States**:
- **Default**: [Description]
- **Loading**: [Description]
- **Error**: [Description]
- **Success**: [Description]

**Screenshots**:
- Desktop: `screenshots/[feature-name]/01-[screen-name]-desktop.png`
- Mobile: `screenshots/[feature-name]/01-[screen-name]-mobile.png`

---

### 2. [Next Screen]

[Repeat structure for each screen]

## Design Tokens Used

### Colors
- **Primary (Coral)**: `bg-primary-600` (#ff4d4d)
- **Gray**: `text-gray-600`, `bg-gray-50`, `border-gray-200`
- ...

### Typography
- **Headings**: `text-2xl` (24px)
- **Body**: `text-base` (16px)
- ...

### Spacing
- **Card padding**: `p-6` (24px)
- **Form gaps**: `gap-4` (16px)
- ...

### Components
- **Button**: From `@centrid/ui/components/button`
- **Input**: From `@centrid/ui/components/input`
- ...

## Accessibility Features

1. **Keyboard Navigation**: [Description]
2. **Focus States**: [Description]
3. **ARIA Labels**: [Description]
4. **Touch Targets**: All interactive elements 44px minimum
...

## Implementation Notes

1. **Component Source**: All components imported from `@centrid/ui/components`
2. **State Management**: [Approach]
3. **Form Validation**: [Approach]
...
```

### Step 8: Create Design Checklist

Generate `specs/[FEATURE]/design-checklist.md`:

```markdown
# Design Implementation Checklist: [Feature Name]

## File Structure
- [ ] Component file created: `apps/design-system/components/[FeatureName].tsx`
- [ ] Feature directory created: `apps/design-system/pages/[feature-name]/`
- [ ] Feature index created: `apps/design-system/pages/[feature-name]/index.tsx`
- [ ] Individual screen pages created (one per screen)
- [ ] Main index updated with feature link card
- [ ] Screenshots saved to `apps/design-system/public/screenshots/[feature-name]/`

## Visual Consistency
- [ ] All colors use centralized tokens (packages/ui/colors.config.js)
- [ ] All spacing uses Tailwind scale (no arbitrary px)
- [ ] All typography uses design tokens
- [ ] All components from @centrid/ui/components
- [ ] 44px minimum height for interactive elements (h-11)

## Component States
- [ ] All interactive elements have hover state
- [ ] All interactive elements have focus state (accessibility)
- [ ] All async actions have loading state
- [ ] All forms have error state
- [ ] State controls added for design review

## Responsive Design
- [ ] Mobile layout (375px) tested and screenshotted
- [ ] Desktop layout (1440px) tested and screenshotted
- [ ] Touch targets 44×44px minimum on mobile
- [ ] Text readable without zoom (16px minimum)

## Accessibility
- [ ] Keyboard navigation documented and tested
- [ ] Focus indicators visible (ring-ring)
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Form inputs have labels
- [ ] Error messages use appropriate styling

## Navigation & Routing
- [ ] Feature index shows all screens with descriptions
- [ ] Each screen has its own dedicated route
- [ ] Back navigation links work correctly
- [ ] Routes documented in design.md (both design system + production)

## Documentation
- [ ] Design.md created with complete specification
- [ ] Each screen documented with route, layout, components, states
- [ ] Design tokens usage documented
- [ ] Accessibility features documented
- [ ] Screenshots referenced in documentation

## Implementation Ready
- [ ] Design approved by user
- [ ] All screens visible at http://localhost:3001/[feature-name]
- [ ] Component uses only @centrid/ui/components (no server deps)
- [ ] Ready for /speckit.tasks to generate implementation tasks
```

### Step 9: Output Summary

Report to user:

```
✅ Design created and approved:
   - Component: apps/design-system/components/[FeatureName].tsx
   - Feature directory: apps/design-system/pages/[feature-name]/
   - Feature index: http://localhost:3001/[feature-name]
   - Individual routes: [N] screens with dedicated pages
   - Spec: specs/[FEATURE]/design.md
   - Screenshots: apps/design-system/public/screenshots/[feature-name]/
   - Checklist: specs/[FEATURE]/design-checklist.md

📸 Visual previews:
   - [Count] screenshots ([N] desktop + [N] mobile)
   - Desktop viewport: 1440×900
   - Mobile viewport: 375×812
   - Status: Approved ([DATE])

🎨 Design tokens used (from packages/ui/):
   - Colors: [list with hex values]
   - Typography: [list with sizes]
   - Spacing: [list with px values]

📦 Components used (from @centrid/ui/components):
   - Existing: [Button, Input, Card, ...]
   - New compositions: [FeatureCard, ...] (if any)

🧭 Navigation structure:
   - Feature index: /[feature-name]
   - Screen routes: /[feature-name]/screen-1, /[feature-name]/screen-2, ...
   - Each screen has back navigation to feature index

Next steps:
   → Run /speckit.tasks to generate implementation tasks
   → Tasks will reference this design for UI development
   → Components ready to be implemented in apps/web
```

---

## shadcn MCP Quick Reference

**Discover components**: `mcp__shadcn__search_items_in_registries` (query: "dialog", "form", "table")
**View details**: `mcp__shadcn__view_items_in_registries` (items: ['@shadcn/component'])
**Get examples**: `mcp__shadcn__get_item_examples_from_registries` (query: "component-demo")
**Add to project**: `./scripts/add-component.sh <component>` (then export from index.ts)

---

## Playwright MCP Integration

### Screenshot Naming Convention

```
apps/design-system/public/screenshots/
└── [feature-name]/
    ├── 01-[screen-name]-desktop-default.png
    ├── 01-[screen-name]-mobile.png
    ├── 02-[screen-name]-desktop.png
    ├── 02-[screen-name]-mobile.png
    ├── 03-[screen-name]-desktop.png
    ├── 03-[screen-name]-mobile.png
    └── ... (one desktop + one mobile per screen)
```

**Naming pattern**: `[NN]-[screen-name]-[viewport].png`
- `NN`: Screen number (01, 02, 03, ...)
- `screen-name`: Descriptive name (signup, login, dashboard, etc.)
- `viewport`: Either `desktop` or `mobile` (optionally with state suffix like `-default`, `-error`)

---

## Integration with Workflow

```
/speckit.specify
    ↓ (spec.md with user stories)

/speckit.plan
    ↓ (plan.md with architecture)

/speckit.design ← DESIGN ITERATION HAPPENS HERE
    ↓ (design.md, screenshots, approved component)

/speckit.tasks
    ↓ (generates implementation tasks referencing design)

/speckit.implement
    ↓ (build features using approved designs)
```

---

## Centralized Design System Benefits

- **Single source of truth**: All colors in `packages/ui/colors.config.js`
- **Shared components**: All apps use `@centrid/ui/components`
- **Consistent styles**: All apps use `packages/ui/styles/globals.css`
- **Easy updates**: Change once, applies everywhere
- **Type safety**: Components exported from index.ts

---

## Tips

### Leverage Centralization
- Check `packages/ui/src/components/index.ts` for available components
- Use shadcn MCP to discover and search available components
- Use `@centrid/ui/components` imports (never relative paths)
- Colors auto-sync from `colors.config.js` to all apps

### Component Composition
- Build complex UIs from simple primitives
- Use shadcn MCP to view component examples before composing
- Avoid creating new base components unless necessary
- Use Tailwind utilities for layout/spacing

### Adding New shadcn Components
- Always use `./scripts/add-component.sh <component>` to add shadcn components
- NEVER run `shadcn add` directly in `packages/ui`
- Script ensures proper placement and import paths
- Remember to export from `packages/ui/src/components/index.ts`

### Design Iteration Speed
- Hot reload shows changes instantly
- Screenshot only changed sections
- Present visual diffs to user
