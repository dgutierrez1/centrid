---
description: Generate complete feature architecture (frontend + backend + data + integration) from requirements.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. **Setup**: Run `.specify/scripts/bash/check-prerequisites.sh --json` from repo root and parse JSON for FEATURE_DIR, AVAILABLE_DOCS. For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

2. **Load context**:
   - Read `$FEATURE_DIR/spec.md` (REQUIRED - ERROR if missing)
   - Read `.specify/memory/constitution.md` (if exists - for principles)
   - Read `.specify/templates/arch-template.md` (REQUIRED)

3. **Generate architecture**: Follow arch-template structure to document:
   - System context & boundaries
   - UI architecture (screen inventory, user flows, component hierarchy, state management)
   - Data architecture (domain model, data flows)
   - API architecture (if applicable)
   - Security, performance, testing strategies
   - Decision log

4. **Validation gate**: Verify completeness before saving

5. **Report**: Summary of generated architecture with next steps

## Workflow

### Step 1: Setup & Load Context

**Run prerequisites**:
```bash
cd /Users/daniel/Projects/misc/centrid
.specify/scripts/bash/check-prerequisites.sh --json
```

**Parse JSON output**:
- FEATURE_DIR (absolute path to specs/[feature]/)
- AVAILABLE_DOCS (list of existing artifacts)

**CRITICAL VALIDATION**:
- If `spec.md` NOT in AVAILABLE_DOCS: **ERROR and STOP**
  ```
  ERROR: spec.md not found. Run /speckit.specify first.
  Architecture requires requirements specification.
  ```

**Load required context**:
- Read `$FEATURE_DIR/spec.md` (extract user stories, acceptance criteria, entities)
- Read `.specify/memory/constitution.md` (extract architectural principles)
- Read `.specify/memory/system-architecture.md` (project-wide patterns to reference)
- Read `.specify/templates/arch-template.md` (structure to fill)

### Step 2: Extract Architecture Requirements

**From spec.md, extract**:

1. **User Stories → Frontend + Backend Needs**
   - For each user story: Identify if needs UI (screens), API (endpoints), or both
   - UI stories: Extract screens/views needed
   - API stories: Extract endpoints/services needed
   - Determine priorities from story priorities

2. **Acceptance Criteria → Flows + Operations**
   - UI criteria: Map to navigation paths between screens
   - API criteria: Map to request/response operations
   - Identify entry points, decision points, exit points
   - Document happy path vs error flows

3. **Entities → Domain Model**
   - For each entity in spec: Extract attributes, relationships
   - Identify state transitions if applicable
   - Document business rules
   - Map to database schema and API contracts

4. **Functional Requirements → API Surface + Backend Logic**
   - For each user action: Identify API endpoint + backend service needed
   - Determine request/response patterns
   - Map to CRUD operations or custom business logic
   - Identify background jobs if async processing needed

5. **Non-Functional Requirements → Architecture Constraints**
   - Performance targets → Optimization strategies
   - Security requirements → Auth/authorization patterns
   - Scalability needs → Data storage and caching strategies

**From constitution.md, extract**:
- Architectural principles (e.g., simplicity, mobile-first, backend patterns)
- Constraints (e.g., performance targets, tech stack limits)
- Patterns mandated by project (e.g., three-layer backend, REST vs GraphQL)

**From system-architecture.md, identify patterns to reference**:
- Module organization patterns
- State management patterns
- Integration patterns
- Security patterns

### Step 3: Generate Architecture Document

**Create `$FEATURE_DIR/arch.md` using arch-template.md structure**:

**CRITICAL - Reference System Patterns**:
- **DO**: Reference patterns from system-architecture.md by name (e.g., "Uses Controller/View pattern - see system architecture")
- **DON'T**: Re-document patterns that are already in system-architecture.md
- **Focus**: What's UNIQUE to this feature, not what's common across all features
- **Example**: Instead of explaining Controller/View pattern, just say "Follows standard Controller/View pattern with [feature-specific details]"

#### 3.1 System Context

- **Feature Boundaries**: What this feature owns (frontend screens + backend services + data)
- **Dependencies**: Other features/services this depends on
- **Exposes**: APIs/interfaces/events to other features
- **Integration Pattern**: How it connects (event-driven, API calls, shared state)

#### 3.2 Architecture Overview

- **Layers**: Checkbox which layers this feature has (Frontend, Backend, Data, Integration)
- **High-level flow**: Diagram showing user → frontend → backend → database flow

#### 3.3 Frontend Architecture

*SKIP if no frontend (backend-only, CLI, library)*

**3.3.1 Screens & Flows**:
- Table: Screen, Purpose, User Story, Priority, Route/Entry
- Primary user flow diagram
- Navigation pattern

**3.3.2 Component Structure**:
- Component hierarchy per screen (simple tree diagram)
- Pattern reference (reference system-architecture.md, don't duplicate)
- Module locations

**3.3.3 Frontend State Management**:
- Table: State Type, Contains, Scope, Update Pattern
- State flow (reference system pattern or describe if unique)

#### 3.4 Backend Architecture

*SKIP if no backend (frontend-only, static site)*

**3.4.1 API Surface**:
- Table: Endpoint, Method, Purpose, Request, Response, Auth
- API pattern (REST/GraphQL/RPC)
- Contract location

**3.4.2 Service Layer**:
- Table: Service, Responsibilities, Dependencies, Location
- Pattern reference (e.g., "Three-layer backend - see system-architecture.md")

**3.4.3 Background Jobs / Async Processing**:
- Table: Job, Trigger, Frequency, Purpose
- Job queue pattern (if applicable)

#### 3.5 Data Architecture

**3.5.1 Domain Model**:
- Table: Entity, Key Attributes, Relationships, Lifecycle States
- Business rules

**3.5.2 Storage Strategy**:
- Table: Data Type, Storage, Reason, Retention
- Different storage for different data types (database, file storage, cache)

**3.5.3 Data Flow**:
- Read operations pattern + caching strategy
- Write operations pattern + consistency model

#### 3.6 Integration Architecture

**3.6.1 Frontend ↔ Backend Integration**:
- Communication pattern (REST, GraphQL, WebSocket)
- Data flow diagram
- Real-time updates (if applicable)
- Error handling (4xx, 5xx, network errors)

**3.6.2 External Service Integration**:
- Table: Service, Purpose, Integration Pattern, Error Handling
- For each external dependency

#### 3.7 Security Architecture

**3.7.1 Authentication & Authorization**:
- Authentication method
- Authorization model
- Enforcement points (frontend, backend, database)

**3.7.2 Data Protection**:
- Sensitive data handling per type (passwords, API keys, PII)

#### 3.8 Key Architectural Decisions

- **Decision 1**: Context, Options, Chosen, Why, Consequences
- **Decision 2**: Same format
- **Decision 3-5**: Cover major choices across frontend, backend, data, integration

#### 3.9 Performance Considerations

- Critical paths with targets
- Optimization strategies
- Scalability concerns

#### 3.10 Implementation Handoff

- What /speckit.plan needs
- What /speckit.design needs
- What /speckit.tasks needs

**IMPORTANT GUIDELINES**:

1. **Technology-Agnostic**: Use generic terms (module/component/view, not React/Vue/Angular)
2. **Pattern-Focused**: Document patterns, not implementations
3. **Rationale-Heavy**: Every decision should explain WHY
4. **Trade-off Aware**: Document what was sacrificed for each choice
5. **Future-Proof**: Reference extension points for post-MVP
6. **Testable**: All architectural decisions should be verifiable

### Step 4: Validation Gate

**MANDATORY verification before saving arch.md**:

**Completeness Checks**:
- [ ] All user stories from spec.md covered (frontend screens OR backend APIs OR both)
- [ ] Frontend architecture complete (if UI feature): Screens, flows, components, state
- [ ] Backend architecture complete (if API feature): API surface, services, background jobs
- [ ] Data architecture complete: Domain model, storage strategy, data flows
- [ ] Integration architecture complete: Frontend↔Backend + External services documented
- [ ] Security architecture addressed: Auth, authorization, data protection
- [ ] At least 2 key decisions documented with rationale (covering frontend + backend choices)

**Consistency Checks**:
- [ ] Entity names consistent across frontend, backend, data sections
- [ ] API endpoints match between backend and integration sections
- [ ] Screen names consistent between frontend sections
- [ ] State management aligns with data flow patterns

**Balance Checks** (for full-stack features):
- [ ] Frontend and backend have equal detail (not UI-heavy or API-heavy)
- [ ] No section dominates (complete picture across all layers)
- [ ] Each layer (frontend, backend, data, integration) has clear purpose and rationale
- [ ] Integration points clearly documented (how layers communicate)

**Quality Checks**:
- [ ] Architecture follows constitution principles
- [ ] No technology-specific implementations (only patterns)
- [ ] All decisions have documented rationale
- [ ] Trade-offs explicitly stated
- [ ] MVP scope respected (no premature optimization)
- [ ] No duplication of system-architecture.md patterns (references instead)
- [ ] Focus on feature-specific architecture, not general patterns

**VALIDATION REPORT**:

Generate validation report:
```
Architecture Validation Report
=============================

✅ Completeness: [X/Y] checks passed
✅ Consistency: [X/Y] checks passed
✅ Quality: [X/Y] checks passed

Status: READY / NEEDS WORK

[If NEEDS WORK: List specific issues]
```

**If validation fails**: STOP, report issues, do not save arch.md

### Step 5: Save Architecture Document

**Only if validation passes**:

**Write to**: `$FEATURE_DIR/arch.md`

**Use**: arch-template.md structure with all sections filled

**Preserve**:
- Template structure and section order
- HTML comments with guidance
- Validation checklist at end

### Step 6: Report Summary

**Success message**:

```
✅ Complete Feature Architecture Generated

**Feature**: [###-feature-name]
**Branch**: [branch-name]

**Created**:
- Architecture spec: specs/[###-feature-name]/arch.md

**Architecture Summary**:
**Frontend** (if applicable):
  - Screens: [N]
  - User flows: [N]
  - Component hierarchies: [N]

**Backend** (if applicable):
  - API endpoints: [N]
  - Services: [N]
  - Background jobs: [N]

**Data**:
  - Entities: [N]
  - Storage strategies: [N]

**Integration**:
  - Frontend↔Backend patterns: [pattern]
  - External services: [N]

**Decisions**: [N] key architectural decisions logged

**Validation**: ✅ All checks passed (completeness, consistency, balance, quality)

**Next Steps**:
1. Review arch.md for accuracy and completeness (covers full-stack architecture)
2. Run /speckit.plan to generate technical implementation plan
   - Plan will use: Domain model, API contracts, service structure, integration patterns
3. Run /speckit.design to create UI/UX visual design (if UI feature)
   - Design will use: Screen inventory, user flows, component hierarchy
4. arch.md is the single source of truth for feature architecture (frontend + backend + data + integration)

**Note**: Architecture bridges requirements (spec.md) and implementation (plan.md, design.md, tasks.md)
```

**If user provided input ($ARGUMENTS not empty)**:

Address user input:
- If asking about specific section: Highlight that section in report
- If requesting changes: Suggest running /speckit.arch again or editing arch.md directly
- If clarifying: Update arch.md with clarifications and regenerate

## Key Rules

- **Absolute paths**: Always use absolute paths from script output
- **ERROR on missing spec.md**: Cannot generate architecture without requirements
- **Technology-agnostic**: No framework-specific terminology (React, Valtio, Next.js, etc.)
- **Pattern documentation**: Focus on patterns, not implementations
- **Rationale required**: Every architectural decision must explain WHY
- **Validation gate**: Do not save arch.md if validation fails
- **Skip optional sections**: If not applicable (e.g., API for UI-only, UI for API-only), skip section entirely
- **Preserve template structure**: Maintain section order and HTML comments from template
- **No improvisation**: Follow template sections exactly, don't add/remove sections

## Integration Points

**Input dependencies**:
- `spec.md` (REQUIRED): Source of user stories, acceptance criteria, entities
- `constitution.md` (optional): Source of architectural principles

**Output used by**:
- `/speckit.plan`: Uses domain model, API contracts, module structure
- `/speckit.design`: Uses screen inventory, user flows, component hierarchy
- `/speckit.tasks`: Uses module architecture, state management strategy
- `/speckit.implement`: Uses integration patterns, data flows

**Artifact**: `arch.md` is single source of truth for architectural decisions
