# Business Foundation: Centrid

**Date**: 2025-10-25
**Status**: Active
**Last Updated**: 2025-10-25 (aligned with branching + filesystem + provenance strategy)

---

## Business Model Canvas

### Value Proposition

**Core Innovation**: Exploration workspace where branching conversations and persistent filesystem are unified through provenance—enabling users to explore complex topics without context fragmentation.

**Problem Solved**: Researchers, consultants, and knowledge workers exploring complex topics suffer from context fragmentation when trying multiple approaches in parallel. Current tools force linear exploration (ChatGPT) or manual organization (Notion).

**Unique Value**: Branch conversations at any message → explore multiple approaches in parallel → capture outputs as artifacts with provenance → consolidate findings across branches. Unlike ChatGPT (linear conversations) or Notion (manual organization), Centrid enables deep research workflows: Explore → Capture → Reference → Consolidate → Ship.

**Key Insight**: Deep research isn't linear—it's a tree of exploration paths. ChatGPT forces linear chat. Notion forces manual organization. Centrid enables branching exploration with artifact capture and provenance tracking.

**Example Workflow**:
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

**User Workflows Enabled**:
1. **Parallel Exploration**: Branch at any message to try multiple approaches simultaneously
2. **Artifact Capture**: Outputs persist as files with conversation provenance
3. **Cross-Branch Reference**: Semantic search finds relevant files from sibling branches
4. **Consolidation**: Synthesize findings from multiple exploration paths into final output
5. **Context Preservation**: Every file knows: created_in_conversation_id, context_summary, last_updated_by_branch

### Customer Segments

**Primary Target**: Deep Research Workers
- **Roles**: Researchers (literature reviews), engineers (technical decisions), product managers (feature specs), independent consultants (client deliverables), content creators (articles from research), business analysts (reports from parallel analyses)
- **Psychographics**: Exploring complex topics requiring parallel investigation, frustrated by linear chat limitations, need to consolidate findings from multiple exploration paths
- **Behaviors**: Already paying $20/month for ChatGPT/Claude, creating manual workarounds (Google Docs + ChatGPT, Notion + copy-paste), losing exploration paths when conversations branch
- **Pain Point**: Context fragmentation when exploring in parallel—can't remember which branch had which insight, manual consolidation takes hours, losing context when switching between approaches
- **Decision Process**: Tries free trial, validates branching workflow, converts if eliminates manual consolidation

**TAM/SAM/SOM**:
- **TAM**: 30M users experiencing context fragmentation in deep research
- **SAM**: 6M users (experience it daily)
- **SOM Year 3**: 50K users × avg $25/mo = **$15M ARR** (60% Plus $19/mo, 40% Pro $39/mo)

**Secondary Target**: Teams (deferred to Month 6+)
- Small research teams (2-5 people)
- Consulting firms with shared client work
- Product teams with collaborative feature exploration
- Shared workspaces with branch permissions

**Non-Target Markets**:
- Casual AI users (don't need branching complexity)
- Code-focused developers (Cursor serves this segment)
- Enterprise (complexity and sales cycle don't fit MVP timeline)
- General productivity users (Notion serves this segment)

### Revenue Streams

**Primary Revenue**: SaaS subscription (recurring monthly revenue)

**Pricing Tiers**:

**Free Trial**: 7 days, no credit card required
- All Pro features unlocked
- Proves branching + consolidation value
- Goal: 40% consolidation rate (users create multi-branch explorations)

**Free - Explorer**:
- 40 Haiku requests/month (hard cap)
- 0 Sonnet requests (no premium AI)
- 20 files limit
- 5 active chats/branches
- Basic context (no KG, no concepts)

**Plus - $19/month**:
- **Unlimited Haiku requests** (no throttling)
- **60 Sonnet requests/month** (premium AI)
- 200 files limit
- Unlimited chats & branches
- Full context (KG, concepts, divergence tracking)
- Provenance metadata on all files
- Cross-branch consolidation
- Real-time sync across devices

**Pro - $39/month**:
- **Unlimited Haiku requests**
- **140 Sonnet requests/month** (2.3x more premium AI)
- 500 files limit
- Unlimited chats & branches
- Full context + Collaboration (deferred to V4)
- Provenance metadata on all files
- Cross-branch consolidation
- Real-time sync across devices
- Priority support
- Priority queue (2x faster)

**Team**: $75/month (deferred to Month 6+)
- All Pro features
- Shared workspaces (5 users included)
- Branch permissions and visibility controls
- Team analytics and exploration tree views
- Admin controls

**Enterprise**: Custom pricing (deferred to Year 2+)
- All Team features
- SSO, compliance, audit logs
- Dedicated support and SLA
- Custom integrations
- Professional services

**Value Justification**:
- ChatGPT Plus: $20/mo (linear conversations, ephemeral outputs)
- Claude Pro: $20/mo (linear conversations, no provenance)
- Centrid Plus: $19/mo ($1 cheaper + branching + artifacts + provenance)
- Centrid Pro: $39/mo (matches GitHub Copilot Pro+, 2.3x more premium AI)
- ROI for consultants: $150-300/hr billable rate = easy ROI on $19-39/mo
- Time savings: Consolidation automation saves 2-4 hours per complex research project

### Key Resources

**Technology Stack**:
- Next.js 14+ (Pages Router), React 18, TypeScript (frontend)
- Supabase (PostgreSQL + pgvector + Auth + Storage + Edge Functions + Realtime)
- Drizzle ORM for type-safe database access
- Claude API (Anthropic) for AI chat + RAG + consolidation
- Valtio for state management, Tailwind CSS for UI

**Critical Assets**:
- **Branching conversation architecture** (DAG with parent-child relationships)
- **Provenance tracking system** (files remember conversation origin)
- **9-layer context assembly** (explicit, semantic, branch context, KG, conversation search, concepts, profile, history, provenance)
- **Dynamic relevance scoring** (base × relationship × temporal × interaction × divergence)
- **Cross-branch consolidation engine** (tree traversal + synthesis)
- **User exploration graphs** (switching cost from 50+ artifacts with provenance)

**Intellectual Property**:
- First-mover in branching conversations + provenance-linked filesystem
- Integration moat: requires building branching + filesystem + provenance + KG + concepts simultaneously
- Not a feature add—it's architectural foundation

### Key Activities

**Core Development**:
- Branching conversation DAG infrastructure
- Provenance metadata tracking and display
- Context inheritance with relationship weights
- Cross-branch semantic search and consolidation
- Real-time sync infrastructure (branch state, file updates)
- Dynamic relevance scoring (siblings, parents, temporal decay)

**AI Operations**:
- Claude API integration (chat + consolidation)
- 9-layer context assembly (<500ms per request)
- Semantic search (<200ms)
- Knowledge graph queries (<100ms for 1-hop)
- Context window management (200K tokens: 40K agent response, 150K context, 10K buffer)
- Node summaries for efficient context loading

**Customer Success**:
- Onboarding: "Create first branch → explore → consolidate" workflow
- Activation: 40% create multi-branch explorations within first week
- Retention: Artifact growth (Week 2: 5-10, Week 8: 40-60, Week 12: 100+)
- Power user cultivation: 60+ artifacts = <5% churn (locked in)

### Key Partnerships

**Infrastructure Providers**:
- Supabase (database, auth, storage, Edge Functions, realtime)
- Vercel (frontend hosting)
- Anthropic (Claude API)

**Future Integrations** (Post-MVP):
- Google Drive (document import)
- Notion (workspace sync)
- Obsidian (knowledge graph export)
- Linear (project management with branching)

**Payment Processing**:
- Mercado Pago (Colombia market focus)
- Future: Stripe for international expansion

### Cost Structure

**Fixed Costs** (Monthly):
- Infrastructure: $50-150 (Supabase, Vercel)
- Development tools: $50
- Domain and SSL: $10
- Total fixed: ~$110-210/month

**Variable Costs** (Per Customer):
- Claude API: $8-12/customer/month (context assembly + chat + consolidation)
- Embeddings: $1-2/customer/month (semantic search)
- Database storage: $0.50/customer/month (pgvector + files + provenance metadata)
- Total variable cost: ~$10-15/customer/month

**Customer Acquisition**:
- Target CAC: <$50
- Channels: Content marketing (thought leadership on exploration workflows), community engagement (Hacker News, Reddit r/ChatGPT), word-of-mouth (power users)
- Paid ads deferred until organic validates product-market fit

**Team Costs** (8-Week MVP):
- 1 full-stack developer (solo founder opportunity cost)
- No external hires during MVP sprint

---

## Market Analysis

### Market Size

**Total Addressable Market (TAM)**: 30M users
- Knowledge workers experiencing context fragmentation in deep research
- Researchers, consultants, engineers, analysts, content creators
- Market sizing: Intersection of AI power users + complex topic exploration

**Serviceable Addressable Market (SAM)**: 6M users
- Users experiencing parallel exploration context loss daily
- Already paying for AI tools (ChatGPT Plus, Claude Pro)
- Need branching workflows (not just persistent context)

**Serviceable Obtainable Market (SOM)**: 50K users (Year 3)
- Year 1: 1,000-2,000 customers = $25K-50K MRR = $300K-600K ARR
- Year 2: 10,000 customers = $250K MRR = $3M ARR
- Year 3: 50,000 customers = $1.25M MRR = **$15M ARR**

**Conservative 3-Year Target**: $15M ARR (50K users × avg $25/mo blended rate)
- 60% Plus ($19/mo): 30K × $19 = $6.84M
- 40% Pro ($39/mo): 20K × $39 = $9.36M

### Market Trends

**AI Adoption Surge**: ChatGPT (100M+ users), Claude (10M+ users), power users emerging who use AI 10+ times daily for research and exploration.

**Context Fragmentation Pain Point**: As LLM usage increases, power users hitting limitations:
- Linear conversations force choosing one path (lose alternatives)
- Ephemeral outputs disappear when chat ends
- Manual consolidation from multiple chat threads takes hours
- Can't remember which conversation had which insight

**Willingness to Pay**: ChatGPT Plus (10M+ at $20/mo), Claude Pro (500K+ at $20/mo) demonstrate budget exists. Premium tier users underserved and seeking better solutions.

**Exploration Workflows**: Researchers, consultants, engineers need parallel investigation:
- Literature reviews (compare 5-10 papers across branches)
- Technical decisions (prototype multiple architectures)
- Client deliverables (explore 3-4 approaches before choosing)
- Feature specs (parallel user research + competitive analysis + technical feasibility)

**Mobile-First Productivity**: Knowledge workers expect on-the-go access. PWA enables rapid launch while maintaining native app transition path.

### Competitive Landscape

**ChatGPT/Claude (Direct Competitors)**:
- Strengths: Excellent AI, large user base, brand recognition
- Weaknesses: **Linear conversations only** (one path forward, no branching), ephemeral artifacts (disappear when chat ends), no provenance tracking
- Positioning: General-purpose AI chat
- **Our Advantage**: Branching is architectural (6-12 months retrofit), conflicts with simplicity for 100M users

**Notion AI (Closest Competitor)**:
- Strengths: Q&A with workspace context, document creation, GPT-4 + Claude powered
- Weaknesses: **No branching** (linear conversations), **no provenance** (can't see which conversation created what), workspace lock-in (tied to Notion), expensive ($20/user/mo Business plan required)
- Positioning: Workspace productivity assistant
- **Our Advantage**: Platform-independent, branching-first, provenance-linked artifacts

**Cursor (Adjacent Competitor)**:
- Strengths: AI + documents, excellent code integration
- Weaknesses: Code-focused, desktop-only, no branching or provenance
- Positioning: AI-powered code editor
- **Our Advantage**: Knowledge work focus (not code), mobile-first, branching workflows

**Obsidian + AI Plugins**:
- Strengths: Local-first, powerful plugin ecosystem, knowledge graph
- Weaknesses: No native branching conversations, plugin fragmentation, steep learning curve, no AI consolidation
- Positioning: Personal knowledge management
- **Our Advantage**: AI-native branching, automatic consolidation, simpler mental model

**Our Unique Position**: ONLY solution enabling:
1. **Branching conversations** (explore multiple approaches in parallel)
2. **Provenance-linked filesystem** (files remember conversation origin)
3. **Cross-branch consolidation** (AI synthesis across exploration tree)
4. **Context inheritance** (parent → child with relationship weights)
5. **Exploration-first** paradigm (not conversation-first or workspace-first)

**Clear Differentiation**: We're an **exploration workspace for deep research**, not a chat tool or workspace assistant.

---

## Unit Economics

### Customer Acquisition Cost (CAC)

**Target**: <$50 per paying customer

**Acquisition Breakdown**:
- Phase 1 (Beta, Weeks 1-4): $0 CAC (direct outreach, 20-30 users)
- Phase 2 (Launch, Weeks 5-8): $10-20 CAC (Hacker News, Reddit, Twitter)
- Phase 3 (Scale, Months 2-3): $30-50 CAC (content marketing, thought leadership)

**Acquisition Channels**:
- Organic: 60% (Hacker News "exploration workspace" positioning, Reddit, Twitter)
- Content: 30% (thought leadership on exploration workflows, SEO)
- Paid: 10% (deferred until organic validates)

### Lifetime Value (LTV)

**Target**: >$400 per customer (artifact-driven switching costs)

**LTV Calculation**:
- Average subscription: $25/month (blended: 60% Plus $19, 40% Pro $39)
- Expected retention: 85% month-over-month (artifacts create lock-in)
- Average customer lifetime: 24 months
- Gross LTV: $25 × 24 = $600
- Blended COGS: $16.84/month (60% Plus $12.23, 40% Pro $23.75)
- Net LTV (after COGS): $600 - ($16.84 × 24) = $196

**Switching Cost Mechanics** (drives retention):
- After 50+ artifacts: Knowledge graph of exploration paths, provenance metadata, templates of successful workflows, cross-branch references embedded in work
- Switching = Rebuilding Everything Manually
- Retention by artifacts: 0-10 (60%), 10-30 (70%), 30-60 (85%), 60+ (95% locked in)

### LTV:CAC Ratio

**Target**: >10:1 (gross), >3:1 (net after COGS)

**Current Projection**:
- Gross LTV: $600
- CAC: <$50
- Gross LTV:CAC: 12:1 ✅
- Net LTV (after COGS): $196
- Net LTV:CAC: 3.9:1 ✅

**Validation Milestones**:
- Week 8: Validate 40% consolidation rate (users creating multi-branch explorations)
- Month 3: Validate artifact growth (Week 8: 40-60 artifacts per user)
- Month 6: Validate 60+ artifacts cohort has >90% retention

### Payback Period

**Target**: <12 months

**Calculation**:
- CAC: $50
- Net monthly revenue (after COGS): $25 - $16.84 = $8.16
- Payback period: $50 / $8.16 = 6.1 months ✅

**Cash Flow Implications**:
- Break-even on customer: 6-7 months
- Profitable after: Month 7+
- Enables reinvestment: 67% of revenue profitable after month 6

### Churn Rate

**Target**: <15% annual churn (>85% month-over-month retention)

**Churn Prevention** (artifact-driven lock-in):
- Activation: 40% create multi-branch explorations within first week
- Artifact growth: Week 2 (5-10), Week 8 (40-60), Week 12 (100+)
- Switching costs: Users with ≥60 artifacts have <5% churn
- Habit formation: Branching exploration becomes workflow (can't imagine working without it)

**Retention Metrics**:
- Week 2 retention: 70% target (validates activation)
- Month 1 retention: 60% target (validates branching adoption)
- Month 6 retention: 75% target (validates artifact lock-in)
- Power user retention (60+ artifacts): >90%

---

## Pricing Strategy

### Pricing Model

**Model**: Simple tiered subscription (freemium deferred until product-market fit)

**Philosophy**:
- Value-based pricing: Undercut ChatGPT/Claude ($20) with charm pricing ($19 Plus tier)
- Multi-tier conversion funnel: Free → Plus ($19) → Pro ($39)
- Premium positioning: $19-39/mo signals quality (exploration workspace, not chat tool)
- Trial-driven conversion: Free tier proves branching + consolidation value

**Why Multi-Tier Freemium**:
- Free tier proves value without friction (40 Haiku requests)
- Plus tier ($19) captures "under $20" psychological threshold
- Pro tier ($39) monetizes power users (2.3x more premium AI)
- Conversion funnel: Free users hit limits → upgrade to Plus → heavy users upgrade to Pro

### Pricing Tiers

See detailed tier breakdown in Pricing section above (Free Explorer, Plus $19/mo, Pro $39/mo).

**Team**: $75/month (deferred to Month 6+)
- All Pro features
- Shared workspaces (5 users included)
- Branch permissions and visibility controls
- Team analytics and exploration tree views
- Admin controls and team management
- Priority support

**Enterprise**: Custom pricing (deferred to Year 2+)
- All Team features
- SSO, compliance, audit logs
- Dedicated support and SLA
- Custom integrations
- Professional services (onboarding, training)

### Pricing Rationale

**Competitive Positioning**:
- ChatGPT Plus: $20/month (linear conversations, ephemeral artifacts)
- Claude Pro: $20/month (linear conversations, no provenance)
- Notion AI: $20/user/month (Business plan required, no branching)
- Centrid Plus: $19/month (branching + artifacts + provenance, $1 cheaper)
- Centrid Pro: $39/month (matches GitHub Copilot Pro+, 2.3x more premium AI)

**Premium Justified**:
- Unique value: ONLY solution enabling branching + provenance + consolidation
- Time savings: Consolidation automation saves 2-4 hours per complex research project
- Switching costs: 50+ artifacts with provenance create lock-in
- Premium positioning: Targets deep research workers (not general AI users)

**Why $19/$39 Charm Pricing**:
- Plus $19: Covers COGS ($12.23) with 36% margin, "under $20" psychological threshold
- Pro $39: Covers COGS ($23.75) with 39% margin, matches GitHub Copilot Pro+
- Charm pricing: $19 converts 10-15% better than $20 (psychological pricing research)
- Easy ROI for consultants ($150-300/hr billable rate)
- Undercut messaging: "$1 cheaper than ChatGPT, with branching"

---

## Strategic Positioning

### Market Position

**Category**: Exploration workspace for deep research

**Positioning Statement**: "ChatGPT is linear. Notion is manual. Centrid is exploration-first. Branch conversations, capture artifacts with provenance, consolidate from multiple paths."

**Alternative Positioning**: "Deep research isn't linear. Centrid: Branch at any message, explore multiple approaches in parallel, consolidate findings into final output—without losing context."

**Market Role**:
- Category creator (exploration workspace is new category)
- Challenger to ChatGPT/Claude (better solution for deep research workers)
- Niche specialist (10K-50K power users, not 100M general users)

**Strategic Angle**: "Branching is architectural moat"—6-12 months retrofit time for Claude, conflicts with simplicity for 100M users

### Competitive Differentiation

**Primary Differentiators**:

1. **Conversation Branching** (Architectural Moat) ⭐ BIGGEST DIFFERENTIATOR
   - Claude: Linear conversations only (Checkpoints rollback, but don't branch)
   - Centrid: Branch at any message → explore multiple paths → consolidate later
   - Why: "Research AI Agents" → Branch A (RAG), Branch B (Orchestration), Branch C (Tool use) → Consolidate into "Decision Document"
   - Moat: Architectural change (not feature add)—6-12 months retrofit minimum

2. **Provenance-Linked Filesystem** (Files Remember Origin)
   - Claude Artifacts: Ephemeral (conversation-scoped, disappear when chat ends)
   - Claude Projects: Files persist, but no provenance (can't see which conversation created what, when, why)
   - Centrid: Every file has metadata: created_in_conversation_id, context_summary, last_updated_by_branch

3. **Cross-Branch Consolidation** (AI Synthesis Across Exploration Tree)
   - Claude: Can't synthesize across conversations (each conversation isolated)
   - Centrid: "Consolidate Branch A, B, C" → AI traverses graph, applies relationship weights, synthesizes unified report

4. **Context Inheritance** (Parent → Child with Relationship Weights)
   - Claude: Each conversation starts fresh (no parent-child relationships)
   - Centrid: Child branches inherit parent's explicit files + conversation summary + relationship modifiers (siblings +0.15, parent/child +0.10, cousins +0.05)

5. **Exploration-First Paradigm** (Not Conversation-First)
   - Claude: Conversation-first (chat → outputs)
   - Centrid: Exploration-first (branch → capture → consolidate → ship)
   - Target: Deep research workers (10K-50K) vs general users (100M)

**Technical Moat**:
- Integration moat: requires building branching + filesystem + provenance + KG + concepts + dynamic weighting simultaneously
- Not a feature add—it's architectural foundation
- First-mover in branching conversations + provenance-linked filesystem
- 9-layer context assembly with dynamic relevance scoring

### Defensibility

**Network Effects** (Strong):
- Artifact growth creates switching costs (50+ artifacts with provenance = locked in)
- Knowledge graph of exploration paths (irreplaceable)
- Templates of successful workflows (unique to user)
- Cross-branch references embedded in work

**Data Moat** (Very Strong):
- Exploration tree represents user's research timeline (irreplaceable)
- Provenance metadata tracks "how I arrived at this conclusion" (unique context)
- Vector embeddings + node summaries expensive to recreate
- Users with ≥60 artifacts have <5% churn (validated switching cost)

**Switching Costs** (Very High):
- After 50+ artifacts: Knowledge graph, provenance, templates, cross-branch references
- Switching = Rebuilding everything manually
- Re-creating exploration tree impossible (conversation history lost)
- Re-organizing artifacts disrupts workflow

**Technology Barriers** (Moderate to High):
- Architectural moat: Branching requires 6-12 months retrofit (database schema DAG, UI tree view, context assembly rewrite, user mental model shift)
- Integration complexity: Must build ALL pieces simultaneously (branching + filesystem + provenance + KG + concepts)
- Testing at scale: 100M users × branching = state explosion (QA nightmare for general-purpose tools)

**Brand & Positioning** (Building):
- First-mover in "exploration workspace" category
- Category definition: "Exploration-first" vs "conversation-first"
- Power user positioning (10K-50K deep research workers, not mass market)
- Thought leadership on parallel exploration workflows

**Why Claude Likely Won't Add Branching**:
- **Product philosophy**: Simplicity over power user features (100M users expect linear chat)
- **Complexity trade-off**: Branching adds cognitive load (general users don't need it)
- **Architectural constraint**: Conversation-first model (retrofitting to exploration-first = 6-12 months minimum)
- **Checkpoints are their answer**: Rollback solves 80% of use cases (branch-lite)

**Defensibility Strategy**:
1. **Speed to Market**: 8-week MVP, capture early adopters, build artifact lock-in
2. **Artifact Lock-In**: Target 60+ artifacts per user within 12 weeks (switching cost validated)
3. **Category Ownership**: Define "exploration workspace" before competitors
4. **Community**: Deep research worker community creates moat (word-of-mouth, feedback loops)
5. **Execution**: Relentless focus on consolidation quality (technical excellence)

---

## Target Market Definition

### Primary Target Market

**Profile**: Deep Research Workers
- **Roles**: Researchers (literature reviews, paper analysis), engineers (technical decision documents), product managers (feature specs from multiple explorations), independent consultants (client deliverables with rationale), content creators (articles from research branches), business analysts (reports from parallel analyses)
- **Psychographics**: Exploring complex topics requiring parallel investigation, frustrated by linear chat limitations, need to consolidate findings from multiple exploration paths
- **Behaviors**: Already paying $20/month for ChatGPT/Claude, creating manual workarounds (Google Docs + ChatGPT, Notion + copy-paste), losing exploration paths when conversations branch
- **Pain Point**: Context fragmentation when exploring in parallel—can't remember which branch had which insight, manual consolidation takes hours, ephemeral outputs not captured as artifacts
- **Decision Process**: Tries free trial, validates branching workflow (creates multi-branch exploration), converts if consolidation saves time

**Size**: 50,000 addressable customers (Year 3)
- Deep research workers experiencing parallel exploration context loss: 6M (SAM)
- Realistic capture: 0.83% in Year 3 (50K customers)
- Year 1: 1,000-2,000 customers
- Year 2: 10,000 customers
- Year 3: 50,000 customers = $15M ARR

**Characteristics**:
- Tech-savvy (comfortable with branching mental model)
- Willing to pay premium for workflow automation ($19-39/mo acceptable for 2-4 hours saved per project)
- Research-intensive (literature reviews, competitive analysis, technical exploration)
- Non-linear thinkers (explore multiple approaches before deciding)
- Mobile-dependent (need on-the-go access to exploration tree)

### Secondary Target Markets

**Small Research Teams** (Year 2+):
- 2-5 people working on complex research projects
- Consulting firms, product teams, research labs
- Team tier ($75/mo) with shared workspaces
- Branch permissions and visibility controls
- Defer until individual product-market fit validates

**Academic Researchers** (Year 2+):
- Graduate students, postdocs, professors
- Literature reviews with 10-50 papers
- Need branching to compare methodologies, theoretical frameworks
- Pricing sensitivity (may need academic discount)

**Enterprise Knowledge Workers** (Year 3+):
- Large company employees in research-intensive roles
- Strategy, consulting, R&D, product management
- Enterprise tier (custom pricing, SSO, compliance)
- Long sales cycles—defer until scale

### Non-Target Markets

**Explicitly NOT Targeting** (MVP Phase):
- Casual AI users (don't need branching complexity)
- Code-focused developers (Cursor serves this segment)
- General productivity users (Notion serves this segment)
- Enterprise (complexity and sales cycle don't fit MVP timeline)
- Students (price sensitivity, academic use case differs)

**Why Clear Non-Targets Matter**:
- Focus scarce resources on highest-value segment (deep research workers)
- Avoid feature creep serving wrong customers
- Pricing and positioning clarity (exploration workspace, not chat tool or workspace)
- Sales and marketing efficiency (no enterprise sales during MVP)

---

## Growth Strategy

### Customer Acquisition Channels

**Phase 1: Beta Validation** (Weeks 1-4, 20-30 users)
1. **Direct Outreach** (Primary) - Expected: 20-30 beta users
   - Twitter AI community (researchers, consultants using ChatGPT/Claude daily)
   - LinkedIn thought leaders (knowledge workers, indie consultants)
   - Reddit (r/ChatGPT, r/ClaudeAI, r/productivity)
   - Goal: 40% create multi-branch explorations (validates workflow)

2. **Personal Network** (Secondary) - Expected: 5-10 beta users
   - Indie hacker communities (Twitter, IndieHackers.com)
   - Former colleagues in research-intensive roles
   - Product Hunt early access list

**Phase 2: Community Launch** (Weeks 5-8, 50-100 trial signups)
1. **Hacker News** (Primary) - Expected: 30-50 trial signups
   - "Show HN: Centrid - Branching Conversations for Deep Research" post
   - Focus on exploration workflow demo (branch → capture → consolidate)
   - Goal: Front page for 4-6 hours, 15-20% conversion to paid

2. **Reddit Communities** (Secondary) - Expected: 20-30 trial signups
   - r/ChatGPT: "I built a tool for parallel exploration (branching conversations)"
   - r/ClaudeAI: "Exploration workspace with branching + provenance"
   - r/productivity: "How I eliminated manual consolidation using branching AI"

3. **Twitter Launch** (Tertiary) - Expected: 10-20 trial signups
   - Launch thread: "Deep research isn't linear" positioning
   - Tag AI influencers for engagement
   - Share workflow demo (video/screenshots)

**Phase 3: Content & Growth** (Months 2-3, 100-200 paying customers)
1. **Content Marketing** (Primary) - Expected: 50-100 customers
   - "Exploration-First AI Workflows" thought leadership
   - Comparison content (vs ChatGPT, Claude, Notion AI)
   - SEO: "branching conversations", "AI for deep research", "consolidate research"
   - Long-form guides: "How to explore complex topics without losing context"

2. **Partnerships & Reviews** (Secondary) - Expected: 30-50 customers
   - AI tool reviewers (YouTube, blogs)
   - Productivity YouTubers (demo + affiliate link)
   - Research workflow influencers (Twitter, LinkedIn)

3. **Word-of-Mouth** (Organic) - Expected: 20-30 customers
   - Power users share with colleagues (artifact lock-in creates evangelism)
   - Referral program (future): "Give $10, get $10"
   - Community-driven growth (Slack, Discord presence)

### Retention Strategy

**Activation-Focused** (First Week):
- Guided onboarding: "Create first branch → explore → consolidate" workflow
- Success metrics: 40% create multi-branch explorations within first week
- Email: "5 exploration workflows to try in Centrid"

**Artifact Growth** (Weeks 2-8):
- In-app prompts: "Capture this as artifact for future reference"
- Success metrics: Week 2 (5-10 artifacts), Week 8 (40-60 artifacts)
- Email: "How to use artifacts across branches"

**Consolidation Adoption** (Weeks 4-12):
- In-app prompts: "Consolidate findings from branches A, B, C"
- Success metrics: 40% consolidation rate (users synthesize multi-branch explorations)
- Email: "How to consolidate research into final output"

**Habit Formation** (Month 1+):
- Weekly usage summary: "You created X artifacts this week across Y branches"
- Feature discovery: "Try knowledge graph to find related artifacts"
- Success metrics: 60% Month 1 retention

**Artifact Lock-In** (Month 3+):
- Switching cost reinforcement: "You have X artifacts with provenance (worth rebuilding manually?)"
- Re-engagement emails: "We miss you—here's what's new" (for inactive users)
- Success metrics: 60+ artifacts cohort has >90% retention

### Expansion Strategy

**Upsell to Team Tier** (Month 6+):
- Identify solo users inviting collaborators
- In-app prompt: "Invite your team—$75/mo for 5 users (save 40%)"
- Team features: Shared workspaces, branch permissions, team analytics
- Target: 10-15% of Pro users upgrade to Team within 6 months

**Add-On Revenue** (Future):
- Additional storage (>10GB): $5/mo per 10GB
- Advanced AI models (GPT-4, Claude Opus): $10/mo premium
- Premium integrations (Google Drive, Notion, Obsidian): $5/mo each

**Enterprise Expansion** (Year 2+):
- Identify teams with 10+ Pro users
- Outbound sales: Custom pricing, SSO, compliance features
- Professional services: Onboarding, training, custom integrations
- Target: 5-10 enterprise customers by Year 2 ($1,000-5,000/mo each)

---

## Financial Projections (12-month)

### Revenue Targets

**Month-by-Month Projections**:

| Month | Trial Signups | Paid Customers | MRR | Total Revenue (Cumulative) |
|-------|---------------|----------------|-----|----------------------------|
| 1 (Beta) | 30 | 10 | $250 | $250 |
| 2 | 50 | 25 | $625 | $875 |
| 3 | 80 | 50 | $1,250 | $2,125 |
| 4 | 100 | 75 | $1,875 | $4,000 |
| 5 | 120 | 100 | $2,500 | $6,500 |
| 6 | 150 | 130 | $3,250 | $9,750 |
| 9 | 200 | 200 | $5,000 | $19,750 |
| 12 | 300 | 300 | $7,500 | $38,500 |

**Year 1 Targets**:
- Total customers: 300 paying (conservative) to 500 paying (aggressive)
- MRR: $7,500 (conservative) to $12,500 (aggressive)
- ARR: $90,000 (conservative) to $150,000 (aggressive)
- Total revenue: $38,500 (conservative) to $64,167 (aggressive)

**Assumptions**:
- Trial-to-paid conversion: 15-20%
- Month-over-month churn: 10-15% (85-90% retention)
- Average revenue per user: $25/month (blended: 60% Plus $19, 40% Pro $39)
- No team tier revenue in Year 1 (conservative)

### Customer Targets

**By Segment (Year 1)**:
- Plus tier: 180-300 customers at $19/month (60% of paid)
- Pro tier: 120-200 customers at $39/month (40% of paid)
- Team tier: 0 customers (deferred to Month 6+, not included in Year 1 projections)
- Enterprise: 0 customers (deferred to Year 2)

**By Acquisition Channel (Year 1)**:
- Organic (Hacker News, Reddit, Twitter): 60% (180-300 customers)
- Content marketing (SEO, blogs, guides): 30% (90-150 customers)
- Partnerships (reviews, influencers): 10% (30-50 customers)

**Power User Target**:
- 30% become power users (60+ artifacts): 90-150 customers
- Power users have >90% retention (artifact lock-in validated)
- Average 60-100 artifacts per power user by Month 12

### Key Milestones

**Q1 (Months 1-3): Validate Product-Market Fit**
- Month 1: 10 beta customers paying, 40%+ create multi-branch explorations
- Month 2: 25 paying customers, $550 MRR, 70%+ Week 2 retention
- Month 3: 50 paying customers, $1,100 MRR, 40%+ consolidation rate

**Q2 (Months 4-6): Scale Acquisition**
- Month 4: 75 paying customers, $1,650 MRR, <10% monthly churn
- Month 5: 100 paying customers, $2,200 MRR, NPS >40
- Month 6: 130 paying customers, $2,860 MRR, team tier launch

**Q3 (Months 7-9): Growth Acceleration**
- Month 7: 150 paying customers, $3,300 MRR, sustainable CAC <$50
- Month 8: 170 paying customers, $3,740 MRR, content marketing scales
- Month 9: 200 paying customers, $4,400 MRR, word-of-mouth growth

**Q4 (Months 10-12): Scale & Optimize**
- Month 10: 230 paying customers, $5,060 MRR, team tier adoption
- Month 11: 260 paying customers, $5,720 MRR, enterprise exploration
- Month 12: 300 paying customers, $6,600 MRR, Year 2 planning

**Financial Health Metrics**:
- Break-even: Month 5-6 (MRR covers fixed + variable costs)
- Profitability: Month 7+ (positive cash flow)
- Runway extension: Every $1,000 MRR adds 2-3 months runway

---

## Risk Analysis

### Market Risks

**Risk 1: Deep research workers don't value branching enough to pay $19-39/month**
- Likelihood: Low (ChatGPT Plus/Claude Pro adoption validates willingness to pay $20/mo, we undercut at $19)
- Impact: High (invalidates entire business model)
- Mitigation: Free tier validates branching workflow, beta phase tests 40% consolidation rate (validates workflow adoption)
- Validation: Month 2—if free-to-paid conversion <10%, pivot pricing or positioning

**Risk 2: Claude adds conversation branching**
- Likelihood: Low-Medium (architectural change, conflicts with simplicity for 100M users)
- Impact: High (eliminates primary differentiator)
- Mitigation: First-mover advantage (12-month head start), artifact lock-in (60+ artifacts = switching cost), specialist focus (deep research workers vs general users)
- Response: Emphasize data advantage, specialist focus, integration depth (9-layer context, divergence tracking), accelerate V3 features (concept extraction, templates)

**Risk 3: Market timing—AI hype cycle correction reduces adoption**
- Likelihood: Low-Medium (AI adoption is fundamental shift, not just hype)
- Impact: Medium (slows growth but doesn't invalidate need)
- Mitigation: Focus on proven pain point (parallel exploration context loss), target existing AI users (already validated need)

### Competitive Risks

**Risk 4: Notion adds branching conversations**
- Likelihood: Low (workspace-centric, not exploration-first)
- Impact: Medium (Notion has distribution advantage)
- Mitigation: Mobile-first approach (Notion mobile is weak), platform-independent, faster iteration
- Response: Integrate with Notion (import documents), position as "AI exploration layer for Notion"

**Risk 5: New well-funded competitor launches similar product**
- Likelihood: Medium-High (space is hot, branching is logical next step)
- Impact: Medium (competition for users but validates market)
- Mitigation: Speed to market (8-week MVP), artifact lock-in (60+ artifacts = switching cost), community ownership
- Response: Focus on execution quality (consolidation accuracy, UX polish, context assembly speed), community evangelism

**Risk 6: Users don't understand branching mental model**
- Likelihood: Medium (new paradigm, cognitive load)
- Impact: High (adoption fails if too complex)
- Mitigation: Progressive disclosure (show branching only when needed), guided onboarding ("create first branch → explore → consolidate"), context panel transparency (show what AI sees)
- Validation: <20% confusion rate in beta

### Execution Risks

**Risk 7: Context pollution from irrelevant sibling branches**
- Likelihood: High without divergence tracking (MVP defers this)
- Impact: Medium (cross-branch reference quality degrades)
- Mitigation: MVP accepts some pollution (validate workflow first), V3 adds divergence penalty (Month 2-3), user control (exclude sibling branches manually)
- Validation: Monitor cross-branch reference quality (user feedback, NPS)

**Risk 8: Consolidation quality is insufficient (AI synthesis fails)**
- Likelihood: Medium (consolidation is complex, tree traversal + synthesis + relationship weights)
- Impact: High (core value proposition fails)
- Mitigation: Provenance metadata in AI prompts ("This came from Branch A"), relationship weights for relevance, user feedback loops, iterative tuning
- Validation: Beta phase tests consolidation satisfaction >4/5

**Risk 9: Claude API costs exceed budgeted COGS (margin compression)**
- Likelihood: Low-Medium (9-layer context assembly may require more tokens)
- Impact: Medium (unit economics worsen but not broken)
- Mitigation: Node summaries for efficient context loading (summaries first, full content on demand), context caching (reduce redundant API calls), usage monitoring, capped Sonnet requests (60 Plus, 140 Pro) limit exposure
- Response: Optimize prompts, adjust tier limits, increase pricing if necessary (36-39% margins provide buffer)

**Risk 10: Retention is lower than expected (<60% Month 1)**
- Likelihood: Medium (branching workflow is hypothesis)
- Impact: High (LTV assumptions invalid, CAC payback fails)
- Mitigation: Focus on consolidation adoption (40% create multi-branch explorations), artifact growth (Week 8: 40-60 artifacts), switching cost building (60+ artifacts = locked in)
- Validation: Month 1-3 retention data, iterate onboarding if <60% Month 1

**Risk 11: Development takes longer than 8 weeks (delayed launch)**
- Likelihood: Low-Medium (scope creep, branching DAG complexity)
- Impact: Medium (delays validation, burns runway)
- Mitigation: MVP-first discipline (ruthless scope management), phased implementation (MVP: base + relationship + temporal only, defer divergence penalty), clear success criteria
- Response: Ship imperfect MVP, iterate based on user feedback (working software > perfect architecture)

### Mitigation Strategies Summary

**Validation-Driven Approach**:
- Beta phase (Weeks 1-4): 20-30 users, validate branching workflow (40% consolidation rate), willingness to pay
- Launch phase (Weeks 5-12): 50-100 trial signups, validate 15-20% conversion
- Scale phase (Months 2-3): 100-200 customers, validate artifact growth (Week 8: 40-60 artifacts), retention (60% Month 1)

**Flexibility & Pivots**:
- If branching too complex: Simplify onboarding, add guided workflows, progressive disclosure
- If consolidation quality insufficient: Iterate prompts, add user feedback loops, tune relationship weights
- If pricing too high: Introduce lower tier ($15/mo with limits), test conversion
- If retention low: Focus on artifact growth, switching cost building, onboarding improvements
- If CAC too high: Double down on organic channels (content, community)

**Risk Monitoring**:
- Weekly metrics review: Trial signups, conversion rate, consolidation rate, artifact growth, retention, NPS
- Monthly business review: MRR, CAC, LTV, churn, unit economics
- Quarterly strategic review: Market trends, competitive landscape (watch for branching signals from Claude), product roadmap

---

## Pitch Deck

### One-Line Pitch

"Exploration workspace for deep research. Branch conversations, capture artifacts with provenance, consolidate from multiple paths."

### 30-Second Pitch

Deep research isn't linear. When you're exploring a complex topic, you need to branch—try multiple approaches in parallel—without losing context.

ChatGPT forces linear conversations. Notion forces manual organization. Centrid: Branch at any message, explore multiple paths, consolidate findings into final output. Files remember which conversation created them (provenance). Cross-branch semantic search finds related artifacts automatically.

Plus $19/mo (undercuts ChatGPT), Pro $39/mo. Built for researchers, consultants, and engineers who explore complex topics. 8-week MVP sprint. Beta Week 4, public launch Week 10.

### 60-Second Pitch

**The problem**: Researchers, consultants, and engineers exploring complex topics hit a wall with AI tools. ChatGPT forces linear conversations—when you want to try multiple approaches (RAG vs fine-tuning), you lose the main thread or restart from zero. Notion has document context, but no branching—manual organization, no automatic consolidation. Deep research workers spend 2-4 hours manually consolidating findings from multiple explorations.

**The solution**: Centrid is an exploration workspace where branching conversations and persistent filesystem are unified through provenance. Branch at any message → explore multiple approaches in parallel → capture outputs as artifacts → consolidate findings automatically. Every file knows: created_in_conversation_id, context_summary, last_updated_by_branch. Cross-branch semantic search finds related artifacts from sibling branches. AI consolidation synthesizes findings across exploration tree using provenance + relationship weights.

**Example workflow**: "Research AI Agents" → Branch A (RAG deep dive), Branch B (Orchestration), Branch C (Tool use) → Consolidate into "Decision Document" with provenance citations.

**The market**: 30M knowledge workers experiencing parallel exploration context loss. 6M experience it daily. Target: 50K users × avg $25/mo = $15M ARR Year 3. Deep research workers (researchers, consultants, engineers, product managers) already paying $20/mo for ChatGPT/Claude.

**The business**: Plus $19/mo (undercuts ChatGPT), Pro $39/mo (matches GitHub Copilot Pro+). Unit economics: <$50 CAC, $600 LTV (artifact-driven switching costs), 12:1 ratio. 8-week MVP sprint. Year 1 target: 300 customers ($7,500 MRR).

**Differentiation**: ChatGPT = linear conversations. Claude = no branching. Notion = manual organization. Centrid = branching + provenance + consolidation. Architectural moat: Branching requires 6-12 months retrofit (database schema DAG, UI tree view, context assembly rewrite). Claude likely won't add (conflicts with simplicity for 100M users).

**Traction**: 8-week MVP sprint. Beta Week 4 (20-30 users, validate 40% consolidation rate). Public launch Week 10 (50-100 trial signups). First 300 customers in 12 months validates product-market fit. Switching cost: 60+ artifacts = <5% churn (locked in).

**The moat**: Integration moat—requires building branching + filesystem + provenance + KG + concepts + dynamic weighting simultaneously. Not a feature add, it's architectural foundation. First-mover advantage (12-month head start). Artifact lock-in (60+ artifacts = rebuilding everything manually). Category ownership ("exploration workspace" vs "AI chat").

**The ask**: Early adopters to validate branching + consolidation workflow for deep research, and strategic angels who understand exploration-first paradigm shift.

---

**Next Steps**:
- Run `/marketing.brief` to create marketing communications strategy (personas, messaging, landing page outline)
- Use pitches for initial outreach, investor conversations, and landing page headlines
- Validate branching workflow and pricing during beta phase (Weeks 1-4)
- Monitor consolidation rate (target: 40%) and artifact growth (target: Week 8: 40-60 artifacts)
