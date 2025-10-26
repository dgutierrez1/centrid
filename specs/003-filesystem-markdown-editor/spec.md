# Feature Specification: File System & Markdown Editor with AI Context Management

**Feature Branch**: `003-filesystem-markdown-editor`
**Created**: 2025-10-22
**Status**: Draft
**Input**: User description: "we need to implement next feature for the file processing and filesystem setup and management. we will target a bigger scope, we need the full file system setup. so users need to be able to CRUD their file system and files. the ui needs to be setup so we can build on top of it later, even though we are only focusing on the filesystem. the ui for desktop will have three panels, on the left we have the file system with tree view, on the center we have the document currently opened (maybe none are opned), on the right we have the ai chat. for mobile is trickier, the main focus screen could either be a chat or a document, the user will be able to change between one another when they select a chat or a document. the files would be ideally in markdown so they can be render correctly and good looking in the UI, users should be able to edit the files in the ui with styling and editing tools. can we implement automatic saving and updates to prevent users to have to manually save the files and loose data potentially. the visualization tool we use on the ui should allow later on to integrate diffs from the ai agent changes/suggestions, so keep in mind the ui tool will need to be extended in the future. we also need to setup things to work with the ai agents for search, optimal context, indexing, etc, so we need to focus on the core problem we want to adress about context fragmentation and enabling agents to do context optimal worflows."

## User Scenarios & Testing

### User Story 1 - Create and Edit Markdown Documents (Priority: P1)

A user logs in to Centrid and wants to create a new document to organize their thoughts or project notes. They create a new markdown file, write content with rich text formatting, and the system automatically saves their work without manual intervention.

**Why this priority**: This is the foundational capability of the entire feature. Without the ability to create and edit documents, no other functionality can exist. This delivers immediate value by giving users a place to store and edit their knowledge.

**Acceptance Scenarios**:

1. **Given** an authenticated user viewing the application, **When** they click "New Document", **Then** a new untitled markdown file is created in their root directory and opened in the editor
2. **Given** a user editing a markdown document, **When** they type text and apply formatting (bold, italic, headers, lists), **Then** the markdown syntax is correctly applied and rendered in real-time
3. **Given** a user has been typing for 3 seconds without new input, **When** the auto-save timer triggers, **Then** their content is persisted to the backend without any visible save action required
4. **Given** a user has unsaved changes and closes the browser, **When** they return and open the same document, **Then** all their changes are preserved

---

### User Story 2 - Navigate Hierarchical File Structure (Priority: P1)

A user has multiple documents and wants to organize them into folders. They create folders, move files between folders, rename items, and navigate through their file tree to find the document they need.

**Why this priority**: Organization is critical for scaling beyond a few documents. This enables users to build a structured knowledge base rather than a flat list of files. Essential for the "context management" core value proposition.

**Acceptance Scenarios**:

1. **Given** a user viewing the file tree, **When** they right-click on a folder or root and select "New Folder", **Then** a new folder is created with a default name ready to be renamed
2. **Given** a user with multiple documents, **When** they drag a document from one folder to another in the tree view, **Then** the document moves to the new location and the tree updates immediately
3. **Given** a user viewing the file tree, **When** they click on a document name, **Then** the document opens in the center editor panel and is marked as the active document
4. **Given** a user right-clicks on a file or folder, **When** they select "Delete", **Then** a confirmation dialog appears, and upon confirmation, the item is removed from the tree and backend
5. **Given** a user right-clicks on a file or folder, **When** they select "Rename" and type a new name, **Then** the item is renamed both in the UI and backend

---

### User Story 3 - Three-Panel Desktop Workspace (Priority: P1)

A user working on a desktop computer sees a three-panel layout: file tree on the left, document editor in the center, and AI chat on the right. This layout provides immediate access to all core features without requiring navigation between screens. Smooth transitions between states provide visual feedback without overwhelming the user.

**Why this priority**: The three-panel layout is the core UX paradigm that enables the AI-enhanced workflow. It allows users to reference their files while chatting with AI, creating a seamless context-aware experience. This is the visual foundation for all future AI features.

**Acceptance Scenarios**:

1. **Given** a user opens the application on a desktop browser (width > 1024px), **When** the app loads, **Then** three panels are visible with fixed proportions: file tree (left, 20% width), editor (center, 50% width), chat (right, 30% width)
2. **Given** a user with a document open in the center panel, **When** they type in the AI chat on the right, **Then** both panels remain visible and functional simultaneously
3. **Given** a user with no document selected, **When** they view the center panel, **Then** they see an empty state with prompts to create or open a document
4. **Given** a user clicks to open a document, **When** the document loads in the editor, **Then** a subtle fade-in animation provides smooth visual feedback

---

### User Story 4 - Mobile Adaptive Interface (Priority: P2)

A user accessing the application on a mobile device sees a focused single-panel view. They can toggle between viewing their current document and the AI chat, with the file tree accessible via a slide-out menu.

**Why this priority**: Mobile support is important for accessibility and modern user expectations, but can be delivered after the core desktop experience. This allows us to validate the core features on desktop first, then adapt the interface patterns.

**Acceptance Scenarios**:

1. **Given** a user opens the application on a mobile device (width < 768px), **When** the app loads, **Then** only one primary panel is visible at a time (either document or chat)
2. **Given** a user viewing a document on mobile, **When** they tap the "Chat" toggle button, **Then** the view transitions to the AI chat panel with the document context preserved
3. **Given** a user on mobile, **When** they tap the menu icon, **Then** the file tree slides out as an overlay and can be dismissed by tapping outside or selecting a file
4. **Given** a user viewing the file tree overlay on mobile, **When** they tap a document, **Then** the overlay closes and the selected document opens in the main view

---

### User Story 5 - Document Indexing for AI Context (Priority: P2)

When a user creates or updates a document, the system automatically processes the content for search and AI context retrieval. This happens invisibly in the background, ensuring AI agents can access optimal context when responding to user queries.

**Why this priority**: This is the bridge between the file system and AI capabilities. While not immediately visible to users, it's essential for delivering the core value proposition of "context-aware AI". Can be developed in parallel with UI features.

**Acceptance Scenarios**:

1. **Given** a user creates a new document with content, **When** the auto-save triggers and updates the `documents` table, **Then** a database trigger automatically queues the document for background indexing
2. **Given** a document is queued for indexing via trigger, **When** the background indexing job runs, **Then** file content is fetched from Supabase Storage, chunked into searchable segments (400-500 tokens), and stored in `document_chunks` table with embeddings
3. **Given** a user updates an existing document, **When** the changes are saved to Supabase Storage and the `documents` table is updated, **Then** the database trigger re-queues the document and the indexing job updates all associated chunks
4. **Given** a user deletes a document, **When** the deletion is confirmed, **Then** cascade delete removes all associated `document_chunks` records and the file is removed from Supabase Storage

---

### User Story 6 - Upload Existing Documents (Priority: P2)

A user has existing markdown or text files on their computer and wants to import them into Centrid. They drag and drop files or use a file picker to upload multiple documents, which are then processed and made available in their file tree.

**Why this priority**: Many users will have existing notes, documentation, or content they want to bring into Centrid. This enables migration from other tools and provides immediate value by populating their knowledge base. Essential for adoption.

**Acceptance Scenarios**:

1. **Given** a user viewing the file tree, **When** they click "Upload Documents", **Then** a file picker opens allowing selection of .md and .txt files
2. **Given** a user has files selected in the picker, **When** they confirm the upload, **Then** files are uploaded with a progress indicator and appear in the file tree upon completion
3. **Given** a user drags files from their desktop, **When** they drop files onto the file tree or editor area, **Then** files are uploaded and a subtle progress animation shows upload status
4. **Given** a user uploads a file with a name that already exists, **When** the upload completes, **Then** the system appends a number (e.g., "Document (1)") to avoid conflicts
5. **Given** uploaded documents contain content, **When** the upload completes, **Then** documents are automatically queued for indexing within 5 seconds

---

### User Story 7 - Full-Text Search Across Documents (Priority: P3)

A user with many documents wants to find specific information. They use the search feature to query across all their documents and receive ranked results with highlighted matches, allowing them to quickly locate relevant content.

**Why this priority**: Search becomes valuable once users have accumulated multiple documents. While important for long-term usability, the feature can be delivered after users can create and organize their initial document base.

**Acceptance Scenarios**:

1. **Given** a user has multiple indexed documents, **When** they enter a search query, **Then** results are returned in under 1 second ranked by relevance
2. **Given** search results are displayed, **When** a user clicks on a result, **Then** the document opens with the matching text highlighted
3. **Given** a user searches for text that exists in multiple documents, **When** results are shown, **Then** matches in document titles are ranked higher than body text matches
4. **Given** a user searches for text that doesn't exist in any document, **When** results are shown, **Then** an empty state message guides them to refine their query

---

### Edge Cases

- **Network connection loss while editing**: Changes queue locally and sync when connection restored, with conflict resolution if document was modified elsewhere
- **Large files (>10MB)**: System warns before upload and prevents or implements progressive loading for performance
- **Document indexing failures**: Background job retries 3x with exponential backoff, then logs error and marks document with indexing_failed status (manual retry available)
- **Concurrent edits**: Last-write-wins for MVP (operational transforms/CRDTs deferred)
- **Storage quota exceeded**: Prevents new creation/upload, displays quota warning with upgrade prompt
- **Bulk uploads**: Files queued and uploaded sequentially with progress indicator to prevent server overload

## Requirements

### Functional Requirements

- **FR-001**: System MUST allow authenticated users to create new markdown documents with unique names
- **FR-002**: System MUST provide a real-time markdown editor with formatting toolbar (bold, italic, headers, lists, code blocks, links)
- **FR-003**: System MUST auto-save document changes after 3 seconds of inactivity without user intervention
- **FR-004**: System MUST allow users to create, rename, and delete folders in a hierarchical structure
- **FR-005**: System MUST allow users to move files between folders via drag-and-drop or context menu
- **FR-006**: System MUST persist all file system changes (create, read, update, delete) to the backend immediately
- **FR-007**: System MUST render markdown content with proper styling (headers, emphasis, code blocks, lists, blockquotes)
- **FR-008**: System MUST display a file tree view with expand/collapse controls for folders
- **FR-009**: System MUST support three-panel layout on desktop (file tree, editor, chat) with fixed proportions
- **FR-010**: System MUST support single-panel mobile layout with toggle between document and chat views
- **FR-011**: System MUST sanitize markdown content to prevent XSS attacks while preserving formatting
- **FR-012**: System MUST process document content for full-text search indexing on creation and updates
- **FR-013**: System MUST chunk document content into segments (400-500 tokens) for optimal AI context retrieval
- **FR-014**: System MUST support full-text search across all user documents with ranked results
- **FR-015**: System MUST highlight search query matches in document content
- **FR-016**: System MUST enforce user isolation (users can only access their own files)
- **FR-017**: System MUST handle network failures gracefully with offline queue and sync on reconnection
- **FR-018**: System MUST provide visual feedback for save status (saving, saved, error)
- **FR-019**: System MUST support keyboard shortcuts for common actions (new file: Cmd/Ctrl+N, save: Cmd/Ctrl+S, search: Cmd/Ctrl+F)
- **FR-020**: System MUST store markdown files with `.md` extension and MIME type `text/markdown`
- **FR-021**: System MUST allow users to upload markdown (.md) and text (.txt) files from their local filesystem
- **FR-022**: System MUST support drag-and-drop file upload onto the file tree or editor area
- **FR-023**: System MUST display upload progress with visual indicators during file transfer
- **FR-024**: System MUST validate file types and reject unsupported formats with clear error messages
- **FR-025**: System MUST apply fast, minimal animations to key transitions (document open, folder expand/collapse, view switching) without overwhelming the interface

### Key Entities

**Database Schema (separate tables for folders and documents):**

- **Folder**: Represents a container for documents and nested folders
  - Fields: `id` (uuid), `user_id` (uuid), `name` (text), `parent_folder_id` (uuid, nullable), `path` (text), `created_at`, `updated_at`
  - Relationships: Self-referential parent-child hierarchy, owned by user
  - Constraints: User isolation via RLS, unique name within parent scope

- **Document**: Represents a user's markdown file with metadata (content stored in Supabase Storage)
  - Fields: `id` (uuid), `user_id` (uuid), `folder_id` (uuid, nullable), `name` (text), `storage_path` (text), `file_size` (integer), `mime_type` (text), `path` (text), `created_at`, `updated_at`
  - Relationships: Belongs to folder (nullable for root), owned by user
  - Storage: Actual file content stored in Supabase Storage bucket with path referenced in `storage_path` field
  - Constraints: User isolation via RLS on both database and storage bucket, unique name within folder scope

- **DocumentChunk**: Represents a searchable segment of document content with text, position in document, language, and search vector for full-text retrieval
  - Fields: `id` (uuid), `document_id` (uuid), `content` (text), `position` (integer), `embedding` (vector), `created_at`, `updated_at`
  - Relationships: Belongs to document (cascade delete)

- **FileSystemNode** (Frontend abstraction): Abstract representation of file tree structure with type (file/folder), name, path, parent/children relationships for UI rendering (not a database table, computed from folders + documents)

### UI/UX Requirements

#### Screens/Views Needed

- **Main Workspace (Desktop)**: Three-panel layout with fixed proportions and persistent visibility of file tree, editor, and chat
- **Main Workspace (Mobile)**: Single-panel focus view with bottom navigation to toggle between document and chat
- **File Tree Panel**: Hierarchical tree view with expand/collapse, context menus, drag-and-drop support, and upload button
- **Document Editor Panel**: Markdown editor with formatting toolbar, preview mode toggle, and save status indicator
- **Upload Interface**: File picker dialog and drag-and-drop zone with upload progress indicators
- **Empty State (Editor)**: Welcoming message with "Create New Document", "Open Existing Document", and "Upload Files" prompts when no document is selected
- **Empty State (File Tree)**: Guidance for new users to create their first document, folder, or upload existing files
- **Search Results View**: Modal or slide-out panel showing ranked search results with highlighted matches

#### Key Interactive Elements

- **Formatting Toolbar**: Buttons for bold, italic, headers (H1-H6), bullet lists, numbered lists, code blocks, links, images - each toggles markdown syntax
- **File Tree Node**: Clickable folder/file items with expand/collapse arrows for folders (with smooth rotation animation), context menu on right-click, drag handle for reordering
- **Context Menu**: Right-click menu with options: New File, New Folder, Upload Files, Rename, Delete, Move To - adapts based on selected node type
- **Upload Button**: Primary action button in file tree toolbar that opens file picker for .md and .txt files
- **Drag-and-Drop Zone**: Visual feedback when dragging files over file tree or editor (highlight drop zone with subtle border animation)
- **Upload Progress Indicator**: Linear progress bar or percentage indicator showing upload status for individual or batch uploads
- **Save Indicator**: Icon in editor toolbar showing status (cloud with checkmark = saved, animated cloud = saving, exclamation = error)
- **Mobile Toggle**: Bottom navigation bar with icons for Document and Chat views, highlighting active view with smooth transition

#### Responsive Requirements

- **Mobile Priority**: Focus on single-task views (either editing OR chatting), prioritize file tree as overlay to maximize content space, ensure touch targets are minimum 44x44px
- **Desktop Enhancements**: Multi-panel simultaneous visibility with fixed proportions, keyboard shortcuts, drag-and-drop between panels and for file uploads

#### Animation Guidelines

- **Principle**: Fast, minimal transitions (150-250ms desktop, 100-150ms mobile) enhance usability without overwhelming users
- **Key Transitions**: Document open (fade 200ms/120ms), folder expand/collapse (slide 200ms/120ms), mobile view switch (slide 150ms), save status (morph 200ms/120ms), drag-and-drop (border pulse), file tree updates (fade 150ms/100ms)
- **No Animation**: Static text, toolbar interactions, scroll behavior
- **Accessibility**: Respects prefers-reduced-motion setting by disabling non-essential animations

#### Critical States

- **Loading**: Skeleton screens for file tree while loading structure, spinner in editor when opening large documents, progress indicator for search queries and file uploads
- **Error**: Inline error messages in editor for save failures with retry action, toast notifications for file operation errors (including upload failures) with undo/retry options
- **Empty**: Welcoming empty states with clear call-to-action buttons (Create, Upload, Open) and helpful guidance for new users
- **Success**: Subtle toast notifications for successful operations (document created, file moved, upload completed), green checkmark in save indicator
- **Uploading**: Progress bar or percentage indicator for active uploads, ability to continue working while upload happens in background

#### Accessibility Priorities

- **Keyboard Navigation**: Full tree navigation with arrow keys, Tab through toolbar buttons, Esc to close modals/menus, dedicated shortcut for search (Cmd/Ctrl+F)
- **Screen Reader**: Announce file tree changes on create/delete/move, announce save status changes, label all toolbar buttons with descriptive text
- **Touch Targets**: Minimum 44x44px for all mobile interactive elements, adequate spacing between tree nodes for easy tapping

## Success Criteria

**Performance**:
- Document creation to editing: <3s
- Auto-save reliability: >99%
- File tree operations: <1s
- Search results (up to 1000 files): <1s
- Document indexing (50-page doc): <60s
- File uploads (<1MB): <5s

**UX Quality**:
- First session success rate: >90% (create/organize/edit without errors)
- Animation timing: 150-250ms desktop, 100-150ms mobile
- Responsive range: 320px-2560px width (mobile to desktop)

**Features**:
- Offline editing with automatic sync on reconnection
- Background multi-file uploads
- Standard markdown syntax support (headers, emphasis, lists, code, links, blockquotes)

## Assumptions

- **Content & Scale**: Primarily text-based markdown documents (<10MB), English content for MVP, organized into folders rather than flat structure, mostly .md/.txt file uploads
- **Performance & Network**: API latency <500ms, auto-save (3s) balances UX/load, desktop animations (150-250ms) and mobile (100-150ms) enhance without distraction
- **User Behavior**: Users understand basic markdown or learn via toolbar, tolerate single-panel mobile view, fixed panel proportions (20/50/30) work for most users, search ranking by title > headers > body meets expectations
- **Scope Deferrals**: No real-time collaborative editing in MVP, panel customization deferred post-MVP

## Dependencies

**Technical Decisions** (from clarification session 2025-10-22):
- Data model: Separate `folders` and `documents` tables for cleaner domain separation and type safety
- Markdown editor: TipTap (ProseMirror-based) for extensibility, TypeScript support, and custom diff extension capability
- File tree component: react-arborist for virtualization, drag-and-drop, keyboard navigation, and TypeScript support
- File storage: Supabase Storage (object storage) with metadata in `documents` table and storage path reference
- Indexing trigger: Database trigger on `documents` table changes automatically queues indexing jobs

**Required Systems**:
- Authentication system operational to enforce user isolation and document ownership
- Supabase Storage configured with user-isolated buckets and RLS policies for file access control
- Backend endpoints for CRUD operations on documents and folders
- Backend file upload endpoint with multipart form data support and Supabase Storage integration
- Background indexing job (Edge Function or pg_cron) to fetch content from Supabase Storage, chunk it, generate embeddings, and store in `document_chunks` table
- Document deletion must cascade to remove associated chunks and storage files
- Real-time updates infrastructure (websocket or polling) for save status and upload progress
- TipTap configured with XSS-safe markdown serialization/deserialization
- File content retrieval from Supabase Storage via signed URLs or direct download for editor loading

## Out of Scope (Post-MVP)

- **Collaboration**: Version history, rollback, real-time multi-user editing, document sharing/permissions, team access
- **Advanced Editing**: Templates, export formats (PDF/DOCX/HTML), math equations, diagrams, embeds, syntax highlighting, custom themes/preferences
- **AI Features**: Inline diff view for suggested edits (UI foundation established, feature deferred)
- **Organization**: Document tagging/metadata, bulk operations, trash/recycle bin, resizable panels
- **File Support**: Upload beyond .md/.txt (PDF/DOCX processing deferred)
