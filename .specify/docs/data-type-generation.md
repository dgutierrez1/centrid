---
title: Type Generation Pattern
summary: Drizzle-inferred types for backend, GraphQL Codegen types for frontend—never redeclare
domain: data
priority: core
related: [data-graphql-schema-design, backend-graphql-architecture]
---

<!-- After editing this file, run: npm run sync-docs -->

# Type Generation Pattern

**What**: Backend uses Drizzle-inferred types from `db/types.ts` for database entities and GraphQL Codegen types from `types/graphql.ts` for Input types. Frontend uses GraphQL Codegen types from `@/types/graphql`. UI package uses GraphQL Codegen types from `packages/ui/src/types/graphql.ts`.

**Why**: Single source of truth prevents type redeclaration, field mismatches, and manual type maintenance

**How**:

Backend Database Entities:
```typescript
// Import Drizzle-inferred types for database operations
import type { Thread, InsertThread } from '../db/types.js'

// GraphQL schema references database types
const ThreadType = builder.objectRef<Thread>("Thread").implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    branchTitle: t.exposeString("branchTitle"),
  })
})
```

Backend GraphQL Input Types:
```typescript
// Import GraphQL Input types (auto-generated from schema)
import type { UpdateFileInput, UpdateFilePartialInput } from '../types/graphql.js'

// Services can use GraphQL types directly when they match
export class FileService {
  static async updateFile(fileId: string, userId: string, updates: UpdateFileInput) {
    // ...
  }
}

// Services define custom Input types ONLY when adding server-side context
export interface CreateFileInput {
  userId: string; // From auth context (not in GraphQL)
  name: string;
  content: string;
  provenance?: { threadId: string }; // Internal metadata (not exposed)
}
```

Frontend Types:
```typescript
// Import from GraphQL Codegen (auto-generated from introspection)
import type { Thread, Message } from '@/types/graphql'

// UI state types with UI prefix for computed/client-side fields
export interface UIThread {
  id: string;
  title: string; // Renamed from 'branchTitle'
  depth: number; // Computed from hierarchy (not in database)
  artifactCount: number; // Computed from files (not in database)
  lastActivity: string; // Computed from messages (not in database)
}
```

**Type Flow Architecture**:
```
Database Schema (Drizzle)
  ↓ InferSelectModel/InsertModel (compile-time type inference)
apps/api/src/db/types.ts (Backend entity types - AUTO-GENERATED)
  ↓ Pothos builder references database types
GraphQL Schema (built programmatically via Pothos)
  ↓ Published at /api/graphql endpoint
  ↓ GraphQL Codegen introspects published schema
  ├─→ apps/web/src/types/graphql.ts (Frontend types + urql hooks)
  ├─→ apps/api/src/types/graphql.ts (Backend Input types)
  └─→ packages/ui/src/types/graphql.ts (UI package types, no __typename)
```

**Rules**:

Backend:
- ✅ DO: Import database entities from `../db/types.js` (Drizzle InferSelectModel)
- ✅ DO: Import GraphQL Input types from `../types/graphql.js` (GraphQL Codegen) when they match service needs
- ✅ DO: Define custom Service Input types ONLY when adding server-side context (userId, provenance, etc.)
- ✅ DO: Keep `db/types.ts` purely auto-generated (NO manual DTOs)
- ❌ DON'T: Add manual types to `db/types.ts` (violates auto-generated contract)
- ❌ DON'T: Import across apps (`apps/api` importing from `apps/web` breaks deployment)

Frontend:
- ✅ DO: Import from `@/types/graphql` (GraphQL Codegen)
- ✅ DO: Use `UI` prefix for state types with computed/client-side fields (`UIThread`, `UIMessage`)
- ✅ DO: Document why UI types differ from GraphQL types (computed fields, client-side state)
- ❌ DON'T: Shadow GraphQL types (use `UIThread` instead of `Thread` in state files)
- ❌ DON'T: Manually redefine types that exist in generated GraphQL types

UI Package:
- ✅ DO: Import from local `types/graphql.ts` for component props
- ✅ DO: Note that UI types have `skipTypename: true` (cleaner for component props)
- ❌ DON'T: Import from `apps/web` or `apps/api` type files (breaks package isolation)

Workflow:
- ✅ DO: Run `npm run db:push` after schema changes (syncs database + auto-updates Drizzle types)
- ✅ DO: Run `npm run codegen` after GraphQL schema changes (regenerates frontend + backend GraphQL types)
- ✅ DO: Run `npm run validate` before commits (catches type mismatches across workspace)

**Used in**:
- `apps/api/src/db/types.ts` - Backend database entity types (auto-generated from Drizzle)
- `apps/api/src/types/graphql.ts` - Backend GraphQL Input types (auto-generated from schema)
- `apps/web/src/types/graphql.ts` - Frontend GraphQL types + urql hooks (auto-generated from schema)
- `packages/ui/src/types/graphql.ts` - UI package GraphQL types (auto-generated, no __typename)
- `codegen.yml` - GraphQL Codegen configuration (generates 3 type files: frontend, backend, UI package)
- `apps/api/src/services/*.ts` - Services import from `../db/types.js` and `../types/graphql.js`
- `apps/web/src/lib/state/aiAgentState.ts` - UI state types (UIThread, UIMessage, UIContextReference)

**Intentional Type Duplication**:
- `apps/api/src/types/agent.ts`, `apps/web/src/types/agent.ts`, `packages/ui/src/types/agent.ts` - ContentBlock types manually synchronized (MVP pragmatism, see file headers for sync instructions)
