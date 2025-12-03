import type { GetServerSideProps } from 'next';

/**
 * Thread Detail Route (Legacy)
 * Redirects /thread/:threadId → /workspace/:threadId
 *
 * @deprecated Use /workspace/:id instead
 * Route kept for backward compatibility
 */
export default function ThreadDetailPage() {
  return null; // Never renders - server-side redirect
}

/**
 * Permanent Redirect to Workspace
 * Preserves the ID parameter in the redirect
 * 301 redirect tells browsers/search engines this is permanent
 */
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { threadId } = context.params as { threadId: string };

  return {
    redirect: {
      destination: `/workspace/${threadId}`,
      permanent: true, // 301 redirect (SEO-friendly)
    },
  };
};
