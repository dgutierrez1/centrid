# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Research Summary

**Reference**: `research.md` (Phase 0 output from `/speckit.plan`)

**Purpose**: Document technology evaluations, architectural decisions, and alternatives considered during planning phase.

**Key Decisions**:

<!--
  ACTION REQUIRED: Summarize 3-5 key decisions from research.md with rationale.
  Link to research.md for full details (benchmarks, evaluations, alternatives).

  Format:
  1. [Decision name]: [What was chosen]
     - Rationale: [Why chosen - 1-2 sentences]
     - Alternatives considered: [What else was evaluated]
     - See research.md section [X] for full evaluation
-->

1. [Technology choice 1]: [Selected option]
   - Rationale: [Why this choice]
   - Alternatives considered: [What else was evaluated]
   - See research.md section [X] for full evaluation

2. [Architecture pattern 1]: [Selected pattern]
   - Rationale: [Why this pattern]
   - Alternatives considered: [What else was evaluated]
   - See research.md section [X] for full evaluation

3. [Performance strategy 1]: [Selected approach]
   - Rationale: [Why this approach]
   - Alternatives considered: [What else was evaluated]
   - See research.md section [X] for full evaluation

**Research Artifacts**:
- Benchmarks: [Link to research.md sections with performance data]
- Security considerations: [Link to research.md sections with security analysis]
- Third-party library comparisons: [Link to research.md sections with library evaluations]

**Audit Trail**: All decisions in this plan are based on research documented in `research.md`. To understand why a technology/pattern was chosen, refer to research.md for detailed evaluations, benchmarks, and alternatives considered.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]  
**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]  
**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]  
**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]  
**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]
**Project Type**: [single/web/mobile - determines source structure]  
**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]  
**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]  
**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

[Gates determined based on constitution file]

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

## UI Architecture Reference

*SKIP this section if project has no UI (API-only, CLI, library)*

**UI Architecture is documented in `arch.md`** (generated by `/speckit.arch`):
- Screen inventory and user flows → arch.md
- Component structure and hierarchy → arch.md
- State management strategy → arch.md
- Data flow patterns → arch.md

**This section (plan.md) focuses on**:
- Technical implementation approach
- Tech stack selection and rationale
- Integration with backend services
- Implementation-specific concerns (not architectural patterns)

