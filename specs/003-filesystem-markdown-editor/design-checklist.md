# File System & Markdown Editor - Implementation Checklist

**Feature**: 003-filesystem-markdown-editor
**Design Reference**: `specs/003-filesystem-markdown-editor/design.md`
**Screenshots**: `apps/design-system/public/screenshots/filesystem-markdown-editor/`

## Pre-Implementation Setup

- [ ] Review design specification (`design.md`)
- [ ] Review all 7 screenshots to understand visual requirements
- [ ] Ensure `@centrid/ui` components are up to date
- [ ] Verify Tailwind CSS prose plugin is installed for markdown styling

## Component Development

### 1. File Tree Panel (`apps/web/src/components/documents/FileTreePanel.tsx`)

- [ ] Create FileTreePanel component with toolbar (Search, New File, New Folder, Upload)
- [ ] Implement FileTreeNode component with:
  - [ ] Folder expand/collapse animation
  - [ ] File/folder icon switching
  - [ ] Selection state (gray background, not coral)
  - [ ] Hover states
  - [ ] Context menu trigger (right-click)
- [ ] Add ScrollArea for vertical overflow
- [ ] Implement recursive tree rendering for nested folders
- [ ] Add tooltips to toolbar icon buttons
- [ ] Wire up search, create, and upload actions

**Design Reference**: Screenshots 01, 05, 06
**Components Used**: Button, ScrollArea, Tooltip, TooltipProvider

### 2. Markdown Editor (`apps/web/src/components/documents/MarkdownEditor.tsx`)

- [ ] Create MarkdownEditor component with header section:
  - [ ] File name display
  - [ ] File type badge (Markdown, Text, etc.)
  - [ ] Preview/Edit toggle button
  - [ ] Save status indicator (Saved, Saving, Error)
- [ ] Implement formatting toolbar (visible in edit mode only):
  - [ ] Bold, Italic, Heading, List, Code buttons
  - [ ] Tooltips for each tool
  - [ ] Button click handlers for markdown insertion
- [ ] Create preview mode:
  - [ ] Use Tailwind prose classes with custom styling
  - [ ] Render markdown to HTML (consider `react-markdown` or `remark`)
  - [ ] Apply custom typography (h1: 36px, h2: 24px, etc.)
- [ ] Create edit mode:
  - [ ] Textarea with monospace font
  - [ ] Auto-resize to content
  - [ ] Syntax highlighting (optional enhancement)
- [ ] Implement auto-save:
  - [ ] Debounce input changes (2 seconds)
  - [ ] Update save status during save operation
  - [ ] Handle save errors

**Design Reference**: Screenshots 01, 02
**Components Used**: Badge, Toggle, Button, ScrollArea, Tooltip

### 3. AI Chat Panel (`apps/web/src/components/chat/AIChatPanel.tsx`)

- [ ] Create AIChatPanel component with header
- [ ] Implement message list:
  - [ ] Alternating user/AI message styling
  - [ ] User messages: light pink background, left-aligned
  - [ ] AI messages: gray background, right-aligned
  - [ ] Auto-scroll to latest message
- [ ] Add chat input at bottom:
  - [ ] Input field with placeholder
  - [ ] Send button or Enter key handler
- [ ] Integrate real-time streaming (if applicable)
- [ ] Add empty state for no messages

**Design Reference**: Screenshots 01, 03
**Components Used**: Input, ScrollArea, Card (for message bubbles)

### 4. File Upload Dialog (`apps/web/src/components/documents/FileUploadDialog.tsx`)

- [ ] Create upload dialog/modal with:
  - [ ] Folder selection dropdown
  - [ ] Drag-and-drop zone
  - [ ] File type/size restrictions display
  - [ ] Cancel and Upload buttons
- [ ] Implement inline upload progress:
  - [ ] Show uploading files in file tree
  - [ ] Progress bar for each file
  - [ ] Percentage indicator
  - [ ] Completed state with checkmark
- [ ] Handle multiple file uploads
- [ ] Validate file types (.md, .txt, up to 10MB)
- [ ] Clear completed uploads after delay

**Design Reference**: Screenshot 04
**Components Used**: Dialog, Progress, Button, Input (file), Select

### 5. Search Interface (`apps/web/src/components/search/SearchInterface.tsx`)

- [ ] Create collapsible search bar (top of workspace):
  - [ ] Search input with icon
  - [ ] Close button (X icon)
  - [ ] Expand/collapse animation
- [ ] Create search results view:
  - [ ] Results summary ("Found X results in Y seconds")
  - [ ] Result cards with:
    - [ ] File icon and name
    - [ ] Folder badge
    - [ ] Preview snippet with highlighted search terms
    - [ ] Last modified timestamp
  - [ ] Click handler to open document
  - [ ] Hover state (gray background)
- [ ] Implement full-text search API integration
- [ ] Debounce search input (300ms)

**Design Reference**: Screenshots 01 (collapsed bar concept), 07
**Components Used**: Input, Button, Card

### 6. Context Menu (`apps/web/src/components/documents/FileContextMenu.tsx`)

- [ ] Create context menu component with menu items:
  - [ ] Open
  - [ ] Rename
  - [ ] Duplicate
  - [ ] Separator
  - [ ] Move to...
  - [ ] Separator
  - [ ] Delete (red text)
- [ ] Position menu at cursor on right-click
- [ ] Implement action handlers for each operation
- [ ] Close menu on outside click or action selection
- [ ] Add keyboard navigation (arrow keys, Enter, Escape)

**Design Reference**: Screenshot 06
**Components Used**: DropdownMenu, DropdownMenuItem, DropdownMenuSeparator

### 7. Empty States

#### File Tree Empty State
- [ ] Create EmptyFileTree component:
  - [ ] Folder icon (gray)
  - [ ] "No documents yet" heading
  - [ ] Descriptive text
  - [ ] New Document button (primary)
  - [ ] New Folder button (ghost)
  - [ ] Upload Files button (ghost)

#### Editor Empty State
- [ ] Create EmptyEditor component:
  - [ ] Document icon (gray)
  - [ ] "No document open" heading
  - [ ] Descriptive text
  - [ ] Create New Document button (primary)
  - [ ] Upload Files button (ghost)

#### Chat Empty State
- [ ] Create EmptyChat component:
  - [ ] Chat bubble icon (gray)
  - [ ] "Create documents to start chatting" text

**Design Reference**: Screenshot 05
**Components Used**: Button, EmptyState (from @centrid/ui if available)

### 8. Mobile Views

#### Mobile Document View
- [ ] Create MobileDocumentView component:
  - [ ] Top header with menu button, file name, save status
  - [ ] Formatting toolbar (larger touch targets, 44px min)
  - [ ] Full-screen editor
  - [ ] Bottom tab navigation (Document | Chat)
- [ ] Implement hamburger menu for file tree access
- [ ] Handle tab switching between document and chat

**Design Reference**: Screenshot 02
**Components Used**: Button, Input (textarea)

#### Mobile Chat View
- [ ] Create MobileChatView component:
  - [ ] Top header with menu button, "AI Assistant" title
  - [ ] Chat message list
  - [ ] Bottom chat input
  - [ ] Bottom tab navigation (Document | Chat)
- [ ] Implement same chat functionality as desktop
- [ ] Optimize for mobile touch interactions

**Design Reference**: Screenshot 03
**Components Used**: Input, Button

## State Management (Valtio)

- [ ] Create `documentStore.ts`:
  - [ ] `selectedFileId: string | null`
  - [ ] `files: FileNode[]` (tree structure)
  - [ ] `expandedFolders: Set<string>`
  - [ ] `previewMode: boolean`
  - [ ] `saveStatus: 'saved' | 'saving' | 'error'`
  - [ ] `searchQuery: string`
  - [ ] `searchOpen: boolean`

- [ ] Create actions:
  - [ ] `selectFile(id: string)`
  - [ ] `toggleFolder(id: string)`
  - [ ] `createFile(name: string, parentId?: string)`
  - [ ] `createFolder(name: string, parentId?: string)`
  - [ ] `deleteFile(id: string)`
  - [ ] `renameFile(id: string, newName: string)`
  - [ ] `moveFile(id: string, targetFolderId: string)`
  - [ ] `saveDocument(id: string, content: string)`
  - [ ] `togglePreview()`

- [ ] Create `chatStore.ts`:
  - [ ] `messages: Message[]`
  - [ ] `isStreaming: boolean`
  - [ ] Actions: `sendMessage()`, `clearMessages()`

- [ ] Create `uploadStore.ts`:
  - [ ] `uploadQueue: UploadItem[]`
  - [ ] Actions: `addToQueue()`, `updateProgress()`, `removeFromQueue()`

## API Integration

### Document Operations
- [ ] `GET /api/documents` - Fetch file tree
- [ ] `POST /api/documents` - Create new document
- [ ] `PUT /api/documents/:id` - Update document content
- [ ] `DELETE /api/documents/:id` - Delete document
- [ ] `POST /api/documents/:id/rename` - Rename document
- [ ] `POST /api/documents/:id/move` - Move to folder

### Folder Operations
- [ ] `POST /api/folders` - Create folder
- [ ] `DELETE /api/folders/:id` - Delete folder
- [ ] `POST /api/folders/:id/rename` - Rename folder

### Upload Operations
- [ ] `POST /api/upload` - Upload files
- [ ] Implement multipart form data handling
- [ ] Handle upload progress events

### Search Operations
- [ ] `GET /api/search?q=query` - Full-text search

### Chat Operations
- [ ] `POST /api/chat` - Send message to AI
- [ ] Implement streaming response handling

## Routing & Layout

- [ ] Create workspace route: `/workspace` or `/documents`
- [ ] Implement three-panel responsive layout:
  - [ ] Desktop (≥1024px): Show all three panels
  - [ ] Tablet (768-1023px): Show two panels (file tree + editor OR editor + chat)
  - [ ] Mobile (<768px): Show one panel + tab navigation
- [ ] Add route for mobile views if needed
- [ ] Implement panel resize functionality (optional enhancement)

## Styling & Theming

- [ ] Verify all colors match design tokens:
  - [ ] Primary coral: `#FF4D4D` (`bg-primary-600`)
  - [ ] Success green: `#34C759` (`text-success-500`)
  - [ ] Error red: `#FF3B30` (`text-error-500`)
  - [ ] Gray scale matches design system

- [ ] Configure Tailwind prose for markdown preview:
  ```javascript
  // In tailwind.config.js
  typography: {
    DEFAULT: {
      css: {
        h1: { fontSize: '2.25rem', fontWeight: '700' },
        h2: { fontSize: '1.5rem', fontWeight: '700' },
        // ... more customizations
      }
    }
  }
  ```

- [ ] Ensure all spacing matches spec (p-4, p-6, gap-2, gap-4)
- [ ] Verify border colors and widths
- [ ] Test dark mode variants

## Accessibility

- [ ] Add ARIA labels to icon buttons
- [ ] Implement keyboard navigation:
  - [ ] Tab through file tree, toolbar, editor
  - [ ] Arrow keys for tree navigation
  - [ ] Escape to close menus/dialogs
  - [ ] Enter to select/open items
- [ ] Add focus visible states to all interactive elements
- [ ] Test with screen reader (VoiceOver, NVDA)
- [ ] Ensure color contrast meets WCAG AA:
  - [ ] Text on backgrounds: 4.5:1 minimum
  - [ ] Focus indicators: 3:1 minimum
- [ ] Add live regions for save status updates
- [ ] Make modals/dialogs focus traps

## Performance Optimizations

- [ ] Virtualize file tree for large directories (>100 items)
  - [ ] Consider `react-window` or `react-virtual`
- [ ] Debounce auto-save (2 seconds)
- [ ] Debounce search input (300ms)
- [ ] Lazy load markdown preview rendering
- [ ] Virtualize chat message list for long conversations
- [ ] Optimize re-renders with `React.memo` where appropriate
- [ ] Use `useCallback` for event handlers passed to children

## Testing

### Unit Tests
- [ ] FileTreeNode component
- [ ] MarkdownEditor preview/edit toggle
- [ ] FileContextMenu actions
- [ ] Upload progress calculation
- [ ] Search result filtering

### Integration Tests
- [ ] Create and save document flow
- [ ] Upload multiple files flow
- [ ] Search and open document flow
- [ ] Chat message send and receive
- [ ] Folder creation and file organization

### E2E Tests (Playwright)
- [ ] Complete document creation workflow
- [ ] File upload and organization
- [ ] Search functionality
- [ ] AI chat interaction
- [ ] Mobile view navigation

### Accessibility Tests
- [ ] Keyboard-only navigation
- [ ] Screen reader compatibility
- [ ] Focus management in modals
- [ ] Color contrast verification

## Responsive Testing

- [ ] Test on desktop (1440×900, 1920×1080)
- [ ] Test on tablet (768×1024, 1024×768)
- [ ] Test on mobile (375×812 iPhone, 360×640 Android)
- [ ] Verify touch targets are ≥44px on mobile
- [ ] Test landscape and portrait orientations

## Browser Testing

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (macOS and iOS)
- [ ] Mobile browsers (Safari iOS, Chrome Android)

## Documentation

- [ ] Add JSDoc comments to all components
- [ ] Document props interfaces with TypeScript
- [ ] Create README for workspace feature
- [ ] Document state management patterns
- [ ] Add inline comments for complex logic

## Deployment Checklist

- [ ] Run type-check: `npm run type-check`
- [ ] Run linter: `npm run lint`
- [ ] Build successfully: `npm run build`
- [ ] No console errors in production build
- [ ] Test in production mode locally
- [ ] Verify environment variables are set
- [ ] Test with production API endpoints

## Post-Launch Enhancements (Optional)

- [ ] Panel resize/drag functionality
- [ ] Collaborative editing with real-time cursors
- [ ] Document version history
- [ ] Markdown syntax highlighting in edit mode
- [ ] Keyboard shortcuts (Cmd+S to save, Cmd+K to search, etc.)
- [ ] Drag-and-drop files in tree to reorganize
- [ ] Multi-file selection for batch operations
- [ ] Document preview on hover in file tree
- [ ] Recent documents quick access
- [ ] Favorites/starred documents

## Notes

- All screenshots available in: `apps/design-system/public/screenshots/filesystem-markdown-editor/`
- Design system frame (dark top bar) is NOT part of the feature - only for design system navigation
- The real app should start directly with the three-panel workspace layout
- Selected file uses gray background (`bg-gray-100`), NOT coral
- Preview mode is the default for better UX (show formatted content first)
- Upload progress shows inline in file tree, modal is only for file selection
- Empty states have folder CRUD buttons (New Document, New Folder, Upload)
