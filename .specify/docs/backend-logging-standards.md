# Backend Logging Standards

**Pattern**: Structured logging with AsyncLocalStorage for automatic request correlation

**What**: Industry-standard logging pattern using AsyncLocalStorage to inject request context (requestId, userId, path, method) into all log entries without manual parameter passing.

**Why**: Enables request correlation across 4-layer architecture (Resolvers → Controllers → Services → Repositories) without polluting function signatures. Based on OpenTelemetry pattern used by DataDog, Sentry, and New Relic.

---

## Quick Reference

| Layer | What to Log | Level | Example |
|-------|-------------|-------|---------|
| **Resolver** | Let formatError plugin handle errors | - | Don't log manually |
| **Service** | Operation start, validation failures, success | info/warn | `logger.info('Creating thread')` |
| **Repository** | Database errors only | error | `logger.error('Insert failed', { error })` |
| **Middleware** | Request/response, unhandled errors | info/error | Auto via formatError |

---

## Core Concept: AsyncLocalStorage

**Problem**: How do you pass `requestId` and `userId` to deeply nested functions without adding parameters everywhere?

**Solution**: AsyncLocalStorage acts as "thread-local storage" for async operations.

```typescript
// Middleware sets context ONCE
setRequestContext({ requestId, userId, path, method });

// Every logger automatically has access (no parameters needed!)
const logger = createLogger('ThreadService');
logger.info('Creating thread'); // Auto-includes requestId, userId, path, method
```

**Benefits**:
- ✅ No parameter passing through 4 layers
- ✅ Automatic request correlation (filter logs by requestId)
- ✅ Clean function signatures
- ✅ Industry standard (OpenTelemetry, DataDog, Sentry)

**Performance**: 7-10% overhead (acceptable for production)

---

## Architecture

### 1. AsyncLocalStorage Setup (Middleware)

**File**: `apps/api/src/functions/api/middleware/logging.ts`

```typescript
import { createLogger, setRequestContext } from '../../../utils/logger.js';

const logger = createLogger('middleware/request');

export const requestLogger = async (c: Context, next: Next) => {
  const requestId = crypto.randomUUID();
  const userId = c.get('userId') || undefined;

  // Set AsyncLocalStorage context for ALL child loggers
  setRequestContext({
    requestId,
    userId,
    path: c.req.path,
    method: c.req.method,
  });

  logger.info('Request received', {
    userAgent: c.req.header('user-agent'),
  });

  await next();
};
```

**Critical**: Run `requestLogger` middleware AFTER auth middleware to include `userId`.

---

### 2. GraphQL Error Handler (Centralized)

**File**: `apps/api/src/functions/api/routes/graphql.ts`

```typescript
import { createLogger, setRequestContext } from '../../../utils/logger.js';

const logger = createLogger('graphql/server');

const yoga = createYoga({
  schema,
  context: async ({ request }) => {
    const requestId = c.get('requestId');
    const userId = c.get('userId');

    // Update AsyncLocalStorage with userId (now available after auth)
    if (userId) {
      setRequestContext({
        requestId,
        userId,
        path: '/api/graphql',
        method: request.method,
      });
    }

    return { userId, requestId };
  },
  formatError: (error, context) => {
    // Centralized error logging for ALL GraphQL operations
    logger.error('GraphQL operation failed', {
      error: {
        message: error.message,
        path: error.path,
        extensions: error.extensions,
      },
      operation: context?.operationName,
      variableKeys: context?.variables ? Object.keys(context.variables) : [],
    });

    return error;
  },
  maskedErrors: false,
});
```

**Why**: Catches ALL GraphQL errors automatically. No need to log in resolvers.

---

### 3. Service Layer Logging

**File**: `apps/api/src/services/threadService.ts`

```typescript
import { createLogger } from '../utils/logger.js';

const logger = createLogger('ThreadService');

export class ThreadService {
  static async createThread(input: CreateThreadInput): Promise<any> {
    // Log operation start
    logger.info('Creating thread', {
      title: input.title,
      parentThreadId: input.parentThreadId || null,
      isRootThread: !input.parentThreadId,
    });

    // Log validation failures
    if (input.parentThreadId) {
      const parent = await threadRepository.findById(input.parentThreadId);
      if (!parent) {
        logger.warn('Parent thread not found', { parentThreadId: input.parentThreadId });
        throw new Error('Parent thread not found');
      }
      if (parent.ownerUserId !== input.userId) {
        logger.warn('Access denied to parent thread', {
          parentThreadId: input.parentThreadId,
          parentOwnerId: parent.ownerUserId,
          requestUserId: input.userId,
        });
        throw new Error('Access denied to parent thread');
      }
    }

    const thread = await threadRepository.create({...});

    // Log success
    logger.info('Thread created successfully', { threadId: thread.id });

    return thread;
  }
}
```

**When to Log (Service Layer)**:
- ✅ **info**: Operation start, success
- ✅ **warn**: Business validation failures (not found, access denied)
- ✅ **error**: Unexpected errors before re-throwing
- ❌ **DON'T**: Log normal data retrieval (too noisy)

---

### 4. Repository Layer Logging

**File**: `apps/api/src/repositories/thread.ts`

```typescript
import { createLogger } from '../utils/logger.js';

const logger = createLogger('repositories/thread');

export class ThreadRepository {
  async create(input: CreateThreadInput) {
    const { db, cleanup } = await getDB();
    try {
      const [thread] = await db
        .insert(threads)
        .values(values)
        .returning();
      return thread; // ❌ DON'T log success (too noisy)
    } catch (error) {
      // ✅ DO log database errors
      logger.error('Database insert failed', {
        error,
        input: {
          id: input.id,
          parentThreadId: input.parentThreadId,
          branchTitle: input.branchTitle,
        },
      });
      throw error;
    } finally {
      await cleanup();
    }
  }
}
```

**When to Log (Repository Layer)**:
- ✅ **error**: Database errors (constraint violations, connection failures)
- ✅ **warn**: Slow queries (if implementing performance monitoring)
- ❌ **DON'T**: Log normal CRUD operations (too noisy)

---

### 5. Resolver Layer Logging

**File**: `apps/api/src/graphql/types/thread.ts`

```typescript
// ❌ DON'T manually log in resolvers - formatError plugin handles it

builder.mutationField("createThread", (t) =>
  t.field({
    type: ThreadType,
    args: { input: t.arg({ type: CreateThreadInput, required: true }) },
    resolve: async (parent, args, context) => {
      // Just call service - errors automatically logged by formatError plugin
      return await ThreadService.createThread({
        userId: context.userId,
        title: args.input.branchTitle,
        parentThreadId: args.input.parentThreadId,
      });
    },
  })
);
```

**Why No Logging in Resolvers**:
- GraphQL `formatError` plugin logs ALL errors automatically
- Service layer already logs business logic
- Resolvers are thin - just route to services

---

## Log Output Examples

### Without AsyncLocalStorage (Old Pattern)

```json
{"level":"error","module":"ThreadService","message":"Parent thread not found"}
```

**Problem**: Can't correlate with HTTP request or user.

### With AsyncLocalStorage (New Pattern)

```json
{
  "level": "error",
  "module": "ThreadService",
  "message": "Parent thread not found",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "9f2bc5bf-6da1-49e2-bedb-c67039b5bf15",
  "path": "/api/graphql",
  "method": "POST",
  "timestamp": "2025-11-15T17:23:59.416Z"
}
```

**Benefit**: Query logs by `requestId` to see entire request flow.

---

## Debugging with Request Correlation

**Query logs by requestId**:
```bash
npm run logs -- --requestId="550e8400-e29b-41d4-a716-446655440000"
```

**Output shows entire request flow**:
```
[INFO]  middleware/request: Request received
[INFO]  graphql/server: GraphQL operation completed (operationName: CreateThread)
[INFO]  ThreadService: Creating thread (parentThreadId: 989ca1a8-...)
[WARN]  ThreadService: Parent thread not found (parentThreadId: 989ca1a8-...)
[ERROR] graphql/server: GraphQL operation failed (operation: CreateThread)
```

---

## When to Use Each Log Level

| Level | When | Example |
|-------|------|---------|
| **debug** | Development-only detailed traces | `logger.debug('Query params', { params })` |
| **info** | Normal operations (start, success) | `logger.info('Thread created', { threadId })` |
| **warn** | Recoverable issues, validation failures | `logger.warn('Parent not found', { parentThreadId })` |
| **error** | Unrecoverable errors, exceptions | `logger.error('DB insert failed', { error })` |

---

## Common Mistakes to Avoid

### ❌ DON'T: Log in resolvers
```typescript
// BAD - formatError plugin already logs this
resolve: async (parent, args, context) => {
  try {
    return await service.createThread(args);
  } catch (error) {
    logger.error('Failed', { error }); // ❌ Duplicate logging
    throw error;
  }
}
```

### ✅ DO: Let formatError handle resolver errors
```typescript
// GOOD - formatError plugin logs automatically
resolve: async (parent, args, context) => {
  return await service.createThread(args);
}
```

### ❌ DON'T: Log normal repository operations
```typescript
// BAD - Too noisy
async findById(id: string) {
  logger.info('Finding thread', { id }); // ❌ Don't log reads
  return await db.select()...
}
```

### ✅ DO: Only log repository errors
```typescript
// GOOD - Only log failures
async findById(id: string) {
  try {
    return await db.select()...
  } catch (error) {
    logger.error('DB query failed', { error, id }); // ✅ Log errors
    throw error;
  }
}
```

### ❌ DON'T: Use raw console.log
```typescript
// BAD - No structure, no context
console.log('[Service] Creating thread'); // ❌ Avoid
```

### ✅ DO: Use structured logger
```typescript
// GOOD - Structured + auto-context
logger.info('Creating thread', { title, parentThreadId }); // ✅ Always
```

---

## Testing Logging

### Unit Tests
```typescript
import { withRequestContext } from '../utils/logger.js';

it('logs thread creation', async () => {
  await withRequestContext(
    { requestId: 'test-123', userId: 'user-123' },
    async () => {
      await ThreadService.createThread({ title: 'Test' });
      // Logs will include requestId: 'test-123'
    }
  );
});
```

### Integration Tests
```typescript
// Request middleware sets context automatically
const response = await fetch('/api/graphql', {
  method: 'POST',
  headers: { Authorization: 'Bearer token' },
  body: JSON.stringify({ query: '...' }),
});

// Check logs contain requestId from response headers
expect(logs).toContainEqual(
  expect.objectContaining({
    requestId: response.headers.get('x-request-id'),
    operation: 'CreateThread',
  })
);
```

---

## Migration Checklist

Updating old code to use new logging pattern:

- [ ] Import logger: `import { createLogger } from '../utils/logger.js'`
- [ ] Create logger instance: `const logger = createLogger('ModuleName')`
- [ ] Replace `console.log` → `logger.info`
- [ ] Replace `console.error` → `logger.error`
- [ ] Replace `console.warn` → `logger.warn`
- [ ] Remove manual requestId/userId passing (auto-injected)
- [ ] Add error logging in try-catch blocks (repositories)
- [ ] Remove resolver-level error logging (use formatError plugin)

---

## Related Patterns

- **GraphQL Backend Architecture** (`.specify/docs/backend-graphql-architecture.md`) - Four-layer separation
- **Remote Debugging Tools** (`.specify/docs/backend-remote-debugging-tools.md`) - Query logs by requestId
- **Environment Configuration** (`.specify/docs/devops-environment-configuration.md`) - Log levels per environment

---

## References

**Industry Standards**:
- [OpenTelemetry Context Propagation](https://opentelemetry.io/docs/concepts/context-propagation/) - Uses AsyncLocalStorage
- [DataDog APM](https://docs.datadoghq.com/tracing/trace_collection/automatic_instrumentation/dd_libraries/nodejs/) - AsyncLocalStorage for trace correlation
- [Sentry Node SDK](https://docs.sentry.io/platforms/node/) - AsyncLocalStorage for error context

**Performance**:
- AsyncLocalStorage overhead: 7-10% (acceptable for production)
- Node.js v24+ has significant performance improvements
