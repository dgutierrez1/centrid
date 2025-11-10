---
title: GraphQL Backend Integration (Pothos + Yoga)
summary: Pothos schema builder with type-safe resolvers, DataLoaders, and GraphQL Yoga server
---

<!-- After editing this file, run: npm run sync-docs -->

# GraphQL Backend Integration (Pothos + Yoga)

**What**: Pothos GraphQL schema builder provides type-safe schema definitions, resolvers, and DataLoaders for N+1 query prevention, served via GraphQL Yoga.

**Why**: Pothos enables code-first GraphQL with full TypeScript type safety, eliminating schema drift and providing autocomplete for resolvers without generating code.

**How**:

```typescript
// Builder Setup (apps/api/src/graphql/builder.ts)
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

// Resolver (Mutation)
builder.mutationField('createFolder', (t) =>
  t.field({
    type: FolderType,
    args: { input: t.arg({ type: CreateFolderInput, required: true }) },
    resolve: async (parent, args, context) => {
      // Call controller (not service directly)
      return await FolderController.createFolder(context, args.input)
    }
  })
)

// GraphQL Yoga Server (apps/api/src/functions/api/index.ts)
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

**Rules**:
- ✅ DO use Pothos for type-safe schema definitions
- ✅ DO use DataLoaders for N+1 query prevention on nested fields
- ✅ DO extract `userId` from auth token in context
- ✅ DO call controllers from resolvers (not services directly)
- ❌ DON'T call repositories directly from resolvers
- ❌ DON'T forget DataLoaders for nested list queries (causes N+1)
- ❌ DON'T put business logic in resolvers (use controllers/services)

**Used in**:
- `apps/api/src/graphql/builder.ts` - Pothos builder configuration
- `apps/api/src/graphql/schema.ts` - Schema export for Yoga server
- `apps/api/src/graphql/types/` - Type definitions with resolvers
- `apps/api/src/functions/api/index.ts` - GraphQL Yoga server setup
