---
description: Execute the implementation plan by processing and executing all tasks defined in tasks.md
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. Run `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` from repo root and parse FEATURE_DIR and AVAILABLE_DOCS list. All paths must be absolute. For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

2. **Check checklists status** (if FEATURE_DIR/checklists/ exists):
   - Scan all checklist files in the checklists/ directory
   - For each checklist, count:
     * Total items: All lines matching `- [ ]` or `- [X]` or `- [x]`
     * Completed items: Lines matching `- [X]` or `- [x]`
     * Incomplete items: Lines matching `- [ ]`
   - Create a status table:
     ```
     | Checklist | Total | Completed | Incomplete | Status |
     |-----------|-------|-----------|------------|--------|
     | ux.md     | 12    | 12        | 0          | ✓ PASS |
     | test.md   | 8     | 5         | 3          | ✗ FAIL |
     | security.md | 6   | 6         | 0          | ✓ PASS |
     ```
   - Calculate overall status:
     * **PASS**: All checklists have 0 incomplete items
     * **FAIL**: One or more checklists have incomplete items
   
   - **If any checklist is incomplete**:
     * Display the table with incomplete item counts
     * **STOP** and ask: "Some checklists are incomplete. Do you want to proceed with implementation anyway? (yes/no)"
     * Wait for user response before continuing
     * If user says "no" or "wait" or "stop", halt execution
     * If user says "yes" or "proceed" or "continue", proceed to step 3
   
   - **If all checklists are complete**:
     * Display the table showing all checklists passed
     * Automatically proceed to step 2.5

2.5. **Task Validation Check** (RECOMMENDED):

   **Check if tasks.md has been validated**:
   - Look for `$FEATURE_DIR/validation-report.md`
   - If EXISTS: Read validation-report.md and check status
   - If NOT EXISTS: Tasks have not been validated

   **If validation-report.md exists**:
   - Parse "Overall Status" from report
   - If status is "READY FOR IMPLEMENTATION" ✅:
     * Display: "✅ Tasks validated successfully - proceeding with implementation"
     * Continue to Step 3
   - If status is "PROCEED WITH CAUTION" ⚠️:
     * Display: "⚠️  Tasks have warnings but can proceed"
     * Ask: "Tasks validated with warnings. Continue anyway? (yes/no)"
     * If yes: Continue to Step 3
     * If no: STOP execution
   - If status is "BLOCKED" ❌:
     * Display: "❌ Tasks validation FAILED - critical issues found"
     * Show summary of critical issues from report
     * Recommend: "Fix issues in validation-report.md, then re-run /speckit.verify-tasks"
     * STOP execution

   **If validation-report.md does NOT exist**:
   - Display warning:
     ```
     ⚠️  WARNING: Tasks have not been validated

     It's recommended to run /speckit.verify-tasks before implementation to ensure:
     - Tasks are detailed enough for autonomous execution
     - Tasks follow project patterns (constitution, CLAUDE.md)
     - Dependencies are correctly ordered
     - No ambiguous tasks that require user input

     Proceeding without validation may result in:
     - Implementation blockers requiring clarification
     - Pattern violations needing rework
     - Incorrect dependency order causing errors
     ```
   - Ask: "Run /speckit.verify-tasks now? (yes/no/skip)"
   - If "yes": Execute `/speckit.verify-tasks` and wait for completion, then proceed
   - If "no": STOP execution (let user run verification manually)
   - If "skip": Continue to Step 3 (user assumes risk)

3. Load and analyze the implementation context:
   - **REQUIRED**: Read tasks.md for the complete task list and execution plan
   - **REQUIRED**: Read plan.md for tech stack, architecture, and file structure
   - **IF EXISTS**: Read data-model.md for entities and relationships
   - **IF EXISTS**: Read contracts/ for API specifications and test requirements
   - **IF EXISTS**: Read research.md for technical decisions and constraints
   - **IF EXISTS**: Read quickstart.md for integration scenarios
   - **IF EXISTS**: Read design.md for UI specifications and component architecture
   - **IF EXISTS**: Read design component source at `packages/ui/src/features/[feature-name]/` for reusable presentational components
   - **IF EXISTS**: Reference design showcase at `apps/design-system/pages/[feature-name]/` to see component usage
   - **IF EXISTS**: Reference screenshots at `apps/design-system/public/screenshots/[feature-name]/` for visual verification

3.5. **Pre-Flight Design Component Verification** (MANDATORY if design.md exists):

**If design.md exists in AVAILABLE_DOCS**:

1. **Parse Component Architecture section** from design.md:
   - Extract "Reusable Components (Source of Truth)" location (should be `packages/ui/src/features/[feature-name]/`)
   - Parse Screen-to-Component Mapping table
   - Build list of all designed components with their documented file paths

2. **Verify each designed component is importable**:

   For each component in mapping table:

   a. **Check physical file exists**:
      ```bash
      # Verify component file at documented path
      ls -la packages/ui/src/features/[feature-name]/ComponentName.tsx
      ```

   b. **Check component exported from feature index**:
      ```bash
      # Verify component in feature index.ts
      grep "ComponentName" packages/ui/src/features/[feature-name]/index.ts
      ```

   c. **Check feature exported from global index**:
      ```bash
      # Verify feature in packages/ui/src/features/index.ts
      grep "[feature-name]" packages/ui/src/features/index.ts
      ```

   d. **Verify TypeScript export chain** (read files, trace exports):
      - Component exports from its .tsx file
      - Feature index.ts re-exports component
      - Global features index.ts exports feature
      - Import path would work: `import { ComponentName } from '@centrid/ui/features'`

3. **Build verification report**:

   ```
   Pre-Flight Design Component Verification:

   ✅ DesktopWorkspace
      File: packages/ui/src/features/filesystem-markdown-editor/DesktopWorkspace.tsx (exists)
      Exported from: packages/ui/src/features/filesystem-markdown-editor/index.ts ✓
      Available via: @centrid/ui/features ✓

   ✅ EmptyState
      File: packages/ui/src/features/filesystem-markdown-editor/EmptyState.tsx (exists)
      Exported from: packages/ui/src/features/filesystem-markdown-editor/index.ts ✓
      Available via: @centrid/ui/features ✓

   ❌ FileUploadModal
      File: packages/ui/src/features/filesystem-markdown-editor/FileUploadModal.tsx (NOT FOUND)
      Expected location missing
      Import will FAIL: import { FileUploadModal } from '@centrid/ui/features'

   Status: 2/3 components verified (66%)
   ```

**If ANY component verification FAILS**:

- **CRITICAL ERROR**: Design artifacts incomplete - cannot proceed with implementation
- **Impact**: Import statements in tasks will fail, implementation will break
- **Report**:
  ```
  ❌ DESIGN COMPONENT VERIFICATION FAILED

  Missing components:
  - FileUploadModal (expected: packages/ui/src/features/filesystem-markdown-editor/FileUploadModal.tsx)

  These components are referenced in design.md and tasks.md but do not exist.
  Implementation cannot proceed - imports will fail.
  ```

- **Suggest fixes**:
  1. **Option A (Recommended)**: Run `/speckit.design-iterate` to create missing components
     - Selects missing screens
     - Creates components in correct location
     - Updates design.md

  2. **Option B**: Manually move components from wrong location
     - Check if components in `apps/design-system/components/`
     - Move to `packages/ui/src/features/[feature-name]/`
     - Update exports in index.ts files
     - Re-run verification

  3. **Option C**: Update design.md and regenerate tasks
     - Remove references to missing components from design.md
     - Run `/speckit.tasks` to regenerate without missing components
     - Implementation will create UI from scratch (loses design work)

- **Action**: STOP execution immediately
- **Do NOT proceed**: No silent fallbacks, no improvisation, no creating components on-the-fly
- **Exit with error code**

**If ALL components verified successfully ✅**:

- **Report**:
  ```
  ✅ PRE-FLIGHT VERIFICATION PASSED

  All designed components available:
  - [N] components verified in packages/ui/src/features/[feature-name]/
  - All components importable from @centrid/ui/features
  - TypeScript export chain validated

  Ready to proceed with implementation.
  Implementation will import and integrate designed components.
  ```

- **Set flag**: `DESIGN_COMPONENTS_VERIFIED = true`
- **Proceed to Step 4** with confidence that all imports will work

**If design.md does NOT exist**:
- Skip verification (no design integration)
- Proceed to Step 4

4. **Project Setup Verification**:
   - **REQUIRED**: Create/verify ignore files based on actual project setup:
   
   **Detection & Creation Logic**:
   - Check if the following command succeeds to determine if the repository is a git repo (create/verify .gitignore if so):

     ```sh
     git rev-parse --git-dir 2>/dev/null
     ```
   - Check if Dockerfile* exists or Docker in plan.md → create/verify .dockerignore
   - Check if .eslintrc* or eslint.config.* exists → create/verify .eslintignore
   - Check if .prettierrc* exists → create/verify .prettierignore
   - Check if .npmrc or package.json exists → create/verify .npmignore (if publishing)
   - Check if terraform files (*.tf) exist → create/verify .terraformignore
   - Check if .helmignore needed (helm charts present) → create/verify .helmignore
   
   **If ignore file already exists**: Verify it contains essential patterns, append missing critical patterns only
   **If ignore file missing**: Create with full pattern set for detected technology
   
   **Common Patterns by Technology** (from plan.md tech stack):
   - **Node.js/JavaScript**: `node_modules/`, `dist/`, `build/`, `*.log`, `.env*`
   - **Python**: `__pycache__/`, `*.pyc`, `.venv/`, `venv/`, `dist/`, `*.egg-info/`
   - **Java**: `target/`, `*.class`, `*.jar`, `.gradle/`, `build/`
   - **C#/.NET**: `bin/`, `obj/`, `*.user`, `*.suo`, `packages/`
   - **Go**: `*.exe`, `*.test`, `vendor/`, `*.out`
   - **Ruby**: `.bundle/`, `log/`, `tmp/`, `*.gem`, `vendor/bundle/`
   - **PHP**: `vendor/`, `*.log`, `*.cache`, `*.env`
   - **Rust**: `target/`, `debug/`, `release/`, `*.rs.bk`, `*.rlib`, `*.prof*`, `.idea/`, `*.log`, `.env*`
   - **Kotlin**: `build/`, `out/`, `.gradle/`, `.idea/`, `*.class`, `*.jar`, `*.iml`, `*.log`, `.env*`
   - **C++**: `build/`, `bin/`, `obj/`, `out/`, `*.o`, `*.so`, `*.a`, `*.exe`, `*.dll`, `.idea/`, `*.log`, `.env*`
   - **C**: `build/`, `bin/`, `obj/`, `out/`, `*.o`, `*.a`, `*.so`, `*.exe`, `Makefile`, `config.log`, `.idea/`, `*.log`, `.env*`
   - **Universal**: `.DS_Store`, `Thumbs.db`, `*.tmp`, `*.swp`, `.vscode/`, `.idea/`
   
   **Tool-Specific Patterns**:
   - **Docker**: `node_modules/`, `.git/`, `Dockerfile*`, `.dockerignore`, `*.log*`, `.env*`, `coverage/`
   - **ESLint**: `node_modules/`, `dist/`, `build/`, `coverage/`, `*.min.js`
   - **Prettier**: `node_modules/`, `dist/`, `build/`, `coverage/`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
   - **Terraform**: `.terraform/`, `*.tfstate*`, `*.tfvars`, `.terraform.lock.hcl`

5. Parse tasks.md structure and extract:
   - **Task phases**: Setup, Tests, Core, Integration, Polish
   - **Task dependencies**: Sequential vs parallel execution rules
   - **Task details**: ID, description, file paths, parallel markers [P]
   - **Execution flow**: Order and dependency requirements

6. Execute implementation following the task plan:
   - **Phase-by-phase execution**: Complete each phase before moving to the next
   - **Respect dependencies**: Run sequential tasks in order, parallel tasks [P] can run together  
   - **Follow TDD approach**: Execute test tasks before their corresponding implementation tasks
   - **File-based coordination**: Tasks affecting the same files must run sequentially
   - **Validation checkpoints**: Verify each phase completion before proceeding

7. Implementation execution rules:
   - **Setup first**: Initialize project structure, dependencies, configuration
   - **Tests before code**: If you need to write tests for contracts, entities, and integration scenarios
   - **Core development**: Implement models, services, CLI commands, endpoints
   - **UI implementation** (if DESIGN_COMPONENTS_VERIFIED = true):
     * Import ONLY verified components from `@centrid/ui/features`
     * Create containers in `apps/web/src/components/[feature]/` that wrap designed components
     * Add business logic (hooks, state, API calls) in containers
     * Reference component props from `packages/ui/src/features/[feature-name]/`
     * Match screenshots from `apps/design-system/public/screenshots/[feature-name]/`
     * **NO fallbacks**: If import fails, STOP and report error (should be impossible after Step 3.5)
     * **NO improvisation**: Do not create alternative components or minimal versions
   - **Integration work**: Database connections, middleware, logging, external services
   - **Polish and validation**: Unit tests, performance optimization, documentation

8. Progress tracking and error handling:
   - Report progress after each completed task
   - Halt execution if any non-parallel task fails
   - For parallel tasks [P], continue with successful tasks, report failed ones
   - Provide clear error messages with context for debugging
   - Suggest next steps if implementation cannot proceed
   - **IMPORTANT** For completed tasks, make sure to mark the task off as [X] in the tasks file.

9. Completion validation:
   - Verify all required tasks are completed
   - Check that implemented features match the original specification
   - Validate that tests pass and coverage meets requirements
   - Confirm the implementation follows the technical plan
   - Report final status with summary of completed work

Note: This command assumes a complete task breakdown exists in tasks.md. If tasks are incomplete or missing, suggest running `/tasks` first to regenerate the task list.
