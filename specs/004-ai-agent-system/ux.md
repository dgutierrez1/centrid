# AI-Powered Exploration Workspace - UX Specification

**Feature**: `004-ai-agent-system`
**Date**: 2025-10-26
**Status**: Complete
**Prerequisites**: spec.md (requirements), arch.md (architecture)

---

## Overview

**Feature Summary**: An exploration workspace where users can branch threads to explore multiple approaches in parallel, capture findings as persistent files with provenance, and consolidate insights from the entire exploration tree.

**User Goals**:
- Explore complex topics through branching conversations without losing context
- Capture insights as persistent artifacts with automatic provenance tracking
- Discover and reference relevant content across all branches
- Consolidate findings from multiple exploration paths into comprehensive outputs
- Navigate exploration history through transparent provenance links

**Design Approach**:
- **Adaptive 3-panel workspace**: Left sidebar (Files/Threads navigation) + Center panel (Chat interface, always visible) + Right panel (File editor when opened, closeable)
- **Thread-first UX**: Chat always visible in center (primary), file editing optional on right (closeable panel)
- **Progressive disclosure**: Context complexity hidden behind section-level collapsible panels with horizontal widget layout
- **Task-oriented flow**: Primary actions (send message, create branch, approve tool) front and center
- **Transparency**: Always show what AI sees (context panel with inline widgets) and where content came from (provenance)
- **Mobile-first responsive**: Adapts from 375px mobile (vertical stack) to 1440px+ desktop (3-panel layout)

---

## Screen-by-Screen UX Flows

### Chat Interface (Primary Screen)

**Purpose**: Primary conversation UI where users interact with AI agent, manage context, and navigate branches.

**Route**: `/chat/:threadId`

**Priority**: P1

**Entry Points**:
- Default landing screen (`/chat/main`)
- Deep link to specific thread (`/chat/:threadId`)
- Navigation from branch selector dropdown
- "Go to source" link from file provenance

**Exit Points**:
- File editor (click file reference)
- Visual tree view (desktop only, Phase 3)
- Settings/profile (header navigation)

#### Primary Flow 1: Send Message with Agent Streaming

**User Story**: US-2 (Capture Artifacts with Provenance)

**Acceptance Criteria**: AC-002 (User types message, clicks send, message appears, AI responds)

**Steps**:

1. **User types message in input field**

   - **Component**: `ChatInput` (see Component Library)
   - **Interaction**: Type (keyboard input)
   - **What Happens**: Character count updates, send button enables when text length > 0
   - **Data Required**: `{ messageText: string, characterLimit: number, isLoading: boolean }`
   - **Callback**: `onChange(text: string)` - Updates local input state
   - **Visual Feedback**: Character counter shows `${length}/${limit}`, send button transitions from disabled (gray) to enabled (coral)

2. **User clicks "Send" button**

   - **Component**: `ChatInput` (see Component Library)
   - **Interaction**: Click (mouse or Enter key)
   - **What Happens**: Input field clears and disables, send button shows loading spinner, loading indicator appears in message stream
   - **Data Required**: `{ messageText: string, isLoading: boolean }`
   - **Callback**: `onSendMessage(text: string)` - Triggers optimistic message add + API call
   - **Visual Feedback**: Button shows spinner icon, input field disabled with gray background, loading indicator "Agent is thinking..." appears

3. **System adds user message to conversation (optimistic)**

   - **Trigger**: `onSendMessage` callback fires
   - **What Happens**: User message appears at bottom of conversation with timestamp, smooth scroll to bottom
   - **Component Updated**: `MessageStream` (see Component Library)
   - **Data Flow**: Valtio state (optimistic) → `messages` array → MessageStream renders → Scroll to bottom

4. **System opens SSE connection and starts context assembly (backend)**

   - **Trigger**: API POST `/threads/:id/messages` responds with SSE endpoint
   - **What Happens**: "Building context..." status shows below input, context panel (above input) updates with prime context sections displayed as horizontal widgets
   - **Component Updated**: `ContextPanel` (see Component Library)
   - **Data Flow**: SSE event `context_ready` → Update Valtio `primeContext` → ContextPanel shows sections with horizontal widget layout: Explicit context (files @-mentioned), Frequently used (from preferences), Semantic matches (cross-branch), Branch context (parent summary), Artifacts (files from this thread)
   - **Visual Feedback**: Sections expand to show horizontal widget arrays, each widget shows file icon + name (collapsed) or full metadata card (expanded)

5. **Agent streams response chunks (text + tool calls mixed)**

   - **Trigger**: SSE events arrive (type: `text_chunk`, `tool_call`, `status_update`)
   - **What Happens**: Text chunks appear incrementally in assistant message bubble, tool calls show as inline approval prompts when encountered
   - **Component Updated**: `MessageStream` → `Message` component (see Component Library)
   - **Data Flow**: SSE stream → Valtio `streamingBuffer` → Message renders incrementally with markdown formatting

6. **Agent requests tool approval (e.g., `write_file`)**

   - **Trigger**: SSE event `tool_call` with `approval_required: true`
   - **What Happens**: Stream pauses, inline approval prompt appears with file preview, approve/reject buttons
   - **Component**: `ToolCallApproval` (see Component Library)
   - **Data Required**: `{ toolName: string, toolInput: object, previewContent?: string, isLoading: boolean }`
   - **Callbacks**: `onApprove(toolCallId: string)`, `onReject(toolCallId: string, reason?: string)`
   - **Visual Feedback**: Approval prompt shows file path, content preview (first 10 lines), buttons with loading states during approval processing

7. **User approves tool call**

   - **Component**: `ToolCallApproval` (see Component Library)
   - **Interaction**: Click "Approve" button
   - **What Happens**: Button shows spinner, POST `/agent-requests/:id/approve`, stream resumes after server confirms execution
   - **Data Required**: `{ toolCallId: string, approved: boolean }`
   - **Callback**: `onApprove(toolCallId)` - Sends approval to backend, waits for SSE resume
   - **Visual Feedback**: Button disabled with spinner, "Executing..." status shows, then approval prompt collapses and stream continues

8. **System creates file and shows completion**

   - **Trigger**: Tool execution completes, file created in database
   - **What Happens**: File appears in "Artifacts from this thread" section in context panel as a new widget in the horizontal layout, provenance stored (source thread, creation context)
   - **Component Updated**: `ContextPanel` → "Artifacts from this thread" section (see Component Library)
   - **Data Flow**: Realtime subscription (file created) → Valtio state → ContextPanel adds new file widget to horizontal array with provenance badge
   - **Visual Feedback**: New widget fades in (200ms), section auto-expands if collapsed to show new artifact

9. **Agent completes response**

   - **Trigger**: SSE event `completion`
   - **What Happens**: SSE connection closes, streaming buffer moved to final message, input field re-enables, send button ready
   - **Component Updated**: `ChatInput` (re-enables), `MessageStream` (final message rendered) (see Component Library)
   - **Data Flow**: SSE complete → Move buffer to messages → Close connection → Enable input

**Error Scenarios**:

- **Network Request Fails**
  - **Trigger**: SSE connection timeout (>30s) or 500 error from backend
  - **Component**: `ErrorBanner` (see Component Library) (appears above input)
  - **Display**: "Unable to send message. Please check your connection and try again. [Retry]"
  - **Recovery**: "Retry" button calls `onSendMessage` again with same text (from Valtio state), reconnects SSE
  - **Test Data**: Mock SSE endpoint with `networkError: true` flag

- **SSE Stream Interrupts Mid-Response**
  - **Trigger**: Network disconnect, server error during streaming
  - **Component**: `ErrorBanner` inline in message stream (see Component Library)
  - **Display**: "Response interrupted. Your message was sent but the response was incomplete. [Retry from beginning]"
  - **Recovery**: Discard partial message, user must retry request (FR-053a - MVP simplicity)
  - **Test Data**: Close SSE connection after 3 text chunks sent

- **Tool Approval Timeout (10 minutes)**
  - **Trigger**: User doesn't approve/reject within 10 minutes (FR-048b)
  - **Component**: `ToolCallApproval` → timeout overlay (see Component Library)
  - **Display**: "Approval timed out after 10 minutes. Please retry your request."
  - **Recovery**: SSE stream terminated, user must send message again from beginning
  - **Test Data**: Mock approval with `autoTimeout: 600000` (10 min)

- **Context Budget Overflow (>200K tokens)**
  - **Trigger**: Prime context exceeds limit during assembly
  - **Component**: `ContextPanel` → "Excluded from context" section expands automatically (see Component Library)
  - **Display**: Shows items that didn't fit with manual re-prime buttons, warning banner: "Some context excluded due to size limits. Review excluded items below."
  - **Recovery**: User clicks items in excluded section to manually re-prime (moves to explicit context with 1.0 weight)
  - **Test Data**: Mock context with 250K tokens worth of files

**Success Criteria** (from SC-015):
- ✅ User message appears with timestamp in <100ms
- ✅ "Sending..." indicator shows immediately
- ✅ Agent response starts streaming within 5s (p95 latency)
- ✅ Text chunks render incrementally (<500ms between chunks)
- ✅ Tool approval flow pauses stream until user action
- ✅ File creation completes and appears in artifacts within 2s
- ✅ Input field re-enables after response completes

**Interaction Patterns Used**:
- Streaming Response Pattern (see Interaction Patterns section)
- Approval Workflow (see Interaction Patterns section)

---

#### Primary Flow 2: Create Branch (User-Initiated)

**User Story**: US-1 (Branch Threads for Parallel Exploration)

**Acceptance Criteria**: AC-001 (User clicks "Create Branch", names it, system creates with parent context inherited)

**Steps**:

1. **User clicks "Create Branch" button in header**

   - **Component**: `BranchActions` (see Component Library)
   - **Interaction**: Click
   - **What Happens**: Modal opens with branch name input field pre-focused
   - **Data Required**: `{ currentThreadTitle: string }`
   - **Callback**: `onCreateBranch()` - Opens modal
   - **Visual Feedback**: Modal slides in from top with backdrop overlay, focus trapped inside modal

2. **User types branch name**

   - **Component**: `CreateBranchModal` (see Component Library)
   - **Interaction**: Type
   - **What Happens**: Input field updates, character counter shows, create button enables when length > 0
   - **Data Required**: `{ branchName: string, characterLimit: number }`
   - **Callback**: `onChange(name: string)` - Updates modal state
   - **Visual Feedback**: Character counter `${length}/100`, create button transitions from disabled to enabled

3. **User clicks "Create" button**

   - **Component**: `CreateBranchModal` (see Component Library)
   - **Interaction**: Click (or Enter key)
   - **What Happens**: Button shows spinner, POST `/threads` with parent_id, modal stays open showing "Creating..."
   - **Data Required**: `{ branchName: string, parentId: string, isLoading: boolean }`
   - **Callback**: `onConfirmCreate(name: string)` - API call to create branch
   - **Visual Feedback**: Button disabled with spinner, input disabled, "Creating branch..." status text

4. **System creates branch with inherited context**

   - **Trigger**: API responds with new thread_id
   - **What Happens**: New branch created in database with: parent_id set, inherited_files copied from parent (context references only, not message history), parent_summary copied, parent's last message copied
   - **Component Updated**: None (backend operation)
   - **Data Flow**: POST `/threads` → Create thread record → Copy explicit_files from parent → Generate initial summary → Return thread_id

5. **System navigates to new branch**

   - **Trigger**: API success response
   - **What Happens**: Modal closes, URL updates to `/chat/:newThreadId`, branch selector updates to show new branch, context panel loads inherited context, message stream shows empty state with welcome message
   - **Component Updated**: `BranchSelector`, `ContextPanel`, `MessageStream` (see Component Library)
   - **Data Flow**: Thread created → Navigate (`/chat/:newThreadId`) → Load thread data → Render UI

6. **System shows inherited context in context panel**

   - **Trigger**: Thread data loaded
   - **What Happens**: Context panel shows: "Branch context" section expanded with parent summary and horizontal widget array of inherited files, empty "Explicit context" (user hasn't @-mentioned anything yet)
   - **Component Updated**: `ContextPanel` → "Branch context" section (see Component Library)
   - **Data Flow**: Thread.inherited_files → Map to ContextReference widgets → Render in horizontal layout with "Inherited" badge on each widget
   - **Visual Feedback**: "Branch context" section auto-expands to show inherited files as horizontal widgets

**Error Scenarios**:

- **Branch Name Validation Fails**
  - **Trigger**: User enters invalid name (empty, >100 chars, special chars)
  - **Component**: `CreateBranchModal` → validation error below input (see Component Library)
  - **Display**: "Branch name required (1-100 characters, letters/numbers/spaces/-/_)"
  - **Recovery**: User edits name, validation re-runs on change
  - **Test Data**: Try empty string, 101 characters, "Branch@#$%"

- **Network Error During Creation**
  - **Trigger**: POST `/threads` fails (timeout, 500 error)
  - **Component**: `CreateBranchModal` → error banner (see Component Library)
  - **Display**: "Failed to create branch. Please try again. [Retry]"
  - **Recovery**: "Retry" button re-attempts POST with same name, or user can "Cancel" to close modal
  - **Test Data**: Mock POST with `networkError: true`

**Success Criteria** (from SC-001):
- ✅ 70% of users create at least one branch within first week
- ✅ Branch creation completes in <2s (latency target)
- ✅ Inherited context shows parent files and summary correctly
- ✅ Branch selector updates immediately (optimistic) with new branch

**Interaction Patterns Used**:
- Modal Workflow (see Interaction Patterns section)

---

#### Primary Flow 3: Cross-Branch File Discovery (Semantic Search)

**User Story**: US-3 (Cross-Branch Context Discovery)

**Acceptance Criteria**: AC-003 (User asks about topic, system surfaces relevant files from sibling branches)

**Steps**:

1. **User is in Branch B, typing message about "RAG"**

   - **Component**: `ChatInput` (see Component Library)
   - **Interaction**: Type
   - **What Happens**: As user types, debounced semantic search triggers in background (300ms delay)
   - **Data Required**: `{ messageText: string }`
   - **Callback**: `onChange(text: string)` - Debounced call to semantic search
   - **Visual Feedback**: No visible feedback during typing (search is background operation)

2. **System runs semantic search across shadow entities**

   - **Trigger**: Debounced onChange (300ms after user stops typing)
   - **What Happens**: POST `/shadow-domain/search` with query="RAG", entityTypes=['file', 'thread'], limit=10
   - **Component Updated**: None (backend operation)
   - **Data Flow**: Query shadow_entities table → Cosine similarity on embeddings → Apply relationship modifiers (+0.15 for sibling Branch A) → Return top 10 matches

3. **System updates context panel with semantic matches**

   - **Trigger**: Search API responds with ranked results
   - **What Happens**: Context panel "Semantic matches" section updates with horizontal widget array showing files from Branch A, sorted by relevance score
   - **Component Updated**: `ContextPanel` → "Semantic matches" section (see Component Library)
   - **Data Flow**: Search results → Map to ContextReference widgets → Render in horizontal layout with provenance badges ("From: RAG Deep Dive [Sibling branch]")
   - **Visual Feedback**: "Semantic matches" section auto-expands, widgets display horizontally with relevance score badges, if >5 matches show "+X more" truncation indicator

4. **User hovers over semantic match widget**

   - **Component**: `ContextReference` widget in "Semantic matches" section (see Component Library)
   - **Interaction**: Hover (mouse)
   - **What Happens**:
     - **If section is collapsed**: Custom tooltip appears showing file name, source branch, creation timestamp, relevance score (0.87), relationship type (sibling +0.15)
     - **If section is expanded**: Widget already shows metadata, hover reveals action buttons (View, Add to Explicit, Dismiss)
   - **Data Required**: `{ fileName: string, sourceBranch: string, createdAt: Date, relevanceScore: number, relationshipModifier: number }`
   - **Callback**: None for tooltip (pure UI), callbacks for action buttons
   - **Visual Feedback**:
     - **Collapsed**: Tooltip fades in (200ms), positioned above/below widget
     - **Expanded**: Action buttons slide in from right edge of widget (150ms)

5. **User clicks semantic match file to view provenance**

   - **Component**: `ContextReference` (clickable) (see Component Library)
   - **Interaction**: Click
   - **What Happens**: File editor panel opens (right panel) with provenance header showing: "Created in: RAG Deep Dive branch (sibling), 2 hours ago, Context: RAG best practices discussion", file content rendered below
   - **Data Required**: File content, provenance metadata (created_in_conversation_id, context_summary, creation_timestamp)
   - **Callback**: `onFileClick(fileId: string)` - Opens file editor panel
   - **Visual Feedback**: Right panel slides in from right (300ms), chat panel shrinks from 80% to 50%, provenance header at top with coral accent

6. **User clicks "Go to source" link in provenance header**

   - **Component**: `ProvenanceHeader` in `FileEditorPanel` (see Component Library)
   - **Interaction**: Click
   - **What Happens**: Navigate to source branch (`/chat/:sourceBranchId`), scroll to message where file was created, highlight that message briefly (2s), file editor panel closes
   - **Data Required**: `{ sourceBranchId: string, creationMessageId: string }`
   - **Callback**: `onGoToSource(branchId: string, messageId: string)` - Navigation + scroll
   - **Visual Feedback**: URL changes, branch selector updates, message highlighted with yellow background flash (2s fade), file editor panel closes

7. **User manually adds semantic match to explicit context**

   - **Component**: `ContextReference` widget in "Semantic matches" → "Add to Explicit" button (appears on hover if expanded, or in tooltip menu if collapsed) (see Component Library)
   - **Interaction**: Click "Add to Explicit" button
   - **What Happens**: Widget moves from "Semantic matches" section (0.5 weight) to "Explicit context" section (1.0 weight), will be included in next agent request with full priority
   - **Data Required**: `{ fileId: string, currentPriorityTier: number }`
   - **Callback**: `onAddToExplicit(fileId: string)` - Updates context_references table
   - **Visual Feedback**: Widget animates vertically from Semantic section to Explicit section (500ms slide), priority badge updates from "Semantic" to "Explicit", "Explicit context" section auto-expands if collapsed

**Error Scenarios**:

- **Semantic Search Returns No Results**
  - **Trigger**: Query doesn't match any files (cosine similarity <0.3 for all entities)
  - **Component**: `ContextPanel` → "Semantic matches" section (see Component Library)
  - **Display**: "No relevant files found across branches. Try different keywords or add files manually."
  - **Recovery**: User can @-mention files manually, or continue without semantic matches
  - **Test Data**: Query text with no embedding matches

- **File Deleted After Semantic Match Shown**
  - **Trigger**: User clicks file that was deleted in another session (race condition)
  - **Component**: `FileEditorPanel` → error state (see Component Library)
  - **Display**: "File no longer exists. It may have been deleted." [Close]
  - **Recovery**: Close panel, remove file from semantic matches list
  - **Test Data**: Mock file_id that returns 404 from GET `/files/:id`

**Success Criteria** (from SC-006, SC-017):
- ✅ 30% of branches reference files from sibling branches (validates cross-branch discovery works)
- ✅ Semantic search returns results in <1s for 1000 entities
- ✅ 85% of semantic matches rated as relevant (measured via dismiss button usage - if <15% dismissed, meets target)
- ✅ Provenance navigation works (clicking "Go to source" navigates correctly)

**Interaction Patterns Used**:
- Context Management Pattern (see Interaction Patterns section)

---

#### Primary Flow 4: Consolidate from Multiple Branches

**User Story**: US-4 (Consolidate from Exploration Tree)

**Acceptance Criteria**: AC-004 (User generates comprehensive document from all child branches)

**Steps**:

1. **User returns to Main branch and clicks "Consolidate" button**

   - **Component**: `BranchActions` → "Consolidate" button (only visible in Main branch or branches with children) (see Component Library)
   - **Interaction**: Click
   - **What Happens**: Confirmation modal opens showing branch tree preview (Main → RAG Deep Dive → Fine-tuning → Prompting), checkbox to select which branches to consolidate, input for consolidated file name
   - **Data Required**: `{ currentBranch: Thread, childBranches: Thread[] }`
   - **Callback**: `onConsolidate()` - Opens consolidation modal
   - **Visual Feedback**: Modal with tree diagram, checkboxes pre-checked for all children, file name input pre-filled with "consolidated-analysis.md"

2. **User reviews branch selection and confirms**

   - **Component**: `ConsolidateModal` (see Component Library)
   - **Interaction**: Review checkboxes, click "Consolidate" button
   - **What Happens**: Button shows spinner, POST `/threads/:id/consolidate` with selected branch IDs, modal shows progress: "Traversing tree → Gathering artifacts (0/3 branches) → Consolidating → Generating document"
   - **Data Required**: `{ branchIds: string[], fileName: string, isLoading: boolean, progress: { step: string, current: number, total: number } }`
   - **Callback**: `onConfirmConsolidate(branchIds: string[], fileName: string)` - API call
   - **Visual Feedback**: Progress bar shows steps, status text updates ("Gathering artifacts (1/3 branches)"), button disabled during processing

3. **System traverses tree and gathers artifacts**

   - **Trigger**: POST `/threads/:id/consolidate` backend processing
   - **What Happens**: Tree traversal (recursive CTE), access all files created in child branches (via created_in_conversation_id), load thread summaries from each branch, build context with multi-branch provenance
   - **Component Updated**: `ConsolidateModal` → progress updates via SSE events (see Component Library)
   - **Data Flow**: Traverse tree → Load files from child branches → Load summaries → Build prime context → Send to agent

4. **Agent generates consolidated document with citations**

   - **Trigger**: Context assembled, sent to Claude 3.5 Sonnet
   - **What Happens**: Agent generates document with: Section headers from different topics, Provenance citations in content (e.g., "RAG approach [from RAG Deep Dive branch]"), Consolidated recommendations with conflict resolution (e.g., "Using PostgreSQL [from Database Selection, most recent]")
   - **Component Updated**: `ConsolidateModal` → progress shows "Generating document (streaming...)" (see Component Library)
   - **Data Flow**: Agent streams response → Modal shows preview (first 20 lines) → Complete document prepared for approval

5. **System shows approval prompt with consolidated document preview**

   - **Trigger**: Agent completes document generation
   - **What Happens**: Modal updates to show: Full document preview (scrollable), Provenance summary (which branches contributed), File path input (editable), Approve/Reject buttons
   - **Component**: `ConsolidateModal` → approval state (see Component Library)
   - **Data Required**: `{ consolidatedContent: string, sourceProvenanceMap: { [sectionId]: branchId }, fileName: string }`
   - **Callbacks**: `onApproveConsolidation(fileName: string)`, `onRejectConsolidation()`
   - **Visual Feedback**: Preview with syntax highlighting, provenance badges inline in text, approve button prominent (coral)

6. **User approves consolidated document**

   - **Component**: `ConsolidateModal` (see Component Library)
   - **Interaction**: Click "Approve" button
   - **What Happens**: Button shows spinner, file created via `write_file` tool execution, provenance stored with multiple source_conversation_ids array (Main + RAG + Fine-tuning + Prompting), modal closes, success toast appears
   - **Data Required**: `{ fileName: string, content: string, sourceConversationIds: string[] }`
   - **Callback**: `onApproveConsolidation(fileName)` - Creates file with multi-branch provenance
   - **Visual Feedback**: Button spinner → Success toast "Consolidated document created: consolidated-analysis.md" (3s) → Modal closes → File appears in "Artifacts from this thread"

7. **System shows consolidated file in context with multi-branch provenance**

   - **Trigger**: File created via Realtime subscription
   - **What Happens**: File widget appears in context panel "Artifacts from this thread" section with special badge "Consolidated from 3 branches", added to horizontal widget array
   - **Component Updated**: `ContextPanel` → "Artifacts from this thread" section (see Component Library)
   - **Data Flow**: Realtime event (file created) → Valtio state → Add widget to horizontal array with multi-branch provenance badge
   - **Visual Feedback**: New consolidated file widget fades in (200ms), section auto-expands to show artifact, special coral border on widget indicates consolidation

**Error Scenarios**:

- **Child Branch File Deleted Before Consolidation**
  - **Trigger**: File referenced in child branch deleted between traversal and consolidation
  - **Component**: `ConsolidateModal` → warning in document preview (see Component Library)
  - **Display**: Agent includes note in consolidated output: "Note: 2 referenced files unavailable (may have been deleted)"
  - **Recovery**: Consolidation continues without deleted files (FR-035b), user can retry if critical files missing
  - **Test Data**: Mock tree with deleted file references

- **Context Budget Overflow During Consolidation**
  - **Trigger**: Total artifacts from all branches exceed 200K tokens
  - **Component**: `ConsolidateModal` → warning banner before approval (see Component Library)
  - **Display**: "Some artifacts excluded due to size limits. Review excluded items in context panel after approval."
  - **Recovery**: System prioritizes by relevance score, shows excluded items in context panel for manual review
  - **Test Data**: Mock 5 branches with 50K tokens each (250K total)

**Success Criteria** (from SC-007):
- ✅ 20% of users perform consolidation from 2+ branches by Week 8
- ✅ Consolidation from 5 branches completes in <10s (p95 latency)
- ✅ Provenance citations appear in >80% of consolidated documents
- ✅ Users report consolidation saves time vs manual synthesis (survey feedback)

**Interaction Patterns Used**:
- Modal Workflow (see Interaction Patterns section)
- Streaming Response Pattern (see Interaction Patterns section)

---

#### Layout & Spatial Design

**Desktop (1440px+)** - Adaptive 3-Panel Workspace Layout:

**State 1: No file open** (chat expands to fill space):
```
┌──────────────┬───────────────────────────────────────────────────────┐
│ ┌──────────┐ │ [Chat Header: Branch Actions | Settings]             │
│ │ Files    │ ├───────────────────────────────────────────────────────┤
│ │ Threads  │ │ [Message Stream - scrollable]                         │
│ └──────────┘ │ ┌───────────────────────────────────────────────────┐ │
│              │ │ User: How do I implement RAG?           10:23 AM │ │
│ [Files Tab]  │ └───────────────────────────────────────────────────┘ │
│ ┌──────────┐ │ ┌───────────────────────────────────────────────────┐ │
│ │📁 docs   │ │ │ Assistant: Here's how to implement RAG...         │ │
│ │📁 src    │ │ │   [Tool Call Approval - inline]                   │ │
│ │📄 README │ │ └───────────────────────────────────────────────────┘ │
│ └──────────┘ │                                                       │
│              │ ─────────────────────────────────────────────────────│
│ [Threads]    │ [Context Panel - collapsible sections]                │
│ ┌──────────┐ │ ▼ Explicit context (2)                                │
│ │ Main     │ │   [📄][📄] (widgets displayed horizontally)          │
│ │  RAG     │ │ ▼ Semantic matches (3)                                │
│ │  Fine-t  │ │   [📄][📄][📄] +2 more (horizontal widgets)         │
│ └──────────┘ │ ▶ Excluded from context (5 items - collapsed)         │
│              │ ─────────────────────────────────────────────────────│
│              │ [Chat Input: Text area | Send button]                 │
│              │                                                       │
│   (20%)      │                    (80%)                              │
└──────────────┴───────────────────────────────────────────────────────┘
```

**State 2: File open** (file editor appears on right):
```
┌──────────────┬─────────────────────────┬──────────────────────────────┐
│ ┌──────────┐ │ [Chat Header]           │ [File Editor]          [X]  │
│ │ Files    │ ├─────────────────────────┤──────────────────────────────┤
│ │ Threads  │ │ [Message Stream]        │ Provenance Header:           │
│ └──────────┘ │ ┌───────────────────┐   │ Created in: RAG branch      │
│              │ │ User msg 10:23 AM │   │ 2 hours ago                 │
│ [Files Tab]  │ └───────────────────┘   │ [Go to source]              │
│ ┌──────────┐ │ ┌───────────────────┐   │──────────────────────────────│
│ │📁 docs   │ │ │ Assistant msg     │   │                              │
│ │📁 src    │ │ │  [Tool approval]  │   │ # RAG Analysis               │
│ │📄 README │ │ └───────────────────┘   │                              │
│ └──────────┘ │                         │ Best practices for           │
│              │ ─────────────────────── │ implementing RAG:            │
│ [Threads]    │ [Context Panel]         │                              │
│ ┌──────────┐ │ ▼ Explicit (2)          │ 1. Document chunking         │
│ │ Main     │ │   [📄][📄]             │ 2. Embedding strategy        │
│ │  RAG     │ │ ▼ Semantic (3)          │ 3. Retrieval scoring         │
│ │  Fine-t  │ │   [📄][📄][📄]         │                              │
│ └──────────┘ │ ─────────────────────── │ [Markdown editor]            │
│              │ [Chat Input]            │                              │
│              │                         │                              │
│   (20%)      │        (50%)            │           (30%)              │
└──────────────┴─────────────────────────┴──────────────────────────────┘
```

**Panel Behavior**:
- **Left Sidebar (20% fixed)**: Tabs: Files | Threads, defaults to Threads on open, always visible
- **Center Panel (50-80% adaptive)**: Chat interface (messages, context panel, input), ALWAYS VISIBLE, shrinks when file open
- **Right Panel (0-30% adaptive)**: File editor appears when user clicks file, only ONE file at a time, CLOSEABLE with [X] button, chat never closes

**Dimensions**:
- Left sidebar: 20% width (fixed)
- Center panel: 80% (no file open) or 50% (file open)
- Right panel: 0% (hidden) or 30% (file open)
- Header: Full width, 64px height

**Component Spacing**:
- Message gaps: gap-4 (16px) between messages
- Context panel sections: gap-6 (24px) between section headers
- Context widgets: gap-2 (8px) between horizontal widgets within a section
- Input padding: p-6 (24px) on desktop
- Section margins: mb-8 (32px) between major sections

**Mobile (375px)** - Vertical Stack:

**Chat Interface**:
```
┌───────────────────┐
│ [Header]          │
│ ☰ | Threads       │
├───────────────────┤
│ [Messages]        │
│ ┌───────────────┐ │
│ │ User msg      │ │
│ └───────────────┘ │
│ ┌───────────────┐ │
│ │ Assistant msg │ │
│ └───────────────┘ │
├───────────────────┤
│ [Context Panel]   │
│ ▶ Explicit (2)    │
│ ▶ Semantic (3)    │
├───────────────────┤
│ [Input + Send]    │
└───────────────────┘
```

**Dimensions**:
- Header: Full width, 56px height
- Main content: Full width
- Input: Full width, 72px height, sticky at bottom

**Component Spacing**:
- Message gaps: gap-3 (12px) between messages (tighter than desktop)
- Section margins: mb-6 (24px) between sections
- Input padding: p-4 (16px) on mobile

**Responsive Breakpoints**:
- **Mobile** (`< 768px`): Single-column vertical stack, sidebar drawer, file editor full-screen modal, context collapsed, sticky input
- **Tablet** (`768px - 1024px`): 2-panel (sidebar 25% + chat 75%), file editor full-screen modal
- **Desktop** (`> 1024px`): 3-panel adaptive (sidebar 20% + file 0-40% + chat 40-80%), file editor inline panel

**Components Used in Layout**:
- `WorkspaceSidebar`, `FileEditorPanel`, `ChatView` (see Component Library)

---

### Branch Selector (Dropdown Component)

**Purpose**: Navigate between branches in hierarchical tree structure, showing parent-child relationships.

**Route**: N/A (component in chat header)

**Priority**: P1

**Entry Points**: Always visible in chat header (except mobile where it's in hamburger menu)

**Exit Points**: Selecting branch navigates to that thread

#### Primary Flow: Switch Between Branches

**Steps**:

1. **User clicks branch selector dropdown**

   - **Component**: `BranchSelector` (see Component Library)
   - **Interaction**: Click
   - **What Happens**: Dropdown opens showing hierarchical tree with indentation (Main → RAG Deep Dive → RAG Performance), current branch highlighted
   - **Data Required**: `{ currentBranchId: string, branchTree: BranchTreeNode[], isOpen: boolean }`
   - **Callback**: `onToggle()` - Opens/closes dropdown
   - **Visual Feedback**: Dropdown slides down (200ms), backdrop overlay on mobile, current branch has coral left border

2. **User hovers over branch in dropdown**

   - **Component**: `BranchSelector` → tree node item (see Component Library)
   - **Interaction**: Hover
   - **What Happens**: Branch highlights, tooltip shows metadata (created 2h ago, 5 messages, 2 artifacts)
   - **Data Required**: `{ branchTitle: string, createdAt: Date, messageCount: number, artifactCount: number }`
   - **Callback**: None (tooltip is pure UI)
   - **Visual Feedback**: Background changes to light gray, tooltip fades in

3. **User clicks branch to navigate**

   - **Component**: `BranchSelector` → tree node item (see Component Library)
   - **Interaction**: Click
   - **What Happens**: Dropdown closes, URL updates (`/chat/:newBranchId`), thread data loads, message stream updates, context panel updates with new branch context
   - **Data Required**: `{ branchId: string, branchTitle: string }`
   - **Callback**: `onBranchSelect(branchId: string)` - Navigation
   - **Visual Feedback**: Dropdown closes (200ms), loading state shows in message stream, smooth transition

**Error Scenarios**:

- **Branch Deleted in Another Session**
  - **Trigger**: User clicks branch that was deleted by another session (race condition)
  - **Component**: Error toast from navigation handler
  - **Display**: "Branch no longer exists. It may have been deleted." [Dismiss]
  - **Recovery**: Stay on current branch, refresh branch tree dropdown
  - **Test Data**: Mock branch_id that returns 404 from GET `/threads/:id`

**Success Criteria**:
- ✅ Branch selector renders <200ms with 50 branches
- ✅ Hierarchical indentation shows parent-child relationships clearly
- ✅ Current branch visually distinct (highlighted)
- ✅ Navigation completes in <500ms (thread load time)

**Interaction Patterns Used**:
- Dropdown Workflow (see Interaction Patterns section)

---

### File Editor (Panel Component)

**Purpose**: View file content with provenance header showing source conversation context.

**Route**: N/A (right panel in workspace, opens when file clicked, chat remains visible in center)

**Priority**: P2

**Entry Points**:
- Click file in context panel
- Click file in artifacts section
- Click file in sidebar file tree
- Click consolidated file (shows multi-branch provenance)

**Exit Points**:
- Close panel (X button, Escape key)
- "Go to source" link (navigates to source branch)

#### Primary Flow: View File with Provenance

**Steps**:

1. **User clicks file reference in context panel**

   - **Component**: `ContextReference` (clickable) (see Component Library)
   - **Interaction**: Click
   - **What Happens**: File editor panel opens (slides from right on desktop, full-screen on mobile), provenance header at top, markdown content below
   - **Data Required**: `{ fileId: string, isOpen: boolean }`
   - **Callback**: `onFileClick(fileId: string)` - Loads file data, opens panel
   - **Visual Feedback**: Panel transition (300ms slide from right), chat panel shrinks from 80% to 50%, focus moves to close button

2. **System loads file content and provenance**

   - **Trigger**: Panel opened, GET `/files/:id` called
   - **What Happens**: File content loads, provenance metadata loads (created_in_conversation_id, context_summary, last_edited info), markdown rendered in editor
   - **Component Updated**: `FileEditorPanel` → content pane and provenance header (see Component Library)
   - **Data Flow**: API response → Parse markdown → Render with syntax highlighting → Show provenance header

3. **User views provenance header**

   - **Component**: `ProvenanceHeader` in `FileEditorPanel` (see Component Library)
   - **Interaction**: View (no interaction yet)
   - **What Happens**: Header shows: Source branch name (pill), Creation timestamp ("2 hours ago"), Context summary (2-3 sentences about what thread was exploring), Last edit info (if edited: "Last edited by agent in Fine-tuning branch"), "Go to source" link
   - **Data Required**: `{ sourceBranch: { id: string, title: string }, createdAt: Date, contextSummary: string, lastEditedBy?: 'user' | 'agent', editedInConversation?: { id: string, title: string } }`
   - **Visual Feedback**: Header with coral accent, source branch pill clickable (coral background), context summary in muted text

4. **User clicks "Go to source" link**

   - **Component**: `ProvenanceHeader` → "Go to source" link (see Component Library)
   - **Interaction**: Click
   - **What Happens**: Navigate to source branch (`/chat/:sourceBranchId`), scroll to message where file was created, highlight message (2s yellow flash), panel closes
   - **Data Required**: `{ sourceBranchId: string, creationMessageId: string }`
   - **Callback**: `onGoToSource(branchId: string, messageId: string)` - Navigation + scroll + highlight
   - **Visual Feedback**: Panel closes, URL changes, message stream scrolls to creation message, message background flashes yellow (2s fade)

5. **User closes panel**

   - **Component**: `FileEditorPanel` (see Component Library)
   - **Interaction**: Click X button or press Escape
   - **What Happens**: Panel closes (slide out transition to right), chat panel expands from 50% to 80%, focus returns to chat input
   - **Data Required**: None
   - **Callback**: `onClose()` - Closes panel
   - **Visual Feedback**: Panel slides out to right (300ms), chat panel expands smoothly (300ms), focus restored to input

**Error Scenarios**:

- **File Content Load Fails**
  - **Trigger**: GET `/files/:id` returns 500 error or timeout
  - **Component**: `FileEditorPanel` → error state (see Component Library)
  - **Display**: "Failed to load file content. [Retry] [Close]"
  - **Recovery**: "Retry" button re-calls GET `/files/:id`, or user clicks "Close" to dismiss panel
  - **Test Data**: Mock file_id with 500 error response

- **Source Branch Deleted (Provenance Navigation Fails)**
  - **Trigger**: User clicks "Go to source" but source branch deleted
  - **Component**: Error toast from navigation handler
  - **Display**: "Source branch no longer exists. It may have been deleted." [Dismiss]
  - **Recovery**: Stay in file editor panel, disable "Go to source" link
  - **Test Data**: Mock created_in_conversation_id that returns 404

**Success Criteria** (from SC-009, SC-010):
- ✅ 50% of users interact with provenance indicators (click/hover) within first week
- ✅ Provenance navigation ("Go to source") used by 30% of users
- ✅ File editor panel opens in <300ms
- ✅ Markdown rendering completes in <500ms for 10KB file

**Interaction Patterns Used**:
- Panel Slide Pattern (see Interaction Patterns section)

---

## Component Library

### Component Reusability Assessment

**Existing components checked** (from `packages/ui/src/components/`):
- `Button` - ✅ Reused (send button, approve/reject buttons)
- `Input` - ✅ Reused (chat input, branch name input)
- `Card` - ✅ Reused (context sections, file cards)
- `Badge` - ✅ Reused (priority indicators, provenance badges)
- `Modal` - ✅ Extended (create branch modal, consolidate modal)
- `ErrorBanner` - ✅ Reused (error states)
- `Tooltip` - ✅ Reused (provenance tooltips, file metadata)

**New components categorized**:

| Component | Location | Reusability Rationale |
|-----------|----------|----------------------|
| `WorkspaceSidebar` | `features/ai-agent-system/` | Feature-specific screen (3-panel workspace) |
| `FileEditorPanel` | `features/ai-agent-system/` | Feature-specific panel with provenance |
| `ChatView` | `features/ai-agent-system/` | Feature-specific screen composition |
| `BranchSelector` | `features/ai-agent-system/` | Feature-specific hierarchical tree |
| `ContextPanel` | `features/ai-agent-system/` | Feature-specific multi-section layout |
| `MessageStream` | `features/ai-agent-system/` | Feature-specific message rendering |
| `ChatInput` | `features/ai-agent-system/` | Feature-specific with @-mention autocomplete |
| `ToolCallApproval` | `features/ai-agent-system/` | Feature-specific approval flow |
| `CreateBranchModal` | `features/ai-agent-system/` | Feature-specific modal |
| `ConsolidateModal` | `features/ai-agent-system/` | Feature-specific modal with tree preview |

### Component Specifications

#### Screen Components (Feature-Specific)

**`WorkspaceSidebar.tsx`** - Left Sidebar Navigation

**Location**: `packages/ui/src/features/ai-agent-system/WorkspaceSidebar.tsx` (created during design)

**Purpose**: Left sidebar with tabs for switching between file tree view and thread tree view.

**Reusability**: Feature-specific (1 feature)

**Rationale**: Complex navigation component specific to exploration workspace layout.

**Props Interface**:

```typescript
interface WorkspaceSidebarProps {
  // Active tab
  activeTab: 'files' | 'threads';

  // File tree data
  fileTree: FileTreeNode[];

  // Thread tree data
  threadTree: ThreadTreeNode[];
  currentThreadId: string;

  // Callbacks
  onTabChange: (tab: 'files' | 'threads') => void;
  onFileSelect: (filePath: string) => void;
  onThreadSelect: (threadId: string) => void;
  onCreateBranch: () => void;

  // Styling
  className?: string;
}
```

**Example Usage**:

```typescript
<WorkspaceSidebar
  activeTab="threads"
  fileTree={fileTreeData}
  threadTree={threadTreeData}
  currentThreadId="thread-123"
  onTabChange={handleTabChange}
  onFileSelect={handleFileSelect}
  onThreadSelect={handleThreadSelect}
  onCreateBranch={handleCreateBranch}
/>
```

**States to Design**:
- Files tab active (file tree shown)
- Threads tab active (thread tree shown)
- Loading (tree data loading)
- Empty files (no files yet, show "No files" placeholder)
- Empty threads (only Main thread exists)

**Composed From**:
- `Button` (tab buttons, create branch button)
- `Badge` (provenance badges on files)

**Component UI State** (local, ephemeral):
- `activeTab`: 'files' | 'threads' - Which tab is currently visible
- `expandedFolders`: string[] - Which folders are expanded in file tree
- `expandedThreads`: string[] - Which threads are expanded in thread tree

**Why Component State**: Tab selection and tree expansion are per-session UI preferences, not persisted.

**NOT component state** (defined in arch.md):
- File tree data → Global state (Valtio, from filesystem)
- Thread tree data → Global state (Valtio, from database)
- Current thread ID → Global state (Valtio, from URL)

**Interaction Patterns Used**:
- Dropdown Workflow (see Interaction Patterns section - tree expansion)

**Accessibility Requirements**:
- [x] Keyboard navigation (Tab to switch tabs, Arrow keys to navigate trees)
- [x] ARIA labels ("Files tab", "Threads tab", "File tree", "Thread tree")
- [x] Focus management (focus on first item when tab switches)
- [x] Screen reader support (tree structure announced)

---

**`FileEditorPanel.tsx`** - Right Panel File Editor (Closeable)

**Location**: `packages/ui/src/features/ai-agent-system/FileEditorPanel.tsx` (created during design)

**Purpose**: Right panel that appears when file is opened, shows provenance header + file content editor. Chat interface remains visible and accessible in center panel.

**Reusability**: Feature-specific (1 feature)

**Rationale**: Complex panel with provenance-aware file viewing specific to exploration workspace. Positioned on right to keep chat (primary UI) always visible.

**Props Interface**:

```typescript
interface FileEditorPanelProps {
  // File data
  file: {
    fileId: string;
    path: string;
    content: string;
    provenance?: {
      sourceBranch: { id: string; title: string };
      createdAt: Date;
      contextSummary: string;
      lastEditedBy?: 'user' | 'agent';
      editedInConversation?: { id: string; title: string };
    };
  };

  // UI state
  isVisible: boolean; // Panel shown/hidden
  isLoading: boolean;

  // Callbacks
  onClose: () => void;
  onGoToSource: (branchId: string, messageId: string) => void;
  onContentChange?: (content: string) => void; // Optional editing

  // Styling
  className?: string;
}
```

**Example Usage**:

```typescript
<FileEditorPanel
  file={fileData}
  isVisible={isFileOpen}
  isLoading={false}
  onClose={handleCloseFile}
  onGoToSource={handleGoToSource}
/>
```

**States to Design**:
- Hidden (isVisible=false, takes 0% width, chat panel at 80% width)
- Visible (isVisible=true, slides in from right, takes 30% width, chat shrinks to 50%)
- Loading (file content loading, skeleton UI)
- Error (file load failed, error message with retry)
- With provenance (agent-created file, show full provenance header)
- Without provenance (manually created file, minimal header with file path only)

**Composed From**:
- `Button` (close button [X], "Go to source" button)
- `Badge` (source branch badge in provenance header)

**Component UI State** (local, ephemeral):
- `scrollPosition`: number - Scroll position in file content (restored if user re-opens same file)

**Why Component State**: Scroll position is UX convenience (restore on re-open), not critical data.

**NOT component state** (defined in arch.md):
- File content → Loaded from API, stored in global state during panel lifetime
- Provenance metadata → Global state (from API)
- Panel visibility (isVisible) → Global state (Valtio, controls panel width animation and chat panel resize)

**Interaction Patterns Used**:
- Panel Slide Pattern (see Interaction Patterns section - adapted for right-side panel)

**Accessibility Requirements**:
- [x] Keyboard navigation (Tab through close button, "Go to source" link, file content)
- [x] ARIA labels ("File editor panel", "Close panel", "Go to source branch")
- [x] Focus management (focus on close button when panel opens, return focus to triggering element when closed)
- [x] Escape key closes panel
- [x] Panel announced to screen readers when opened ("File editor opened: [filename]")

---

**`ChatView.tsx`** - Main Chat Interface

**Location**: `packages/ui/src/features/ai-agent-system/ChatView.tsx` (created during design)

**Purpose**: Main presentational component for chat interface, orchestrates header, messages, context panel, and input.

**Reusability**: Feature-specific (1 feature)

**Rationale**: Complex composition specific to AI agent system, not reusable in other features.

**Props Interface**:

```typescript
interface ChatViewProps {
  // Thread data
  currentThread: {
    threadId: string;
    branchTitle: string;
    parentId?: string;
  };
  messages: Message[];
  streamingMessage?: StreamingMessage;

  // Context data
  primeContext: {
    explicitContext: ContextReference[];
    frequentlyUsed: ContextReference[];
    semanticMatches: ContextReference[];
    branchContext: {
      parentSummary: string;
      inheritedFiles: ContextReference[];
    };
    artifacts: ContextReference[];
    excludedItems: ContextReference[];
  };

  // UI state
  isLoading: boolean;
  isStreaming: boolean;

  // Callbacks
  onSendMessage: (text: string) => void;
  onCreateBranch: () => void;
  onBranchSelect: (branchId: string) => void;
  onFileClick: (fileId: string) => void;
  onAddToExplicit: (itemId: string) => void;
  onRePrime: (itemId: string) => void;
  onDismissMatch: (fileId: string) => void;
  onApproveToolCall: (toolCallId: string) => void;
  onRejectToolCall: (toolCallId: string, reason?: string) => void;

  // Styling
  className?: string;
}
```

**Example Usage**:

```typescript
<ChatView
  currentThread={{ threadId: '123', branchTitle: 'Main' }}
  messages={messages}
  primeContext={contextData}
  isLoading={false}
  isStreaming={true}
  onSendMessage={handleSendMessage}
  onCreateBranch={handleCreateBranch}
  // ... other callbacks
/>
```

**States to Design**:
- Default (messages loaded, input ready)
- Loading (thread data loading)
- Streaming (agent response streaming in progress)
- Empty (no messages yet, welcome state)
- Error (failed to load thread)

**Composed From**:
- `BranchSelector`, `MessageStream`, `ContextPanel`, `ChatInput` (see Component Library)
- `Button`, `Badge`, `Card` (from primitives)

**Component UI State** (local, ephemeral):
- None (all state managed by child components or global state)

**Why Component State**: Pure composition component, no local state needed.

**NOT component state** (defined in arch.md):
- Thread data → Global state (Valtio)
- Messages → Global state (Valtio)
- Prime context → Global state (Valtio)
- Streaming buffer → Global state (Valtio)

**Interaction Patterns Used**:
- Streaming Response Pattern (see Interaction Patterns section)
- Context Management Pattern (see Interaction Patterns section)

**Accessibility Requirements**:
- [x] Keyboard navigation (Tab through messages, input, buttons)
- [x] ARIA labels ("Chat messages", "Message input", "Send message button")
- [x] Focus management (focus on input after send, focus on approval prompt when appears)
- [x] Screen reader announcements (new messages via aria-live)

---

#### Shared Feature Components

**`BranchSelector.tsx`** - Hierarchical Branch Dropdown

**Location**: `packages/ui/src/features/ai-agent-system/BranchSelector.tsx` (created during design)

**Purpose**: Dropdown showing hierarchical branch tree with indentation, allows branch navigation.

**Reusability**: Feature-specific (1 feature)

**Rationale**: Complex tree visualization specific to branching conversation model.

**Props Interface**:

```typescript
interface BranchSelectorProps {
  // Data
  currentBranchId: string;
  branchTree: BranchTreeNode[]; // Recursive structure

  // UI state
  isOpen: boolean;

  // Callbacks
  onToggle: () => void;
  onBranchSelect: (branchId: string) => void;

  // Styling
  className?: string;
}
```

**Example Usage**:

```typescript
<BranchSelector
  currentBranchId="123"
  branchTree={branchTreeData}
  isOpen={isOpen}
  onToggle={handleToggle}
  onBranchSelect={handleBranchSelect}
/>
```

**States to Design**:
- Closed (button shows current branch title)
- Open (dropdown expanded with tree)
- Empty (no branches yet, show "Main" only)
- Loading (fetching branch tree)

**Composed From**:
- `Button` (dropdown trigger)
- `Badge` (metadata badges: message count, artifact count)

**Component UI State** (local, ephemeral):
- `isOpen`: boolean - Whether dropdown is expanded
- `highlightedIndex`: number - Currently highlighted option (for keyboard nav)

**Why Component State**: Dropdown open/closed is transient UI state, no persistence needed. Highlighted index is keyboard nav feedback only.

**NOT component state**:
- Branch tree data → Global state (Valtio)
- Current branch ID → Global state (Valtio)

**Interaction Patterns Used**:
- Dropdown Workflow (see Interaction Patterns section)

**Accessibility Requirements**:
- [x] Keyboard navigation (Arrow keys to navigate tree, Enter to select)
- [x] ARIA labels ("Branch selector", "Current branch", "Select branch")
- [x] Focus management (trap focus in dropdown when open)
- [x] Screen reader support (tree structure announced)

---

**`ContextPanel.tsx`** - Multi-Section Context Display

**Location**: `packages/ui/src/features/ai-agent-system/ContextPanel.tsx` (created during design)

**Purpose**: Show what context AI sees, organized into section-level collapsible sections with horizontal widget layout for each context type.

**Reusability**: Feature-specific (1 feature)

**Rationale**: Complex multi-section layout specific to context assembly feature with custom widget display per context type.

**Props Interface**:

```typescript
interface ContextPanelProps {
  // Context data (each section contains multiple items)
  explicitContext: ContextReference[];
  frequentlyUsed: ContextReference[];
  semanticMatches: ContextReference[];
  branchContext: {
    parentSummary: string;
    inheritedFiles: ContextReference[];
  };
  artifacts: ContextReference[];
  excludedItems: ContextReference[];

  // UI state
  expandedSections: string[]; // Section IDs that are expanded

  // Callbacks
  onToggleSection: (sectionId: string) => void;
  onFileClick: (fileId: string) => void;
  onAddToExplicit: (itemId: string) => void;
  onRePrime: (itemId: string) => void;
  onDismissMatch: (fileId: string) => void;

  // Styling
  className?: string;
}
```

**Example Usage**:

```typescript
<ContextPanel
  explicitContext={explicitFiles}
  frequentlyUsed={frequentFiles}
  semanticMatches={semanticFiles}
  branchContext={{ parentSummary, inheritedFiles }}
  artifacts={artifactFiles}
  excludedItems={excludedFiles}
  expandedSections={['explicit', 'semantic']}
  onToggleSection={handleToggleSection}
  onFileClick={handleFileClick}
  onAddToExplicit={handleAddToExplicit}
  onRePrime={handleRePrime}
  onDismissMatch={handleDismissMatch}
/>
```

**Section Collapse Behavior** (CRITICAL UX PATTERN):

Each section (Explicit context, Semantic matches, Branch context, Artifacts, Excluded) is **collapsible at the SECTION level** - NOT at individual widget level:

**When Section is COLLAPSED** (▶ icon):
- **All widgets in section are collapsed** to compact inline view
- **Context types display horizontally** in a single row (all widgets must fit horizontally)
- **Widget appearance varies by context type** (file icon + filename, document icon + title, thread icon + name)
- **Information visible through custom tooltips** on hover over collapsed widgets
- **Tooltip shows**: Full filename, source branch, creation timestamp, relevance score (for semantic matches)
- **Example collapsed section**:
  ```
  ▶ Explicit context (2)
    [📄 readme.md] [📄 api-guide.md]   (hover shows full metadata)
  ```

**When Section is EXPANDED** (▼ icon):
- **All widgets expand** to show more detailed information
- **Widgets remain horizontal** but take more space (larger cards/pills)
- **Expanded widget shows**: Full filename, file size, creation date, relevance score, action buttons (view, add to explicit, dismiss)
- **If more items than visible**: Show first N items + truncation indicator "**+X more**" button
  - Clicking "+X more" expands to show all items inline
  - Alternative: Show scroll indicator if horizontal scrolling enabled
- **Example expanded section**:
  ```
  ▼ Explicit context (2)
    ┌─────────────────┐ ┌─────────────────┐
    │ 📄 readme.md    │ │ 📄 api-guide.md │
    │ 2.5 KB          │ │ 8.1 KB          │
    │ Created 2h ago  │ │ Created 5h ago  │
    │ [View] [Remove] │ │ [View] [Remove] │
    └─────────────────┘ └─────────────────┘
  ```

**Widget Types by Context Type**:
- **Files** (Explicit, Artifacts): File icon, filename, file size, creation date, [View] [Remove] buttons
- **Threads** (Branch context): Thread icon, thread title, message count, [View] button
- **Semantic Matches**: File icon, filename, relevance score badge, source branch pill, [View] [Add to Explicit] [Dismiss] buttons
- **Excluded Items**: Grayed out file icon, filename, reason (token limit), [Re-prime] button

**States to Design**:
- Section collapsed (▶ icon, horizontal compact widgets, tooltips on hover)
- Section expanded (▼ icon, horizontal detailed widgets, action buttons visible)
- Section with truncation ("+5 more" indicator when expanded but not all items fit)
- Section empty (show "No items" placeholder)
- Loading (context assembly in progress, skeleton widgets)
- Error (context assembly failed, error message)
- Budget exceeded (warning banner shown above sections)

**Composed From**:
- `Card` (section containers and expanded widgets)
- `Badge` (priority tier indicators, relevance scores)
- `Button` (expand/collapse section header, widget action buttons)
- `Tooltip` (custom tooltips on collapsed widgets)

**Component UI State** (local, ephemeral):
- `expandedSections`: string[] - Which sections are expanded (e.g., ['explicit', 'semantic'])
- `showAllItems`: { [sectionId: string]: boolean } - Whether "+X more" has been clicked to show all items

**Why Component State**: Section expansion and "show all" state are user preferences per session, not persisted across sessions.

**NOT component state**:
- Context items → Global state (Valtio, from prime context assembly)
- Priority tiers → Backend calculation, reflected in global state

**Interaction Patterns Used**:
- Context Management Pattern (see Interaction Patterns section)

**Accessibility Requirements**:
- [x] Keyboard navigation (Tab through sections, Enter to expand/collapse, Arrow keys to navigate widgets)
- [x] ARIA labels ("Context panel", "Explicit context section collapsed/expanded", "Expand section")
- [x] Focus management (focus on newly expanded section's first widget)
- [x] Screen reader support (section states announced, widget count announced)
- [x] Tooltip keyboard access (tooltips appear on focus, not just hover)

---

**`MessageStream.tsx`** - Message History with Streaming

**Location**: `packages/ui/src/features/ai-agent-system/MessageStream.tsx` (created during design)

**Purpose**: Render message history and streaming messages with tool call approvals inline.

**Reusability**: Feature-specific (1 feature)

**Rationale**: Complex message rendering with inline tool approvals specific to agent system.

**Props Interface**:

```typescript
interface MessageStreamProps {
  // Data
  messages: Message[];
  streamingMessage?: StreamingMessage;

  // UI state
  highlightedMessageId?: string; // For "Go to source" navigation

  // Callbacks
  onApproveToolCall: (toolCallId: string) => void;
  onRejectToolCall: (toolCallId: string, reason?: string) => void;

  // Styling
  className?: string;
}
```

**Example Usage**:

```typescript
<MessageStream
  messages={messages}
  streamingMessage={streamingData}
  highlightedMessageId="msg-123"
  onApproveToolCall={handleApprove}
  onRejectToolCall={handleReject}
/>
```

**States to Design**:
- Default (messages rendered, scrollable)
- Streaming (incremental chunks appearing)
- Empty (no messages, welcome state)
- Loading (message history loading)
- Highlighted (message with yellow flash for "Go to source")

**Composed From**:
- `ToolCallApproval` (inline approval prompts)
- `Card` (message containers)

**Component UI State** (local, ephemeral):
- `scrolledToBottom`: boolean - Whether user is at bottom of message stream (for auto-scroll behavior)

**Why Component State**: Scroll position tracking for UX (don't auto-scroll if user scrolled up to read history).

**NOT component state**:
- Messages → Global state (Valtio)
- Streaming buffer → Global state (Valtio)

**Interaction Patterns Used**:
- Streaming Response Pattern (see Interaction Patterns section)
- Approval Workflow (see Interaction Patterns section)

**Accessibility Requirements**:
- [x] Keyboard navigation (messages are focusable for screen readers)
- [x] ARIA labels ("Message from user", "Message from assistant", "Tool approval required")
- [x] Focus management (scroll to new message, focus on approval prompt when appears)
- [x] Screen reader announcements (new messages via aria-live)

---

**`ChatInput.tsx`** - Text Input with Autocomplete

**Location**: `packages/ui/src/features/ai-agent-system/ChatInput.tsx` (created during design)

**Purpose**: Text input with send button, character counter, @-mention autocomplete.

**Reusability**: Feature-specific (could be generalized but has @-mention autocomplete specific to this feature)

**Rationale**: Complex autocomplete for files and threads specific to agent system.

**Props Interface**:

```typescript
interface ChatInputProps {
  // Data
  messageText: string;
  characterLimit: number;
  autocompleteOptions?: AutocompleteOption[]; // Files and threads for @-mention

  // UI state
  isLoading: boolean; // Disable during message send
  showAutocomplete: boolean;

  // Callbacks
  onChange: (text: string) => void;
  onSendMessage: (text: string) => void;
  onAutocompleteSelect: (option: AutocompleteOption) => void;

  // Styling
  className?: string;
}
```

**Example Usage**:

```typescript
<ChatInput
  messageText={text}
  characterLimit={5000}
  autocompleteOptions={autocompleteOptions}
  isLoading={isLoading}
  showAutocomplete={showAutocomplete}
  onChange={handleChange}
  onSendMessage={handleSendMessage}
  onAutocompleteSelect={handleAutocompleteSelect}
/>
```

**States to Design**:
- Default (empty input, send button disabled)
- Typing (text entered, send button enabled)
- Loading (message sending, input disabled)
- Autocomplete (dropdown showing @-mention options)
- Error (message send failed, show retry)

**Composed From**:
- `Input` (text area)
- `Button` (send button)

**Component UI State** (local, ephemeral):
- `inputValue`: string - Current text in input field
- `characterCount`: number - Length of inputValue for display
- `showAutocomplete`: boolean - Whether @-mention dropdown is visible
- `autocompleteQuery`: string - Query for filtering autocomplete options

**Why Component State**: UI-only state, not persisted, no other component needs this data. Input value is local until user sends message (then moves to global state).

**NOT component state** (defined in arch.md):
- Messages array → Global state (Valtio)
- Thread data → Global state (Valtio)
- Streaming buffer → Global state (Valtio)

**Interaction Patterns Used**:
- Dropdown Workflow (see Interaction Patterns section - autocomplete)

**Accessibility Requirements**:
- [x] Keyboard navigation (Tab to send button, Enter to send)
- [x] ARIA labels ("Message input", "Send message button", "Character count")
- [x] Focus management (focus on input after send, restore focus after autocomplete select)
- [x] Screen reader announcements (character limit warning, autocomplete results)

---

**`ToolCallApproval.tsx`** - Inline Approval Prompt

**Location**: `packages/ui/src/features/ai-agent-system/ToolCallApproval.tsx` (created during design)

**Purpose**: Inline approval prompt during agent streaming, shows tool details and preview.

**Reusability**: Feature-specific (1 feature)

**Rationale**: Complex approval flow specific to agent tool calls.

**Props Interface**:

```typescript
interface ToolCallApprovalProps {
  // Data
  toolCall: {
    toolCallId: string;
    toolName: string; // 'write_file', 'create_branch', etc.
    toolInput: {
      path?: string;
      content?: string;
      title?: string;
      // ... other tool-specific fields
    };
    previewContent?: string; // First 10 lines of file content
  };

  // UI state
  isLoading: boolean;
  isExpanded: boolean; // Preview expanded to full content

  // Callbacks
  onApprove: (toolCallId: string) => void;
  onReject: (toolCallId: string, reason?: string) => void;
  onExpandPreview: () => void;

  // Styling
  className?: string;
}
```

**Example Usage**:

```typescript
<ToolCallApproval
  toolCall={toolCallData}
  isLoading={false}
  isExpanded={false}
  onApprove={handleApprove}
  onReject={handleReject}
  onExpandPreview={handleExpandPreview}
/>
```

**States to Design**:
- Default (preview collapsed, buttons enabled)
- Loading (approval processing, buttons disabled)
- Expanded (full content preview shown)
- Rejected (rejection reason input shown)
- Timeout warning (countdown shown, 10 minutes remaining)

**Composed From**:
- `Button` (approve, reject, expand preview)
- `Input` (rejection reason textarea)

**Component UI State** (local, ephemeral):
- `isExpanded`: boolean - Whether preview is expanded to show full content
- `rejectionReason`: string - Text input for rejection reason (if user rejects)

**Why Component State**: Preview expansion is transient UI. Rejection reason is temporary until submitted (then sent to backend).

**NOT component state**:
- Tool call data → Passed as props from streaming buffer (global state)
- Approval status → Tracked in backend, reflected in global state

**Interaction Patterns Used**:
- Approval Workflow (see Interaction Patterns section)

**Accessibility Requirements**:
- [x] Keyboard navigation (Tab to approve/reject buttons, Enter to confirm)
- [x] ARIA labels ("Tool approval required", "Approve file creation", "Reject tool call")
- [x] Focus management (focus on approve button when prompt appears)
- [x] Screen reader announcements (approval status updates)

---

**`CreateBranchModal.tsx`** - Branch Creation Modal

**Location**: `packages/ui/src/features/ai-agent-system/CreateBranchModal.tsx` (created during design)

**Purpose**: Modal for creating new branch with name input and confirmation.

**Reusability**: Feature-specific (1 feature)

**Rationale**: Specific to branching workflow, includes branch-specific validation.

**Props Interface**:

```typescript
interface CreateBranchModalProps {
  // UI state
  isOpen: boolean;
  isLoading: boolean;

  // Data
  parentBranchTitle: string;

  // Callbacks
  onClose: () => void;
  onConfirm: (branchName: string) => void;

  // Styling
  className?: string;
}
```

**Example Usage**:

```typescript
<CreateBranchModal
  isOpen={isModalOpen}
  isLoading={isCreating}
  parentBranchTitle="Main"
  onClose={handleCloseModal}
  onConfirm={handleCreateBranch}
/>
```

**States to Design**:
- Default (input empty, create button disabled)
- Typing (name entered, create button enabled)
- Loading (creating branch, showing spinner)
- Error (validation or network error shown)

**Composed From**:
- `Modal` (base modal component)
- `Input` (branch name input)
- `Button` (create, cancel)

**Component UI State** (local, ephemeral):
- `branchName`: string - Input value
- `validationError`: string | null - Validation error message

**Why Component State**: Temporary input value until modal confirms/cancels.

**NOT component state**:
- Branch tree data → Global state (Valtio)

**Interaction Patterns Used**:
- Modal Workflow (see Interaction Patterns section)

**Accessibility Requirements**:
- [x] Keyboard navigation (Tab between input and buttons, Enter to submit)
- [x] ARIA labels ("Create branch modal", "Branch name input")
- [x] Focus management (focus on input when modal opens, return to trigger on close)
- [x] Escape key closes modal

---

**`ConsolidateModal.tsx`** - Consolidation Preview Modal

**Location**: `packages/ui/src/features/ai-agent-system/ConsolidateModal.tsx` (created during design)

**Purpose**: Modal showing branch tree preview, consolidation progress, and document approval.

**Reusability**: Feature-specific (1 feature)

**Rationale**: Complex consolidation workflow specific to multi-branch exploration.

**Props Interface**:

```typescript
interface ConsolidateModalProps {
  // UI state
  isOpen: boolean;
  isLoading: boolean;
  progress?: {
    step: string;
    current: number;
    total: number;
  };

  // Data
  childBranches: BranchTreeNode[];
  consolidatedContent?: string;
  sourceProvenanceMap?: { [sectionId: string]: string };

  // Callbacks
  onClose: () => void;
  onConfirm: (branchIds: string[], fileName: string) => void;
  onApprove: (fileName: string) => void;
  onReject: () => void;

  // Styling
  className?: string;
}
```

**Example Usage**:

```typescript
<ConsolidateModal
  isOpen={isModalOpen}
  isLoading={isConsolidating}
  progress={{ step: 'Gathering artifacts', current: 2, total: 5 }}
  childBranches={childBranchData}
  onClose={handleCloseModal}
  onConfirm={handleStartConsolidation}
  onApprove={handleApproveDocument}
  onReject={handleRejectDocument}
/>
```

**States to Design**:
- Selection (branch tree with checkboxes, file name input)
- Progress (progress bar, status updates)
- Preview (consolidated document preview, approve/reject)
- Loading (processing, buttons disabled)
- Error (consolidation failed)

**Composed From**:
- `Modal` (base modal component)
- `Button` (consolidate, approve, reject, cancel)
- `Input` (file name input)
- `Badge` (provenance badges in preview)

**Component UI State** (local, ephemeral):
- `selectedBranches`: string[] - Checked branch IDs
- `fileName`: string - Output file name

**Why Component State**: Temporary selections until modal confirms.

**NOT component state**:
- Branch tree data → Global state (Valtio)
- Consolidation result → Global state (Valtio)

**Interaction Patterns Used**:
- Modal Workflow (see Interaction Patterns section)
- Streaming Response Pattern (see Interaction Patterns section - preview generation)

**Accessibility Requirements**:
- [x] Keyboard navigation (Tab through tree, checkboxes, buttons)
- [x] ARIA labels ("Consolidate modal", "Select branches", "File name input")
- [x] Focus management (focus on tree when modal opens)
- [x] Escape key closes modal

---

### Primitives Used (from @centrid/ui/components)

- `Button` (variants: default, secondary, ghost)
- `Input` (with validation states)
- `Card` (for containers)
- `Badge` (for status indicators)
- `Modal` (for modals)
- `Tooltip` (for provenance tooltips)
- `ErrorBanner` (for error states)

---

## Interaction Patterns

### Modal Workflow

**Where Used**: Create branch modal, consolidate modal, file editor modal

**Behavior**:

1. User clicks trigger button/link (file reference, "Create Branch" button)
2. Modal opens with backdrop overlay (desktop: slide from right/top, mobile: full-screen)
3. Focus trapped inside modal (Tab cycles between modal elements only)
4. User interacts with modal content (view file, enter branch name, review consolidation)
5. User dismisses via Escape key, backdrop click, Cancel button, or Submit button
6. Modal closes (reverse animation), focus returns to trigger element

**Components Involved**:
- `CreateBranchModal` - Branch creation form
- `ConsolidateModal` - Consolidation preview and approval
- `Modal` base component (from `packages/ui/src/components/Modal.tsx`) - Shared modal primitives

**State Changes**:
- **Before**: Modal hidden (`isOpen: false`), trigger visible
- **During**: Modal visible (`isOpen: true`), backdrop blocks background interaction, focus inside modal
- **After**: Modal hidden, focus restored to trigger element

**Keyboard Shortcuts**:
- `Escape` - Close modal without saving
- `Enter` - Submit form (if single input field like branch name)
- `Tab` - Navigate between focusable elements (trapped in modal)
- `Shift+Tab` - Navigate backwards

---

### Dropdown Workflow

**Where Used**: Branch selector dropdown, @-mention autocomplete dropdown

**Behavior**:

1. User clicks dropdown trigger (branch selector button, types "@" in input)
2. Dropdown opens below trigger with smooth slide-down animation (200ms)
3. User navigates options via mouse hover or keyboard arrow keys
4. User selects option via click or Enter key
5. Dropdown closes immediately, selected action executes

**Components Involved**:
- `BranchSelector` - Branch navigation dropdown
- `ChatInput` → autocomplete dropdown - File/thread @-mention

**State Changes**:
- **Before**: Dropdown hidden, trigger shows current selection
- **During**: Dropdown open, options highlighted on hover/keyboard nav
- **After**: Dropdown hidden, selection applied (navigation or @-mention inserted)

**Keyboard Shortcuts**:
- `ArrowDown` - Next option
- `ArrowUp` - Previous option
- `Enter` - Select highlighted option
- `Escape` - Close dropdown without selection

---

### Streaming Response Pattern

**Where Used**: Agent message streaming in chat interface, consolidation document generation

**Behavior**:

1. User sends message, loading indicator appears
2. SSE connection opens, "Building context..." status shows
3. Agent response starts streaming (text chunks appear incrementally)
4. Mixed content: text → tool call approval → text → tool call → text
5. Stream pauses at tool approval prompts, waits for user action
6. Stream resumes after approval/rejection
7. Stream completes, SSE connection closes, input re-enables

**Components Involved**:
- `ChatInput` - Disabled during streaming
- `MessageStream` - Renders incremental chunks
- `ToolCallApproval` - Inline approval prompts
- `ContextPanel` - Updates when context ready

**State Changes**:
- **Before**: Input enabled, no streaming
- **During**: Input disabled, `streamingMessage` buffer updates, tool approvals pause stream
- **After**: Input re-enabled, streaming buffer moved to final message

**Visual Feedback**:
- Loading indicator ("Agent is thinking...")
- Text chunks fade in as they arrive (100ms fade)
- Tool approval prompts slide in (200ms)
- Stream pause status ("Waiting for approval...")

---

### Context Management Pattern

**Where Used**: Context panel sections (add to explicit, re-prime, dismiss, section collapse/expand)

**Behavior**:

1. **Section Collapse/Expand**: User clicks section header to toggle between collapsed (horizontal compact widgets with tooltips) and expanded (horizontal detailed widgets with action buttons)
2. **Widget Interaction**: User hovers over widget (reveals tooltip if collapsed, reveals actions if expanded) or clicks action button
3. **Widget Movement**: Widget moves between sections (semantic → explicit, excluded → explicit)
4. **Priority Update**: Priority tier updates (visual indicator changes color/border)
5. **Context Refresh**: Next agent request includes updated context with new priorities

**Components Involved**:
- `ContextPanel` - Main container with section-level collapse state
- `ContextReference` - Individual widgets with horizontal layout and custom tooltips
- Backend context assembly service (recalculates priorities)

**State Changes**:
- **Section Collapsed**: Widgets show as compact pills with icon + filename, info via tooltip on hover
- **Section Expanded**: Widgets show as detailed cards with metadata and action buttons
- **Widget Movement**: Widget animates vertically from source section to target section (500ms), target section auto-expands

**Visual Feedback**:
- Section collapse/expand animation (200ms height transition)
- Horizontal widget layout in both collapsed and expanded states (never vertical)
- Smooth slide animation when widget moves between sections (500ms)
- Priority badge updates (color changes: blue → coral for explicit)
- "+X more" truncation indicator when expanded section has >5 widgets
- Custom tooltips on collapsed widgets (fade in 200ms)
- Target section auto-expands when widget moves into it

---

### Panel Slide Pattern

**Where Used**: File editor panel (right panel in 3-panel workspace)

**Behavior**:

1. User clicks file reference or file in tree
2. Right panel slides in from right (300ms animation)
3. Chat panel shrinks from 80% to 50% width (smooth transition)
4. File content and provenance header render
5. User can close panel via X button or Escape key
6. Panel slides out to right (300ms), chat panel expands back to 80%

**Components Involved**:
- `FileEditorPanel` - Sliding panel with provenance (right side)
- `ChatView` - Shrinks/expands responsively (remains visible in center)

**State Changes**:
- **Before**: Panel hidden (0% width), chat at 80%
- **During**: Panel slides in from right to 30%, chat shrinks to 50%
- **After**: Panel visible at 30%, chat at 50%
- **On close**: Panel slides out to 0% (right), chat expands to 80%

**Visual Feedback**:
- Smooth width transitions (300ms cubic-bezier easing)
- Provenance header fades in with panel
- Focus moves to close button when panel opens
- Chat remains interactive during file viewing (no backdrop overlay)

---

### Approval Workflow

**Where Used**: Tool call approvals (file creation, branch creation)

**Behavior**:

1. Agent requests tool approval during streaming
2. Stream pauses, approval prompt appears inline in message
3. User reviews preview (file content, branch details)
4. User clicks Approve or Reject
5. If Reject: Optional reason input shown
6. Approval/rejection sent to backend
7. Stream resumes with agent's response to approval status

**Components Involved**:
- `ToolCallApproval` - Inline approval prompt
- `MessageStream` - Hosts approval prompts

**State Changes**:
- **Before**: Streaming active
- **During**: Stream paused, approval prompt visible, buttons enabled
- **After Approve**: Stream resumes, tool executes, result shown
- **After Reject**: Stream resumes, agent revises plan

**Visual Feedback**:
- Approval prompt slides in (200ms)
- Buttons show loading state during processing
- Prompt collapses after approval/rejection (500ms)
- Stream continuation indicator

---

## Design Handoff Checklist

### Completeness Check

- [x] All screens from arch.md have detailed flows (3-panel workspace with 4 primary flows)
- [x] All P1/P2/P3 user stories from spec.md covered (US-1 branching, US-2 provenance, US-3 cross-branch discovery, US-4 consolidation)
- [x] All acceptance criteria from spec.md mapped to flows (AC-001 to AC-004 covered)
- [x] All components have prop specifications (10 components: WorkspaceSidebar, FileEditorPanel, ChatView, BranchSelector, ContextPanel, MessageStream, ChatInput, ToolCallApproval, CreateBranchModal, ConsolidateModal)
- [x] All error scenarios documented with test data (network errors, validation, timeouts, context overflow, file deletion race conditions)
- [x] Each screen has layout diagrams (desktop 3-panel adaptive + mobile vertical stack, inline with screens)
- [x] Interaction patterns documented (5 patterns: modal, dropdown, streaming, context management, panel slide, approval - separate section, referenced from screens/components)
- [x] Each component has UI state specified (inline with components, not global/URL state)
- [x] Interaction patterns referenced from screens and components where used

### Component Architecture Check

- [x] Component hierarchy matches arch.md (ChatView → Header, MessageStream, ContextPanel, ChatInput)
- [x] Props follow data-in/callbacks-out pattern (all components use this pattern)
- [x] No business logic in presentational component specs (only UI concerns specified)
- [x] Component locations specified (all in `packages/ui/src/features/ai-agent-system/`)
- [x] Reusability assessment complete (all marked feature-specific due to complexity)

### Flow Verification

- [x] Each flow maps to acceptance criteria from spec.md (AC-001, AC-002, AC-003, AC-004 covered)
- [x] Error scenarios have recovery paths (retry buttons, fallback states, graceful degradation)
- [x] Success criteria defined for each flow (from SC-001, SC-006, SC-007, SC-009, SC-015)
- [x] Navigation paths complete (entry + exit points documented for each screen)
- [x] Keyboard navigation specified for all interactive patterns

### Design System Alignment

- [x] Uses existing components where possible (Modal, ErrorBanner, Button, Input, Card, Badge, Tooltip from `packages/ui/src/components/`)
- [x] New components justified (complex AI agent system features, not duplicating existing)
- [x] Spacing uses design system tokens (gap-4, p-6, mb-8 using 8px grid)
- [x] Interaction patterns align with existing (modal workflow, dropdown workflow familiar)

---

## Notes

**Open Questions**: None - all UX decisions resolved during flow creation.

**Assumptions**:
- Users understand branching metaphor (tree structure with parent-child relationships)
- Users comfortable with @-mention syntax for file/thread references
- Provenance transparency builds trust (not overwhelming with metadata)
- Context panel positioned below messages (not above) for optimal UX during composition

**Deferred**:
- Visual Tree View (Phase 3, desktop only) - complex graph visualization
- Advanced semantic filtering (Phase 2+ - relevance tuning UI)
- Collaborative editing (Phase 4+ - multi-user real-time editing)

**Design System Gaps**: None - existing primitives (Modal, Button, Input, Card, ErrorBanner, Badge, Tooltip) sufficient for feature needs.

---

## Component Flow Through Workflow

### 1. UX Phase (Current - `/speckit.ux`) ✅

**Deliverables**:
- Component prop specifications complete (10 components with TypeScript interfaces)
- Component reusability assessment done (all feature-specific due to complexity)
- Component placement decisions documented (all in `packages/ui/src/features/ai-agent-system/`)

**NOT created**: No actual component files yet, only specifications

### 2. Design Phase (`/speckit.design`) - Next Step

**Presentational Components to Create**:

- **Feature-specific** (all in `packages/ui/src/features/ai-agent-system/`):
  - `WorkspaceSidebar.tsx` - Left sidebar with Files/Threads tabs
  - `FileEditorPanel.tsx` - Center panel with provenance header + file editor
  - `ChatView.tsx` - Right panel chat interface composition
  - `BranchSelector.tsx` - Hierarchical branch dropdown (in chat header)
  - `ContextPanel.tsx` - Multi-section context display (in chat panel)
  - `MessageStream.tsx` - Message history with streaming (in chat panel)
  - `ChatInput.tsx` - Input with @-mention autocomplete (in chat panel)
  - `ToolCallApproval.tsx` - Inline approval prompt (in message stream)
  - `CreateBranchModal.tsx` - Branch creation modal
  - `ConsolidateModal.tsx` - Consolidation preview modal
  - All exported from `packages/ui/src/features/ai-agent-system/index.ts`

**Mock Containers to Create** (for visual showcase only):
- **Location**: `apps/design-system/components/ai-agent-system/`
- **Purpose**: Wrap presentational components with hardcoded sample data for design iteration
- **NOT used in production**: These are ONLY for the design-system app

### 3. Implementation Phase (`/speckit.tasks` → `/speckit.implement`) - Final Step

**Production Containers to Create**:
- **Location**: `apps/web/src/components/ai-agent-system/`
- **Pattern**: Import presentational components from `packages/ui/features/ai-agent-system`, add business logic
- **Example**:
  ```typescript
  import { ChatView } from '@centrid/ui/features/ai-agent-system';
  import { useChatState } from '@/hooks/useChatState';

  export function ChatController() {
    const { thread, messages, primeContext, isLoading, isStreaming, handleSendMessage, ... } = useChatState();

    return (
      <ChatView
        currentThread={thread}
        messages={messages}
        primeContext={primeContext}
        isLoading={isLoading}
        isStreaming={isStreaming}
        onSendMessage={handleSendMessage}
        // ... other callbacks
      />
    );
  }
  ```

**CRITICAL**: Implementation tasks should **IMPORT** presentational components, **NOT rebuild them**.

---

**UX Specification Complete**: 2025-10-26 (Updated with new template structure)
**Layout**: Adaptive 3-panel workspace - Left sidebar (Files/Threads tabs) + Center panel (File editor) + Right panel (Chat)
**Components**: 10 presentational components specified (WorkspaceSidebar, FileEditorPanel, ChatView, BranchSelector, ContextPanel, MessageStream, ChatInput, ToolCallApproval, CreateBranchModal, ConsolidateModal)
**Ready for Design Phase**: Yes - All flows, components, interactions, and layouts documented
**Next Command**: `/speckit.design` to create pixel-perfect visual designs using these UX flows
