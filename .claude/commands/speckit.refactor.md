---
description: Refactor requirements across artifacts with natural language instructions (intelligent find/replace with impact analysis)
---

## User Input

```text
$ARGUMENTS
```

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

### Step 1.5: Detect Workflow Phase

**Check current state**:

```bash
cd /Users/daniel/Projects/misc/centrid
.specify/scripts/bash/check-prerequisites.sh --json
```

**Parse AVAILABLE_DOCS** to determine phase:

| Phase | Indicators | Impact |
|-------|------------|--------|
| **Requirements** | spec.md exists, no tasks.md | SAFE - No downstream artifacts |
| **Architecture** | spec.md, arch.md exist, no tasks.md | SAFE - Can update freely |
| **Planning** | spec/arch/plan exist, no tasks.md | SAFE - Can update freely |
| **Planned** | tasks.md exists, no implementation | MEDIUM RISK - tasks outdated |
| **Implemented** | Code in apps/web or apps/api exists | HIGH RISK - code mismatch |

**Check for implementation** (if tasks.md exists):

```bash
# Search for old approach in code
grep -r "claude.*agent.*sdk" apps/web apps/api 2>/dev/null | head -5
```

**Phase-specific warnings**:

**If Phase = Planned**:
```
⚠️ WARNING: Workflow Phase = PLANNED (tasks.md exists)

Impact:
- Updating spec/arch/plan will make tasks.md outdated
- Tasks reference old approach and will be inconsistent

Options:
  1. Continue + regenerate tasks (/speckit.tasks after)
  2. Continue (I'll manually update tasks.md)
  3. Cancel

Your choice: _
```

**If Phase = Implemented**:
```
🚨 CRITICAL: Workflow Phase = IMPLEMENTED (code exists)

Found old approach in code:
  apps/api/src/services/agent.ts:12: import { Claude } from '@anthropic/sdk'
  apps/api/src/services/agent.ts:34: const client = new Claude()

Impact: HIGH RISK
- Changing specs creates spec-code mismatch
- Implementation uses old approach
- This is a CODE REFACTOR, not spec refactor

Recommendation:
  - Use git/IDE for code refactoring
  - This command updates specification documents only

Options:
  1. Show implementation impact (where old approach appears in code)
  2. Continue anyway (I understand code needs manual updates)
  3. Cancel

Your choice: _
```

---

### Step 2: Load Artifacts

**Load required files**:

```bash
FEATURE_DIR="/Users/daniel/Projects/misc/centrid/specs/[feature]"
```

**Markdown documents** (prose search):
- `$FEATURE_DIR/spec.md` (REQUIRED)
- `$FEATURE_DIR/arch.md` (if exists in AVAILABLE_DOCS)
- `$FEATURE_DIR/plan.md` (if exists in AVAILABLE_DOCS)
- `$FEATURE_DIR/tasks.md` (if exists in AVAILABLE_DOCS)
- `$FEATURE_DIR/design.md` (if exists in AVAILABLE_DOCS)
- `$FEATURE_DIR/data-model.md` (if exists in AVAILABLE_DOCS)
- `$FEATURE_DIR/quickstart.md` (if exists in AVAILABLE_DOCS)
- `$FEATURE_DIR/research.md` (if exists in AVAILABLE_DOCS)

**Structured files** (special parsing):
- `$FEATURE_DIR/contracts/*.json` (OpenAPI specs)
- `$FEATURE_DIR/contracts/*.graphql` (GraphQL schemas)

**Project-level files** (for ADD mode):
- `.specify/memory/constitution.md` (check for conflicts)

**If spec.md missing**: ERROR - Cannot proceed without requirements

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

**Build reference map**:
```
Found "SDK" in multiple contexts:

Context 1: Claude Agent SDK (5 references)
  spec.md:42: FR-003: System shall use Claude Agent SDK
  spec.md:89: SDK provides streaming capabilities
  arch.md:156: AgentService integrates Claude Agent SDK
  arch.md:203: Decision: SDK chosen for abstraction
  plan.md:67: Dependencies: @anthropic/sdk ^1.0.0

Context 2: Stripe SDK (3 references)
  spec.md:156: FR-008: Payment processing via Stripe SDK
  plan.md:234: Dependencies: stripe ^12.0.0
  tasks.md:45: T045: Install Stripe SDK

Context 3: Generic "SDK" mentions (7 references)
  arch.md:89: "SDKs provide abstraction layers"
  plan.md:12: "Evaluate SDK vs direct API trade-offs"
  [5 more in documentation/examples]
```

**Disambiguation prompt** (if multiple contexts):
```
Multiple contexts found for "SDK". Which to update?

  1. Only Claude Agent SDK (5 references)
  2. All SDK references (15 references)
  3. Show line-by-line selection (I'll choose each)
  4. Cancel (input was too broad)

Select: _
```

**If user selects 3**: Interactive selection for each reference (yes/no/skip-file)

**Build final change set**: Only references user confirmed

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

### Step 3.6: Analyze Cascading Impacts

**Build dependency graph**:

Identify impacts beyond direct text matches:

```
Cascade Impact Analysis:

Direct Impacts (5 references):
✓ spec.md:42 - FR-003 definition
✓ arch.md:156 - API architecture
✓ plan.md:67 - Dependencies section
✓ plan.md:122 - Research reference
✓ tasks.md:89 - Implementation task (if exists)

Indirect Impacts (3 areas):

1. plan.md:234 - Cost Assumptions ⚠️
   Current: "No external API costs (self-hosted SDK)"
   Impact: May no longer be accurate
   → Recommend: Review cost section

2. arch.md:301 - Error Handling Strategy ⚠️
   Current: "SDK provides automatic retries"
   Impact: Need custom retry logic with direct API
   → Recommend: Update error handling section

3. tasks.md:T015 - Dependent Tasks ⚠️
   Current: "T015: Install Claude SDK"
   Impact: Task becomes obsolete
   Dependent: T016, T017 reference T015
   → Recommend: Regenerate tasks after change

Cross-Document Dependencies:
✓ spec.md FR-003 → arch.md API Architecture
✓ arch.md API Architecture → plan.md Technical Approach
✓ plan.md Dependencies → tasks.md Setup Tasks

Total Impact:
- Direct changes: 5 across 4 documents
- Indirect impacts: 3 areas need manual review
- Dependent tasks: 2 tasks affected
```

**User confirmation**: `Show detailed indirect impacts? (yes/no/skip): _`

---

### Step 3.7: Maintain Abstraction Boundaries

**CRITICAL**: Each document has a specific abstraction level that MUST be preserved during refactoring.

**Document-Specific Language Rules**:

**spec.md** (Requirements Level):
- **Purpose**: What the system must do (outcomes, not implementation)
- **Language**: User-facing, technology-agnostic, "System shall..."
- **Allowed**: Business requirements, acceptance criteria, user interactions
- **Forbidden**: Implementation details, code patterns, specific libraries, function names

Examples:
```
❌ BAD: "System shall use fetch() with POST to /v1/messages endpoint"
✅ GOOD: "System shall integrate with AI service for content generation"

❌ BAD: "FR-003: Use @anthropic/sdk package for API calls"
✅ GOOD: "FR-003: System shall support AI-powered content generation"
```

**arch.md** (Architecture Level):
- **Purpose**: How the system is structured (patterns, components, decisions)
- **Language**: Component names, integration patterns, design decisions
- **Allowed**: Service names, data flows, architectural patterns, technology choices
- **Forbidden**: Code snippets, function signatures, variable names, line-by-line steps

Examples:
```
❌ BAD: "AgentService calls fetch('/v1/messages', { method: 'POST', body: JSON.stringify(payload) })"
✅ GOOD: "AgentService integrates with Anthropic API via HTTP client for message generation"

❌ BAD: "Use const response = await anthropic.messages.create()"
✅ GOOD: "AgentService orchestrates API calls with retry logic and error handling"
```

**plan.md** (Technical Approach Level):
- **Purpose**: What technologies and approaches will be used (how, at high level)
- **Language**: Libraries, frameworks, architectural patterns, trade-offs
- **Allowed**: Package names, dependencies, implementation strategies, technology comparisons
- **Forbidden**: Code implementation, specific variable names, function bodies

Examples:
```
❌ BAD: "const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })"
✅ GOOD: "Dependencies: HTTP client (fetch/axios), @anthropic/types for TypeScript type safety"

❌ BAD: "Create apiClient variable in src/lib/anthropic.ts with constructor"
✅ GOOD: "Technical Approach: Direct HTTP integration with Anthropic Messages API, using environment-based configuration"
```

**tasks.md** (Implementation Level):
- **Purpose**: Step-by-step code implementation instructions
- **Language**: Specific files, functions, code actions
- **Note**: This document is REGENERATED by /speckit.tasks (not directly modified by refactor)

**Enforcement During Change Generation**:

When generating changes in Step 4:
1. **Check current abstraction level** of target document
2. **Rephrase replacement text** to match that level
3. **Verify no abstraction violations** before showing to user

**Example Abstraction-Aware Refactoring**:

```
Input: "changing from claude agent sdk to direct api access"

spec.md Changes (Requirements Level):
  BEFORE: "System shall use Claude Agent SDK for AI operations"
  AFTER: "System shall use direct API integration for AI operations"
  ✅ Abstraction preserved: No mention of HTTP, fetch, or technical details

arch.md Changes (Architecture Level):
  BEFORE: "AgentService integrates Claude Agent SDK"
  AFTER: "AgentService integrates with Anthropic API via direct HTTP client"
  ✅ Abstraction preserved: Mentions HTTP client (architectural), not fetch() code

plan.md Changes (Technical Approach Level):
  BEFORE: "Dependencies: @anthropic/sdk ^1.0.0"
  AFTER: "Dependencies: HTTP client (fetch/axios), @anthropic/types for TypeScript"
  ✅ Abstraction preserved: Lists libraries, not implementation code
```

**Validation Check**:

After generating changes, verify:
- [ ] spec.md has NO library names, code patterns, or technical implementation details
- [ ] arch.md has NO code snippets, function calls, or variable names
- [ ] plan.md has NO code implementation, only technology choices and dependencies

**If abstraction violation detected**:
```
⚠️ ABSTRACTION VIOLATION DETECTED

Document: spec.md
Proposed change: "System shall use fetch() API with POST method"
Issue: Implementation detail (fetch() API call) in requirements document

Corrected: "System shall integrate with external AI service via API"

Abstraction level: ✅ FIXED
```

---

### Step 4: Generate Changes

**For each reference in change set, build exact diff**:

```
Proposed Changes (5 total):

═══════════════════════════════════════════════════════
spec.md (2 changes)
═══════════════════════════════════════════════════════

Line 42: FR-003: AI Agent Integration

CURRENT:
  System shall use Claude Agent SDK for AI interactions

PROPOSED:
  System shall use direct Anthropic API calls for AI interactions

CONTEXT:
  - Functional requirement for AI integration
  - Referenced by arch.md AgentService

───────────────────────────────────────────────────────

Line 89: Streaming Capabilities

CURRENT:
  Claude Agent SDK provides streaming capabilities via SDK methods

PROPOSED:
  Direct Anthropic API provides streaming capabilities via SSE (Server-Sent Events)

CONTEXT:
  - Acceptance criteria for FR-003
  - Affects implementation approach

═══════════════════════════════════════════════════════
arch.md (2 changes)
═══════════════════════════════════════════════════════

[Line 156] AgentService Architecture
  CURRENT: AgentService integrates Claude Agent SDK for AI operations
  PROPOSED: AgentService integrates directly with Anthropic API using HTTP client for AI operations

[Line 203] Architectural Decision
  CURRENT: Decision: Claude Agent SDK chosen for abstraction layer
           Rationale: Reduces implementation complexity
  PROPOSED: Decision: Direct Anthropic API chosen for maximum flexibility
            Rationale: SDK limitations for custom streaming handling
            Trade-off: Increased implementation complexity for control

═══════════════════════════════════════════════════════
plan.md (1 change)
═══════════════════════════════════════════════════════

[Line 67] Dependencies
  CURRENT: Dependencies: @anthropic/sdk ^1.0.0
  PROPOSED: Dependencies: HTTP client (fetch/axios), @anthropic/types for TypeScript

═══════════════════════════════════════════════════════
Summary
═══════════════════════════════════════════════════════

Total Changes: 5 across 3 documents
Complexity: MODERATE 🟡
Phase: Planning (safe to proceed)

Indirect Impacts (manual review needed):
  ⚠️ plan.md cost assumptions
  ⚠️ arch.md error handling strategy
  ⚠️ tasks.md (regenerate recommended)
```

**Structured file changes** (if applicable): Show similar format for JSON/GraphQL files

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

### Step 6: Apply Changes

**For each change in change set**:

Use Edit tool for exact replacements:

```
Applying changes...

[1/5] spec.md:42 - Updating FR-003 definition... ✓
[2/5] spec.md:89 - Updating streaming capabilities... ✓
[3/5] arch.md:156 - Updating AgentService architecture... ✓
[4/5] arch.md:203 - Updating architectural decision... ✓
[5/5] plan.md:67 - Updating dependencies... ✓

Changes applied: 5/5 ✓
```

**Error handling** (all-or-nothing):

If ANY edit fails:
```
❌ ERROR: Failed to apply change 3/5

File: arch.md:156
Error: Text not found (file may have changed)

Action: ROLLBACK
- Reverting change 1/5 (spec.md:42) ✓
- Reverting change 2/5 (spec.md:89) ✓

Status: No changes applied (rollback complete)

Recommendation:
  - Run /speckit.refactor with --dry-run to re-analyze
  - File may have been edited manually since analysis
```

---

### Step 6.5: Update Research.md Decision Log

**If plan.md exists AND has research.md**:

Generate decision entry:

```
Updating research.md decision log...

Adding decision entry:

──────────────────────────────────────────────────────
## Decision: Changed from Claude Agent SDK to Direct API

**Date**: 2025-01-26
**Context**: During requirements refinement, identified need for custom streaming control
**Decision**: Use direct Anthropic API calls instead of Claude Agent SDK

**Alternatives Considered**:

1. Claude Agent SDK (@anthropic/sdk)
   - ✅ Simpler integration with abstraction layer
   - ✅ Built-in retry logic and error handling
   - ❌ Limited streaming customization
   - ❌ Cannot customize retry behavior for specific errors

2. Direct Anthropic API (CHOSEN)
   - ✅ Full control over streaming implementation
   - ✅ Custom error handling and retry logic
   - ✅ Direct access to all API features
   - ❌ More implementation complexity
   - ❌ Need to build retry logic manually

**Rationale**:
SDK limitations discovered during architecture phase:
- Custom streaming handlers required for UI responsiveness
- Need fine-grained error handling for different failure modes
- Flexibility > simplicity for AI-critical feature

**Consequences**:

Technical:
- Dependency changes: Remove @anthropic/sdk, add HTTP client + types
- Implementation complexity increases (build retry logic, error handling)
- More control over AI interactions and streaming behavior

Architectural:
- AgentService implementation approach updated
- Error handling strategy needs explicit design
- Testing strategy changes (mock HTTP calls vs SDK)

Documentation:
- spec.md FR-003 updated
- arch.md API Architecture updated
- plan.md dependencies updated

**Next Steps**:
- Update error handling strategy in arch.md
- Design custom retry logic
- Update tasks.md when generated (/speckit.tasks)

**Updated Artifacts**:
- specs/[feature]/spec.md (FR-003)
- specs/[feature]/arch.md (API Architecture + Decision Log)
- specs/[feature]/plan.md (Dependencies)
──────────────────────────────────────────────────────

Add to research.md? (yes/no/edit): _
```

**If user says "edit"**: Open interactive editor to refine before adding

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

Changes Applied:
✓ spec.md - 2 changes (FR-003 definition + acceptance criteria)
✓ arch.md - 2 changes (architecture approach + decision log)
✓ plan.md - 1 change (dependencies)

Total: 5 changes across 3 documents

═══════════════════════════════════════════════════════
Validation
═══════════════════════════════════════════════════════

✓ No orphaned references to old approach (spec, arch, plan)
✓ Terminology consistent across all updated documents
✓ All document structures preserved
⚠️ tasks.md has 2 orphaned references (expected - not regenerated)

═══════════════════════════════════════════════════════
Decision Log
═══════════════════════════════════════════════════════

✓ research.md updated with decision rationale
  - Alternatives considered documented
  - Trade-offs explicitly stated
  - Consequences tracked

═══════════════════════════════════════════════════════
Impact
═══════════════════════════════════════════════════════

Phase: Planning (SAFE - no implementation yet)
Complexity: MODERATE
Risk: LOW

Architectural Direction: Changed ✓
Dependencies: Updated ✓
Decision Rationale: Documented ✓

Indirect Impacts (manual review recommended):
  ⚠️ plan.md:234 - Cost assumptions may need update
  ⚠️ arch.md:301 - Error handling strategy needs update
  ⚠️ Review these sections manually

═══════════════════════════════════════════════════════
Next Steps
═══════════════════════════════════════════════════════

Immediate:
  1. Review changes: git diff
  2. Review indirect impacts (3 areas flagged above)
  3. Update error handling strategy in arch.md (manual)

Before tasks:
  4. If plan.md incomplete: Continue /speckit.plan
  5. Regenerate tasks: /speckit.tasks
     → Will use new "Direct API" approach
     → Old T015, T016 will be replaced

Validation:
  6. After tasks regenerated: /speckit.verify-tasks
     → Validates full requirement coverage

═══════════════════════════════════════════════════════
Files Modified
═══════════════════════════════════════════════════════

specs/[feature]/spec.md
specs/[feature]/arch.md
specs/[feature]/plan.md
specs/[feature]/research.md (decision log)

Review: git diff specs/[feature]/
```

---

## Mode-Specific Behaviors

### Mode 1: CHANGE (Replace existing)

**Triggers**: "changing X to Y", "replace X with Y", "switch from X to Y"

**Workflow**:
1. Find all references to X (with context disambiguation)
2. Analyze cascading impacts
3. Generate replacements with Y
4. Update decision rationale (add WHY to arch.md/research.md)
5. Validate no orphaned X references
6. Report summary with next steps

---

### Mode 2: CHECK (Read-only analysis)

**Triggers**: "check X", "what if we used Y", "evaluate Z"

**Workflow**:
1. Find all references to current approach
2. Show impact of potential change
3. Analyze complexity
4. Identify cascading impacts
5. **NO MODIFICATIONS** (read-only)
6. Suggest next command if user wants to proceed

**Example Output**:
```
═══════════════════════════════════════════════════════
Current Approach Analysis: Embedding Storage
═══════════════════════════════════════════════════════

Current Approach: pgvector (PostgreSQL extension)

Found: 8 references across 4 documents

spec.md:
  Line 67: NFR-002: Use pgvector for similarity search
  Line 92: Vector embeddings stored in PostgreSQL

arch.md:
  Line 234: Data Architecture → pgvector extension for vectors
  Line 301: Decision: pgvector chosen for cost (no external service)

[Additional references...]

═══════════════════════════════════════════════════════
Current Rationale (from arch.md)
═══════════════════════════════════════════════════════

Decision: pgvector for vector storage
Pros: ✓ No additional service cost, ✓ Data locality, ✓ Simple deployment
Cons: ✗ Limited to cosine similarity, ✗ No metadata filtering

═══════════════════════════════════════════════════════
Potential Change Impact
═══════════════════════════════════════════════════════

If changed to Pinecone:
  - Complexity: MODERATE
  - Affected: 8 references across 4 documents
  - Cascading: Cost model, query architecture, data model
  - Risk: Medium (data migration needed)

If enhanced with metadata filtering (keep pgvector):
  - Complexity: SIMPLE
  - Affected: Query architecture only
  - No migration needed

═══════════════════════════════════════════════════════
Recommendation
═══════════════════════════════════════════════════════

Current approach: Suitable for MVP
Consider change IF:
  - Need advanced filtering (metadata queries)
  - Need hybrid search (vector + keyword)
  - Need better scale (>1M vectors)

To proceed with change:
  /speckit.refactor "change from pgvector to pinecone with metadata filtering"
```

---

### Mode 3: ADD (New requirement)

**Triggers**: "add X", "include Y", "support Z"

**Workflow**:
1. Generate next requirement ID (scan spec.md for last FR-XXX)
2. Add to spec.md in appropriate section
3. Add to arch.md (architecture implications)
4. Add to plan.md (if exists - implementation approach)
5. **Skip tasks.md** (requires /speckit.tasks regeneration)
6. Log decision in research.md (optional)

**Example Output**:
```
═══════════════════════════════════════════════════════
Adding New Requirement
═══════════════════════════════════════════════════════

Next available ID: FR-008
Requirement: Real-time collaboration with WebSocket support

Generating additions...

spec.md - New requirement:
  ### FR-008: Real-Time Collaboration
  **Description**: System shall support real-time collaboration using WebSocket connections
  **Requirements**:
  - Multiple users can edit documents simultaneously
  - Changes propagate to all connected clients within 100ms
  - Conflict resolution using Operational Transformation (OT)
  - Presence indicators show active users per document
  [Acceptance criteria...]

arch.md - Architecture additions:
  #### WebSocket Endpoints
  - `/ws/document/:id` - Document collaboration channel
  - Events: join, leave, edit, cursor-move, presence
  - Authentication: JWT token in connection handshake
  - Conflict resolution: Operational Transformation

plan.md - Implementation approach:
  **Real-Time Collaboration**:
  - Dependencies: `ws`, `ot.js` or `yjs`
  - Architecture: WebSocket server in Edge Functions or separate service
  - Considerations: Connection limits, reconnection handling

═══════════════════════════════════════════════════════
Confirmation
═══════════════════════════════════════════════════════

Add FR-008 with architecture and implementation plan? (yes/no/edit)

If yes:
  - spec.md: Add requirement
  - arch.md: Add WebSocket architecture
  - plan.md: Add dependencies + approach
  - research.md: Log decision to add feature (optional)
```

---

### Mode 4: REFINE (Enhance existing)

**Triggers**: "FR-X needs Y", "improve X with Z", "X should also do Z"

**Workflow**:
1. Find requirement by ID or description
2. Add enhancement to existing requirement text
3. Update dependent sections in arch.md, plan.md
4. Preserve original requirement structure (ID, priority)
5. Log enhancement rationale

**Example Output**:
```
═══════════════════════════════════════════════════════
Refining Existing Requirement
═══════════════════════════════════════════════════════

Found: FR-003 in spec.md (line 42)
Current: FR-003: AI Agent Integration - System shall use direct Anthropic API calls
Enhancement: Add streaming support with progress indicators

Proposed Changes:

spec.md (line 42):
  CURRENT: FR-003: AI Agent Integration
           System shall use direct Anthropic API calls for AI interactions

  PROPOSED: FR-003: AI Agent Integration (Enhanced)
            System shall use direct Anthropic API calls with streaming support

            **Streaming Requirements**:
            - Responses stream via Server-Sent Events (SSE)
            - Partial results displayed as generated
            - Progress indicators show generation status
            - Maximum latency to first token: 500ms

            **Progress Indicators**:
            - Percentage complete (0-100%)
            - Current operation (e.g., "Analyzing context")
            - Estimated time remaining

arch.md (line 156):
  ADDS: **Streaming Implementation**:
        - SSE protocol for real-time response streaming
        - Buffers partial responses for client consumption
        - Emits progress events (percentage, operation, eta)
        - Client-side: EventSource API for SSE consumption

plan.md (new section):
  ADDS: **Streaming Architecture**:
        - Backend: Implement SSE endpoint for AI streaming
        - Frontend: EventSource API for consuming streams
        - Progress tracking: Parse token counts, estimate completion

═══════════════════════════════════════════════════════
Confirmation
═══════════════════════════════════════════════════════

Apply enhancements to FR-003? (yes/no/edit)
```

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
- `$FEATURE_DIR/spec.md` (requirements)
- `$FEATURE_DIR/arch.md` (architecture)
- `$FEATURE_DIR/plan.md` (technical approach)
- `$FEATURE_DIR/research.md` (decision log)
- `$FEATURE_DIR/tasks.md` (may need regeneration after)

**Files Read**:
- All above + design.md, data-model.md, quickstart.md, contracts/

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

**`/speckit.refactor`** provides intelligent requirement evolution:

✅ **Natural language interface** - Conversational input
✅ **Intent detection** - CHANGE | CHECK | ADD | REFINE
✅ **Context disambiguation** - Handles multiple meanings
✅ **Phase awareness** - Different behavior based on workflow state
✅ **Complexity analysis** - Warns when change needs rethinking
✅ **Cascade detection** - Finds downstream impacts
✅ **Research logging** - Documents WHY decisions changed
✅ **Safety gates** - Preview, confirm, validate, rollback
✅ **Dry-run mode** - Explore without modifying

**Use when**:
- Research reveals need to change direction
- Requirements need evolution/refinement
- Want to explore impact of potential changes
- Need consistent updates across all artifacts
