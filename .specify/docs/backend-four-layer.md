---
title: Backend Four-Layer Architecture
summary: GraphQL Resolvers → Controllers → Services → Repositories for clean backend separation
---

<!-- After editing this file, run: npm run sync-docs -->

# Backend Four-Layer Architecture

**What**: Backend uses four-layer separation: GraphQL Resolvers (field resolution) → Controllers (request/response mapping) → Services (business logic) → Repositories (data access).

**Why**: Separating GraphQL concerns from business logic keeps services framework-agnostic and reusable across different interfaces (GraphQL, REST, CLI).

**How**:

```typescript
// Layer 1: GraphQL Resolver (apps/api/src/graphql/types/folder.ts)
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

// Layer 2: Controller (apps/api/src/controllers/folderController.ts)
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

// Layer 3: Service (apps/api/src/services/folderService.ts)
export const FolderService = {
  async createFolder(userId: string, name: string, parentId: string | null, id?: string) {
    // Framework-agnostic business logic
    return await folderRepository.create({ id: id || crypto.randomUUID(), userId, name, parentId })
  }
}

// Layer 4: Repository (apps/api/src/repositories/folder.ts)
export const folderRepository = {
  async create(data) {
    // Type-safe database query (Drizzle ORM)
    return db.insert(folders).values(data).returning()
  }
}
```

**Rules**:
- ✅ DO keep resolvers thin (field resolution only)
- ✅ DO use controllers for GraphQL ↔ service mapping
- ✅ DO keep services framework-agnostic (no GraphQL types)
- ✅ DO put all database access in repositories
- ❌ DON'T put business logic in resolvers
- ❌ DON'T call repositories directly from resolvers (use controllers)
- ❌ DON'T use GraphQL types in service layer

**Used in**:
- `apps/api/src/graphql/types/` - GraphQL resolver definitions (Pothos)
- `apps/api/src/controllers/` - Controller layer (request/response mapping)
- `apps/api/src/services/` - Service layer (business logic)
- `apps/api/src/repositories/` - Repository layer (Drizzle ORM queries)
