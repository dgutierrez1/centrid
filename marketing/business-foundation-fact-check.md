# Business Foundation Fact-Check Report

**Date**: 2025-10-23
**Document Reviewed**: `marketing/business-foundation.md`
**Source**: `specs-old/PROJECT-ANALYSIS.md`

---

## Executive Summary

The business foundation document is **generally accurate** with information from PROJECT-ANALYSIS.md, but contains **3 mathematical errors**, several **unverified external claims**, and multiple **reasonable extrapolations** beyond source data.

**Recommendation**: Fix mathematical errors immediately, flag extrapolations as estimates, and verify or remove external market data claims.

---

## Critical Issues (Must Fix)

### ❌ Issue #1: Incorrect Churn Rate Calculation

**Location**: Unit Economics → Lifetime Value (LTV)

**Claim**:
> "Expected retention: 80% month-over-month (20% annual churn)"
> "Average customer lifetime: 16 months (1 / 0.20 annual churn * 12)"

**Problem**: Mathematically incorrect. 80% month-over-month retention ≠ 20% annual churn.

**Correct Calculation**:
- If monthly retention is 80%, then monthly churn is 20%
- Annual retention = (0.80)^12 = 6.87%
- Annual churn = 93.13%

**OR, working backward from LTV**:
- LTV = $400, Monthly revenue = $25
- Average lifetime = 16 months
- Monthly churn = 1 / 16 = 6.25%
- Monthly retention = 93.75%
- Annual churn = 1 - (0.9375)^12 = 54.4%

**Fix Required**:
```markdown
**LTV Calculation**:
- Average subscription: $25/month
- Average customer lifetime: 16 months
- Monthly churn: 6.25% (monthly retention: 93.75%)
- Gross LTV: $25 × 16 = $400
- Net LTV (after $15 COGS/mo): $400 - ($15 × 16) = $160
```

**Source Says**: ">8:1 LTV/CAC ratio (assuming 12+ month LTV)" - implies ~16 month lifetime, does not specify churn rate

---

### ❌ Issue #2: Inconsistent Churn Rates

**Location 1**: Unit Economics → LTV section says "80% month-over-month retention"

**Location 2**: Financial Projections → Assumptions say "Month-over-month churn: 15-20% (80-85% retention)"

**Problem**: Same document contradicts itself - which is correct?

**Source Says**:
- ">90% monthly retention for users with ≥5 uploaded documents" (power users)
- ">80% day-7 retention, >50% day-30 retention" (overall)

**Fix Required**: Choose one consistent retention model:
- **Conservative**: 85% monthly retention (15% churn) = 8.6 month lifetime
- **Target**: 93.75% monthly retention (6.25% churn) = 16 month lifetime
- **Power Users**: 90% monthly retention (10% churn) = 10 month lifetime

Recommend using 93.75% monthly retention (16 month lifetime) throughout to match the $400 LTV target.

---

### ❌ Issue #3: Cumulative Revenue Calculation Error

**Location**: Financial Projections → Month-by-Month table

**Claim**:
| Month | MRR | Total Revenue (Cumulative) |
|-------|-----|----------------------------|
| 1 | $125 | $125 |
| 2 | $500 | $625 |
| 3 | $1,250 | $2,500 |

**Problem**: Cumulative revenue doesn't match simple addition.
- Month 1: Collect $125
- Month 2: Collect $500
- Cumulative through Month 2: $125 + $500 = $625 ✅
- Month 3: Collect $1,250
- Cumulative through Month 3: $625 + $1,250 = **$1,875** (not $2,500)

**Possible Explanations**:
1. Calculation error (most likely)
2. Customers paying twice in 3 months (annual pre-pay?) - not mentioned
3. Includes churn dynamics (but customer count shows growth, not accounting for churn replacement)

**Fix Required**: Recalculate cumulative revenue column correctly, or clarify methodology if it's not simple summation.

---

## Unverified External Claims (Verify or Remove)

### ⚠️ Issue #4: External Market Research Citations

**Location**: Market Analysis → Market Size

**Claims**:
- "Knowledge management software market: $8.6B by 2026 (Gartner)"
- "Generative AI enterprise software: $109.4B by 2030 (Grand View Research)"

**Source Says**: "$2.1B knowledge management + growing AI-assisted work market" - no Gartner/Grand View Research citations

**Problem**: These are reasonable market research figures, but NOT from PROJECT-ANALYSIS.md. Cannot verify without checking actual Gartner/Grand View Research reports.

**Recommendations**:
1. **Best**: Verify citations by checking actual Gartner and Grand View Research reports
2. **Alternative**: Remove specific citations and use: "Multiple industry reports estimate knowledge management market at $8B+ and AI enterprise software at $100B+ by 2030"
3. **Acceptable**: Add disclaimer: "(External market research, not verified)"

---

## Reasonable Extrapolations (Flag as Estimates)

### ⚠️ Issue #5: SAM Calculation with Growth Projection

**Location**: Market Analysis → Serviceable Addressable Market

**Claim**:
> "ChatGPT Plus subscribers: 2M+ at $20/month = $40M current market"
> "Projected growth: 10x in 3 years as LLM adoption increases = $400M SAM"

**Source Says**: "2M+ ChatGPT Plus users and 500K Claude Pro users" - no growth projection

**Problem**: "10x growth in 3 years" is an assumption, not from source.

**Fix**: Add qualifier: "Projected 10x growth (estimated based on AI adoption trends, not validated)"

---

### ⚠️ Issue #6: 3-Year SOM Projections

**Location**: Market Analysis → Serviceable Obtainable Market

**Claim**: Year 3 projections of 2,000-5,000 customers

**Source Says**: Only provides Month 2, Month 6, and Month 12 targets

**Problem**: Year 2 and Year 3 projections are extrapolations beyond source data.

**Fix**: Add disclaimer: "Year 2-3 projections are extrapolations based on Month 12 growth trajectory (not from source analysis)"

---

### ⚠️ Issue #7: Target Market Size Estimate

**Location**: Target Market Definition → Primary Target Market

**Claim**:
> "ChatGPT Plus power users: ~200,000 (10% of 2M subscribers)"
> "Total primary market: ~350,000 potential customers"

**Source Says**: Mentions "2M+ ChatGPT Plus users" but doesn't specify "10% are power users"

**Problem**: The "10% are power users" assumption is reasonable but not sourced.

**Fix**: Add: "Estimated 10% are power users based on typical SaaS engagement patterns (not validated)"

---

### ⚠️ Issue #8: Month-by-Month Revenue Interpolation

**Location**: Financial Projections

**Claim**: Detailed month-by-month table with Month 1, 2, 3, 4, 5, 6, 9, 12

**Source Says**:
- Month 2: $500-1,250 MRR (20-50 customers)
- Month 6: $2,500-5,000 MRR
- Month 12: $7,500-12,500 MRR

**Problem**: Months 1, 3, 4, 5, 9 are interpolated between source milestones.

**Fix**: Add table note: "Months 1, 3-5, 9 are interpolated between source milestones (Month 2, 6, 12)"

---

## Synthesized Content (Expected, Not Issues)

### ℹ️ Issue #9: Pitch Content

**Location**: Pitch Deck section (One-line, 30-second, 60-second pitches)

**Status**: All pitches are synthesized from source material - this is expected and appropriate.

**Source Says**: Does not include ready-made pitches.

**Assessment**: Pitches accurately capture value proposition, problem, solution, and market from source. No issues.

---

### ℹ️ Issue #10: Risk Mitigation Details

**Location**: Risk Analysis → Mitigation Strategies

**Status**: Expanded from brief mentions in source with specific tactical responses.

**Assessment**: Reasonable expansions based on source data. No significant issues.

---

## Accurate Information (Verified)

### ✅ Verified Claims

The following sections are **accurate** and match PROJECT-ANALYSIS.md:

1. **Value Proposition**: "AI workspace with persistent document context" - accurate
2. **Problem Statement**: Context fragmentation pain - accurate
3. **Pricing Tiers**:
   - Free Trial: 7 days, no credit card - accurate ✅
   - Pro: $25/month - accurate ✅
   - Team: $75/month - accurate ✅
   - Enterprise: Custom - accurate ✅
4. **Target Customer**: Knowledge workers, power users, 10+ interactions daily - accurate ✅
5. **CAC Target**: <$50 - accurate ✅
6. **LTV:CAC Ratio**: >8:1 - accurate ✅
7. **Competitive Landscape**: ChatGPT, Notion AI, Cursor, Obsidian - accurate ✅
8. **Differentiation**: Only solution with persistent context + multi-chat - accurate ✅
9. **Tech Stack**: Next.js, Supabase, Claude API, pgvector - accurate ✅
10. **MVP Timeline**: 8-10 weeks - accurate ✅

---

## Recommendations

### Immediate Fixes (Critical)

1. **Fix churn rate calculation** in LTV section (Issue #1)
2. **Resolve churn rate inconsistency** between sections (Issue #2)
3. **Recalculate cumulative revenue** in projections table (Issue #3)

### Transparency Improvements (High Priority)

4. **Add estimate disclaimers** for:
   - SAM growth projection (Issue #5)
   - Year 2-3 projections (Issue #6)
   - "10% power users" assumption (Issue #7)
   - Interpolated months in revenue table (Issue #8)

5. **Verify or remove** external market research citations (Issue #4):
   - Check Gartner and Grand View Research reports
   - OR remove specific citations
   - OR add "(not verified)" disclaimer

### Optional Enhancements (Low Priority)

6. **Add "Assumptions & Limitations" section** at end of document listing all extrapolations and estimates
7. **Create separate "Projections Methodology" appendix** explaining interpolation and extrapolation methods
8. **Version control**: Track which claims are from source vs. synthesized

---

## Fact-Check Summary

| Category | Count | Severity |
|----------|-------|----------|
| ❌ Errors (Must Fix) | 3 | Critical |
| ⚠️ Unverified Claims | 1 | High |
| ⚠️ Extrapolations | 4 | Medium |
| ℹ️ Synthesized (Expected) | 2 | Low |
| ✅ Accurate | 10+ sections | N/A |

**Overall Assessment**: Document is **mostly accurate** with good synthesis of source material, but requires immediate fixes to mathematical errors and transparency improvements for extrapolations.

**Confidence Level**:
- Core business model: High confidence (matches source)
- Unit economics: Medium confidence (calculations need correction)
- Market sizing: Low confidence (external claims unverified, extrapolations beyond source)
- Financial projections: Medium confidence (reasonable interpolations, but cumulative revenue has errors)

---

## Action Items

**Critical (Do Immediately)**:
- [ ] Fix LTV churn rate calculation (use 6.25% monthly churn, 93.75% retention, 16-month lifetime)
- [ ] Resolve churn rate inconsistency (standardize on one model throughout document)
- [ ] Recalculate cumulative revenue column in projections table

**High Priority (Do Before Using Document)**:
- [ ] Add disclaimers to all extrapolated/estimated figures
- [ ] Verify Gartner and Grand View Research citations OR remove/disclaim

**Medium Priority (Nice to Have)**:
- [ ] Add "Assumptions & Limitations" section
- [ ] Document interpolation methodology for month-by-month projections
- [ ] Consider conservative/aggressive scenarios for uncertain projections

**Low Priority (Future Enhancement)**:
- [ ] Create separate market research verification document
- [ ] Build financial model spreadsheet to validate all projections
- [ ] Track version history of assumptions as they're validated

---

**Prepared by**: Claude (AI Fact-Checker)
**Date**: 2025-10-23
**Next Review**: After critical fixes applied
