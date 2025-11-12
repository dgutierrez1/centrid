# Phase 2: Implementation Tasks - Context Assembly Integration

## Overview
This document contains specific implementation tasks for Phase 2: Context Assembly Integration. Each task includes clear acceptance criteria and dependencies.

## Task Priority Legend
- ⚡ **CRITICAL**: Blocks other work
- 🔧 **HIGH**: Core functionality
- 📊 **MEDIUM**: Important features
- 🎨 **LOW**: Nice to have

## Task Breakdown

### 1. Context Retrieval Enhancement ⚡ Priority: CRITICAL

#### 1.1 Enhance ContextAssemblyService
- [ ] Create new enhanced ContextAssemblyService class
- [ ] Implement parallel retrieval methods
- [ ] Add caching mechanism with TTL
- [ ] Create context item interfaces
- [ ] Add error handling and fallbacks

**File:** `apps/api/src/services/contextAssembly.ts`

**Acceptance Criteria:**
- Service can retrieve from multiple sources
- Caching reduces repeat queries
- Graceful degradation on errors
- All methods have proper types

**Dependencies:** Phase 1 complete

---

#### 1.2 Implement File Search Integration
- [ ] Add searchRelevantFiles method
- [ ] Implement keyword extraction
- [ ] Create search result merging logic
- [ ] Add deduplication logic
- [ ] Convert search results to context items

**File:** `apps/api/src/services/contextAssembly.ts`

**Acceptance Criteria:**
- Search returns relevant files
- Keywords properly extracted
- No duplicate results
- Results formatted as context items

**Dependencies:** 1.1

---

#### 1.3 Add Multi-Source Aggregation
- [ ] Implement getExplicitReferences method
- [ ] Add getThreadHistory method
- [ ] Create mergeContextSources method
- [ ] Add source priority ordering
- [ ] Implement deduplication across sources

**Acceptance Criteria:**
- All sources properly aggregated
- Priority ordering respected
- No duplicate content
- Metadata preserved

**Dependencies:** 1.2

---

### 2. Relevance Scoring System 🔧 Priority: HIGH

#### 2.1 Create RelevanceScorer Service
- [ ] Create RelevanceScorer class
- [ ] Define scoring weights configuration
- [ ] Implement scoreItems method
- [ ] Add scoring result interfaces
- [ ] Write unit tests

**File:** `apps/api/src/services/relevanceScorer.ts`

**Acceptance Criteria:**
- All items get relevance scores
- Scores normalized to 0-1
- Weights configurable
- Tests achieve 90% coverage

**Dependencies:** 1.1

---

#### 2.2 Implement Text Similarity Scoring
- [ ] Implement TF-IDF calculation
- [ ] Add cosine similarity function
- [ ] Create text preprocessing
- [ ] Add stop word filtering
- [ ] Optimize for performance

**Acceptance Criteria:**
- Accurate similarity scores
- Performance < 10ms per item
- Handles edge cases
- Stop words filtered

**Dependencies:** 2.1

---

#### 2.3 Add Temporal Scoring
- [ ] Implement recency calculation
- [ ] Add exponential decay function
- [ ] Make decay rate configurable
- [ ] Track last access times
- [ ] Update access on retrieval

**Acceptance Criteria:**
- Recent items score higher
- Decay rate tunable
- Access times tracked
- Smooth decay curve

**Dependencies:** 2.1

---

#### 2.4 Implement Source Priority
- [ ] Define source type priorities
- [ ] Add priority weight to scoring
- [ ] Make priorities configurable
- [ ] Document priority rationale
- [ ] Test priority ordering

**Acceptance Criteria:**
- Explicit refs highest priority
- Search results medium priority
- History lowest priority
- Configurable weights

**Dependencies:** 2.1

---

### 3. Token Optimization Engine 🔧 Priority: HIGH

#### 3.1 Create TokenOptimizer Service
- [ ] Create TokenOptimizer class
- [ ] Define optimization strategies
- [ ] Implement token counting
- [ ] Add optimization interfaces
- [ ] Write comprehensive tests

**File:** `apps/api/src/services/tokenOptimizer.ts`

**Acceptance Criteria:**
- Never exceeds token budget
- Maximizes relevance sum
- Maintains diversity
- Tests cover edge cases

**Dependencies:** 2.1

---

#### 3.2 Implement Greedy Selection
- [ ] Sort by relevance/token ratio
- [ ] Implement greedy selection loop
- [ ] Add diversity checking
- [ ] Track token accumulation
- [ ] Handle edge cases

**Acceptance Criteria:**
- Selects highest value items first
- Respects token limit
- Prevents type domination
- Always returns valid result

**Dependencies:** 3.1

---

#### 3.3 Add Dynamic Programming Option
- [ ] Implement DP algorithm
- [ ] Create backtracking logic
- [ ] Add memoization
- [ ] Compare with greedy
- [ ] Document when to use

**Acceptance Criteria:**
- Finds optimal solution
- Performance acceptable
- Clear use cases documented
- Tests verify optimality

**Dependencies:** 3.1

---

### 4. Citation Management System 📊 Priority: MEDIUM

#### 4.1 Create CitationManager
- [ ] Create CitationManager class
- [ ] Define citation interfaces
- [ ] Implement ID generation
- [ ] Add citation storage
- [ ] Create formatting methods

**File:** `apps/api/src/services/citationManager.ts`

**Acceptance Criteria:**
- Unique IDs generated
- Citations properly stored
- Formatting consistent
- No ID collisions

**Dependencies:** None

---

#### 4.2 Implement Citation Tracking
- [ ] Track which content used
- [ ] Map content to sources
- [ ] Add usage marking
- [ ] Store citation metadata
- [ ] Create audit trail

**Acceptance Criteria:**
- All sources tracked
- Usage accurately recorded
- Metadata complete
- Audit trail available

**Dependencies:** 4.1

---

#### 4.3 Add Citation Formatting
- [ ] Create inline format
- [ ] Add footer references
- [ ] Include confidence scores
- [ ] Format for markdown
- [ ] Add source links

**Acceptance Criteria:**
- Clean inline citations
- Complete footer refs
- Markdown compatible
- Links functional

**Dependencies:** 4.1

---

### 5. Repository Updates 🔧 Priority: HIGH

#### 5.1 Enhance FileRepository
- [ ] Add searchByKeywords method
- [ ] Implement fuzzySearch method
- [ ] Add getRecentlyAccessed method
- [ ] Create updateAccessTime method
- [ ] Optimize queries with indexes

**File:** `apps/api/src/repositories/file.ts`

**Acceptance Criteria:**
- All search methods working
- Queries optimized
- Access times updated
- Indexes utilized

**Dependencies:** Phase 1 complete

---

#### 5.2 Add Usage Tracking
- [ ] Create usage_tracking table
- [ ] Add tracking repository
- [ ] Implement feedback recording
- [ ] Add usage statistics
- [ ] Create cleanup job

**File:** `apps/api/src/repositories/usageTracking.ts`

**Acceptance Criteria:**
- Usage properly tracked
- Feedback recorded
- Statistics accurate
- Old data cleaned up

**Dependencies:** None

---

### 6. API Endpoints 📊 Priority: MEDIUM

#### 6.1 Create Context API Routes
- [ ] Add POST /api/context/build endpoint
- [ ] Add POST /api/context/feedback endpoint
- [ ] Add GET /api/context/stats endpoint
- [ ] Implement validation
- [ ] Add error handling

**File:** `apps/api/src/functions/api/routes/context.ts`

**Acceptance Criteria:**
- Endpoints functional
- Validation working
- Errors handled gracefully
- Response format consistent

**Dependencies:** 1.1, 2.1, 3.1

---

#### 6.2 Update Agent Execution
- [ ] Integrate new context assembly
- [ ] Pass citations to agent
- [ ] Update response format
- [ ] Track context usage
- [ ] Add monitoring

**File:** `apps/api/src/services/agentExecution.ts`

**Acceptance Criteria:**
- Agent uses new context
- Citations included
- Usage tracked
- Monitoring in place

**Dependencies:** 6.1

---

### 7. Performance Optimization ⚡ Priority: CRITICAL

#### 7.1 Implement Caching Layer
- [ ] Add LRU cache implementation
- [ ] Configure cache TTL
- [ ] Add cache invalidation
- [ ] Implement cache warming
- [ ] Monitor hit rates

**File:** `apps/api/src/services/contextCache.ts`

**Acceptance Criteria:**
- Cache hit rate > 30%
- TTL configurable
- Invalidation working
- Metrics available

**Dependencies:** 1.1

---

#### 7.2 Optimize Database Queries
- [ ] Add missing indexes
- [ ] Implement query batching
- [ ] Use prepared statements
- [ ] Add connection pooling
- [ ] Profile slow queries

**Acceptance Criteria:**
- All queries < 50ms
- Indexes utilized
- No N+1 queries
- Pool configured

**Dependencies:** 5.1

---

### 8. Testing & Quality Assurance ✅ Priority: HIGH

#### 8.1 Write Unit Tests
- [ ] Test ContextAssemblyService
- [ ] Test RelevanceScorer
- [ ] Test TokenOptimizer
- [ ] Test CitationManager
- [ ] Test search methods

**Acceptance Criteria:**
- 90% code coverage
- All edge cases tested
- Tests run in CI
- Mocks properly used

**Dependencies:** All services implemented

---

#### 8.2 Write Integration Tests
- [ ] Test full context assembly
- [ ] Test with real database
- [ ] Test citation flow
- [ ] Test token limits
- [ ] Test error scenarios

**Acceptance Criteria:**
- End-to-end flow tested
- Database integration verified
- Error handling tested
- Performance validated

**Dependencies:** 8.1

---

#### 8.3 Performance Testing
- [ ] Load test context assembly
- [ ] Measure query performance
- [ ] Test with 10K+ files
- [ ] Monitor memory usage
- [ ] Profile CPU usage

**Acceptance Criteria:**
- Assembly < 300ms
- Memory stable
- CPU usage reasonable
- Handles scale

**Dependencies:** 8.2

---

### 9. Frontend Integration 🎨 Priority: LOW

#### 9.1 Display Citations
- [ ] Add citation component
- [ ] Show inline references
- [ ] Create footer section
- [ ] Add hover tooltips
- [ ] Link to sources

**File:** `apps/web/src/components/Citations.tsx`

**Acceptance Criteria:**
- Citations visible
- Tooltips functional
- Links working
- UI/UX polished

**Dependencies:** 4.3

---

#### 9.2 Show Context Stats
- [ ] Add context stats display
- [ ] Show token usage
- [ ] Display source counts
- [ ] Add relevance indicators
- [ ] Create expand/collapse

**File:** `apps/web/src/components/ContextStats.tsx`

**Acceptance Criteria:**
- Stats clearly displayed
- Real-time updates
- Expandable details
- Mobile responsive

**Dependencies:** 6.1

---

## Timeline

### Day 1: Core Services
- Tasks 1.1-1.3: Context retrieval
- Task 2.1: Relevance scorer setup
- Task 3.1: Token optimizer setup

### Day 2: Scoring Implementation
- Tasks 2.2-2.4: Scoring algorithms
- Tasks 3.2-3.3: Optimization algorithms

### Day 3: Supporting Systems
- Tasks 4.1-4.3: Citations
- Tasks 5.1-5.2: Repository updates

### Day 4: Integration
- Tasks 6.1-6.2: API endpoints
- Tasks 7.1-7.2: Performance

### Day 5: Testing & Polish
- Tasks 8.1-8.3: Testing
- Tasks 9.1-9.2: Frontend (if time)

## Success Metrics

### Must Have (Day 5)
- ✅ Context includes file content
- ✅ Relevance scoring working
- ✅ Token limits respected
- ✅ Citations functional
- ✅ Performance < 300ms

### Should Have (Week 1)
- ✅ Caching operational
- ✅ Frontend integration
- ✅ Usage tracking
- ✅ 90% test coverage

### Nice to Have (Later)
- ✅ DP optimization
- ✅ Advanced scoring
- ✅ A/B testing
- ✅ ML-based ranking

## Definition of Done

Phase 2 is complete when:
1. All CRITICAL and HIGH priority tasks complete
2. Integration tests passing
3. Performance targets met
4. Documentation updated
5. Team trained on changes
6. Deployed to production