# Backend Gaps Report - Comprehensive Analysis

**Date**: 2025-10-30  
**Status**: CRITICAL GAPS FOUND  
**Severity**: High - Core semantic search system missing

---

## 🚨 CRITICAL GAPS

### **Gap 1: Shadow Domain System - COMPLETELY MISSING**

The spec extensively documents a "shadow domain" semantic layer, but **NONE** of it is implemented.

#### Missing Components:

**Database**:
- ❌ `shadow_entities` table (unified semantic layer)
- ❌ No embeddings storage (should use pgvector)
- ❌ No entity_type enum

**Services**:
- ❌ `ShadowDomainService` - Generate embeddings, summaries, structure metadata
- ❌ `SemanticSearchService` - Hybrid semantic search with pgvector

**Repositories**:
- ❌ `ShadowDomainRepository` - CRUD for shadow entities

**Edge Functions**:
- ❌ `POST /shadow-domain/sync` - Generate embeddings (background job)
- ❌ `POST /shadow-domain/search` - Semantic search (pgvector cosine similarity)

**Current State**:
- ✅ Basic `SearchService` exists (text search only)
- ✅ `/api/search` endpoint exists (calls SearchService)
- ❌ NO vector embeddings
- ❌ NO pgvector integration
- ❌ NO semantic search

**Impact**: 
- Users cannot perform semantic search
- No AI-powered context retrieval
- File search is keyword-only (poor UX)

**References**:
- `specs/004-ai-agent-system/spec.md` - FR-010a to FR-010f
- `specs/004-ai-agent-system/arch.md` - Shadow domain section
- `specs/004-ai-agent-system/plan.md` - Decision 1: Shadow Domain

---

### **Gap 2: Orphaned Edge Functions**

These edge functions exist but are **NOT connected** to the unified API:

#### ❌ Old Document System (MVP v1)
- `src/functions/documents/index.ts` - CRUD for `documents` table
- `src/functions/folders/index.ts` - CRUD for `folders` table
- `src/functions/index-document/index.ts` - Background indexing for `document_chunks`

**Issue**: 
- These use the OLD document management system
- NOT used by AI agent system (uses `files` table instead)
- Still declared in `supabase/config.toml`

**Action Needed**: 
- ❌ DELETE or document as deprecated
- ❌ Remove from config.toml

#### ❌ Account Management (Standalone)
- `src/functions/create-account/index.ts`
- `src/functions/update-profile/index.ts`
- `src/functions/delete-account/index.ts`

**Issue**:
- Duplicate functionality with `/api/auth/*` routes
- NOT integrated with unified API
- Still declared in config.toml

**Action Needed**:
- ❌ DELETE standalone functions
- ✅ Keep `/api/auth/*` routes (already using AccountService)

#### ❌ Test Function
- `src/functions/hello/index.ts`

**Action Needed**:
- ❌ DELETE or move to `/tests`

---

### **Gap 3: Orphaned Schema Tables**

These tables exist in `schema.ts` but have **NO repositories or services**:

#### Old MVP v1 System (NOT USED)
- ❌ `user_profiles` - Used by old account functions
- ❌ `folders` - Used by old folders function
- ❌ `documents` - Used by old documents function
- ❌ `document_chunks` - Used by old index-document function

**Issue**: 
- Part of OLD document management system
- AI agent system uses `files` table (not `documents`)
- These tables clutter the schema

**Action Needed**:
- ❌ REMOVE from schema OR
- ⚠️ DOCUMENT as deprecated/legacy

#### Never Implemented
- ❌ `agent_requests` - Defined in schema, **NEVER USED**
- ❌ `agent_sessions` - Defined in schema, **NEVER USED**
- ❌ `usage_events` - Defined in schema, **NEVER USED**

**Issue**:
- Dead code in schema
- No repositories, no services, no edge functions
- Confusing for developers

**Action Needed**:
- ❌ REMOVE from schema (not needed for MVP)

---

### **Gap 4: Missing Services (Per Spec)**

According to `specs/004-ai-agent-system/arch.md`, these services should exist:

#### High Priority
- ❌ **ShadowDomainService** - Generate embeddings + summaries for entities
  - Location: `apps/api/src/services/shadowDomain.ts`
  - Methods: `generateForFile()`, `generateForThread()`, `updateWhenChanged()`
  - Status: **NOT IMPLEMENTED**

- ❌ **SemanticSearchService** - Hybrid semantic search (pgvector + modifiers)
  - Location: `apps/api/src/services/semanticSearch.ts`
  - Methods: `search()`, `applyRelationshipModifiers()`, `applyTemporalDecay()`
  - Status: **NOT IMPLEMENTED** (we have basic SearchService instead)

#### Medium Priority
- ❌ **UserPreferencesService** - Derive user preferences from interactions
  - Location: `apps/api/src/services/userPreferences.ts`
  - Status: **NOT IMPLEMENTED**

- ⚠️ **ConsolidationService** - Branch consolidation logic
  - Location: Not clear if needed (might be in ThreadService)
  - Status: **UNCLEAR**

#### Already Implemented ✅
- ✅ `AgentExecutionService` - Exists
- ✅ `ContextAssemblyService` - Exists
- ✅ `MessageService` - Exists
- ✅ `ThreadService` - Exists
- ✅ `FileService` - Exists
- ✅ `ProvenanceTrackingService` - Exists
- ✅ `ToolCallService` - Exists

---

### **Gap 5: Missing Repositories**

#### Critical
- ❌ **ShadowDomainRepository** - CRUD for shadow_entities table
  - Location: `apps/api/src/repositories/shadowDomain.ts`
  - Status: **NOT IMPLEMENTED** (table doesn't exist)

#### Medium Priority
- ❌ **UserPreferencesRepository** - If user preferences are persisted
  - Status: **UNCLEAR if needed**

#### Already Implemented ✅
- ✅ `ThreadRepository` - Exists
- ✅ `MessageRepository` - Exists
- ✅ `FileRepository` - Exists
- ✅ `AgentToolCallRepository` - Exists
- ✅ `ContextReferenceRepository` - Exists

---

## 📊 Gap Summary by Category

| Category | Total | Implemented | Missing | Gap % |
|----------|-------|-------------|---------|-------|
| **Core Tables** | 12 | 5 | 7 | 58% |
| **Repositories** | 7 | 5 | 2 | 29% |
| **Services** | 11 | 7 | 4 | 36% |
| **Edge Functions** | 12 | 5 | 7 | 58% |
| **API Routes** | 6 | 6 | 0 | 0% |

---

## 🎯 Recommended Actions

### **Phase 1: Remove Dead Code (1h)**

1. **Delete Orphaned Edge Functions**:
   ```bash
   rm -rf src/functions/documents
   rm -rf src/functions/folders
   rm -rf src/functions/index-document
   rm -rf src/functions/hello
   rm -rf src/functions/create-account
   rm -rf src/functions/update-account
   rm -rf src/functions/delete-account
   ```

2. **Update config.toml**:
   - Remove function declarations for deleted functions

3. **Clean Schema**:
   - Remove unused tables: `agent_requests`, `agent_sessions`, `usage_events`, `document_chunks`
   - Document deprecated tables: `user_profiles`, `folders`, `documents` (if still used by other parts of app)

### **Phase 2: Implement Shadow Domain (8-12h)** ⚠️ CRITICAL

This is the **#1 priority** - semantic search is a core feature per spec.

#### Step 1: Database Schema (1h)
```sql
-- Create shadow_entities table
CREATE TABLE shadow_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL,
  entity_type text NOT NULL, -- 'file' | 'thread' | 'concept'
  owner_user_id uuid NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-3-small
  summary text,
  structure_metadata jsonb,
  last_updated timestamptz DEFAULT NOW(),
  created_at timestamptz DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_shadow_entities_entity ON shadow_entities(entity_id, entity_type);
CREATE INDEX idx_shadow_entities_owner ON shadow_entities(owner_user_id);
CREATE INDEX idx_shadow_entities_embedding ON shadow_entities 
  USING ivfflat (embedding vector_cosine_ops);
```

#### Step 2: ShadowDomainRepository (2h)
- `create()`
- `findByEntity()`
- `findByOwner()`
- `update()`
- `delete()`
- `search()` - pgvector cosine similarity

#### Step 3: ShadowDomainService (3h)
- `generateForFile()` - Extract text, generate embedding, create summary
- `generateForThread()` - Aggregate messages, generate embedding
- `updateWhenChanged()` - Check >20% diff, regenerate if needed
- `checkChangeThreshold()` - Character diff calculation

#### Step 4: SemanticSearchService (2h)
- `search()` - pgvector query with filters
- `applyRelationshipModifiers()` - +0.10 sibling, +0.15 parent/child
- `applyTemporalDecay()` - Decay by time

#### Step 5: Edge Functions (2h)
- `POST /api/shadow-domain/sync` - Async background job
- Integrate into file/thread creation (fire-and-forget calls)

#### Step 6: Update SearchService (1h)
- Replace basic text search with SemanticSearchService calls
- Keep text search as fallback

### **Phase 3: Documentation (1h)**

1. Update `BACKEND_ARCHITECTURE.md` with:
   - Shadow domain system
   - Service layer complete list
   - Repository layer complete list

2. Update `API_DOCUMENTATION.md` with:
   - `/api/search` implementation details
   - Shadow domain endpoints (if exposed)

---

## 🔍 Verification Checklist

After implementing fixes:

### Dead Code Removal
- [ ] All orphaned edge functions deleted
- [ ] config.toml updated
- [ ] Unused schema tables removed/documented
- [ ] No broken imports

### Shadow Domain
- [ ] `shadow_entities` table created
- [ ] pgvector extension enabled
- [ ] ShadowDomainRepository implemented
- [ ] ShadowDomainService implemented
- [ ] SemanticSearchService implemented
- [ ] `/api/search` uses semantic search
- [ ] Background sync jobs working
- [ ] Tests pass

### Documentation
- [ ] Architecture docs updated
- [ ] API docs updated
- [ ] Service layer documented
- [ ] Repository layer documented

---

## 📈 Timeline Estimate

| Phase | Work | Time |
|-------|------|------|
| Phase 1: Remove Dead Code | Delete orphaned functions + clean schema | 1h |
| Phase 2: Shadow Domain | Full implementation | 8-12h |
| Phase 3: Documentation | Update all docs | 1h |
| **TOTAL** | | **10-14h** |

---

## 🚦 Priority

### Must Fix (P0)
1. **Shadow Domain System** - Core feature, completely missing
2. **Remove Dead Code** - Confusing for developers

### Should Fix (P1)
3. **Documentation** - Clarify what's implemented vs spec

### Nice to Have (P2)
4. **UserPreferencesService** - Can defer to Phase 2

---

## 📝 Notes

- The spec is **very detailed** about shadow domain system
- Current implementation has **basic file system** working
- Shadow domain is for **semantic search / AI context retrieval**
- Without it, context assembly is incomplete
- Current SearchService is a **temporary placeholder**

---

**Conclusion**: While the RESTful refactor is complete, the **shadow domain semantic layer** (the most critical backend feature per spec) is completely missing. This needs to be implemented before the system can provide intelligent context retrieval for the AI agent.
