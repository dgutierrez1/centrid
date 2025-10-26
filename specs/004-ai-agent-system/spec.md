# Feature Specification: AI-Powered Exploration Workspace

**Feature Branch**: `004-ai-agent-system`
**Created**: 2025-10-23
**Status**: Reframed (Updated 2025-10-25)
**Input**: User description: "Exploration workspace where branching conversations and persistent filesystem are unified through provenance"

---

## Strategic Context

**What we're building**: An exploration workspace where users can branch conversations to explore multiple approaches in parallel, capture findings as persistent files with provenance, and consolidate insights from the entire exploration tree.

**The problem we solve**: Researchers, consultants, and knowledge workers suffer from context fragmentation when exploring complex topics. Current tools force linear exploration (ChatGPT/Claude) or manual organization (Notion). Users lose track of parallel threads, can't reference insights across exploration paths, and must manually consolidate findings.

**Our solution**: Branching conversations + persistent filesystem + provenance tracking + cross-branch context = complete exploration workflow (Explore → Capture → Reference → Consolidate → Ship)

**Category positioning**:

- **Not**: "AI chat with better memory"
- **Not**: "Notion with AI"
- **Yes**: "Exploration workspace for deep research"

**Core insight**: Files are artifacts of exploration. Conversations are exploration paths. Provenance connects them. Don't force users to choose between "file view" or "conversation view" - they're the same thing from different angles.

---

## Clarifications

### Session 2025-10-26

- Q: How should conversation summaries be generated when "auto-updated on every message" - incremental update or full regeneration? → A: Regenerate summary and embedding from scratch on every new message (not incremental updates)
- Q: Should system enforce hard limits on branch count (e.g., max 200 branches per user)? → A: No hard limits beyond billing plan quotas - system should scale gracefully without artificial branch count limits
- Q: What information should conversation summaries include (topics, decisions, artifacts, questions)? → A: Topics + key decisions + artifacts created + open questions (comprehensive context for consolidation and cross-branch discovery)
- Q: What happens when consolidation attempts to access deleted files from archived branches? → A: Skip deleted files silently and note in consolidation output ("Note: 2 referenced files unavailable")
- Q: What happens when file is edited outside of originating conversation - how does provenance update? → A: Update edit_history only (timestamp, editor=user, edited_in_conversation_id=null), keep original provenance metadata unchanged
- Q: Should memory chunk summaries be generated from just the 10 messages in that chunk or all messages up to that point? → A: From the 10 messages in that chunk only (localized summaries for better semantic retrieval of specific conversation segments)
- Q: How does system handle file created in Branch A, edited in Branch B, then edited again in Branch A - multi-branch provenance chain? → A: No edit history array - just update last_edited timestamp, last_edited_by (agent/user), and edited_in_conversation_id fields with most recent edit (simple last-edit tracking, not full history)
- Q: What should file structure_metadata include (outline, concepts, entities, AST)? → A: File outline (headings hierarchy) + key concepts + main topics (structured for navigation and semantic matching)
- Q: When branch is deleted (allowed only if no children), what happens to files created in that branch? → A: Keep files but clear provenance - preserve files in filesystem, set created_in_conversation_id=null to indicate orphaned status, keep context_summary for historical reference (prevents data loss while maintaining provenance transparency)
- Q: What threshold defines "significant" file content change for triggering shadow entity summary update? → A: Character diff threshold >20% (balances freshness with embedding/LLM cost, measurable trigger)
- Q: Should User Story 5 show "full edit history" or "simple last-edit tracking only" (conflicts with FR-012c)? → A: Simple last-edit tracking only - show only most recent edit info (last_edited_by, edited_in_conversation_id) without full history array (matches FR-012c, MVP simplicity, reduces storage overhead)
- Q: When user @-mentions Chat A which @-mentions Chat B which @-mentions Chat C, how to prevent circular reference and infinite context expansion? → A: No nested resolution (depth 1 only) - load @-mentioned chat's direct content (summary + last 5 messages + explicit files + artifacts) WITHOUT expanding any @-mentions inside it (prevents infinite loops, keeps context predictable, simple for MVP)
- Q: When agent requests tool approval and user abandons prompt for hours, what happens to prevent indefinite resource consumption (SSE connection, Edge Function execution)? → A: Timeout after 10 minutes - auto-reject pending approval, release server resources, show error "Approval timed out. Please retry your request." User must retry from beginning (balances review time with resource conservation)
- Q: How should users manually exclude sibling branches from context (UI mechanism for FR-029)? → A: Toggle in semantic matches section - each semantic match shows "Hide from [Branch Name]" button in tooltip/dropdown, clicking blacklists that branch_id for current conversation (prevents future semantic matches from that branch), user can view/remove blacklisted branches in context settings (discoverable at point of need, per-conversation scope)

### Session 2025-10-25

- Q: Should context priming capture related files/nodes automatically when user sends a request? → A: Yes, system should automatically capture semantically related files for agent processing
- Q: Can users @-mention other conversations (chats) to add them to context? → A: Yes, users should be able to @-mention other chats to add their context (files, messages, artifacts)
- Q: How should provenance be displayed in file editor - click modal or hover tooltip? → A: Click file/reference opens editor with full provenance in header; hover shows summarized tooltip with key provenance data
- Q: Should context panel be separate UI component or integrated into chat? → A: Context section integrated into chat (above input box, before messages) showing different context types with visual priority indicators
- Q: How should context priority/weight be visualized to users? → A: Use visual indicators (color/icon/grouping boundaries) to show priority tiers (Group 1 = highest priority, Group 2 = next, etc.) without exposing numeric weights
- Q: Should context budget (token allocation) be displayed to users? → A: No, context budget removed from user-facing UI (internal optimization only)
- Q: When user @-mentions another conversation, what content should be included in context? → A: Conversation summary + last 5 messages + all explicit files + all artifacts from @-mentioned conversation
- Q: How should nested branches inherit context (Main → A → A1)? → A: Inherit explicit files from immediate parent only + parent conversation summary + parent's last message + branching user message content (if agent-created branch)
- Q: When semantic search finds 50+ relevant files, how should results be limited? → A: Show top 10 files by final relevance score, prioritize files from related branches (siblings/parent/child) over distant branches
- Q: How should provenance be assigned to manually created files (not via agent)? → A: No provenance assigned to manually created files. If agent later edits it, track last_edited timestamp and editor (agent vs user) in edit history
- Q: What happens when parent branch is deleted but child branches exist? → A: Prevent parent deletion if children exist (show error: "Cannot delete branch with children. Delete children first.")
- Q: Should all domain entities (files, conversations, knowledge graph nodes) have embeddings and summaries in a unified layer? → A: Yes - All entities get embeddings + summary + structure metadata in unified shadow layer
- Q: Should the unified embedding layer be a separate table (shadow domain) or embedded columns in each entity table? → A: Separate `shadow_entities` table - Unified table with (entity_id, entity_type, embedding, summary, structure_metadata) that all entities reference
- Q: How should agent responses be displayed to users (streaming vs complete)? → A: Stream responses in real-time via Server-Sent Events (SSE) showing mixed content (text, tool calls, approvals) in execution order within same chat message. Message structure can be: text, tool, text, tool, tool, text, etc. with loading feedback at start
- Q: When agent response stream is interrupted (network disconnect, server error), how should system handle reconnection? → A: Discard partial message, user must retry request from beginning (simpler for MVP)
- Q: When agent requests tool call approval during streaming response, should stream pause or continue? → A: Pause stream, wait for user approval/rejection, then resume streaming after user acts (prevents confusion, clearer causality)
- Q: How often should conversation embeddings and summaries be updated? → A: Trigger embedding and summary generation on every message (not just every 10 messages) for maximum context freshness
- Q: Is "Context Pill" the right term or should it be renamed? → A: Rename to "Context Reference" (Context Pill is UI-specific term, Context Reference is more accurate for domain model)
- Q: When should prime context be built for agent requests? → A: Build prime context BEFORE sending request to agent, assembling most relevant and optimal data across all domains (files, conversations, KG) so agent can perform actions optimally and know which tools to call
- Q: When agent streams multiple tool calls and user rejects the first one, what happens to subsequent tool calls? → A: Pause stream at first rejection, ask agent to revise plan given rejection, continue with new strategy
- Q: How should system prevent irrelevant sibling pollution while enabling useful cross-branch discovery? → A: Use relevance threshold + topic divergence check - if branch summaries have cosine similarity <0.3, only show semantic matches with relevance >0.9 (prevents noise from topically unrelated branches)
- Q: How should branch graph UI be displayed during regular workflow (not just Phase 3 tree view)? → A: Branch selector dropdown shows hierarchical tree structure with indentation for nested branches (similar to file tree: Main → RAG Deep Dive → RAG Performance)
- Q: Should context management use dynamic priming only, memory chunking only, or hybrid? → A: Hybrid - Dynamic priming optimizes per-request context (show excluded items in UI for manual re-priming), memory chunking compresses old conversation messages into embeddings when conversation exceeds manageable size (retrieve relevant chunks semantically per request)
- Q: When user renames or moves a file, how should system handle provenance metadata, context references, and shadow entity? → A: Update all references atomically in transaction - file_id stays same, update path in all tables (files, context_references, shadow_entities), preserve provenance metadata, update shadow entity path reference
- Q: How should desktop workspace layout balance chat-first UX with file editing needs? → A: Adaptive 3-panel layout - Left panel (20%, tabs for Files/Chats, defaults to Chats on open, no persistence), Center panel (40-80% chat, expands when no file open), Right panel (0-40% editor, appears only when file opened, only one file at a time, close button to dismiss)
- Q: When consolidating from branches with conflicting information, how should agent handle contradictions? → A: Agent chooses best recommendation using prioritization criteria (most recent > parent branch > higher confidence), includes provenance citation showing which branch was chosen and why, user can edit consolidated output if they disagree

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Branch Conversations for Parallel Exploration (Priority: P1)

A user exploring a complex topic wants to try multiple approaches simultaneously without losing context between threads. They need to branch their conversation to explore different angles (e.g., "RAG approach" vs "Fine-tuning approach") while maintaining the original exploration context.

**Why this priority**: This is the foundational capability that differentiates us from linear chatbots (ChatGPT/Claude). Without branching, we're just another AI chat. This enables the core exploration workflow.

**Acceptance Scenarios**:

1. **Given** user is in a conversation about "AI Agent Architecture", **When** they click "Create Branch" and name it "RAG Deep Dive", **Then** system creates a new branch with parent context inherited (explicit files as context references only, not messages) and displays parent-child relationship in branch selector dropdown with hierarchical indentation (Main → RAG Deep Dive)
2. **Given** user is exploring "RAG vs Fine-tuning" in Main branch, **When** agent detects topic divergence (semantic distance >0.7) and suggests "This seems like a different exploration path. Create branch for Fine-tuning?", **Then** user can approve/reject, and if approved, system creates "Fine-tuning" branch with inherited context
3. **Given** user has 3 branches (Main → RAG, Main → Orchestration), **When** user switches between branches, **Then** each branch maintains separate conversation history while sharing explicitly added files from parent
4. **Given** user is in Branch A, **When** they send message asking about concept from Branch B, **Then** system does NOT automatically access Branch B context (context isolation by default, semantic search can find files created in Branch B if relevant)
5. **Given** agent identifies opportunity for parallel exploration ("I could explore RAG in one branch and Orchestration in another"), **When** agent proposes branch creation with `create_branch(title, context_files)`, **Then** user sees approval prompt with proposed branch name and context, can approve/reject

---

### User Story 2 - Capture Artifacts with Provenance (Priority: P2)

A user wants AI to create files (analysis documents, summaries, decision docs) from conversation insights and have those files automatically track which conversation created them, when, and why. Files should be persistent and reusable across all conversations.

**Why this priority**: Artifact capture is what makes exploration persistent. Without this, insights evaporate like in ChatGPT. This enables the "Capture" step in our workflow (Explore → Capture → Reference → Consolidate).

**Acceptance Scenarios**:

1. **Given** user is in "RAG Deep Dive" branch and asks "create a summary of RAG best practices", **When** agent proposes file creation with `write_file(path="rag-analysis.md", content)`, **Then** user sees approval prompt with file path, preview, and can approve/reject
2. **Given** user approves file creation, **When** file is created, **Then** system stores provenance metadata (created_in_conversation_id, creation_timestamp, context_summary) and generates embeddings + node_summary (title, structure, key concepts)
3. **Given** file "rag-analysis.md" was created in Branch A, **When** user creates new Branch B from Main, **Then** system can surface "rag-analysis.md" via semantic search when relevant to Branch B context (cross-branch discovery)
4. **Given** user views file "rag-analysis.md" in file editor, **When** they hover over provenance indicator, **Then** system shows "Created in: RAG Deep Dive branch, 2 hours ago, Context: RAG best practices discussion"
5. **Given** agent creates file "rag-analysis.md" in conversation, **When** next message is sent in same conversation, **Then** file is auto-included in explicit context (agent remembers what it just created)
6. **Given** agent streams response with multiple tool calls ("Let me create analysis.md [tool_call] and also update config.md [tool_call]"), **When** user rejects first tool call, **Then** stream pauses, system sends rejection to agent with context, agent revises plan, stream resumes with revised strategy (second pending tool call is discarded, agent may propose different approach)

---

### User Story 3 - Cross-Branch Context Discovery (Priority: P3)

A user working in one branch wants to discover and reference relevant files created in sibling branches or parent branches without manually searching. System should surface contextually relevant files from across the exploration tree using semantic similarity.

**Why this priority**: This enables the "Reference" step in our workflow. Without cross-branch discovery, branches become isolated silos. This is what makes the exploration tree more valuable than isolated conversations.

**Acceptance Scenarios**:

1. **Given** user created "rag-analysis.md" in Branch A and "orchestration-notes.md" in Branch B, **When** user is in Main branch and asks "compare RAG and orchestration approaches", **Then** semantic search surfaces both files as relevant context (shown in "Semantic matches" section of context panel)
2. **Given** user is in Branch B discussing orchestration, **When** system finds "rag-analysis.md" from sibling Branch A has high semantic similarity (>0.8), **Then** system shows "rag-analysis.md" in semantic matches with sibling relationship indicator (+0.15 weight boost)
3. **Given** user manually adds file "rag-analysis.md" from Branch A to Branch B context, **When** user sends message, **Then** file appears in "Explicit context" section with provenance indicator (from Branch A) and gets 100% weight in context allocation
4. **Given** user types "@rag" in message input, **When** autocomplete dropdown appears, **Then** system shows matching files across all branches with branch indicators ("rag-analysis.md [RAG Deep Dive]")
5. **Given** user has 10+ branches with 50+ files, **When** user asks ambiguous question, **Then** context assembly applies relationship modifiers (siblings +0.15, parent/child +0.10) and temporal decay to prioritize recent, related content

---

### User Story 4 - Consolidate from Exploration Tree (Priority: P4)

A user who has explored a topic across multiple branches (e.g., Branch A: RAG, Branch B: Orchestration, Branch C: Prompting) wants to consolidate findings from all branches into a single comprehensive document with provenance tracking (which insights came from which branch).

**Why this priority**: This enables the "Consolidate" step in our workflow (Explore → Capture → Reference → Consolidate → Ship). This is where parallel exploration becomes more valuable than linear chat - user can synthesize multiple exploration paths.

**Acceptance Scenarios**:

1. **Given** user has explored topic across 3 branches (RAG, Orchestration, Prompting) with artifacts in each, **When** user returns to Main branch and says "generate comprehensive AI agent decision document from all branches", **Then** agent traverses tree, accesses artifacts from all child branches, and proposes consolidated document with provenance citations ("RAG approach from Branch A", "Orchestration from Branch B")
2. **Given** agent is consolidating from multiple branches, **When** agent generates content, **Then** system includes provenance in AI prompts ("This came from Branch A: RAG Deep Dive") so agent can cite sources in output
3. **Given** consolidated document references insights from Branch A and Branch B, **When** user views document, **Then** provenance metadata shows source branches for each section (e.g., "Section 2.1: From RAG Deep Dive branch")
4. **Given** user approves consolidated document creation, **When** file is created, **Then** system stores provenance with multiple source conversations (created from Main, references Branch A + Branch B + Branch C)
5. **Given** user has deeply nested branches (Main → A → A1, Main → B → B1 → B2), **When** consolidation happens, **Then** agent can traverse full tree depth to gather all relevant artifacts (tree traversal for consolidation)

---

### User Story 5 - Provenance Transparency & Navigation (Priority: P5)

A user wants to understand where files came from, which conversation created them, and navigate back to the source conversation to see the full context that led to artifact creation. This builds trust and enables exploration traceability.

**Why this priority**: Provenance transparency is critical for trust ("where did this come from?") and navigation ("how did I arrive at this insight?"). This is the connective tissue that makes branching + filesystem a unified system, not separate features.

**Acceptance Scenarios**:

1. **Given** user views file "rag-analysis.md" in context references, **When** they click provenance indicator, **Then** system shows modal with: source branch name, creation timestamp, context summary (2-3 sentences about what the conversation was exploring), and "Go to source conversation" link
2. **Given** user clicks "Go to source conversation", **When** navigation happens, **Then** system opens source branch at the exact message where file was created, with highlight on the creation event
3. **Given** user is in conversation viewing context panel, **When** they hover over file in "Semantic matches" section, **Then** tooltip shows: "From: RAG Deep Dive branch (sibling, +0.15 weight), Created: 2 hours ago, Relevance: 0.87"
4. **Given** user has Visual Tree View enabled (Phase 3), **When** they click on file node in tree, **Then** system highlights all conversations that referenced this file (provenance graph visualization)
5. **Given** file was created in Branch A and later edited in Branch B, **When** user views provenance, **Then** system shows creation info and most recent edit info ("Created in Branch A, Last edited in Branch B by agent")

---

### Edge Cases

**Branching & Context**:

- ✅ **RESOLVED**: What happens when user creates branch from branch (nested branches) - does context inherit from immediate parent only or accumulate from root? → Inherit from immediate parent only: explicit files + parent summary + parent's last message + branching message (if agent-created)
- ✅ **RESOLVED**: How does system handle deeply nested branches (10+ levels) - performance and context limits? → No hard limits on nesting depth or branch count beyond billing plan quotas. System designed to scale gracefully with optimized tree traversal and context assembly
- ✅ **RESOLVED**: What happens when parent branch is deleted but child branches exist - orphaned branches behavior? → Prevent parent deletion if children exist (show error: "Cannot delete branch with children. Delete children first.")

**Provenance & Files**:

- ✅ **RESOLVED**: What happens when file is edited outside of originating conversation - how does provenance update? → Update last_edited timestamp, last_edited_by=user, edited_in_conversation_id=null, keep original provenance metadata unchanged (preserves creation context)
- ✅ **RESOLVED**: How does system handle file created in Branch A, edited in Branch B, then edited again in Branch A - multi-branch provenance chain? → No edit history array - just update last_edited timestamp, last_edited_by (agent/user), and edited_in_conversation_id with most recent edit (simple last-edit tracking)
- ✅ **RESOLVED**: What happens when user manually creates file (not via agent) - how is provenance assigned? → No provenance assigned to manually created files. If agent later edits it, track last_edited timestamp and last_edited_by (agent vs user)
- ✅ **RESOLVED**: How does system handle file renames or moves - does provenance persist? → Update all references atomically in transaction (file_id unchanged, update path in all tables), preserve provenance, update shadow entity, maintain navigation and context references

**Consolidation**:

- ✅ **RESOLVED**: What happens when consolidation attempts to access deleted files from archived branches? → Skip deleted files silently and note in consolidation output ("Note: 2 referenced files unavailable")
- ✅ **RESOLVED**: How does system handle consolidation from 20+ branches - context window overflow? → Hybrid context management: prioritize high-relevance artifacts using semantic scoring, compress conversation history with memory chunking, show excluded items in UI for manual inclusion
- ✅ **RESOLVED**: What happens when user consolidates from branches with conflicting information - how does agent handle contradictions? → Agent chooses best recommendation using prioritization (most recent > parent branch > higher confidence), includes provenance citation showing which branch was chosen and why, user can edit output if they disagree

**Cross-Branch Discovery**:

- ✅ **RESOLVED**: What happens when semantic search finds 50+ relevant files across branches - how are results prioritized and limited? → Show top 10 files by final relevance score, prioritize files from related branches (siblings/parent/child) over distant branches
- ✅ **RESOLVED**: How does system prevent irrelevant sibling pollution (Branch A about "agents" and Branch B about "pricing" shouldn't cross-pollinate)? → Use topic divergence filtering: if branch summaries have cosine similarity <0.3, only show semantic matches with relevance >0.9 (high-confidence only from unrelated branches)
- ✅ **RESOLVED**: What happens when user explicitly excludes sibling branches from context - manual override mechanism? → "Hide from [Branch Name]" button in semantic match tooltip/dropdown blacklists branch_id for current conversation, user can view/remove blacklisted branches in context settings (per-conversation scope)

**Performance & Scale**:

- ✅ **RESOLVED**: How does tree traversal perform with 100+ branches? → Performance targets defined in FR-065: <2s for <50 branches, <5s for <200 branches. No hard limits enforced - system scales gracefully
- What happens when provenance metadata grows large (file edited 50+ times across 20+ conversations)?
- What happens when semantic search scale when searching across 1000+ files from 100+ branches? (Performance target: <1s for 1000 entities per FR-064)

**Streaming & Network**:

- ✅ **RESOLVED**: What happens when SSE stream is interrupted mid-response (network disconnect, server error)? → Discard partial message, show error prompt, user must retry request from beginning (simpler for MVP)

---

## Requirements _(mandatory)_

### Functional Requirements

#### Branching & Chat Graph Management

- **FR-001**: System MUST support creating child branches from any conversation with parent-child relationship (DAG structure)
- **FR-002**: System MUST inherit from immediate parent when child branch is created: explicit files (context references) + parent conversation summary + parent's last message + branching message content (if agent-created the branch via `create_branch`)
- **FR-002a**: System MUST NOT accumulate context from entire ancestor chain (nested branches inherit from immediate parent only, not from root or all ancestors)
- **FR-003**: System MUST maintain context isolation between sibling branches by default (Branch A context does not auto-load in Branch B unless semantically matched)
- **FR-004**: System MUST support user-initiated branching via "Create Branch" button in chat header
- **FR-005**: System MUST support agent-initiated branching via `create_branch(title, context_files)` tool call with user approval
- **FR-006**: System MUST support system-prompted branching when topic shift is detected (semantic distance >0.7 from parent conversation)
- **FR-007**: System MUST display branch navigation UI showing current branch, parent, siblings, and children with branch titles in hierarchical tree structure with indentation for nested branches (similar to file tree display pattern)
- **FR-008**: System MUST allow branch renaming by user at any time
- **FR-008a**: System MUST allow branch deletion by user, but MUST prevent deletion if child branches exist (show error: "Cannot delete branch with children. Delete children first."). When branch is deleted, files created in that branch MUST be preserved with provenance cleared: set created_in_conversation_id=null to indicate orphaned status, keep context_summary for historical reference
- **FR-009**: System MUST track branch metadata: parent_id, creation_timestamp, branch_title, creator (user/agent/system)
- **FR-009a**: System MUST generate and maintain conversation summary for each conversation using embeddings/summarization (regenerate summary and embedding from scratch on every message for maximum context freshness, not incremental updates). Summary MUST include: topics discussed, key decisions made, artifacts created, and open questions
- **FR-010**: System MUST support tree traversal (parent → children, children → parent, siblings discovery) for navigation and consolidation

#### Shadow Domain (Unified Semantic Layer)

- **FR-010a**: System MUST maintain a separate `shadow_entities` table as the unified shadow domain for all searchable entities (files, conversations, knowledge graph nodes)
- **FR-010b**: System MUST create shadow entity entry for each domain entity containing: entity_id (reference to source entity), entity_type (file/conversation/kg_node), embedding (768-dim vector), summary (auto-generated 2-3 sentence description), structure_metadata (JSONB entity-specific structure: for files = {outline: headings hierarchy array, key_concepts: string array, main_topics: string array}, for conversations = {topics: string array}, for kg_nodes = {relationships: object})
- **FR-010c**: System MUST generate shadow entity embeddings asynchronously within 2 seconds of source entity creation or modification
- **FR-010d**: System MUST support unified semantic search across all entity types via single query to shadow_entities table ("find files OR conversations OR concepts about RAG")
- **FR-010e**: System MUST update shadow entity summary when source entity changes significantly (files: >20% character diff from last snapshot triggers regeneration of embedding + summary + structure_metadata, conversations: regenerate from scratch on every message, KG nodes: relationship changes)
- **FR-010f**: System MUST delete shadow entity when source entity is deleted (cascade delete or cleanup job)

#### File Creation & Provenance Tracking

- **FR-011**: System MUST create files only via agent tool call `write_file(path, content)` with user approval
- **FR-012**: System MUST store provenance metadata only for agent-created files: created_in_conversation_id, creation_timestamp, context_summary (2-3 sentence description of conversation context)
- **FR-012a**: System MUST NOT assign provenance metadata to manually created files (files created by user outside of agent `write_file` tool)
- **FR-012b**: System MUST track last edit metadata for ALL files (agent-created and manual): last_edited timestamp, last_edited_by (agent/user), edited_in_conversation_id (nullable - null if user manual edit outside conversation, conversation_id if agent edit)
- **FR-012c**: System MUST preserve original provenance metadata when agent-created file is edited (user or agent): update last_edited, last_edited_by, edited_in_conversation_id fields only, do NOT modify created_in_conversation_id or context_summary
- **FR-013**: System MUST create shadow entity for every file (agent-created or manual) with embedding, summary, and structure_metadata containing: outline (headings hierarchy as nested array), key_concepts (extracted concept terms as string array), main_topics (primary topics as string array)
- **FR-014**: REMOVED - Integrated into FR-010b (shadow entity contains structure_metadata)
- **FR-015**: System MUST auto-include newly created files in explicit context for next message in same conversation (agent remembers what it created)
- **FR-016**: System MUST support file editing via agent `write_file(path, updated_content)` with user approval - updates last_edited timestamp, last_edited_by=agent, edited_in_conversation_id
- **FR-017**: System MUST display provenance indicators in file UI only for agent-created files (pills, editor header, file browser) showing source conversation
- **FR-018**: System MUST open file editor with full provenance in header when user clicks file or file reference (source branch, creation timestamp, context summary, last edit info (last_edited_by, edited_in_conversation_id if applicable), "Go to source" link)
- **FR-018a**: System MUST display summarized provenance tooltip on hover over file reference (source branch, creation time, brief context) without opening editor
- **FR-019**: System MUST navigate to source conversation at exact message where file was created when user clicks "Go to source"
- **FR-020**: System MUST handle file renames and moves atomically in transaction: file_id remains unchanged, update path in files table + all context_references + shadow_entity entity_id field, preserve all provenance metadata (created_in_conversation_id, context_summary, last edit fields), update shadow entity summary to reflect new path, maintain all references so "Go to source" navigation and context references continue to work

#### Cross-Branch Context Assembly

- **FR-021**: System MUST perform semantic search across shadow_entities table to find relevant files, conversations, and concepts (not limited to current branch) when building context
- **FR-021a**: System MUST limit semantic search results to top 10 entities by final relevance score (after relationship and temporal modifiers applied), prioritizing entities from related branches (siblings/parent/child) over distant branches
- **FR-021b**: System MUST support entity type filtering in semantic search (e.g., "files only", "conversations only", "all types") based on context assembly needs
- **FR-021c**: System MUST apply topic divergence filtering to prevent irrelevant sibling pollution: when comparing current branch summary to source branch summary via cosine similarity, if similarity <0.3 (topically divergent), only show semantic matches with relevance score >0.9 (high-confidence matches only from unrelated branches)
- **FR-022**: System MUST apply relationship modifiers to relevance scores: siblings +0.10, parent/child +0.15 when entities from related branches match semantically
- **FR-023**: System MUST apply temporal decay to relevance scores based on last_interaction timestamp: `1.0 - (months_since_last_interaction × 0.05)` with floor of 0.3
- **FR-024**: System MUST display context section integrated into chat (above input box, before messages) with collapsible context type groups: (1) Explicit context, (2) Semantic matches, (3) Branch context, (4) Artifacts from this chat, (5) Knowledge graph connections (background), (6) Excluded from context (items that didn't fit in 200K budget, user can manually re-prime)
- **FR-024a**: System MUST use visual priority indicators (color/icon/boundary grouping) to show context priority tiers (Group 1 = highest priority, Group 2 = next, etc.) without exposing numeric weights to users
- **FR-024b**: System MUST build prime context BEFORE sending request to agent, automatically assembling most relevant and optimal data across all domains (files via shadow entities, conversations, KG nodes) so agent can perform actions optimally and determine which tools to call
- **FR-024c**: System MUST complete prime context assembly within 1s of user sending message, prioritizing based on semantic relevance, relationship modifiers, and temporal decay
- **FR-024d**: System MUST display excluded context items in UI (items that were referenced/relevant but didn't fit within 200K context budget after priming) in a separate collapsible section "Excluded from context" with ability to manually re-prime selected items
- **FR-024e**: System MUST implement memory chunking for conversations exceeding 40 messages: compress messages 1-30 into embedding chunks (stored in shadow_entities or conversation_memory table), keep messages 31-40 as full text, retrieve relevant memory chunks semantically per request
- **FR-024f**: System MUST chunk conversation history in batches of 10 messages (messages 1-10 → chunk 1, messages 11-20 → chunk 2, etc.) with each chunk containing: embedding, summary (generated from the 10 messages in that chunk only, not cumulative), message_ids array, timestamp_range
- **FR-024g**: System MUST retrieve top 3 most relevant memory chunks when building context for long conversations (>40 messages), combining: latest 10 full messages + 3 relevant memory chunks (summarized) + files + branch context
- **FR-024h**: System MUST allow manual re-priming of excluded context items: user clicks item in "Excluded from context" section → item promoted to explicit context (1.0 weight) for next request
- **FR-025**: System MUST show provenance indicators in semantic matches section: file name, source branch, relationship type (sibling/parent/child), relevance score
- **FR-025a**: System MUST display summarized provenance data in tooltip on hover (source branch, creation time, relevance) and full provenance in editor header when file is clicked
- **FR-026**: System MUST support @-mention autocomplete for both files and other conversations (chats) with indicators in dropdown ("rag-analysis.md [RAG Deep Dive branch]", "Chat: RAG vs Fine-tuning [Main branch]")
- **FR-026a**: System MUST allow users to @-mention other conversations to add their context to current conversation: conversation summary (from embeddings/summarization) + last 5 messages + all explicit files + all artifacts from @-mentioned conversation. System MUST NOT expand nested @-mentions (depth 1 only): if @-mentioned conversation contains @-mentions to other chats, those are ignored during resolution to prevent circular references and infinite context expansion
- **FR-027**: System MUST prioritize context within 200K token limit using hybrid approach: Explicit references (1.0 weight, never truncated) > Semantic matches (0.5 base + modifiers) > Branch context (0.7 base) > Chat history (latest 10 full messages + top 3 relevant memory chunks if >40 messages, rest excluded but shown in UI)
- **FR-028**: REMOVED - Context budget NOT displayed to users (internal optimization only)
- **FR-029**: System MUST allow manual exclusion of sibling branches from context via "Hide from [Branch Name]" button in semantic match tooltip/dropdown. When clicked, system MUST blacklist that branch_id for current conversation (store in conversation metadata), preventing future semantic matches from that branch. System MUST provide UI in context settings to view and remove blacklisted branches (per-conversation scope)

#### Consolidation from Exploration Tree

- **FR-030**: System MUST support tree traversal for consolidation: agent can access artifacts from all child branches when user requests consolidation
- **FR-031**: System MUST include branch provenance in AI prompts during consolidation ("This came from Branch A: RAG Deep Dive") so agent can cite sources
- **FR-032**: System MUST store consolidated file provenance with multiple source conversations (array of conversation_ids that contributed to consolidated document)
- **FR-033**: System MUST handle context window limits during consolidation using hybrid context management: prioritize high-relevance artifacts from all branches (semantic scoring + relationship modifiers), compress conversation history from each branch using memory chunking (retrieve relevant chunks only), show excluded branches/artifacts in UI with option for user to manually include before consolidation proceeds
- **FR-034**: System MUST provide "Generate report from branches" command in Main branch that triggers tree traversal consolidation workflow
- **FR-035**: System MUST display consolidation status in real-time: "Traversing tree → Gathering artifacts (3/5 branches) → Consolidating → Generating document"
- **FR-035a**: System MUST handle conflicting information during consolidation by instructing agent to choose best recommendation using prioritization criteria: most recent timestamp > parent branch over sibling > higher confidence score from agent's analysis, MUST include provenance citation in consolidated output showing which branch recommendation was chosen and why (e.g., "Using PostgreSQL [from Branch A: Database Selection, most recent]"), user can manually edit consolidated document if they disagree with agent's choice
- **FR-035b**: System MUST skip deleted files during consolidation and note unavailable files in output (e.g., "Note: 2 referenced files unavailable") without failing the consolidation operation

#### Visual Tree View & Navigation (Phase 3)

- **FR-036**: System SHOULD provide visual tree view showing branch hierarchy as interactive graph (desktop only, mobile uses list)
- **FR-037**: Visual tree view SHOULD display branch nodes with titles, creation timestamps, artifact counts
- **FR-038**: Visual tree view SHOULD allow click-to-navigate to any branch
- **FR-039**: Visual tree view SHOULD highlight current active branch
- **FR-040**: Visual tree view SHOULD show provenance graph: clicking file node highlights all conversations that referenced it

#### Filesystem Integration (Shadow Filesystem)

- **FR-041**: System MUST create shadow entity (via shadow_entities table) for all text-based files (.md, .txt) containing embedding, summary, and structure_metadata with: outline (headings hierarchy as nested array), key_concepts (extracted concept terms as string array), main_topics (primary topics as string array)
- **FR-042**: System MUST synchronize shadow entities with file changes within 2 seconds (update embedding, summary, and structure_metadata when content changes by >20% character diff from last snapshot)
- **FR-043**: System MUST generate shadow entity embeddings asynchronously without blocking user interaction
- **FR-044**: System MUST support semantic search using cosine similarity on shadow entity embeddings with pgvector
- **FR-045**: System MUST index folder hierarchy and maintain parent-child relationships in file metadata
- **FR-046**: System MUST detect file renames/moves and update all references atomically in transaction (file_id unchanged, update path in files + context_references + shadow_entity, preserve provenance) within 2 seconds of filesystem change detection

#### Agent Tool Calls & Approval Flow

- **FR-047**: System MUST provide agent tools: `write_file(path, content)`, `create_branch(title, context_files)`, `search_files(query)`, `read_file(path)`, `list_directory(path)`
- **FR-047a**: System MUST stream agent responses via Server-Sent Events (SSE) showing mixed content (text, tool calls, approval prompts) in execution order within same chat message
- **FR-047b**: System MUST support agent message structures with any sequence of content types: text → tool → text → tool → tool → text, etc. (not just single text or single tool per message)
- **FR-047c**: System MUST display loading feedback immediately when user sends message, then stream each content chunk (text/tool) as it arrives from agent
- **FR-048**: System MUST require user approval for write operations (`write_file`, `create_branch`) before execution
- **FR-048a**: System MUST pause stream when agent requests tool call approval, wait for user approval/rejection, then resume streaming after user acts (prevents confusion, clearer causality)
- **FR-048b**: System MUST auto-reject pending approval and terminate SSE stream after 10 minutes of inactivity to release server resources (Edge Function execution, SSE connection, DB connections). System MUST show error message "Approval timed out after 10 minutes. Please retry your request." User must send message again to retry from beginning
- **FR-049**: System MUST show approval prompt with: operation type, affected entities (file path/branch name), preview/summary, approve/reject buttons
- **FR-050**: System MUST apply approved changes immediately and update shadow filesystem + embeddings asynchronously
- **FR-051**: System MUST handle approval rejection by pausing stream, sending rejection context to agent (which tool was rejected, user's reason if provided), prompting agent to revise plan, then resuming stream with agent's revised strategy (subsequent pending tool calls in original stream are discarded)
- **FR-052**: System MUST track all agent tool calls in audit log: tool_name, input_params, output_results, approval_status, timestamp

#### Real-time Updates & Sync

- **FR-053**: System MUST stream agent responses to user via Server-Sent Events (SSE) endpoint, delivering incremental content chunks (text, tool calls, approval prompts) as agent generates them
- **FR-053a**: System MUST discard partial message and show error prompt if SSE stream is interrupted (network disconnect, server error), requiring user to retry request from beginning
- **FR-053b**: System MUST broadcast conversation updates (new messages, branch creation, file creation) to all connected client sessions via Supabase real-time subscriptions
- **FR-054**: System MUST sync context references, branch navigation state, and file updates across devices in real-time (<100ms)
- **FR-055**: System MUST handle concurrent edits with conflict resolution: if user edits file while agent proposes changes to same file, show conflict modal with options (keep user changes, apply agent changes)

#### Security & Privacy

- **FR-056**: System MUST enforce row-level security: users can only access their own conversations, branches, files
- **FR-057**: System MUST sanitize user input before sending to LLM to prevent injection attacks
- **FR-058**: System MUST detect and auto-exclude sensitive files from LLM context: .env, credentials.json, files with API_KEY=, PASSWORD=, SECRET= patterns
- **FR-059**: System MUST audit log all agent actions: request initiation, tool calls, user approvals/rejections, file modifications, errors

#### Usage Tracking & Limits

- **FR-060**: System MUST track usage per user: agent requests count, tokens consumed, files created, branches created
- **FR-061**: System MUST enforce quota limits: Free (100 requests/month), Pro (1000 requests/month), Enterprise (10000 requests/month)
- **FR-062**: System MUST block requests when quota is exceeded and prompt upgrade

#### Performance & Observability

- **FR-063**: System MUST achieve agent response latency <5s for simple queries, <10s for consolidation
- **FR-064**: System MUST achieve semantic search latency <1s for 1000 entities in shadow_entities table, <500ms for <100 entities
- **FR-064a**: System MUST achieve unified shadow entity query latency <300ms for cross-entity-type searches (files + conversations + kg_nodes simultaneously)
- **FR-065**: System MUST achieve tree traversal latency <2s for <50 branches, <5s for <200 branches
- **FR-065a**: System MUST achieve shadow entity creation/update latency <2s (asynchronous, non-blocking) for new or modified entities
- **FR-066**: System MUST log structured logs for all critical operations: agent requests, embeddings, shadow entity operations, file ops, errors
- **FR-067**: System MUST integrate Sentry for error tracking and alerting in production
- **FR-068**: System MUST provide metrics dashboard: request latency (p50/p95/p99), error rates, active users, quota utilization, shadow entity sync lag

---

### Key Entities

- **Shadow Entity**: Unified semantic layer entry for all searchable domain entities - includes shadow_id, entity_id (reference to source file/conversation/kg_node), entity_type (file/conversation/kg_node), embedding (768-dim vector), summary (auto-generated 2-3 sentence description), structure_metadata (JSONB entity-specific: for files = {outline: headings hierarchy nested array, key_concepts: string array of extracted concepts, main_topics: string array of primary topics}, for conversations = {topics: string array}, for kg_nodes = {relationships: object}), last_updated, owner_user_id

- **Conversation (Branch)**: Represents a node in the exploration tree - includes conversation_id, parent_id (nullable for root/Main), branch_title, creation_timestamp, creator (user/agent/system), conversation_summary (auto-generated from shadow entity summary, regenerated from scratch on every message, includes: topics discussed, key decisions made, artifacts created, open questions), messages array, explicit_files (inherited from parent + manually added), parent_last_message (cached from parent for child branch context), branching_message_content (if agent-created via `create_branch`), blacklisted_branches (array of conversation_ids manually excluded from semantic context via "Hide from [Branch Name]"), total_tokens_used, shadow_entity_id (reference to shadow_entities table)

- **Message**: Represents a single turn in conversation - includes message_id, conversation_id, role (user/assistant), content, tool_calls array (for agent messages), timestamp, tokens_used

- **Conversation Memory Chunk**: Compressed conversation history for long conversations (>40 messages) - includes chunk_id, conversation_id, message_ids array (messages compressed in this chunk), embedding (768-dim vector representing chunk content), summary (localized to this chunk only: topics + key decisions + artifacts created + open questions from the 10 messages in this chunk, not cumulative from all prior messages), timestamp_range (start_timestamp, end_timestamp), chunk_index (sequential: chunk 1 = messages 1-10, chunk 2 = messages 11-20, etc.), owner_user_id. Used for semantic retrieval when conversation exceeds manageable size

- **File**: Represents a persistent artifact - includes file_id, path, content, provenance metadata (nullable - only for agent-created files: created_in_conversation_id, creation_timestamp, context_summary), last_edited timestamp, last_edited_by (agent/user), edited_in_conversation_id (nullable - conversation_id if agent edit, null if user manual edit), owner_user_id, shadow_entity_id (reference to shadow_entities table for embedding, summary, structure_metadata)

- **Provenance Metadata**: Embedded in file entity (nullable - only for agent-created files) - includes created_in_conversation_id, creation_timestamp, context_summary (2-3 sentences). Last edit metadata tracked separately for all files via last_edited, last_edited_by, edited_in_conversation_id fields

- **Context Reference** (renamed from "Context Pill"): Represents explicit context in conversation - includes reference_id, conversation_id, entity_type (file/folder/conversation), entity_reference (file_path/folder_path/conversation_id), source (inherited/manual/agent-added/@-mentioned), display_label, added_timestamp, priority_tier (1=highest, 2=medium, 3=lower for visual grouping)

- **Agent Tool Call**: Represents agent action requiring approval - includes tool_call_id, message_id, conversation_id, tool_name (write_file/create_branch/etc), tool_input (JSON params), tool_output (JSON results), approval_status (pending/approved/rejected), timestamp

- **Semantic Match**: Computed entity (not stored) - includes file_id, file_path, relevance_score (base cosine similarity), relationship_modifier (sibling +0.15, parent/child +0.10), temporal_modifier, final_score, source_branch_id, provenance_summary

- **Knowledge Graph Edge** (Background Infrastructure): Represents AI-detected connections - includes edge_id, source_entity_id, source_type (file/conversation/concept), target_entity_id, target_type, relationship_type (relates_to/used_in/evolved_from), confidence_score, creation_timestamp (NOTE: KG runs in background for future V2+ features, not exposed in MVP UI)

- **Audit Log Entry**: Represents logged system event - includes log_id, user_id, conversation_id, event_type (branch_created, file_created, file_edited, approval_requested, approval_granted, approval_rejected), event_details (JSON), timestamp

---

### Non-Functional Requirements

**Performance**:

- Agent responses: <5s for simple queries, <10s for consolidation
- Prime context assembly: <1s from user sending message to context ready for agent
- Semantic search: <1s for 1000 entities across shadow_entities table, <500ms for <100 entities
- Shadow entity queries: <300ms for unified search across all entity types (files + conversations + kg_nodes)
- Tree traversal: <2s for 50 branches, <5s for 200 branches
- Real-time sync: <100ms propagation latency
- Embedding generation: <2s per entity (background, asynchronous)
- Conversation summary update: <2s per message (background, asynchronous)

**Scalability**:

- Support 1000+ files per user (with corresponding shadow entities)
- Support 200+ branches per user (with corresponding shadow entities)
- Support 10,000+ messages per user
- Support 1000+ shadow entities per user across all entity types (files + conversations + kg_nodes)
- Concurrent users: 500 without degradation
- Shadow entity sync throughput: 100+ entities/second for batch operations

**Reliability**:

- 99.9% uptime for core services
- Zero data loss (all operations ACID compliant)
- Graceful degradation if embedding service unavailable (fallback to text search)

**Security**:

- All data encrypted in transit (TLS) and at rest (Supabase encryption)
- Row-level security enforces user isolation
- Sensitive file auto-exclusion prevents credential leakage
- Audit logs retained for 90 days

**Usability**:

- Branching workflow discoverable by new users within 5 minutes (progressive disclosure)
- Provenance indicators visible but not intrusive (hover tooltip, click for full details)
- Context section integrated into chat with visual priority indicators helps users understand what AI sees
- @-mention autocomplete for files and conversations enables quick context addition
- Mobile-responsive (branch nav as drawer, context section collapsible, tree view desktop-only)

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

**Adoption & Engagement**:

- **SC-001**: 70% of users create at least one branch within first week
- **SC-002**: 80% of users who create 3+ branches continue using product after 30 days (retention inflection)
- **SC-003**: Average 5-10 branches created per active user by Week 4
- **SC-004**: 60% of users create at least one file artifact within first week

**Exploration Workflow Validation**:

- **SC-005**: 40% of branches result in file artifact creation (proves Explore → Capture workflow)
- **SC-006**: 30% of branches reference files from sibling branches (proves cross-branch discovery works)
- **SC-007**: 20% of users perform consolidation from 2+ branches by Week 8 (proves Consolidate workflow)
- **SC-008**: Users with 10+ artifacts show 85%+ retention vs 60% for <5 artifacts (proves data lock-in)

**Provenance & Trust**:

- **SC-009**: 50% of users interact with provenance indicators (click/hover) within first week
- **SC-010**: Provenance navigation ("Go to source") used by 30% of users
- **SC-011**: User feedback mentions provenance positively (qualitative validation through surveys)

**Performance**:

- **SC-012**: Agent response latency p95 <5s for simple queries, p95 <10s for consolidation
- **SC-013**: Semantic search returns results in <1s for repositories up to 1000 files
- **SC-014**: Zero critical errors (data loss, failed file creation) in production

**Quality**:

- **SC-015**: 90% approval rate for agent-proposed file creations (proves AI quality)
- **SC-016**: 80% approval rate for agent-proposed branch creations
- **SC-017**: 85% of semantic matches rated as relevant by users (measured via "Dismiss irrelevant" button usage)

**Switching Cost (Long-term)**:

- **SC-018**: Users with 50+ artifacts across 10+ branches show 95% retention (switching cost evident)
- **SC-019**: User attempts to export/migrate to ChatGPT decline to <5% after 50+ artifacts created

---

## Assumptions

**User Behavior**:

- Users exploring complex topics naturally think in parallel paths (validating via user research: researchers, consultants do "compare X vs Y" frequently)
- Users will approve agent-proposed branches when value is clear (validate via >60% approval rate in beta)
- Provenance transparency builds trust rather than creating noise (validate via qualitative feedback)
- Users can learn branching workflow within 5 minutes (validate via onboarding task completion rates)

**Technical**:

- Embeddings-based semantic search (768-dim) provides sufficient accuracy for cross-branch discovery (validate via >80% relevant matches)
- 200K context window with prioritization handles up to 50 branches + 200 files effectively (validate via no context overflow errors in production)
- Topic shift detection (semantic distance >0.7) accurately identifies divergence (validate via >70% user agreement with branch prompts)
- Provenance metadata storage overhead acceptable (<5% database size increase per 1000 files)

**Product Strategy**:

- Branching + filesystem + provenance integration is defensible moat (validate via competitive analysis: ChatGPT/Claude cannot replicate due to UX complexity at 100M scale)
- 8-week MVP timeline achievable with core integration only (defer advanced features to V2+)
- Exploration workspace category resonates with target users (validate via positioning tests with researchers, consultants)

---

## Dependencies

1. **Filesystem Access & Monitoring**: Filesystem watcher (chokidar) for real-time file change detection
2. **Embedding Generation**: OpenAI embeddings API (text-embedding-3-small, 768-dim, $0.02/1M tokens) for shadow entity embeddings
3. **Vector Storage & Search**: Supabase pgvector extension for storing shadow entity embeddings and cosine similarity search across all entity types
4. **Shadow Entity Infrastructure**: Unified `shadow_entities` table with entity_type discriminator for files, conversations, and knowledge graph nodes
5. **Server-Sent Events (SSE)**: SSE endpoint for streaming agent responses (text chunks, tool calls, approval prompts) in real-time to frontend
6. **Real-time Subscriptions**: Supabase real-time for broadcasting updates across devices (conversations, files, shadow entities)
7. **Edge Functions**: Supabase Edge Functions for agent execution, shadow entity generation, embedding creation, tree traversal, SSE streaming
8. **LLM API**: Claude Sonnet 3.5 for agent intelligence (branching, consolidation, file creation, summary generation) with streaming support
9. **Frontend State Management**: Valtio for managing branch navigation, context references, real-time updates, streaming message assembly, prime context display
10. **Authentication**: Supabase Auth for user identity and RLS enforcement (including shadow entity access control)

---

## Out of Scope (Deferred Post-MVP)

**Phase 1-3 (MVP Week 1-8) focuses on core integration only. The following are explicitly deferred:**

**Deferred to V2 (Month 2)**:

- Conversation embeddings (searchable branches by semantic similarity)
- Advanced semantic search (conversation history search, concept search)
- User profile learning (style, preferences, behavioral patterns)
- Interaction tracking (copy rate, regenerate rate, edit before use)

**Deferred to V3 (Month 3)**:

- Divergence penalty (reduce sibling pollution as branches diverge)
- Concept extraction (NER, topic modeling, keyphrase extraction)
- Advanced relevance scoring (interaction boost, divergence modifier)

**Deferred to V4 (Month 4-6)**:

- Templates (save exploration patterns as reusable workflows)
- Collaboration (multi-user shared exploration graphs)
- Marketplace (community templates)

**Deferred to V5 (Month 6-12)**:

- Temporal reasoning (concept evolution timeline)
- Meta-learning (aggregate pattern learning across users)
- Decision history ("what made me change my mind?")

**Explicitly Out of Scope**:

- Branch merging (complex UX, low user demand expected)
- Multi-language support (English only for MVP)
- Binary file support (images, PDFs, videos - text only)
- Code execution/sandboxing (security complexity)
- Offline mode (real-time is core value prop)
- Git integration (auto-commits, PR generation)
- Voice input (text only for MVP)
- Social auth (email/password only for MVP)

---

## MVP Implementation Phases

### Phase 1: Core Integration (Week 1-4)

**Build**:

1. Conversation branching (parent-child DAG in database)
2. File creation with provenance (`write_file` tool, provenance metadata)
3. Context inheritance (copy explicit_files from parent to child branch)
4. Basic cross-branch reference (semantic search across all files with relationship modifiers)
5. Branch navigation UI (left sidebar: current, parent, siblings, children)
6. Context references UI (explicit, semantic matches, branch context sections)

**Validate**:

- Do users understand branching? (>70% create a branch in first week)
- Do they create files? (>60% create at least one artifact)
- Do they reference files across branches? (>30% cross-branch references observed)

**Success Criteria**:

- Branching workflow functional with <2s branch creation latency
- File creation with provenance works with >90% approval rate
- Semantic search finds relevant files from sibling branches with >75% accuracy

---

### Phase 2: Consolidation (Week 5-6)

**Build**:

1. Tree traversal for consolidation (access child branch artifacts)
2. "Generate report from branches" command (consolidation trigger)
3. Provenance in AI prompts ("This came from Branch A: RAG Deep Dive")
4. Consolidated file provenance (multiple source_conversation_ids)
5. Real-time consolidation progress ("Gathering artifacts 3/5 branches")

**Validate**:

- Do users create multi-branch explorations? (>20% of users have 3+ branches)
- Do they consolidate into final outputs? (>20% use consolidation command)
- Is provenance useful or confusing? (qualitative feedback from user interviews)

**Success Criteria**:

- Consolidation from 5 branches completes in <10s
- Provenance citations appear in >80% of consolidated documents
- Users report consolidation saves time vs manual synthesis (survey feedback)

---

### Phase 3: Polish (Week 7-8)

**Build**:

1. Visual tree view (optional, desktop only) showing branch hierarchy
2. Provenance UI enhancements (hover tooltips showing summarized data, click opens editor with full provenance)
3. Better context section visualization (priority tier groupings with visual indicators)
4. @-mention support for other conversations (add chat context to current conversation)
5. Branch search (find branch by name or content)

**Validate**:

- Does tree view help navigation? (>40% of users who enable it continue using it)
- Do users notice/use provenance? (>50% interact with provenance indicators)
- Do priority tier visual indicators help users understand context? (user feedback on clarity)
- Do users @-mention other chats to combine contexts? (>20% usage rate)

**Success Criteria**:

- Tree view renders <1s for 50 branches
- Provenance tooltip appears <100ms on hover, editor opens <300ms on click
- Context section with priority tiers renders <200ms
- @-mention autocomplete for chats appears <300ms

---

## Next Steps

1. **Finalize technical architecture**: Review `arch.md` for database schema, context assembly implementation, agent tool specifications
2. **Design UI/UX**: Review `design.md` for screen layouts, interaction patterns, component specifications
3. **Generate implementation plan**: Run `/speckit.plan` to create detailed implementation roadmap
4. **Generate task list**: Run `/speckit.tasks` to create dependency-ordered tasks for Phase 1-3
5. **Begin implementation**: Start with Phase 1 (Week 1-4) focusing on branching + provenance foundation
