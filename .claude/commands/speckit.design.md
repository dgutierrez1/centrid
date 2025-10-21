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

```tsx
/**
 * Feature Design: [Feature Name]
 *
 * Created during /speckit.design workflow
 * Status: Draft / Approved
 * Approved Date: [if approved]
 */

import { Button, Input, Card, CardHeader, CardTitle, CardContent, Badge } from '@centrid/ui/components';

export function FeatureScreen() {
  return (
    <div className="min-h-screen p-4 bg-background">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>[Feature Title]</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Use design tokens via Tailwind classes */}
          <Input
            type="text"
            placeholder="Example input..."
            className="w-full"
          />

          <Button className="w-full">
            Primary Action
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Key principles**:
- ✅ Import from `@centrid/ui/components` (centralized package)
- ✅ Use Tailwind classes with design tokens (e.g., `bg-primary-600`, `p-6`, `gap-4`)
- ✅ Pure presentational component - all data via props, all events via callbacks
- ❌ NO server imports (Supabase, state management, providers)
- ❌ NO hard-coded values (use Tailwind tokens from centralized config)

### Step 5: Add to Design Showcase

Edit `apps/design-system/pages/index.tsx`:

```tsx
import { FeatureScreen } from '../components/FeatureScreen';

// Add new section to showcase:
<section>
  <h2 className="text-2xl font-semibold mb-6 text-foreground">
    [Feature Name] Design
  </h2>
  <p className="text-sm text-muted-foreground mb-6">
    Feature design for: [brief description]
  </p>
  <div className="border border-border rounded-lg overflow-hidden">
    <FeatureScreen />
  </div>
</section>
```

### Step 6: Visual Iteration with Playwright MCP

**Start Design Sandbox**:
```bash
npm run design:dev  # Starts on localhost:3001
```

**Screenshot with Playwright MCP**:

1. Navigate to `http://localhost:3001`
2. Scroll to the feature section
3. Screenshot mobile viewport (375×812):
   - Default state
   - Hover state (if applicable)
   - Focus state (accessibility)
   - Error state
   - Loading state
4. Screenshot desktop viewport (1440×900):
   - Same states as mobile
5. Save screenshots to `apps/design-system/public/screenshots/[feature]/`

**Present to user**:
```markdown
## Visual Preview: [Feature Name]

### Mobile View (375×812)
[Show screenshot]

### Desktop View (1440×900)
[Show screenshot]

### Component States
- Default: [screenshot]
- Hover: [screenshot]
- Focus: [screenshot]
- Error: [screenshot]
- Loading: [screenshot]

---
**Feedback questions**:
1. Does the spacing feel balanced?
2. Are the colors working well together?
3. Does the layout feel intuitive?
4. Any elements feeling too large/small?
5. Overall visual quality: approve or iterate?
```

**Iteration loop**:
1. User provides feedback
2. Update component in `apps/design-system/components/[Feature].tsx`
3. Browser auto-reloads (hot reload)
4. Re-screenshot changed screens
5. Present delta to user
6. Repeat until approved

**Approval**:
- User says "approved" or "looks good"
- Mark component file with approval date
- Lock design for implementation

### Step 7: Document Design Spec

Create `specs/[FEATURE]/design.md`:

```markdown
# Visual Design: [Feature Name]

**Status**: Approved
**Approved Date**: [DATE]
**Screenshots**: `apps/design-system/public/screenshots/[feature]/`
**Component Location**: `apps/design-system/components/[FeatureName].tsx`

## Screens

### Screen 1: [Screen Name]

**Layout**:
- Mobile: Single column, full-width
- Desktop: Centered card, max-width 400px

**Components Used** (from @centrid/ui/components):
- Button (default variant, lg size) - Submit action
- Input (text variant) - Email/password inputs
- Card, CardHeader, CardTitle, CardContent - Container structure

**Design Tokens** (from packages/ui/):
- Colors: `bg-background`, `text-foreground`, `border-border`
- Spacing: `p-6` (card padding), `gap-4` (form spacing)
- Typography: `text-2xl font-semibold` (title)

**States**:
- Default: Clean, minimal
- Loading: Button shows spinner, inputs disabled
- Error: Red border on invalid input, error message below
- Success: Toast notification, fade to next screen

**Accessibility**:
- Tab order: Input 1 → Input 2 → Button
- Focus indicators: 2px ring-ring
- ARIA labels: Form labeled, errors announced
- Touch targets: All buttons 44×44px minimum

## Mobile Screenshots

- `default.png` - Default state
- `error.png` - Error state
- `loading.png` - Loading state

## Desktop Screenshots

- `desktop-default.png` - Default state
- `desktop-error.png` - Error state
```

### Step 8: Create Design Checklist

Generate `specs/[FEATURE]/checklists/design.md`:

```markdown
# Design Quality Checklist: [Feature Name]

## Visual Consistency
- [ ] All colors use centralized tokens (packages/ui/colors.config.js)
- [ ] All spacing uses Tailwind scale (no arbitrary px)
- [ ] All typography uses design tokens
- [ ] All components from @centrid/ui/components

## Component States
- [ ] All interactive elements have hover state
- [ ] All interactive elements have focus state (accessibility)
- [ ] All async actions have loading state
- [ ] All forms have error state
- [ ] All data displays have empty state

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
- [ ] Error messages use aria-live

## Implementation Ready
- [ ] Component created in apps/design-system/components/
- [ ] Screenshots saved to apps/design-system/public/screenshots/
- [ ] Design.md documented with all specs
- [ ] Design approved by user
- [ ] Component uses only @centrid/ui/components (no server deps)
```

### Step 9: Output Summary

Report to user:

```
✅ Design created and approved:
   - Component: apps/design-system/components/[Feature].tsx
   - Spec: specs/[FEATURE]/design.md
   - Screenshots: apps/design-system/public/screenshots/[feature]/
   - Checklist: specs/[FEATURE]/checklists/design.md

📸 Visual previews:
   - [Count] screenshots (mobile + desktop)
   - [Count] state variations captured
   - Status: Approved ([DATE])

🎨 Design tokens used (from packages/ui/):
   - Colors: [list]
   - Typography: [list]
   - Spacing: [list]

📦 Components used (from @centrid/ui/components):
   - Existing: [Button, Input, Card, ...]
   - New compositions: [DocumentCard, ...]

Next steps:
   → Run /speckit.tasks to generate implementation tasks
   → Tasks will reference this design for UI development
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
    ├── mobile-default.png
    ├── mobile-hover.png
    ├── mobile-focus.png
    ├── mobile-error.png
    ├── mobile-loading.png
    ├── desktop-default.png
    ├── desktop-hover.png
    ├── desktop-focus.png
    ├── desktop-error.png
    └── desktop-loading.png
```

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
