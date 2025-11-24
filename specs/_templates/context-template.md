# Feature Context Template (Implementation-First)

This template defines the **code-first** structure for feature context documents. Contexts prioritize actual implementation over planned documentation, providing file:line references for quick code navigation.

## Template Structure

```markdown
---
feature: "###-feature-name"
number: "###"
short_name: "feature-short-name"
generated: "YYYY-MM-DDTHH:mm:ssZ"
version: "X.Y.Z"
status: "completed|in-progress|planned"
source_docs: ["spec.md", "plan.md", ...]
source_hash: "sha256-hash-of-source-docs"
code_discovery_hash: "sha256-hash-of-discovered-files"
token_estimate: ####
---

# Feature Context: [Feature Name]

**ID:** `###-feature-name` | **Status:** [status] | **Code Discovered:** [timestamp]

## Quick Summary

[1-2 sentences from spec.md first paragraph - the "why" this feature exists]

---

## Implementation State (Primary Source)

### Architecture Overview

**Layer Distribution:**
- UI: N components (M containers, P presenters)
- State Management: N hooks, M stores, P contexts
- Backend: N services, M repositories, P GraphQL types
- Database: N tables

### UI Layer (N files)

**Container Components** (apps/web/src/components/[feature]/):
- **ComponentName.tsx** [size, lines]
  - `export function ComponentName(props)` (line N)
  - Dependencies: [imports from local modules]
  - Event handlers: handleXxx (line N), onYyy (line M)

**Designed Components** (packages/ui/src/features/[feature]/):
- **ComponentName.tsx** [size, lines]
  - Props: `interface ComponentNameProps { ... }`
  - File:line ref: ComponentName.tsx:N

### State Management Layer (N files)

**Hooks** (apps/web/src/lib/hooks/):
- **useHookName.ts** [lines, size]
  - `export function useHookName(params)` (line N)
  - Dependencies: [state stores, GraphQL docs, other hooks]
  - GraphQL ops: DocumentName (mutation|query)
  - Data flow: hook → graphqlClient → service → repository

**State Stores** (apps/web/src/lib/state/):
- **stateName** (fileName.ts) [lines, size]
  - `export const stateName = proxy({ ... })` (line N)
  - Key fields: field1, field2, field3
  - Actions: actionName (line M)

### Backend Services Layer (N files)

**Services** (apps/api/src/services/):
- **serviceName.ts** [lines, size]
  - `static async methodName(input)` (line N)
  - Dependencies: [repositories, other services]
  - Data flow: service → repository → database

### Data Access Layer (N files)

**Repositories** (apps/api/src/repositories/):
- **repositoryName.ts** [lines, size]
  - `async create(data)` (line N)
  - Table: table_name (schema.ts:lineN)

**Database Tables** (apps/api/src/db/schema.ts):
- **table_name** (line N) - Purpose
  - Key fields: id, field1, field2
  - RLS: policy description

### GraphQL Integration

**Operations Used:**
- Mutations: DocumentName1, DocumentName2
- Queries: DocumentName3, DocumentName4

**GraphQL Types** (apps/api/src/graphql/types/):
- type.ts [lines, size] - Purpose

---

## Data Flows (Traced from Code)

### Primary Flow: [Flow Name]

**Entry**: ComponentName.tsx:lineN → handlerName

**Flow:**
```
1. hookName.methodName(params)                    [hookName.ts:lineN]
2. └─> graphqlClient.mutation(DocumentName)      [hookName.ts:lineM]
3.     └─> serviceController.method(args)         [type.ts:lineP]
4.        └─> serviceName.method(input)           [serviceName.ts:lineQ]
5.           └─> repositoryName.create(data)      [repositoryName.ts:lineR]
6.              └─> INSERT INTO table_name (...)   [PostgreSQL]
```

**Key files in flow:**
- apps/web/src/lib/hooks/hookName.ts:lineN
- apps/api/src/services/serviceName.ts:lineM
- apps/api/src/repositories/repositoryName.ts:lineP

### Secondary Flow: [Flow Name]

[Similar structure for additional primary flows]

---

## Spec Reference (Secondary)

**Purpose** (from spec.md): [1 sentence from spec.md first paragraph]

**Key User Stories:**
- **US1: [Title]** - [1 sentence] → **Status**: ✅ Implemented ([hookName.ts:N, ComponentName.tsx:M])
- **US2: [Title]** - [1 sentence] → **Status**: 🟡 Partial ([fileName.ts exists, approval flow missing])
- **US3: [Title]** - [1 sentence] → **Status**: ❌ Missing ([no hooks/services found])

**Tech Decisions** (from plan.md):
- **[Decision name]**: [1 sentence] → Implemented: [fileName.ts, fileName2.ts]

---

## Gap Analysis (Implementation vs Spec)

**Fully Implemented** ✅:
- [Feature area] - ([hookName.ts, ComponentName.tsx, serviceName.ts])
- [Feature area] - ([specific files that prove implementation])

**Partially Implemented** 🟡:
- [Feature area] - ([what exists, what's missing])

**Missing Implementation** ❌:
- [Feature area] - ([no hooks/services found for this user story])

**Blockers:**
- [Any technical blockers preventing implementation]

---

## Links

**Full Documentation:**
- [spec.md](./spec.md) - Complete requirements (FRs, acceptance criteria)
- [plan.md](./plan.md) - Technical approach (tech stack, decisions)
- [tasks.md](./tasks.md) - Implementation checklist
- [ux.md](./ux.md) - Detailed flows (if exists)
- [design.md](./design.md) - Component design (if exists)

**Quick Code Navigation:**
- [Feature area]: apps/web/src/lib/hooks/hookName.ts:lineN
- [Feature area]: apps/api/src/services/serviceName.ts:lineM
- Database schema: apps/api/src/db/schema.ts:lineP (table_name)

---

*Context v[X.Y.Z] | Code discovered: [timestamp] | Spec hash: [hash] | Code hash: [hash] | Run `/feature.[short-name]` to reload*
```

## Code Discovery Guidelines

### From discover-code-state.sh Output

**Primary source:** Enhanced `discover-code-state.sh` script outputs:
- File inventory by layer
- Function signatures with line numbers
- Import dependencies
- Data flow tracing

**Extract for context:**
1. **Signatures section** → Use for function refs with line numbers
2. **Dependencies section** → Show what each hook/service imports
3. **Data flows section** → Trace hook → service → repository
4. **Layers section** → Count files per layer for overview

### Extracting Function Signatures

**From hooks** (signatures.hooks):
```json
{
  "file": "useSendMessage.ts",
  "line": 19,
  "signature": "export function useSendMessage(threadId: string, options?: SendMessageOptions)"
}
```

**Format for context:**
```markdown
- **useSendMessage.ts** [191 lines, 5.6KB]
  - `export function useSendMessage(threadId: string, options?: SendMessageOptions)` (line 19)
```

### Extracting Dependencies

**From dependencies object:**
```json
{
  "apps/web/src/lib/hooks/useSendMessage.ts": [
    "@/lib/state/aiAgentState",
    "@/lib/graphql/client",
    "@/types/graphql"
  ]
}
```

**Format for context:**
```markdown
  - Dependencies: aiAgentState, graphqlClient, CreateMessageDocument
```

### Extracting Data Flows

**From data_flows array:**
```json
[
  {
    "entry": "useSendMessage",
    "calls": "graphqlClient.mutation(CreateMessageDocument)",
    "type": "graphql"
  },
  {
    "entry": "messageService",
    "calls": "messageRepository.create",
    "type": "repository"
  }
]
```

**Format for context:**
```markdown
**Flow:**
1. useSendMessage.sendMessage(text)              [useSendMessage.ts:24]
2. └─> graphqlClient.mutation(CreateMessageDocument)  [useSendMessage.ts:38]
3.     └─> messageService.createMessage(input)   [messageService.ts:41]
4.        └─> messageRepository.create(data)     [message.ts:28]
```

### Gap Analysis from Code Discovery

**Method:** Compare discovered files against spec user stories

**Example process:**
1. Extract user story keywords from spec.md (e.g., "branching", "artifacts", "discovery")
2. Search discovered hooks for matching keywords
3. Determine status:
   - ✅ Fully implemented: Hooks + services + UI components found
   - 🟡 Partially implemented: Some files found, others missing
   - ❌ Missing: No related files found

## Compression Guidelines (Code-First)

### From Code Discovery (~100+ files → ~1500 tokens = 95% reduction)

**Extract:**
- File paths with line numbers for key functions
- Function signatures (not full implementations)
- Import dependencies (local modules only, not node_modules)
- Data flow traces (entry → calls chain)
- File sizes and line counts for context

**Drop:**
- Full file contents
- Node_modules imports
- Implementation details (keep signatures only)
- Comments and documentation strings

### From spec.md (~31KB → ~200 tokens = 99% reduction)

**Extract:**
- Quick summary (first paragraph, 1-2 sentences)
- User story titles only (not full descriptions)
- Success criteria (for gap analysis comparison)

**Drop:**
- Full scenario descriptions
- Detailed acceptance criteria
- Examples and mockups
- All the verbose requirement details

### From plan.md (~25KB → ~150 tokens = 99% reduction)

**Extract:**
- Tech decision headings only (1 sentence each)
- Link to full plan.md for details

**Drop:**
- Detailed rationale for decisions
- Alternatives considered
- All the implementation procedures

## Token Targets (Code-First)

**Target range:** 2,000 - 2,500 tokens per context document

**By section:**
- Quick Summary: ~50 tokens
- Architecture Overview: ~100 tokens
- Implementation State (all layers): ~1,200 tokens
  - UI Layer: ~300 tokens
  - State Management: ~300 tokens
  - Backend Services: ~300 tokens
  - Data Access: ~300 tokens
- Data Flows: ~400 tokens (2 primary flows)
- Spec Reference: ~200 tokens (brief)
- Gap Analysis: ~200 tokens
- Links: ~50 tokens

**Total:** ~2,200 tokens (baseline)

**Compression ratio:** 95%+ reduction (code references more valuable than theory)

## Version Tracking

**Version format:** `MAJOR.MINOR.PATCH`

**Version bumping rules:**
- **MAJOR (X.0.0)**: Breaking changes to feature architecture or data model
- **MINOR (0.X.0)**: Source docs OR code state modified (either hash changed)
- **PATCH (0.0.X)**: Template/formatting updates only (both hashes unchanged)

**Dual hash tracking:**
```bash
# Source docs hash (spec.md, plan.md, etc.)
SOURCE_HASH=$(cat spec.md plan.md ux.md | shasum -a 256)

# Code state hash (all discovered files)
CODE_HASH=$(find apps/ packages/ -name "*.ts" -o -name "*.tsx" | xargs cat | shasum -a 256)
```

**Regeneration triggers:**
- Source hash changed → Update spec reference section
- Code hash changed → Update implementation state section
- Both changed → Full regeneration

## Key Differences from Spec-First Template

**Old approach (spec-first):**
1. User Stories (~500 tokens from spec.md)
2. File Structure (planned paths from plan.md)
3. Component Architecture (from ux.md/design.md)
4. Data Model (interfaces from data-model.md)
5. Links to spec docs

**New approach (code-first):**
1. Implementation State (actual files with line numbers)
2. Data Flows (traced through real code)
3. Spec Reference (brief, ~200 tokens)
4. Gap Analysis (code vs spec comparison)
5. Links with quick code navigation

**Result:**
- More actionable (file:line refs for navigation)
- More accurate (reflects actual code, not plans)
- Less redundant (specs are just links, not duplicated)
- Better for maintenance (shows what's really built)
