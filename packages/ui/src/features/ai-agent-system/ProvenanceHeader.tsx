import { Badge } from '../../components/badge';
import { Button } from '../../components/button';
import { cn } from '../../lib/utils';
import type { Provenance } from './FileEditorPanel';

export interface ProvenanceHeaderProps {
  provenance: Provenance | null;
  sourceBranchTitle?: string; // Display title for sourceBranch
  contextSummary?: string; // Optional context summary
  onGoToSource: (threadId: string, messageId?: string) => void;
  className?: string;
}

/**
 * ProvenanceHeader - Display file provenance metadata
 *
 * Features:
 * - Shows creation context (branch, timestamp, creator)
 * - Shows last edit info if file was edited
 * - "Go to source" link to navigate to creation conversation
 * - Manual file indicator (no provenance)
 *
 * UX Spec: ux.md lines 888-902
 * Flow: ux.md lines 295-323 (Flow 7: View File with Provenance)
 */
export function ProvenanceHeader({
  provenance,
  sourceBranchTitle,
  contextSummary,
  onGoToSource,
  className
}: ProvenanceHeaderProps) {
  // Manual file (no provenance)
  if (!provenance) {
    return (
      <div className={cn('px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700', className)}>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Manual</Badge>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Created manually (no provenance tracking)
          </span>
        </div>
      </div>
    );
  }

  const formatDate = (date: string) => {
    const dateObj = new Date(date);
    const now = new Date();
    const diff = now.getTime() - dateObj.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return dateObj.toLocaleDateString();
  };

  return (
    <div className={cn('px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 space-y-3', className)}>
      {/* Creation Info */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Created in:
            </span>
            <Button
              variant="link"
              size="sm"
              onClick={() => onGoToSource(provenance.sourceThreadId, provenance.sourceMessageId)}
              className="h-auto p-0 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              {sourceBranchTitle || provenance.sourceBranch}
            </Button>
            <Badge variant={provenance.createdBy === 'agent' ? 'default' : 'secondary'}>
              {provenance.createdBy}
            </Badge>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(provenance.createdAt)}
            </span>
          </div>
          {contextSummary && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Context: {contextSummary}
            </p>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onGoToSource(provenance.sourceThreadId, provenance.sourceMessageId)}
          className="gap-2 shrink-0"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          Go to source
        </Button>
      </div>

      {/* Last Edit Info (if applicable) */}
      {provenance.lastEditedAt && (
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Last edited:
          </span>
          <Badge variant={provenance.lastEditedBy === 'agent' ? 'default' : 'secondary'} className="text-xs">
            {provenance.lastEditedBy}
          </Badge>
          {provenance.lastEditSourceThreadId && (
            <>
              <span className="text-sm text-gray-500 dark:text-gray-400">in thread</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {provenance.lastEditSourceThreadId}
              </span>
            </>
          )}
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {formatDate(provenance.lastEditedAt)}
          </span>
        </div>
      )}
    </div>
  );
}
