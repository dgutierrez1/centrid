---
title: Monorepo Structure Pattern
summary: Turborepo workspace with strict import boundaries and component placement rules
domain: frontend
priority: core
related: [backend-graphql-architecture]
---

<!-- After editing this file, run: npm run sync-docs -->

# Monorepo Structure Pattern

**What**: Turborepo monorepo with three apps and one shared UI package, enforcing strict import boundaries to prevent circular dependencies and maintain clean architecture.

**Why**: Clear separation between pure UI (packages/ui), business logic (apps/web), and backend (apps/api) enables component reuse, parallel development, and independent deployment.

**Structure**:

```
centrid/
├── apps/
│   ├── web/              # Main Next.js frontend (Pages Router)
│   ├── design-system/    # Component playground (isolated)
│   └── api/              # Backend (Edge Functions + Services + Repositories + Supabase config)
└── packages/
    └── ui/               # Pure UI components (SOURCE OF TRUTH, no server deps)
```

**Import Rules**:

```
apps/web → packages/ui         ✅ Allowed
apps/design-system → packages/ui   ✅ Allowed
packages/ui → Supabase/Valtio/apps ❌ FORBIDDEN (breaks reusability)
```

**Component Placement**:

| Component Type | Location | Dependencies Allowed |
|----------------|----------|---------------------|
| Pure UI (no server deps) | `packages/ui/` | React, Tailwind, shadcn/ui only |
| Business logic components | `apps/web/src/components/` | Supabase, Valtio, GraphQL, state |
| Backend services | `apps/api/src/services/` | Drizzle ORM, database types |

**Backend Architecture**:

```
Edge Functions (thin handlers)
  ↓
Services (business logic)
  ↓
Repositories (Drizzle ORM)
```

**Rules**:
- ✅ DO put pure UI components in `packages/ui/` (no Supabase/Valtio imports)
- ✅ DO put business logic in `apps/web/src/components/`
- ✅ DO keep Edge Functions thin (delegate to services)
- ✅ DO put business logic in services (framework-agnostic)
- ✅ DO put database access in repositories (Drizzle ORM only)
- ❌ DON'T import Supabase/Valtio in `packages/ui/` (breaks reusability)
- ❌ DON'T put business logic in Edge Functions (use services)
- ❌ DON'T call repositories directly from Edge Functions (use services)

**Used in**:
- `package.json` - Turborepo workspace configuration
- `packages/ui/` - Pure UI components exported to all apps
- `apps/web/` - Main application with business logic
- `apps/api/src/services/` - Business logic layer
- `apps/api/src/repositories/` - Data access layer
