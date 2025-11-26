---
description: Load context for File System & Markdown Editor
---

# Feature: File System & Markdown Editor

Load optimized **implementation-first** context for the **File System & Markdown Editor** feature.

**Context source:** `specs/003-filesystem-markdown-editor/context.md`
**Token savings:** ~97% (code-first context with file:line refs)
**Approach:** Actual code implementation prioritized over spec documentation

## Context

```bash
cat /Users/daniel/Projects/misc/centrid/specs/003-filesystem-markdown-editor/context.md
```

## Next Steps

After loading context, you can:

- **Navigate to actual code** using file:line references in the context:
  - Context includes `fileName.ts:lineNumber` for all key functions
  - Jump directly to hooks, services, repositories, and UI components
  - Data flows show exact code paths with line numbers

- **Read detailed docs** if you need specific information:
  - [spec.md](/Users/daniel/Projects/misc/centrid/specs/003-filesystem-markdown-editor/spec.md) - Full requirements and user stories
  - [plan.md](/Users/daniel/Projects/misc/centrid/specs/003-filesystem-markdown-editor/plan.md) - Complete technical approach
  - [tasks.md](/Users/daniel/Projects/misc/centrid/specs/003-filesystem-markdown-editor/tasks.md) - Implementation checklist
  - [data-model.md](/Users/daniel/Projects/misc/centrid/specs/003-filesystem-markdown-editor/data-model.md) - Database schema details
  - [design.md](/Users/daniel/Projects/misc/centrid/specs/003-filesystem-markdown-editor/design.md) - Component design and screenshots

- **Execute workflow commands**:
  - `/speckit.implement` - Execute implementation tasks
  - `/speckit.test` - Run API and E2E tests
  - `/speckit.debug` - Debug unexpected failures
  - `/speckit.refactor` - Refactor with natural language instructions

- **Regenerate context** if source docs OR code changed:
  - `/speckit.context filesystem` - Update context.md with latest changes
  - Dual hash tracking: Detects changes to both spec docs AND actual code
