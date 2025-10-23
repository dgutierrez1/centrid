# Implementation Plan: File System & Markdown Editor with AI Context Management

**Branch**: `003-filesystem-markdown-editor` | **Date**: 2025-10-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-filesystem-markdown-editor/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement a full file system with hierarchical folder/document structure, TipTap-based markdown editor with auto-save, and three-panel desktop workspace (file tree, editor, AI chat). Mobile uses single-panel focus view with toggles. Documents stored in Supabase Storage with metadata in PostgreSQL, automatically indexed for search and AI context retrieval via background jobs triggered by database changes. Supports document upload via drag-and-drop or file picker.

## Technical Context

**Language/Version**: TypeScript (Next.js 14, React 18)
**Primary Dependencies**: TipTap (ProseMirror-based markdown editor), react-arborist (file tree), Supabase (Storage + PostgreSQL + Edge Functions), Valtio (state), TailwindCSS, shadcn/ui
**Storage**: PostgreSQL (metadata: folders, documents, document_chunks tables) + Supabase Storage (actual file content at documents/{user_id}/{document_id}/{filename})
**Testing**: NEEDS CLARIFICATION (likely Jest + React Testing Library for frontend, integration tests for Edge Functions)
**Target Platform**: Web (desktop + mobile browsers), PWA
**Project Type**: Web (monorepo with apps/web frontend, apps/api backend)
**Performance Goals**: <300ms file tree operations, <1s search results for 1000 docs, <60s indexing for 50-page documents, <5s upload for <1MB files, auto-save after 3s inactivity
**Constraints**: Auto-save reliability 99%+, offline editing with sync on reconnect, real-time updates <100ms propagation, mobile touch targets ≥44x44px, desktop animations 150-250ms, mobile animations 100-150ms
**Scale/Scope**: MVP targets single user with up to 1000 documents, hierarchical folder structure (unlimited depth), markdown/text file support only (.md, .txt)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Component Architecture Discipline
✅ **PASS** - Feature design separates UI components (in packages/ui and apps/web/src/components/ui) from smart containers (apps/web/src/components/ for documents/, layout/, search/). FileTree, MarkdownEditor, and WorkspaceLayout are presentational. DocumentManager, FileSystemProvider are smart containers.

### Principle II: Universal Platform Strategy
✅ **PASS** - Three-panel desktop + single-panel mobile architecture follows mobile-first design. Touch targets specified as ≥44x44px. Backend API-first with Edge Functions. PWA-compatible.

### Principle III: Persistent Knowledge Graph with RAG
✅ **PASS** - Document indexing integrated via database triggers → background jobs → document_chunks table with embeddings. Supports future RAG context retrieval for AI chat (right panel). Storage architecture enables persistent context.

### Principle IV: Managed Backend Stack
✅ **PASS** - Uses Supabase Storage (file content), PostgreSQL (metadata), Edge Functions (indexing jobs), RLS on folders/documents tables for user isolation. Real-time subscriptions for save status and file tree updates.

### Principle V: End-to-End Type Safety
✅ **PASS** - TypeScript throughout. Database types auto-generated from Supabase schema. TipTap and react-arborist have TypeScript support. Zod validation for file uploads (type, size).

### Principle VI: Live Collaboration Architecture
✅ **PASS** - Supabase Realtime subscriptions for file tree changes (create/rename/delete/move) and save status updates. Valtio state updates automatically on real-time notifications. No polling.

### Principle VII: MCP-Based Document Access
⚠️ **DEFER** - MCP tools for agent file access not implemented in MVP. Feature establishes storage architecture (Supabase Storage + metadata table) compatible with future MCP integration. Documents stored with content accessible via PostgreSQL or Storage signed URLs.

### Principle VIII: Zero-Trust Data Access via RLS
✅ **PASS** - RLS policies on folders, documents, document_chunks tables enforce auth.uid() = user_id. Storage bucket policies check user_id in path. JWT-based auth required for all operations. Edge Functions use ANON_KEY (respects RLS) for user operations.

### Principle IX: MVP-First Discipline
✅ **PASS** - Feature scoped to core file management + editor + indexing. Deferred: version history, collaborative editing, sharing, templates, export, advanced markdown (math/diagrams), resizable panels, syntax highlighting, bulk operations, trash bin. Schema iteration via Drizzle push (not migrations). Rule of Three respected (no premature abstraction).

### Principle X: Monorepo Architecture
✅ **PASS** - UI components in packages/ui (FileTree, MarkdownEditor primitives). Smart components in apps/web/src/components/. Backend logic in apps/api/src/services/ (document processing, indexing). Edge Functions in apps/api/src/functions/. Import boundaries respected.

### Principle XI: Visual Design System
⚠️ **DEFER** - No design.md found in specs/003-filesystem-markdown-editor/. Design iteration should use apps/design-system + Playwright MCP screenshots before implementation. **ACTION REQUIRED**: Run /speckit.design before implementation to create visual designs and validate UX.

### Summary
**Status**: ✅ PASS with 2 deferrals (MCP tools, visual design)
- **Critical Gates**: All critical principles pass (component architecture, RLS, type safety, mobile-first, monorepo boundaries)
- **Deferrals**: MCP integration (post-MVP), visual design (should run /speckit.design before implementation)
- **Violations**: None
- **Proceed to Phase 0**: YES

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
packages/
├── ui/
│   └── src/
│       ├── components/
│       │   ├── file-tree.tsx          # react-arborist wrapper component
│       │   ├── markdown-editor.tsx    # TipTap editor component
│       │   ├── upload-button.tsx      # File upload trigger
│       │   └── workspace-layout.tsx   # Three-panel/mobile layout primitives
│       └── features/
│           ├── document-card.tsx      # Document preview card
│           └── empty-state.tsx        # Empty state component
└── shared/
    ├── types/
    │   ├── database.types.ts          # Generated from Supabase schema
    │   ├── filesystem.ts              # Folder, Document, FileSystemNode types
    │   └── upload.ts                  # Upload types
    └── utils/
        ├── file-validation.ts         # File type/size validation (Zod schemas)
        └── path-utils.ts              # Path manipulation utilities

apps/
├── web/
│   └── src/
│       ├── components/
│       │   ├── documents/
│       │   │   ├── DocumentManager.tsx      # Smart container for file operations
│       │   │   ├── DocumentEditor.tsx       # Smart editor container with auto-save
│       │   │   └── DocumentUpload.tsx       # Smart upload container
│       │   ├── filesystem/
│       │   │   ├── FileSystemProvider.tsx   # Context provider for file tree state
│       │   │   ├── FileTreeContainer.tsx    # Smart file tree container
│       │   │   └── FolderOperations.tsx     # CRUD operations for folders
│       │   └── layout/
│       │       ├── WorkspaceLayout.tsx      # Three-panel desktop layout
│       │       └── MobileLayout.tsx         # Single-panel mobile layout
│       ├── lib/
│       │   ├── state/
│       │   │   ├── filesystem.ts            # Valtio state for file tree
│       │   │   ├── editor.ts                # Valtio state for editor
│       │   │   └── upload.ts                # Valtio state for upload progress
│       │   └── supabase.ts                  # Supabase client initialization
│       └── pages/
│           └── workspace.tsx                # Main workspace page
└── api/
    ├── src/
    │   ├── services/
    │   │   ├── document-processor.ts        # Document chunking logic
    │   │   ├── indexing.ts                  # Embedding generation
    │   │   └── storage.ts                   # Supabase Storage operations
    │   ├── functions/
    │   │   ├── index-document/
    │   │   │   └── index.ts                 # Background indexing Edge Function
    │   │   ├── upload-document/
    │   │   │   └── index.ts                 # File upload handler
    │   │   └── search-documents/
    │   │       └── index.ts                 # Full-text search endpoint
    │   ├── db/
    │   │   └── schema.ts                    # Drizzle schema (folders, documents, document_chunks)
    │   └── lib/
    │       └── supabase.ts                  # Supabase client config
    └── supabase/
        ├── config.toml                      # Function entrypoints
        └── migrations/                      # Generated migrations (post-MVP)
```

**Structure Decision**: Web application (Option 2) with monorepo architecture. Frontend in apps/web, backend in apps/api. Pure UI components in packages/ui, shared types/utils in packages/shared. Smart components handle data fetching and state management. Backend self-contained with business logic, Edge Functions, and database schema together.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

No constitutional violations. All gates passed with 2 deferrals (MCP tools for post-MVP, visual design to be created via /speckit.design before implementation).

