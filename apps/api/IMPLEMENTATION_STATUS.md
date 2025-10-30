# Backend Implementation Status

**Date**: 2025-10-30  
**Status**: Partial Implementation - Core missing

---

## Database Schema

| Table | Status | Notes |
|-------|--------|-------|
| `threads` | ✅ Complete | Repository + Service |
| `messages` | ✅ Complete | Repository + Service |
| `files` | ✅ Complete | Repository + Service |
| `agent_tool_calls` | ✅ Complete | Repository + Service |
| `context_references` | ✅ Complete | Repository + Service |
| `shadow_entities` | ❌ **MISSING** | **Critical - semantic search** |
| `user_profiles` | ⚠️ Legacy | From old MVP, not used by AI system |
| `folders` | ⚠️ Legacy | From old MVP, not used by AI system |
| `documents` | ⚠️ Legacy | From old MVP, not used by AI system |
| `document_chunks` | ⚠️ Legacy | From old MVP, not used by AI system |
| `agent_requests` | ❌ Dead Code | Defined but never used |
| `agent_sessions` | ❌ Dead Code | Defined but never used |
| `usage_events` | ❌ Dead Code | Defined but never used |

---

## Repositories

| Repository | Status | Location |
|------------|--------|----------|
| `ThreadRepository` | ✅ Complete | `src/repositories/thread.ts` |
| `MessageRepository` | ✅ Complete | `src/repositories/message.ts` |
| `FileRepository` | ✅ Complete | `src/repositories/file.ts` |
| `AgentToolCallRepository` | ✅ Complete | `src/repositories/agentToolCall.ts` |
| `ContextReferenceRepository` | ✅ Complete | `src/repositories/contextReference.ts` |
| `ShadowDomainRepository` | ❌ **MISSING** | Should be `src/repositories/shadowDomain.ts` |

---

## Services

| Service | Status | Location | Notes |
|---------|--------|----------|-------|
| `ThreadService` | ✅ Complete | `src/services/threadService.ts` | CRUD + branching |
| `MessageService` | ✅ Complete | `src/services/messageService.ts` | Create + list |
| `FileService` | ✅ Complete | `src/services/fileService.ts` | CRUD + provenance |
| `AgentExecutionService` | ✅ Complete | `src/services/agentExecution.ts` | SSE streaming |
| `ContextAssemblyService` | ✅ Complete | `src/services/contextAssembly.ts` | Prime context |
| `ProvenanceTrackingService` | ✅ Complete | `src/services/provenanceTracking.ts` | File provenance |
| `ToolCallService` | ✅ Complete | `src/services/toolCall.ts` | Tool execution |
| `SearchService` | ⚠️ Basic | `src/services/searchService.ts` | Text search only (no vectors) |
| `AccountService` | ⚠️ Stubs | `src/services/accountService.ts` | TODO stubs for post-MVP |
| `ShadowDomainService` | ❌ **MISSING** | Should be `src/services/shadowDomain.ts` | **Critical** |
| `SemanticSearchService` | ❌ **MISSING** | Should be `src/services/semanticSearch.ts` | **Critical** |

---

## API Routes (Unified API)

| Route | Method | Status | Handler |
|-------|--------|--------|---------|
| `/api/threads` | GET | ✅ | ThreadService.listThreads() |
| `/api/threads` | POST | ✅ | ThreadService.createThread() |
| `/api/threads/:id` | GET | ✅ | ThreadService.getThread() |
| `/api/threads/:id` | PUT | ✅ | ThreadService.updateThread() |
| `/api/threads/:id` | DELETE | ✅ | ThreadService.deleteThread() |
| `/api/threads/:id/children` | GET | ✅ | ThreadService.getChildren() |
| `/api/threads/:threadId/messages` | POST | ✅ | MessageService.createMessage() |
| `/api/threads/:threadId/messages` | GET | ✅ | messageRepository.findByThreadId() |
| `/api/threads/:threadId/messages/:messageId/stream` | GET | ✅ | AgentExecutionService.executeStream() |
| `/api/files` | POST | ✅ | FileService.createFile() |
| `/api/files/:id` | GET | ✅ | FileService.getFile() |
| `/api/files/:id` | PUT | ✅ | FileService.updateFile() |
| `/api/files/:id` | DELETE | ✅ | FileService.deleteFile() |
| `/api/tool-calls/:id` | PATCH | ✅ | AgentExecutionService.approveTool() |
| `/api/search` | POST | ⚠️ | SearchService.search() (text only) |
| `/api/auth/account` | POST | ⚠️ | AccountService.createAccount() (stub) |
| `/api/auth/profile` | PUT | ⚠️ | AccountService.updateProfile() (stub) |
| `/api/auth/account` | DELETE | ⚠️ | AccountService.deleteAccount() (stub) |

---

## Edge Functions (Standalone)

| Function | Status | Notes |
|----------|--------|-------|
| `api` | ✅ Active | Unified API (primary endpoint) |
| `hello` | ⚠️ Test | Should delete |
| `documents` | ⚠️ Orphaned | Old MVP system |
| `folders` | ⚠️ Orphaned | Old MVP system |
| `index-document` | ⚠️ Orphaned | Old MVP system |
| `create-account` | ⚠️ Duplicate | Use `/api/auth/account` instead |
| `update-profile` | ⚠️ Duplicate | Use `/api/auth/profile` instead |
| `delete-account` | ⚠️ Duplicate | Use `/api/auth/account` DELETE instead |

---

## Critical Missing Features

### 1. **Shadow Domain / Semantic Search** ❌

**What's Missing**:
- `shadow_entities` table for embeddings
- `ShadowDomainService` for generating embeddings
- `ShadowDomainRepository` for vector search
- `SemanticSearchService` for hybrid search
- pgvector extension integration

**Impact**:
- No semantic search
- No AI-powered context retrieval
- Search is keyword-only (poor UX)
- Context assembly is incomplete

**Priority**: **P0 - CRITICAL**

### 2. **Orphaned Code** ⚠️

**What's Wrong**:
- 7 orphaned edge functions (old MVP + test)
- 7 orphaned schema tables (old MVP + unused)
- Confusing for developers
- Deploy bloat

**Impact**:
- Developer confusion
- Maintenance burden
- Unclear which system to use

**Priority**: **P1 - High**

---

## Architecture Status

### ✅ What's Working

- **Three-layer architecture**: Routes → Services → Repositories
- **RESTful API**: All routes follow REST conventions
- **Agent execution**: SSE streaming with tool approval
- **File management**: CRUD with provenance tracking
- **Thread branching**: Parent/child relationships
- **Context assembly**: Basic prime context (no semantic layer)
- **Static services**: All services use static methods

### ❌ What's Missing

- **Semantic layer**: No embeddings, no vector search
- **Background jobs**: No shadow domain sync
- **User preferences**: Service not implemented
- **Full context assembly**: Missing semantic domain

### ⚠️ What's Incomplete

- **Search**: Text-only (no vectors)
- **Account management**: Stubs only
- **Schema**: Contains dead code

---

## Next Steps

### Immediate (Phase 1)
1. **Remove dead code** (1h)
   - Delete orphaned edge functions
   - Clean schema tables
   - Update config.toml

### Critical (Phase 2)
2. **Implement shadow domain** (8-12h)
   - Create `shadow_entities` table
   - Build `ShadowDomainRepository`
   - Build `ShadowDomainService`
   - Build `SemanticSearchService`
   - Integrate with `/api/search`

### Polish (Phase 3)
3. **Documentation** (1h)
   - Update architecture docs
   - Document implementation status
   - Create migration guide

---

## Completeness Score

| Component | Score | Status |
|-----------|-------|--------|
| Database Schema | 42% (5/12 active tables) | ⚠️ Needs cleanup |
| Repositories | 83% (5/6 needed) | ⚠️ Missing shadow domain |
| Services | 73% (8/11 needed) | ⚠️ Missing shadow domain |
| API Routes | 100% (18/18 implemented) | ✅ Complete |
| Edge Functions | 8% (1/12 active) | ⚠️ Needs cleanup |
| **Overall** | **61%** | ⚠️ **Incomplete** |

---

**Conclusion**: The RESTful API layer is complete, but the **semantic search foundation** (shadow domain) is completely missing. This is the #1 gap to address.
