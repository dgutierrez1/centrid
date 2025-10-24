---
description: Create marketing brief (personas, messaging, positioning, landing page outline, content strategy)
---

## User Input
```text
$ARGUMENTS
```

**Purpose**: Define marketing communications strategy (how to communicate business value, not what the value is). Iterates more frequently than business foundation.

**Output**: `marketing/marketing-brief.md`

---

## Outline

1. Load Context (business foundation, constitution, design tokens, features)
2. Generate Marketing Brief
3. Validation Gate
4. Report Summary

---

## Workflow

### 1. Load Context

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

**Check for business foundation**:
```bash
MARKETING_DIR="$PROJECT_ROOT/marketing"
BUSINESS_FOUNDATION="$MARKETING_DIR/business-foundation.md"

if [ -f "$BUSINESS_FOUNDATION" ]; then
  cat "$BUSINESS_FOUNDATION"
  echo "FOUNDATION_EXISTS"
else
  echo "FOUNDATION_MISSING"
fi
```

**If FOUNDATION_MISSING**:
- WARN: "Recommended: Run `/business.foundation` first for best results"
- PROCEED: Can generate marketing brief with assumptions
- NOTE: Marketing brief will be more effective with business foundation

**Load constitution** (if exists):
```bash
if [ -f "$SPECIFY_DIR/memory/constitution.md" ]; then
  cat "$SPECIFY_DIR/memory/constitution.md"
else
  echo "NOTE: No constitution.md found - proceeding without project principles"
fi
```

**Load design tokens** (if exists):
```bash
if [ -f "$SPECIFY_DIR/design-system/tokens.md" ]; then
  cat "$SPECIFY_DIR/design-system/tokens.md"
fi
```

**Load template** (REQUIRED):
```bash
TEMPLATE_PATH="$SPECIFY_DIR/templates/marketing-brief-template.md"
if [ ! -f "$TEMPLATE_PATH" ]; then
  echo "ERROR: Template not found at $TEMPLATE_PATH"
  exit 1
fi
cat "$TEMPLATE_PATH"
```

**Find feature specs for product context** (if specs directory exists):
```bash
SPECS_DIR="$PROJECT_ROOT/specs"
if [ -d "$SPECS_DIR" ]; then
  find "$SPECS_DIR" -name "spec.md" -type f | head -5
fi
```

**Read key feature specs** (up to 3 most important features for product understanding)

**Check if marketing-brief.md exists**:
```bash
MARKETING_BRIEF="$MARKETING_DIR/marketing-brief.md"

if [ -f "$MARKETING_BRIEF" ]; then
  echo "EXISTS"
  # Show existing content
  cat "$MARKETING_BRIEF"
else
  echo "NEW"
fi
```

**If EXISTS**: Ask user if updating for new campaign or regenerating

---

### 2. Generate Marketing Brief

**Use marketing-brief-template.md as structure**:
- Replace ALL placeholders ([PROJECT_NAME], [DATE], etc.) with actual data
- Fill every section based on loaded context
- Use compelling, conversion-focused copy (not dry technical writing)

**Based on loaded context**:

#### A. Target Personas (2-3 detailed personas)

**Source**: Business foundation target market + feature specs user stories

**For each persona, create**:
- Name/title (realistic)
- Profile (role, demographics, experience)
- Goals (what they want to achieve)
- Pain points (current frustrations - specific to what product solves)
- Behaviors (how they work, tools they use, decision process)
- Motivations (what drives them)
- Objections (why they might not buy)

**Ensure**: Personas are specific and actionable, not generic

---

#### B. Value Proposition

**Source**: Business foundation value prop + product features

**Create**:
- **One-line pitch**: Compelling single sentence
- **30-second elevator pitch**: 2-3 sentences for quick explanation
- **Problem-Solution statement**: Clear before/after transformation

**Ensure**: Communication focuses on user benefit, not product features

---

#### C. Messaging Framework

**Source**: Business foundation positioning + competitive differentiation

**Create**:
- **Core message**: Main thing to remember (1-2 sentences)
- **Key messages** (3-5): Supporting messages with proof points
- **Message pillars**: Categories organizing all messaging

**Ensure**: Messages are consistent, memorable, and differentiated

---

#### D. Positioning Statement

**Source**: Business foundation competitive landscape + differentiation

**Fill positioning template**:
- For [target customer]
- Who [need/opportunity]
- [Product] is a [category]
- That [key benefit]
- Unlike [competitive alternative]
- Our product [primary differentiation]

**Ensure**: Clear differentiation from named/unnamed competitors

---

#### E. Competitive Messaging

**Source**: Business foundation competitive analysis

**Create**:
- Differentiation points vs each competitor category
- "Why not just use [alternative]?" responses

**Ensure**: Messaging is positive (not negative competitor bashing)

---

#### F. Brand Voice & Tone

**Source**: Constitution.md principles + design tokens

**Define**:
- Voice attributes (3-4 personality traits)
- Tone guidelines (Do/Don't)
- Example phrases (on-brand / off-brand)

**Ensure**: Voice aligns with brand principles from constitution

---

#### G. Landing Page Outline

**Source**: All above sections + product features

**Create sections**:
1. **Hero**: Headline, subheadline, CTA, visual description
2. **Problem**: Articulate pain points
3. **Solution**: How product solves it, key benefits
4. **How It Works**: 3-4 simple steps
5. **Features**: 4-6 key features with user-facing benefits
6. **Social Proof**: Testimonials, logos, stats strategy
7. **Pricing**: How to communicate pricing VALUE (reference business-foundation.md for actual prices)
8. **FAQ**: 5-7 common questions with answers
9. **Final CTA**: Compelling final push

**Ensure**: Copy is compelling, scannable, conversion-focused

---

#### H. Content Strategy

**Source**: Target personas behaviors + acquisition channels from business foundation

**Create**:
- Content themes (3-5 topics relevant to target audience)
- Content types (blog, social, email, video)
- Content calendar approach (frequency per type)

**Ensure**: Content strategy matches where personas spend time

---

#### I. Channel Strategy

**Source**: Business foundation acquisition channels + persona behaviors

**For each channel**:
- Why (persona behavior/reach)
- Content (what to post)
- Frequency (how often)

**Separate**:
- Primary channels (main focus)
- Secondary channels (test/experimental)

**Ensure**: Channel selection is evidence-based, not aspirational

---

#### J. Campaign Ideas

**Create**:
- Launch campaign (theme, channels, assets, timeline)
- Ongoing campaigns (sustained growth)

---

#### K. Success Metrics

**Source**: Business foundation financial targets + channel strategy

**Define metrics for**:
- Awareness (reach, impressions, etc.)
- Engagement (clicks, time, shares, etc.)
- Conversion (signups, trials, paid, etc.)

**Set targets** based on business foundation customer acquisition goals

---

**Create marketing directory** if needed:
```bash
mkdir -p "$MARKETING_DIR"
```

**Save document**:
```bash
# Save to $MARKETING_BRIEF (marketing/marketing-brief.md)
```

---

### 3. Validation Gate

**MANDATORY verification**:

1. **Completeness check**:
   - [ ] Target Personas: 2-3 detailed personas with all fields
   - [ ] Value Proposition: One-liner, elevator pitch, problem-solution
   - [ ] Messaging Framework: Core message, key messages, pillars
   - [ ] Positioning Statement: All fields filled
   - [ ] Competitive Messaging: Differentiation points clear
   - [ ] Brand Voice: Attributes, guidelines, examples
   - [ ] Landing Page: All 9 sections outlined
   - [ ] Content Strategy: Themes, types, calendar
   - [ ] Channel Strategy: Primary and secondary channels
   - [ ] Success Metrics: Awareness, engagement, conversion metrics

2. **Quality check**:
   - [ ] Personas are specific (not generic)
   - [ ] Messaging is differentiated (not commodity)
   - [ ] Value prop is clear (not jargon-filled)
   - [ ] Brand voice is distinct (not corporate-speak)
   - [ ] Landing page copy is compelling (not feature list)

3. **Consistency check**:
   - [ ] Aligns with business-foundation.md (if exists)
   - [ ] Aligns with constitution.md principles
   - [ ] References business foundation for pricing (no duplication)
   - [ ] Personas match target market from business foundation
   - [ ] Channels match acquisition strategy from business foundation

4. **No duplication check**:
   - [ ] Does NOT duplicate market sizing from business foundation
   - [ ] Does NOT duplicate detailed pricing from business foundation
   - [ ] Does NOT duplicate unit economics from business foundation
   - [ ] DOES reference business foundation where appropriate

**Report validation status**:
```
✅ Completeness: [X/10 sections complete]
✅ Quality: [All checks passed / Issues found]
✅ Consistency: [Aligned with business foundation and constitution]
✅ No Duplication: [Marketing brief focuses on communication, not strategy duplication]
```

**If validation FAILS**:
- STOP execution
- Report specific gaps/issues
- Request improvements
- DO NOT save incomplete/low-quality document

---

### 4. Report Summary

**Deliverables** ✅
- `marketing/marketing-brief.md` created/updated

**Key Marketing Assets Documented**:
- Personas: [Number] detailed personas
- Value Prop: [One-line pitch]
- Core Message: [Core message summary]
- Positioning: [vs primary competitor category]
- Landing Page: Complete 9-section outline
- Channels: [Primary channel 1, 2, 3]

**Integration**:
- References `business-foundation.md` for: [What it references]
- Uses `constitution.md` for: [What it uses]

**Next Steps**:
- Use this brief to create actual landing page copy
- Optional: Run `/marketing.content` to generate copy from this brief
- Use personas and messaging in all marketing communications

---

## Key Rules

1. **Project-agnostic** - Use `pwd` to get PROJECT_ROOT, build paths dynamically
2. **Use template** - Load and fill marketing-brief-template.md from `.specify/templates/`
3. **Load business foundation** - Use it as source of truth for business strategy
4. **Focus on COMMUNICATION** - How to talk about value, not what the value is
5. **No duplication** - Reference business foundation, don't repeat it (pricing, market size, unit economics stay in business-foundation.md)
6. **Validate before saving** - Ensure quality and completeness
7. **Compelling copy** - This is marketing, not technical documentation
8. **Specific personas** - Avoid generic "business professional" personas
9. **Differentiated messaging** - Don't sound like every other SaaS product
10. **Conversion-focused** - Landing page outline should follow best practices (one CTA, benefit-focused, distraction-free)
11. **STOP on validation failure** - Low-quality marketing brief is worse than none
