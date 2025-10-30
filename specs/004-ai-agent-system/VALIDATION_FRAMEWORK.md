# Multi-Level Validation Framework: AI Agent System

**Feature**: `004-ai-agent-system`
**Created**: 2025-10-28
**Purpose**: Systematic validation approach for complex multi-layer system with embeddings, services, and data flows

---

## Overview

This framework provides a **bottom-up validation strategy** for the AI agent system, starting with foundational infrastructure and progressively validating higher layers. Each level builds on the previous, ensuring issues are caught early before they compound.

**Validation Philosophy**:
- ✅ **Isolate before integrate** - Test layers independently before testing together
- ✅ **Trace flows end-to-end** - Follow data through all layers for critical paths
- ✅ **Performance at every level** - Validate speed targets at each layer, not just end-to-end
- ✅ **Fail fast, fix fast** - Catch issues at lowest level possible

---

## The 5-Level Pyramid

```
                    Level 4: System Validation
                    (Full stack, real users)
                           ▲
                    Level 3: Flow Validation
                (Multi-service, end-to-end paths)
                           ▲
                 Level 2: Service Validation
               (Business logic, mocked dependencies)
                           ▲
              Level 1: Repository Validation
                  (Data access, DB queries)
                           ▲
           Level 0: Infrastructure Validation
              (Database, APIs, environment)
```

**Execution Order**: Always validate bottom-up (0 → 1 → 2 → 3 → 4)

**Checkpoints**: Each level has specific validation scripts and acceptance criteria

---

## Level 0: Infrastructure Validation

**Purpose**: Verify foundational infrastructure is operational before testing any business logic

**What to Validate**:
1. Database connectivity + schema
2. External API connectivity (OpenAI, Anthropic)
3. Environment variables
4. pgvector extension installed
5. Database indexes created

### Validation Script: `validate-infrastructure.ts`

**Location**: `apps/api/src/scripts/validate-infrastructure.ts`

**What it checks**:

```typescript
// 1. Database connectivity
✓ Can connect to Supabase PostgreSQL
✓ Database version >= 15.x
✓ RLS enabled

// 2. Schema validation
✓ All 8 tables exist (shadow_entities, threads, messages, etc.)
✓ All foreign keys defined
✓ All indexes created

// 3. pgvector extension
✓ pgvector installed
✓ Vector type available
✓ Cosine similarity function works

// 4. External APIs
✓ OpenAI API key valid
✓ Can generate test embedding (768-dim)
✓ Anthropic API key valid
✓ Can call Claude test completion

// 5. Environment
✓ DATABASE_URL set
✓ OPENAI_API_KEY set
✓ ANTHROPIC_API_KEY set
✓ SUPABASE_URL set
✓ SUPABASE_SERVICE_ROLE_KEY set
```

**Run Command**:
```bash
cd apps/api
npx tsx src/scripts/validate-infrastructure.ts
```

**Expected Output**:
```
✅ Level 0: Infrastructure Validation PASSED
   ✓ Database connected (PostgreSQL 15.3)
   ✓ Schema complete (8 tables, 12 indexes)
   ✓ pgvector installed (v0.5.1)
   ✓ OpenAI API connected (ada-002 embedding test passed)
   ✓ Anthropic API connected (Haiku test passed)
   ⏱️ Total time: 2.3s
```

**Performance Targets**:
- Database connection: <500ms
- OpenAI test embedding: <1s
- Anthropic test completion: <2s
- Total validation: <5s

**Exit Criteria**: All checks pass. Do not proceed to Level 1 if any fail.

---

## Level 1: Repository Validation

**Purpose**: Verify data access layer works correctly in isolation (no services, no external APIs)

**What to Validate**:
1. CRUD operations for each repository
2. Query correctness (joins, filters)
3. RLS policies enforce user isolation
4. Performance targets met
5. Error handling (invalid IDs, foreign key violations)

### Validation Script: `validate-repositories.ts`

**Location**: `apps/api/src/scripts/validate-repositories.ts`

**Repositories to test**: 8 total
- ShadowEntityRepository
- ThreadRepository
- MessageRepository
- FileRepository
- ContextReferenceRepository
- AgentToolCallRepository
- MemoryChunkRepository
- UserPreferencesRepository

**Test Pattern** (per repository):

```typescript
// Example: ThreadRepository validation
describe('ThreadRepository', () => {
  const testUserId = 'test-user-id';

  // 1. Create operation
  test('create() - creates thread with valid data', async () => {
    const thread = await threadRepo.create({
      ownerUserId: testUserId,
      branchTitle: 'Test Thread',
      creator: 'user'
    });

    expect(thread.threadId).toBeDefined();
    expect(thread.branchTitle).toBe('Test Thread');
    // ⏱️ Performance: <50ms
  });

  // 2. Read operation
  test('findById() - retrieves thread by ID', async () => {
    const thread = await threadRepo.findById(testThreadId);
    expect(thread).toBeDefined();
    // ⏱️ Performance: <30ms
  });

  // 3. Update operation
  test('update() - updates thread fields', async () => {
    const updated = await threadRepo.update(testThreadId, {
      branchTitle: 'Updated Title'
    });
    expect(updated.branchTitle).toBe('Updated Title');
    // ⏱️ Performance: <50ms
  });

  // 4. Delete operation
  test('delete() - removes thread', async () => {
    await threadRepo.delete(testThreadId);
    const thread = await threadRepo.findById(testThreadId);
    expect(thread).toBeNull();
    // ⏱️ Performance: <50ms
  });

  // 5. RLS policy enforcement
  test('findById() - rejects cross-user access', async () => {
    const otherUserId = 'other-user-id';
    const thread = await threadRepo.findById(testThreadId, { userId: otherUserId });
    expect(thread).toBeNull(); // RLS blocks access
  });

  // 6. Query performance
  test('findByUserId() - queries user threads efficiently', async () => {
    const start = Date.now();
    const threads = await threadRepo.findByUserId(testUserId);
    const duration = Date.now() - start;

    expect(threads.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(100); // ⏱️ <100ms for 50 threads
  });
});
```

**Special Focus Areas**:

1. **ShadowEntityRepository** (critical for semantic search):
   ```typescript
   test('searchSemantic() - cosine similarity query', async () => {
     const queryEmbedding = await generateEmbedding('test query');
     const results = await shadowEntityRepo.searchSemantic(
       queryEmbedding,
       ['file', 'thread'],
       10
     );

     expect(results.length).toBeLessThanOrEqual(10);
     expect(results[0].similarityScore).toBeGreaterThan(0);
     // ⏱️ Performance: <500ms for 1000 entities
   });
   ```

2. **ThreadRepository** (tree traversal):
   ```typescript
   test('findChildren() - recursive tree query', async () => {
     const children = await threadRepo.findChildren(rootThreadId);
     expect(children.length).toBeGreaterThan(0);
     // ⏱️ Performance: <100ms for 50 branches
   });
   ```

**Run Command**:
```bash
cd apps/api
npx tsx src/scripts/validate-repositories.ts
```

**Expected Output**:
```
✅ Level 1: Repository Validation PASSED
   ✓ ShadowEntityRepository (8/8 tests passed, avg 85ms)
   ✓ ThreadRepository (10/10 tests passed, avg 45ms)
   ✓ MessageRepository (8/8 tests passed, avg 40ms)
   ✓ FileRepository (10/10 tests passed, avg 60ms)
   ✓ ContextReferenceRepository (6/6 tests passed, avg 35ms)
   ✓ AgentToolCallRepository (6/6 tests passed, avg 40ms)
   ✓ MemoryChunkRepository (8/8 tests passed, avg 90ms)
   ✓ UserPreferencesRepository (6/6 tests passed, avg 50ms)

   ⏱️ Total: 62 tests, 0 failures, 4.2s
```

**Performance Targets**:
- Create/Update/Delete: <50ms
- Simple query (by ID): <30ms
- Complex query (with joins): <100ms
- Semantic search: <500ms for 1000 entities
- Tree traversal: <100ms for 50 branches

**Exit Criteria**: All repository tests pass with performance targets met.

---

## Level 2: Service Validation

**Purpose**: Verify business logic works correctly in isolation with mocked external dependencies

**What to Validate**:
1. Service orchestration logic
2. Error handling
3. Business rule enforcement
4. Performance with mocked data
5. Edge cases (empty results, conflicts, limits)

### Validation Script: `validate-services.ts`

**Location**: `apps/api/src/scripts/validate-services.ts`

**Services to test**: 10 total
- ShadowDomainService
- SemanticSearchService
- UserPreferencesService
- ContextAssemblyService
- ProvenanceTrackingService
- ToolCallService
- AgentExecutionService
- ConsolidationService

**Mocking Strategy**:
- **Mock OpenAI**: Return fake embeddings (768-dim random vectors)
- **Mock Anthropic**: Return fake completions (no real API calls)
- **Real Repositories**: Use actual database (isolated test data)

**Test Pattern** (per service):

```typescript
// Example: ShadowDomainService validation
describe('ShadowDomainService', () => {
  beforeEach(() => {
    // Mock OpenAI embeddings
    vi.spyOn(openai, 'generateEmbedding').mockResolvedValue({
      embedding: Array(768).fill(0.5) // Fake embedding
    });

    // Mock Anthropic summarization
    vi.spyOn(anthropic, 'messages.create').mockResolvedValue({
      content: [{ type: 'text', text: 'Test summary' }]
    });
  });

  test('generateForFile() - creates shadow entity', async () => {
    const result = await shadowDomainService.generateForFile(
      'test-file-id',
      'Test file content',
      'test-user-id'
    );

    expect(result.shadowId).toBeDefined();
    expect(result.embedding).toHaveLength(768);
    expect(result.summary).toBe('Test summary');
    expect(result.structureMetadata).toBeDefined();
    // ⏱️ Performance: <2s (with mocked APIs)
  });

  test('checkChangeThreshold() - detects >20% diff', async () => {
    const oldContent = 'a'.repeat(100);
    const newContent = 'a'.repeat(70) + 'b'.repeat(30);

    const changed = shadowDomainService.checkChangeThreshold(
      oldContent,
      newContent
    );

    expect(changed).toBe(true); // 30% diff > 20% threshold
  });
});
```

**Critical Service Tests**:

1. **ContextAssemblyService** (multi-domain gathering):
   ```typescript
   test('buildPrimeContext() - gathers 6 domains in parallel', async () => {
     const result = await contextAssemblyService.buildPrimeContext(
       'test-thread-id',
       'test-user-id',
       'Test user message'
     );

     expect(result.explicitFiles).toBeDefined();
     expect(result.threadContext).toBeDefined();
     expect(result.totalTokens).toBeLessThan(200000); // Within budget
     expect(result.excludedItems).toBeDefined();
     // ⏱️ Performance: <1s for context assembly
   });
   ```

2. **SemanticSearchService** (relationship modifiers):
   ```typescript
   test('applyRelationshipModifiers() - boosts siblings +0.10', async () => {
     const results = [
       { entityId: 'file-1', relevanceScore: 0.8, sourceThreadId: 'sibling' }
     ];

     const modified = semanticSearchService.applyRelationshipModifiers(
       results,
       'current-thread-id',
       threadTreeMetadata
     );

     expect(modified[0].relevanceScore).toBe(0.9); // 0.8 + 0.10 modifier
   });
   ```

3. **AgentExecutionService** (tool call approval):
   ```typescript
   test('pauseForApproval() - waits for user approval', async () => {
     const approvalPromise = agentExecutionService.pauseForApproval('tool-call-id');

     // Simulate user approval after 1s
     setTimeout(() => {
       toolCallRepo.updateStatus('tool-call-id', 'approved');
     }, 1000);

     const result = await approvalPromise;
     expect(result.approved).toBe(true);
     // ⏱️ Performance: <10 minutes timeout
   });
   ```

**Run Command**:
```bash
cd apps/api
npx tsx src/scripts/validate-services.ts
```

**Expected Output**:
```
✅ Level 2: Service Validation PASSED
   ✓ ShadowDomainService (12/12 tests, avg 800ms)
   ✓ SemanticSearchService (10/10 tests, avg 400ms)
   ✓ UserPreferencesService (8/8 tests, avg 300ms)
   ✓ ContextAssemblyService (15/15 tests, avg 900ms)
   ✓ ProvenanceTrackingService (6/6 tests, avg 200ms)
   ✓ ToolCallService (8/8 tests, avg 350ms)
   ✓ AgentExecutionService (12/12 tests, avg 1.2s)
   ✓ ConsolidationService (10/10 tests, avg 1.5s)

   ⏱️ Total: 81 tests, 0 failures, 18.3s
```

**Performance Targets**:
- Simple operations: <500ms
- Context assembly: <1s
- Agent execution (mocked): <2s
- Consolidation (mocked): <3s

**Exit Criteria**: All service tests pass with mocked external dependencies.

---

## Level 3: Flow Validation

**Purpose**: Verify end-to-end data flows through multiple layers with **real external APIs**

**What to Validate**:
1. Critical user paths (embedding flow, context assembly, agent streaming)
2. Multi-service orchestration
3. Real API integrations (OpenAI, Anthropic)
4. Error recovery
5. Performance under realistic conditions

### Critical Flows to Validate

#### Flow 1: Embedding Generation (End-to-End)

**Path**: File content → OpenAI embedding → Shadow entity → pgvector index → Semantic search

**Validation Script**: `validate-embedding-flow.ts`

```typescript
// Flow 1: Embedding Generation
async function validateEmbeddingFlow() {
  console.log('🔄 Flow 1: Embedding Generation (End-to-End)');

  // Step 1: Create test file
  const file = await fileRepo.create({
    ownerUserId: 'test-user-id',
    path: '/test/embedding-flow.md',
    content: 'This is a test document about RAG and semantic search.'
  });
  console.log('✓ Step 1: File created', file.fileId);

  // Step 2: Generate shadow entity (calls OpenAI API - REAL)
  const start = Date.now();
  const shadow = await shadowDomainService.generateForFile(
    file.fileId,
    file.content,
    'test-user-id'
  );
  const embeddingTime = Date.now() - start;
  console.log(`✓ Step 2: Shadow entity generated (${embeddingTime}ms)`, shadow.shadowId);

  // Step 3: Verify embedding stored in database
  const storedShadow = await shadowEntityRepo.findByEntityId(file.fileId, 'file');
  expect(storedShadow).toBeDefined();
  expect(storedShadow.embedding).toHaveLength(768);
  console.log('✓ Step 3: Embedding stored in pgvector');

  // Step 4: Semantic search using embedding (pgvector cosine similarity)
  const searchStart = Date.now();
  const results = await semanticSearchService.search(
    'semantic search',
    ['file'],
    null,
    10
  );
  const searchTime = Date.now() - searchStart;
  console.log(`✓ Step 4: Semantic search (${searchTime}ms)`, results.length, 'results');

  // Step 5: Verify test file appears in results
  const foundFile = results.find(r => r.entityId === file.fileId);
  expect(foundFile).toBeDefined();
  expect(foundFile.relevanceScore).toBeGreaterThan(0.5); // High relevance
  console.log('✓ Step 5: File found via semantic search', foundFile.relevanceScore);

  // Performance validation
  expect(embeddingTime).toBeLessThan(2000); // <2s for embedding
  expect(searchTime).toBeLessThan(500); // <500ms for search

  console.log('✅ Flow 1: PASSED (Total:', Date.now() - start, 'ms)');
}
```

**Expected Output**:
```
🔄 Flow 1: Embedding Generation (End-to-End)
✓ Step 1: File created file-123
✓ Step 2: Shadow entity generated (1,243ms) shadow-456
✓ Step 3: Embedding stored in pgvector
✓ Step 4: Semantic search (387ms) 3 results
✓ Step 5: File found via semantic search 0.87
✅ Flow 1: PASSED (Total: 1,658ms)
```

---

#### Flow 2: Context Assembly (6 Domains)

**Path**: User message → 6 domain queries → Prioritization → 200K token budget

**Validation Script**: `validate-context-assembly-flow.ts`

```typescript
// Flow 2: Context Assembly
async function validateContextAssemblyFlow() {
  console.log('🔄 Flow 2: Context Assembly (6 Domains)');

  // Setup: Create test thread with context
  const thread = await threadRepo.create({
    ownerUserId: 'test-user-id',
    branchTitle: 'Test Thread',
    creator: 'user'
  });

  // Add explicit files
  await contextReferenceRepo.bulkCreate([
    { threadId: thread.threadId, entityType: 'file', entityReference: 'file-1', source: 'manual', priorityTier: 1 },
    { threadId: thread.threadId, entityType: 'file', entityReference: 'file-2', source: 'manual', priorityTier: 1 }
  ]);

  // Step 1: Build prime context (multi-domain gathering)
  const start = Date.now();
  const context = await contextAssemblyService.buildPrimeContext(
    thread.threadId,
    'test-user-id',
    'Tell me about RAG implementations'
  );
  const assemblyTime = Date.now() - start;
  console.log(`✓ Step 1: Context assembled (${assemblyTime}ms)`);

  // Step 2: Verify all domains present
  expect(context.explicitFiles).toBeDefined();
  expect(context.explicitFiles.length).toBeGreaterThan(0);
  console.log('  - Explicit files:', context.explicitFiles.length);

  expect(context.threadContext).toBeDefined();
  console.log('  - Thread context: present');

  // Step 3: Verify token budget respected
  expect(context.totalTokens).toBeLessThan(200000);
  console.log('  - Total tokens:', context.totalTokens, '/ 200,000');

  // Step 4: Verify excluded items tracked
  expect(context.excludedItems).toBeDefined();
  console.log('  - Excluded items:', context.excludedItems.length);

  // Performance validation
  expect(assemblyTime).toBeLessThan(1000); // <1s target

  console.log('✅ Flow 2: PASSED (Total:', assemblyTime, 'ms)');
}
```

**Expected Output**:
```
🔄 Flow 2: Context Assembly (6 Domains)
✓ Step 1: Context assembled (847ms)
  - Explicit files: 2
  - Thread context: present
  - Total tokens: 127,543 / 200,000
  - Excluded items: 3
✅ Flow 2: PASSED (Total: 847ms)
```

---

#### Flow 3: Agent Execution with Streaming

**Path**: User message → Context → Claude API → SSE streaming → Tool call → Approval

**Validation Script**: `validate-agent-execution-flow.ts`

```typescript
// Flow 3: Agent Execution with Streaming
async function validateAgentExecutionFlow() {
  console.log('🔄 Flow 3: Agent Execution with Streaming');

  // Setup
  const thread = await threadRepo.create({
    ownerUserId: 'test-user-id',
    branchTitle: 'Test Agent Execution',
    creator: 'user'
  });

  const primeContext = await contextAssemblyService.buildPrimeContext(
    thread.threadId,
    'test-user-id',
    'Create a summary file about RAG'
  );

  // Step 1: Start agent execution
  const start = Date.now();
  const stream = agentExecutionService.executeWithStreaming(
    thread.threadId,
    'Create a summary file about RAG',
    primeContext,
    'test-user-id'
  );

  let textChunks = 0;
  let toolCallReceived = null;

  // Step 2: Consume SSE stream
  for await (const chunk of stream) {
    if (chunk.type === 'text_chunk') {
      textChunks++;
      console.log(`  - Text chunk ${textChunks}`);
    } else if (chunk.type === 'tool_call') {
      toolCallReceived = chunk;
      console.log('  - Tool call:', chunk.toolName);

      // Step 3: Approve tool call
      await toolCallRepo.updateStatus(chunk.toolCallId, 'approved');
      console.log('  - Tool approved');
    } else if (chunk.type === 'completion') {
      const totalTime = Date.now() - start;
      console.log(`✓ Step 4: Stream completed (${totalTime}ms)`);
    }
  }

  // Validation
  expect(textChunks).toBeGreaterThan(0);
  expect(toolCallReceived).toBeDefined();
  expect(toolCallReceived.toolName).toBe('write_file');

  console.log('✅ Flow 3: PASSED');
}
```

**Expected Output**:
```
🔄 Flow 3: Agent Execution with Streaming
  - Text chunk 1
  - Text chunk 2
  - Tool call: write_file
  - Tool approved
  - Text chunk 3
✓ Step 4: Stream completed (4,231ms)
✅ Flow 3: PASSED
```

---

### Run Command (All Flows)
```bash
cd apps/api
npx tsx src/scripts/validate-flows.ts
```

**Expected Output**:
```
✅ Level 3: Flow Validation PASSED
   ✓ Flow 1: Embedding Generation (1.7s)
   ✓ Flow 2: Context Assembly (0.9s)
   ✓ Flow 3: Agent Execution (4.3s)
   ✓ Flow 4: Consolidation (6.1s)
   ✓ Flow 5: Memory Chunking (2.4s)

   ⏱️ Total: 5 flows, 0 failures, 15.4s
```

**Performance Targets**:
- Embedding flow: <2s
- Context assembly: <1s
- Agent execution: <5s for simple queries
- Consolidation: <10s
- Memory chunking: <3s

**Exit Criteria**: All critical flows work end-to-end with real APIs.

---

## Level 4: System Validation

**Purpose**: Validate full system with real user scenarios and acceptance criteria

**What to Validate**:
1. User acceptance scenarios (from spec.md)
2. API contracts (from plan.md)
3. UI flows (from ux.md)
4. Performance under load
5. Error recovery

**Leverage Existing Tools**:
- `/speckit.test` - API + E2E tests
- `/speckit.verify-ui` - Browser-based UI testing
- `/speckit.analyze` - Cross-artifact consistency

**Run Command**:
```bash
/speckit.test 004
```

**Expected Coverage**:
- 6 user stories
- 17 acceptance criteria
- 20+ API endpoints
- 9 UI flows

---

## Quick Reference: When to Use Each Level

| Scenario | Level | Command |
|----------|-------|---------|
| **New database schema** | 0 | `validate-infrastructure.ts` |
| **Added repository method** | 1 | `validate-repositories.ts` |
| **Changed service logic** | 2 | `validate-services.ts` |
| **Modified embedding flow** | 3 | `validate-flows.ts` (Flow 1) |
| **Changed context assembly** | 3 | `validate-flows.ts` (Flow 2) |
| **Before PR merge** | 4 | `/speckit.test 004` |
| **Before production deploy** | 0-4 | All scripts + `/speckit.test` |

---

## Debugging Workflow

When something fails, trace bottom-up:

```
Issue: Semantic search returns no results
  ↓
Level 3: Flow 1 (Embedding) → ✅ Embedding generated correctly
  ↓
Level 2: SemanticSearchService → ✅ Query logic correct
  ↓
Level 1: ShadowEntityRepository → ❌ FOUND: pgvector index not created
  ↓
Level 0: Infrastructure → Run db:push to create index
  ↓
Re-test: Level 1 → Level 2 → Level 3 → All pass
```

**Key Insight**: Always start at lowest level when debugging.

---

## Implementation Checklist

To implement this framework:

- [ ] **Level 0**: Create `validate-infrastructure.ts` script
- [ ] **Level 1**: Create `validate-repositories.ts` script (8 repos)
- [ ] **Level 2**: Create `validate-services.ts` script (10 services)
- [ ] **Level 3**: Create `validate-flows.ts` script (5 flows)
- [ ] **Level 4**: Leverage existing `/speckit.test`
- [ ] **CI/CD**: Add all validation scripts to pre-merge checks
- [ ] **Documentation**: Update CLAUDE.md with validation commands

---

## Next Steps

1. **Immediate**: Create Level 0 infrastructure validation script
2. **Next**: Implement Level 1 repository tests for critical repos (ShadowEntity, Thread, Message)
3. **Then**: Add Level 3 Flow 1 (embedding) validation
4. **Finally**: Wire up all levels to CI/CD pipeline

**Estimated Implementation Time**: 2-3 days for complete framework

---

**Created**: 2025-10-28
**Status**: Proposed (not yet implemented)
