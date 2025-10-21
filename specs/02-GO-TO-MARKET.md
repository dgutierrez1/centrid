# Go-To-Market Strategy

**Last Updated**: 2025-01-15
**Status**: Ready for Execution
**Philosophy**: Focused Execution + Direct Distribution + Rapid Validation

---

## Executive Summary

### The 3-Stage Approach

1. **Stage 0→$1**: Manual outreach, direct sales, prove someone will pay (Week 1-2)
2. **Stage $1→$1K MRR**: Double down on what worked, systematic execution (Week 3-10)
3. **Stage $1K→$10K MRR**: Scale winning channels, expand strategically (Week 11-32)

**Goal**: $10K MRR within 12 months with profitable unit economics from day one.

### Core Principles

1. **Speed > Perfection** - Launch before you're ready, iterate fast
2. **Talk to Customers Relentlessly** - Every conversation is worth 10 hours of work
3. **Focus Fire** - One channel extremely well > ten channels poorly
4. **Follow the Energy** - Do what's working, kill what's not
5. **Profitable from $1** - Never lose money acquiring customers
6. **Distribution > Product** - Best product doesn't win, best distribution wins

---

## Pricing & Economics

### Pricing Structure

**Solo Tier: $19/month**
```
✅ 100 AI requests/month
✅ 500 files, 5GB storage
✅ Claude 3.5 Haiku (8/10 quality)
✅ Mobile-first PWA
✅ Vector search

Cost: $0.46/month
Margin: 97.6% 🔥
```

**Pro Tier: $49/month**
```
✅ 500 AI requests/month
✅ 2,000 files, 20GB storage
✅ Claude 3.5 Haiku
✅ Priority support

Cost: $2.11/month
Margin: 95.7% 🔥
```

**Free Trial**: 7 days, no credit card required, 10 AI requests

### Cost Breakdown (Per Customer)

| Component | Solo | Pro |
|-----------|------|-----|
| AI Costs (Haiku @ $0.0036/req) | $0.36 | $1.80 |
| Storage | $0.10 | $0.31 |
| Infrastructure | ~$0.00 | ~$0.00 |
| **Total Cost** | **$0.46** | **$2.11** |
| **Revenue** | **$19** | **$49** |
| **Profit** | **$18.54** | **$46.89** |

### Why These Margins Work

- **Claude 3.5 Haiku**: Fast, cheap ($0.0036/request), good quality (8/10)
- **Context limits**: 50K tokens (Solo) / 150K tokens (Pro) - prevents cost explosion
- **Rate limiting**: Hard caps on requests prevent abuse
- **Storage is cheap**: Commodity pricing, AI is the real expense

### Scaling Economics

**At $1K MRR** (50 customers):
- Revenue: $1,250/month
- Costs: $98.65/month
- Profit: $1,151.35/month (92.1% margin)

**At $10K MRR** (450 customers):
- Revenue: $13,050/month
- Costs: $903/month
- Profit: $12,147/month (93.1% margin)

**Key Insight**: Margins stay above 90% at every scale.

---

## Target Audience & Positioning

### Ideal Customer Profile (ICP)

**Primary Target**: Knowledge Workers & Power AI Users

**Specific Personas**:
1. Heavy ChatGPT/Claude users experiencing context re-explanation pain daily
2. Content creators managing research, drafts, multiple projects
3. Consultants & analysts working with client documents
4. Researchers managing large document collections with AI
5. Indie hackers building products needing AI assistance

**Demographics**:
- Age: 25-45
- Income: $60K-200K (can afford $25/month without approval)
- Behavior: Uses ChatGPT Plus or Claude Pro daily (10+ conversations/day)
- Pain Level: 8/10 - experiencing context fragmentation daily
- Budget: Already paying $20-40/month for AI subscriptions

### Core Positioning

**One-Liner** (Use everywhere):
```
AI For Knowledge Work With Persistent Context.
Stop Re-Explaining Context. Start Working Smarter.
```

**Why This Works**:
- Directly addresses core pain (context re-explanation)
- Clear benefit (persistent context across conversations)
- Proven "Stop/Start" pattern converts well
- Targets knowledge workers (broader than just developers)

### Messaging by Channel

- **Hacker News**: "Built this because I'm tired of re-explaining context to ChatGPT. Multi-chat system with persistent document context via RAG + pgvector."
- **Product Hunt**: "AI for knowledge work with persistent context: upload documents once, access across unlimited chats, never re-explain"
- **Reddit**: "Tired of copy-pasting documents to ChatGPT? I built persistent context across conversations"
- **Twitter**: "Stop re-explaining context every conversation. Persistent document context across unlimited AI chats."

### Competitive Positioning

**vs ChatGPT Plus ($20/month)**:
- ChatGPT: Unlimited messages, GPT-4o, but no persistent knowledge base, context resets
- Centrid: Persistent knowledge base, context persists forever, $1 cheaper, mobile-first

**vs Claude Pro ($20/month)**:
- Claude: 5x usage, Sonnet 4, but no knowledge persistence, chat-only
- Centrid Pro: Persistent knowledge base, professional organization, mobile-first

**Value Prop**: "ChatGPT forgets. Centrid remembers."

---

## Stage 1: $0 → First Dollar (Week 1-2)

**Objective**: Prove ONE person will pay real money

**Strategy**: Manual everything - no automation, no scale, just validation

### Day-by-Day Execution

**Days 1-2: Build Hit List** (50 prospects)
- Find people who explicitly mentioned the pain in last 30 days
- Twitter search: "Obsidian mobile", "ChatGPT context", "copying to ChatGPT"
- Reddit: r/ObsidianMD, r/productivity, r/markdown
- LinkedIn: Technical Writers, Developer Advocates, PMs
- Track in spreadsheet: Name, Platform, Pain Point, Status

**Days 3-5: Outreach Wave 1** (20 prospects)

DM Template:
```
Hey [Name],

Saw your tweet about [specific pain]. I literally built something for this.

Centrid - AI agents for markdown files. Like Cursor but for documents.
Works on mobile, understands your entire knowledge base.

Try it for $10 first month? Money-back guarantee if it doesn't save hours.

90-second demo: [Loom link]

Worth a shot?
- [Your name]
```

**Days 6-8: Demos & Closing**
- 15-minute demo calls (show THEIR specific pain solved)
- Send Stripe payment link immediately after demo
- Onboard within 30 minutes of payment
- 24hr, 48hr, 7-day check-ins

**Days 9-10: Outreach Wave 2** (30 prospects)
- Analyze Wave 1 learnings
- Refine messaging based on objections
- Expand to B-tier prospects

### Success Criteria (Week 2)

**Minimum Success**:
- ✅ 1 paying customer (any amount)
- ✅ 5+ responses to outreach
- ✅ Clear understanding of top 3 objections

**Great Success**:
- ✅ 3-5 paying customers
- ✅ 10+ conversations
- ✅ Customers actively using product daily

---

## Stage 2: $1 → $1K MRR (Week 3-10)

**Objective**: Find repeatable, scalable acquisition channel

**Target**: 50-70 paying customers at $19/month = $1,000 MRR

### Week 3-4: Build Marketing Foundation

**Landing Page** (Build in 4 hours):
- Hero: One-liner + 90-second demo video
- Problem: 3 specific pains
- Solution: 3 key features
- Social Proof: Screenshots of customer messages
- Pricing: $19/month, Start Free Trial
- FAQ: Top 3 objections

**Email Sequence** (3 emails):
1. Day 0: Welcome + get started
2. Day 3: Feature highlight
3. Day 6: Trial ending, upgrade offer

**Analytics**:
- Google Analytics 4 or Plausible
- Hotjar for heatmaps
- Track: Visits → Signups → Activations → Paid

### Week 5-10: Channel Testing & Scaling

**Test one channel per week. Measure ruthlessly. Keep or kill.**

**Week 5: Hacker News**
- Post title: "Show HN: AI agents for markdown knowledge bases (like Cursor for documents)"
- Post Monday 8am PST
- Respond to every comment within 2 hours
- Offer HN-specific discount (HN50 for 50% off lifetime)
- Target: 50+ points, 20+ signups, 5+ paying

**Week 6: Product Hunt**
- Find hunter 2 weeks before
- Launch Tuesday 12:01am PST
- Tagline: "AI agents for markdown - Cursor for documents"
- Engage heavily first 2 hours
- Target: Top 10, 30+ signups, 5+ paying

**Week 7: Reddit**
- r/ObsidianMD: "Built mobile-first alternative after frustration with Obsidian mobile"
- Give value first, promote second
- Space posts 2-3 days apart
- Target: 50+ upvotes, 10+ signups, 2+ paying

**Week 8: Twitter Build-in-Public**
- Daily updates (Monday: weekly recap, Tuesday: technical, Wednesday: customer story)
- Weekly threads sharing learnings
- Engage with indie hacker community
- Target: 200+ followers, 5+ signups/week

**Week 9-10: Optimize & Scale Best Channel**
- Analyze which channel got most PAYING customers
- Double down on winner
- Systematize the process

### Success Criteria (Week 10)

**Minimum Success**:
- ✅ $500 MRR (25-30 customers)
- ✅ ONE channel consistently bringing customers
- ✅ 20%+ trial → paid conversion
- ✅ <10% monthly churn

**Great Success**:
- ✅ $1,000 MRR (50-70 customers)
- ✅ 2 channels working consistently
- ✅ 25%+ conversion, <5% churn
- ✅ Customers referring others organically

---

## Stage 3: $1K → $10K MRR (Week 11-32)

**Objective**: Scale proven channels, build sustainable growth engine

**Target**: 500-550 customers = $10,000 MRR (~22 weeks)

### Month 3-4: Systematize Current Channels

**If Reddit is best**:
- Content calendar for topics, subreddits, timing
- Batch-create 12 posts (one month)
- Expand to 20+ related subreddits
- Post 3x/week instead of 1x
- Expected: 20-30 customers/month

**If Twitter is best**:
- Batch-create 30 tweets every Sunday
- Daily engagement routine (30 min)
- Weekly threads
- Expected: 15-25 customers/month

**If HN is best**:
- Monthly "Show HN" updates
- Weekly engagement on Ask HN
- Share technical blog posts
- Expected: 10-15 customers/month (can't scale linearly)

### Month 4-5: Add Content Marketing

**Target Keywords**:
- "Obsidian mobile alternative" (500/month)
- "AI markdown editor" (300/month)
- "mobile markdown app" (200/month)

**Content Calendar** (2 posts/week):
- Week 1: Comparison post (Centrid vs Obsidian)
- Week 2: Use case post (How developers document 10x faster)
- Week 3: Technical deep-dive (Building RAG system)
- Week 4: Practical guide (AI-assisted documentation)

**Expected** (after 6 months):
- 500-1000 monthly organic visitors
- 20-40 signups/month from SEO
- 5-10 paying customers/month

### Month 5-6: Evaluate Paid Acquisition

**Only test if**:
- ✅ LTV > $400 (20+ month retention)
- ✅ Conversion > 20%
- ✅ Churn < 5%
- ✅ Can afford $500-1000 test budget

**Test channels** ($300-600/month budget):
1. Reddit Ads ($10/day) - Expected CAC: $15-25
2. Twitter Ads ($15/day) - Expected CAC: $20-35
3. Google Search ($20/day) - Expected CAC: $25-45

**Framework**: Run 30 days, kill if CAC > $50 or ROI < 3:1

### Month 6-7: Build Distribution Moats

**SEO Content Library**:
- 30-40 blog posts by now
- Internal linking, backlinks
- Expected: 2000-3000 monthly visitors

**Email List**:
- Build from blog CTAs, free resources
- Weekly newsletter
- Expected: 500-1000 subscribers, 5-10% convert

**Brand & Community**:
- 1000+ Twitter followers
- Reddit community recognition
- Customer testimonials
- Expected: 20-30% from word-of-mouth

### Success Criteria (Week 32)

**Minimum Success**:
- ✅ $5,000 MRR (250-300 customers)
- ✅ Multiple channels bringing consistent customers
- ✅ Content marketing starting to pay off

**Great Success**:
- ✅ $10,000+ MRR (500+ customers)
- ✅ Organic/SEO driving 40%+ signups
- ✅ <3% churn
- ✅ Profitable customer acquisition at scale

---

## Landing Page Essentials (MVP Launch)

### Hero Section

**Headline** (Recommended):
```
AI For Knowledge Work With Persistent Context.
Stop Re-Explaining Context. Start Working Smarter.
```

**Subheadline**:
```
Upload your documents once. Work across multiple chats.
Persistent document context for your knowledge work—reducing re-explanation.
```

**Primary CTA**:
```
[Get Started Free]
No credit card required • 7-day free trial • Setup in 60 seconds
```

**Visual**: 15-second looping video/GIF showing upload → create → result

### Problem Section

```
Context Fragmentation Is Killing Your Productivity

When working with AI, you constantly:
❌ Re-explain the same context in different conversations
❌ Copy-paste documents repeatedly to maintain context
❌ Lose your train of thought when exploring tangents
❌ Spend more time on context setup than actual knowledge work

The result? Fragmented thinking. Lost productivity. Exhaustion.
```

### Solution Section

```
Persistent Context For Knowledge Work.

1️⃣  Upload Your Documents Once
    Centrid maintains this context across all your work.

2️⃣  Work Across Multiple Chats
    Each chat maintains access to your document context—automatically.

3️⃣  Focus on Knowledge Work, Not Context Management
    Switch topics, branch conversations, your AI maintains document context.
```

### Use Cases (4 Cards)

**Create & Generate** (Purple):
```
Generate blog posts, proposals, reports—grounded in your documents.
Start separate chats for different pieces without re-uploading context.
```

**Research & Synthesize** (Light purple):
```
Search, compare, synthesize information from multiple sources.
Different chats research different angles—all with document access.
```

**Analyze & Decide** (Blue-violet):
```
Analyze options, compare approaches—all informed by your documents.
Branch conversations to explore alternatives.
```

**Branch & Explore** (Teal):
```
Explore tangents without losing context.
Your document context travels with you.
```

### Trust & FAQ

**Trust Elements**:
- 🔒 Encrypted at rest and in transit
- 🤖 Powered by Claude AI (Anthropic)
- 🏗️ Infrastructure by Supabase (enterprise-grade)
- We never train on your data

**Key FAQ**:
- Q: How is this different from ChatGPT?
  A: ChatGPT doesn't maintain document context across conversations. Centrid provides shared document access across multiple chats.

### Final CTA

```
Ready For AI-Optimized Knowledge Work?

Try Centrid free for 7 days. No credit card required.

[Get Started Now]

⚡ Setup in 60 seconds  •  🔒 Your data stays private  •  ❌ Cancel anytime
```

### Landing Page Performance Targets

**Funnel**:
- Landing visitors → 100%
- Signup started → 15%
- Signup completed → 10%
- Documents uploaded → 40%
- Content created → 60%

**A/B Tests** (First 30 days):
1. Week 1: Headline variations
2. Week 2: CTA button text
3. Week 3: Hero visual (video vs static)

---

## Metrics Dashboard

### Track Weekly

**Acquisition**:
```
Metric              | Week 1 | Week 4 | Week 8 | Week 16 | Week 32
Landing Page Visits | 50     | 400    | 1200   | 3000    | 8000
Signup Rate         | 15%    | 20%    | 22%    | 25%     | 28%
Signups             | 8      | 80     | 264    | 750     | 2240
```

**Conversion & Revenue**:
```
Metric            | Week 8 | Week 16 | Week 32
Paying Customers  | 30     | 100     | 525
MRR              | $570   | $1,900  | $9,975
ARPU             | $19    | $19     | $19
Free → Paid %    | 20%    | 23%     | 25%
```

**Retention**:
```
Metric                | Target | Track
Day 7 Retention       | 45%    | Weekly
Monthly Churn         | <5%    | Monthly
Paying Customer Churn | <3%    | Monthly
```

**Channel Performance** (Monthly):
```
Channel | Visits | Signups | Paid | Conv % | Time | Cost | CAC
HN      | 1200   | 45      | 8    | 18%    | 6h   | $0   | $0
PH      | 800    | 32      | 5    | 16%    | 8h   | $0   | $0
Reddit  | 2100   | 67      | 11   | 16%    | 12h  | $0   | $0
Twitter | 600    | 23      | 4    | 17%    | 20h  | $0   | $0
```

---

## Success Checkpoints

### Week 2: First Dollar
- [ ] At least 1 paying customer
- [ ] 5+ customer conversations
- [ ] Top 3 objections identified
- [ ] Pricing validated
- [ ] Best positioning identified

### Week 10: $1K MRR
- [ ] 50-70 paying customers
- [ ] ONE channel consistently working
- [ ] <10% monthly churn
- [ ] Landing page converting 15%+
- [ ] Customer testimonials collected

### Week 32: $10K MRR
- [ ] 500+ paying customers
- [ ] 3+ channels bringing customers
- [ ] SEO driving 30-50 signups/month
- [ ] <5% monthly churn
- [ ] Profitable unit economics (LTV/CAC > 5:1)
- [ ] Clear path to $50K MRR

---

## Failure Modes & Pivots

### If You Can't Get First Customer (Week 2)

**Diagnosis**: Wrong audience, messaging, product, or price

**Action**:
1. Do 10 more customer conversations
2. Ask: "Would you pay $X today?"
3. If no one says yes → Pivot product or audience
4. If yes but don't pay → Pricing or trust issue

### If You Can't Get to $1K MRR (Week 10)

**Diagnosis**: Distribution, conversion, or retention problem

**Action**:
1. Review channel data - which actually converts?
2. Talk to churned customers
3. A/B test pricing
4. Simplify onboarding
5. Consider wrong audience → Pivot to different persona

---

## Quick Reference

**Positioning**: "AI for knowledge work with persistent context"
**Target**: Knowledge workers experiencing context fragmentation
**Price**: $19 Solo / $49 Pro (7-day free trial, no CC)
**Margins**: 97.6% Solo / 95.7% Pro
**Goal**: $10K MRR in 32 weeks

**Stage 1** (Week 1-2): Manual outreach → First customer
**Stage 2** (Week 3-10): Test channels → $1K MRR
**Stage 3** (Week 11-32): Scale winners → $10K MRR

**Core Metric**: Paying customers (not signups, not traffic)
**Core Channel**: Test everything, double down on winner
**Core Principle**: Speed > Perfection

---

*See `03-FIRST-DOLLAR-PLAYBOOK.md` for detailed Stage 1 execution tactics.*
