---
title: Local Development Commands
summary: npm scripts for dev servers, builds, validation, and component management
domain: devops
priority: core
related: [backend-remote-first-development]
---

<!-- After editing this file, run: npm run sync-docs -->

# Local Development Commands

**What**: npm scripts for starting dev servers, building apps, type-checking, code generation, and managing components.

**Why**: Standardized commands across the monorepo ensure consistent developer experience and simplify onboarding.

**Local Development**:

```bash
npm install                    # Install all workspace dependencies
npm run dev                    # Start all apps in parallel
npm run web:dev               # Start main app (http://localhost:3000)
npm run design:dev            # Start design system (http://localhost:3001)
npm run build                 # Build all apps
npm run validate              # Type-check + lint all workspaces
npm run codegen               # Generate GraphQL types from schema
npm run codegen:watch         # Watch mode for GraphQL codegen
```

**Component Workflow**:

```bash
./scripts/add-component.sh <name>   # Add shadcn component to packages/ui
# Then manually export from packages/ui/src/components/index.ts
```

**Important**: Never run `shadcn add` directly in `packages/ui` - always use the script!

**Type Generation Workflow**:

```bash
npm run db:push               # Push schema changes to remote
npm run codegen               # Regenerate types from updated schema
```

**Rules**:
- ✅ DO use `npm run dev` to start all apps (remote by default)
- ✅ DO run `npm run validate` before committing
- ✅ DO run `npm run codegen` after schema changes
- ✅ DO use `./scripts/add-component.sh` for shadcn components
- ✅ DO manually export new components from `packages/ui/src/components/index.ts`
- ❌ DON'T run `shadcn add` directly in packages/ui (breaks structure)
- ❌ DON'T skip validation before committing
- ❌ DON'T forget to run codegen after schema changes

**Used in**:
- `package.json` - Root scripts for workspace-wide commands
- `apps/web/package.json` - Web app-specific scripts
- `apps/api/package.json` - API app-specific scripts
- `scripts/add-component.sh` - shadcn component installer
