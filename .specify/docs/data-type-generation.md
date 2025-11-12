---
title: Type Generation Pattern
summary: Drizzle-inferred types for backend, GraphQL Codegen types for frontend—never redeclare
---

<!-- After editing this file, run: npm run sync-docs -->

# Type Generation Pattern

**What**: Backend uses Drizzle-inferred types from `db/types.ts`, frontend uses GraphQL Codegen types from `@/types/graphql`

**Why**: Single source of truth prevents type redeclaration, field mismatches, and manual type maintenance

**How**:

Backend (Code-First):
```typescript
// Import from Drizzle-inferred types
import type { Thread, CreateFolderInput } from '../db/types.js'

// GraphQL schema references database types
const ThreadType = builder.objectRef<Thread>("Thread").implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    branchTitle: t.exposeString("branchTitle"),
  })
})
```

Frontend (Schema-First):
```typescript
// Import from GraphQL Codegen (auto-generated from introspection)
import type { Thread, Message } from '@/types/graphql'

// Extend with client-only fields using intersection types
export type ThreadWithUIState = Thread & {
  isStreaming?: boolean;  // UI-only field
  depth?: number;         // Computed client-side
}
```

**Type Flow Architecture**:
```
Database Schema (Drizzle)
  ↓ InferSelectModel (compile-time type inference)
apps/api/src/db/types.ts (Backend source of truth)
  ↓ Pothos builder references these types
GraphQL Schema (built programmatically)
  ↓ Published at /api/graphql endpoint
GraphQL Codegen (introspects published schema)
  ↓
apps/web/src/types/graphql.ts (Frontend source of truth)
```

**Rules**:
- ✅ DO: Backend imports from `../db/types.js` (Drizzle InferSelectModel)
- ✅ DO: Frontend imports from `@/types/graphql` (GraphQL Codegen)
- ✅ DO: Extend types with client-only fields using intersection types (`Thread & { depth: number }`)
- ✅ DO: Run `npm run codegen` after schema changes to regenerate frontend types
- ✅ DO: Run `npm run db:push` to sync database and auto-update backend types
- ❌ DON'T: Manually redefine types that exist in generated sources
- ❌ DON'T: Create duplicate type definitions across services/repositories/state
- ❌ DON'T: Import GraphQL types in backend (backend creates the schema, doesn't consume it)

**Used in**:
- `apps/api/src/db/types.ts` - Backend type definitions (16 files import from here)
- `apps/api/src/db/schema.ts` - Drizzle database schema (source for type inference)
- `apps/web/src/types/graphql.ts` - Frontend type definitions (auto-generated, 2083 lines)
- `codegen.yml` - GraphQL Codegen configuration (introspects remote schema)
- `apps/api/src/graphql/types/*.ts` - GraphQL type definitions using Pothos builder
- `apps/web/src/lib/hooks/*.ts` - Frontend hooks importing GraphQL types

**Known Violations** (to be fixed):
- `apps/web/src/lib/state/aiAgentState.ts` - Manually defines Thread, Message, ContextReference with field mismatches
- `apps/web/src/lib/types/index.ts` - Manually defines Folder, File instead of importing from GraphQL
