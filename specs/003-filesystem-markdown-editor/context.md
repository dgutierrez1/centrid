---
feature: "003-filesystem-markdown-editor"
number: "003"
short_name: "filesystem"
generated: "2025-11-24T00:00:00Z"
version: "2.0.0"
status: "completed"
source_docs:
  [
    "spec.md",
    "plan.md",
    "design.md",
    "data-model.md",
    "research.md",
    "tasks.md",
  ]
source_hash: "587319e8cab80fdf4b49e7022b23d426f90b2bd3002a647e575a12fe3ab07102"
code_discovery_hash: "5d2c5bce7833d9769c5a3b85757bf67173b6b602de7ae6349abc25b2b8592f32"
token_estimate: 2400
---

# Feature Context: File System & Markdown Editor

**ID:** `003-filesystem-markdown-editor` | **Status:** completed | **Code Discovered:** 2025-11-24

## Quick Summary

Solve context fragmentation by providing users with a hierarchical file system to organize markdown documents, with automatic saving, three-panel desktop workspace (files/editor/chat), and mobile-optimized views. Enables AI agents to search, index, and maintain optimal context across user knowledge base.

---

## Implementation State (Primary Source)

### Architecture Overview

**Layer Distribution:**

- UI: 9 designed components
- State Management: 13 hooks, 3 state stores, 1 context provider
- Backend: 1 service, GraphQL integration
- Database: 2 tables (files, folders)

### UI Layer (9 files)

**Designed Components** (packages/ui/src/features/filesystem-markdown-editor/):

- **DesktopWorkspace.tsx** - Three-panel layout (files/editor/AI chat) for desktop

  - Manages panel visibility and responsive layout
  - Integrates file tree, markdown editor, and AI workspace

- **FileTreeNode.tsx** - Recursive tree node for files/folders

  - Drag-and-drop support for file organization
  - Context menu integration (rename, delete, new file/folder)
  - **Reused by AI Agent System** for WorkspaceSidebar

- **MobileChatView.tsx** - Mobile-optimized chat interface

  - Swipeable views between chat and documents

- **MobileDocumentView.tsx** - Mobile-optimized document editor

  - Full-screen editing experience

- **ContextMenu.tsx** - Right-click menu for file operations

  - File/folder actions: rename, delete, new file, new folder

- **SearchResults.tsx** - File search results display

  - Semantic search integration ready

- **FileUploadModal.tsx** - Drag-drop file upload interface

  - Batch upload support

- **EmptyState.tsx** - Empty state for no files/folders

  - Prompts user to create first document

- **icons.tsx** - File type icons and tree UI icons

### State Management Layer (16 files)

**State Stores** (apps/web/src/lib/state/):

- **filesystemState.ts** - Valtio proxy for file/folder state

  - Fields: folders, files, selectedFileId, expandedFolderIds
  - Real-time sync with Supabase subscriptions

- **editor.ts** - Markdown editor state

  - Current file content, cursor position

- **fileMetadataState.ts** - File metadata tracking
  - Open files, unsaved changes detection
  - Last modified timestamps

**Hooks** (apps/web/src/lib/hooks/):

- **useFilesystemData.ts** - Load files/folders from backend

  - GraphQL query integration

- **useFilesystemOperations.ts** - CRUD operations for files/folders

  - Create, update, delete, move operations

- **useFilesystemRealtime.ts** - Real-time subscription management

  - Supabase subscriptions for file/folder changes

- **useLoadFile.ts** - Load file content into editor

  - Fetches file from backend, updates editor state

- **useSaveCurrentFile.ts** - Manual save trigger

  - Persists current file content

- **useAutoSave.ts** - Automatic save after 3s idle

  - Debounced save, prevents data loss

- **useFileTreeActions.ts** - File tree interactions

  - Expand/collapse folders, select files

- **usePersistedFileExpansion.ts** - Remember expanded folders

  - LocalStorage persistence

- **useDeleteFile.ts** - Delete file with confirmation

  - GraphQL mutation, optimistic updates

- **useUpdateFile.ts** - Update file content/metadata

  - GraphQL mutation

- **useWorkspaceHandlers.ts** - Workspace event handlers

  - File selection, panel toggling

- **useWorkspaceData.ts** - Combined workspace data loading

  - Loads files, folders, and AI agent threads

- **useCreateAgentFile.ts** - AI agent creates files
  - Tool call integration, provenance tracking

### Backend Services Layer (1 file)

**Services** (apps/api/src/services/):

- **filesystemService.ts** - Business logic for file/folder operations
  - Dependencies: Drizzle ORM, database tables
  - Methods: createFile, updateFile, deleteFile, moveFile, createFolder, deleteFolder
  - RLS enforcement at database level

### Data Access Layer (2 tables)

**Database Tables** (apps/api/src/db/schema.ts):

- **files** - User documents

  - Key fields: id, userId, folderId, name, content, createdAt, updatedAt
  - RLS: auth.uid() = userId
  - Indexes: userId, folderId

- **folders** - Hierarchical folder structure
  - Key fields: id, userId, parentId, name, createdAt
  - RLS: auth.uid() = userId
  - Indexes: userId, parentId
  - Supports recursive tree queries

### GraphQL Integration

**Operations Used:**

- Mutations: CreateFile, UpdateFile, DeleteFile, MoveFile, CreateFolder, DeleteFolder
- Queries: GetFiles, GetFolders, GetFileContent

---

## Data Flows (Traced from Code)

### Primary Flow 1: Create and Edit Document

**Entry**: DesktopWorkspace → "New Document" button

**Flow:**

```
1. useFilesystemOperations.createFile(name, folderId)  [useFilesystemOperations.ts]
2. └─> graphqlClient.mutation(CreateFileDocument)      [useFilesystemOperations.ts]
3.     └─> filesystemService.createFile(input)         [filesystemService.ts]
4.        └─> db.insert(files).values(...)             [PostgreSQL]
5. Real-time subscription updates filesystemState      [useFilesystemRealtime.ts]
6. User types in editor → useAutoSave triggers (3s idle)  [useAutoSave.ts]
7. └─> useUpdateFile.updateFile(id, content)          [useUpdateFile.ts]
8.     └─> graphqlClient.mutation(UpdateFileDocument)  [useUpdateFile.ts]
9.        └─> filesystemService.updateFile(id, data)   [filesystemService.ts]
10.           └─> db.update(files).set({content, updatedAt})  [PostgreSQL]
```

**Key files in flow:**

- packages/ui/src/features/filesystem-markdown-editor/DesktopWorkspace.tsx
- apps/web/src/lib/hooks/useFilesystemOperations.ts
- apps/web/src/lib/hooks/useAutoSave.ts
- apps/api/src/services/filesystemService.ts

### Primary Flow 2: Navigate and Organize Files

**Entry**: FileTreeNode → User clicks file/folder

**Flow:**

```
1. FileTreeNode.onClick(file) → useWorkspaceHandlers.selectFile(id)  [FileTreeNode.tsx]
2. └─> filesystemState.selectedFileId = id            [filesystem.ts]
3.     └─> useLoadFile.loadFile(id)                   [useLoadFile.ts]
4.        └─> graphqlClient.query(GetFileContent)     [useLoadFile.ts]
5.           └─> filesystemService.getFile(id)        [filesystemService.ts]
6.              └─> db.select().from(files).where(eq(files.id, id))  [PostgreSQL]
7. Editor state updated with file content             [editor.ts]
```

**Drag-and-drop flow:**

```
1. FileTreeNode.onDrop(file, targetFolder)           [FileTreeNode.tsx]
2. └─> useFilesystemOperations.moveFile(fileId, targetFolderId)  [useFilesystemOperations.ts]
3.     └─> graphqlClient.mutation(MoveFileDocument)  [useFilesystemOperations.ts]
4.        └─> filesystemService.moveFile(id, folderId)  [filesystemService.ts]
5.           └─> db.update(files).set({folderId})    [PostgreSQL]
6. Real-time subscription updates file tree          [useFilesystemRealtime.ts]
```

---

## Integration with AI Agent System (004)

**Component Reuse:**

- AI Agent System imports `FileTreeNode` from filesystem feature
- Used in `WorkspaceSidebar.tsx` to display files in unified workspace

**State Coordination:**

- `WorkspaceContainer.tsx` (AI Agent) manages both `aiAgentState` and `filesystemState`
- Three-panel layout: Files/Threads sidebar | Thread view | File editor
- File provenance tracking: files created by AI agents link back to source thread

**Shared Workspace Architecture:**

- Desktop: Files tab in left sidebar shows FileTreeNode tree
- Files can be @-mentioned in AI agent context
- AI agents can create files via tool calls (useCreateAgentFile)
- FileEditorPanel shows which thread created the file

**Data Flow:**

```
AI Agent creates file:
1. AI tool call → useCreateAgentFile.createFile(path, content, threadId)
2. └─> filesystemService.createFile({..., createdInThreadId: threadId})
3.     └─> files.insert({createdInThreadId, contextSummary, ...})
4. File appears in FileTreeNode tree with provenance badge
5. Click file → opens editor with "Created in thread X" header
```

---

## Spec Reference (Brief)

**Purpose**: Solve context fragmentation with hierarchical file organization, auto-save, and AI-optimized workspace.

**Key User Stories:**

- **US1: Create and Edit Markdown** - ✅ Implemented (DesktopWorkspace, useAutoSave, editor.ts)
- **US2: Navigate Hierarchical Structure** - ✅ Implemented (FileTreeNode, useFilesystemOperations, drag-drop)
- **US3: Three-Panel Desktop Workspace** - ✅ Implemented (DesktopWorkspace with files/editor/chat panels)
- **US4: Mobile-Optimized Views** - ✅ Implemented (MobileChatView, MobileDocumentView)
- **US5: Auto-Save** - ✅ Implemented (useAutoSave with 3s debounce)

**Tech Decisions** (from plan.md):

- **Valtio state management** - Simple proxy-based reactivity, real-time sync friendly
- **Supabase real-time** - Auto-sync file changes across tabs/users
- **Markdown editor** - Rich text with future diff support for AI suggestions
- **RLS at database** - Security enforced at DB layer, not application code

---

## Gap Analysis (Implementation vs Spec)

**Fully Implemented** ✅:

- File/folder CRUD operations
- Auto-save (3s debounce)
- Three-panel desktop workspace
- Mobile views
- Real-time synchronization
- Hierarchical file tree with drag-drop
- Context menu operations
- Integration with AI Agent System

**Partially Implemented** 🟡:

- Semantic search (SearchResults component exists, backend integration pending)
- File upload (FileUploadModal exists, backend handling incomplete)

**Missing Implementation** ❌:

- None (feature marked completed)

---

## Links

**Full Documentation:**

- [spec.md](./spec.md) - Complete requirements (5 user stories, acceptance criteria)
- [plan.md](./plan.md) - Technical approach (tech stack, decisions)
- [design.md](./design.md) - Component design and screenshots
- [data-model.md](./data-model.md) - Database schema details
- [research.md](./research.md) - Technical decision research
- [tasks.md](./tasks.md) - Implementation checklist

**Quick Code Navigation:**

- File tree component: packages/ui/src/features/filesystem-markdown-editor/FileTreeNode.tsx
- Workspace: packages/ui/src/features/filesystem-markdown-editor/DesktopWorkspace.tsx
- Auto-save: apps/web/src/lib/hooks/useAutoSave.ts
- Filesystem service: apps/api/src/services/filesystemService.ts
- Database schema: apps/api/src/db/schema.ts (files, folders tables)

---

_Context v2.0.0 | Code discovered: 2025-11-24 | Source hash: 587319e8... | Code hash: 5d2c5bce... | Run `/feature.filesystem` to reload_
