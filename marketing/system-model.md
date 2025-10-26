# Centrid System Model: Context Resolution Architecture

**Date**: 2025-10-25
**Purpose**: Map all moving pieces and their interactions for optimal context delivery

---

## The Core Question

**How do we assemble optimal context for each agent request from multiple dynamic sources?**

---

## The Four Persistent Domains

### 1. Filesystem Domain
**What it stores**: Files, folders, content, embeddings

**Updated by**: User edits, agent writes (with approval)

**Organized by**: Topic hierarchy (folders)

**Metadata**:
- File path, content, embeddings
- Created by (user/agent), created in (conversation_id)
- Last modified, file size, file type

### 2. Chat Graph Domain
**What it stores**: Conversations, messages, branching relationships

**Updated by**: User actions (branch, send message)

**Organized by**: DAG (parent-child branches)

**Metadata**:
- Conversation ID, parent_id, title
- Messages (user/agent pairs)
- Branch point (which message triggered branch)

### 3. User Profile Domain
**What it stores**: Preferences, behavioral patterns, style profile

**Updated by**: System (automatic learning)

**Organized by**: User ID

**Metadata**:
- Style preferences (tone, verbosity, structure)
- Behavioral patterns (copy rate, regenerate rate, edit patterns)
- Usage history (conversation count, file count, feature usage)
- Manual overrides (user-set preferences)

### 4. Knowledge Graph Domain
**What it stores**: Connections across all domains

**Updated by**: System (automatic detection)

**Organized by**: Graph (nodes + edges)

**Metadata**:
- Node: entity (file/conversation/concept), type, label
- Edge: relationship type, confidence score, creation timestamp
- Cross-domain: File ↔ File, File ↔ Conversation, Conversation ↔ Conversation, Concept ↔ Entity

---

## The Dynamic Process: Context Resolution

**Context is NOT stored - it's computed per request**

### Context Assembly Process

**Step 1: Detect Intent**
- Analyze user message to determine intent type (compare/implement/analyze/consolidate)
- Intent shapes initial context priming and file type prioritization

**Step 2: Gather Explicit Context (Layer 1)**
- Retrieve files user manually added via pills
- Weight: 1.0 (highest priority, NEVER truncated)

**Step 3: Perform Semantic Search (Layer 2)**
- Embed user message, search across all file embeddings
- Exclude already-explicit files to avoid duplication
- Apply temporal decay based on file age (recent = higher weight)
- Apply intent-based boost (compare → favor markdown/docs, implement → favor code)
- Return top 10 matches above similarity threshold (0.7)
- Base weight: 0.5 (modified by temporal and intent factors)

**Step 4: Load Branch Context (Layer 3)**
- Inherit explicit files from parent conversation
- Generate summary of parent conversation (last 50 messages compressed to 2 paragraphs)
- Calculate branch relationships (siblings, parent, child, cousins, distant)
- Apply relationship weight modifiers (siblings +0.15, parent/child +0.10, cousins +0.05)
- Weight: 0.7 base (medium-high priority)

**Step 5: Query Knowledge Graph (Layer 4)**
- Find files connected to current explicit and semantic files
- Find conversations that explored similar topics
- Extract concepts mentioned across domains
- Prioritize sibling branch connections
- Limit traversal depth to 2 hops (prevent explosion)
- Weight: 0.6 base + relationship modifiers

**Step 6: Search Conversation History (Layer 5)**
- Embed user query, search across conversation summary embeddings
- Enable queries like "Find branch where I discussed RAG chunking"
- Return top 5 matching conversations
- Weight: 0.6 (same as knowledge graph)

**Step 7: Extract Concepts (Layer 6)**
- Use NER (Named Entity Recognition) to extract entities
- Use topic modeling to identify themes
- Use keyphrase extraction for important phrases
- Link concepts to files, conversations, and other concepts
- Purpose: Cross-cutting discovery, not weighted content

**Step 8: Load User Profile (Layer 7)**
- Retrieve style preferences (tone, verbosity, structure)
- Retrieve behavioral patterns from 3 sources:
  - Message content analysis (tone, technical depth)
  - Direct file edits (code style, naming patterns)
  - UI actions (copy events, regenerate requests, navigation)
- Apply temporal weighting (recent patterns > old)
- Manual overrides take precedence
- Purpose: Affects HOW agent responds, not WHAT it sees

**Step 9: Build Chat History (Layer 8)**
- Include last 10 messages in full (never truncated)
- Summarize messages 11-50 (1-2 sentences each)
- Omit messages 51+ (available via agent tool call)
- Purpose: Immediate context and conversation flow

**Step 10: Add Provenance Metadata (Layer 9)**
- For each file, track:
  - Which conversation created it
  - At which message it was created
  - Why it was created (context summary)
  - Relationship to current conversation (graph distance)
- Purpose: Enriches AI understanding ("this file from your RAG exploration")
- Not weighted content, but metadata that enhances other layers

**Step 11: Check Context Size**
- Calculate total tokens across all layers
- If over 180K (90% buffer): Trigger optimization
  - Summarize chat history more aggressively
  - Compress provenance to key facts only
  - Reduce semantic files from 10 to 5
- If over 195K (98% hard limit): Show user warning
  - Option to remove explicit files
  - Option to create new branch
  - Option to continue with truncated semantic/KG

**Step 12: Return Assembled Context**
Organized into categories:
- **Content**: Explicit files, semantic files, related entities, chat history, concepts
- **Structure**: Parent context, branch relationships, knowledge graph, conversation search
- **Personalization**: Style profile, behavioral patterns, user preferences
- **Provenance**: Creation metadata, relationship distances
- **Metadata**: Intent, timestamp, context size, optimization flags
- **Agent Tools**: Available tool calls for dynamic expansion

---

## How Domains Interact

### Interaction 1: User Creates File

```
User → Agent: "Save this as analysis.md"

1. Agent generates content
2. System writes to Filesystem:
   - /research/analysis.md
   - metadata.created_in_conversation = conversationId

3. System updates Chat Graph:
   - Current conversation references new file

4. System updates Knowledge Graph:
   - Create node: File(analysis.md)
   - Create edge: Conversation → File (created_in)
   - Detect edges: File ↔ related Files (semantic)

5. Context for NEXT message automatically includes:
   - analysis.md (explicit, just created)
   - Related files (semantic + knowledge graph)
```

### Interaction 2: User Branches Conversation

```
User → System: "Branch to explore alternatives"

1. System creates new conversation in Chat Graph:
   - parent_id = current conversation
   - title = "Branch: [auto-generated]"

2. System copies context:
   - explicit_files from parent
   - (NOT parent messages)

3. System updates Knowledge Graph:
   - Create node: Conversation(new branch)
   - Create edge: Parent Conversation → Child Conversation (branched_to)

4. Context for first message in branch includes:
   - Parent explicit files (inherited)
   - Parent summary (NOT full messages)
   - Knowledge graph connections to parent
```

### Interaction 3: Agent Makes File Edit

```
Agent → System: "Update analysis.md with new findings"

1. User approves change
2. System updates Filesystem:
   - analysis.md content modified
   - metadata.last_modified = now()
   - metadata.last_modified_by = agent

3. System triggers re-embedding:
   - Generate new embeddings for updated content
   - Invalidate old semantic search cache

4. System updates Knowledge Graph:
   - Re-evaluate edges (semantic connections may have changed)
   - Update edge weights based on new content

5. Context for ALL conversations referencing this file:
   - Automatically gets updated content
   - Related files may change (new semantic matches)
```

### Interaction 4: System Learns User Behavior

```
User action: Copies agent response without editing

1. System updates User Profile:
   - Increment copy_count
   - Analyze copied content (length, structure, tone)
   - Update behavioral_profile

2. User Profile affects NEXT response:
   - Agent uses learned preferences
   - "User typically copies concise, bullet-point responses"

3. NO change to Filesystem, Chat Graph, or Knowledge Graph
   - User Profile is separate domain
   - Affects HOW agent responds, not WHAT it sees
```

---

## Design Decisions (Validated)

### Decision 1: Temporal Context ✅

**Question**: Should recent files be weighted higher than old files?

**Answer**: YES - Apply temporal decay

**How it works**:
- Calculate age of file in months
- Apply decay factor (5% per month)
- Examples: This week (1.0x), 1 month ago (0.95x), 6 months (0.70x), 1 year (0.40x)
- Never decay below 0.3 (floor)
- Multiply base weight by temporal weight to get final weight

**Rationale**: Recent context is more relevant to current thinking

### Decision 2: User Intent Detection ✅

**Question**: Should context differ based on detected intent?

**Answer**: YES - Prime context based on intent + give agents tool calls

**How it works**:
- Detect intent type from user message (compare/implement/analyze/consolidate)
- Apply intent-specific weight adjustments to initial context
- Agent has access to tool calls for dynamic expansion:
  - read_file (specific file access)
  - search_semantic (filter by query)
  - search_embeddings (vector search)
  - query_knowledge_graph (traverse relationships)

**Examples**:
- Intent "compare": Boost analysis files and markdown docs, reduce code files
- Intent "implement": Boost code files and examples, agent can query for related implementations

**Rationale**: Intent-driven priming + dynamic tool calls = optimal context without over-loading

### Decision 3: Conversation Embeddings ✅

**Question**: Should conversations be searchable?

**Answer**: YES - Generate conversation embeddings for search

**How it works**:
- Every 5 messages, generate summary of last 20 messages
- Create embedding for the summary
- Store embedding in conversation record
- On search query, embed the query and perform vector search across all conversation embeddings
- Return top 5 matching branches
- Conversation embeddings also feed into concept extraction for knowledge graph

**Example**: User asks "Find branch about RAG chunking" → system searches conversation embeddings → returns relevant branches

**Rationale**: Users need to navigate conversation history, embeddings enable semantic search

### Decision 4: Cross-Domain Concept Graph ✅

**Question**: Should we extract and track concepts separately?

**Answer**: YES - Build comprehensive concept graph across all domains

**How it works**:
- Extract concepts from messages and files using:
  - NER (Named Entity Recognition) for entities
  - Topic modeling (LDA/BERTopic) for themes
  - Keyphrase extraction for important phrases
- Store concepts with labels, types, and embeddings
- Track concept mentions across all entities

**Knowledge graph structure**:
- **Nodes**: Files, Conversations, Concepts
- **Edges**:
  - File ↔ File (semantic similarity)
  - Conversation ↔ File (created_in, references)
  - Conversation ↔ Conversation (branched_from, similar_to)
  - Concept ↔ File (appears_in)
  - Concept ↔ Conversation (discussed_in)
  - Concept ↔ Concept (related_to)

**Example**: Concept "RAG Architecture" appears in files (rag-analysis.md, comparison.md), discussed in conversations (Branch A, Main), and related to other concepts (Vector Embeddings, Semantic Search)

**Rationale**: Concepts bridge all domains, enable cross-cutting discovery

### Decision 5: Context Window Overflow ✅

**Question**: How to handle context exceeding 200K tokens?

**Answer**: Buffer-based trigger for context optimization with fallback strategies

**How it works**:

**Context Budget**:
- Total: 200K tokens
- Buffer trigger: 180K (90%)
- Hard limit: 195K (98%)

**When buffer triggered (180K)**:
1. **OPTIMIZE**: Summarize chat history, compress provenance, reduce semantic files (10→5)
2. **RESTRUCTURE** (if still >180K): Clear and rebuild with priority order:
   - Explicit files (NEVER truncate)
   - Last 10 messages (NEVER truncate)
   - User profile (NEVER truncate)
   - Semantic files (reduce to top 3)
   - Knowledge graph (1-hop only)
   - Parent context (summary only)

**When hard limit reached (195K)**:
- Show user warning: "Context is very large"
- Provide options: Remove explicit files, create new branch, or continue with truncation

**Tracking**: Monitor per-layer size, alert at 90%/95%/98%, show breakdown in context panel

**Rationale**: Gradual optimization maintains value, user control at critical points

### Decision 6: Real-Time Sync with Weighted References ✅

**Question**: How should file creation propagate across branches?

**Answer**: Nuanced - depends on creation source + relationship weighting

**Scenario 1: Independent File** (uploaded outside chat)
- All branches see file in filesystem (global)
- Context weight: Semantic only (0.5)
- NO direct reference or auto-add

**Scenario 2: Branch-Created File**

Different branches see it differently:

- **Creator branch (Branch A)**:
  - File appears immediately
  - Auto-added to explicit context (1.0)
  - Provenance: "Created here"

- **Sibling branches (Branch B, C)**:
  - File appears in filesystem (global)
  - NOT auto-added to context
  - Available via semantic search (0.5)
  - Weight boost if referenced: 0.7 (sibling relationship +0.2)
  - Provenance: "Created in Branch A (sibling)"

- **Parent branch (Main)**:
  - File appears in filesystem
  - Weight if semantic match: 0.6 (parent relationship +0.1)
  - Provenance: "Created in child branch"

- **Distant branches (other trees)**:
  - File appears in filesystem
  - Weight: 0.5 (standard semantic, no boost)
  - Provenance: "Created in unrelated branch"

**Relationship Weight Modifiers**:
- Creator: 1.0 (explicit)
- Siblings: +0.2 boost
- Parent/Child: +0.1 boost
- Distant: 0 (no boost)

**Real-time Sync**:
- Filesystem: All branches see file immediately (WebSocket)
- Context: Only creator auto-adds; others via semantic search or manual add

**Rationale**: Sibling explorations are related but independent, weight reflects closeness without forcing context

---

## Design Refinements (Additional Decisions)

### Refinement 1: Sibling Branch Weighting ✅

**Decision**: Sibling chats should be weighted higher than distant branches

**How it works**:
- Calculate graph distance between conversations
  - Siblings (same parent): distance = 1
  - Parent/child: distance = 1
  - Cousins (siblings of parent): distance = 2
  - Distant: distance = 3+
- Apply weight modifiers:
  - Distance 0 (same branch): 1.0
  - Distance 1 (siblings/parent/child): +0.15 boost
  - Distance 2 (cousins): +0.05 boost
  - Distance 3+ (distant): 0 (no boost)

**Applied to**:
- File references (sibling-created files: 0.7 vs 0.5 for distant)
- Conversation embeddings (sibling branches surface higher in search)
- Knowledge graph (sibling connections prioritized in queries)

### Refinement 2: Chat History Optimization ✅

**Decision**: Full history not needed, but recent messages are critical reference

**How it works**:
- **Last 10 messages**: Full content (always included, never truncated)
- **Messages 11-50**: Summarized (1-2 sentences each)
- **Messages 51+**: Omitted from initial context (available via agent tool call)

**Summarization triggers**:
- Every 10 messages (rolling summary)
- When context buffer triggered (aggressive summary)

**Agent access**: Can call read_conversation_history(start, end) for older messages (e.g., "What did we discuss 30 messages ago?")

### Refinement 3: User Behavior Sources ✅

**Decision**: Pull behavior from multiple sources

**How it works**:

**Three behavior signal sources**:
1. **User requests** (message content analysis)
   - Tone, technical depth, question patterns

2. **Direct edits** (file modifications)
   - Editing patterns, code style, naming conventions

3. **User actions** (UI interactions)
   - Copy events, regenerate requests, pill management
   - Feature usage frequency, navigation patterns

**Processing**:
- All sources feed into unified behavioral profile
- Apply temporal weighting (recent patterns weighted higher)
- Store all patterns, apply recency weights during retrieval

### Refinement 4: User Pattern Storage ✅

**Decision**: Store all patterns but weight recent higher, with limits

**How it works**:

**Storage Strategy**:
- Keep all patterns (no deletion)
- Apply temporal weighting:
  - This week: 1.0x
  - This month: 0.8x
  - 3 months ago: 0.5x
  - 6+ months ago: 0.3x

**Limits Per Pattern Type**:
- Copy patterns: Last 500 instances
- Edit patterns: Last 200 instances
- Navigation patterns: Last 1000 instances
- Feature usage: Aggregate counts (no limit)

**Data Structure**:
- Table: user_behaviors (user_id, pattern_type, pattern_data, timestamp, computed_weight)

**Cleanup Policy**:
- Monthly: Archive patterns older than 6 months
- Keep aggregates forever (for trend analysis)

---

## Unified Technical Architecture

### Data Layer

**Postgres Tables**:
- **Filesystem Domain**: files table with path, content, embeddings, metadata
- **Chat Graph Domain**: conversations (with parent relationships), messages, conversation_context
- **User Profile Domain**: user_profiles with style, behavioral patterns, preferences
- **Knowledge Graph Domain**: kg_nodes (entities), kg_edges (relationships with confidence scores)
- **Cross-cutting**: file_references tracking table linking files to conversations and messages

**Required Indexes**:
- Semantic search: Vector index on file embeddings (ivfflat)
- Graph traversal: Index on conversation parent_id, knowledge graph source/target
- Context lookup: Index on file_references by conversation

### Context Resolution Service

**Service Responsibilities**:
- Main: Build complete context from user ID, conversation ID, and message content
- Sub-queries:
  - Get explicit context (user-selected pills)
  - Get semantic context (embedding search with filters)
  - Get parent context (inherited from parent conversation)
  - Query knowledge graph (cross-domain connections)
  - Get user profile (style and behavior)
  - Get chat history (with summarization)
  - Build provenance (creation metadata)

**Caching Strategy**:
- **L1 (in-memory)**: User profiles, recent conversations (fast, limited)
- **L2 (Redis)**: Semantic search results, knowledge graph queries (medium, larger)
- **L3 (Postgres)**: Source of truth (persistent, complete)

**Cache Invalidation**:
- File update → invalidate semantic search cache and knowledge graph cache
- New conversation message → invalidate chat history cache
- Knowledge graph edge change → invalidate KG query cache
- User action → invalidate behavior profile cache

---

## UX Implications

### What Users See

**Context Panel** (always visible):
Organized into sections showing:
- **Explicit** (✓ icon): Files user manually selected via pills
- **Semantic** (~ icon): Files AI found via embedding search, with similarity scores
- **Related** (🔗 icon): Cross-branch files and knowledge graph suggestions
- **Profile** (👤 icon): Learned preferences (tone, style)

**What They Control**:
- Add/remove explicit files (pills)
- Override semantic suggestions (exclude)
- See provenance (hover on files)
- Toggle profile preferences (settings)

**What's Automatic**:
- Semantic search (runs per message)
- Knowledge graph connections (background)
- Profile learning (continuous)
- Branch inheritance (on branch creation)

### Progressive Disclosure

**New users** (first session):
- See: Files + chat + basic context panel
- Don't see: Branching, knowledge graph, provenance details

**Intermediate users** (10+ conversations):
- See: Branching option appears
- Don't see: Advanced knowledge graph visualization

**Power users** (50+ conversations):
- See: Full tree view, knowledge graph, advanced context controls
- Customization: Manual weights, custom embeddings, advanced filters

---

## Open Questions for Validation

### 1. Context Inheritance Depth

**Question**: Should child branches inherit parent's parent context?

**Example**:
```
Main → Branch A → Branch A.1
```

Should A.1 inherit from:
- A) Only Branch A (1 level)
- B) Branch A + Main (2 levels)
- C) Full ancestry (all levels)

### 2. Knowledge Graph Edge Pruning

**Question**: When to delete low-confidence edges?

**Options**:
- A) Never (keep all history)
- B) Weekly (prune <0.6 confidence)
- C) On user dismissal (remove specific edge)

### 3. Profile Learning Opt-Out

**Question**: Should users be able to disable profile learning?

**Pro**: Privacy, user control
**Con**: Worse experience, defeats purpose

### 4. Cross-User Knowledge Graph

**Question**: Should knowledge graph be per-user or global?

**Per-user**: Private, personalized
**Global**: Collaborative, network effects
**Hybrid**: Private by default, opt-in sharing

---

## Next Steps

1. **Validate with users** (Week 1)
   - Show context panel mockup - does it make sense?
   - Test context inheritance - do they expect parent context?
   - Validate knowledge graph - is it useful or overwhelming?

2. **Build prototype** (Week 2)
   - Implement context resolution service
   - Test with 10 conversations, 20 files
   - Measure: query latency, cache hit rate, context quality

3. **Iterate on gaps** (Week 3)
   - Temporal context: add if needed
   - Intent detection: validate necessity
   - Conversation embeddings: implement if search is critical
   - Concept graph: defer to post-MVP

---

## Summary

**The system has 4 persistent domains**:
1. Filesystem (files, folders, embeddings)
2. Chat Graph (conversations, branches, messages)
3. User Profile (style, behavior, preferences)
4. Knowledge Graph (connections across all domains)

**Context is dynamically assembled per request** from:
- Explicit files (user control, weight 1.0)
- Semantic files (embedding search, weight 0.5)
- Parent context (inheritance, weight 0.7)
- Knowledge graph (connections, weight 0.6)
- User profile (personalization, affects HOW not WHAT)
- Chat history (continuity, last 10 messages)
- Provenance (metadata, enriches other layers)

**Key insight**: Context is NOT stored, it's computed. Each domain is independently mutable, context resolution queries across all domains to assemble optimal view.

**Architecture is sound if**:
- Queries are fast (<500ms for context assembly)
- Caching prevents redundant computation
- Real-time sync keeps all domains coherent
- User has transparency and control

---

## Complete System Summary

### The Unified Architecture (Final)

**4 Persistent Domains** (stored in database):
1. **Filesystem** - Files with content, embeddings, provenance
2. **Chat Graph** - Conversations in DAG, messages, branching relationships
3. **User Profile** - Style, behavior (multi-source, temporal weighted), preferences
4. **Knowledge Graph** - Nodes (files, conversations, concepts) + Edges (relationships)

**9-Layer Context Assembly** (computed per request):
1. **Explicit files** (1.0) - User-selected pills
2. **Semantic files** (0.5 base) - Embedding search + temporal decay + intent boost
3. **Branch context** (0.7) - Parent files + summary + relationship weights
4. **Knowledge graph** (0.6) - Cross-domain connections (files, conversations, concepts)
5. **Conversation search** (0.6) - Searchable branch embeddings
6. **Concept graph** (enrichment) - NER + topics + keyphrases across domains
7. **User profile** (personalization) - Affects HOW, not WHAT
8. **Chat history** (continuity) - Last 10 full, 11-50 summarized, 51+ on-demand
9. **Provenance** (metadata) - Creation source, relationships, distance

**Key Design Decisions**:
- ✅ Temporal decay (recent files weighted higher)
- ✅ Intent-driven priming (compare vs implement gets different context)
- ✅ Conversation embeddings (branches are searchable)
- ✅ Cross-domain concept graph (track concepts everywhere)
- ✅ Buffer-based context optimization (90% trigger, 98% hard limit)
- ✅ Weighted real-time sync (siblings +0.15, parent/child +0.10, cousins +0.05)
- ✅ Multi-source behavior tracking (requests + edits + actions)
- ✅ Sibling branch prioritization (closer relationships = higher weights)
- ✅ Chat history optimization (last 10 full, rest summarized)
- ✅ Pattern storage with temporal weighting (store all, weight recent)

**Agent Tool Calls** (dynamic context expansion):
- `read_file(path)` - Read specific file
- `search_semantic(query, filters)` - Semantic search
- `search_embeddings(vector, threshold)` - Vector search
- `query_knowledge_graph(entity, relationship)` - Graph traversal
- `read_conversation_history(start, end)` - Historical messages
- `search_conversations(query)` - Find branches by topic

**What Makes It Coherent**:
1. **Files are global** - Any conversation can access any file
2. **Context is per-conversation** - Each branch decides what's in scope
3. **Provenance connects them** - Files remember creation source + relationships
4. **Weights reflect relationships** - Siblings > parents > distant
5. **Temporal relevance matters** - Recent > old (with floor)
6. **Intent shapes priming** - Compare vs implement gets different initial context
7. **Concepts bridge domains** - "RAG" links files + conversations + profile
8. **Real-time sync with nuance** - Creator auto-adds, siblings see but don't auto-add
9. **Buffer-based optimization** - Graceful degradation before hard limits

**UX Translation**:

Users see:
- **Filesystem** (primary navigation, familiar)
- **Chat** (interaction mode)
- **Context panel** (transparent, shows ✓ explicit, ~ semantic, 🔗 related, 👤 profile)
- **Branch button** (contextual, appears when needed)
- **Tree view** (optional, power users)

Users control:
- Add/remove explicit files (pills)
- Override semantic suggestions (exclude)
- View provenance (hover on files)
- See branch relationships (tree view)
- Adjust profile preferences (settings)

Users don't see (automatic):
- Semantic search (per message)
- Knowledge graph updates (background)
- Concept extraction (background)
- Conversation embeddings (generated every 5 messages)
- Temporal weighting (applied transparently)
- Branch relationship calculations (automatic)
- Profile learning (continuous, multi-source)
- Context optimization (triggered by buffer)

**Technical Performance Targets**:
- Context assembly: <500ms (with caching)
- Semantic search: <200ms (10K files)
- Knowledge graph query: <100ms (1-hop), <500ms (2-hop)
- Conversation embedding generation: <3s (every 5 messages)
- Concept extraction: <2s per file/conversation (background)
- Real-time sync: <100ms (WebSocket propagation)
- Context optimization: <1s (when triggered)

**Caching Strategy**:
- L1 (in-memory): User profiles, recent conversations
- L2 (Redis): Semantic search results, knowledge graph queries, conversation embeddings
- L3 (Postgres): Source of truth

**Invalidation**:
- File update → invalidate semantic cache + knowledge graph
- New message → invalidate conversation embedding cache
- User action → invalidate behavior profile cache
- Knowledge graph edge change → invalidate KG query cache

---

## What This Enables

**For Users**:
- Create file in Branch A → Sibling Branch B sees it with boosted weight
- Search "Find RAG discussion" → Conversation embeddings surface relevant branch
- Ask "Compare approaches" → Intent-driven context prioritizes analysis files
- Navigate complex exploration → Branch relationships keep context coherent
- 6-month-old file still useful → Temporal decay (0.7x) keeps it accessible
- AI learns preferences → Multi-source behavior shapes HOW it responds
- Context overflow → Buffer triggers optimization, user keeps control

**For System**:
- Cross-domain concept graph → "RAG" tracked everywhere
- Knowledge graph → Auto-discovers connections users didn't know existed
- Provenance → "This file from your RAG branch" enriches responses
- Agent tool calls → Dynamic context expansion when needed
- Temporal weighting → Fresh context prioritized automatically
- Relationship weighting → Sibling explorations naturally connected
- Profile learning → Personalization without manual setup

**Why It's Defensible**:
- Not a single feature - it's integrated system architecture
- 9-layer context assembly requires all pieces working together
- Knowledge graph + concept graph + provenance = compounding moat
- Temporal + relationship + intent weighting = sophisticated optimization
- Multi-source behavior learning = deep personalization
- Real-time sync with nuanced weighting = coherent experience

**Claude/ChatGPT can't replicate because**:
- Requires branching + filesystem + knowledge graph + concepts + provenance
- Requires rethinking product model (conversation-first → exploration-first)
- Requires building 4 persistent domains + 9-layer context resolution
- Requires relationship-aware weighting system
- Requires cross-domain concept extraction
- Not a feature add - it's architectural foundation

---

## Next Steps

1. **User Validation** (Week 1)
   - Test unified model comprehension (do they get it?)
   - Validate weighting system (siblings > distant makes sense?)
   - Test context panel transparency (helpful or overwhelming?)

2. **Technical Prototype** (Week 2)
   - Build context resolution service (9 layers)
   - Implement relationship weighting (sibling +0.15, parent +0.10)
   - Test performance (target <500ms context assembly)

3. **MVP Scope** (Week 3-8)
   - Phase 1: Core integration (branching + files + provenance)
   - Phase 2: Knowledge graph foundation (file-file, conversation-file edges)
   - Phase 3: Concept extraction (NER + topics, cross-domain)
   - Phase 4: Conversation embeddings (searchable branches)
   - Phase 5: Profile learning (multi-source behavior)
   - Phase 6: Context optimization (buffer-based truncation)

4. **Validation Metrics** (Month 1-3)
   - 70% create branches (proves branching value)
   - 50% create files (proves capture value)
   - 30% reference file from other branch (proves integration)
   - <5% churn with 50+ artifacts (proves switching cost)
   - <20% confusion rate (proves UX clarity)
   - Context assembly <500ms p95 (proves performance)

---

---

## Critical Design Questions & Answers

### Q1: Is the tool call flow valid?

**Flow**: User request → Context setup references nodes via embeddings → Agent decides to make tool call for specific content

**Answer**: YES, this is optimal

**Why it works**:
- **Phase 1 (Priming)**: System provides initial context based on embeddings, relationships, temporal weights
- **Phase 2 (Expansion)**: Agent sees primed context, determines what's missing, makes targeted tool calls
- **Benefit**: Avoids over-loading initial context with everything, agent pulls what it needs dynamically

**Example**:
1. User: "Compare the RAG approaches we discussed"
2. System primes: Top 5 semantic matches (files), sibling branches (conversations)
3. Agent sees: "rag-analysis.md" mentioned but not full content
4. Agent calls: `read_file('rag-analysis.md')` to get complete details
5. Agent responds with full comparison

### Q2: Should agent query embeddings for different domains separately?

**Answer**: YES - Domain-specific embedding queries are essential

**Why**:

Different queries need different entity types:

**Query Type** | **Domain** | **Use Case**
---|---|---
"Find file about RAG" | Files only | User wants document
"Which conversation discussed pricing?" | Conversations only | User wants branch
"What concepts relate to embeddings?" | Concepts only | User wants theme exploration
"Show everything about RAG" | All domains | User wants comprehensive view

**Agent Tool Calls**:
- `search_files(query, filters)` - Search file embeddings only
- `search_conversations(query, filters)` - Search conversation embeddings only
- `search_concepts(query, filters)` - Search concept embeddings only
- `search_all(query, filters)` - Cross-domain search (slower, comprehensive)

**Performance**: Domain-specific searches are faster (smaller index, more focused results)

**Accuracy**: Domain-specific searches have better precision (no cross-domain noise)

### Q3: Context window management as domains grow

**Problem**: As files/conversations/knowledge graph grow, maintaining optimal context without hitting 200K limit becomes harder. Tool call back-and-forth also consumes tokens.

**Answer**: Multi-tier budget allocation with dynamic adjustment

**Budget Allocation Strategy**:

Total: 200K tokens
- Reserved (never used): 5K (5% safety buffer)
- System prompts: 10K (5%)
- User/agent messages (per turn): 5K (2.5%)
- Available for context: 180K (90%)

**Context Layer Budgets** (within 180K):
- Explicit files: 60K (33%) - PRIORITY 1, never truncate
- Last 10 messages: 20K (11%) - PRIORITY 2, never truncate
- Semantic files: 40K (22%) - Truncate to top 5 if needed
- Knowledge graph: 20K (11%) - Reduce depth if needed
- Parent context: 15K (8%) - Aggressive summary if needed
- Provenance: 10K (6%) - Key facts only
- User profile: 5K (3%) - Summary only
- Concepts: 10K (6%) - Top 20 concepts only

**Dynamic Adjustment**:

As domains grow:
1. **Monitor**: Track actual token usage per layer per request
2. **Adapt**: If semantic files consistently use 60K, increase budget, reduce KG budget
3. **Learn**: Track which layers contribute to successful responses
4. **Optimize**: Reduce budgets for low-impact layers

**Tool Call Management**:

Problem: Each tool call adds tokens (tool result + agent reasoning)

Solution:
- **Token tracking**: Count tokens after each tool call
- **Threshold**: If total > 170K, warn agent "Context budget low, use tools sparingly"
- **Limit**: Max 5 tool calls per turn (prevents runaway expansion)
- **Compression**: Summarize tool call results before adding to context

**Growth Scaling**:

| User Files | Conversations | Strategy |
|---|---|---|
| < 100 | < 50 | Full context (no optimization needed) |
| 100-1K | 50-500 | Semantic top 10 → top 5, KG 2-hop → 1-hop |
| 1K-10K | 500-5K | Semantic top 5 → top 3, KG 1-hop only, aggressive parent summary |
| 10K+ | 5K+ | Semantic top 3, KG disabled (agent must query), parent summary only |

**Validation**: Monitor p95 context size weekly, adjust budgets if consistently >170K

### Q4: Temporal decay with interaction refresh

**Current flaw**: Files decay based on creation date only. A 6-month-old file that was edited yesterday still gets 0.7x weight.

**Solution**: Decay based on LAST INTERACTION, not creation date

**Last Interaction = Most recent of**:
- File created
- File updated (by user or agent)
- File read (agent tool call)
- File explicitly added to context (user pill)
- File referenced in conversation

**Updated Weight Formula**:
```
temporal_weight = 1.0 - (months_since_last_interaction × 0.05)
  → Edited yesterday: 1.0x (fresh)
  → Read last week: 1.0x (still fresh)
  → Last interaction 6 months ago: 0.7x (decayed)

floor: 0.3 (never fully decay)
```

**Interaction Tracking**:
- Table: `file_interactions (file_id, interaction_type, timestamp)`
- Query: `MAX(timestamp) as last_interaction` per file
- Update: Every file read, write, reference

**Benefit**: Keeps actively-used files relevant, regardless of original creation date

### Q5: Display context types in UI

**Answer**: YES - Transparency is critical for user understanding

**Context Panel Design** (organized by type):

**1. Files from This Chat** (ordered by last updated)
```
📁 Files Created Here
  ✓ rag-analysis.md (edited 2 hours ago)
  ✓ comparison.md (edited yesterday)
```

**2. Chat Graph** (relationships)
```
🌳 Related Conversations
  Parent: "AI Agents Research" (inherited 3 files)
  Siblings:
    • Branch B: "Orchestration" (+0.15 weight)
    • Branch C: "Cost Analysis" (+0.15 weight)
```

**3. Explicit Pills** (user-selected)
```
✓ Explicit Context
  pricing-model.xlsx (selected)
  technical-spec.md (selected)
```

**4. Semantic Matches** (auto-found)
```
~ Semantic Context
  embeddings-guide.md (0.87 similarity)
  rag-overview.md (0.82 similarity)
  [+3 more...]
```

**5. Knowledge Graph** (cross-domain)
```
🔗 Related
  Concepts: "RAG Architecture", "Vector Search"
  From Branch A: orchestration-notes.md
```

**6. Context Budget** (transparency)
```
📊 Context Size: 145K / 180K tokens (81%)
  Explicit files: 45K
  Semantic: 30K
  Chat history: 25K
  Knowledge graph: 20K
  Other: 25K
```

**Interaction**:
- Click file → see full provenance (created when, updated when, referenced where)
- Click conversation → jump to that branch
- Click concept → see all mentions across domains
- Hover on weight → see calculation breakdown

### Q6: Dynamic weight updating based on interaction & divergence

**Is this aligned?**: YES, absolutely

**Is it overkill?**: NO, it's sophisticated but necessary

**Optimal approach**: Combine multiple signals into unified relevance score

**The Problem**:
- Current: Static relationship weights (siblings always +0.15)
- Reality: Sibling branches diverge over time, should lose connection
- Current: Files decay by age only
- Reality: Interacted-with files stay relevant

**The Solution**: Dynamic Relevance Score

**Formula**:
```
relevance_score = base_weight
                × relationship_modifier
                × temporal_factor
                × interaction_boost
                × divergence_penalty
```

**1. Base Weight** (static):
- Explicit: 1.0
- Semantic match: 0.5
- Knowledge graph: 0.6

**2. Relationship Modifier** (static graph distance):
- Same branch: 1.0
- Siblings: +0.15
- Parent/child: +0.10
- Cousins: +0.05
- Distant: 0

**3. Temporal Factor** (time decay):
```
temporal_factor = 1.0 - (months_since_last_interaction × 0.05)
floor: 0.3
```

**4. Interaction Boost** (recency bump):
```
If interacted with in last 7 days: +0.2 boost
If interacted with in last 30 days: +0.1 boost
Otherwise: 0
```

**5. Divergence Penalty** (semantic drift):

**How to measure divergence between sibling branches**:

1. **Concept Overlap** (what concepts are discussed):
```
Branch A concepts: ["RAG", "Embeddings", "Chunking"]
Branch B concepts: ["RAG", "Pricing", "Deployment"]

overlap = intersection / union = 1 / 5 = 0.2 (low overlap)

divergence_penalty = overlap
  → 0.2 overlap = 0.2 penalty (significant divergence)
  → 0.8 overlap = 0.8 penalty (still aligned)
```

2. **File Reference Overlap** (what files are used):
```
Branch A files: [rag.md, embeddings.md]
Branch B files: [rag.md, pricing.xlsx]

overlap = 1 / 3 = 0.33

divergence_penalty = 0.33
```

3. **Combined Divergence**:
```
divergence_penalty = (concept_overlap × 0.6) + (file_overlap × 0.4)
  → Weighted toward concepts (ideas diverge faster than file usage)
```

**When to Calculate Divergence**:
- On every 10 messages in a branch (not every message - too expensive)
- When user switches branches (compute relationship to current branch)
- Nightly batch job (recalculate all relationships, cache results)

**Example**:

Branch A and Branch B start as siblings (+0.15 relationship modifier)

After 20 messages:
- Branch A: Focuses on RAG implementation details
- Branch B: Focuses on pricing strategy

Concept overlap drops from 0.8 → 0.3 (diverged)

**Branch A perspective**:
```
Branch B weight = 0.5 (base)
                × 1.15 (sibling modifier)
                × 0.9 (temporal, 1 week old)
                × 0.0 (no interaction boost)
                × 0.3 (divergence penalty)
                = 0.16 (very low, out of context boundary)
```

**Branch B perspective** (if it references Branch A file):
```
Branch A file weight = 0.5 (base semantic)
                     × 1.15 (sibling modifier)
                     × 1.0 (just edited)
                     × 0.2 (interacted yesterday)
                     × 0.3 (divergence)
                     = 0.21 (still low, divergence dominates)
```

**Result**: Siblings that diverge naturally fall out of each other's context, even though graph relationship stays

**Is this overkill?**

**Complexity**: Medium-high
**Value**: High (prevents context pollution from irrelevant siblings)
**Performance cost**: Low (batch calculation, cache results)

**Pragmatic Implementation**:

**MVP** (Week 1-4):
- Base weight + relationship modifier + temporal factor only
- NO divergence penalty (assume all siblings are relevant)

**V2** (Week 5-8):
- Add interaction boost (simple timestamp check)

**V3** (Month 2-3):
- Add divergence penalty (concept overlap only, not file overlap)
- Nightly batch job to recalculate
- Cache in Redis (relationship_weights table)

**Math Process**:

Not complex, just multiple factors:
1. Query relationship graph (fast, indexed)
2. Query last interaction timestamp (fast, indexed)
3. Query concept overlap (moderate, cached)
4. Multiply factors (instant)

**Total calculation time**: <50ms per file/conversation reference

**Storage**:

Cache in Redis:
```
Key: "relevance:{conversation_id}:{entity_id}"
Value: {
  base: 0.5,
  relationship: 0.15,
  temporal: 0.9,
  interaction: 0.2,
  divergence: 0.3,
  final: 0.08,
  calculated_at: timestamp
}
TTL: 1 hour (recalculate if expired)
```

**Objective Assessment**:

| Aspect | Score | Reasoning |
|---|---|---|
| Aligned with goals | ✅ YES | Maintains optimal context as system grows |
| Necessary complexity | ✅ YES | Static weights insufficient at scale |
| Performance feasible | ✅ YES | Batch + cache makes it fast |
| User value | ✅ HIGH | Better context = better responses |
| Implementation cost | 🟡 MEDIUM | Not trivial, but not complex either |

**Recommendation**: Implement in phases (MVP → V2 → V3), validate impact at each phase

---

**This is the complete system model. All pieces are defined, all interactions are specified, all gaps are addressed.**
