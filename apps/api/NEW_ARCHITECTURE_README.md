# New Backend Architecture: Stateless Controllers & Structured Logging

This document outlines the new unified backend architecture implemented for Centrid's API.

## 🎯 Architecture Overview

The new architecture follows a **4-layer pattern**:

```
Edge Function → Controller → Service → Repository → Database
```

### Key Improvements

1. **Stateless Services** - No stored dependencies, better for serverless
2. **Controller Pattern** - Single Edge Function handles multiple routes
3. **Structured Logging** - Optimized for Supabase UI visibility
4. **Dependency Injection** - Clean separation of concerns
5. **Consistent Error Handling** - Standardized responses

## 🏗️ Architecture Components

### 1. Edge Function Base (`EdgeFunctionBase`)

**Location:** `apps/api/src/lib/edge-function-base.ts`

**Purpose:** Base class for all Edge Functions providing:
- Authentication and context creation
- CORS handling
- Error handling and logging
- Response formatting

```typescript
export class ApiFunction extends EdgeFunctionBase {
  protected async handle(context: RequestContext, req: Request): Promise<Response> {
    // Your function logic here
  }
}
```

### 2. Request Context (`RequestContext`)

**Location:** `apps/api/src/lib/request-context.ts`

**Purpose:** Provides unified access to:
- User authentication (`userId`, `userEmail`)
- Request correlation (`requestId`)
- Structured logging (`logger`)
- Performance tracking (`startTime`)

### 3. Controller Layer (`ControllerBase`)

**Location:** `apps/api/src/lib/controller-base.ts`

**Purpose:** HTTP request handling with:
- Route parameter extraction
- Request body parsing
- Response formatting
- Input validation

**Example:**
```typescript
export class ThreadController extends ControllerBase {
  async createThread(context: RequestContext, req: Request): Promise<Response> {
    const body = await this.parseJsonBody(req);
    const thread = await this.threadService.createThread(context, body);
    return this.createdResponse({ data: thread });
  }
}
```

### 4. Service Layer (`BaseService`)

**Location:** `apps/api/src/lib/service-interface.ts`

**Purpose:** Business logic with:
- Stateless operations (no stored dependencies)
- Performance monitoring
- Consistent error handling
- Request context propagation

**Example:**
```typescript
@RegisterService('thread')
export class ThreadService extends BaseService {
  async createThread(context: RequestContext, input: CreateThreadInput) {
    return this.executeOperation(
      context,
      'create_thread',
      async () => {
        // Business logic here
      }
    );
  }
}
```

### 5. Repository Layer (`BaseRepository`)

**Location:** `apps/api/src/lib/repository-base.ts`

**Purpose:** Data access with:
- Consistent database operations
- Automatic performance logging
- Error handling and context
- Type-safe Drizzle ORM usage

**Example:**
```typescript
export class ThreadRepository extends BaseRepository {
  async create(input: CreateThreadInput) {
    return this.execute('create_thread', (db) => {
      return db.insert(threads).values(input).returning();
    });
  }
}
```

## 🚦 Router System

**Location:** `apps/api/src/lib/router.ts`

### Features

- **Route Matching:** Support for path parameters (`/threads/:id`)
- **Middleware Chain:** Global and route-specific middleware
- **HTTP Method Support:** GET, POST, PUT, DELETE, PATCH, OPTIONS
- **CORS Handling:** Automatic preflight responses

### Example Usage

```typescript
const router = new Router();

// Add routes
router.add('GET', '/threads', threadController.listThreads.bind(threadController));
router.add('POST', '/threads', threadController.createThread.bind(threadController));
router.add('GET', '/threads/:id', threadController.getThread.bind(threadController));

// Add middleware
router.use(CommonMiddleware.requestLogger());
router.use(CommonMiddleware.rateLimit(100, 60 * 1000));

// Match requests
const route = router.match(req.method, req.url);
```

## 📊 Structured Logging

### Log Format for Supabase UI

All logs are structured JSON objects that appear properly formatted in the Supabase dashboard:

```json
{
  "level": "info",
  "message": "Thread created successfully",
  "requestId": "req_123456",
  "userId": "user_789",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "operation": "create_thread",
  "duration_ms": 234,
  "threadId": "thread_456",
  "component": "ThreadController"
}
```

### Performance Monitoring

Automatic performance tracking with warnings for slow operations:

```typescript
const timer = new PerformanceTimer(logger, 'create_thread');
// ... operation
timer.end({ threadId: thread.id });
```

### Log Levels

- **info:** General information and successful operations
- **warn:** Warning conditions (slow operations, validation failures)
- **error:** Error conditions with stack traces
- **debug:** Detailed debugging information

## 🔗 Consolidated API Function

**Location:** `apps/api/src/functions/api/index.ts`

### Routes Handled

- `GET /` - API information and available routes
- `GET /health` - Health check endpoint
- `GET /threads` - List threads for authenticated user
- `POST /threads` - Create a new thread
- `GET /threads/:id` - Get a specific thread
- `PUT /threads/:id` - Update a thread
- `DELETE /threads/:id` - Delete a thread
- `GET /threads/search` - Search threads

### Benefits

1. **Cost Efficiency** - Single Edge Function instead of multiple
2. **Better Organization** - All related routes in one place
3. **Consistent Patterns** - Same authentication, logging, and error handling
4. **Easy Maintenance** - Single place to update common functionality

## 📝 Migration Guide

### For New Routes

1. **Create Controller Method:**
   ```typescript
   async newRoute(context: RequestContext, req: Request): Promise<Response> {
     // Handle the route
   }
   ```

2. **Register Route:**
   ```typescript
   router.add('GET', '/new-route', controller.newRoute.bind(controller));
   ```

3. **Add Service Logic:**
   ```typescript
   async newOperation(context: RequestContext, input: any) {
     return this.executeOperation(context, 'new_operation', async () => {
       // Business logic
     });
   }
   ```

### For Existing Functions

1. **Convert to Controller:** Extract logic into controller method
2. **Update Route Registration:** Add to router instead of separate function
3. **Migrate Service Logic:** Convert to stateless pattern
4. **Update Repository:** Use BaseRepository if not already

## 🧪 Testing

### Test Script

Run the comprehensive test suite:

```bash
cd apps/api
deno run --allow-net test-new-architecture.js
```

### Test Coverage

- ✅ Route matching and parameter extraction
- ✅ Authentication and authorization
- ✅ Request validation and error handling
- ✅ CORS headers and preflight requests
- ✅ Structured logging format
- ✅ Performance monitoring
- ✅ Response formatting

### Manual Testing

1. **Health Check:**
   ```bash
   curl http://localhost:54321/functions/v1/api/health
   ```

2. **API Info:**
   ```bash
   curl http://localhost:54321/functions/v1/api/
   ```

3. **With Authentication:**
   ```bash
   curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
        http://localhost:54321/functions/v1/api/threads
   ```

## 🚀 Deployment

### Local Development

1. **Start Supabase:**
   ```bash
   cd apps/api
   supabase start
   ```

2. **Deploy Functions:**
   ```bash
   npm run deploy:functions
   ```

### Production Deployment

The new architecture is production-ready with:

- ✅ Proper error handling and logging
- ✅ Performance monitoring
- ✅ Rate limiting and security
- ✅ CORS support
- ✅ Type safety throughout

## 🔧 Configuration

### Supabase Config

The new API function is already configured in `supabase/config.toml`:

```toml
[functions.api]
entrypoint = '../src/functions/api/index.ts'
import_map = '../import_map.json'
```

### Environment Variables

Required environment variables (already set in most deployments):

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for auth
- `DATABASE_URL` - Database connection string

## 📈 Performance Benefits

1. **Reduced Cold Starts** - Fewer Edge Functions to initialize
2. **Better Resource Usage** - Shared resources across routes
3. **Consistent Performance** - Standardized patterns reduce variability
4. **Improved Observability** - Structured logging for monitoring

## 🛡️ Security Features

1. **Authentication** - JWT token validation on all routes
2. **Authorization** - User-based access control
3. **Rate Limiting** - Prevent abuse and control costs
4. **Input Validation** - Comprehensive request validation
5. **CORS Support** - Proper cross-origin request handling

## 🔄 Next Steps

1. **Complete Migration:** Convert remaining services to stateless pattern
2. **Add Controllers:** Create controllers for other resource types
3. **Enhanced Testing:** Add comprehensive integration tests
4. **Performance Monitoring:** Add metrics collection
5. **Documentation:** Generate API documentation from routes

## 📞 Support

If you encounter issues with the new architecture:

1. Check the test script output for common problems
2. Review Supabase Edge Function logs for detailed error information
3. Ensure all environment variables are properly configured
4. Verify database connections and permissions

The new architecture is designed to be more maintainable, testable, and performant while preserving all existing functionality.