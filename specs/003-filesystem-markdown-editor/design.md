# File System & Markdown Editor - Design Specification

**Feature**: 003-filesystem-markdown-editor
**Status**: Design Complete - Ready for Implementation
**Design Date**: 2025-10-22
**Designer**: Claude Code (/speckit.design workflow)

## Overview

A three-panel workspace for document management, markdown editing, and AI-powered chat. Designed to handle hierarchical file organization with real-time collaboration features and context-aware AI assistance.

## Design Principles Applied

1. **Information Density**: Balanced three-panel layout gives each section appropriate space without overwhelming
2. **Visual Hierarchy**: Primary actions (New Document, Upload) use coral accent, secondary actions use ghost buttons
3. **Mobile-First Responsive**: Mobile design uses bottom navigation to switch between document and chat views
4. **Consistency**: File icons, spacing, and interaction patterns align with Centrid design system
5. **Feedback & Affordance**: Hover states, context menus, and save status indicators provide clear feedback
6. **Accessibility**: Proper focus states, tooltips for icon buttons, semantic HTML structure

## Component Usage (from @centrid/ui)

### Core Components
- **Button** - Primary CTAs, ghost toolbar buttons, icon buttons
- **Input** - Search bars, text inputs, chat input
- **Card** - File tree containers, search result cards
- **Badge** - File type indicators (Markdown, Text)
- **ScrollArea** - File tree, editor content, chat messages
- **Toggle** - Preview/Edit mode switcher
- **Tooltip** - Icon button labels, feature hints
- **DropdownMenu** - File/folder context menu actions
- **Dialog** - File upload modal with folder selection
- **Progress** - Inline upload progress indicators
- **Alert** - Empty states, informational messages
- **Separator** - Visual breaks in menus and content

### Custom Icons (SVG)
All icons implemented as inline SVG components following heroicons style:
- ChevronRight, Folder, FileText, Plus, MoreVertical
- Upload, Cloud, Check, MessageSquare
- Search, FolderPlus, X

## Screen Designs

### 1. Desktop Three-Panel Workspace (1440×900)
**File**: `01-desktop-workspace-desktop.png`

**Layout Structure**:
- **Left Panel (20%)**: File tree with hierarchical folder structure
  - Header: "Files" title + 4 toolbar buttons (Search, New File, New Folder, Upload)
  - ScrollArea with nested folder/file tree
  - Gray background (#F9FAFB dark mode: #1F2937)

- **Center Panel (50%)**: Markdown editor/preview
  - Header: File name + Markdown badge + Preview/Edit toggle + Save status
  - Formatting toolbar (only in edit mode): B, I, H1, •, </>
  - Content area: Formatted markdown preview OR raw textarea editor
  - White background

- **Right Panel (30%)**: AI Assistant chat
  - Header: MessageSquare icon + "AI Assistant" title
  - ScrollArea with chat messages
  - Bottom input: "Ask about your documents..."

**Key Features**:
- Formatted markdown display by default (h1, h2, ul rendered properly)
- Selected file uses gray background (not coral) - neutral selection state
- Save status shows cloud icon + "Saved" indicator
- Collapsible search bar concept (shown at top when open)

**Colors**:
- Primary action buttons: `bg-primary-600` (#FF4D4D coral)
- Borders: `border-gray-200` light, `border-gray-700` dark
- Text: `text-gray-900` headings, `text-gray-600` secondary
- Success indicator: `text-success-500` (#34C759)

### 2. Mobile Document View (375×812)
**File**: `02-mobile-document-mobile.png`

**Layout**:
- Top header: Menu button + file name + save status
- Formatting toolbar: 5 tools (B, I, H1, •, </>) - larger touch targets (44px)
- Editor: Full-screen textarea with monospace font
- Bottom navigation: Document (active) | Chat tabs

**Responsive Adaptations**:
- Single-panel view (no simultaneous file tree + editor + chat)
- Bottom tab bar for view switching
- Larger touch targets for toolbar buttons (min 44px)
- No tooltips (rely on button labels/icons)

### 3. Mobile Chat View (375×812)
**File**: `03-mobile-chat-mobile.png`

**Layout**:
- Top header: Menu button + "AI Assistant" title
- Chat messages: Alternating user/assistant bubbles
  - User messages: `bg-primary-50` light pink background, right-aligned
  - AI messages: `bg-gray-50` gray background, left-aligned
- Bottom input: "Ask about your documents..."
- Bottom navigation: Document | Chat (active)

**Interaction Pattern**:
- Tap Chat tab to switch from document editing to AI conversation
- Maintains context even when switching views

### 4. File Upload with Inline Progress (1440×900)
**File**: `04-file-upload-desktop.png`

**Key Improvements** (based on user feedback):
- **Inline progress indicators** in file tree (not separate modal for progress)
  - Each uploading file shows as file tree item with progress bar
  - Progress percentage displayed on right
  - Completed uploads show green checkmark + "Done"

- **Upload button** opens modal with:
  - Folder selection dropdown (Root, Projects, Research)
  - Drag-drop zone for multiple files
  - File type/size restrictions displayed

**Visual Design**:
- Uploading files: Gray background with red progress bar
- Completed files: Green background with checkmark
- Upload icon on primary button

### 5. Empty State (1440×900)
**File**: `05-empty-state-desktop.png`

**Three Empty State Zones**:

1. **Left Panel (File Tree)**:
   - Folder icon (gray)
   - "No documents yet"
   - "Create your first document or folder to organize your knowledge"
   - Buttons: "New Document" (primary), "New Folder" (ghost), "Upload Files" (ghost)

2. **Center Panel (Editor)**:
   - Document icon (gray)
   - "No document open"
   - "Select a document from the file tree or create a new one to get started"
   - Buttons: "Create New Document" (primary), "Upload Files" (ghost)

3. **Right Panel (AI Chat)**:
   - Chat bubble icon (gray)
   - "Create documents to start chatting with your AI assistant"

**User Feedback Applied**: Added "New Folder" button to empty state for folder management

### 6. Context Menu (1440×900)
**File**: `06-context-menu-desktop.png`

**Menu Items**:
- Open (with file icon)
- Rename
- Duplicate
- --- separator ---
- Move to...
- --- separator ---
- Delete (red text)

**Trigger**: Right-click on any file or folder in tree
**Design Note**: Menu appears at cursor position, auto-shown in demo

### 7. Search Results (1440×900)
**File**: `07-search-results-desktop.png`

**Layout**:
- Top search bar: Input + "Search" button (coral)
- Results summary: "Found 3 results in 0.2 seconds"
- Result cards (vertically stacked):
  - File icon + name + folder badge (top right)
  - Preview snippet with search term highlighted
  - "Modified X ago" timestamp
  - Hover: Gray background, cursor pointer

**Features**:
- Full-text search across all documents
- Keyword highlighting in snippets
- Click result to open document

## Typography

- **Headings**: `font-semibold` weight
  - H1: `text-sm` (14px) - panel titles
  - H2: `text-4xl` (36px) - markdown content
  - H3: `text-2xl` (24px) - markdown content

- **Body**: `text-sm` (14px) for UI, `text-base` (16px) for content
- **Code/Editor**: `font-mono text-sm`
- **Secondary text**: `text-xs text-gray-500`

## Spacing & Layout

- **Panel gaps**: `border-r border-gray-200` (1px borders)
- **Padding**: `p-4` (16px) headers, `p-2` (8px) toolbars, `p-6` (24px) content
- **Gap between elements**: `gap-2` (8px) toolbar, `gap-4` (16px) sections
- **Button spacing**: `h-8 w-8` (32px) icon buttons, `h-9` (36px) regular buttons

## Interactive States

### File Tree Node
- **Default**: `hover:bg-gray-50` light hover
- **Selected**: `bg-gray-100 text-gray-900` (neutral, not coral)
- **Folder expanded**: Chevron rotates down, children visible

### Buttons
- **Primary**: `bg-primary-600 hover:bg-primary-700`
- **Ghost**: `hover:bg-gray-100`
- **Icon**: `hover:bg-gray-100`, tooltip on hover

### Save Status
- **Saved**: Green cloud + checkmark icon, "Saved" text
- **Saving**: Gray cloud (pulsing), "Saving..." text
- **Error**: Red indicator (design TBD)

### Context Menu
- **Item hover**: `bg-gray-100`
- **Delete item**: `text-error-500` red text

## Responsive Breakpoints

- **Desktop**: ≥1024px - Three-panel layout
- **Tablet**: 768-1023px - Consider two-panel (file tree + editor OR editor + chat)
- **Mobile**: <768px - Single panel + bottom tab navigation

## Accessibility Considerations

1. **Keyboard Navigation**:
   - Tab through file tree, toolbar, editor
   - Arrow keys for tree navigation
   - Escape to close menus/dialogs

2. **Focus States**:
   - Visible focus rings on all interactive elements
   - Focus trap in modals

3. **Screen Readers**:
   - Semantic HTML (nav, main, aside)
   - ARIA labels for icon buttons
   - Live region for save status updates

4. **Color Contrast**:
   - All text meets WCAG AA (4.5:1 minimum)
   - Focus indicators meet 3:1 contrast

## Design Tokens Used

### Colors
- `primary-600`: #FF4D4D (coral) - CTAs, active states
- `primary-50`: #FFF5F5 (light coral) - backgrounds
- `success-500`: #34C759 - save indicators
- `error-500`: #FF3B30 - delete actions
- `gray-50` to `gray-900`: Neutral scale

### Shadows
- `shadow-sm`: Subtle card elevation
- `shadow-md`: Dropdown menus
- `shadow-lg`: Modals

### Border Radius
- `rounded`: 4px - buttons, inputs
- `rounded-lg`: 8px - cards, modals

## Animation & Transitions

- **Hover states**: 150ms ease-in-out
- **Folder expand/collapse**: 200ms ease-in-out
- **Modal open**: 200ms fade + scale
- **Save status**: Pulse animation for "Saving" state
- **Search bar collapse**: 300ms ease-in-out

## Implementation Notes

### State Management
- Selected file ID
- Folder expanded states (map)
- Preview mode toggle (boolean)
- Search query string
- Upload progress (0-100)
- Save status enum ('saved' | 'saving' | 'error')

### Real-time Features
- Auto-save on content change (debounced 2s)
- Live sync indicators when collaborators edit
- Real-time chat message streaming

### Performance Considerations
- Virtualize file tree for large directories (>100 items)
- Lazy load markdown preview rendering
- Debounce search input (300ms)
- Virtualize chat message list for long conversations

## Design Decisions & Rationale

### Why formatted markdown preview by default?
User feedback emphasized showing content "as good as possible" - formatted preview is the primary use case, with raw editing as secondary mode.

### Why search at top (collapsed)?
Positions search prominently but doesn't consume vertical space. Users can expand when needed, maintaining clean workspace.

### Why neutral selected file color (gray vs coral)?
Coral draws too much attention to selection. Gray provides clear selection state without overwhelming the interface.

### Why inline upload progress?
Keeps upload feedback contextual - users see exactly where files are landing in the tree structure. Modal used only for initial file selection.

### Why bottom navigation on mobile?
Standard mobile pattern, thumb-friendly, doesn't obstruct content. Allows quick switching between document and chat without menu navigation.

## Next Steps - Implementation Checklist

1. **Component Development** (apps/web/src/components/):
   - FileTreePanel.tsx
   - MarkdownEditor.tsx
   - AIChatPanel.tsx
   - FileUploadDialog.tsx
   - SearchInterface.tsx

2. **State Management**:
   - Define Valtio store for file tree state
   - Document selection/editing state
   - Upload queue management

3. **API Integration**:
   - File CRUD operations
   - Markdown auto-save
   - AI chat streaming
   - Search endpoint

4. **Testing**:
   - Mobile responsive behavior
   - Keyboard navigation
   - File operations (create, rename, delete, move)
   - Upload flow

5. **Accessibility Audit**:
   - Screen reader testing
   - Keyboard-only navigation
   - Color contrast verification

## Design Assets Location

- **Screenshots**: `apps/design-system/public/screenshots/filesystem-markdown-editor/`
- **Component Source**: `apps/design-system/components/FilesystemMarkdownEditor.tsx`
- **Design System Routes**: `apps/design-system/pages/filesystem-markdown-editor/*.tsx`
- **Design Specification**: `specs/003-filesystem-markdown-editor/design.md` (this file)
