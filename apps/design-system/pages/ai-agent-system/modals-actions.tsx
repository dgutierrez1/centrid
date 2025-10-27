import { useState } from 'react';
import {
  BranchActions,
  CreateBranchModal,
  ConsolidateModal,
  ProvenanceHeader,
  type Provenance,
} from '@centrid/ui/features';

export default function ModalsActionsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConsolidateModal, setShowConsolidateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [consolidationProgress, setConsolidationProgress] = useState<{
    step: string;
    current: number;
    total: number;
  } | null>(null);
  const [consolidatedContent, setConsolidatedContent] = useState<string | null>(null);

  // Sample data
  const currentBranch = {
    id: 'main',
    title: 'Main Thread',
    hasChildren: true,
  };

  const childBranches = [
    { id: 'rag', title: 'RAG Deep Dive', artifactCount: 5 },
    { id: 'finetuning', title: 'Fine-tuning Research', artifactCount: 3 },
    { id: 'prompting', title: 'Prompting Strategies', artifactCount: 4 },
  ];

  const sampleProvenance = {
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    createdBy: 'agent' as const,
    sourceBranch: 'rag',
    sourceThreadId: 'thread-rag',
    sourceMessageId: 'msg-123',
    lastEditedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
    lastEditedBy: 'user' as const,
    lastEditSourceThreadId: 'thread-main',
  };

  const handleCreateBranch = () => {
    setShowCreateModal(true);
  };

  const handleConfirmCreate = (name: string) => {
    setCreateLoading(true);
    // Simulate API call
    setTimeout(() => {
      console.log('Creating branch:', name);
      setCreateLoading(false);
      setShowCreateModal(false);
    }, 2000);
  };

  const handleConsolidate = () => {
    setShowConsolidateModal(true);
    setConsolidationProgress(null);
    setConsolidatedContent(null);
  };

  const handleConfirmConsolidate = (branchIds: string[], fileName: string) => {
    console.log('Consolidating branches:', branchIds, fileName);
    // Simulate processing
    setConsolidationProgress({ step: 'Traversing tree', current: 0, total: 3 });

    setTimeout(() => {
      setConsolidationProgress({ step: 'Gathering artifacts', current: 1, total: 3 });
    }, 1000);

    setTimeout(() => {
      setConsolidationProgress({ step: 'Consolidating', current: 2, total: 3 });
    }, 2000);

    setTimeout(() => {
      setConsolidationProgress({ step: 'Generating document', current: 3, total: 3 });
    }, 3000);

    setTimeout(() => {
      setConsolidationProgress(null);
      setConsolidatedContent(
        `# Consolidated Analysis\n\n## RAG Approaches\n\nFrom RAG Deep Dive: Vector embeddings with pgvector...\n\n## Fine-tuning Strategies\n\nFrom Fine-tuning Research: LoRA configuration with...\n\n## Prompting Best Practices\n\nFrom Prompting Strategies: Few-shot examples work best when...`
      );
    }, 4000);
  };

  const handleApproveConsolidation = (fileName: string) => {
    console.log('Approved consolidation:', fileName);
    setTimeout(() => {
      setShowConsolidateModal(false);
      setConsolidationProgress(null);
      setConsolidatedContent(null);
    }, 1000);
  };

  const handleRejectConsolidation = () => {
    console.log('Rejected consolidation');
    setConsolidationProgress(null);
    setConsolidatedContent(null);
  };

  const handleGoToSource = (threadId: string, messageId?: string) => {
    console.log('Navigate to:', threadId, messageId);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Modals & Actions
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Branch actions, modals for branch creation and consolidation, and provenance header
          </p>
        </div>

        {/* Branch Actions */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Branch Actions
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  With Children (Consolidate enabled)
                </h3>
                <BranchActions
                  currentBranch={currentBranch}
                  hasChildren={true}
                  onCreateBranch={handleCreateBranch}
                  onConsolidate={handleConsolidate}
                  onOpenTreeView={() => console.log('Open tree view')}
                />
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Without Children (Consolidate disabled)
                </h3>
                <BranchActions
                  currentBranch={{ ...currentBranch, hasChildren: false }}
                  hasChildren={false}
                  onCreateBranch={handleCreateBranch}
                  onConsolidate={handleConsolidate}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Provenance Header */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Provenance Header
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="space-y-0">
              <div>
                <h3 className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900">
                  With Full Provenance
                </h3>
                <ProvenanceHeader
                  provenance={sampleProvenance}
                  sourceBranchTitle="RAG Deep Dive"
                  contextSummary="RAG best practices discussion and implementation patterns"
                  onGoToSource={handleGoToSource}
                />
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700">
                <h3 className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900">
                  Manual File (No Provenance)
                </h3>
                <ProvenanceHeader
                  provenance={null}
                  onGoToSource={handleGoToSource}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Modal Triggers */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Modals (Click to Open)
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-medium"
              >
                Open Create Branch Modal
              </button>
              <button
                onClick={() => {
                  setShowConsolidateModal(true);
                  setConsolidationProgress(null);
                  setConsolidatedContent(null);
                }}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-medium"
              >
                Open Consolidate Modal
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Modals */}
      <CreateBranchModal
        isOpen={showCreateModal}
        currentThreadTitle={currentBranch.title}
        onConfirmCreate={handleConfirmCreate}
        onCancel={() => setShowCreateModal(false)}
        isLoading={createLoading}
      />

      <ConsolidateModal
        isOpen={showConsolidateModal}
        currentBranch={currentBranch}
        childBranches={childBranches}
        onConfirmConsolidate={handleConfirmConsolidate}
        onApproveConsolidation={handleApproveConsolidation}
        onRejectConsolidation={handleRejectConsolidation}
        onClose={() => setShowConsolidateModal(false)}
        consolidationProgress={consolidationProgress}
        consolidatedContent={consolidatedContent}
      />
    </div>
  );
}
