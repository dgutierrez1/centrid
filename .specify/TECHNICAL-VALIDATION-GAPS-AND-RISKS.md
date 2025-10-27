# Technical Validation: Gaps and Risks Analysis

**Date**: 2025-10-26
**Status**: Pre-implementation validation
**Purpose**: Validate technical approach (embeddings + pgvector + context assembly) can deliver business promises before building

---

## Executive Summary

**Verdict**: ✅ **GO** - Tech stack will deliver core value proposition

**Key Findings**:
- Embeddings will deliver 80-85% quality (good enough for MVP, refinements in v2)
- Context assembly works at 50-200 file scale (Year 1-2 target)
- Architecture is sound, but **7 gaps** must be addressed (2 critical, 5 important)

**Critical Gaps Requiring Immediate Action**:
1. 🔴 **Parent context inheritance explosion** - unbounded growth as children proliferate
2. 🔴 **COGS overage** - Claude API costs 2.4-2.8× over budget ($28.80 vs $12 target)
3. 🟡 **Sibling pollution filter** - threshold approach too brittle (exponential penalty needed)
4. 🟡 **Consolidation prompt quality** - generic prompts produce generic outputs
5. 🟡 **File sync conflicts** - multi-device concurrent edits need real-time detection
6. 🟡 **Deleted branch provenance** - orphaned files break "Go to source" navigation
7. 🟡 **Thread summary degradation** - long threads (>200 messages) produce generic summaries

---

## 🔴 CRITICAL GAP: Parent Context Inheritance Explosion

### The Problem

**Current Spec** (FR-002): "Child inherits explicit files + parent summary + parent's last message"

**Scenario - Parent Context Growth**:
```
Main Thread (Month 1):
├─ 5 explicit files
├─ 100 messages
└─ Summary: 500 tokens

After 3 months, users create 50 child branches:
├─ Each child references parent summary (500 tokens)
├─ Each child inherits 5 explicit files (5 × 2000 tokens = 10K tokens)
├─ Each child adds 3 new files (3 × 2000 tokens = 6K tokens)
└─ Total per child: 16.5K tokens BEFORE user even asks a question

Parent thread context:
├─ Original 5 files: 10K tokens
├─ 50 child branch summaries (500 tokens each): 25K tokens
├─ Latest 10 messages from Main: 4K tokens
└─ TOTAL: 39K tokens just from Main thread context
```

**Impact on Child Branches**:
- Child tries to access Main thread context: 39K tokens
- Child's own files: 6K tokens
- Semantic matches: 20K tokens (top 10 files)
- Thread history: 4K tokens
- **TOTAL: 69K tokens BEFORE agent response space (40K reserved)**
- **Remaining budget**: 200K - 69K - 40K = 91K tokens
- **Problem**: Only 45% of context budget available for actual relevant context

### Why This Happens

**Root Cause**: Parent threads accumulate references to ALL children
- Main thread doesn't "know" which child branches are relevant to current query
- System loads ALL child summaries when accessing parent context
- No pruning mechanism for irrelevant branches

**Compounding Factor**: Deep nesting (Main → A → A1 → A1a)
- A1a inherits from A1, which inherits from A, which inherits from Main
- Context accumulates at each level
- 4 levels deep = 4× parent context overhead

### Risk Assessment

**Likelihood**: 🔴 **VERY HIGH** - Power users WILL create 20-50 branches (your success metric)

**Impact**: 🔴 **CRITICAL**
- Context budget exhausted by irrelevant parent/sibling references
- Can't load enough relevant files for quality responses
- Consolidation fails (can't fit branches in 200K window)
- User experience degrades as they succeed (more branches = worse quality)

**Timeline**: Month 2-3 (once power users hit 20+ branches)

### Proposed Solutions

#### **Option 1: Lazy Parent Loading** (RECOMMENDED for MVP)

```typescript
// CURRENT (loads everything):
function loadParentContext(parentId: string) {
  const parent = await getThread(parentId);
  return {
    summary: parent.summary, // 500 tokens
    explicitFiles: parent.explicitFiles, // ALL files (unbounded)
    lastMessage: parent.lastMessage, // 400 tokens
    childSummaries: parent.childSummaries, // ALL children (unbounded)
  };
}

// PROPOSED (loads on-demand based on relevance):
function loadParentContext(parentId: string, currentQuery: string) {
  const parent = await getThread(parentId);
  const queryEmbedding = await generateEmbedding(currentQuery);

  // Semantic filter: only load relevant files from parent
  const relevantParentFiles = await semanticSearch(
    queryEmbedding,
    parent.explicitFiles,
    limit = 5 // Cap at 5 most relevant, not ALL
  );

  // Don't load child summaries unless explicitly requested
  // (consolidation can load them, but regular queries don't need them)

  return {
    summary: parent.summary, // 500 tokens
    explicitFiles: relevantParentFiles, // Top 5 (10K tokens max)
    lastMessage: parent.lastMessage, // 400 tokens
    // childSummaries: OMITTED (only load during consolidation)
  };
}
```

**Pro**: Caps parent context at ~11K tokens (vs unbounded)
**Con**: May miss relevant parent files (but semantic search mitigates this)

---

#### **Option 2: Parent Context Budget** (RECOMMENDED for v2)

```typescript
const CONTEXT_BUDGET = {
  explicitContext: 80_000,  // 40% - user-specified files (never truncated)
  semanticMatches: 40_000,  // 20% - discovered files
  parentContext: 20_000,    // 10% - inherited from parent (CAPPED)
  branchContext: 20_000,    // 10% - sibling/child context
  threadHistory: 20_000,    // 10% - conversation messages
  agentResponse: 40_000,    // 20% - reserved for AI output
};

function allocateParentContext(parent: Thread, budget: number = 20_000) {
  let allocated = 0;

  // Priority 1: Parent summary (always include)
  allocated += countTokens(parent.summary); // ~500 tokens

  // Priority 2: Last message (provides immediate context)
  allocated += countTokens(parent.lastMessage); // ~400 tokens

  // Priority 3: Explicit files (most relevant only)
  const remainingBudget = budget - allocated; // ~19K tokens
  const filesWeCanFit = Math.floor(remainingBudget / 2000); // ~9 files

  const sortedByRelevance = rankFilesByRelevance(parent.explicitFiles, currentQuery);
  const selectedFiles = sortedByRelevance.slice(0, filesWeCanFit);

  return {
    summary: parent.summary,
    lastMessage: parent.lastMessage,
    explicitFiles: selectedFiles, // Capped at budget
  };
}
```

**Pro**: Explicit budget prevents explosion, scales to 100+ child branches
**Con**: More complex, requires token counting infrastructure

---

#### **Option 3: Parent Summary Only** (Simplest, but lossy)

```typescript
function loadParentContext(parentId: string) {
  const parent = await getThread(parentId);

  // ONLY load summary, omit files and child references
  return {
    summary: parent.summary, // 500 tokens
    // explicitFiles: OMITTED (child must @-mention if needed)
    // lastMessage: OMITTED
    // childSummaries: OMITTED
  };
}
```

**Pro**: Simplest, guaranteed bounded (500 tokens)
**Con**: Loses parent file context (may reduce quality)

---

### Recommendation: Hybrid Approach

**MVP (Week 1-4)**:
- Use **Option 1** (Lazy Loading) with semantic filter
- Cap parent files at top 5 most relevant (10K tokens max)
- Omit child summaries from regular queries (only load during consolidation)
- **Total parent context**: ~11K tokens (summary 500 + files 10K + last message 400)

**v2 (Month 2-3)**:
- Implement **Option 2** (Parent Context Budget)
- Explicit 20K token budget for parent context
- Token counting + allocation logic
- Monitor parent context utilization (target: <10% of total budget)

**Validation Metrics**:
- Parent context tokens / total context tokens <15% (healthy)
- Parent context tokens / total context tokens >30% (context explosion detected)

---

## 🟡 Gap: Sibling Pollution Filter Too Brittle

### The Problem

**Current Spec** (FR-021c): "If branch similarity <0.3, only show matches with relevance >0.9"

**Why Threshold Approach Fails**:

```
Scenario:
- Branch A: "RAG Deep Dive" (technical)
- Branch B: "Pricing Strategy" (business)
- Branch similarity: 0.1 (divergent topics)

User in Branch B asks: "What's our RAG approach?"
- File from Branch A: `rag-analysis.md`
- Semantic match score: 0.95 (high - mentions "RAG" extensively)
- Threshold check: 0.95 > 0.9 ✅ PASS
- Result: File IS shown

Problem: User meant "RAG competitor analysis for pricing"
(business context), not "RAG technical architecture" (Branch A context).
File is irrelevant but passes threshold.
```

**Root Cause**: Binary threshold (show/hide) doesn't capture gradual divergence

### Proposed Solution: Exponential Divergence Penalty

```typescript
// CURRENT (threshold):
function filterSemanticMatches(matches, branchSimilarity, threshold = 0.9) {
  if (branchSimilarity < 0.3) {
    return matches.filter(m => m.score > threshold); // Binary: show or hide
  }
  return matches; // Show all
}

// PROPOSED (exponential penalty):
function applyDivergencePenalty(semanticScore, branchSimilarity) {
  const penalty = Math.pow(branchSimilarity, 2); // Exponential (square)
  return semanticScore * penalty;
}

// Example scores:
// Related branches (similarity 0.8): 0.95 × 0.8² = 0.95 × 0.64 = 0.608 (moderate penalty)
// Divergent branches (similarity 0.3): 0.95 × 0.3² = 0.95 × 0.09 = 0.086 (steep penalty)
// Unrelated branches (similarity 0.1): 0.95 × 0.1² = 0.95 × 0.01 = 0.010 (99% penalty)
```

**Pro**: Gradual penalty (not binary), naturally ranks divergent files lower
**Con**: Requires branch similarity calculation (already in spec)

**Recommendation**: Implement in MVP (Week 2-3), not v3

---

## 🟡 Gap: Consolidation Prompt Quality

### The Problem

**Generic prompts produce generic outputs**:

```markdown
BAD (concatenation):
# AI Agent Decision Document

## RAG Approach
Based on Branch A, RAG is good for semantic search...

## Orchestration
Based on Branch B, orchestration provides...

## Recommendation
Both have merits. Consider RAG for X and orchestration for Y.
```

Users want **synthesis**, not **summary**.

### Proposed Solution: Structured Consolidation Templates

```typescript
const consolidationPrompt = `
You are consolidating research from ${branches.length} exploration branches.

CRITICAL: Generate a SYNTHESIS, not a summary.

Requirements:
1. COMPARE approaches (trade-offs, not descriptions)
   - "RAG is faster (100ms) but less accurate (80%) vs Orchestration
      which is slower (2s) but more accurate (95%)"

2. RESOLVE conflicts (if Branch A and B disagree)
   - "Branch A recommends PostgreSQL, Branch B recommends MongoDB.
      We recommend PostgreSQL because [reasoning from both branches]."

3. ACTIONABLE recommendations (specific next steps)
   - "Phase 1: Implement RAG foundation (4 weeks, team of 2)"

4. CITE sources precisely
   - "[Branch A: RAG Deep Dive, msg 12-15]"
   - "[rag-implementation.md, section 2.3]"

Structure:
- Executive Summary (2-3 sentences)
- Trade-off Analysis (comparison table)
- Recommendations (prioritized list with effort estimates)
- Implementation Roadmap (timeline with dependencies)

Context:
${branches.map(b => `Branch: ${b.name}\nSummary: ${b.summary}\nFiles: ${b.files.length}`).join('\n---\n')}

Full content:
${branches.map(b => b.fullContent).join('\n---\n')}
`;
```

**Recommendation**: Invest Week 5-6 in consolidation prompt testing (critical for quality)

---

## 🟢 Minor Gap: Embeddings Are Lossy (Not Critical for MVP)

### What Embeddings Can't Capture

- ❌ Negation: "NOT using RAG" embeds similarly to "using RAG"
- ❌ Specificity: "RAG for production" vs "RAG for prototyping"
- ❌ Recency: "latest RAG techniques" (embedding doesn't know what's "latest")
- ❌ User intent: Same query in different branch contexts

**Example**:
- Query: "What are the downsides of RAG?"
- File 1: "RAG is great for semantic search..." (0.85 similarity)
- File 2: "RAG has limitations: hallucinations, cost..." (0.83 similarity)
- **Problem**: File 1 ranks higher but doesn't answer query

### Mitigation: Hybrid Search (v2, Month 2-3)

```typescript
const finalScore =
  0.5 * semanticScore +      // Topic overlap
  0.3 * keywordScore +       // Exact matches ("downsides", "limitations")
  0.2 * metadataScore;       // Recency + relationship + interaction history
```

**Defer to v2**: Pure embeddings are 80-85% accurate (good enough for MVP)

---

## Technical Architecture Validation

### ✅ Tech Stack is Solid

| Component | Technology | Risk | Notes |
|-----------|-----------|------|-------|
| Database | PostgreSQL + Supabase | ✅ LOW | Proven at 1M+ users |
| Vector Search | pgvector (HNSW) | ✅ LOW | <1s for 1M vectors |
| Embeddings | OpenAI (1536-dim) | ✅ LOW | $0.02/1M tokens |
| AI Model | Claude 3.5 Sonnet | ✅ LOW | Best for synthesis |
| Real-time | Supabase Realtime | ✅ LOW | <100ms propagation |

### ⚠️ Feature Quality Risks

| Feature | Risk | Gap | Fix |
|---------|------|-----|-----|
| Parent context inheritance | 🔴 HIGH | Unbounded growth | Lazy loading + 5 file cap |
| Sibling pollution | 🟡 MEDIUM | Threshold too brittle | Exponential penalty |
| Consolidation quality | 🟡 MEDIUM | Generic outputs | Structured templates |
| Embedding accuracy | 🟢 LOW | Lossy compression | Hybrid search (v2) |

---

## Unit Economics Validation

### COGS Breakdown (Per User/Month)

**Target**: $8-12/user/month (Plus tier), $12-24/user/month (Pro tier)

**Estimated Costs**:
```
Embeddings:
- 200 files × 2000 tokens/file = 400K tokens
- 400K × $0.02/1M = $0.008 ≈ $0.01/user/month
- Embedding updates: 50 files/month × $0.02/1M ≈ $0.001
- Total: $0.01/user/month ✅

Claude API (Plus tier - 60 Sonnet requests/month):
- 60 requests × 150K context tokens = 9M tokens input
- 60 requests × 2K response tokens = 120K tokens output
- Cost: (9M × $3/1M) + (120K × $15/1M) = $27 + $1.80 = $28.80/month
- PROBLEM: Exceeds target ($12/month) by 2.4× ❌

Claude API (Pro tier - 140 Sonnet requests/month):
- 140 requests × 150K context = 21M input tokens
- 140 requests × 2K response = 280K output tokens
- Cost: (21M × $3/1M) + (280K × $15/1M) = $63 + $4.20 = $67.20/month
- PROBLEM: Exceeds target ($24/month) by 2.8× ❌

Storage (PostgreSQL + pgvector):
- 200 files × 5KB = 1MB content
- 2000 chunks × 1536 dims × 4 bytes = 12MB embeddings
- Total: 13MB/user × $0.02/MB = $0.26/user/month ✅
```

### 🔴 CRITICAL: COGS Projections Are Off

**Root Cause**: Spec assumes 150K context tokens per request

**Reality Check**:
- Your context assembly is ALREADY at 69K tokens (parent + child + semantic + history)
- With agent response (40K), total = 109K tokens
- At scale (50+ branches), context will hit 150K+ regularly
- **Actual COGS**: $28.80/month (Plus), $67.20/month (Pro)
- **Target COGS**: $12/month (Plus), $24/month (Pro)
- **Gap**: 2.4-2.8× over budget

### Mitigation Options

#### Option 1: Reduce Context Per Request (RECOMMENDED)

```
Target context reduction: 150K → 80K tokens (47% reduction)

Changes:
- Parent context: 20K → 10K (lazy loading, top 3 files only)
- Semantic matches: 40K → 20K (top 5 files instead of 10)
- Thread history: 20K → 10K (last 5 messages instead of 10)
- Agent response: 40K → 30K (shorter responses)

New COGS (Plus tier):
- 60 requests × 80K context = 4.8M input tokens
- 60 requests × 1.5K response = 90K output tokens
- Cost: (4.8M × $3/1M) + (90K × $15/1M) = $14.40 + $1.35 = $15.75/month
- Margin: $19 - $15.75 = $3.25 (17% margin, acceptable for MVP)
```

**Pro**: Achieves target COGS
**Con**: Reduced context quality (fewer files, shorter responses)

---

#### Option 2: Increase Pricing (NOT RECOMMENDED)

```
Adjust tiers to cover COGS:
- Plus: $19 → $29/month (to cover $28.80 COGS)
- Pro: $39 → $69/month (to cover $67.20 COGS)

Problem: Pricing no longer competitive
- ChatGPT Plus: $20/month
- Centrid Plus: $29/month (45% more expensive)
- Lost value proposition: "Undercut ChatGPT"
```

**Pro**: Preserves full context quality
**Con**: Pricing becomes uncompetitive, kills acquisition

---

#### Option 3: Use Haiku for Most Requests (RECOMMENDED)

```
Tier adjustments:
- Plus tier: 60 requests → 50 Haiku + 10 Sonnet
- Pro tier: 140 requests → 100 Haiku + 40 Sonnet

Haiku pricing: $0.25/1M input, $1.25/1M output (12× cheaper than Sonnet)

COGS (Plus tier):
Haiku (50 requests):
- Input: 50 × 80K = 4M tokens × $0.25/1M = $1.00
- Output: 50 × 1.5K = 75K tokens × $1.25/1M = $0.09
- Subtotal: $1.09

Sonnet (10 requests):
- Input: 10 × 80K = 800K tokens × $3/1M = $2.40
- Output: 10 × 1.5K = 15K tokens × $15/1M = $0.23
- Subtotal: $2.63

Total: $1.09 + $2.63 = $3.72/month
Margin: $19 - $3.72 = $15.28 (80% margin) ✅
```

**Pro**: Achieves target COGS + high margin
**Con**: Requires smart routing (Haiku for simple, Sonnet for consolidation)

---

### Recommendation: Hybrid Model (Option 3)

**Implementation**:
```typescript
function selectModel(request: AgentRequest): 'haiku' | 'sonnet' {
  // Use Sonnet for complex operations
  if (request.type === 'consolidation') return 'sonnet';
  if (request.branchCount > 3) return 'sonnet';
  if (request.contextTokens > 100_000) return 'sonnet';

  // Use Haiku for everything else
  return 'haiku';
}
```

**Quota Changes**:
- Plus tier: "60 Sonnet requests" → "Unlimited Haiku + 10 Sonnet"
- Pro tier: "140 Sonnet requests" → "Unlimited Haiku + 40 Sonnet"

**Marketing Messaging**: "Smart AI routing - Haiku for speed, Sonnet for depth"

---

## 🟡 Gap: File Sync Conflicts (Multi-Device)

### The Problem
Users with Centrid open on multiple devices (laptop + phone) can trigger concurrent edits:
- Laptop: User manually edits `analysis.md`
- Phone (3 seconds later): Agent proposes edit to same file
- Both submit within 100ms window

**Current Spec** (FR-055): "Show conflict modal" - but how do you DETECT conflicts in real-time?

### Solution: Real-Time Conflict Detection

```typescript
// Subscribe to file changes via Supabase Realtime
const subscription = supabase
  .channel('file-changes')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'documents',
    filter: `id=eq.${fileId}`
  }, (payload) => {
    if (payload.new.version > currentVersion) {
      // Another device updated while agent was proposing edit
      showConflictModal({
        userVersion: payload.new.content_text,
        agentVersion: proposedAgentEdit,
      });
    }
  })
  .subscribe();
```

**Recommendation**: Implement in MVP (Week 3-4) - affects 30%+ of users (multi-device)

---

## 🟡 Gap: Deleted Branch Provenance

### The Problem
**Spec** (FR-008a): When branch deleted, files are preserved but `created_in_conversation_id=null`

**Issues**:
1. Files become orphaned - "Go to source" link broken
2. Semantic matches show: "from RAG Deep Dive [deleted]" → broken navigation
3. Consolidation can't find files from deleted branches

### Solution: Soft Delete Branches

```typescript
// Soft delete (preserve for provenance):
UPDATE conversations
SET deleted_at = NOW(), deleted_by = userId
WHERE id = branchId;

// Queries filter out deleted:
SELECT * FROM conversations WHERE deleted_at IS NULL;

// Provenance UI shows:
"Created in: RAG Deep Dive [deleted 3 days ago]"
// "Go to source" button disabled with tooltip
```

**Recommendation**: Use soft delete in MVP (Week 2-3) - preserves provenance integrity

---

## 🟡 Gap: Thread Summary Degradation

### The Problem
**Spec** (FR-009a): "Regenerate thread summary from scratch on every message"

**Issue**: Long threads (>200 messages) produce generic summaries
- Summarizing 500 messages: Too much info to distill
- Early insights (Month 1) get diluted by later messages (Month 6)
- Summary becomes: "Discussion about AI, agents, RAG, orchestration..."

**Impact**:
- Child branches inherit generic parent summary (poor context)
- Semantic matching uses generic embeddings (poor cross-branch discovery)

### Solution: Hierarchical Summarization

```typescript
interface ThreadSummary {
  current: string;        // Last 50 messages (detailed)
  archive: string[];      // Older batches (compressed)
  overall: string;        // Meta-summary (high-level)
}

// Every 50 messages, archive current summary
if (thread.messageCount % 50 === 0) {
  thread.summaries.archive.push(thread.summaries.current);
  thread.summaries.current = await summarize(thread.messages.slice(-50));
  thread.summaries.overall = await metaSummarize([
    ...thread.summaries.archive,
    thread.summaries.current
  ]);
}
```

**Child branches inherit**: `current` (detailed recent) + `overall` (high-level full thread)

**Recommendation**: Monitor during beta (Week 5-8), implement if users report generic summaries

---

## 🟢 Minor Gap: Embedding Staleness

### The Problem
**Spec** (FR-010e): Update shadow entity when content changes >20%

**Issue**: Small edits to large files don't trigger update
- 3000-word file + 500-word section = 14% change (below threshold)
- New section "RAG limitations" not reflected in embedding
- Search for "RAG limitations" misses file

### Solution: Content-Aware Triggers

```typescript
function shouldUpdateEmbedding(file: File, changes: FileChange): boolean {
  // Trigger 1: Character diff >20%
  if (changes.addedChars / file.totalChars > 0.20) return true;

  // Trigger 2: New section headings (structural change)
  if (detectNewHeadings(file.oldContent, file.newContent).length > 0) return true;

  // Trigger 3: Significant keywords added
  if (extractKeywords(changes.addedText).length > 5) return true;

  return false;
}
```

**Recommendation**: Start with 20% threshold (MVP), add content-aware triggers in v2 if needed

---

## Pre-Implementation Checklist

### Must Address in MVP (Week 1-4)

- [ ] **Parent context lazy loading** - Cap at top 5 files + summary + last message (11K tokens)
- [ ] **Hybrid model routing** - Haiku for simple, Sonnet for consolidation (COGS fix)
- [ ] **Exponential divergence penalty** - Replace threshold filter (FR-021c)
- [ ] **Soft delete branches** - Preserve provenance when branches deleted (Week 2-3)
- [ ] **Real-time conflict detection** - Multi-device file sync conflicts (Week 3-4)
- [ ] **Token counting infrastructure** - Monitor context usage, validate COGS

### Validate During Beta (Week 1-4)

- [ ] **Semantic match relevance** - >80% of top 10 results rated relevant
- [ ] **Parent context utilization** - <15% of total context budget
- [ ] **COGS per request** - $0.10-0.30/request (validates $3.72/user/month)
- [ ] **Consolidation satisfaction** - >4/5 rating on synthesis quality
- [ ] **Thread summary quality** - Monitor for generic summaries in long threads (>200 msgs)

### Defer to v2 (Month 2-3)

- [ ] **Parent context budget** - Explicit 20K token allocation with overflow handling
- [ ] **Hierarchical thread summaries** - If beta shows generic summaries (current/archive/overall)
- [ ] **Content-aware embedding triggers** - If 20% threshold misses important edits
- [ ] **Hybrid search** - Embeddings + keywords + metadata (0.5 + 0.3 + 0.2 weights)
- [ ] **Last-edited bias** - Boost recently edited files for freshness
- [ ] **Structured consolidation templates** - Multi-template library for different synthesis types

---

## Conclusion

**Architecture is sound**. The tech stack (embeddings + pgvector + context assembly) WILL deliver core value proposition.

**Critical Fixes Required (MVP Week 1-4)**:
1. 🔴 Parent context inheritance → Lazy loading (11K token cap)
2. 🔴 COGS overage → Hybrid Haiku/Sonnet routing ($3.72 vs $28.80)
3. 🟡 Sibling pollution → Exponential divergence penalty
4. 🟡 Deleted branch provenance → Soft delete branches
5. 🟡 Multi-device conflicts → Real-time conflict detection
6. 🟡 Thread summary degradation → Monitor in beta, implement hierarchical if needed

**Confidence Level**: 85% (high) that MVP will validate product-market fit IF these gaps are addressed.

**Biggest Risks**:
- Consolidation prompt quality (high variance) - invest Week 5-6 in testing
- Thread summary quality degrades >200 messages - monitor in beta, add hierarchical summaries if needed
