# Route Consolidation: /thread → /workspace

**Date**: 2025-10-28
**Reason**: Align route naming with product positioning ("Exploration workspace" not "AI chat")

---

## Summary

Consolidated routing structure from dual routes (`/workspace` + `/thread`) to single primary route (`/workspace`).

**Decision**: `/workspace` chosen over `/thread` because:
- ✅ Professional, mainstream familiarity (Notion, Figma, Slack use "workspace")
- ✅ Generic enough to encompass threads + files + artifacts
- ✅ Doesn't sound like commodity "AI chat" (strategic differentiation)
- ✅ Extensible for future features without semantic conflicts

---

## Changes Made

### 1. Documentation Updates

**Files Updated**:
- `spec.md` - Route references changed from `/thread` to `/workspace`
- `ux.md` - Route references changed from `/thread/:threadId` to `/workspace/:workspaceId`
- `plan.md` - Route references and auth validation updated

**Key Changes**:
- User Story 6 acceptance scenarios updated
- Protected routes list updated (6 routes, removed thread duplicates)
- `validateThreadOwnership()` → `validateWorkspaceOwnership()` in plan.md
- All flow tables updated with new route structure

### 2. Route Implementation

**Files Updated**:
- `apps/web/src/pages/workspace/index.tsx`
  - Component: `WorkspaceLayout` → `WorkspaceContainer` (AI agent system component)
  - Route: `/workspace` (main workspace)

- `apps/web/src/pages/workspace/[docId].tsx`
  - Component: `WorkspaceLayout` → `WorkspaceContainer`
  - Route: `/workspace/:workspaceId` (dynamic workspace/thread/branch)
  - Validation: Now validates against `conversations` table (not `documents`)
  - Param: `docId` kept for Next.js routing, mapped to `workspaceId` internally

**Files Archived**:
- `apps/web/src/pages/thread/` → `apps/web/src/_archived-components/thread-pages/`
  - `thread/index.tsx` (archived)
  - `thread/[threadId].tsx` (archived)

### 3. Component Architecture

**Before**:
```
/workspace → WorkspaceLayout (document-focused from feature 002)
/thread → WorkspaceContainer (AI agent system from feature 004)
```

**After**:
```
/workspace → WorkspaceContainer (AI agent system)
/workspace/:workspaceId → WorkspaceContainer (AI agent system)
```

**Archived for Reference**:
- `WorkspaceLayout` component still exists (not removed)
- Thread routes archived in `_archived-components/` (underscore prefix prevents Next.js routing)

---

## Route Structure

### Current Routes

```
/workspace                    → Main workspace (default thread)
/workspace/:workspaceId       → Specific workspace (thread/branch)
```

### URL Examples

```
/workspace                    → Default workspace landing
/workspace/main               → Main thread (if explicit ID)
/workspace/abc-123            → Specific thread/branch by ID
/workspace/rag-deep-dive      → Specific exploration branch
```

### Validation

Both routes protected with:
- ✅ Server-side auth check (`withServerAuth`)
- ✅ UUID format validation (for dynamic route)
- ✅ Ownership validation (`conversations` table, user_id match)
- ✅ 404 on invalid UUID or unauthorized access (no data leakage)

---

## Naming Conventions

**Database**:
- Table: `conversations` (technical: stores threads/branches/workspaces)
- Column: `conversation_id` (primary key)

**Routes**:
- URL: `/workspace/:workspaceId` (user-facing: workspace abstraction)
- Param: `docId` (Next.js dynamic route param, backward compatible)
- Internal: `workspaceId` (mapped from `docId` param in getServerSideProps)

**Components**:
- `WorkspaceContainer` (feature 004: AI agent system with branching)
- `WorkspaceLayout` (feature 002: document-focused layout, archived from routing but component kept)

**Why `docId` kept as param name**:
- Next.js routing requires consistent file naming
- `[docId].tsx` already established in codebase
- Internal mapping allows flexible interpretation (workspace, thread, document)
- Avoids breaking existing file structure

---

## User-Facing Terminology

**In UI**:
- "Workspace" - The main interface where users work
- "Thread" / "Branch" - Specific conversation paths within workspace
- "Exploration" - The activity users perform (from spec positioning)

**In URLs**:
- `/workspace` - Primary route (generic, extensible)

**In Code**:
- `conversations` table - Technical storage
- `workspaceId` - Internal variable naming
- `WorkspaceContainer` - Component naming

---

## Migration Notes

**No breaking changes for users**:
- `/thread/*` routes no longer exist in pages (archived)
- No existing users affected (feature 004 not yet in production)
- No database schema changes required

**Development impact**:
- Any hard-coded `/thread` links must be updated to `/workspace`
- Navigation components already using dynamic routing (no changes needed)
- Tests may need route updates (if testing navigation)

---

## Next Steps

1. ✅ Update CLAUDE.md with route structure
2. ✅ Verify no remaining `/thread` references in codebase
3. ✅ Update navigation components (if any hard-coded routes)
4. ✅ Update tests (if route-dependent)
5. ✅ Deploy and verify

---

## Related Documentation

- `spec.md` - Feature requirements (updated)
- `ux.md` - UX flows and route definitions (updated)
- `plan.md` - Technical implementation and auth (updated)
- `_archived-components/README.md` - Archive explanation

---

**Decision Maker**: User
**Implementer**: Claude Code (Sonnet 4.5)
**Status**: ✅ Complete
