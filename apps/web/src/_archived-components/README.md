# Archived Components

This directory contains components and routes that have been deprecated or replaced but kept for reference.

## Thread Pages (Archived 2025-10-28)

**Location**: `thread-pages/`

**Reason**: Route consolidation - `/thread` routes replaced by `/workspace` routes

**Migration**:
- `/thread` → `/workspace`
- `/thread/:threadId` → `/workspace/:workspaceId`

**Why kept**: Reference for implementation patterns and route structure

**Components**:
- `thread/index.tsx` - Thread index page (now `workspace/index.tsx`)
- `thread/[threadId].tsx` - Thread detail page (now `workspace/[docId].tsx`)

Both routes used `WorkspaceContainer` component, which is now used directly by `/workspace` routes.

## When to Archive

Archive components when:
1. Route structure changes (like this case)
2. Component is replaced but contains valuable implementation patterns
3. Deprecated feature kept for historical reference

## When to Delete

Delete archived components when:
1. No longer needed for reference (after 6+ months)
2. Implementation patterns fully migrated to new structure
3. Confirmed no dependencies or links remain

---

**Note**: This directory is NOT in Next.js pages routing (underscore prefix prevents routing).
