---
description: Validate plan against architecture patterns and clean code standards (token-efficient)
---

## User Input

```text
$ARGUMENTS (optional: path to plan.md file, otherwise validates current conversation)
```

## Overview

This command validates implementation plans against architectural patterns and clean code standards using **token-efficient grep extraction** (saves 84% tokens vs full file reads).

**Validation Scope**:
- Architecture patterns (GraphQL, type generation, monorepo, etc.)
- Clean code standards (function size, naming, TypeScript strictness)
- MVP scope compliance

**Token Efficiency**:
- Traditional approach: ~4,500 tokens (full file reads)
- This approach: ~700 tokens (rules extraction only)
- **Savings**: 84% reduction

---

## Step 1: Load Validation Rules (Token-Efficient)

**Strategy**: Extract ONLY rule sections using grep, not entire files

### 1.1: Extract Backend Architecture Rules

```bash
grep -A 15 "^\*\*Rules\*\*:" .specify/docs/backend-graphql-architecture.md 2>/dev/null || echo "Pattern not found"
```

**Cached rules**:
- ✅ Keep resolvers thin (field resolution only)
- ✅ Keep services framework-agnostic (no GraphQL types)
- ❌ DON'T put business logic in resolvers
- ❌ DON'T call repositories directly from resolvers

---

### 1.2: Extract Type Generation Rules

```bash
grep -A 10 "^\*\*Rules\*\*:" .specify/docs/data-type-generation.md 2>/dev/null || echo "Pattern not found"
```

**Cached rules**:
- ✅ Backend imports from `../db/types.js`
- ✅ Frontend imports from `@/types/graphql`
- ❌ NEVER manually redeclare types that exist in generated sources

---

### 1.3: Extract Monorepo Structure Rules

```bash
grep -A 8 "^\*\*Rules\*\*:" .specify/docs/frontend-monorepo-structure.md 2>/dev/null || echo "Pattern not found"
```

**Cached rules**:
- ✅ apps/web → packages/ui
- ✅ apps/design-system → packages/ui
- ❌ DON'T packages/ui → Supabase/Valtio/apps

---

### 1.4: Extract Clean Code Rules

```bash
grep -A 30 "^\*\*Rules\*\*:" .specify/docs/development-clean-code.md 2>/dev/null || echo "Pattern not found"
```

**Cached rules**:
- **Function Size**: < 50 lines (prefer), max 100 lines
- **Naming**: camelCase functions, PascalCase components, no abbreviations (btn, usr, ctx)
- **TypeScript**: No 'any' without justification
- **Code Reuse**: Extract after 3rd occurrence (Rule of Three)

---

## Step 2: Determine Plan Source

**If $ARGUMENTS provided**:
- Read plan file at specified path
- Use for validation

**If $ARGUMENTS empty**:
- Use current conversation context
- Search for planning keywords: "Phase", "Step", "Implementation", "Architecture"

---

## Step 3: Architecture Validation

### 3.1: Type Generation Compliance

**Check if plan mentions types/schemas**:
```bash
grep -i "type\|schema\|interface\|DTO" [plan-source]
```

**If found, check for violations**:
- Manual type declarations: `grep -i "interface.*User\|interface.*Thread\|type.*=.*{" [plan-source]`
- Wrong import sources: `grep -v "@/types/graphql\|../db/types" [plan-source]`

**Report**:
- ❌ VIOLATION: Manual types detected
- ⚠️  WARNING: Import source unclear
- ✅ PASS: Types from generated sources

---

### 3.2: Backend Architecture Compliance

**Check if plan has backend changes**:
```bash
grep -i "resolver\|graphql\|query\|mutation\|service\|repository" [plan-source]
```

**If found, check layer separation**:
- Business logic in resolvers: `grep -i "resolver.*validation\|resolver.*business logic" [plan-source]`
- Direct repository calls: `grep -i "resolver.*repository\|resolver.*db" [plan-source]`

**Report**:
- ❌ VIOLATION: Business logic in resolvers
- ⚠️  WARNING: Layer separation unclear
- ✅ PASS: Proper layer separation

---

### 3.3: Monorepo Boundary Compliance

**Check if plan touches packages/ui**:
```bash
grep -i "packages/ui" [plan-source]
```

**If found, check for forbidden imports**:
```bash
grep -i "packages/ui.*supabase\|packages/ui.*valtio\|packages/ui.*import.*@/" [plan-source]
```

**Report**:
- ❌ VIOLATION: Server dependencies in packages/ui
- ✅ PASS: Pure UI components only

---

## Step 4: Clean Code Validation

### 4.1: Function Size Check

**Extract function descriptions from plan**:
```bash
grep -i "function\|method" [plan-source]
```

**Check for size indicators**:
- Long functions: `grep -i "long function\|large function\|>.*lines\|100.*lines" [plan-source]`
- Complex functions: `grep -i "complex\|many branches\|nested" [plan-source]`

**Report**:
- ⚠️  WARNING: Function >50 lines mentioned
- ❌ VIOLATION: Function >100 lines
- ✅ PASS: Functions within size limits

---

### 4.2: Naming Convention Check

**Extract variable/function names**:
```bash
grep -E "const [a-zA-Z_]+|function [a-zA-Z_]+|let [a-zA-Z_]+" [plan-source]
```

**Check for anti-patterns**:
- Abbreviations: `grep -E "\b(btn|usr|ctx|auth|db|temp|info)\b" [plan-source]`
- Generic names: `grep -E "\b(data|result|value|item)\b" [plan-source]`

**Report**:
- ⚠️  WARNING: Generic name 'data' detected
- ⚠️  WARNING: Abbreviation 'btn' detected
- ✅ PASS: Descriptive naming

---

### 4.3: TypeScript Strictness Check

**Check for 'any' types**:
```bash
grep -i ": any\|<any>\|as any" [plan-source]
```

**Report**:
- ❌ VIOLATION: 'any' type without justification
- ✅ PASS: Proper TypeScript types

---

### 4.4: Code Reuse Check (Rule of Three)

**Check for duplication indicators**:
```bash
grep -i "similar to\|same as\|copy.*from\|duplicate\|repeat" [plan-source]
```

**Report**:
- ⚠️  WARNING: Potential duplication (3+ occurrences)
- ✅ PASS: No obvious duplication

---

## Step 5: Generate Validation Report

```
═══════════════════════════════════════════
Validation Report
═══════════════════════════════════════════

Plan: [feature-name or current conversation]
Date: [timestamp]

┌─────────────────────────────────────────┐
│ ARCHITECTURE COMPLIANCE                 │
├─────────────────────────────────────────┤
│ Type Generation        │ ✅ PASS         │
│ Backend Architecture   │ ✅ PASS         │
│ Monorepo Boundaries    │ ⚠️  WARNING     │
├─────────────────────────────────────────┤
│ CODE QUALITY COMPLIANCE                 │
├─────────────────────────────────────────┤
│ Function Size          │ ✅ PASS         │
│ Naming Conventions     │ ⚠️  WARNING     │
│ TypeScript Strictness  │ ✅ PASS         │
│ Code Reuse (Rule of 3) │ ✅ PASS         │
├─────────────────────────────────────────┤
│ OVERALL                │ ⚠️  NEEDS REVIEW│
└─────────────────────────────────────────┘

═══════════════════════════════════════════
DETAILS
═══════════════════════════════════════════

⚠️  WARNING: Monorepo Boundary
Location: Line 45
Issue: Plan mentions importing Supabase in packages/ui component
Pattern: frontend-monorepo-structure.md
Rule: ❌ DON'T packages/ui → Supabase/Valtio/apps
Fix: Move component to apps/web or remove server dependency
Reference: .specify/docs/frontend-monorepo-structure.md

⚠️  WARNING: Naming Convention
Location: Line 67
Issue: Generic variable name 'data' detected
Pattern: development-clean-code.md
Rule: ❌ DON'T use generic names (data, temp, result)
Fix: Use descriptive name like 'threadData' or 'userResponse'
Reference: .specify/docs/development-clean-code.md

═══════════════════════════════════════════
SUMMARY
═══════════════════════════════════════════

Violations: 0
Warnings: 2

Status:
✅ APPROVED - Proceed with caution, address warnings
⚠️  CAUTION - 2 warnings, recommend fixes before implementation
❌ BLOCKED - [N/A]

Next Steps:
1. Review warnings above
2. Update plan to address issues
3. Re-run validation if needed
4. Proceed to implementation

═══════════════════════════════════════════
```

---

## Usage Examples

### Example 1: Validate Current Conversation
```
User: [After planning feature in Plan mode]
User: /validate-plan
Claude: [Validates current conversation, reports violations]
```

### Example 2: Validate Specific Plan File
```
User: /validate-plan specs/005-notifications/plan.md
Claude: [Validates specific plan file]
```

### Example 3: Quick Re-Validation
```
User: [Updates plan based on warnings]
User: /validate-plan
Claude: [Re-validates with cached rules - fast]
```

---

## Token Efficiency Breakdown

### Per Validation Run

**Traditional Approach** (reading full files):
- backend-graphql-architecture.md: ~1,800 tokens
- data-type-generation.md: ~1,000 tokens
- frontend-monorepo-structure.md: ~900 tokens
- development-clean-code.md: ~800 tokens
- **Total**: ~4,500 tokens

**Token-Efficient Approach** (grep rules only):
- backend rules extraction: ~150 tokens
- type generation rules: ~100 tokens
- monorepo rules: ~80 tokens
- clean code rules: ~200 tokens
- Validation logic: ~170 tokens
- **Total**: ~700 tokens

**Savings**: 3,800 tokens (84% reduction)

### With Caching (Subsequent Validations)

If rules cached from first run:
- Skip grep extraction
- Use cached rules
- **Total**: ~170 tokens (validation logic only)
- **Savings**: 96% reduction vs traditional

---

## Maintenance

**When pattern docs update**:
- Validation automatically uses latest (grep reads current file)
- No command updates needed

**When new patterns added**:
1. Add grep extraction line to Step 1
2. Add validation logic to Step 3/4
3. ~5 minutes per new pattern

---

## Notes

**General Purpose**:
- Works with ANY plan (not just /speckit plans)
- Validates Plan mode conversations, architecture proposals, refactoring plans, etc.

**Adaptable**:
- Can add `--focus=architecture` or `--focus=code-quality` flags for targeted validation
- Can add `--strict` mode to make warnings into violations

**Fast**:
- First run: ~700 tokens (~2 seconds)
- Subsequent runs with cache: ~170 tokens (<1 second)
