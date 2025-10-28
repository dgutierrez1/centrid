---
description: Refactor requirements across artifacts with natural language instructions (intelligent find/replace with impact analysis)
---

## User Input

```text
$ARGUMENTS
```

**⚠️ REQUIRED**: Refactor instruction required. If `$ARGUMENTS` is empty, ERROR: "Refactor instruction required. See examples below."

**Usage**:

```bash
/speckit.refactor "changing from claude agent sdk to direct api access, make sure aligned"
/speckit.refactor "check current embedding approach and evaluate changing to pinecone"
/speckit.refactor "add requirement for real-time collaboration with WebSocket"
/speckit.refactor "FR-003 needs streaming support"
/speckit.refactor "change from pgvector to pinecone" --dry-run
```

**Modes** (auto-detected from input):

- **CHANGE**: "changing X to Y", "replace X with Y", "switch from X to Y"
- **CHECK**: "check X", "evaluate Y", "what if we used Z" (read-only)
- **ADD**: "add X", "include Y", "support Z"
- **REFINE**: "FR-X needs Y", "improve X with Z", "X should also do Y"

**Flags**:

- `--dry-run`: Preview changes without modifying files (analysis only)

---

## Outline

1. **Parse Intent**: Extract action type, old/new approaches, target scope
2. **Detect Phase**: Check if tasks.md or implementation exists (impacts behavior)
3. **Load Artifacts**: Load all available documents (spec, arch, plan, tasks, etc.)
4. **Search & Disambiguate**: Find references with context awareness
5. **Complexity Analysis**: Detect if change is simple or requires rethinking
6. **Cascade Impact**: Identify downstream impacts beyond direct matches
7. **Generate Changes**: Show exact diffs for all modifications
8. **Confirmation Gate**: User approves changes (with dry-run option)
9. **Apply Changes**: Update all artifacts consistently
10. **Update Research Log**: Document decision rationale
11. **Validation**: Verify consistency and no orphaned references
12. **Report Summary**: Show what changed and next steps
13. **Smart Handoff**: Analyze impact → Recommend next command → Auto-cascade option

---

## Workflow

### Step 1: Parse Intent

**Extract from user input**:

Parse natural language to identify:

- **Action type**: CHANGE | ADD | CHECK | REFINE
- **Old approach**: Terms to search for (if CHANGE)
- **New approach**: Replacement text
- **Target scope**: Requirement ID, technology, feature area
- **Flags**: --dry-run, --files, etc.

**Examples**:

```
Input: "changing from claude agent sdk to direct api access"
→ Action: CHANGE
→ From: ["claude agent sdk", "sdk", "@anthropic/sdk"]
→ To: ["direct api access", "direct anthropic api", "api calls"]
→ Scope: AUTO (search all)

Input: "check current embedding approach"
→ Action: CHECK
→ Target: ["embedding", "vector", "pgvector", "similarity search"]
→ Scope: READ-ONLY (no modifications)

Input: "FR-003 needs streaming support"
→ Action: REFINE
→ Target: FR-003
→ Addition: "streaming support"
→ Scope: FR-003 + dependent sections

Input: "add real-time collaboration with websocket"
→ Action: ADD
→ New requirement: "real-time collaboration", "websocket"
→ Scope: Create new FR-XXX
```

**If input is ambiguous**:

```
Your input: "improve authentication"

⚠️ Input is ambiguous. What kind of improvement?
  1. Add 2FA/MFA to existing auth
  2. Change auth method (email/password → OAuth)
  3. Improve auth security (add rate limiting, etc.)
  4. Update auth documentation
  5. Let me rephrase

Please select: _
```

**Stop if no clear intent can be parsed**.

---

### Step 1.5: Detect Workflow Phase & Analyze Implementation

**Check current state**:

```bash
cd /Users/daniel/Projects/misc/centrid
.specify/scripts/bash/check-prerequisites.sh --json
```

**Parse AVAILABLE_DOCS** to determine phase:

| Phase            | Indicators                          | Impact                         |
| ---------------- | ----------------------------------- | ------------------------------ |
| **Requirements** | spec.md exists, no tasks.md         | SAFE - No downstream artifacts |
| **Architecture** | spec.md, arch.md exist, no tasks.md | SAFE - Can update freely       |
| **Planning**     | spec/arch/plan exist, no tasks.md   | SAFE - Can update freely       |
| **Planned**      | tasks.md exists, no implementation  | MEDIUM RISK - tasks outdated   |
| **Implemented**  | Code in apps/web or apps/api exists | HIGH RISK - code mismatch      |

**If tasks.md exists, analyze implementation approach**:

1. **Parse tasks.md** → Extract file paths, dependencies, implementation patterns
2. **Search codebase** → Find files mentioned in tasks
3. **Build implementation map** → Connect spec → tasks → code

```bash
# Example: Extract implementation details from tasks.md
# Look for: file paths (apps/web/..., apps/api/...), imports, function names
grep -E "apps/(web|api)" $FEATURE_DIR/tasks.md

# Search for old approach in code
grep -r "claude.*agent.*sdk" apps/web apps/api 2>/dev/null | head -5
```

**Phase-specific warnings**:

| Phase | Warning | Options |
|-------|---------|---------|
| **Planned** | ⚠️ tasks.md will be outdated | 1. Continue + regen tasks<br>2. Manual update<br>3. Cancel |
| **Implemented** | 🚨 Code mismatch (found X in Y files) | 1. Show impact<br>2. Continue (manual code refactor)<br>3. Cancel |

---

### Step 2: Load Artifacts

**Load required files**:

```bash
FEATURE_DIR="/Users/daniel/Projects/misc/centrid/specs/[feature]"
```

**Markdown documents** (prose search):

- `$FEATURE_DIR/spec.md` (REQUIRED)
- `$FEATURE_DIR/arch.md` (if exists in AVAILABLE_DOCS)
- `$FEATURE_DIR/ux.md` (if exists in AVAILABLE_DOCS)
- `$FEATURE_DIR/design.md` (if exists in AVAILABLE_DOCS)
- `$FEATURE_DIR/plan.md` (if exists in AVAILABLE_DOCS)
- `$FEATURE_DIR/tasks.md` (if exists in AVAILABLE_DOCS)
- `$FEATURE_DIR/data-model.md` (if exists in AVAILABLE_DOCS)
- `$FEATURE_DIR/quickstart.md` (if exists in AVAILABLE_DOCS)
- `$FEATURE_DIR/research.md` (if exists in AVAILABLE_DOCS)

**Structured files** (special parsing):

- `$FEATURE_DIR/contracts/*.json` (OpenAPI specs)
- `$FEATURE_DIR/contracts/*.graphql` (GraphQL schemas)

**Project-level files** (for ADD mode):

- `.specify/memory/constitution.md` (check for conflicts)

**If spec.md missing**: ERROR - Cannot proceed without requirements

**Build implementation map** (if tasks.md exists):

1. **Parse tasks.md** → Extract file paths mentioned (apps/web/*, apps/api/*)
2. **Extract dependencies** → Libraries, packages referenced
3. **Identify patterns** → Component names, function names, API endpoints
4. **Search codebase** → Check if files exist, grep for implementations

---

### Step 3: Search & Disambiguate

**Search for old approach** (if CHANGE/CHECK):

For each search term, find all occurrences:

```bash
# Example: Search for "claude agent sdk"
grep -n -i "claude agent sdk" $FEATURE_DIR/*.md
grep -n -i "sdk" $FEATURE_DIR/*.md
grep -n -i "@anthropic/sdk" $FEATURE_DIR/*.md
```

**If multiple contexts found** → Disambiguation prompt:

```
Multiple contexts for "SDK":
  1. Claude Agent SDK (5 refs)
  2. Stripe SDK (3 refs)
  3. Generic "SDK" (7 refs)
  4. All SDK (15 refs)
  5. Line-by-line selection

Select: _
```

**Build final change set**: Only confirmed references

---

### Step 3.5: Analyze Complexity

**Complexity scoring**:

```
Analyzing change complexity...

Change: "Claude Agent SDK" → "Direct Anthropic API"

Indicators:
✓ Same technology category (AI API)
✓ Direct replacement (SDK → API calls)
✓ No architecture paradigm shift
✗ Dependency changes required (@anthropic/sdk removal)
✗ Implementation approach changes (SDK methods → HTTP calls)

Complexity Score: MODERATE 🟡
```

**Complexity levels**:

- **SIMPLE** 🟢 (automated): Library version bumps, terminology fixes, single-field updates
- **MODERATE** 🟡 (automated with caution): Technology swaps (same category), dependency changes, multi-field updates
- **COMPLEX** 🟠 (requires review): Architecture changes (REST → GraphQL), data model restructuring, paradigm shifts
- **ARCHITECTURAL** 🔴 (manual redesign): Complete architecture pivot, technology stack changes, multi-system impacts

**If COMPLEX or ARCHITECTURAL**:

```
⚠️ COMPLEX CHANGE DETECTED

Your change: "Change from REST to GraphQL"
Complexity: COMPLEX 🟠

This change requires architectural rethinking:
- API contracts need restructuring (endpoints → queries/mutations)
- Error handling changes (HTTP codes → GraphQL errors)
- Authentication pattern changes (headers → context)
- Cannot be automated with simple find-replace

Recommendations:
  1. This might warrant a new feature spec (/speckit.specify for GraphQL API)
  2. Run /speckit.clarify to scope the REST→GraphQL migration
  3. Consider if this is a refactor or a new feature

Options:
  1. Continue (will update prose references, YOU redesign architecture)
  2. Analyze only (show impact, no modifications)
  3. Cancel (I'll handle this manually)

Select: _
```

---

### Step 3.6: Analyze Cascading Impacts (Including Code)

**Build dependency graph** - Identify impacts beyond direct matches:

```
Cascade Impact Analysis:

Direct (Specs): 5 refs in spec/arch/plan
Indirect (Specs): 3 areas need review
  - plan.md:234 Cost assumptions
  - arch.md:301 Error handling
  - tasks.md Dependent tasks

Code (if implemented): 3 files
  - apps/api/src/services/agent.ts (2 changes)
  - apps/web/src/lib/anthropic.ts (1 change)
  - package.json (1 removal)

Risk: MODERATE
```

**User confirmation**: `Show detailed impacts? (y/n): _`

---

### Step 3.7: Maintain Abstraction Boundaries

**CRITICAL**: Preserve document abstraction levels during refactoring.

| Document | Abstraction | Allowed | Forbidden | Example |
|----------|-------------|---------|-----------|---------|
| **spec.md** | Requirements | Business needs, user interactions | Code, libraries, technical details | ✅ "System shall support AI generation"<br>❌ "Use @anthropic/sdk" |
| **arch.md** | Architecture | Components, patterns, decisions | Code snippets, function signatures | ✅ "AgentService via HTTP client"<br>❌ "fetch('/v1/messages')" |
| **ux.md** | UX Flow | User actions, screen flows, states | Code implementation | ✅ "Click Submit → Loading → Success"<br>❌ "onClick handler" |
| **design.md** | Visual Design | Component props, visual states | Business logic, data fetching | ✅ "DocumentCard props: {title, status}"<br>❌ "Fetches from Supabase" |
| **plan.md** | Technical | Libraries, dependencies, approaches | Code implementation, variables | ✅ "Dependencies: fetch/axios"<br>❌ "const client = new..." |
| **tasks.md** | Implementation | Files, functions, code actions | N/A (regenerated) | Regenerated by /speckit.tasks |

**Enforcement**: Check abstraction level → Rephrase to match → Verify before showing user

---

### Step 4: Generate Changes

**For each reference, build exact diff**:

```
Proposed Changes (5 total):

spec.md (2):
  Line 42: "Claude Agent SDK" → "direct Anthropic API calls"
  Line 89: "SDK methods" → "SSE (Server-Sent Events)"

arch.md (2):
  Line 156: "integrates Claude Agent SDK" → "integrates with Anthropic API via HTTP client"
  Line 203: Update decision rationale (SDK → Direct API)

plan.md (1):
  Line 67: "@anthropic/sdk ^1.0.0" → "HTTP client (fetch/axios), @anthropic/types"

Summary: 5 changes, 3 docs | Complexity: MODERATE 🟡 | Phase: Planning (safe)
Indirect impacts: plan.md costs, arch.md error handling, tasks.md (regen needed)
```

---

### Step 5: Confirmation Gate

**If NOT dry-run**:

```
═══════════════════════════════════════════════════════
CONFIRMATION REQUIRED
═══════════════════════════════════════════════════════

Ready to apply 5 changes across 3 documents?

Changes:
✓ spec.md: Update FR-003 definition + acceptance criteria (2 changes)
✓ arch.md: Update architecture approach + decision log (2 changes)
✓ plan.md: Update dependencies (1 change)

This will:
- Change architectural direction: SDK → Direct API
- Update all references consistently
- Preserve requirement IDs and document structure
- Add decision rationale to arch.md

After changes:
⚠️ Manual review needed for 3 indirect impacts
⚠️ Recommend: /speckit.tasks regeneration (tasks.md outdated)

Options:
  1. Apply changes (yes)
  2. Show line-by-line diffs (details)
  3. Cancel (no)

Select: _
```

**If user selects "details"**: Show full diff for each change

**If --dry-run flag**:

```
═══════════════════════════════════════════════════════
DRY-RUN MODE (no changes will be applied)
═══════════════════════════════════════════════════════

Analysis complete:
✓ 5 changes identified across 3 documents
✓ 3 indirect impacts detected
✓ Complexity: MODERATE
✓ Phase: Planning (safe)

To apply changes: /speckit.refactor "same input without --dry-run"
```

**Exit after dry-run report**.

---

### Step 6: Apply Changes (Specs Only)

**For each change in change set**:

Use Edit tool for exact replacements (concise, precise changes only):

```
Applying specification changes...

[1/7] spec.md:42 - Update FR-003 (concise)... ✓
[2/7] arch.md:156 - Update API integration pattern... ✓
[3/7] ux.md:89 - No changes (flow unchanged) ⊘
[4/7] design.md:34 - No changes (UI unchanged) ⊘
[5/7] plan.md:67 - Update dependencies... ✓
[6/7] plan.md:203 - Update decision rationale... ✓
[7/7] research.md - Add decision log entry... ✓

Specification changes: 5/7 applied ✓
```

**Precision principle**: Changes must be:
- ✅ **Concise** - Update only what changed (single sentence, single section)
- ✅ **Precise** - Exact terminology, no unnecessary rewording
- ✅ **Targeted** - Affected sections only, preserve rest of document

**Example - Concise update**:

```
BAD (verbose):
  OLD: "System uses Claude SDK"
  NEW: "System uses direct Anthropic API integration with HTTP client for flexibility and control over streaming, error handling, and retry logic"

GOOD (concise):
  OLD: "System uses Claude SDK"
  NEW: "System uses direct Anthropic API"
```

**Error handling** (all-or-nothing):

If ANY edit fails:

```
❌ ERROR: Failed to apply change 3/7

File: arch.md:156
Error: Text not found (file may have changed)

Action: ROLLBACK
- Reverting change 1/7 (spec.md:42) ✓
- Reverting change 2/7 (arch.md:156) ✓

Status: No changes applied (rollback complete)

Recommendation:
  - Run /speckit.refactor with --dry-run to re-analyze
  - File may have been edited manually since analysis
```

**After spec changes, generate code refactor checklist** (see Step 6.5)

---

### Step 6.5: Generate Code Refactor Checklist

**If Phase = IMPLEMENTED** (code exists):

Generate actionable checklist in `specs/[feature]/refactor-checklist.md`:

```markdown
# Code Refactor Checklist: [Old] → [New]

## Dependencies
- [ ] Remove: npm uninstall [old-package]
- [ ] Add: npm install [new-package]
- [ ] Verify ENV: [required env vars]

## Code Changes
[For each file found in cascade analysis]
- [ ] apps/[path]/file.ts:line - [what to change]

## Testing
- [ ] Unit tests: [update mocks/assertions]
- [ ] Integration: [e2e verification]
- [ ] Error handling: [edge cases]

## Deployment
- [ ] Deploy: [command]
- [ ] Verify: [smoke test]

## Rollback
- [ ] Revert specs: git checkout HEAD -- specs/[feature]/*.md
- [ ] Restore code: git checkout HEAD -- [paths]
```

**If Phase = PLANNED**: Skip (code doesn't exist yet)

---

### Step 6.6: Update Research.md Decision Log

**If research.md exists**:

Generate concise decision entry:

```
Updating research.md decision log...

──────────────────────────────────────────────────────
## Decision: Claude SDK → Direct API

**Date**: 2025-01-26
**Decision**: Use direct Anthropic API instead of Claude SDK

**Rationale**: Need custom streaming control, SDK limiting flexibility

**Alternatives**:
1. Claude SDK - ✅ Simpler, ❌ Limited streaming
2. Direct API (chosen) - ✅ Full control, ❌ More complexity

**Impact**: arch.md, plan.md updated | Code refactor required (see refactor-checklist.md)
──────────────────────────────────────────────────────

Add to research.md? (yes/no/skip): _
```

---

### Step 7: Validation

**Run 3 validation checks**:

**Check 1: Orphan Detection**

Search for old approach terms that should no longer exist:

```
Validating: No orphaned references...

Searching for: ["claude agent sdk", "sdk" (context-aware), "@anthropic/sdk"]

✓ spec.md - No orphaned references
✓ arch.md - No orphaned references
✓ plan.md - No orphaned references
✗ tasks.md - 2 orphaned references found:
    Line 89: T015: Install Claude Agent SDK
    Line 94: T016: Implement AgentService with SDK
    → Expected: tasks.md not regenerated yet

Orphan Check: ⚠️ PARTIAL (tasks.md needs regeneration)
```

**Check 2: Consistency Verification**

```
Validating: Terminology consistency...

New approach: "Direct Anthropic API"

✓ spec.md uses "direct Anthropic API calls" (2 occurrences)
✓ arch.md uses "directly with Anthropic API" (1 occurrence)
✓ plan.md uses "direct API integration" (1 occurrence)

Terminology variants: All semantically consistent

Consistency Check: ✓ PASS
```

**Check 3: Structure Integrity**

```
Validating: Document structure...

spec.md:
✓ All requirement IDs preserved (FR-001 through FR-007)
✓ All sections present (Overview, Requirements, Acceptance Criteria)
✓ No broken markdown syntax

arch.md, plan.md: ✓ All sections preserved, no broken syntax

Structure Check: ✓ PASS
```

**Validation summary**:

```
Validation Results:
✓ Orphan Check: PARTIAL (tasks.md expected to be outdated)
✓ Consistency Check: PASS
✓ Structure Check: PASS

Overall: ✓ SAFE (expected warnings only)
```

**If critical validation fails**: Offer rollback options

---

### Step 8: Report Summary

```
✅ Refactoring Complete

═══════════════════════════════════════════════════════
Change Summary
═══════════════════════════════════════════════════════

Action: CHANGE
From: "Claude Agent SDK" → To: "Direct Anthropic API"

Specification Changes:
✓ spec.md - No changes (requirement unchanged)
✓ arch.md - 1 concise update (API integration pattern)
✓ ux.md - No changes (user flow unchanged)
✓ design.md - No changes (UI components unchanged)
✓ plan.md - 1 concise update (dependencies)
✓ research.md - 1 decision entry (rationale)

Total: 3 spec updates (concise, precise, targeted)

Code Impact Analysis:
✓ 3 backend files require manual refactoring
✓ 0 frontend files (uses Edge Functions)
✓ 1 dependency removal, 0 additions
✓ Refactor checklist: specs/[feature]/refactor-checklist.md

═══════════════════════════════════════════════════════
Validation
═══════════════════════════════════════════════════════

✓ No orphaned references to old approach
✓ Terminology consistent across specs
✓ Document structures preserved
✓ Abstraction boundaries maintained (spec, arch, ux, design, plan)
⚠️ tasks.md not regenerated (run /speckit.tasks)

═══════════════════════════════════════════════════════
Files Modified
═══════════════════════════════════════════════════════

Specifications:
  specs/[feature]/arch.md, plan.md, research.md

Generated:
  specs/[feature]/refactor-checklist.md (code refactor guide)

Review: git diff specs/[feature]/
```

---

### Step 8.5: Smart Handoff

**Analyze downstream impact**:

```bash
# Check what needs to happen next
if [ -f "$FEATURE_DIR/tasks.md" ]; then
  TASKS_OUTDATED=true
fi

if [ -d "apps/web" ] || [ -d "apps/api" ]; then
  CODE_EXISTS=true
fi
```

**Generate smart recommendations**:

```
═══════════════════════════════════════════════════════
Next Steps Recommendation
═══════════════════════════════════════════════════════

Impact Analysis:
✓ Specs updated (spec.md, arch.md, plan.md)
⚠️ tasks.md out of sync (references old approach)
⚠️ Code exists (manual refactor needed)

Recommended Actions:
1. MUST: Regenerate task list (/speckit.tasks)
   → Tasks currently reference old approach
   → New tasks will reflect updated plan.md dependencies

2. SHOULD: Validate task coverage (/speckit.verify-tasks)
   → Ensures tasks fully implement updated specs
   → Checks for gaps or missing steps

3. THEN: Apply code refactor (manual)
   → Follow refactor-checklist.md
   → Update implementation to match new approach

4. FINALLY: Implement updated tasks (/speckit.implement)
   → After code refactor complete
   → Executes validated task list

═══════════════════════════════════════════════════════
Auto-Cascade Options
═══════════════════════════════════════════════════════

What would you like to do?

1. Auto-cascade to /speckit.tasks (recommended)
   → Regenerates tasks.md with updated approach
   → Stops at next validation gate for review

2. Manual review first
   → Review git diff specs/[feature]/
   → Run /speckit.tasks when ready

3. Proceed to implementation
   → Skip task regeneration (not recommended)
   → Go directly to /speckit.implement

Select (1/2/3): _
```

**If user selects option 1**:

```
Running /speckit.tasks...
════════════════════════════════════════════════════════
```

(Execute `/speckit.tasks` directly, then stop for review)

**If user selects option 2**:

```
Manual review mode selected.

Next: Review changes then run /speckit.tasks
```

(Exit command)

**If user selects option 3**:

```
⚠️ WARNING: Proceeding without task regeneration

Tasks.md references old approach and will be inconsistent
with updated specs. This may cause implementation issues.

Confirm proceed to /speckit.implement? (yes/no): _
```

(If yes: run `/speckit.implement`, if no: exit)

---

## Mode-Specific Behaviors

| Mode | Triggers | Actions | Modifies Files? |
|------|----------|---------|-----------------|
| **CHANGE** | "changing X to Y", "replace X with Y" | Find all X → Replace with Y → Validate no orphans | ✅ Yes |
| **CHECK** | "check X", "how is X implemented" | Analyze spec → Parse tasks → Search code → Show traceability | ❌ No (read-only) |
| **ADD** | "add X", "include Y" | Generate next FR-XXX → Add to spec/arch/plan | ✅ Yes |
| **REFINE** | "FR-X needs Y", "improve X" | Find FR-X → Enhance requirements → Update downstream | ✅ Yes |

---

### Mode 2 Details: CHECK (Read-only with code traceability)

**Unique behavior**: Shows HOW feature is implemented (spec → tasks → code mapping)

**Output sections**:
1. **SPECIFICATION**: What should happen (from spec/arch/ux/design/plan)
2. **IMPLEMENTATION**: How it's built (from tasks.md + code search)
3. **SPEC ↔ CODE ALIGNMENT**: Traceability map (FR-XXX → file:line)
4. **POTENTIAL CHANGE IMPACT**: What would break if changed

**Suggest next command**: If user wants to proceed → `/speckit.refactor "change X to Y"`

---

## Safety Features

1. **Confirmation Gates**: Preview + confirm before modifying (after disambiguation, complexity analysis, phase detection, change generation)
2. **All-or-Nothing Updates**: If ANY change fails → rollback ALL previous changes (no partial/broken state)
3. **Validation After Changes**:
   - **Orphan check**: Old terms shouldn't exist
   - **Consistency check**: New terms uniform
   - **Structure check**: Files well-formed
4. **Read-Only Mode (CHECK)**: Analysis only, never modifies files
5. **Dry-Run Flag**: Shows everything except file modifications and confirmation prompts
6. **Phase-Aware Warnings**: Planning (SAFE) | Planned (MEDIUM RISK - tasks outdated) | Implemented (HIGH RISK - code mismatch)

---

## Key Rules

1. **Parse intent first**: Understand what user wants before searching
2. **Disambiguate**: Never assume if multiple contexts exist
3. **Complexity check**: Warn if change requires rethinking
4. **Cascade analysis**: Show downstream impacts
5. **Confirmation required**: Always show preview before modifying
6. **All-or-nothing**: Rollback if any change fails
7. **Validation mandatory**: Verify consistency after changes
8. **Research log**: Document WHY for architectural changes
9. **Phase-aware**: Behavior changes based on workflow phase
10. **Read-only CHECK**: CHECK mode never modifies files

---

## Integration Points

**Predecessor Commands**:

- `/speckit.specify` - Creates spec.md
- `/speckit.arch` - Creates arch.md
- `/speckit.plan` - Creates plan.md

**Can be run**:

- **During /speckit.plan Phase 0** - When research reveals need to change
- **After /speckit.clarify** - When clarifications require updates
- **Between any phases** - Ad-hoc requirement evolution
- **Any time** - Explore changes with CHECK mode

**Successor Commands**:

- `/speckit.tasks` - Regenerate with updated approach
- `/speckit.verify-tasks` - Validate coverage after regeneration

**Files Modified**:

- `$FEATURE_DIR/spec.md` (requirements - only if requirement changes)
- `$FEATURE_DIR/arch.md` (architecture - when patterns/decisions change)
- `$FEATURE_DIR/ux.md` (UX flows - only if user flow changes)
- `$FEATURE_DIR/design.md` (visual design - only if UI components change)
- `$FEATURE_DIR/plan.md` (technical approach - when tech/libraries change)
- `$FEATURE_DIR/research.md` (decision log)
- `$FEATURE_DIR/tasks.md` (may need regeneration after)

**Files Read**:

- All above + data-model.md, quickstart.md, contracts/

**Files Generated**:

- `$FEATURE_DIR/refactor-checklist.md` (code refactor guide, if Phase = IMPLEMENTED)

---

## Limitations

**Known limitations**:

1. **Feature-scoped**: Only updates current feature artifacts (not other features)
2. **Semantic understanding**: Can't verify if change makes logical sense (human reviews git diff)
3. **Sequential only**: One change at a time (run multiple times for related changes)
4. **Markdown-focused**: Limited support for complex structured files
5. **Code updates**: Does NOT update implementation code (use git/IDE for code refactoring)

**Mitigation**:

- Human reviews git diff before committing
- Use CHECK mode to explore before changing
- Run /speckit.verify-tasks after changes to validate coverage
- Use /speckit.analyze for cross-artifact consistency check

---

## Summary

**`/speckit.refactor`** provides intelligent requirement evolution with full implementation traceability:

✅ **Natural language interface** - Conversational input
✅ **Intent detection** - CHANGE | CHECK | ADD | REFINE
✅ **Implementation analysis** - Shows HOW features are/will be implemented
✅ **Spec → Code mapping** - Traces requirements to actual code
✅ **Context disambiguation** - Handles multiple meanings
✅ **Phase awareness** - Different behavior based on workflow state
✅ **Complexity analysis** - Warns when change needs rethinking
✅ **Cascade detection** - Finds downstream impacts (specs + code)
✅ **Concise updates** - Precise, targeted changes only
✅ **Abstraction boundaries** - Maintains proper abstraction levels (spec, arch, ux, design, plan)
✅ **Code refactor checklists** - Actionable code change guides
✅ **Research logging** - Documents WHY decisions changed (concise)
✅ **Safety gates** - Preview, confirm, validate, rollback
✅ **Dry-run mode** - Explore without modifying

**Use when**:

- Want to see how a feature is implemented ("check document upload")
- Research reveals need to change direction
- Requirements need evolution/refinement
- Want to explore impact of potential changes (specs + code)
- Need consistent updates across all artifacts (spec, arch, ux, design, plan)
- Need code refactor checklist for implementation changes
