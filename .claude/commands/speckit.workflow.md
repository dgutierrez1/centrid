---
description: Document the speckit workflow architecture and provide guidance on creating new commands.
---

## User Input

```text
$ARGUMENTS
```

Options:
- `overview` - Show complete workflow architecture
- `create` - Guide to creating new commands
- `integrate` - How to integrate new steps into workflow
- `validate` - Validation gate patterns
- (empty) - Interactive menu

---

## Overview

The **speckit workflow** is a feature development process that breaks complex feature implementation into validated, sequential phases. Each phase is a slash command that:

1. Reads input from previous phases
2. Executes a specific workflow
3. Generates output for next phases
4. Validates artifacts before proceeding

**Core Principle**: "Design documents what, tasks document how, implementation executes it"

---

## Workflow Architecture

### Feature Development Lifecycle

**Regular Feature Flow** (per feature):

```
User describes feature
        ↓
/speckit.specify        → specs/[feature]/spec.md
        ↓               (Requirements, user stories, acceptance criteria)
        ↓
/speckit.clarify        → specs/[feature]/spec.md (updated)
        ↓               (Resolve underspecifications via Q&A)
        ↓
/speckit.plan           → specs/[feature]/plan.md, data-model.md, contracts/
        ↓               (Technical approach, data model, API contracts)
        ↓               (Reads constitution.md and tokens.md from project setup)
        ↓
/speckit.design         → specs/[feature]/design.md, packages/ui/
        ↓               (Visual design, components, interactions)
        ↓               (Uses global design system tokens)
        ↓
/speckit.tasks          → specs/[feature]/tasks.md
        ↓               (Dependency-ordered implementation tasks)
        ↓
/speckit.verify-tasks   → specs/[feature]/validation-report.md
        ↓               (Validate completeness, patterns, dependencies, coverage)
        ↓               (Gate: Ensures tasks fully deliver requirements)
        ↓
/speckit.implement      → Production code in apps/web, apps/api
        ↓               (Execute validated tasks, integrate components)
        ↓
/speckit.analyze        → Analysis report
        ↓               (Cross-artifact consistency check)
        ↓
Feature complete ✅
```

**One-Time Project Setup** (done once at project start):

```
/speckit.constitution   → .specify/memory/constitution.md
                        (Project principles, constraints, used by all features)

/speckit.design-system  → .specify/design-system/tokens.md
                        → packages/ui/colors.config.js
                        (Global design tokens, used by all features)
```

**Support Commands** (as needed):

- `/speckit.design-iterate` - Refine existing feature designs
- `/speckit.checklist` - Generate custom checklists for features
- `/speckit.verify-tasks` - Validate tasks before implementation (recommended gate)

---

## Command Structure Pattern

All speckit commands follow this structure:

```markdown
---
description: Brief command description (shown in /help)
---

## User Input
\```text
$ARGUMENTS
\```
(Process user input, handle options)

## Outline
(High-level numbered steps - workflow overview)

## Workflow
(Detailed step-by-step execution with validation gates)

### Step 1: Setup & Load Context
- Run prerequisite scripts
- Parse JSON output
- Load required files

### Step 2: [Core Workflow Step]
- Execute main logic
- Generate artifacts

### Step 3: Validation Gate
- Verify outputs
- STOP if validation fails

### Step N: Report Summary
- Summarize what was created
- Show next steps

## Key Rules
- Use absolute paths
- ERROR on validation failures
- Document integration points
```

---

## Command Design Principles

### 1. **Single Responsibility**

Each command does ONE thing well:
- `/speckit.specify` - Captures requirements
- `/speckit.design` - Creates UI/UX design
- `/speckit.tasks` - Generates task list
- `/speckit.verify-tasks` - Validates tasks (completeness, patterns, coverage)
- `/speckit.implement` - Executes validated tasks

**DON'T** mix concerns (e.g., design command shouldn't implement)

### 2. **Sequential Validation**

Commands validate inputs from previous phase:

```markdown
Step 1: Load prerequisite artifacts
Step 2: Validate prerequisites exist
  - If MISSING: ERROR and STOP
  - If EXISTS: Continue
Step 3: Execute workflow
Step 4: Validate outputs
  - If INVALID: ERROR and STOP
  - If VALID: Save and report
```

**Pattern**: Fail fast with clear error messages

### 3. **Template-Driven Output**

Commands read templates from `.specify/templates/`:
- `spec-template.md` - Feature specifications
- `plan-template.md` - Implementation plans
- `design-template.md` - Design documentation
- `tasks-template.md` - Task lists

**Benefits**:
- Consistent output format
- Easy to update all features
- Clear documentation structure

### 4. **Script Integration**

Commands call bash scripts from `.specify/scripts/bash/`:
- `check-prerequisites.sh` - Verify feature setup
- `setup-plan.sh` - Setup planning environment
- `create-new-feature.sh` - Initialize feature directory

**Pattern**: Scripts return JSON, commands parse and use

### 5. **Handoff Documentation**

Each command documents what next phase needs:

```markdown
## Next Steps
- Run `/speckit.tasks` to generate implementation tasks
- Tasks will use Screen-to-Component Mapping from design.md
```

**Principle**: Next command should have zero ambiguity

---

## Creating a New Command

### Step 1: Identify Need

**Questions to answer**:
1. What phase in workflow is this?
2. What input does it need? (from previous phase)
3. What output does it create? (for next phase)
4. What validation is required?

**Example**: Need a command to generate E2E tests from tasks

```
Input: tasks.md (completed implementation tasks)
Output: specs/[feature]/tests/e2e/ (test files)
Validation: All screens from design.md have tests
```

### Step 2: Create Command File

**Location**: `.claude/commands/speckit.[name].md`

**Naming convention**:
- Main workflow: `speckit.[phase].md` (e.g., `speckit.test.md`)
- Support commands: `speckit.[phase]-[action].md` (e.g., `speckit.design-iterate.md`)

### Step 3: Define Command Structure

```markdown
---
description: [One-line description for /help]
---

## User Input
\```text
$ARGUMENTS
\```

## Outline
1. Setup & Load Context
2. [Core workflow steps]
3. Validation Gate
4. Report Summary

## Workflow

### 1. Setup & Load Context

**Run prerequisites**:
\```bash
.specify/scripts/bash/check-prerequisites.sh --json
\```

Parse: FEATURE_DIR, AVAILABLE_DOCS

**Load required files**:
- [Input from previous phase]
- [Templates needed]

### 2. [Main Workflow]

[Detailed execution steps]

### 3. Validation Gate

**MANDATORY verification**:
1. Check [output criteria]
2. Verify [integration points]

**If validation FAILS**:
- STOP execution
- Report error clearly

### 4. Report Summary

**Generated** ✅
- [List outputs]

**Next Steps**:
- Run `/speckit.[next]` to [continue workflow]

## Key Rules
- [Command-specific rules]
```

### Step 4: Create Template (if needed)

**Location**: `.specify/templates/[name]-template.md`

**Template structure**:
```markdown
# [Artifact Name]: [PLACEHOLDER]

**Feature**: `[###-feature-name]`
**Date**: [DATE]
**Status**: Draft

## Section 1
(HTML comments with ACTION REQUIRED guidance)

## Section 2
(More structured sections)
```

### Step 5: Add Validation

**Types of validation**:

1. **Input validation** (Step 1-2):
   - Required files exist?
   - Previous phase complete?

2. **Output validation** (Step N-1):
   - All required sections filled?
   - Files in correct locations?
   - Integration points verified?

3. **Integration validation** (Step N-1):
   - Can next phase use this output?
   - Import paths work?
   - References accurate?

### Step 6: Document Integration

**Update related commands**:

If your command sits between two phases:
1. Update predecessor command's "Next Steps"
2. Update successor command's "Load Context"

**Example**: Adding `/speckit.test` between implement and done

Update `speckit.implement.md`:
```markdown
**Next Steps**:
- Run `/speckit.test` to generate E2E tests
- Tests will verify all implemented screens
```

Create `speckit.test.md`:
```markdown
### 1. Setup & Load Context
- Load specs/[feature]/tasks.md (verify implementation complete)
- Load specs/[feature]/design.md (get screen list)
```

### Step 7: Test the Command

**Test checklist**:
- [ ] Run with valid inputs → success
- [ ] Run with missing inputs → clear error
- [ ] Run with invalid inputs → validation catches
- [ ] Output usable by next phase
- [ ] Template properly filled
- [ ] Validation gates work

---

## Validation Gate Patterns

### Pattern 1: File Existence Check

```markdown
**Verify prerequisite files**:
\```bash
if [ ! -f "$FEATURE_DIR/spec.md" ]; then
  echo "ERROR: spec.md not found. Run /speckit.specify first."
  exit 1
fi
\```
```

### Pattern 2: Component Location Validation

```markdown
**VALIDATION CHECKPOINT**:
- [ ] All files in correct directory
- [ ] NO files in wrong location
- [ ] Exports exist in index.ts
- [ ] Imports work in showcase

**If ANY check fails**: STOP, fix before proceeding
```

### Pattern 3: Integration Pre-Flight

```markdown
**Pre-flight verification**:
1. Parse artifact from previous phase
2. For each reference: Verify exists
3. Build verification report

**If ANY verification FAILS**:
- CRITICAL ERROR: Cannot proceed
- STOP execution immediately
- NO fallbacks, NO improvisation
```

### Pattern 4: Cross-Artifact Consistency

```markdown
**Consistency check**:
- Screen list in design.md matches tasks.md?
- Components in tasks.md match packages/ui/?
- Routes in plan.md match implementation?

**Report inconsistencies**: [List]
**Action**: Manual review required
```

---

## Integration Points

### Command → Template

```markdown
Step 7: Document [Artifact]
**Use template**: `.specify/templates/[name]-template.md`
**Create**: `specs/[FEATURE]/[artifact].md`
**Fill sections**: [List required sections]
```

### Command → Script

```markdown
Step 1: Setup
**Run script**: `.specify/scripts/bash/[script-name].sh --json`
**Parse output**: FEATURE_DIR, AVAILABLE_DOCS, etc.
**Use absolute paths**: All paths from script output
```

### Command → Command

```markdown
Step N: Report
**Next Steps**:
- Run `/speckit.[next]` to [action]
- [Next command] will use [this output]
```

**Example**: Task Generation → Validation → Implementation

```markdown
# In /speckit.tasks
**Next Steps**:
- Run `/speckit.verify-tasks` to validate task quality
- Verification ensures completeness, pattern compliance, coverage
- After validation passes: Run `/speckit.implement`

# In /speckit.verify-tasks
**Next Steps**:
- If READY: Run `/speckit.implement` to execute validated tasks
- If BLOCKED: Fix tasks.md and re-run verification

# In /speckit.implement
**Prerequisites**:
- Check for validation-report.md
- If BLOCKED status: Stop and recommend fixing tasks
- If READY status: Proceed with implementation
```

### Command → Codebase

```markdown
Step 3: Create Components
**Location**: `packages/ui/src/features/[feature-name]/`
**Exports**: Update `packages/ui/src/features/index.ts`
**Verification**: Import from `@centrid/ui/features` works
```

---

## Common Patterns

### Loading Context Pattern

```markdown
### 1. Setup & Load Context

**Run prerequisites**:
\```bash
cd /Users/daniel/Projects/misc/centrid
.specify/scripts/bash/check-prerequisites.sh --json
\```

**Parse JSON output**:
- FEATURE_DIR (absolute path to feature)
- AVAILABLE_DOCS (list of existing artifacts)

**Load required context**:
- Read `$FEATURE_DIR/spec.md` (required)
- Read `$FEATURE_DIR/plan.md` (if exists in AVAILABLE_DOCS)
- Read `.specify/templates/[template].md`
```

### Validation Gate Pattern

```markdown
### N-1. Validation Gate

**MANDATORY before creating [artifact]**:

1. **Check requirement 1**: [verification steps]
2. **Check requirement 2**: [verification steps]

**Report**:
\```
✅ Requirement 1: [status]
✅ Requirement 2: [status]
Status: READY for [artifact]
\```

**If validation fails**: STOP, fix issues, re-validate
```

### Report Summary Pattern

```markdown
### N. Report Summary

**Validation** ✅
- [Key validations passed]

**Deliverables** ✅
- [Output 1]: [location]
- [Output 2]: [location]

**Ready** ✓
- Next: Run `/speckit.[next]` to [action]
```

---

## Workflow Extension Points

### Adding a New Phase

**Before design phase**:
1. Create command after `/speckit.plan`
2. Update `speckit.plan.md` next steps
3. Update `speckit.design.md` context loading

**After implement phase**:
1. Create command after `/speckit.implement`
2. Update `speckit.implement.md` next steps
3. Command reads from production code

**Parallel to existing phase**:
1. Create command (e.g., `speckit.design-iterate`)
2. Document when to use vs main command
3. Ensure both output same format

### Adding Validation to Existing Command

**Steps**:
1. Identify what needs validation
2. Add validation step before final output
3. Define failure conditions clearly
4. Update report to include validation status

**Example**: Add component reusability check to `/speckit.design`

```markdown
Step 2.5: Component Reusability Assessment

**Workflow**:
1. Read `packages/ui/src/components/index.ts`
2. Check for similar patterns
3. Categorize: Reuse / Extend / Create

**If similar component exists but not reused**:
- WARNING: Consider reusing [component]
- Document decision in design.md
```

### Adding Template Section

**Steps**:
1. Update template in `.specify/templates/`
2. Update command to fill new section
3. Update successor commands to read new section
4. Update existing features (optional)

**Example**: Add "Performance Considerations" to plan-template.md

```markdown
1. Update plan-template.md: Add ## Performance Considerations section
2. Update speckit.plan.md Step 1: Add "Document performance requirements"
3. Update speckit.tasks.md Step 2: Add "Read performance requirements from plan.md"
```

---

## Troubleshooting Commands

### Command Fails at Validation

**Diagnosis**:
1. Check which validation failed
2. Verify prerequisite artifacts exist
3. Check file paths are absolute
4. Verify permissions

**Fix**:
- Update validation criteria if too strict
- Add better error messages
- Fix prerequisite command if generating bad output

### Command Output Not Usable by Next Phase

**Diagnosis**:
1. Check output format matches template
2. Verify all required sections filled
3. Check integration points documented

**Fix**:
- Update command to fill missing sections
- Update template if structure insufficient
- Add validation gate to catch incomplete output

### Command Too Long/Complex

**Diagnosis**:
1. Does command do multiple things?
2. Too many conditional paths?
3. Verbose explanations?

**Fix**:
- Split into multiple commands (main + iterate)
- Simplify conditional logic
- Condense instructions (keep essentials only)
- Move detailed explanations to documentation

---

## Best Practices

### Do

✅ **Fail fast**: Validate inputs immediately
✅ **Clear errors**: Tell user exactly what's wrong and how to fix
✅ **Absolute paths**: Always use absolute paths from scripts
✅ **Idempotent**: Safe to run command multiple times
✅ **Template-driven**: Use templates for consistent output
✅ **Validation gates**: Verify outputs before next phase
✅ **Document handoffs**: Next command knows what to expect

### Don't

❌ **Silent failures**: Never continue with bad inputs
❌ **Assume paths**: Don't guess, use script output
❌ **Skip validation**: Always validate before proceeding
❌ **Mix concerns**: One command, one responsibility
❌ **Improvise**: Follow templates, don't make up structure
❌ **Leave ambiguity**: Document everything for next phase

---

## Command Maintenance

### Updating Existing Command

**When to update**:
1. New validation needed
2. Process improvement identified
3. Integration point changed
4. Template updated

**Steps**:
1. Update command workflow
2. Update related templates
3. Update successor commands if handoff changed
4. Test with existing features
5. Document changes in `.specify/[COMMAND]-UPDATES.md`

### Deprecating a Command

**Steps**:
1. Mark as deprecated in description
2. Update related commands to skip this phase
3. Update workflow documentation
4. Keep file for reference (don't delete)

### Versioning

**Convention**: Document major changes in `.specify/` directory

Example files:
- `VALIDATION-GATES-SUMMARY.md` - Added validation gates
- `REUSABILITY-UPDATES-SUMMARY.md` - Added reusability workflow
- `INTERACTIONS-FLOWS-SUMMARY.md` - Added interaction documentation

---

## Summary

**Speckit workflow** is a sequential, validated feature development process:

1. Each command is a phase with single responsibility
2. Commands validate inputs from previous phase
3. Commands generate outputs for next phase
4. Templates ensure consistent artifact structure
5. Validation gates prevent bad handoffs
6. Scripts provide integration with codebase

**To create new command**:
1. Identify phase and integration points
2. Create `.claude/commands/speckit.[name].md`
3. Follow command structure pattern
4. Add validation gates
5. Create template if needed
6. Update related commands
7. Test thoroughly

**Key principle**: "Make the next phase's job trivial"

Each command should generate outputs so clear and validated that the next phase can execute confidently without ambiguity.
