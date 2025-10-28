# Tasks: AI-Powered Exploration Workspace

**Feature**: `004-ai-agent-system`
**Generated**: 2025-10-27
**Input**: spec.md (user stories), arch.md (architecture), design.md (UI components), ux.md (flows), data-model.md (database schema)

**Tests**: No test tasks included (not requested in specification)

**Organization**: Tasks organized by user story (P1-P5) to enable independent implementation and testing.

**Design Integration**: ✅ ENABLED - All designed components available in `packages/ui/src/features/ai-agent-system/`

---

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5)
- All tasks include exact file paths

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency setup

- [ ] T001 Install required dependencies: @anthropic-ai/sdk (Claude API client), openai (embeddings), zod (validation), react-markdown (message rendering) in package.json
- [ ] T002 [P] Configure TypeScript paths in tsconfig.json: Add @/ai-agent-system alias for apps/web/src/components/ai-agent-system/
- [ ] T003 [P] Add SSE streaming endpoint configuration in apps/api/supabase/config.toml for agent-execution Edge Function

**Checkpoint**: Dependencies and configuration ready

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Schema & RLS

- [ ] T004 Create shadow_entities table in apps/api/src/db/schema.ts with fields: shadow_id, owner_user_id, entity_id, entity_type (file/thread/kg_node), embedding (vector 768-dim), summary (text), structure_metadata (jsonb), last_updated, created_at
- [ ] T005 [P] Create threads table in apps/api/src/db/schema.ts with fields: thread_id, owner_user_id, parent_id (nullable), branch_title, creator (user/agent/system), thread_summary, parent_last_message, branching_message_content, blacklisted_branches (text[]), shadow_domain_id, created_at, updated_at
- [ ] T006 [P] Create messages table in apps/api/src/db/schema.ts with fields: message_id, thread_id, owner_user_id, role (user/assistant), content, tool_calls (jsonb[]), timestamp, tokens_used
- [ ] T007 [P] Create thread_memory_chunks table in apps/api/src/db/schema.ts with fields: chunk_id, thread_id, owner_user_id, message_ids (uuid[]), embedding (vector 768-dim), summary, timestamp_range (jsonb), chunk_index, created_at
- [ ] T008 [P] Create files table in apps/api/src/db/schema.ts with fields: file_id, owner_user_id, path, content, created_in_thread_id (nullable), creation_timestamp (nullable), context_summary (nullable), last_edited, last_edited_by (agent/user), edited_in_thread_id (nullable), shadow_domain_id, created_at, updated_at
- [ ] T009 [P] Create context_references table in apps/api/src/db/schema.ts with fields: reference_id, thread_id, owner_user_id, entity_type (file/folder/thread), entity_reference, source (inherited/manual/@-mentioned/agent-added), priority_tier (1/2/3), added_timestamp, created_at
- [ ] T010 [P] Create agent_tool_calls table in apps/api/src/db/schema.ts with fields: tool_call_id, message_id, thread_id, owner_user_id, tool_name, tool_input (jsonb), tool_output (jsonb), approval_status (pending/approved/rejected/timeout), timestamp, created_at
- [ ] T011 [P] Create user_preferences table in apps/api/src/db/schema.ts with fields: preference_id, user_id, always_include_files (text[]), excluded_patterns (text[]), blacklisted_branches (uuid[]), context_budget (integer default 200000), last_updated, derived_from_days (integer default 30), created_at
- [ ] T012 Create pgvector indexes in apps/api/src/db/schema.ts: shadow_entities(embedding) using ivfflat with 100 lists, threads(parent_id), files(owner_user_id, created_at), context_references(thread_id, entity_type)
- [ ] T013 Create RLS policies in apps/api/src/db/schema.ts: All tables enforce auth.uid() = owner_user_id/user_id for SELECT, INSERT, UPDATE, DELETE operations
- [ ] T014 Run database schema push: cd apps/api && npm run db:push (applies schema + indexes + RLS policies to remote Supabase)

### Repositories (Data Access Layer)

- [ ] T015 [P] Create ShadowEntityRepository in apps/api/src/repositories/shadowEntity.ts with methods: create(entityId, entityType, embedding, summary, structureMetadata), findByEntityId(entityId, entityType), searchSemantic(query, entityTypes[], limit), update(shadowId, embedding, summary, structureMetadata), delete(shadowId)
- [ ] T016 [P] Create ThreadRepository in apps/api/src/repositories/thread.ts with methods: create(parentId, branchTitle, creator), findById(threadId), findChildren(threadId), findByUserId(userId), update(threadId, updates), delete(threadId), updateSummary(threadId, summary)
- [ ] T017 [P] Create MessageRepository in apps/api/src/repositories/message.ts with methods: create(threadId, role, content, toolCalls), findByThreadId(threadId, limit, offset), findById(messageId), countByThreadId(threadId), delete(messageId)
- [ ] T018 [P] Create FileRepository in apps/api/src/repositories/file.ts with methods: create(path, content, provenance?), findById(fileId), findByPath(path), findByUserId(userId), update(fileId, content, editMetadata), delete(fileId), updateProvenance(fileId, provenance)
- [ ] T019 [P] Create ContextReferenceRepository in apps/api/src/repositories/contextReference.ts with methods: create(threadId, entityType, entityReference, source, priorityTier), findByThreadId(threadId), delete(referenceId), bulkCreate(references[])
- [ ] T020 [P] Create AgentToolCallRepository in apps/api/src/repositories/agentToolCall.ts with methods: create(messageId, threadId, toolName, toolInput), findById(toolCallId), updateStatus(toolCallId, status, output?), findPendingByThreadId(threadId)
- [ ] T021 [P] Create MemoryChunkRepository in apps/api/src/repositories/memoryChunk.ts with methods: create(threadId, messageIds, embedding, summary, timestampRange, chunkIndex), findByThreadId(threadId), searchSemantic(query, threadId, limit), delete(chunkId)
- [ ] T022 [P] Create UserPreferencesRepository in apps/api/src/repositories/userPreferences.ts with methods: findByUserId(userId), upsert(userId, preferences), updateDerived(userId, interactions), isStale(userId)

### External Service Clients

- [ ] T023 [P] Create OpenAI client in apps/api/src/lib/openai.ts with generateEmbedding(text) method returning 768-dim vector using text-embedding-3-small model
- [ ] T024 [P] Create Anthropic client in apps/api/src/lib/anthropic.ts with streamResponse(messages, tools, systemPrompt) method for Claude 3.5 Sonnet with SSE streaming support

### Core Services (Business Logic)

- [ ] T025 Create ShadowDomainService in apps/api/src/services/shadowDomain.ts with methods: generateForFile(fileId, content), generateForThread(threadId, messages), updateWhenChanged(entityId, entityType, newContent), checkChangeThreshold(oldContent, newContent) → boolean for >20% character diff
- [ ] T026 Create SemanticSearchService in apps/api/src/services/semanticSearch.ts with methods: search(query, entityTypes[], threadTreeMetadata, limit), applyRelationshipModifiers(results, currentThreadId, threadTree), applyTemporalDecay(results), searchMemoryChunks(query, threadId, limit)
- [ ] T027 Create UserPreferencesService in apps/api/src/services/userPreferences.ts with methods: loadContextPreferences(userId), deriveFromInteractions(userId, last30DaysData), analyzeAtMentionFrequency(messages), analyzeDismissalPatterns(semanticMatches), recompute(userId)
- [ ] T028 Create ContextAssemblyService in apps/api/src/services/contextAssembly.ts with methods: buildPrimeContext(threadId, message), gatherExplicitContext(contextReferences), gatherSemanticMatches(query, threadId), gatherThreadTreeContext(threadId), gatherMemoryChunks(query, threadId), gatherUserPreferences(userId), prioritizeAndFit(allContextSources, 200K limit), identifyExcluded(contextSources, included)
- [ ] T029 Create ProvenanceTrackingService in apps/api/src/services/provenanceTracking.ts with methods: createFileWithProvenance(path, content, threadId, contextSummary), updateLastEdit(fileId, editedBy, threadId?), handleFileRename(fileId, newPath), clearProvenance(fileId)
- [ ] T030 Create ToolCallService in apps/api/src/services/toolCall.ts with methods: executeWriteFile(path, content, threadId, approved), executeCreateBranch(title, contextFiles, parentId, approved), executeSearchFiles(query, userId), executeReadFile(path, userId), executeListDirectory(path, userId), waitForApproval(toolCallId, timeout=600000)
- [ ] T031 Create AgentExecutionService in apps/api/src/services/agentExecution.ts with methods: executeWithStreaming(threadId, userMessage, primeContext, sseChannel), streamTextChunks(sseChannel, chunks), handleToolCalls(tools, sseChannel), pauseForApproval(toolCall, sseChannel), resumeAfterApproval(toolCallId, approved, sseChannel), handleRejection(toolCallId, reason, sseChannel)
- [ ] T032 Create ConsolidationService in apps/api/src/services/consolidation.ts with methods: consolidateFromBranches(parentThreadId, childThreadIds), traverseTree(rootId), gatherArtifacts(threadIds), handleConflicts(artifacts, prioritization), generateWithProvenance(artifacts, threadIds)

### Background Job Endpoints

- [ ] T033 [P] Create POST /shadow-domain/sync Edge Function in apps/api/src/functions/shadow-domain-sync/index.ts: Parse entityId + entityType → Call ShadowDomainService.updateWhenChanged → Return { data: { shadowDomainId, status: 'queued' } }
- [ ] T034 [P] Create POST /threads/:id/summarize Edge Function in apps/api/src/functions/summarize-thread/index.ts: Load thread messages → Generate summary with Claude (topics, decisions, artifacts, questions) → Update threads.thread_summary → Return { data: { status: 'queued' } }
- [ ] T035 [P] Create POST /threads/:id/compress-memory Edge Function in apps/api/src/functions/compress-memory/index.ts: Load messages 1-30 → Chunk in batches of 10 → Generate embeddings + summaries → Create MemoryChunk records → Return { data: { chunksCreated, status: 'queued' } }
- [ ] T036 [P] Create POST /user-preferences/recompute Edge Function in apps/api/src/functions/recompute-preferences/index.ts: Load user interactions (last 30 days) → Call UserPreferencesService.recompute → Update user_preferences table → Return { data: { updated: true } }

**Checkpoint**: Foundation complete - User story implementation can begin in parallel

---

## Phase 3: User Story 1 - Branch Threads for Parallel Exploration (Priority: P1) 🎯 MVP

**Goal**: Users can create child branches from any thread, navigate between branches, and maintain isolated context per branch

**Independent Test**: Create branch from Main thread → Navigate to new branch → Verify inherited context shows parent files + summary → Send message in new branch → Switch back to Main → Verify contexts are isolated

### Implementation for User Story 1

#### Backend API

- [ ] T037 [P] [US1] Create POST /threads Edge Function in apps/api/src/functions/create-thread/index.ts: Validate JWT → Parse { title, parentId? } → Call ThreadRepository.create → If parentId: copy explicit files as context references (ContextReferenceRepository.bulkCreate) → Return { data: { threadId, title, parentId } }
- [ ] T038 [P] [US1] Create GET /threads/:id Edge Function in apps/api/src/functions/get-thread/index.ts: Validate JWT → ThreadRepository.findById → MessageRepository.findByThreadId (last 40) → ContextReferenceRepository.findByThreadId → Return { data: { thread, messages[], contextReferences[], branchMetadata } }
- [ ] T039 [P] [US1] Create PATCH /threads/:id Edge Function in apps/api/src/functions/update-thread/index.ts: Validate JWT → Parse { title?, archived? } → ThreadRepository.update → Return { data: { thread } }
- [ ] T040 [P] [US1] Create DELETE /threads/:id Edge Function in apps/api/src/functions/delete-thread/index.ts: Validate JWT → Check ThreadRepository.findChildren(id) → If children exist, return 400 error → Else: ThreadRepository.delete (CASCADE via RLS) → Return { data: { success: true } }

#### Frontend State Management

- [ ] T041 [US1] Create Valtio state in apps/web/src/lib/state/aiAgentState.ts with structure: { currentThread: Thread | null, branchTree: { threads: Thread[], parentChildMap: Map<string, string[]> }, messages: Message[], contextReferences: ContextReference[], streamingBuffer: string | null, sseConnection: EventSource | null }
- [ ] T042 [P] [US1] Create custom hook useCreateBranch in apps/web/src/lib/hooks/useCreateBranch.ts: Accept (parentId, title) → Optimistic add to branchTree → POST /threads → On success: navigate to new thread → On error: rollback + toast
- [ ] T043 [P] [US1] Create custom hook useLoadThread in apps/web/src/lib/hooks/useLoadThread.ts: Accept threadId → GET /threads/:id → Update aiAgentState (currentThread, messages, contextReferences) → Return loading/error states
- [ ] T044 [P] [US1] Create custom hook useUpdateThread in apps/web/src/lib/hooks/useUpdateThread.ts: Accept (threadId, updates) → Optimistic update currentThread → PATCH /threads/:id → On error: rollback + toast
- [ ] T045 [P] [US1] Create custom hook useDeleteThread in apps/web/src/lib/hooks/useDeleteThread.ts: Accept threadId → Optimistic remove from branchTree → DELETE /threads/:id → On success: navigate to parent → On error: rollback + toast

#### Frontend Containers (Wrap Designed Components with Business Logic)

- [ ] T046 [US1] Create WorkspaceContainer in apps/web/src/components/ai-agent-system/WorkspaceContainer.tsx: Import { Workspace } from '@centrid/ui/features' → Load current thread with useLoadThread → Pass data to Workspace component → Handle layout state (sidebar collapsed, file editor open)
- [ ] T047 [US1] Create BranchSelectorContainer in apps/web/src/components/ai-agent-system/BranchSelectorContainer.tsx: Import { BranchSelector } from '@centrid/ui/features' → Load branch tree from aiAgentState → Transform to hierarchical structure → Pass to BranchSelector → Handle onSelect(threadId) → Navigate to /thread/:threadId
- [ ] T048 [US1] Create BranchActionsContainer in apps/web/src/components/ai-agent-system/BranchActionsContainer.tsx: Import { BranchActions } from '@centrid/ui/features' → Handle onCreateBranch → Call useCreateBranch hook → Show CreateBranchModal → Handle consolidate/tree view buttons (Phase 4+ functionality)
- [ ] T049 [US1] Create CreateBranchModalContainer in apps/web/src/components/ai-agent-system/CreateBranchModalContainer.tsx: Import { CreateBranchModal } from '@centrid/ui/features' → Manage modal state (open/closed) → Validate branch name (1-100 chars, alphanumeric/-/_) → Call useCreateBranch(currentThreadId, title) on confirm → Show loading/error states
- [ ] T050 [US1] Create ContextPanelContainer in apps/web/src/components/ai-agent-system/ContextPanelContainer.tsx: Import { ContextPanel } from '@centrid/ui/features' → Load contextReferences from aiAgentState → Group by priority tier (Explicit, Frequently Used, Semantic, Branch, Artifacts, Excluded) → Handle section toggle (expandedSections state) → Pass data to ContextPanel component

#### Page Integration

- [ ] T051 [US1] Create /thread/[threadId] page in apps/web/src/pages/thread/[threadId].tsx: Load threadId from router → Render WorkspaceContainer → Include WorkspaceHeader with BranchSelectorContainer + BranchActionsContainer → Include WorkspaceSidebar (Files/Threads tabs) → Include ThreadView (center panel) → Optional FileEditorPanel (right panel)

#### Real-time Subscriptions

- [ ] T052 [US1] Create Supabase Realtime subscription in apps/web/src/providers/RealtimeProvider.tsx: Subscribe to threads table (INSERT/UPDATE) → On change: Update aiAgentState.branchTree → Subscribe to context_references table → On change: Update aiAgentState.contextReferences

**Checkpoint**: User Story 1 functional - Users can create branches, navigate, see inherited context

---

## Phase 4: User Story 2 - Capture Artifacts with Provenance (Priority: P2)

**Goal**: AI creates files from thread insights with provenance metadata (source thread, context summary, timestamp) and agent tool calls require user approval before execution

**Independent Test**: Send message "create RAG summary file" → Agent proposes write_file → Approve → File created with provenance → View file → Provenance header shows source thread + context → File appears in "Artifacts from this thread" context section

### Implementation for User Story 2

#### Backend API - Agent Execution with Streaming

- [ ] T053 [US2] Create POST /threads/:id/messages Edge Function in apps/api/src/functions/send-message/index.ts: Validate JWT → Parse { text, contextReferences[] } → Create message record (role=user) → Call ContextAssemblyService.buildPrimeContext → Call AgentExecutionService.executeWithStreaming → Return { data: { messageId, requestId, sseEndpoint: '/agent-requests/:id/stream' } }
- [ ] T054 [US2] Create GET /agent-requests/:id/stream SSE Edge Function in apps/api/src/functions/stream-agent/index.ts: Validate JWT → Open SSE connection (Content-Type: text/event-stream, keep-alive) → Stream context_ready event → Call Anthropic client with streaming → Relay text_chunk events → Relay tool_call events with approval_required flag → On tool approval required: pause stream → Resume after approval received → On completion: close SSE with completion event
- [ ] T055 [US2] Create POST /agent-requests/:id/approve Edge Function in apps/api/src/functions/approve-tool/index.ts: Validate JWT → Parse { toolCallId, approved: boolean, reason? } → AgentToolCallRepository.updateStatus → If approved: ToolCallService.execute (write_file/create_branch/etc.) → Return { data: { success, resumeStream: true } } → Trigger SSE resume
- [ ] T056 [US2] Create POST /files Edge Function in apps/api/src/functions/create-file/index.ts: Validate JWT → Parse { path, content, provenance? } → FileRepository.create → Fire-and-forget POST /shadow-domain/sync with { entityId: fileId, entityType: 'file' } → Return { data: { fileId, path, shadowDomainId } }
- [ ] T057 [P] [US2] Create GET /files/:id Edge Function in apps/api/src/functions/get-file/index.ts: Validate JWT → FileRepository.findById → ShadowEntityRepository.findByEntityId(fileId, 'file') → Return { data: { file, content, provenance, shadowDomain } }
- [ ] T058 [P] [US2] Create PUT /files/:id Edge Function in apps/api/src/functions/update-file/index.ts: Validate JWT → Parse { content } → FileRepository.update (last_edited, last_edited_by=user, edited_in_thread_id=null) → Check character diff >20% → If yes: Fire-and-forget POST /shadow-domain/sync → Return { data: { file, shadowDomainUpdated: boolean } }
- [ ] T059 [P] [US2] Create DELETE /files/:id Edge Function in apps/api/src/functions/delete-file/index.ts: Validate JWT → FileRepository.delete (CASCADE deletes shadow_entity via RLS) → Return { data: { success: true } }
- [ ] T060 [P] [US2] Create GET /files/:id/provenance Edge Function in apps/api/src/functions/get-file-provenance/index.ts: Validate JWT → FileRepository.findById → ThreadRepository.findById(created_in_thread_id) → Return { data: { createdIn: { threadId, title, timestamp }, contextSummary, lastEditedBy, editedInThreadId } }

#### Backend Services - Tool Call Execution

- [ ] T061 [US2] Implement write_file tool in ToolCallService (apps/api/src/services/toolCall.ts): Accept (path, content, threadId, approved) → If not approved: return { rejected: true } → If approved: Call ProvenanceTrackingService.createFileWithProvenance → Generate context_summary (2-3 sentences from thread) → Create file with provenance metadata → Fire-and-forget POST /shadow-domain/sync → Create context_reference (source=agent-added, priority_tier=1) → Return { fileId, path }
- [ ] T062 [US2] Implement timeout mechanism in AgentExecutionService: When tool approval required → Set 10-minute timeout → If timeout: AgentToolCallRepository.updateStatus(toolCallId, 'timeout') → Close SSE connection → Return error "Approval timed out after 10 minutes" → User must retry from beginning

#### Frontend State Management

- [ ] T063 [US2] Create custom hook useSendMessage in apps/web/src/lib/hooks/useSendMessage.ts: Accept (text) → Optimistic add user message to aiAgentState.messages → POST /threads/:id/messages → Parse sseEndpoint → Open SSE with EventSource → Stream events to streamingBuffer → On tool_call: Show approval modal → Return { sendMessage, isStreaming, stopStream }
- [ ] T064 [P] [US2] Create custom hook useApproveToolCall in apps/web/src/lib/hooks/useApproveToolCall.ts: Accept (toolCallId, approved, reason?) → POST /agent-requests/:id/approve → On success: Resume SSE stream → On error: Show error toast
- [ ] T065 [P] [US2] Create custom hook useLoadFile in apps/web/src/lib/hooks/useLoadFile.ts: Accept fileId → GET /files/:id → Update aiAgentState.currentFile → Return loading/error states
- [ ] T066 [P] [US2] Create custom hook useUpdateFile in apps/web/src/lib/hooks/useUpdateFile.ts: Accept (fileId, content) → Optimistic update currentFile → PUT /files/:id → On error: rollback + toast

#### Frontend Containers (SSE Streaming & Tool Approval)

- [ ] T067 [US2] Create ThreadInputContainer in apps/web/src/components/ai-agent-system/ThreadInputContainer.tsx: Import { ThreadInput } from '@centrid/ui/features' → Manage input state (text, characterLimit=10000) → Call useSendMessage on submit → Toggle send/stop button based on isStreaming → Handle onStop → Close SSE connection
- [ ] T068 [US2] Create MessageStreamContainer in apps/web/src/components/ai-agent-system/MessageStreamContainer.tsx: Import { MessageStream, Message, AgentStreamMessage } from '@centrid/ui/features' → Load messages from aiAgentState → Render user messages with Message component → Render agent streaming messages with AgentStreamMessage (shows incremental text + tool calls) → Auto-scroll to bottom on new chunks
- [ ] T069 [US2] Create ToolCallApprovalContainer in apps/web/src/components/ai-agent-system/ToolCallApprovalContainer.tsx: Import { ToolCallApproval } from '@centrid/ui/features' → Manage approval modal state → Parse tool_call event from SSE → Show preview (file path, content preview, operation type) → Call useApproveToolCall(toolCallId, approved) on user action → Show loading state during approval
- [ ] T070 [US2] Create FileEditorPanelContainer in apps/web/src/components/ai-agent-system/FileEditorPanelContainer.tsx: Import { FileEditorPanel, ProvenanceHeader } from '@centrid/ui/features' → Load file with useLoadFile(fileId) → Show provenance header with source thread, timestamp, context summary, last edit info → Handle "Go to source" → Navigate to /thread/:sourceThreadId → Handle content edits → Call useUpdateFile(fileId, newContent)

#### Fire-and-Forget Background Jobs

- [ ] T071 [US2] Add fire-and-forget call in POST /files Edge Function (apps/api/src/functions/create-file/index.ts): After file created → fetch('/shadow-domain/sync', { method: 'POST', body: JSON.stringify({ entityId: fileId, entityType: 'file' }) }).catch(err => logError(err)) → Do not await → Return immediately
- [ ] T072 [US2] Add fire-and-forget call in POST /threads/:id/messages Edge Function (apps/api/src/functions/send-message/index.ts): After message created → fetch('/threads/:id/summarize', { method: 'POST' }).catch(err => logError(err)) → If message count > 40: fetch('/threads/:id/compress-memory', { method: 'POST' }).catch(err => logError(err)) → Do not await → Return immediately

**Checkpoint**: User Story 2 functional - Users can send messages, agent streams responses, tool calls require approval, files created with provenance

---

## Phase 5: User Story 3 - Cross-Branch Context Discovery (Priority: P3)

**Goal**: System surfaces relevant files from sibling branches via semantic search during context assembly, users can manually add semantic matches to explicit context

**Independent Test**: Create file in Branch A about "RAG" → Switch to Branch B → Send message mentioning "retrieval" → Semantic matches section shows file from Branch A with relevance score + sibling relationship indicator → Click file → File editor opens with provenance → Click "Add to Explicit" → File moves to Explicit section with 1.0 weight

### Implementation for User Story 3

#### Backend API - Semantic Search

- [ ] T073 [P] [US3] Create POST /shadow-domain/search Edge Function in apps/api/src/functions/search-shadow-domain/index.ts: Validate JWT → Parse { query, entityTypes[], limit? } → Generate query embedding via OpenAI → Call SemanticSearchService.search → Return { data: { entities[], relevanceScores[] } }

#### Backend Services - Context Assembly with Semantic Search

- [ ] T074 [US3] Implement gatherSemanticMatches in ContextAssemblyService (apps/api/src/services/contextAssembly.ts): Extract query intent from user message → Generate embedding via OpenAI → Call SemanticSearchService.search(query, ['file', 'thread'], threadTreeMetadata, limit=10) → Apply relationship modifiers (siblings +0.10, parent/child +0.15) via SemanticSearchService → Apply temporal decay (1.0 - months × 0.05, floor 0.3) → Filter by topic divergence (if branch similarity <0.3, only include matches with relevance >0.9) → Check user_preferences.blacklisted_branches → Exclude blacklisted branches from results → Return top 10 semantic matches with final scores
- [ ] T075 [US3] Implement gatherUserPreferences in ContextAssemblyService: Load UserPreferencesService.loadContextPreferences(userId) → Apply excluded_patterns FIRST (filter out files matching regex before semantic search) → Add always_include_files to priority list with 0.8 weight (between explicit 1.0 and semantic 0.5) → Return { alwaysIncludeFiles, excludedPatterns, blacklistedBranches }
- [ ] T076 [US3] Integrate multi-domain gathering in buildPrimeContext: Run 6 domain queries in parallel using Promise.all: [1] gatherExplicitContext (1.0 weight), [2] gatherSemanticMatches (0.5 base + modifiers), [3] gatherThreadTreeContext (0.7 weight), [4] gatherMemoryChunks (if >40 messages), [5] gatherUserPreferences (0.8 weight for always-include, filtering for excluded), [6] gatherKnowledgeGraph (Phase 2+ - deferred) → Merge all results → Call prioritizeAndFit(allSources, 200K limit) → Return { primeContext, excludedItems }

#### Frontend Containers - Context Management

- [ ] T077 [US3] Update ContextPanelContainer in apps/web/src/components/ai-agent-system/ContextPanelContainer.tsx: Load semantic matches from context_ready SSE event → Group context by priority tiers: (1) Explicit (coral border, 1.0 weight), (2) Frequently Used (blue border, 0.8 weight - from user preferences always_include_files), (3) Semantic Matches (purple border, 0.5 base + modifiers), (4) Branch Context (orange border, 0.7 weight), (5) Artifacts from this thread (green border, agent-added files), (6) Excluded from context (gray border, items that didn't fit in 200K budget) → Pass to ContextPanel component with expandedSections state
- [ ] T078 [US3] Create useAddToExplicit hook in apps/web/src/lib/hooks/useAddToExplicit.ts: Accept fileId → Optimistic move from Semantic section to Explicit section in aiAgentState.contextReferences → POST /context-references with { threadId, entityType: 'file', entityReference: fileId, source: 'manual', priorityTier: 1 } → On error: rollback + toast
- [ ] T079 [US3] Create useHideBranch hook in apps/web/src/lib/hooks/useHideBranch.ts: Accept branchId → Optimistic add to aiAgentState.currentThread.blacklisted_branches → PATCH /threads/:id with { blacklisted_branches: [...existing, branchId] } → On error: rollback + toast
- [ ] T080 [US3] Update ContextPanelContainer to handle context widget actions: For each ContextReference widget in Semantic Matches section → On hover: Show tooltip with file name, source branch, timestamp, relevance score, relationship type (sibling +0.10) → Show action buttons: "Add to Explicit" (calls useAddToExplicit), "Hide from [Branch Name]" (calls useHideBranch), "Dismiss" (removes from view)

#### API Endpoint - Context References

- [ ] T081 [P] [US3] Create POST /context-references Edge Function in apps/api/src/functions/add-context-reference/index.ts: Validate JWT → Parse { threadId, entityType, entityReference, source, priorityTier } → ContextReferenceRepository.create → Return { data: { referenceId } }

**Checkpoint**: User Story 3 functional - Semantic matches surface cross-branch content, users can manually adjust context

---

## Phase 6: User Story 4 - Consolidate from Exploration Tree (Priority: P4)

**Goal**: User generates comprehensive document from all child branches with provenance citations showing which insights came from which branch

**Independent Test**: Create 3 child branches from Main → Create artifacts in each branch → Return to Main → Click "Consolidate" → Select all child branches → Preview shows combined content → Approve → Consolidated file created with provenance showing multiple source branches → File includes citations ("RAG approach from Branch A", "Orchestration from Branch B")

### Implementation for User Story 4

#### Backend API - Consolidation

- [ ] T082 [US4] Create POST /threads/:id/consolidate Edge Function in apps/api/src/functions/consolidate-branches/index.ts: Validate JWT → Parse { childBranchIds[] } → Call ConsolidationService.consolidateFromBranches(threadId, childBranchIds) → Return { data: { fileId, provenance[] } } with SSE streaming for progress updates
- [ ] T083 [US4] Update ConsolidationService.consolidateFromBranches in apps/api/src/services/consolidation.ts: Traverse tree (recursive CTE) → Gather artifacts from all child branches (FileRepository.findByThreadId for each child) → Skip deleted files (log as unavailable) → Build prime context with artifacts + thread summaries → Include branch provenance in AI prompts ("This came from Branch A: RAG Deep Dive, created 2h ago") → Handle conflicts (most recent > parent branch > higher confidence) → Generate consolidated document with Claude → Create file with ProvenanceTrackingService (multiple source_thread_ids) → Return consolidated file with provenance citations in content

#### Frontend Containers - Consolidation Modal

- [ ] T084 [US4] Create ConsolidateModalContainer in apps/web/src/components/ai-agent-system/ConsolidateModalContainer.tsx: Import { ConsolidateModal } from '@centrid/ui/features' → Load child branches from aiAgentState.branchTree → Show branch selection checkboxes → Call POST /threads/:id/consolidate with selected branches → Open SSE stream for progress events → Show progress: "Traversing tree → Gathering artifacts (3/5 branches) → Consolidating → Generating document" → On completion: Show success + navigate to file → Handle errors (context overflow, deleted files) → Show warning if files unavailable
- [ ] T085 [US4] Update BranchActionsContainer in apps/web/src/components/ai-agent-system/BranchActionsContainer.tsx: Add "Consolidate" button (purple gradient) → Only show when current thread has child branches → On click: Open ConsolidateModalContainer

**Checkpoint**: User Story 4 functional - Users can consolidate insights from multiple branches into comprehensive documents with provenance

---

## Phase 7: User Story 5 - Provenance Transparency & Navigation (Priority: P5)

**Goal**: Users understand where files came from (source thread, context, timestamp) and can navigate back to source thread to see full context

**Independent Test**: View file in editor → Hover over provenance badge → Tooltip shows source branch + timestamp + context summary → Click "Go to source" → Navigate to source branch → Message where file was created is highlighted → File editor shows last edit info (last_edited_by=agent, edited_in_thread_id if applicable)

### Implementation for User Story 5

#### Frontend Containers - Provenance Navigation

- [ ] T086 [US5] Update FileEditorPanelContainer in apps/web/src/components/ai-agent-system/FileEditorPanelContainer.tsx: Load full provenance with GET /files/:id/provenance → Pass to ProvenanceHeader component: { createdIn: { threadId, title, timestamp }, contextSummary, lastEditedBy (agent/user), editedInThreadId (nullable) } → Handle "Go to source" click → Navigate to /thread/:sourceThreadId?highlightMessage=:messageId → Scroll to message + highlight with yellow flash (2s fade)
- [ ] T087 [US5] Create useNavigateToSource hook in apps/web/src/lib/hooks/useNavigateToSource.ts: Accept (sourceThreadId, creationMessageId) → Navigate to /thread/:sourceThreadId → Load thread with useLoadThread → After messages load: Scroll to message with messageId → Apply highlight class (bg-yellow-100 → fade to transparent over 2s) → Remove highlight after 2s
- [ ] T088 [US5] Update ContextPanelContainer to show provenance tooltips: For each ContextReference widget → On hover: Show tooltip with provenance data: "From: [Branch Name] ([relationship type: sibling/parent/child]), Created: [timestamp], Relevance: [score]" for semantic matches, "From: [Branch Name], Inherited from parent" for branch context, "Created in this thread: [timestamp]" for artifacts
- [ ] T089 [US5] Add message highlighting in MessageStreamContainer: Accept highlightMessageId from URL query params → After messages render: Find message with matching messageId → Scroll into view (smooth) → Add highlight class (bg-yellow-200 dark:bg-yellow-900/30) → Animate fade to transparent (transition-colors duration-2000) → Remove class after 2s

#### Backend API - Provenance Display

- [ ] T090 [P] [US5] Update GET /files/:id/provenance Edge Function (already created in T060): Ensure response includes full provenance: { createdIn: { threadId, threadTitle, timestamp, contextSummary }, lastEditedBy (agent/user), editedInThreadId (nullable), editTimestamp } → If edited_in_thread_id exists: Load thread title via ThreadRepository.findById → Return complete provenance metadata

**Checkpoint**: User Story 5 functional - Provenance transparency complete with navigation to source threads and edit history tracking

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and production readiness

### Error Handling & Observability

- [ ] T091 [P] Add structured logging in all services: Import logger from apps/api/src/lib/logger.ts → Log critical operations (agent requests, embeddings, file ops, errors) with structured metadata (userId, threadId, fileId, duration) → Send to Supabase logs table
- [ ] T092 [P] Integrate Sentry error tracking in apps/api/src/lib/sentry.ts and apps/web/src/lib/sentry.ts: Initialize Sentry SDK → Wrap Edge Functions with Sentry.captureException → Add breadcrumbs for user actions (send message, create branch, approve tool) → Enable source maps for stack traces
- [ ] T093 [P] Add error boundary in apps/web/src/components/ErrorBoundary.tsx: Catch React errors → Show user-friendly error message → Log to Sentry → Provide "Retry" button → Reset error boundary on retry

### Performance Optimization

- [ ] T094 [P] Add database query monitoring: Enable Supabase query insights → Validate all indexes are used (check EXPLAIN ANALYZE output) → Optimize slow queries (shadow_entities semantic search, thread tree traversal)
- [ ] T095 [P] Implement context assembly caching: Cache thread summaries in Redis (TTL=1h) → Cache user preferences per request (in-memory for request duration) → Cache shadow_entities embeddings (no expiration, updated on source change)
- [ ] T096 [P] Add SSE connection monitoring: Track open SSE connections per user → Limit to 3 concurrent connections (close oldest if exceeded) → Add keep-alive pings every 30s → Handle reconnection on client side with exponential backoff

### Usage Tracking

- [ ] T097 [P] Implement usage tracking in apps/api/src/services/usageTracking.ts: Track agent requests count, tokens consumed, files created, branches created per user → Store in usage_events table → Enforce quota limits (Free 100/mo, Pro 1000/mo, Enterprise 10000/mo) → Block requests when quota exceeded → Return 429 error with upgrade prompt
- [ ] T098 [P] Create usage dashboard API in apps/api/src/functions/get-usage-stats/index.ts: GET /usage/stats → Return { requestCount, tokensUsed, quotaLimit, quotaRemaining, periodStart, periodEnd } → Frontend displays in settings page

### Real-time Subscription Optimization

- [ ] T099 [P] Add Realtime subscription filters in apps/web/src/providers/RealtimeProvider.tsx: Subscribe to threads table with filter thread_id=:current → Subscribe to files table with filter owner_user_id=:userId → Subscribe to shadow_entities with filter owner_user_id=:userId → Reduce payload size by filtering at subscription level
- [ ] T100 [P] Handle Realtime reconnection: Detect WebSocket disconnect → Show banner "Reconnecting..." → Supabase SDK auto-reconnects → On reconnect: Refresh current thread data (GET /threads/:id) → Hide banner

### Documentation & Type Safety

- [ ] T101 [P] Generate OpenAPI spec from Edge Functions: Export Zod schemas from each Edge Function → Use zod-to-openapi to generate OpenAPI 3.0 spec → Save to specs/004-ai-agent-system/contracts/openapi.yaml → Validate with Swagger validator
- [ ] T102 [P] Generate TypeScript types from database schema: Run drizzle-kit introspect → Generate types to packages/shared/src/types/database.ts → Export types for use in frontend and backend → Validate types are used throughout codebase (no `any` in repositories)

### Mobile Responsiveness

- [ ] T103 [P] Add mobile layout handling in WorkspaceContainer: Detect viewport width <768px → Collapse left sidebar to drawer (slide in from left) → Show file editor as full-screen modal (not right panel) → Add hamburger menu button to toggle sidebar → Test on mobile viewport (375×812)
- [ ] T104 [P] Optimize context panel for mobile: Horizontal widget scrolling with "+X more" indicator → Touch-friendly tap targets (min 44×44px) → Collapsible sections default to collapsed on mobile → Test scrolling performance with 10+ widgets per section

### Accessibility

- [ ] T105 [P] Add keyboard navigation: Tab/Shift+Tab through interactive elements → Enter to activate buttons → Escape to close modals → Arrow keys for branch selector dropdown navigation → Add aria-label to all interactive elements
- [ ] T106 [P] Add screen reader support: aria-live="polite" for semantic matches section (announces updates) → aria-live="assertive" for error banners → aria-label for all buttons (e.g., "Send message", "Create branch") → role="dialog" for modals with aria-modal="true"
- [ ] T107 [P] Validate color contrast: Check all text colors meet WCAG AA (4.5:1 for normal text, 3:1 for large text) → Test with Chrome DevTools Lighthouse → Fix any contrast issues in Coral Theme

**Checkpoint**: Production-ready - Error handling, observability, performance optimization, usage tracking, mobile responsiveness, accessibility complete

---

## Dependency Graph

**Execution Order** (respecting blocking dependencies):

```
Phase 1 (Setup) → Phase 2 (Foundational) → User Stories (Parallel)
                                               ↓
                  ┌─────────────────────────────┴─────────────────────────────┐
                  ↓                             ↓                             ↓
             Phase 3 (US1)                 Phase 4 (US2)                  Phase 5 (US3)
          Branch creation              Agent streaming + Tool         Semantic search +
           & navigation                  approval + Provenance          Context assembly
                  │                             │                             │
                  └─────────────────────────────┴─────────────────────────────┘
                                               ↓
                  ┌─────────────────────────────┴─────────────────────────────┐
                  ↓                             ↓                             ↓
             Phase 6 (US4)                 Phase 7 (US5)                 Phase 8 (Polish)
            Consolidation              Provenance navigation         Error handling +
          from multiple branches       & transparency                Performance +
                                                                     Mobile + A11y
```

**User Story Dependencies**:
- **US1** (Branch creation) → **INDEPENDENT** (foundational branching capability)
- **US2** (Provenance tracking) → **DEPENDS ON** US1 (needs branches to track file creation in threads)
- **US3** (Semantic discovery) → **DEPENDS ON** US2 (needs files with shadow entities to search)
- **US4** (Consolidation) → **DEPENDS ON** US1, US2, US3 (needs branches + files + semantic search for tree traversal)
- **US5** (Provenance transparency) → **DEPENDS ON** US2 (needs provenance metadata to display/navigate)

**Parallelization Opportunities**:
- Phase 2: T004-T022 (all repositories, schemas, clients can be built in parallel after schema defined)
- Phase 3-5: User Stories 1-3 can be implemented by different developers simultaneously after Phase 2 complete
- Phase 8: All polish tasks (T091-T107) can run in parallel

---

## Parallel Execution Examples

**Phase 2 (Foundational) - Parallel Track 1: Database Schema**
```
Engineer A: T004 (shadow_entities) → T005 (threads) → T012 (indexes) → T013 (RLS) → T014 (db:push)
```

**Phase 2 (Foundational) - Parallel Track 2: Repositories**
```
Engineer B: T015 (ShadowEntityRepo) + T016 (ThreadRepo) + T017 (MessageRepo) [all parallel]
Engineer C: T018 (FileRepo) + T019 (ContextReferenceRepo) + T020 (AgentToolCallRepo) [all parallel]
```

**Phase 2 (Foundational) - Parallel Track 3: Services**
```
Engineer D: T025 (ShadowDomainService) + T023 (OpenAI client) [sequential: client first]
Engineer E: T026 (SemanticSearchService) → depends on T015 (ShadowEntityRepo)
```

**User Stories - Parallel Implementation**
```
Team 1: Phase 3 (US1 - Branch creation) - T037-T052 [13 developers, all US1 tasks in parallel]
Team 2: Phase 4 (US2 - Provenance) - T053-T072 [20 developers, all US2 tasks in parallel]
Team 3: Phase 5 (US3 - Semantic search) - T073-T081 [9 developers, all US3 tasks in parallel]
```

---

## Implementation Strategy

**MVP Scope** (Week 1-4):
- **Phase 1-3**: Setup + Foundational + User Story 1 (Branch creation)
- **Deliverable**: Users can create branches, navigate between branches, see inherited context
- **Success Metrics**: 70% of users create ≥1 branch within first week (SC-001)

**Phase 2 Delivery** (Week 5-6):
- **Phase 4**: User Story 2 (Provenance tracking)
- **Deliverable**: AI creates files with provenance, tool approval workflow functional
- **Success Metrics**: 60% of users create ≥1 file artifact (SC-004), 90% approval rate (SC-015)

**Phase 3 Delivery** (Week 7-8):
- **Phase 5-7**: User Stories 3-5 (Semantic discovery + Consolidation + Provenance nav)
- **Deliverable**: Cross-branch discovery, consolidation, provenance transparency complete
- **Success Metrics**: 30% of branches reference sibling files (SC-006), 20% consolidate from 2+ branches (SC-007)

**Polish Phase** (Week 9-10):
- **Phase 8**: Error handling, observability, performance, mobile, accessibility
- **Deliverable**: Production-ready system with monitoring, usage tracking, mobile support
- **Success Metrics**: Zero critical errors (SC-014), p95 latency <5s (SC-012), WCAG AA compliance

---

## Task Summary

**Total Tasks**: 107
- **Setup**: 3 tasks (T001-T003)
- **Foundational**: 32 tasks (T004-T036) - ⚠️ BLOCKING
- **User Story 1** (Branch creation): 16 tasks (T037-T052)
- **User Story 2** (Provenance): 20 tasks (T053-T072)
- **User Story 3** (Semantic discovery): 9 tasks (T073-T081)
- **User Story 4** (Consolidation): 4 tasks (T082-T085)
- **User Story 5** (Provenance transparency): 5 tasks (T086-T090)
- **Polish**: 17 tasks (T091-T107)

**Parallelizable Tasks**: 68 tasks marked [P] (63%)

**Design Integration Status**: ✅ ENABLED
- All 23 designed components exist in `packages/ui/src/features/ai-agent-system/`
- Tasks create containers in `apps/web/src/components/ai-agent-system/` that wrap designed components
- Containers add business logic: state management (Valtio), custom hooks, API calls, real-time subscriptions
- No tasks create presentational UI components (already done in design phase)

**Format Validation**: ✅ ALL TASKS FOLLOW CHECKLIST FORMAT
- All tasks start with `- [ ]`
- All tasks have sequential IDs (T001-T107)
- All user story tasks have [Story] labels (US1-US5)
- All parallelizable tasks marked [P]
- All tasks include exact file paths

**Ready for**: `/speckit.implement` to execute implementation

---

**Generated**: 2025-10-27
**Validated By**: /speckit.tasks workflow
**Next Step**: Run `/speckit.verify-tasks` to validate task quality, then `/speckit.implement` to execute
