import React, { useState, useEffect } from 'react';
import { Button } from '../../components/button';
import { Input } from '../../components/input';
import { Badge } from '../../components/badge';
import { cn } from '../../lib/utils';
import { ThreadTreeNode, type ThreadNode } from './ThreadTreeNode';

// Branch interface for backward compatibility
export interface Branch {
  id: string;
  title: string;
  parentThreadId: string | null;
  depth: number;
  artifactCount: number;
  lastActivity: string;
  summary?: string;
}

export interface ConsolidateModalProps {
  isOpen: boolean;
  currentBranch?: {
    id: string;
    title: string;
  };
  childBranches?: Branch[];
  /** Called when user confirms consolidation. Receives branch IDs, target folder, and file name. */
  onConfirmConsolidate: (branchIds: string[], targetFolder: string, fileName: string) => void;
  /** Called when user approves consolidated content. Receives target folder and file name. */
  onApproveConsolidation: (targetFolder: string, fileName: string) => void;
  onRejectConsolidation: () => void;
  onClose: () => void;
  consolidationProgress?: {
    step: string;
    current: number;
    total: number;
  } | null;
  consolidatedContent?: string | null;
  sourceProvenanceMap?: Record<string, string>;
  className?: string;
}

// Helper to build tree structure from flat list
function buildThreadTree(branches: Branch[]): ThreadNode[] {
  const branchMap = new Map<string, ThreadNode>();
  const rootNodes: ThreadNode[] = [];

  // First pass: create all nodes
  branches.forEach(branch => {
    branchMap.set(branch.id, {
      id: branch.id,
      title: branch.title,
      artifactCount: branch.artifactCount,
      lastActivity: branch.lastActivity,
      parentThreadId: branch.parentThreadId,
      children: [],
    });
  });

  // Second pass: build parent-child relationships
  branches.forEach(branch => {
    const node = branchMap.get(branch.id)!;
    if (branch.parentThreadId === null || branch.parentThreadId === undefined) {
      rootNodes.push(node);
    } else {
      const parent = branchMap.get(branch.parentThreadId);
      if (parent) {
        if (!parent.children) parent.children = [];
        parent.children.push(node);
      } else {
        // Parent not found, treat as root
        rootNodes.push(node);
      }
    }
  });

  return rootNodes;
}

type ModalStep = 'selection' | 'processing' | 'preview' | 'complete';

/**
 * ConsolidateModal - Multi-step consolidation workflow
 *
 * Features:
 * - Step 1: Branch selection with collapsible tree structure and checkboxes
 * - Step 2: Processing with progress bar
 * - Step 3: Preview with approval/reject buttons
 * - Step 4: Complete with success message
 *
 * UX Spec: ux.md lines 922-935
 * Flow: ux.md lines 196-227 (Flow 4: Consolidate)
 */
export function ConsolidateModal({
  isOpen,
  currentBranch,
  childBranches = [],
  onConfirmConsolidate,
  onApproveConsolidation,
  onRejectConsolidation,
  onClose,
  consolidationProgress,
  consolidatedContent,
  sourceProvenanceMap,
  className,
}: ConsolidateModalProps) {
  const [selectedBranchIds, setSelectedBranchIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [fileName, setFileName] = useState('consolidated-analysis.md');
  const [targetFolder, setTargetFolder] = useState('/workspace');
  const [step, setStep] = useState<ModalStep>('selection');

  // Build complete branches array including the current branch as root
  const allBranches: Branch[] = React.useMemo(() => {
    if (!currentBranch) return childBranches;

    const rootBranch: Branch = {
      id: currentBranch.id,
      title: currentBranch.title,
      parentThreadId: null,
      depth: 0,
      artifactCount: 0,
      lastActivity: new Date().toISOString(),
    };

    return [rootBranch, ...childBranches];
  }, [currentBranch, childBranches]);

  // Build thread tree structure
  const threadTree = React.useMemo(() => {
    return buildThreadTree(allBranches);
  }, [allBranches]);

  // Initialize with all child branches selected and all nodes expanded
  useEffect(() => {
    if (isOpen && childBranches.length > 0) {
      setSelectedBranchIds(new Set(childBranches.map((b) => b.id)));
      // Expand all parent nodes by default
      const parentsWithChildren = allBranches.filter(b =>
        allBranches.some(child => child.parentThreadId === b.id)
      );
      setExpandedIds(new Set(parentsWithChildren.map(b => b.id)));
      setFileName('consolidated-analysis.md');
      setTargetFolder('/workspace');
      setStep('selection');
    }
  }, [isOpen, childBranches, allBranches]);

  // Update step based on progress
  useEffect(() => {
    if (consolidationProgress) {
      setStep('processing');
    } else if (consolidatedContent) {
      setStep('preview');
    }
  }, [consolidationProgress, consolidatedContent]);

  // Close on Escape (only in selection step)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && step === 'selection') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, step, onClose]);

  const handleToggleBranch = (branchId: string) => {
    setSelectedBranchIds((prev) => {
      const next = new Set(prev);
      if (next.has(branchId)) {
        next.delete(branchId);
      } else {
        next.add(branchId);
      }
      return next;
    });
  };

  const handleToggleExpanded = (branchId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(branchId)) {
        next.delete(branchId);
      } else {
        next.add(branchId);
      }
      return next;
    });
  };

  const handleStartConsolidation = () => {
    onConfirmConsolidate(Array.from(selectedBranchIds), targetFolder, fileName);
  };

  const handleApprove = () => {
    onApproveConsolidation(targetFolder, fileName);
    setStep('complete');
  };

  const handleReject = () => {
    onRejectConsolidation();
    setStep('selection');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
        onClick={step === 'selection' ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="consolidate-title"
      >
        <div
          className={cn(
            'bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full',
            step === 'preview' ? 'max-w-4xl' : 'max-w-2xl',
            'animate-in slide-in-from-top-4 duration-300',
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 id="consolidate-title" className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Consolidate Artifacts
            </h2>
            {currentBranch && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                From: {currentBranch.title}
              </p>
            )}
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {step === 'selection' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Select Branches
                  </label>
                  <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                    <ThreadTreeNode
                      threads={threadTree}
                      variant="checkbox"
                      expandedThreads={expandedIds}
                      selectedThreads={selectedBranchIds}
                      onCheckboxToggle={handleToggleBranch}
                      onToggleExpanded={handleToggleExpanded}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="target-folder" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Target Folder
                    </label>
                    <Input
                      id="target-folder"
                      type="text"
                      value={targetFolder}
                      onChange={(e) => setTargetFolder(e.target.value)}
                      placeholder="/workspace"
                    />
                  </div>
                  <div>
                    <label htmlFor="file-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      File Name
                    </label>
                    <Input
                      id="file-name"
                      type="text"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      placeholder="consolidated-analysis.md"
                    />
                  </div>
                </div>

                {/* Preview full path */}
                <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Full Path</div>
                  <div className="text-sm font-mono text-gray-900 dark:text-gray-100">
                    {targetFolder.endsWith('/') ? targetFolder : `${targetFolder  }/`}{fileName}
                  </div>
                </div>
              </div>
            )}

            {step === 'processing' && consolidationProgress && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    {consolidationProgress.step}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {consolidationProgress.current} of {consolidationProgress.total}
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${(consolidationProgress.current / consolidationProgress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {step === 'preview' && consolidatedContent && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Preview
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 max-h-96 overflow-y-auto font-mono text-sm">
                    <pre className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">
                      {consolidatedContent.slice(0, 2000)}
                      {consolidatedContent.length > 2000 && '\n\n... (truncated for preview)'}
                    </pre>
                  </div>
                </div>

                {sourceProvenanceMap && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sources
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {Object.values(sourceProvenanceMap).map((branchId, idx) => {
                        const branch = childBranches.find((b) => b.id === branchId);
                        return branch ? (
                          <Badge key={idx} variant="outline">
                            {branch.title}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-target-folder" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Target Folder
                    </label>
                    <Input
                      id="edit-target-folder"
                      type="text"
                      value={targetFolder}
                      onChange={(e) => setTargetFolder(e.target.value)}
                      placeholder="/workspace"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-file-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      File Name
                    </label>
                    <Input
                      id="edit-file-name"
                      type="text"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Preview full path */}
                <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Full Path</div>
                  <div className="text-sm font-mono text-gray-900 dark:text-gray-100">
                    {targetFolder.endsWith('/') ? targetFolder : `${targetFolder  }/`}{fileName}
                  </div>
                </div>
              </div>
            )}

            {step === 'complete' && (
              <div className="text-center py-8">
                <div className="mx-auto h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Consolidation Complete
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                  {targetFolder.endsWith('/') ? targetFolder : `${targetFolder  }/`}{fileName}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 rounded-b-lg flex items-center justify-end gap-3">
            {step === 'selection' && (
              <>
                <Button type="button" variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="default"
                  onClick={handleStartConsolidation}
                  disabled={selectedBranchIds.size === 0 || !fileName}
                >
                  Consolidate
                </Button>
              </>
            )}

            {step === 'processing' && (
              <Button type="button" variant="ghost" disabled>
                Processing...
              </Button>
            )}

            {step === 'preview' && (
              <>
                <Button type="button" variant="ghost" onClick={handleReject}>
                  Reject
                </Button>
                <Button type="button" variant="default" onClick={handleApprove}>
                  Approve & Create
                </Button>
              </>
            )}

            {step === 'complete' && (
              <Button type="button" variant="default" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
