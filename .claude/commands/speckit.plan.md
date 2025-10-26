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
   - **IF EXISTS**: Read `arch.md` for architecture decisions (domain model, API contracts, module structure)
   - **IF EXISTS**: Read `design.md` for UI specifications and approved component designs
   - **IF EXISTS**: Read `design-checklist.md` to verify design completion status

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
   - **IF arch.md EXISTS**: Load Domain Model from arch.md (entities, relationships, business rules, state transitions)
   - **IF arch.md MISSING**: Extract entities from feature spec (entity name, fields, relationships, validation rules, state transitions)

2. **API Contracts** → `/contracts/`:
   - **IF arch.md EXISTS**: Load API Surface from arch.md (endpoints, methods, request/response formats)
   - **IF arch.md MISSING**: Generate API contracts from functional requirements (for each user action → endpoint, use standard REST/GraphQL patterns)
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Incorporate UI design** (if `design.md` exists):
   - Load approved component designs from `design.md`
   - Reference component source at `apps/design-system/components/[FeatureName].tsx`
   - Map design screens to implementation routes
   - Identify components from `@centrid/ui/components` used in design
   - Note any new compositions or feature-specific components needed
   - Include UI implementation tasks in plan structure

4. **UI Architecture Reference** (UI projects only - SKIP if API/CLI/library):
   - **IF arch.md EXISTS**: Reference UI architecture sections from arch.md
     - Note in plan.md: "UI architecture documented in arch.md"
   - **IF arch.md MISSING**: Add note to run `/speckit.arch` first for UI features
     - Plan cannot proceed without architecture for UI features
   - **This section (plan.md) focuses on**: Technical implementation approach, tech stack, integration with services (NOT UI architecture)

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
- ERROR on gate failures or unresolved clarifications
