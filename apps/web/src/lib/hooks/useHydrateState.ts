import { useEffect, useRef } from 'react'

/**
 * useHydrateState Hook
 *
 * Hydrates Valtio state from server-side props on initial render.
 * Prevents hydration on subsequent renders to avoid overwriting client-side changes.
 *
 * Pattern: Server data → Props → Hydrate Valtio → Real-time subscriptions sync updates
 *
 * Usage:
 *   // In page component
 *   function WorkspacePage({ files, folders }) {
 *     useHydrateState(() => {
 *       filesystemState.files = files
 *       filesystemState.folders = folders
 *     })
 *
 *     // Real-time subscriptions will keep state fresh after hydration
 *     useRealtimeSync('files', 'filesystemState')
 *
 *     return <FileManager />
 *   }
 *
 * @param hydrate - Function that hydrates Valtio state
 */
export function useHydrateState(hydrate: () => void) {
  const hasHydrated = useRef(false)

  useEffect(() => {
    // Only hydrate once on mount
    if (!hasHydrated.current) {
      hydrate()
      hasHydrated.current = true
    }
  }, []) // Empty deps - only run on mount
}

/**
 * useHydrateStateWithKey Hook
 *
 * Hydrates Valtio state from server-side props when a key changes.
 * Useful for pages that re-fetch data based on route params.
 *
 * Usage:
 *   function WorkspacePage({ id, files, folders }) {
 *     useHydrateStateWithKey(id, () => {
 *       filesystemState.files = files
 *       filesystemState.folders = folders
 *     })
 *
 *     return <FileManager />
 *   }
 *
 * @param key - Dependency key (e.g., workspace ID, session ID)
 * @param hydrate - Function that hydrates Valtio state
 */
export function useHydrateStateWithKey(key: string | number, hydrate: () => void) {
  const lastKey = useRef<string | number | null>(null)

  useEffect(() => {
    // Hydrate when key changes
    if (lastKey.current !== key) {
      hydrate()
      lastKey.current = key
    }
  }, [key]) // Re-run when key changes
}

/**
 * Conditional Hydration Helper
 *
 * Hydrates only if data is not already present in state.
 * Prevents overwriting client-side changes unnecessarily.
 *
 * Usage:
 *   useHydrateState(() => {
 *     hydrateIfEmpty(filesystemState, 'files', files)
 *     hydrateIfEmpty(filesystemState, 'folders', folders)
 *   })
 *
 * @param state - Valtio state object
 * @param key - Key to check and hydrate
 * @param data - Server data to hydrate
 */
export function hydrateIfEmpty<T>(state: any, key: string, data: T) {
  if (!state[key] || (Array.isArray(state[key]) && state[key].length === 0)) {
    state[key] = data
  }
}

/**
 * Batch Hydration Helper
 *
 * Hydrates multiple keys from server props in one operation.
 *
 * Usage:
 *   useHydrateState(() => {
 *     batchHydrate(filesystemState, {
 *       files,
 *       folders,
 *       currentFolderId: null,
 *     })
 *   })
 *
 * @param state - Valtio state object
 * @param data - Object with keys to hydrate
 */
export function batchHydrate<T extends Record<string, any>>(state: any, data: T) {
  Object.keys(data).forEach((key) => {
    state[key] = data[key]
  })
}
