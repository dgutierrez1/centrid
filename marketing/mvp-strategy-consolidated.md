# Centrid MVP Strategy: Branching + Filesystem Integration

**Date**: 2025-10-25
**Status**: Complete Strategic Design
**Purpose**: Define the complete product strategy, technical architecture, and execution plan

---

## Executive Summary

**What we're building**: An exploration workspace where branching conversations and persistent filesystem are unified through provenance, enabling users to explore complex topics without context fragmentation.

**The problem we solve**: Researchers, consultants, and knowledge workers exploring complex topics suffer from context fragmentation when trying multiple approaches in parallel. Current tools force linear exploration (ChatGPT) or manual organization (Notion).

**Our solution**: Branching conversations + persistent filesystem + cross-domain knowledge graph = complete workflow (Explore → Capture → Reference → Consolidate → Ship)

**Why it's defensible**: Integration moat - requires building branching + filesystem + provenance + knowledge graph + concepts + dynamic weighting simultaneously. Not a feature add, it's architectural foundation.

---

## Strategic Positioning

### The Category

**Not**: "AI chat with better memory"
**Not**: "Notion with AI"
**Yes**: "Exploration workspace for deep research"

### What Makes Us Different

**ChatGPT/Claude**: Linear conversations, ephemeral outputs
**Notion**: Manual organization, no branching exploration
**Centrid**: Branching exploration with artifact capture and provenance

### The Unified Product Model

```
Exploration (temporal)  →  Artifacts (persistent)
    Branching                  Filesystem
    ^                              ^
    |                              |
    └──────── Provenance ──────────┘
```

**Core concept**: Files are artifacts of exploration. Conversations are exploration paths. Provenance connects them.

**Key insight**: Don't force users to choose between "file view" or "conversation view". They're the same thing viewed from different angles.

---

## The Four Persistent Domains

### 1. Filesystem Domain
**What it stores**: Files, folders, content, embeddings
**Updated by**: User edits, agent writes (with approval)
**Organized by**: Topic hierarchy (folders)
**Key feature**: Global namespace - any conversation can access any file

### 2. Chat Graph Domain
**What it stores**: Conversations, messages, branching relationships
**Updated by**: User actions (branch, send message)
**Organized by**: DAG (parent-child branches)
**Key feature**: Parent-child inheritance with context isolation

### 3. User Profile Domain
**What it stores**: Preferences, behavioral patterns, style profile
**Updated by**: System (automatic learning from 3 sources: requests + edits + actions)
**Organized by**: User ID
**Key feature**: Multi-source behavior tracking with temporal weighting

### 4. Knowledge Graph Domain
**What it stores**: Connections across all domains
**Updated by**: System (automatic detection)
**Organized by**: Graph (nodes + edges)
**Key feature**: Cross-domain concept tracking (files ↔ conversations ↔ concepts)

---

## The Complete Workflow

### How It Works

**User exploration**:
```
Main: "Research AI Agents"
│
├─ Branch A: RAG Deep Dive
│  ├─ Explore (conversation)
│  └─ Capture: rag-analysis.md (file with provenance)
│
├─ Branch B: Orchestration
│  ├─ Inherits context from Main
│  ├─ Auto-loads rag-analysis.md (semantic match + sibling boost)
│  └─ Capture: orchestration-notes.md
│
└─ Consolidate (from Main)
   ├─ AI accesses both files + provenance
   └─ Output: decision-doc.md (references both branches)
```

**Why this works**:
1. Exploration stays in conversations (temporal, branching)
2. Outputs persist as files (global, reusable)
3. Provenance connects them (context inheritance)
4. Consolidation leverages both (complete picture)

---

## Context Assembly (The 9-Layer System)

**Context is computed dynamically per request from all 4 domains**

**Step 1: Detect Intent**
- Analyze user message (compare/implement/analyze/consolidate)
- Intent shapes initial context priming

**Step 2: Gather Explicit Context (Layer 1)**
- Files user manually added via pills
- Weight: 1.0 (highest priority, NEVER truncated)

**Step 3: Semantic Search (Layer 2)**
- Embed user message, search file embeddings
- **Optimization**: Each embedding stored with node summary (file title, structure outline, key concepts)
- Agent sees summary first → decides whether to pull full content via `read_file()`
- Apply temporal decay (recent = higher weight)
- Apply intent boost (compare → favor docs, implement → favor code)
- Weight: 0.5 base (modified by temporal and intent)

**Step 4: Branch Context (Layer 3)**
- Inherit explicit files from parent
- Parent conversation summary (last 50 messages → 2 paragraphs)
- Calculate branch relationships (siblings, parent, child, cousins)
- Apply relationship modifiers (siblings +0.15, parent/child +0.10, cousins +0.05)
- Weight: 0.7 base

**Step 5: Knowledge Graph (Layer 4)**
- Files connected to current files
- Conversations that explored similar topics
- Concepts mentioned across domains
- Prioritize sibling branch connections
- Limit to 2 hops (prevent explosion)
- Weight: 0.6 base + relationship modifiers

**Step 6: Conversation Search (Layer 5)**
- Search conversation summary embeddings
- Enable "Find branch where I discussed X"
- Return top 5 matches
- Weight: 0.6

**Step 7: Concept Extraction (Layer 6)**
- NER (Named Entity Recognition) for entities
- Topic modeling for themes
- Keyphrase extraction
- Link concepts across files, conversations, concepts
- Purpose: Cross-cutting discovery

**Step 8: User Profile (Layer 7)**
- Style preferences (tone, verbosity, structure)
- Behavioral patterns from 3 sources:
  - Message content analysis
  - Direct file edits
  - UI actions (copy, regenerate, navigation)
- Temporal weighting (recent > old)
- Purpose: Affects HOW agent responds

**Step 9: Chat History (Layer 8)**
- Last 10 messages: Full (never truncated)
- Messages 11-50: Summarized
- Messages 51+: Omitted (agent can call for them)

**Step 10: Provenance (Layer 9)**
- Which conversation created each file
- At which message
- Why created (context summary)
- Relationship to current conversation (graph distance)
- Purpose: Enriches AI understanding

**Step 11: Context Size Check**
- If over 180K (90% buffer): Optimize (summarize, compress, reduce)
- If over 195K (98% hard limit): Warn user

---

## Dynamic Relevance Scoring

**Formula**: `base × relationship × temporal × interaction × divergence`

**Components**:
- **Base**: Explicit (1.0), Semantic (0.5), KG (0.6)
- **Relationship**: Siblings +0.15, Parent/Child +0.10, Cousins +0.05
- **Temporal**: `1.0 - (months_since_last_interaction × 0.05)`, floor 0.3
- **Interaction**: Last 7 days +0.2, Last 30 days +0.1
- **Divergence**: `(concept_overlap × 0.6) + (file_overlap × 0.4)` - Siblings diverge over time

**Calculation**: Every 10 messages + branch switch + nightly batch, cached in Redis (1hr TTL), <50ms per entity

---

## Context Window Management

**Total**: 200K tokens
- **Agent Response**: 40K (20%) - Reserved for reasoning, planning, drafting (free workspace)
- **Context Budget**: 150K (75%) - Available for context layers
- **System/Buffers**: 10K (5%) - System prompts, safety buffer

**Layer Budgets** (within 150K):
- Explicit 50K (never truncate)
- Semantic 35K (top 5)
- Messages 20K (last 10 full)
- KG 18K (reduce depth)
- Parent 12K (summary)
- Provenance 8K
- Concepts 5K
- Profile 2K

**Tool Calls**: Max 5/turn, warn agent at 140K context usage, compress results

**Growth Scaling**: <100 files (full context) → 100-1K (reduce semantic, KG 1-hop) → 1K-10K (top 3, aggressive summary) → 10K+ (KG disabled, agent queries)

---

## Agent Tool Calls

**Domain-specific queries**: `search_files()`, `search_conversations()`, `search_concepts()`, `search_all()`, `read_file()`, `query_knowledge_graph()`, `read_conversation_history()`

**File operations**: `write_file(path, content)` - Create/update files with user approval, auto-adds provenance

**Branch operations**: `create_branch(title, context_files)` - Agent proposes branches with user approval (same as `write_file()`)

**Use cases**:
- **Parallel work**: "I could explore RAG in one branch and orchestration in another - approve?"
- **Multi-angle**: "Let me create 3 branches for different approaches - approve?"
- **Topic separation**: "This pricing question deserves its own branch - create it?"

**Flow**: System primes initial context → Agent calls tools for missing content OR creates branches for parallel work

---

## UX Design

### Layout (Conversation-First)

**Desktop**: `[Branch Nav Left (collapsible)] [Conversation Center (full width)]`

**Mobile**: Conversation full screen, branch nav as drawer

**No file sidebar** - Files discovered contextually (semantic search, provenance, in-conversation artifacts)

### Conversation Center

**Always visible**:
- Message history
- Context sections (inline above input, collapsible):
  1. Explicit pills (user-selected files)
  2. Semantic matches (auto-found)
  3. Branch context (parent/siblings with weights)
  4. Artifacts from this chat
  5. Knowledge graph (expandable)
  6. Context budget (expandable)
- Message input

**File editing**: Click any file → opens overlay/modal editor (doesn't change layout), shows provenance in header

### Branch Navigation (Left Sidebar)

**Shows**: Current branch, parent, siblings (divergence indicators), children, search

**Branch creation** (all require user approval):
- **User**: Button in chat header
- **Agent**: Proposes branches for parallel work, user approves/rejects
- **System**: Prompts when topic shift detected, user approves/rejects

### Topic Shift Detection

**When system prompts**:
- Semantic distance from parent conversation >0.7
- User asks unrelated question
- Agent identifies multi-angle exploration opportunity

**Prompt**: "This topic diverges from current branch. Create new branch? [Yes] [No, continue here]"

### Progressive Disclosure

- **New users**: Conversation + pills (ChatGPT-familiar)
- **Intermediate**: Branch prompts appear, semantic matches visible
- **Power users**: Full tree, agent auto-branching, KG, divergence tracking

---

## How Domains Interact

### Creating a File
1. Agent calls `write_file(path, content)` with user approval
2. Filesystem: Create file with metadata (created_in_conversation_id, context_summary)
3. System: Generate embeddings + node_summary (title, structure, key concepts)
4. Chat Graph: Current conversation references new file
5. Knowledge Graph: Create nodes and edges (Conversation → File, File ↔ related Files)
6. Next message: File auto-included in explicit context + related files via semantic

### Branching a Conversation

**User-initiated**:
1. User clicks "Create Branch"
2. Chat Graph: Create new conversation (parent_id = current)
3. Copy explicit_files from parent (NOT messages)
4. Knowledge Graph: Create edge (Parent → Child branched_to)
5. First message in branch: Parent explicit files + parent summary + KG connections

**Agent-initiated**:
1. Agent calls `create_branch(title, context_files)` and presents approval UI
2. User approves/rejects (same pattern as file edits)
3. If approved: System creates branch with specified context
4. Agent can work in multiple branches simultaneously, consolidate later

**System-prompted**:
1. System detects topic shift (semantic distance >0.7 from parent)
2. Shows prompt: "This diverges from current branch. Create new branch?"
3. If yes: Creates branch, if no: continues in current conversation

### Agent Edits File
1. Agent calls `write_file(path, updated_content)` with user approval
2. Filesystem: Update content, last_modified timestamp
3. System: Regenerate embeddings + node_summary (new structure, updated concepts)
4. Knowledge Graph: Re-evaluate edges, update weights
5. All conversations referencing this file: Auto-get updated content + new related files

### System Learns Behavior
1. User Profile: Track action (copy/edit/regenerate), analyze patterns
2. Affects next response: Agent uses learned preferences
3. No change to Filesystem, Chat Graph, or Knowledge Graph (separate domain)

---

## Design Validation (Critical Questions Answered)

**Q1: Tool Call Flow** - Two-phase (system primes → agent queries) optimal for dynamic context loading

**Q2: Domain-Specific Queries** - Separate embeddings per domain (files/conversations/concepts) needed for speed and accuracy

**Q3: Context Window at Scale** - Multi-tier budgets (explicit 60K, semantic 40K, KG 20K) + dynamic adjustment + growth scaling (<100 files → 10K+ files)

**Q4: Temporal Decay** - Based on LAST INTERACTION (not creation date), keeps actively-used files fresh regardless of age

**Q5: Context Panel** - Six sections (files, chat graph, explicit, semantic, KG, budget) with click for provenance, hover for weight breakdown

**Q6: Dynamic Weights with Divergence** - `base × relationship × temporal × interaction × divergence` prevents sibling pollution as branches diverge (MVP: first 3 factors, V3: add divergence)

---

## Technical Architecture

### Data Layer (Postgres)

**Tables**:
- **Filesystem**: files (path, content, embeddings, **node_summary** for fast context decision-making)
  - `node_summary`: file title, structure outline (headings), key concepts (auto-extracted)
  - Returned with embedding search results before full content pull
- **Chat Graph**: conversations (parent relationships), messages, conversation_context
- **User Profile**: user_profiles (style, behavioral patterns, preferences)
- **Knowledge Graph**: kg_nodes (entities with summaries), kg_edges (relationships with confidence)
- **Cross-cutting**: file_references (tracking), file_interactions (last interaction)

**Indexes**:
- Vector index on file embeddings (ivfflat)
- Graph traversal: conversation parent_id, KG source/target
- Context lookup: file_references by conversation
- Interaction lookup: file_interactions by file_id

### Context Resolution Service

**Responsibilities**:
- Build complete context from user ID, conversation ID, message
- Sub-queries: Explicit, semantic, parent, KG, profile, history, provenance
- Token tracking and optimization
- Tool call management

**Caching**:
- L1 (in-memory): User profiles, recent conversations
- L2 (Redis): Semantic search, KG queries, relevance scores
- L3 (Postgres): Source of truth

**Invalidation**:
- File update → invalidate semantic + KG
- New message → invalidate history + conversation embedding
- User action → invalidate behavior profile
- KG edge change → invalidate KG cache

---

## MVP Scope (8 Weeks)

### Phase 1: Core Integration (Week 1-4)

**Build**:
- Conversation branching (parent-child relationship)
- File creation with provenance (created_in_conversation_id)
- Context inheritance (explicit files only, no messages)
- Basic cross-branch reference (semantic search finds files from other branches)

**Validate**:
- Do users understand branching?
- Do they create files?
- Do they reference files across branches?

### Phase 2: Consolidation (Week 5-6)

**Build**:
- "Generate report from branches" command
- Tree traversal for consolidation
- Provenance in AI prompts ("This came from Branch A")

**Validate**:
- Do users create multi-branch explorations?
- Do they consolidate into final outputs?
- Is provenance useful or confusing?

### Phase 3: Polish (Week 7-8)

**Build**:
- Visual tree view (optional)
- Provenance UI (hover on files)
- Better context panel (show provenance source)
- Context budget display

**Validate**:
- Does tree view help navigation?
- Do users notice/use provenance?
- Is context budget transparency helpful?

### Defer Post-MVP

- Branch merging
- Advanced consolidation
- Conversation embeddings (V2)
- Concept extraction (V2-V3)
- Divergence penalty (V2-V3)
- Profile learning (V2)
- Templates (V4)
- Collaboration (V4)
- Temporal reasoning (V5)
- Meta-learning (V5)

---

## Phased Implementation

### MVP (Week 1-8)
- Base weight + relationship modifier + temporal factor only
- NO divergence penalty (assume all siblings relevant)
- NO interaction boost
- NO concept extraction

**Why**: Prove core workflow value first

### V2 (Month 2)
- Interaction boost (timestamp check)
- Conversation embeddings (searchable branches)
- Profile learning (multi-source behavior)

**Why**: Enhance discovery and personalization

### V3 (Month 3)
- Divergence penalty (concept overlap)
- Concept extraction (NER + topics)
- Nightly batch job for relevance recalculation

**Why**: Prevent context pollution at scale

### V4 (Month 4-6) - Network Effects

**Templates**:
- Save exploration patterns as reusable workflows
- Share templates with community
- Marketplace of common patterns (literature review, product decisions, technical analysis)
- Network effects: More users = more templates = more value

**Collaboration**:
- Share exploration graphs between users (consultant + client, team research)
- Per-user permissions (view/edit/branch)
- Shared knowledge graph with provenance tracking
- Real-time multi-user branching

**Why unfair**: Community templates + team collaboration = network effects. Claude can't replicate (privacy constraints at 100M scale).

### V5 (Month 6-12) - Data Moat

**Temporal Reasoning**:
- "How did my thinking on pricing evolve from Jan to March?"
- Timeline view of concept evolution across branches
- Decision history with provenance ("What made me change my mind?")

**Meta-Learning**:
- Learn successful exploration patterns across users (privacy-preserving)
- "Users exploring RAG typically branch into: chunking, embeddings, retrieval"
- Suggest next branches based on aggregate patterns
- System intelligence improves with scale

**Why unfair**: Data moat compounds over time. Requires conversation history + provenance + concept tracking over months. Claude loses context between sessions, can't aggregate learnings (privacy).

---

## Competitive Moat

### What Claude Can't Do (2025)

**Claude has**:
- ✅ Projects (file uploads, 200K context)
- ✅ Artifacts (file generation)
- ✅ Memory (synthesis)
- ✅ MCP (external connections)
- ✅ Skills (manual workflows)

**Claude CANNOT**:
- ❌ Branch conversations
- ❌ Capture files with conversation provenance
- ❌ Auto-reference across branches
- ❌ Consolidate from exploration tree
- ❌ Track semantic divergence
- ❌ Dynamic relevance scoring
- ❌ **Multi-user collaboration** (privacy constraints at scale)
- ❌ **Community templates** (no network effects model)
- ❌ **Temporal reasoning** (no persistent conversation history)
- ❌ **Meta-learning across users** (privacy-first architecture)

**Why**: Product architecture mismatch
- Claude: Conversation-first (100M general users, privacy-focused, single-session)
- Centrid: Exploration-first (10K power users, persistent history, network effects)

**The moat**: Integration + network effects + data moat
- **MVP-V3**: Integration (branching + files + provenance + KG)
- **V4**: Network effects (templates + collaboration)
- **V5**: Data moat (temporal reasoning + meta-learning)

### Switching Cost Mechanics

**After 50+ artifacts (Month 1-3)**:
- Knowledge graph of exploration paths
- Artifact provenance (which branch → which finding)
- Cross-branch references embedded in work
- Behavioral profile tuned to user

**After templates + collaboration (Month 4-6)**:
- Saved workflow templates (20+ personal, 50+ community)
- Shared exploration graphs with team/clients
- Community reputation (template creator)

**After temporal + meta-learning (Month 6-12)**:
- 6-12 months of concept evolution history
- Decision timeline (provenance over time)
- System learned your exploration patterns
- Aggregate intelligence (system knows successful patterns)

**Switching = Losing 6-12 months of exploration history + team collaboration + community templates + learned intelligence**

---

## Target Market

### Primary: Deep Research Workers

**Who**:
- Researchers (literature reviews, paper analysis)
- Engineers (technical decision documents)
- Product Managers (feature specs from multiple explorations)
- Independent Consultants (client deliverables with rationale)
- Content Creators (articles from research branches)
- Business Analysts (reports from parallel analyses)

**TAM**: 30M users experiencing context fragmentation
**SAM**: 6M users (experience it daily)
**SOM Year 3**: 50K users × avg $25/mo = **$15M ARR**

### Why They Need This

**Pain**: Context fragmentation when exploring complex topics in parallel
- Lose exploration paths when conversations branch
- Ephemeral outputs not captured as artifacts
- Manual consolidation of findings
- Can't remember which branch had which insight

**Current solutions fail**:
- ChatGPT: Linear, no branching, ephemeral
- Notion: Manual organization, not AI-native
- Claude + MCP: External files, but no branching or provenance

**Our solution**: Complete workflow (Explore → Capture → Reference → Consolidate → Ship)

---

## Success Metrics

**Artifact Growth**: Week 2 (5-10) → Week 4 (15-25) → Week 8 (40-60) → Week 12 (100+, switching cost evident)

**Cross-Branch References**: Week 4 (1-2) → Week 8 (5-8) → Week 12 (15-20), 40% consolidation rate

**Retention by Artifacts**: 0-10 (60%) → 10-30 (70%) → 30-60 (85%) → 60+ (95% locked in)

**NPS by Cohort**: Light <30 (NPS 40) → Medium 30-60 (NPS 65) → Heavy 60+ (NPS 80+)

**Switching Cost**: Exit "found alternative" <5%, Reactivation from ChatGPT >60% within 2 weeks, 60+ artifacts = <5% churn

**Performance**: Context assembly <500ms, Semantic <200ms, KG <100ms (1-hop), Real-time sync <100ms

---

## Pricing

> **📄 Complete pricing details**: See [pricing-strategy.md](./pricing-strategy.md) for comprehensive analysis, cost breakdowns, and implementation requirements.

**Strategy**: Undercut ChatGPT/Claude with charm pricing ($19/$39) + credit-based system with extended thinking control

### Tiers Summary

| Tier | Price | Haiku 4.5 | Sonnet 4.5 Credits | Files | Margin |
|------|-------|-----------|-------------------|-------|--------|
| **Free** | $0 | 40/month | 0 | 20 | - |
| **Plus** | **$19/mo** | Unlimited | **60** | 200 | 50% |
| **Pro** | **$39/mo** | Unlimited | **140** | 500 | 53% |

### Credit System

**1 Sonnet credit** = 1 AI request (user chooses):
- **Standard mode**: Quick response, normal reasoning
- **Extended thinking mode**: AI shows its reasoning process (10K token budget)

**Key benefits**:
- User control: Choose when to use extended thinking
- Cost predictability: 10K budget prevents cost explosion
- Flexibility: Standard requests go further, extended thinking for complex tasks

### Economics

**Revenue model** (100 users: 60 Free, 32 Plus, 8 Pro):
- Costs: $522.40/month
- Revenue: $920/month
- Profit: **$397.60/month (43% margin)**
- Break-even: 14% free-to-paid conversion

**Worst case** (all extended thinking): Still 12% margin, profitable

### Competitive Position

- **ChatGPT Plus** ($20): We're $1 cheaper + branching + extended thinking control
- **Claude Pro** ($20): We're $1 cheaper + provenance + credit system
- **GitHub Copilot Pro+** ($39): We match price, research-focused

**Early adopter offer**: First 100 users get Plus at $15/mo lifetime (21% off)

---

## Launch Strategy

**Pre-Launch (Week 1-2)**: Interview 20 users, validate unified model, test pricing ($19/$39 tiers)

**Beta (Week 3-8)**: 20 users with complex exploration tasks, measure branch/file creation, cross-branch references, consolidation

**Launch (Week 9)**:
- **Tagline**: "Exploration workspace for deep research. Branch conversations, capture artifacts with provenance, consolidate from multiple paths. ChatGPT is linear. Notion is manual. Centrid is exploration-first."
- **Demo** (90s): Problem (ChatGPT loses context) → Solution (branching + capture + consolidate) → Proof (40 artifacts across 12 branches, switching cost)
- **Blog**: "Why We're Not Building Better ChatGPT" - moat is integration (branching + filesystem + provenance)

---

## Risk Mitigation

### Risk: Claude adds branching

**Likelihood**: MEDIUM (they move fast)

**Why they might not**:
- Strategic constraints (100M users, privacy-first, conversation-primary)
- Cost at scale (per-user graph for 100M = prohibitive)
- Category conflict (general vs specialist)

**If it happens**:
- Emphasize data advantage (12-month head start)
- Emphasize specialist focus (researchers vs everyone)
- Emphasize integration depth (9-layer context, divergence tracking)
- Accelerate V3 features (concept extraction, templates)

### Risk: Users don't understand branching

**Likelihood**: MEDIUM (new mental model)

**Mitigation**:
- Progressive disclosure (show branching only when needed)
- Filesystem primary (familiar navigation)
- Context panel transparency (what AI sees)
- Onboarding flow with example exploration

**Validation**: <20% confusion rate in beta

### Risk: Context pollution from irrelevant siblings

**Likelihood**: HIGH without divergence tracking

**Mitigation**:
- MVP: Accept some pollution (validate workflow first)
- V3: Divergence penalty (Month 2-3)
- User control: Exclude sibling branches manually

**Validation**: Monitor cross-branch reference quality

---

## Summary: The Complete System

**4 Persistent Domains**:
1. Filesystem (files, embeddings, **node summaries**, provenance)
2. Chat Graph (conversations, DAG, relationships)
3. User Profile (style, behavior, preferences)
4. Knowledge Graph (nodes, edges, concepts)

**9-Layer Context Assembly**:
1. Explicit (1.0)
2. Semantic (0.5 + temporal + intent) - **with node summaries for efficient pull decisions**
3. Branch context (0.7 + relationships)
4. Knowledge graph (0.6 + relationships)
5. Conversation search (0.6)
6. Concepts (enrichment)
7. User profile (personalization)
8. Chat history (last 10 full, rest summarized)
9. Provenance (metadata)

**Agent Capabilities**:
- **Response workspace**: 40K tokens (20% of total) for reasoning/planning/drafting
- **File operations**: `write_file()` with user approval, auto-adds provenance
- **Branch operations**: `create_branch()` with user approval (same pattern as files)
- **Smart retrieval**: Node summaries → informed pull decisions

**System Intelligence**:
- **Topic shift detection**: Prompts user to branch when semantic distance >0.7
- **Agent branching**: Proposes parallel branches, user approves/rejects
- **Multi-network operation**: Single request → agent proposes multiple branch workflows → user controls execution

**Dynamic Relevance**:
- Base × relationship × temporal × interaction × divergence
- Calculated every 10 messages + nightly batch
- Cached in Redis (1 hour TTL)
- Performance: <50ms per entity

**Key Principles**:
1. Files are global, context is per-conversation
2. Provenance is metadata, not structure
3. Branching is progressive (discover when needed)
4. Context is transparent (always show what AI sees)
5. Integration through provenance (files remember origin)
6. **Efficient context loading** (summaries first, full content on demand)

**MVP Timeline**: 8 weeks
**Target**: Deep research workers (30M TAM, 6M SAM)

**Pricing**: Free (40 Haiku) → Plus $19/mo (unlimited Haiku, 60 Sonnet) → Pro $39/mo (unlimited Haiku, 140 Sonnet, collaboration)
**Margins**: Plus 36%, Pro 39% (healthy, sustainable)

**Moat Evolution**:
- **MVP-V3 (Week 1 - Month 3)**: Integration (branching + filesystem + provenance + KG + concepts)
- **V4 (Month 4-6)**: Network effects (templates + collaboration)
- **V5 (Month 6-12)**: Data moat (temporal reasoning + meta-learning)

**Moat Strength**: 6/10 (MVP) → 9/10 (V5) - Claude cannot replicate network effects + data moat without rebuilding for power users

---

**This is the complete strategy. All pieces defined, all interactions specified, ready for implementation.**
