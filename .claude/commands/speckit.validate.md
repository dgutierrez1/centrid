# /speckit.validate

Run intelligent code validation with targeted scope and actionable error reporting.

---

## Workflow

### 1. Ask Validation Scope

Use AskUserQuestion with options:
1. **Full** - Type-check + lint (~25-35s)
2. **Quick** - Type-check only (~15-20s)
3. **API** - apps/api only
4. **Web** - apps/web only
5. **UI** - packages/ui only
6. **Codegen** - Generate GraphQL types
7. **Deploy** - Pre-deployment validation
8. **Fix** - Auto-fix lint issues

### 2. Run Commands

```bash
# Full
npm run validate

# Quick
npm run type-check

# Package (example: api)
cd apps/api && npm run type-check

# Codegen
npm run codegen

# Deploy
npm run validate && npm run codegen && git status --short

# Fix
npm run lint:fix && npm run type-check
```

### 3. Report Results

**Success:**
```
✅ Validation passed
- Type-check: Passed (X files)
- Lint: Passed
- Time: Xs
Status: Ready to commit/deploy
```

**Failure - Parse errors and provide file:line references:**
```
❌ Validation failed (8 errors)

TypeScript (3):
• apps/web/src/components/Workspace.tsx:45
  Property 'threadId' missing on Props
  Fix: Add threadId to Props interface

ESLint (5):
• apps/api/src/services/threadService.ts:23
  'console.log' not allowed (no-console)
  Fix: Use logger.info() or logger.debug()

Auto-fixable: 3 errors
Next: Run /speckit.validate with "Fix" option
```

**Deploy mode - Add checklist:**
```
Pre-deployment:
✅ Type-check passed
✅ Lint passed
✅ GraphQL types synced
⚠️ Uncommitted changes (5 files)

Recommendation: Commit first, then:
npm run deploy
```

### 4. Common Fixes

| Error | Fix |
|-------|-----|
| GraphQL type errors | `npm run codegen` |
| `'console.log' is not allowed` | Use logger.info() |
| `React Hook missing dependency` | Add to deps or useCallback |
| `'...' defined but never used` | Remove or prefix with _ |
| `Unexpected any` | Add type annotation |
| Import errors after schema changes | `npm run codegen` |

---

## Guidelines

- Show timing + file counts
- Extract file:line from errors
- Group errors by type
- Prioritize auto-fixable
- Offer re-validation after fixes
- **DO NOT** create report files
- **DO** provide markdown summary
