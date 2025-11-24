---
description: Load context for {{FEATURE_NAME}}
---

# Feature: {{FEATURE_NAME}}

Load optimized **implementation-first** context for the **{{FEATURE_NAME}}** feature.

**Context source:** `specs/{{FEATURE_DIR}}/context.md`
**Token savings:** ~97% (code-first context with file:line refs)
**Approach:** Actual code implementation prioritized over spec documentation

## Context

```bash
cat {{PROJECT_ROOT}}/specs/{{FEATURE_DIR}}/context.md
```

## Next Steps

After loading context, you can:

- **Navigate to actual code** using file:line references in the context:
  - Context includes `fileName.ts:lineNumber` for all key functions
  - Jump directly to hooks, services, repositories, and UI components
  - Data flows show exact code paths with line numbers

- **Read detailed docs** if you need specific information:
  - [spec.md]({{PROJECT_ROOT}}/specs/{{FEATURE_DIR}}/spec.md) - Full requirements and user stories
  - [plan.md]({{PROJECT_ROOT}}/specs/{{FEATURE_DIR}}/plan.md) - Complete technical approach
  - [tasks.md]({{PROJECT_ROOT}}/specs/{{FEATURE_DIR}}/tasks.md) - Implementation checklist
  - [ux.md]({{PROJECT_ROOT}}/specs/{{FEATURE_DIR}}/ux.md) - Detailed UX flows (if exists)
  - [design.md]({{PROJECT_ROOT}}/specs/{{FEATURE_DIR}}/design.md) - Component design and screenshots (if exists)

- **Execute workflow commands**:
  - `/speckit.implement` - Execute implementation tasks
  - `/speckit.test` - Run API and E2E tests
  - `/speckit.debug` - Debug unexpected failures
  - `/speckit.refactor` - Refactor with natural language instructions

- **Regenerate context** if source docs OR code changed:
  - `/speckit.context {{FEATURE_NUMBER_OR_NAME}}` - Update context.md with latest changes
  - Dual hash tracking: Detects changes to both spec docs AND actual code
