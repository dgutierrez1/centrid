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

// 2. Postgres Driver Configuration (REQUIRED for Deno/Edge Functions)
// Note: mode: 'string' alone doesn't work in Deno - driver returns Date objects
// Solution: Add custom type parser to postgres driver config
const DB_CONFIG = {
  max: 5,
  prepare: false,
  types: {
    date: {
      to: 1184, // Use TIMESTAMPTZ as target type OID
      from: [1082, 1114, 1184], // Handle DATE, TIMESTAMP, TIMESTAMPTZ (all date types)
      serialize: (x: any) => (x instanceof Date ? x.toISOString() : x),
      parse: (x: any) => x, // Return as string instead of Date object
    },
  },
};

// 3. Repositories - Use .toISOString() when setting timestamps
export async function createMessage(data: CreateMessageInput) {
  const [message] = await db.insert(messages).values({
    ...data,
    timestamp: new Date().toISOString(), // ✅ ISO string
  }).returning();
  return message;
}

// 4. GraphQL Scalar - String pass-through (driver already converted)
builder.scalarType("DateTime", {
  serialize: (value: string | null) => {
    if (value === null || value === undefined) return null;
    if (typeof value === "string") return value;
    // Fallback for Date objects (shouldn't happen with driver transform)
    if (value instanceof Date) return value.toISOString();
    throw new Error("DateTime must be an ISO string from database");
  },
  parseValue: (value) => {
    if (typeof value === "string") return value;
    throw new Error("DateTime input must be an ISO string");
  },
});

// 5. GraphQL Resolvers - No conversion needed (already strings)
const ThreadType = builder.objectRef<Thread>('Thread').implement({
  fields: (t) => ({
    createdAt: t.field({
      type: 'DateTime',
      resolve: (thread) => thread.createdAt, // ✅ Already ISO string from driver
    }),
  }),
});

// 6. Frontend State - String types
export interface Thread {
  id: string;
  createdAt: string; // ✅ ISO string
  updatedAt: string;
}

// 7. UI Display - Convert only when rendering
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
- ✅ DO: Configure postgres driver `transform` to convert Date → ISO string (REQUIRED for Deno)
- ✅ DO: Use `.toISOString()` when setting timestamp values in repositories/services
- ✅ DO: Store ISO strings in frontend state (Valtio, React state)
- ✅ DO: Convert to Date only in UI display layer (`new Date(isoString).toLocaleString()`)
- ❌ DON'T: Rely on `mode: 'string'` alone in Deno (driver returns Date objects without transform)
- ❌ DON'T: Use `new Date()` objects in repositories/services (causes type inconsistency)
- ❌ DON'T: Add Date conversion wrappers in GraphQL resolvers (driver transform handles it)
- ❌ DON'T: Store Date objects in frontend state (complicates serialization)

**Used in**:
- `apps/api/src/db/schema.ts` - All 26 timestamp column definitions with `mode: 'string'`
- `apps/api/src/functions/_shared/db.ts` - Postgres driver with timestamp transform (Date → ISO string)
- `apps/api/src/repositories/*.ts` - 7 repository files using `.toISOString()`
- `apps/api/src/services/agentExecution.ts` - Agent request lifecycle timestamps
- `apps/api/src/graphql/builder.ts` - DateTime scalar as string pass-through with fallback
- `apps/api/src/graphql/types/*.ts` - 4 resolver files without Date wrappers
- `apps/web/src/lib/state/aiAgentState.ts` - Thread, Message, ContextReference with string timestamps
- `apps/web/src/lib/state/fileMetadata.ts` - File metadata with ISO string tracking
- `apps/web/src/lib/hooks/useLoadThread.ts` - GraphQL data transformation without Date conversion
- `apps/web/src/lib/hooks/useLoadThreads.ts` - Thread list loading without Date conversion
