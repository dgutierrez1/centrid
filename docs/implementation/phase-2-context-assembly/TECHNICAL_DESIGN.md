# Phase 2: Technical Design - Context Assembly Integration

## Architecture Overview

Phase 2 transforms the context assembly from a simple thread history retriever into an intelligent system that searches, scores, and optimizes content from the entire knowledge base.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Agent Request                             │
│                         ↓                                    │
│              ┌──────────────────┐                           │
│              │  Query Analyzer   │                           │
│              └──────────────────┘                           │
│                         ↓                                    │
│         ┌──────────────────────────────┐                    │
│         │   Parallel Retrieval         │                    │
│         ├────────────┬─────────────────┤                    │
│         │  Explicit  │  File Search    │ Thread History     │
│         │ References │  (Full-text)    │   (Recent)        │
│         └────────────┴─────────────────┘                    │
│                         ↓                                    │
│              ┌──────────────────┐                           │
│              │ Relevance Scorer  │                           │
│              └──────────────────┘                           │
│                         ↓                                    │
│              ┌──────────────────┐                           │
│              │ Token Optimizer   │                           │
│              └──────────────────┘                           │
│                         ↓                                    │
│              ┌──────────────────┐                           │
│              │ Context Formatter │                           │
│              └──────────────────┘                           │
│                         ↓                                    │
│                  Prime Context                               │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Enhanced Context Assembly Service

```typescript
// contextAssemblyService.ts
import { FileRepository } from '../repositories/file';
import { ContextReferenceRepository } from '../repositories/contextReference';
import { MessageRepository } from '../repositories/message';
import { RelevanceScorer } from './relevanceScorer';
import { TokenOptimizer } from './tokenOptimizer';

export interface ContextItem {
  id: string;
  type: 'file' | 'chunk' | 'message' | 'reference';
  content: string;
  excerpt?: string;
  source: string;
  relevance: number;
  tokens: number;
  metadata: {
    path?: string;
    createdAt?: Date;
    matchedKeywords?: string[];
    searchRank?: number;
  };
}

export interface PrimeContext {
  totalTokens: number;
  items: ContextItem[];
  citations: Citation[];
  stats: {
    explicitCount: number;
    searchCount: number;
    historyCount: number;
    excludedCount: number;
  };
}

export class ContextAssemblyService {
  private cache = new Map<string, CachedContext>();
  private readonly CACHE_TTL = 30000; // 30 seconds
  private readonly MAX_TOKENS = 4000; // Reserve space for response
  private readonly SYSTEM_PROMPT_TOKENS = 500;

  constructor(
    private fileRepo: FileRepository,
    private contextRefRepo: ContextReferenceRepository,
    private messageRepo: MessageRepository,
    private scorer: RelevanceScorer,
    private optimizer: TokenOptimizer
  ) {}

  async buildPrimeContext(
    threadId: string,
    userMessage: string,
    userId: string
  ): Promise<PrimeContext> {
    // Check cache
    const cached = this.getCached(threadId);
    if (cached && this.isCacheValid(cached)) {
      return cached.context;
    }

    // Step 1: Parallel retrieval
    const [explicit, searched, history] = await Promise.all([
      this.getExplicitReferences(threadId, userId),
      this.searchRelevantFiles(userMessage, userId),
      this.getThreadHistory(threadId, 20)
    ]);

    // Step 2: Score all items
    const scoredItems = await this.scoreItems(
      [...explicit, ...searched, ...history],
      userMessage
    );

    // Step 3: Optimize for token budget
    const optimized = await this.optimizer.optimize(
      scoredItems,
      this.MAX_TOKENS - this.SYSTEM_PROMPT_TOKENS
    );

    // Step 4: Generate citations
    const citations = this.generateCitations(optimized.selected);

    // Step 5: Format context
    const context: PrimeContext = {
      totalTokens: optimized.totalTokens,
      items: optimized.selected,
      citations,
      stats: {
        explicitCount: explicit.length,
        searchCount: searched.length,
        historyCount: history.length,
        excludedCount: optimized.excluded.length
      }
    };

    // Cache result
    this.cache.set(threadId, {
      context,
      timestamp: Date.now()
    });

    return context;
  }

  private async searchRelevantFiles(
    query: string,
    userId: string
  ): Promise<ContextItem[]> {
    // Search with multiple strategies
    const [fullText, keywords, fuzzy] = await Promise.all([
      this.fileRepo.searchContent(query, userId, { limit: 10 }),
      this.fileRepo.searchByKeywords(this.extractKeywords(query), userId),
      this.fileRepo.fuzzySearch(query, userId, { limit: 5 })
    ]);

    // Merge and deduplicate
    const merged = this.mergeSearchResults(fullText, keywords, fuzzy);

    // Convert to context items
    return merged.map(result => ({
      id: result.id,
      type: 'file' as const,
      content: result.excerpt || result.content.substring(0, 500),
      excerpt: result.excerpt,
      source: result.path,
      relevance: 0, // Will be scored later
      tokens: this.estimateTokens(result.excerpt || result.content),
      metadata: {
        path: result.path,
        createdAt: result.createdAt,
        searchRank: result.rank
      }
    }));
  }

  private extractKeywords(query: string): string[] {
    // Simple keyword extraction
    // In production, use NLP library
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !STOP_WORDS.includes(word));
  }

  private estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    // For production, use tiktoken library
    return Math.ceil(text.length / 4);
  }
}
```

### 2. Relevance Scoring System

```typescript
// relevanceScorer.ts
export class RelevanceScorer {
  private readonly weights = {
    textSimilarity: 0.35,
    keywordMatch: 0.25,
    recency: 0.15,
    sourcePriority: 0.15,
    usageFrequency: 0.10
  };

  async scoreItems(
    items: ContextItem[],
    query: string
  ): Promise<ContextItem[]> {
    const queryKeywords = this.extractKeywords(query);

    return Promise.all(
      items.map(async item => {
        const scores = {
          textSimilarity: this.calculateTextSimilarity(item.content, query),
          keywordMatch: this.calculateKeywordMatch(item, queryKeywords),
          recency: this.calculateRecencyScore(item),
          sourcePriority: this.getSourcePriority(item),
          usageFrequency: await this.getUsageFrequency(item)
        };

        const totalScore = Object.entries(scores).reduce(
          (sum, [key, score]) => sum + score * this.weights[key],
          0
        );

        return {
          ...item,
          relevance: totalScore
        };
      })
    );
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    // Implement cosine similarity on TF-IDF vectors
    const tfidf1 = this.calculateTFIDF(text1);
    const tfidf2 = this.calculateTFIDF(text2);
    return this.cosineSimilarity(tfidf1, tfidf2);
  }

  private calculateKeywordMatch(
    item: ContextItem,
    keywords: string[]
  ): number {
    const content = item.content.toLowerCase();
    const matchCount = keywords.filter(kw => content.includes(kw)).length;
    return matchCount / keywords.length;
  }

  private calculateRecencyScore(item: ContextItem): number {
    if (!item.metadata?.createdAt) return 0.5;

    const ageInHours = (Date.now() - item.metadata.createdAt.getTime()) / 3600000;
    // Exponential decay: score = e^(-λt)
    const lambda = 0.01; // Decay rate
    return Math.exp(-lambda * ageInHours);
  }

  private getSourcePriority(item: ContextItem): number {
    const priorities = {
      reference: 1.0,  // Explicit references
      file: 0.7,       // Searched files
      chunk: 0.6,      // File chunks
      message: 0.5     // Thread messages
    };
    return priorities[item.type] || 0.3;
  }

  private async getUsageFrequency(item: ContextItem): Promise<number> {
    // Track how often this content has been useful
    // Implement with usage tracking table
    const usageCount = await this.getUsageCount(item.id);
    return Math.min(1, usageCount / 10); // Normalize to 0-1
  }

  private calculateTFIDF(text: string): Map<string, number> {
    const words = text.toLowerCase().split(/\s+/);
    const tf = new Map<string, number>();
    const totalWords = words.length;

    // Calculate term frequency
    for (const word of words) {
      tf.set(word, (tf.get(word) || 0) + 1);
    }

    // Normalize by total words
    for (const [word, count] of tf) {
      tf.set(word, count / totalWords);
    }

    // In production, multiply by IDF from corpus
    return tf;
  }

  private cosineSimilarity(
    vec1: Map<string, number>,
    vec2: Map<string, number>
  ): number {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    // Get all unique words
    const allWords = new Set([...vec1.keys(), ...vec2.keys()]);

    for (const word of allWords) {
      const val1 = vec1.get(word) || 0;
      const val2 = vec2.get(word) || 0;
      dotProduct += val1 * val2;
      norm1 += val1 * val1;
      norm2 += val2 * val2;
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }
}
```

### 3. Token Optimization Engine

```typescript
// tokenOptimizer.ts
export interface OptimizationResult {
  selected: ContextItem[];
  excluded: ContextItem[];
  totalTokens: number;
}

export class TokenOptimizer {
  private readonly MIN_DIVERSITY_SCORE = 0.3;

  optimize(
    items: ContextItem[],
    maxTokens: number
  ): OptimizationResult {
    // Sort by relevance/token ratio (value density)
    const sorted = [...items].sort((a, b) => {
      const ratioA = a.relevance / Math.max(1, a.tokens);
      const ratioB = b.relevance / Math.max(1, b.tokens);
      return ratioB - ratioA;
    });

    const selected: ContextItem[] = [];
    const excluded: ContextItem[] = [];
    let totalTokens = 0;

    // Track diversity
    const typeCount = new Map<string, number>();

    for (const item of sorted) {
      // Check token budget
      if (totalTokens + item.tokens > maxTokens) {
        excluded.push(item);
        continue;
      }

      // Check diversity (don't let one type dominate)
      const currentTypeCount = typeCount.get(item.type) || 0;
      const totalSelected = selected.length;

      if (totalSelected > 5 && currentTypeCount / totalSelected > 0.7) {
        // Skip if this type is over-represented
        excluded.push(item);
        continue;
      }

      // Add item
      selected.push(item);
      totalTokens += item.tokens;
      typeCount.set(item.type, currentTypeCount + 1);

      // Early exit if we have enough high-quality context
      if (totalTokens > maxTokens * 0.9 && selected.length >= 10) {
        break;
      }
    }

    // Ensure minimum context even if tokens are tight
    if (selected.length === 0 && items.length > 0) {
      selected.push(items[0]);
      totalTokens = items[0].tokens;
    }

    return {
      selected,
      excluded: [...excluded, ...sorted.slice(selected.length + excluded.length)],
      totalTokens
    };
  }

  // Alternative: Dynamic programming approach for optimal selection
  optimizeDP(items: ContextItem[], maxTokens: number): OptimizationResult {
    const n = items.length;
    const dp = Array(n + 1).fill(null).map(() =>
      Array(maxTokens + 1).fill(0)
    );

    // Build DP table
    for (let i = 1; i <= n; i++) {
      const item = items[i - 1];
      for (let w = 0; w <= maxTokens; w++) {
        if (item.tokens <= w) {
          dp[i][w] = Math.max(
            dp[i - 1][w],
            dp[i - 1][w - item.tokens] + item.relevance
          );
        } else {
          dp[i][w] = dp[i - 1][w];
        }
      }
    }

    // Backtrack to find selected items
    const selected: ContextItem[] = [];
    let w = maxTokens;
    for (let i = n; i > 0 && w > 0; i--) {
      if (dp[i][w] !== dp[i - 1][w]) {
        const item = items[i - 1];
        selected.push(item);
        w -= item.tokens;
      }
    }

    const selectedIds = new Set(selected.map(s => s.id));
    const excluded = items.filter(item => !selectedIds.has(item.id));
    const totalTokens = selected.reduce((sum, item) => sum + item.tokens, 0);

    return { selected, excluded, totalTokens };
  }
}
```

### 4. Citation Management

```typescript
// citationManager.ts
export interface Citation {
  id: string;
  source: string;
  type: 'file' | 'document' | 'message';
  path?: string;
  excerpt?: string;
  relevance: number;
  usedInResponse: boolean;
}

export class CitationManager {
  private citations = new Map<string, Citation>();

  generateCitations(items: ContextItem[]): Citation[] {
    const citations: Citation[] = [];

    for (const item of items) {
      // Generate unique citation ID
      const citationId = this.generateCitationId(item);

      const citation: Citation = {
        id: citationId,
        source: item.source,
        type: item.type as any,
        path: item.metadata?.path,
        excerpt: item.excerpt,
        relevance: item.relevance,
        usedInResponse: false
      };

      citations.push(citation);
      this.citations.set(citationId, citation);
    }

    return citations;
  }

  private generateCitationId(item: ContextItem): string {
    // Simple ID generation
    // Format: [type-first3chars-hash]
    const prefix = item.type.substring(0, 3);
    const hash = this.hashCode(item.id).toString(36);
    return `[${prefix}-${hash}]`;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  formatCitationsForResponse(citations: Citation[]): string {
    const used = citations.filter(c => c.usedInResponse);
    if (used.length === 0) return '';

    const formatted = used.map(c =>
      `${c.id}: ${c.source}${c.excerpt ? ' - ' + c.excerpt.substring(0, 50) + '...' : ''}`
    ).join('\n');

    return `\n\n---\nSources:\n${formatted}`;
  }

  markAsUsed(citationId: string): void {
    const citation = this.citations.get(citationId);
    if (citation) {
      citation.usedInResponse = true;
    }
  }
}
```

### 5. Updated File Repository

```typescript
// fileRepository.ts (additions)
export class FileRepository {
  // Add new search methods for Phase 2

  async searchByKeywords(
    keywords: string[],
    userId: string,
    limit = 10
  ): Promise<SearchResult[]> {
    const keywordQuery = keywords
      .map(kw => `'${kw}'`)
      .join(' & ');

    const sql = `
      SELECT
        id,
        path,
        content,
        ts_rank(search_vector, to_tsquery('english', $1)) as rank,
        ts_headline(
          'english',
          content,
          to_tsquery('english', $1),
          'StartSel=<<<, StopSel=>>>'
        ) as excerpt
      FROM files
      WHERE owner_user_id = $2
        AND search_vector @@ to_tsquery('english', $1)
        AND content_type != 'chunk'
      ORDER BY rank DESC
      LIMIT $3
    `;

    return db.execute(sql, [keywordQuery, userId, limit]);
  }

  async fuzzySearch(
    query: string,
    userId: string,
    options: { limit?: number; threshold?: number } = {}
  ): Promise<SearchResult[]> {
    const limit = options.limit || 5;
    const threshold = options.threshold || 0.3;

    const sql = `
      SELECT
        id,
        path,
        content,
        similarity(path, $1) as path_similarity,
        similarity(content, $1) as content_similarity,
        GREATEST(
          similarity(path, $1),
          similarity(content, $1)
        ) as rank
      FROM files
      WHERE owner_user_id = $2
        AND (
          similarity(path, $1) > $3 OR
          similarity(content, $1) > $3
        )
        AND content_type != 'chunk'
      ORDER BY rank DESC
      LIMIT $4
    `;

    return db.execute(sql, [query, userId, threshold, limit]);
  }

  async getRecentlyAccessed(
    userId: string,
    limit = 5
  ): Promise<FileRecord[]> {
    return db
      .select()
      .from(files)
      .where(
        and(
          eq(files.ownerUserId, userId),
          ne(files.contentType, 'chunk')
        )
      )
      .orderBy(desc(files.accessedAt))
      .limit(limit);
  }

  async updateAccessTime(fileId: string): Promise<void> {
    await db
      .update(files)
      .set({ accessedAt: new Date() })
      .where(eq(files.id, fileId));
  }
}
```

## API Updates

### Context Endpoint

```typescript
// routes/context.ts
export const contextRoutes = new Hono<{ Variables: AppContext }>();

// Get context for message
contextRoutes.post('/build', async (c) => {
  const userId = c.get('userId');
  const { threadId, message } = await c.req.json();

  const context = await contextAssemblyService.buildPrimeContext(
    threadId,
    message,
    userId
  );

  return c.json({
    data: context,
    meta: {
      tokenUsage: context.totalTokens,
      sourceCount: context.items.length,
      citationCount: context.citations.length
    }
  });
});

// Provide feedback on context usefulness
contextRoutes.post('/feedback', async (c) => {
  const { contextItemId, useful } = await c.req.json();

  await contextService.recordFeedback(contextItemId, useful);

  return c.json({ success: true });
});
```

## Performance Optimizations

### Caching Strategy
```typescript
class ContextCache {
  private cache = new LRUCache<string, CachedContext>({
    max: 100, // Max entries
    ttl: 30000, // 30 second TTL
    updateAgeOnGet: true
  });

  get(key: string): CachedContext | undefined {
    return this.cache.get(key);
  }

  set(key: string, context: CachedContext): void {
    this.cache.set(key, context);
  }

  invalidate(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
}
```

### Parallel Query Execution
```typescript
async function parallelRetrieval(
  threadId: string,
  message: string,
  userId: string
): Promise<RetrievalResults> {
  const promises = [
    fileRepo.searchContent(message, userId),
    contextRefRepo.findByThreadId(threadId),
    messageRepo.getRecent(threadId, 20),
    fileRepo.getRecentlyAccessed(userId, 5)
  ];

  const [searched, explicit, history, recent] = await Promise.all(promises);

  return {
    searched,
    explicit,
    history,
    recent
  };
}
```

## Testing Strategy

### Unit Tests
```typescript
describe('RelevanceScorer', () => {
  it('should score explicit references highest', async () => {
    const items = [
      { type: 'reference', content: 'test' },
      { type: 'file', content: 'test' }
    ];
    const scored = await scorer.scoreItems(items, 'test');
    expect(scored[0].relevance).toBeGreaterThan(scored[1].relevance);
  });
});

describe('TokenOptimizer', () => {
  it('should respect token budget', () => {
    const items = generateTestItems(20, 100); // 20 items, 100 tokens each
    const result = optimizer.optimize(items, 500);
    expect(result.totalTokens).toBeLessThanOrEqual(500);
  });
});
```

## Monitoring & Metrics

```typescript
interface ContextMetrics {
  assemblyTime: number;
  itemsRetrieved: number;
  itemsSelected: number;
  tokenUsage: number;
  cacheHitRate: number;
  searchLatency: number;
  scoringLatency: number;
  optimizationLatency: number;
}

function trackMetrics(metrics: ContextMetrics): void {
  // Send to monitoring service
  logger.info('Context assembly metrics', metrics);
  prometheus.histogram('context_assembly_time').observe(metrics.assemblyTime);
  prometheus.gauge('context_token_usage').set(metrics.tokenUsage);
}
```

## Success Criteria

- ✅ Context assembly includes relevant files
- ✅ Response time < 300ms
- ✅ Token budget never exceeded
- ✅ Citations properly formatted
- ✅ Relevance scoring accurate
- ✅ Cache hit rate > 30%
- ✅ User satisfaction improved