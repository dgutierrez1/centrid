# Design Specification: File System & Markdown Editor

**Feature**: `003-filesystem-markdown-editor`
**Design Date**: 2025-10-22
**Status**: Approved
**Input**: Feature specification from `/specs/003-filesystem-markdown-editor/spec.md` and implementation plan from `/specs/003-filesystem-markdown-editor/plan.md`

**Note**: This template is filled in by the `/speckit.design` command. See `.claude/commands/speckit.design.md` for the execution workflow.

## Overview

A three-panel desktop workspace with hierarchical file management, real-time markdown editing with auto-save, and AI-powered chat integration. Mobile uses single-panel focus view with bottom tab navigation. Designed with formatted markdown preview by default, neutral file selection states, and inline upload progress for contextual feedback.

## Component Architecture

### Component Reusability Assessment

**Existing components checked**:
- Button - ✅ Reused
- Input - ✅ Reused
- Card - ✅ Reused
- Badge - ✅ Reused
- Dialog - ✅ Reused
- Progress - ✅ Reused
- ScrollArea - ✅ Reused
- DropdownMenu - ✅ Reused
- Toggle - ✅ Reused
- Tooltip - ✅ Reused
- MarkdownEditor - ✅ Reused (custom component)
- SaveIndicator - ✅ Reused (custom component)
- FileTree - ✅ Reused (custom component)
- WorkspaceLayout - ✅ Reused (custom component)
- PanelDivider - ✅ Reused (custom component)
- Icons (Folder, Document, Markdown) - ✅ Reused (custom components)

**Component categorization**:

| Component | Location | Reusability Rationale |
|-----------|----------|----------------------|
| MarkdownEditor | `components/` | Used in document editing, chat interface, notes - cross-feature |
| SaveIndicator | `components/` | Used in any auto-save feature - cross-feature |
| FileTree | `components/` | Used in file management, project explorer - cross-feature |
| WorkspaceLayout | `components/` | Used in main app layout - cross-feature |
| PanelDivider | `components/` | Used in multi-panel layouts - cross-feature |
| DesktopWorkspace | `features/filesystem-markdown-editor/` | Feature-specific three-panel screen |
| MobileDocumentView | `features/filesystem-markdown-editor/` | Feature-specific mobile editor |
| MobileChatView | `features/filesystem-markdown-editor/` | Feature-specific mobile chat |
| FileUploadModal | `features/filesystem-markdown-editor/` | Feature-specific upload flow |
| EmptyState | `features/filesystem-markdown-editor/` | Feature-specific empty states |
| ContextMenu | `features/filesystem-markdown-editor/` | Feature-specific file operations |
| SearchResults | `features/filesystem-markdown-editor/` | Feature-specific search UI |

**Created**:

Common (already exist) in `packages/ui/src/components/`:
- MarkdownEditor.tsx - Markdown editing with TipTap (cross-feature reusable)
- SaveIndicator.tsx - Auto-save status display (cross-feature reusable)
- FileTree.tsx - Hierarchical file tree view (cross-feature reusable)
- WorkspaceLayout.tsx - Multi-panel layout primitive (cross-feature reusable)
- PanelDivider.tsx - Resizable panel dividers (cross-feature reusable)
- Icons.tsx - File/folder icon components (cross-feature reusable)

Feature-specific in `packages/ui/src/features/filesystem-markdown-editor/`:
- DesktopWorkspace.tsx - Three-panel desktop layout screen
- MobileDocumentView.tsx - Mobile single-panel editor screen
- MobileChatView.tsx - Mobile chat interface screen
- FileUploadModal.tsx - File upload dialog with progress
- EmptyState.tsx - Empty state screens for all panels
- ContextMenu.tsx - Right-click file operations menu
- SearchResults.tsx - Search results display screen

**Import paths**:
- Common: `import { MarkdownEditor, SaveIndicator, FileTree, WorkspaceLayout } from '@centrid/ui/components'`
- Feature: `import { DesktopWorkspace, MobileDocumentView, FileUploadModal } from '@centrid/ui/features'`

### Design System Showcase

**Location**: `apps/design-system/pages/filesystem-markdown-editor/`

**Routes**:
- http://localhost:3002/filesystem-markdown-editor/ (overview)
- http://localhost:3002/filesystem-markdown-editor/desktop-workspace
- http://localhost:3002/filesystem-markdown-editor/mobile-document
- http://localhost:3002/filesystem-markdown-editor/mobile-chat
- http://localhost:3002/filesystem-markdown-editor/file-upload
- http://localhost:3002/filesystem-markdown-editor/empty-state
- http://localhost:3002/filesystem-markdown-editor/context-menu
- http://localhost:3002/filesystem-markdown-editor/search-results

### Screen-to-Component Mapping

| Screen Name | Component File | Showcase Route | Screenshots |
|-------------|---------------|----------------|-------------|
| Desktop Three-Panel Workspace | `DesktopWorkspace.tsx` | `/filesystem-markdown-editor/desktop-workspace` | `01-desktop-workspace-desktop.png` |
| Mobile Document View | `MobileDocumentView.tsx` | `/filesystem-markdown-editor/mobile-document` | `02-mobile-document-mobile.png` |
| Mobile Chat View | `MobileChatView.tsx` | `/filesystem-markdown-editor/mobile-chat` | `03-mobile-chat-mobile.png` |
| File Upload Interface | `FileUploadModal.tsx` | `/filesystem-markdown-editor/file-upload` | `04-file-upload-desktop.png` |
| Empty State | `EmptyState.tsx` | `/filesystem-markdown-editor/empty-state` | `05-empty-state-desktop.png` |
| Context Menu | `ContextMenu.tsx` | `/filesystem-markdown-editor/context-menu` | `06-context-menu-desktop.png` |
| Search Results View | `SearchResults.tsx` | `/filesystem-markdown-editor/search-results` | `07-search-results-desktop.png` |

### Primitives Used (from @centrid/ui/components)

- Button (variants: default for primary CTAs, ghost for toolbar, icon for file tree actions)
- Input (with validation states for search, chat input)
- Card (for file tree container, search result cards)
- Badge (for file type indicators: Markdown, Text)
- Dialog (for file upload modal)
- Progress (for inline upload progress indicators)
- ScrollArea (for file tree, editor content, chat messages)
- DropdownMenu (for file/folder context menu)
- Toggle (for preview/edit mode switcher)
- Tooltip (for icon button labels)
- Alert (for empty states)
- Separator (for menu dividers)
- MarkdownEditor (custom TipTap-based editor)
- SaveIndicator (custom cloud icon with status)
- FileTree (custom react-arborist wrapper)
- WorkspaceLayout (custom three-panel layout)
- PanelDivider (custom resizable divider)
- Icons (custom Folder, Document, Markdown icons)

## Test Prerequisites

**Prerequisites**:
1. Login with test credentials: test@centrid.local / TestPassword123!
   - If account doesn't exist, create it at `/auth/signup`
   - If account exists, login at `/auth/login`
2. Verify authentication token in localStorage or cookies
3. Navigate to `/workspace`

---

## User Flows

### Flow 1: Create and Edit Document with Auto-Save

**Maps to**: User Story 1 (P1), SC-001, SC-002, SC-003, SC-008

**Goal**: User creates a new markdown document, writes formatted content, and the system automatically saves without manual intervention

**Priority**: P1

**Starting Route**: `/workspace` (Desktop Workspace)

**Steps**:

1. **Action**: Click "New Document" button in file tree toolbar
   - **Component**: `Button` from toolbar in `DesktopWorkspace.tsx`
   - **Selector**: `[data-testid="new-document-button"]`
   - **Expected Behavior**: New untitled document appears in file tree, opens in center editor panel
   - **Playwright**: `await page.click('[data-testid="new-document-button"]')`

2. **Action**: Type document title in editor
   - **Component**: `MarkdownEditor` in center panel
   - **Selector**: `[data-testid="document-editor"]`
   - **Expected Behavior**: Cursor appears in editor, text renders as typed
   - **Playwright**: `await page.fill('[data-testid="document-title-input"]', 'My Test Document')`

3. **Action**: Type content with markdown formatting
   - **Component**: `MarkdownEditor` content area
   - **Selector**: `[data-testid="editor-content"]`
   - **Expected Behavior**: Markdown content renders with formatting preview
   - **Playwright**: `await page.fill('[data-testid="editor-content"]', '# Heading\n\nThis is **bold** and *italic* text.')`

4. **Action**: Apply bold formatting using toolbar
   - **Component**: Formatting button in `MarkdownEditor` toolbar
   - **Selector**: `[data-testid="format-bold-button"]`
   - **Expected Behavior**: Selected text wrapped in markdown bold syntax
   - **Playwright**: `await page.click('[data-testid="format-bold-button"]')`

5. **Action**: Wait 3 seconds for auto-save to trigger
   - **Component**: `SaveIndicator` in editor header
   - **Selector**: `[data-testid="save-indicator"]`
   - **Expected Behavior**: Save indicator shows "Saving..." then "Saved" with green checkmark
   - **Playwright**: `await page.waitForSelector('[data-testid="save-indicator"][data-status="saved"]', { timeout: 5000 })`

**Success Criteria** (from spec.md):
- ✅ SC-001: Document created and editing begins within 3 seconds of clicking "New Document"
- ✅ SC-002: Auto-save persists changes with 99%+ reliability
- ✅ SC-003: File tree updates within 1 second showing new document
- ✅ SC-008: Markdown rendering displays correctly for headers, bold, italic

**Error Scenarios**:
- **Network failure during save**: Save indicator shows "Error" status (red icon), retry button appears
- **Duplicate document name**: System appends "(1)" to name automatically
- **XSS attempt in markdown**: Content sanitized, malicious scripts removed

**Test Data**:
- **Valid content**: "# Test Document\n\nThis is **bold** and *italic* text with a [link](https://example.com)."
- **Large content**: 10,000 words of lorem ipsum (test performance)
- **Invalid (XSS attempt)**: Content with `<script>alert('xss')</script>` (should be sanitized)

**Screenshots**:
- Success: `flow-1-create-edit-success-desktop.png`
- Saving state: `flow-1-saving-desktop.png`
- Error: `flow-1-save-error-desktop.png`

---

### Flow 2: Navigate and Organize Files

**Maps to**: User Story 2 (P1), SC-003

**Goal**: User creates folders, renames items, moves files, and navigates the file tree

**Priority**: P1

**Starting Route**: `/workspace` (Desktop Workspace)

**Steps**:

1. **Action**: Right-click on root folder area
   - **Component**: `FileTree` root area in `DesktopWorkspace.tsx`
   - **Selector**: `[data-testid="file-tree-root"]`
   - **Expected Behavior**: Context menu appears at cursor position
   - **Playwright**: `await page.click('[data-testid="file-tree-root"]', { button: 'right' })`

2. **Action**: Click "New Folder" in context menu
   - **Component**: `ContextMenu` menu item
   - **Selector**: `[data-testid="context-menu-new-folder"]`
   - **Expected Behavior**: New folder appears in tree with inline rename input active
   - **Playwright**: `await page.click('[data-testid="context-menu-new-folder"]')`

3. **Action**: Type folder name in inline input
   - **Component**: Inline rename input in `FileTree`
   - **Selector**: `[data-testid="folder-rename-input"]`
   - **Expected Behavior**: Folder name updates as typed
   - **Playwright**: `await page.fill('[data-testid="folder-rename-input"]', 'My Projects')`

4. **Action**: Press Enter to confirm folder name
   - **Component**: Inline rename input
   - **Selector**: `[data-testid="folder-rename-input"]`
   - **Expected Behavior**: Folder created with name, rename input closes
   - **Playwright**: `await page.press('[data-testid="folder-rename-input"]', 'Enter')`

5. **Action**: Drag existing document to new folder
   - **Component**: File tree item drag handle
   - **Selector Start**: `[data-testid="file-item-test-document"]`
   - **Selector End**: `[data-testid="folder-item-my-projects"]`
   - **Expected Behavior**: Document moves to folder, tree updates immediately
   - **Playwright**: `await page.dragAndDrop('[data-testid="file-item-test-document"]', '[data-testid="folder-item-my-projects"]')`

6. **Action**: Click on document in tree to open
   - **Component**: File tree item
   - **Selector**: `[data-testid="file-item-test-document"]`
   - **Expected Behavior**: Document opens in center editor, marked as active with selection highlight
   - **Playwright**: `await page.click('[data-testid="file-item-test-document"]')`

7. **Action**: Right-click on document and select Delete
   - **Component**: Context menu on file item
   - **Selector**: `[data-testid="context-menu-delete"]`
   - **Expected Behavior**: Confirmation dialog appears
   - **Playwright**: `await page.click('[data-testid="file-item-test-document"]', { button: 'right' }); await page.click('[data-testid="context-menu-delete"]')`

8. **Action**: Confirm deletion
   - **Component**: Confirmation dialog button
   - **Selector**: `[data-testid="confirm-delete-button"]`
   - **Expected Behavior**: Document removed from tree, editor shows empty state
   - **Playwright**: `await page.click('[data-testid="confirm-delete-button"]')`

**Success Criteria** (from spec.md):
- ✅ SC-003: All file tree operations complete within 1 second with smooth visual feedback
- ✅ Folder created with correct name
- ✅ Document moved to correct folder location
- ✅ Document deleted from tree and backend

**Error Scenarios**:
- **Duplicate folder name**: System appends "(1)" or prompts for different name
- **Network error during delete**: Error toast with retry button
- **Moving file to same location**: No-op, visual feedback that file is already there

**Test Data**:
- **Valid folder name**: "My Projects"
- **Invalid name (special chars)**: "Test/Folder" → sanitized to "Test-Folder"
- **Duplicate name**: "My Projects" when folder already exists

**Screenshots**:
- Success: `flow-2-organize-success-desktop.png`
- Context menu: `flow-2-context-menu-desktop.png`
- Delete confirmation: `flow-2-delete-confirm-desktop.png`

---

### Flow 3: Three-Panel Desktop Workspace

**Maps to**: User Story 3 (P1), SC-005

**Goal**: User views three-panel layout with file tree, editor, and chat functioning simultaneously

**Priority**: P1

**Starting Route**: `/workspace` (Desktop Workspace)

**Steps**:

1. **Action**: Load application on desktop browser (width > 1024px)
   - **Component**: `DesktopWorkspace.tsx`
   - **Selector**: `[data-testid="desktop-workspace"]`
   - **Expected Behavior**: Three panels visible with fixed proportions (20%/50%/30%)
   - **Playwright**: `await page.setViewportSize({ width: 1440, height: 900 }); await page.goto('/workspace')`

2. **Action**: Verify all three panels are visible
   - **Component**: Panel containers
   - **Selectors**: `[data-testid="file-tree-panel"]`, `[data-testid="editor-panel"]`, `[data-testid="chat-panel"]`
   - **Expected Behavior**: All three panels rendered with correct widths
   - **Playwright**: `await page.waitForSelector('[data-testid="file-tree-panel"]'); await page.waitForSelector('[data-testid="editor-panel"]'); await page.waitForSelector('[data-testid="chat-panel"]')`

3. **Action**: Type in editor while chat panel is visible
   - **Component**: `MarkdownEditor` in center, AI chat on right
   - **Selector**: `[data-testid="editor-content"]`
   - **Expected Behavior**: Both panels remain visible and functional
   - **Playwright**: `await page.fill('[data-testid="editor-content"]', 'Testing simultaneous panel interaction')`

4. **Action**: Type message in AI chat
   - **Component**: Chat input in right panel
   - **Selector**: `[data-testid="chat-input"]`
   - **Expected Behavior**: Chat message sent, editor remains open and editable
   - **Playwright**: `await page.fill('[data-testid="chat-input"]', 'What is this document about?'); await page.click('[data-testid="chat-send-button"]')`

5. **Action**: Verify no document selected shows empty state
   - **Component**: Empty state in editor panel
   - **Selector**: `[data-testid="editor-empty-state"]`
   - **Expected Behavior**: Empty state with "Create or open a document" message
   - **Playwright**: `await page.click('[data-testid="close-document-button"]'); await page.waitForSelector('[data-testid="editor-empty-state"]')`

6. **Action**: Open document and verify fade-in animation
   - **Component**: Document in file tree
   - **Selector**: `[data-testid="file-item-test-document"]`
   - **Expected Behavior**: Document loads with subtle 200ms fade-in animation
   - **Playwright**: `await page.click('[data-testid="file-item-test-document"]'); await page.waitForSelector('[data-testid="editor-content"][data-loaded="true"]', { timeout: 3000 })`

**Success Criteria** (from spec.md):
- ✅ SC-005: Three-panel layout maintains usability from 1024px to 2560px without horizontal scrolling
- ✅ All panels visible simultaneously
- ✅ Both editor and chat functional at same time
- ✅ Empty state guidance when no document selected
- ✅ Smooth fade-in animation on document load (200ms)

**Error Scenarios**:
- **Viewport too small (<1024px)**: Layout switches to mobile single-panel view
- **Document fails to load**: Error state in editor with retry button

**Test Data**:
- **Viewport sizes**: 1024px, 1440px, 1920px, 2560px (all should work)
- **Chat message**: "What is this document about?"

**Screenshots**:
- Success: `flow-3-three-panel-success-desktop.png`
- Empty state: `flow-3-empty-state-desktop.png`

---

### Flow 4: Upload Documents

**Maps to**: User Story 6 (P2), SC-011, SC-012

**Goal**: User uploads markdown files via file picker or drag-and-drop with progress indication

**Priority**: P2

**Starting Route**: `/workspace` (Desktop Workspace)

**Steps**:

1. **Action**: Click "Upload Documents" button in toolbar
   - **Component**: Upload button in file tree toolbar
   - **Selector**: `[data-testid="upload-documents-button"]`
   - **Expected Behavior**: File upload modal opens
   - **Playwright**: `await page.click('[data-testid="upload-documents-button"]')`

2. **Action**: Select folder destination from dropdown
   - **Component**: Folder selector dropdown in `FileUploadModal.tsx`
   - **Selector**: `[data-testid="upload-folder-select"]`
   - **Expected Behavior**: Dropdown shows folder list (Root, My Projects, etc.)
   - **Playwright**: `await page.selectOption('[data-testid="upload-folder-select"]', 'root')`

3. **Action**: Choose files from file picker
   - **Component**: File input
   - **Selector**: `input[type="file"][data-testid="file-input"]`
   - **Expected Behavior**: Files selected, names displayed in modal
   - **Playwright**: `await page.setInputFiles('[data-testid="file-input"]', ['test-doc.md', 'notes.txt'])`

4. **Action**: Click "Upload" button
   - **Component**: Upload button in modal
   - **Selector**: `[data-testid="start-upload-button"]`
   - **Expected Behavior**: Progress bars appear for each file (0-100%)
   - **Playwright**: `await page.click('[data-testid="start-upload-button"]')`

5. **Action**: Watch upload progress
   - **Component**: Progress indicators in file tree and modal
   - **Selector**: `[data-testid="upload-progress-bar"]`
   - **Expected Behavior**: Progress bars show percentage, files appear in tree as they complete
   - **Playwright**: `await page.waitForSelector('[data-testid="upload-progress-100"]', { timeout: 10000 })`

6. **Action**: Verify files appear in tree
   - **Component**: File tree items
   - **Selector**: `[data-testid="file-item-test-doc"]`, `[data-testid="file-item-notes"]`
   - **Expected Behavior**: Uploaded files visible in tree, modal auto-closes
   - **Playwright**: `await page.waitForSelector('[data-testid="file-item-test-doc"]'); await page.waitForSelector('[data-testid="file-item-notes"]')`

**Success Criteria** (from spec.md):
- ✅ SC-011: File uploads complete within 5 seconds for files <1MB
- ✅ SC-012: Multiple files upload simultaneously, user can continue working
- ✅ Progress indication clear and accurate
- ✅ Files appear in tree immediately after upload

**Error Scenarios**:
- **Unsupported file type**: Upload ".exe" file → Error: "Only .md and .txt files supported"
- **File too large (>10MB)**: Warning dialog before upload or rejection
- **Upload failure mid-transfer**: Error notification with retry button, partial uploads cleaned up
- **Duplicate filename**: System appends "(1)" to avoid conflict

**Test Data**:
- **Valid files**: test-doc.md (500KB), notes.txt (200KB)
- **Invalid type**: test.exe (should be rejected)
- **Large file**: large-doc.md (12MB - should warn/reject)

**Screenshots**:
- Success: `flow-4-upload-success-desktop.png`
- Progress: `flow-4-upload-progress-desktop.png`
- Error: `flow-4-upload-error-desktop.png`

---

### Flow 5: Search Documents

**Maps to**: User Story 7 (P3), SC-004

**Goal**: User searches across all documents and finds relevant content quickly

**Priority**: P3

**Starting Route**: `/workspace` (Desktop Workspace)

**Steps**:

1. **Action**: Click search icon in toolbar
   - **Component**: Search button in file tree toolbar
   - **Selector**: `[data-testid="search-button"]`
   - **Expected Behavior**: Search view opens, focus on search input
   - **Playwright**: `await page.click('[data-testid="search-button"]')`

2. **Action**: Type search query
   - **Component**: Search input
   - **Selector**: `[data-testid="search-input"]`
   - **Expected Behavior**: Debounced search (300ms), results update
   - **Playwright**: `await page.fill('[data-testid="search-input"]', 'testing')`

3. **Action**: Wait for search results
   - **Component**: Search results list
   - **Selector**: `[data-testid="search-results"]`
   - **Expected Behavior**: Results displayed within 1 second, ranked by relevance
   - **Playwright**: `await page.waitForSelector('[data-testid="search-results"]', { timeout: 2000 })`

4. **Action**: Click on search result
   - **Component**: Search result card
   - **Selector**: `[data-testid="search-result-item-0"]`
   - **Expected Behavior**: Document opens in editor, matching text highlighted
   - **Playwright**: `await page.click('[data-testid="search-result-item-0"]')`

5. **Action**: Verify highlighted matches in editor
   - **Component**: Editor content with highlights
   - **Selector**: `[data-testid="search-highlight"]`
   - **Expected Behavior**: Query matches highlighted in yellow/orange
   - **Playwright**: `await page.waitForSelector('[data-testid="search-highlight"]')`

**Success Criteria** (from spec.md):
- ✅ SC-004: Search returns results in under 1 second for up to 1000 files
- ✅ Results ranked by relevance (title matches ranked higher)
- ✅ Matching text highlighted in editor
- ✅ Empty state when no results found

**Error Scenarios**:
- **No results found**: "No results found" message with suggestion to refine query
- **Search query too short (<3 chars)**: Disabled or "Enter at least 3 characters" message
- **Network error during search**: Error message with retry button

**Test Data**:
- **Valid query**: "testing" (should find matches in multiple documents)
- **No matches**: "xyzabc123" (should show empty state)
- **Short query**: "te" (may show validation message)

**Screenshots**:
- Success: `flow-5-search-success-desktop.png`
- Results: `flow-5-search-results-desktop.png`
- No results: `flow-5-search-empty-desktop.png`

---

### Navigation Map

```
Desktop Workspace (default: /workspace)
    ├─ Flow 1: New Document → Editor opens → Type content → Auto-save ✓
    ├─ Flow 2: Right-click → Context Menu → Create/Rename/Move/Delete ✓
    ├─ Flow 3: Three panels visible → Simultaneous editing and chat ✓
    ├─ Flow 4: Upload button → File picker → Progress → Files in tree ✓
    └─ Flow 5: Search button → Type query → Results → Document opens ✓

Mobile Document View (/workspace on mobile)
    ├─ Tap "Chat" tab → Mobile Chat View
    ├─ Tap menu → File tree overlay
    └─ Type in editor → Auto-save → Save indicator

Empty State (/workspace when no documents)
    ├─ Click "New Document" → Flow 1
    ├─ Click "Upload Files" → Flow 4
    └─ Click "New Folder" → Folder created in tree
```

## Screens Designed

### 1. Desktop Three-Panel Workspace

**Showcase Route**: `/filesystem-markdown-editor/desktop-workspace`
**Production Route**: `/workspace`

**Purpose**: Primary desktop view providing simultaneous access to file tree, document editor, and AI chat for efficient knowledge management and AI-assisted workflows

**Layout**: Three-panel horizontal layout with fixed proportions (20% file tree, 50% editor, 30% chat)

**Component Composition**:
- **This screen**: `DesktopWorkspace.tsx` (from `@centrid/ui/features`)
- **Uses common**: FileTree, MarkdownEditor, SaveIndicator, Button, Input, Card, ScrollArea, Badge (from `@centrid/ui/components`)
- **Uses feature**: None (this is the main screen)

**User Interactions**:
- **Click** file in tree: Opens document in center editor panel
- **Click** folder chevron: Expands/collapses folder to show children
- **Right-click** file/folder: Opens context menu with operations (Open, Rename, Delete, Move)
- **Click** toolbar buttons (Search, New File, New Folder, Upload): Triggers respective actions
- **Type** in editor: Content updates with 3-second debounced auto-save
- **Click** B/I/H1/• buttons: Applies markdown formatting to selected text
- **Type** in chat input: Sends message to AI assistant
- **Scroll** file tree/editor/chat: Independent scrolling in each panel

**States**:
- **Default**: Three-panel layout with formatted markdown preview, file tree populated, chat ready
- **Loading**: Skeleton screens while loading file tree, spinner in editor when opening large documents
- **Error**: Inline error in editor for save failures (red indicator), toast for file operations
- **Empty**: Empty state components in panels when no files/document/chat messages
- **Success**: Green checkmark in save indicator

**Screenshots**: `01-desktop-workspace-desktop.png`

**Flow Connections**:
- From: Empty State via "New Document" or direct navigation
- To: File Upload Modal via "Upload" button, Search Results via search, Context Menu via right-click

---

### 2. Mobile Document View

**Showcase Route**: `/filesystem-markdown-editor/mobile-document`
**Production Route**: `/workspace` (mobile viewport)

**Purpose**: Mobile-optimized single-panel document editing view with large touch targets and bottom tab navigation for switching to chat

**Layout**: Single column vertical layout with header, toolbar, editor, and bottom tabs

**Component Composition**:
- **This screen**: `MobileDocumentView.tsx` (from `@centrid/ui/features`)
- **Uses common**: MarkdownEditor, SaveIndicator, Button, Input, MobileHeader (from `@centrid/ui/components`)
- **Uses feature**: None

**User Interactions**:
- **Tap** menu button: Opens file tree overlay
- **Tap** formatting buttons (B, I, H1, •, </>): Applies markdown formatting (44px touch targets)
- **Type** in editor: Content updates with auto-save
- **Tap** "Chat" tab: Switches to Mobile Chat View
- **Scroll** editor: Vertical scroll through document

**States**:
- **Default**: Editor with formatted markdown content, save indicator visible
- **Loading**: Spinner overlay while document loads
- **Error**: Error banner at top of editor
- **Empty**: Empty editor with placeholder text
- **Success**: Save indicator shows "Saved" status

**Screenshots**: `02-mobile-document-mobile.png`

**Flow Connections**:
- From: File tree overlay via file selection
- To: Mobile Chat View via "Chat" tab, file tree via menu button

---

### 3. Mobile Chat View

**Showcase Route**: `/filesystem-markdown-editor/mobile-chat`
**Production Route**: `/workspace` (mobile viewport, chat tab active)

**Purpose**: Mobile chat interface for AI assistant interaction with document context awareness

**Layout**: Single column vertical layout with header, scrollable chat messages, input, and bottom tabs

**Component Composition**:
- **This screen**: `MobileChatView.tsx` (from `@centrid/ui/features`)
- **Uses common**: Card, ScrollArea, Input, Button, MobileHeader (from `@centrid/ui/components`)
- **Uses feature**: None

**User Interactions**:
- **Tap** menu button: Opens file tree overlay
- **Type** in chat input: Composes message to AI
- **Tap** send button: Sends message, triggers AI response
- **Tap** "Document" tab: Switches back to Mobile Document View
- **Scroll** chat: Vertical scroll through message history

**States**:
- **Default**: Chat history with alternating user/AI message bubbles
- **Loading**: Streaming indicator while AI generates response
- **Error**: Error message in chat bubble (red background)
- **Empty**: Empty chat with prompt to create documents first
- **Success**: Message sent confirmation (blue checkmark)

**Screenshots**: `03-mobile-chat-mobile.png`

**Flow Connections**:
- From: Mobile Document View via "Chat" tab
- To: Mobile Document View via "Document" tab, file tree via menu button

---

### 4. File Upload Interface

**Showcase Route**: `/filesystem-markdown-editor/file-upload`
**Production Route**: `/workspace` (upload modal triggered)

**Purpose**: Document upload with drag-and-drop support, folder selection, and inline progress tracking in file tree

**Layout**: Modal dialog with folder selector dropdown, drag-drop zone, and file type restrictions

**Component Composition**:
- **This screen**: `FileUploadModal.tsx` (from `@centrid/ui/features`)
- **Uses common**: Dialog, Button, Progress, Badge, Input, FileTree (from `@centrid/ui/components`)
- **Uses feature**: None

**User Interactions**:
- **Click** "Select folder" dropdown: Choose destination folder (Root, Projects, Research)
- **Click** "Choose files" button: Opens native file picker for .md and .txt files
- **Drag** files from desktop: Hover highlights drop zone, drop triggers upload
- **Click** "Upload" button: Initiates upload with progress indicators
- **Click** "Cancel": Closes modal, cancels pending uploads
- **Watch** progress: Each uploading file shows progress bar in file tree with percentage

**States**:
- **Default**: Modal open with empty drag-drop zone
- **Uploading**: Progress bars for each file (0-100%), uploading files shown in tree with gray background
- **Error**: Error message for failed uploads (red text with retry button)
- **Success**: Completed uploads show green checkmark + "Done", files appear in tree

**Screenshots**: `04-file-upload-desktop.png`

**Flow Connections**:
- From: Desktop Workspace via "Upload" button, Empty State via "Upload Files"
- To: Desktop Workspace after upload completes (auto-close modal)

---

### 5. Empty State

**Showcase Route**: `/filesystem-markdown-editor/empty-state`
**Production Route**: `/workspace` (when no documents exist)

**Purpose**: First-time user experience with clear onboarding guidance and calls-to-action for creating/uploading documents

**Layout**: Three-panel layout (desktop) or single panel (mobile), each with centered empty state content

**Component Composition**:
- **This screen**: `EmptyState.tsx` (from `@centrid/ui/features`)
- **Uses common**: Alert, Button, Icons, Card, WorkspaceLayout (from `@centrid/ui/components`)
- **Uses feature**: None

**User Interactions**:
- **Click** "New Document" (left panel): Creates document, opens in editor
- **Click** "New Folder" (left panel): Creates folder in file tree
- **Click** "Upload Files" (left/center panels): Opens File Upload Modal
- **Click** "Create New Document" (center panel): Same as "New Document"

**States**:
- **Default**: Three empty state zones with icons, headings, descriptions, and CTAs
- **Loading**: N/A (static state)
- **Error**: N/A
- **Empty**: This IS the empty state
- **Success**: N/A (transitions to Desktop Workspace after action)

**Screenshots**: `05-empty-state-desktop.png`

**Flow Connections**:
- From: Direct navigation on first use, Desktop Workspace when last file deleted
- To: Desktop Workspace via "New Document", File Upload Modal via "Upload Files"

---

### 6. Context Menu

**Showcase Route**: `/filesystem-markdown-editor/context-menu`
**Production Route**: N/A (contextual overlay triggered by right-click)

**Purpose**: Right-click file operations menu for efficient file management (open, rename, duplicate, move, delete)

**Layout**: Floating dropdown menu positioned at cursor, appears on right-click

**Component Composition**:
- **This screen**: `ContextMenu.tsx` (from `@centrid/ui/features`)
- **Uses common**: DropdownMenu, DropdownMenuItem, Separator (from `@centrid/ui/components`)
- **Uses feature**: None

**User Interactions**:
- **Right-click** file/folder in tree: Opens menu at cursor position
- **Click** "Open": Opens file in editor (files only)
- **Click** "Rename": Inline rename input appears in tree
- **Click** "Duplicate": Creates copy with "(1)" suffix
- **Click** "Move to...": Opens folder picker dialog
- **Click** "Delete": Shows confirmation dialog, deletes on confirm
- **Click** outside menu: Closes menu
- **Hover** menu items: Gray background highlight

**States**:
- **Default**: Menu hidden until triggered
- **Open**: Menu visible with hover states on items
- **Loading**: N/A
- **Error**: Error toast if operation fails
- **Success**: Action executed, menu closes, tree updates

**Screenshots**: `06-context-menu-desktop.png`

**Flow Connections**:
- From: Desktop Workspace via right-click on file/folder
- To: Desktop Workspace (menu closes after action), inline rename state, delete confirmation dialog

---

### 7. Search Results View

**Showcase Route**: `/filesystem-markdown-editor/search-results`
**Production Route**: `/workspace?search=query`

**Purpose**: Full-text search across all documents with highlighted keyword matches and ranked results for quick content discovery

**Layout**: Vertical list of search result cards with search bar at top

**Component Composition**:
- **This screen**: `SearchResults.tsx` (from `@centrid/ui/features`)
- **Uses common**: Input, Button, Card, Badge, ScrollArea (from `@centrid/ui/components`)
- **Uses feature**: None

**User Interactions**:
- **Type** in search input: Debounced search (300ms), updates results
- **Click** "Search" button: Triggers search immediately
- **Click** result card: Opens document in editor, highlights matching text
- **Scroll** results: Vertical scroll through result list
- **Hover** result card: Gray background highlight

**States**:
- **Default**: Search input with results displayed below
- **Loading**: Spinner in results area while searching
- **Error**: "No results found" message with suggestions to refine query
- **Empty**: "Enter a search query" placeholder
- **Success**: Results displayed with keyword highlights in snippets

**Screenshots**: `07-search-results-desktop.png`

**Flow Connections**:
- From: Desktop Workspace via search icon/button
- To: Desktop Workspace with document open (via result click), Desktop Workspace (via back/close)

---

## Design Tokens Used

### Colors

**Primary Palette**:
- `primary-600` (#FF4D4D) - Primary CTAs (New Document, Upload, Search buttons), coral accent
- `primary-700` (#E63946) - Hover states on primary buttons

**Semantic Colors**:
- `success-500` (#34C759) - Save indicator (saved state), upload completion checkmarks
- `warning-500` (#FF9F0A) - Warnings (file size limits, type restrictions)
- `error-500` (#FF3B30) - Error states (save failures, delete actions, upload errors)

**Neutral Palette**:
- `gray-50` (#F9FAFB) - Light backgrounds (file tree panel, empty states)
- `gray-100` (#F3F4F6) - Selected file background (neutral, not coral)
- `gray-200` (#E5E7EB) - Borders, dividers
- `gray-600` (#52525B) - Secondary text
- `gray-900` (#18181B) - Primary text (headings, file names)

### Typography

**Font Sizes**:
- `text-4xl` (36px) - H1 in markdown content
- `text-2xl` (24px) - H2 in markdown content, section headings
- `text-base` (16px) - Body text, editor content
- `text-sm` (14px) - UI labels, file names, chat messages
- `text-xs` (12px) - Captions, metadata ("Modified 2h ago")

**Font Weights**:
- `font-bold` (700) - Panel titles ("Files", "AI Assistant")
- `font-semibold` (600) - Markdown headings, button labels
- `font-medium` (500) - File names, menu items
- `font-normal` (400) - Body text, chat messages

### Spacing

**Common Spacing Values**:
- `p-6` (24px) - Card padding, panel content padding
- `p-4` (16px) - Panel header padding, button padding
- `gap-4` (16px) - Spacing between toolbar buttons, form elements
- `gap-2` (8px) - Spacing between file tree items, icon-label gaps
- `mb-8` (32px) - Section spacing in modals

### Border Radius

- `rounded` (4px) - Buttons, inputs
- `rounded-md` (8px) - Cards, file tree panel
- `rounded-lg` (12px) - Modals, larger cards
- `rounded-full` - Badges, status indicators

### Shadows

- `shadow-sm` (0px 1px 2px rgba(0,0,0,0.04)) - File tree panel, cards at rest
- `shadow-md` (0px 2px 8px rgba(0,0,0,0.04)) - Context menu, dropdowns
- `shadow-lg` (0px 4px 16px rgba(0,0,0,0.08)) - Modals (upload dialog)

## Implementation Notes

**Container Pattern**: Implementation creates containers in `apps/web/src/components/filesystem/` that wrap designed components with business logic (hooks, state, API calls).

**Import Paths**:
- Common components: `import { MarkdownEditor, SaveIndicator, FileTree } from '@centrid/ui/components'`
- Feature components: `import { DesktopWorkspace, MobileDocumentView, FileUploadModal } from '@centrid/ui/features'`

**Key Principle**: Designed components are pure presentational. Containers add all business logic, data fetching, and state management.

**State Management**:
- File tree state: Valtio store in `apps/web/src/lib/state/filesystem.ts`
- Editor state: Valtio store in `apps/web/src/lib/state/editor.ts`
- Upload queue: Valtio store in `apps/web/src/lib/state/upload.ts`
- Chat state: Valtio store in `apps/web/src/lib/state/chat.ts`

**Real-time Updates**:
- Supabase Realtime subscriptions for file tree changes (create/rename/delete/move)
- Save status updates via Realtime
- Auto-save debounced 3 seconds after last edit

**API Integration**:
- Edge Functions for all file operations: `POST /documents`, `PUT /documents/:id`, `DELETE /documents/:id`, `POST /folders`, etc.
- All mutations via Edge Functions (never direct Supabase client from frontend)
- Edge Functions handle user_id from JWT, validate ownership, enforce RLS

## Validation Checklist

### Component Location ✅

- [x] All `.tsx` files exist in `packages/ui/src/features/filesystem-markdown-editor/`
- [x] NO files in `apps/design-system/components/` (only showcase wrappers in pages/)
- [x] Feature `index.ts` exists and exports all components
- [x] Global `packages/ui/src/features/index.ts` exports this feature

### Import Verification ✅

- [x] Showcase pages successfully import from `@centrid/ui/features`
- [x] No import errors in design-system app
- [x] Components render correctly in showcase

### Screenshots ✅

- [x] All screenshots saved to `apps/design-system/public/screenshots/filesystem-markdown-editor/`
- [x] Desktop versions: 1440×900 viewport (screens 1, 4, 5, 6, 7)
- [x] Mobile versions: 375×812 viewport (screens 2, 3)
- [x] File naming convention: `NN-screen-name-{desktop|mobile}.png`

### Documentation ✅

- [x] Screen-to-Component Mapping table complete and accurate
- [x] All component paths verified
- [x] Design tokens documented
- [x] Implementation guide provided

---

**Design Approved**: 2025-10-22
**Approved By**: Design Review

**Next Steps**:
- Run `/speckit.tasks` to generate implementation tasks
- Tasks will use Screen-to-Component Mapping to create integration tasks
- Run `/speckit.implement` to execute implementation with designed components
