---
title: GraphQL Backend Architecture
summary: Pothos schema builder with four-layer separation (Resolvers → Controllers → Services → Repositories)
---

<!-- After editing this file, run: npm run sync-docs -->

# GraphQL Backend Architecture

**What**: Backend uses Pothos GraphQL schema builder with four-layer separation: Resolvers (field resolution) → Controllers (request/response mapping) → Services (business logic) → Repositories (data access).

**Why**: Pothos provides code-first GraphQL with full TypeScript type safety, while four-layer separation keeps services framework-agnostic and reusable across different interfaces (GraphQL, REST, CLI).

**Architecture: Four Layers**

```typescript
// Layer 1: GraphQL Resolver (thin - field resolution only)
builder.mutationField('createFolder', (t) =>
  t.field({
    type: FolderType,
    args: { input: t.arg({ type: CreateFolderInput, required: true }) },
    resolve: async (parent, args, context) => {
      // Thin: just call controller with GraphQL args
      return await FolderController.createFolder(context, args.input)
    }
  })
)

// Layer 2: Controller (GraphQL ↔ Service mapping)
export const FolderController = {
  async createFolder(context, input) {
    // Map GraphQL input → service params
    const result = await FolderService.createFolder(
      context.userId,
      input.name,
      input.parentFolderId || null,
      input.id // Permanent UUID from client
    )
    // Map service result → GraphQL type (already matches, pass through)
    return result
  }
}

// Layer 3: Service (framework-agnostic business logic)
export const FolderService = {
  async createFolder(userId: string, name: string, parentId: string | null, id?: string) {
    // Framework-agnostic business logic
    return await folderRepository.create({
      id: id || crypto.randomUUID(),
      userId,
      name,
      parentId
    })
  }
}

// Layer 4: Repository (type-safe database access)
export const folderRepository = {
  async create(data) {
    // Type-safe database query (Drizzle ORM)
    return db.insert(folders).values(data).returning()
  }
}
```

**Implementation: Pothos Schema Builder**

```typescript
// apps/api/src/graphql/builder.ts
import SchemaBuilder from '@pothos/core'
import ValidationPlugin from '@pothos/plugin-validation'
import DataloaderPlugin from '@pothos/plugin-dataloader'

export const builder = new SchemaBuilder<{
  Context: {
    userId: string // Extracted from auth token
    folderChildrenLoader?: DataLoader<string, Folder[]> // Per-request cache
  }
  Scalars: {
    DateTime: { Input: Date; Output: string }
    JSON: { Input: unknown; Output: unknown }
  }
}>({
  plugins: [ValidationPlugin, DataloaderPlugin]
})

// Type Definition (apps/api/src/graphql/types/folder.ts)
const FolderType = builder.objectRef<Folder>('Folder')

FolderType.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    // Nested field with DataLoader (prevents N+1 queries)
    children: t.field({
      type: [FolderType],
      resolve: async (folder, args, context) => {
        if (!context.folderChildrenLoader) {
          context.folderChildrenLoader = createFolderChildrenLoader(context.userId)
        }
        return context.folderChildrenLoader.load(folder.id) // Batched query
      }
    })
  })
})
```

**Implementation: GraphQL Yoga Server**

```typescript
// apps/api/src/functions/api/index.ts
import { createYoga } from 'graphql-yoga'
import { schema } from '../../graphql/schema.ts'

const yoga = createYoga({
  schema,
  context: async ({ request }) => {
    const userId = await extractUserId(request) // From auth token
    return { userId }
  },
  graphqlEndpoint: '/api/graphql'
})

export default yoga
```

**Related Patterns**:
- See [GraphQL Schema Design](./data-graphql-schema-design.md) for 1:1 database-GraphQL mapping principles
- See [RLS Policies](./data-rls-policies.md) for access control at database level
- See [Validation Workflow](./data-validation-workflow.md) for GraphQL validation approach

**Rules**:
- ✅ DO keep resolvers thin (field resolution only)
- ✅ DO use controllers for GraphQL ↔ service mapping
- ✅ DO keep services framework-agnostic (no GraphQL types)
- ✅ DO put all database access in repositories
- ✅ DO use Pothos for type-safe schema definitions
- ✅ DO use DataLoaders for N+1 query prevention on nested fields
- ✅ DO extract `userId` from auth token in context
- ❌ DON'T put business logic in resolvers (use services)
- ❌ DON'T call repositories directly from resolvers (use controllers)
- ❌ DON'T use GraphQL types in service layer (keep framework-agnostic)
- ❌ DON'T forget DataLoaders for nested list queries (causes N+1)

**Used in**:
- `apps/api/src/graphql/builder.ts` - Pothos builder configuration
- `apps/api/src/graphql/schema.ts` - Schema export for Yoga server
- `apps/api/src/graphql/types/` - Type definitions with resolvers (Layer 1)
- `apps/api/src/controllers/` - Controller layer (Layer 2: request/response mapping)
- `apps/api/src/services/` - Service layer (Layer 3: business logic)
- `apps/api/src/repositories/` - Repository layer (Layer 4: Drizzle ORM queries)
- `apps/api/src/functions/api/index.ts` - GraphQL Yoga server setup
