# Phase 2: Acceptance Criteria - Context Assembly Integration

## Overview
This document defines measurable criteria that must be met for Phase 2 to be considered complete and successful. The primary goal is to connect the file system to agent context, enabling true RAG capabilities.

## Functional Acceptance Criteria

### 1. Context Retrieval ✅

#### 1.1 Multi-Source Integration
- [ ] Context assembly retrieves from **at least 3 sources** (files, references, history)
- [ ] All sources queried in **parallel** not sequential
- [ ] Results properly **merged and deduplicated**
- [ ] Source metadata **preserved** through pipeline

**Verification Method:**
```typescript
// Test multi-source retrieval
const context = await contextAssembly.buildPrimeContext(threadId, message, userId);
assert(context.stats.explicitCount > 0);
assert(context.stats.searchCount > 0);
assert(context.stats.historyCount > 0);
```

#### 1.2 File Search Functionality
- [ ] Search returns **relevant files** based on query
- [ ] Results include **highlighted excerpts**
- [ ] Search completes in **< 100ms** for 1000 files
- [ ] Only user's files returned (security)

**Verification Method:**
```bash
curl -X POST /api/context/build \
  -d '{"threadId": "...", "message": "knowledge graph"}'
# Expected: Context includes files mentioning "knowledge graph"
```

---

### 2. Relevance Scoring ✅

#### 2.1 Scoring Algorithm
- [ ] All context items receive **relevance scores 0-1**
- [ ] Explicit references score **highest** (>0.8)
- [ ] Search results score **medium** (0.4-0.8)
- [ ] History scores **lower** (0.2-0.6)

**Test Case:**
```typescript
const scored = await scorer.scoreItems(items, query);
assert(scored.every(item => item.relevance >= 0 && item.relevance <= 1));
assert(explicitRef.relevance > searchResult.relevance);
```

#### 2.2 Scoring Factors
- [ ] **Text similarity** properly calculated
- [ ] **Recency** affects score (newer = higher)
- [ ] **Source priority** applied correctly
- [ ] **Keyword matches** boost relevance

**Verification:**
```typescript
// Recent file should score higher than old file with same content
const recentScore = scorer.score(recentFile, query);
const oldScore = scorer.score(oldFile, query);
assert(recentScore > oldScore);
```

---

### 3. Token Optimization ✅

#### 3.1 Budget Enforcement
- [ ] Context **never exceeds** token limit
- [ ] Token counting **accurate** (±5%)
- [ ] Buffer reserved for **system prompt**
- [ ] Graceful handling when content exceeds limit

**Test Case:**
```typescript
const maxTokens = 4000;
const result = optimizer.optimize(items, maxTokens);
assert(result.totalTokens <= maxTokens);
assert(result.totalTokens > maxTokens * 0.8); // Efficient use
```

#### 3.2 Selection Quality
- [ ] **Highest relevance** items selected first
- [ ] **Diversity** maintained (no single type >70%)
- [ ] At least **one item** always included
- [ ] Excluded items tracked with reason

**Verification:**
```typescript
const result = optimizer.optimize(items, maxTokens);
const typeCount = countByType(result.selected);
assert(Math.max(...typeCount.values()) / result.selected.length <= 0.7);
```

---

### 4. Citation System ✅

#### 4.1 Citation Generation
- [ ] All context items get **unique citation IDs**
- [ ] Citations include **source path**
- [ ] Citations track **usage** in response
- [ ] No citation ID **collisions**

**Test Case:**
```typescript
const citations = citationManager.generateCitations(contextItems);
const ids = citations.map(c => c.id);
assert(new Set(ids).size === ids.length); // All unique
```

#### 4.2 Citation Formatting
- [ ] Citations appear in **response footer**
- [ ] Format: **[type-id]: source - excerpt**
- [ ] Only **used** citations shown
- [ ] Markdown **compatible** format

**Example Output:**
```markdown
Here's information about your topic [fil-a3b]...

---
Sources:
[fil-a3b]: research.md - "Knowledge graphs enable..."
[msg-x2d]: Thread history - "Previously discussed..."
```

---

## Non-Functional Acceptance Criteria

### 5. Performance Requirements ⚡

#### 5.1 Response Times
- [ ] Context assembly: **< 300ms** average
- [ ] File search: **< 100ms** for first page
- [ ] Relevance scoring: **< 50ms** for 100 items
- [ ] Token optimization: **< 20ms** for 100 items

**Measurement Method:**
```typescript
const start = Date.now();
const context = await contextAssembly.buildPrimeContext(...);
const duration = Date.now() - start;
assert(duration < 300);
```

#### 5.2 Scalability
- [ ] Handles **10,000+ files** per user
- [ ] Supports **100+ concurrent** requests
- [ ] Memory usage **stable** under load
- [ ] No **memory leaks** detected

**Load Test:**
```bash
# Run load test with 100 concurrent users
npm run test:load
# Expected: All requests complete < 300ms
```

---

### 6. Caching Requirements 📊

#### 6.1 Cache Effectiveness
- [ ] Cache **hit rate > 30%** in production
- [ ] TTL configurable (default **30 seconds**)
- [ ] Cache **invalidation** on file changes
- [ ] Maximum **100 entries** per cache

**Verification:**
```typescript
// Second identical request should hit cache
const result1 = await contextAssembly.buildPrimeContext(...);
const result2 = await contextAssembly.buildPrimeContext(...); // Same params
assert(metrics.cacheHit === true);
```

#### 6.2 Cache Behavior
- [ ] Stale cache **never returned**
- [ ] Cache **misses handled** gracefully
- [ ] Memory usage **bounded**
- [ ] LRU eviction working

---

### 7. Quality Requirements 📈

#### 7.1 Code Quality
- [ ] **90% unit test** coverage
- [ ] **80% integration test** coverage
- [ ] All **critical paths** tested
- [ ] **TypeScript** strict mode passing

**Verification:**
```bash
npm run test:coverage
# Expected: Coverage > 90%
npm run type-check
# Expected: No errors
```

#### 7.2 Search Quality
- [ ] Search **precision > 80%** (relevant results)
- [ ] Search **recall > 70%** (finds most relevant)
- [ ] **Stop words** filtered correctly
- [ ] **Fuzzy matching** works for typos

**Test Case:**
```typescript
// Should find document even with typo
const results = await search("knowlege graph"); // Typo
assert(results.some(r => r.path.includes("knowledge")));
```

---

## User Experience Criteria

### 8. Agent Response Quality 🤖

#### 8.1 Context Awareness
- [ ] Agent **references uploaded files** in responses
- [ ] Responses show **improved relevance**
- [ ] Agent can **synthesize** from multiple sources
- [ ] Context **appropriate** to query

**Test Scenario:**
```
User: "What did the research say about performance?"
Agent: "According to research.md [fil-a3b], the performance metrics show..."
```

#### 8.2 Citation Clarity
- [ ] Users can **identify sources** easily
- [ ] Citations **non-intrusive** in response
- [ ] Source links **functional** (if applicable)
- [ ] Confidence indicators present

---

## Integration Criteria

### 9. System Integration ✅

#### 9.1 API Compatibility
- [ ] New endpoints **fully documented**
- [ ] Backward compatibility **maintained**
- [ ] Error responses **consistent**
- [ ] Rate limiting **applied**

**API Test:**
```bash
# All endpoints should respond correctly
curl -X POST /api/context/build -d '{"threadId": "...", "message": "test"}'
curl -X POST /api/context/feedback -d '{"contextItemId": "...", "useful": true}'
curl -X GET /api/context/stats?threadId=...
```

#### 9.2 Database Integration
- [ ] All queries use **indexes**
- [ ] No **N+1 query** problems
- [ ] Transactions where needed
- [ ] Connection **pooling** configured

---

## Operational Criteria

### 10. Monitoring & Observability 📊

#### 10.1 Metrics Collection
- [ ] Context assembly **time tracked**
- [ ] Cache **hit rate** monitored
- [ ] Token **usage** logged
- [ ] Error **rates** tracked

**Metrics Available:**
```typescript
{
  contextAssemblyTime: number,
  cacheHitRate: number,
  averageTokenUsage: number,
  errorRate: number,
  p95ResponseTime: number
}
```

#### 10.2 Logging
- [ ] All errors **logged with context**
- [ ] Performance **slow queries** logged
- [ ] User actions **audited**
- [ ] Debug info **available**

---

## Acceptance Test Scenarios

### Scenario 1: Basic RAG Flow
```gherkin
Given I have uploaded documents about "machine learning"
When I ask "What are neural networks?"
Then the context should include relevant documents
And the response should cite those documents
And citations should be properly formatted
```

### Scenario 2: Token Limit Handling
```gherkin
Given I have many large documents
When context would exceed token limit
Then highest relevance content is selected
And token limit is respected
And excluded content is tracked
```

### Scenario 3: Multi-Source Context
```gherkin
Given I have files, references, and chat history
When I send a message
Then context includes all relevant sources
And sources are properly prioritized
And no duplicates exist
```

---

## Definition of Success

Phase 2 is **SUCCESSFUL** when:

### Minimum Success Criteria ✅
- ✅ Files searchable and included in context
- ✅ Relevance scoring operational
- ✅ Token limits never exceeded
- ✅ Citations properly formatted
- ✅ Performance < 300ms

### Target Success Criteria 🎯
- ✅ Cache hit rate > 30%
- ✅ Search quality > 80% precision
- ✅ 90% test coverage
- ✅ User satisfaction improved

### Stretch Goals 🚀
- ✅ Advanced scoring algorithms
- ✅ ML-based ranking
- ✅ A/B testing framework
- ✅ Real-time learning

---

## Sign-off Requirements

Phase 2 requires sign-off from:

- [ ] **Technical Lead**: Architecture approved
- [ ] **QA Lead**: All tests passing
- [ ] **Product Owner**: RAG functionality working
- [ ] **DevOps Lead**: Performance acceptable
- [ ] **AI/ML Lead**: Scoring algorithms validated

---

## Rollback Criteria

Phase 2 must be rolled back if:

- 🔴 Context assembly fails completely
- 🔴 Token limits regularly exceeded
- 🔴 Performance degraded >100%
- 🔴 Search returns wrong user's files
- 🔴 Agent responses significantly worse

---

## Post-Implementation Review

After 1 week:

- [ ] Performance metrics analyzed
- [ ] User feedback collected
- [ ] Citation usage tracked
- [ ] Scoring parameters tuned
- [ ] Ready for Phase 3

## Conclusion

Meeting these criteria ensures Phase 2 successfully integrates the file system with agent context, delivering true RAG capabilities that reference the entire knowledge base.