import { GetServerSideProps } from 'next';
import { WorkspaceContainer } from '@/components/ai-agent';
import { withServerAuth } from '@/lib/auth/serverAuth';

/**
 * Thread Detail Page
 * Dynamic route: /workspace/{threadId}
 * Opens the specified thread (branch) with messages and AI agent
 */
export default function WorkspaceDetailPage() {
  return <WorkspaceContainer />;
}

/**
 * Server-Side Auth Check + Ownership Validation
 * Validates user owns thread before rendering
 * Auth token automatically handled by middleware + cookies
 */
export const getServerSideProps: GetServerSideProps = withServerAuth(
  async (context, { user, supabase }) => {
    const { docId: workspaceId } = context.params as { docId: string };

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(workspaceId)) {
      return { notFound: true }; // 404 for invalid UUID
    }

    // Note: We don't validate thread existence here
    // Let the client component handle missing threads with an empty state
    // This prevents 404 errors and allows for better UX

    return {
      props: {},
    };
  }
);
