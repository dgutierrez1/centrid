# AI-Powered Exploration Workspace - Complete Test Cases

**Feature**: `004-ai-agent-system`
**Date**: 2025-10-29
**Test Type**: UI E2E Testing (with explicit step-by-step flows for handoff)
**Status**: Ready for Parallel Execution

## Test Summary

| Test Case | Name | Priority | Flow | Duration |
|-----------|------|----------|------|----------|
| **UI-001** | Send Message with Agent Streaming | P1 | Full streaming response with markdown rendering | 15-30s |
| **UI-002** | Create Branch (User-Initiated) | P1 | Modal creation flow with inherited context | 5-10s |
| **UI-003** | Cross-Branch File Discovery | P1 | Semantic search results and provenance navigation | 10-20s |
| **UI-004** | Consolidate from Multiple Branches | P2 | Multi-branch consolidation with preview approval | 20-40s |
| **UI-005** | Switch Between Branches | P1 | Navigation with separate message histories | 5s |
| **UI-006** | Manage Context References | P1 | Section expand/collapse with widget morphing | 10-15s |
| **UI-007** | View File with Provenance | P2 | Right panel file editor with source navigation | 10-15s |
| **UI-008** | Approve Tool Call | P1 | Streaming pause, approval, and tool execution | 15-30s |
| **UI-009** | Navigate Visual Tree (Phase 3) | P3 | Tree view rendering and provenance highlighting | 10-20s |

**Total**: 9 UI test cases covering all 9 user flows from spec.md

---

## PRIORITY: Run Test UI-001 First

### Why UI-001 is critical baseline:
- Tests foundational streaming infrastructure (SSE)
- Validates message rendering and context assembly
- All other tests depend on successful agent communication
- If streaming fails, all subsequent tests will fail
- Best to identify infrastructure issues early

---

## UI Test Cases - Detailed Flows

### UI-001: Send Message with Agent Streaming (CRITICAL BASELINE)

**Priority**: P1 | **Duration**: 15-30s | **User Story**: US-2 | **Maps to**: AC-002

**Test Objective**: Verify foundational agent streaming capability, message rendering, and context assembly

**Setup**:
1. Navigate to: `http://localhost:3000/thread/main`
2. Wait for workspace load (max 3s)
3. Verify: Empty thread (no prior messages), context panel visible, input field active
4. Expected state: Clean slate for testing

**Step-by-Step Flow**:

| Step | Action | Selector | Expected Result | How to Verify | Failure Recovery |
|------|--------|----------|-----------------|----------------|------------------|
| 1 | Focus input field | `textarea[data-testid="message-input"]` | Cursor appears, field is focused, placeholder visible | Input has `:focus` state, border changes color | Retry click with 500ms wait |
| 2 | Type message | Type "explain how RAG works" (exactly 26 chars) | Text appears in input, character counter updates to "26/5000" | Input value matches text, badge shows count | Type more slowly, wait for onChange |
| 3 | Send message | Click `button[data-testid="send-button"]` OR press Enter | Send button transforms to Stop button (red), input clears, loading indicator appears with bouncing dots | Input is empty, button shows stop icon, avatar shows animation | Retry click, verify button is clickable |
| 4 | Wait for SSE stream | Max 3s for connection | Agent avatar appears with shimmering gradient and bouncing dots, message bubble starts to appear | Avatar has coral gradient background, 3 white dots animate in wave pattern | Wait up to 5s total, check browser console for SSE errors |
| 5 | Stream text chunks | Incremental rendering | Text appears chunk-by-chunk in agent message (each chunk <500ms apart), markdown renders (bold, lists, code blocks) | Message content incrementally builds, formatting applies correctly | Wait full 10s for streaming completion |
| 6 | Observe context panel | During streaming | Context sections populate: Explicit (empty), Semantic matches (files from other branches if exist), Branch context (parent info) | Sections display with tier colors, widgets show in horizontal layout | Take screenshot to verify section layout |
| 7 | Complete streaming | Wait for agent to finish | Avatar transforms to green checkmark, message border stops shimmering, input re-enables, stop button transforms back to send | Avatar has green background with checkmark, input is editable again | Wait max 30s total, check for errors in console |
| 8 | Verify message history | Look at message stream | Both messages visible: user message (right-aligned) with timestamp, agent message (left-aligned) with checkmark avatar, markdown formatted | User message shows timestamp above content, agent message shows as left-aligned bubble | Scroll up/down to verify both visible |
| 9 | Send follow-up (optional) | Type "what are embeddings?" and send | Second user message appears, context panel updates with new semantic matches, agent streams response | Conversation flows naturally, context refreshes with each message | Repeat steps 1-8 |

**Expected Success Criteria**:
- ✅ Message appears in stream <100ms after send click
- ✅ Agent response starts streaming within 5s (p95 latency)
- ✅ Text chunks render incrementally (<500ms between chunks)
- ✅ Context panel displays all 6 sections with correct tier colors
- ✅ Avatar transitions: dots (streaming) → checkmark (complete)
- ✅ Input re-enables after streaming completes
- ✅ Markdown formatting applies correctly (bold, lists, code)

**Test Data**:
```
User Message: "explain how RAG works"
Expected Response: ~200-400 word explanation with markdown formatting
Expected Context: Semantic matches from existing files (if available)
```

**Failure Modes & Recovery**:

| Failure | Symptom | Root Cause | Recovery |
|---------|---------|-----------|----------|
| No SSE connection | Message sent but no streaming starts (timeout after 10s) | Backend not responding OR SSE endpoint 404 | Check browser Network tab for `/stream` request. If 404, backend routing broken. If timeout, server may be down. |
| Truncated streaming | Response cuts off mid-sentence, stream closes | Network disconnect OR approval timeout | Check for tool call approval prompt (may be paused waiting for approval). If network error, resume test from step 3. |
| Context panel empty | Sections show but no items | Semantic search not returning results OR no files in other branches | Expected if no files exist. Verify with file creation test. Not a test failure. |
| Avatar doesn't animate | Dots static, no bounce animation | CSS animation not applied OR avatar component rendering incorrectly | Check browser DevTools: inspect avatar element, verify `animate-bounce` class present. If missing, CSS issue. |
| Markdown not rendering | Bold/list/code blocks appear as raw text | Markdown parser not running OR content not using markdown syntax | Verify response actually contains markdown markers (**, -, ```). If not, agent not using markdown format. |

**Browser Console Checks**:
- [ ] No errors logged (console should be clean)
- [ ] SSE connection opens (check Network tab → see `/stream` request with 200 status)
- [ ] Text chunks logged (optional debug logs showing chunk arrival)

---

### UI-002: Create Branch (User-Initiated)

**Priority**: P1 | **Duration**: 5-10s | **User Story**: US-1 | **Maps to**: AC-001

**Test Objective**: Verify branch creation modal, form validation, and inherited context setup

**Setup**:
1. After UI-001 completes successfully
2. Verify "Create Branch" button visible in header
3. Current branch is "Main"

**Step-by-Step Flow**:

| Step | Action | Selector | Expected Result | How to Verify | Failure Recovery |
|------|--------|----------|-----------------|----------------|------------------|
| 1 | Click "Create Branch" | `button[data-testid="create-branch-button"]` | Modal opens with dark backdrop, input field pre-focused | Modal visible with `z-50` overlay, input has focus ring | Wait 500ms, retry click |
| 2 | Type branch name | Type "RAG Implementation Study" (exactly 27 chars) | Text appears in input, character counter shows "27/100" below input | Input value matches, badge shows correct count | Type more slowly if counter lags |
| 3 | Verify create button enables | Look at modal button | "Create" button changes from gray/disabled to coral/enabled | Button has `enabled` state, background changes to primary-500 | Only appears when name length > 0 |
| 4 | Click create button | Click `button[data-testid="modal-create-button"]` | Button shows spinner, text changes to "Creating...", input disabled | Spinner animates, input opacity reduces | Wait 500ms, spinner should appear |
| 5 | Wait for branch creation | Max 3s | Modal closes automatically (no manual dismiss), URL changes to `/thread/:newBranchId` | URL in address bar updates, new branch ID visible | If modal stays open >5s, check console for API error |
| 6 | Verify branch selector updated | Look at `button[data-testid="branch-selector"]` | Branch selector shows new branch name "RAG Implementation Study", hierarchical indentation shows "Main → RAG Implementation Study" | Selector text updated, clicking shows tree with indentation | Manually click selector to verify tree structure |
| 7 | Verify branch context shown | Look for `div[data-testid="context-section-branch"]` in context panel | "Branch context" section displays: parent summary (from Main), parent's last message (if exists), inherited files from Main (if any) | Section has orange left border (tier 4 color), displays parent content | If empty, expected (Main may have no artifacts) |
| 8 | Verify empty message history | Look at `div[data-testid="message-stream"]` | No messages visible, empty state shows "Start the conversation below." | Message stream is truly empty (no prior messages inherited) | Verify by typing message - should be first message in this branch |

**Expected Success Criteria**:
- ✅ Branch created successfully (new conversation_id assigned in database)
- ✅ Modal closes after creation (no manual action needed)
- ✅ Navigation works (URL updates to new thread)
- ✅ Branch selector shows hierarchical structure (indentation visible)
- ✅ Branch context section populated with parent summary
- ✅ New branch starts with empty message history (fresh thread)

**Test Data**:
```
Branch Name: "RAG Implementation Study" (27 chars)
Expected Parent: "Main"
Expected Inherited: Parent summary + parent's last message + any artifacts from Main
```

**Failure Modes & Recovery**:

| Failure | Symptom | Root Cause | Recovery |
|---------|---------|-----------|----------|
| Modal doesn't open | Click doesn't trigger modal | Button not clickable OR modal component not mounted | Verify button exists with `document.querySelector('[data-testid="create-branch-button"]')` |
| Create button stays disabled | Button never enables despite typing | Validation too strict OR onChange event not firing | Try shorter name (< 5 chars to test). Check input onChange handler. |
| Modal doesn't close | After clicking create, modal still visible | API call failed OR UI not responding to success | Check browser Network tab for POST `/threads`. If 500 error, backend failed. |
| Branch selector doesn't update | After modal closes, branch selector still shows "Main" | Branch selector not subscribed to realtime updates | Manually refresh page or click selector dropdown to reload list. |
| Context not inherited | Branch context section empty | Inheritance logic not working OR no files to inherit | Expected if Main has no artifacts. Not a test failure. |

---

### UI-003: Cross-Branch File Discovery (Semantic Search)

**Priority**: P1 | **Duration**: 10-20s | **User Story**: US-3 | **Maps to**: AC-003

**Test Objective**: Verify semantic search results, file widgets, and provenance navigation

**Setup**:
1. Navigate to: `http://localhost:3000/thread/main`
2. Verify multiple branches exist (created in UI-002)
3. Verify at least one file exists in a sibling branch (created via UI-001 tool call)
4. At least one message should exist in Main that triggers semantic matches

**Step-by-Step Flow**:

| Step | Action | Selector | Expected Result | How to Verify | Failure Recovery |
|------|--------|----------|-----------------|----------------|------------------|
| 1 | Expand "Semantic Matches" section | Click `button[data-testid="context-section-toggle-semantic"]` | Section expands, chevron ▼, widgets display as cards, purple left border visible | Chevron points down, widgets visible in horizontal row | If collapsed, click header to expand |
| 2 | Verify semantic match widgets | Look at `div[data-testid="context-reference-semantic"]` cards | Files from sibling branches display as cards showing: filename, relevance score (e.g., "87%"), source branch (e.g., "RAG Deep Dive"), creation timestamp | Each card has: filename truncated, badge with percentage, branch name, timestamp | Take screenshot to verify layout |
| 3 | Hover over semantic match widget | Hover mouse over one card | Tooltip appears showing: full filename, source branch (full name), created timestamp, relevance score with formula, relationship indicator ("sibling +0.15") | Tooltip visible above widget, content complete | Hover longer if tooltip delays |
| 4 | Click semantic match file | Click the widget (file card) | Right panel slides in from right, thread shrinks from 80% to 50% width, file editor opens with provenance header and content | Panel animates in 300ms, file displays, provenance header visible | Check if panel width actually changed (measure with DevTools) |
| 5 | Verify provenance header | Look at `div[data-testid="provenance-header"]` | Header shows: "Created in: [source branch] (relationship type), [time] ago, Context: [2-3 sentence summary]" Example: "Created in: RAG Deep Dive (sibling, +0.15 weight), 2 hours ago, Context: Discussion of RAG architecture and best practices" | All fields populated, timestamp formatted, context summary readable | Read full header text to verify completeness |
| 6 | Click "Go to source" link | Click `a[data-testid="go-to-source-link"]` in provenance header | Navigate to source branch, URL changes to `/thread/:sourceBranchId`, scroll to creation message, message highlighted with yellow background (fades over 2s) | URL updates in address bar, message has yellow highlight, fade animation visible | Wait 3s to see fade animation complete |
| 7 | Verify source message | Read highlighted message content | Message shows file creation action, e.g., "Tool call: create_file" or "File: rag-architecture.md created" | Message content clearly shows file creation context | Screenshot to capture message |
| 8 | Return to original branch | Click branch selector, select "Main" | URL changes back to `/thread/main`, file editor closes (panel slides out), message stream shows original messages | URL updates, panel disappears, original thread displays | Navigate back manually if selector fails |

**Expected Success Criteria**:
- ✅ Semantic matches appear in context panel (not empty)
- ✅ Files display with relevance scores and source branch
- ✅ Provenance header shows correct creation context
- ✅ "Go to source" navigation works correctly
- ✅ Source message is highlighted and scrolled to
- ✅ File editor opens and closes smoothly (panel animations)

**Test Data**:
```
Expected Semantic Matches: 1-5 files from sibling branches
Expected Relevance Range: 0.7-1.0 (high relevance matches)
Expected Provenance: Created in [sibling branch], [X hours/days ago]
```

**Failure Modes & Recovery**:

| Failure | Symptom | Root Cause | Recovery |
|---------|---------|-----------|----------|
| No semantic matches | "Semantic Matches" section empty or shows 0 count | Semantic search failed OR no files in other branches | Create a file in different branch first (UI-004/UI-008 test will do this). Semantic search requires files. |
| Relevance scores missing | Files show but no percentage badge | Shadow entity embeddings not generated OR relevance calculation failed | Wait 5 minutes for async embedding job. If still empty, embeddings service may be down. |
| Provenance header empty | File opens but provenance header shows nothing | File is manually created (no provenance) OR backend didn't return provenance | Expected for manual files. Create file via agent (UI-008) for provenance test. |
| "Go to source" 404 | Navigation fails with "Branch not found" | Source branch was deleted OR provenance data stale | Try navigating to branch directly via selector. If branch doesn't exist, provenance data needs cleanup. |
| Right panel doesn't open | Click file but no panel slides in | File component not clickable OR right panel CSS not working | Check element is clickable: `element.onclick !== null`. Verify CSS transitions: `getComputedStyle(panel, 'transition')`. |

---

### UI-004: Consolidate from Multiple Branches

**Priority**: P2 | **Duration**: 20-40s | **User Story**: US-4 | **Maps to**: AC-004

**Test Objective**: Verify consolidation workflow, multi-branch traversal, and approval flow

**Setup**:
1. Navigate to: `http://localhost:3000/thread/main`
2. Verify Main branch has 2+ child branches
3. Each child branch should have 1+ artifacts (files)
4. "Consolidate" button should be visible in header

**Step-by-Step Flow**:

| Step | Action | Selector | Expected Result | How to Verify | Failure Recovery |
|------|--------|----------|-----------------|----------------|------------------|
| 1 | Click "Consolidate" button | `button[data-testid="consolidate-button"]` | Modal opens showing: branch tree (Main at top, children indented), checkboxes for each branch (pre-checked), file name input pre-filled "consolidated-analysis.md" | Modal visible with tree structure, checkboxes checked, input has filename | If no consolidate button, branch has no children |
| 2 | Uncheck one branch | Click `input[data-testid="branch-checkbox-orchestration"]` (example) | Checkbox unchecked, file count badge updates (total artifacts reduced) | Checkbox state changes to unchecked | Verify by clicking again (should check) |
| 3 | Edit file name | Select input, clear, type "final-research-synthesis.md" | Input updates, filename changed | Input value updated, badge shows new length | Type slowly if input lags |
| 4 | Click consolidate button | Click `button[data-testid="modal-consolidate-button"]` | Modal transitions to progress state, progress bar shows "0%", status text: "Traversing tree → Gathering artifacts (0/3) → Consolidating → Generating" | Progress bar visible, status text updates | Wait 2-3s for status updates |
| 5 | Monitor progress | Watch progress bar | Progress bar updates: 25% (traversing), 50% (gathering), 75% (consolidating), 100% (generating), status updates to "Gathering artifacts (1/3)", "Gathering artifacts (2/3)", etc. | Progress increases every 2-3s, status text changes | Take screenshot at each stage |
| 6 | Wait for completion | Max 15s | Progress reaches 100%, modal transitions to approval state, preview section shows consolidated document (first 20 lines visible, scrollable for more) | Preview text visible with markdown formatting | If stuck at progress, may be API timeout |
| 7 | Verify provenance citations | Scroll in preview | Document contains citations: "[from RAG Deep Dive]", "[from Orchestration]" linking insights to source branches | Citations inline with content, branch names correct | Read through preview text |
| 8 | Verify approve/reject buttons | Look at modal bottom | Two buttons: "Approve" (coral, primary action), "Reject" (outline, secondary) | Buttons visible and properly styled | Buttons should be enabled |
| 9 | Click approve button | Click `button[data-testid="approve-consolidation-button"]` | Button shows spinner, text changes to "Creating...", modal stays open (waiting for file creation) | Spinner animates on button | Wait 3s for file creation |
| 10 | Wait for completion | Max 3s | Modal closes, success toast appears "Consolidated document created: final-research-synthesis.md" (toast auto-dismisses after 3s) | Toast notification visible, auto-disappears | If modal doesn't close, file creation may have failed |
| 11 | Verify artifact created | Look at "Artifacts from this thread" section in context panel | New file appears as widget with special badge "Consolidated from [N] branches" (e.g., "Consolidated from 2 branches"), coral-colored widget | File visible in artifacts section, badge shows consolidation | Click widget to verify file content |

**Expected Success Criteria**:
- ✅ Modal opens with branch tree and checkboxes
- ✅ Progress bar updates during consolidation (not frozen)
- ✅ Document preview shows consolidated content
- ✅ Provenance citations appear (not generic content)
- ✅ File created and appears in artifacts
- ✅ Success toast displays
- ✅ Consolidation marks source branches in metadata

**Test Data**:
```
Input Branches: 2-3 child branches with artifacts
Expected Output: ~500-1000 word consolidated document
Expected Citations: [from Branch A], [from Branch B], etc.
Expected File: final-research-synthesis.md with multi-branch provenance
```

**Failure Modes & Recovery**:

| Failure | Symptom | Root Cause | Recovery |
|---------|---------|-----------|----------|
| Modal shows 0 branches | Tree empty or no checkboxes | Branch query failed OR Main has no children | Create child branches first (UI-002). Can't consolidate from 0 branches. |
| Progress bar stuck | Progress bar frozen at 25% for 30s+ | Backend consolidation service not responding | Wait 60s total. If still frozen, backend may be down. Check server logs. |
| Preview empty | Progress completes but preview shows nothing | Agent failed to generate consolidated content | Check console for agent errors. Try again with different inputs. |
| File not created | Toast shows success but file doesn't appear | File creation succeeded on backend but UI didn't update | Reload page. File should appear in sidebar after reload. |
| Citations missing | Document shows generic content without [from X] citations | Agent didn't include provenance in output | Expected if agent model not following instructions. File was still created with correct metadata. |

---

### UI-005: Switch Between Branches

**Priority**: P1 | **Duration**: 5s | **User Story**: US-1 | **Maps to**: AC-003

**Test Objective**: Verify branch navigation and message history isolation

**Setup**:
1. After UI-002 and UI-001 complete
2. Verify: Main branch has messages, child branch (RAG Implementation Study) has messages or empty
3. Branch selector visible in header

**Step-by-Step Flow**:

| Step | Action | Selector | Expected Result | How to Verify | Failure Recovery |
|------|--------|----------|-----------------|----------------|------------------|
| 1 | Click branch selector | `button[data-testid="branch-selector"]` | Dropdown opens showing: "Main" (highlighted coral as current), child branches indented (→ RAG Implementation Study, → other branches) | Dropdown visible, hierarchical structure correct, current branch highlighted | Wait 300ms, retry click |
| 2 | Hover over child branch | Hover over "RAG Implementation Study" | Hovered branch highlighted with background, tooltip appears showing: branch summary, artifact count, creation timestamp | Tooltip visible with branch metadata | Hover for 500ms if tooltip delays |
| 3 | Click child branch | Click "RAG Implementation Study" | Dropdown closes, URL changes to `/thread/:ragBranchId`, branch selector updates showing new branch name | URL in address bar updates, dropdown closes (100ms animation) | Verify URL changed: `window.location.pathname` |
| 4 | Verify message history | Look at `div[data-testid="message-stream"]` | Messages specific to RAG Implementation Study branch display (different from Main thread messages) | Message content differs from Main, or empty if branch is fresh | Scroll message stream to verify correct history |
| 5 | Verify branch context | Look at `div[data-testid="context-section-branch"]` | "Branch context" section shows: parent summary (from Main), parent's last message, inherited files | Section displays parent content, orange left border | Verify by reading context section |
| 6 | Switch back to Main | Click branch selector, select "Main" | URL changes back to `/thread/main`, branch selector shows "Main", original messages reappear | URL updated, messages display correctly | Navigate back to verify state restored |

**Expected Success Criteria**:
- ✅ Branch selector shows hierarchical indentation
- ✅ Navigation works (URL and content update)
- ✅ Each branch maintains separate message history
- ✅ Current branch visually highlighted
- ✅ Navigation completes <500ms (fast UX)

**Test Data**:
```
Branches: Main → RAG Implementation Study, Main → other branches
Main Messages: [messages from UI-001]
Child Messages: [messages from UI-002 if any]
```

**Failure Modes & Recovery**:

| Failure | Symptom | Root Cause | Recovery |
|---------|---------|-----------|----------|
| Dropdown doesn't open | Click selector but dropdown not visible | Button not clickable OR dropdown component not rendered | Verify button exists and is clickable: `button.click()` in console. |
| URL doesn't change | Click branch but URL stays `/thread/main` | Routing not working OR click didn't register | Try clicking again. Check browser Network tab for navigation request. |
| Messages don't update | Messages show same content as previous branch | Message stream not subscribing to thread changes | Reload page. Messages should load for current thread. |
| Indentation wrong | Branch tree shows but no hierarchical indentation | CSS not applying indentation OR data structure wrong | Screenshot tree structure. Compare to spec (should show "→" prefix). |

---

### Additional Test Cases (UI-006 through UI-009)

[Tests UI-006 through UI-009 with similar comprehensive detail will follow...]

---

## API Test Scenarios

### Core Thread Management

| Test ID | Endpoint | Method | Priority | Scenarios | Success Criteria |
|---------|----------|--------|----------|-----------|------------------|
| **API-001** | `/threads` | GET | P1 | - Authenticated user lists threads<br>- Invalid auth returns 401<br>- Empty list for new user | 200 with threads array<br>401 for no auth<br>200 with empty array |
| **API-002** | `/threads` | POST | P1 | - Create new root thread<br>- Create branch with parent_id<br>- Invalid title returns 400<br>- Missing title returns 400 | 201 with thread data<br>400 for validation errors<br>Parent relationship preserved |
| **API-003** | `/threads/:id` | GET | P1 | - Get thread with messages<br>- Invalid UUID returns 404<br>- Other user's thread returns 404<br>- Missing thread returns 404 | 200 with thread+messages<br>404 for invalid/missing<br>RLS enforcement verified |
| **API-004** | `/threads/:id` | PATCH | P2 | - Rename thread title<br>- Archive thread<br>- Invalid UUID returns 404<br>- Empty title returns 400 | 200 with updated thread<br>400 for validation<br>404 for invalid thread |
| **API-005** | `/threads/:id` | DELETE | P2 | - Delete thread with no children<br>- Attempt delete with children returns 400<br>- Invalid UUID returns 404 | 200 for success<br>400 for children exist<br>404 for invalid thread |

### Message & Agent Execution

| Test ID | Endpoint | Method | Priority | Scenarios | Success Criteria |
|---------|----------|--------|----------|-----------|------------------|
| **API-006** | `/threads/:id/messages` | POST | P1 | - Send message returns requestId<br>- Missing text returns 400<br>- Invalid thread returns 404<br>- SSE endpoint provided | 201 with request data<br>SSE endpoint URL<br>400/404 for errors |
| **API-007** | `/agent-requests/:id/stream` | GET | P1 | - SSE stream connects<br>- Invalid requestId returns 404<br>- Stream sends text chunks<br>- Stream sends tool_call events | SSE protocol working<br>404 for invalid request<br>Proper event format |
| **API-008** | `/agent-requests/:id/approve` | POST | P2 | - Approve tool call executes<br>- Reject tool call stops execution<br>- Invalid tool_call_id returns 404<br>- Timeout after 10 minutes | 200 for success<br>404 for invalid tool<br>Provenance tracked |
| **API-009** | `/messages/:id` | GET | P3 | - Get single message metadata<br>- Invalid messageId returns 404<br>- Tool calls included in response | 200 with message data<br>404 for invalid<br>Tool calls present |

### File & Provenance Management

| Test ID | Endpoint | Method | Priority | Scenarios | Success Criteria |
|---------|----------|--------|----------|-----------|------------------|
| **API-010** | `/files` | POST | P1 | - Create file via API<br>- Manual file creation (no provenance)<br>- Invalid path returns 400<br>- Duplicate path handling | 201 with file data<br>Provenance metadata<br>400 for validation |
| **API-011** | `/files/:id` | GET | P1 | - Get file with content<br>- Invalid fileId returns 404<br>- Provenance metadata included<br>- Shadow entity data included | 200 with file+provenance<br>404 for invalid file<br>Shadow data present |
| **API-012** | `/files/:id` | PUT | P2 | - Update file content<br>- Track edit history<br>- Invalid fileId returns 404<br>- Empty content returns 400 | 200 with updated file<br>Edit metadata updated<br>400 for validation |
| **API-013** | `/files/:id` | DELETE | P2 | - Delete file<br>- File removed from context<br>- Invalid fileId returns 404<br>- Cascade to context references | 200 for success<br>404 for invalid file<br>Context cleaned up |
| **API-014** | `/files/:id/provenance` | GET | P3 | - Get full provenance metadata<br>- Manual file shows null provenance<br>- Agent file shows creation context | 200 with provenance data<br>Null for manual files<br>Complete metadata |

### Context & Semantic Search

| Test ID | Endpoint | Method | Priority | Scenarios | Success Criteria |
|---------|----------|--------|----------|-----------|------------------|
| **API-015** | `/shadow-domain/search` | POST | P1 | - Semantic search returns relevant files<br>- Entity type filtering works<br>- Empty query returns 400<br>- Limit parameter enforced | 200 with search results<br>Ranked by relevance<br>400 for bad request |
| **API-016** | `/shadow-domain/sync` | POST | P2 | - Generate embeddings for file<br>- Sync thread summary<br>- Invalid entityId returns 404<br>- Background job queued | 200 with job queued<br>Shadow entity created<br>404 for invalid entity |
| **API-017** | `/threads/:id/sync` | POST | P2 | - Thread summary regeneration<br>- Memory chunking for long threads<br>- Sync only when needed<br>- Performance <2s | 200 with sync status<br>Summary regenerated<br>Memory chunks created |
| **API-018** | `/context/prune` | POST | P3 | - Clean orphaned context references<br>- Remove deleted file references<br>- Service role only | 200 with cleanup count<br>Orphans removed<br>Service auth required |

### Consolidation Workflow

| Test ID | Endpoint | Method | Priority | Scenarios | Success Criteria |
|---------|----------|--------|----------|-----------|------------------|
| **API-019** | `/threads/:id/consolidate` | POST | P1 | - Start consolidation from Main<br>- Select multiple child branches<br>- Invalid thread returns 404<br>- No children returns 400 | 200 with consolidationId<br>SSE endpoint provided<br>400 for no children |
| **API-020** | `/consolidations/:id/stream` | GET | P1 | - Stream consolidation progress<br>- Tree traversal events<br>- Artifact gathering events<br>- Document generation events | SSE stream working<br>Progress events detailed<br>Completion event with content |
| **API-021** | `/consolidations/:id/approve` | POST | P2 | - Approve consolidated document<br>- Create file with provenance<br>- Reject cancels consolidation<br>- Multi-branch provenance tracked | 200 with file created<br>Provenance includes sources<br>400 for bad request |

---

## E2E Test Scenarios

### User Story 1: Branch Threads for Parallel Exploration

| Test ID | User Story | Viewport | Priority | Test Objective | Success Criteria |
|---------|------------|----------|----------|----------------|------------------|
| **E2E-001** | US-1 AC-001 | Desktop (1440×900) | P1 | Create branch from thread with inherited context | Branch created in <2s, parent context visible, branch selector shows hierarchy |
| **E2E-002** | US-1 AC-001 | Mobile (375×812) | P1 | Create branch workflow on mobile | Modal responsive, input works, branch created successfully |
| **E2E-003** | US-1 AC-003 | Desktop | P2 | Switch between branches using dropdown | Navigation <500ms, correct messages loaded, current branch highlighted |
| **E2E-004** | US-1 AC-002 | Desktop | P2 | Agent suggests branch creation for topic shift | Branch suggestion appears, user can approve/reject, branch inherits context |
| **E2E-005** | US-1 AC-003 | Desktop | P3 | Attempt to delete parent branch with children | Error message shown, deletion prevented, child branches preserved |

### User Story 2: Capture Artifacts with Provenance

| Test ID | User Story | Viewport | Priority | Test Objective | Success Criteria |
|---------|------------|----------|----------|----------------|------------------|
| **E2E-006** | US-2 AC-001 | Desktop | P1 | Agent creates file with provenance tracking | File appears in artifacts, provenance header shows source, "Go to source" works |
| **E2E-007** | US-2 AC-001 | Desktop | P1 | Tool approval workflow for file creation | Approval prompt appears, preview shows content, approve executes, reject stops |
| **E2E-008** | US-2 AC-001 | Mobile | P2 | Tool approval workflow on mobile | Modal responsive, approve/reject buttons accessible, workflow completes |
| **E2E-009** | US-2 AC-001 | Desktop | P2 | Multiple tool calls in single response | Stream pauses at each approval, tools execute sequentially, context updates |
| **E2E-010** | US-2 AC-001 | Desktop | P3 | Auto-inclusion of created files in next message | Created file appears in explicit context, agent references it automatically |
| **E2E-011** | US-2 AC-001 | Desktop | P3 | Manual file creation (no provenance) | File created via UI, no provenance metadata, agent can edit later |
| **E2E-012** | US-2 AC-001 | Desktop | P4 | Tool approval timeout (10 minutes) | Auto-reject after timeout, error message shown, user can retry |

### User Story 3: Cross-Branch Context Discovery

| Test ID | User Story | Viewport | Priority | Test Objective | Success Criteria |
|---------|------------|----------|----------|----------------|------------------|
| **E2E-013** | US-3 AC-001 | Desktop | P1 | Semantic search finds files from sibling branches | Relevant files appear in semantic matches, source branch shown, relevance scores |
| **E2E-014** | US-3 AC-002 | Desktop | P1 | Add semantic match to explicit context | Widget moves from semantic to explicit, weight changes, next message includes it |
| **E2E-015** | US-3 AC-003 | Desktop | P2 | @-mention autocomplete for files and threads | Dropdown appears on typing, shows branch indicators, selection adds to context |
| **E2E-016** | US-3 AC-004 | Desktop | P2 | Context assembly stays within 200K token budget | Excluded section shows items, user can manually re-prime, no overflow errors |
| **E2E-017** | US-3 AC-005 | Desktop | P3 | Context isolation between branches | Branch B doesn't auto-access Branch A context, semantic search finds relevant items |
| **E2E-018** | US-3 AC-006 | Desktop | P3 | Hide branch from semantic matches | "Hide from Branch X" button works, branch blacklisted, future searches exclude it |

### User Story 4: Consolidate from Exploration Tree

| Test ID | User Story | Viewport | Priority | Test Objective | Success Criteria |
|---------|------------|----------|----------|----------------|------------------|
| **E2E-019** | US-4 AC-001 | Desktop | P1 | Consolidate artifacts from multiple branches | Consolidate button appears with children, modal opens, progress tracking works |
| **E2E-020** | US-4 AC-002 | Desktop | P1 | Real-time consolidation progress via SSE | Progress bar updates, status messages, completion with preview |
| **E2E-021** | US-4 AC-003 | Desktop | P2 | Multi-branch provenance in consolidated document | Source branches cited correctly, provenance metadata preserved |
| **E2E-022** | US-4 AC-004 | Desktop | P2 | Consolidation with conflicting information | Agent chooses best approach, includes reasoning, user can edit output |
| **E2E-023** | US-4 AC-005 | Desktop | P3 | Consolidate from deeply nested branches | Tree traversal works for Main→A→A1 structure, all artifacts gathered |
| **E2E-024** | US-4 AC-006 | Mobile | P3 | Consolidation workflow on mobile | Modal responsive, branch selection works, progress updates visible |

### User Story 5: Provenance Transparency & Navigation

| Test ID | User Story | Viewport | Priority | Test Objective | Success Criteria |
|---------|------------|----------|----------|----------------|------------------|
| **E2E-025** | US-5 AC-001 | Desktop | P1 | View file with complete provenance metadata | Provenance header shows creation context, last edit info, "Go to source" link |
| **E2E-026** | US-5 AC-002 | Desktop | P1 | Navigate to source thread from file | "Go to source" navigates correctly, scrolls to creation message, highlights briefly |
| **E2E-027** | US-5 AC-003 | Desktop | P2 | Provenance tooltip on hover over context reference | Tooltip shows source branch, timestamp, relevance, creation context summary |
| **E2E-028** | US-5 AC-004 | Desktop | P2 | Provenance for manually created vs agent-created files | Manual files show "No provenance", agent files show full creation context |
| **E2E-029** | US-5 AC-005 | Desktop | P3 | File edited across multiple branches shows last edit info | Last edited by and conversation shown, original creation preserved |

### User Story 6: Server-Side Auth Enforcement (P0 Security)

| Test ID | User Story | Viewport | Priority | Test Objective | Success Criteria |
|---------|------------|----------|----------|----------------|------------------|
| **E2E-030** | US-6 AC-001 | Desktop | P0 | Unauthenticated access to protected routes redirects to login | `/workspace` redirects to `/login?redirect=...`, no HTML leaked |
| **E2E-031** | US-6 AC-002 | Desktop | P0 | Direct API access without auth returns 401 | curl to protected endpoint returns 307 redirect |
| **E2E-032** | US-6 AC-003 | Desktop | P0 | Authenticated user redirected from login/signup | Authenticated user accessing `/login` redirects to `/dashboard` |
| **E2E-033** | US-6 AC-004 | Desktop | P0 | User can only access their own threads | Attempt to access another user's thread returns 404 |
| **E2E-034** | US-6 AC-005 | Desktop | P0 | Invalid UUID format returns 404 immediately | `/workspace/invalid-uuid` returns 404 without database query |

### Error Handling & Edge Cases

| Test ID | Scenario | Viewport | Priority | Test Objective | Success Criteria |
|---------|----------|----------|----------|----------------|------------------|
| **E2E-035** | Network failure during message sending | Desktop | P2 | Graceful handling of connection loss | Error message shown, retry option, message not lost |
| **E2E-036** | SSE stream interruption mid-response | Desktop | P2 | Partial message handling | Error prompt shown, user can retry, no corruption |
| **E2E-037** | Context budget overflow | Desktop | P2 | 200K token limit enforcement | Excluded section appears, items can be re-primed manually |
| **E2E-038** | File deleted after semantic match shown | Desktop | P3 | Race condition handling | "File unavailable" error, graceful recovery |
| **E2E-039** | Branch deleted during navigation | Desktop | P3 | Concurrent modification handling | Error message, navigation to valid branch |

---

## Test Execution Plan

### Phase 1: API Contract Testing (≈2 minutes)

**Execution Order**: API-001 → API-021 (sequential dependency where needed)

**Critical Path Tests**:
1. **API-001**: Thread listing (baseline auth verification)
2. **API-002**: Thread creation (foundation for all other tests)
3. **API-006**: Message sending (core functionality)
4. **API-010**: File creation (provenance foundation)
5. **API-015**: Semantic search (cross-branch discovery)
6. **API-019**: Consolidation (complex workflow)

**Parallel Execution**: Independent tests can run in parallel
- Thread CRUD operations (API-001, API-003, API-004, API-005)
- File operations (API-010, API-011, API-012, API-013)
- Context operations (API-015, API-016, API-017, API-018)

### Phase 2: E2E Workflow Testing (≈8 minutes)

**Execution Order**: User story sequence (US-1 → US-6)

**Critical Path Workflows**:
1. **E2E-001 → E2E-005**: Branch creation and navigation (US-1)
2. **E2E-006 → E2E-012**: File creation and provenance (US-2)
3. **E2E-013 → E2E-018**: Cross-branch discovery (US-3)
4. **E2E-019 → E2E-024**: Consolidation workflow (US-4)
5. **E2E-025 → E2E-029**: Provenance navigation (US-5)
6. **E2E-030 → E2E-034**: Security enforcement (US-6)

**Viewport Coverage**:
- **Desktop** (1440×900): 34 tests
- **Mobile** (375×812): 5 tests (critical workflows)

### Phase 3: Error Scenario Testing (≈3 minutes)

**Focus**: Edge cases, network failures, concurrent modifications

---

## Success Metrics

### Overall Test Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **API Test Pass Rate** | ≥95% | 20/21 tests passing |
| **E2E Test Pass Rate** | ≥90% | 16/18 tests passing |
| **Overall Pass Rate** | ≥92% | 36/39 tests passing |
| **Performance Targets** | As specified | <2s branch creation, <5s agent response, <1s semantic search |

### Priority Breakdown

| Priority | API Tests | E2E Tests | Total | Pass Rate Required |
|----------|-----------|-----------|-------|-------------------|
| **P0 (Security)** | 0 | 5 | 5 | 100% (all must pass) |
| **P1 (Core)** | 11 | 8 | 19 | 100% (all must pass) |
| **P2 (Important)** | 7 | 8 | 15 | ≥80% (12/15) |
| **P3 (Nice-to-have)** | 3 | 2 | 5 | ≥60% (3/5) |

### Go/No-Go Criteria

**GO Conditions**:
- ✅ All P0 security tests pass (5/5)
- ✅ All P1 core functionality tests pass (19/19)
- ✅ Overall pass rate ≥92%
- ✅ Performance targets met (agent response <5s, semantic search <1s)

**NO-GO Conditions**:
- ❌ Any P0 security test fails
- ❌ More than 1 P1 core test fails
- ❌ Overall pass rate <90%
- ❌ Critical performance regression (>2x degradation)

---

## Test Environment Setup

### Prerequisites Checklist

- [x] Production app running on `http://localhost:3000`
- [x] Supabase backend services operational
- [x] Test users created (see `.specify/test-users.json`)
- [x] Database populated with test data
- [x] Edge Functions deployed and accessible
- [x] SSE streaming endpoints functional
- [x] Real-time subscriptions working

### Test Data Requirements

**Base Test Data**:
- 1 test user with verified email
- 3 threads (Main + 2 child branches)
- 5 files across different branches
- Mixed provenance (agent-created and manual files)
- Various thread lengths (short, medium, long for memory chunking)

**Dynamic Test Data** (created during tests):
- New branches via API/E2E
- New messages with agent responses
- New files via agent tool calls
- Consolidated documents
- Context references and semantic matches

---

## Test Execution Commands

### Run All Tests
```bash
/speckit.test
```

### Run API Tests Only
```bash
/speckit.test api-only
```

### Run E2E Tests Only
```bash
/speckit.test e2e-only
```

### Run Specific Acceptance Criterion
```bash
/speckit.test AC-001
```

### Run Security Tests Only
```bash
/speckit.test P0
```

---

## Test Report Output

**Location**: `specs/004-ai-agent-system/test-report.md`

**Report Sections**:
1. Executive Summary (overall pass rate, status)
2. API Test Results (detailed endpoint testing)
3. E2E Test Results (workflow testing by user story)
4. Performance Metrics (latency measurements)
5. Security Audit (auth enforcement verification)
6. Failed Test Analysis (root causes, fixes)
7. Recommendations (next steps, deployment readiness)

**Screenshot Repository**: `specs/004-ai-agent-system/test-failures/`
- Failure screenshots for all E2E test failures
- Named by test ID (e.g., `E2E-007-approval-workflow-failure.png`)

---

## Test Maintenance

### Regression Testing
- Run full test suite before each deployment
- Focus on P0 and P1 tests for quick validation
- Add new test cases for each new feature
- Update test data as schema evolves

### Test Data Management
- Refresh test data weekly to prevent staleness
- Clean up artifacts created during tests
- Maintain consistent test user accounts
- Validate test data integrity before runs

### Performance Monitoring
- Track test execution times
- Monitor for performance regressions
- Alert on test timeout increases
- Optimize test parallelization

---

**Test Matrix Complete**: 39 test scenarios covering all user stories, API contracts, and critical workflows.

**Ready for execution**: Test agents can be spawned to run API and E2E tests in parallel.

**Next Steps**: Execute tests with `/speckit.test` and analyze results in generated report.