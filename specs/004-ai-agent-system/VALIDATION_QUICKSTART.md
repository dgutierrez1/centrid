# Validation Quickstart Guide

**Quick reference for validating the AI agent system during development**

---

## TL;DR - Run This When...

```bash
# Changed database schema
cd apps/api && npx tsx src/scripts/validate-infrastructure.ts

# Added/modified a repository method
cd apps/api && npx tsx src/scripts/validate-repositories.ts

# Changed service logic
cd apps/api && npx tsx src/scripts/validate-services.ts

# Modified embedding flow
cd apps/api && npx tsx src/scripts/validate-embedding-flow.ts

# Before merging PR
/speckit.test 004

# Before production deploy
npm run validate:all
```

---

## The 5-Level Pyramid (Quick Reference)

### Level 0: Infrastructure ⚡ (2-5s)
**When**: Setup, deployment, environment changes
**Command**: `npx tsx src/scripts/validate-infrastructure.ts`
**Checks**: Database, pgvector, OpenAI API, Anthropic API, env vars

### Level 1: Repositories 🗄️ (4-6s)
**When**: Changed repository code, DB queries
**Command**: `npx tsx src/scripts/validate-repositories.ts`
**Checks**: CRUD operations, RLS policies, query performance

### Level 2: Services 🔧 (15-20s)
**When**: Changed service logic, business rules
**Command**: `npx tsx src/scripts/validate-services.ts`
**Checks**: Service methods with mocked external APIs

### Level 3: Flows 🌊 (15-30s)
**When**: Changed multi-service flows, integrations
**Command**: `npx tsx src/scripts/validate-flows.ts`
**Checks**: End-to-end data flows with real APIs

### Level 4: System 🚀 (2-5min)
**When**: Before PR merge, production deploy
**Command**: `/speckit.test 004`
**Checks**: API contracts, E2E scenarios, UI flows

---

## Example: Validating the Embedding Flow

**Problem**: "How do I know embeddings are working correctly?"

**Solution**: Run Level 3 embedding flow validation

```bash
cd apps/api
npx tsx src/scripts/validate-embedding-flow.ts
```

**What it tests**:
1. ✓ File creation
2. ✓ OpenAI embedding generation (768-dim)
3. ✓ Shadow entity creation
4. ✓ pgvector storage
5. ✓ Semantic search retrieval
6. ✓ Cross-query matching
7. ✓ Change detection (>20% threshold)
8. ✓ Performance targets (<2s embedding, <500ms search)

**Expected output**:
```
✅ Flow Validation: Embedding Generation PASSED
   ✓ 8/8 steps completed
   ⏱️ Total time: 2.3s

📊 Performance Summary:
   • Embedding: 1243ms ✓
   • Search: 387ms ✓
   • Total Flow: 2.3s ✓
```

**If it fails**:
- Check OpenAI API key: `echo $OPENAI_API_KEY`
- Run Level 0: `npx tsx src/scripts/validate-infrastructure.ts`
- Check database: `npm run db:push`

---

## Common Validation Scenarios

### Scenario 1: Added a new repository method

```bash
# 1. Write the method in apps/api/src/repositories/myRepo.ts

# 2. Test it at Level 1
cd apps/api
npx tsx src/scripts/validate-repositories.ts

# 3. If passes, commit
git add . && git commit -m "feat: add myMethod to MyRepository"
```

### Scenario 2: Changed context assembly logic

```bash
# 1. Update apps/api/src/services/contextAssembly.ts

# 2. Test service in isolation (Level 2)
npx tsx src/scripts/validate-services.ts

# 3. Test full flow with real APIs (Level 3)
npx tsx src/scripts/validate-flows.ts

# 4. If passes, test system (Level 4)
/speckit.test 004
```

### Scenario 3: Debugging production issue

```bash
# Start from bottom and work up

# Level 0: Infrastructure
npx tsx src/scripts/validate-infrastructure.ts
# ✅ All pass → Infrastructure OK

# Level 1: Repositories
npx tsx src/scripts/validate-repositories.ts
# ❌ ShadowEntityRepository.searchSemantic fails → Found issue!

# Fix: Rebuild pgvector index
npm run db:push

# Re-test Level 1 → Level 2 → Level 3 → Level 4
```

### Scenario 4: Before production deploy

```bash
# Run all levels bottom-up

cd apps/api

# Level 0 (2-5s)
npx tsx src/scripts/validate-infrastructure.ts

# Level 1 (4-6s)
npx tsx src/scripts/validate-repositories.ts

# Level 2 (15-20s)
npx tsx src/scripts/validate-services.ts

# Level 3 (15-30s)
npx tsx src/scripts/validate-flows.ts

# Level 4 (2-5min)
cd ../..
/speckit.test 004

# If all pass → Ready to deploy!
```

---

## Performance Targets (Quick Reference)

| Layer | Target | Acceptable | Slow |
|-------|--------|------------|------|
| **Repository query** | <30ms | <100ms | >100ms |
| **Service call** | <500ms | <1s | >1s |
| **Embedding generation** | <1s | <2s | >2s |
| **Semantic search** | <300ms | <500ms | >500ms |
| **Context assembly** | <500ms | <1s | >1s |
| **Agent response (simple)** | <3s | <5s | >5s |
| **Full flow** | <3s | <5s | >5s |

---

## When Something Breaks

**Golden Rule**: Start at the lowest level and work up.

```
Issue reported at Level 4 (E2E test)
  ↓
Check Level 3 (Flow) → ✅ Pass
  ↓
Check Level 2 (Service) → ✅ Pass
  ↓
Check Level 1 (Repository) → ❌ FAIL
  ↓
Found: Missing database index
  ↓
Fix: npm run db:push
  ↓
Re-test: Level 1 → 2 → 3 → 4 → All pass!
```

**Don't waste time debugging at Level 4 when the issue is at Level 1.**

---

## Implementation Status

| Script | Status | Location |
|--------|--------|----------|
| `validate-infrastructure.ts` | ✅ Created | `apps/api/src/scripts/` |
| `validate-repositories.ts` | ⏳ TODO | `apps/api/src/scripts/` |
| `validate-services.ts` | ⏳ TODO | `apps/api/src/scripts/` |
| `validate-embedding-flow.ts` | ✅ Created | `apps/api/src/scripts/` |
| `validate-flows.ts` | ⏳ TODO | `apps/api/src/scripts/` |

**Next Steps**:
1. Test `validate-infrastructure.ts`
2. Create `validate-repositories.ts` (use pattern from infrastructure script)
3. Create `validate-embedding-flow.ts` tests for other flows

---

## Integration with CI/CD

```yaml
# .github/workflows/validation.yml
name: Validation Pipeline

on: [pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      # Level 0: Infrastructure
      - name: Validate Infrastructure
        run: cd apps/api && npx tsx src/scripts/validate-infrastructure.ts

      # Level 1: Repositories
      - name: Validate Repositories
        run: cd apps/api && npx tsx src/scripts/validate-repositories.ts

      # Level 2: Services
      - name: Validate Services
        run: cd apps/api && npx tsx src/scripts/validate-services.ts

      # Level 3: Flows
      - name: Validate Flows
        run: cd apps/api && npx tsx src/scripts/validate-flows.ts

      # Level 4: System
      - name: Run E2E Tests
        run: npm run test:e2e
```

---

**Created**: 2025-10-28
**Last Updated**: 2025-10-28
