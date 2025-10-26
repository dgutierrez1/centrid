# Centrid Pricing Strategy

**Date**: 2025-10-26
**Status**: Final - Single Source of Truth for All Pricing
**Version**: 2.0 (Credit System + Extended Thinking)

---

## Executive Summary

**Strategy**: Undercut ChatGPT/Claude with charm pricing ($19 Plus tier) + credit-based system with extended thinking control

**Tiers**:
- **Free**: 40 Haiku 4.5 requests/month
- **Plus $19/mo**: Unlimited Haiku + 60 Sonnet credits
- **Pro $39/mo**: Unlimited Haiku + 140 Sonnet credits

**Margins**: 43-53% (healthy and sustainable)

**Key Innovation**: Credit system lets users choose standard OR extended thinking per request, maximizing flexibility while controlling costs.

---

## Table of Contents

1. [Pricing Tiers (Detailed)](#pricing-tiers-detailed)
2. [Claude API Costs](#claude-api-costs)
3. [Cost Analysis by Tier](#cost-analysis-by-tier)
4. [Credit System & Extended Thinking](#credit-system--extended-thinking)
5. [Revenue Models](#revenue-models)
6. [Competitive Positioning](#competitive-positioning)
7. [Risk Analysis & Scenarios](#risk-analysis--scenarios)
8. [Pricing Psychology](#pricing-psychology)
9. [Implementation Requirements](#implementation-requirements)
10. [Success Metrics](#success-metrics)

---

## Pricing Tiers (Detailed)

### Free - Explorer

**What's Included**:
- 40 Haiku 4.5 requests/month (hard cap)
- 0 Sonnet credits (no premium AI, no extended thinking)
- 20 files limit
- 5 active chats/branches
- Basic context (no knowledge graph, no concepts)

**Cost to Us**: $1.16/user
- Haiku API: 40 × $0.0115 = $0.46
- Storage (20 files): $0.50
- Infrastructure: $0.20

**Purpose**: Proof of value without friction

**Conversion Triggers**:
- File limit (hits at ~10-15 documents)
- Chat/branch limit (hits at serious exploration)
- Monthly cap (hits at 1-2 requests/day)
- Needs premium AI for complex reasoning

---

### Plus - $19/mo

**What's Included**:
- **Unlimited Haiku 4.5 requests** (no throttling)
- **60 Sonnet 4.5 credits/month** (premium AI with extended thinking)
  - Use for standard OR extended thinking requests
  - User chooses per request
  - Extended thinking: AI shows internal reasoning (10K token budget)
- 200 files limit
- Unlimited chats & branches
- Full context (knowledge graph, concepts, divergence tracking)
- Provenance metadata on all files
- Cross-branch consolidation

**Cost to Us** (average usage):
- 250 Haiku requests: $2.88
- 50 Sonnet credits used (83% utilization):
  - 35 standard (70%): $1.21
  - 15 extended thinking (30%): $2.99
- Storage (200 files): $2.00
- Infrastructure: $0.50
- **Total: $9.58/user**

**Profit**: $19 - $9.58 = **$9.42/user (50% margin)**

**Worst Case** (all Sonnet credits use extended thinking):
- Cost: $15.35/user
- Profit: $3.65/user (19% margin)
- Still profitable!

**Value Proposition**: "$1 cheaper than ChatGPT Plus, with branching + extended thinking + never lose context"

**Target Users**:
- Researchers doing literature reviews
- Consultants preparing client deliverables
- Engineers evaluating technical decisions
- Product managers exploring feature specs

---

### Pro - $39/mo

**What's Included**:
- **Unlimited Haiku 4.5 requests**
- **140 Sonnet 4.5 credits/month** (2.3x more than Plus)
  - Use for standard OR extended thinking requests
  - User chooses per request
  - Extended thinking: AI shows internal reasoning (10K token budget)
- 500 files limit
- Unlimited chats & branches
- Full context + Collaboration (V4 - deferred)
- Provenance metadata on all files
- Cross-branch consolidation
- Priority support
- Priority queue (2x faster)

**Cost to Us** (average usage):
- 300 Haiku requests: $3.45
- 120 Sonnet credits used (86% utilization):
  - 84 standard (70%): $2.90
  - 36 extended thinking (30%): $7.18
- Storage (500 files): $4.00
- Infrastructure: $0.75
- **Total: $18.28/user**

**Profit**: $39 - $18.28 = **$20.72/user (53% margin)**

**Worst Case** (all Sonnet credits use extended thinking):
- Cost: $32.14/user
- Profit: $6.86/user (18% margin)
- Still profitable!

**Value Proposition**: "Power users + teams, 2.3x more credits, matches GitHub Copilot Pro+"

**Target Users**:
- Heavy researchers (10+ hours/week in deep work)
- Consulting firms (billable hour justification)
- Research teams (2-5 people)
- Technical writers (extensive documentation)

---

### Team - $75/mo (Deferred to Month 6+)

**What's Included**:
- All Pro features
- Shared workspaces (5 users included)
- Branch permissions and visibility controls
- Team analytics and exploration tree views
- Admin controls and team management
- Priority support

**Not Included in MVP**: Focus on individual product-market fit first.

---

### Enterprise - Custom Pricing (Deferred to Year 2+)

**What's Included**:
- All Team features
- SSO, compliance, audit logs
- Dedicated support and SLA
- Custom integrations
- Professional services (onboarding, training)

**Not Included in MVP**: Scale to 50+ customers first.

---

## Claude API Costs

### Model Pricing (Per Million Tokens)

| Model | Input | Output | Notes |
|-------|-------|--------|-------|
| **Haiku 4.5** | $1 | $5 | Oct 2025, performance similar to Sonnet 4 |
| **Sonnet 4.5** | $3 | $15 | Sep 2025, "best coding model in the world" |
| **Opus 4.1** | $15 | $75 | 5x more expensive, deferred to post-MVP |

### Per-Request Cost Calculations

**Standard Haiku 4.5 request**:
- Input: 1,500 tokens × ($1/1M) = $0.0015
- Output: 2,000 tokens × ($5/1M) = $0.0100
- **Total: $0.0115 per request**

**Standard Sonnet 4.5 request** (no extended thinking):
- Input: 1,500 tokens × ($3/1M) = $0.0045
- Output: 2,000 tokens × ($15/1M) = $0.0300
- **Total: $0.0345 per request**

**Extended thinking Sonnet 4.5 request** (10K thinking budget):
- Input: 1,500 tokens × ($3/1M) = $0.0045
- Thinking output: 10,000 tokens × ($15/1M) = $0.1500
- Response output: 3,000 tokens × ($15/1M) = $0.0450
- **Total: $0.1995 per request**

**Cost Ratio**: Extended thinking is **5.8x more expensive** than standard Sonnet.

### Tool Calls & Computer Use

**Tool Calls** (function calling):
- Adds 313-700 input tokens per request
- Cost: ~$0.002 per request (negligible)
- Impact: ~6% increase on standard Sonnet

**Computer Use**:
- Priced separately: $0.05 per session-hour
- 50 free hours daily per organization
- **Decision**: Not offering in MVP, defer to V2

---

## Cost Analysis by Tier

### Free Tier Economics

**Monthly Cost Breakdown**:
```
Haiku API:        40 × $0.0115  = $0.46
Storage (20 files):               $0.50
Infrastructure:                   $0.20
────────────────────────────────────────
Total per user:                  $1.16
```

**Annual Cost**: $1.16 × 12 = **$13.92 per free user/year**

**100 Free Users**: $116/month = **$1,392/year**

**Strategic Value**:
- Acquisition funnel (convert 25-30% to paid)
- Word-of-mouth marketing
- Product feedback
- Acceptable CAC when conversion validates

---

### Plus Tier Economics

**Monthly Cost Breakdown** (average usage):

Assumptions:
- 250 Haiku requests (avg active user)
- 50 Sonnet credits used (83% utilization)
- 70% standard / 30% extended thinking mix

```
Haiku API:         250 × $0.0115  = $2.88
Sonnet standard:    35 × $0.0345  = $1.21
Sonnet extended:    15 × $0.1995  = $2.99
Storage (200 files):                $2.00
Infrastructure:                     $0.50
──────────────────────────────────────────
Total per user:                    $9.58

Revenue:                          $19.00
Profit per user:                   $9.42
Margin:                              50%
```

**Extended Thinking Adoption Scenarios**:

| Adoption % | Cost | Profit | Margin |
|------------|------|--------|--------|
| 0% (none) | $7.10 | $11.90 | 63% |
| 30% (base) | $9.58 | $9.42 | 50% |
| 50% (optimistic) | $11.16 | $7.84 | 41% |
| 70% (aggressive) | $12.74 | $6.26 | 33% |
| 100% (worst case) | $15.35 | $3.65 | 19% |

**Conclusion**: Profitable at ALL adoption rates.

**Annual Economics**:
- Cost: $9.58 × 12 = $115/year
- Revenue: $19 × 12 = $228/year
- Profit: $113/year per user

---

### Pro Tier Economics

**Monthly Cost Breakdown** (average usage):

Assumptions:
- 300 Haiku requests (power user)
- 120 Sonnet credits used (86% utilization)
- 70% standard / 30% extended thinking mix

```
Haiku API:         300 × $0.0115  = $3.45
Sonnet standard:    84 × $0.0345  = $2.90
Sonnet extended:    36 × $0.1995  = $7.18
Storage (500 files):                $4.00
Infrastructure:                     $0.75
──────────────────────────────────────────
Total per user:                   $18.28

Revenue:                          $39.00
Profit per user:                  $20.72
Margin:                              53%
```

**Extended Thinking Adoption Scenarios**:

| Adoption % | Cost | Profit | Margin |
|------------|------|--------|--------|
| 0% (none) | $12.34 | $26.66 | 68% |
| 30% (base) | $18.28 | $20.72 | 53% |
| 50% (optimistic) | $22.56 | $16.44 | 42% |
| 70% (aggressive) | $26.84 | $12.16 | 31% |
| 100% (worst case) | $32.14 | $6.86 | 18% |

**Conclusion**: Profitable at ALL adoption rates, even 100% extended thinking.

**Annual Economics**:
- Cost: $18.28 × 12 = $219/year
- Revenue: $39 × 12 = $468/year
- Profit: $249/year per user

---

## Credit System & Extended Thinking

### How Sonnet Credits Work

**1 credit = 1 AI request** (user chooses mode per request):
- **Standard mode**: Quick response, normal reasoning
- **Extended thinking mode**: AI shows internal reasoning process before responding

Users see this in the UI:
```
[ ] Quick response (standard)
    Fast, uses 1 credit

[x] Deep thinking (extended thinking)
    Complex reasoning, AI shows its work
    Uses 1 credit
```

### Extended Thinking: What It Is

**Standard Sonnet request**:
```
User: "Analyze these 5 papers on RAG approaches"
AI: [Generates 2,000 token response immediately]
```

**Extended thinking Sonnet request**:
```
User: "Analyze these 5 papers on RAG approaches"
AI: [Internal reasoning - 10,000 tokens]
    "Let me think through this systematically...
     First, I'll categorize the approaches...
     Then compare chunking strategies...
     Consider embedding models..."
    [Final response - 3,000 tokens]
    "Based on my analysis, here are the key findings..."
```

**Benefits**:
1. **Deep analysis**: Multi-step reasoning, complex synthesis
2. **Transparency**: See how AI arrived at conclusions
3. **Better consolidation**: Cross-branch synthesis with visible reasoning
4. **Quality over speed**: For important decisions

**When to use extended thinking**:
- ✅ Consolidating findings from multiple branches
- ✅ Complex technical decisions
- ✅ Literature review synthesis
- ✅ Client deliverable preparation
- ❌ Quick lookups
- ❌ Simple questions
- ❌ Brainstorming

### Cost Control: 10K Thinking Budget

**Why we cap at 10,000 tokens**:
- Prevents cost explosion (unbounded thinking can reach 45K tokens)
- 10K = ~7,500 words of internal reasoning (sufficient for complex tasks)
- Anthropic's recommendation for cost control
- Users can't accidentally rack up massive costs

**What if 10K isn't enough?**
- Beta validation: Monitor actual usage
- User feedback: "Was thinking sufficient?"
- Can adjust to 15K if needed (cost: +$0.075 per request = acceptable)

**Comparison**:
- 10K budget: $0.1995 per request (our default)
- 15K budget: $0.2745 per request (+37% cost)
- 45K unbounded: $0.6995 per request (+250% cost) ❌

---

## Revenue Models

### Base Model (100 Users)

**Distribution**: 60 Free, 32 Plus, 8 Pro

**Costs**:
```
Free:  60 × $1.16   = $69.60
Plus:  32 × $9.58   = $306.56
Pro:    8 × $18.28  = $146.24
────────────────────────────────
Total:                $522.40
```

**Revenue**:
```
Plus:  32 × $19     = $608.00
Pro:    8 × $39     = $312.00
────────────────────────────────
Total:                $920.00
```

**Profit**:
```
Monthly profit:       $397.60
Margin:                   43%
Per paid user:         $9.94
```

**Break-Even Analysis**:
- Fixed costs (60 free users): $69.60
- Plus contribution margin: $19 - $9.58 = $9.42
- Break-even Plus users: $69.60 / $9.42 = **7.4 users**
- Free → Plus conversion needed: 7.4 / 60 = **12.3%** (round to 14%)

**Industry benchmark**: 20-25% freemium conversion
**Our target**: 25-30%
**Conclusion**: Very achievable, low-risk break-even

---

### Worst Case Model (All Extended Thinking)

**What if 100% of Sonnet credits use extended thinking?**

**Costs**:
```
Free:  60 × $1.16   = $69.60
Plus:  32 × $15.35  = $491.20
Pro:    8 × $32.14  = $257.12
────────────────────────────────
Total:                $817.92
```

**Profit**:
```
Revenue:              $920.00
Costs:                $817.92
Profit:               $102.08
Margin:                   11%
```

**Conclusion**: Still profitable even in absolute worst case!

---

### Growth Model (1,000 Users - Month 12)

**Distribution**: 600 Free, 320 Plus, 80 Pro

**Costs**:
```
Free:  600 × $1.16   = $696.00
Plus:  320 × $9.58   = $3,065.60
Pro:    80 × $18.28  = $1,462.40
─────────────────────────────────
Total:                 $5,224.00
```

**Revenue**:
```
Plus:  320 × $19     = $6,080.00
Pro:    80 × $39     = $3,120.00
─────────────────────────────────
Total:                 $9,200.00
```

**Profit**:
```
Monthly profit:        $3,976.00
Annual profit:        $47,712.00
Margin:                      43%
```

---

### Year 3 Model (50,000 Paid Users)

**Distribution**: 30,000 Plus (60%), 20,000 Pro (40%)

**Costs**:
```
Plus:  30,000 × $9.58   = $287,400
Pro:   20,000 × $18.28  = $365,600
──────────────────────────────────
Total:                    $653,000/mo
Annual:                 $7,836,000
```

**Revenue**:
```
Plus:  30,000 × $19     = $570,000
Pro:   20,000 × $39     = $780,000
──────────────────────────────────
Total:                  $1,350,000/mo
Annual (ARR):          $16,200,000
```

**Profit**:
```
Monthly profit:          $697,000
Annual profit:         $8,364,000
Margin:                       52%
```

**Note**: This exceeds our original $15M ARR target due to better margins!

---

## Competitive Positioning

### Direct Comparison Table

| Feature | ChatGPT Plus | Claude Pro | Cursor Pro | GitHub Copilot Pro+ | **Centrid Plus** |
|---------|--------------|------------|------------|---------------------|------------------|
| **Price** | $20/mo | $20/mo | $20/mo | $39/mo | **$19/mo** |
| **Model** | GPT-4o | Sonnet 3.5+ | Multiple | Copilot (GPT-4) | **Sonnet 4.5** |
| **Usage** | Unlimited | Unlimited | 500 requests | 1,500 premium | **60 credits** |
| **Branching** | ❌ | ❌ | ❌ | ❌ | **✅** |
| **Extended thinking** | ❌ | ✅ (auto) | ❌ | ❌ | **✅ (user control)** |
| **Provenance** | ❌ | ❌ | ❌ | ❌ | **✅** |
| **Filesystem** | ❌ | ❌ | ✅ (code) | ✅ (code) | **✅ (universal)** |
| **Credit system** | ❌ | ❌ | ❌ | ❌ | **✅** |

### Our Unique Advantages

**1. Extended Thinking Control**
- **Competitors**: ChatGPT (no extended thinking), Claude Pro (automatic, no control), Cursor (no extended thinking)
- **Us**: Users choose per request → credits go further, transparent reasoning

**2. Branching + Provenance**
- **Competitors**: All linear conversations
- **Us**: Explore alternatives without context loss, files remember which branch created them

**3. Credit System Clarity**
- **Competitors**: Token-based ("100K output tokens") or unlimited (unpredictable costs)
- **Us**: "60 Sonnet credits" = clear, predictable, fair

**4. Latest Models**
- **Haiku 4.5** (Oct 2025): Performance similar to Sonnet 4, 1/3 the cost
- **Sonnet 4.5** (Sep 2025): "Best coding model in the world" (Anthropic), strongest for agents

**5. Integrated Workflow**
- **Competitors**: Separate tools (ChatGPT for chat, Notion for files, Git for versions)
- **Us**: Branching + filesystem + provenance = complete exploration workspace

---

### Competitive Positioning by Use Case

**vs ChatGPT Plus** ($20/mo):
- We're $1 cheaper
- We have branching + provenance + extended thinking control
- **Win**: Researchers, consultants who need to explore alternatives

**vs Claude Pro** ($20/mo):
- We're $1 cheaper
- We have same model (Sonnet 4.5) + branching + credit system
- **Win**: Power users who want control over extended thinking usage

**vs Cursor Pro** ($20/mo):
- Similar price, different focus
- They're code-first, we're research-first
- **Win**: Non-developers (researchers, PMs, consultants)

**vs GitHub Copilot Pro+** ($39/mo):
- We match their premium price
- Different use case (coding vs research)
- **Win**: Researchers willing to pay premium for deep work tools

---

### Why Charm Pricing ($19/$39)

**$19 Psychology**:
- "Under $20" threshold (feels significantly cheaper)
- Clear undercut messaging: "$1 cheaper than ChatGPT"
- Proven 10-15% better conversion vs $20 (pricing research)

**$39 Psychology**:
- Matches GitHub Copilot Pro+ (established price point)
- "Premium tier" without being "expensive" ($50+ feels too high)
- Easy 2x upgrade path from Plus ($19 → $39)

**Research backing**:
- Charm pricing (prices ending in 9) converts better than round numbers
- Source: "The Psychology of Pricing" (Poundstone), MIT pricing studies
- Real-world: Most SaaS companies use $9, $19, $29, $39, $49, $99

---

## Risk Analysis & Scenarios

### Risk 1: Extended Thinking Adoption Higher Than 30%

**Likelihood**: Medium
- If users love extended thinking, adoption could hit 50-60%

**Impact**: Lower margins but still profitable

**Analysis**:
| Adoption | Plus Margin | Pro Margin | Overall Margin |
|----------|-------------|------------|----------------|
| 30% (base) | 50% | 53% | 43% |
| 50% | 41% | 42% | 35% |
| 70% | 33% | 31% | 27% |
| 100% | 19% | 18% | 12% |

**Mitigation**:
- Monitor adoption in beta (Weeks 3-8)
- Educate users on when to use extended thinking
- UI friction: "Use extended thinking for complex analysis"
- If adoption >60%, consider tier adjustment or credit limits

**Response Plan**:
- Month 3: If adoption >60%, increase Plus to $22 (new users only)
- Month 6: If adoption >70%, reduce Sonnet credits or increase prices
- Grandfathered pricing for early adopters

---

### Risk 2: 10K Thinking Budget Too Small

**Likelihood**: Low
- 10K tokens = 7,500 words of internal reasoning
- Anthropic's recommended budget for cost control
- Sufficient for most complex tasks

**Impact**: User dissatisfaction if tasks truncated

**Validation**:
- Beta phase: Monitor thinking token usage
- Survey: "Was 10K thinking budget enough?"
- Analytics: How often do requests hit the 10K cap?

**Response Plan**:
- If >20% of extended thinking requests hit cap: Increase to 15K
- Cost impact: $0.075 per request = acceptable
- Plus tier: $11.16 cost → $7.84 profit (still 41% margin)

---

### Risk 3: Users Abuse Extended Thinking

**Likelihood**: Low
- Most queries don't need extended thinking
- UI makes it clear: "Uses 1 credit" for both modes
- Users will learn when it's worth it

**Mitigation**:
- Clear UI: "Use extended thinking for complex reasoning (shows AI work)"
- Help docs: "When to use extended thinking" guide
- Usage analytics: Show users their extended thinking usage
- Rate limiting: Max 10 extended thinking requests/day (anti-abuse)

**Response Plan**:
- If abuse detected: Add cooldown (1 extended thinking per 5 minutes)
- If widespread: Add separate extended thinking credit pool

---

### Risk 4: Claude Increases API Pricing

**Likelihood**: Low-Medium
- Anthropic has kept pricing stable
- Competition (OpenAI, Google) keeps pressure
- But they could increase 20-30% over time

**Impact**: Margin compression

**Analysis** (20% price increase):
```
Current Sonnet: $0.0345 standard, $0.1995 extended
After 20% increase: $0.0414 standard, $0.2394 extended

Plus tier cost: $11.50 (vs $9.58 currently)
Plus tier profit: $7.50 (vs $9.42 currently) = 39% margin
Still profitable!
```

**Mitigation**:
- Our 43-53% margins provide buffer for 20-30% price increases
- Can absorb moderate increases without tier changes
- Worst case: Increase Pro to $49, Plus to $22 (grandfathered users keep $19/$39)

**Response Plan**:
- <20% increase: Absorb in margins
- 20-30% increase: Raise Pro to $49, keep Plus at $19
- >30% increase: Raise Plus to $22, Pro to $49

---

### Risk 5: Free-to-Paid Conversion Lower Than Expected

**Likelihood**: Medium
- Freemium conversion benchmarks: 2-5% (general SaaS), 10-15% (vertical SaaS)
- Our target: 25-30% (optimistic)

**Impact**: Longer path to profitability

**Break-even at different conversions**:
- 14% conversion: Break-even (7.4 Plus users)
- 20% conversion: $113/100 users profit
- 25% conversion: $241/100 users profit
- 30% conversion: $369/100 users profit

**Mitigation**:
- Strong onboarding: "Create your first branch" tutorial
- Conversion triggers: File limit (20), chat limit (5), monthly cap (40)
- Viral features: Share exploration trees, templates
- Email campaigns: "You hit the file limit, upgrade to Plus for $19"

**Response Plan**:
- Month 1: If conversion <15%, aggressive email campaigns
- Month 3: If conversion <20%, consider increasing free tier limits (acquire more users)
- Month 6: If conversion <20%, consider early adopter pricing ($15/mo Plus)

---

### Risk 6: Competitors Copy Credit System

**Likelihood**: Medium-High
- Good ideas get copied (see: ChatGPT → everyone does chat)

**Impact**: Loss of differentiation

**Timeline**:
- ChatGPT: 6-12 months to implement (product team prioritization)
- Claude Pro: 3-6 months (they already have extended thinking)
- Cursor: 6-12 months (different focus)

**Our Moat** (even if copied):
- First-mover advantage: 6-12 month head start
- Integration moat: Credit system alone isn't enough, need branching + provenance + filesystem
- Switching costs: Users with 50+ artifacts locked in
- Category ownership: "Exploration workspace" positioning

**Response Plan**:
- Accelerate V2/V3 features (templates, knowledge graph, team features)
- Build switching costs faster (onboarding focus on artifact creation)
- Vertical expansion: Research-specific features competitors won't copy

---

## Pricing Psychology

### Why $19 Works Better Than $20

**Left-digit effect**:
- $19 is perceived as "$10-something" (rounds down to $10)
- $20 is perceived as "$20-something" (rounds up to $20)
- Feels like $10 difference, not $1

**"Under $20" messaging**:
- Marketing: "Under $20/month" (sounds much better)
- Comparison: "ChatGPT is $20, we're under $20"
- Budget threshold: "$20 is my limit" → $19 passes, $20 doesn't

**Conversion data**:
- Priceintelligently.com study: $19 converts 10-15% better than $20
- MIT pricing lab: Charm pricing increases purchase intent 20%

---

### Early Adopter Pricing

**Offer**: First 100 users get Plus at **$15/mo lifetime** (21% off)

**Benefits**:
1. **Urgency**: "Lock in $15/mo before it goes to $19"
2. **Word-of-mouth**: Early adopters become advocates
3. **Feedback**: Engaged users provide better product feedback
4. **Lock-in**: Lifetime pricing = lifelong customers

**Cost Analysis**:
- Regular Plus: $19 - $9.58 = $9.42 profit (50% margin)
- Early adopter: $15 - $9.58 = $5.42 profit (36% margin)
- Still profitable!

**Timeline**:
- Week 9 (launch): $15/mo early adopter pricing
- First 100 users only
- Month 3: Increase to $19/mo standard pricing
- Early adopters keep $15/mo lifetime

---

### Annual Pricing Discounts

**Offer**: Pay annually, save ~2 months

**Plus Annual**:
- Monthly: $19 × 12 = $228
- Annual: **$190** (save $38, ~16% off)

**Pro Annual**:
- Monthly: $39 × 12 = $468
- Annual: **$390** (save $78, ~17% off)

**Benefits**:
1. **Cash flow**: Upfront revenue for growth
2. **Retention**: Annual commitment reduces churn
3. **LTV**: Annual users stay longer (sunk cost)

**When to introduce**:
- Month 6 (after monthly pricing validates)
- Target: 30% of new users choose annual

---

## Implementation Requirements

### Backend Architecture

**Credit Tracking System**:

```typescript
interface UserCredits {
  user_id: string;
  tier: 'free' | 'plus' | 'pro';

  // Sonnet credits
  sonnet_credits_total: number;  // 0, 60, or 140
  sonnet_credits_used: number;
  sonnet_reset_date: Date;

  // Haiku usage (unlimited for paid, capped for free)
  haiku_requests_used: number;
  haiku_reset_date: Date;

  // Files & chats
  files_count: number;
  chats_count: number;
}
```

**Request Logging**:

```typescript
interface AIRequestLog {
  id: string;
  user_id: string;
  timestamp: Date;

  // Model & mode
  model: 'haiku-4.5' | 'sonnet-4.5';
  mode: 'standard' | 'extended_thinking';

  // Token usage
  input_tokens: number;
  thinking_tokens: number;  // 0 if standard mode
  output_tokens: number;

  // Cost
  cost: number;

  // Context
  conversation_id: string;
  branch_id: string;
}
```

**Claude API Integration**:

```typescript
async function createSonnetRequest(
  mode: 'standard' | 'extended_thinking',
  messages: Message[]
): Promise<Response> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4.5-20250929',
    max_tokens: 4096,
    extended_thinking: mode === 'extended_thinking' ? {
      type: 'enabled',
      thinking_budget: 10000  // Cap at 10K tokens
    } : undefined,
    messages,
  });

  // Log usage
  await logRequest({
    model: 'sonnet-4.5',
    mode,
    thinking_tokens: response.usage.thinking_tokens || 0,
    output_tokens: response.usage.output_tokens,
    cost: calculateCost(response.usage, mode),
  });

  // Decrement credit
  await decrementSonnetCredit(userId);

  return response;
}
```

---

### Frontend UI/UX

**Mode Selector Component**:

```tsx
<ModeSelector>
  <RadioOption value="standard" selected>
    <Icon>⚡</Icon>
    <Label>Quick response</Label>
    <Description>Fast, normal reasoning</Description>
    <Cost>Uses 1 credit</Cost>
  </RadioOption>

  <RadioOption value="extended_thinking">
    <Icon>🧠</Icon>
    <Label>Deep thinking</Label>
    <Description>AI shows its reasoning process</Description>
    <Cost>Uses 1 credit</Cost>
    <Badge>Best for complex analysis</Badge>
  </RadioOption>
</ModeSelector>
```

**Credit Counter Display**:

```tsx
<CreditCounter>
  <Icon>✨</Icon>
  <Text>Sonnet credits: 42 / 60</Text>
  <ProgressBar value={42} max={60} />
  <ResetInfo>Resets in 12 days</ResetInfo>
</CreditCounter>
```

**Usage Dashboard** (settings page):

```tsx
<UsageDashboard>
  <Section>
    <Title>This month</Title>

    <Stat>
      <Label>Haiku requests</Label>
      <Value>127</Value>
      <Subtitle>Unlimited</Subtitle>
    </Stat>

    <Stat>
      <Label>Sonnet credits used</Label>
      <Value>18 / 60</Value>
      <Breakdown>
        <Item>12 quick responses</Item>
        <Item>6 deep thinking</Item>
      </Breakdown>
    </Stat>
  </Section>

  <Section>
    <Title>Extended thinking insights</Title>
    <Chart type="bar">
      {/* Show extended thinking usage over time */}
    </Chart>
  </Section>
</UsageDashboard>
```

---

### Database Schema

```sql
-- User credits and tier
CREATE TABLE user_usage (
  user_id UUID PRIMARY KEY,
  tier TEXT NOT NULL,  -- 'free', 'plus', 'pro'

  -- Sonnet credits
  sonnet_credits_total INT NOT NULL,
  sonnet_credits_used INT NOT NULL DEFAULT 0,
  sonnet_reset_date TIMESTAMP NOT NULL,

  -- Haiku usage
  haiku_requests_used INT NOT NULL DEFAULT 0,
  haiku_reset_date TIMESTAMP NOT NULL,

  -- File & chat limits
  files_count INT NOT NULL DEFAULT 0,
  chats_count INT NOT NULL DEFAULT 0,

  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Request logging
CREATE TABLE ai_request_log (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),

  -- Model & mode
  model TEXT NOT NULL,  -- 'haiku-4.5' or 'sonnet-4.5'
  mode TEXT NOT NULL,   -- 'standard' or 'extended_thinking'

  -- Token usage
  input_tokens INT NOT NULL,
  thinking_tokens INT NOT NULL DEFAULT 0,
  output_tokens INT NOT NULL,
  total_tokens INT GENERATED ALWAYS AS (input_tokens + thinking_tokens + output_tokens) STORED,

  -- Cost
  cost DECIMAL(10,4) NOT NULL,

  -- Context
  conversation_id UUID,
  branch_id UUID,

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for analytics
CREATE INDEX idx_request_log_user_created ON ai_request_log(user_id, created_at DESC);
CREATE INDEX idx_request_log_mode ON ai_request_log(mode, created_at DESC);
CREATE INDEX idx_usage_reset ON user_usage(sonnet_reset_date);
```

---

## Success Metrics

### Adoption Metrics (Month 1-3)

**Extended Thinking Adoption**:
- **Target**: 40% of Plus users try extended thinking at least once
- **Target**: 20% use extended thinking regularly (>5 times/month)
- **Target**: 60% of Pro users use extended thinking regularly

**Credit Utilization**:
- **Target**: 70-80% credit utilization (Plus: 42-48 of 60, Pro: 98-112 of 140)
- **Benchmark**: >80% = users want more credits (tier upgrade opportunity)
- **Benchmark**: <50% = users over-tiered (downgrade risk)

**Tier Distribution**:
- **Month 1**: 60% Free, 35% Plus, 5% Pro
- **Month 3**: 60% Free, 32% Plus, 8% Pro (stabilized)

---

### Economic Metrics (Month 1-12)

**Unit Economics**:
- **Target**: Actual average cost per Plus user <$11 (vs $9.58 projected)
- **Target**: Actual average cost per Pro user <$22 (vs $18.28 projected)
- **Target**: Overall margin >35%

**Extended Thinking Costs**:
- **Track**: Average thinking tokens per extended request
- **Target**: <8,000 tokens (vs 10,000 budget)
- **Alert**: If >9,000 average (users hitting budget frequently)

**Profitability**:
- **Month 1**: Break-even or small loss (acquisition costs)
- **Month 3**: Positive unit economics (>$5 profit per paid user)
- **Month 12**: Target margin 40%+ (as extended thinking adoption stabilizes)

---

### Customer Satisfaction Metrics

**Net Promoter Score (NPS)**:
- **Target overall**: NPS >50
- **Target extended thinking**: NPS >50 specifically for the feature
- **Target credit system**: <10% complaints about credit limits

**Feature Satisfaction**:
- **Survey**: "Is 10K thinking budget sufficient?" (Weekly in beta)
- **Target**: <10% say "too small", <5% say "too large"
- **Survey**: "Do you understand how Sonnet credits work?"
- **Target**: >80% say "yes, very clear"

**Usage Patterns**:
- **Track**: When users choose extended thinking (what types of queries?)
- **Track**: Satisfaction correlation (extended thinking users → higher NPS?)
- **Track**: Retention by extended thinking usage (are heavy users more sticky?)

---

### Competitive Metrics

**Price Perception**:
- **Survey**: "How does Centrid pricing compare to alternatives?"
- **Target**: >60% say "better value" or "same value for less"
- **Target**: <10% say "too expensive"

**Feature Comparison**:
- **Survey**: "Which extended thinking implementation do you prefer?" (ours vs Claude Pro)
- **Target**: >70% prefer our user-controlled approach

**Switching Behavior**:
- **Track**: "What tool did you use before Centrid?"
- **Track**: "Are you still using that tool?" (replacement vs supplement)
- **Target**: 50% full replacement, 50% supplement

---

### Milestone Metrics

**Month 1 (Beta)**:
- 100 beta users
- 70% create branches (up from MVP target 50%)
- 50% save at least 1 file
- 40% try extended thinking
- NPS >45

**Month 3**:
- 500 users (400 free, 85 Plus, 15 Pro)
- 25% free-to-paid conversion
- Avg 10 branches per paid user
- Avg 15 files per paid user
- 30% use extended thinking regularly
- 40% retention (M1 → M3)

**Month 6**:
- 2,000 users
- Avg 25 branches per paid user
- Avg 50 files per paid user
- 50% use extended thinking regularly
- 50% retention (M3 → M6)
- 40% margin (actual vs 43% projected)

**Month 12**:
- 5,000 users (1,000 paid)
- 70% retention (M6 → M12)
- 30% of paid users on Pro tier (vs 20% at launch)
- Extended thinking adoption stabilized at 40-50%
- **$25K MRR ($300K ARR)**

---

## Appendix: Pricing Evolution Timeline

### Week 9 (Launch)
- **Free**: 40 Haiku 4.5 requests
- **Plus**: $15/mo early adopter (first 100 users, lifetime)
- **Pro**: $39/mo

### Month 3
- **Free**: 40 Haiku 4.5 requests
- **Plus**: $19/mo standard (new users)
- **Plus**: $15/mo grandfathered (early adopters)
- **Pro**: $39/mo

### Month 6
- **Free**: 40 Haiku 4.5 requests (potentially increase to 60 based on data)
- **Plus**: $19/mo
- **Pro**: $39/mo
- **Annual pricing introduced**: Plus $190/year, Pro $390/year

### Month 12
- **Team tier launch**: $75/mo (5 users)
- Potential tier adjustments based on actual extended thinking adoption

### Year 2
- **Enterprise tier**: Custom pricing
- Potential model upgrades (Opus 4.1 for Ultra tier?)
- International pricing (EUR, GBP)

---

## Document Version History

**v2.0 (2025-10-26)**: Credit system + extended thinking model
- Added credit system explanation
- Added extended thinking economics
- Recalculated all costs based on actual Claude API pricing
- Improved margins: 43-53% (vs 29-39% in v1.0)

**v1.0 (2025-10-24)**: Initial pricing strategy
- Simple request-based model (60/140 Sonnet requests)
- No extended thinking consideration
- Estimated costs (less accurate)

---

**This document is the single source of truth for all pricing decisions. All other documents should reference this file for pricing details.**
