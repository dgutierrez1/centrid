Test Cases:

1. Manual Branch Creation - Given user in thread about "AI Agent
   Architecture", when they click "Create Branch" and name it "RAG Deep
   Dive", then system creates branch with parent context inherited and
   displays hierarchical relationship in branch selector
2. Agent-Initiated Branch Creation - Given user exploring "RAG vs
   Fine-tuning", when agent detects topic divergence and suggests branch
   creation, then user can approve/reject and system creates branch with
   inherited context
3. Branch Switching - Given user has 3 branches (Main → RAG, Main →
   Orchestration), when switching between branches, then each branch
   maintains separate thread history while sharing explicit files from
   parent
4. Context Isolation - Given user in Branch A, when asking about
   concept from Branch B, then system does NOT automatically access Branch
   B context (semantic search may find files)
5. Agent Branch Proposal - Given agent identifies opportunity for
   parallel exploration, when proposes branch creation with
   create_branch(title, context_files), then user sees approval prompt
   with proposed branch name and context

User Story 2 - Capture Artifacts with Provenance (Priority: P2)

Test Cases:

1. File Creation Approval - Given user in "RAG Deep Dive" branch asking
   for summary, when agent proposes file creation with
   write_file(path="rag-analysis.md", content), then user sees approval
   prompt with file path and preview
2. Provenance Metadata Storage - Given user approves file creation,
   when file is created, then system stores provenance metadata
   (created_in_conversation_id, creation_timestamp, context_summary) and
   generates embeddings
3. Cross-Branch Discovery - Given file "rag-analysis.md" created in
   Branch A, when user creates new Branch B from Main, then system can
   surface file via semantic search when relevant
4. Provenance Display - Given user views file "rag-analysis.md" in
   editor, when hovering over provenance indicator, then system shows
   "Created in: RAG Deep Dive branch, 2 hours ago, Context: RAG best
   practices discussion"
5. Auto-Context Inclusion - Given agent creates file in thread, when
   next message is sent, then file is auto-included in explicit context
6. Stream Tool Call Handling - Given agent streams response with
   multiple tool calls, when user rejects first tool call, then stream
   pauses, system sends rejection to agent, agent revises plan

User Story 3 - Cross-Branch Context Discovery (Priority: P3)

Test Cases:

1. Semantic Search Discovery - Given files created in Branch A and
   Branch B, when user asks "compare RAG and orchestration approaches",
   then semantic search surfaces both files as relevant context
2. Sibling Relationship Boost - Given user in Branch B discussing
   orchestration, when system finds file from sibling Branch A with high
   similarity, then system shows file with sibling relationship indicator
   (+0.15 weight boost)
3. Manual Context Addition - Given user manually adds file from Branch
   A to Branch B context, when user sends message, then file appears in
   "Explicit context" section with provenance indicator
4. @-Mention Autocomplete - Given user types "@rag" in message input,
   when autocomplete dropdown appears, then system shows matching files
   across branches with branch indicators
5. Context Prioritization - Given user has 10+ branches with 50+ files,
   when asking ambiguous question, then context assembly applies
   relationship modifiers and temporal decay

User Story 4 - Consolidate from Exploration Tree (Priority: P4)

Test Cases:

1. Multi-Branch Consolidation - Given user explored topic across 3
   branches with artifacts, when returns to Main and requests
   consolidation, then agent traverses tree and proposes consolidated
   document with provenance citations
2. Provenance in Prompts - Given agent consolidating from multiple
   branches, when generating content, then system includes provenance in
   AI prompts so agent can cite sources
3. Provenance Display in Consolidated Files - Given consolidated
   document references insights, when user views document, then provenance
   metadata shows source branches for each section
4. Multiple Source Thread Provenance - Given user approves consolidated
   document, when file is created, then system stores provenance with
   multiple source threads
5. Deep Tree Traversal - Given deeply nested branches, when
   consolidation happens, then agent can traverse full tree depth to
   gather artifacts
6. Consolidation Button Visibility - Given user in thread with child
   branches, when looking at BranchActions component, then "Consolidate
   Branches" button is visible
7. Consolidation Modal Workflow - Given user clicks "Consolidate
   Branches", when modal opens, then user can select branches, see
   artifact counts, and initiate consolidation with progress tracking
8. Real-time Progress Updates - Given consolidation in progress, when
   modal shows status updates, then users see stage progression with
   ability to cancel
9. Consolidation Preview and Approval - Given consolidation completes,
   when modal shows preview, then users can approve/reject, view
   provenance citations, and file appears in filesystem

User Story 5 - Provenance Transparency & Navigation (Priority: P5)

Test Cases:

1. Provenance Modal Display - Given user views file in context
   references, when clicking provenance indicator, then system shows modal
   with source branch name, creation timestamp, context summary, and "Go
   to source" link
2. Source Thread Navigation - Given user clicks "Go to source thread",
   when navigation happens, then system opens source branch at exact
   message where file was created with highlight
3. Semantic Match Provenance Tooltip - Given user in thread viewing
   context panel, when hovering over file in semantic matches, then
   tooltip shows source branch, creation time, relevance score
4. Visual Tree Provenance Graph - Given Visual Tree View enabled, when
   clicking file node in tree, then system highlights threads that
   referenced this file
5. Multi-Branch Edit Provenance - Given file created in Branch A and
   edited in Branch B, when user views provenance, then system shows
   creation info and most recent edit info

User Story 6 - Server-Side Auth Enforcement (Priority: P0)

Test Cases:

1. Protected Route Auth Check - Given user not logged in, when
   accessing /workspace or /workspace/:id, then server returns 307
   redirect to /login?redirect=...
2. API Route Protection - Given user not logged in, when curling
   protected route, then server returns 307 redirect, not HTML
3. Authenticated User Redirect - Given user logged in, when accessing
   /login or /signup, then server redirects to /dashboard
4. Valid Thread Access - Given user logged in, when accessing
   /workspace/:id with valid ID they own, then access granted
5. Unauthorized Thread Access - Given user logged in, when accessing
   another user's thread ID, then server returns 404 Not Found
6. Invalid UUID Handling - Given user logged in, when accessing
   /workspace/invalid-uuid, then server returns 404 immediately

Design User Flows (9 Total)

Based on design.md, there are 9 user flows within the single Workspace
screen:

1. Send Message with Agent Streaming - User types → sends → agent
   streams → tool approval → file created
2. Create Branch (User-Initiated) - User clicks "Create Branch" → modal
   → names branch → system creates with inherited context
3. Cross-Branch File Discovery - User asks about topic → semantic
   search → context panel updates → user clicks file → provenance shown
4. Consolidate from Multiple Branches - User clicks "Consolidate" →
   modal with branch selection → preview → approval → document created
5. Switch Between Branches - User clicks dropdown → hierarchical tree →
   selects branch → navigates
6. Manage Context References - User views sections → expands/collapses
   → hovers for tooltips → takes actions
7. View File with Provenance - User clicks file widget → right panel
   opens → provenance shown → navigation
8. Approve Tool Call - Agent requests tool → stream pauses → approval
   prompt inline → user approves/rejects
9. Navigate Visual Tree - User opens tree view → interactive graph →
   clicks nodes → navigates/highlights provenance (Phase 3)

⏺ Test Case Summary

- Total User Stories: 6 (P1 to P5 + P0 security)
- Total Acceptance Scenarios: 32 scenarios covering all core
  functionality
- Design User Flows: 9 flows within the single Workspace screen
- Priority Coverage: All priorities from P0 (critical security) to P5
  (provenance navigation)

The test cases cover:

- ✅ Branch creation and management
- ✅ File creation with provenance tracking
- ✅ Cross-branch semantic discovery
- ✅ Multi-branch consolidation workflows
- ✅ Provenance transparency and navigation
- ✅ Server-side authentication enforcement
- ✅ UI interactions (9 design flows)
- ✅ Error scenarios and edge cases

These test cases map directly to the functional requirements (FR-001
through FR-075) and success criteria (SC-001 through SC-019) defined in
the specification.
