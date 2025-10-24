---
description: Validate tasks before implementation
---

## User Input

```text
{{input}}
```

Validate tasks.md to ensure:

1. Tasks are detailed enough for autonomous implementation
2. Tasks follow project patterns (constitution, development guide)
3. Tasks don't require additional user input
4. Dependencies are correctly ordered
5. Tasks fully cover targeted requirements (no partial delivery risk)

**Idempotent**: Safe to run multiple times.

---

## Outline

1. Setup & Load Context
2. Load Project Guidance
3. Validation Gate 1: Completeness
4. Validation Gate 2: Pattern Compliance
5. Validation Gate 3: Dependency Order
6. Validation Gate 4: Ambiguity & Coverage
7. Generate Validation Report
8. Report Summary

---

## Workflow

### 1. Setup & Load Context

**Run prerequisites**:

```bash
.specify/scripts/bash/check-prerequisites.sh --json
```

**Parse JSON output**:

- `REPO_ROOT` - Project root directory
- `FEATURE_DIR` - Feature directory (absolute path)
- `AVAILABLE_DOCS` - List of existing artifacts

**Verify required artifacts**:

- Check `tasks.md` exists in AVAILABLE_DOCS
  - If MISSING: ERROR - "Run /speckit.tasks first"
  - If EXISTS: Continue

**Load feature context**:

- Read `$FEATURE_DIR/tasks.md` (REQUIRED)
- Read `$FEATURE_DIR/spec.md` (REQUIRED)
- Read `$FEATURE_DIR/plan.md` (REQUIRED)
- Read `$FEATURE_DIR/design.md` (OPTIONAL)

**If any REQUIRED file missing**: STOP with error.

---

### 2. Load Project Guidance

**Discover project documentation**:

1. **Constitution/Principles** (check in order, use first found):

   - `$REPO_ROOT/.specify/memory/constitution.md`
   - `$REPO_ROOT/.constitution.md`
   - `$REPO_ROOT/ARCHITECTURE.md`
   - If NONE found: Skip constitution checks, warn user

2. **Development Guide** (check in order, use first found):
   - `$REPO_ROOT/CLAUDE.md`
   - `$REPO_ROOT/DEVELOPMENT.md`
   - `$REPO_ROOT/README.md`
   - If NONE found: Skip pattern checks, warn user

**Extract validation rules**:

- Architecture patterns (monorepo, layers, boundaries)
- Anti-patterns (forbidden practices)
- Tech stack constraints
- File organization rules
- Import/export patterns
- All rules

**Parse tasks.md**:

- Extract all tasks with IDs, descriptions, file paths
- Build dependency graph
- Map tasks to spec.md requirements

---

### 3. Validation Gate 1: Completeness

**Check each task has**:

| Element           | PASS Criteria                | FAIL Examples                          |
| ----------------- | ---------------------------- | -------------------------------------- |
| **Action**        | Clear WHAT + HOW             | "implement auth", "add validation"     |
| **Acceptance**    | Verifiable "Done when:"      | Missing or vague criteria              |
| **File Paths**    | Absolute or project-relative | "create service file", "add component" |
| **Prerequisites** | Explicit dependencies        | Assumes context without stating        |
| **Decisions**     | All choices resolved         | "choose auth method", "pick library"   |

**Report format**:

```
Completeness: 15/18 tasks pass (83%)

FAIL - Task 2.3: Implement authentication
  ❌ Vague action (which auth method?)
  ❌ Missing file paths
  FIX: "Create email/password auth in src/auth/ per spec.md §2.3"

FAIL - Task 4.1: Add validation
  ❌ Incomplete acceptance ("validation works" - how to verify?)
  FIX: Add "Done when: Zod schemas in src/schemas/, tests pass"
```

---

### 4. Validation Gate 2: Pattern Compliance

**Extract architecture patterns from project docs** (if available):

**Backend Patterns** (from constitution/dev guide):

- Identify layer structure (e.g., "Controllers → Services → Repositories")
- Extract forbidden patterns (e.g., "business logic in controllers")
- Check each backend task against extracted patterns

**Monorepo Patterns** (from constitution/dev guide):

- Extract package boundaries (e.g., "apps/X cannot import packages/Y")
- Identify component placement rules
- Check import/export compliance

**Database Patterns** (from dev guide):

- Extract workflow (e.g., "schema → migrate → types → implement")
- Check type generation requirements
- Verify ORM usage patterns

**Report format**:

```
Pattern Compliance: 12/18 tasks pass (67%)

FAIL - Task 2.1: Create process-document function
  ❌ Business logic in function (violates layer pattern)
  ❌ Inline DB queries (should use repository)
  FIX: Extract to service layer + repository

FAIL - Task 3.1: Create DocumentCard in apps/web
  ❌ Pure UI in apps/ (should be packages/ui per monorepo rules)
  FIX: Move to packages/ui/features/
```

---

### 5. Validation Gate 3: Dependency Order

**Build dependency graph**:

- Parse task prerequisites
- Identify implicit dependencies (schema → types, repository → service)
- Check for circular dependencies
- Verify topological order

**Common dependency patterns**:

- Schema definition → Type generation → Implementation
- Repository → Service → Controller/Function
- Pure components → Smart components
- Design approval → Implementation

**Report format**:

```
Dependency Order: 16/18 tasks pass (89%)

FAIL - Task 2.3: Create function
  ❌ Missing prerequisite: Needs Task 2.1 (repository)
  FIX: Add "Requires: T2.1 complete"

FAIL - Task 3.1: Implement before design approval
  ❌ Violates design-first workflow
  FIX: Add design approval gate task
```

---

### 6. Validation Gate 4: Ambiguity & Coverage

**Ambiguity Check** - Each task must have **one clear interpretation**:

| Check                       | PASS                          | FAIL                                          |
| --------------------------- | ----------------------------- | --------------------------------------------- |
| **Implementation approach** | Specific method/library cited | "add validation" (client? server? which lib?) |
| **References**              | Exact spec/plan section       | "use the auth flow" (which one?)              |
| **File locations**          | Exact path or clear pattern   | "create file" (where?)                        |
| **Config values**           | Specific values or source     | "set timeout appropriately" (to what?)        |
| **Scope**                   | Single interpretation         | "improve performance" (which metric?)         |

**Coverage Check** - Each task must **fully deliver** on its requirement:

**For each task**:

1. Identify which spec.md requirement it targets (user story, acceptance criteria)
2. Check if task delivers 100% of requirement or only partial
3. If partial: Mark as INCOMPLETE_COVERAGE

**Examples**:

- ✅ PASS: Task "Create user login with email/password, JWT tokens, session management" → Delivers full "User Authentication" requirement
- ❌ FAIL: Task "Create user login endpoint" → Delivers partial requirement (missing session, tokens, validation)

**Report format**:

```
Ambiguity & Coverage: 10/18 tasks pass (56%)

FAIL - Task 2.1: Create authentication endpoint
  ❌ Ambiguous: Multiple interpretations (OAuth? Email? Magic link?)
  FIX: "Create email/password auth per spec.md §2.3"

FAIL - Task 3.2: Add user registration
  ❌ Incomplete coverage: Spec.md §3.1 requires email verification + profile setup
  ❌ Task only creates endpoint, missing verification flow
  FIX: Add subtasks for email verification, profile initialization

FAIL - Task 4.1: Implement file upload
  ❌ Incomplete coverage: Spec.md §4.2 requires validation, storage, metadata extraction
  ❌ Task description too brief, risks partial implementation
  FIX: Expand to "Upload file with type/size validation, store in S3, extract metadata per spec.md §4.2"
```

---

### 7. Generate Validation Report

**Create report** at `$FEATURE_DIR/validation-report.md`:

```markdown
# Task Validation Report

**Feature**: [feature-name]
**Validated**: [timestamp]
**Tasks**: [total] tasks

## Summary

| Check                | Pass  | Fail  | Warn  | Status       |
| -------------------- | ----- | ----- | ----- | ------------ |
| Completeness         | X     | X     | X     | ✅/❌        |
| Pattern Compliance   | X     | X     | X     | ✅/❌        |
| Dependency Order     | X     | X     | X     | ✅/❌        |
| Ambiguity & Coverage | X     | X     | X     | ✅/❌        |
| **OVERALL**          | **X** | **X** | **X** | **✅/⚠️/❌** |

**Overall Status**: [READY / CAUTION / BLOCKED]

## Critical Issues

[For each FAIL: Task ID, Issue, Fix suggestion with spec reference]

## Warnings

[For each WARN: Task ID, Issue, Review recommendation]

## Action Required

**If BLOCKED**:

1. Review issues above
2. Fix tasks.md or update spec.md/plan.md if issues stem from there
3. Re-run `/speckit.verify-tasks`
4. Proceed to `/speckit.implement` when READY

**If CAUTION**: May proceed but review warnings

**If READY**: Run `/speckit.implement`
```

**Save report**: Overwrite `$FEATURE_DIR/validation-report.md`

---

### 8. Report Summary

**Determine overall status**:

- **READY** ✅: Zero critical issues (may have warnings)
- **CAUTION** ⚠️: Warnings only, no critical fails
- **BLOCKED** ❌: One or more critical issues

**Display summary**:

```
✅ READY FOR IMPLEMENTATION

Validation Results:
- Completeness: 18/18 ✅
- Pattern Compliance: 18/18 ✅
- Dependency Order: 18/18 ✅
- Ambiguity & Coverage: 18/18 ✅

Tasks validated successfully:
- All tasks detailed and unambiguous
- All patterns followed
- Dependencies correctly ordered
- Full requirement coverage
- No user input required

Report: specs/[feature]/validation-report.md
Next: Run `/speckit.implement`
```

OR

```
❌ BLOCKED - FIXES REQUIRED

Validation Results:
- Completeness: 15/18 (3 fails)
- Pattern Compliance: 12/18 (6 fails)
- Dependency Order: 16/18 (2 fails)
- Ambiguity & Coverage: 10/18 (8 fails)

Critical Issues: 19 total
- 3 completeness issues
- 6 pattern violations
- 2 dependency issues
- 8 ambiguity/coverage issues

Action Required:
1. Review validation-report.md for detailed issues
2. Fix tasks.md (or spec.md/plan.md if issues stem from there)
3. Re-run `/speckit.verify-tasks`
4. Proceed to `/speckit.implement` when all issues resolved

Report: specs/[feature]/validation-report.md
```

**Idempotent**: Re-validates current state, overwrites report, safe to run repeatedly.

---

## Key Rules

1. **Project-Agnostic**: Discover constitution/dev guide dynamically, work with any project structure
2. **No Auto-Fix**: Generate report only, user reviews and applies fixes
3. **Fail Fast**: STOP at missing required artifacts
4. **Comprehensive**: All 4 validation gates must pass for READY status
5. **Actionable**: Every FAIL includes specific FIX with spec reference
6. **Coverage-Focused**: Tasks must fully deliver requirements, not partial implementations
7. **Clear Blocking**: Distinguish critical (FAIL) from recommendations (WARN)
8. **Spec Traceability**: Reference spec.md sections in all fix suggestions

---

## Integration Points

**Predecessor**: `/speckit.tasks` generates tasks.md

**Successor**: `/speckit.implement` executes validated tasks

**Related**:

- `/speckit.analyze` - Cross-artifact consistency (after implementation)
- `/speckit.clarify` - Resolve spec ambiguity (before tasks)

**Files Created**:

- `$FEATURE_DIR/validation-report.md`

**Files Read**:

- `$FEATURE_DIR/tasks.md` (required)
- `$FEATURE_DIR/spec.md` (required)
- `$FEATURE_DIR/plan.md` (required)
- `$FEATURE_DIR/design.md` (optional)
- Project constitution (auto-discovered)
- Development guide (auto-discovered)

**Workflow**:

```
/speckit.tasks → /speckit.verify-tasks → /speckit.implement
```

---

## Validation Criteria Reference

**Completeness** = Task has clear action, acceptance criteria, file paths, prerequisites, decisions

**Pattern Compliance** = Task follows project architecture patterns, no anti-patterns

**Dependency Order** = Task dependencies correct, no circular deps, topological order valid

**Ambiguity** = Task has single clear interpretation, all references resolved

**Coverage** = Task fully delivers targeted requirement, no partial implementation risk

**PASS** = All checks pass → READY status
**WARN** = Recommendations, non-blocking → CAUTION status
**FAIL** = Critical issue, must fix → BLOCKED status
