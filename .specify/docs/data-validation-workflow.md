---
title: Validation Workflow Pattern
summary: Three-layer validation with GraphQL as source of truth, no duplicate Zod schemas
---

<!-- After editing this file, run: npm run sync-docs -->

# Validation Workflow Pattern

**What**: Three-layer validation architecture using Zod for frontend forms, GraphQL schema for API contracts, and database constraints for final enforcement.

**Why**: GraphQL type system provides built-in validation eliminating the need for duplicate validation schemas on the backend, while maintaining type safety across queries and realtime subscriptions.

**How**:

```typescript
// Layer 1: Frontend Form Validation (Zod)
// apps/web/src/lib/validations/auth.ts
export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().trim().min(1).max(100),
})

// apps/web/pages/signup.tsx
const validation = signupSchema.safeParse(formData);
if (!validation.success) {
  setError(validation.error.errors[0].message);
  return;
}

// Layer 2: GraphQL Schema Validation (Pothos)
// apps/api/src/graphql/types/thread.ts
const CreateThreadInput = builder.inputType("CreateThreadInput", {
  fields: (t) => ({
    branchTitle: t.string({ required: true }),  // Validated by GraphQL
    parentThreadId: t.id({ required: false, nullable: true }),
  }),
});

builder.mutationField("createThread", (t) =>
  t.field({
    args: { input: t.arg({ type: CreateThreadInput, required: true }) },
    resolve: async (parent, args, context) => {
      // args.input already validated by GraphQL - no Zod needed
      return await ThreadController.createThread(context, args.input);
    }
  })
);

// Layer 3: Database Constraints (Drizzle)
// apps/api/src/db/schema.ts
export const userProfiles = pgTable('user_profiles', {
  userId: uuid('user_id').notNull().unique(),
  firstName: text('first_name').notNull(),
  email: text('email').notNull().unique(),
});
```

**Validation Layers**:

```
┌─────────────────────────────────────────────────────┐
│ Layer 1: Frontend Form Validation (Zod)            │
│ - Client-side UX (instant feedback)                 │
│ - Files: apps/web/src/lib/validations/*.ts         │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│ Layer 2: GraphQL Schema Validation (Pothos)        │
│ - Type enforcement (string, int, boolean)           │
│ - Required/nullable checks                          │
│ - ValidationPlugin for complex rules                │
│ - NO duplicate Zod schemas needed                   │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│ Layer 3: Database Constraints (Drizzle)            │
│ - NOT NULL, UNIQUE, CHECK constraints               │
│ - Foreign key CASCADE                               │
│ - Final enforcement layer                           │
└─────────────────────────────────────────────────────┘
```

**Type-Check Workflow**:

```bash
# Compile-time validation (pre-commit)
npm run validate
  ├─> turbo run type-check  # tsc --noEmit (all workspaces)
  └─> eslint . --ext .ts,.tsx --max-warnings=0

# Checks for:
# - Type mismatches
# - Missing properties
# - Null/undefined access
# - Unused variables
# - Explicit 'any' usage
```

**GraphQL as Source of Truth**:

GraphQL schema mirrors database 1:1 for type unification. See [GraphQL Schema Design Pattern](./data-graphql-schema-design.md) for complete architecture.

GraphQL CodeGen generates TypeScript types used by BOTH GraphQL queries AND Supabase realtime subscriptions:

```typescript
// Auto-generated: apps/web/src/types/graphql.ts
export type Thread = {
  id: string;
  ownerUserId: string;
  branchTitle: string;
  // ... mirrors database schema 1:1
};

// Used in GraphQL queries
const { data } = useQuery<{ thread: Thread }>(ThreadQuery);

// Used in Realtime subscriptions
supabase.channel('threads')
  .on('postgres_changes', (payload) => {
    const thread: Thread = payload.new;  // Same type!
  });
```

**Rules**:
- ✅ DO: Use Zod for frontend form validation (user input UX)
- ✅ DO: Rely on GraphQL type system for API contract validation
- ✅ DO: Enforce constraints at database level (NOT NULL, UNIQUE, FK)
- ✅ DO: Run `npm run validate` before every commit
- ❌ DON'T: Create duplicate Zod schemas for GraphQL types (GraphQL handles it)
- ❌ DON'T: Put validation logic in GraphQL resolvers (use Pothos ValidationPlugin)
- ❌ DON'T: Skip type-check - it catches errors at compile time

**Used in**:
- `apps/web/src/lib/validations/` - Frontend Zod schemas for forms
- `apps/api/src/graphql/builder.ts` - Pothos with ValidationPlugin
- `apps/api/src/graphql/types/*.ts` - GraphQL input types with built-in validation
- `apps/api/src/db/schema.ts` - Database constraints (NOT NULL, UNIQUE, FK)
- `package.json` - `validate` script for pre-commit type-check
