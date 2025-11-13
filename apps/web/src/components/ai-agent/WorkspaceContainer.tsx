import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useSnapshot } from 'valtio';
import { Workspace } from '@centrid/ui/features/ai-agent-system';
import type { File } from '@centrid/ui/features/ai-agent-system/WorkspaceSidebar';
import { CreateBranchModalContainer } from '@/components/ai-agent/CreateBranchModalContainer';
import { ConsolidateModalContainer } from '@/components/ai-agent-system/ConsolidateModalContainer';
import { ContextPanelContainer } from '@/components/ai-agent/ContextPanelContainer';
import { CreateDocumentModal } from '@/components/filesystem/CreateDocumentModal';
import { CreateFolderModal } from '@/components/filesystem/CreateFolderModal';
import { RenameModal } from '@/components/filesystem/RenameModal';
import { DeleteConfirmationModal } from '@/components/filesystem/DeleteConfirmationModal';
import { FileSystemProvider } from '@/lib/contexts/filesystem.context';
import { aiAgentState, aiAgentActions } from '@/lib/state/aiAgentState';
import { filesystemState } from '@/lib/state/filesystem';
import { fileMetadataState, openFile, closeFile } from '@/lib/state/fileMetadata';
import { useSaveCurrentFile } from '@/lib/hooks/useSaveCurrentFile';
import type { FileSystemNode } from '@/lib/types/ui';
import { useCreateBranch } from '@/lib/hooks/useCreateBranch';
import { useLoadThread } from '@/lib/hooks/useLoadThread';
import { useLoadThreads } from '@/lib/hooks/useLoadThreads';
import { useSendMessage } from '@/lib/hooks/useSendMessage';
import { useLoadFile } from '@/lib/hooks/useLoadFile';
import { useUpdateFile } from '@/lib/hooks/useUpdateFile';
import { useAddToExplicit } from '@/lib/hooks/useAddToExplicit';
import { useFilesystemOperations } from '@/lib/hooks/useFilesystemOperations';
import { useFileTreeActions } from '@/lib/hooks/useFileTreeActions';
import { useCreateAgentFile } from '@/lib/hooks/useCreateAgentFile';
import { useApproveToolCall } from '@/lib/hooks/useApproveToolCall';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { usePendingToolCall } from '@/lib/hooks/usePendingToolCall';
import { graphqlClient } from '@/lib/graphql/client';
import { useGraphQLQuery } from '@/lib/graphql/useGraphQLQuery';
import { GetThreadDocument, ListPendingToolCallsDocument, GetAgentRequestDocument } from '@/types/graphql';
import { createSubscription } from '@/lib/realtime';
import { toast } from 'react-hot-toast';
import { usePersistedThreadExpansion } from '@/lib/hooks/usePersistedThreadExpansion';
import { usePersistedFileExpansion } from '@/lib/hooks/usePersistedFileExpansion';
import { findPathToNode } from '@/lib/utils/tree-helpers';

/**
 * Convert FileSystemNode tree to flat File array for WorkspaceSidebar
 */
function flattenFileSystemNodes(nodes: readonly FileSystemNode[]): File[] {
  const result: File[] = [];

  function traverse(node: FileSystemNode) {
    result.push({
      id: node.id,
      name: node.name,
      path: node.path || '',
      type: node.type === 'document' ? 'file' : 'folder',
      parentId: node.parentId || null,
      size: 0, // FileSystemNode doesn't track size
      lastModified: new Date(), // FileSystemNode doesn't track updatedAt
    });

    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  nodes.forEach(traverse);
  return result;
}

/**
 * Inner component that uses the FileSystem context
 */
const WorkspaceContentInner = () => {
  const router = useRouter();
  const snap = useSnapshot(aiAgentState);
  const filesystemSnap = useSnapshot(filesystemState);
  const metadataSnap = useSnapshot(fileMetadataState);
  const { user } = useAuthContext();


  // URL-synced state - initialized once from URL, then managed locally
  // Only syncs back to URL on user actions to prevent initialization rerenders
  const isInitialMount = useRef(true);
  
  const [sidebarActiveTab, setSidebarActiveTabState] = useState<'files' | 'threads'>(() => {
    const tabParam = router.query.tab as string;
    return (tabParam === 'files' || tabParam === 'threads') ? tabParam : 'threads';
  });
  
  const [urlFileId, setUrlFileIdState] = useState<string | null>(() => {
    return (router.query.fileId as string) || null;
  });
  
  // Sync state to URL on changes (after initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    const query: any = { ...router.query };
    if (sidebarActiveTab !== 'threads') {
      query.tab = sidebarActiveTab;
    } else {
      delete query.tab;
    }
    
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
  }, [sidebarActiveTab]);
  
  useEffect(() => {
    if (isInitialMount.current) return;
    
    const query: any = { ...router.query };
    if (urlFileId) {
      query.fileId = urlFileId;
    } else {
      delete query.fileId;
    }
    
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
  }, [urlFileId]);
  
  const setSidebarActiveTab = useCallback((tab: 'files' | 'threads') => {
    setSidebarActiveTabState(tab);
  }, []);
  
  const setUrlFileId = useCallback((fileId: string | null) => {
    setUrlFileIdState(fileId);
  }, []);

  // Tree expansion state with persistence
  const threadExpansion = usePersistedThreadExpansion();
  const fileExpansion = usePersistedFileExpansion();

  // Local UI state (not persisted in URL)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFileEditorOpen, setIsFileEditorOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isConsolidateModalOpen, setIsConsolidateModalOpen] = useState(false);
  const [isCreateFileModalOpen, setIsCreateFileModalOpen] = useState(false);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [isAddReferenceModalOpen, setIsAddReferenceModalOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [messageText, setMessageText] = useState('');
  const [isContextExpanded, setIsContextExpanded] = useState(true);
  const [pendingToolCall, setPendingToolCall] = useState<{
    toolCallId: string;
    toolName: string;
    toolInput: any;
    messageId?: string;
  } | null>(null);
  const [threadCreationIntent, setThreadCreationIntent] = useState<{
    parentThreadId: string | null;
    parentTitle?: string;
  } | null>(null);

  // Get threadId from URL
  // Router query is populated immediately thanks to SSR prefetching
  const threadId = router.query.threadId as string | undefined;

  // Hooks - auth handled automatically by middleware + cookies
  const { createBranch, isCreating: isCreatingBranch } = useCreateBranch();
  
  // Loading states now come from hooks with smart cache-aware logic
  // useGraphQLQuery returns loading=false when reading from cache
  const { isLoading: isLoadingThreads, error: threadsError } = useLoadThreads();
  const { isLoading: isLoadingThread, error: threadError } = useLoadThread(threadId);
  
  // For files, we need to check the filesystem context hook
  // It uses useGraphQLQuery internally, so loading is also cache-aware
  const isLoadingFiles = false; // Filesystem data is prefetched via SSR
  const { sendMessage, isStreaming: isSendMessageStreaming, stopStream } = useSendMessage(threadId || '', {
    onToolCall: (toolCall) => {
      setPendingToolCall(toolCall);
    }
  });


  // MVU F2.2: Recovery - Check for active requests on thread mount
  useEffect(() => {
    if (!threadId) return;

    const checkForActiveRequest = async () => {
      const activeRequestId = localStorage.getItem(`thread-${threadId}-activeRequest`);

      if (!activeRequestId) return;


      try {
        // Use GraphQL to check request status
        const result = await graphqlClient.query(GetAgentRequestDocument, { id: activeRequestId });

        if (result.error) {
          console.error('[Recovery] Failed to check request status:', result.error);
          return;
        }

        const request = result.data?.agentRequest;
        if (!request) {
          localStorage.removeItem(`thread-${threadId}-activeRequest`);
          return;
        }

        if (request.status === 'completed') {

          // Reload thread using GraphQL
          const threadResult = await graphqlClient.query(GetThreadDocument, { id: threadId });

          if (threadResult.data?.thread) {
            // Update state with new messages
            if (threadResult.data.thread.messages) {
              aiAgentState.messages = threadResult.data.thread.messages.map((m: any) => ({
                ...m,
                timestamp: new Date(m.timestamp),
              }));
            }
          }

          localStorage.removeItem(`thread-${threadId}-activeRequest`);
          toast.success('Previous request completed!');
        } else if (request.status === 'in_progress') {
          toast('Previous request is still processing. You can reconnect to the stream.', { duration: 5000 });
        } else if (request.status === 'failed') {
          localStorage.removeItem(`thread-${threadId}-activeRequest`);
          toast.error('Previous request failed');
        }
      } catch (error) {
        console.error('[Recovery] Failed to check request status:', error);
        // Don't clear - might be network issue
      }
    };

    checkForActiveRequest();
  }, [threadId]);

  // MVU F2.3: Load pending tools on thread mount (cold path - recovery only)
  // Uses useGraphQLQuery for proper cache integration (SSR prefetched data)
  useGraphQLQuery({
    query: ListPendingToolCallsDocument,
    variables: threadId ? { threadId } : { threadId: '' }, // Provide empty string if no threadId (query will be disabled anyway)
    enabled: !!threadId && !pendingToolCall, // Skip if threadId missing or already have pending tool from stream
    syncToState: (data) => {
      const pendingTools = data.pendingToolCalls || [];


      if (pendingTools.length > 0) {
        // Show first pending tool (UI will handle showing them one by one)
        const firstTool = pendingTools[0];

        setPendingToolCall({
          toolCallId: firstTool.id,
          toolName: firstTool.toolName,
          toolInput: typeof firstTool.toolInput === 'string'
            ? JSON.parse(firstTool.toolInput)
            : firstTool.toolInput,
          messageId: firstTool.messageId,
        });
      }
    },
  });

  // MVU F2.4: Real-time subscription for tool approval status changes
  useEffect(() => {
    if (!threadId) return;

    // Use builder pattern for type-safe subscription with automatic camelCase transformation
    const subscription = createSubscription('agent_tool_calls')
      .channel(`tool-approvals-${threadId}`)
      .filter({ thread_id: threadId })
      .on('UPDATE', (payload) => {
        // payload.new is automatically camelCase from builder
        const updated = payload.new;

        // If tool was approved or rejected, clear pending state
        if (updated.approvalStatus === 'approved' || updated.approvalStatus === 'rejected') {
          setPendingToolCall(null);
        }
        // If new pending tool appears with responseMessageId, update state
        else if (updated.approvalStatus === 'pending' && updated.responseMessageId) {
          setPendingToolCall({
            toolCallId: updated.id,
            toolName: updated.toolName,
            toolInput: updated.toolInput, // Already parsed from JSONB by builder
            messageId: updated.responseMessageId,
          });
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [threadId]);

  // Sync URL fileId with Valtio state and file editor visibility
  useEffect(() => {
    if (urlFileId) {
      // URL has a fileId - open the file editor
      // useLoadFile will handle loading the file into filesystemState.selectedFile
      setIsFileEditorOpen(true);
    } else {
      // URL has no fileId - close file editor
      // useLoadFile will clear filesystemState.selectedFile when fileId is null
      if (isFileEditorOpen) {
        setIsFileEditorOpen(false);
      }
    }
  }, [urlFileId, isFileEditorOpen]);

  // File hooks - get state from filesystem (already declared above)
  const selectedFileId = filesystemSnap.selectedFile?.id || null;
  const currentFile = filesystemSnap.selectedFile;
  const { isLoading: isLoadingFile } = useLoadFile(selectedFileId);
  const { updateFile, isSaving } = useUpdateFile();

  // Tool approval hook
  const { approveTool, isLoading: isApprovingToolCall } = useApproveToolCall();

  // Context management hooks
  const { addToExplicit, isLoading: isAddingToExplicit } = useAddToExplicit(threadId || '');

  // Filesystem operations hooks
  const { createDocument, createFolder, deleteDocument, deleteFolder, isCreatingDocument, isCreatingFolder, isDeleting } = useFilesystemOperations();

  // File tree actions hook (handles file/folder operations with modals)
  const {
    handleFileRename,
    handleFileDelete,
    handleFolderRename,
    handleFolderDelete,
    handleCreateSubfolder,
    handleCreateFileInFolder,
    handleUploadToFolder,
    handleRenameConfirm,
    handleDeleteConfirm,
    handleCreateSubfolderConfirm,
    handleCreateFileInFolderConfirm,
    renameModal,
    deleteModal,
    createSubfolderModal,
    createFileInFolderModal,
    closeRenameModal,
    closeDeleteModal,
    closeCreateSubfolderModal,
    closeCreateFileInFolderModal,
    isRenaming,
    isDeleting: isTreeDeleting,
    isCreating: isTreeCreating,
  } = useFileTreeActions({
    onFileCreated: (fileId: string) => {
      // Open file panel and trigger auto-expand when file is created
      setUrlFileId(fileId);
    }
  });

  // Agent file operations hook
  const { createFile: createAgentFile, isCreating: isCreatingAgentFile } = useCreateAgentFile();

  // Save coordination hook (state lives in fileMetadata)
  const { saveFile, handleContentChange, saveAndThen, clearSaveTimeout, hasUnsavedChanges: checkHasUnsavedChanges } = useSaveCurrentFile({
    onSave: async (fileId: string, content: string) => {
      await updateFile(fileId, content);
    },
    autoSaveDelay: 3000,
  });

  // Auto-save logic using centralized hook
  const handleFileChange = useCallback((content: string) => {
    if (!currentFile || !selectedFileId) return;
    handleContentChange(selectedFileId, content);
  }, [currentFile, selectedFileId, handleContentChange]);

  // Compute hasUnsavedChanges for UI and beforeunload
  const hasUnsavedChanges = useMemo(() => {
    if (!currentFile || !selectedFileId) return false;
    return checkHasUnsavedChanges(selectedFileId, currentFile.content || '');
  }, [currentFile, selectedFileId, checkHasUnsavedChanges]);

  // Warn user before closing tab/window with unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Attempt to save if possible
      if (currentFile && selectedFileId) {
        // Note: navigator.sendBeacon could be used here for async save during unload
        // But for simplicity, we just warn the user
        console.warn('Tab closing with unsaved changes');
      }

      // Show browser warning dialog
      e.preventDefault();
      e.returnValue = ''; // Chrome requires this
      return ''; // Some browsers need return value
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, currentFile, selectedFileId]);

  // Mark active thread in thread list
  const threadsWithActive = useMemo(() => {
    return snap.branchTree.threads.map(thread => ({
      ...thread,
      isActive: thread.id === threadId,
    }));
  }, [snap.branchTree.threads, threadId]);

  // Check if current thread has children
  const hasChildren = useMemo(() => {
    try {
      // Defensive checks
      if (!snap || !snap.currentThread) return false;
      if (!snap.branchTree || !Array.isArray(snap.branchTree.threads)) return false;

      const currentThreadId = snap.currentThread.id;
      if (!currentThreadId) return false;

      return snap.branchTree.threads.some(thread =>
        thread && thread.parentThreadId === currentThreadId
      );
    } catch (error) {
      console.error('Error calculating hasChildren:', error);
      return false;
    }
  }, [snap?.branchTree?.threads, snap?.currentThread?.id]);

  // Consolidation handler
  const handleConsolidate = useCallback(() => {
    if (!hasChildren) return;
    setIsConsolidateModalOpen(true);
  }, [hasChildren]);

  // Convert filesystem tree data to flat array for WorkspaceSidebar
  const files = useMemo(
    () => flattenFileSystemNodes(filesystemSnap.treeData as FileSystemNode[]),
    [filesystemSnap.treeData]
  );

  // Sidebar handlers
  const handleSidebarTabChange = useCallback((tab: 'files' | 'threads') => {
    setSidebarActiveTab(tab);
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  // Auto-expand tree paths when thread is selected
  useEffect(() => {
    if (threadId && snap.branchTree?.threads?.length > 0) {
      const path = findPathToNode(
        threadId,
        snap.branchTree.threads,
        (t) => t.parentThreadId || null,
        (t) => t.id
      );
      if (path.length > 0) {
        threadExpansion.expandPath(path);
      }
    }
  }, [threadId, snap.branchTree?.threads]);

  // Auto-expand tree paths when file is selected
  useEffect(() => {
    if (urlFileId && files.length > 0) {
      const path = findPathToNode(
        urlFileId,
        files,
        (f) => f.parentId || null,
        (f) => f.id
      );
      if (path.length > 0) {
        fileExpansion.expandPath(path);
      }
    }
  }, [urlFileId, files]);

  // Sync file opening/closing with metadata state
  useEffect(() => {
    if (currentFile && selectedFileId) {
      // File opened - initialize metadata (only if not already tracking this file)
      if (metadataSnap.currentFile?.fileId !== selectedFileId) {
        openFile(selectedFileId, currentFile.content || '');
      }
    } else if (!currentFile && metadataSnap.currentFile) {
      // File closed - clear metadata
      closeFile();
    }
  }, [currentFile, selectedFileId, metadataSnap.currentFile]);

  // File handlers
  const handleFileClick = useCallback((fileId: string) => {
    // Update URL - the useEffect will handle syncing Valtio state and opening the editor
    setUrlFileId(fileId);
  }, [setUrlFileId]);

  const handleCreateFile = useCallback(() => {
    setIsCreateFileModalOpen(true);
  }, []);

  const handleCreateFolder = useCallback(() => {
    setIsCreateFolderModalOpen(true);
  }, []);

  const handleCreateFileConfirm = useCallback(async (name: string, folderId?: string) => {
    // createDocument returns { permanentId, promise }
    const result = createDocument(name, folderId || null);

    // Open file panel immediately with optimistic ID (shows loading skeleton)
    setUrlFileId(result.permanentId);

    // Wait for mutation to complete before closing modal
    await result.promise;

    setIsCreateFileModalOpen(false);
  }, [createDocument, setUrlFileId]);

  const handleCreateFolderConfirm = useCallback(async (name: string, parentFolderId?: string) => {
    await createFolder(name, parentFolderId || null).promise;
    setIsCreateFolderModalOpen(false);
  }, [createFolder]);

  const handleCloseFileEditor = useCallback(async () => {
    if (!currentFile || !selectedFileId) {
      setUrlFileId(null);
      return;
    }

    const contentToSave = currentFile.content || '';
    const hasChanges = checkHasUnsavedChanges(selectedFileId, contentToSave);

    if (hasChanges) {
      // Save and then close on success
      const result = await saveAndThen(selectedFileId, contentToSave, () => {
        setUrlFileId(null);
      });
      // If save failed, saveAndThen won't call onSuccess, so we stay open
      // The hook already shows error toast via toast.error
    } else {
      // No changes - just close
      clearSaveTimeout();
      setUrlFileId(null);
    }
  }, [currentFile, selectedFileId, checkHasUnsavedChanges, saveAndThen, clearSaveTimeout, setUrlFileId]);

  const handleGoToSource = useCallback((branchId: string, messageId: string) => {
    router.push(`/workspace/${branchId}?messageId=${messageId}`);
    // Clear file editor when navigating to a different thread
    setUrlFileId(null);
  }, [router, setUrlFileId]);

  // Thread handlers
  const handleThreadClick = useCallback((threadId: string) => {
    // Only navigate if we're not already on this thread
    if (router.query.threadId !== threadId) {
      // Set optimistic loading state immediately for instant UI feedback
      aiAgentActions.setIsLoadingThread(true);
      router.push(`/workspace/${threadId}`);
    }
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [router, isSidebarOpen]);

  const handleCreateThread = useCallback(() => {
    setThreadCreationIntent({ parentThreadId: null });
    setIsCreateModalOpen(true);
  }, []);

  const handleSelectBranch = useCallback((branchId: string) => {
    router.push(`/workspace/${branchId}`);
  }, [router]);

  const handleBranchThread = useCallback(() => {
    if (!snap.currentThread) return;
    setThreadCreationIntent({
      parentThreadId: snap.currentThread.id,
      parentTitle: snap.currentThread.title,
    });
    setIsCreateModalOpen(true);
  }, [snap.currentThread]);

  const handleThreadCreateBranch = useCallback((parentThreadId: string, parentTitle: string) => {
    setThreadCreationIntent({
      parentThreadId: parentThreadId,
      parentTitle: parentTitle,
    });
    setIsCreateModalOpen(true);
  }, []);

  // Message handlers
  const handleMessageChange = useCallback((text: string) => {
    setMessageText(text);
  }, []);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!threadId) {
      console.error('No thread ID available');
      return;
    }

    try {
      await sendMessage(content);
      setMessageText(''); // Clear input after successful send
    } catch (error) {
      console.error('Failed to send message:', error);
      // Error handling is done in the useSendMessage hook with toast notifications
    }
  }, [threadId, sendMessage]);

  const handleStopStreaming = useCallback(() => {
    stopStream();
  }, [stopStream]);

  // Tool call handlers
  const handleApproveToolCall = useCallback(async (toolCallId: string) => {
    if (!pendingToolCall) {
      console.warn('[WorkspaceContainer] Cannot approve: pendingToolCall missing');
      return;
    }

    const requestId = snap.currentRequestId;
    if (!requestId) {
      console.warn('[WorkspaceContainer] Cannot approve: currentRequestId missing. Using recovery mode from pending tools.');
      // In recovery mode, we might not have currentRequestId - this is handled by backend via toolCallId lookup
    }

    try {
      // Call the approval endpoint with requestId for resume (optional in recovery)
      await approveTool(toolCallId, true, undefined, requestId || undefined);
      setPendingToolCall(null);
    } catch (error) {
      console.error('[WorkspaceContainer] Failed to approve tool call:', error);
    }
  }, [pendingToolCall, snap, approveTool]);

  const handleRejectToolCall = useCallback(async (toolCallId: string, reason?: string) => {
    if (!pendingToolCall) {
      console.warn('[WorkspaceContainer] Cannot reject: pendingToolCall missing');
      return;
    }

    const requestId = snap.currentRequestId;

    try {
      // Call the approval endpoint with rejection (requestId optional in recovery)
      await approveTool(toolCallId, false, reason || 'User rejected', requestId || undefined);
      setPendingToolCall(null);
    } catch (error) {
      console.error('[WorkspaceContainer] Failed to reject tool call:', error);
    }
  }, [pendingToolCall, snap, approveTool]);

  // ThreadView expects different signatures - wrap them appropriately
  const handleApproveToolCallForThreadView = useCallback(() => {
    if (pendingToolCall) {
      handleApproveToolCall(pendingToolCall.toolCallId);
    }
  }, [pendingToolCall, handleApproveToolCall]);

  const handleRejectToolCallForThreadView = useCallback((reason?: string) => {
    if (pendingToolCall) {
      handleRejectToolCall(pendingToolCall.toolCallId, reason);
    }
  }, [pendingToolCall, handleRejectToolCall]);

  // Context handlers
  const handleAddToExplicit = useCallback(async (contextRefId: string) => {
    try {
      await addToExplicit(contextRefId);
    } catch (error) {
      console.error('Failed to add to explicit context:', error);
    }
  }, [addToExplicit]);

  const handleRemove = useCallback((item: Omit<import('@centrid/ui/features/ai-agent-system').ContextReferenceProps, 'isExpanded'>) => {
    // TODO: Implement remove from context
  }, []);

  const handleDismiss = useCallback((contextRefId: string) => {
    // TODO: Implement dismiss context reference
  }, []);

  const handleToggleContextPanel = useCallback(() => {
    setIsContextExpanded(prev => !prev);
  }, []);

  const handleAddReference = useCallback(() => {
    setIsAddReferenceModalOpen(true);
  }, []);

  // Header handlers
  const handleToggleTheme = useCallback(() => {
    setTheme(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });
  }, []);

  const handleNotificationsClick = useCallback(() => {
  }, []);

  // Transform context references to context groups format expected by Workspace
  const contextGroups = [
    {
      id: 'explicit',
      type: 'explicit' as const,
      title: 'Explicit Context',
      items: snap.contextReferences
        .filter(ref => ref.priorityTier === 1)
        .map(ref => ({
          id: ref.id,
          referenceType: ref.entityType as 'file' | 'folder' | 'thread',
          name: ref.entityReference,
          priorityTier: ref.priorityTier,
          relevance: 1.0,
          source: ref.source,
        })),
    },
    {
      id: 'semantic',
      type: 'semantic' as const,
      title: 'Semantic Matches',
      items: snap.contextReferences
        .filter(ref => ref.priorityTier === 2)
        .map(ref => ({
          id: ref.id,
          referenceType: ref.entityType as 'file' | 'folder' | 'thread',
          name: ref.entityReference,
          priorityTier: ref.priorityTier,
          relevance: 0.85,
          source: ref.source,
        })),
    },
  ];

  // Transform messages to attach pending tool call to last assistant message
  const messages = useMemo(() => {
    return snap.messages.map((m, idx) => {
      const isLastAssistantMessage = m.role === 'assistant' && idx === snap.messages.length - 1;
      if (isLastAssistantMessage && pendingToolCall) {
        return {
          ...m,
          pendingToolCall,
          onApproveToolCall: () => handleApproveToolCall(pendingToolCall.toolCallId),
          onRejectToolCall: (reason?: string) => handleRejectToolCall(pendingToolCall.toolCallId, reason),
        };
      }
      return m;
    });
  }, [snap.messages, pendingToolCall, handleApproveToolCall, handleRejectToolCall]);

  return (
    <>
      <Workspace
        // Sidebar props
        sidebarActiveTab={sidebarActiveTab}
        onSidebarTabChange={handleSidebarTabChange}
        files={files}
        threads={threadsWithActive}
        onFileClick={handleFileClick}
        onThreadClick={handleThreadClick}
        onCreateThread={handleCreateThread}
        onThreadCreateBranch={handleThreadCreateBranch}
        onCreateFile={handleCreateFile}
        onCreateFolder={handleCreateFolder}
        onFileRename={handleFileRename}
        onFileDelete={handleFileDelete}
        onFolderRename={handleFolderRename}
        onFolderDelete={handleFolderDelete}
        onCreateSubfolder={handleCreateSubfolder}
        onCreateFileInFolder={handleCreateFileInFolder}
        onUploadToFolder={handleUploadToFolder}
        isSidebarOpen={isSidebarOpen}
        isLoadingThreads={isLoadingThreads}
        isLoadingFiles={isLoadingFiles}
        // Tree expansion state
        threadExpandedIds={threadExpansion.expandedSet}
        onThreadToggleExpanded={threadExpansion.toggleExpanded}
        fileExpandedIds={fileExpansion.expandedSet}
        onFileToggleExpanded={fileExpansion.toggleExpanded}

        // File editor props
        currentFile={currentFile}
        isFileEditorOpen={isFileEditorOpen}
        isFileLoading={isLoadingFile}
        onCloseFileEditor={handleCloseFileEditor}
        onGoToSource={handleGoToSource}
        onFileChange={handleFileChange}
        saveStatus={metadataSnap.currentFile?.saveStatus || 'idle'}
        lastSavedAt={metadataSnap.currentFile?.lastSavedAt || null}
        hasUnsavedChanges={hasUnsavedChanges}

        // Header props
        onToggleSidebar={handleToggleSidebar}
        onToggleTheme={handleToggleTheme}
        onNotificationsClick={handleNotificationsClick}
        theme={theme}
        unreadNotificationsCount={0}
        userInitial="U"

        // ThreadView props
        currentBranch={snap.currentThread}
        branches={threadsWithActive}
        messages={messages}
        contextGroups={contextGroups}
        messageText={messageText}
        isStreaming={isSendMessageStreaming || snap.isStreaming}
        isLoading={isLoadingThread}
        pendingToolCall={pendingToolCall ? {
          toolName: pendingToolCall.toolName,
          toolInput: pendingToolCall.toolInput,
        } : undefined}
        isContextExpanded={isContextExpanded}
        onSelectBranch={handleSelectBranch}
        onToggleContextPanel={handleToggleContextPanel}
        onMessageChange={handleMessageChange}
        onSendMessage={handleSendMessage}
        onStopStreaming={handleStopStreaming}
        onApproveToolCall={() => pendingToolCall && handleApproveToolCall(pendingToolCall.toolCallId)}
        onRejectToolCall={(reason?: string) => pendingToolCall && handleRejectToolCall(pendingToolCall.toolCallId, reason)}
        onAddReference={handleAddReference}
        onRemoveReference={handleRemove}
        onBranchThread={handleBranchThread}
      />

      {/* Create Branch Modal */}
      <CreateBranchModalContainer
        isOpen={isCreateModalOpen}
        parentThreadId={threadCreationIntent?.parentThreadId || null}
        parentTitle={threadCreationIntent?.parentTitle}
        onClose={() => {
          setIsCreateModalOpen(false);
          setThreadCreationIntent(null);
        }}
      />

      {/* Consolidate Modal */}
      {snap.currentThread && (
        <ConsolidateModalContainer
          isOpen={isConsolidateModalOpen}
          onClose={() => setIsConsolidateModalOpen(false)}
          currentThreadId={snap.currentThread.id}
        />
      )}

      {/* Create File Modal */}
      <CreateDocumentModal
        open={isCreateFileModalOpen}
        onOpenChange={setIsCreateFileModalOpen}
        onConfirm={handleCreateFileConfirm}
        isLoading={isCreatingDocument || isDeleting}
      />

      {/* Create Folder Modal */}
      <CreateFolderModal
        open={isCreateFolderModalOpen}
        onOpenChange={setIsCreateFolderModalOpen}
        onConfirm={handleCreateFolderConfirm}
        isLoading={isCreatingFolder}
      />

      {/* Rename Modal */}
      {renameModal && (
        <RenameModal
          open={renameModal.open}
          onOpenChange={(open) => !open && closeRenameModal()}
          onConfirm={handleRenameConfirm}
          currentName={renameModal.itemName}
          itemType={renameModal.itemType}
          isLoading={isRenaming}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <DeleteConfirmationModal
          open={deleteModal.open}
          onOpenChange={(open) => !open && closeDeleteModal()}
          onConfirm={handleDeleteConfirm}
          itemName={deleteModal.itemName}
          itemType={deleteModal.itemType}
          isLoading={isTreeDeleting}
        />
      )}

      {/* Create Subfolder Modal */}
      {createSubfolderModal && (
        <CreateFolderModal
          open={createSubfolderModal.open}
          onOpenChange={(open) => !open && closeCreateSubfolderModal()}
          onConfirm={handleCreateSubfolderConfirm}
          isLoading={isTreeCreating}
          parentFolderId={createSubfolderModal.parentFolderId}
          parentFolderName={createSubfolderModal.parentFolderName}
        />
      )}

      {/* Create File in Folder Modal */}
      {createFileInFolderModal && (
        <CreateDocumentModal
          open={createFileInFolderModal.open}
          onOpenChange={(open) => !open && closeCreateFileInFolderModal()}
          onConfirm={handleCreateFileInFolderConfirm}
          isLoading={isTreeCreating}
          parentFolderId={createFileInFolderModal.folderId}
          parentFolderName={createFileInFolderModal.folderName}
        />
      )}

      {/* Add Reference Modal */}
      {isAddReferenceModalOpen && (
        <ContextPanelContainer
          onAddContext={(entityType, path) => {
            setIsAddReferenceModalOpen(false);
          }}
          onRemoveContext={(referenceId) => {
          }}
        />
      )}
    </>
  );
};

/**
 * WorkspaceContent component
 */
const WorkspaceContent = WorkspaceContentInner;

/**
 * Outer component that provides FileSystem context
 *
 * All data is fetched via GraphQL queries on the client.
 * SSR/hydration is handled by urql ssrExchange in _app.tsx if enabled.
 */
export function WorkspaceContainer() {
  return (
    <FileSystemProvider>
      <WorkspaceContent />
    </FileSystemProvider>
  );
}
