# Backend Gaps - MVU Implementation Plan

**Date**: 2025-10-30  
**Approach**: Minimum Viable Units (MVUs)  
**Definition**: Each task is the smallest unit of work that produces a verifiable artifact

---

## 📋 Plan Overview

| Phase | Tasks | Est. Time | Priority |
|-------|-------|-----------|----------|
| Phase 1: Dead Code Cleanup | 8 MVUs | 1-2h | P1 |
| Phase 2: Shadow Domain Foundation | 4 MVUs | 2-3h | P0 |
| Phase 3: Repository Layer | 5 MVUs | 2-3h | P0 |
| Phase 4: Service Layer | 6 MVUs | 3-4h | P0 |
| Phase 5: Integration | 5 MVUs | 2-3h | P0 |
| Phase 6: Testing & Docs | 3 MVUs | 1-2h | P1 |
| **TOTAL** | **31 MVUs** | **11-17h** | |

---

## 🗑️ PHASE 1: Dead Code Cleanup (1-2h)

**Goal**: Remove all orphaned code to clarify what's active

### MVU 1.1: Delete Orphaned Document Functions
**Artifact**: `documents/`, `folders/`, `index-document/` directories deleted
**Verification**: Directories no longer exist
```bash
rm -rf src/functions/documents
rm -rf src/functions/folders
rm -rf src/functions/index-document
```
**Time**: 5min

---

### MVU 1.2: Delete Orphaned Account Functions
**Artifact**: `create-account/`, `update-profile/`, `delete-account/` directories deleted
**Verification**: Directories no longer exist
```bash
rm -rf src/functions/create-account
rm -rf src/functions/update-profile
rm -rf src/functions/delete-account
```
**Time**: 5min

---

### MVU 1.3: Delete Test Function
**Artifact**: `hello/` directory deleted
**Verification**: Directory no longer exists
```bash
rm -rf src/functions/hello
```
**Time**: 2min

---

### MVU 1.4: Update config.toml - Remove Function Declarations
**Artifact**: `supabase/config.toml` with cleaned function list
**Verification**: Only `[functions.api]` remains
```toml
# Remove these sections:
[functions.documents]
[functions.folders]
[functions.index-document]
[functions.create-account]
[functions.update-profile]
[functions.delete-account]
[functions.hello]
```
**Time**: 5min

---

### MVU 1.5: Remove Dead Schema Tables (agent_requests, agent_sessions, usage_events)
**Artifact**: `src/db/schema.ts` without unused tables
**Verification**: Grep shows no `agentRequests`, `agentSessions`, `usageEvents` exports
```typescript
// Remove these table definitions:
export const agentRequests = pgTable(...)
export const agentSessions = pgTable(...)
export const usageEvents = pgTable(...)
```
**Time**: 10min

---

### MVU 1.6: Document Legacy Tables (documents, folders, document_chunks)
**Artifact**: Comment header in `schema.ts` marking legacy tables
**Verification**: Comment exists above legacy table definitions
```typescript
// ============================================================================
// LEGACY TABLES (MVP v1 - Pre-AI Agent System)
// NOTE: These tables are from the old document management system.
// The AI agent system uses the `files` table instead.
// These may be deprecated in future versions.
// ============================================================================
```
**Time**: 5min

---

### MVU 1.7: Remove Legacy Table References from Services
**Artifact**: No imports of `documents`, `folders`, `documentChunks` in services
**Verification**: Grep shows no imports in `src/services/`
```bash
grep -r "from.*documents\|from.*folders" src/services/
# Should return no results
```
**Time**: 10min

---

### MVU 1.8: Create Dead Code Removal Checklist
**Artifact**: `DEAD_CODE_REMOVAL_CHECKLIST.md` with verification steps
**Verification**: File exists with all cleanup steps documented
**Time**: 10min

---

## 🏗️ PHASE 2: Shadow Domain Foundation (2-3h)

**Goal**: Set up database schema and pgvector extension

### MVU 2.1: Add pgvector Extension to Schema
**Artifact**: `src/db/schema.ts` exports pgvector setup SQL
**Verification**: SQL string exported for `CREATE EXTENSION vector`
```typescript
export const pgvectorExtensionSQL = `
  -- Enable pgvector extension for embeddings
  CREATE EXTENSION IF NOT EXISTS vector;
`;
```
**Time**: 10min

---

### MVU 2.2: Create shadow_entities Table Schema
**Artifact**: `shadow_entities` table definition in `schema.ts`
**Verification**: Table exports with all fields defined
```typescript
// Custom vector type
const vector = customType<{ data: number[] }>({
  dataType() {
    return 'vector(1536)'; // OpenAI text-embedding-3-small
  },
});

export const shadowEntities = pgTable('shadow_entities', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id').notNull(),
  entityType: text('entity_type').notNull(), // 'file' | 'thread' | 'concept'
  ownerUserId: uuid('owner_user_id').notNull(),
  embedding: vector('embedding'),
  summary: text('summary'),
  structureMetadata: jsonb('structure_metadata'),
  lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  entityIdx: index('idx_shadow_entities_entity').on(table.entityId, table.entityType),
  ownerIdx: index('idx_shadow_entities_owner').on(table.ownerUserId),
  entityTypeIdx: index('idx_shadow_entities_entity_type').on(table.entityType),
  createdAtIdx: index('idx_shadow_entities_created_at').on(table.createdAt),
}));
```
**Time**: 30min

---

### MVU 2.3: Create Vector Index SQL
**Artifact**: IVFFlat index SQL exported from schema
**Verification**: SQL string exported for vector index
```typescript
export const vectorIndexSQL = `
  -- Create IVFFlat index for fast vector similarity search
  -- lists = sqrt(num_rows) is a good starting point
  CREATE INDEX IF NOT EXISTS idx_shadow_entities_embedding_ivfflat
    ON shadow_entities
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
`;
```
**Time**: 15min

---

### MVU 2.4: Update db:push to Apply pgvector Setup
**Artifact**: `src/db/push.ts` applies extension + vector index after schema
**Verification**: Script runs pgvector SQL after Drizzle push
```typescript
// After drizzle push:
await db.execute(sql.raw(pgvectorExtensionSQL));
await db.execute(sql.raw(vectorIndexSQL));
```
**Time**: 20min

---

## 🗄️ PHASE 3: Repository Layer (2-3h)

**Goal**: Implement data access layer for shadow domain

### MVU 3.1: Create ShadowDomainRepository Interface
**Artifact**: `src/repositories/shadowDomain.ts` with interface + class skeleton
**Verification**: File exports `ShadowDomainRepository` class with method stubs
```typescript
export interface CreateShadowEntityInput {
  entityId: string;
  entityType: 'file' | 'thread' | 'concept';
  ownerUserId: string;
  embedding: number[];
  summary?: string;
  structureMetadata?: any;
}

export class ShadowDomainRepository {
  async create(input: CreateShadowEntityInput) { throw new Error('Not implemented'); }
  async findByEntity(entityId: string, entityType: string) { throw new Error('Not implemented'); }
  async findByOwner(ownerUserId: string, entityType?: string) { throw new Error('Not implemented'); }
  async update(id: string, updates: Partial<CreateShadowEntityInput>) { throw new Error('Not implemented'); }
  async delete(id: string) { throw new Error('Not implemented'); }
  async search(embedding: number[], ownerUserId: string, options?: any) { throw new Error('Not implemented'); }
}

export const shadowDomainRepository = new ShadowDomainRepository();
```
**Time**: 20min

---

### MVU 3.2: Implement create() Method
**Artifact**: Working `create()` method that inserts shadow entity
**Verification**: Method returns created entity with ID
```typescript
async create(input: CreateShadowEntityInput) {
  const { db } = await getDB();
  const [entity] = await db
    .insert(shadowEntities)
    .values({
      entityId: input.entityId,
      entityType: input.entityType,
      ownerUserId: input.ownerUserId,
      embedding: input.embedding,
      summary: input.summary,
      structureMetadata: input.structureMetadata,
    })
    .returning();
  return entity;
}
```
**Time**: 15min

---

### MVU 3.3: Implement findByEntity() Method
**Artifact**: Working `findByEntity()` method
**Verification**: Method returns entity or null
```typescript
async findByEntity(entityId: string, entityType: string) {
  const { db } = await getDB();
  const [entity] = await db
    .select()
    .from(shadowEntities)
    .where(
      and(
        eq(shadowEntities.entityId, entityId),
        eq(shadowEntities.entityType, entityType)
      )
    )
    .limit(1);
  return entity || null;
}
```
**Time**: 15min

---

### MVU 3.4: Implement update() and delete() Methods
**Artifact**: Working `update()` and `delete()` methods
**Verification**: Methods execute without errors
```typescript
async update(id: string, updates: Partial<CreateShadowEntityInput>) {
  const { db } = await getDB();
  const [entity] = await db
    .update(shadowEntities)
    .set({
      ...updates,
      lastUpdated: new Date(),
    })
    .where(eq(shadowEntities.id, id))
    .returning();
  return entity;
}

async delete(id: string) {
  const { db } = await getDB();
  await db
    .delete(shadowEntities)
    .where(eq(shadowEntities.id, id));
}
```
**Time**: 20min

---

### MVU 3.5: Implement search() Method (Vector Similarity)
**Artifact**: Working `search()` method using pgvector
**Verification**: Method returns ranked results by cosine similarity
```typescript
async search(
  embedding: number[],
  ownerUserId: string,
  options?: {
    entityTypes?: string[];
    limit?: number;
    minSimilarity?: number;
  }
) {
  const { db } = await getDB();
  
  const limit = options?.limit || 20;
  const minSimilarity = options?.minSimilarity || 0.7;
  
  // Build query
  let query = db
    .select({
      id: shadowEntities.id,
      entityId: shadowEntities.entityId,
      entityType: shadowEntities.entityType,
      summary: shadowEntities.summary,
      structureMetadata: shadowEntities.structureMetadata,
      similarity: sql<number>`1 - (${shadowEntities.embedding} <=> ${embedding}::vector)`,
    })
    .from(shadowEntities)
    .where(eq(shadowEntities.ownerUserId, ownerUserId));
  
  // Filter by entity types
  if (options?.entityTypes && options.entityTypes.length > 0) {
    query = query.where(
      sql`${shadowEntities.entityType} = ANY(${options.entityTypes})`
    );
  }
  
  // Order by similarity and apply filters
  const results = await query
    .orderBy(sql`${shadowEntities.embedding} <=> ${embedding}::vector`)
    .limit(limit);
  
  // Filter by minimum similarity
  return results.filter(r => r.similarity >= minSimilarity);
}
```
**Time**: 45min

---

## 🧠 PHASE 4: Service Layer (3-4h)

**Goal**: Implement business logic for embeddings and semantic search

### MVU 4.1: Create OpenAI Embeddings Client
**Artifact**: `src/lib/openai.ts` with embedding generation function
**Verification**: Function returns 1536-dimensional embedding
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  });
  return response.data.map(d => d.embedding);
}
```
**Time**: 20min

---

### MVU 4.2: Create ShadowDomainService Skeleton
**Artifact**: `src/services/shadowDomain.ts` with interface
**Verification**: File exports `ShadowDomainService` class with method stubs
```typescript
export class ShadowDomainService {
  static async generateForFile(fileId: string, content: string): Promise<string> {
    throw new Error('Not implemented');
  }
  
  static async generateForThread(threadId: string, messages: any[]): Promise<string> {
    throw new Error('Not implemented');
  }
  
  static async updateWhenChanged(entityId: string, entityType: string, newContent: string): Promise<boolean> {
    throw new Error('Not implemented');
  }
  
  static checkChangeThreshold(oldContent: string, newContent: string): boolean {
    throw new Error('Not implemented');
  }
}
```
**Time**: 15min

---

### MVU 4.3: Implement checkChangeThreshold()
**Artifact**: Working change detection (>20% character diff)
**Verification**: Method returns true when diff >20%
```typescript
static checkChangeThreshold(oldContent: string, newContent: string): boolean {
  const oldLength = oldContent.length;
  const newLength = newContent.length;
  
  if (oldLength === 0) return true; // New content
  
  // Calculate character difference percentage
  const diff = Math.abs(newLength - oldLength);
  const changePercent = (diff / oldLength) * 100;
  
  return changePercent > 20;
}
```
**Time**: 10min

---

### MVU 4.4: Implement generateForFile()
**Artifact**: Working file embedding generation
**Verification**: Method creates shadow entity for file
```typescript
static async generateForFile(fileId: string, content: string): Promise<string> {
  // Get file details
  const file = await fileRepository.findById(fileId);
  if (!file) throw new Error('File not found');
  
  // Truncate content for embedding (max 8191 tokens ≈ 32k chars)
  const truncatedContent = content.substring(0, 32000);
  
  // Generate embedding
  const embedding = await generateEmbedding(truncatedContent);
  
  // Generate summary (first 500 chars)
  const summary = content.substring(0, 500) + (content.length > 500 ? '...' : '');
  
  // Extract structure metadata
  const structureMetadata = {
    fileExtension: file.path.split('.').pop(),
    lineCount: content.split('\n').length,
    charCount: content.length,
    wordCount: content.split(/\s+/).length,
  };
  
  // Check if entity exists
  const existing = await shadowDomainRepository.findByEntity(fileId, 'file');
  
  let shadowEntity;
  if (existing) {
    // Update existing
    shadowEntity = await shadowDomainRepository.update(existing.id, {
      embedding,
      summary,
      structureMetadata,
    });
  } else {
    // Create new
    shadowEntity = await shadowDomainRepository.create({
      entityId: fileId,
      entityType: 'file',
      ownerUserId: file.ownerUserId,
      embedding,
      summary,
      structureMetadata,
    });
  }
  
  return shadowEntity.id;
}
```
**Time**: 45min

---

### MVU 4.5: Implement generateForThread()
**Artifact**: Working thread embedding generation
**Verification**: Method creates shadow entity for thread
```typescript
static async generateForThread(threadId: string, messages: any[]): Promise<string> {
  // Get thread details
  const thread = await threadRepository.findById(threadId);
  if (!thread) throw new Error('Thread not found');
  
  // Aggregate messages into content
  const aggregatedContent = messages
    .map(m => `[${m.role}]: ${m.content}`)
    .join('\n\n');
  
  // Truncate for embedding
  const truncatedContent = aggregatedContent.substring(0, 32000);
  
  // Generate embedding
  const embedding = await generateEmbedding(truncatedContent);
  
  // Generate summary (first 3 messages or 500 chars)
  const summaryMessages = messages.slice(0, 3);
  const summary = summaryMessages
    .map(m => `${m.role}: ${m.content.substring(0, 100)}`)
    .join(' | ');
  
  // Structure metadata
  const structureMetadata = {
    messageCount: messages.length,
    hasToolCalls: messages.some(m => m.toolCalls && m.toolCalls.length > 0),
    lastMessageRole: messages[messages.length - 1]?.role,
    branchDepth: 0, // TODO: Calculate from parent chain
  };
  
  // Check if entity exists
  const existing = await shadowDomainRepository.findByEntity(threadId, 'thread');
  
  let shadowEntity;
  if (existing) {
    shadowEntity = await shadowDomainRepository.update(existing.id, {
      embedding,
      summary,
      structureMetadata,
    });
  } else {
    shadowEntity = await shadowDomainRepository.create({
      entityId: threadId,
      entityType: 'thread',
      ownerUserId: thread.ownerUserId,
      embedding,
      summary,
      structureMetadata,
    });
  }
  
  return shadowEntity.id;
}
```
**Time**: 45min

---

### MVU 4.6: Implement updateWhenChanged()
**Artifact**: Working conditional update logic
**Verification**: Method updates only if change >20%
```typescript
static async updateWhenChanged(
  entityId: string,
  entityType: 'file' | 'thread',
  newContent: string
): Promise<boolean> {
  // Get existing shadow entity
  const existing = await shadowDomainRepository.findByEntity(entityId, entityType);
  
  if (!existing) {
    // No existing entity, generate new one
    if (entityType === 'file') {
      await this.generateForFile(entityId, newContent);
    } else if (entityType === 'thread') {
      // For threads, fetch messages
      const messages = await messageRepository.findByThreadId(entityId);
      await this.generateForThread(entityId, messages);
    }
    return true; // Updated
  }
  
  // Check change threshold (compare against summary as proxy for full content)
  const oldContent = existing.summary || '';
  const needsUpdate = this.checkChangeThreshold(oldContent, newContent.substring(0, 500));
  
  if (needsUpdate) {
    if (entityType === 'file') {
      await this.generateForFile(entityId, newContent);
    } else if (entityType === 'thread') {
      const messages = await messageRepository.findByThreadId(entityId);
      await this.generateForThread(entityId, messages);
    }
    return true; // Updated
  }
  
  return false; // No update needed
}
```
**Time**: 30min

---

## 🔄 PHASE 5: Integration (2-3h)

**Goal**: Connect shadow domain to existing systems

### MVU 5.1: Update FileService to Trigger Shadow Domain Sync
**Artifact**: `createFile()` and `updateFile()` call shadow domain service
**Verification**: File creation/update generates embeddings
```typescript
// In FileService.createFile():
const file = await fileRepository.create(input);

// Trigger shadow domain sync (fire-and-forget)
ShadowDomainService.generateForFile(file.id, file.content)
  .catch(err => console.error('Shadow domain sync failed:', err));

return file;
```
**Time**: 20min

---

### MVU 5.2: Update MessageService to Trigger Thread Shadow Sync
**Artifact**: `createMessage()` triggers thread embedding update
**Verification**: Message creation updates thread embedding
```typescript
// In MessageService.createMessage():
const message = await messageRepository.create(input);

// Trigger thread shadow domain sync (fire-and-forget)
const messages = await messageRepository.findByThreadId(input.threadId);
ShadowDomainService.generateForThread(input.threadId, messages)
  .catch(err => console.error('Shadow domain sync failed:', err));

return message;
```
**Time**: 20min

---

### MVU 5.3: Create SemanticSearchService
**Artifact**: `src/services/semanticSearch.ts` with search logic
**Verification**: Service returns ranked semantic matches
```typescript
export class SemanticSearchService {
  /**
   * Perform semantic search across shadow domain
   */
  static async search(
    userId: string,
    query: string,
    options?: {
      entityTypes?: Array<'file' | 'thread' | 'concept'>;
      limit?: number;
      includeRelationshipModifiers?: boolean;
      includeTemporalDecay?: boolean;
    }
  ) {
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);
    
    // Search shadow domain
    const results = await shadowDomainRepository.search(
      queryEmbedding,
      userId,
      {
        entityTypes: options?.entityTypes,
        limit: options?.limit || 20,
        minSimilarity: 0.7,
      }
    );
    
    // Apply relationship modifiers (if enabled)
    let scoredResults = results;
    if (options?.includeRelationshipModifiers) {
      scoredResults = await this.applyRelationshipModifiers(results);
    }
    
    // Apply temporal decay (if enabled)
    if (options?.includeTemporalDecay) {
      scoredResults = await this.applyTemporalDecay(scoredResults);
    }
    
    // Sort by final score
    scoredResults.sort((a, b) => b.similarity - a.similarity);
    
    return scoredResults;
  }
  
  /**
   * Apply relationship modifiers (+0.10 sibling, +0.15 parent/child)
   */
  private static async applyRelationshipModifiers(results: any[]) {
    // TODO: Implement relationship scoring
    // For now, return as-is
    return results;
  }
  
  /**
   * Apply temporal decay to older entities
   */
  private static async applyTemporalDecay(results: any[]) {
    // TODO: Implement temporal decay
    // For now, return as-is
    return results;
  }
}
```
**Time**: 45min

---

### MVU 5.4: Update SearchService to Use Semantic Search
**Artifact**: `SearchService.search()` uses `SemanticSearchService`
**Verification**: `/api/search` returns semantic results
```typescript
static async search(
  userId: string,
  query: string,
  options?: {
    limit?: number;
    fileTypes?: string[];
    entityTypes?: Array<'file' | 'thread' | 'concept'>;
  }
): Promise<any[]> {
  try {
    // Use semantic search if available
    const results = await SemanticSearchService.search(userId, query, {
      entityTypes: options?.entityTypes,
      limit: options?.limit,
      includeRelationshipModifiers: true,
      includeTemporalDecay: true,
    });
    
    // Map to expected format
    return results.map(r => ({
      id: r.entityId,
      entityType: r.entityType,
      excerpt: r.summary,
      relevance: r.similarity,
    }));
  } catch (error) {
    console.error('Semantic search failed, falling back to text search:', error);
    
    // Fallback to basic text search
    return this.textSearch(userId, query, options);
  }
}

private static async textSearch(userId: string, query: string, options?: any) {
  // Keep existing text search as fallback
  const files = await fileRepository.findByUserId(userId);
  // ... existing implementation
}
```
**Time**: 30min

---

### MVU 5.5: Update ContextAssemblyService to Use Semantic Search
**Artifact**: Context assembly includes semantic matches
**Verification**: Agent context includes semantically relevant files
```typescript
// In ContextAssemblyService.assemblePrimeContext():

// Add semantic context domain
const semanticMatches = await SemanticSearchService.search(
  userId,
  latestMessage.content,
  {
    entityTypes: ['file', 'thread'],
    limit: 10,
  }
);

primeContext.semanticContext = semanticMatches;
```
**Time**: 20min

---

## 🧪 PHASE 6: Testing & Documentation (1-2h)

**Goal**: Verify implementation and document architecture

### MVU 6.1: Create Shadow Domain Test Script
**Artifact**: `apps/api/test-shadow-domain.js` with manual tests
**Verification**: Script tests all shadow domain operations
```javascript
// Test script to verify shadow domain:
// 1. Create file
// 2. Verify shadow entity created
// 3. Search semantically
// 4. Update file (>20% change)
// 5. Verify embedding updated
```
**Time**: 30min

---

### MVU 6.2: Update IMPLEMENTATION_STATUS.md
**Artifact**: Updated implementation status with shadow domain complete
**Verification**: Document shows 100% completion for shadow domain
**Time**: 15min

---

### MVU 6.3: Create SHADOW_DOMAIN_ARCHITECTURE.md
**Artifact**: Detailed architecture doc for shadow domain system
**Verification**: Document explains:
- Database schema
- Repository layer
- Service layer
- Integration points
- Performance considerations
**Time**: 30min

---

## 📊 MVU Dependency Graph

```
Phase 1 (Dead Code Cleanup)
├─ MVU 1.1-1.8 → Can run in parallel
└─ No dependencies

Phase 2 (Foundation)
├─ MVU 2.1 → No dependencies
├─ MVU 2.2 → Depends on 2.1
├─ MVU 2.3 → Depends on 2.2
└─ MVU 2.4 → Depends on 2.1, 2.2, 2.3

Phase 3 (Repository)
├─ MVU 3.1 → Depends on Phase 2 complete
├─ MVU 3.2 → Depends on 3.1
├─ MVU 3.3 → Depends on 3.1
├─ MVU 3.4 → Depends on 3.1
└─ MVU 3.5 → Depends on 3.1, Phase 2 complete

Phase 4 (Services)
├─ MVU 4.1 → No dependencies
├─ MVU 4.2 → Depends on Phase 3 complete
├─ MVU 4.3 → Depends on 4.2
├─ MVU 4.4 → Depends on 4.1, 4.2, Phase 3
├─ MVU 4.5 → Depends on 4.1, 4.2, Phase 3
└─ MVU 4.6 → Depends on 4.3, 4.4, 4.5

Phase 5 (Integration)
├─ MVU 5.1 → Depends on Phase 4 complete
├─ MVU 5.2 → Depends on Phase 4 complete
├─ MVU 5.3 → Depends on Phase 4 complete
├─ MVU 5.4 → Depends on 5.3
└─ MVU 5.5 → Depends on 5.3

Phase 6 (Testing & Docs)
├─ MVU 6.1 → Depends on Phase 5 complete
├─ MVU 6.2 → Depends on Phase 5 complete
└─ MVU 6.3 → Depends on Phase 5 complete
```

---

## 🚀 Execution Strategy

### Sequential Phases
Phases must be completed in order: 1 → 2 → 3 → 4 → 5 → 6

### Within Each Phase
- MVUs can be parallelized if no dependencies
- Each MVU should be committed separately (git commit per MVU)
- Each MVU should be verified before moving to next

### Verification Checklist Per MVU
1. ✅ Artifact created (file, function, test)
2. ✅ Verification passes (command succeeds)
3. ✅ No TypeScript errors
4. ✅ Git commit with clear message
5. ✅ Update progress tracker

---

## 📋 Progress Tracker Template

```markdown
## Phase 1: Dead Code Cleanup
- [ ] MVU 1.1: Delete document functions
- [ ] MVU 1.2: Delete account functions
- [ ] MVU 1.3: Delete test function
- [ ] MVU 1.4: Update config.toml
- [ ] MVU 1.5: Remove dead schema tables
- [ ] MVU 1.6: Document legacy tables
- [ ] MVU 1.7: Remove legacy references
- [ ] MVU 1.8: Create cleanup checklist

## Phase 2: Shadow Domain Foundation
- [ ] MVU 2.1: Add pgvector extension
- [ ] MVU 2.2: Create shadow_entities schema
- [ ] MVU 2.3: Create vector index SQL
- [ ] MVU 2.4: Update db:push script

## Phase 3: Repository Layer
- [ ] MVU 3.1: Create repository interface
- [ ] MVU 3.2: Implement create()
- [ ] MVU 3.3: Implement findByEntity()
- [ ] MVU 3.4: Implement update() and delete()
- [ ] MVU 3.5: Implement search()

## Phase 4: Service Layer
- [ ] MVU 4.1: Create OpenAI embeddings client
- [ ] MVU 4.2: Create service skeleton
- [ ] MVU 4.3: Implement checkChangeThreshold()
- [ ] MVU 4.4: Implement generateForFile()
- [ ] MVU 4.5: Implement generateForThread()
- [ ] MVU 4.6: Implement updateWhenChanged()

## Phase 5: Integration
- [ ] MVU 5.1: Update FileService integration
- [ ] MVU 5.2: Update MessageService integration
- [ ] MVU 5.3: Create SemanticSearchService
- [ ] MVU 5.4: Update SearchService
- [ ] MVU 5.5: Update ContextAssemblyService

## Phase 6: Testing & Documentation
- [ ] MVU 6.1: Create test script
- [ ] MVU 6.2: Update implementation status
- [ ] MVU 6.3: Create architecture doc
```

---

## 🎯 Success Criteria

### Phase 1 Complete When:
- All orphaned functions deleted
- config.toml clean
- Schema documented
- No dead imports

### Phase 2 Complete When:
- `shadow_entities` table exists in schema
- pgvector extension SQL exported
- Vector index SQL exported
- `db:push` applies all SQL

### Phase 3 Complete When:
- All repository methods implemented
- Methods return correct types
- Vector search returns ranked results

### Phase 4 Complete When:
- OpenAI embeddings working
- File embeddings generated
- Thread embeddings generated
- Change detection working

### Phase 5 Complete When:
- File/message creation triggers embeddings
- Semantic search returns results
- Context assembly uses semantic matches

### Phase 6 Complete When:
- Test script passes all checks
- Documentation updated
- Architecture documented

---

## 🏁 Final Deliverables

After all 31 MVUs complete:

1. ✅ Clean codebase (no dead code)
2. ✅ Shadow domain system (database + repository + service)
3. ✅ Semantic search (pgvector + OpenAI embeddings)
4. ✅ Integration (file/thread/context assembly)
5. ✅ Documentation (architecture + implementation status)
6. ✅ Test coverage (manual test script)

**Total**: 31 MVUs, 11-17 hours, full semantic search system operational.
