---
title: Timestamp Standardization Pattern
summary: ISO 8601 string timestamps across all layers (database, GraphQL, frontend) to eliminate type mismatches and conversion overhead
---

<!-- After editing this file, run: npm run sync-docs -->

# Timestamp Standardization Pattern

**What**: Standardized timestamp handling using ISO 8601 strings across database, GraphQL, and frontend layers

**Why**: Prevents Drizzle type mismatch errors where TypeScript infers `Date` but runtime returns strings, eliminating conversion overhead and type confusion

**How**:

```typescript
// 1. Drizzle Schema - Explicit mode: 'string'
export const threads = pgTable('threads', {
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
});

// 2. Repositories - Use .toISOString()
export async function createMessage(data: CreateMessageInput) {
  const [message] = await db.insert(messages).values({
    ...data,
    timestamp: new Date().toISOString(), // ✅ ISO string
  }).returning();
  return message;
}

// 3. GraphQL Scalar - String pass-through
builder.scalarType("DateTime", {
  serialize: (value: string) => {
    if (typeof value === "string") return value;
    throw new Error("DateTime must be an ISO string from database");
  },
  parseValue: (value) => {
    if (typeof value === "string") return value;
    throw new Error("DateTime input must be an ISO string");
  },
});

// 4. GraphQL Resolvers - No conversion wrappers
const ThreadType = builder.objectRef<Thread>('Thread').implement({
  fields: (t) => ({
    createdAt: t.field({
      type: 'DateTime',
      resolve: (thread) => thread.createdAt, // ✅ Return string directly
    }),
  }),
});

// 5. Frontend State - String types
export interface Thread {
  id: string;
  createdAt: string; // ✅ ISO string
  updatedAt: string;
}

// 6. UI Display - Convert only when rendering
function ThreadList({ threads }: { threads: Thread[] }) {
  return (
    <div>
      {threads.map(thread => (
        <div key={thread.id}>
          {new Date(thread.createdAt).toLocaleString()} // ✅ Convert for display
        </div>
      ))}
    </div>
  );
}
```

**Rules**:
- ✅ DO: Use `mode: 'string'` on all `timestamp()` columns in Drizzle schema
- ✅ DO: Use `.toISOString()` when setting timestamp values in repositories/services
- ✅ DO: Store ISO strings in frontend state (Valtio, React state)
- ✅ DO: Convert to Date only in UI display layer (`new Date(isoString).toLocaleString()`)
- ❌ DON'T: Use `new Date()` objects in repositories/services (causes Drizzle type errors)
- ❌ DON'T: Add Date conversion wrappers in GraphQL resolvers (unnecessary overhead)
- ❌ DON'T: Store Date objects in frontend state (complicates serialization)

**Used in**:
- `apps/api/src/db/schema.ts` - All 26 timestamp column definitions with `mode: 'string'`
- `apps/api/src/repositories/*.ts` - 7 repository files using `.toISOString()`
- `apps/api/src/services/agentExecution.ts` - Agent request lifecycle timestamps
- `apps/api/src/graphql/builder.ts` - DateTime scalar as string pass-through
- `apps/api/src/graphql/types/*.ts` - 4 resolver files without Date wrappers
- `apps/web/src/lib/state/aiAgentState.ts` - Thread, Message, ContextReference with string timestamps
- `apps/web/src/lib/state/fileMetadata.ts` - File metadata with ISO string tracking
- `apps/web/src/lib/hooks/useLoadThread.ts` - GraphQL data transformation without Date conversion
- `apps/web/src/lib/hooks/useLoadThreads.ts` - Thread list loading without Date conversion
