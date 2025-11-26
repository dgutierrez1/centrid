---
description: Generate standardized, idempotent context document for any feature in the codebase
category: project
---

# Feature Context Capture

Generate token-efficient context summaries for any feature (completed, in-progress, or planned).

## User Input

```text
$ARGUMENTS
```

## Overview

This command creates compressed context documents (`context.md`) that provide 95-98% token reduction compared to full feature documentation. Context files are idempotent, standardized, and can be loaded quickly for understanding features before modifications.

**Features:**
- Works for any feature (not just current branch)
- Multiple input formats (auto-detect, number, keyword, full name)
- Idempotent regeneration (same source → same output)
- Optional feature command generation (e.g., `/feature.filesystem`)
- Version tracking based on source doc hashes

## Outline

### Phase 1: Feature Discovery

1. **Parse user input** from `$ARGUMENTS`:
   - Empty/no args → Auto-detect from current branch
   - `--list` → List all features with cache status
   - Number (e.g., `004`) → Match by feature number
   - Keyword (e.g., `filesystem`) → Fuzzy match feature name
   - Full name (e.g., `004-ai-agent-system`) → Exact match

2. **Discover all features**:
   ```bash
   # Find all feature directories
   find specs -maxdepth 1 -type d -name '[0-9][0-9][0-9]-*' | sort
   ```

3. **Match requested feature**:
   - **Auto-detect**: Run `check-prerequisites.sh --json` to get current feature
   - **Number match**: Find directory starting with `###-`
   - **Keyword match**: Fuzzy match against directory names (lowercase, partial match)
   - **Full name match**: Exact directory name match

4. **Validate feature exists**:
   - Check `specs/###-feature-name/` directory exists
   - Check required docs exist (`spec.md` and `plan.md` minimum)
   - Error with suggestions if feature not found

5. **Handle `--list` flag**:
   ```markdown
   Available features in codebase:

   - **001-backend-mvp-setup** [✅ cached] → `/feature.backend-mvp`
   - **002-mvp-account-foundation** [✅ cached] → `/feature.account`
   - **003-filesystem-mvp** [✅ cached] → `/feature.filesystem`
   - **004-ai-agent-system** [⬜ uncached]
   - **005-permissions-system** [⬜ uncached]

   Run `/speckit.context [feature]` to generate/load context
   ```

### Phase 2: Discover Code Implementation State

1. **Run enhanced code discovery script**:
   ```bash
   # Discover actual code implementation (hooks, services, repositories, etc.)
   .specify/scripts/context/discover-code-state.sh --feature-dir="specs/$FEATURE_DIR" > /tmp/code-state.json
   ```

2. **Extract code discovery data from JSON**:
   ```bash
   # Parse JSON output to extract:
   # - layers: {ui_components: [...], hooks: [...], services: [...], repositories: [...]}
   # - signatures: {hooks: [{file, line, signature}], services: [{file, line, signature}]}
   # - dependencies: {file_path: [imports]}
   # - data_flows: [{entry, calls, type}]
   # - database_tables: [...]
   CODE_STATE=$(cat /tmp/code-state.json)
   ```

3. **Calculate code discovery hash**:
   ```bash
   # Hash the discovered code state for idempotence tracking
   CODE_HASH=$(echo "$CODE_STATE" | shasum -a 256 | cut -d' ' -f1)
   ```

4. **Count files per layer** for architecture overview:
   ```bash
   # Extract counts from JSON
   UI_COUNT=$(echo "$CODE_STATE" | jq '.layers.ui_components | length')
   HOOKS_COUNT=$(echo "$CODE_STATE" | jq '.layers.hooks | length')
   SERVICES_COUNT=$(echo "$CODE_STATE" | jq '.layers.services | length')
   REPOS_COUNT=$(echo "$CODE_STATE" | jq '.layers.repositories | length')
   TABLES_COUNT=$(echo "$CODE_STATE" | jq '.database_tables | length')
   ```

### Phase 2.5: Load Spec Metadata (Brief)

1. **Detect available source docs** in feature directory:
   - ✅ Required: `spec.md`, `plan.md`
   - 📄 Optional: `ux.md`, `design.md`, `data-model.md`, `research.md`, `tasks.md`, `contracts/`

2. **Read ONLY quick summary and user story titles** (minimal extraction):
   ```bash
   # Extract first paragraph from spec.md (quick summary)
   QUICK_SUMMARY=$(head -50 specs/$FEATURE_DIR/spec.md | grep -A 5 "^#" | head -10)

   # Extract user story titles only (not full descriptions)
   USER_STORY_TITLES=$(grep -E "^##\s+(US-|User Story)" specs/$FEATURE_DIR/spec.md | sed 's/^##\s*//')

   # Extract tech decision headings from plan.md
   TECH_DECISIONS=$(grep -E "^##\s+|^###\s+" specs/$FEATURE_DIR/plan.md | head -10)
   ```

3. **Calculate source hash** for idempotence:
   ```bash
   # Hash all source docs together
   SOURCE_HASH=$(cat specs/$FEATURE_DIR/{spec,plan,ux,design,data-model}.md 2>/dev/null | shasum -a 256 | cut -d' ' -f1)
   ```

4. **Check if context needs regeneration** (dual hash check):
   ```bash
   # If context.md exists, check if EITHER source hash OR code hash changed
   if [ -f specs/$FEATURE_DIR/context.md ]; then
     EXISTING_SOURCE_HASH=$(grep "^source_hash:" specs/$FEATURE_DIR/context.md | cut -d'"' -f2)
     EXISTING_CODE_HASH=$(grep "^code_discovery_hash:" specs/$FEATURE_DIR/context.md | cut -d'"' -f2)

     if [ "$SOURCE_HASH" == "$EXISTING_SOURCE_HASH" ] && [ "$CODE_HASH" == "$EXISTING_CODE_HASH" ]; then
       echo "✅ Context is up-to-date (source docs and code unchanged)"
       echo "📄 Load with: cat specs/$FEATURE_DIR/context.md"
       exit 0
     fi
   fi
   ```

### Phase 3: Generate Implementation-First Context

Use the **implementation-first context template** that prioritizes actual code over spec documentation.

#### Section 1: Implementation State (Primary Source - ~1,200 tokens)

**From code discovery JSON:**

1. **Architecture Overview** (~100 tokens):
   - Use layer counts from Phase 2:
     ```markdown
     **Layer Distribution:**
     - UI: {UI_COUNT} components ({CONTAINER_COUNT} containers, {PRESENTER_COUNT} presenters)
     - State Management: {HOOKS_COUNT} hooks, {STORES_COUNT} stores
     - Backend: {SERVICES_COUNT} services, {REPOS_COUNT} repositories
     - Database: {TABLES_COUNT} tables
     ```

2. **UI Layer** (~300 tokens):
   - List each component file with size and key functions
   - Include file:line references from signatures
   - Show event handlers and dependencies

3. **State Management Layer** (~300 tokens):
   - List hooks with function signatures (from signatures.hooks)
   - Show GraphQL operations used (from data_flows)
   - Show dependencies (from dependencies map)

4. **Backend Services Layer** (~300 tokens):
   - List services with method signatures (from signatures.services)
   - Show repository calls (from data_flows)

5. **Data Access Layer** (~300 tokens):
   - List repositories with methods
   - List database tables from schema.ts with line numbers
   - Show key fields and RLS policies

#### Section 2: Data Flows (Traced from Code - ~400 tokens)

**From data_flows array:**

1. **Primary Flow** (main user interaction):
   - Trace: Component → Hook → GraphQL → Service → Repository → Database
   - Include file:line references for each step
   - Show 1-2 primary flows only

2. **Format:**
   ```markdown
   **Flow:**
   1. hookName.methodName(params)              [hookName.ts:lineN]
   2. └─> graphqlClient.mutation(DocumentName) [hookName.ts:lineM]
   3.     └─> serviceName.method(input)        [serviceName.ts:lineP]
   4.        └─> repositoryName.create(data)   [repositoryName.ts:lineQ]
   ```

#### Section 3: Spec Reference (Brief - ~200 tokens)

**From spec.md and plan.md (minimal extraction):**

1. **Quick Summary** (~50 tokens):
   - First paragraph from spec.md only

2. **User Stories** (~100 tokens):
   - Extract titles only (not full descriptions)
   - Add implementation status based on code discovery:
     - ✅ Implemented: Hook + service + UI found
     - 🟡 Partial: Some files found
     - ❌ Missing: No related code found

3. **Tech Decisions** (~50 tokens):
   - Extract headings only from plan.md
   - Link to full plan.md for details

#### Section 4: Gap Analysis (~200 tokens)

**Compare code discovery vs spec user stories:**

1. **Fully Implemented** ✅:
   - Features with complete hook + service + UI chain
   - List actual files as proof

2. **Partially Implemented** 🟡:
   - Features with some files but missing pieces
   - Specify what exists and what's missing

3. **Missing Implementation** ❌:
   - User stories with no discovered code
   - List as blockers or planned work

**Drop from spec extraction:**
- Full scenario descriptions
- Detailed acceptance criteria
- Examples and mockups
- Background/context sections
- All verbose requirement details
- Component prop interfaces
- Screen-by-screen walkthroughs
- Screenshots and images

### Phase 4: Generate Context Document

1. **Determine feature metadata**:
   ```bash
   FEATURE_NUMBER=$(echo $FEATURE_DIR | cut -d'-' -f1)
   FEATURE_SHORT_NAME=$(echo $FEATURE_DIR | cut -d'-' -f2- | tr '-' ' ' | awk '{print tolower($0)}' | tr ' ' '-')
   FEATURE_NAME=$(echo $FEATURE_DIR | cut -d'-' -f2- | tr '-' ' ' | sed 's/\b\(.\)/\u\1/g')
   ```

2. **Detect feature status**:
   ```bash
   # Check if feature branch exists
   if git branch -a | grep -q "/$FEATURE_DIR\$"; then
     STATUS="in-progress"
     BRANCH=$(git branch -a | grep "/$FEATURE_DIR\$" | head -1 | sed 's/.*\///')
   # Check if tasks.md shows completion
   elif grep -q "✅.*100%" specs/$FEATURE_DIR/tasks.md 2>/dev/null; then
     STATUS="completed"
     BRANCH="merged"
   else
     STATUS="planned"
     BRANCH="none"
   fi
   ```

3. **Determine version** (dual hash tracking):
   ```bash
   # If context.md exists and EITHER hash changed, bump minor version
   if [ -f specs/$FEATURE_DIR/context.md ]; then
     CURRENT_VERSION=$(grep "^version:" specs/$FEATURE_DIR/context.md | cut -d'"' -f2)
     EXISTING_SOURCE_HASH=$(grep "^source_hash:" specs/$FEATURE_DIR/context.md | cut -d'"' -f2)
     EXISTING_CODE_HASH=$(grep "^code_discovery_hash:" specs/$FEATURE_DIR/context.md | cut -d'"' -f2)

     MAJOR=$(echo $CURRENT_VERSION | cut -d'.' -f1)
     MINOR=$(echo $CURRENT_VERSION | cut -d'.' -f2)
     PATCH=$(echo $CURRENT_VERSION | cut -d'.' -f3)

     # Bump minor version if EITHER hash changed
     if [ "$SOURCE_HASH" != "$EXISTING_SOURCE_HASH" ] || [ "$CODE_HASH" != "$EXISTING_CODE_HASH" ]; then
       MINOR=$((MINOR + 1))
       VERSION="$MAJOR.$MINOR.0"
     else
       # No changes, keep same version
       VERSION="$CURRENT_VERSION"
     fi
   else
     VERSION="1.0.0"
   fi
   ```

4. **Generate context.md using implementation-first template**:
   - Fill in YAML frontmatter with metadata (including code_discovery_hash)
   - Populate Implementation State section from code discovery JSON
   - Populate Data Flows section from data_flows array
   - Populate Spec Reference section (brief, ~200 tokens)
   - Populate Gap Analysis section (code vs spec comparison)
   - Calculate token estimate (rough: character count / 4)
   - Write to `specs/$FEATURE_DIR/context.md`

5. **Validate output**:
   - Check context.md was created
   - Verify token estimate is within target (2000-2500 tokens)
   - Confirm all required sections present
   - Verify file:line references are included

### Phase 5: Report and Offer Feature Command Generation

1. **Report generation results**:
   ```markdown
   ✅ Context generated: specs/004-ai-agent-system/context.md
   📊 Token estimate: 2,834 tokens
   📊 Compression: 96.5% (82,000 → 2,834 tokens)
   📋 Version: 1.1.0 (source docs OR code modified)
   📄 Source docs: spec.md, plan.md, ux.md, design.md, data-model.md
   💻 Code discovered: 11 hooks, 4 services, 8 repositories, 37 UI components
   🔗 Source hash: a8f3e2c1...
   🔗 Code hash: d4f5b8a2...
   ```

2. **Ask about feature command generation**:
   ```text
   Generate `/feature.$FEATURE_SHORT_NAME` command for quick context loading?

   This creates a shortcut command that you can use anytime to load this feature's context.

   [yes] [no]
   ```

3. **If yes, generate feature command**:
   - Read template from `.specify/templates/feature-command-template.md`
   - Replace placeholders:
     - `{{FEATURE_NAME}}` → Full feature name
     - `{{FEATURE_DIR}}` → Feature directory name
     - `{{FEATURE_NUMBER_OR_NAME}}` → Short name for regeneration
     - `{{PROJECT_ROOT}}` → Absolute project root path
   - Write to `.claude/commands/feature.$FEATURE_SHORT_NAME.md`
   - Report:
     ```markdown
     ✅ Feature command created: .claude/commands/feature.$FEATURE_SHORT_NAME.md
     🚀 Load context anytime with: `/feature.$FEATURE_SHORT_NAME`
     ```

4. **Final instructions**:
   ```markdown
   ## Next Steps

   **Load context:**
   - Run `/feature.$FEATURE_SHORT_NAME` (if command generated)
   - Or read directly: `cat specs/$FEATURE_DIR/context.md`

   **Regenerate context** if source docs change:
   - Run `/speckit.context $FEATURE_SHORT_NAME`

   **Modify feature** with full context:
   - Load context first, then make informed changes
   - Context provides 95%+ token savings vs full docs
   ```

## Error Handling

**Feature not found:**
```markdown
❌ Feature not found: "$ARGUMENTS"

Did you mean one of these?
- 003-filesystem-mvp (filesystem)
- 004-ai-agent-system (ai-agent, agent)

Available features:
[List all features with numbers and short names]

Usage:
- /speckit.context                  # Auto-detect from branch
- /speckit.context 004              # By number
- /speckit.context filesystem       # By keyword
- /speckit.context 003-filesystem-mvp  # By full name
- /speckit.context --list           # List all features
```

**Missing required docs:**
```markdown
❌ Feature found but missing required documentation

Feature: specs/004-ai-agent-system/
Missing: spec.md, plan.md

Context generation requires at minimum:
- spec.md (requirements)
- plan.md (technical approach)

Create these docs first or run:
- /speckit.specify  # Generate spec.md
- /speckit.plan     # Generate plan.md
```

**Empty source docs:**
```markdown
⚠️  Warning: Source docs exist but are mostly empty

Feature: specs/004-ai-agent-system/
Empty/minimal docs: spec.md (12 lines), plan.md (8 lines)

Generated context will be minimal. Consider running:
- /speckit.specify  # Expand spec.md
- /speckit.plan     # Expand plan.md
```

## Idempotence Guarantee (Dual Hash Tracking)

**Same source docs AND code → Same output:**
- Both hashes unchanged → Skip regeneration
- No version bump if content identical
- Report: "✅ Context is up-to-date (source docs and code unchanged)"

**Modified source docs OR code → Updated output:**
- Source hash changed → Regenerate (spec reference section)
- Code hash changed → Regenerate (implementation state section)
- EITHER hash changed → Version bump (minor increment)
- Report: "📋 Version: 1.0.0 → 1.1.0 (source docs OR code modified)"

**Version bumping rules:**
- **MAJOR (X.0.0)**: Breaking changes to feature architecture or data model
- **MINOR (0.X.0)**: Source docs OR code state modified (either hash changed)
- **PATCH (0.0.X)**: Template/formatting updates only (both hashes unchanged)

**Regeneration is safe:**
- Run `/speckit.context` anytime to ensure freshness
- Idempotent: Running multiple times is safe and fast
- Skip if unchanged: Detects no work needed via dual hash check

## Context Template Reference

See `specs/_templates/context-template.md` for:
- Full implementation-first context structure
- Code discovery compression guidelines
- Token targets per section (2,000-2,500 total)
- Dual hash version tracking rules
- Gap analysis methodology

**Key template changes (code-first approach):**
- Implementation State (Primary): ~1,200 tokens with file:line refs
- Data Flows (Traced): ~400 tokens with actual code paths
- Spec Reference (Brief): ~200 tokens (compressed from 2000+)
- Gap Analysis: ~200 tokens (code vs spec comparison)

## Token Efficiency Targets

**Target range:** 2,000 - 2,500 tokens per context (code-first)

**By section:**
- Quick Summary: ~50 tokens
- Architecture Overview: ~100 tokens
- Implementation State (all layers): ~1,200 tokens
- Data Flows: ~400 tokens (2 primary flows)
- Spec Reference: ~200 tokens (brief)
- Gap Analysis: ~200 tokens
- Links: ~50 tokens

**Example (004-ai-agent-system):**
- Full docs + code: ~82,000 tokens (spec + plan + ux + design + data-model + all source files)
- Context: ~2,200 tokens (code-first with file:line refs)
- **Reduction: 97.3%**

**Practical benefit:**
- Code references more valuable than theoretical specs
- File:line navigation enables quick code jumps
- Gap analysis shows what's built vs planned
- Can load 35+ feature contexts in same token budget as 1 full feature

## Usage Examples

**Example 1: Auto-detect current feature**
```bash
# On branch 004-ai-agent-system
/speckit.context

# Output:
✅ Context generated: specs/004-ai-agent-system/context.md
📊 Token estimate: 2,834 tokens (96.5% compression)
Generate /feature.ai-agent command? yes
✅ Feature command created
```

**Example 2: Understand existing feature**
```bash
# Need to understand filesystem before adding permissions
/speckit.context filesystem

# Output:
✅ Context loaded: specs/003-filesystem-mvp/context.md
📊 Token estimate: 2,456 tokens
📋 Version: 1.2.0
[Context content displays...]
```

**Example 3: List all features**
```bash
/speckit.context --list

# Output:
Available features:
- 001-backend-mvp-setup [✅ cached v1.0.0] → /feature.backend-mvp
- 002-mvp-account-foundation [✅ cached v1.1.0] → /feature.account
- 003-filesystem-mvp [✅ cached v1.2.0] → /feature.filesystem
- 004-ai-agent-system [⬜ uncached]
- 005-permissions-system [⬜ uncached]
```

**Example 4: Cross-feature analysis**
```bash
# Compare state management across features
/speckit.context ai-agent
/speckit.context filesystem
/speckit.context threads

# Now have context for all 3 features (~8K tokens total vs ~250K for full docs)
```

## Implementation Notes

**File paths:**
- Context template: `specs/_templates/context-template.md`
- Feature command template: `.specify/templates/feature-command-template.md`
- Generated context: `specs/###-feature-name/context.md`
- Generated commands: `.claude/commands/feature.[short-name].md`

**Dependencies:**
- `check-prerequisites.sh` - Current branch feature detection
- `shasum` - Source hash calculation
- `find`, `grep`, `sed`, `awk` - Text processing

**Performance:**
- Context generation: ~5-10 seconds per feature
- Context loading: Instant (<1 second)
- Idempotence check: <1 second (hash comparison)
