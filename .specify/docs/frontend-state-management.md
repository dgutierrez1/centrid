---
title: State Management with Valtio
summary: Valtio proxy-based state with optimistic updates and real-time sync
---

<!-- After editing this file, run: npm run sync-docs -->

# State Management with Valtio

## Why Valtio (Not Redux/Zustand)

Real-time subscriptions already keep data fresh. Adding caching libraries creates:
- Dual state (cache + Valtio)
- Cache invalidation complexity
- Optimistic update conflicts

Custom hooks + Valtio are lighter and purpose-built for real-time apps.

## Optimistic Update Pattern

```
1. Generate temp ID
2. Update Valtio state with temp data
3. Call service (returns promise)
4. On success: Replace temp with real data
5. On error: Rollback + toast.error()
6. Real-time subscription confirms server state
```

## Example

```typescript
// Optimistic folder creation
const tempId = `temp-${Date.now()}`
folderState.folders[tempId] = { id: tempId, name: 'New Folder' }

try {
  const folder = await api.post('/folders', { name: 'New Folder' })
  delete folderState.folders[tempId]
  folderState.folders[folder.id] = folder
  toast.success('Folder created')
} catch (error) {
  delete folderState.folders[tempId]
  toast.error('Failed to create folder')
}

// Real-time subscription updates automatically
```

## Rules

- ✅ Use plain objects with bracket notation: `state.items[id]`
- ✅ Optimistic updates for all mutations
- ✅ Real-time subscriptions reconcile server state
- ❌ NEVER use `Map` (Valtio doesn't track Map.get())
- ❌ NEVER use React Query/SWR alongside Valtio

## Gotchas

**Map vs Object**: Valtio's `useSnapshot` doesn't track `Map.get()` calls. Use plain objects with bracket notation instead of Maps for reactive state.

**Rendering Intermediate States**: Fast async operations (<100ms) may complete before React renders intermediate states. Add 100ms delay before async ops when UI feedback (loading spinners, save indicators) is critical.

## References

- State examples: `apps/web/src/lib/state/`
- Hooks with optimistic updates: `apps/web/src/lib/hooks/useFilesystemOperations.ts`
- Real-time context: `apps/web/src/lib/contexts/filesystem.context.tsx`
