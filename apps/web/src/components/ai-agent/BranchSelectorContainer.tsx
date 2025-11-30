import { useSnapshot } from 'valtio';
import { useRouter } from 'next/router';
import { BranchSelector } from '@centrid/ui/features/ai-agent-system';
import { aiAgentState } from '@/lib/state/aiAgentState';

export function BranchSelectorContainer() {
  const snap = useSnapshot(aiAgentState);
  const router = useRouter();

  // Calculate depth for each thread based on parent chain
  const calculateDepth = (threadId: string): number => {
    const thread = snap.branchTree.threads.find((t) => t.id === threadId);
    if (!thread || !thread.parentThreadId) return 0;
    return 1 + calculateDepth(thread.parentThreadId);
  };

  // Build branch tree structure matching UI component expectations
  const branches = snap.branchTree.threads.map((thread) => ({
    id: thread.id,
    title: thread.title,
    parentThreadId: thread.parentThreadId || null,
    depth: calculateDepth(thread.id),
    artifactCount: 0, // TODO: Calculate from messages/files
    lastActivity: thread.updatedAt,
    summary: thread.summary,
  }));

  // Find current branch object
  const currentBranch = snap.currentThread
    ? branches.find((b) => b.id === snap.currentThread?.id)
    : undefined;

  const handleSelectBranch = (branchId: string) => {
    router.push(`/workspace/${branchId}`);
  };

  return (
    <BranchSelector
      currentBranch={currentBranch}
      branches={branches}
      mode="dropdown"
      onSelectBranch={handleSelectBranch}
    />
  );
}
