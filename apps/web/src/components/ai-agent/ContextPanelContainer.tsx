import { useState } from 'react';
import { useSnapshot } from 'valtio';
import { ContextPanel, type ContextGroup } from '@centrid/ui/features/ai-agent-system';
import { FileAutocomplete, type FileItem } from '@centrid/ui/components';
import { aiAgentState } from '@/lib/state/aiAgentState';
import { useAutocomplete } from '@/lib/hooks/useAutocomplete';

interface ContextPanelContainerProps {
  onAddContext: (entityType: 'file' | 'folder', path: string) => void;
  onRemoveContext: (referenceId: string) => void;
  onAddToExplicit?: (fileId: string) => void;
  onHideBranch?: (branchId: string) => void;
}

export function ContextPanelContainer({
  onAddContext,
  onRemoveContext,
  onAddToExplicit,
  onHideBranch,
}: ContextPanelContainerProps) {
  const snap = useSnapshot(aiAgentState);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Hook up autocomplete search for the add reference modal
  const autocomplete = useAutocomplete(snap.currentThread?.id || '', {
    entityType: 'all',
    minQueryLength: 1,
    debounceMs: 300,
  });

  // Helper to format tooltip text (T088)
  const formatTooltip = (type: string, ref: any) => {
    const formatTime = (timestamp: string) => {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffHours < 1) return 'less than an hour ago';
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    };

    if (type === 'semantic' && ref.sourceBranch) {
      // Semantic matches: "From: [Branch Name] ([relationship type]), Created: [timestamp], Relevance: [score]"
      return `From: ${ref.sourceBranch}${ref.relationshipType ? ` (${ref.relationshipType})` : ''}, Created: ${formatTime(ref.timestamp)}, Relevance: ${(ref.relevanceScore || 0).toFixed(2)}`;
    } else if (type === 'branch') {
      // Branch context: "From: [Branch Name], Inherited from parent"
      return `From: ${ref.sourceBranch || 'Parent Branch'}, Inherited from parent`;
    } else if (type === 'artifacts') {
      // Artifacts: "Created in this thread: [timestamp]"
      return `Created in this thread: ${formatTime(ref.timestamp || ref.addedTimestamp)}`;
    }

    return undefined;
  };

  // Build context groups matching enhanced UI requirements (T077)
  // 6 priority tiers with proper coloring and weights
  const contextGroups: ContextGroup[] = [
    {
      type: 'explicit',
      title: 'Explicit Context',
      items: snap.contextReferences
        .filter((ref) => ref.priorityTier === 1 && (ref.source === 'manual' || ref.source === '@-mentioned'))
        .map((ref) => ({
          referenceType: ref.entityType as 'file' | 'folder' | 'thread',
          name: ref.name || ref.entityReference.split('/').pop() || ref.entityReference,
          priorityTier: ref.priorityTier,
          timestamp: ref.addedTimestamp,
        })),
      emptyMessage: 'No explicit context added',
    },
    {
      type: 'semantic',
      title: 'Semantic Matches',
      items: snap.contextReferences
        .filter((ref) => ref.priorityTier === 3 && ref.source === 'agent-added' && ref.entityType !== 'thread')
        .map((ref) => ({
          referenceType: ref.entityType as 'file' | 'folder' | 'thread',
          name: ref.name || ref.entityReference.split('/').pop() || ref.entityReference,
          priorityTier: ref.priorityTier,
          timestamp: ref.addedTimestamp,
          relevanceScore: ref.relevanceScore,
          relationship: ref.relationship,
          sourceBranch: ref.sourceBranch,
        })),
      emptyMessage: 'No semantic matches found',
    },
    {
      type: 'branch',
      title: 'Branch Context',
      items: snap.contextReferences
        .filter((ref) => ref.source === 'inherited')
        .map((ref) => ({
          referenceType: ref.entityType as 'file' | 'folder' | 'thread',
          name: ref.name || ref.entityReference.split('/').pop() || ref.entityReference,
          priorityTier: ref.priorityTier,
          timestamp: ref.addedTimestamp,
          sourceBranch: ref.sourceBranch,
        })),
      emptyMessage: 'No inherited context',
    },
    {
      type: 'artifacts',
      title: 'Artifacts from this Thread',
      items: snap.contextReferences
        .filter((ref) => ref.source === 'agent-added' && ref.entityType === 'file')
        .map((ref) => ({
          referenceType: 'file' as const,
          name: ref.name || ref.entityReference.split('/').pop() || ref.entityReference,
          priorityTier: ref.priorityTier,
          timestamp: ref.addedTimestamp,
        })),
      emptyMessage: 'No artifacts created yet',
    },
  ];

  const handleTogglePanel = () => {
    setIsExpanded(!isExpanded);
  };

  const handleAddReference = () => {
    setShowAddModal(true);
    setShowDropdown(true);
  };

  const handleAddReferenceSelect = (item: FileItem) => {
    // Add the selected item to context
    onAddContext(item.type === 'thread' ? 'folder' : item.type, item.path || item.id);

    // Close the modal and reset
    setShowAddModal(false);
    setShowDropdown(false);
    autocomplete.setQuery('');
  };

  const handleAddReferenceClose = () => {
    setShowAddModal(false);
    setShowDropdown(false);
  };

  const handleReferenceClick = (item: any) => {
    // TODO: Navigate to file or preview
    console.log('Reference clicked:', item);
  };

  const handleRemoveReference = (item: any) => {
    onRemoveContext(item.id);
  };

  const handleAddToExplicitAction = (fileId: string) => {
    if (onAddToExplicit) {
      onAddToExplicit(fileId);
    }
  };

  const handleHideBranchAction = (branchId: string) => {
    if (onHideBranch) {
      onHideBranch(branchId);
    }
  };

  const handleDismiss = (itemId: string) => {
    // Remove from view (local state update)
    console.log('Dismiss item:', itemId);
  };

  return (
    <>
      <ContextPanel
        contextGroups={contextGroups}
        isExpanded={isExpanded}
        onTogglePanel={handleTogglePanel}
        onAddReference={handleAddReference}
        onReferenceClick={handleReferenceClick}
        onRemoveReference={handleRemoveReference}
      />

      {/* Add Reference Modal/Dropdown */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Add Context Reference
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Search for files, folders, or threads to add
              </p>
            </div>

            <div className="p-4 relative">
              <input
                type="text"
                placeholder="Search files, folders, and threads..."
                value={autocomplete.query}
                onChange={(e) => autocomplete.setQuery(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                autoFocus
              />

              {/* Dropdown Results */}
              {showDropdown && (
                <div className="absolute top-full left-4 right-4 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-64 overflow-y-auto z-10">
                  {autocomplete.isLoading ? (
                    <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      Searching...
                    </div>
                  ) : autocomplete.items.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      {autocomplete.query ? 'No results found' : 'Start typing to search...'}
                    </div>
                  ) : (
                    <div className="p-2">
                      {['thread', 'file', 'folder'].map((type) => {
                        const typeItems = autocomplete.items.filter(
                          (item) => item.type === type
                        );
                        if (typeItems.length === 0) return null;

                        return (
                          <div key={type} className="mb-2">
                            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 px-2 py-1">
                              {type === 'thread'
                                ? 'Threads'
                                : type === 'file'
                                  ? 'Files'
                                  : 'Folders'}
                            </div>
                            {typeItems.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => handleAddReferenceSelect(item)}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {item.name}
                                </span>
                                {item.branchName && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                                    [{item.branchName}]
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
              <button
                onClick={handleAddReferenceClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
