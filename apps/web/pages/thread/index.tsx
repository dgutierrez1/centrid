import type { GetServerSideProps } from 'next';

/**
 * Thread Index Route (Legacy)
 * Redirects /thread → /workspace
 *
 * @deprecated Use /workspace instead
 * Route kept for backward compatibility
 */
export default function ThreadIndexPage() {
  return null; // Never renders - server-side redirect
}

/**
 * Permanent Redirect to Workspace
 * 301 redirect tells browsers/search engines this is permanent
 */
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/workspace',
      permanent: true, // 301 redirect (SEO-friendly)
    },
  };
};
