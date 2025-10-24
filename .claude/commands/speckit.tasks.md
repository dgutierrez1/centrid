---
description: Generate an actionable, dependency-ordered tasks.md for the feature based on available design artifacts.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. **Setup**: Run `.specify/scripts/bash/check-prerequisites.sh --json` from repo root and parse FEATURE_DIR and AVAILABLE_DOCS list. All paths must be absolute. For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

2. **Load design documents**: Read from FEATURE_DIR:
   - **Required**: plan.md (tech stack, libraries, structure), spec.md (user stories with priorities)
   - **Optional**:
     - data-model.md (entities)
     - contracts/ (API endpoints)
     - research.md (decisions)
     - quickstart.md (test scenarios)
     - **design.md (UI component architecture, designed components)** - If exists, extract:
       - Component Architecture section (reusable components in packages/ui/src/features/)
       - Screen-to-Component Mapping table (which components were designed)
       - Implementation Guide (container pattern, import examples)
   - Note: Not all projects have all documents. Generate tasks based on what's available.

2.5. **Verify Design Component Availability** (MANDATORY if design.md exists):

**If AVAILABLE_DOCS includes design.md**:

1. **Parse Screen-to-Component Mapping table** from design.md:
   - Extract all component names (e.g., DesktopWorkspace, EmptyState, FileUploadModal)
   - Extract documented file paths (should be `packages/ui/src/features/[feature-name]/ComponentName.tsx`)
   - Build expected component list

2. **Verify each designed component exists**:
   - Check physical file exists at documented path
   - Check component exported from `packages/ui/src/features/[feature-name]/index.ts`
   - Check feature exported from `packages/ui/src/features/index.ts`

3. **Build component availability map**:
   ```json
   {
     "DesktopWorkspace": { "exists": true, "path": "packages/ui/src/features/filesystem-markdown-editor/DesktopWorkspace.tsx" },
     "EmptyState": { "exists": true, "path": "packages/ui/src/features/filesystem-markdown-editor/EmptyState.tsx" },
     "FileUploadModal": { "exists": false, "path": "packages/ui/src/features/filesystem-markdown-editor/FileUploadModal.tsx" }
   }
   ```

4. **Report verification results**:
   ```
   Design Component Verification:

   ✅ DesktopWorkspace      packages/ui/src/features/filesystem-markdown-editor/DesktopWorkspace.tsx
   ✅ EmptyState            packages/ui/src/features/filesystem-markdown-editor/EmptyState.tsx
   ❌ FileUploadModal       NOT FOUND (expected: packages/ui/src/features/filesystem-markdown-editor/FileUploadModal.tsx)

   Status: 2/3 components available (66%)
   ```

**If ANY designed component is MISSING**:

- **ERROR**: Design artifacts incomplete - designed components not accessible
- **Report**: List missing components with expected paths
- **Suggest**:
  1. **Recommended**: Run `/speckit.design-iterate` to create missing components in correct location
  2. OR: Update design.md to remove references to missing components (if they weren't actually designed)
  3. OR: Manually move components from wrong location (check `apps/design-system/components/`) to `packages/ui/src/features/[feature-name]/`
- **Ask user**: "Design components missing. Fix before continuing? (yes = stop now / no = continue without design integration)"
- **If user says NO**: Generate tasks WITHOUT design integration (create UI from scratch)
- **If user says YES**: STOP execution and exit

**If ALL designed components verified ✅**:

- Set flag: `DESIGN_INTEGRATION_ENABLED = true`
- Use component availability map in Step 3 task generation
- Generate "integrate existing" tasks (not "create from scratch")
- Proceed to Step 3

3. **Execute task generation workflow**:
   - Load plan.md and extract tech stack, libraries, project structure
   - Load spec.md and extract user stories with their priorities (P1, P2, P3, etc.)
   - If data-model.md exists: Extract entities and map to user stories
   - If contracts/ exists: Map endpoints to user stories
   - If research.md exists: Extract decisions for setup tasks
   - **If DESIGN_INTEGRATION_ENABLED = true** (set in Step 2.5):
     - Use component availability map from Step 2.5
     - For each available designed component: Generate "integrate existing" tasks
       - Example: "Create WorkspaceContainer that wraps DesktopWorkspace from @centrid/ui/features in apps/web/src/components/workspace/"
       - Example: "Import EmptyState from @centrid/ui/features and use in WorkspaceContainer when no document selected"
     - Generate container components in `apps/web/src/components/[feature]/`
     - Generate custom hooks in `apps/web/src/lib/hooks/`
     - Generate state management in `apps/web/src/lib/state/`
     - Generate API integration in `apps/api/src/functions/`
     - **DO NOT generate tasks to create designed components** (they already exist)
   - **If design.md missing OR DESIGN_INTEGRATION_ENABLED = false**:
     - Generate tasks to create UI components from scratch in appropriate locations
     - No design integration pattern
   - Generate tasks organized by user story (see Task Generation Rules below)
   - Generate dependency graph showing user story completion order
   - Create parallel execution examples per user story
   - Validate task completeness (each user story has all needed tasks, independently testable)

4. **Generate tasks.md**: Use `.specify.specify/templates/tasks-template.md` as structure, fill with:
   - Correct feature name from plan.md
   - Phase 1: Setup tasks (project initialization)
   - Phase 2: Foundational tasks (blocking prerequisites for all user stories)
   - Phase 3+: One phase per user story (in priority order from spec.md)
   - Each phase includes: story goal, independent test criteria, tests (if requested), implementation tasks
   - Final Phase: Polish & cross-cutting concerns
   - All tasks must follow the strict checklist format (see Task Generation Rules below)
   - Clear file paths for each task
   - Dependencies section showing story completion order
   - Parallel execution examples per story
   - Implementation strategy section (MVP first, incremental delivery)

5. **Report**: Output path to generated tasks.md and summary:

   **Design Integration Status**:
   - If design.md exists:
     - Design component verification: [N]/[M] components available
     - Integration mode: ENABLED ✅ / DISABLED (missing components) ❌
     - Available components: [list]
     - Tasks generated: Integration tasks (wrapping existing components)
   - If design.md missing:
     - Integration mode: N/A (no design phase)
     - Tasks generated: Create UI components from scratch

   **Task Generation Summary**:
   - Total task count: [N]
   - Task count per user story: [breakdown]
   - Parallel opportunities identified: [N] tasks marked [P]
   - Independent test criteria for each story
   - Suggested MVP scope (typically just User Story 1)
   - Format validation: Confirm ALL tasks follow the checklist format (checkbox, ID, labels, file paths)

   **Ready for Implementation**:
   - tasks.md created at: [FEATURE_DIR]/tasks.md
   - Next step: Run `/speckit.implement` to execute tasks

Context for task generation: $ARGUMENTS

The tasks.md should be immediately executable - each task must be specific enough that an LLM can complete it without additional context.

## Task Generation Rules

**CRITICAL**: Tasks MUST be organized by user story to enable independent implementation and testing.

**Tests are OPTIONAL**: Only generate test tasks if explicitly requested in the feature specification or if user requests TDD approach.

### Checklist Format (REQUIRED)

Every task MUST strictly follow this format:

```text
- [ ] [TaskID] [P?] [Story?] Description with file path
```

**Format Components**:

1. **Checkbox**: ALWAYS start with `- [ ]` (markdown checkbox)
2. **Task ID**: Sequential number (T001, T002, T003...) in execution order
3. **[P] marker**: Include ONLY if task is parallelizable (different files, no dependencies on incomplete tasks)
4. **[Story] label**: REQUIRED for user story phase tasks only
   - Format: [US1], [US2], [US3], etc. (maps to user stories from spec.md)
   - Setup phase: NO story label
   - Foundational phase: NO story label  
   - User Story phases: MUST have story label
   - Polish phase: NO story label
5. **Description**: Clear action with exact file path

**Examples**:

- ✅ CORRECT: `- [ ] T001 Create project structure per implementation plan`
- ✅ CORRECT: `- [ ] T005 [P] Implement authentication middleware in src/middleware/auth.py`
- ✅ CORRECT: `- [ ] T012 [P] [US1] Create User model in src/models/user.py`
- ✅ CORRECT: `- [ ] T014 [US1] Implement UserService in src/services/user_service.py`
- ❌ WRONG: `- [ ] Create User model` (missing ID and Story label)
- ❌ WRONG: `T001 [US1] Create model` (missing checkbox)
- ❌ WRONG: `- [ ] [US1] Create User model` (missing Task ID)
- ❌ WRONG: `- [ ] T001 [US1] Create model` (missing file path)

### Task Organization

1. **From User Stories (spec.md)** - PRIMARY ORGANIZATION:
   - Each user story (P1, P2, P3...) gets its own phase
   - Map all related components to their story:
     - Models needed for that story
     - Services needed for that story
     - Endpoints/UI needed for that story
     - If tests requested: Tests specific to that story
   - Mark story dependencies (most stories should be independent)
   
2. **From Contracts**:
   - Map each contract/endpoint → to the user story it serves
   - If tests requested: Each contract → contract test task [P] before implementation in that story's phase
   
3. **From Data Model**:
   - Map each entity to the user story(ies) that need it
   - If entity serves multiple stories: Put in earliest story or Setup phase
   - Relationships → service layer tasks in appropriate story phase
   
4. **From Setup/Infrastructure**:
   - Shared infrastructure → Setup phase (Phase 1)
   - Foundational/blocking tasks → Foundational phase (Phase 2)
   - Story-specific setup → within that story's phase

5. **From Design (design.md)** - IF EXISTS:
   - **DO NOT create tasks to build UI components** (already done in packages/ui by /speckit.design)
   - **DO create tasks to integrate designed components**:
     - Container components that wrap designed components with business logic
     - Custom hooks for state management (useFileSystem, useMarkdownEditor, etc.)
     - State management setup (Valtio stores)
     - API integration (Edge Functions, endpoints)
     - Page/route setup using container components
   - **Task examples when design.md exists**:
     - ✅ "Create WorkspaceContainer wrapping DesktopWorkspace from @centrid/ui/features in apps/web/src/components/filesystem/"
     - ✅ "Create useFileSystem hook for file CRUD operations in apps/web/src/hooks/"
     - ✅ "Create filesystemState Valtio store in apps/web/src/lib/state/"
     - ✅ "Create /workspace page using WorkspaceContainer in apps/web/src/pages/"
     - ❌ "Create DesktopWorkspace component" (NO - already exists from design phase)
     - ❌ "Build file tree UI" (NO - already exists as presentational component)

### Phase Structure

- **Phase 1**: Setup (project initialization)
- **Phase 2**: Foundational (blocking prerequisites - MUST complete before user stories)
- **Phase 3+**: User Stories in priority order (P1, P2, P3...)
  - Within each story: Tests (if requested) → Models → Services → Endpoints → Integration
  - Each phase should be a complete, independently testable increment
- **Final Phase**: Polish & Cross-Cutting Concerns
