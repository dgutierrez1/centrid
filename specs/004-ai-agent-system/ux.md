# AI-Powered Exploration Workspace - UX Specification

**Feature**: `004-ai-agent-system`
**Date**: 2025-10-26
**Status**: Complete
**Prerequisites**: spec.md (requirements), arch.md (architecture)

---

## Overview

**Feature Summary**: An exploration workspace where users branch threads to explore multiple approaches in parallel, capture findings as persistent files with provenance, and consolidate insights from the entire exploration tree.

**User Goals**:
- Explore complex topics through branching conversations without losing context
- Capture insights as persistent artifacts with automatic provenance tracking
- Discover and reference relevant content across all branches via semantic search
- Consolidate findings from multiple exploration paths into comprehensive outputs
- Navigate exploration history through transparent provenance links

**Design Approach**:
- **Adaptive 3-panel workspace**: Left sidebar (Files/Threads tabs, 20%) + Center panel (Thread interface, 40-80%) + Right panel (File editor when opened, 0-40%)
- **Thread-first UX**: Thread interface always visible (primary), file editing optional (closeable right panel)
- **Progressive disclosure**: Context complexity hidden in collapsible sections with horizontal widget layout
- **Task-oriented flow**: Primary actions (send message, create branch, approve tool) front and center
- **Transparency**: Always show what AI sees (context panel) and where content came from (provenance)
- **Mobile-first responsive**: 375px mobile (vertical stack) to 1440px+ desktop (3-panel)

---

## Screen-by-Screen UX Flows

### Chat Interface (Primary Screen)

**Purpose**: Primary conversation UI where users interact with AI agent, manage context, and navigate branches.

**Route**: `/thread/:threadId`

**Priority**: P1

**Entry Points**:
- Default landing (`/thread/main`)
- Deep link to specific thread
- Branch selector dropdown navigation
- "Go to source" link from file provenance

**Exit Points**:
- File editor (click file reference)
- Visual tree view (Phase 3, desktop)
- Settings/profile

#### Primary Flow 1: Send Message with Agent Streaming

**User Story**: US-2 (Capture Artifacts with Provenance)

**Acceptance Criteria**: AC-002 (User types message, clicks send, AI responds with streaming)

**Steps**:

| # | Action/Response | Component | Interaction | What Happens | Data | Callback | Feedback |
|---|-----------------|-----------|-------------|--------------|------|----------|----------|
| 1 | User types message | `ThreadInput` | Type | Character count updates, send button enables when text > 0 | `{messageText: string, characterLimit: number, isLoading: bool}` | `onChange(text)` | Counter `${length}/${limit}`, button coral when enabled |
| 2 | User clicks Send | `ThreadInput` | Click/Enter | Input stays enabled, send button → stop button, loading indicator | `{messageText: string, isStreaming: bool}` | `onSendMessage(text)` | Send→Stop button (coral→red), input enabled, "Agent thinking..." |
| 3 | System adds user message (optimistic) | `MessageStream` | Auto (onSend) | User message appears at bottom with timestamp, scroll to bottom | `{messages: Message[]}` | - | Smooth scroll, message fade in |
| 4 | System opens SSE, builds context | `ContextPanel` | SSE event `context_ready` | Context panel above input updates with prime context sections (horizontal widgets) | `{primeContext: PrimeContext}` | - | Sections expand showing horizontal widget arrays |
| 5 | Agent streams response chunks | `MessageStream` → `Message` | SSE events (`text_chunk`, `tool_call`) | Text chunks appear incrementally in assistant message bubble, markdown formatted | `{streamingBuffer: string}` | - | Incremental rendering, <500ms between chunks |
| 6 | Agent requests tool approval | `ToolCallApproval` | SSE `tool_call` with `approval_required: true` | Stream pauses, inline approval prompt shows operation details (action, target, preview) | `{toolName: string, toolInput: object, previewContent?: string, isLoading: bool}` | `onApprove(toolCallId)`, `onReject(toolCallId, reason?)` | Approval prompt inline, approve/reject buttons |
| 7 | User approves tool call | `ToolCallApproval` | Click Approve | Button spinner, POST `/agent-requests/:id/approve`, stream resumes after server confirms | `{toolCallId: string, approved: bool}` | `onApprove(toolCallId)` | Button disabled with spinner, "Executing...", then collapse prompt |
| 8 | System creates file | `ContextPanel` → Artifacts section | Realtime subscription | File appears in "Artifacts from this thread" as new horizontal widget with provenance badge | `{file: File, provenance: Provenance}` | - | Widget fades in (200ms), section auto-expands if collapsed |
| 9 | Agent completes response | `ThreadInput`, `MessageStream` | SSE `completion` | SSE closes, streaming buffer → final message, stop→send button | - | - | Stop→Send button transform, input ready for next message |

**Step 6 - Approval Rules Detail**:

**When Approval Required**: ALL agent actions that interact with filesystem (files/folders) or threads require approval:
- ✅ **Create operations**: `create_file`, `create_folder`, `create_branch` (any file, folder, or branch creation by agent)
- ✅ **Edit operations**: `edit_file`, `update_file` (any file modification by agent)
- ✅ **Delete operations**: `delete_file`, `delete_folder`, `delete_branch` (any file, folder, or branch deletion by agent)
- ❌ **Manual UI actions**: User creates/edits/deletes directly through UI controls (New File button, New Folder button, file editor, delete button) → **NO approval**, executes immediately

**Examples**:
- **Create file (agent)**: User: "create a file about RAG" → Agent: "Create file: `rag-guide.md` with content: [preview]. Approve?"
- **Create folder (agent)**: User: "organize these into a docs folder" → Agent: "Create folder: `docs/`. Approve?"
- **Edit file (agent)**: User: "update the README" → Agent: "Edit file: `README.md`. Changes: [diff preview]. Approve?"
- **Delete folder (agent)**: User: "remove the old experiments folder" → Agent: "Delete folder: `old-experiments/` (contains 5 files). Approve?"
- **NO approval (UI)**: User clicks "New File" button in sidebar → Opens form → Creates immediately (no agent involved)

**Cost Optimization**: User can click stop button anytime during approval wait to close SSE connection and cancel request, avoiding unnecessary API costs. Backend should close LLM streaming when approval is pending to minimize costs - only resume when approval received.

**Alternative Flow: User Cancels Request**

9a. **User clicks stop button during streaming/approval**
   - **Component**: `ThreadInput` → Stop button
   - **Interaction**: Click stop button
   - **What Happens**: SSE connection closes immediately, partial response discarded, agent request marked as cancelled in database, stop button transforms back to send button
   - **Data Required**: `{ requestId: string }`
   - **Callback**: `onCancelRequest(requestId: string)` - Closes SSE, cancels backend processing
   - **Visual Feedback**: Stop button spinner (100ms) → Send button enabled, "Request cancelled" status shows briefly (2s), streaming buffer cleared, user can send new message

**Error Scenarios**:

| Error | Trigger | Component | Display | Recovery | Test Data |
|-------|---------|-----------|---------|----------|-----------|
| Network fail | Timeout >30s or 500 error | `ErrorBanner` (above input) | "Unable to send message. Check your connection. [Retry]" | Retry button → `onSendMessage` with same text | Mock SSE endpoint with `networkError: true` |
| SSE interrupts mid-response | Network disconnect, server error during stream | `ErrorBanner` (inline in stream) | "Response interrupted. Your message was sent but response incomplete. [Retry from beginning]" | Discard partial message, user retries (FR-053a) | Close SSE after 3 text chunks |
| Tool approval timeout | No action within 10min (FR-048b) OR user clicks stop during approval | `ToolCallApproval` or `ThreadInput` stop button | "Approval timed out after 10 minutes" OR "Request cancelled" | SSE terminated, request marked cancelled/timeout, user sends new message | Mock with `autoTimeout: 600000` or trigger stop during approval |
| Context budget overflow | Prime context >200K tokens during assembly | `ContextPanel` → "Excluded from context" section auto-expands | "Some context excluded due to size limits. Review excluded items below." | User clicks items in excluded section to manually re-prime (moves to explicit with 1.0 weight) | Mock context with 250K tokens worth of files |

**Success Criteria** (from SC-015):
- ✅ User message appears with timestamp <100ms
- ✅ "Sending..." indicator shows immediately
- ✅ Agent response starts streaming within 5s (p95 latency)
- ✅ Text chunks render incrementally (<500ms between chunks)
- ✅ Tool approval flow pauses stream until user action
- ✅ File creation completes and appears in artifacts within 2s
- ✅ Input field re-enables after response completes

**Interaction Patterns Used**: Streaming Response Pattern, Approval Workflow

---

#### Primary Flow 2: Create Branch (User-Initiated)

**User Story**: US-1 (Branch Threads for Parallel Exploration)

**Acceptance Criteria**: AC-001 (User clicks "Create Branch", names it, system creates with parent context inherited)

**Steps**:

| # | Action/Response | Component | Interaction | What Happens | Data | Callback | Feedback |
|---|-----------------|-----------|-------------|--------------|------|----------|----------|
| 1 | User clicks "Create Branch" | `BranchActions` | Click | Modal opens with branch name input pre-focused | `{currentThreadTitle: string}` | `onCreateBranch()` | Modal slides in from top with backdrop, focus trapped |
| 2 | User types branch name | `CreateBranchModal` | Type | Input updates, character counter shows, create button enables when length > 0 | `{branchName: string, characterLimit: number}` | `onChange(name)` | Counter `${length}/100`, create button enables |
| 3 | User clicks Create | `CreateBranchModal` | Click/Enter | Button spinner, POST `/threads` with parent_id, modal shows "Creating..." | `{branchName: string, parentId: string, isLoading: bool}` | `onConfirmCreate(name)` | Button disabled with spinner, "Creating branch..." |
| 4 | System creates branch with inherited context | Backend | API response | New branch created with parent_id, inherited_files (context references only, not messages), parent_summary, parent's last message | - | - | - |
| 5 | System navigates to new branch | `BranchSelector`, `ContextPanel`, `MessageStream` | API success | Modal closes, URL → `/thread/:newThreadId`, branch selector updates, context panel loads inherited context | `{thread: Thread}` | - | Navigation transition, UI updates |
| 6 | System shows inherited context | `ContextPanel` → Branch context section | Thread data loaded | "Branch context" section shows parent summary + horizontal widget array of inherited files (each with "Inherited" badge) | `{inheritedFiles: ContextReference[]}` | - | Section auto-expands, widgets display horizontally |

**Error Scenarios**:

| Error | Trigger | Component | Display | Recovery | Test Data |
|-------|---------|-----------|---------|----------|-----------|
| Branch name validation fail | Empty, >100 chars, special chars | `CreateBranchModal` → validation error below input | "Branch name required (1-100 characters, letters/numbers/spaces/-/_)" | User edits name, validation re-runs on change | Try empty, 101 chars, "Branch@#$%" |
| Network error during creation | POST `/threads` timeout or 500 error | `CreateBranchModal` → error banner | "Failed to create branch. Please try again. [Retry]" | Retry button re-attempts POST with same name, or Cancel closes modal | Mock POST with `networkError: true` |

**Success Criteria** (from SC-001):
- ✅ 70% of users create ≥1 branch within first week
- ✅ Branch creation completes <2s (latency target)
- ✅ Inherited context shows parent files and summary correctly
- ✅ Branch selector updates immediately (optimistic) with new branch

**Interaction Patterns Used**: Modal Workflow

---

#### Primary Flow 3: Cross-Branch File Discovery (Semantic Search)

**User Story**: US-3 (Cross-Branch Context Discovery)

**Acceptance Criteria**: AC-003 (User asks about topic, system surfaces relevant files from sibling branches)

**Steps**:

| # | Action/Response | Component | Interaction | What Happens | Data | Callback | Feedback |
|---|-----------------|-----------|-------------|--------------|------|----------|----------|
| 1 | User sends message about "RAG" in Branch B | `ThreadInput` | Click send | Message sent, context assembly begins (includes semantic search as part of priming) | `{messageText: string}` | `onSendMessage(text)` | Send→Stop button, "Building context..." |
| 2 | System runs semantic search during context assembly | Backend | Context assembly phase | Extract semantic meaning from message → Query shadow_entities table → Cosine similarity → Apply relationship modifiers (+0.15 sibling) → Return top 10 matches | - | - | - |
| 3 | System updates context panel with semantic matches | `ContextPanel` → Semantic matches section | SSE `context_ready` | Section updates with horizontal widget array showing files from Branch A semantically related to user's message, sorted by relevance | `{semanticMatches: SemanticMatch[]}` | - | Section auto-expands, widgets display horizontally with relevance badges, "+X more" if >5 |
| 4 | User hovers over semantic match widget | `ContextReference` widget in Semantic matches | Hover | **If collapsed**: Tooltip shows file name, source branch, timestamp, relevance (0.87), relationship (sibling +0.15). **If expanded**: Widget shows metadata, hover reveals action buttons (View, Add to Explicit, Dismiss) | `{fileName: string, sourceBranch: string, createdAt: Date, relevanceScore: number}` | - | **Collapsed**: Tooltip fades in (200ms). **Expanded**: Action buttons slide in from right (150ms) |
| 5 | User clicks semantic match file | `ContextReference` (clickable) | Click | Right panel opens with file editor showing provenance header: "Created in: RAG Deep Dive (sibling), 2h ago, Context: RAG best practices discussion", file content below | `{file: File, provenance: Provenance}` | `onFileClick(fileId)` | Right panel slides in from right (300ms), thread shrinks 80%→50% |
| 6 | User clicks "Go to source" | `ProvenanceHeader` in `FileEditorPanel` | Click | Navigate to source branch (`/thread/:sourceBranchId`), scroll to message where file created, highlight message briefly (2s), file editor closes | `{sourceBranchId: string, creationMessageId: string}` | `onGoToSource(branchId, messageId)` | URL changes, branch selector updates, message highlighted yellow flash (2s fade), panel closes |
| 7 | User manually adds semantic match to explicit | `ContextReference` → "Add to Explicit" button (hover/tooltip menu) | Click | Widget moves from Semantic (0.5 weight) to Explicit (1.0 weight) section, will be included in next agent request with full priority | `{fileId: string, currentPriorityTier: number}` | `onAddToExplicit(fileId)` | Widget animates vertically from Semantic→Explicit (500ms slide), priority badge updates, Explicit section auto-expands |
| 8 | System updates semantic relationships after agent completes | `ContextPanel` → Semantic matches | Agent completion + Realtime subscription | Backend updates shadow_entities embeddings for new/modified content, recalculates semantic relationships, triggers real-time UI update | `{newMatches: SemanticMatch[]}` | - | Context panel semantic matches update automatically (new widgets fade in 200ms) |

**Error Scenarios**:

| Error | Trigger | Component | Display | Recovery | Test Data |
|-------|---------|-----------|---------|----------|-----------|
| Semantic search returns no results | Query doesn't match any files (cosine similarity <0.3 for all) | `ContextPanel` → Semantic matches section | "No relevant files found across branches. Try different keywords or add files manually." | User can @-mention files manually or continue without semantic matches | Query text with no embedding matches |
| File deleted after semantic match shown | User clicks file deleted in another session (race condition) | `FileEditorPanel` → error state | "File no longer exists. It may have been deleted. [Close]" | Close panel, remove file from semantic matches list | Mock file_id returning 404 from GET `/files/:id` |

**Success Criteria** (from SC-006, SC-017):
- ✅ 30% of branches reference files from sibling branches (validates cross-branch discovery)
- ✅ Semantic search returns results <1s for 1000 entities
- ✅ 85% of semantic matches rated relevant (if <15% dismissed, meets target)
- ✅ Provenance navigation works ("Go to source" navigates correctly)

**Interaction Patterns Used**: Context Management Pattern

---

#### Primary Flow 4: Consolidate from Multiple Branches

**User Story**: US-4 (Consolidate from Exploration Tree)

**Acceptance Criteria**: AC-004 (User generates comprehensive document from all child branches)

**Steps**:

| # | Action/Response | Component | Interaction | What Happens | Data | Callback | Feedback |
|---|-----------------|-----------|-------------|--------------|------|----------|----------|
| 1 | User clicks "Consolidate" button | `BranchActions` → Consolidate button (only visible in Main or branches with children) | Click | Confirmation modal opens showing branch tree preview (Main→RAG→Fine-tuning→Prompting), checkboxes for branch selection, input for consolidated file name | `{currentBranch: Thread, childBranches: Thread[]}` | `onConsolidate()` | Modal with tree diagram, checkboxes pre-checked, file name input pre-filled "consolidated-analysis.md" |
| 2 | User reviews branch selection and confirms | `ConsolidateModal` | Review + Click Consolidate | Button spinner, POST `/threads/:id/consolidate` with selected branch IDs, modal shows progress: "Traversing tree → Gathering artifacts (0/3) → Consolidating → Generating" | `{branchIds: string[], fileName: string, isLoading: bool, progress: {step: string, current: number, total: number}}` | `onConfirmConsolidate(branchIds, fileName)` | Progress bar shows steps, status text updates ("Gathering 1/3"), button disabled |
| 3 | System traverses tree and gathers artifacts | Backend | POST processing | Tree traversal (recursive CTE), access files from child branches (via created_in_conversation_id), load thread summaries, build context with multi-branch provenance | - | - | - |
| 4 | Agent generates consolidated document with citations | Backend + `ConsolidateModal` | Context assembled → Claude 3.5 Sonnet | Agent generates document: section headers from topics, provenance citations in content ("RAG approach [from RAG Deep Dive]"), consolidated recommendations with conflict resolution ("Using PostgreSQL [from Database Selection, most recent]") | - | - | Modal shows "Generating document (streaming...)", preview (first 20 lines) |
| 5 | System shows approval prompt with preview | `ConsolidateModal` → approval state | Agent completes | Modal updates: full document preview (scrollable), provenance summary (which branches contributed), file path input (editable), Approve/Reject buttons | `{consolidatedContent: string, sourceProvenanceMap: {[sectionId]: branchId}, fileName: string}` | `onApproveConsolidation(fileName)`, `onRejectConsolidation()` | Preview with syntax highlighting, provenance badges inline, approve button prominent (coral) |
| 6 | User approves consolidated document | `ConsolidateModal` | Click Approve | Button spinner, file created via `write_file` tool execution, provenance stored with multiple source_conversation_ids (Main+RAG+Fine-tuning+Prompting), modal closes, success toast | `{fileName: string, content: string, sourceConversationIds: string[]}` | `onApproveConsolidation(fileName)` | Button spinner → Success toast "Consolidated document created: consolidated-analysis.md" (3s) → Modal closes |
| 7 | System shows consolidated file with multi-branch provenance | `ContextPanel` → Artifacts section | Realtime subscription (file created) | File widget appears in "Artifacts from this thread" with special badge "Consolidated from 3 branches", added to horizontal widget array | `{file: File, provenance: MultiProvenance}` | - | Widget fades in (200ms), section auto-expands, special coral border on widget |

**Error Scenarios**:

| Error | Trigger | Component | Display | Recovery | Test Data |
|-------|---------|-----------|---------|----------|-----------|
| Child branch file deleted before consolidation | File referenced in child deleted between traversal and consolidation | `ConsolidateModal` → warning in document preview | Agent includes note: "Note: 2 referenced files unavailable (may have been deleted)" | Consolidation continues without deleted files (FR-035b), user can retry if critical files missing | Mock tree with deleted file references |
| Context budget overflow during consolidation | Total artifacts from all branches >200K tokens | `ConsolidateModal` → warning banner before approval | "Some artifacts excluded due to size limits. Review excluded items in context panel after approval." | System prioritizes by relevance score, shows excluded items in context panel for manual review | Mock 5 branches with 50K tokens each (250K total) |

**Success Criteria** (from SC-007):
- ✅ 20% of users perform consolidation from ≥2 branches by Week 8
- ✅ Consolidation from 5 branches completes <10s (p95 latency)
- ✅ Provenance citations appear in >80% of consolidated documents
- ✅ Users report consolidation saves time vs manual synthesis (survey feedback)

**Interaction Patterns Used**: Modal Workflow, Streaming Response Pattern

---

#### Layout & Spatial Design

**Layout Type**: Adaptive 3-panel workspace

**ASCII Layout Diagram (Desktop 1440px+ with file open)**:

```
┌──────────────┬────────────────────────────────────────┬──────────────────────┐
│              │                                        │                      │
│ WorkspaceSid │ ThreadView (50%)                      │ FileEditorPanel      │
│ ebar (20%)   │                                        │ (30%)                │
│              │ ┌────────────────────────────────────┐ │                      │
│ Threads │Files│ │ BranchSelector (dropdown)         │ │ ┌──────────────────┐ │
│ ─────────────││ └────────────────────────────────────┘ │ │ Provenance       │ │
│ [active]     ││                                        │ │ Header           │ │
│              ││ MessageStream                          │ └──────────────────┘ │
│ • Main       ││   [U] Message                          │                      │
│   2 artifacts││   [A] Response                         │ Editor Content       │
│ • RAG Deep   ││                                        │ (Markdown)           │
│   Dive       ││ ContextPanel                           │                      │
│   5 artifacts││ ┌──────────────────────────────────┐   │                      │
│ • Orchestr.. ││ │▼ EXPLICIT (3)                    │   │                      │
│   3 artifacts││ │ ┌────┐ ┌────┐ ┌────┐ >          │   │                      │
│              ││ │ │doc1│ │doc2│ │thr1│            │   │ [X] Close            │
│              ││ │ └────┘ └────┘ └────┘            │   │                      │
│              ││ └──────────────────────────────────┘   │                      │
│              ││ ▶ SEMANTIC (2) [match1] [match2]       │                      │
│              ││                                        │                      │
│              ││ ThreadInput                            │                      │
│              ││ [Ask question...            ] [Send]   │                      │
└──────────────┴────────────────────────────────────────┴──────────────────────┘

Legend:
  ▼ = Section expanded (widgets show full cards 80px height)
  ▶ = Section collapsed (widgets show compact pills 32px height inline)
  ┌────┐ = Expanded widget card with metadata
  [match1] = Collapsed widget pill with tooltip
  > = Horizontal scroll indicator (+X more)
```

**ASCII Layout Diagram (Desktop 1440px+ without file open)**:

```
┌──────────────┬────────────────────────────────────────────────────────────┐
│              │                                                            │
│ WorkspaceSid │ ThreadView (80%)                                          │
│ ebar (20%)   │                                                            │
│              │ ┌────────────────────────────────────────────────────────┐ │
│ Threads │Files│ │ BranchSelector (dropdown)                             │ │
│ ─────────────││ └────────────────────────────────────────────────────────┘ │
│ [active]     ││                                                            │
│              ││ MessageStream (expanded)                                   │
│ • Main       ││   [U] Message                                              │
│   2 artifacts││   [A] Response                                             │
│ • RAG Deep   ││   [U] Message                                              │
│   Dive       ││   [A] Response with tool call                              │
│   5 artifacts││                                                            │
│ • Orchestr.. ││ ContextPanel                                               │
│   3 artifacts││ ┌────────────────────────────────────────────────────────┐ │
│              ││ │▼ EXPLICIT (3)                                          │ │
│              ││ │ ┌──────┐ ┌──────┐ ┌──────┐                            │ │
│              ││ │ │doc1  │ │doc2  │ │thread│                            │ │
│              ││ │ │coral │ │coral │ │coral │                            │ │
│              ││ │ └──────┘ └──────┘ └──────┘                            │ │
│              ││ └────────────────────────────────────────────────────────┘ │
│              ││ ▶ SEMANTIC (2) [📄 match1·95%] [📄 match2·87%]             │
│              ││ ▶ ARTIFACTS (1) [📋 output.md]                              │
│              ││                                                            │
│              ││ ThreadInput                                                │
│              ││ [Ask question...                            ] [Send]       │
└──────────────┴────────────────────────────────────────────────────────────┘

Legend:
  ▼ = Section expanded (full widget cards with metadata visible)
  ▶ = Section collapsed (compact pills inline, metadata in tooltips)
  ┌──────┐
  │doc1  │ = Expanded widget card (80px height, shows name + metadata)
  │coral │   "coral" = tier color indicator
  └──────┘
  [📄 match1·95%] = Collapsed widget (32px height, icon+name+score)
```

**ASCII Layout Diagram (Mobile 375px)**:

```
┌────────────────────┐
│ ≡  RAG Deep Dive ▼│
├────────────────────┤
│                    │
│ MessageStream      │
│ (full width)       │
│ ┌────────────────┐ │
│ │ [U] Message    │ │
│ └────────────────┘ │
│ ┌────────────────┐ │
│ │ [A] Response   │ │
│ └────────────────┘ │
│                    │
│ ContextPanel       │
│┌──────────────────┐│
││▼ EXPLICIT (3)    ││
││┌────┐┌────┐┌────┐││
│││doc1││doc2││thr1│││
││└────┘└────┘└────┘││
│└──────────────────┘│
│▶ SEMANTIC (2)      │
│ [📄m1][📄m2]       │
│▶ ARTIFACTS (1)     │
│ [📋out] +2 more    │
│                    │
├────────────────────┤
│ [Ask...      ] [►] │
└────────────────────┘

Legend:
  ▼ = Expanded (cards)
  ▶ = Collapsed (pills)
  ┌────┐
  │doc1│ = 70px card
  └────┘
  [📄m1] = 28px pill
```

**Panel Behavior**:

| Panel | Desktop (1440px+) | Mobile (375px) | Purpose | Closeable |
|-------|-------------------|----------------|---------|-----------|
| Left | 20% fixed | Hidden (drawer) | Files/Threads navigation (tabs) | No |
| Center | 40-80% adaptive (shrinks when right panel opens) | 100% | Thread interface (always visible) | No |
| Right | 0-40% adaptive (hidden by default, slides in when file opened) | Full-screen modal | File editor with provenance | Yes (X button) |

**Dimensions**:

| Element | Desktop | Mobile | Notes |
|---------|---------|--------|-------|
| Header | Full width, 64px | Full width, 56px | Branch actions, settings |
| Left sidebar | 20% width (fixed, min 240px) | Hidden | Drawer toggles on hamburger menu |
| Center content | 40% (file open) to 80% (no file) | 100% | Thread interface adaptive |
| Right panel | 0% (hidden) or 40% (max 600px) | Full-screen modal | Slides in from right |
| Context panel | Between messages and input (not above messages) | Same | Positioned for visibility while typing |

**Component Spacing**:

| Context | Desktop | Mobile |
|---------|---------|--------|
| Component gaps | gap-6 (24px) | gap-4 (16px) |
| Section margins | mb-8 (32px) | mb-6 (24px) |
| Internal padding | p-6 (24px) | p-4 (16px) |
| Widget gaps (in horizontal arrays) | gap-4 (16px) | gap-3 (12px) |

**Responsive Breakpoints**:
- **Mobile** (`< 768px`): Vertical stack, hide sidebar, sticky input at bottom, reduced spacing, full-screen modals for file editor
- **Tablet** (`768px - 1024px`): Sidebar as overlay (not inline), moderate spacing, right panel as modal (not inline)
- **Desktop** (`> 1024px`): Full 3-panel layout, maximum spacing, right panel inline (slides in from right, shrinks center panel)

**Components in Layout**: `WorkspaceSidebar`, `ThreadView`, `FileEditorPanel`, `ContextPanel`

---

### Branch Selector

**Purpose**: Hierarchical dropdown showing current branch, parent, siblings, and children for navigation.

**Route**: Component in `/thread/:threadId` header

**Priority**: P1

**Entry Points**:
- Click dropdown in thread header

**Exit Points**:
- Navigate to selected branch

#### Primary Flow: Switch Between Branches

**User Story**: US-1 (Branch Threads for Parallel Exploration)

**Acceptance Criteria**: AC-003 (User switches between branches, each maintains separate thread history)

**Steps**:

| # | Action/Response | Component | Interaction | What Happens | Data | Callback | Feedback |
|---|-----------------|-----------|-------------|--------------|------|----------|----------|
| 1 | User clicks branch selector dropdown | `BranchSelector` | Click | Dropdown opens showing hierarchical tree structure with indentation for nested branches (Main → RAG Deep Dive → RAG Performance) | `{currentBranchId: string, branches: Thread[]}` | `onOpen()` | Dropdown slides down (200ms), current branch highlighted |
| 2 | User hovers over branch in dropdown | `BranchSelector` → branch item | Hover | Hovered branch highlighted, shows preview tooltip with branch summary (topics, artifact count, last activity) | `{branch: Thread}` | - | Background highlight, tooltip fades in (300ms) |
| 3 | User clicks branch | `BranchSelector` → branch item | Click | Dropdown closes, navigate to `/thread/:selectedBranchId`, thread interface updates with selected branch messages and context | `{branchId: string}` | `onSelectBranch(branchId)` | Dropdown closes (100ms), URL updates, branch selector shows new branch, thread interface loads |

**Error Scenarios**:

| Error | Trigger | Component | Display | Recovery | Test Data |
|-------|---------|-----------|---------|----------|-----------|
| Branch deleted by another session | User clicks branch that was deleted (race condition) | `BranchSelector` → error toast | "Branch no longer exists. It may have been deleted." | Dropdown closes, selector refreshes to show updated branch list | Mock branchId returning 404 from GET `/threads/:id` |

**Success Criteria**:
- ✅ Branch selector shows hierarchical indentation correctly
- ✅ Navigation between branches <500ms
- ✅ Current branch always highlighted in dropdown

**Interaction Patterns Used**: Dropdown Navigation Pattern

---

#### Layout & Spatial Design

**Layout Type**: Dropdown menu with hierarchical tree structure

**Dimensions**:

| Element | Desktop | Mobile | Notes |
|---------|---------|--------|-------|
| Trigger button | min-width: 200px, height: 40px | min-width: 150px, height: 36px | Shows current branch name + chevron icon |
| Dropdown menu | min-width: 300px, max-height: 400px | min-width: 250px, max-height: 300px | Scrollable if >10 branches |
| Branch item | Full width, height: 36px, padding-left: 16px * depth | Full width, height: 32px, padding-left: 12px * depth | Indented by nesting level |

**Component Spacing**:
- Item vertical gap: `gap-1` (4px)
- Section dividers: `my-2` (8px)

**Components in Layout**: `BranchSelector`, `BranchSelectorDropdown`, `BranchSelectorItem`

---

### Context Panel

**Purpose**: Shows context being sent to AI agent (explicit files, semantic matches, branch context, artifacts, excluded items).

**Route**: Component in `/thread/:threadId` (positioned below messages, above input)

**Priority**: P1

**Key Behavior**:
- **Section-level collapse ONLY**: Each of the 6 context sections (Explicit, Frequently Used, Semantic, Branch, Artifacts, Excluded) has TWO states: collapsed or expanded
- **Widgets inherit section state**: ALL widgets within a section inherit the section's collapse state. Widgets have NO independent collapse state.
  - When section is **collapsed** → ALL widgets in that section render in collapsed state (compact 32px pills)
  - When section is **expanded** → ALL widgets in that section render in expanded state (full 80px cards)
- **Horizontal widget layout**: All widgets display inline horizontally with horizontal scroll if overflow
- **Context-type-specific styling**: Each context type (Explicit/Semantic/Frequently Used/Branch/Artifacts/Excluded) has distinct visual styling (tier colors, badges, metadata displayed)
- **Chat always visible**: Context panel positioned below messages, above input to keep thread interface always visible
- **File panel interaction**: Clicking any widget opens file in closeable right panel (chat remains visible)

**Entry Points**:
- Always visible in thread interface (collapsible sections)

**Exit Points**:
- Click file to open file editor in right panel

#### Primary Flow: Manage Context References

**User Story**: US-3 (Cross-Branch Context Discovery)

**Acceptance Criteria**: AC-003, AC-004 (Context assembly shows what AI sees, user can manually adjust)

**Steps**:

| # | Action/Response | Component | Interaction | What Happens | Data | Callback | Feedback |
|---|-----------------|-----------|-------------|--------------|------|----------|----------|
| 1 | User views "Semantic Matches" section in collapsed state | `ContextPanel` → `ContextSection` (semantic) | View | Section shows header (chevron ▶, title, count badge "5", purple left border) with horizontal row of compact widget pills. ALL widgets inherit collapsed state (32px height, icon+filename only). Metadata hidden, shown in tooltips on hover. | `{semanticMatches: ContextReference[]}` | - | Compact purple-bordered pills display inline, "+3 more" if >8 widgets |
| 2 | User expands "Semantic Matches" section | `ContextSection` → header | Click | Section state changes from collapsed→expanded. ALL child widgets receive `isExpanded={true}` prop and morph to full cards (80px height) showing relevance badges, branch indicators, timestamps. Section height animates to reveal widget container. | `{isExpanded: true}` | `onToggleSection('semantic')` | Section height animates (300ms), chevron ▶→▼, ALL widgets morph simultaneously (200ms), purple border on all widgets |
| 3 | User hovers over expanded semantic match widget | `ContextReference` (expanded state) | Hover | Widget shows action buttons: View, Add to Explicit, Dismiss. Widget border highlights (purple glow). Relevance badge "87%" and branch pill "RAG Deep Dive" visible inline. | `{contextRef: ContextReference, isExpanded: true}` | - | Action buttons slide in from right (150ms), purple border highlights |
| 4 | User clicks "View" on widget | `ContextReference` → View button | Click | File opens in right panel. Thread shrinks 80%→50%. Widget remains in context panel (highlighted while file open). Chat always visible. | `{fileId: string}` | `onFileClick(fileId)` | Right panel slides in (300ms), thread width transition (300ms), widget gets "active" border |
| 5 | User scrolls through "Explicit" section (expanded, 15 items) | `ContextSection` (explicit) → widget container | Horizontal scroll | Container shows 5-6 coral-bordered widget cards at a time. "+9 more" badge at end. All widgets expanded (80px) with coral borders and "Explicit" badges visible. | `{explicitContextRefs: ContextReference[], isExpanded: true}` | - | Smooth horizontal scroll, "+X more" badge updates dynamically |
| 6 | User clicks "Remove" on explicit widget | `ContextReference` → Remove button | Click | Widget fades out (200ms), removed from explicit tier. May appear in semantic section if semantically relevant. If last widget, section shows empty state "No explicit context". | `{contextRefId: string}` | `onRemoveFromExplicit(contextRefId)` | Widget fade+collapse (300ms), toast: "Removed from explicit context" |
| 7 | User collapses "Explicit" section | `ContextSection` (explicit) → header | Click | Section state changes expanded→collapsed. ALL child widgets receive `isExpanded={false}` and morph to compact pills (32px). Metadata hidden (tooltips only). Action buttons hidden. Section height shrinks to 40px. | `{isExpanded: false}` | `onToggleSection('explicit')` | Section height animates to 40px (300ms), chevron ▼→▶, ALL widgets morph to pills simultaneously (200ms) |

**State Inheritance Key Point**: Widgets have NO independent collapse state. When section toggles, ALL widgets in that section morph together (collapsed ↔ expanded).

**Error Scenarios**:

| Error | Trigger | Component | Display | Recovery | Test Data |
|-------|---------|-----------|---------|----------|-----------|
| Context reference file deleted | File referenced in context deleted in another session | `ContextPanel` → invalid reference indicator | File widget shows "File unavailable" with red border, "Remove" button offered | User clicks Remove to clean up invalid reference | Mock contextRefId referencing deleted file |

**Success Criteria**:
- ✅ Context panel shows all 6 sections correctly (Explicit, Frequently used, Semantic, Branch, Artifacts, Excluded)
- ✅ Horizontal widget layout displays metadata cards clearly
- ✅ Manual re-priming from excluded section works (<500ms transition)

**Interaction Patterns Used**: Collapsible Section Pattern, Context Management Pattern

---

#### Layout & Spatial Design

**Layout Type**: Collapsible section container with horizontal widget arrays, section-level collapse affecting all widgets

**Dimensions**:

| Element | Desktop | Mobile | Notes |
|---------|---------|--------|-------|
| Panel container | Full width of center panel, min-height: 120px, max-height: 400px | Full width, min-height: 100px, max-height: 300px | Positioned below messages, above input |
| Section header | Full width, height: 40px, padding: 12px 16px | Full width, height: 36px, padding: 10px 12px | Clickable to expand/collapse entire section |
| Section (collapsed) | Full width, height: 40px (header only) | Full width, height: 36px (header only) | Compact widgets inline in header (32px height) |
| Section (expanded) | Full width, height: auto (min 120px) | Full width, height: auto (min 100px) | Full-size widgets in horizontal scroll container |
| Widget array container | Horizontal scroll (overflow-x: auto), padding: 12px 16px | Horizontal scroll, padding: 8px 12px | Shows 5-6 expanded widgets or 8-10 collapsed widgets before scrolling |
| Widget (collapsed) | width: auto (fit content, ~80-120px), height: 32px, padding: 6px 12px | width: auto (fit content, ~60-100px), height: 28px, padding: 4px 10px | Icon + truncated filename only, tooltip on hover |
| Widget (expanded) | width: 200px, height: 80px, padding: 12px | width: 160px, height: 70px, padding: 10px | Full metadata card with hover actions |
| "+X more" indicator | width: 60px, height: match widget height, padding: 8px | width: 50px, height: match widget height, padding: 6px | Badge showing overflow count |

**Component Spacing**:
- Section vertical gaps: `gap-4` (16px) between different sections
- Widget horizontal gaps (collapsed): `gap-2` (8px) for compact inline display
- Widget horizontal gaps (expanded): `gap-4` (16px) for full card layout
- Internal card padding (collapsed): `p-1.5` (6px)
- Internal card padding (expanded): `p-3` (12px)

**Components in Layout**: `ContextPanel`, `ContextSection`, `ContextReference` (widget), `PriorityTierIndicator`, `OverflowIndicator` (+X more badge)

---

### File Editor Panel

**Purpose**: Display file content with provenance header showing source conversation and creation context.

**Route**: Right panel in `/thread/:threadId` OR modal on mobile

**Priority**: P2

**Entry Points**:
- Click file reference in context panel
- Click file in semantic matches
- Click artifact in "Artifacts from this thread"

**Exit Points**:
- Close button (X) in header
- Navigate to source conversation ("Go to source" link)

#### Primary Flow: View File with Provenance

**User Story**: US-5 (Provenance Transparency & Navigation)

**Acceptance Criteria**: AC-001 (User views file, sees provenance metadata, can navigate to source thread)

**Steps**:

| # | Action/Response | Component | Interaction | What Happens | Data | Callback | Feedback |
|---|-----------------|-----------|-------------|--------------|------|----------|----------|
| 1 | User clicks file reference | `ContextReference` (clickable) | Click | Right panel slides in from right (desktop) or modal opens (mobile), thread interface shrinks from 80% to 50% width (desktop) | `{fileId: string}` | `onFileClick(fileId)` | Right panel slides in (300ms), thread shrinks with animation |
| 2 | System loads file with provenance | `FileEditorPanel` → `ProvenanceHeader` + `EditorContent` | Data load | Provenance header shows: "Created in: RAG Deep Dive (sibling), 2 hours ago, Context: RAG best practices discussion", last edit info if applicable ("Last edited by agent in Branch B"), "Go to source" link; file content rendered below with syntax highlighting | `{file: File, provenance: Provenance}` | - | Content renders with markdown/syntax highlighting |
| 3 | User clicks "Go to source" link | `ProvenanceHeader` → Go to source link | Click | Navigate to source branch (`/thread/:sourceBranchId`), scroll to message where file was created, highlight message briefly (yellow flash 2s), file editor panel closes | `{sourceBranchId: string, creationMessageId: string}` | `onGoToSource(branchId, messageId)` | URL changes, branch selector updates, message highlighted yellow flash (2s fade), panel closes (300ms) |
| 4 | User clicks close button | `FileEditorPanel` → close button (X) | Click | Right panel slides out (desktop) or modal dismisses (mobile), thread interface expands back to 80% width | - | `onClose()` | Panel slides out (300ms), thread expands with animation |

**Error Scenarios**:

| Error | Trigger | Component | Display | Recovery | Test Data |
|-------|---------|-----------|---------|----------|-----------|
| File content load fail | GET `/files/:id` timeout or 500 error | `FileEditorPanel` → error state | "Unable to load file content. Please try again. [Retry] [Close]" | Retry button re-fetches file, or Close button dismisses panel | Mock GET with `networkError: true` |
| Source conversation deleted | User clicks "Go to source" for file with deleted source conversation | Navigation → error toast | "Source conversation no longer exists. It may have been deleted." | Toast dismisses (3s), panel stays open showing file content | Mock sourceBranchId returning 404 |

**Success Criteria** (from SC-009, SC-010):
- ✅ 50% of users interact with provenance indicators (click/hover) within first week
- ✅ Provenance navigation ("Go to source") used by 30% of users
- ✅ File editor opens <300ms, provenance header renders immediately

**Interaction Patterns Used**: Sliding Panel Pattern, Provenance Navigation Pattern

---

#### Layout & Spatial Design

**Layout Type**: Sliding panel (desktop) OR full-screen modal (mobile)

**Panel Behavior**:

| State | Desktop | Mobile | Notes |
|-------|---------|--------|-------|
| Closed (default) | 0% width (hidden) | Hidden | Thread occupies 80% of center space |
| Open | 40% width (max 600px), slides in from right | 100% full-screen modal | Thread shrinks to 50% on desktop |

**Dimensions**:

| Element | Desktop | Mobile | Notes |
|---------|---------|--------|-------|
| Provenance header | Full panel width, height: 80px, padding: 16px | Full screen width, height: 70px, padding: 12px | Coral accent border-left |
| Editor content | Full panel width, height: calc(100vh - 144px) | Full screen height, height: calc(100vh - 126px) | Scrollable, syntax highlighting |
| Close button (X) | Top-right, 32x32px | Top-right, 28x28px | Icon button |

**Component Spacing**:
- Provenance header internal: `p-4` (16px)
- Editor content padding: `p-6` (24px) desktop, `p-4` (16px) mobile
- Provenance metadata vertical gaps: `gap-2` (8px)

**Components in Layout**: `FileEditorPanel`, `ProvenanceHeader`, `EditorContent`, `GoToSourceLink`

---

### Approval Modal

**Purpose**: Show agent tool call approval prompt with operation details, preview, and approve/reject options.

**Route**: Inline component during agent streaming in `/thread/:threadId`

**Priority**: P2

**Entry Points**:
- Agent requests tool approval during streaming response

**Exit Points**:
- User approves → stream resumes
- User rejects → stream pauses, agent revises plan

#### Primary Flow: Approve Tool Call

**User Story**: US-2 (Capture Artifacts with Provenance)

**Acceptance Criteria**: AC-001 (User sees approval prompt, can approve/reject, agent executes after approval)

**Steps**:

| # | Action/Response | Component | Interaction | What Happens | Data | Callback | Feedback |
|---|-----------------|-----------|-------------|--------------|------|----------|----------|
| 1 | Agent requests tool approval | `ToolCallApproval` (inline in message stream) | SSE `tool_call` event | Stream pauses, approval prompt appears inline showing: operation type ("Create file", "Edit file", "Delete folder"), target path, content preview (for create/edit) or deletion confirmation (for delete), approve/reject buttons | `{toolName: string, toolInput: object, previewContent?: string, isLoading: bool}` | - | Prompt slides in (200ms), stream paused indicator |
| 2 | User reviews preview | `ToolCallApproval` → preview section | Scroll (if needed) | Preview shows first 20 lines of content (create/edit) or list of files to delete (delete), syntax highlighted | `{previewContent: string}` | - | Scrollable preview with line numbers |
| 3 | User clicks Approve | `ToolCallApproval` → Approve button | Click | Button shows spinner, POST `/agent-requests/:id/approve` with `{toolCallId, approved: true}`, stream resumes after server confirms execution | `{toolCallId: string, approved: bool}` | `onApprove(toolCallId)` | Button disabled with spinner, "Executing...", prompt collapses after execution confirmed |
| 4 | Tool executes | Backend | POST processing | File created/edited/deleted with provenance metadata, realtime subscription updates UI | - | - | - |
| 5 | Stream resumes | `MessageStream` | SSE resumes | Agent continues streaming response text after tool execution | - | - | Streaming continues, next text chunk appears |

**Alternative Flow: User Rejects**:

3a. **User clicks Reject**
   - **Component**: `ToolCallApproval` → Reject button
   - **Interaction**: Click (optional rejection reason input)
   - **What Happens**: Button shows spinner, POST `/agent-requests/:id/approve` with `{toolCallId, approved: false, reason}`, agent receives rejection context, stream pauses briefly, agent sends revised plan
   - **Data**: `{toolCallId: string, approved: bool, reason?: string}`
   - **Callback**: `onReject(toolCallId, reason)`
   - **Visual Feedback**: Button disabled with spinner, prompt collapses, stream shows "Agent revising plan...", subsequent pending tool calls discarded (agent may propose different approach)

**Error Scenarios**:

| Error | Trigger | Component | Display | Recovery | Test Data |
|-------|---------|-----------|---------|----------|-----------|
| Approval timeout | No user action within 10 minutes (FR-048b) | `ToolCallApproval` → timeout overlay | "Approval timed out after 10 minutes. Please retry your request." | SSE stream terminated, request marked as timeout, user must send new message | Mock approval with `autoTimeout: 600000` (10min) |
| User cancels during approval | User clicks stop button while waiting for approval | `ThreadInput` → stop button | "Request cancelled. You can send a new message." | SSE stream terminated, approval discarded, request marked as cancelled | Trigger stop button during approval wait |

**Success Criteria**:
- ✅ Approval prompt appears inline <100ms after tool call requested
- ✅ Preview shows first 20 lines of content (create/edit operations)
- ✅ Stream pauses correctly until user approves/rejects
- ✅ Rejection triggers agent revision (not termination)

**Interaction Patterns Used**: Approval Workflow

---

#### Layout & Spatial Design

**Layout Type**: Inline prompt within message stream

**Dimensions**:

| Element | Desktop | Mobile | Notes |
|---------|---------|--------|-------|
| Prompt container | Full message width, max-width: 600px, padding: 16px | Full message width, padding: 12px | Bordered card with coral accent |
| Preview section | Full container width, max-height: 300px | Full width, max-height: 200px | Scrollable if content >20 lines |
| Action buttons | Right-aligned, height: 40px, gap: 12px | Full-width stacked, height: 36px, gap: 8px | Approve (coral), Reject (gray) |

**Component Spacing**:
- Prompt internal padding: `p-4` (16px)
- Section vertical gaps: `gap-3` (12px)
- Button horizontal gap: `gap-3` (12px) desktop, stacked mobile

**Components in Layout**: `ToolCallApproval`, `PreviewSection`, `ApprovalActions`

---

### Visual Tree View (Phase 3)

**Purpose**: Interactive graph showing branch hierarchy, artifact counts, and provenance relationships.

**Route**: `/tree` OR sidebar toggle in `/thread/:threadId`

**Priority**: P5 (Phase 3)

**Entry Points**:
- Click "Tree View" button in branch actions (desktop only)

**Exit Points**:
- Click branch node to navigate to thread

#### Primary Flow: Navigate via Tree View

**User Story**: US-5 (Provenance Transparency & Navigation)

**Acceptance Criteria**: AC-004 (Visual tree view shows branch hierarchy, user can click nodes to navigate)

**Steps**:

| # | Action/Response | Component | Interaction | What Happens | Data | Callback | Feedback |
|---|-----------------|-----------|-------------|--------------|------|----------|----------|
| 1 | User clicks "Tree View" button | `BranchActions` → Tree View button (desktop only) | Click | Tree view panel opens showing interactive graph: branch nodes with titles, artifact counts, creation timestamps; edges showing parent-child relationships; current branch highlighted | `{branches: Thread[], currentBranchId: string}` | `onOpenTreeView()` | Tree view slides in (300ms), current branch highlighted coral |
| 2 | User hovers over branch node | `TreeView` → `BranchNode` | Hover | Hovered node highlighted, tooltip shows: branch summary (topics, decisions, artifacts), creation timestamp, creator (user/agent/system), artifact count | `{branch: Thread}` | - | Node border highlight, tooltip fades in (200ms) |
| 3 | User clicks branch node | `TreeView` → `BranchNode` | Click | Navigate to `/thread/:branchId`, tree view stays open, clicked branch becomes highlighted | `{branchId: string}` | `onNavigateToBranch(branchId)` | URL updates, branch selector updates, tree view current branch highlight moves |
| 4 | User clicks file node in tree | `TreeView` → `FileNode` | Click | Highlights all threads that referenced this file (provenance graph visualization) | `{fileId: string}` | `onHighlightProvenance(fileId)` | Threads with this file glow coral, edges show relationships |
| 5 | User closes tree view | `TreeView` → close button (X) | Click | Tree view panel closes | - | `onCloseTreeView()` | Panel slides out (300ms) |

**Error Scenarios**:

| Error | Trigger | Component | Display | Recovery | Test Data |
|-------|---------|-----------|---------|----------|-----------|
| Tree view render timeout | >100 branches cause rendering lag (>2s) | `TreeView` → loading state | "Loading tree view... (rendering 150 branches)" with spinner | View renders when complete (or times out after 5s with "Unable to render tree view") | Mock 150+ branches |

**Success Criteria** (from Phase 3 targets):
- ✅ Tree view renders <1s for 50 branches
- ✅ 40% of users who enable tree view continue using it
- ✅ Clicking branch node navigates correctly
- ✅ Provenance graph highlights threads referencing clicked file

**Interaction Patterns Used**: Graph Navigation Pattern

---

#### Layout & Spatial Design

**Layout Type**: Overlay panel (desktop only)

**Dimensions**:

| Element | Desktop | Mobile | Notes |
|---------|---------|--------|-------|
| Tree view panel | 40% width (min 500px, max 800px), height: 100vh | Not supported | Overlays right side of screen |
| Canvas area | Full panel width, height: calc(100vh - 64px) | - | Scrollable and zoomable (D3.js or React Flow) |
| Branch node | width: 180px, height: 60px, border-radius: 8px | - | Shows title + artifact count + timestamp |
| File node | width: 120px, height: 40px, border-radius: 6px | - | Shows file name + provenance indicator |

**Component Spacing**:
- Node vertical gaps: 80px (allows for edge curves)
- Node horizontal gaps: 200px (tree level spacing)
- Internal node padding: `p-3` (12px)

**Components in Layout**: `TreeView`, `TreeViewCanvas`, `BranchNode`, `FileNode`, `TreeViewControls` (zoom, pan, reset)

---

## Component Library

### Component Reusability Assessment

**Existing components checked** (from `packages/ui/src/components/`):
- `Button` - ✅ Reused (variants: default, secondary, ghost)
- `Input` - ✅ Reused (with validation states)
- `Card` - ✅ Reused (container primitive)
- `Badge` - ✅ Reused (status indicators)
- `Modal/Dialog` - ✅ Reused (modal primitives)
- `Tooltip` - ✅ Reused (hover info)
- `ErrorBanner` - ✅ Reused (error states)
- `Dropdown` - ⚡ Extended (hierarchical tree variant needed)
- `Tabs` - ✅ Reused (Files/Threads sidebar tabs)

**New components categorized**:

| Component | Location | Reusability Rationale |
|-----------|----------|----------------------|
| `ThreadView` | `features/ai-agent-system/` | Feature-specific screen (thread interface) |
| `ThreadInput` | `features/ai-agent-system/` | Feature-specific (agent streaming interaction) |
| `MessageStream` | `features/ai-agent-system/` | Feature-specific (message display with streaming) |
| `Message` | `features/ai-agent-system/` | Feature-specific (message bubble with markdown) |
| `ToolCallApproval` | `features/ai-agent-system/` | Feature-specific (agent tool approval) |
| `ContextPanel` | `features/ai-agent-system/` | Feature-specific (context assembly visualization) |
| `ContextSection` | `features/ai-agent-system/` | Feature-specific (collapsible section in context panel) |
| `ContextReference` | `features/ai-agent-system/` | Feature-specific (file/thread reference widget) |
| `BranchSelector` | `features/ai-agent-system/` | Feature-specific (hierarchical branch navigation) |
| `BranchActions` | `features/ai-agent-system/` | Feature-specific (create branch, consolidate) |
| `CreateBranchModal` | `features/ai-agent-system/` | Feature-specific (branch creation form) |
| `ConsolidateModal` | `features/ai-agent-system/` | Feature-specific (consolidation workflow) |
| `FileEditorPanel` | `features/ai-agent-system/` | Feature-specific (file editor with provenance) |
| `ProvenanceHeader` | `features/ai-agent-system/` | Feature-specific (provenance metadata display) |
| `TreeView` | `features/ai-agent-system/` | Feature-specific (visual branch tree) |
| `BranchNode` | `features/ai-agent-system/` | Feature-specific (branch node in tree) |
| `FileNode` | `features/ai-agent-system/` | Feature-specific (file node in tree) |
| `WorkspaceSidebar` | `features/ai-agent-system/` | Feature-specific (Files/Threads tabs) |

### Component Specifications

#### Screen Components (Feature-Specific)

**`ThreadView.tsx`** - Chat Interface Screen

**Location**: `packages/ui/src/features/ai-agent-system/ThreadView.tsx`

**Purpose**: Main thread interface container orchestrating message stream, context panel, and input

**Reusability**: Feature-specific (thread interface is unique to this feature)

**Props**:
```typescript
{
  thread: Thread,
  messages: Message[],
  primeContext: PrimeContext,
  isStreaming: bool,
  streamingBuffer: string,
  onSendMessage: (text: string) => void,
  onCancelRequest: (requestId: string) => void,
  onFileClick: (fileId: string) => void,
  className?: string
}
```

**States**: Loading (initial load), Active (messages displaying), Streaming (agent responding), Error (network fail)

**Component UI State**:
- `isContextPanelExpanded: bool` - Context panel collapsed/expanded
- `selectedFileId: string|null` - File editor open state

**Interaction Patterns**: Streaming Response Pattern, Context Management Pattern

**Accessibility**: See shared checklist below

---

**`BranchSelector.tsx`** - Branch Navigation Dropdown

**Location**: `packages/ui/src/features/ai-agent-system/BranchSelector.tsx`

**Purpose**: Hierarchical dropdown showing branch tree structure for navigation

**Reusability**: Feature-specific (branch hierarchy is unique to this feature)

**Props**:
```typescript
{
  currentBranchId: string,
  branches: Thread[],
  onSelectBranch: (branchId: string) => void,
  className?: string
}
```

**States**: Closed (default), Open (dropdown visible), Loading (branch list loading), Hover (branch preview)

**Component UI State**:
- `isOpen: bool` - Dropdown open/closed
- `hoveredBranchId: string|null` - Hovered branch for preview tooltip

**Interaction Patterns**: Dropdown Navigation Pattern

**Accessibility**: See shared checklist below

---

**`FileEditorPanel.tsx`** - File Editor with Provenance

**Location**: `packages/ui/src/features/ai-agent-system/FileEditorPanel.tsx`

**Purpose**: Display file content with provenance header showing source conversation

**Reusability**: Feature-specific (provenance integration is unique to this feature)

**Props**:
```typescript
{
  file: File,
  provenance: Provenance|null,
  isOpen: bool,
  onClose: () => void,
  onGoToSource: (branchId: string, messageId: string) => void,
  className?: string
}
```

**States**: Closed (hidden), Loading (file content loading), Open (content displayed), Error (load fail)

**Component UI State**:
- `isEditing: bool` - Edit mode (Phase 2+ feature, read-only for MVP)

**Interaction Patterns**: Sliding Panel Pattern, Provenance Navigation Pattern

**Accessibility**: See shared checklist below

---

**`ConsolidateModal.tsx`** - Consolidation Workflow

**Location**: `packages/ui/src/features/ai-agent-system/ConsolidateModal.tsx`

**Purpose**: Multi-step modal for consolidating artifacts from multiple branches

**Reusability**: Feature-specific (consolidation is unique to this feature)

**Props**:
```typescript
{
  isOpen: bool,
  currentBranch: Thread,
  childBranches: Thread[],
  onConfirmConsolidate: (branchIds: string[], fileName: string) => void,
  onApproveConsolidation: (fileName: string) => void,
  onRejectConsolidation: () => void,
  onClose: () => void,
  consolidationProgress: {step: string, current: number, total: number}|null,
  consolidatedContent: string|null,
  className?: string
}
```

**States**: Branch Selection (step 1), Processing (progress bar), Preview (approval step), Complete (success), Error (fail)

**Component UI State**:
- `selectedBranchIds: string[]` - Checked branches for consolidation
- `fileName: string` - Editable file name for consolidated document

**Interaction Patterns**: Modal Workflow, Streaming Response Pattern

**Accessibility**: See shared checklist below

---

**`TreeView.tsx`** - Visual Tree View (Phase 3)

**Location**: `packages/ui/src/features/ai-agent-system/TreeView.tsx`

**Purpose**: Interactive graph visualization of branch hierarchy and provenance

**Reusability**: Feature-specific (tree view is unique to this feature)

**Props**:
```typescript
{
  branches: Thread[],
  files: File[],
  currentBranchId: string,
  onNavigateToBranch: (branchId: string) => void,
  onHighlightProvenance: (fileId: string) => void,
  onClose: () => void,
  className?: string
}
```

**States**: Loading (rendering graph), Active (interactive), Highlighting (provenance visualization)

**Component UI State**:
- `zoomLevel: number` - Canvas zoom state
- `panOffset: {x: number, y: number}` - Canvas pan position
- `highlightedFileId: string|null` - File node clicked for provenance highlight

**Interaction Patterns**: Graph Navigation Pattern

**Accessibility**: See shared checklist below

---

#### Shared Feature Components

**`MessageStream.tsx`** - Message Display Container

**Location**: `packages/ui/src/features/ai-agent-system/MessageStream.tsx`

**Purpose**: Scrollable container displaying message history with streaming support

**Reusability**: Feature-specific (used in ThreadView only)

**Props**: `{ messages: Message[], streamingBuffer: string|null, onScrollToBottom: () => void, className?: string }`

**States**: Empty (no messages), Loading (initial load), Active (messages visible), Streaming (incremental render)

**Component UI State**: `scrollPosition: number`

**Interaction Patterns**: Streaming Response Pattern

**Accessibility**: See shared checklist below

---

**`Message.tsx`** - Individual Message Bubble

**Location**: `packages/ui/src/features/ai-agent-system/Message.tsx`

**Purpose**: Display single message with role-specific styling and markdown rendering

**Reusability**: Feature-specific (used in MessageStream only)

**Props**: `{ message: Message, isStreaming: bool, className?: string }`

**States**: Default (complete message), Streaming (incremental content), Error (failed message)

**Component UI State**: None (stateless presentation)

**Interaction Patterns**: None (display only)

**Accessibility**: See shared checklist below

---

**`ThreadInput.tsx`** - Message Input Field with Send/Stop

**Location**: `packages/ui/src/features/ai-agent-system/ThreadInput.tsx`

**Purpose**: Text input with character counter, send button (transforms to stop during streaming), autocomplete

**Reusability**: Feature-specific (used in ThreadView only)

**Props**: `{ messageText: string, isStreaming: bool, characterLimit: number, onSendMessage: (text: string) => void, onCancelRequest: (requestId: string) => void, onChange: (text: string) => void, className?: string }`

**States**: Default (send button), Typing (character counter), Streaming (stop button), Disabled (loading)

**Component UI State**: `inputValue: string`, `characterCount: number`

**Interaction Patterns**: Streaming Response Pattern

**Accessibility**: See shared checklist below

---

**`ToolCallApproval.tsx`** - Tool Call Approval Prompt

**Location**: `packages/ui/src/features/ai-agent-system/ToolCallApproval.tsx`

**Purpose**: Inline approval prompt showing tool call details and preview

**Reusability**: Feature-specific (used in MessageStream during streaming)

**Props**: `{ toolName: string, toolInput: object, previewContent?: string, isLoading: bool, onApprove: (toolCallId: string) => void, onReject: (toolCallId: string, reason?: string) => void, className?: string }`

**States**: Pending (awaiting user decision), Approving (spinner on approve), Rejected (rejection reason input), Timeout (10min timeout)

**Component UI State**: `rejectionReason: string`

**Interaction Patterns**: Approval Workflow

**Accessibility**: See shared checklist below

---

**`ContextPanel.tsx`** - Context Assembly Visualization

**Location**: `packages/ui/src/features/ai-agent-system/ContextPanel.tsx`

**Purpose**: Display 6 collapsible sections showing context sent to AI (Explicit, Frequently used, Semantic, Branch, Artifacts, Excluded)

**Reusability**: Feature-specific (used in ThreadView only)

**Props**: `{ primeContext: PrimeContext, onToggleSection: (sectionId: string) => void, onFileClick: (fileId: string) => void, onAddToExplicit: (contextRefId: string) => void, onRemoveFromExplicit: (contextRefId: string) => void, className?: string }`

**States**: Collapsed (default for some sections), Expanded (sections showing widgets), Empty (no items in section)

**Component UI State**: `expandedSections: Set<string>`

**Interaction Patterns**: Collapsible Section Pattern, Context Management Pattern

**Accessibility**: See shared checklist below

---

**`ContextSection.tsx`** - Collapsible Section in Context Panel

**Location**: `packages/ui/src/features/ai-agent-system/ContextSection.tsx`

**Purpose**: Section container controlling collapse state for ALL child widgets. Section has TWO states (collapsed/expanded). ALL child widgets inherit this state via `isExpanded` prop. No individual widget collapse.

**Reusability**: Feature-specific (used in ContextPanel only)

**Props**: `{ sectionId: 'explicit' | 'semantic' | 'frequentlyUsed' | 'branch' | 'artifacts' | 'excluded', title: string, itemCount: number, tierColor: string, isExpanded: bool, onToggle: () => void, children: ReactNode, className?: string }`

**Two Section States**:

**1. Collapsed** (`isExpanded=false`, chevron ▶):
- Section height: 40px desktop, 36px mobile (header only)
- Widget container: Horizontal inline layout in header row
- Child widgets: ALL render collapsed (32px pills) - state inherited via `isExpanded={false}` prop
- Widget metadata: Hidden, visible in tooltips on hover
- Action buttons: Hidden on all widgets
- Horizontal scroll: Smooth, shows 8-10 widgets before scroll (desktop)

**2. Expanded** (`isExpanded=true`, chevron ▼):
- Section height: Auto (min 120px desktop, 100px mobile)
- Widget container: Horizontal scroll container below header
- Child widgets: ALL render expanded (80px cards) - state inherited via `isExpanded={true}` prop
- Widget metadata: Visible inline (badges, scores, timestamps)
- Action buttons: Appear on widget hover (slide in from right)
- Horizontal scroll: Smooth, shows 5-6 widgets before scroll (desktop)

**3. Empty** (`itemCount=0`):
- Section header: Shows "0" badge, disabled (no toggle)
- Grayed out, no interaction

**State Propagation Mechanism**:
- Parent `ContextSection` receives `isExpanded` from `ContextPanel` (global section state)
- Section passes `isExpanded` prop to ALL child `ContextReference` widgets
- ALL widgets in section morph simultaneously when section toggles (200ms transition)
- **No widget has independent collapse state** - section controls all children atomically

**Tier Color Indicators** (left border on section header + widgets):
- Explicit: `border-l-primary-500` (coral)
- Frequently Used: `border-l-blue-500`
- Semantic Matches: `border-l-purple-500`
- Branch Context: `border-l-orange-500`
- Artifacts: `border-l-green-500`
- Excluded: `border-l-gray-400`

**Component UI State**: None (controlled by parent `ContextPanel`)

**Interaction Patterns**: Collapsible Section Pattern

**Accessibility**: See shared checklist below

---

**`ContextReference.tsx`** - File/Thread Reference Widget

**Location**: `packages/ui/src/features/ai-agent-system/ContextReference.tsx`

**Purpose**: Stateless presentational widget displaying file or thread reference. Visual state (collapsed/expanded) is INHERITED from parent `ContextSection` via `isExpanded` prop. Widget has NO independent collapse mechanism.

**Reusability**: Feature-specific (used in ContextPanel sections)

**Props**: `{ contextRef: ContextReference, isExpanded: bool, contextType: 'explicit' | 'semantic' | 'frequentlyUsed' | 'branch' | 'artifacts' | 'excluded', onFileClick: (fileId: string) => void, onAddToExplicit?: (contextRefId: string) => void, onRemoveFromExplicit?: (contextRefId: string) => void, onDismiss?: (contextRefId: string) => void, className?: string }`

**States** (all controlled by parent section):
- **Collapsed** (`isExpanded=false` from parent):
  - Compact horizontal pill (32px height, auto width ~80-120px)
  - Shows: Icon + filename (truncated 20 chars)
  - Hidden metadata: Revealed via tooltip on hover (relevance score, branch source, timestamp, full path)
  - No action buttons visible
  - Tier color border (4px left border)

- **Expanded** (`isExpanded=true` from parent):
  - Full metadata card (80px height, 200px width desktop / 160px mobile)
  - Shows: Icon, filename (truncated 30 chars), metadata badges (relevance/usage/branch), timestamp
  - Action buttons: Appear on hover (slide in from right, 150ms)
  - Tier color border (4px left border)

- **Hover** (mouse interaction):
  - Collapsed: Styled tooltip with full metadata
  - Expanded: Action buttons slide in from right edge

- **Loading** (action in progress):
  - Spinner replaces action buttons
  - Widget dimmed (opacity: 0.7)

**Widget Variants by Context Type** (visual differentiation):

Each context type uses distinct styling to communicate priority tier and metadata at a glance:

**1. Explicit Context** (Tier 1 - User-selected files):
- **Color**: `border-l-4 border-l-primary-500` (coral #ff4d4d)
- **Collapsed**: Icon + filename, tooltip shows "Explicitly added via @-mention"
- **Expanded**: Icon + filename + "Explicit" badge (coral) + timestamp + file path
- **Actions**: View (opens in right panel), Remove (demotes to semantic)
- **Example**: `📄 architecture.md · Explicit · 2h ago`

**2. Semantic Matches** (Tier 3 - AI-surfaced related files):
- **Color**: `border-l-4 border-l-purple-500` (purple)
- **Collapsed**: Icon + filename, tooltip shows relevance score + source branch
- **Expanded**: Icon + filename + relevance badge (e.g., "87%") + branch indicator pill (e.g., "from RAG Deep Dive") + timestamp
- **Actions**: View, Add to Explicit (promotes to tier 1), Dismiss (excludes from this request)
- **Example**: `📄 rag-best-practices.md · 87% · RAG Deep Dive · 1d ago`

**3. Frequently Used** (Tier 2 - Usage-based recommendations):
- **Color**: `border-l-4 border-l-blue-500` (blue)
- **Collapsed**: Icon + filename, tooltip shows usage count
- **Expanded**: Icon + filename + usage badge (e.g., "Used 8x") + last accessed timestamp
- **Actions**: View, Add to Explicit
- **Example**: `📄 prompting-guide.md · Used 8x · Last: 3h ago`

**4. Branch Context** (Tier 4 - Inherited from parent):
- **Color**: `border-l-4 border-l-orange-500` (orange)
- **Collapsed**: Icon + filename, tooltip shows "Inherited from [Parent Branch Name]"
- **Expanded**: Icon + filename + "Inherited" badge (orange) + parent branch name pill + inheritance timestamp
- **Actions**: View only (cannot remove inherited context)
- **Example**: `📄 initial-research.md · Inherited · Main Thread · 1w ago`

**5. Artifacts** (Tier 5 - Created in this thread):
- **Color**: `border-l-4 border-l-green-500` (green)
- **Collapsed**: Icon + filename, tooltip shows artifact type
- **Expanded**: Icon + filename + type badge (e.g., "Markdown", "JSON") + creation timestamp + "Created here" indicator
- **Actions**: View, Remove (removes from context, file still exists)
- **Example**: `📋 analysis.md · Markdown · Created here · 30m ago`

**6. Excluded from Context** (Tier 6 - Budget overflow):
- **Color**: `border-l-4 border-l-gray-400` (gray, dimmed)
- **Collapsed**: Icon + filename, tooltip shows "Excluded (budget limit)"
- **Expanded**: Icon + filename + "Excluded" badge (gray) + reason ("200K token limit") + timestamp
- **Actions**: Add to Explicit (forces inclusion with 1.0 weight, overrides budget)
- **Example**: `📄 long-document.md · Excluded · Budget · 5m ago`

**Visual Hierarchy Rationale**:
- **Color coding** allows instant tier recognition without reading text
- **Badges** communicate state/metadata in expanded view
- **Icons** indicate file type (📄 document, 📋 markdown, 📊 data, 🧵 thread)
- **Tooltips** reveal full metadata in collapsed state (no click required)

**Tooltip Styling** (collapsed state only):
- Background: `bg-gray-900` (dark mode) / `bg-white` (light mode)
- Border: `border border-gray-700` (dark) / `border-gray-200` (light)
- Padding: `p-3` (12px)
- Max width: 300px
- Content: Full filename, metadata rows (relevance/branch/timestamp as applicable), file path
- Position: Above widget (preferred), below if insufficient space
- Arrow indicator pointing to widget center

**Truncation Behavior**:
- Collapsed: Filename truncated to 20 characters with "..." ellipsis
- Expanded: Filename truncated to 30 characters with "..." ellipsis
- Tooltip: Full filename, no truncation (wraps if >300px)
- Horizontal overflow: When section has >8 widgets (desktop) or >4 (mobile), show "+X more" badge at end of visible widgets. Scroll horizontally to reveal remaining items.

**Component UI State**: None (stateless presentation, state controlled by parent `ContextPanel`)

**Interaction Patterns**: Context Management Pattern

**Accessibility**: See shared checklist below

---

**`BranchActions.tsx`** - Branch Action Buttons

**Location**: `packages/ui/src/features/ai-agent-system/BranchActions.tsx`

**Purpose**: Header action buttons (Create Branch, Consolidate, Tree View)

**Reusability**: Feature-specific (used in ThreadView header)

**Props**: `{ currentBranch: Thread, hasChildren: bool, onCreateBranch: () => void, onConsolidate: () => void, onOpenTreeView: () => void, className?: string }`

**States**: Default (all buttons visible), Disabled (consolidate disabled if no children)

**Component UI State**: None (stateless presentation)

**Interaction Patterns**: None (button group)

**Accessibility**: See shared checklist below

---

**`CreateBranchModal.tsx`** - Branch Creation Form

**Location**: `packages/ui/src/features/ai-agent-system/CreateBranchModal.tsx`

**Purpose**: Modal form for creating new branch with name input and validation

**Reusability**: Feature-specific (used via BranchActions)

**Props**: `{ isOpen: bool, currentThreadTitle: string, onConfirmCreate: (name: string) => void, onCancel: () => void, isLoading: bool, validationError: string|null, className?: string }`

**States**: Input (entering name), Validating (checking name), Creating (API call), Error (validation fail)

**Component UI State**: `branchName: string`, `characterCount: number`

**Interaction Patterns**: Modal Workflow

**Accessibility**: See shared checklist below

---

**`ProvenanceHeader.tsx`** - File Provenance Metadata

**Location**: `packages/ui/src/features/ai-agent-system/ProvenanceHeader.tsx`

**Purpose**: Display file provenance metadata with "Go to source" link

**Reusability**: Feature-specific (used in FileEditorPanel)

**Props**: `{ provenance: Provenance, onGoToSource: (branchId: string, messageId: string) => void, className?: string }`

**States**: Default (provenance visible), Missing (no provenance for manually created files)

**Component UI State**: None (stateless presentation)

**Interaction Patterns**: Provenance Navigation Pattern

**Accessibility**: See shared checklist below

---

**`BranchNode.tsx`** - Branch Node in Tree View

**Location**: `packages/ui/src/features/ai-agent-system/BranchNode.tsx`

**Purpose**: Visual representation of branch in tree graph

**Reusability**: Feature-specific (used in TreeView)

**Props**: `{ branch: Thread, isCurrent: bool, isHighlighted: bool, onNavigate: (branchId: string) => void, className?: string }`

**States**: Default (normal), Current (highlighted coral), Hovered (tooltip), Highlighted (provenance visualization)

**Component UI State**: None (stateless presentation)

**Interaction Patterns**: Graph Navigation Pattern

**Accessibility**: See shared checklist below

---

**`FileNode.tsx`** - File Node in Tree View

**Location**: `packages/ui/src/features/ai-agent-system/FileNode.tsx`

**Purpose**: Visual representation of file in tree graph with provenance links

**Reusability**: Feature-specific (used in TreeView)

**Props**: `{ file: File, isHighlighted: bool, onHighlightProvenance: (fileId: string) => void, className?: string }`

**States**: Default (normal), Hovered (tooltip), Highlighted (provenance visualization showing connected threads)

**Component UI State**: None (stateless presentation)

**Interaction Patterns**: Graph Navigation Pattern

**Accessibility**: See shared checklist below

---

**`WorkspaceSidebar.tsx`** - Files/Threads Tabs Navigation

**Location**: `packages/ui/src/features/ai-agent-system/WorkspaceSidebar.tsx`

**Purpose**: Left sidebar with tabs for Files and Threads navigation

**Reusability**: Feature-specific (used in workspace layout)

**Props**: `{ activeTab: 'files'|'threads', onTabChange: (tab: 'files'|'threads') => void, files: File[], threads: Thread[], onFileClick: (fileId: string) => void, onThreadClick: (threadId: string) => void, className?: string }`

**States**: Files Tab Active, Threads Tab Active

**Component UI State**: `searchQuery: string` (for filtering files/threads)

**Interaction Patterns**: Tab Navigation Pattern

**Accessibility**: See shared checklist below

---

### Shared Accessibility Checklist

**All components must meet these requirements** (referenced above):
- [x] **Keyboard navigation**: Tab (focus next), Shift+Tab (focus previous), Enter (activate), Escape (close modal/dropdown), Arrow keys (dropdown/list navigation)
- [x] **ARIA labels**: `aria-label` for icon buttons, `aria-describedby` for inputs with validation, `role` for custom widgets (e.g., `role="tree"` for branch selector)
- [x] **Focus management**: Initial focus on primary action (modal open), focus trap for modals (Tab cycles within modal), focus restoration (return to trigger after modal close)
- [x] **Color contrast**: WCAG AA minimum - 4.5:1 for text (black on white, coral on white), 3:1 for UI components (borders, icons)
- [x] **Screen reader announcements**: `aria-live="polite"` for non-critical updates (context panel updates), `aria-live="assertive"` for errors (network fail), status messages for streaming ("Agent is responding...")

---

### Primitives Used (from @centrid/ui/components)

- **Button** (variants: default, secondary, ghost) - Used in all action buttons
- **Input** (with validation states) - Used in ThreadInput, CreateBranchModal, ConsolidateModal
- **Card** - Used for ContextReference widgets, Message bubbles
- **Badge** - Used for priority tier indicators, provenance badges
- **Modal/Dialog** - Used for CreateBranchModal, ConsolidateModal
- **Tooltip** - Used for provenance hover info, branch preview tooltips
- **ErrorBanner** - Used for error states (network fail, SSE interrupts)
- **Dropdown** (extended with hierarchical variant) - Used for BranchSelector
- **Tabs** - Used for WorkspaceSidebar (Files/Threads tabs)
- **Spinner** - Used for loading states (button spinners, streaming indicators)

---

## Interaction Patterns

### Modal Workflow

**Where Used**: Create Branch, Consolidate, File conflicts (future)

**Brief Description**: User triggers modal → Modal opens with backdrop and focus trap → User interacts (form/confirmation) → User dismisses (Escape/Cancel/Submit) → Modal closes, focus returns to trigger element.

**Components**: `Modal`, `ModalHeader`, `ModalBody`, `ModalFooter` (from @centrid/ui), `CreateBranchModal`, `ConsolidateModal`

**State Changes**: Hidden → Visible (backdrop blocks background, focus trapped inside modal) → Hidden (focus restored to trigger)

**Keyboard**: `Escape` (close modal), `Enter` (submit if single input field), `Tab` (navigate between focusable elements, trapped in modal)

---

### Streaming Response Pattern

**Where Used**: Agent message streaming, Consolidation document generation

**Brief Description**: User sends message → Loading indicator appears → SSE connection opens → Text chunks arrive incrementally → UI renders chunks as they arrive → Tool calls inline during stream → Stream completes → Final message rendered.

**Components**: `ThreadInput` (Send→Stop button), `MessageStream` (incremental render), `Message` (markdown rendering), `ToolCallApproval` (inline during stream)

**State Changes**: Idle (send button) → Streaming (stop button, incremental content) → Paused (approval prompt) → Streaming (resume) → Complete (send button)

**Keyboard**: `Escape` (cancel request, close SSE stream)

---

### Approval Workflow

**Where Used**: Agent tool calls (file operations, branch creation)

**Brief Description**: Agent requests tool approval → Stream pauses → Inline approval prompt shows operation details and preview → User approves/rejects → If approved: tool executes, stream resumes. If rejected: agent receives rejection context, revises plan, stream resumes with new strategy.

**Components**: `ToolCallApproval`, `PreviewSection`, `ApprovalActions` (Approve/Reject buttons)

**State Changes**: Streaming → Paused (approval prompt) → Approved (tool executing) → Streaming (resume) OR Rejected (agent revising) → Streaming (resume with new plan)

**Keyboard**: `Tab` (navigate between Approve/Reject buttons), `Enter` (trigger focused button)

---

### Context Management Pattern

**Where Used**: Context panel (6 sections: Explicit, Frequently Used, Semantic, Branch, Artifacts, Excluded)

**Brief Description**: User manages AI context by toggling sections and taking actions on widgets. Section state (collapsed/expanded) controls ALL child widgets atomically. No individual widget collapse.

**User Flow**:
1. **View context**: Panel shows 6 sections, each with tier color border (coral/blue/purple/orange/green/gray)
2. **Toggle section**: Click header → Section state changes → ALL widgets inherit new state and morph simultaneously
3. **Inspect widget** (collapsed): Hover → Tooltip shows full metadata
4. **Inspect widget** (expanded): Hover → Action buttons slide in
5. **Take action**: View (open file), Add to Explicit (promote), Remove/Dismiss (demote/exclude)
6. **Cross-section movement**: Widget animates vertically to new section (500ms), target section auto-expands

**Section State Behavior**:
- **Collapsed section**: Header only (40px), ALL widgets = compact pills (32px, icon+filename), metadata in tooltips
- **Expanded section**: Header + container (auto height), ALL widgets = full cards (80px, badges+metadata visible)
- **State inheritance**: ALL widgets receive `isExpanded` prop from parent section, morph simultaneously (200ms)

**Widget Actions by Context Type**:
- **Explicit** (coral): View, Remove
- **Semantic** (purple): View, Add to Explicit, Dismiss
- **Frequently Used** (blue): View, Add to Explicit
- **Branch** (orange): View only
- **Artifacts** (green): View, Remove
- **Excluded** (gray): Add to Explicit

**Cross-Section Movement**:
- User clicks "Add to Explicit" on semantic match widget
- Widget animates vertically: Semantic section → Explicit section (500ms)
- Explicit section auto-expands if collapsed
- Widget updates: purple border → coral border, relevance badge → "Explicit" badge
- Next agent request includes file with 1.0 weight (tier 1)

**Components**: `ContextPanel` (6 sections), `ContextSection` (state controller), `ContextReference` (stateless widget)

**State Flow**: Section collapsed → User toggles → Section expanded → ALL widgets expand → User hovers widget → Action buttons appear → User clicks action → Widget moves/removes → Section re-stabilizes

**Keyboard**: `Enter` (toggle section), `Tab` (navigate widgets), `Arrow Left/Right` (scroll), `Enter` (activate action)

---

### Dropdown Navigation Pattern

**Where Used**: Branch selector (hierarchical tree)

**Brief Description**: User clicks dropdown trigger → Dropdown opens showing hierarchical list with indentation for nesting → User hovers over branch to see preview tooltip → User clicks branch → Navigate to selected branch, dropdown closes.

**Components**: `BranchSelector`, `BranchSelectorDropdown`, `BranchSelectorItem`

**State Changes**: Closed (chevron down) → Open (chevron up, dropdown visible) → Hovered (branch preview tooltip) → Navigated (dropdown closes, URL updates)

**Keyboard**: `Enter`/`Space` (open dropdown), `Arrow Up`/`Down` (navigate items), `Enter` (select branch), `Escape` (close dropdown)

---

### Sliding Panel Pattern

**Where Used**: File editor panel (desktop)

**Brief Description**: User clicks file reference → Right panel slides in from right edge (300ms) → Thread interface shrinks from 80% to 50% width → Panel shows file content with provenance → User clicks close (X) → Panel slides out, thread expands back to 80%.

**Components**: `FileEditorPanel`, `ProvenanceHeader`, `EditorContent`

**State Changes**: Closed (0% width, hidden) → Opening (animating slide-in) → Open (40% width, visible) → Closing (animating slide-out) → Closed

**Keyboard**: `Escape` (close panel), `Tab` (navigate within panel content)

---

### Collapsible Section Pattern

**Where Used**: Context panel sections (Explicit, Frequently Used, Semantic, Branch, Artifacts, Excluded)

**Brief Description**: Section has TWO states: collapsed or expanded. User clicks section header → Section state toggles → ALL child widgets inherit new state and morph simultaneously (no individual widget collapse).

**State Inheritance Flow**:
1. User clicks `ContextSection` header
2. `ContextPanel` updates section state: `expandedSections.toggle(sectionId)`
3. `ContextSection` receives new `isExpanded` prop from parent
4. `ContextSection` passes `isExpanded` to ALL child `ContextReference` widgets
5. ALL widgets morph simultaneously (200ms): collapsed (32px) ↔ expanded (80px)

**Two Section States**:

**Collapsed** (chevron ▶, `isExpanded=false`):
- Section: Header only (40px height), tier color left border
- Widget container: Horizontal inline row in header
- ALL widgets: Compact pills (32px, icon+filename), metadata in tooltips, no action buttons
- Scroll: Shows 8-10 widgets before horizontal scroll

**Expanded** (chevron ▼, `isExpanded=true`):
- Section: Header + container (auto height, min 120px), tier color left border
- Widget container: Horizontal scroll container below header
- ALL widgets: Full cards (80px, metadata badges visible), action buttons on hover
- Scroll: Shows 5-6 widgets before horizontal scroll

**Critical Constraint**:
- **Widgets have NO independent collapse state**
- Widget appearance is purely controlled by `isExpanded` prop from parent section
- When section toggles, ALL widgets morph atomically (no staggered animation)

**Components**: `ContextSection` (state controller), `ContextReference` (stateless widget), `OverflowIndicator`

**Keyboard**: `Enter`/`Space` (toggle section), `Tab` (navigate widgets), `Arrow Left/Right` (horizontal scroll)

---

### Provenance Navigation Pattern

**Where Used**: File editor "Go to source" link, File provenance tooltips

**Brief Description**: User clicks "Go to source" link in provenance header → Navigate to source branch (`/thread/:sourceBranchId`) → Scroll to message where file was created → Highlight message briefly (yellow flash 2s fade) → File editor panel closes.

**Components**: `ProvenanceHeader`, `GoToSourceLink`, `MessageStream` (scroll + highlight)

**State Changes**: File editor open → Navigation triggered → URL changes → Message highlighted → File editor closes

**Keyboard**: `Enter` (activate "Go to source" link when focused)

---

### Graph Navigation Pattern

**Where Used**: Visual tree view (Phase 3)

**Brief Description**: User opens tree view → Interactive graph shows branch nodes and file nodes → User hovers over node to see tooltip → User clicks branch node → Navigate to thread, tree view stays open → User clicks file node → Highlights all threads that referenced this file (provenance visualization).

**Components**: `TreeView`, `BranchNode`, `FileNode`, `TreeViewControls`

**State Changes**: Tree view closed → Open (graph renders) → Hovered (node tooltip) → Navigated (URL updates, highlight moves) OR Provenance highlighted (related threads glow)

**Keyboard**: `Tab` (navigate between nodes), `Enter` (activate node), `Escape` (close tree view), `+`/`-` (zoom in/out), Arrow keys (pan canvas)

---

## Design Handoff Checklist

### Completeness Check

- [x] All screens from arch.md have detailed flows (ALL priorities: Chat Interface P1, Branch Selector P1, Context Panel P1, File Editor P2, Approval Modal P2, Tree View P5)
- [x] All user stories from spec.md covered (US-1 Branching P1, US-2 Provenance P2, US-3 Cross-Branch Discovery P3, US-4 Consolidation P4, US-5 Provenance Transparency P5)
- [x] All acceptance criteria from spec.md mapped to flows (AC-001 Create Branch, AC-002 Send Message, AC-003 Semantic Search, AC-004 Consolidate)
- [x] All components have prop specifications (18 components with inline TypeScript props)
- [x] All error scenarios documented with test data and recovery paths (Network fail, SSE interrupts, Approval timeout, Context overflow, Branch name validation, File deleted, Semantic search no results, Tree view render timeout)
- [x] Each screen has layout dimensions table (Desktop/Mobile columns with specific pixel values)
- [x] Interaction patterns documented (8 patterns: Modal Workflow, Streaming Response, Approval Workflow, Context Management, Dropdown Navigation, Sliding Panel, Collapsible Section, Provenance Navigation, Graph Navigation)
- [x] Component UI state specified (not global/URL state - e.g., isModalOpen, selectedId, inputValue, isContextPanelExpanded)

### Component Architecture Check

- [x] Component hierarchy matches arch.md (ChatController/ChatView → MessageStream → Message, FileEditorController → FileEditorView → ProvenanceHeader + EditorContent)
- [x] Props follow data-in/callbacks-out pattern (all props interfaces show data props + callback props `on[Action]`)
- [x] Component locations specified (all feature-specific components → `packages/ui/src/features/ai-agent-system/`)
- [x] Reusability assessment complete (18 components categorized as feature-specific, 9 primitives reused from @centrid/ui)
- [x] Shared accessibility checklist referenced (all components reference checklist: keyboard nav, ARIA, focus management, color contrast, screen reader)

### Flow Verification

- [x] Each flow maps to acceptance criteria from spec.md (US-1→AC-001 Create Branch, US-2→AC-002 Send Message, US-3→AC-003 Semantic Search, US-4→AC-004 Consolidate, US-5→AC-001 Provenance View)
- [x] Error scenarios have recovery paths (all error tables include "Recovery" column with specific user actions or automatic retries)
- [x] Success criteria defined for each flow (from spec.md SC-001 to SC-017: adoption metrics, performance targets, quality thresholds)
- [x] Navigation paths complete (entry + exit points for all 6 screens)
- [x] Keyboard navigation specified for all interactive patterns (8 patterns include Keyboard section with specific key bindings)

### Design System Alignment

- [x] Checked existing components in `packages/ui/src/components/` (Button, Input, Card, Badge, Modal, Tooltip, ErrorBanner, Dropdown, Tabs all reused)
- [x] New components justified (18 feature-specific components for AI agent system, not duplicating existing)
- [x] Spacing uses design system tokens (8px grid system: gap-3 12px, gap-4 16px, gap-6 24px, mb-6 24px, mb-8 32px, p-4 16px, p-6 24px)
- [x] Interaction patterns align with existing patterns (Modal Workflow, Dropdown Navigation follow standard patterns, new patterns documented for feature-specific interactions)

---

## Notes

**Open Questions**: None - all UX decisions resolved through spec.md clarifications (Session 2025-10-26: summary generation, branch limits, file structure metadata, approval timeout, context exclusion UI, memory chunking, etc.)

**Assumptions**:
- Users will understand hierarchical branch selector tree structure within 5 minutes (progressive disclosure)
- Context panel positioned below messages (not above) keeps context visible while typing without obscuring chat history
- Horizontal widget layout with scrolling scales better than vertical stacking for 10+ context items
- Semantic search relevance scores (0.0-1.0) are meaningful to users when displayed as badges
- "Go to source" provenance navigation is discoverable via clickable links in provenance header
- Tool approval timeout (10 minutes) is sufficient for users to review and decide on agent actions

**Deferred**:
- **Phase 2**: Thread embeddings (searchable branches by semantic similarity), Advanced semantic search (thread history search, concept search), User profile learning (style, preferences), Interaction tracking (copy rate, regenerate rate)
- **Phase 3**: Visual tree view (interactive graph), Divergence penalty (reduce sibling pollution), Concept extraction (NER, topic modeling)
- **Phase 4+**: Templates (save exploration patterns), Collaboration (multi-user), Marketplace (community templates), Temporal reasoning, Meta-learning

**Design System Gaps**: None - all primitives available in @centrid/ui/components (Button, Input, Card, Badge, Modal, Tooltip, ErrorBanner, Dropdown, Tabs, Spinner). Dropdown extended with hierarchical tree variant (BranchSelector) but uses existing Dropdown primitive as base.

---

**UX Specification Complete**: 2025-10-26

**Summary**:
- **6 screens** specified with detailed flows (Chat Interface, Branch Selector, Context Panel, File Editor, Approval Modal, Tree View)
- **5 user stories** covered (US-1 to US-5, all priorities P1-P5)
- **18 components** specified with inline props and states
- **8 interaction patterns** documented (condensed format)
- **Layout dimensions** provided for all screens (Desktop 1440px+ / Mobile 375px)
- **Error scenarios** with recovery paths (8 error types across flows)
- **Accessibility** requirements shared checklist for all components

**Next Steps**:
1. ✅ **UX specification complete** - ux.md ready for design handoff
2. **Run `/speckit.design`** - Create high-fidelity visual designs in `apps/design-system`
3. **Screenshot with Playwright MCP** - Capture mobile (375×812) + desktop (1440×900) screenshots
4. **Iterate on designs** - Get feedback, adjust visuals, re-screenshot
5. **Approve designs** - Finalize component library in `packages/ui/src/features/ai-agent-system/`
6. **Run `/speckit.tasks`** - Generate implementation task list
7. **Run `/speckit.implement`** - Execute implementation

**Design Handoff Context**:
- Condensed table format reduces verbosity while maintaining completeness
- Component prop specifications inline (TypeScript signature format)
- Error scenarios table for quick reference during design
- Layout dimensions table for responsive design implementation
- Interaction patterns condensed (no verbose step-by-step, reference from flows)
- Accessibility checklist shared (not duplicated per component)

**Architecture Alignment**:
- All components match arch.md hierarchy (ChatController/ChatView → MessageStream → Message, etc.)
- All user stories from spec.md mapped to flows (US-1 to US-5)
- All acceptance criteria from spec.md covered (AC-001 to AC-004)
- All error scenarios from spec.md Edge Cases section addressed
- All success criteria from spec.md tracked (SC-001 to SC-017)

---

**Authored by**: Claude Code (Sonnet 4.5)
**Reviewed by**: Aligned with spec.md (2025-10-26), arch.md (2025-10-26), data-model.md (2025-10-26)
