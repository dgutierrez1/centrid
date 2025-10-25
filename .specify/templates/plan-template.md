# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

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

## Component Architecture

*SKIP this section if project has no UI (API-only, CLI, library)*

### 1. Screen Inventory

List all screens/views from spec.md user stories:

| Screen | Route | User Story | Purpose |
|--------|-------|------------|---------|
| [Example: Workspace] | `/workspace` | US-001 | Main editing interface |
| [Example: Settings] | `/settings` | US-002 | User preferences |

### 2. Component Hierarchy (Per Screen)

For each screen, define component tree (indent = nesting):

**[Screen 1 Name]**:
```
ScreenContainer (container)
├─ ScreenComponent (presenter: features/[feature]/)
│  ├─ CommonComponent1 (presenter: components/)
│  │  └─ Primitive (presenter: components/)
│  └─ CommonComponent2 (presenter: components/)
└─ FeatureComponent (presenter: features/[feature]/)
```

**[Screen 2 Name]**:
```
[Similar hierarchy...]
```

**Legend**:
- `(container)` = Smart component with business logic → `apps/web/src/components/[feature]/`
- `(presenter)` = Pure UI component → `packages/ui/src/components/` or `packages/ui/src/features/[feature]/`

### 3. Container/Presenter Mapping

**Containers** (business logic, data fetching, state):

| Container | Location | Responsibilities |
|-----------|----------|------------------|
| `[ScreenContainer]` | `apps/web/src/components/[feature]/` | Fetches data, manages state, wraps [ScreenComponent] |
| `[FeatureProvider]` | `apps/web/src/components/[feature]/` | Provides context, real-time subscriptions |

**Presenters** (UI only, props in → JSX out):

| Component | Location | Props Interface | Reusability |
|-----------|----------|-----------------|-------------|
| `[ScreenComponent]` | `packages/ui/src/features/[feature]/` | `{ data, onAction, ... }` | Feature-specific |
| `[CommonComponent]` | `packages/ui/src/components/` | `{ items, onSelect, ... }` | Cross-feature |

**Pattern**: Container/Presenter (Smart/Dumb) - Containers in apps/, presenters in packages/

### 4. State Management Strategy

**Global State** (e.g., Valtio, Redux, Zustand):

| State Slice | Location | Contains | Updated By |
|-------------|----------|----------|------------|
| `[stateName]` | `apps/web/src/lib/state/[feature].ts` | `{ entities, selectedId, ... }` | [Provider] (real-time), [Service] (optimistic) |

**Component State** (React useState/useReducer):

| Component | State | Scope | Why Local |
|-----------|-------|-------|-----------|
| `[Component]` | `[stateName]` | Component only | [Reason: typing performance, UI state, not persisted] |

**URL State** (Router params/query):

| Param | Location | Synced With |
|-------|----------|-------------|
| `[paramName]` | `/route/:param` | `[stateName].[field]` |

**State Update Patterns**:
- **Real-time**: Subscriptions → Global state → Component re-renders
- **Optimistic**: User action → Global state → Service call → On error: rollback
- **Debounced**: Typing → Local state → (debounce) → Service call

### 5. Data Flow Architecture

**Props Down (Parent → Child)**:

```
Container
  ├─ Fetches: [Service].[method]()
  ├─ Reads: [globalState]
  ├─ Maps: data → props
  └→ Presenter({ items, selectedId, onSelect, ... })
      ├─ Transforms: props → UI format
      └→ ChildPresenter({ item, isSelected, onSelect })
```

**Callbacks Up (Child → Parent)**:

```
ChildPresenter
  ├─ User action (click, type, etc.)
  └→ calls: onSelect(id) ↑
      └→ Presenter
          └→ bubbles: onSelect(id) ↑
              └→ Container
                  ├─ Updates: globalState.[field] = id
                  └─ Calls: [Service].[method](id)
```

**Critical Rules**:
- **IDs flow** (not objects - prevents stale data)
- **Lookups at container** (container maps ID → object → props)
- **Callbacks minimal** (`onSelect(id)` not `onSelect(object)`)
- **Validation in services** (not components)

### 6. Composition Patterns

**Available Patterns**:

| Pattern | Use When | Example |
|---------|----------|---------|
| **Prop Drilling** | Shallow tree (<3 levels) | `Parent → Child → Grandchild` passing props explicitly |
| **Context** | Deep tree (3+ levels) | `Provider` at top, `useContext()` in descendants |
| **Render Props** | Custom rendering | `<Component render={(data) => <Custom />} />` |
| **Compound Components** | Related UI elements | `<Editor><Editor.Toolbar /><Editor.Content /></Editor>` |

**This Feature Uses**:
- [Pattern 1]: [Reason - e.g., Prop drilling for Screen → Components (shallow, 2 levels)]
- [Pattern 2]: [Reason - e.g., Context for Provider (deep tree, global access)]

