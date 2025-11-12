import { GetServerSideProps } from 'next';
import { WorkspaceContainer } from '@/components/ai-agent';
import { withServerAuth } from '@/lib/auth/serverAuth';

/**
 * Workspace Page
 * Main workspace route - AI-powered exploration workspace with branching threads
 * Route: /workspace
 */
export default function WorkspacePage() {
  return <WorkspaceContainer />;
}

/**
 * Server-Side Props
 * Auth check only - SSR handled by urql ssrExchange in _app.tsx
 */
export const getServerSideProps: GetServerSideProps = withServerAuth(
  async () => {
    // Auth check handled by withServerAuth wrapper
    return { props: {} };
  }
);
