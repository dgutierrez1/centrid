---
feature: "004-ai-agent-system"
number: "004"
short_name: "ai-agent"
generated: "2025-11-22T00:00:00Z"
version: "1.1.0"
status: "in-progress"
source_docs: ["spec.md", "arch.md", "plan.md", "ux.md", "design.md", "data-model.md", "research.md", "tasks.md"]
source_hash: "d19d85d58c350b1878a07938c672c16bb7886de918d4359b8f5021678ef693dd"
token_estimate: 2000
---

# AI Agent System (004)

**Purpose**: Solve context fragmentation in AI research by enabling branching threads + provenance tracking + cross-branch semantic discovery + tree consolidation. Researchers explore complex topics in parallel, capture artifacts with full provenance, and consolidate insights from multiple exploration paths.

**Status**: In active development (Phase 3: US1 Branching ~60% complete)

## Architecture

**Tech Stack**: Next.js 14 + React 18 + Valtio + Supabase (PostgreSQL + Edge Functions + Realtime) + Drizzle ORM + Claude 3.5 Sonnet + OpenAI embeddings (768-dim) + pgvector (ivfflat, 100 lists)

**Layout**: Adaptive 3-panel workspace
- Left (20%): Files/Threads sidebar (collapsible)
- Center (40-80%): Thread interface (always visible)
- Right (0-40%): File editor (slides in on file open)

**Key Decisions**:
- Supabase Realtime subscriptions for agent responses and progress updates
- pgvector ivfflat (100 lists) for <1s semantic search
- Valtio + Realtime (no React Query) for optimistic updates + rollback
- Behavioral user preferences (zero-friction: learned from @-mentions, dismissals)
- Memory chunking (10-message chunks, top-3 retrieval for threads >40 messages)

**Performance Targets**:
- Agent response: <5s (simple), <10s (consolidation)
- Semantic search: <1s for 1000 entities
- Context assembly: <1s (6 parallel queries)
- Tree traversal: <2s for 50 branches

## User Stories (P1-P5)

**P1 - Branch Threads**: Parallel exploration without context loss
- Create branch from any message → inherits parent context
- DAG structure (not linear chat history)
- Acceptance: Branch dropdown shows tree, inherited context visible

**P2 - Capture Artifacts**: AI creates files with provenance
- Agent tool calls: `create_file(path, content, context_summary)`
- Metadata: created_in_thread_id, timestamp, context_summary
- Approval flow: pending (10min timeout) → approved/rejected
- Acceptance: File shows source thread, creation context, last edit

**P3 - Cross-Branch Discovery**: Semantic search surfaces relevant files
- Query: "show files related to X" → pgvector similarity search
- Relevance scoring: explicit (1.0) → shadow (0.5) → thread tree (0.7)
- Topic divergence filtering (sibling branches less relevant)
- Acceptance: Search returns files from sibling branches, sorted by relevance

**P4 - Consolidate Tree**: Generate docs from multiple exploration paths
- Tree traversal: select branches → gather artifacts → conflict resolution
- Provenance citations: "From branch [X]: [content]"
- Acceptance: Consolidated doc shows multi-branch sources with citations

**P5 - Provenance Navigation**: "Where did this come from?"
- Navigate: File → thread → message → branch context
- Transparent attribution throughout UI
- Acceptance: Click file → opens source thread at creation message

**Success Metrics**: 70% users create 1+ branch (week 1), 80% retention (3+ branches), 40% branches create artifacts, 30% cross-branch references

## Data Model (9 Entities)

| Entity | Key Fields | Purpose |
|--------|-----------|---------|
| **shadow_entities** | id, entity_type, entity_id, embedding[768], metadata | Unified semantic layer for files/threads/concepts |
| **threads** | id, parent_id, user_id, title, branch_context | DAG conversation structure |
| **messages** | id, thread_id, role, content, tool_calls[], created_at | User/assistant turns |
| **thread_memory_chunks** | id, thread_id, chunk_index, messages[], summary, embedding[768] | Compressed history (threads >40 messages) |
| **files** | id, path, content, created_in_thread_id, context_summary, last_edited_at | Documents with provenance |
| **context_references** | id, thread_id, entity_type, entity_id, source, weight | Explicit context tracking (inherited/manual/@-mentioned) |
| **agent_tool_calls** | id, thread_id, tool_name, args, status, approved_at, timeout_at | Audit log + approval flow |
| **user_preferences** | id, user_id, always_include_files[], excluded_patterns[], blacklisted_branches[] | Behavioral derivation |
| **knowledge_graph_edges** | id, from_entity_id, to_entity_id, relationship_type, weight | Phase 2+ relationships |

**RLS**: All tables enforce `auth.uid() = owner_user_id`

**Indexes**: ivfflat on shadow_entities.embedding (100 lists), threads.parent_id, FKs auto-indexed

## Critical Requirements (Top 10)

1. **FR-001**: DAG thread structure (parent_id, branch from any message)
2. **FR-003**: Branch context inheritance (explicit refs + shadow entities from parent)
3. **FR-010a**: Shadow domain (unified semantic layer: files + threads + concepts → embeddings)
4. **FR-011**: Agent tool calls (`create_file`, `update_file`, `delete_file`)
5. **FR-012**: Provenance metadata (created_in_thread_id, context_summary, timestamp)
6. **FR-021**: Semantic search (pgvector cosine similarity on shadow_entities)
7. **FR-023**: Relevance scoring (6 context domains with weights: explicit 1.0, shadow 0.5, tree 0.7, memory 0.6, prefs 0.8, kg 0.6)
8. **FR-030**: Tree consolidation (multi-branch artifact gathering)
9. **FR-047**: Realtime subscriptions (agent progress updates via Supabase Realtime)
10. **FR-050**: Approval flow (pending → approved/rejected, 10min timeout)

## Implementation Status

**✅ Completed**:
- Database schema (9 tables, RLS policies, pgvector indexes)
- 8 repositories (full CRUD for all entities)
- 37 UI presenter components (all designed components implemented)
- Valtio state stores (aiAgentState, filesystemState)

**🔄 In Progress (Phase 3: US1 Branching ~60%)**:
- 11 container components (WorkspaceContainer, BranchSelectorContainer, ContextPanelContainer, etc.)
- 20 custom hooks (useSendMessage, useLoadThread, useCreateBranch, useAgentStreaming, etc.)
- 4 backend services (agentExecution, agentExecutionEventBus, agentRequestService, filesystemService)
- 3 GraphQL types (agentExecutionEvent, agentRequest, agentSession)

**⏳ Planned**:
- Phase 4: US2 Artifacts (agent tool calls, approval flow, file CRUD)
- Phase 5: US3 Discovery (semantic search, relevance scoring, topic divergence)
- Phase 6: US4 Consolidation (tree traversal, conflict resolution, citations)
- Phase 7: US5 Provenance (navigation flows, transparent attribution)

## Primary Flows

**Send Message with Agent**:
1. User types → ThreadInput → useSendMessage hook
2. Optimistic message in UI (Valtio)
3. Realtime subscription → AgentStreamMessage → progress events
4. Tool calls → ToolCallApproval modal (pending/approve/reject)
5. Context panel updates (show inherited + explicit refs)

**Create Branch**:
1. User clicks "Branch" on message → CreateBranchModal
2. Enter title → useCreateBranch hook
3. API: Create thread (parent_id = current), inherit context_references
4. Navigate to new thread → load inherited context
5. Context panel shows "Inherited from parent" section

**Cross-Branch Discovery** (Phase 5):
1. User types "@" → autocomplete triggers semantic search
2. Query shadow_entities (embedding similarity)
3. Score by relevance (6 domains with weights)
4. Display results → select → add to explicit context
5. File editor slides in → shows provenance header

**Consolidate Branches** (Phase 6):
1. User clicks "Consolidate" → ConsolidateModal
2. Select branches (tree traversal from root)
3. Gather artifacts (files created in each branch)
4. Conflict resolution (last-edit wins, show diff)
5. Generate doc with citations ("From branch [X]: [content]")

## File Locations

**UI Components**:
- Containers: `apps/web/src/components/ai-agent-system/*.tsx` (11 files)
- Presenters: `packages/ui/src/features/ai-agent-system/*.tsx` (37 files)

**State Management**:
- Hooks: `apps/web/src/lib/hooks/*.ts` (20 files)
- Stores: `apps/web/src/lib/state/aiAgentState.ts`, `apps/web/src/lib/state/filesystem.ts`

**Backend**:
- Services: `apps/api/src/services/agent*.ts`, `apps/api/src/services/filesystemService.ts`
- Repositories: `apps/api/src/repositories/agent*.ts` (4 files)
- GraphQL types: `apps/api/src/graphql/types/agent*.ts` (3 files)

**Database**:
- Schema: `apps/api/src/db/schema.ts` (shadow_entities, threads, messages, files, context_references, agent_tool_calls, thread_memory_chunks, user_preferences, knowledge_graph_edges)

## Links

- **[Full Requirements](./spec.md)** - 67 FRs, edge cases, acceptance criteria
- **[Architecture](./arch.md)** - Frontend/backend/data/integration layers
- **[UX Specification](./ux.md)** - Detailed flows, 24 components, interaction patterns
- **[Visual Design](./design.md)** - Component mapping, screenshots, design system
- **[Technical Plan](./plan.md)** - Tech stack, constitution check, structure
- **[Data Model](./data-model.md)** - Full schema with field descriptions, RLS policies
- **[Research](./research.md)** - 8 key decisions with benchmarks
- **[Tasks](./tasks.md)** - 200+ implementation checklist

---

*Context v1.1.0 | Source docs modified 2025-11-22 | Run `/feature.ai-agent` to reload*
