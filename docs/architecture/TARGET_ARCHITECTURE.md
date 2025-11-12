# Target Architecture

## Overview

The target architecture transforms Centrid into a true persistent knowledge graph system where every piece of content is indexed, searchable, and automatically included in relevant contexts. This document defines the end state we're building toward.

## Core Architecture Principles

### 1. **Unified Content Layer**

All content (documents, files, artifacts) stored in a single, consistent system with uniform indexing and retrieval.

### 2. **Intelligent Retrieval**

Multi-modal search combining full-text, semantic vectors, and graph relationships to find the most relevant content.

### 3. **Adaptive Context Assembly**

Dynamic context building that prioritizes content based on relevance, recency, and relationships within token constraints.

### 4. **Continuous Learning**

System improves through usage, tracking which content proves useful and adjusting relevance scores accordingly.

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                        │
│  ┌─────────────┐ ┌──────────────┐ ┌────────────────┐   │
│  │   Upload    │ │ Chat/Agent   │ │ Knowledge View │   │
│  │  Interface  │ │   Interface  │ │   Interface    │   │
│  └─────────────┘ └──────────────┘ └────────────────┘   │
└─────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│                     API Layer                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │            Supabase Edge Functions               │   │
│  ├──────────────┬──────────────┬──────────────────┤   │
│  │   Files      │   Threads    │     Search       │   │
│  │   Service    │   Service    │     Service      │   │
│  └──────────────┴──────────────┴──────────────────┘   │
└─────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│                   Business Logic Layer                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │          Context Assembly Service                │   │
│  │  ┌────────────┐ ┌────────────┐ ┌──────────────┐ │   │
│  │  │  Explicit  │ │  Semantic  │ │    Graph     │ │   │
│  │  │ References │ │   Search   │ │  Traversal   │ │   │
│  │  └────────────┘ └────────────┘ └──────────────┘ │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │           Agent Execution Service                │   │
│  │  ┌────────────┐ ┌────────────┐ ┌──────────────┐ │   │
│  │  │  Streaming │ │    Tool    │ │   Response   │ │   │
│  │  │  Response  │ │ Execution  │ │  Generation  │ │   │
│  │  └────────────┘ └────────────┘ └──────────────┘ │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│                    Data Layer                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │              PostgreSQL + pgvector                │   │
│  ├──────────────┬──────────────┬──────────────────┤   │
│  │    Files     │   Threads    │     Shadow       │   │
│  │   (Content)  │  (Convos)    │   (Embeddings)   │   │
│  │              │              │                  │   │
│  │  - path      │  - messages  │  - vectors      │   │
│  │  - content   │  - context   │  - summaries    │   │
│  │  - tsvector  │  - tool_calls│  - relations    │   │
│  └──────────────┴──────────────┴──────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Data Model

### Unified Files Table

```sql
files:
  - id: uuid (PK)
  - owner_user_id: uuid (FK)
  - path: text (unique per user)
  - content: text
  - content_type: enum ('document', 'code', 'note', 'artifact')
  - parent_file_id: uuid (for chunked files)
  - chunk_index: integer (position in parent)
  - metadata: jsonb (title, tags, source_url, etc.)
  - search_vector: tsvector (full-text search)
  - created_at: timestamp
  - updated_at: timestamp
  - accessed_at: timestamp (for recency scoring)
```

### Shadow Entities Table (Semantic Layer)

```sql
shadow_entities:
  - shadow_id: uuid (PK)
  - entity_id: uuid (FK to files.id)
  - entity_type: enum ('file', 'thread', 'concept')
  - embedding: vector(768) (OpenAI embeddings)
  - summary: text (AI-generated summary)
  - keywords: text[] (extracted key terms)
  - relationships: jsonb (graph connections)
  - importance_score: float (learned relevance)
```

### Context References (Enhanced)

```sql
context_references:
  - id: uuid (PK)
  - thread_id: uuid (FK)
  - entity_id: uuid (FK to files.id)
  - reference_type: enum ('explicit', 'semantic', 'graph')
  - relevance_score: float (0-1)
  - usage_count: integer (tracking effectiveness)
  - added_by: enum ('user', 'agent', 'system')
```

## Service Architecture

### 1. Content Ingestion Pipeline

```typescript
interface ContentIngestionService {
  // Main entry point for all content
  async ingestContent(file: File, userId: string): Promise<FileRecord> {
    // 1. Store in files table
    // 2. Generate chunks if large
    // 3. Create full-text search index
    // 4. Generate embeddings (async)
    // 5. Extract relationships
    // 6. Update shadow entities
  }
}
```

### 2. Intelligent Search Service

```typescript
interface SearchService {
  async search(query: string, options: SearchOptions): Promise<SearchResults> {
    // 1. Full-text search (PostgreSQL tsvector)
    // 2. Semantic search (pgvector similarity)
    // 3. Graph traversal (related content)
    // 4. Merge and rank results
    // 5. Apply filters and limits
  }

  async hybridScore(results: SearchResult[]): number {
    // Combine multiple signals:
    // - Text match strength (0-1)
    // - Semantic similarity (0-1)
    // - Recency factor (exponential decay)
    // - Usage frequency (learned importance)
    // - Graph distance (relationship strength)
  }
}
```

### 3. Context Assembly Service (Enhanced)

```typescript
interface ContextAssemblyService {
  async buildPrimeContext(
    threadId: string,
    message: string,
    userId: string
  ): Promise<PrimeContext> {
    // 1. Get explicit references (user-specified files)
    // 2. Semantic search for relevant content
    // 3. Graph traversal for related files
    // 4. Thread history with summarization
    // 5. Score and rank all candidates
    // 6. Fit within token budget
    // 7. Return with citations
  }

  async optimizeForTokenBudget(
    candidates: ContextCandidate[],
    maxTokens: number
  ): Promise<ContextCandidate[]> {
    // Dynamic programming approach:
    // - Maximize relevance score sum
    // - Within token constraint
    // - Maintain diversity of sources
  }
}
```

### 4. Embedding Generation Service

```typescript
interface EmbeddingService {
  async generateEmbedding(text: string): Promise<number[]> {
    // OpenAI text-embedding-3-small
    // 768 dimensions, ~$0.02 per 1M tokens
  }

  async updateShadowEntity(fileId: string): Promise<void> {
    // 1. Get file content
    // 2. Generate embedding
    // 3. Extract summary
    // 4. Update shadow_entities
  }

  async backfillEmbeddings(): Promise<void> {
    // Process existing files without embeddings
    // Run as background job
  }
}
```

## Performance Targets

### Search Performance

- Full-text search: <50ms
- Semantic search: <100ms
- Hybrid search: <150ms
- Context assembly: <300ms

### Scalability

- Support 100K+ files per user
- Handle 1M+ embeddings total
- Process 100+ requests/second

### Quality Metrics

- Context recall: >90% relevant content included
- Precision: >80% included content is useful
- User satisfaction: >85% improved responses

## Security & Privacy

### Data Isolation

- Row-level security on all tables
- User ID filtering at repository layer
- No cross-user data access

### Performance Optimization

- Embedding cache with 24hr TTL
- Search result caching (5min)
- Context assembly caching (30s)
- Connection pooling for DB

## Migration Strategy

### Phase 1: Foundation (Week 1)

- Migrate documents → files
- Implement file chunking
- Add full-text search

### Phase 2: Intelligence (Week 2)

- Add embedding generation
- Implement semantic search
- Create hybrid retrieval

### Phase 3: Graph (Week 3-4)

- Build relationship tracking
- Add graph traversal
- Implement learning

## Success Indicators

The architecture succeeds when:

1. **Content Unified**: Single files table contains all user content
2. **Search Works**: Users can find any content through natural queries
3. **Context Rich**: Agent responses reference relevant knowledge
4. **Performance Met**: All operations within target latencies
5. **Learning Active**: System improves with usage

## Future Enhancements

### Near-term (1-3 months)

- Multi-modal embeddings (images, diagrams)
- Automatic summarization for large files
- Smart chunking based on content structure

### Medium-term (3-6 months)

- Knowledge graph visualization
- Collaborative knowledge bases
- External content connectors (Google Drive, Notion)

### Long-term (6-12 months)

- Fine-tuned embeddings for domain-specific content
- Automatic knowledge extraction and structuring
- Predictive context assembly

## Conclusion

This architecture transforms Centrid from a chat interface with file storage into a true knowledge graph system. By unifying content storage, implementing intelligent search, and building adaptive context assembly, we deliver on the promise of "upload once, use everywhere, forever."
