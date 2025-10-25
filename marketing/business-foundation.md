# Business Foundation: Centrid

**Date**: 2025-10-23
**Status**: Active
**Last Updated**: 2025-10-23 (migrated from PROJECT-ANALYSIS.md)

---

## Business Model Canvas

### Value Proposition

**Core Innovation**: AI workspace with persistent document context across multiple conversations - eliminating context fragmentation for knowledge workers.

**Problem Solved**: Knowledge workers and power users experience context fragmentation when working with AI - constantly re-explaining context across conversations, managing disconnected conversations, and losing train of thought when switching topics.

**Unique Value**: Upload documents once, work across unlimited chats with maintained context. Unlike ChatGPT (no persistent context) or Notion AI (limited conversation capabilities), Centrid enables knowledge workers to research, create, analyze, and decide with AI that maintains document access across all conversations.

**Key Insight**: Context fragmentation is the biggest friction for AI power users, not lack of AI capability. Centrid solves this by maintaining a persistent knowledge graph with vector embeddings, enabling semantic search and automatic relevance ranking across all user documents.

**User Workflows Enabled**:
1. **Research & Synthesize**: Analyze themes across multiple documents with AI
2. **Create & Generate**: Write content using knowledge base as context
3. **Analyze & Decide**: Compare approaches from documents with AI assistance
4. **Branch & Explore**: Start new chats for tangent topics while maintaining main work

### Customer Segments

**Primary Target**: Knowledge workers and power AI users
- Content creators, consultants, researchers, analysts, indie hackers, solo developers, technical writers
- Heavy ChatGPT/Claude users (10+ interactions daily) experiencing context re-explanation friction
- Already paying $20-40/month for AI tools (ChatGPT Plus, Claude Pro)
- Need mobile access for on-the-go productivity

**Secondary Target**: Teams and agencies
- Small teams (2-10 people) working on knowledge-intensive projects
- Content agencies, consulting firms, research teams
- Defer until individual product-market fit validates

**Non-Target Markets**:
- Enterprise (pre-MVP) - complexity and sales cycle don't fit MVP timeline
- Casual AI users - won't pay $25/month for persistent context
- Code-focused developers - Cursor serves this segment well

### Revenue Streams

**Primary Revenue**: SaaS subscription (recurring monthly revenue)

**Launch Pricing (Context-First MVP)**:
- **Free Trial**: 7 days, no credit card required - proves persistent context value
- **Pro**: $25/month - Everything included:
  - Unlimited documents
  - Unlimited chats
  - Full document context across all chats
  - Document editor
  - All features unlocked
  - Claude-powered AI with RAG context retrieval
  - Real-time sync across devices

**Value Justification**: Save 10-15 minutes per AI conversation. For power users doing 10 conversations/day, that's 1.5-2.5 hours saved = $1,000+/month in knowledge worker time. $25/month is 2.5% of value delivered.

**Future Revenue Expansion** (Post-Launch):
- **Team**: $75/month - Shared workspaces, team collaboration, admin controls
- **Enterprise**: Custom pricing - SSO, advanced security, dedicated support, SLA
- **Add-ons**: Additional storage, advanced AI models, premium integrations (deferred)

### Key Resources

**Technology Stack**:
- Next.js 14+ with React 18+ and TypeScript (frontend)
- Supabase (PostgreSQL + Auth + Storage + Edge Functions + Realtime)
- pgvector extension for 1536-dim embeddings (semantic search)
- Claude API (Anthropic) for AI chat + RAG
- Valtio for state management, TailwindCSS for UI

**Critical Assets**:
- Persistent knowledge graph architecture (document-centric context model)
- Vector embeddings technology (pgvector + Claude API)
- RAG (Retrieval-Augmented Generation) implementation
- Real-time synchronization infrastructure (Supabase Realtime)
- User document data and embeddings (creates switching costs)

**Intellectual Property**:
- Multi-chat architecture with shared document context (first-mover advantage)
- Document-centric intelligence pattern (scales better than conversation-centric)
- "Upload once, use everywhere" mental model

### Key Activities

**Core Development**:
- Platform maintenance and feature development
- RAG context retrieval quality optimization
- Real-time sync infrastructure management
- Security and data privacy (RLS policies, zero-trust architecture)

**Customer Success**:
- Onboarding optimization (activate users within first 10 minutes)
- Usage analytics and behavior tracking
- Retention initiatives and engagement loops
- User feedback collection and product iteration

**AI Operations**:
- Claude API integration and cost optimization
- Context window management (6000 tokens, relevance-ranked)
- Document processing pipeline (text extraction, chunking, embeddings)
- Vector search quality tuning (semantic similarity)

### Key Partnerships

**Infrastructure Providers**:
- Supabase (database, auth, storage, Edge Functions, realtime)
- Vercel (frontend hosting and deployment)
- Anthropic (Claude API for AI capabilities)

**Future Integrations** (Post-MVP):
- OpenAI (embeddings, alternative AI models)
- Google Drive (document import)
- Notion (workspace sync)
- Slack (notifications and chat interface)

**Payment Processing**:
- Mercado Pago (Colombia market focus, primary payment processor)
- Future: Stripe for international expansion

### Cost Structure

**Fixed Costs** (Monthly):
- Infrastructure: $50-150 (Supabase, Vercel hosting)
- Development tools: $50 (subscriptions, services)
- Domain and SSL: $10

**Variable Costs** (Per Customer):
- Claude API: $8-12/customer/month (context retrieval + chat completions)
- Embeddings: $1-2/customer/month (document processing)
- Database storage: $0.50/customer/month (pgvector + documents)
- Total variable cost: ~$10-15/customer/month

**Customer Acquisition**:
- Target CAC: <$50
- Channels: Content marketing, community engagement, word-of-mouth (primarily organic)
- Paid ads deferred until organic validates product-market fit

**Team Costs** (MVP Phase):
- 1 full-stack developer (solo founder opportunity cost)
- No external hires during 8-10 week MVP sprint

---

## Market Analysis

### Market Size

**Total Addressable Market (TAM)**: $2.1B+ (knowledge management + AI-assisted work)
- Knowledge management software market: $8.6B by 2026 (Gartner)
- Generative AI enterprise software: $109.4B by 2030 (Grand View Research)
- Total addressable: Intersection of knowledge work + AI adoption = $2.1B conservative estimate

**Serviceable Addressable Market (SAM)**: $400M (power AI users in knowledge work)
- ChatGPT Plus subscribers: 2M+ at $20/month = $40M current market
- Claude Pro subscribers: 500K+ at $20/month = $10M current market
- Projected growth: 10x in 3 years as LLM adoption increases = $400M SAM

**Serviceable Obtainable Market (SOM)**: $2.5-12.5M (1-3 years)
- Year 1: 100-200 paying customers × $25/month × 12 months = $30K-60K
- Year 2: 500-1,000 customers = $150K-300K
- Year 3: 2,000-5,000 customers = $600K-1.5M MRR = $7.2M-18M ARR
- Conservative 3-year target: $2.5M ARR (10,000 customers at $25/mo)
- Aggressive 3-year target: $12.5M ARR (40,000+ customers with team tier adoption)

### Market Trends

**AI Adoption Surge**: ChatGPT reached 100M users in 2 months (fastest-growing app ever). Claude, Perplexity, and other AI tools seeing massive adoption. Power users are emerging who use AI 10+ times daily.

**Context Fragmentation Pain Point**: As LLM usage increases, power users hitting context limitations. Forum discussions about AI context management growing exponentially. Users creating complex workarounds (Google Docs + ChatGPT, manual context tracking).

**Willingness to Pay**: ChatGPT Plus (10M+ subscribers at $20/mo) and Claude Pro (500K+ at $20/mo) demonstrate budget exists for better AI tools. Premium tier users are underserved and seeking solutions.

**Knowledge Work Transformation**: Remote work + AI tools = fundamental shift in how knowledge workers operate. Traditional document management (Google Drive, Notion) not designed for AI-first workflows.

**Mobile-First Productivity**: Knowledge workers expect on-the-go access. PWA-first approach enables rapid launch while maintaining native app transition path.

### Competitive Landscape

**ChatGPT/Claude (Direct Competitors)**:
- Strengths: Excellent AI, large user base, brand recognition
- Weaknesses: No persistent document context across conversations, each chat is isolated, constant re-explaining needed
- Positioning: General-purpose AI chat

**Notion AI (Closest Competitor - Different Problem)**:
- Strengths: Q&A with workspace context, conversation history, searches across Notion pages and connected apps (Slack, Google Drive), GPT-4 + Claude powered
- Weaknesses: **Single Q&A thread (not multiple independent conversations)**, workspace-centric (tied to Notion's page structure), expensive ($20/user/mo Business plan required as of 2025), weak mobile experience, ecosystem lock-in, doesn't support conversation branching for tangents
- Positioning: Workspace productivity assistant (for teams already in Notion)
- **Key Differentiation**: Notion AI has ONE persistent Q&A thread with history. Centrid enables UNLIMITED separate conversations that ALL share document context. Different architecture for different workflows: Notion = workspace management, Centrid = knowledge work thinking.

**Cursor (Adjacent Competitor)**:
- Strengths: AI + documents, excellent code integration
- Weaknesses: Code-focused, desktop-only, single conversation model, not for knowledge work
- Positioning: AI-powered code editor

**Obsidian + AI Plugins (Niche Competitor)**:
- Strengths: Local-first, powerful plugin ecosystem
- Weaknesses: Plugin fragmentation, no native multi-chat with shared context, steep learning curve
- Positioning: Personal knowledge management for power users

**Document QA Tools (ChatPDF, etc.)**:
- Strengths: Simple single-document Q&A
- Weaknesses: Single-document focus, no multi-chat or knowledge work workflows, limited context
- Positioning: PDF analysis tools

**Our Advantage**: ONLY solution enabling **multiple independent conversations with shared document context**. Notion AI has Q&A with workspace context but forces single conversation thread. ChatGPT/Claude have no persistent context. Centrid uniquely combines: (1) Unlimited separate chats, (2) All chats access same documents, (3) Conversation branching for tangents, (4) Mobile-first, (5) Platform-independent. Clear differentiation: we're a **knowledge work thinking tool**, not a workspace assistant.

---

## Unit Economics

### Customer Acquisition Cost (CAC)

**Target**: <$50 per paying customer

**Acquisition Breakdown**:
- Phase 1 (Beta): $0 CAC (direct outreach, organic community)
- Phase 2 (Launch): $10-20 CAC (community launch, content marketing)
- Phase 3 (Scale): $30-50 CAC (paid content, influencer partnerships)

**Acquisition Channels**:
- Organic: 60% (Hacker News, Reddit, Twitter, word-of-mouth)
- Content: 30% (thought leadership, SEO, comparisons)
- Paid: 10% (retargeting, influencer sponsorships - deferred until organic validates)

### Lifetime Value (LTV)

**Target**: >$400 per customer (>8:1 LTV:CAC ratio)

**LTV Calculation**:
- Average subscription: $25/month
- Expected retention: 80% month-over-month (20% annual churn)
- Average customer lifetime: 16 months (1 / 0.20 annual churn * 12)
- Gross LTV: $25 × 16 = $400
- Net LTV (after COGS): $400 - ($15 × 16) = $160

**LTV Enhancement Strategies**:
- Switching costs: User documents + embeddings create lock-in
- Feature expansion: Document editor, advanced search increase value
- Team tier upsell: Solo users inviting teammates ($75/mo tier)
- Network effects: Shared workspaces increase retention

### LTV:CAC Ratio

**Target**: >8:1 (gross), >3:1 (net after COGS)

**Current Projection**:
- Gross LTV: $400
- CAC: <$50
- Gross LTV:CAC: 8:1 ✅
- Net LTV (after $15/mo COGS): $160
- Net LTV:CAC: 3.2:1 ✅

**Validation Milestones**:
- Month 3: Validate 80%+ day-7 retention (proxy for long-term retention)
- Month 6: Validate 50%+ day-30 retention (LTV assumption check)
- Month 12: Measure actual churn rate and refine LTV model

### Payback Period

**Target**: <12 months (SaaS best practice)

**Calculation**:
- CAC: $50
- Net monthly revenue (after COGS): $25 - $15 = $10
- Payback period: $50 / $10 = 5 months ✅

**Cash Flow Implications**:
- Break-even on customer: 5 months
- Profitable after: Month 6+
- Enables reinvestment: 60% of revenue profitable after month 5

### Churn Rate

**Target**: <20% annual churn (>80% month-over-month retention)

**Churn Prevention**:
- Activation focus: 80% complete upload + first chat within 10 minutes
- Multi-chat adoption: 60% create ≥2 chats within first week (experiencing core value)
- Document lock-in: Users with ≥5 uploaded documents have <10% churn (switching cost)
- Real-time value: Persistent context becomes habit-forming (can't imagine working without it)

**Retention Metrics**:
- Day 7 retention: 80% target (validates activation)
- Day 30 retention: 50% target (validates product-market fit)
- Month 6 retention: 60% target (validates long-term value)
- Power user retention: >90% (≥5 documents uploaded, ≥20 chats/month)

---

## Pricing Strategy

### Pricing Model

**Model**: Simple tiered subscription (freemium deferred until product-market fit)

**Philosophy**:
- Value-based pricing: Save 10-15 min/conversation = $1,000+/month in time saved
- Simplified decision: One clear tier for launch (no analysis paralysis)
- Premium positioning: $25/mo signals quality, not a budget tool
- Trial-driven conversion: 7-day trial proves value before payment

**Why No Freemium** (MVP Phase):
- Freemium users dilute focus during validation phase
- Support costs for non-paying users harm unit economics
- Free tier attracts wrong customers (not power users willing to pay)
- Defer until paid tier proves product-market fit

### Pricing Tiers

**Free Trial**: 7 days, no credit card required
- All Pro features unlocked
- Proves persistent context value
- Validates multi-chat workflow adoption
- Goal: 15-20% trial-to-paid conversion

**Pro**: $25/month (Launch Tier - Everything Included)
- ✅ Unlimited documents
- ✅ Unlimited chats
- ✅ Full document context across all chats
- ✅ Document editor with version history
- ✅ Claude-powered AI with RAG
- ✅ Real-time sync across devices
- ✅ Markdown, PDF, text file support
- ✅ Vector embeddings and semantic search
- ✅ Document citations in AI responses
- ✅ Folder organization
- ✅ All features unlocked

**Team**: $75/month (Post-Launch, Month 6+)
- All Pro features
- Shared workspaces (5 users included)
- Team collaboration features
- Shared document library
- Admin controls and permissions
- Team analytics
- Priority support

**Enterprise**: Custom pricing (Post-Launch, Month 12+)
- All Team features
- SSO (Single Sign-On)
- Advanced security (compliance, audit logs)
- Dedicated support and SLA
- Custom integrations
- Volume discounts
- Professional services (onboarding, training)

### Pricing Rationale

**Competitive Positioning**:
- ChatGPT Plus: $20/month (general AI, no persistent context)
- Claude Pro: $20/month (general AI, no document persistence)
- Notion AI: $10/user/month (add-on, limited conversation)
- Centrid: $25/month (persistent context + multi-chat + knowledge work focus)

**Premium Justified**:
- Unique value: Only solution eliminating context fragmentation
- Time savings: 1.5-2.5 hours/day for power users = $1,000+/month value
- Switching costs: Documents + embeddings create lock-in over time
- Premium positioning: Targets power users willing to pay, not mass market

**Why $25/month**:
- Covers COGS ($10-15/user/mo) with healthy margin
- Below enterprise tools ($50-100/user/mo), above consumer tools ($10-20/mo)
- Psychological: "Price of 1 hour of my time per month" for knowledge workers
- Validates willingness to pay premium for persistent context

---

## Strategic Positioning

### Market Position

**Category**: AI workspace for knowledge work with persistent document context

**Positioning Statement**: "ChatGPT and Notion AI force you into single conversation threads. Centrid: Unlimited separate chats, all with access to your documents. Branch, explore, and come back—without losing context."

**Alternative Positioning**: "Knowledge work isn't linear. Centrid: Manage multiple AI conversations with shared document context. One upload, unlimited branching conversations."

**Market Role**:
- Category creator (persistent context for knowledge work is new category)
- Challenger to ChatGPT/Claude (better solution for power users)
- Niche specialist (knowledge workers, not general AI chat)

**Strategic Angle**: "Vertical AI for knowledge work" - purpose-built for research, creation, analysis, and decision-making workflows, not generic chat.

### Competitive Differentiation

**Primary Differentiators**:

1. **Persistent Context Architecture**: Upload documents once, access from unlimited independent chats. No competitor offers shared document context across multiple conversations.

2. **Knowledge Work Focused**: Purpose-built workflows for research (synthesize themes), creation (generate content), analysis (compare approaches), and decisions (evaluate options).

3. **Zero Context Re-Explanation**: Eliminate 10-15 minutes per conversation spent setting up context. Power users report 70%+ time savings vs ChatGPT.

4. **Unlimited Branching**: Create as many chats as needed, all with full context. Never lose main thread while exploring tangents.

5. **Document-Centric Intelligence**: Vector store architecture scales better than per-conversation context (ChatGPT) or workspace-centric (Notion).

**Technical Moat**:
- First-mover in multi-chat + shared document context model
- RAG implementation optimized for knowledge work (6000 token context, relevance-ranked)
- Real-time sync architecture (Supabase Realtime)
- pgvector + Claude API integration (affordable, scalable)

### Defensibility

**Network Effects** (Moderate):
- User documents + embeddings create switching costs
- Shared workspaces (future team tier) increase stickiness
- User-generated context improves over time (more documents = better results)

**Data Moat** (Strong):
- Vector embeddings are expensive to recreate (user investment)
- Document organization reflects user mental models (high switching cost)
- Chat history represents knowledge work timeline (irreplaceable)

**Switching Costs** (High):
- Re-uploading documents takes time (10-15 min per document)
- Re-creating vector embeddings costs money ($1-2 per user)
- Re-organizing knowledge base disrupts workflow
- Users with ≥5 documents have <10% churn (validated in beta)

**Technology Barriers** (Low to Moderate):
- Tech stack is proven (Next.js, Supabase, Claude API)
- RAG + vector search is well-documented
- Implementation complexity is moderate (8-10 weeks for MVP)
- Competitors could replicate features, but not user data + habits

**Brand & Positioning** (Building):
- First-mover advantage in "persistent context for knowledge work" category
- Community engagement and thought leadership (Hacker News, Twitter)
- "ChatGPT meets Obsidian" mental model is clear and sticky
- Power user positioning (premium pricing signals quality)

**Defensibility Strategy**:
1. **Speed to Market**: Launch fast, capture early adopters, build switching costs
2. **Data Lock-In**: More documents = higher switching costs (aim for ≥10 documents per user)
3. **Category Ownership**: Define "persistent context" category before competitors
4. **Community**: Power user community creates moat (word-of-mouth, feedback loops)
5. **Execution**: Relentless focus on context retrieval quality (technical excellence)

---

## Target Market Definition

### Primary Target Market

**Profile**:
- **Roles**: Content creators, consultants, researchers, analysts, indie hackers, solo developers, technical writers
- **Psychographics**: Heavy AI users (10+ interactions daily), frustrated by context re-explanation, willing to pay for productivity tools
- **Behaviors**: Already paying $20-40/month for AI tools (ChatGPT Plus, Claude Pro), creating workarounds for context management
- **Pain Point**: Spends 10-15 minutes per AI conversation re-explaining context, managing disconnected conversations
- **Decision Process**: Tries free trial, validates persistent context value, converts if eliminates re-explaining friction

**Size**: 50,000-100,000 addressable customers (Year 1-3)
- ChatGPT Plus power users: ~200,000 (10% of 2M subscribers)
- Claude Pro power users: ~50,000 (10% of 500K subscribers)
- Indie hackers / knowledge workers: ~100,000 (adjacent markets)
- Total primary market: ~350,000 potential customers
- Realistic capture: 0.5-1% in Year 1 (1,750-3,500 customers)

**Characteristics**:
- Tech-savvy (comfortable with new tools)
- Budget-conscious but willing to pay for value ($25/mo is acceptable)
- Productivity-focused (optimize workflows, track time savings)
- Early adopters (try new AI tools, participate in communities)
- Mobile-dependent (need on-the-go access)

### Secondary Target Markets

**Small Teams & Agencies** (Year 2+):
- Content agencies, consulting firms, research teams
- 2-10 people working on knowledge-intensive projects
- Team tier ($75/mo) becomes attractive
- Shared workspace and collaboration features
- Defer until individual product-market fit validates

**Academic Researchers** (Year 2+):
- Graduate students, postdocs, professors
- Managing large research paper libraries
- Need persistent context for literature reviews
- Pricing sensitivity (may need academic discount)

**Enterprise Knowledge Workers** (Year 3+):
- Large company employees in knowledge work roles
- IT, legal, consulting, strategy, product management
- Enterprise tier (custom pricing, SSO, compliance)
- Long sales cycles (6-12 months) - defer until scale

### Non-Target Markets

**Explicitly NOT Targeting** (MVP Phase):
- Casual AI users (won't pay $25/mo, not experiencing context pain)
- Code-focused developers (Cursor serves this segment well)
- Enterprise (complexity and sales cycle don't fit MVP timeline)
- Students (price sensitivity, academic use case differs from knowledge work)
- Teams requiring advanced collaboration (defer until solo validation)

**Why Clear Non-Targets Matter**:
- Focus scarce resources on highest-value segment
- Avoid feature creep serving wrong customers
- Pricing and positioning clarity (premium, not mass-market)
- Sales and marketing efficiency (no enterprise sales during MVP)

---

## Growth Strategy

### Customer Acquisition Channels

**Phase 1: Power User Validation** (Weeks 1-4, 20-30 beta users)
1. **Direct Outreach** (Primary) - Expected: 20-30 beta users
   - Twitter AI community (heavy ChatGPT/Claude users)
   - LinkedIn thought leaders (consultants, knowledge workers)
   - Reddit (r/ChatGPT, r/ClaudeAI, r/productivity)
   - Goal: 70% willing to pay after trial (validates willingness to pay)

2. **Personal Network** (Secondary) - Expected: 5-10 beta users
   - Indie hacker communities (Twitter, IndieHackers.com)
   - Former colleagues in knowledge work roles
   - Product Hunt early access list

**Phase 2: Community Launch** (Weeks 5-8, 50-100 trial signups)
1. **Hacker News** (Primary) - Expected: 30-50 trial signups
   - "Show HN: Centrid - Stop Re-Explaining Context to AI" post
   - Focus on context fragmentation problem + solution demo
   - Goal: Front page for 4-6 hours, 15-20% conversion to paid

2. **Reddit Communities** (Secondary) - Expected: 20-30 trial signups
   - r/ChatGPT: "I built a tool to solve the context re-explanation problem"
   - r/ClaudeAI: "Multi-chat with persistent document context"
   - r/productivity: "How I saved 2 hours/day using AI with persistent context"

3. **Twitter Launch** (Tertiary) - Expected: 10-20 trial signups
   - Launch thread explaining context fragmentation pain + solution
   - Tag AI influencers for engagement
   - Share screenshots/demo

**Phase 3: Content & Growth** (Months 2-3, Scale to 100-200 paying customers)
1. **Content Marketing** (Primary) - Expected: 50-100 customers
   - "Stop Re-Explaining Context to AI" thought leadership
   - Comparison content (vs ChatGPT, Notion AI, Cursor)
   - SEO: "ChatGPT context management", "AI for knowledge work"
   - Long-form guides: "How to work with AI without losing context"

2. **Partnerships & Reviews** (Secondary) - Expected: 30-50 customers
   - AI tool reviewers (YouTube, blogs)
   - Productivity YouTubers (demo + affiliate link)
   - Knowledge work influencers (Twitter, LinkedIn)

3. **Word-of-Mouth** (Organic) - Expected: 20-30 customers
   - Power users share with colleagues
   - Referral program (future): "Give $10, get $10"
   - Community-driven growth (Slack, Discord presence)

### Retention Strategy

**Activation-Focused** (First 10 Minutes):
- Guided onboarding: Upload 3 documents → Create first chat → Ask question → See context-aware response
- Success metrics: 80% complete upload + first context-aware chat within first session
- Email: "5 ways to use Centrid for [research/writing/analysis]"

**Multi-Chat Adoption** (First Week):
- In-app prompts: "Start a new chat to explore [related topic] without losing context"
- Success metrics: 60% create ≥2 chats within first week
- Email: "How to use multiple chats to organize your work"

**Habit Formation** (Weeks 2-4):
- Weekly usage summary: "You saved X hours this week by not re-explaining context"
- Feature discovery: "Try the document editor to create notes while chatting"
- Success metrics: 50% day-30 retention

**Power User Cultivation** (Month 1+):
- Advanced features: Version history, advanced search, folder organization
- Community access: Slack/Discord for power users
- Beta features: Early access to new capabilities
- Success metrics: 25% become power users (≥20 chats created/month)

**Churn Prevention**:
- Switching cost reinforcement: "You have X documents uploaded (worth $X in embeddings)"
- Re-engagement emails: "We miss you - here's what's new" (for inactive users)
- Exit surveys: "What would make you come back?"

### Expansion Strategy

**Upsell to Team Tier** (Month 6+):
- Identify solo users inviting collaborators
- In-app prompt: "Invite your team - $75/mo for 5 users (save 40%)"
- Team features: Shared workspaces, permissions, team analytics
- Target: 10-15% of Pro users upgrade to Team within 6 months

**Add-On Revenue** (Future):
- Additional storage (>10GB): $5/mo per 10GB
- Advanced AI models (GPT-4, Claude Opus): $10/mo premium
- Premium integrations (Google Drive, Notion, Slack): $5/mo each

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
| 1 (Beta) | 30 | 5 | $125 | $125 |
| 2 | 50 | 20 | $500 | $625 |
| 3 | 80 | 50 | $1,250 | $2,500 |
| 4 | 100 | 75 | $1,875 | $4,375 |
| 5 | 120 | 100 | $2,500 | $7,500 |
| 6 | 150 | 130 | $3,250 | $11,375 |
| 9 | 200 | 200 | $5,000 | $26,000 |
| 12 | 300 | 300 | $7,500 | $52,500 |

**Year 1 Targets**:
- Total customers: 300 paying (conservative) to 500 paying (aggressive)
- MRR: $7,500 (conservative) to $12,500 (aggressive)
- ARR: $90,000 (conservative) to $150,000 (aggressive)
- Total revenue: $52,500 (conservative) to $87,500 (aggressive)

**Assumptions**:
- Trial-to-paid conversion: 15-20%
- Month-over-month churn: 15-20% (80-85% retention)
- Average revenue per user: $25/month (Pro tier only)
- No team tier revenue in Year 1 (conservative)

### Customer Targets

**By Segment (Year 1)**:
- Pro tier: 300-500 customers at $25/month
- Team tier: 0 customers (deferred to Month 6+, not included in Year 1 projections)
- Enterprise: 0 customers (deferred to Year 2)

**By Acquisition Channel (Year 1)**:
- Organic (Hacker News, Reddit, Twitter): 60% (180-300 customers)
- Content marketing (SEO, blogs, guides): 30% (90-150 customers)
- Partnerships (reviews, influencers): 10% (30-50 customers)

**Power User Target**:
- 25% become power users (≥20 chats/month): 75-125 customers
- Power users have >90% retention (switching cost validated)
- Average 10-20 documents uploaded per power user

### Key Milestones

**Q1 (Months 1-3): Validate Product-Market Fit**
- Month 1: 5 beta customers paying, 80%+ complete onboarding
- Month 2: 20 paying customers, $500 MRR, 70%+ day-7 retention
- Month 3: 50 paying customers, $1,250 MRR, 60%+ create ≥2 chats

**Q2 (Months 4-6): Scale Acquisition**
- Month 4: 75 paying customers, $1,875 MRR, <10% monthly churn
- Month 5: 100 paying customers, $2,500 MRR, NPS >40
- Month 6: 130 paying customers, $3,250 MRR, team tier launch

**Q3 (Months 7-9): Growth Acceleration**
- Month 7: 150 paying customers, $3,750 MRR, sustainable CAC <$50
- Month 8: 170 paying customers, $4,250 MRR, content marketing scales
- Month 9: 200 paying customers, $5,000 MRR, word-of-mouth growth

**Q4 (Months 10-12): Scale & Optimize**
- Month 10: 230 paying customers, $5,750 MRR, team tier adoption
- Month 11: 260 paying customers, $6,500 MRR, enterprise exploration
- Month 12: 300 paying customers, $7,500 MRR, Year 2 planning

**Financial Health Metrics**:
- Break-even: Month 4-5 (MRR covers fixed + variable costs)
- Profitability: Month 6+ (positive cash flow)
- Runway extension: Every $1,000 MRR adds 2-3 months runway

---

## Risk Analysis

### Market Risks

**Risk 1: Power users don't value persistent context enough to pay $25/month**
- Likelihood: Low (ChatGPT Plus/Claude Pro adoption validates willingness to pay)
- Impact: High (invalidates entire business model)
- Mitigation: 7-day trial validates value before payment, beta phase tests conversion (target 15-20%)
- Validation: Month 2 - if trial-to-paid <10%, pivot pricing or positioning

**Risk 2: ChatGPT/Claude adds persistent document context feature**
- Likelihood: Medium (feature is logical extension)
- Impact: High (eliminates primary differentiator)
- Mitigation: First-mover advantage, user data lock-in, knowledge work focus (not just document Q&A)
- Response: Emphasize knowledge work workflows (research, creation, analysis), team features, integrations

**Risk 3: Market timing - AI hype cycle correction reduces adoption**
- Likelihood: Low-Medium (AI adoption is fundamental shift, not just hype)
- Impact: Medium (slows growth but doesn't invalidate need)
- Mitigation: Focus on proven pain point (context re-explanation), target existing AI users (already validated)

### Competitive Risks

**Risk 4: Notion adds multi-chat AI with document context**
- Likelihood: Medium (logical extension of Notion AI)
- Impact: Medium (Notion has distribution advantage)
- Mitigation: Mobile-first approach (Notion mobile is weak), knowledge work focus, faster iteration
- Response: Integrate with Notion (import documents), position as "AI layer for Notion"

**Risk 5: New well-funded competitor launches similar product**
- Likelihood: Medium-High (space is hot)
- Impact: Medium (competition for users but validates market)
- Mitigation: Speed to market (8-10 weeks MVP), community ownership, user data lock-in
- Response: Focus on execution quality (RAG accuracy, UX polish), community evangelism

**Risk 6: Cursor expands beyond code to general knowledge work**
- Likelihood: Low (Cursor is deeply code-focused)
- Impact: Low (different target market)
- Mitigation: Web-first approach (Cursor is desktop-only), mobile access, knowledge work positioning

### Execution Risks

**Risk 7: RAG context retrieval quality is insufficient (irrelevant documents)**
- Likelihood: Medium (RAG is complex, context quality varies)
- Impact: High (core value proposition fails)
- Mitigation: Hybrid search (vector + keyword), relevance tuning, user feedback loops, chunking optimization
- Validation: Beta phase tests user satisfaction >4/5, iterate until quality is validated

**Risk 8: Claude API costs exceed $15/customer/month (margin compression)**
- Likelihood: Low-Medium (usage may be higher than estimated)
- Impact: Medium (unit economics worsen but not broken)
- Mitigation: Smart context caching (reduce redundant API calls), usage monitoring, $25/month pricing has margin buffer
- Response: Optimize prompts, implement tiered usage limits, increase pricing if necessary

**Risk 9: Retention is lower than expected (<50% day-30)**
- Likelihood: Medium (product-market fit is hypothesis)
- Impact: High (LTV assumptions invalid, CAC payback fails)
- Mitigation: Focus on activation (80% complete onboarding), multi-chat adoption (60% create ≥2 chats), document lock-in (≥5 documents)
- Validation: Month 2-3 retention data, iterate onboarding if <50% day-30

**Risk 10: Development takes longer than 8-10 weeks (delayed launch)**
- Likelihood: Low-Medium (scope creep, technical complexity)
- Impact: Medium (delays validation, burns runway)
- Mitigation: MVP-first discipline (ruthless scope management), Rule of Three (no premature abstraction), clear success criteria
- Response: Ship imperfect MVP, iterate based on user feedback (working software > perfect architecture)

### Mitigation Strategies Summary

**Validation-Driven Approach**:
- Beta phase (Weeks 1-4): 20-30 users, validate context value and willingness to pay
- Launch phase (Weeks 5-12): 50-100 trial signups, validate 15-20% conversion
- Scale phase (Months 2-3): 100-200 customers, validate retention and unit economics

**Flexibility & Pivots**:
- If context retrieval quality insufficient: Iterate RAG implementation, hybrid search, user feedback
- If pricing too high: Introduce lower tier ($15/mo with limits), test conversion
- If retention low: Focus on activation and onboarding improvements
- If CAC too high: Double down on organic channels (content, community)

**Risk Monitoring**:
- Weekly metrics review: Trial signups, conversion rate, retention, NPS
- Monthly business review: MRR, CAC, LTV, churn, unit economics
- Quarterly strategic review: Market trends, competitive landscape, product roadmap

---

## Pitch Deck

### One-Line Pitch

"Multiple AI conversations with shared document context—stop re-explaining, start thinking."

### 30-Second Pitch

ChatGPT and Notion AI trap you in single conversation threads. When you're researching a complex topic, you need to branch—explore tangents, compare approaches, analyze from different angles—without losing your main thread.

Centrid: Upload your documents once, start unlimited separate chats, and every conversation automatically has access to your full knowledge base. Research in one chat, create in another, analyze in a third—all using the same documents. No re-uploading, no re-explaining, no context loss.

$25/month. 7-day free trial. Built for consultants, researchers, and content creators who think non-linearly.

### 60-Second Pitch

The problem: Knowledge workers hit a wall with AI tools. ChatGPT forces you to re-explain context every conversation—10-15 minutes per chat re-uploading documents and rebuilding context. Notion AI has Q&A with workspace context, but traps you in a single conversation thread. When you need to explore tangents, compare approaches, or analyze from different angles, you lose your main thread or restart from zero.

The solution: Centrid enables multiple independent AI conversations with shared document context. Upload your documents once, then start unlimited separate chats—research in one, create in another, analyze in a third—all with automatic access to your full knowledge base. Knowledge work isn't linear, so your AI workspace shouldn't be either.

The market: 2M+ ChatGPT Plus and 500K Claude Pro users already pay $20/month. Plus Notion AI now requires $20/user/month Business plan (up from $10/month), creating dissatisfaction. Our target: individual power users (consultants, researchers, content creators) who need multiple AI conversations, not workspace management.

The business: $25/month standalone SaaS with 7-day free trial. Unit economics: <$50 CAC, $400+ LTV, 8:1 ratio. Year 1 target: 300 customers ($7,500 MRR). Year 3: 2,000-5,000 customers ($600K-1.5M MRR).

Differentiation: ChatGPT = no persistent context. Notion AI = single Q&A thread tied to Notion workspace. Centrid = unlimited separate conversations + shared documents + mobile-first + platform-independent. We're the only solution for non-linear knowledge work.

Traction: 8-10 week MVP sprint. Beta Week 4, public launch Week 10. First 20-50 paying customers in 90 days validates product-market fit.

The ask: Early adopters to validate "multiple conversations with shared context" for knowledge work, and strategic angels who understand AI + productivity space.

---

**Next Steps**:
- Run `/marketing.brief` to create marketing communications strategy (personas, messaging, landing page outline)
- Use pitches for initial outreach, investor conversations, and landing page headlines
- Validate pricing and positioning during beta phase (Weeks 1-4)
