# Tasks: File System & Markdown Editor with AI Context Management

**Input**: Design documents from `/specs/003-filesystem-markdown-editor/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in specification - focusing on implementation tasks only

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions (Monorepo)

- **Frontend**: `apps/web/src/`
- **Backend**: `apps/api/src/`
- **Shared**: `packages/shared/src/`
- **UI Components**: `packages/ui/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and database foundation

- [ ] T001 Install dependencies for TipTap editor (try to place it in packages/ui for presentational components) (npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-markdown)
- [ ] T002 Install react-arborist for file tree in (try to place it in packages/ui for presentational components) (npm install react-arborist)
- [ ] T003 [P] Install OpenAI SDK in apps/api for embeddings (npm install openai)
- [ ] T004 Define database schema in apps/api/src/db/schema.ts (folders, documents, document_chunks tables with Drizzle ORM)
- [ ] T005 Push schema to remote Supabase database (cd apps/api && npm run db:push)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Create RLS policies for folders table in Supabase SQL Editor (enable RLS, policies for SELECT/INSERT/UPDATE/DELETE)
- [ ] T007 [P] Create RLS policies for documents table in Supabase SQL Editor (enable RLS, policies for SELECT/INSERT/UPDATE/DELETE)
- [ ] T008 [P] Create RLS policies for document_chunks table in Supabase SQL Editor (enable RLS, read-only policy for users)
- [ ] T009 Configure Supabase Storage bucket 'documents' in Supabase Dashboard (create bucket, set as private)
- [ ] T010 Create Storage RLS policies for 'documents' bucket in Supabase SQL Editor (policies for read/upload/delete by user_id in path)
- [ ] T011 Create updated_at trigger function in Supabase SQL Editor (update_updated_at_column function)
- [ ] T012 [P] Attach updated_at triggers to folders table in Supabase SQL Editor
- [ ] T013 [P] Attach updated_at triggers to documents table in Supabase SQL Editor
- [ ] T014 Define shared TypeScript types in packages/shared/src/types/filesystem.ts (Folder, Document, DocumentChunk, FileSystemNode interfaces)
- [ ] T015 [P] Create file validation utilities in packages/shared/src/utils/file-validation.ts (validateFile function, Zod schemas)
- [ ] T016 [P] Create path utilities in packages/shared/src/utils/path-utils.ts (computeFolderPath, computeDocumentPath functions)
- [ ] T017 Create Valtio state for filesystem in apps/web/src/lib/state/filesystem.ts (filesystemState proxy with folders, documents, selectedDocument)
- [ ] T018 [P] Create Valtio state for editor in apps/web/src/lib/state/editor.ts (editorState proxy with content, saveStatus, version)
- [ ] T019 [P] Create Valtio state for upload in apps/web/src/lib/state/upload.ts (uploadState proxy with progress, errors, completed)
- [ ] T020 Create document processor service in apps/api/src/services/document-processor.ts (chunkDocument function for 400-500 token chunks)
- [ ] T021 [P] Create indexing service in apps/api/src/services/indexing.ts (generateEmbedding function using OpenAI text-embedding-3-small)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create and Edit Markdown Documents (Priority: P1) 🎯 MVP

**Goal**: Users can create new markdown documents, edit them with rich text formatting, and have changes automatically saved without manual intervention

**Independent Test**: Create a new user account, create a markdown file, type content with formatting (bold, italic, headers), close the browser, and reopen to verify content persists

### Implementation for User Story 1

- [ ] T022 [P] [US1] Create MarkdownEditor component in packages/ui/src/components/markdown-editor.tsx (TipTap editor with StarterKit and Markdown extensions)
- [ ] T023 [P] [US1] Create SaveIndicator component in packages/ui/src/components/save-indicator.tsx (cloud icon with saving/saved/error states)
- [ ] T024 [P] [US1] Create EmptyState component in packages/ui/src/features/empty-state.tsx (welcoming message with action prompts)
- [ ] T025 [US1] Create DocumentEditor smart component in apps/web/src/components/documents/DocumentEditor.tsx (integrates MarkdownEditor with Valtio state and auto-save)
- [ ] T026 [US1] Implement auto-save hook in apps/web/src/lib/hooks/useAutoSave.ts (debounced save with 3s delay, optimistic locking)
- [ ] T027 [US1] Create Edge Function for document content updates in apps/api/src/functions/documents/index.ts (PUT /documents/:id endpoint with version check)
- [ ] T028 [US1] Add Edge Function declaration to apps/api/supabase/config.toml (documents function with custom entrypoint)
- [ ] T029 [US1] Deploy documents Edge Function to remote Supabase (cd apps/api && npm run deploy:functions)
- [ ] T030 [US1] Add unsaved changes warning in apps/web/src/components/documents/DocumentEditor.tsx (useBeforeUnload hook for browser close)
- [ ] T031 [US1] Implement real-time subscription for document updates in apps/web/src/components/documents/DocumentEditor.tsx (conflict detection on version mismatch)

**Checkpoint**: At this point, User Story 1 should be fully functional - users can create and edit documents with auto-save

---

## Phase 4: User Story 2 - Navigate Hierarchical File Structure (Priority: P1)

**Goal**: Users can organize documents into folders, move files between folders, rename items, and navigate through their file tree to find documents

**Independent Test**: Create multiple folders and documents, organize them into a hierarchy, rename items, move files between folders, and verify the tree structure updates correctly

### Implementation for User Story 2

- [ ] T032 [P] [US2] Create FileTree component in packages/ui/src/components/file-tree.tsx (react-arborist wrapper with drag-and-drop support)
- [ ] T033 [P] [US2] Create ContextMenu component in packages/ui/src/components/context-menu.tsx (right-click menu with New File, New Folder, Rename, Delete, Move To options)
- [ ] T034 [P] [US2] Create FolderIcon and DocumentIcon components in packages/ui/src/components/icons.tsx (visual indicators for tree nodes)
- [ ] T035 [US2] Create FileTreeContainer smart component in apps/web/src/components/filesystem/FileTreeContainer.tsx (loads filesystem state, handles node selection)
- [ ] T036 [US2] Implement buildFileSystemTree utility in apps/web/src/lib/utils/tree-builder.ts (converts folders + documents into FileSystemNode hierarchy)
- [ ] T037 [US2] Create FolderOperations component in apps/web/src/components/filesystem/FolderOperations.tsx (create, rename, delete, move folder handlers)
- [ ] T038 [US2] Create Edge Function for folder operations in apps/api/src/functions/folders/index.ts (POST, PUT, DELETE /folders endpoints with circular reference check)
- [ ] T039 [US2] Add circular reference validation to PUT /folders/:id in apps/api/src/functions/folders/index.ts (recursive parent check)
- [ ] T040 [US2] Implement path recomputation logic in apps/api/src/functions/folders/index.ts (recompute paths for folder and all descendants on rename/move)
- [ ] T041 [US2] Add Edge Function declaration for folders to apps/api/supabase/config.toml (folders function with custom entrypoint)
- [ ] T042 [US2] Deploy folders Edge Function to remote Supabase (cd apps/api && npm run deploy:functions)
- [ ] T043 [US2] Extend documents Edge Function with PATCH endpoint in apps/api/src/functions/documents/index.ts (PATCH /documents/:id for rename/move with path recomputation)
- [ ] T044 [US2] Implement real-time subscriptions for file tree in apps/web/src/components/filesystem/FileSystemProvider.tsx (subscribe to folders and documents changes)
- [ ] T045 [US2] Add optimistic UI updates for file operations in apps/web/src/components/filesystem/FolderOperations.tsx (immediate tree update with rollback on error)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - users can create, edit, organize, and navigate documents

---

## Phase 5: User Story 3 - Three-Panel Desktop Workspace (Priority: P1)

**Goal**: Desktop users see a three-panel layout (file tree, editor, AI chat) providing immediate access to all core features without navigation between screens

**Independent Test**: Open the application on a desktop browser, verify all three panels are visible with fixed proportions, and confirm each panel functions independently

### Implementation for User Story 3

- [ ] T046 [P] [US3] Create WorkspaceLayout component in packages/ui/src/components/workspace-layout.tsx (three-panel desktop layout primitive with fixed 20/50/30 proportions)
- [ ] T047 [P] [US3] Create PanelDivider component in packages/ui/src/components/panel-divider.tsx (visual separator between panels)
- [ ] T048 [P] [US3] Create AIChat placeholder component in apps/web/src/components/chat/AIChat.tsx (placeholder for future AI chat integration)
- [ ] T049 [US3] Create WorkspaceLayout page in apps/web/src/components/layout/WorkspaceLayout.tsx (integrates FileTreeContainer, DocumentEditor, AIChat)
- [ ] T050 [US3] Add workspace route in apps/web/src/pages/workspace.tsx (main workspace page with three-panel layout)
- [ ] T051 [US3] Implement responsive layout detection in apps/web/src/lib/hooks/useMediaQuery.ts (detect desktop vs mobile breakpoint at 1024px)
- [ ] T052 [US3] Add fade-in animation for document loading in apps/web/src/components/documents/DocumentEditor.tsx (200ms fade-in transition)
- [ ] T053 [US3] Add empty state for center panel in apps/web/src/components/layout/WorkspaceLayout.tsx (show EmptyState when no document selected)

**Checkpoint**: All P1 user stories complete - MVP delivers create/edit, organize/navigate, and desktop workspace

---

## Phase 6: User Story 4 - Mobile Adaptive Interface (Priority: P2)

**Goal**: Mobile users see a focused single-panel view with toggle between document and chat, and file tree accessible via slide-out menu

**Independent Test**: Open the application on a mobile browser, navigate between document and chat views, access the file tree menu, and perform basic file operations

### Implementation for User Story 4

- [ ] T054 [P] [US4] Create MobileLayout component in packages/ui/src/components/mobile-layout.tsx (single-panel focus view with bottom toggle)
- [ ] T055 [P] [US4] Create BottomNavigation component in packages/ui/src/components/bottom-navigation.tsx (Document/Chat toggle buttons)
- [ ] T056 [P] [US4] Create SlideOutMenu component in packages/ui/src/components/slide-out-menu.tsx (file tree overlay with slide-in/out animation)
- [ ] T057 [US4] Create MobileWorkspace page in apps/web/src/components/layout/MobileLayout.tsx (single-panel layout with view switching)
- [ ] T058 [US4] Implement view state management in apps/web/src/lib/state/mobile.ts (Valtio state for active view: document or chat)
- [ ] T059 [US4] Add view transition animation in apps/web/src/components/layout/MobileLayout.tsx (150ms slide transition between document and chat)
- [ ] T060 [US4] Implement slide-out menu logic in apps/web/src/components/layout/MobileLayout.tsx (menu overlay with tap-outside to close)
- [ ] T061 [US4] Add touch target size validation in packages/ui/src/components/ (ensure all mobile interactive elements are ≥44x44px)
- [ ] T062 [US4] Update WorkspaceLayout to conditionally render desktop or mobile layout in apps/web/src/components/layout/WorkspaceLayout.tsx (based on useMediaQuery hook)

**Checkpoint**: Mobile experience complete - users can access all features on mobile devices

---

## Phase 7: User Story 5 - Document Indexing for AI Context (Priority: P2)

**Goal**: Documents are automatically processed for search and AI context retrieval in the background, invisible to users

**Independent Test**: Create documents with distinct content, wait for background indexing, then use search functionality to verify content is discoverable

### Implementation for User Story 5

- [ ] T063 [P] [US5] Create index-document Edge Function in apps/api/src/functions/index-document/index.ts (background job to fetch content, chunk, generate embeddings, store in document_chunks)
- [ ] T064 [P] [US5] Implement retry logic with exponential backoff in apps/api/src/functions/index-document/index.ts (retry up to 3 times on failure)
- [ ] T065 [US5] Add indexing status updates in apps/api/src/functions/index-document/index.ts (update documents.indexing_status: pending → in_progress → completed/failed)
- [ ] T066 [US5] Create database trigger to queue indexing in Supabase SQL Editor (queue_document_indexing function fires on INSERT/UPDATE to documents)
- [ ] T067 [US5] Attach indexing trigger to documents table in Supabase SQL Editor (trigger calls index-document Edge Function via pg_net.http_post)
- [ ] T068 [US5] Add Edge Function declaration for index-document to apps/api/supabase/config.toml (index-document function with custom entrypoint)
- [ ] T069 [US5] Deploy index-document Edge Function to remote Supabase (cd apps/api && npm run deploy:functions)
- [ ] T070 [US5] Update POST /documents endpoint to queue indexing in apps/api/src/functions/documents/index.ts (set indexing_status to pending)
- [ ] T071 [US5] Update PUT /documents/:id endpoint to re-queue indexing in apps/api/src/functions/documents/index.ts (re-queue on content change)
- [ ] T072 [US5] Add cascade delete for document_chunks in apps/api/src/db/schema.ts (delete chunks when document deleted)
- [ ] T073 [US5] Create IndexingStatus indicator component in packages/ui/src/components/indexing-status.tsx (badge showing pending/in_progress/completed/failed)
- [ ] T074 [US5] Add indexing status to file tree nodes in apps/web/src/components/filesystem/FileTreeContainer.tsx (visual indicator for indexing state)

**Checkpoint**: Document indexing fully automated - content ready for AI features

---

## Phase 8: User Story 6 - Upload Existing Documents (Priority: P2)

**Goal**: Users can import existing markdown or text files from their computer via drag-and-drop or file picker

**Independent Test**: Prepare markdown/text files locally, upload them via drag-and-drop or file picker, and verify they appear in the file tree and are searchable

### Implementation for User Story 6

- [ ] T075 [P] [US6] Create UploadButton component in packages/ui/src/components/upload-button.tsx (file picker trigger button)
- [ ] T076 [P] [US6] Create DropZone component in packages/ui/src/components/drop-zone.tsx (drag-and-drop visual feedback with border pulse animation)
- [ ] T077 [P] [US6] Create UploadProgress component in packages/ui/src/components/upload-progress.tsx (progress bar or percentage indicator)
- [ ] T078 [US6] Create DocumentUpload smart component in apps/web/src/components/documents/DocumentUpload.tsx (handles file selection, validation, upload)
- [ ] T079 [US6] Create Edge Function for document upload in apps/api/src/functions/documents/index.ts (POST /documents endpoint with multipart form data, file validation, Storage upload, metadata insert)
- [ ] T080 [US6] Implement file type validation in apps/api/src/functions/documents/index.ts (only allow .md and .txt, return 400 for invalid types)
- [ ] T081 [US6] Implement file size validation in apps/api/src/functions/documents/index.ts (1 byte to 10MB, return 413 for oversized files)
- [ ] T082 [US6] Add duplicate name handling in apps/api/src/functions/documents/index.ts (append number like "Document (1)" on name conflict)
- [ ] T083 [US6] Implement client-side pre-flight validation in apps/web/src/components/documents/DocumentUpload.tsx (instant feedback before upload attempt)
- [ ] T084 [US6] Add upload progress tracking in apps/web/src/lib/state/upload.ts (track progress, errors, completed uploads)
- [ ] T085 [US6] Integrate drag-and-drop in file tree in apps/web/src/components/filesystem/FileTreeContainer.tsx (drop zone on tree and editor area)
- [ ] T086 [US6] Add upload error handling in apps/web/src/components/documents/DocumentUpload.tsx (show toast notifications with retry option)
- [ ] T087 [US6] Implement background upload queue in apps/web/src/components/documents/DocumentUpload.tsx (sequential uploads with overall progress indicator)

**Checkpoint**: Document upload complete - users can import existing files

---

## Phase 9: User Story 7 - Full-Text Search Across Documents (Priority: P3)

**Goal**: Users can search across all documents and receive ranked results with highlighted matches

**Independent Test**: Create multiple documents with different content, perform various search queries, and verify results are relevant and ranked appropriately

### Implementation for User Story 7

- [ ] T088 [US7] Add tsvector column to documents table in apps/api/src/db/schema.ts (search_vector for full-text search)
- [ ] T089 [US7] Create search vector update trigger in Supabase SQL Editor (auto-update search_vector from name + content_text)
- [ ] T090 [US7] Attach search vector trigger to documents table in Supabase SQL Editor (trigger on INSERT/UPDATE)
- [ ] T091 [US7] Create GIN index for search_vector in Supabase SQL Editor (fast full-text search)
- [ ] T092 [US7] Push updated schema to remote database (cd apps/api && npm run db:push)
- [ ] T093 [P] [US7] Create search-documents Edge Function in apps/api/src/functions/search-documents/index.ts (GET /search endpoint with full-text and vector similarity search)
- [ ] T094 [P] [US7] Create SearchInterface component in packages/ui/src/components/search-interface.tsx (search input with results modal or slide-out panel)
- [ ] T095 [P] [US7] Create SearchResults component in packages/ui/src/components/search-results.tsx (ranked results list with match highlighting)
- [ ] T096 [US7] Implement full-text search query in apps/api/src/functions/search-documents/index.ts (tsvector search with websearch config, ranked by relevance)
- [ ] T097 [US7] Implement vector similarity search in apps/api/src/functions/search-documents/index.ts (RPC function search_document_chunks with cosine similarity)
- [ ] T098 [US7] Create search RPC function in Supabase SQL Editor (search_document_chunks function for semantic search)
- [ ] T099 [US7] Add Edge Function declaration for search-documents to apps/api/supabase/config.toml (search-documents function with custom entrypoint)
- [ ] T100 [US7] Deploy search-documents Edge Function to remote Supabase (cd apps/api && npm run deploy:functions)
- [ ] T101 [US7] Create SearchContainer smart component in apps/web/src/components/search/SearchInterface.tsx (handles search queries, displays results)
- [ ] T102 [US7] Add search keyboard shortcut in apps/web/src/components/layout/WorkspaceLayout.tsx (Cmd/Ctrl+F to open search)
- [ ] T103 [US7] Implement result click handler in apps/web/src/components/search/SearchInterface.tsx (open document with match highlighting)
- [ ] T104 [US7] Add empty state for no search results in apps/web/src/components/search/SearchResults.tsx (guidance to refine query)

**Checkpoint**: All user stories complete - full feature set delivered

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T105 [P] Add animations to folder expand/collapse in packages/ui/src/components/file-tree.tsx (150ms arrow rotation, 200ms content slide-down on desktop)
- [ ] T106 [P] Add animations to mobile transitions in apps/web/src/components/layout/MobileLayout.tsx (100-150ms for all mobile animations)
- [ ] T107 [P] Add prefers-reduced-motion support in apps/web/src/styles/animations.css (disable non-essential animations for accessibility)
- [ ] T108 [P] Add keyboard navigation to file tree in packages/ui/src/components/file-tree.tsx (arrow keys, Enter, Escape, Delete shortcuts)
- [ ] T109 [P] Add ARIA labels to all interactive elements in packages/ui/src/components/ (screen reader support for toolbar buttons, tree nodes)
- [ ] T110 [P] Add focus indicators to all interactive elements in packages/ui/src/styles/focus.css (visible focus state for keyboard navigation)
- [ ] T111 Implement offline mode with queue in apps/web/src/lib/hooks/useOfflineSync.ts (queue operations during offline, sync on reconnect)
- [ ] T112 Add connection status indicator in apps/web/src/components/layout/Header.tsx (online/offline badge)
- [ ] T113 Code cleanup and refactoring across all components (remove console.logs, standardize error handling)
- [ ] T114 Performance optimization for large file trees in apps/web/src/components/filesystem/FileTreeContainer.tsx (lazy-load folders with 100+ children)
- [ ] T115 Run quickstart.md validation (follow quickstart steps to verify all components work)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-9)**: All depend on Foundational phase completion
  - **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
  - **User Story 2 (P1)**: Can start after Foundational - No dependencies on other stories (can run parallel to US1)
  - **User Story 3 (P1)**: Depends on US1 and US2 (integrates FileTreeContainer and DocumentEditor)
  - **User Story 4 (P2)**: Depends on US1, US2, US3 (adapts desktop layout for mobile)
  - **User Story 5 (P2)**: Can start after Foundational - No dependencies on other stories (can run parallel to US1-4)
  - **User Story 6 (P2)**: Depends on US2 (uses file tree and folder structure)
  - **User Story 7 (P3)**: Depends on US5 (requires document indexing)
- **Polish (Phase 10)**: Depends on all desired user stories being complete

### Critical Path for MVP (P1 Stories Only)

1. Phase 1: Setup (T001-T005)
2. Phase 2: Foundational (T006-T021) - **CRITICAL BLOCKING PHASE**
3. Phase 3: User Story 1 (T022-T031) - Can start after Phase 2
4. Phase 4: User Story 2 (T032-T045) - Can start after Phase 2 (parallel to US1)
5. Phase 5: User Story 3 (T046-T053) - Requires US1 and US2 complete
6. MVP READY - Stop here for initial release

### User Story Dependencies

- **User Story 1 (P1)**: Independent - Can start immediately after Foundational
- **User Story 2 (P1)**: Independent - Can start immediately after Foundational (parallel to US1)
- **User Story 3 (P1)**: Depends on US1 + US2 (integrates both)
- **User Story 4 (P2)**: Depends on US1 + US2 + US3 (mobile adaptation)
- **User Story 5 (P2)**: Independent - Can run parallel to US1-4
- **User Story 6 (P2)**: Depends on US2 (file tree integration)
- **User Story 7 (P3)**: Depends on US5 (indexing required)

### Within Each User Story

- Models/components marked [P] can run in parallel
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 1 (Setup)**: T001, T002, T003 can run in parallel

**Phase 2 (Foundational)**:

- Database policies: T007, T008 can run parallel (after T006)
- Storage triggers: T012, T013 can run parallel (after T011)
- Valtio states: T018, T019 can run parallel (after T017)
- Backend services: T021 can run parallel with T020

**After Foundational Phase Completes**:

- User Story 1 and User Story 2 can run completely in parallel
- User Story 5 can run in parallel with US1-4

**Within User Story 1**: T022, T023, T024 can run in parallel (different UI components)

**Within User Story 2**: T032, T033, T034 can run in parallel (different UI components)

**Within User Story 3**: T046, T047, T048 can run in parallel (different UI components)

**Within User Story 4**: T054, T055, T056 can run in parallel (different UI components)

**Within User Story 5**: T063, T064, T065 can run in parallel (different parts of Edge Function)

**Within User Story 6**: T075, T076, T077 can run in parallel (different UI components)

**Within User Story 7**: T093, T094, T095 can run in parallel (different components)

**Phase 10 (Polish)**: T105, T106, T107, T108, T109, T110 can run in parallel (different files)

---

## Parallel Example: User Story 1

```bash
# Launch all UI components for User Story 1 together:
Task: "Create MarkdownEditor component in packages/ui/src/components/markdown-editor.tsx"
Task: "Create SaveIndicator component in packages/ui/src/components/save-indicator.tsx"
Task: "Create EmptyState component in packages/ui/src/features/empty-state.tsx"
```

---

## Implementation Strategy

### MVP First (P1 Stories Only - Recommended)

1. ✅ Complete Phase 1: Setup (T001-T005)
2. ✅ Complete Phase 2: Foundational (T006-T021) - **CRITICAL BLOCKING PHASE**
3. ✅ Complete Phase 3: User Story 1 (T022-T031) - Create/Edit capability
4. ✅ Complete Phase 4: User Story 2 (T032-T045) - File organization (can run parallel to US1)
5. ✅ Complete Phase 5: User Story 3 (T046-T053) - Desktop workspace
6. **STOP and VALIDATE**: Test all P1 stories work together
7. **Deploy/Demo MVP** - Core value delivered!

**MVP Scope**: 53 tasks (T001-T053)
**Estimated Timeline**: 5-7 days for solo developer, 3-4 days with parallel team

### Incremental Delivery (Add P2/P3 Stories)

After MVP is validated and deployed:

1. Add User Story 4 (Mobile) - T054-T062 (9 tasks)
2. Add User Story 5 (Indexing) - T063-T074 (12 tasks) - Can run parallel to US4
3. Add User Story 6 (Upload) - T075-T087 (13 tasks)
4. Add User Story 7 (Search) - T088-T104 (17 tasks)
5. Add Polish - T105-T115 (11 tasks)

**Full Feature Set**: 115 tasks total
**Estimated Timeline**: 10-14 days for solo developer, 6-8 days with parallel team

### Parallel Team Strategy

With multiple developers after Foundational phase completes:

1. **Team completes Setup + Foundational together** (T001-T021)
2. Once Foundational is done:
   - **Developer A**: User Story 1 (Create/Edit) - T022-T031
   - **Developer B**: User Story 2 (File Tree) - T032-T045
   - **Developer C**: User Story 5 (Indexing) - T063-T074
3. Once US1 + US2 complete:
   - **Developer A**: User Story 3 (Desktop Layout) - T046-T053
   - **Developer B**: User Story 6 (Upload) - T075-T087
4. Once US3 complete:
   - **Developer A**: User Story 4 (Mobile) - T054-T062
5. Once US5 complete:
   - **Developer C**: User Story 7 (Search) - T088-T104
6. **All developers**: Polish (T105-T115)

---

## Summary

**Total Tasks**: 115

- Phase 1 (Setup): 5 tasks
- Phase 2 (Foundational): 16 tasks ⚠️ BLOCKS all user stories
- Phase 3 (US1 - Create/Edit): 10 tasks - P1 🎯
- Phase 4 (US2 - File Tree): 14 tasks - P1 🎯
- Phase 5 (US3 - Desktop): 8 tasks - P1 🎯
- Phase 6 (US4 - Mobile): 9 tasks - P2
- Phase 7 (US5 - Indexing): 12 tasks - P2
- Phase 8 (US6 - Upload): 13 tasks - P2
- Phase 9 (US7 - Search): 17 tasks - P3
- Phase 10 (Polish): 11 tasks

**MVP Scope** (P1 only): 53 tasks (T001-T053)
**Full Feature**: 115 tasks

**Parallel Opportunities**:

- Setup: 3 parallel tasks
- Foundational: 6 parallel tasks
- User Story 1: 3 parallel tasks
- User Story 2: 3 parallel tasks
- User Story 3: 3 parallel tasks
- User Story 4: 3 parallel tasks
- User Story 5: 3 parallel tasks
- User Story 6: 3 parallel tasks
- User Story 7: 3 parallel tasks
- Polish: 6 parallel tasks
- **User Story 1 + User Story 2 can run completely in parallel** (28 tasks)
- **User Story 5 can run parallel to US1-4** (12 tasks)

**Independent Test Criteria**:

- US1: Create document → Edit with formatting → Close browser → Reopen → Content persists ✓
- US2: Create folders → Move files → Rename items → Tree updates correctly ✓
- US3: Desktop browser → See three panels → All panels functional ✓
- US4: Mobile browser → Toggle views → Access file tree menu ✓
- US5: Create documents → Wait for indexing → Search finds content ✓
- US6: Upload files → Appear in tree → Searchable ✓
- US7: Search query → Results appear <1s → Click opens with highlights ✓

**Suggested MVP Path**: Complete T001-T053 (Phases 1-5) for core P1 features, validate independently, then iterate with P2/P3 stories based on user feedback.

---

## Notes

- All tasks follow strict checklist format: `- [ ] [ID] [P?] [Story?] Description with file path`
- [P] tasks = different files, no dependencies within their phase
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Edge Function-First Security: All mutations go through backend Edge Functions (no direct client Storage access)
- Server-Controlled Fields: IDs, user_id, storage_path, path, version all generated/computed server-side
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
