---
description: Extract or create architectural patterns for the pattern library
category: project
---

# Pattern Documentation Command

Extract patterns from existing documentation/code or create new patterns from scratch.

## Usage

```bash
# Mode 1: Extract from documentation file
/speckit.pattern STREAMING_ARCHITECTURE.md

# Mode 2: Extract from code file
/speckit.pattern apps/web/src/lib/hooks/useFilesystemOperations.ts

# Mode 3: Create from scratch
/speckit.pattern
```

## Your Task

You are helping document an architectural pattern for the Centrid codebase. Patterns are reusable solutions to recurring problems.

### Step 1: Determine Mode

**If file path provided:**
- Read the file content
- Determine if it's a documentation file (.md) or code file (.ts, .tsx, .js)
- Proceed to extraction mode

**If no file provided:**
- Proceed to manual creation mode

### Step 2: Analyze Content (Extraction Modes Only)

**For documentation files:**
- Extract key architectural concepts
- Identify the core pattern being described
- Find concrete examples and rules
- Note related file references

**For code files:**
- Identify repeated structures or abstractions
- Find the underlying pattern (e.g., factory, repository, hook pattern)
- Extract actual code examples
- Search codebase for other files using the same pattern

### Step 3: Auto-Suggest Pattern Name

Based on the analysis:
- Generate a descriptive pattern name
- Add category prefix if clear:
  - `frontend-` for React hooks, components, state management
  - `backend-` for services, repositories, Edge Functions
  - `integration-` for external service integrations, real-time, APIs
  - `data-` for database, schema, RLS policies
- Convert to kebab-case filename
- Example: "Optimistic Update Hook Pattern" → `frontend-optimistic-mutations.md`

**Present to user:**
"I've analyzed the content and suggest the pattern name: **[Pattern Title]**

Filename: `.specify/docs/[suggested-filename].md`

Does this pattern name accurately describe the concept? [Yes/Edit]"

### Step 4: Extract Pattern Details

Gather the following information (use AI analysis for extraction modes, prompt user for manual mode):

1. **Title**: Descriptive pattern name
2. **Summary**: One-line description for the quick reference table
3. **What**: Single sentence describing what this pattern is
4. **Why**: Single sentence explaining the problem it solves
5. **How**: Minimal code example (extract from file or ask user)
6. **Rules**: 3-5 bullets of DOs and DON'Ts
7. **Used in**: File paths where this pattern appears

**For extraction modes**, present extracted information and ask:
"I've extracted the following pattern details. Please review and confirm or edit:

**Title**: [extracted]
**Summary**: [extracted]
**What**: [extracted]
**Why**: [extracted]
**Rules**: [extracted list]
**Used in**: [extracted files]

Would you like to: [Confirm / Edit / Cancel]"

**For manual mode**, use interactive prompts to gather each field.

### Step 5: Check for Existing Pattern

Check if `.specify/docs/[filename].md` already exists.

**If pattern exists:**
- Read existing pattern file
- Show side-by-side diff highlighting differences
- Ask user:
  "A pattern with this name already exists. What would you like to do?

  [Merge] - Combine both versions (you'll edit after)
  [Overwrite] - Replace existing with new version
  [Abort] - Keep existing, cancel operation
  [Create Variant] - Save as [filename]-v2.md"

**If Merge selected:**
- Combine content from both versions
- Add comment at top: `<!-- Merged from [source] on [date] -->`
- Create file and notify user to review/edit

**If Overwrite selected:**
- Create backup: `.specify/docs/.backup/[filename]-[timestamp].md`
- Replace existing file
- Notify user of backup location

**If Abort selected:**
- Stop operation, no changes made

**If Create Variant selected:**
- Save as new filename with version suffix
- Both patterns exist side-by-side

### Step 6: Generate Pattern File

Using the strict template from `.specify/docs/_template.md`, generate the pattern file:

```markdown
---
title: [Pattern Title]
summary: [One-line summary]
---

<!-- After editing this file, run: npm run sync-docs -->

# [Pattern Title]

**What**: [One sentence description]

**Why**: [One sentence problem statement]

**How**:

\`\`\`typescript
// [Minimal code example]
\`\`\`

**Rules**:
- ✅ DO: [Rule 1]
- ✅ DO: [Rule 2]
- ❌ DON'T: [Anti-pattern 1]
- ❌ DON'T: [Anti-pattern 2]

**Used in**:
- \`[file-path]\` - [Usage description]
- \`[file-path]\` - [Usage description]
```

### Step 7: Confirm Creation

After creating the file, show success message:

"✅ Pattern created: `.specify/docs/[filename].md`

**Next steps:**
1. Review the pattern file and edit if needed
2. Run `npm run sync-docs` to update the pattern quick reference table in CLAUDE.md
3. Commit both the pattern file and updated CLAUDE.md

Pattern will appear in the quick reference table after running sync-docs."

## Template Structure

All patterns must follow this structure:

```markdown
---
title: Pattern Name
summary: One-line description for quick reference table
---

# Pattern Name

**What**: [1 sentence describing what this pattern is]

**Why**: [1 sentence explaining the problem this pattern solves]

**How**: [Minimal code example]

**Rules**: ✅ DO / ❌ DON'T [3-5 bullets total]

**Used in**: [File paths]
```

## Rules

- ✅ Always auto-suggest pattern filename based on content
- ✅ Show diff when pattern exists, prompt for merge decision
- ✅ Extract actual code examples from source files when possible
- ✅ Keep patterns concise - single sentence for What/Why
- ✅ Include 3-5 rules maximum (mix of DOs and DON'Ts)
- ✅ List actual file paths in "Used in" section
- ✅ Remind user to run `npm run sync-docs` manually
- ❌ DON'T auto-run sync-docs - let user control when to update
- ❌ DON'T create verbose patterns - keep it very summarized
- ❌ DON'T overwrite existing patterns without confirmation
- ❌ DON'T include implementation details - just the pattern essence

## Examples

**Extraction from doc:**
```
User: /speckit.pattern STREAMING_ARCHITECTURE.md
→ Analyzes streaming architecture
→ Suggests: "Event-Driven Streaming Pattern"
→ Filename: `integration-streaming-events.md`
→ Extracts: What streaming is, why it's used, how it works, rules
→ Creates pattern file
```

**Extraction from code:**
```
User: /speckit.pattern apps/web/src/lib/hooks/useFilesystemOperations.ts
→ Analyzes hook structure
→ Detects optimistic update pattern repeated 6 times
→ Suggests: "Optimistic Update Hook Pattern"
→ Filename: `frontend-optimistic-mutations.md`
→ Extracts code examples, finds related files
→ Creates pattern file
```

**Manual creation:**
```
User: /speckit.pattern
→ Interactive mode
→ Prompts for: title, summary, what, why, code example, rules, file refs
→ Auto-suggests filename from title
→ Creates pattern file
```
