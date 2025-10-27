import React from 'react';
import { DesignSystemFrame } from '../../components/DesignSystemFrame';
import { ApprovalCard } from '@centrid/ui/features';
import type { FileChangePreview } from '@centrid/ui/features';

const mockChanges: FileChangePreview[] = [
  {
    path: 'rag-architecture.md',
    changeType: 'create',
    preview: `# RAG Architecture

## Key Components

1. **Vector Store**: pgvector for embeddings
2. **Retrieval**: Semantic search with reranking
3. **Generation**: Claude 3.5 Sonnet with context

## Performance Targets
- Retrieval: < 300ms
- End-to-end: < 10s`,
  },
];

const mockMultipleChanges: FileChangePreview[] = [
  {
    path: 'rag-architecture.md',
    changeType: 'create',
    preview: '# RAG Architecture\n\n...',
  },
  {
    path: 'chunking-strategies.md',
    changeType: 'create',
    preview: '# Chunking Strategies\n\n...',
  },
  {
    path: 'config.yaml',
    changeType: 'update',
    preview: 'embedding_model: text-embedding-3-small\nchunk_size: 250',
  },
];

export default function ApprovalModalPage() {
  const [isApproving, setIsApproving] = React.useState(false);
  const [isRejecting, setIsRejecting] = React.useState(false);

  const handleApprove = () => {
    setIsApproving(true);
    setTimeout(() => {
      setIsApproving(false);
      alert('Changes approved! Tool calls would execute now.');
    }, 1000);
  };

  const handleReject = () => {
    setIsRejecting(true);
    setTimeout(() => {
      setIsRejecting(false);
      alert('Changes rejected. Agent will be notified.');
    }, 800);
  };

  return (
    <DesignSystemFrame
      title="Approval Modal"
      description="Tool call approval flow during agent execution"
      backHref="/ai-agent-system"
    >
      <div className="space-y-6">
        {/* Description */}
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-600 dark:text-gray-400">
            The Approval Card appears inline during agent streaming when the agent requests to
            create/update files. The user reviews the changes and approves/rejects before the tool
            call executes. Streaming pauses until approval is given.
          </p>
        </div>

        {/* Single File Change */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Single File Change
          </h3>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
            <ApprovalCard
              changes={mockChanges}
              isOngoing={true}
              onApprove={handleApprove}
              onReject={handleReject}
              isApproving={isApproving}
              isRejecting={isRejecting}
              data-testid="approval-card-single"
            />
          </div>
        </div>

        {/* Multiple File Changes */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Multiple File Changes
          </h3>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
            <ApprovalCard
              changes={mockMultipleChanges}
              isOngoing={true}
              onApprove={handleApprove}
              onReject={handleReject}
              data-testid="approval-card-multiple"
            />
          </div>
        </div>

        {/* Approval Flow */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Approval Flow</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold text-sm shrink-0">
                1
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Agent Proposes Changes
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  During streaming, agent calls write_file or update_file tool
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold text-sm shrink-0">
                2
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Streaming Pauses</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Approval card appears inline, streaming stops, waiting for user decision
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold text-sm shrink-0">
                3
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">User Decides</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click "Approve" to execute, "Reject" to cancel tool call
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold text-sm shrink-0">
                4
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Streaming Resumes
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  If approved: tool executes, result shown in tool call block. If rejected: agent
                  continues without executing
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Features</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">File Preview</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Shows file path, change type (create/update), and content preview
              </p>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Multiple Changes
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Batch approval for multiple file operations in one tool call
              </p>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Loading States
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Buttons show loading state during approval/rejection processing
              </p>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Streaming Pause
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Agent streaming halts until user makes decision, then resumes
              </p>
            </div>
          </div>
        </div>
      </div>
    </DesignSystemFrame>
  );
}
