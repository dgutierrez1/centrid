# Centrid Design Sandbox

Standalone design iteration environment for rapid UI prototyping, completely decoupled from the main application.

## Purpose

This sandbox allows you to:
- **Design features visually** before implementing them in the main app
- **Iterate quickly** with hot-reload and Browser MCP screenshots
- **Use production tools** (Tailwind + shadcn/ui) without touching app code
- **Share components** via path aliases (no duplication)

## Quick Start

### 1. Install dependencies (first time only)

From the **root directory**:
```bash
npm run design:install
```

Or from this directory:
```bash
npm install
```

### 2. Start the design server

From the **root directory**:
```bash
npm run design:dev
```

Or from this directory:
```bash
npm run dev
```

The server runs on **http://localhost:3001** (port 3001 to avoid conflicts with main app)

### 3. View the design showcase

Open your browser to:
```
http://localhost:3001
```

You'll see the complete design system with all components, colors, typography, and spacing.

## Workflow: Designing a New Feature

### Step 1: Create Feature Component

Create a new component file:
```bash
design-sandbox/components/MyFeature.tsx
```

Example:
```tsx
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function MyFeature() {
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>My Feature</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">Feature description</p>
        <Button>Take Action</Button>
      </CardContent>
    </Card>
  );
}
```

### Step 2: Add to Showcase

Edit `pages/index.tsx` and add your component:

```tsx
import { MyFeature } from '../components/MyFeature';

// Inside the page component:
<section>
  <h2 className="text-2xl font-semibold mb-6">My Feature</h2>
  <MyFeature />
</section>
```

### Step 3: Iterate

1. Save your changes
2. Browser auto-reloads
3. View the result at http://localhost:3001
4. Use Browser MCP to screenshot
5. Get feedback → edit → repeat

### Step 4: Approve & Copy

Once the design is approved:

```bash
# Copy to main app
cp design-sandbox/components/MyFeature.tsx ../src/components/features/MyFeature.tsx
```

## Available Components

All shadcn/ui components from the main project are available via `@/components/ui/`:

- **Button** - `@/components/ui/button`
- **Input** - `@/components/ui/input`
- **Card** - `@/components/ui/card`
- **Badge** - `@/components/ui/badge`

## Design System Reference

See `.specify/design-system/tokens.md` for the complete design system documentation:
- Color palette
- Typography scale
- Spacing system
- Component patterns
- Accessibility guidelines

## Browser MCP Integration

### Manual Screenshots

1. Navigate to `http://localhost:3001` in Browser MCP
2. Set viewport:
   - Mobile: 375×812
   - Desktop: 1440×900
3. Screenshot full page or specific sections
4. Save to `public/screenshots/`

### Automated Screenshots (Future)

A script can be created to automate screenshot capture for all components and states.

## File Structure

```
design-sandbox/
├── README.md              # This file
├── package.json           # Minimal Next.js setup
├── next.config.js         # Uses parent Tailwind config
├── tsconfig.json          # TypeScript config with @/ alias
├── tailwind.config.js     # Imports parent config
├── postcss.config.js      # PostCSS setup
├── pages/
│   ├── _app.tsx           # Imports parent globals.css
│   └── index.tsx          # Design showcase
├── components/            # Feature designs go here
│   └── (empty)            # Add your components
└── public/
    └── screenshots/       # Browser MCP output
```

## Design Tokens

Design tokens are centralized in `.specify/design-system/tokens.md`.

**Always use Tailwind classes** instead of hard-coded values:
- ✅ `bg-primary-600` (from design system)
- ❌ `bg-[#7C3AED]` (hard-coded)

## Tips

### Hot Reload

Next.js automatically reloads when you save changes. If hot reload stops working:
```bash
# Restart the server
npm run dev
```

### Component Not Found

If you get import errors:
- Ensure the component exists in `../src/components/ui/`
- Check the `@/` alias is working (defined in tsconfig.json)
- Restart the dev server

### Styling Issues

If Tailwind classes aren't working:
- Check that `tailwind.config.js` is importing the parent config
- Ensure your component is in a directory listed in `content` (tailwind.config.js)
- Clear Next.js cache: `rm -rf .next && npm run dev`

### Dark Mode

Dark mode works automatically via `dark:` classes. Toggle your system dark mode to test.

## Next Steps

1. **Design new features** in `components/`
2. **Add to showcase** in `pages/index.tsx`
3. **Screenshot with Browser MCP**
4. **Iterate based on feedback**
5. **Copy approved components** to main app

---

**Questions?** See `.specify/design-system/tokens.md` for design guidelines or the main `CLAUDE.md` for project architecture.
