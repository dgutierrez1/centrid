# Team Quick Reference: New Backend Architecture

This guide helps developers quickly understand and work with the new backend architecture.

## 🏗️ Architecture Overview

### **4-Layer Pattern**
```
Edge Function → Controller → Service → Repository → Database
```

- **Edge Function**: Single function handles all routes
- **Controller**: HTTP request/response handling
- **Service**: Business logic (stateless)
- **Repository**: Database operations

## 🚀 Quick Start

### **1. Local Development**
```bash
cd apps/api

# Start local Supabase
supabase start

# Start development servers
npm run dev

# Run tests
node test-comprehensive-api.js
```

### **2. Adding New Routes**

#### **Controller Method** (in `src/controllers/`)
```typescript
export class ResourceController extends ControllerBase {
  async createResource(context: RequestContext, req: Request): Promise<Response> {
    try {
      const body = await this.parseJsonBody(req);

      // Validate input
      if (!body.name) {
        return this.validationErrorResponse('name is required');
      }

      // Call service
      const service = new ResourceService();
      const result = await service.createResource(context, body);

      return this.createdResponse({ data: result });
    } catch (error) {
      return this.withErrorHandling(async () => { throw error; })(context, req);
    }
  }
}
```

#### **Service Method** (in `src/services/`)
```typescript
@RegisterService('resource-name')
export class ResourceService extends BaseService {
  async createResource(context: RequestContext, input: CreateInput) {
    return this.executeOperation(
      context,
      'create_resource',
      async () => {
        const repo = new ResourceRepository();
        const result = await repo.create({
          ...input,
          ownerUserId: context.userId,
        });

        this.logEvent(context, 'Resource created', { resourceId: result.id });
        return result;
      }
    );
  }
}
```

#### **Add Route** (in `functions/api/index.ts`)
```typescript
private setupRoutes(): void {
  // Add route
  this.router.add('POST', '/resources',
    this.controllers.resource.createResource.bind(this.controllers.resource));
}
```

### **3. Common Patterns**

#### **Request Context**
```typescript
// Available in all controllers and services
context.userId        // Authenticated user ID
context.requestId     // Unique request ID
context.logger        // Structured logger
context.startTime     // Request start time
```

#### **Logging**
```typescript
// In services
this.logEvent(context, 'Operation completed', {
  resourceId: resource.id,
  operation: 'create'
});

// In controllers
context.logger.info('Request processed', {
  operation: 'createResource',
  success: true,
  duration: Date.now() - context.startTime
});
```

#### **Error Handling**
```typescript
// Controllers automatically handle errors
return this.withErrorHandling(async () => {
  // Your code here
  throw new Error('Something went wrong');
})(context, req);
```

#### **Repository Pattern**
```typescript
// Create repository instance per operation
const repo = new ResourceRepository();
const result = await repo.findById(id);

// Automatic logging and error handling
```

## 🔧 Available Services

### **ThreadService** (`src/services/thread-service.ts`)
```typescript
const threadService = new ThreadService();
await threadService.createThread(context, {
  branchTitle: 'My Thread',
  creator: 'user'
});
```

### **MessageService** (`src/services/message-service.ts`)
```typescript
const messageService = new MessageService();
await messageService.createMessage(context, {
  threadId: 'thread-id',
  content: 'Hello world',
  role: 'user'
});
```

### **FileService** (`src/services/file-service.ts`)
```typescript
const fileService = new FileService();
await fileService.createFile(context, {
  path: '/path/to/file.txt',
  content: 'File content'
});
```

### **AgentExecutionService** (`src/services/agent-execution-service.ts`)
```typescript
const agentService = new AgentExecutionService();
await agentService.executeAgent(context, {
  type: 'create',
  message: 'User request',
  context: primeContext,
  threadId: 'thread-id'
});
```

### **ToolCallService** (`src/services/tool-call-service.ts`)
```typescript
const toolService = new ToolCallService();
await toolService.executeToolCall(context, {
  toolName: 'write_file',
  parameters: { path: '/test.txt', content: 'test' },
  threadId: 'thread-id',
  messageId: 'message-id',
  agentExecutionId: 'agent-id'
});
```

## 📊 API Endpoints

### **Threads** (6 routes)
- `POST /threads` - Create thread
- `GET /threads` - List threads
- `GET /threads/:id` - Get thread
- `PUT /threads/:id` - Update thread
- `DELETE /threads/:id` - Delete thread
- `GET /threads/search` - Search threads

### **Messages** (8 routes)
- `POST /threads/:threadId/messages` - Create message
- `GET /threads/:threadId/messages` - List thread messages
- `GET /threads/:threadId/messages/search` - Search messages
- `GET /threads/:threadId/messages/stats` - Message statistics
- `GET /messages/:id` - Get message
- `PUT /messages/:id` - Update message
- `DELETE /messages/:id` - Delete message
- `POST /messages/:id/process` - Process with AI

### **Files** (10 routes)
- `POST /files` - Create file
- `GET /files` - List files
- `GET /files/:id` - Get file
- `GET /files/by-path` - Get file by path
- `PUT /files/:id` - Update file
- `DELETE /files/:id` - Delete file
- `GET /files/search` - Search files
- `GET /files/thread/:threadId` - Files by thread
- `GET /files/:id/provenance` - File provenance
- `POST /files/:id/duplicate` - Duplicate file

### **System** (2 routes)
- `GET /` - API information
- `GET /health` - Health check

## 🧪 Testing

### **Run All Tests**
```bash
cd apps/api
node test-comprehensive-api.js
```

### **Test Specific Endpoint**
```bash
# Test thread creation
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"branchTitle":"Test Thread","creator":"user"}' \
  http://localhost:54321/functions/v1/api/threads
```

### **Test Error Handling**
```bash
# Missing required field
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' \
  http://localhost:54321/functions/v1/api/threads
```

## 🔍 Debugging

### **Structured Logs**
All logs appear in Supabase Dashboard → Functions → Logs

**Search by:**
- `requestId:"req_123456"` - Trace specific request
- `userId:"user_789"` - User-specific logs
- `level:"error"` - Error logs only
- `operation:"create_thread"` - Specific operations

### **Common Issues**

#### **Authentication Error**
```bash
# Check JWT token
echo "YOUR_TOKEN" | cut -d. -f2 | base64 -d
```

#### **CORS Issues**
```bash
# Check CORS headers
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     http://localhost:54321/functions/v1/api/test
```

#### **Database Issues**
```bash
# Test database connection
npm run db:push
```

## 📚 Important Files

### **Foundation Layer** (`src/lib/`)
- `logger.ts` - Structured logging system
- `request-context.ts` - Request context management
- `service-interface.ts` - Service base class
- `controller-base.ts` - Controller base class
- `router.ts` - Routing system

### **Documentation**
- `NEW_ARCHITECTURE_README.md` - Architecture overview
- `DEPLOYMENT_GUIDE.md` - Deployment instructions
- `IMPLEMENTATION_COMPLETE.md` - Complete summary

## 🚀 Quick Commands

### **Development**
```bash
npm run dev          # Start development
npm run type-check   # Type checking
node test-comprehensive-api.js  # Run tests
```

### **Deployment**
```bash
npm run deploy:functions  # Deploy all functions
npm run deploy:function api  # Deploy specific function
```

### **Database**
```bash
npm run db:push        # Push schema changes
npm run db:drop         # Reset database
```

## 💡 Tips & Tricks

### **Performance**
- All services are stateless - no stored dependencies
- Database connections are created per operation
- Automatic performance monitoring (>5s warnings)

### **Logging**
- Use structured logs for better searchability
- Include request context for debugging
- All operations are automatically timed

### **Error Handling**
- Controllers automatically handle errors consistently
- Services throw errors with descriptive messages
- Use `this.withErrorHandling()` for error handling

### **Development**
- Follow the established patterns for consistency
- Use TypeScript for type safety
- Write tests for new features
- Check logs in Supabase Dashboard

## 🆘 Getting Help

1. **Check the documentation** in the `apps/api/docs/` folder
2. **Review examples** in existing controllers and services
3. **Check Supabase logs** for debugging
4. **Ask in team channels** for specific issues

**Happy coding!** 🚀