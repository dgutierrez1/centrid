# Feature Specification: File System & Markdown Editor with AI Context Management

**Feature Branch**: `003-filesystem-markdown-editor`
**Created**: 2025-10-22
**Status**: Draft
**Input**: User description: "we need to implement next feature for the file processing and filesystem setup and management. we will target a bigger scope, we need the full file system setup. so users need to be able to CRUD their file system and files. the ui needs to be setup so we can build on top of it later, even though we are only focusing on the filesystem. the ui for desktop will have three panels, on the left we have the file system with tree view, on the center we have the document currently opened (maybe none are opned), on the right we have the ai chat. for mobile is trickier, the main focus screen could either be a chat or a document, the user will be able to change between one another when they select a chat or a document. the files would be ideally in markdown so they can be render correctly and good looking in the UI, users should be able to edit the files in the ui with styling and editing tools. can we implement automatic saving and updates to prevent users to have to manually save the files and loose data potentially. the visualization tool we use on the ui should allow later on to integrate diffs from the ai agent changes/suggestions, so keep in mind the ui tool will need to be extended in the future. we also need to setup things to work with the ai agents for search, optimal context, indexing, etc, so we need to focus on the core problem we want to adress about context fragmentation and enabling agents to do context optimal worflows."

## Clarifications

### Session 2025-10-22

- Q: How should the folder hierarchy be implemented in the data model (separate tables vs single table with type discriminator)? → A: Separate `folders` and `documents` tables for cleaner domain separation and type safety
- Q: Which markdown editor component should be used for implementation with extensibility for future diff/merge UI? → A: TipTap (ProseMirror-based) for its extensibility, TypeScript support, and capability for custom diff extensions
- Q: Where should the actual markdown file content be stored in the backend architecture? → A: Supabase Storage (object storage) with metadata in `documents` table and storage path reference
- Q: When and how should document content be indexed for search and AI context retrieval? → A: Database trigger on `documents` table changes automatically queues indexing job
- Q: Which React component library should be used for the hierarchical file tree view with drag-and-drop? → A: react-arborist for its virtualization, built-in drag-and-drop, keyboard navigation, and TypeScript support

## User Scenarios & Testing

### User Story 1 - Create and Edit Markdown Documents (Priority: P1)

A user logs in to Centrid and wants to create a new document to organize their thoughts or project notes. They create a new markdown file, write content with rich text formatting, and the system automatically saves their work without manual intervention.

**Why this priority**: This is the foundational capability of the entire feature. Without the ability to create and edit documents, no other functionality can exist. This delivers immediate value by giving users a place to store and edit their knowledge.

**Independent Test**: Can be fully tested by creating a new user account, creating a markdown file, typing content with formatting, closing the browser, and reopening to verify content persists. Delivers a complete note-taking experience.

**Acceptance Scenarios**:

1. **Given** an authenticated user viewing the application, **When** they click "New Document", **Then** a new untitled markdown file is created in their root directory and opened in the editor
2. **Given** a user editing a markdown document, **When** they type text and apply formatting (bold, italic, headers, lists), **Then** the markdown syntax is correctly applied and rendered in real-time
3. **Given** a user has been typing for 3 seconds without new input, **When** the auto-save timer triggers, **Then** their content is persisted to the backend without any visible save action required
4. **Given** a user has unsaved changes and closes the browser, **When** they return and open the same document, **Then** all their changes are preserved

---

### User Story 2 - Navigate Hierarchical File Structure (Priority: P1)

A user has multiple documents and wants to organize them into folders. They create folders, move files between folders, rename items, and navigate through their file tree to find the document they need.

**Why this priority**: Organization is critical for scaling beyond a few documents. This enables users to build a structured knowledge base rather than a flat list of files. Essential for the "context management" core value proposition.

**Independent Test**: Can be fully tested by creating multiple folders and documents, organizing them into a hierarchy, renaming items, moving files between folders, and verifying the tree structure updates correctly. Delivers a complete file organization experience.

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

**Independent Test**: Can be fully tested by opening the application on a desktop browser, verifying all three panels are visible with fixed proportions, and confirming each panel functions independently. Delivers the complete workspace foundation.

**Acceptance Scenarios**:

1. **Given** a user opens the application on a desktop browser (width > 1024px), **When** the app loads, **Then** three panels are visible with fixed proportions: file tree (left, 20% width), editor (center, 50% width), chat (right, 30% width)
2. **Given** a user with a document open in the center panel, **When** they type in the AI chat on the right, **Then** both panels remain visible and functional simultaneously
3. **Given** a user with no document selected, **When** they view the center panel, **Then** they see an empty state with prompts to create or open a document
4. **Given** a user clicks to open a document, **When** the document loads in the editor, **Then** a subtle fade-in animation provides smooth visual feedback

---

### User Story 4 - Mobile Adaptive Interface (Priority: P2)

A user accessing the application on a mobile device sees a focused single-panel view. They can toggle between viewing their current document and the AI chat, with the file tree accessible via a slide-out menu.

**Why this priority**: Mobile support is important for accessibility and modern user expectations, but can be delivered after the core desktop experience. This allows us to validate the core features on desktop first, then adapt the interface patterns.

**Independent Test**: Can be fully tested by opening the application on a mobile browser or device, navigating between document and chat views, accessing the file tree menu, and performing basic file operations. Delivers a complete mobile experience.

**Acceptance Scenarios**:

1. **Given** a user opens the application on a mobile device (width < 768px), **When** the app loads, **Then** only one primary panel is visible at a time (either document or chat)
2. **Given** a user viewing a document on mobile, **When** they tap the "Chat" toggle button, **Then** the view transitions to the AI chat panel with the document context preserved
3. **Given** a user on mobile, **When** they tap the menu icon, **Then** the file tree slides out as an overlay and can be dismissed by tapping outside or selecting a file
4. **Given** a user viewing the file tree overlay on mobile, **When** they tap a document, **Then** the overlay closes and the selected document opens in the main view

---

### User Story 5 - Document Indexing for AI Context (Priority: P2)

When a user creates or updates a document, the system automatically processes the content for search and AI context retrieval. This happens invisibly in the background, ensuring AI agents can access optimal context when responding to user queries.

**Why this priority**: This is the bridge between the file system and AI capabilities. While not immediately visible to users, it's essential for delivering the core value proposition of "context-aware AI". Can be developed in parallel with UI features.

**Independent Test**: Can be fully tested by creating documents with distinct content, waiting for background indexing, then using search functionality to verify content is discoverable. Delivers the foundation for AI-powered features.

**Acceptance Scenarios**:

1. **Given** a user creates a new document with content, **When** the auto-save triggers and updates the `documents` table, **Then** a database trigger automatically queues the document for background indexing
2. **Given** a document is queued for indexing via trigger, **When** the background indexing job runs, **Then** file content is fetched from Supabase Storage, chunked into searchable segments (400-500 tokens), and stored in `document_chunks` table with embeddings
3. **Given** a user updates an existing document, **When** the changes are saved to Supabase Storage and the `documents` table is updated, **Then** the database trigger re-queues the document and the indexing job updates all associated chunks
4. **Given** a user deletes a document, **When** the deletion is confirmed, **Then** cascade delete removes all associated `document_chunks` records and the file is removed from Supabase Storage

---

### User Story 6 - Upload Existing Documents (Priority: P2)

A user has existing markdown or text files on their computer and wants to import them into Centrid. They drag and drop files or use a file picker to upload multiple documents, which are then processed and made available in their file tree.

**Why this priority**: Many users will have existing notes, documentation, or content they want to bring into Centrid. This enables migration from other tools and provides immediate value by populating their knowledge base. Essential for adoption.

**Independent Test**: Can be fully tested by preparing markdown/text files locally, uploading them via drag-and-drop or file picker, and verifying they appear in the file tree and are searchable. Delivers complete document import capability.

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

**Independent Test**: Can be fully tested by creating multiple documents with different content, performing various search queries, and verifying results are relevant and ranked appropriately. Delivers a complete search experience.

**Acceptance Scenarios**:

1. **Given** a user has multiple indexed documents, **When** they enter a search query, **Then** results are returned in under 1 second ranked by relevance
2. **Given** search results are displayed, **When** a user clicks on a result, **Then** the document opens with the matching text highlighted
3. **Given** a user searches for text that exists in multiple documents, **When** results are shown, **Then** matches in document titles are ranked higher than body text matches
4. **Given** a user searches for text that doesn't exist in any document, **When** results are shown, **Then** an empty state message guides them to refine their query

---

### Edge Cases

- **What happens when a user loses network connection while editing?** Changes continue to queue locally and sync when connection is restored, with conflict resolution if document was modified elsewhere
- **How does system handle very large files (>10MB)?** System warns users before upload and either prevents upload or implements progressive loading for performance
- **What happens when a user tries to create a file/folder with duplicate names?** System appends a number (e.g., "Document (1)") or prompts user to choose a different name
- **How does system handle special characters in file names?** System sanitizes names to prevent filesystem conflicts (e.g., replaces `/` with `-`)
- **What happens when document indexing fails?** Background indexing job retries up to 3 times with exponential backoff, then logs error and marks document with indexing_failed status (user can manually retry via UI if needed)
- **How does system handle concurrent edits to the same document?** Last-write-wins for MVP, with future consideration for operational transforms or CRDTs
- **What happens when a user's storage quota is exceeded?** System prevents new document creation/upload and displays quota warning with upgrade prompt
- **How does system handle markdown rendering errors?** Displays sanitized content with error indicator, preventing XSS while maintaining usability
- **What happens when a user uploads unsupported file types?** System shows error message indicating only .md and .txt files are supported in MVP
- **How does system handle bulk uploads of many files?** Files are queued and uploaded sequentially with overall progress indicator, preventing server overload
- **What happens when upload fails mid-transfer?** User sees error notification with retry option, partial uploads are cleaned up automatically

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

- **Principle**: Fast, fluid, minimal - animations enhance usability without overwhelming users
- **Desktop Duration**: 150-250ms for most transitions (quick enough to feel instant, slow enough to provide visual feedback)
- **Mobile Duration**: 100-150ms for all transitions (very fast and snappy to match native app expectations)
- **Key Transitions**:
  - Document open/close: Subtle fade-in (200ms desktop, 120ms mobile) when document loads in editor
  - Folder expand/collapse: Arrow rotation (150ms desktop, 100ms mobile) and content slide-down (200ms desktop, 120ms mobile)
  - View switching (mobile): Slide transition (150ms) when toggling between document and chat - must feel instant
  - File tree updates: Fade-in (150ms desktop, 100ms mobile) for newly created/uploaded items
  - Save status: Icon morph animation (200ms desktop, 120ms mobile) when state changes
  - Drag-and-drop: Drop zone border pulse (continuous during drag, 150ms desktop / 100ms mobile completion)
  - Mobile overlay: File tree slide-in/out (150ms) with slight easing for smooth feel
- **No Animation**: Static text rendering, toolbar interactions, scroll behavior
- **Mobile Optimization**: All mobile animations prioritize speed over smoothness to feel native and responsive
- **Reduced Motion**: System respects user's prefers-reduced-motion setting by disabling non-essential animations

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

### Measurable Outcomes

- **SC-001**: Users can create a new document and begin editing within 3 seconds of clicking "New Document"
- **SC-002**: Auto-save successfully persists changes with 99%+ reliability, preventing data loss
- **SC-003**: File tree operations (create, rename, delete, move) complete within 1 second of user action with smooth visual feedback
- **SC-004**: Document search returns relevant results in under 1 second for document collections up to 1000 files
- **SC-005**: Three-panel desktop layout with fixed proportions maintains usability at screen widths from 1024px to 2560px without horizontal scrolling
- **SC-006**: Mobile interface remains functional and usable on devices from 320px to 768px width
- **SC-007**: Users can edit documents offline and changes sync automatically when connection is restored
- **SC-008**: Markdown rendering displays correctly for all standard markdown syntax (headers, emphasis, lists, code, links, blockquotes)
- **SC-009**: 90% of users successfully create, organize, and edit documents without encountering errors in their first session
- **SC-010**: Document indexing completes within 60 seconds for 50-page documents, enabling immediate search availability
- **SC-011**: File uploads complete within 5 seconds for typical markdown files (<1MB) with clear progress indication
- **SC-012**: Users can upload multiple files simultaneously and continue working while upload happens in background
- **SC-013**: Desktop animations complete within 150-250ms, providing visual feedback without feeling sluggish
- **SC-014**: Mobile animations complete within 100-150ms, feeling instant and snappy like native mobile apps

## Assumptions

- Users will primarily create or upload text-based markdown documents, not large binary files
- Maximum individual document size will be reasonable (<10MB) for in-browser editing and upload
- Users understand basic markdown syntax or will learn through the formatting toolbar
- Network latency for API requests will be <500ms under normal conditions
- Users will organize documents into folders rather than maintaining flat structure
- Search relevance ranking by title > headers > body will meet user expectations
- Auto-save interval of 3 seconds balances UX (no data loss) with backend load
- Mobile users will tolerate single-panel focus view rather than attempting multi-panel complexity
- Document content will be primarily English for MVP (affects search stemming and language detection)
- Users will not require real-time collaborative editing in MVP (deferred to future versions)
- Fixed panel proportions (20/50/30) will work for most users in MVP, customization can be added post-MVP
- Desktop animations (150-250ms) will enhance UX without causing motion sickness or distraction
- Mobile animations (100-150ms) will feel native and responsive, matching user expectations from mobile apps
- Most uploaded files will be .md or .txt format, with larger file type support deferred to post-MVP

## Dependencies

- Authentication system must be operational to enforce user isolation and document ownership
- Backend storage system must support hierarchical folder structures with separate `folders` and `documents` tables
- Supabase Storage must be configured with user-isolated buckets and RLS policies for file access control
- Backend must provide endpoints for CRUD operations on documents and folders
- Backend must provide file upload endpoint with multipart form data support and Supabase Storage integration
- Database trigger on `documents` table (INSERT/UPDATE) must automatically queue indexing jobs
- Background indexing job (Edge Function or pg_cron) must fetch content from Supabase Storage, chunk it, generate embeddings, and store in `document_chunks` table
- Document deletion must cascade to remove associated chunks and storage files
- Real-time updates may require websocket or polling infrastructure for save status and upload progress
- TipTap editor library (ProseMirror-based) with markdown extensions for rich text editing
- TipTap must be configured with XSS-safe markdown serialization/deserialization
- react-arborist library for file tree component with virtualization, drag-and-drop, and keyboard navigation
- File content must be retrieved from Supabase Storage via signed URLs or direct download for editor loading

## Out of Scope (Post-MVP)

- Document version history and rollback capability
- Real-time collaborative editing with multiple users
- Document sharing and permissions (public links, team access)
- Document templates and boilerplates
- Export to other formats (PDF, DOCX, HTML)
- Advanced markdown features (math equations, diagrams, embeds)
- AI-suggested edits with inline diff view (UI foundation established, but feature deferred)
- Document tagging and advanced metadata
- Bulk operations (move multiple files, batch delete)
- Trash/recycle bin with recovery
- Resizable panel widths (fixed proportions for MVP, customization deferred)
- Custom themes and editor preferences
- Syntax highlighting for code blocks in editor mode
- Upload of file types beyond .md and .txt (PDF, DOCX processing deferred)
