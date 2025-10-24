---
description: Create business foundation document (business model, pricing, market analysis, unit economics)
---

## User Input
```text
$ARGUMENTS
```

**Purpose**: Define strategic business foundation (business model, pricing, market sizing, unit economics). Run once, update rarely.

**Output**: `marketing/business-foundation.md`

---

## Outline

1. Setup & Load Context (constitution, template)
2. Interactive Business Model Questions
3. Generate Business Foundation Document
4. Generate Pitch (one-liner, 30-sec, 60-sec)
5. Validation Gate
6. Report Summary

---

## Workflow

### 1. Setup & Load Context

**Get project root**:
```bash
PROJECT_ROOT=$(pwd)
```

**Find .specify directory**:
```bash
SPECIFY_DIR="$PROJECT_ROOT/.specify"
if [ ! -d "$SPECIFY_DIR" ]; then
  echo "ERROR: .specify directory not found. This command requires speckit project structure."
  exit 1
fi
```

**Load constitution** (if exists):
```bash
if [ -f "$SPECIFY_DIR/memory/constitution.md" ]; then
  cat "$SPECIFY_DIR/memory/constitution.md"
else
  echo "NOTE: No constitution.md found - proceeding without project principles"
fi
```

**Load template** (REQUIRED):
```bash
TEMPLATE_PATH="$SPECIFY_DIR/templates/business-foundation-template.md"
if [ ! -f "$TEMPLATE_PATH" ]; then
  echo "ERROR: Template not found at $TEMPLATE_PATH"
  exit 1
fi
cat "$TEMPLATE_PATH"
```

**Check if business-foundation.md exists**:
```bash
MARKETING_DIR="$PROJECT_ROOT/marketing"
BUSINESS_FOUNDATION="$MARKETING_DIR/business-foundation.md"

if [ -f "$BUSINESS_FOUNDATION" ]; then
  echo "EXISTS"
  # Show existing content
  cat "$BUSINESS_FOUNDATION"
else
  echo "NEW"
fi
```

**If EXISTS**: Ask user if they want to update or regenerate

---

### 2. Interactive Business Model Questions

Ask user comprehensive questions to fill business foundation template:

**Section A: Value Proposition & Problem**
- What problem does Centrid solve?
- What unique value does it provide?
- Why now? (Market timing, trends)

**Section B: Target Customers**
- Who are the primary target customers? (Roles, industries, company sizes)
- Who are secondary target markets?
- Who is explicitly NOT the target?

**Section C: Market Size**
- What's the Total Addressable Market (TAM)?
- What's the Serviceable Addressable Market (SAM)?
- What's the Serviceable Obtainable Market (SOM) for next 1-3 years?

**Section D: Pricing Strategy**
- What pricing model? (Freemium, tiered subscription, usage-based, enterprise)
- What are the pricing tiers? (Names, prices, features, limits)
- Why these prices? (Competitor comparison, value-based logic)

**Section E: Revenue & Business Model**
- What are the revenue streams? (Subscriptions, transactions, add-ons)
- What are key resources needed? (Technology, data, infrastructure)
- What are key partnerships? (Infrastructure providers, integrations)
- What's the cost structure? (Infrastructure, development, CAC, support)

**Section F: Unit Economics**
- Expected Customer Acquisition Cost (CAC)?
- Expected Lifetime Value (LTV)?
- Target LTV:CAC ratio?
- Expected churn rate?
- Payback period target?

**Section G: Competition & Differentiation**
- Who are main competitors?
- What's the competitive differentiation?
- What makes the product defensible? (Network effects, data moat, switching costs)

**Section H: Growth & Distribution**
- What are primary customer acquisition channels?
- How to retain customers?
- What's the expansion/upsell strategy?

**Section I: Financials & Milestones**
- 12-month revenue targets?
- Customer acquisition targets by tier?
- Key financial milestones?

**Section J: Risks**
- Market risks?
- Competitive risks?
- Execution risks?
- Mitigation strategies?

**Use AskUserQuestion tool for interactive gathering, or accept detailed input if user provides comprehensive answers**

---

### 3. Generate Business Foundation Document

**Use business-foundation-template.md as structure**:
- Replace ALL placeholders ([PROJECT_NAME], [DATE], etc.) with actual data
- Fill every section with user responses from Step 2
- Use professional business language
- Include supporting rationale and evidence for key decisions
- Ensure quantitative data where possible (TAM/SAM/SOM, CAC, LTV, pricing)

**Create marketing directory** if needed:
```bash
mkdir -p "$MARKETING_DIR"
```

**Save document**:
```bash
# Save to $BUSINESS_FOUNDATION (marketing/business-foundation.md)
```

---

### 4. Generate Pitch

**From the business foundation, create compelling pitches**:

**One-Line Pitch**:
- Extract core value proposition
- Make it memorable and repeatable
- Format: "[What it is] for [who] that [unique benefit]"
- Example: "Persistent AI context for knowledge workers that eliminates re-explaining documents"

**30-Second Elevator Pitch**:
- Problem: What painful problem exists?
- Solution: How does the product solve it?
- Differentiation: Why this vs alternatives?
- Call to action: What's the ask?
- Format as 3-4 sentences, conversational

**60-Second Extended Pitch**:
- Problem with context
- Solution approach
- Market opportunity (TAM/SAM)
- Business model (how you make money)
- Traction or next milestone
- The ask

**Add pitches to end of business-foundation.md**:

```markdown
---

## Pitch Deck

### One-Line Pitch
[Generated one-liner]

### 30-Second Pitch
[Generated elevator pitch]

### 60-Second Pitch
[Generated extended pitch]
```

---

### 5. Validation Gate

**MANDATORY verification**:

1. **Completeness check**:
   - [ ] Business Model Canvas: All 7 components filled
   - [ ] Market Analysis: TAM/SAM/SOM defined with estimates
   - [ ] Unit Economics: CAC, LTV, churn, payback period included
   - [ ] Pricing Strategy: All tiers defined with prices and features
   - [ ] Strategic Positioning: Differentiation and defensibility documented
   - [ ] Target Market: Primary, secondary, and non-targets defined
   - [ ] Growth Strategy: Acquisition channels and retention strategy
   - [ ] Financial Projections: 12-month targets set
   - [ ] Risk Analysis: Risks identified with mitigation strategies

2. **Logic check**:
   - [ ] LTV > CAC (healthy unit economics)
   - [ ] Pricing tiers have clear differentiation
   - [ ] Target market is specific enough to be actionable
   - [ ] Competitive differentiation is defensible

3. **Consistency check**:
   - [ ] Aligns with constitution.md principles
   - [ ] Pricing matches revenue stream assumptions
   - [ ] Target market matches market sizing

**Report validation status**:
```
✅ Completeness: [X/9 sections complete]
✅ Logic: [All checks passed / Issues found]
✅ Consistency: [Aligned with constitution]
```

**If validation FAILS**:
- STOP execution
- Report specific gaps
- Request user to provide missing information
- DO NOT save incomplete document

---

### 6. Report Summary

**Deliverables** ✅
- `marketing/business-foundation.md` created/updated

**Key Business Metrics Documented**:
- Target Market: [Primary segment]
- Pricing Tiers: [Tier names and prices]
- Market Size: TAM $X, SAM $X, SOM $X
- Unit Economics: LTV:CAC ratio [X:1]
- Primary Channel: [Main acquisition channel]

**Pitches Generated** ✅
- One-line pitch: "[Display pitch]"
- 30-second elevator pitch: "[First sentence...]"
- 60-second extended pitch: "[First sentence...]"

**Next Steps**:
- Run `/marketing.brief` to create marketing communications strategy
- Marketing brief will use this foundation to develop personas and messaging
- Use pitches for initial outreach, investor conversations, landing page headlines

---

## Key Rules

1. **Project-agnostic** - Use `pwd` to get PROJECT_ROOT, build paths dynamically
2. **Use template** - Load and fill business-foundation-template.md from `.specify/templates/`
3. **Ask comprehensive questions** - Don't assume, gather all details
4. **Validate before saving** - Ensure all critical sections complete
5. **Professional language** - This is a business strategy document
6. **No duplication** - This is STRATEGY, not marketing communications (marketing brief handles communication)
7. **Evidence-based** - Include rationale and supporting data for key decisions
8. **Generate pitches** - Create compelling one-liner, 30-sec, and 60-sec pitches from business foundation
9. **STOP on validation failure** - Incomplete foundation helps no one
