# Archived: WorkspaceLayout Component

**Date Archived**: 2025-10-28
**Reason**: Replaced by WorkspaceContainer (AI agent system) for main workspace route

---

## What This Was

`WorkspaceLayout` was the main workspace component from **Feature 002** (document-focused workspace):
- Three-panel layout: File tree + Markdown editor + AI chat
- File/folder management with context menus
- Auto-save with version conflict resolution
- Search modal (Cmd+K)
- Upload functionality

**Used By**: `/workspace` route (before Feature 004)

---

## Why Archived

**Feature 004** (AI agent system) introduced `WorkspaceContainer` which provides:
- Branching threads/conversations
- Context management and semantic search
- File provenance tracking
- Consolidation from exploration tree

The workspace route (`/workspace`) now uses `WorkspaceContainer` instead of `WorkspaceLayout`.

---

## Component Still Available

`WorkspaceLayout.tsx` still exists at:
```
apps/web/src/components/layout/WorkspaceLayout.tsx
```

**Why kept in original location**:
- May be useful for future document-focused features
- Design patterns worth referencing (file tree, auto-save, conflict resolution)
- Can be integrated as a mode/view in WorkspaceContainer later

---

## Reference Value

This component demonstrates:
- ✅ Three-panel responsive layout pattern
- ✅ File tree with drag-and-drop (future)
- ✅ Auto-save with debouncing
- ✅ Version conflict resolution UI
- ✅ Search modal implementation
- ✅ Context menu patterns
- ✅ File upload with progress tracking

---

## Migration Notes

If you need document-focused workspace features:
1. `WorkspaceLayout` component still exists (not deleted)
2. Design system components still available in `@centrid/ui/features/filesystem-markdown-editor`
3. State management in `apps/web/src/lib/state/filesystem.ts`

**Current workspace**: Uses `WorkspaceContainer` for AI agent system
**Future possibility**: Integrate `WorkspaceLayout` as a "document mode" in WorkspaceContainer
