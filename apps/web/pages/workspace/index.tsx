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
 * Server-Side Auth Check
 * Protects workspace - redirects to login if not authenticated
 * Auth token automatically handled by middleware + cookies
 */
export const getServerSideProps: GetServerSideProps = withServerAuth(
  async (context, { user, supabase }) => {
    return {
      props: {},
    };
  }
);
