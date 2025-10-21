# @centrid/ui

Shared UI component library for Centrid applications, built on shadcn/ui and Tailwind CSS.

## Architecture

```
packages/ui/
├── src/
│   ├── components/       # All shadcn components live here
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── chart.tsx
│   │   └── index.ts      # Central export file
│   ├── layout/          # Layout components
│   ├── features/        # Feature-specific components
│   └── lib/
│       ├── utils.ts     # cn() utility
│       └── colors.ts    # (DO NOT USE - use colors.config.js)
├── colors.config.js      # SINGLE SOURCE OF TRUTH for colors
├── colors.config.d.ts    # TypeScript definitions for colors
├── tailwind.config.js    # Tailwind configuration
└── styles/
    └── globals.css      # Global styles with CSS variables
```

## Usage in Apps

### Importing Components

```tsx
import { Button, Input, Card } from '@centrid/ui/components';
import { colors } from '@centrid/ui/colors';

function MyComponent() {
  return (
    <Card>
      <Input />
      <Button>Click me</Button>
    </Card>
  );
}
```

### Importing Colors

```tsx
import { colors, agentColors, shadcnTheme } from '@centrid/ui/colors';

const primaryColor = colors.primary[600]; // #ff4d4d
const createAgentColor = agentColors.create; // #ff4d4d
```

## Adding New Components

### Using the Helper Script (Recommended)

We provide an automated script that handles the entire workflow:

```bash
# From the project root
./scripts/add-component.sh <component-name>

# Examples:
./scripts/add-component.sh avatar
./scripts/add-component.sh dialog
./scripts/add-component.sh dropdown-menu
```

**What the script does:**
1. ✅ Adds the component via shadcn CLI to `apps/design-system`
2. ✅ Automatically moves it to `packages/ui/src/components/`
3. ✅ Fixes all imports (changes `@/` to relative paths)
4. ✅ Reminds you to add exports

**After running the script**, add the export to `packages/ui/src/components/index.ts`:

```tsx
// Example for avatar component
export { Avatar, AvatarImage, AvatarFallback } from './avatar';
```

### Manual Addition (Alternative)

If you prefer to add components manually:

1. Find the component on [shadcn/ui](https://ui.shadcn.com/docs/components)
2. Copy code to `packages/ui/src/components/[component-name].tsx`
3. Fix imports (`@/lib/utils` → `../lib/utils`)
4. Export in `packages/ui/src/components/index.ts`
5. Install dependencies if needed

## Component Library Exports

The package exports multiple entry points:

```json
{
  ".": "./src/index.ts",
  "./components": "./src/components/index.ts",
  "./layout": "./src/layout/index.ts",
  "./features": "./src/features/index.ts",
  "./styles": "./styles/globals.css",
  "./colors": "./colors.config.js"
}
```

## Available Components

Current components (from shadcn/ui):
- `Button` - Primary button component with variants
- `Input` - Text input field
- `Textarea` - Multi-line text input
- `Label` - Form label
- `Card` - Card container with header, content, footer
- `Badge` - Status/tag badge
- `Alert` - Alert/notification component
- `Separator` - Horizontal/vertical separator
- `Chart` - Chart container with Recharts integration

## Color System

All colors are centralized in [colors.config.js](colors.config.js):

- **Primary**: Coral pink (#ff4d4d) - Main brand color
- **Success**: Green (#34c759) - Success states
- **Warning**: Orange (#ff9f0a) - Warning states
- **Error**: Deep red (#dc2626) - Error states (distinct from primary)
- **Gray**: Neutral grays for text and backgrounds

See [COLORS.md](COLORS.md) for complete color documentation.

## Design System

Preview and test components: `npm run design:dev`

The design system app (`apps/design-system`) is a sandbox for:
- Previewing all components
- Testing color palette
- Iterating on design decisions
- Documenting component usage

## FAQ

### Why don't we use `components.json` in packages/ui?

shadcn CLI expects to run in a framework directory (Next.js app), not a bare package. The recommended approach for monorepos is to:
1. Keep components in `packages/ui` as the source of truth
2. Apps import from `@centrid/ui/components`
3. Add new components manually or via shadcn CLI in an app, then move to packages/ui

### How do production apps use these components?

```tsx
// In apps/web or any other app
import { Button, Card, Input } from '@centrid/ui/components';
```

No `components.json` needed in production apps - they just consume the shared package.

### How do I customize a component for my app?

1. **Preferred**: Use component props and className overrides
2. **Alternative**: Copy the component to your app's local components folder and modify it
3. **Avoid**: Modifying shared components in packages/ui unless the change benefits all apps

## Dependencies

Core dependencies (already installed):
- `react` (peer dependency)
- `tailwindcss` (peer dependency)
- `class-variance-authority` - For component variants
- `clsx` - Conditional classNames
- `tailwind-merge` - Merge Tailwind classes
- `recharts` - Charts library
- `lucide-react` - Icon library

## TypeScript

Full TypeScript support with exported types for all components.

## Contributing

When adding new components:
1. ✅ Use TypeScript
2. ✅ Export types
3. ✅ Update `components/index.ts`
4. ✅ Add to this README
5. ✅ Test in design-system app
6. ✅ Follow existing code style
