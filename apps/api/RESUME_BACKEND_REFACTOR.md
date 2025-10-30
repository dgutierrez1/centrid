# Backend Refactor - Resume Here

**Date**: 2025-10-29 | **Status**: Phase 3+ Complete (92%) | **Time Left**: ~1-2h

---

## Why This Refactor?

### Current Problem
We have **10+ scattered Edge Functions** (`thread-messages`, `stream-agent`, `approve-tool`, `documents`, etc.):
- ❌ **Hard to maintain** - Changes require updating multiple functions
- ❌ **Inconsistent patterns** - Each function handles auth/errors differently  
- ❌ **Slow to add features** - New endpoint = new function = lots of boilerplate
- ❌ **Code duplication** - Auth logic, error handling, CORS repeated everywhere
- ❌ **Poor DX** - Scattered code makes it hard to understand the API surface

### The Goal
**Single unified `/api` function** that handles all routes with consistent patterns:
- ✅ **One place to maintain** - All routes in one codebase
- ✅ **Consistent patterns** - Auth, validation, errors handled the same way
- ✅ **Fast to scale** - New endpoint = new route file (5 min vs 1 hour)
- ✅ **Zero duplication** - Shared middleware for auth, logging, CORS
- ✅ **Clear API surface** - All routes visible in one place

### Why Hono Framework?
We planned a "manual approach" (build base classes, router, middleware from scratch). That would take **43 hours**.

**Hono gives us everything built-in**:
- ✅ Express-like API (familiar patterns)
- ✅ Route pattern matching (`/threads/:id`)
- ✅ Middleware system (auth, CORS, logging)
- ✅ Request helpers (`.json()`, `.param()`, `.query()`)
- ✅ SSE streaming support
- ✅ TypeScript-first
- ✅ Battle-tested (used by Cloudflare, Vercel)

**Result**: **12-16 hours** instead of 43 hours = **30 hours saved**

### Why RESTful Patterns?
Previous functions used **verb-based URLs** (`/execute-agent`, `/create-branch`). This is:
- ❌ Non-standard (doesn't follow HTTP semantics)
- ❌ Hard to discover (what endpoints exist?)
- ❌ Inconsistent (some use POST for reads, GET for writes)

**RESTful approach** uses **resource-based URLs** with proper HTTP methods:
- ✅ `/api/threads` (resource) + HTTP method (GET/POST/PUT/DELETE)
- ✅ Standard semantics (GET=read, POST=create, PUT=update, DELETE=remove)
- ✅ Self-documenting structure (`/threads/:id/messages`)
- ✅ Cacheable (browsers/CDNs understand GET vs POST)
- ✅ Industry standard (everyone knows REST)

### Why Stay on Deno (Not Migrate to Node.js)?
**Short answer**: npm packages work in Deno now (since Dec 2023).

- ✅ Free hosting (Supabase Edge Functions)
- ✅ Fast cold starts (<200ms) via V8 isolates
- ✅ npm packages via `npm:` prefix (drizzle-orm, zod, anthropic, etc.)
- ✅ Hono is portable (can migrate to Node.js later if needed)
- ✅ No migration cost (already on Deno)

**If we migrated to Node.js**: Would need separate hosting ($5-20/mo), slower cold starts (500ms-3s), more moving parts.

**Decision**: Stay on Deno, use Hono, leverage npm packages. Get Node.js ecosystem without Node.js overhead.

---

## Quick Context

**Progress**: [███████████████████████████████] 92%
- ✅ Phase 0: Dependencies verified
- ✅ Phase 1: Hono foundation (auth, middleware)
- ✅ Phase 2: 18 routes implemented
- ✅ **Phase 3: Services refactored (static methods)**
- ✅ **Phase 3+: Missing services created** (ThreadService, FileService)
- ⏳ Phase 4: Frontend migration ← START HERE (~1-2h)
- ⏳ Phase 5: Deploy & test (~30min)

---

## What Was Built

### Files Created
```
apps/api/src/functions/api/
├── index.ts                    Main Hono app (150 lines)
├── types.ts                    Shared types
├── middleware/
│   ├── auth.ts                JWT verification
│   ├── errors.ts              Error handler
│   └── logging.ts             Request logger
└── routes/
    ├── threads.ts             6 routes (CRUD + branching)
    ├── messages.ts            2 routes (create + list)
    ├── files.ts               4 routes (CRUD)
    ├── agent.ts               2 routes (SSE stream + approval)
    ├── search.ts              1 stub (TODO)
    └── auth.ts                3 stubs (TODO)
```

### API Endpoints (18 total)
```
Public:
  GET  /                       API docs
  GET  /health                 Health check

Protected (require auth):
  GET    /api/threads          List threads
  POST   /api/threads          Create thread/branch
  GET    /api/threads/:id      Get thread + messages
  PUT    /api/threads/:id      Update thread
  DELETE /api/threads/:id      Delete thread
  GET    /api/threads/:id/children   Get child branches
  
  POST   /api/messages         Create message (triggers AI)
  GET    /api/messages         List messages
  
  POST   /api/files            Create file
  GET    /api/files/:id        Get file
  PUT    /api/files/:id        Update file
  DELETE /api/files/:id        Delete file
  
  GET    /api/agent/stream     SSE streaming
  POST   /api/agent/approve-tool   Approve tool
  
  POST   /api/search           Semantic search (stub)
  POST   /api/auth/account     Create account (stub)
  PUT    /api/auth/profile     Update profile (stub)
  DELETE /api/auth/account     Delete account (stub)
```

### Dependencies Added (deno.json)
```json
"hono": "https://deno.land/x/hono@v3.11.7/mod.ts",
"zod": "npm:zod@3.22.4",
"@anthropic-ai/sdk": "npm:@anthropic-ai/sdk@0.20.0",
"@supabase/supabase-js": "npm:@supabase/supabase-js@2.39.0"
```

---

## ✅ Phase 3+ Complete - Services Layer Fixed

**COMPLETED**: All services are now stateless with proper layering

### What Was Done

**Phase 3a: Made Services Stateless (Static Methods)**
1. **MessageService** - Converted to static methods
2. **AgentExecutionService** - Converted to static methods, added wrapper methods
3. **ToolCallService** - Converted to static methods
4. **ProvenanceTrackingService** - Already stateless (verified)

**Phase 3b: Created Missing Services** (Architecture Fix)
5. **ThreadService** - Created to handle thread CRUD logic (was missing!)
6. **FileService** - Created to handle file CRUD logic (was missing!)

**Phase 3c: Fixed Route Handlers**
7. **routes/threads.ts** - Now uses ThreadService (removed direct repository calls)
8. **routes/files.ts** - Now uses FileService (removed direct repository calls)
9. **routes/messages.ts** - Already using MessageService
10. **All type errors fixed** - Zero service-specific errors

### Service Refactoring Pattern

❌ **BEFORE (Stateful)**:
```typescript
export class MessageService {
  private supabase: any;
  private userId: string;

  constructor(supabase?: any, userId?: string) {
    this.supabase = supabase;
    this.userId = userId;
  }

  async createMessage(input) {
    // Uses this.userId, this.supabase
  }
}
```

✅ **AFTER (Stateless)**:
```typescript
export class MessageService {
  // No constructor

  async createMessage(input: { userId: string, ... }) {
    // All params passed explicitly
    // Use repositories directly
  }
}
```

### Services to Refactor

1. **MessageService** (`src/services/messageService.ts`)
   - Remove `constructor(supabase, userId)`
   - Add `userId` to method params
   - Replace `this.supabase` with repository calls
   - **Time**: ~1h

2. **AgentExecutionService** (`src/services/agentExecution.ts`)
   - Remove stored dependencies
   - Pass context explicitly
   - Update `executeStream()` signature
   - **Time**: ~1.5h

3. **ToolCallService** (`src/services/toolCall.ts`)
   - Remove stored state
   - Pass `userId` as parameter
   - **Time**: ~30min

4. **ProvenanceTrackingService** (`src/services/provenanceTracking.ts`)
   - Verify already stateless
   - Clean up if needed
   - **Time**: ~30min

### How to Refactor (Step by Step)

```bash
# 1. Open service file
code src/services/messageService.ts

# 2. Delete constructor

# 3. For each method:
#    - Add userId: string as first parameter
#    - Replace this.userId with userId parameter
#    - Replace this.supabase with direct repository calls

# 4. Update route handler (already passes userId):
#    routes/messages.ts already does:
#    const messageService = new MessageService();
#    await messageService.createMessage({
#      userId,  // ← already here!
#      threadId,
#      content,
#    });

# 5. Test locally
```

---

## Testing

### Local Testing
```bash
cd apps/api

# Start Supabase
supabase start

# Serve API function
supabase functions serve api --env-file .env.local

# Test (in another terminal)
./test-api-local.sh

# Or manually:
curl http://localhost:54321/functions/v1/api/health
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:54321/functions/v1/api/threads
```

### Environment Variables (.env.local)
```bash
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=your-database-url
```

---

## Architecture Decisions

### 1. Single `/api` Function (Not Multiple)
**Why**: 10+ functions = 10+ cold starts, duplicate code, scattered logic  
**Benefit**: 1 cold start, shared middleware, all routes in one place

### 2. Hono Framework (Not Manual)
**Why**: Manual approach = 43 hours to build base classes, router, middleware  
**Benefit**: Hono gives us everything = 12-16 hours (30 hours saved)

### 3. Stay on Deno (Not Node.js)
**Why**: npm packages work in Deno now, free hosting, fast cold starts  
**Benefit**: Node.js ecosystem without Node.js overhead or cost

### 4. Stateless Services (Phase 3 Goal)
**Why**: Current services store dependencies (bad for serverless)  
**Benefit**: Thread-safe, easier to test, scales better

### 5. RESTful API Design (Resource-Oriented)
**Why**: Previous functions used verb-based URLs (`/execute-agent`, `/create-branch`)  
**Problem**: Hard to discover, doesn't follow HTTP semantics, inconsistent patterns  
**Solution**: RESTful resource-based URLs with proper HTTP methods

**Before** (Verb-based):
```
POST /execute-agent          → Execute AI
POST /create-branch          → Create branch
POST /thread-messages        → Create message
GET  /get-thread-messages    → List messages
```

**After** (RESTful):
```
GET    /api/threads          → List threads
POST   /api/threads          → Create thread/branch
GET    /api/threads/:id      → Get thread
PUT    /api/threads/:id      → Update thread
DELETE /api/threads/:id      → Delete thread

POST   /api/messages         → Create message (triggers AI)
GET    /api/agent/stream     → Stream agent (SSE)
```

**Benefits**:
- ✅ **Predictable** - Standard HTTP semantics (GET=read, POST=create, PUT=update, DELETE=remove)
- ✅ **Self-documenting** - URL structure shows resource relationships
- ✅ **Cacheable** - GET requests can be cached by browsers/CDNs
- ✅ **Idempotent** - PUT/DELETE safe to retry
- ✅ **Industry standard** - Follows REST conventions everyone knows

### 6. Repository Pattern Unchanged
**Why**: Already clean, uses Drizzle ORM well  
**Decision**: Don't touch repositories, only refactor services

---

## Quick Commands

```bash
# Resume work
cd /Users/daniel/Projects/misc/centrid/apps/api

# Check status
git status

# Test current work
supabase start
supabase functions serve api
./test-api-local.sh

# Start Phase 3
code src/services/messageService.ts

# Deploy (when ready)
supabase functions deploy api

# View logs
supabase functions logs api --follow
```

---

## Next: Phase 4 - Frontend Migration

**Goal**: Update frontend to call new unified `/api` endpoints

### What to Do

1. **Update service URLs** (`apps/web/src/lib/services/`):
   ```typescript
   // BEFORE
   fetch('/functions/v1/thread-messages', ...)
   fetch('/functions/v1/stream-agent', ...)
   fetch('/functions/v1/approve-tool', ...)
   
   // AFTER
   fetch('/functions/v1/api/messages?threadId=xxx', ...)
   fetch('/functions/v1/api/agent/stream?threadId=xxx&messageId=xxx', ...)
   fetch('/functions/v1/api/agent/approve-tool', ...)
   ```

2. **Test custom hooks**:
   - `useSendMessage()` - POST `/api/messages`
   - `useLoadThread()` - GET `/api/threads/:id`
   - `useApproveToolCall()` - POST `/api/agent/approve-tool`
   - `useCreateAgentFile()` - POST `/api/files`

3. **Update environment**:
   - No changes needed (same function base path)

**Time**: ~2-3h

### Phase 5: Deploy & Test (~1h)
- Deploy `/api` function to production
- Run smoke tests (health, auth, threads)
- Monitor logs for errors
- Deprecate old functions once stable

---

## Success Criteria

**Phase 3 Complete**:
- [x] All services stateless (no constructor)
- [x] Routes work with refactored services
- [x] Type errors fixed (2 issues resolved)
- [x] No service-specific TypeScript errors

**Overall Complete**:
- [ ] Single `/api` function handles all routes
- [ ] Services stateless
- [ ] Frontend migrated
- [ ] Tests passing
- [ ] Deployed
- [ ] Old functions removed

---

## Files to Keep

**Documentation**:
- This file only

**Testing**:
- `test-npm-compatibility.ts` - Verify dependencies
- `test-api-local.sh` - Local testing script

**Source**:
- `src/functions/api/` - All Hono code
- `deno.json` - Updated dependencies

---

**Last Updated**: 2025-10-29  
**Time Invested**: ~7h  
**Remaining**: ~1-2h  
**Status**: Phase 3+ Complete ✅ → Proper service layer established → Ready for Phase 4
