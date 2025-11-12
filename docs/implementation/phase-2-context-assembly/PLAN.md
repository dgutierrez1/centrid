# Phase 2: Context Assembly Integration - Implementation Plan

## Executive Summary

Phase 2 connects the unified file system to the agent's context assembly, enabling RAG (Retrieval-Augmented Generation) capabilities. This transforms the agent from conversation-only to knowledge-aware, able to reference and utilize all uploaded content.

## Prerequisites

### From Phase 1 ✅
- Unified files table with all content
- Full-text search operational
- File chunking implemented
- Search vectors generated

### System Requirements
- PostgreSQL with tsvector support
- Files indexed and searchable
- Agent execution pipeline functional

## Objectives

### Primary Goals
1. **Connect Files to Context**: Include relevant files in agent context
2. **Implement Smart Retrieval**: Search and rank content by relevance
3. **Optimize Context Window**: Fit maximum value within token limits
4. **Add Source Attribution**: Include citations in responses

### Success Criteria
- [ ] Agent references uploaded files in responses
- [ ] Search returns relevant content for queries
- [ ] Context assembly respects token limits
- [ ] Response includes source citations
- [ ] Performance remains under 300ms

## Current State Analysis

### Existing Context Assembly
```typescript
// Current: Only thread history + explicit references
buildPrimeContext(threadId, message, userId) {
  - Fetches context references (manual)
  - Fetches recent messages (20)
  - Returns static context
}
```

### What's Missing
- No file content search
- No relevance scoring
- No token optimization
- No source tracking

## Implementation Approach

### Strategy: Progressive Enhancement

1. **Basic Integration**: Add file search to context
2. **Relevance Scoring**: Rank results by multiple factors
3. **Token Optimization**: Dynamic context selection
4. **Citation Tracking**: Source attribution in responses

## Architecture Design

### Context Assembly Flow
```
User Message
    ↓
[1. Query Analysis]
    - Extract keywords
    - Identify intent
    - Determine context needs
    ↓
[2. Multi-Source Retrieval]
    - Explicit references (priority 1)
    - File search results (priority 2)
    - Thread history (priority 3)
    - Related content (priority 4)
    ↓
[3. Relevance Scoring]
    - Text match strength
    - Recency factor
    - Source priority
    - Usage frequency
    ↓
[4. Token Optimization]
    - Calculate token costs
    - Select within budget
    - Maintain diversity
    ↓
[5. Context Assembly]
    - Format for agent
    - Include citations
    - Add instructions
    ↓
Agent Execution
```

## Key Components

### 1. Enhanced Context Assembly Service

```typescript
interface PrimeContext {
  totalTokens: number;
  explicitFiles: ContextItem[];
  searchResults: ContextItem[];
  threadContext: ContextItem[];
  relatedContent: ContextItem[];
  citations: Citation[];
}

interface ContextItem {
  id: string;
  type: 'file' | 'message' | 'reference';
  content: string;
  relevance: number;
  tokens: number;
  source: string;
}
```

### 2. Relevance Scoring Algorithm

```typescript
calculateRelevance(item, query) {
  const textMatch = calculateTextSimilarity(item, query);
  const recency = calculateRecencyScore(item);
  const priority = getSourcePriority(item);
  const usage = getUsageFrequency(item);

  return (
    textMatch * 0.4 +
    recency * 0.2 +
    priority * 0.3 +
    usage * 0.1
  );
}
```

### 3. Token Budget Management

```typescript
optimizeForTokens(candidates, maxTokens) {
  // Dynamic programming approach
  // Maximize relevance sum within token constraint
  const selected = [];
  let currentTokens = 0;

  // Sort by relevance/token ratio
  candidates.sort((a, b) =>
    (b.relevance / b.tokens) - (a.relevance / a.tokens)
  );

  for (const item of candidates) {
    if (currentTokens + item.tokens <= maxTokens) {
      selected.push(item);
      currentTokens += item.tokens;
    }
  }

  return selected;
}
```

## Detailed Tasks

### 1. Context Retrieval Enhancement

#### 1.1 Implement File Search Integration
- Add search method to context assembly
- Query files based on message content
- Return top N relevant results
- Include file metadata

#### 1.2 Create Multi-Source Aggregation
- Combine explicit references
- Add search results
- Include thread history
- Merge and deduplicate

### 2. Relevance Scoring System

#### 2.1 Text Similarity Scoring
- Implement TF-IDF calculation
- Add keyword matching
- Score phrase proximity
- Weight by document length

#### 2.2 Temporal Scoring
- Recent files score higher
- Exponential decay function
- Configurable decay rate
- Track last access time

#### 2.3 Priority Weighting
- Explicit references: 1.0
- Search results: 0.7
- Thread context: 0.5
- Related content: 0.3

### 3. Token Optimization

#### 3.1 Token Counting
- Accurate token estimation
- Account for formatting
- Include system prompts
- Leave buffer for response

#### 3.2 Context Selection Algorithm
- Greedy selection by score/token
- Maintain source diversity
- Preserve conversation flow
- Include critical context

### 4. Citation System

#### 4.1 Source Tracking
- Track which files used
- Map content to sources
- Generate citation IDs
- Store in response metadata

#### 4.2 Citation Formatting
- Inline citations [1]
- Footer references
- Source links
- Confidence scores

## Timeline

### Day 1: Retrieval Implementation
- [ ] Enhance ContextAssemblyService
- [ ] Add file search integration
- [ ] Implement multi-source aggregation
- [ ] Write retrieval tests

### Day 2: Scoring System
- [ ] Implement relevance scoring
- [ ] Add temporal factors
- [ ] Create priority weights
- [ ] Test scoring accuracy

### Day 3: Token Optimization
- [ ] Implement token counting
- [ ] Create selection algorithm
- [ ] Add diversity maintenance
- [ ] Performance optimization

### Day 4: Citation System
- [ ] Add source tracking
- [ ] Implement citation formatting
- [ ] Update response structure
- [ ] Create citation UI

### Day 5: Integration & Testing
- [ ] End-to-end testing
- [ ] Performance tuning
- [ ] Documentation update
- [ ] Deployment preparation

## Risk Mitigation

### Performance Risks
- **Risk**: Slow context assembly
- **Mitigation**: Caching, parallel queries, indexed search

### Quality Risks
- **Risk**: Irrelevant context included
- **Mitigation**: Tunable scoring, user feedback, A/B testing

### Token Risks
- **Risk**: Context overflow
- **Mitigation**: Strict budgets, summarization, chunking

## Testing Strategy

### Unit Tests
- Relevance scoring algorithm
- Token optimization logic
- Citation generation
- Search integration

### Integration Tests
- Full context assembly flow
- Multi-source aggregation
- Token budget adherence
- Citation accuracy

### Performance Tests
- Context assembly < 300ms
- Handle 1000+ files
- Concurrent requests
- Memory efficiency

## Success Metrics

### Immediate Success
- Context includes relevant files
- Citations properly formatted
- Token limits respected
- Performance targets met

### Week 1 Success
- User feedback positive
- Response quality improved
- No context overflows
- Stable operation

## Dependencies

### Technical Dependencies
- Phase 1 completed
- Files searchable
- Agent pipeline stable
- Database indexed

### Team Dependencies
- Backend team available
- QA resources ready
- Documentation updated
- Deployment window scheduled

## Next Steps

After Phase 2 completion:
1. Monitor context quality
2. Gather user feedback
3. Tune scoring parameters
4. Prepare for Phase 3 (Semantic Search)