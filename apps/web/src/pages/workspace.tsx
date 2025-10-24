/**
 * Workspace Page - File System & Markdown Editor
 *
 * Main workspace route for the filesystem markdown editor feature.
 * Renders the three-panel layout (file tree | editor | AI chat).
 *
 * Route: /workspace
 * Auth: Required (redirects to /login if not authenticated)
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@/lib/supabase';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';

export default function WorkspacePage() {
  const router = useRouter();
  const supabase = createClient();

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      // Not authenticated - redirect to login with return URL
      router.push(`/login?redirect=/workspace`);
    }
  };

  return <WorkspaceLayout />;
}
