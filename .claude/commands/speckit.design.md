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

### Step 4: Create Reusable Feature Components in UI Package

**IMPORTANT**: Create components in `packages/ui/src/features/[feature-name]/` so they're reusable across all apps.

**Step 4a: Create feature directory structure**

```bash
mkdir -p packages/ui/src/features/[feature-name]
```

**Step 4b: Create screen components**

**Location**: `packages/ui/src/features/[feature-name]/Screen1.tsx`

Each screen is a separate file for better modularity:

```tsx
/**
 * Feature: [Feature Name] - Screen 1
 *
 * Pure presentational component - reusable across apps
 * Created during /speckit.design workflow
 * Status: Draft / Approved
 * Approved Date: [if approved]
 */

import { useState } from 'react';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '../../components';

export interface Screen1Props {
  // Business data via props
  initialValue?: string;
  onSubmit?: (value: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function Screen1({
  initialValue = '',
  onSubmit,
  isLoading = false,
  error = null
}: Screen1Props) {
  // ✅ Local UI state - input value before submission
  const [value, setValue] = useState(initialValue);

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(value);
    }
  };

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
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />

          <Button
            className="w-full h-11 bg-primary-600"
            disabled={isLoading}
            onClick={handleSubmit}
          >
            {isLoading ? 'Processing...' : 'Primary Action'}
          </Button>

          {error && (
            <p className="text-sm text-error-500">{error}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

Create additional screen files: `Screen2.tsx`, `Screen3.tsx`, etc.

**State Management Guide**:
- ✅ **Local UI state** (useState): Input values, dropdown open/closed, accordion expanded
- ✅ **Props for business data**: isLoading, error, data from server
- ✅ **Props for events**: onSubmit, onChange, onDelete callbacks
- ❌ **NO data fetching**: useEffect for API calls (should be in container)
- ❌ **NO global state**: Valtio, Zustand, Redux (should be in container)

**Step 4c: Create feature index file**

**Location**: `packages/ui/src/features/[feature-name]/index.ts`

```tsx
// Export all screen components and their types
export { Screen1, type Screen1Props } from './Screen1';
export { Screen2, type Screen2Props } from './Screen2';
export { Screen3, type Screen3Props } from './Screen3';
```

**Step 4d: Update main features index**

**Location**: `packages/ui/src/features/index.ts`

Add exports for the new feature:

```typescript
// [Feature Name] components
export { Screen1, Screen2, Screen3 } from './[feature-name]';
export type { Screen1Props, Screen2Props, Screen3Props } from './[feature-name]';
```

**Key principles**:
- ✅ Create in `packages/ui/src/features/[feature-name]/` (reusable across all apps)
- ✅ Import from relative paths (`../../components`) within packages/ui
- ✅ Use Tailwind classes with design tokens (e.g., `bg-primary-600`, `p-6`, `gap-4`)
- ✅ Pure presentational components - business data via props, events via callbacks
- ✅ Export TypeScript types for all props interfaces
- ✅ One component per file for better modularity
- ✅ Local UI state is OK (dropdown open/closed, input values, accordion expanded, hover state)
- ❌ NO server imports (Supabase, state management libraries, providers)
- ❌ NO hard-coded values (use Tailwind tokens from centralized config)
- ❌ NO data fetching or business logic (should come via props)

### Step 5: Create Design System Showcase Pages

**IMPORTANT**: Design system pages import from `@centrid/ui/features` to showcase the reusable components.

**Purpose**: The design-system app demonstrates the reusable components with state controls and mock data for visual iteration.

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

**3. Define screens list**: Create a shared screens list for navigation

**Location**: `apps/design-system/pages/[feature-name]/screens.ts`

```tsx
export const screens = [
  { name: '1. Screen Name', href: '/[feature-name]/screen-1' },
  { name: '2. Screen Name', href: '/[feature-name]/screen-2' },
  { name: '3. Screen Name', href: '/[feature-name]/screen-3' },
  // ... add all screens
];
```

**4. Create individual screen showcase pages**: `apps/design-system/pages/[feature-name]/screen-1.tsx`

```tsx
'use client';
import { useState } from 'react';
import { Screen1 } from '@centrid/ui/features'; // Import from UI package!
import { DesignSystemFrame } from '../../components/DesignSystemFrame';
import { screens } from './screens';

export default function Screen1Page() {
  // Add state controls for design iteration
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (value: string) => {
    console.log('Submitted:', value);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  return (
    <DesignSystemFrame
      featureName="[Feature Name]"
      featureId="[feature-id]"
      screens={screens}
    >
      {/* Render reusable component from UI package */}
      <Screen1
        onSubmit={handleSubmit}
        isLoading={isLoading}
        error={error}
      />

      {/* State controls for design review */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur p-4 rounded-lg shadow-lg z-50">
        <p className="text-xs font-semibold mb-2">Design Controls</p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setIsLoading(!isLoading)}
            className="px-3 py-1.5 text-xs bg-gray-200 rounded hover:bg-gray-300"
          >
            Toggle Loading
          </button>
          <button
            onClick={() => setError(error ? null : 'Example error message')}
            className="px-3 py-1.5 text-xs bg-gray-200 rounded hover:bg-gray-300"
          >
            Toggle Error
          </button>
        </div>
      </div>
    </DesignSystemFrame>
  );
}
```

Repeat for all screens (screen-2.tsx, screen-3.tsx, etc.)

**Benefits of DesignSystemFrame**:
- Provides consistent navigation chrome across all screens
- Screen dropdown allows quick navigation between designs
- Shows feature name and ID context
- Separates design system UI from actual feature UI
- Back link to main design system

**Architecture**:
```
packages/ui/src/features/[feature-name]/
├── Screen1.tsx           # Pure presentational component (SOURCE OF TRUTH)
├── Screen2.tsx
├── Screen3.tsx
└── index.ts              # Re-exports all screens + types

apps/design-system/
├── components/
│   └── DesignSystemFrame.tsx  # Navigation chrome wrapper
└── pages/[feature-name]/
    ├── index.tsx         # Feature overview
    ├── screens.ts        # Shared screens list for navigation
    ├── screen-1.tsx      # Showcase with DesignSystemFrame + state controls
    ├── screen-2.tsx      # Imports from @centrid/ui/features
    └── screen-3.tsx

apps/web/
└── src/components/[feature]/
    └── Screen1Container.tsx  # Wraps Screen1 with data fetching/business logic
```

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

## Architecture

### Reusable Components (Source of Truth)

**Location**: `packages/ui/src/features/[feature-name]/`

These are pure presentational components that can be used in any app:

\`\`\`
packages/ui/src/features/[feature-name]/
├── Screen1.tsx           # Pure presentational component
├── Screen2.tsx
├── Screen3.tsx
└── index.ts              # Re-exports all screens + types
\`\`\`

**Exported from**: `packages/ui/src/features/index.ts`
**Used by**: `apps/design-system`, `apps/web` (via `@centrid/ui/features`)

### Design System Showcase (For Iteration)

**Location**: `apps/design-system/pages/[feature-name]/`

These pages demonstrate the reusable components with state controls:

\`\`\`
apps/design-system/
├── components/
│   └── DesignSystemFrame.tsx   # Navigation chrome wrapper (reusable)
├── pages/
│   └── [feature-name]/
│       ├── index.tsx           # Feature overview
│       ├── screens.ts          # Shared screens list for navigation
│       ├── screen-1.tsx        # Showcase with DesignSystemFrame + state controls
│       ├── screen-2.tsx        # Uses DesignSystemFrame wrapper
│       └── ...
└── public/
    └── screenshots/
        └── [feature-name]/     # Desktop & mobile screenshots
\`\`\`

**DesignSystemFrame Usage**:
All screen showcase pages use `DesignSystemFrame` to provide consistent navigation:
- Back link to main design system
- Feature name and ID display
- Dropdown for quick screen navigation
- Separates design system chrome from actual feature UI

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

### Production Implementation

**Location**: `apps/web/src/components/[feature-name]/`

Production wrappers add business logic around the presentational components:

\`\`\`tsx
// apps/web/src/components/[feature-name]/Screen1Container.tsx
import { Screen1 } from '@centrid/ui/features';
import { useFeatureLogic } from '@/hooks/useFeatureLogic';

export function Screen1Container() {
  const { data, isLoading, error, handleSubmit } = useFeatureLogic();

  return (
    <Screen1
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
    />
  );
}
\`\`\`

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

## Reusable Components (packages/ui)
- [ ] Feature directory created: `packages/ui/src/features/[feature-name]/`
- [ ] Screen components created as separate files (Screen1.tsx, Screen2.tsx, etc.)
- [ ] Feature index created: `packages/ui/src/features/[feature-name]/index.ts`
- [ ] Main features index updated: `packages/ui/src/features/index.ts`
- [ ] All components are pure presentational (props-only, with local UI state allowed)
- [ ] TypeScript types exported for all props interfaces
- [ ] Components import from relative paths (`../../components`)

## Design System Showcase (apps/design-system)
- [ ] Feature directory created: `apps/design-system/pages/[feature-name]/`
- [ ] Feature index created: `apps/design-system/pages/[feature-name]/index.tsx`
- [ ] Screens list created: `apps/design-system/pages/[feature-name]/screens.ts`
- [ ] Individual screen showcase pages created (one per screen)
- [ ] Showcase pages import from `@centrid/ui/features`
- [ ] DesignSystemFrame wrapper used on all screen pages
- [ ] State controls added to showcase pages for design iteration
- [ ] Main design system index updated with feature link card
- [ ] Screenshots saved to `apps/design-system/public/screenshots/[feature-name]/`

## Visual Consistency
- [ ] All colors use centralized tokens (packages/ui/colors.config.js)
- [ ] All spacing uses Tailwind scale (no arbitrary px)
- [ ] All typography uses design tokens
- [ ] All primitives from @centrid/ui/components
- [ ] 44px minimum height for interactive elements (h-11)

## Component Quality
- [ ] Pure presentational - business data and logic via props
- [ ] All event handlers via callback props
- [ ] No server imports (Supabase, state management libraries, providers)
- [ ] No hard-coded values (use Tailwind tokens)
- [ ] Local UI state is acceptable (dropdown open, input value, accordion expanded)
- [ ] No data fetching or business logic (should come via props)
- [ ] TypeScript types for all props

## Component States
- [ ] All interactive elements have hover state
- [ ] All interactive elements have focus state (accessibility)
- [ ] Loading state handled via props
- [ ] Error state handled via props
- [ ] State controls in showcase pages for toggling states

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
- [ ] Each screen has its own dedicated showcase route
- [ ] Back navigation links work correctly
- [ ] Routes documented in design.md (design system + production)

## Documentation
- [ ] Design.md created with complete specification
- [ ] Architecture section documents both packages/ui and apps/design-system
- [ ] Each screen documented with route, layout, components, states
- [ ] Design tokens usage documented
- [ ] Accessibility features documented
- [ ] Screenshots referenced in documentation
- [ ] Production implementation pattern documented

## Implementation Ready
- [ ] Design approved by user
- [ ] All screens visible at http://localhost:3001/[feature-name]
- [ ] Components available via `@centrid/ui/features`
- [ ] Ready for production implementation in apps/web
- [ ] Ready for /speckit.tasks to generate implementation tasks
```

### Step 9: Output Summary

Report to user:

```
✅ Reusable components created (packages/ui):
   - Location: packages/ui/src/features/[feature-name]/
   - Components: [Screen1, Screen2, Screen3, ...]
   - Exported from: @centrid/ui/features
   - Available to: All apps (design-system, web, future apps)

✅ Design system showcase created (apps/design-system):
   - Feature index: http://localhost:3001/[feature-name]
   - Individual routes: [N] screens with dedicated showcase pages
   - State controls: Toggle loading, error, and other states
   - Screenshots: apps/design-system/public/screenshots/[feature-name]/

✅ Documentation created:
   - Spec: specs/[FEATURE]/design.md
   - Checklist: specs/[FEATURE]/design-checklist.md
   - Architecture documented (packages/ui + apps/design-system)

📸 Visual previews:
   - [Count] screenshots ([N] desktop + [N] mobile)
   - Desktop viewport: 1440×900
   - Mobile viewport: 375×812
   - Status: Approved ([DATE])

🎨 Design tokens used (from packages/ui/):
   - Colors: [list with hex values]
   - Typography: [list with sizes]
   - Spacing: [list with px values]

📦 Components architecture:
   - Primitives: Button, Input, Card from @centrid/ui/components
   - Features: [Screen1, Screen2] from @centrid/ui/features
   - Showcase: apps/design-system/pages/[feature-name]

🧭 Navigation structure:
   - Feature index: /[feature-name]
   - Screen routes: /[feature-name]/screen-1, /[feature-name]/screen-2, ...
   - Each screen has back navigation to feature index

Next steps:
   → Components ready to use via import { Screen1 } from '@centrid/ui/features'
   → Run /speckit.tasks to generate implementation tasks
   → Implement in apps/web by wrapping with business logic containers
   → Example: Screen1Container wraps Screen1 with data fetching
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

### Component Architecture Philosophy

**Three-Layer Pattern**:
1. **Primitives** (`packages/ui/src/components/`) - shadcn base components (Button, Input, Card)
2. **Features** (`packages/ui/src/features/[feature-name]/`) - Presentational screens (Screen1, Screen2)
3. **Containers** (`apps/web/src/components/[feature-name]/`) - Business logic wrappers

**When to use local state in features**:
- ✅ Dropdown open/closed
- ✅ Accordion expanded/collapsed
- ✅ Input field values (controlled inputs)
- ✅ Form validation state
- ✅ Hover/focus tracking
- ❌ Data fetching (loading, error)
- ❌ Server data
- ❌ Business logic

**Example - Good presentational component**:
```tsx
// packages/ui/src/features/document-editor/Editor.tsx
export function Editor({ content, onSave }: EditorProps) {
  const [text, setText] = useState(content); // ✅ Local UI state
  const [isExpanded, setIsExpanded] = useState(false); // ✅ Local UI state

  return (
    <Card>
      <Input value={text} onChange={(e) => setText(e.target.value)} />
      <Button onClick={() => onSave(text)}>Save</Button>
    </Card>
  );
}
```

### Leverage Centralization
- Check `packages/ui/src/components/index.ts` for available primitives
- Check `packages/ui/src/features/index.ts` for available feature components
- Use shadcn MCP to discover and search available components
- Import pattern:
  - From apps: `import { Button } from '@centrid/ui/components'`
  - From apps: `import { Screen1 } from '@centrid/ui/features'`
  - Within packages/ui: `import { Button } from '../../components'`
  - Design-system pages: `import { DesignSystemFrame } from '../../components/DesignSystemFrame'`
- Colors auto-sync from `colors.config.js` to all apps

### Component Composition
- Build complex UIs from simple primitives
- Use shadcn MCP to view component examples before composing
- Create feature-specific compositions in `packages/ui/src/features/`
- Avoid creating new base components unless necessary
- Use Tailwind utilities for layout/spacing

### Adding New shadcn Components
- Always use `./scripts/add-component.sh <component>` to add shadcn components
- NEVER run `shadcn add` directly in `packages/ui`
- Script ensures proper placement and import paths
- Remember to export from `packages/ui/src/components/index.ts`

### Design Iteration Speed
- Edit components in `packages/ui/src/features/`
- Hot reload shows changes instantly in design-system app
- Screenshot only changed sections
- Present visual diffs to user

### Reusability Benefits
- Design once in packages/ui → use everywhere
- Component available to all apps via `@centrid/ui/features`
- No duplication between design-system and production
- Single source of truth for feature UI
