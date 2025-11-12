# Phase 3: Semantic Search Layer - Implementation Plan

## Executive Summary

Phase 3 adds semantic search capabilities through embeddings and vector similarity, transforming Centrid into an intelligent knowledge graph that understands meaning, not just keywords. This enables finding conceptually related content even when exact terms don't match.

## Prerequisites

### From Previous Phases ✅
- Phase 1: Unified files table with all content
- Phase 2: Context assembly with relevance scoring
- Full-text search operational
- Citation system working

### System Requirements
- PostgreSQL with pgvector extension
- OpenAI API access (for embeddings)
- Sufficient storage for vectors (768 dims × 4 bytes × N files)
- GPU optional but beneficial for large-scale operations

## Objectives

### Primary Goals
1. **Generate Embeddings**: Create vector representations of all content
2. **Implement Vector Search**: Find semantically similar content
3. **Build Hybrid Search**: Combine text and vector search
4. **Enable Concept Discovery**: Find related ideas across documents
5. **Optimize Retrieval**: Balance accuracy and performance

### Success Criteria
- [ ] All files have embeddings generated
- [ ] Semantic search returns conceptually related content
- [ ] Hybrid search improves relevance by 30%+
- [ ] Query latency < 200ms at scale
- [ ] Cost within budget ($0.02 per 1M tokens)

## Current State Analysis

### What We Have
- Files stored and searchable via text
- Basic relevance scoring
- Context assembly pipeline
- Token optimization

### What's Missing
- No semantic understanding
- Can't find conceptually related content
- No cross-document connections
- Missing paraphrase detection

## Architecture Design

### Semantic Search Flow
```
Query Input
    ↓
[1. Query Embedding]
    - Generate embedding for query
    - Cache for session reuse
    ↓
[2. Vector Search]
    - Find N nearest neighbors
    - Use HNSW index
    - Apply distance threshold
    ↓
[3. Text Search]
    - Traditional full-text search
    - Keyword matching
    - Phrase search
    ↓
[4. Hybrid Scoring]
    - Combine vector + text scores
    - Apply weights (configurable)
    - Re-rank results
    ↓
[5. Result Enhancement]
    - Add metadata
    - Generate summaries
    - Extract relationships
    ↓
Final Results
```

### Data Architecture
```
┌──────────────────────────────────────────┐
│              Files Table                  │
│  (id, content, search_vector, metadata)   │
└────────────────────┬─────────────────────┘
                     │ 1:1
                     ▼
┌──────────────────────────────────────────┐
│          Shadow Entities Table            │
│  (entity_id, embedding[768], summary)     │
│         Semantic search layer             │
└──────────────────────────────────────────┘
                     │
                     ▼
            [HNSW Vector Index]
         (Fast similarity search)
```

## Implementation Approach

### Strategy: Progressive Enhancement

1. **Basic Embeddings**: Start with OpenAI text-embedding-3-small
2. **Vector Search**: Implement pgvector similarity
3. **Hybrid System**: Combine with existing text search
4. **Optimization**: Add indexing, caching, batching
5. **Advanced Features**: Clustering, concept maps

## Key Components

### 1. Embedding Generation Service

```typescript
interface EmbeddingService {
  // Generate embedding for text
  generateEmbedding(text: string): Promise<number[]>;

  // Batch processing for efficiency
  generateBatch(texts: string[]): Promise<number[][]>;

  // Process file and store embedding
  processFile(fileId: string): Promise<void>;

  // Backfill existing content
  backfillEmbeddings(): Promise<void>;
}
```

### 2. Vector Search Engine

```typescript
interface VectorSearchEngine {
  // Find similar content
  searchSimilar(
    embedding: number[],
    limit: number,
    threshold?: number
  ): Promise<SimilarityResult[]>;

  // Find related to specific file
  findRelated(fileId: string): Promise<RelatedContent[]>;

  // Cluster analysis
  findClusters(): Promise<ContentCluster[]>;
}
```

### 3. Hybrid Search Orchestrator

```typescript
interface HybridSearch {
  // Combined search
  search(
    query: string,
    options: SearchOptions
  ): Promise<HybridResults>;

  // Adjustable weights
  setWeights(weights: {
    vector: number;
    text: number;
    recency: number;
  }): void;

  // A/B testing support
  compareStrategies(
    query: string
  ): Promise<StrategyComparison>;
}
```

## Detailed Implementation Plan

### Phase 3.1: Embedding Infrastructure (Days 1-2)

#### Setup
- Install pgvector extension
- Configure OpenAI client
- Create shadow_entities table
- Add vector indexes

#### Embedding Generation
- Implement OpenAI integration
- Add retry logic for API calls
- Create batching for efficiency
- Implement cost tracking

#### Storage & Indexing
- Store vectors in shadow_entities
- Create HNSW index for fast search
- Configure index parameters
- Test performance

### Phase 3.2: Vector Search (Days 3-4)

#### Basic Search
- Implement similarity search
- Add distance metrics (cosine, L2)
- Create result ranking
- Add filtering options

#### Advanced Features
- Implement diversity sampling
- Add MMR (Maximal Marginal Relevance)
- Create clustering algorithms
- Build concept detection

### Phase 3.3: Hybrid Integration (Days 5-6)

#### Search Orchestration
- Combine vector and text results
- Implement score fusion
- Add weight tuning
- Create A/B testing framework

#### Optimization
- Add embedding cache
- Implement query optimization
- Batch similar queries
- Add prefetching

### Phase 3.4: Enhancement & Tuning (Days 7-8)

#### Quality Improvements
- Fine-tune embedding model (optional)
- Adjust similarity thresholds
- Optimize index parameters
- Implement feedback loop

#### Monitoring & Analytics
- Track search quality metrics
- Monitor embedding costs
- Analyze query patterns
- Build quality dashboards

## Technical Specifications

### Embedding Model Selection

**OpenAI text-embedding-3-small**
- Dimensions: 768
- Cost: $0.02 per 1M tokens
- Performance: Good balance
- Quality: Suitable for most use cases

**Alternative Options:**
- text-embedding-3-large: 3072 dims, higher quality
- Custom fine-tuned model: Domain-specific
- Open-source (Sentence Transformers): Free but lower quality

### Vector Index Configuration

```sql
-- HNSW Index for fast similarity search
CREATE INDEX shadow_entities_embedding_idx
ON shadow_entities
USING hnsw (embedding vector_cosine_ops)
WITH (
  m = 16,              -- Connections per node
  ef_construction = 64 -- Construction search depth
);
```

### Performance Targets

- Embedding generation: < 100ms per file
- Vector search: < 50ms for top 10
- Hybrid search: < 200ms total
- Index build: < 1 hour for 100K files
- Memory usage: < 2GB for 100K vectors

## Cost Analysis

### Embedding Costs
- Average file: ~1000 tokens
- Cost per file: $0.00002
- 10,000 files: $0.20
- 100,000 files: $2.00
- Monthly updates: ~$1-5

### Storage Costs
- 768 dimensions × 4 bytes = 3KB per vector
- 100K vectors = 300MB storage
- Indexes add ~50% overhead
- Total: < 500MB for 100K files

## Risk Mitigation

### Technical Risks
- **API Rate Limits**: Implement exponential backoff
- **Embedding Quality**: Test with evaluation set
- **Index Performance**: Monitor and tune parameters
- **Cost Overruns**: Set spending limits

### Quality Risks
- **Poor Relevance**: A/B test and iterate
- **Semantic Drift**: Regular reprocessing
- **Language Bias**: Test with diverse content
- **Domain Mismatch**: Consider fine-tuning

## Testing Strategy

### Unit Tests
- Embedding generation
- Vector operations
- Similarity calculations
- Score fusion

### Integration Tests
- End-to-end search flow
- Database operations
- API interactions
- Cache behavior

### Quality Tests
- Relevance evaluation
- Precision/recall metrics
- A/B comparisons
- User satisfaction

### Performance Tests
- Throughput testing
- Latency measurements
- Scalability limits
- Resource usage

## Success Metrics

### Immediate (Week 1)
- Embeddings generated for all files
- Vector search operational
- Hybrid search working
- Performance acceptable

### Short-term (Month 1)
- Search relevance improved 30%+
- User engagement increased
- Positive feedback received
- Costs within budget

### Long-term (Quarter)
- Concept discovery valued by users
- Knowledge graph connections visible
- Platform stickiness increased
- Competitive differentiation achieved

## Dependencies

### External
- OpenAI API availability
- pgvector extension installed
- Sufficient compute resources
- Network bandwidth for API calls

### Internal
- Phase 1 & 2 completed
- Database migrations ready
- Monitoring infrastructure
- Team training completed

## Next Steps

After Phase 3:
1. Monitor search quality
2. Gather user feedback
3. Fine-tune parameters
4. Consider custom embeddings
5. Build knowledge graph visualization
6. Implement continuous learning

## Conclusion

Phase 3 completes the transformation of Centrid into a true semantic knowledge graph. By adding vector search capabilities, we enable intelligent content discovery that understands meaning, not just matching keywords. This is the key differentiator that delivers on the promise of persistent, intelligent knowledge management.