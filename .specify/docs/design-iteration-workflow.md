---
title: Design Iteration Workflow
summary: Design-first workflow using design-system app with Playwright automation for rapid iteration
domain: design
priority: specialized
related: []
---

<!-- After editing this file, run: npm run sync-docs -->

# Design Iteration Workflow

**What**: Use `apps/design-system` to design and iterate on UI before implementing in `apps/web`, with Playwright MCP for automated screenshot generation and parallel browser testing.

**Why**: Design-first approach catches UX issues early, enables rapid iteration with hot-reload, and maintains single source of truth for UI components before production implementation.

**Two-Layer Approach**:

1. **Global Design System** (`/speckit.design-system`) - Run once at project start to establish colors, typography, spacing, components
2. **Feature-Specific Design** (`/speckit.design`) - Run per feature to design screens/interactions using the global system

**Design Loop**:

1. Create component in `apps/design-system/components/[Feature].tsx`
2. Add to showcase in `apps/design-system/pages/index.tsx`
3. Run `npm run design:dev` → http://localhost:3001
4. Screenshot with Playwright MCP (mobile + desktop)
5. Get feedback → edit → auto-reload → re-screenshot
6. Approve → implement in `apps/web`

**Browser Automation with MCP**:

**Playwright Contexts MCP** (`.specify/mcp-servers/playwright-contexts/`):

- Parallel browser contexts for simultaneous testing (7-10x faster)
- Full Playwright API (navigate, click, type, screenshot, evaluate)
- Sub-agents run different flows independently

**Standard Viewports**: Mobile (375×812), Desktop (1440×900)

**Screenshots**: Save to `apps/design-system/public/screenshots/[feature-name]/` with naming pattern: `[viewport]-[state].png` (e.g., `mobile-default.png`, `desktop-hover.png`)

**Providing Design Feedback**:

**10 Design Levers** (use these when iterating):

1. **Visual Hierarchy** - Is the primary action obvious?
2. **Consistency** - Do similar things look similar?
3. **Information Density** - Right amount of info?
4. **Color with Purpose** - Every color means something?
5. **Typography Hierarchy** - Scannable text structure?
6. **Spacing Rhythm** - Consistent, mathematical spacing?
7. **Feedback & Affordance** - Interactivity obvious?
8. **Mobile-First Responsive** - Designed for constraints first?
9. **Accessibility** - Works for everyone?
10. **States** - Loading, error, empty states designed?

**Example feedback**:

- "Visual hierarchy: Make submit button more prominent"
- "Spacing: Feels cramped, increase gap between sections"
- "Accessibility: Focus state hard to see, needs stronger contrast"
- "States: Add loading spinner for AI response"

**Rules**:
- ✅ DO design in `apps/design-system` before implementing in `apps/web`
- ✅ DO use Playwright MCP for automated screenshots
- ✅ DO test both mobile (375×812) and desktop (1440×900) viewports
- ✅ DO save screenshots to `apps/design-system/public/screenshots/[feature]/`
- ✅ DO use naming pattern `[viewport]-[state].png`
- ✅ DO iterate with hot-reload (auto-refresh on save)
- ❌ DON'T skip design phase and implement directly in production
- ❌ DON'T forget to test mobile viewport
- ❌ DON'T implement without approval

**Used in**:
- `apps/design-system/` - Component playground for design iteration
- `.specify/mcp-servers/playwright-contexts/` - Browser automation for screenshots
- `.specify/design-system/` - Design system documentation
- `/speckit.design` - Command for feature-specific design workflow
- `/speckit.design-system` - Command for global design system setup
