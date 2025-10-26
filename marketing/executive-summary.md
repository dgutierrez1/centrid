# Executive Summary: Centrid Strategic Positioning

**Date**: 2025-10-25
**Status**: Strategic Analysis Complete → Ready for Validation

---

## The Strategic Pivot

### What Changed

**Original Hypothesis**: Knowledge OS with AI-detected connections, workflow memory, and behavioral learning

**Discovery**: After researching Claude's 2025 capabilities (Projects, Artifacts, Memory, MCP, Skills), we found Claude has caught up on file management and workflow tools. However, we discovered an **unsolved problem** through user feedback:

> "I was suffering a technical problem: context fragmentation when analyzing topics, subtopics, threads and keeping context synced across those interactions."

**New Strategy**: **Branching + Filesystem Integration** - solving context fragmentation in deep exploration with production-ready deliverables

---

## The Core Problem

**Context Fragmentation in Deep Research**

When exploring complex topics:
- Need to try multiple approaches in parallel
- Want to capture findings as artifacts
- Must consolidate insights into deliverables
- Can't afford to lose any exploration path

**Current Solutions Fail**:
- ChatGPT: Linear conversations, no branching, ephemeral outputs
- Notion: Manual organization, no AI-native exploration
- Claude + MCP: External file access, but no conversation branching or artifact provenance

---

## Our Solution: Complete Workflow Integration

### The Workflow

```
Research: "AI Agent Architecture"
│
├─ Branch 1: "RAG patterns"
│  ├─ Explore: chunking, embeddings, retrieval
│  └─ CAPTURE: "rag-comparison.md" (saved with context)
│
├─ Branch 2: "Orchestration"
│  ├─ AUTO-ACCESS: "rag-comparison.md" (from Branch 1)
│  └─ CAPTURE: "orchestration-patterns.md"
│
└─ CONSOLIDATE: "Generate decision doc"
   ├─ AI accesses all artifacts + conversation context
   └─ OUTPUT: "ai-agent-decision.md" (production-ready)
```

### Why This Works

1. **Branching**: Explore alternatives without context loss
2. **Filesystem**: Capture artifacts with conversation provenance
3. **Integration**: Cross-branch references + automatic consolidation
4. **Production**: Generate deliverables, not just insights

---

## Competitive Moat Analysis

### What Claude Can't Do (Updated 2025)

Claude has:
- ✅ Projects (file uploads, 200K context)
- ✅ Artifacts (file creation)
- ✅ Memory (synthesis-based)
- ✅ MCP (database/API connections)
- ✅ Skills (manual workflows)

Claude CANNOT:
- ❌ Branch conversations at decision points
- ❌ Capture artifacts FROM branches with context
- ❌ Auto-reference artifacts across branches
- ❌ Consolidate outputs from multiple exploration paths
- ❌ Provide provenance (which branch created what)
- ❌ Template entire exploration workflows

**The Moat**: Integration is the defensibility. Building both features + native integration = major product pivot for Claude. They optimize for 100M general users, we optimize for 10K-100K power users.

### Switching Cost Mechanics

**After 50+ artifacts**:
- Knowledge graph of exploration paths
- Artifact provenance (which branch → which finding)
- Templates of successful workflows
- Cross-branch references embedded in work

**Switching = Rebuilding Everything Manually**

---

## Market Opportunity

### Total Addressable Market (TAM): 30M Users

| Segment | Size | Why They Need This |
|---------|------|-------------------|
| Researchers | 8M | Literature reviews, paper analysis |
| Engineers | 5M | Technical decision documents |
| Product Managers | 1M | Feature specs from multiple explorations |
| Independent Consultants | 5M | Client deliverables with rationale |
| Content Creators | 5M | Articles from research branches |
| Business Analysts | 3M | Reports from parallel analyses |
| Market Researchers | 2M | Consolidated research findings |
| Technical Writers | 1M | Documentation from exploration |

### Serviceable Addressable Market (SAM): 6M Users
Users who experience context fragmentation in deep work

### Serviceable Obtainable Market (SOM) - Year 3: 50K Users
**Revenue**: 50K users (avg $25/mo blended) = **$15M ARR**
- 60% Plus ($19/mo): 30K × $19 = $6.84M
- 40% Pro ($39/mo): 20K × $39 = $9.36M

---

## Pricing Strategy

> **📄 Full details**: [pricing-strategy.md](./pricing-strategy.md)

| Tier | Price | Haiku 4.5 | Sonnet 4.5 Credits | Margin |
|------|-------|-----------|-------------------|--------|
| Free | $0 | 40/month | 0 | - |
| **Plus** | **$19/mo** | Unlimited | 60 (standard OR extended thinking) | 50% |
| **Pro** | **$39/mo** | Unlimited | 140 (standard OR extended thinking) | 53% |

**Credit system**: 1 credit = 1 request. Users choose standard (quick) or extended thinking (AI shows reasoning) per request.

**Competitive Position**: $19 undercuts ChatGPT/Claude ($20), $39 matches GitHub Copilot Pro+ ($39)

**Why Users Pay**: Production deliverables, hours saved on consolidation, easy ROI for consultants ($150-300/hr), switching costs (artifact lock-in)

---

## MVP Scope (8 Weeks)

### Week 1-2: Basic Branching + Filesystem
- Create branch from any message
- Child inherits parent context (explicit files)
- Save conversation output as file
- View files in sidebar with provenance

### Week 3-4: Context-Aware Artifact Capture
- "Save this analysis as file" → captures with conversation context
- File metadata: origin conversation, parent context
- Filesystem shows creation provenance

### Week 5-6: Cross-Branch Artifact Referencing
- AI auto-detects relevant artifacts from other branches
- "Based on your [artifact] from Branch X..." suggestions
- Manual "Load artifact into context" option

### Week 7-8: Smart Consolidation
- "Generate report from all branches"
- AI synthesizes conversations + artifacts
- Output includes provenance (which branch contributed what)

**MVP User Flow**:
```
1. User: "Research AI agents"
2. Explore, branch to "RAG patterns"
3. User: "Save this as rag-analysis.md"
   → System saves with conversation context
4. Branch to "Orchestration"
   → AI: "I see you explored RAG (rag-analysis.md). I'll reference that."
5. User: "Generate decision doc"
   → AI consolidates both branches + artifacts
```

---

## Success Metrics

### Month 1 (MVP)
- 100 beta users
- 70% create branches (up from 50% - filesystem makes branching valuable)
- 50% save at least 1 artifact
- 30% use artifact in another branch
- NPS >45

### Month 3
- 500 users
- Avg 10 branches per user
- Avg 15 artifacts per user
- 40% use cross-branch references
- 40% retention

### Month 6
- 2,000 users
- Avg 25 branches per user
- Avg 50 artifacts per user
- 60% use consolidation feature
- 50% retention
- 10 shared templates in marketplace

### Month 12
- 5,000 users
- Avg 50 branches per user
- Avg 100 artifacts per user
- 70% retention (proof of switching cost)
- 20% paid conversion
- 100+ templates in marketplace
- **$110K MRR ($1.32M ARR)**

**Proof of Moat**:
- Users with 50+ artifacts have <5% churn
- Users who create templates become advocates (NPS >80)
- Templates get 100+ uses each (network effects)

---

## UX Approach: Filesystem Primary + Tree Toggle

**Design Philosophy**: Don't force branching complexity immediately. Progressive disclosure.

### Default View: Filesystem Primary
```
Files sidebar (familiar) → Chat → Context panel
```

Users browse files normally. Branching happens contextually when needed.

### Key UX Decisions

1. **All Branches Persist** - Never auto-delete, user has full control
2. **Files are Global** - Organized by topic, not by branch
3. **Context is Dual** - Explicit (user-selected, weight 1.0) + Semantic (AI-retrieved, weight 0.5)
4. **Tree View Optional** - Toggle to see conversation structure when needed
5. **Provenance Subtle** - Files show "Created in Branch A" badge on hover

### Why This Works
- Start with familiar (file tree)
- Branching feels like "parallel conversations with same files"
- Context panel shows transparency (what AI sees)
- Power features emerge when needed

---

## Technical Foundation (Already Built)

From spec 003-backend-mvp-setup:
- ✅ Shadow filesystem with embeddings
- ✅ File storage (Supabase)
- ✅ Real-time sync
- ✅ Vector search (pgvector)
- ✅ Semantic retrieval

**What's Needed**:
- Conversation DAG (parent-child relationships)
- Artifact provenance metadata
- Cross-branch reference tracking
- Consolidation engine

---

## Validation Plan (Week 1)

**Interview 20 Users** (10 researchers, 10 consultants):

1. "Do you lose context when exploring complex topics?" (Problem validation)
2. "Do you want to capture findings as artifacts?" (Solution validation)
3. "Would you pay $19/mo for branching + artifact management?" (Pricing validation)

**Success Criteria**:
- 80%+ confirm context fragmentation problem
- 70%+ interested in artifact capture
- 50%+ willing to pay $15-25/mo (Plus tier range)

---

## Risk Assessment

### High Risk: Claude Builds This

**Likelihood**: MEDIUM (they move fast, but product philosophy mismatch)

**Why Claude Might Not**:
- Privacy-first isolation (conflicts with cross-project connections)
- Conversation-first architecture (branching adds complexity for 100M users)
- MCP strategy (external tools, not native integration)
- Different scale = different product

**Our Response if They Do**:
- Week 1: Reassess category positioning
- Consider pivot to vertical (consultants only)
- Consider pivot to team/enterprise features
- Consider integration layer (works WITH Claude via API)

### Medium Risk: Market Too Niche

**Mitigation**:
- Broader TAM than branching alone (30M vs 15M)
- Production use cases (not just research)
- Network effects via templates
- Price point proves value ($19-39/mo tiers)

### Low Risk: Technical Complexity

**Mitigation**:
- Shadow filesystem already built
- Conversation DAG is standard graph structure
- Provenance is metadata (not complex)
- Consolidation is prompt engineering

---

## Why This Is The Answer

1. **Solves Real Problem** - Context fragmentation in deep research (validated by user)
2. **Complete Workflow** - Explore → Capture → Consolidate → Ship (not just one piece)
3. **Defensible** - Integration moat + switching cost + templates
4. **Broader Market** - 30M TAM (researchers + consultants + PMs + writers)
5. **Leverages Work Done** - Filesystem already implemented
6. **Claude Can't Easily Pivot** - Product philosophy mismatch (100M vs 10K users)
7. **Production-Ready** - Generates deliverables, not just insights
8. **Competitive Price** - $19/mo undercuts ChatGPT, $39/mo for premium (production tool value)

---

## Next Steps

### Immediate (This Week)
1. **User Validation** - Interview 20 users (problem, solution, pricing)
2. **Spec Update** - Update 004-ai-agent-system/spec.md to reflect new strategy
3. **Architecture Design** - Detail conversation DAG + provenance system

### Week 2-8 (Build MVP)
1. **Core Branching** - Fork conversations with context inheritance
2. **Artifact Capture** - Save with provenance metadata
3. **Cross-Branch References** - Auto-load relevant artifacts
4. **Consolidation** - Generate reports from branches

### Week 8 (Launch)
1. **Beta Recruitment** - 100 users from Reddit (r/ClaudeAI), Twitter
2. **Onboarding** - "Try branching on this complex research question"
3. **Measure** - Artifact creation, cross-branch usage, consolidation

### Week 9-12 (Iterate)
1. **Visual Tree** - If users get lost
2. **Templates** - If users repeat patterns
3. **Sharing** - If users want to show their work

---

## Conclusion

We've found a **defensible position** that leverages our technical foundation (shadow filesystem) and solves a **validated problem** (context fragmentation) in a way that **Claude structurally cannot replicate** without major product pivot.

**The unfair advantage**: We're building the COMPLETE workflow for power users (explore → capture → consolidate → ship), while Claude optimizes for 100M general users. Different scale = different product = different moat.

**Action Required**: User validation to confirm willingness to pay $19-39/mo for this workflow.

**Timeline**: 8 weeks to MVP, 12 weeks to prove retention moat.

**Revenue Target**: $15M ARR (Year 3) with 50K users at avg $25/mo blended rate

---

## Supporting Documents

- `/marketing/claude-memory-analysis.md` - Competitive research
- `/marketing/mvp-moat-strategy.md` - Updated positioning matrix
- `/marketing/approach-comparison.md` - Three approaches analyzed
- `/marketing/branching-filesystem-integration.md` - Complete strategy + UX design (42KB)
- `/specs/004-ai-agent-system/spec.md` - Current spec (needs update)

**Primary Reference**: `/marketing/branching-filesystem-integration.md` contains complete strategy, use cases, technical architecture, and UX design.
