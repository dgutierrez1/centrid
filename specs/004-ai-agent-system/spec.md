# Feature Specification: AI Agent Execution System

**Feature Branch**: `004-ai-agent-system`
**Created**: 2025-10-23
**Status**: Draft (Updated with Filesystem Architecture)
**Input**: User description: "AI Agent Execution System with Claude Sonnet - filesystem-based collaborative editing with advanced context optimization"

## Clarifications

### Session 2025-10-24

- Q: When AI agent creates content, does it create a "document" in the 003 sense (with embedding chunks) or just a "file"? How do markdown editor features integrate with AI-generated content? → A: Agent-created content follows the same path as user-created content with identical embedding flow. MVP will include `last_edit_by` field to track whether user or agent made the last edit. Agent-generated content is treated identically to user-generated content in the editor.

- Q: How does TipTap editor handle AI-proposed changes? Does diff view work within TipTap or separately? Can user continue editing in TipTap while AI processes changes? → A: No diffs in MVP. Agent changes are applied directly to the editor like normal user edits. Approval prompts specify what the agent wants approval for (edit/create/delete/move/rename). If user edits file being modified by agent, conflict modal appears for user to choose between canceling agent request or discarding user changes.

- Q: If user is typing and AI agent is invoked, does the 3-second timer reset? What happens if user keeps typing continuously? → A: User cannot type and trigger request simultaneously. If user starts typing after request begins, conflict modal appears when request determines involved entities. Modal is blocking and cannot be dismissed until user decides; autosave pauses until decision. User can edit files unrelated to the request. System differentiates read-only vs write access - read-only requests proceed without conflict, write requests trigger modal if user has pending changes.

- Q: Are document chunks and shadow filesystem the same system or two different indexing layers? Do both coexist? Which takes precedence for context retrieval? → A: Same indexing layer. Document chunks should work toward being the shadow filesystem - unified system, not separate layers.

- Q: When user uploads files via 003 interface, how does 004 shadow filesystem sync? Is there a delay before uploaded files appear in AI chat context? → A: Upload succeeds immediately. File tree UI shows "indexing" icon instead of file icon while embedding generation is in progress. File status is bound to UI with real-time updates.

- Q: Are the three-panel layout from 003 and split view from 004 the same layout or different modes? Can user resize panels? Does chat always occupy right 30% or can it be full-screen? → A: Desktop only has three-panel layout. Chat always shows on right 30% panel. None of the panels can be resized. Fixed proportions for MVP.

- Q: When user opens a document in 003 editor, does it automatically become a context pill in 004 chat? Or are these separate selection mechanisms? → A: Chat creation context depends on how chat was created: (1) Chat from file/folder → initial context is that file/folder, (2) Chat from "New chat" with document open → "all filesystem" + currently opened document as pills, (3) Chat from "New chat" with no document open → "all filesystem" only. User can close editor to show empty state. Pills evolve as user adds/removes context.

- Q: If two users view same file in their own chat sessions and AI modifies it for user A, does user B see updates in real-time via 003's filesystem sync? → A: No multi-user file/folder sharing. Same user across different browser sessions or devices receives real-time updates via broadcast. Same user editing from multiple sessions simultaneously triggers conflict resolution flow.

- Q: Are semantic search and full-text search unified into one search interface or separate? Which search is used when user types in search box? → A: Main search defaults to semantic search via embeddings. (Note: Clarify if semantic search already covers full-text search needs or if both are required.)

- Q: Do storage limits from 004 apply to 003's document uploads? What counts toward limit - only indexed files or all files including binaries? → A: 10MB upload limit per file. Free tier: 50MB total, Pro tier: 1GB total, Enterprise: not in MVP. All user data counts toward limit: files, embeddings, indexes, everything. No binary file support.

- Q: Should 003 spec explicitly state text/markdown restriction is for AI agent integration scope? → A: Only MD and text files are supported across the entire system.

- Q: Does snippet context menu exist in 003's TipTap editor? Or only in a separate read-only file viewer? → A: Use same TipTap editor for all editing. If TipTap doesn't support custom right-click options, extend the reusable right-click pattern from file system UI to TipTap.

- Q: If user deletes file manually via 003 UI while it's in a 004 chat context pill, what happens immediately? Does pill update in real-time? → A: Yes, real-time updates. When entity is deleted, all references update (chats, other entities). Database triggers client UI updates when references are updated/deleted.

- Q: Are markdown sanitization (003) and LLM input sanitization (004) the same layer or different? Does AI-generated content also go through markdown sanitizer? → A: Same sanitization. AI-generated content is sanitized identically to user content.

- Q: If user long-presses on file name in mobile tree view vs file content in editor, do different menus appear? Could this be confusing? → A: Long-press on mobile behaves the same as right-click. Same menu appears regardless of location.

- Q: When user first logs in with no files, should they see 003's empty state (create file first) or 004's empty state (start chat)? What's the intended flow? → A: New user: empty state on file tree + document viewer (create/upload), empty state on chat panel (starting chat creates first chat immediately). Returning user with chats: chat list shown on chat panel. When user selects chat, add URL param for chat ID so page reload preserves selected chat.

- Q: Does cost tracking include storage costs from 003's uploaded files? Or only AI-related costs? → A: Track all costs across all entities per user: API costs, AI costs, storage costs, request costs, everything. No running total in MVP, but must be queryable per user in database.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Chat with Filesystem for Context-Aware Answers (Priority: P1)

A user wants to ask questions about their files, notes, documents, or project materials and receive accurate answers that understand the structure, relationships, and content of their filesystem without manually searching or opening multiple files.

**Why this priority**: This is the foundational capability - enabling natural language interaction with the entire filesystem. It's the entry point that proves the value of AI-assisted file exploration and knowledge synthesis.

**Independent Test**: Can be fully tested by creating a project with 10-15 files across multiple folders (meeting notes, research documents, project plans), asking "what are the key decisions from last week's meetings?", and verifying the agent synthesizes information from relevant files with accurate context.

**Acceptance Scenarios**:

1. **Given** user has a project with 20 files across 5 folders (meeting notes, research, drafts), **When** user creates a new chat and asks "what are the main themes in my research notes?", **Then** system searches shadow filesystem, retrieves relevant files (research-1.md, analysis.md, etc.), and provides a synthesized answer with file references within 5 seconds
2. **Given** user is viewing a specific file (notes/project-plan.md), **When** user creates a chat from that file, **Then** chat context is primed with the file content, its folder context, and sibling files, with a "project-plan.md" context pill displayed
3. **Given** user highlights a text snippet in the viewer and right-clicks "Add to chat", **When** snippet is added, **Then** a new context pill appears showing "Snippet from project-plan.md (lines 45-67)" and agent's next response considers that specific snippet
4. **Given** user has multiple context pills (3 files, 1 folder, 2 snippets), **When** user dismisses the "All filesystem" pill, **Then** agent only considers the explicitly selected contexts in subsequent responses

---

### User Story 2 - Collaborative Editing with AI Assistance (Priority: P2)

A user wants the AI agent to make content changes, create new files, or reorganize existing content based on natural language instructions, with the ability to review and approve changes before they're applied.

**Why this priority**: This transforms the agent from read-only assistant to active collaborator, enabling productivity gains through automated content generation and editing. It's the key differentiator from basic chatbots.

**Independent Test**: Can be tested by asking the agent "expand the introduction section with more detail", reviewing the proposed changes with inline diff, approving, and verifying the file is updated correctly.

**Acceptance Scenarios**:

1. **Given** user asks "reorganize the meeting notes to group by topic instead of chronologically", **When** agent proposes changes, **Then** user sees an approval prompt listing affected files (meeting-notes.md) with action summary, and can approve/reject before changes are applied
2. **Given** agent is making edits to a file, **When** changes are approved, **Then** file is updated in real filesystem and user sees a success notification with link to the modified file
3. **Given** user asks "create a new research summary for the climate change topic", **When** agent proposes file creation, **Then** approval prompt shows file path (research/climate-summary.md), estimated word count, and file preview before creation
4. **Given** user requests changes across 5 files, **When** approval prompt is shown, **Then** user can expand each file to see detailed diff preview and approve all at once or reject specific files

---

### User Story 3 - Enhanced Research with Web Search (Priority: P3)

A user wants the AI agent to supplement filesystem knowledge with real-time web search results when local context is insufficient or when explicitly requested (e.g., "search the web for React 18 best practices").

**Why this priority**: Web search adds external knowledge beyond the filesystem, making the agent more versatile. However, filesystem-based answers are the core value, making this enhancement-tier.

**Independent Test**: Can be tested by asking a question that requires external knowledge ("what are the breaking changes in TypeScript 5.0?"), verifying the agent searches the web, and seeing cited web sources in the response.

**Acceptance Scenarios**:

1. **Given** user asks "what are the latest security best practices for JWT authentication?", **When** filesystem has limited security documentation, **Then** agent automatically triggers web search, synthesizes findings from 3-5 web sources, and provides answer with both filesystem and web citations
2. **Given** user explicitly requests "search the web for Next.js 14 app router examples", **When** agent processes request, **Then** response prioritizes web search results, shows source URLs with snippets, and optionally suggests saving relevant patterns to filesystem
3. **Given** user asks a filesystem-specific question "where is the user validation logic?", **When** sufficient context exists locally, **Then** agent answers using only filesystem context without triggering unnecessary web searches
4. **Given** web search returns 10 results, **When** agent synthesizes response, **Then** answer includes executive summary with top 3 most relevant sources highlighted and full source list available on expand

---

### User Story 4 - Cross-File Referencing and Context Management (Priority: P4)

A user wants to reference files from different folders, add specific snippets to ongoing conversations, and dynamically manage chat context even when the chat was initialized from a specific file or folder.

**Why this priority**: This enables complex multi-file workflows and keeps conversations contextually relevant. It's important for power users but not essential for initial value delivery.

**Independent Test**: Can be tested by starting a chat from folder A, asking about file B in folder C, then adding a snippet from file D, and verifying all contexts are properly tracked with pills.

**Acceptance Scenarios**:

1. **Given** user types "@" in chat input, **When** user continues typing "not", **Then** system shows autocomplete dropdown with matching files/folders (notes/, notes/brainstorm.md, etc.), and user can arrow-key navigate and Enter to select
2. **Given** user has selected "@notes/brainstorm.md" from autocomplete, **When** message is sent, **Then** system automatically adds brainstorm.md as a context pill and includes it in the agent's context window
3. **Given** user types "use this template/templates/blog-post.md as reference", **When** message is sent, **Then** system parses inline file path, adds blog-post.md as context pill, and agent uses it as reference for subsequent responses
4. **Given** user has 6 context pills (2 folders, 3 files, 1 snippet), **When** combined context exceeds token limit, **Then** system shows warning "Context limit reached" and allows user to remove pills or prioritizes most recent additions
5. **Given** user creates a chat from a specific file, **When** user later references another file from a different folder, **Then** both contexts are maintained with separate pills, and agent understands relationships between them
6. **Given** user copies text from external source and pastes into chat, **When** user asks "integrate this outline into project-brief.md", **Then** agent recognizes external snippet, adds it as context pill "Pasted snippet", and proposes integration changes
7. **Given** user has "All filesystem" pill active, **When** user adds specific file project-brief.md as context pill, **Then** both contexts coexist (broad search + explicit priority for project-brief.md), and agent weights project-brief.md higher in context allocation

---

### User Story 5 - Mobile-Optimized Context Selection (Priority: P5)

A user on mobile wants to add text snippets or files to chat, navigate to specific chats, and manage context pills efficiently within mobile screen constraints.

**Why this priority**: Mobile support is important for on-the-go workflows, but desktop is the primary environment for code editing. Mobile optimization can be refined post-MVP.

**Independent Test**: Can be tested on mobile by highlighting text in viewer, tapping "Add to chat" (stays in viewer) vs "Add and go to chat" (shows chat picker), and verifying smooth navigation.

**Acceptance Scenarios**:

1. **Given** user on mobile highlights code snippet in file viewer, **When** user long-presses to open context menu, **Then** menu shows "Add to chat" (adds to current chat, stays in viewer) and "Add and go to chat" (shows chat picker modal)
2. **Given** user selects "Add and go to chat", **When** chat picker appears, **Then** modal shows list of recent chats sorted by last activity with chat titles, preview of last message, and "+ New Chat" option at top
3. **Given** user has 5 context pills in chat, **When** viewing on mobile, **Then** pills are horizontally scrollable with smooth drag gesture and last pill shows "+3 more" if overflow exists
4. **Given** user taps a context pill on mobile, **When** pill detail view opens, **Then** user can preview content in bottom sheet, remove pill, or navigate to source file

---

### Edge Cases

- What happens when user requests file edits but files are currently open and modified (unsaved changes)?
- How does system handle file creation when target path already exists?
- What happens when shadow filesystem is out of sync with real filesystem (file modified externally)?
- How does system handle extremely large files (>10,000 lines) that exceed context window?
- What happens when web search API is unavailable or rate-limited?
- How does system handle concurrent edits from multiple chat sessions targeting the same file?
- What happens when agent proposes changes that would break syntax or introduce compilation errors?
- How does system handle binary files (images, PDFs) in context pills?
- What happens when chat direction embedding generation fails or takes too long?
- How does system handle deeply nested folder structures (10+ levels) in context selection?
- What happens when user's filesystem contains sensitive files (credentials, API keys)?
- How does system handle file deletions requested by agent?
- What happens when user deletes a chat while agent is processing a request in that chat?
- What happens when user pastes extremely large content (>10MB) into chat input?
- How does system handle agent proposing to delete a file that's referenced in another chat's context pills?
- What happens when embedding generation fails for specific file (corrupted content, encoding issues)?
- How does system handle user editing file while agent is reading it for context building?
- What happens when filesystem contains duplicate file names in different folders?
- How does system handle symbolic links or aliases in filesystem?
- What happens when agent proposes creating file with name matching existing folder?
- What happens when user switches to different project/filesystem while agent is processing request?

## Requirements _(mandatory)_

### Functional Requirements

#### Filesystem Integration

- **FR-001**: System MUST maintain a shadow filesystem representation with embeddings for all text-based files (markdown, text, notes, documents)
- **FR-002**: System MUST synchronize shadow filesystem with real filesystem changes within 2 seconds of file save events
- **FR-003**: System MUST generate embeddings for new/modified files asynchronously without blocking user interaction, processing one file at a time to avoid resource exhaustion
- **FR-003a**: System MUST display indexing progress indicator in UI showing number of files indexed out of total (e.g., "Indexing: 45/120 files")
- **FR-003b**: System MUST allow users to start chatting before indexing completes - indexed files are searchable immediately, unindexed files return on next sync
- **FR-003c**: System MUST enforce file upload limits (maximum file count and total size per upload) to prevent performance degradation
- **FR-003d**: System MUST enforce storage limits per user plan (Free: 50MB, Pro: 1GB, Enterprise: deferred post-MVP) and prompt upgrade when limit reached - all user data counts toward limit including files, embeddings, indexes, and all associated data
- **FR-003e**: System MUST enforce 10MB maximum file size for individual file uploads
- **FR-004**: System MUST support filesystem operations on text files (.txt) and markdown files (.md) only - other file types are out of scope for MVP
- **FR-005**: System MUST index folder hierarchy and maintain parent-child relationships for context traversal
- **FR-006**: System MUST detect file renames and moves to preserve chat context references
- **FR-006a**: System MUST retrigger embedding generation when files are renamed or moved to maintain accurate shadow filesystem
- **FR-006b**: System MUST update all chat context references (pills, auto-gen artifacts) when files are renamed or moved, with pills UI reacting in real-time to path changes
- **FR-006c**: System MUST clear embeddings, references, chat pills, and all related data when files/folders are deleted
- **FR-006d**: System MUST allow agent requests to continue when referenced file/folder is deleted - attempt to retrieve entities but proceed if not found, notifying user in response that referenced file is no longer available
- **FR-006e**: System MUST handle deleted file references differently based on location: (1) remove deleted file pills from active pill list at top of chat, (2) preserve deleted file pills in chat message history with "File Deleted" indicator where they were originally referenced
- **FR-007**: System MUST default to read-only access mode for all files - agent operations requiring write access MUST prompt user for permission before proceeding
- **FR-007a**: System MUST check if target folder exists before file creation, creating parent directories automatically if needed
- **FR-007b**: System MUST fail gracefully when encountering filesystem permission errors with user-friendly error messages
- **FR-007c**: System MUST differentiate between read-only and write access requests - read-only requests proceed without conflict even if user is editing file, write requests trigger conflict modal if user has pending changes
- **FR-007d**: System MUST track last_edit_by field for all files (user_id or 'agent' value) to indicate whether last modification was by user or agent
- **FR-007e**: System MUST display "indexing" icon on file tree UI for files currently being embedded, replacing standard file icon until embedding generation completes with real-time status updates

#### Security & Privacy

- **FR-096**: System MUST sanitize all user input before sending to LLM to prevent injection attacks
- **FR-097**: Orchestrator agent MUST detect and hide sensitive data (API keys, passwords, credentials, tokens) before including context in LLM requests
- **FR-098**: System MUST audit log all agent actions and steps including: request initiation, file reads, write permission prompts, user approvals/rejections, file modifications, errors, completion status
- **FR-099**: System MUST retain chat history and data indefinitely (no automatic expiration or cleanup in MVP)
- **FR-100**: System MUST hide auto-generated artifacts from filesystem UI but allow visibility in chat pill when agent references the artifact content
- **FR-100a**: Auto-generated artifacts MUST use same storage and security model as user files (no special encryption)

#### Chat Session Management

- **FR-008**: System MUST support creating chats from three entry points with distinct initial contexts: (1) Chat from file → initial context pill is that file, (2) Chat from folder → initial context pill is that folder, (3) Chat from "New chat" button → initial context depends on editor state
- **FR-008a**: System MUST provide "Add to chat" action in file/folder context menu to add file or folder as context pill to current active chat without navigating away
- **FR-008b**: System MUST set initial context pills when creating chat via "New chat" button: if document is open in editor, pills are "All filesystem" + currently opened document; if no document is open (empty editor state), pill is "All filesystem" only
- **FR-008c**: System MUST allow users to close the editor to show empty state, independent of chat context
- **FR-009**: System MUST maintain session-based "current chat" for "Add to chat" actions
- **FR-010**: System MUST persist chat history across sessions with automatic save on each message
- **FR-011**: System MUST support multiple concurrent chat sessions per user
- **FR-012**: System MUST track chat direction using embeddings that represent conversation trajectory and topic focus
- **FR-013**: System MUST generate chat direction embeddings after every 5 messages OR when conversation topic shifts significantly (detected via semantic drift threshold >0.7 from last embedding) to maintain current state
- **FR-013a**: System MUST use last user message with text search as fallback for chat direction when chat has fewer than 5 messages or embedding generation fails
- **FR-013b**: System MUST log errors and continue normal operation when embedding API is unavailable (non-blocking failure)
- **FR-013c**: System MUST automatically re-trigger embedding generation when user continues working after embedding API recovery
- **FR-013d**: System SHOULD implement embedding queue for recovery from API failures (post-MVP enhancement)
- **FR-014**: System MUST use chat direction embeddings to suggest relevant files when user asks ambiguous questions
- **FR-015**: System MUST display chat titles (auto-generated from first user message or user-editable)
- **FR-015a**: System MUST provide semantic search via embeddings as the default search mechanism across all chats and files with filter options to search only chats or only files (Note: Clarify if semantic search covers full-text search needs or if dual implementation required)
- **FR-015b**: System MUST include chat picker with title search capability for quick navigation between conversations
- **FR-015c**: System MUST support chat branching - users can fork a conversation at any message to explore alternative approaches while preserving original chat
- **FR-015d**: System MUST add chat ID as URL parameter when user selects a chat
- **FR-015e**: System MUST reload and display the previously selected chat from URL parameter when page is reloaded, maintaining user's context across sessions

#### Context Selection & Pills UI

- **FR-016**: System MUST display context pills for all active contexts (files, folders, snippets, web results, auto-generated artifacts)
- **FR-017**: System MUST show default "All filesystem" pill that can coexist with specific file/folder pills (both active simultaneously with weighted priority)
- **FR-018**: System MUST allow adding context through: file/folder selection, @-mentions (e.g., "@models/User.ts"), inline file paths (e.g., "use this template/api-doc.md"), snippet highlights, drag-and-drop, pasted external content
- **FR-019**: System MUST parse inline file path references in user messages and automatically add matching files as context pills - any reference/pill mentioned inline in chat MUST display in the pill list positioned above the chat input text box
- **FR-019a**: System MUST show disambiguation picker when multiple files match the same path reference (e.g., "models/User.ts" matches "backend/models/User.ts" and "frontend/models/User.ts"), displaying full paths for user selection
- **FR-019b**: System MUST detect and add context pills for all inline reference types: @-mentions ("@Button.tsx"), file paths ("models/User.ts"), folder paths ("src/components/"), and natural language references ("use the Button component file")
- **FR-020**: System MUST support removing individual context pills with clear visual feedback
- **FR-021**: System MUST make pills horizontally scrollable with overflow indicator showing count of hidden pills
- **FR-022**: System MUST show pill metadata on hover/tap (file path, lines of code, last modified, token count, auto-generated flag)
- **FR-023**: System MUST prioritize context within token limit: explicit pills (100% weight) > auto-generated artifacts (80% weight) > chat history (60% weight) > shadow filesystem search results (40% weight)
- **FR-024**: System MUST support 200,000 token context window using Claude model for comprehensive file analysis
- **FR-024a**: System MUST limit context pills to maximum of 10 active pills - when user attempts to add 11th pill, system MUST suggest using "All filesystem" pill or folder pill instead. On mobile more than 3 pills onward should be collapsed into a pill with a container of the remaining pills, "3+", same for desktop but at the 5th pill.
- **FR-024b**: System MUST process the entire filesystem regardless of size through intelligent summarization - adding/removing files never hits context limits
- **FR-024c**: System MUST use intelligent summarization strategies when context approaches token limits: split context into chunks (filesystem, user characterization, chat history, explicit pills), evaluate which context type is consuming most tokens, summarize less important context types while keeping most important context less summarized. If important context is too large, summarize it as well to maintain token budget.
- **FR-024d**: System MUST prime context based on semantic similarity to query using embeddings from chat direction, folder relationships, user preference profile, and shadow filesystem vectors
- **FR-024e**: System MUST weight filesystem context by proximity to referenced files using formula: Final Score = (0.6 × Semantic Similarity) + (0.4 × Proximity Score), with full filesystem available as fallback for responding
- **FR-024f**: System MUST show in-chat notification when summarization is happening (e.g., "Optimizing context...") without showing user which specific content was summarized (complexity stays on backend)
- **FR-024g**: System MUST start request with summarization process when context is too tight, automatically allocating tokens across context sources without user intervention
- **FR-024h**: System MUST reserve 20% of model context window (40,000 tokens) as summarization/autocompact buffer - when context usage reaches 160,000 tokens, trigger automatic summarization
- **FR-024i**: System MUST drop context from earliest messages in chat history if summarization process itself fails, ensuring request can proceed
- **FR-024j**: System MUST summarize complex requests (message content + sources + referenced entities) when initial context gathering exceeds buffer limits
- **FR-024k**: System MUST use file/folder references without loading full content when context is tight - only expand to full content when semantically necessary for response
- **FR-024l**: System MUST integrate Claude Agent SDK for context caching and optimization to reduce redundant context transmission across requests

#### Automatic Context Artifact Management

- **FR-025**: System MUST automatically create hidden reference content when user pulls content from external sources (web search results, pasted content, inline examples) to maintain context across multi-turn conversations
- **FR-026**: System MUST store auto-generated artifacts with metadata (source URL/type, creation timestamp, parent chat session) - artifacts do NOT expire and are NOT cleaned (cleanup deferred to post-MVP)
- **FR-027**: System MUST keep auto-generated artifacts hidden from user (no UI visibility, no context pill representation except for pasted file line references).
- **FR-028**: System MUST use auto-generated artifacts internally for context building without user interaction
- **FR-029**: System MUST NOT allow promotion of auto-generated artifacts to permanent files (feature deferred to post-MVP)

#### Snippet Management

- **FR-030**: System MUST allow highlighting text in viewer with right-click/long-press context menu
- **FR-031**: System MUST provide two snippet actions: "Add to chat" (stays in viewer) and "Add and go to chat" (shows chat picker)
- **FR-032**: System MUST create snippet pills showing source file name and line range (e.g., "Button.tsx lines 45-67") - snippets reference pasted text from file at time of creation
- **FR-032a**: System MUST ensure all files are saved before processing any agent request (no pending changes) - snippets always reference saved file state
- **FR-032b**: System MUST detect when source file changes after snippet creation such that line range no longer matches original text (lines added/removed/modified)
- **FR-032c**: System MUST convert snippet from line range reference to auto-generated content ONLY when source file changes invalidate line range (do NOT create auto-gen content preemptively)
- **FR-032d**: System MUST update pill UI when snippet is converted: remove line references from pill label, show visual indicator "(Changed)"
- **FR-032e**: System MUST make snippet pills clickable: if line range valid, open source file at correct location; if line range invalidated, open auto-generated content file (read-only, cannot be edited)
- **FR-033**: System MUST preserve snippet formatting and syntax highlighting in pill preview
- **FR-034**: System MUST support adding external snippets (pasted code) as context pills labeled "Pasted snippet"

#### Chat Picker (Mobile & Desktop)

- **FR-035**: System MUST show chat picker modal when user selects "Add and go to chat"
- **FR-036**: System MUST list recent chats sorted by last activity with titles and last message preview
- **FR-037**: System MUST provide "+ New Chat" option at top of picker
- **FR-038**: System MUST support exact name search in chat picker using frontend text search (matches against chat titles)
- **FR-038a**: System MUST show empty state "No chats found" when search returns zero results
- **FR-039**: System MUST show context preview (file/folder icons) for each chat in picker

#### Context Priming & Optimization

- **FR-034**: System MUST analyze user preferences from filesystem files (terminology, organizational patterns, documentation structure)
- **FR-035**: System MUST extract user characterization including: preferred content structure, documentation organization style, folder naming conventions (NOTE: Privacy/legal review needed for user profiling)
- **FR-036**: System MUST prime agent context with folder relationships when chat is initialized from a file - prioritize siblings (same folder), children (subfolders/files), and parents (parent folder) over distant files based on proximity weighting
- **FR-037**: System MUST use shadow filesystem embeddings for fast semantic search across all files
- **FR-038**: System MUST retrieve top 10 most relevant files for "All filesystem" context based on query embedding similarity
- **FR-039**: System MUST include last 5 agent interactions in context for conversation continuity
- **FR-040**: System MUST allocate context budget: 50% explicit pills, 30% semantic search results, 20% user characterization + history

#### Agent Request Processing

- **FR-041**: System MUST classify user requests into intent types: question, edit, create, refactor, search, delete
- **FR-042**: System MUST allow users to explicitly trigger web search with phrases like "search the web for" or clicking web search toggle
- **FR-043**: System MUST validate all agent requests against schema (user ID, message 1-10000 chars, chat ID, context pills)
- **FR-044**: System MUST estimate token usage before processing and warn if exceeding quota
- **FR-045**: System MUST enforce usage quota limits based on user plan (Free: 100 requests/month, Pro: 1000/month, Enterprise: 10000/month)
- **FR-045a**: System MUST trigger autosave before processing agent request and wait for autosave completion to ensure agent works with current file state
- **FR-045b**: System MUST stream agent responses token-by-token (like ChatGPT) for improved perceived performance
- **FR-045c**: System MUST allow users to cancel requests
- **FR-101**: System MUST prompt user for write access permission in chat when agent needs to perform edit/create/delete operations - default is read-only access
- **FR-102**: System MUST stop request and prompt user for guidance when write access is denied, asking "What would you like the agent to do instead?"
- **FR-103**: System MUST run file operations in background even when user navigates to different files/screens - operations complete in cloud without blocking UI
- **FR-104**: System MUST determine all involved entities (files, folders, affected paths) at request start before execution begins
- **FR-105**: System MUST fail subsequent requests if they target entities currently being modified by an active request, showing conflict notification: "Another request is modifying [entity] - please wait or cancel the previous request"

#### Autosave & File Conflict Management

- **FR-045d**: System MUST trigger autosave before processing any agent request to ensure agent works with current file state
- **FR-045e**: System MUST detect when user makes additional edits to file/folder while agent is processing changes to that same file/folder
- **FR-045f**: System MUST show blocking modal when file/folder conflict detected: "Agent is making changes to [file/folder] you are working on" with two options: (1) Cancel agent request (keep user changes), (2) Apply agent changes (discard user changes and replace with agent's version) - modal cannot be dismissed until user makes a decision
- **FR-045g**: System MUST coordinate autosave with agent requests - autosave completes before agent reads file context, and autosave is paused when conflict modal is displayed until user makes a decision
- **FR-045h**: System MUST apply conflict resolution to all agent operations (file edits, folder moves, file renames, file deletions) - user has agreed to changes when approving, so agent changes take precedence unless user explicitly cancels
- **FR-045i**: System MUST allow users to edit files unrelated to the current agent request while the request is processing - conflicts only occur for files involved in the specific request

#### Orchestrator Agent (Intent Routing)

- **FR-091**: System MUST use an orchestrator agent to analyze user messages and route to appropriate specialized agents (question, edit, create, refactor, web search) without communicating routing decision to user
- **FR-092**: Orchestrator MUST evaluate message complexity and context to determine if multiple agent types should collaborate (e.g., web search + create for "build a React component using latest best practices from the web")
- **FR-093**: Orchestrator MUST maintain routing decision history to improve accuracy over time based on user feedback (implicit through approval rates)
- **FR-094**: Orchestrator MUST default to question agent when intent is ambiguous and confidence score is below 0.7
- **FR-095**: Orchestrator routing decisions MUST NOT be shown to user and MUST NOT be overridable by user (seamless experience)

#### Collaborative Editing & Approvals

- **FR-046**: System MUST detect when agent proposes file modifications and generate approval prompt
- **FR-047**: System MUST show approval prompts specifying: affected files/folders, specific action type (edit/create/delete/move/rename), high-level summary of what the agent wants to do
- **FR-048**: REMOVED - No diff preview in MVP, changes are applied directly like normal user edits after approval
- **FR-049**: System MUST allow bulk approval (all affected entities) or rejection of entire proposed operation
- **FR-050**: System MUST apply approved changes directly to the filesystem and TipTap editor as if user made the changes, then update shadow filesystem with new embeddings
- **FR-051**: System SHOULD create automatic backups before applying destructive changes (file deletion, major reorganizations) - deferred to post-MVP
- **FR-052**: System MUST show success notification after changes are applied successfully
- **FR-052a**: System MUST treat agent-generated content identically to user-generated content - same sanitization, same rendering, same editing capabilities in TipTap editor

#### File & Folder Creation

- **FR-054**: System MUST support creating new files through agent instructions (e.g., "create a meeting summary for today's standup")
- **FR-055**: System MUST infer appropriate file paths based on project structure and naming patterns
- **FR-056**: System MUST show file creation approval prompt with: proposed path, estimated word count, file preview
- **FR-057**: System MUST detect path conflicts and offer alternative paths or overwrite confirmation
- **FR-058**: System MUST support creating folder structures (e.g., "create a new folder for Q1 2025 planning with subfolders for goals, metrics, and updates")
- **FR-059**: System MUST generate appropriate document structure based on file type and user templates (blog post, meeting notes, research summary, etc.)
- **FR-059a**: System MUST support moving files between folders when user requests reorganization (e.g., "move all research files to research/ folder")
- **FR-059b**: System MUST support renaming files and folders through agent instructions with approval prompt
- **FR-059c**: System MUST show approval prompt for move/rename operations listing: affected files/folders, source paths, destination paths, potential conflicts

#### Web Search Integration

- **FR-060**: System MUST automatically trigger web search when filesystem context is insufficient for answering user query
- **FR-061**: System MUST support explicit web search requests through natural language or UI toggle
- **FR-062**: System MUST retrieve 5-10 web results and extract relevant content snippets
- **FR-063**: System MUST synthesize web results with filesystem context when both are relevant
- **FR-064**: System MUST cite web sources with URLs and snippets in response
- **FR-065**: System MUST include both recent results (last 6 months) and older relevant results for all query types (technical and non-technical)
- **FR-066**: System MUST handle web search API failures gracefully by showing in-chat notification (e.g., "Web search unavailable - using filesystem only"), attempting retry with fallback to filesystem-only answers
- **FR-066a**: System MUST communicate all key tool or step failures to user in chat (embedding generation failures, autosave timeouts, file sync errors, etc.) with appropriate retry or fallback actions
- **FR-109**: System MUST integrate Claude Agent SDK for web search tool access when available
- **FR-110**: System MUST audit log web search usage (query, results count, sources) via SDK integration
- **FR-111**: System MUST use Claude Agent SDK for all agent tools (web search, file operations, folder operations) to centralize tool management
- **FR-112**: System MUST count web search operations toward Claude SDK usage limits (no separate rate limiting in MVP)

#### Real-time Progress & Feedback

- **FR-067**: System MUST provide real-time typing indicators while agent is generating response
- **FR-068**: System MUST show progress updates for long-running operations (embedding generation, file creation)
- **FR-069**: System MUST update progress at key milestones (searching filesystem → retrieving context → generating response → validating changes)
- **FR-070**: System MUST support cancelling in-progress agent requests
- **FR-071**: System MUST broadcast progress updates to all connected client sessions (cross-device sync)
- **FR-071a**: System MUST allow users to switch to different chats while agent processes requests in background
- **FR-071b**: System MUST display toast notification when agent in another chat completes without changing focus to that chat (user stays in current chat)
- **FR-071ba**: System MUST cancel agent request and delete chat when user deletes a chat that is currently processing a request
- **FR-071c**: System MUST format agent responses using markdown with syntax-highlighted code blocks
- **FR-071d**: System MUST render file path references as clickable links that open the referenced file
- **FR-071e**: System MUST provide one-click copy button for code blocks in agent responses
- **FR-071f**: System MUST suggest follow-up prompts based on current context and conversation direction

#### Quality Control & Validation

- **FR-072**: System MUST validate agent responses for: accuracy (compared to filesystem content), content coherence, relevance (to user query)
- **FR-073**: System MUST calculate confidence scores (0-1) for responses based on context sufficiency and source quality
- **FR-074**: System MUST show low confidence warnings when score is below 0.6
- **FR-075**: System MUST retry with expanded context when initial response confidence is low

#### Usage Tracking & Analytics

- **FR-077**: System MUST log every agent request with user ID, intent type, tokens used, web search triggered, success status
- **FR-078**: System MUST track context efficiency metrics (token usage per request, cache hit rates for shadow filesystem)
- **FR-079**: System MUST aggregate usage by user and time period (day, week, month)
- **FR-080**: System MUST provide usage dashboard showing: total requests, files created/edited, average response time, quota remaining
- **FR-113**: System MUST capture session behavior data including: session duration, request count per session, navigation patterns, time between requests
- **FR-114**: System MUST link all requests to their parent session for in-depth experience analysis
- **FR-115**: System MUST provide thumbs up/down buttons for each agent message response
- **FR-116**: System MUST audit log all user decisions (accept/reject file changes, write permission grants/denials, request cancellations)

#### Cost Tracking & Monitoring

- **FR-117**: System MUST track and audit each request with detailed metrics: behavior (intent, actions taken), performance (latency, token usage), cost breakdown (LLM tokens, embeddings, storage, web search)
- **FR-118**: System MUST calculate cost per user across ALL cost sources: embedding generation, vector storage, LLM API calls, web search API calls, file storage, and all other associated costs
- **FR-119**: System MUST be able to calculate the total cost amount for each user via database query (no running total required in MVP, but all cost data must be queryable)
- **FR-120**: System SHOULD expose cost analytics for business analysis - admin UI deferred to post-MVP
- **FR-121**: System MUST break down costs by operation type (question, edit, create, refactor, search) to identify high-cost patterns and inform pricing decisions

#### AI Model Integration

- **FR-081**: System MUST use Claude Sonnet exclusively for all agent operations via Anthropic API
- **FR-082**: System MUST configure temperature per intent type (Question: 0.1, Edit: 0.3, Create: 0.7, Refactor: 0.5)
- **FR-083**: System MUST track token usage separately for input context and output generation
- **FR-084**: System MUST implement retry logic with exponential backoff (1s, 2s, 4s delays) for max 3 attempts on API failures
- **FR-084a**: System MUST display toast notifications for error recovery attempts and failures
- **FR-085**: System MUST handle rate limiting by queueing requests and showing queue position to user
- **FR-085a**: System MUST prompt users to upgrade plan when quota exhausted (requests or storage limits)
- **FR-085b**: System MUST support bulk file operations sequentially for MVP (e.g., "add header to all markdown files in docs/")
- **FR-085c**: System MUST show progress indicator for bulk operations displaying "Processing X/Y files..." with current file name
- **FR-085d**: System MUST allow cancellation of bulk operations mid-process
- **FR-085e**: System MUST handle partial failures in bulk operations: automatic retry on failure, if retry fails then rollback all changes
- **FR-106**: System MUST treat bulk operations as atomic (all succeed or all fail) - partial success triggers retry, retry failure triggers full rollback
- **FR-107**: System MUST stop bulk operation as-is when user cancels mid-process, allowing user to later continue or rollback via chat instructions
- **FR-108**: System MUST apply FR-105 to bulk operations - new bulk request fails if any target entities conflict with active request

#### Future: Overseer Agent (Post-MVP)

- **FR-086**: System SHOULD implement overseer agent that evaluates agent actions before execution
- **FR-087**: Overseer SHOULD assess risk level (low/medium/high) for proposed changes based on scope and impact
- **FR-088**: Overseer SHOULD provide reasoning explanation for risk assessment
- **FR-089**: Overseer SHOULD flag potentially dangerous operations (file deletion, credential modification, bulk refactors)
- **FR-090**: Overseer SHOULD maintain audit log of all agent actions with timestamps, user approvals, and outcomes

### Key Entities

- **Chat Session**: Represents an ongoing conversation - includes session ID, user ID, title (editable), initialization context (file/folder/all), conversation history (array of messages), context pills (active contexts), chat direction embedding (768-dim vector), total tokens used, creation timestamp, last activity timestamp, last message preview, session duration, request count, navigation patterns (file/chat switches), time between requests

- **Context Pill**: Represents a discrete context element - includes pill ID, pill type (file/folder/snippet/web/pasted), display label, source reference (file path/URL/line range), content preview (100 chars), token count, added timestamp, removable flag

- **Shadow Filesystem Node**: Represents a file or folder in shadow filesystem - includes node ID, path (absolute), node type (file/folder), file content (for text files), content embedding (768-dim vector), metadata (size, last modified, language), relationships (parent folder, sibling files, imported modules), embedding generation timestamp, sync status, indexing status (indexed/indexing/pending), last_edit_by (user_id or 'agent' to track whether last modification was by user or AI agent)

- **Agent Request**: Represents a single user message and agent response - includes request ID, user ID, chat ID, user message content, intent type (question/edit/create/refactor/search/delete), context pills at request time, web search triggered (boolean), proposed changes (for edit/create intents), approval status, agent response content, confidence score, tokens used, processing time, timestamp

- **File Change Proposal**: Represents proposed modifications - includes proposal ID, request ID, change type (edit/create/delete), target file path, original content (for edits), proposed content, diff preview, backup created flag, approval status, applied timestamp

- **User Preference Profile**: Represents analyzed user preferences - includes profile ID, user ID, organizational preferences (folder structure, naming patterns), preferred content structure, documentation organization style, common formatting patterns (headings, lists, emphasis), last analysis timestamp, source files analyzed count (NOTE: requires privacy/legal review for user profiling compliance)

- **Web Search Result**: Represents external search result - includes result ID, request ID, source URL, title, content snippet (500 chars), relevance score (0-1), publish date, domain authority, included in response flag

- **Usage Event**: Represents tracking event - includes event ID, user ID, request ID, intent type, tokens used (input/output), web search triggered, files created/edited count, success status, confidence score, processing time, timestamp

- **Auto-Generated Artifact**: Represents reference content created automatically by system - includes artifact ID, chat session ID, artifact type (web-source/pasted-code/inline-example), source reference (URL or "user-pasted"), content (full text or code), content embedding (768-dim vector for similarity search), creation timestamp - artifacts hidden from filesystem UI but visible in chat when agent references them, use same storage/security as user files, do NOT expire until post-MVP, cannot be promoted to permanent files in MVP

- **Orchestrator Decision**: Represents agent routing decision (internal only, not visible to user) - includes decision ID, request ID, user message, detected intent type, confidence score (0-1), selected agent(s) (single or multiple for collaboration), routing reasoning (brief explanation for logging), approval rate for this routing pattern (historical success metric for improving accuracy over time)

- **Chat Branch**: Represents a forked conversation - implemented as a new independent chat session that copies all context from the original chat at the branch point (context pills, conversation history up to branch point, chat direction embedding) and is primed for new direction - no special parent-child relationship in data model for MVP

- **Audit Log Entry**: Represents logged system event - includes log ID, user ID, session ID, request ID, event type (request_start, file_read, write_permission_request, user_approval, user_rejection, file_modification, error, completion), event details (JSON), timestamp, related entity IDs (file paths, folder paths), success status

- **Cost Tracking Record**: Represents cost incurred per operation - includes record ID, user ID, request ID, operation type (question/edit/create/refactor/search), cost breakdown (LLM input tokens cost, LLM output tokens cost, embedding generation cost, vector storage cost, web search API cost, file storage cost), total cost, timestamp

- **User Feedback**: Represents user rating for agent message - includes feedback ID, request ID, message ID, user ID, rating type (thumbs_up/thumbs_down), timestamp, optional text feedback (post-MVP)

### Technical Evaluation _(research needed)_

This section outlines key technical decisions requiring research, prototyping, and benchmarking before implementation.

#### 1. Shadow Filesystem Architecture

**Decision**: Use embeddings/summaries for context optimization

**Research Needed**:

**A. Existing Patterns Analysis**

- **Notion AI**: Investigate how Notion AI searches across workspaces and pages
  - Research questions: Do they use embeddings? How do they handle incremental updates? How do they prioritize context within token limits?
- **Obsidian with AI Plugins**: Study how knowledge graph tools maintain context across linked notes
  - Research questions: What context is sent with each request? How do they handle large vaults? Do they embed entire notes or paragraphs?
- **Mem.ai**: Analyze their context-aware note retrieval and synthesis
  - Research questions: How do they detect relevant notes? What embedding models do they use? How do they optimize for latency?

**B. Prototype Comparison**

| Approach                            | Implementation                                                      | Test Scenario                                                      | Metrics to Measure                                           |
| ----------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------ |
| **Full Embeddings**                 | Generate 768-dim vector for every file using Sentence Transformers  | 100-file project, query "what are the main themes in my research?" | Retrieval accuracy, query latency, storage cost              |
| **Chunk Embeddings**                | Split files into 200-word chunks, embed each chunk separately       | Same project, same query                                           | Precision/recall, context redundancy, token efficiency       |
| **Hybrid (Summaries + Embeddings)** | Store LLM-generated summary + embedding for each file               | Same project, same query                                           | Best of both worlds? Summarization cost vs retrieval quality |
| **Heading-Based Indexing**          | Parse markdown into sections, embed each heading block individually | Same project, query "what decisions were made about pricing?"      | Section-specific accuracy, parsing overhead, format support  |

**Success Criteria**: Approach must achieve <500ms retrieval time for 1000-file repos, >85% relevance for top 5 results, <$0.01 per file for embedding generation.

**C. Cost Analysis**

Calculate costs for 1000-file repository:

| Approach         | Embedding Generation                         | Storage (per month)           | Query Cost        | Total (first month)  |
| ---------------- | -------------------------------------------- | ----------------------------- | ----------------- | -------------------- |
| Full Embeddings  | 1000 files × $0.002 = $2                     | 1000 × 3KB × $0.10/GB = $0.30 | $0.0001 per query | $2.30 + query costs  |
| Chunk Embeddings | 5000 chunks × $0.002 = $10                   | 5000 × 3KB × $0.10/GB = $1.50 | $0.0001 per query | $11.50 + query costs |
| Hybrid           | $2 (embeddings) + $10 (summaries via Claude) | Same as Full                  | Same              | $12.30 + query costs |
| Heading-Based    | $0 (local parsing) + $5 (section embeddings) | 3000 × 3KB × $0.10/GB = $0.90 | Same              | $5.90 + query costs  |

**Note**: These are estimates. Real costs depend on embedding model (OpenAI vs local), summarization frequency, and query volume.

**D. Performance Benchmarks**

Test scenarios (measure against 100-file, 1000-file, 10000-file repos):

1. **Cold Start**: Time to generate embeddings for entire new repository
2. **Incremental Update**: Time to re-embed single modified file
3. **Query Latency**: Time from user message to relevant files retrieved (p50, p95, p99)
4. **Context Quality**: Human evaluation of top 5 retrieved files (relevant vs irrelevant)
5. **Token Efficiency**: Average tokens used per request when relying on shadow filesystem vs reading files on-demand

**Target Benchmarks**:

- Cold start: <30 seconds for 100-file repo, <5 minutes for 1000-file repo
- Incremental update: <2 seconds per file
- Query latency p95: <500ms
- Context quality: >85% of top 5 results are relevant
- Token efficiency: 30% reduction vs on-demand file reading

#### 2. Chat Direction Tracking

**Decision**: Use chat embeddings (vector representing conversation direction)

**Research Needed**:

**A. Embedding Strategy**

| Approach               | How It Works                                                     | Pros                                    | Cons                                              |
| ---------------------- | ---------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------- |
| **Rolling Window**     | Embed last N messages (N=5) as single vector                     | Captures recent direction, low storage  | Loses long-term context, recency bias             |
| **Cumulative Summary** | LLM generates summary after every 3 messages, embed summary      | Captures full conversation arc, compact | Summarization cost, potential information loss    |
| **Hierarchical**       | Embed each message individually, aggregate with weighted average | Preserves nuance, flexible weighting    | Higher storage, complex aggregation logic         |
| **Topic Modeling**     | Extract topics from chat using LDA, represent as topic vector    | Interpretable, good for routing         | Requires minimum message threshold, less semantic |

**Cost Comparison** (for 100-message chat):

| Approach           | Embedding Cost                        | Storage                | Query Cost |
| ------------------ | ------------------------------------- | ---------------------- | ---------- |
| Rolling Window     | 20 embeddings × $0.0001 = $0.002      | 20 × 3KB = 60KB        | $0.0001    |
| Cumulative Summary | 33 summaries × $0.01 (Claude) = $0.33 | 33 × 3KB = 99KB        | $0.0001    |
| Hierarchical       | 100 embeddings × $0.0001 = $0.01      | 100 × 3KB = 300KB      | $0.0001    |
| Topic Modeling     | $0 (local computation)                | 10 topics × 100B = 1KB | $0         |

**Recommendation**: Start with **Rolling Window** (lowest cost, good enough), iterate to **Cumulative Summary** if users report poor context retention in long chats.

**Alternative if Costs High**: Replace embeddings with structured metadata:

- Track mentioned files/folders (array of paths)
- Track intent type distribution (% questions vs edits vs creates)
- Track user's content focus (research vs planning vs writing vs notes)
- Use rule-based routing instead of semantic similarity

**B. Chat Routing Use Cases**

When do we use chat direction embeddings?

1. **Smart File Suggestions**: User asks "what did we decide?" → Use chat embedding to find semantically similar past conversations → Suggest files discussed in those chats
2. **Context Disambiguation**: User says "expand that section" without specifying which → Use chat history to infer likely target file
3. **Multi-Chat Management**: User has 10 open chats → Show most relevant chat when user highlights snippet and selects "Add to chat" (matches snippet to chat direction)

**Benchmark**: Does embedding-based routing outperform simple heuristics (last mentioned file, most frequently discussed folder)?

#### 3. User Characterization from Filesystem

**Decision**: Writing Style Analysis from existing files

**Research Needed**:

**A. Analysis Depth**

What patterns should we extract?

| Pattern Type               | Example                                                                                            | Extraction Method                            | Value                                                   |
| -------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------- |
| **Naming Conventions**     | File naming patterns (kebab-case vs camelCase), folder structure (by-date vs by-topic)             | Regex + frequency analysis                   | **High** - helps maintain consistent organization       |
| **Content Structure**      | Heading hierarchy (H1→H2→H3 vs flat), list formatting (bullets vs numbered), section organization  | Markdown parsing + pattern detection         | **Medium** - influences document architecture           |
| **Tone & Formality**       | Formal (third-person, passive voice) vs casual (first-person, contractions), vocabulary complexity | Text analysis + linguistic features          | **High** - ensures generated content matches user voice |
| **Documentation Style**    | Detailed vs concise, examples-heavy vs theory-heavy, verbosity level                               | Content length patterns + structure analysis | **High** - matches user's explanation depth preferences |
| **Formatting Preferences** | Bold/italic usage, code blocks, tables, blockquotes, inline links vs reference links               | Markdown syntax frequency                    | **Medium** - maintains visual consistency               |
| **Content Organization**   | Chronological vs topical, project-based vs tag-based, nested folders vs flat with prefixes         | Folder structure + file relationships        | **Medium** - helps suggest appropriate file locations   |

**MVP Focus**: Tone & formality, documentation style, naming conventions (high-value, straightforward to extract)

**B. When to Run Analysis?**

| Trigger                                | Pros                                                               | Cons                                                              |
| -------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| **On First Chat**                      | Immediate benefit, user sees personalized responses from the start | Blocking delay if analysis takes >5 seconds                       |
| **Background Job (Periodic)**          | No user-facing latency, always up-to-date                          | Cold start problem for new users, wasted compute if user inactive |
| **Incremental (Per File Save)**        | Always reflects current state, no bulk processing                  | Potentially noisy (frequent small updates)                        |
| **On-Demand (User Requests Analysis)** | User controls timing, explicit opt-in                              | Extra friction, many users won't bother                           |

**Recommendation**: **Background job on first project access** (analyze once, cache results, update incrementally on file saves)

**C. Privacy Considerations**

User characterization raises questions:

- Should users see what patterns were detected? (Transparency)
- Can users override detected preferences? (Control)
- Do we store raw file content for analysis or just extracted patterns? (Privacy)

**MVP Approach**: Store only extracted patterns (not raw content), show in user settings with edit capability

#### 4. Performance at Scale

**Benchmarks to Run**:

| Scenario                  | Repo Size                                      | Action                               | Target Metric                                        |
| ------------------------- | ---------------------------------------------- | ------------------------------------ | ---------------------------------------------------- |
| **Filesystem Sync**       | 10,000 files                                   | User saves 1 file                    | <2s to update shadow filesystem                      |
| **Chat Context Building** | 5 context pills (3 files, 1 folder, 1 snippet) | User sends message                   | <500ms to build context                              |
| **Semantic Search**       | 10,000 files                                   | User asks "where is authentication?" | <1s to retrieve top 10 results                       |
| **Embedding Generation**  | 1,000 file repository                          | User opens project for first time    | <5 minutes to generate all embeddings (background)   |
| **Concurrent Chats**      | 1 user, 5 active chat sessions                 | User switches between chats          | <100ms to load chat history                          |
| **File Creation**         | Agent proposes creating 10 files               | User approves all                    | <3s to create all files and update shadow filesystem |

**Optimization Strategies to Test**:

1. **Caching**: Cache frequently accessed file embeddings in Redis
2. **Lazy Loading**: Load chat history on-demand (last 20 messages) vs all messages
3. **Debouncing**: Batch file save events (wait 500ms for additional saves before triggering sync)
4. **Parallel Processing**: Generate embeddings for multiple files concurrently (test 5, 10, 20 parallel workers)

### UI/UX Requirements

#### Screens/Views Needed

- **Chat Interface**: Primary interaction point with message history, context pills at top, input at bottom, typing indicators, approval prompts inline
- **Chat List Sidebar**: Shows all user chats with titles, last message preview, unread indicators, sort/filter options
- **Chat Picker Modal**: Full-screen modal (mobile) or dropdown (desktop) showing recent chats when user selects "Add and go to chat"
- **File Viewer with Chat Integration**: Split view showing file content on left, chat panel on right, highlight-to-add-to-chat functionality
- **Approval Prompt Modal**: Displays proposed file changes with diff previews, expandable file details, approve/reject actions
- **Context Pills Bar**: Horizontally scrollable bar above chat input showing all active contexts (maximum 10 pills, on desktop collapse 3+, on mobile collapse 2+), with remove (X) buttons, system suggests "All filesystem" or folder pill when limit reached
- **Usage Dashboard**: Displays quota usage, request history, files created/edited, token consumption charts

#### Key Interactive Elements

- **Context Pill** (Chip/Badge): Shows file/folder/snippet name with icon, displays metadata on hover (path, line count, tokens), removable with X button, clickable to preview content, drag-and-drop to reorder priority
- **Chat Input** (Multi-line Textarea): Supports @-mentions for file/folder selection, paste detection for external snippets, slash commands (/search, /edit, /create), rich text formatting for code blocks, attachment button for files
- **Approval Prompt Card** (Modal): Header with action summary ("Agent wants to edit 3 files"), expandable file list with diff previews (side-by-side or unified), approve all button (primary), reject button (secondary), approve individual files checkboxes
- **Chat Picker** (Modal/Dropdown): Search bar at top, scrollable list of chats with chat icon + title + preview, sorted by last activity, "+ New Chat" prominent action, swipeable on mobile
- **Typing Indicator** (Animated): Three-dot animation showing agent is thinking, progress text for long operations ("Searching filesystem...", "Generating code...", "Validating syntax...")
- **Web Search Toggle** (Switch): Toggle button in chat input area, indicates when web search is active, shows "Web" badge on messages that used web search
- **File Creation Preview** (Card): Shows proposed file path, estimated line count, language icon, expandable code preview with syntax highlighting, "Create File" button
- **Diff Viewer** (Deferred Post-MVP): Side-by-side comparison for edits (original left, proposed right), line numbers on both sides, color-coded additions (green) and deletions (red) - NOT in MVP, changes are applied directly after approval
- **File Conflict Modal** (Dialog): Appears when user edits file/folder while agent is processing changes to same target, shows warning message "Agent is making changes to [file/folder] you are working on", two action buttons: "Cancel Agent Request" (keep user changes) and "Apply Agent Changes" (discard user edits), displays last save timestamp and pending changes count

#### Responsive Requirements

- **Mobile Priority**:

  - Full-height chat interface with fixed input at bottom
  - Keyboard pushes content up when opened, pills remain visible on top of input (standard chat UI behavior)
  - Context pills horizontally scrollable with snap-to-pill behavior, collapsed pills (>3) show bottom sheet on tap with all pills (removable)
  - Chat picker as full-screen modal with smooth slide-up animation
  - Approval prompts as bottom sheet (50% screen height, expandable to full) showing action type and summary (no diff preview in MVP)
  - Snippet addition via long-press context menu with vibration feedback - same behavior as right-click on desktop
  - Swipe gestures: swipe right on message to quote/reply, swipe left to delete (own messages)
  - Collapsible chat list (hamburger menu) to maximize chat view space
  - No offline mode support (requires network connection)
  - No battery-specific optimizations (standard mobile web app behavior)
  - Long-press on file names in tree view or file content in editor triggers same context menu as right-click

- **Desktop Enhancements**:
  - Three-panel fixed layout: file tree (left 20%), document editor (center 50%), chat interface (right 30%) - NO panel resizing in MVP
  - TipTap editor in center panel with right-click context menu support for snippet creation (extend file system UI context menu pattern if TipTap doesn't natively support custom right-click)
  - Chat always visible on right 30% panel, cannot be full-screen or hidden
  - Approval prompts show action type and summary (no diff preview, no side-by-side comparison in MVP)
  - Keyboard shortcuts: Cmd/Ctrl+K to open chat picker, Cmd/Ctrl+Enter to send message, Esc to close modals
  - Drag-and-drop files from file tree directly into chat to add as context pill
  - Hover previews on context pills showing full file path and content preview
  - Multi-select in file tree to add multiple files as context at once
  - Editor can be closed to show empty state, independent of chat panel

#### Critical States

- **Loading**:

  - Skeleton screens for chat history during initial load
  - Typing indicator with pulsing dots while agent generates response
  - Progress bar for embedding generation (background) with percentage and ETA
  - Spinner on approval buttons during file write operations
  - Disabled chat input during active request (prevent spam)
  - In-chat notification for context summarization: "Optimizing context..." (appears when context tight)
  - Bulk operation progress: "Processing 15/50 files... [current-file-name.md]" with cancel button

- **Error**:

  - Inline error banner above chat input with specific message: "Web search unavailable", "Quota exceeded (5 requests remaining)", "File sync failed"
  - Suggested actions: "Retry", "Upgrade Plan", "Try without web search"
  - Red error icon with shake animation for attention
  - Preserved user input for easy retry after fixing error
  - Detailed error logs accessible via "View details" link for debugging

- **Empty**:

  - **New User First Login** (no files, no chats):
    - File tree panel: Empty state with "Create File" and "Upload Files" buttons, onboarding guidance
    - Document editor panel: Empty state with "Create File", "Upload Files", "Open Document" prompts
    - Chat panel: Empty state with "Start chatting" prompt - clicking immediately creates first chat with "All filesystem" context pill
  - **Returning User** (has chats):
    - Chat panel: Shows chat list with titles, last message previews, sorted by last activity
    - When chat selected: URL param added with chat ID, reload preserves selected chat
  - **No Files in Project**: Empty state on file tree and editor explaining how to add files, upload button prominent
  - **No Search Results**: "No relevant files found" message, suggestions to adjust query or broaden context (add "All filesystem" pill)
  - **Editor Closed**: Empty state on document editor panel when user closes the editor, independent of chat panel state
  - **No Document Open + New Chat**: Creating new chat with no document in editor shows "All filesystem" pill only

- **Success**:
  - Green checkmark animation on approval confirmation
  - Toast notification: "3 files updated successfully" with undo option (5-second window)
  - File creation success: Highlight new file in file tree with brief glow effect
  - Automatic scroll to newly created/edited content in viewer
  - Confetti animation for first successful agent collaboration (onboarding delight)

#### Accessibility Priorities

- **Keyboard Navigation**:

  - Tab order: context pills (left to right) → chat input → send button → message history (bottom to top) → sidebar chats
  - Arrow keys within pills bar to move focus between pills
  - Enter to remove focused pill, Space to preview
  - Cmd/Ctrl+K to open chat picker from anywhere
  - Escape to close modals/pickers
  - Tab within approval prompt: approve all → file checkboxes → reject
  - Focus trap within modals (can't tab outside until dismissed)

- **Screen Reader**:

  - Announce context pill additions: "Added Button.tsx to context, 3 pills total"
  - Announce typing indicator: "Agent is generating response"
  - Announce approval prompts: "Agent proposes editing 3 files, review changes"
  - Read diff changes: "Line 45 removed: old code, Line 45 added: new code"
  - Announce success/error states clearly
  - Label all interactive elements with aria-label
  - Use aria-live regions for dynamic updates (typing indicator, progress)

- **Touch Targets**:
  - Minimum 44×44px for all tappable elements on mobile
  - Sufficient spacing between approve/reject buttons (12px gap minimum)
  - Large swipe zones for chat picker (entire row tappable, not just text)
  - Context pill X buttons large enough for thumb (36×36px touch area)
  - Chat input has comfortable tap target (minimum 56px height)
  - Long-press for snippet addition (500ms threshold, vibration feedback)

## Success Criteria _(mandatory)_

### Measurable Outcomes

#### Performance Metrics

- **SC-001**: Users can ask questions about their filesystem and receive responses with relevant file citations within 5 seconds
- **SC-002**: Shadow filesystem synchronizes with real filesystem changes within 2 seconds of file save events
- **SC-003**: Semantic search across 1000-file repository returns top 10 relevant results in under 1 second
- **SC-004**: Chat direction embeddings are generated and stored within 3 seconds after every 5th message
- **SC-005**: File creation/editing operations complete within 3 seconds after user approval
- **SC-006**: Web search results are retrieved and synthesized into responses within 8 seconds
- **SC-007**: Context pills load with previews within 500ms of addition
- **SC-008**: Chat picker displays recent chats within 300ms of opening

#### Quality Metrics

- **SC-009**: 85% of agent responses include accurate citations to relevant files in the filesystem
- **SC-010**: 90% of proposed code changes pass syntax validation before showing approval prompt
- **SC-011**: Agent's context selection (retrieved files) is rated as relevant by users in 80% of requests
- **SC-012**: REMOVED - user preference matching deferred to post-MVP detailed feedback phase
- **SC-013**: Web search is triggered appropriately (only when filesystem context insufficient) in 90% of cases
- **SC-014**: High confidence responses (>0.8) have >90% approval rate (validates confidence prediction accuracy)
- **SC-049**: Chat direction routing suggests relevant files in 80% of ambiguous queries as measured by user thumbs up/down feedback

#### Adoption & Engagement Metrics

- **SC-015**: 70% of users create at least one chat session within their first day of using the platform
- **SC-016**: Users send an average of 15 messages per week across all chats after initial adoption
- **SC-017**: 60% of users approve at least one file edit/creation within their first week
- **SC-018**: Users with collaborative editing enabled (approved at least 1 change) return 2x more frequently than read-only users
- **SC-019**: 40% of chat sessions include explicit context pill management (adding/removing pills)
- **SC-020**: Average chat session duration is 8 minutes (indicates sustained engagement)

#### System Scalability

- **SC-021**: System handles 500 concurrent chat sessions without performance degradation
- **SC-022**: Embedding generation for 1000-file repository completes in under 5 minutes (background processing)
- **SC-023**: System maintains <500ms query latency at p95 for repositories up to 10,000 files
- **SC-024**: File sync operations handle 100 concurrent file saves without message loss

#### Mobile Experience

- **SC-025**: Mobile users successfully add snippets to chat using "Add to chat" and "Add and go to chat" actions in 95% of attempts
- **SC-026**: Chat picker modal loads and displays within 300ms on mobile devices (4G connection)
- **SC-027**: Context pills are usable (scrollable, removable) on mobile with 100% task completion rate
- **SC-028**: Approval prompts are reviewable and actionable on mobile with 90% successful approval rate (no accidental rejections)

#### Cost Efficiency

- **SC-029**: Average cost per agent request stays below $0.03 for filesystem-only queries and $0.10 for web search queries (with 200k context window)
- **SC-030**: Shadow filesystem storage costs remain below $0.50 per user per month for typical repositories (<5,000 files)
- **SC-031**: Chat direction embedding costs stay below $0.01 per 100 messages

#### New Feature Metrics

- **SC-032a**: Token-by-token streaming provides first response token within 1 second of request completion
- **SC-032b**: Autosave completes within 500ms before agent request processing begins
- **SC-032c**: File conflict warnings appear within 100ms of user typing in file being modified by agent
- **SC-032d**: Chat search returns results across all chats and files within 300ms
- **SC-032e**: Chat branching creates fork within 200ms with full context preserved from branch point
- **SC-032f**: Background task completion notifications display within 100ms of operation finishing
- **SC-032g**: Auto-suggested follow-up prompts appear within 500ms of agent response completion
- **SC-032h**: Code block copy buttons function with one-click copy in 100% of cases
- **SC-032i**: File path links in responses navigate to correct file in 100% of cases

#### Orchestrator & Advanced Features

- **SC-033**: Orchestrator routes requests to correct agent type with >90% accuracy based on implicit user feedback (approval rates)
- **SC-034**: Multi-agent collaboration is detected and coordinated in <100ms
- **SC-035**: Users perceive agent responses as appropriate to their request (no perceived misrouting) >90% of the time
- **SC-036**: Auto-generated artifacts are created and used internally without user visibility issues (zero user complaints about hidden artifacts)
- **SC-037a**: Context summarization completes within 2 seconds and maintains response quality >85% of cases as measured by user approval rates
- **SC-037b**: Bulk operations (50 files) complete with progress updates every 3 seconds and <5% failure rate

### Qualitative Outcomes

- **SC-038**: User satisfaction ratings for agent responses average 4.5+ stars out of 5
- **SC-039**: Users report 4x faster file exploration compared to manual navigation based on post-task surveys
- **SC-040**: Generated content is approved without modifications in 70% of cases (indicates high quality on first attempt)
- **SC-041**: Users describe the agent as "understanding my filesystem" rather than "generic AI assistant" in feedback surveys (indicates effective context optimization)
- **SC-042**: Users trust agent-proposed changes enough to approve without line-by-line review in 50% of simple edits (indicates confidence in validation)
- **SC-043**: Users describe context selection as "smart" rather than "overwhelming" in usability tests (10-pill limit, smart summarization)
- **SC-044**: Users successfully recover from file conflicts without data loss in 100% of cases (conflict modal effectiveness)
- **SC-045**: Orchestrator routing decisions are perceived as "correct" by users >90% of the time (seamless agent selection)
- **SC-046**: Auto-generated artifacts usage is transparent to users - zero confusion about where external content is stored

## Assumptions

1. **Shadow Filesystem Approach**: Embeddings-based shadow filesystem provides sufficient context quality - we assume 768-dim vectors capture semantic meaning well enough for accurate retrieval (benchmark will validate)

2. **Chat Direction Tracking**: Embeddings generated after every 5 messages capture conversation direction adequately - we assume recent message batches are stronger signals than full history for context routing

3. **User Characterization**: Analyzing 50+ files provides sufficient data to extract meaningful organizational preferences and documentation patterns - we assume users have established conventions visible in their content (requires privacy/legal review for compliance)

4. **Context Token Budget**: 200,000 token context window with 20% summarization buffer (40k tokens) allows for comprehensive file analysis - we assume intelligent summarization handles repositories up to 5,000 files effectively, with larger filesystems deferred to post-MVP selective context features. Storage limits (Free: 50MB, Pro: 1GB, 10MB per file) constrain repository sizes within practical ranges for MVP

5. **Web Search Triggers**: LLM can reliably determine when filesystem context is insufficient - we assume the model knows when to search the web vs when local context suffices

6. **Approval Friction**: Users will accept approval prompts for edits without significant workflow disruption - we assume the approval UI is fast enough (<2 seconds for single-file edits, <30 seconds for bulk operations with scannable summaries) that it feels collaborative, not blocking

7. **Mobile Use Cases**: Users will perform read-heavy tasks (questions, browsing) on mobile and edit-heavy tasks (approving large reorganizations) on desktop - we assume mobile is secondary interface

8. **Project Size**: Typical user projects contain 100-5,000 files based on industry patterns - edge cases (10,000+ files) will be addressed when data shows demand, with selective context and priority folder features deferred to post-MVP

9. **Real-time Sync**: 2-second sync latency for shadow filesystem is acceptable - we assume users don't expect instant context updates after saving files

10. **Embedding Model**: Using sentence-transformers (all-MiniLM-L6-v2) provides good enough accuracy for content retrieval - we assume general-purpose embeddings work for diverse content types

11. **Cost Sustainability**: Comprehensive cost tracking per user (LLM tokens, embeddings, storage, web search) enables pricing validation - we're tracking all cost sources to feed into business decisions and validate that usage quotas (100/1000/10000 requests per month) align with profitable pricing tiers

## Dependencies

1. **Filesystem Access & Monitoring**: Requires filesystem watcher (fs.watch or chokidar) to detect file changes in real-time for shadow filesystem sync

2. **Embedding Generation Service**: Requires embedding model (Sentence Transformers or OpenAI embeddings API) and infrastructure to generate 768-dim vectors at scale

3. **Vector Storage & Search**: Requires vector database (Supabase pgvector, Pinecone, or Weaviate) for storing embeddings and performing semantic similarity search

4. **Web Search API**: Requires integration with web search provider (Tavily, SerpAPI, or Perplexity) for retrieving external search results

5. **Real-time Subscriptions**: Requires Supabase real-time subscriptions for broadcasting typing indicators, progress updates, and file sync events across devices

6. **Supabase Edge Functions**: Requires Edge Functions infrastructure for agent execution, embedding generation, and file operations with unlimited execution time

7. **Frontend State Management**: Requires Valtio for managing chat state, context pills, approval prompts, and real-time updates

8. **Diff Generation Library**: Requires diff library (diff-match-patch or jsdiff) for generating line-by-line diffs for approval previews

9. **File Backup System**: Requires backup strategy (git integration or snapshot storage) for creating automatic backups before applying destructive changes

10. **Authentication & Authorization**: Requires Supabase Auth for user identity and file-level permissions enforcement

11. **File Type Detection**: Requires file type detection library for appropriate syntax highlighting and content rendering in previews

## Out of Scope

1. **Multi-User Collaboration**: Real-time collaborative editing where multiple users edit the same file simultaneously - deferred to post-MVP (focus on single-user workflows first)

2. **Advanced Overseer Agent**: Full reasoning explanation, risk assessment, and audit trails - MVP uses simple approval prompts, overseer added later

3. **Diff Preview UI**: Side-by-side or unified diff viewer showing proposed changes before approval - MVP applies changes directly after approval prompt (no preview), diff UI deferred to post-MVP based on user feedback requesting change visibility before approval

4. **Line-by-Line Diff Approval**: Granular approval of each changed line with accept/reject buttons - deferred to post-MVP, MVP uses bulk approve/reject only

5. **Git Integration**: Automatic commits for agent changes, branch creation, PR generation - deferred to post-MVP (manual git workflows sufficient initially)

6. **Custom Agent Types**: User-defined agents with custom prompts, temperature, and behavior - MVP includes predefined intent classification only

7. **Advanced Context Prioritization**: User-defined weights for context sources (explicit pills 80%, semantic search 20%, etc.) - MVP uses fixed allocation strategy

8. **Multi-Language Support**: Content generation in languages other than English - deferred based on user demand

9. **Binary File Handling**: Opening, previewing, or analyzing images, PDFs, videos in chat context - MVP stores metadata only, no content analysis

10. **Code Execution**: Running generated code in sandboxed environment to validate functionality - MVP relies on syntax validation only, no runtime testing

11. **Advanced Web Search**: Filtering by date range, domain, source type - MVP uses basic keyword search with recency bias

12. **Voice Input**: Speech-to-text for chat messages on mobile - deferred to post-MVP based on mobile user demand

13. **Agent Marketplace**: Community-contributed agents, templates, or prompts - deferred until core agent system is proven

14. **Offline Mode**: Chat functionality without internet connection using locally cached embeddings - requires significant architectural changes, post-MVP

15. **Cross-Repository Context**: Referencing files from multiple projects in single chat session - MVP focuses on single project/repository

16. **Advanced Analytics**: Detailed insights into agent performance, token efficiency trends, A/B testing of prompt strategies - basic analytics in MVP, advanced deferred

17. **Panel Resizing**: User-customizable panel widths for file tree, editor, and chat - MVP uses fixed proportions (20/50/30), resizing deferred to post-MVP based on user feedback

## Technical Architecture Decisions _(to be finalized during planning)_

This section will be expanded during `/speckit.plan` based on research findings:

### Shadow Filesystem Implementation

- **Embedding Model**: [TBD after prototyping - sentence-transformers vs OpenAI vs CodeBERT]
- **Vector Database**: [TBD after cost analysis - pgvector vs Pinecone vs Weaviate]
- **Sync Strategy**: [TBD after benchmarking - event-driven vs polling vs hybrid]
- **Storage Format**: [TBD - raw vectors vs compressed vs quantized]

### Chat Direction Tracking

- **Embedding Strategy**: Rolling Window (decided), but frequency and window size to be tuned
- **Fallback Strategy**: If embedding costs too high, use structured metadata (mentioned files array + intent distribution)

### Context Priming

- **User Characterization**: AST parsing vs regex vs LLM analysis - [TBD after accuracy comparison]
- **Folder Relationship Detection**: Import analysis vs naming conventions vs co-location patterns - [TBD]

### Performance Optimization

- **Caching Layer**: Redis for frequently accessed embeddings - [TBD after load testing]
- **Lazy Loading**: Chat history pagination strategy - [TBD based on average chat length metrics]
- **Parallel Processing**: Optimal worker count for embedding generation - [TBD after benchmarking]

These decisions will be researched, prototyped, and documented in `plan.md` during the planning phase.
