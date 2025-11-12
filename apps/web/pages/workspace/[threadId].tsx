/**
 * Thread Detail Page
 * Dynamic route: /workspace/{threadId}
 *
 * Re-exports from index.tsx to avoid code duplication while preserving URL structure.
 * The WorkspaceContainer component handles routing internally via router.query.threadId
 */
export { default, getServerSideProps } from './index';
