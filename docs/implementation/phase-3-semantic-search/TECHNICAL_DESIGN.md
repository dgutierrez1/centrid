# Phase 3: Technical Design - Semantic Search Layer

## Architecture Overview

Phase 3 implements vector embeddings and semantic search, enabling content discovery based on meaning rather than exact keyword matches.

## System Architecture

```
┌─────────────────────────────────────────────────┐
│                Query Pipeline                     │
├───────────────┬─────────────┬───────────────────┤
│  Text Search  │ Vector Search│  Graph Relations  │
│  (PostgreSQL) │  (pgvector)  │  (Future)        │
└───────────────┴─────────────┴───────────────────┘
                       ↓
              [Score Fusion Engine]
                       ↓
              [Ranked Results]
```

## Core Components

### 1. Embedding Service

```typescript
// embeddingService.ts
import { Configuration, OpenAIApi } from 'openai';

export class EmbeddingService {
  private openai: OpenAIApi;
  private cache = new Map<string, number[]>();
  private readonly MODEL = 'text-embedding-3-small';
  private readonly BATCH_SIZE = 100;

  async generateEmbedding(text: string): Promise<number[]> {
    // Check cache
    const cached = this.cache.get(this.hash(text));
    if (cached) return cached;

    try {
      const response = await this.openai.createEmbedding({
        model: this.MODEL,
        input: text
      });

      const embedding = response.data.data[0].embedding;
      this.cache.set(this.hash(text), embedding);

      return embedding;
    } catch (error) {
      // Exponential backoff on rate limit
      if (error.response?.status === 429) {
        await this.delay(this.getBackoffDelay(error));
        return this.generateEmbedding(text);
      }
      throw error;
    }
  }

  async processBatch(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += this.BATCH_SIZE) {
      const batch = texts.slice(i, i + this.BATCH_SIZE);
      const response = await this.openai.createEmbedding({
        model: this.MODEL,
        input: batch
      });

      embeddings.push(...response.data.data.map(d => d.embedding));
    }

    return embeddings;
  }

  async processFile(fileId: string): Promise<void> {
    const file = await fileRepo.findById(fileId);
    if (!file) throw new Error('File not found');

    // Generate embedding for content
    const embedding = await this.generateEmbedding(
      this.prepareText(file.content)
    );

    // Store in shadow entity
    await shadowRepo.upsert({
      entity_id: fileId,
      entity_type: 'file',
      embedding,
      summary: this.extractSummary(file.content),
      keywords: this.extractKeywords(file.content),
      last_updated: new Date()
    });
  }

  private prepareText(content: string): string {
    // Truncate to max tokens (8191 for embedding model)
    const maxChars = 30000; // ~7500 tokens
    return content.length > maxChars
      ? content.substring(0, maxChars) + '...'
      : content;
  }
}
```

### 2. Shadow Entity Repository

```typescript
// shadowRepository.ts
export class ShadowRepository {
  async upsert(entity: ShadowEntity): Promise<void> {
    const sql = `
      INSERT INTO shadow_entities (
        entity_id,
        entity_type,
        owner_user_id,
        embedding,
        summary,
        keywords,
        last_updated
      ) VALUES ($1, $2, $3, $4::vector, $5, $6, $7)
      ON CONFLICT (entity_id, entity_type)
      DO UPDATE SET
        embedding = $4::vector,
        summary = $5,
        keywords = $6,
        last_updated = $7
    `;

    await db.execute(sql, [
      entity.entity_id,
      entity.entity_type,
      entity.owner_user_id,
      JSON.stringify(entity.embedding),
      entity.summary,
      entity.keywords,
      entity.last_updated
    ]);
  }

  async searchSimilar(
    embedding: number[],
    userId: string,
    limit = 10,
    threshold = 0.7
  ): Promise<SimilarityResult[]> {
    const sql = `
      SELECT
        entity_id,
        entity_type,
        summary,
        keywords,
        1 - (embedding <=> $1::vector) as similarity
      FROM shadow_entities
      WHERE owner_user_id = $2
        AND 1 - (embedding <=> $1::vector) > $3
      ORDER BY embedding <=> $1::vector
      LIMIT $4
    `;

    const results = await db.execute(sql, [
      JSON.stringify(embedding),
      userId,
      threshold,
      limit
    ]);

    return results.map(r => ({
      entityId: r.entity_id,
      entityType: r.entity_type,
      summary: r.summary,
      keywords: r.keywords,
      similarity: r.similarity
    }));
  }

  async findRelated(
    fileId: string,
    userId: string,
    limit = 5
  ): Promise<RelatedContent[]> {
    // Get embedding for source file
    const source = await this.findByEntityId(fileId);
    if (!source) return [];

    // Find similar
    return this.searchSimilar(
      source.embedding,
      userId,
      limit + 1 // Include self
    ).then(results =>
      results.filter(r => r.entityId !== fileId)
    );
  }
}
```

### 3. Hybrid Search Service

```typescript
// hybridSearchService.ts
export class HybridSearchService {
  private weights = {
    vector: 0.6,
    text: 0.4,
    recency: 0.1
  };

  async search(
    query: string,
    userId: string,
    options: SearchOptions = {}
  ): Promise<HybridSearchResult[]> {
    // Parallel search
    const [vectorResults, textResults] = await Promise.all([
      this.vectorSearch(query, userId, options),
      this.textSearch(query, userId, options)
    ]);

    // Merge and score
    return this.fuseResults(vectorResults, textResults);
  }

  private async vectorSearch(
    query: string,
    userId: string,
    options: SearchOptions
  ): Promise<VectorResult[]> {
    // Generate query embedding
    const embedding = await embeddingService.generateEmbedding(query);

    // Search similar
    const results = await shadowRepo.searchSimilar(
      embedding,
      userId,
      options.limit || 20,
      options.threshold || 0.5
    );

    // Enhance with file data
    return Promise.all(
      results.map(async r => {
        const file = await fileRepo.findById(r.entityId);
        return {
          ...r,
          file,
          score: r.similarity * this.weights.vector
        };
      })
    );
  }

  private async textSearch(
    query: string,
    userId: string,
    options: SearchOptions
  ): Promise<TextResult[]> {
    const results = await fileRepo.searchContent(
      query,
      userId,
      options
    );

    return results.map(r => ({
      ...r,
      score: r.rank * this.weights.text
    }));
  }

  private fuseResults(
    vectorResults: VectorResult[],
    textResults: TextResult[]
  ): HybridSearchResult[] {
    const merged = new Map<string, HybridSearchResult>();

    // Add vector results
    for (const vr of vectorResults) {
      merged.set(vr.entityId, {
        id: vr.entityId,
        file: vr.file,
        vectorScore: vr.score,
        textScore: 0,
        totalScore: vr.score,
        summary: vr.summary,
        excerpt: null
      });
    }

    // Merge text results
    for (const tr of textResults) {
      const existing = merged.get(tr.id);
      if (existing) {
        existing.textScore = tr.score;
        existing.totalScore = existing.vectorScore + tr.score;
        existing.excerpt = tr.excerpt;
      } else {
        merged.set(tr.id, {
          id: tr.id,
          file: tr.file,
          vectorScore: 0,
          textScore: tr.score,
          totalScore: tr.score,
          summary: null,
          excerpt: tr.excerpt
        });
      }
    }

    // Sort by total score
    return Array.from(merged.values())
      .sort((a, b) => b.totalScore - a.totalScore);
  }
}
```

### 4. Batch Processing Pipeline

```typescript
// embeddingPipeline.ts
export class EmbeddingPipeline {
  private queue: string[] = [];
  private processing = false;
  private readonly BATCH_SIZE = 100;
  private readonly RATE_LIMIT = 3000; // requests per minute

  async backfillEmbeddings(): Promise<void> {
    // Get files without embeddings
    const files = await this.getUnprocessedFiles();
    console.log(`Found ${files.length} files to process`);

    // Process in batches
    for (let i = 0; i < files.length; i += this.BATCH_SIZE) {
      const batch = files.slice(i, i + this.BATCH_SIZE);
      await this.processBatch(batch);

      // Rate limiting
      await this.delay(60000 / this.RATE_LIMIT * this.BATCH_SIZE);

      // Progress
      console.log(`Processed ${i + batch.length}/${files.length}`);
    }
  }

  private async processBatch(files: FileRecord[]): Promise<void> {
    // Prepare texts
    const texts = files.map(f =>
      embeddingService.prepareText(f.content)
    );

    // Generate embeddings
    const embeddings = await embeddingService.processBatch(texts);

    // Store in shadow entities
    await Promise.all(
      files.map((file, i) =>
        shadowRepo.upsert({
          entity_id: file.id,
          entity_type: 'file',
          owner_user_id: file.owner_user_id,
          embedding: embeddings[i],
          summary: this.generateSummary(file.content),
          keywords: this.extractKeywords(file.content),
          last_updated: new Date()
        })
      )
    );
  }

  private async getUnprocessedFiles(): Promise<FileRecord[]> {
    const sql = `
      SELECT f.*
      FROM files f
      LEFT JOIN shadow_entities se ON f.id = se.entity_id
      WHERE se.entity_id IS NULL
        AND f.content_type != 'chunk'
      ORDER BY f.created_at DESC
      LIMIT 10000
    `;
    return db.execute(sql);
  }
}
```

## Database Schema

### Shadow Entities Table
```sql
CREATE TABLE shadow_entities (
  shadow_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id),
  embedding vector(768),
  summary TEXT,
  keywords TEXT[],
  metadata JSONB,
  importance_score FLOAT DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_entity UNIQUE(entity_id, entity_type)
);

-- HNSW index for fast similarity search
CREATE INDEX shadow_entities_embedding_idx
ON shadow_entities
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Other indexes
CREATE INDEX idx_shadow_entities_owner ON shadow_entities(owner_user_id);
CREATE INDEX idx_shadow_entities_entity ON shadow_entities(entity_id, entity_type);
CREATE INDEX idx_shadow_entities_updated ON shadow_entities(last_updated DESC);
```

## API Endpoints

```typescript
// routes/search.ts
searchRoutes.post('/semantic', async (c) => {
  const { query, limit = 10 } = await c.req.json();
  const userId = c.get('userId');

  const results = await hybridSearch.search(query, userId, {
    limit,
    includeVector: true,
    includeText: true
  });

  return c.json({
    data: results,
    meta: {
      query,
      resultCount: results.length,
      searchType: 'hybrid'
    }
  });
});

searchRoutes.get('/related/:fileId', async (c) => {
  const fileId = c.req.param('fileId');
  const userId = c.get('userId');

  const related = await shadowRepo.findRelated(fileId, userId);

  return c.json({
    data: related,
    meta: {
      sourceFile: fileId,
      count: related.length
    }
  });
});
```

## Performance Optimizations

### Embedding Cache
```typescript
class EmbeddingCache {
  private cache = new LRUCache<string, number[]>({
    max: 1000,
    ttl: 3600000 // 1 hour
  });

  get(text: string): number[] | undefined {
    return this.cache.get(this.hash(text));
  }

  set(text: string, embedding: number[]): void {
    this.cache.set(this.hash(text), embedding);
  }
}
```

### Query Optimization
```sql
-- Approximate search for better performance
SET LOCAL hnsw.ef_search = 40; -- Lower for speed

-- Limit search space with pre-filtering
SELECT * FROM shadow_entities
WHERE owner_user_id = $1
  AND created_at > NOW() - INTERVAL '6 months'
ORDER BY embedding <=> $2
LIMIT 20;
```

## Success Criteria

- ✅ All files have embeddings
- ✅ Semantic search < 200ms
- ✅ Relevance improved 30%+
- ✅ Cost < $5/month
- ✅ No API rate limits hit