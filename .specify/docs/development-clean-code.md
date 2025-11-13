---
title: Clean Code Standards
summary: Function size, naming, complexity, and TypeScript strictness rules for maintainable code
domain: development
priority: core
related: [backend-graphql-architecture, frontend-monorepo-structure, project-mvp-guardrails]
---

<!-- After editing this file, run: npm run sync-docs -->

# Clean Code Standards

**What**: Code quality standards for functions, naming, TypeScript usage, and code organization

**Why**: Clean code reduces cognitive load, prevents bugs, and maintains long-term velocity as codebase grows

**How**:

```typescript
// ✅ GOOD: Small, focused function with descriptive name
async function fetchUserThreads(userId: string): Promise<Thread[]> {
  const threads = await threadRepository.findByUserId(userId);
  return threads.filter(thread => thread.ownerUserId === userId);
}

// ❌ BAD: Generic name, too long (>50 lines), does multiple things
async function getData(id: string): Promise<any> {
  const user = await db.query(...);
  const threads = await db.query(...);
  const messages = await db.query(...);
  // ... 40 more lines of mixed concerns
  return { user, threads, messages };
}
```

**Rules**:

### Function Size & Complexity
- ✅ DO: Keep functions < 50 lines (prefer), max 100 lines
- ✅ DO: Keep cyclomatic complexity < 10 branches per function
- ✅ DO: Extract sub-functions when logic exceeds size limits
- ❌ DON'T: Write functions > 100 lines (extract instead)
- ❌ DON'T: Nest conditionals > 3 levels deep

### Naming Conventions
- ✅ DO: Use descriptive, self-documenting names
- ✅ DO: camelCase for functions/variables
- ✅ DO: PascalCase for components/types
- ✅ DO: UPPER_SNAKE_CASE for constants
- ❌ DON'T: Use abbreviations (btn, usr, ctx)
- ❌ DON'T: Use generic names (data, temp, result)
- ❌ DON'T: Use single letters except i, j in loops

### TypeScript Strictness
- ✅ DO: Use TypeScript strict mode
- ✅ DO: Define proper types for all parameters/returns
- ✅ DO: Import types from generated sources (@/types/graphql, ../db/types.js)
- ❌ DON'T: Use 'any' without justification comment
- ❌ DON'T: Disable TypeScript checks (@ts-ignore)
- ❌ DON'T: Manually redeclare types that exist in generated sources

### Code Reuse (Rule of Three)
- ✅ DO: Extract to shared function after 3rd occurrence
- ✅ DO: Use named constants (no magic numbers/strings)
- ✅ DO: DRY (Don't Repeat Yourself) after pattern emerges
- ❌ DON'T: Copy-paste code blocks
- ❌ DON'T: Abstract before 3rd occurrence (premature)

### Comments & Documentation
- ✅ DO: Explain "why", not "what" (code explains what)
- ✅ DO: Document complex logic and edge cases
- ✅ DO: Use JSDoc for public APIs
- ❌ DON'T: Write comments that restate code
- ❌ DON'T: Leave commented-out code (delete it)

**Used in**:
- All TypeScript files across monorepo
- Referenced by Principle XIII in constitution.md
- Enforced in code reviews
