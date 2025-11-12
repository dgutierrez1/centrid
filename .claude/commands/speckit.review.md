---
description: Comprehensive multi-agent code review for PR preparation
---

## User Input

```text
$ARGUMENTS
```

Options:
- (empty) - Full deep review (all 6 agents)
- `quick` - Quick pass (critical issues only, 30 min)
- `security` - Security-focused review only
- `quality` - Code quality review only
- `performance` - Performance review only
- `architecture` - Architecture review only

---

## Goal

Generate a comprehensive, actionable code review by analyzing all changes in the current branch using 6 specialized parallel agents. Identify critical issues, security vulnerabilities, code quality problems, performance bottlenecks, TypeScript/type safety issues, and frontend/state management concerns before creating a PR.

## Operating Constraints

**STRICTLY READ-ONLY**: Do **not** modify any files, create commits, or push changes. Output a structured review report with prioritized findings and actionable recommendations.

**Git-Based Analysis**: Review focuses on changes in current branch compared to base branch (main). Only analyze modified, added, or deleted files.

---

## Workflow

### Step 1: Initialize Review Context

**Check git status and identify changes:**

```bash
cd /Users/daniel/Projects/misc/centrid

# Verify we're in a git repository
git rev-parse --git-dir || {
  echo "ERROR: Not in a git repository"
  exit 1
}

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Determine base branch (default: main, fallback: master)
if git show-ref --verify --quiet refs/heads/main; then
  BASE_BRANCH="main"
elif git show-ref --verify --quiet refs/heads/master; then
  BASE_BRANCH="master"
else
  echo "ERROR: No main or master branch found"
  exit 1
fi

# Get changed files
git diff --name-status $BASE_BRANCH...HEAD > /tmp/changed-files.txt

# Get commit summary
COMMIT_COUNT=$(git rev-list --count $BASE_BRANCH..HEAD)
COMMIT_SUMMARY=$(git log $BASE_BRANCH..HEAD --oneline)

echo "Branch: $CURRENT_BRANCH"
echo "Base: $BASE_BRANCH"
echo "Commits: $COMMIT_COUNT"
echo "Changed files: $(wc -l < /tmp/changed-files.txt)"
```

**Parse user arguments:**

```javascript
const args = "$ARGUMENTS".trim();
const reviewMode = args || "full"; // full, quick, security, quality, performance, architecture

const agentConfig = {
  full: ["architecture", "security", "quality", "performance", "typescript", "frontend"],
  quick: ["security", "quality"], // Only critical agents
  security: ["security"],
  quality: ["quality"],
  performance: ["performance"],
  architecture: ["architecture"]
};

const enabledAgents = agentConfig[reviewMode] || agentConfig.full;
```

---

### Step 2: Categorize Changed Files

**Group files by domain for agent assignment:**

```javascript
// Read changed files from git diff
const changedFiles = readChangedFiles("/tmp/changed-files.txt");

const fileCategories = {
  backend: {
    edgeFunctions: [],    // apps/api/src/functions/**
    services: [],         // apps/api/src/services/**
    repositories: [],     // apps/api/src/repositories/**
    middleware: [],       // apps/api/src/middleware/**
    utils: []            // apps/api/src/utils/**
  },
  frontend: {
    components: [],       // apps/web/src/components/**
    hooks: [],           // apps/web/src/lib/hooks/**
    contexts: [],        // apps/web/src/lib/contexts/**
    services: [],        // apps/web/src/lib/services/**
    pages: []            // apps/web/pages/**
  },
  ui: {
    components: [],       // packages/ui/src/components/**
    features: []         // packages/ui/src/features/**
  },
  shared: {
    types: [],           // packages/shared/src/types/**
    schemas: [],         // packages/shared/src/schemas/**
    utils: []            // packages/shared/src/utils/**
  },
  database: {
    schema: [],          // apps/api/src/db/schema.ts
    migrations: []       // apps/api/drizzle/migrations/**
  },
  config: {
    typescript: [],      // tsconfig.json, *.config.ts
    build: [],          // package.json, turbo.json
    env: []             // .env*, .gitignore
  }
};

// Categorize each file
changedFiles.forEach(file => {
  // Assign to appropriate category based on path
});

// Calculate stats
const stats = {
  totalFiles: changedFiles.length,
  additions: countAdditions(changedFiles),
  deletions: countDeletions(changedFiles),
  modified: countModified(changedFiles)
};
```

---

### Step 3: Define Review Agent Prompts

**Agent 1: Architecture & Dependencies**

```markdown
You are the **Architecture Review Agent**.

**Objective**: Verify layer boundaries, import rules, dependency management, and separation of concerns across the monorepo.

**Changed Files**:
{fileCategories.all}

**Project Rules** (from CLAUDE.md):
- `apps/web` → MAY import from `packages/ui`, `packages/shared`
- `apps/api` → MAY import from `packages/shared` only
- `packages/ui` → MAY import from `packages/shared` (NO Supabase, Valtio, or apps/)
- `packages/shared` → NO imports from other packages (foundation layer)
- Backend: Edge Functions → Services → Repositories (three-layer architecture)
- Edge Functions MUST NOT contain business logic or inline queries

**Analysis Tasks**:

1. **Import Validation**: Check each changed file for import violations
   - Read each file
   - Extract import statements
   - Verify against allowed imports for that package
   - Flag violations with file:line

2. **Layer Boundary Checks**:
   - Verify Edge Functions only do: auth, routing, request/response formatting
   - Services contain business logic, orchestrate repositories
   - Repositories handle all database access (Drizzle ORM)
   - No inline SQL queries outside repositories

3. **Circular Dependencies**:
   - Map import graph for changed files
   - Detect cycles (A imports B, B imports A)

4. **Separation of Concerns**:
   - Edge Functions calling Services (not Repositories directly)
   - UI components free of business logic
   - Proper use of custom hooks for data fetching

**Return Format**:
```json
{
  "agentId": "architecture",
  "filesReviewed": 25,
  "findings": [
    {
      "id": "ARCH-001",
      "severity": "CRITICAL|HIGH|MEDIUM|LOW",
      "category": "import-violation|layer-boundary|circular-dep|coupling",
      "file": "path/to/file.ts",
      "line": 10,
      "issue": "Description of the issue",
      "recommendation": "How to fix it"
    }
  ],
  "summary": {
    "critical": 0,
    "high": 2,
    "medium": 5,
    "low": 1
  }
}
```
```

---

**Agent 2: Security & Data Safety**

```markdown
You are the **Security Review Agent**.

**Objective**: Identify security vulnerabilities, authentication issues, data leaks, and RLS policy gaps.

**Changed Files**:
{fileCategories.backend} + {fileCategories.frontend.services}

**Security Checklist**:

1. **Authentication & Authorization**:
   - Edge Functions verify auth tokens
   - Server-side API calls use service role key (not exposed to client)
   - Client-side uses anon key only
   - RLS policies enforce user isolation

2. **SQL Injection**:
   - All queries use parameterized statements (Drizzle)
   - No string concatenation in SQL
   - Input validation with Zod schemas

3. **Data Exposure**:
   - No sensitive data in client-side code
   - API responses filtered (no password hashes, tokens)
   - Error messages don't leak internal details
   - Environment variables properly scoped (NEXT_PUBLIC_ only for client)

4. **CORS & API Security**:
   - CORS properly configured in Edge Functions
   - Rate limiting on API endpoints
   - Input sanitization

5. **RLS Policy Coverage**:
   - Check if new tables have RLS policies
   - Verify policies enforce user_id checks
   - Test policy logic for gaps

**Analysis Tasks**:
- Read each backend file for security patterns
- Check for exposed secrets (hardcoded keys, tokens)
- Verify auth checks in Edge Functions
- Check RLS policies in schema.ts
- Review error handling (no stack traces to client)

**Return Format**:
```json
{
  "agentId": "security",
  "filesReviewed": 18,
  "findings": [
    {
      "id": "SEC-001",
      "severity": "CRITICAL|HIGH|MEDIUM|LOW",
      "category": "auth|sql-injection|data-leak|cors|rls|secrets",
      "file": "path/to/file.ts",
      "line": 42,
      "issue": "Description of vulnerability",
      "recommendation": "Security fix"
    }
  ],
  "summary": {
    "critical": 1,
    "high": 0,
    "medium": 3,
    "low": 2
  }
}
```
```

---

**Agent 3: Code Quality & Patterns**

```markdown
You are the **Code Quality Review Agent**.

**Objective**: Find code smells, duplication, inconsistent patterns, poor error handling, and unused code.

**Changed Files**:
{fileCategories.all}

**Quality Checks**:

1. **Code Duplication**:
   - Find similar code blocks across files
   - Suggest extraction to shared utilities
   - Check for copy-paste patterns

2. **Code Smells**:
   - Functions >50 lines (suggest refactoring)
   - Components >300 lines (extract sub-components)
   - Deeply nested logic (>3 levels)
   - Magic numbers (use constants)
   - God objects (too many responsibilities)

3. **Error Handling**:
   - Try-catch blocks present
   - Errors logged properly
   - User-friendly error messages
   - No silent failures

4. **Naming Conventions**:
   - Consistent naming (camelCase, PascalCase)
   - Descriptive names (no `a`, `temp`, `data`)
   - File names match exports

5. **Unused Code**:
   - Unused imports
   - Unreachable code
   - Dead functions/variables
   - Commented-out code blocks

6. **Debug Logging**:
   - console.log statements (remove for production)
   - console.warn/error (acceptable)
   - Debug-only code

**Analysis Tasks**:
- Read each file
- Count lines per function/component
- Detect duplication (similar code blocks)
- Check error handling patterns
- Find console.log statements
- Identify unused imports/exports

**Return Format**:
```json
{
  "agentId": "quality",
  "filesReviewed": 45,
  "findings": [
    {
      "id": "QUAL-001",
      "severity": "CRITICAL|HIGH|MEDIUM|LOW",
      "category": "duplication|smell|error-handling|naming|unused|debug",
      "file": "path/to/file.ts",
      "line": 100,
      "issue": "Description",
      "recommendation": "Suggested refactor"
    }
  ],
  "summary": {
    "critical": 0,
    "high": 5,
    "medium": 12,
    "low": 8
  }
}
```
```

---

**Agent 4: Performance & Database**

```markdown
You are the **Performance Review Agent**.

**Objective**: Identify performance bottlenecks, inefficient algorithms, database query issues, and bundle size concerns.

**Changed Files**:
{fileCategories.all}

**Performance Checks**:

1. **Database Queries**:
   - N+1 query patterns (queries in loops)
   - Missing indexes on foreign keys
   - SELECT * instead of specific columns
   - Unnecessary joins
   - Missing pagination on large result sets

2. **Algorithm Efficiency**:
   - Nested loops (O(n²) complexity)
   - Inefficient array operations (filter + map → single reduce)
   - Unoptimized searches (linear vs binary)

3. **React Performance**:
   - Missing useMemo/useCallback for expensive operations
   - Unnecessary re-renders
   - Large component trees without code splitting
   - Heavy computations in render

4. **Bundle Size**:
   - Large library imports (import entire lodash vs specific functions)
   - Duplicate dependencies
   - Missing tree-shaking

5. **Caching**:
   - Repeated API calls without caching
   - Missing memoization
   - Stale data handling

**Analysis Tasks**:
- Review repository files for query patterns
- Check for queries in loops
- Analyze React hooks for optimization opportunities
- Review import statements for bundle size
- Check for missing indexes in schema changes

**Return Format**:
```json
{
  "agentId": "performance",
  "filesReviewed": 30,
  "findings": [
    {
      "id": "PERF-001",
      "severity": "CRITICAL|HIGH|MEDIUM|LOW",
      "category": "n+1|algorithm|react|bundle|caching",
      "file": "path/to/file.ts",
      "line": 50,
      "issue": "Description of bottleneck",
      "recommendation": "Optimization strategy"
    }
  ],
  "summary": {
    "critical": 0,
    "high": 3,
    "medium": 6,
    "low": 4
  }
}
```
```

---

**Agent 5: TypeScript & Type Safety**

```markdown
You are the **TypeScript Review Agent**.

**Objective**: Find type safety issues, `any` types, missing null checks, weak type assertions, and schema mismatches.

**Changed Files**:
{fileCategories.all}

**Type Safety Checks**:

1. **Type Annotations**:
   - Explicit return types on functions
   - Avoid implicit `any`
   - Type parameters properly constrained

2. **`any` Types**:
   - Find all `any` usages
   - Suggest proper types
   - Check for `as any` type assertions

3. **Null Safety**:
   - Optional chaining usage (obj?.prop)
   - Null coalescing (value ?? default)
   - Proper undefined checks before access
   - Array.find() results checked before use

4. **Type Assertions**:
   - `as` casts justified (not hiding errors)
   - Non-null assertions (!) validated
   - Type guards for union types

5. **Schema Consistency**:
   - Zod schemas match TypeScript types
   - Database schema types sync with shared types
   - API request/response types match contracts

6. **Type Imports**:
   - Use `import type` for type-only imports
   - Avoid circular type dependencies

**Analysis Tasks**:
- Search for `any`, `as any`, `as unknown`
- Check for `!` non-null assertions
- Verify schema definitions match types
- Review type imports (value vs type)
- Check function return type annotations

**Return Format**:
```json
{
  "agentId": "typescript",
  "filesReviewed": 40,
  "findings": [
    {
      "id": "TYPE-001",
      "severity": "CRITICAL|HIGH|MEDIUM|LOW",
      "category": "any-type|null-check|assertion|schema-mismatch|import",
      "file": "path/to/file.ts",
      "line": 25,
      "issue": "Description of type issue",
      "recommendation": "Type-safe alternative"
    }
  ],
  "summary": {
    "critical": 0,
    "high": 2,
    "medium": 8,
    "low": 5
  }
}
```
```

---

**Agent 6: Frontend & State Management**

```markdown
You are the **Frontend Review Agent**.

**Objective**: Review React patterns, Valtio state management, real-time subscription cleanup, component composition, and accessibility.

**Changed Files**:
{fileCategories.frontend} + {fileCategories.ui}

**Frontend Checks**:

1. **React Patterns**:
   - Hooks used correctly (no conditional hooks)
   - useEffect dependencies complete
   - Cleanup functions in effects
   - No infinite render loops

2. **Valtio State Management**:
   - Use `useSnapshot` for reactive reads
   - Direct mutations for writes
   - Avoid `Map.get()` (not tracked by Valtio)
   - Use plain objects with bracket notation

3. **Real-time Subscriptions**:
   - Supabase subscriptions cleaned up
   - No memory leaks from unclosed subscriptions
   - Proper error handling in subscription callbacks

4. **Component Composition**:
   - Proper separation (presentational vs container)
   - Props drilling (max 2 levels)
   - Component size (<300 lines)
   - Custom hooks for complex logic

5. **Accessibility**:
   - Semantic HTML (button, nav, main)
   - ARIA labels for interactive elements
   - Keyboard navigation support
   - Focus management (modals, drawers)

6. **Performance**:
   - Keys on list items
   - Memoization for expensive renders
   - Code splitting for large components

**Analysis Tasks**:
- Review hooks for proper dependencies
- Check for subscription cleanup
- Verify Valtio patterns (snapshot vs mutation)
- Check component sizes
- Review accessibility attributes

**Return Format**:
```json
{
  "agentId": "frontend",
  "filesReviewed": 35,
  "findings": [
    {
      "id": "FRONT-001",
      "severity": "CRITICAL|HIGH|MEDIUM|LOW",
      "category": "hooks|valtio|subscription|composition|a11y|perf",
      "file": "path/to/file.tsx",
      "line": 80,
      "issue": "Description of issue",
      "recommendation": "React best practice"
    }
  ],
  "summary": {
    "critical": 0,
    "high": 4,
    "medium": 9,
    "low": 6
  }
}
```
```

---

### Step 4: Launch Parallel Review Agents

**CRITICAL**: Use Task tool with **multiple invocations in single message** for parallel execution.

```typescript
// Build agent array based on enabled agents
const agents = [];

if (enabledAgents.includes("architecture")) {
  agents.push({
    subagent_type: "general-purpose",
    description: "Review architecture & dependencies",
    prompt: generateArchitectureAgentPrompt(fileCategories)
  });
}

if (enabledAgents.includes("security")) {
  agents.push({
    subagent_type: "general-purpose",
    description: "Review security & data safety",
    prompt: generateSecurityAgentPrompt(fileCategories)
  });
}

if (enabledAgents.includes("quality")) {
  agents.push({
    subagent_type: "general-purpose",
    description: "Review code quality & patterns",
    prompt: generateQualityAgentPrompt(fileCategories)
  });
}

if (enabledAgents.includes("performance")) {
  agents.push({
    subagent_type: "general-purpose",
    description: "Review performance & database",
    prompt: generatePerformanceAgentPrompt(fileCategories)
  });
}

if (enabledAgents.includes("typescript")) {
  agents.push({
    subagent_type: "general-purpose",
    description: "Review TypeScript & type safety",
    prompt: generateTypeScriptAgentPrompt(fileCategories)
  });
}

if (enabledAgents.includes("frontend")) {
  agents.push({
    subagent_type: "general-purpose",
    description: "Review frontend & state management",
    prompt: generateFrontendAgentPrompt(fileCategories)
  });
}

// Launch all agents in parallel (2-3 hour review in ~30 minutes)
```

---

### Step 5: Aggregate & Consolidate Results

**Collect all agent results:**

```javascript
const agentResults = [
  architectureResult,
  securityResult,
  qualityResult,
  performanceResult,
  typescriptResult,
  frontendResult
].filter(Boolean); // Remove disabled agents

// Merge all findings
const allFindings = agentResults.flatMap(agent =>
  agent.findings.map(finding => ({
    ...finding,
    agent: agent.agentId
  }))
);

// Deduplicate (same issue found by multiple agents)
const uniqueFindings = deduplicateFindings(allFindings);

// Group by severity
const findingsBySeverity = {
  critical: uniqueFindings.filter(f => f.severity === "CRITICAL"),
  high: uniqueFindings.filter(f => f.severity === "HIGH"),
  medium: uniqueFindings.filter(f => f.severity === "MEDIUM"),
  low: uniqueFindings.filter(f => f.severity === "LOW")
};

// Calculate metrics
const metrics = {
  totalFindings: uniqueFindings.length,
  critical: findingsBySeverity.critical.length,
  high: findingsBySeverity.high.length,
  medium: findingsBySeverity.medium.length,
  low: findingsBySeverity.low.length,
  filesReviewed: agentResults.reduce((sum, r) => sum + r.filesReviewed, 0)
};

// Calculate quality score (100 - weighted penalties)
const qualityScore = calculateQualityScore(metrics);

// Determine status
const status = qualityScore >= 90 ? "READY" :
               qualityScore >= 70 ? "NEEDS_WORK" : "BLOCKED";
```

**Deduplication logic:**

```javascript
function deduplicateFindings(findings) {
  const seen = new Map();

  findings.forEach(finding => {
    const key = `${finding.file}:${finding.line}:${finding.category}`;

    if (!seen.has(key)) {
      seen.set(key, finding);
    } else {
      // Merge agents that found this issue
      const existing = seen.get(key);
      existing.foundBy = existing.foundBy || [existing.agent];
      existing.foundBy.push(finding.agent);
    }
  });

  return Array.from(seen.values());
}
```

---

### Step 5.5: Review Enforcement Check

**MANDATORY before producing report** - verify agents actually executed:

```
Check: Do all agent results exist with required fields?
- agentResults.length > 0
- Each result has: agentId, filesReviewed, findings[], summary{}
- metrics object populated

If ANY field is missing or undefined:
  ERROR: "Review was skipped or agents failed to execute"
  ACTION: "Re-launching review agents now..."
  STOP: Do not produce report
  Re-execute Step 4 completely
```

**Only proceed to Step 6 if review_results is complete**

---

### Step 6: Generate Review Report

**Output consolidated report to console** (no file writes in read-only mode):

```markdown
# PR Review Report: {currentBranch}

**Date**: {timestamp}
**Base Branch**: {baseBranch}
**Commits**: {commitCount}
**Files Changed**: {stats.totalFiles} (+{stats.additions}, -{stats.deletions})
**Generated By**: /speckit.review

---

## Executive Summary

**Overall Status**: {status} (Quality Score: {qualityScore}/100)

**Review Coverage**:
- Agents: {enabledAgents.join(', ')}
- Files Reviewed: {metrics.filesReviewed}
- Total Findings: {metrics.totalFindings}

**Issues by Severity**:
- 🔴 Critical: {metrics.critical}
- 🟠 High: {metrics.high}
- 🟡 Medium: {metrics.medium}
- 🟢 Low: {metrics.low}

**Estimated Fix Time**: {estimateFixTime(metrics)} hours

---

## Critical Issues (Must Fix Before PR)

{if findingsBySeverity.critical.length > 0:}
{findingsBySeverity.critical.map(f => `
### {f.id}: {f.issue}

**File**: \`{f.file}:{f.line}\`
**Category**: {f.category}
**Found by**: {f.foundBy?.join(', ') || f.agent}

**Issue**:
{f.issue}

**Recommendation**:
{f.recommendation}

---
`).join('\n')}
{else:}
✅ No critical issues found
{endif}

---

## High Priority Issues (Should Fix Before Merge)

{if findingsBySeverity.high.length > 0:}
| ID | File:Line | Category | Issue | Fix |
|----|-----------|----------|-------|-----|
{findingsBySeverity.high.map(f =>
  `| ${f.id} | \`${f.file}:${f.line}\` | ${f.category} | ${f.issue} | ${f.recommendation} |`
).join('\n')}
{else:}
✅ No high priority issues
{endif}

---

## Medium Priority Issues (Fix If Time Permits)

{if findingsBySeverity.medium.length > 10:}
**Showing top 10 of {findingsBySeverity.medium.length} medium issues**
{endif}

| ID | File:Line | Category | Issue |
|----|-----------|----------|-------|
{findingsBySeverity.medium.slice(0, 10).map(f =>
  `| ${f.id} | \`${f.file}:${f.line}\` | ${f.category} | ${f.issue} |`
).join('\n')}

{if findingsBySeverity.medium.length > 10:}
**Full list**: See detailed findings below
{endif}

---

## Low Priority Issues (Future Improvements)

**Count**: {findingsBySeverity.low.length}

**Categories**:
{groupByCategory(findingsBySeverity.low).map(([cat, count]) =>
  `- ${cat}: ${count}`
).join('\n')}

---

## Review by Agent

{agentResults.map(agent => `
### {agent.agentId} Agent

**Files Reviewed**: {agent.filesReviewed}
**Findings**: {agent.findings.length} (🔴 {agent.summary.critical} | 🟠 {agent.summary.high} | 🟡 {agent.summary.medium} | 🟢 {agent.summary.low})
`).join('\n')}

---

## Cleanup Recommendations

{if status === "READY":}
### ✅ Ready for PR

Your branch is in excellent shape! Consider:
- Write descriptive PR title and description
- Add test plan to PR description
- Request reviewers based on files changed
- Link to related issues/tickets

**Next Steps**:
1. Create PR: `gh pr create`
2. Add reviewers
3. Monitor CI/CD checks
{endif}

{if status === "NEEDS_WORK":}
### ⚠️ Needs Cleanup

Fix high-priority issues before creating PR:

**Priority 1 - Critical Issues** ({metrics.critical}):
{findingsBySeverity.critical.map(f => `- [ ] ${f.id}: ${f.issue} (${f.file}:${f.line})`).join('\n')}

**Priority 2 - High Issues** ({metrics.high}):
{findingsBySeverity.high.map(f => `- [ ] ${f.id}: ${f.issue} (${f.file}:${f.line})`).join('\n')}

**Optional - Medium Issues** ({metrics.medium}):
- Consider fixing before merge
- Can be addressed in follow-up PR

**Next Steps**:
1. Fix critical and high issues
2. Re-run: `/speckit.review`
3. Create PR when quality score ≥90
{endif}

{if status === "BLOCKED":}
### 🔴 Blocked - Not Ready for PR

Multiple critical/high issues found. Not recommended to create PR yet.

**Must Fix** ({metrics.critical + metrics.high} issues):
{[...findingsBySeverity.critical, ...findingsBySeverity.high].map(f =>
  `- [ ] ${f.id}: ${f.issue} (${f.file}:${f.line})`
).join('\n')}

**Estimated Fix Time**: {estimateFixTime(metrics)} hours

**Next Steps**:
1. Review all critical and high issues above
2. Fix systematically (start with critical)
3. Re-run: `/speckit.review` after each batch of fixes
4. Create PR when quality score ≥70
{endif}

---

## Suggested PR Split Strategy

{if stats.totalFiles > 50 || metrics.totalFindings > 30:}
**Large Change Detected** ({stats.totalFiles} files)

Consider splitting into smaller PRs:

{suggestPRSplit(fileCategories, stats).map((pr, i) => `
### PR ${i + 1}: ${pr.title}
- **Files**: ${pr.files.length}
- **Description**: ${pr.description}
- **Files**: ${pr.files.slice(0, 5).join(', ')}${pr.files.length > 5 ? '...' : ''}
`).join('\n')}

**Benefits**:
- Easier to review (smaller diffs)
- Can merge incrementally
- Easier to revert if needed
- Better commit history

{else:}
**Single PR Recommended** ({stats.totalFiles} files)

Change size is manageable for a single PR.
{endif}

---

## Next Actions

{if status === "READY":}
✅ **Create PR now** - Code quality is excellent

```bash
# Create PR with description
gh pr create --title "feat: {suggestPRTitle(commitSummary)}" --body "$(cat <<'EOF'
{generatePRDescription(commitSummary, fileCategories, metrics)}
EOF
)"
```
{endif}

{if status === "NEEDS_WORK":}
⚠️ **Fix issues first** - Then create PR

**Checklist**:
- [ ] Fix {metrics.critical} critical issues
- [ ] Fix {metrics.high} high priority issues
- [ ] Re-run `/speckit.review` to verify
- [ ] Create PR when quality score ≥90
{endif}

{if status === "BLOCKED":}
🔴 **Major cleanup needed** - Not ready for PR

**Action Plan**:
1. Start with critical issues (security, architecture)
2. Fix high priority issues (code quality, performance)
3. Run `/speckit.review quick` after each batch
4. When quality score >70, run full review
5. Create PR when ready
{endif}

---

**Report Generated**: {timestamp}
**Quality Score**: {qualityScore}/100
**Status**: {status}
```

---

### Step 7: Display Summary to User

Show concise summary in chat:

```
🔍 PR Review Complete: {currentBranch}

Quality Score: {qualityScore}/100 ({status})

Issues Found:
- 🔴 Critical: {metrics.critical}
- 🟠 High: {metrics.high}
- 🟡 Medium: {metrics.medium}
- 🟢 Low: {metrics.low}

{if status === "READY":}
✅ Ready to create PR
{endif}

{if status === "NEEDS_WORK":}
⚠️ Fix {metrics.critical + metrics.high} high-priority issues first
{endif}

{if status === "BLOCKED":}
🔴 Major cleanup needed - {metrics.critical + metrics.high} issues to fix
{endif}

Files Reviewed: {metrics.filesReviewed}
Estimated Fix Time: {estimateFixTime(metrics)} hours

See detailed report above ⬆️
```

---

## Key Rules

**Prerequisites**:
- Must be in git repository
- Must have commits on feature branch
- Branch must diverge from main/master

**Review Scope**:
- Only analyze changed files (git diff)
- Compare against base branch (main/master)
- Full branch context, not just latest commit

**Parallel Execution**:
- Launch ALL enabled agents in single Task tool call
- Agents run independently (2-3 hours of review in ~30 min)
- Consolidate results after all agents complete

**Status Thresholds**:
- READY: Quality score ≥90 (0 critical, minimal high)
- NEEDS_WORK: Quality score 70-89 (few critical/high)
- BLOCKED: Quality score <70 (multiple critical/high issues)

**Quality Score Calculation**:
```
Base: 100 points
- Critical: -10 points each
- High: -5 points each
- Medium: -2 points each
- Low: -0.5 points each
Minimum: 0
```

**Agent Selection**:
- Full review: All 6 agents
- Quick review: Security + Quality only
- Targeted: Single agent focus

**Output**:
- Read-only (no file modifications)
- Console output (full report)
- Actionable recommendations with file:line references
- PR split suggestions for large changes

---

## Context

$ARGUMENTS
