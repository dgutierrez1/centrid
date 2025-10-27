---
description: Execute the implementation planning workflow using the plan template to generate design artifacts.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. **Setup**: Run `.specify/scripts/bash/setup-plan.sh --json` from repo root and parse JSON for FEATURE_SPEC, IMPL_PLAN, SPECS_DIR, BRANCH. For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

2. **Load context**: Read FEATURE_SPEC and `.specify/memory/constitution.md`. Load IMPL_PLAN template (already copied).
   - **REQUIRED**: Read `arch.md` for architecture decisions (domain model, API contracts, module structure)
     - **ERROR if missing**: Cannot proceed without architecture. Run `/speckit.arch` first.
   - **Optional**: Read `ux.md` for UX flows (UI features)
   - **Optional**: Read `design.md` for UI specifications and approved component designs
   - **Optional**: Read `design-checklist.md` to verify design completion status

3. **Execute plan workflow**: Follow the structure in IMPL_PLAN template to:
   - Fill Technical Context (mark unknowns as "NEEDS CLARIFICATION")
   - Fill Constitution Check section from constitution
   - Evaluate gates (ERROR if violations unjustified)
   - Phase 0: Generate research.md (resolve all NEEDS CLARIFICATION)
   - Phase 1: Generate data-model.md, contracts/, quickstart.md
   - Phase 1: Update agent context by running the agent script
   - Re-evaluate Constitution Check post-design

4. **Stop and report**: Command ends after Phase 2 planning. Report branch, IMPL_PLAN path, and generated artifacts.

## Phases

### Phase 0: Outline & Research

1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

### Phase 1: Design & Contracts

**Prerequisites:** `research.md` complete

1. **Data Model** → `data-model.md`:
   - Load Domain Model from arch.md (REQUIRED - entities, relationships, business rules, state transitions)
   - Expand with implementation details (database schema, indexes, constraints)

2. **API Contracts** → `/contracts/`:
   - Load API Surface from arch.md (REQUIRED - endpoints, methods, request/response formats)
   - Expand with detailed request/response schemas (OpenAPI/GraphQL)
   - Output complete API contracts to `/contracts/`

3. **Incorporate UI design** (if `design.md` exists):
   - Load approved component designs from `design.md`
   - Reference component source at `apps/design-system/components/[FeatureName].tsx`
   - Map design screens to implementation routes
   - Identify components from `@centrid/ui/components` used in design
   - Note any new compositions or feature-specific components needed
   - Include UI implementation tasks in plan structure

4. **UI Architecture Reference** (UI projects only - SKIP if API/CLI/library):
   - Reference UI architecture sections from arch.md (screens, component structure, state management)
   - Note in plan.md: "UI architecture documented in arch.md - see sections 3.1-3.3"
   - **This section (plan.md) focuses on**: Technical implementation approach, tech stack, integration with services (NOT UI architecture)
   - **UX flows**: If ux.md exists, reference detailed interaction flows from ux.md

5. **Agent context update**:
   - Run `.specify/scripts/bash/update-agent-context.sh claude`
   - These scripts detect which AI agent is in use
   - Update the appropriate agent-specific context file
   - Add only new technology from current plan
   - Preserve manual additions between markers

**Output**: data-model.md, /contracts/*, quickstart.md, agent-specific file

**Note**: UI architecture (screens, flows, components, state) is documented in arch.md (use `/speckit.arch`), NOT in plan.md

## Key rules

- Use absolute paths
- **REQUIRED**: arch.md must exist - ERROR if missing with message: "Cannot proceed without architecture. Run /speckit.arch first."
- ERROR on gate failures or unresolved clarifications
- Reference constitution.md for all architectural decisions
- Phase 0 (research.md) must resolve ALL "NEEDS CLARIFICATION" before Phase 1
