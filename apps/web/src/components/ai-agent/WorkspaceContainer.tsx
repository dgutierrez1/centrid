import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSnapshot } from 'valtio';
import { Workspace } from '@centrid/ui/features/ai-agent-system';
import type { File } from '@centrid/ui/features/ai-agent-system/WorkspaceSidebar';
import { CreateBranchModalContainer } from '@/components/ai-agent/CreateBranchModalContainer';
import { ConsolidateModalContainer } from '@/components/ai-agent-system/ConsolidateModalContainer';
import { ContextPanelContainer } from '@/components/ai-agent/ContextPanelContainer';
import { CreateDocumentModal } from '@/components/filesystem/CreateDocumentModal';
import { CreateFolderModal } from '@/components/filesystem/CreateFolderModal';
import { FileSystemProvider } from '@/lib/contexts/filesystem.context';
import { aiAgentState, aiAgentActions } from '@/lib/state/aiAgentState';
import { filesystemState } from '@/lib/state/filesystem';
import type { FileSystemNode } from '@centrid/shared/types';
import { useCreateBranch } from '@/lib/hooks/useCreateBranch';
import { useLoadThread } from '@/lib/hooks/useLoadThread';
import { useLoadThreads } from '@/lib/hooks/useLoadThreads';
import { useSendMessage } from '@/lib/hooks/useSendMessage';
import { useLoadFile } from '@/lib/hooks/useLoadFile';
import { useUpdateFile } from '@/lib/hooks/useUpdateFile';
import { useAddToExplicit } from '@/lib/hooks/useAddToExplicit';
import { useFilesystemOperations } from '@/lib/hooks/useFilesystemOperations';
import { useCreateAgentFile } from '@/lib/hooks/useCreateAgentFile';
import { useApproveToolCall } from '@/lib/hooks/useApproveToolCall';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { checkRequestStatus, getPendingToolsByRequest, getPendingToolsByThread } from '@/lib/api/agent-requests';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

/**
 * Convert FileSystemNode tree to flat File array for WorkspaceSidebar
 */
function flattenFileSystemNodes(nodes: readonly FileSystemNode[]): File[] {
  const result: File[] = [];

  function traverse(node: FileSystemNode) {
    result.push({
      id: node.id,
      name: node.name,
      path: node.path,
      type: node.type === 'document' ? 'file' : 'folder',
      parentId: node.parentId,
      size: node.fileSize,
      lastModified: node.updatedAt ? new Date(node.updatedAt) : new Date(),
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
function WorkspaceContent() {
  const router = useRouter();
  const snap = useSnapshot(aiAgentState);
  const filesystemSnap = useSnapshot(filesystemState);
  const { user } = useAuthContext();

  // Local UI state
  const [sidebarActiveTab, setSidebarActiveTab] = useState<'files' | 'threads'>('threads');
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
  } | null>(null);

  // Get threadId from URL
  const threadId = router.query.docId as string | undefined;

  // Hooks - auth handled automatically by middleware + cookies
  const { createBranch, isCreating: isCreatingBranch } = useCreateBranch();
  const { isLoading: isLoadingThreads, error: threadsError } = useLoadThreads(user?.id);
  const { isLoading: isLoadingThread, error: threadError } = useLoadThread(threadId);
  const { sendMessage, isStreaming: isSendMessageStreaming, stopStream } = useSendMessage(threadId || '', {
    onToolCall: (toolCall) => {
      console.log('[WorkspaceContainer] Tool call received:', toolCall);
      setPendingToolCall(toolCall);
      console.log('[WorkspaceContainer] Pending tool call state updated:', {
        toolCallId: toolCall.toolCallId,
        toolName: toolCall.toolName,
      });
    }
  });

  // MVU F2.2: Recovery - Check for active requests on thread mount
  useEffect(() => {
    if (!threadId) return;

    const checkForActiveRequest = async () => {
      const activeRequestId = localStorage.getItem(`thread-${threadId}-activeRequest`);

      if (!activeRequestId) return;

      console.log('[Recovery] Checking active request:', activeRequestId);

      try {
        const status = await checkRequestStatus(activeRequestId);

        if (status.status === 'completed') {
          console.log('[Recovery] Request completed, loading response');

          // Reload thread to get the response message
          await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/api/threads/${threadId}`,
            {
              headers: {
                'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
              }
            }
          ).then(r => r.json()).then(data => {
            // Update state with new messages
            if (data.data && data.data.messages) {
              aiAgentState.messages = data.data.messages.map((m: any) => ({
                ...m,
                timestamp: new Date(m.timestamp),
              }));
            }
          });

          localStorage.removeItem(`thread-${threadId}-activeRequest`);
          toast.success('Previous request completed!');
        } else if (status.status === 'in_progress') {
          console.log('[Recovery] Request in progress, showing option to reconnect');
          toast.info('Previous request is still processing. You can reconnect to the stream.');
        } else if (status.status === 'failed') {
          console.log('[Recovery] Request failed');
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

  // MVU F2.3: Load pending tools on thread mount
  useEffect(() => {
    if (!threadId) return;

    const loadPendingApprovals = async () => {
      try {
        const pendingTools = await getPendingToolsByThread(threadId);

        if (pendingTools.length > 0) {
          console.log('[PendingTools] Found pending approvals:', pendingTools.length);

          // Show first pending tool (UI will handle showing them one by one)
          const firstTool = pendingTools[0];
          setPendingToolCall({
            toolCallId: firstTool.id,
            toolName: firstTool.toolName,
            toolInput: firstTool.toolInput,
          });

          toast.info(`${pendingTools.length} pending approvals`);
        }
      } catch (error) {
        console.error('[PendingTools] Failed to load:', error);
        // Silently fail - might be no pending tools
      }
    };

    loadPendingApprovals();
  }, [threadId]);

  // File hooks
  const selectedFileId = snap.selectedFileId;
  const { file: currentFile, isLoading: isLoadingFile } = useLoadFile(selectedFileId);
  const { updateFile, isSaving } = useUpdateFile();

  // Tool approval hook
  const { approveTool, isLoading: isApprovingToolCall } = useApproveToolCall();

  // Context management hooks
  const { addToExplicit, isLoading: isAddingToExplicit } = useAddToExplicit(threadId || '');

  // Filesystem operations hooks
  const { createDocument, createFolder, deleteDocument, deleteFolder, isCreatingDocument, isCreatingFolder, isDeleting } = useFilesystemOperations();

  // Agent file operations hook
  const { createFile: createAgentFile, isCreating: isCreatingAgentFile } = useCreateAgentFile();

  // Auto-save state
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Auto-save logic
  const handleFileChange = useCallback((content: string) => {
    if (!currentFile || !selectedFileId) return;

    // Optimistic update
    aiAgentActions.setCurrentFile({
      ...currentFile,
      content,
    });

    // Set unsaved changes flag
    setHasUnsavedChanges(true);
    setSaveStatus('idle');

    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Set new timeout for auto-save (3 seconds)
    const timeout = setTimeout(async () => {
      if (!selectedFileId) return;

      setSaveStatus('saving');
      try {
        await updateFile(selectedFileId, content);
        setSaveStatus('saved');
        setLastSavedAt(new Date());
        setHasUnsavedChanges(false);
      } catch (error) {
        setSaveStatus('error');
        console.error('Failed to save file:', error);
      }
    }, 3000);

    setSaveTimeout(timeout);
  }, [currentFile, selectedFileId, saveTimeout, updateFile]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

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
        thread && thread.parentId === currentThreadId
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

  // File handlers
  const handleFileClick = useCallback((fileId: string) => {
    aiAgentActions.setSelectedFile(fileId);
    setIsFileEditorOpen(true);
    // Reset save state when opening a new file
    setHasUnsavedChanges(false);
    setSaveStatus('idle');
    setLastSavedAt(null);
  }, []);

  const handleCreateFile = useCallback(() => {
    setIsCreateFileModalOpen(true);
  }, []);

  const handleCreateFolder = useCallback(() => {
    setIsCreateFolderModalOpen(true);
  }, []);

  const handleCreateFileConfirm = useCallback(async (name: string, folderId?: string) => {
    await createDocument(name, folderId || null);
    setIsCreateFileModalOpen(false);
  }, [createDocument]);

  const handleCreateFolderConfirm = useCallback(async (name: string, parentFolderId?: string) => {
    await createFolder(name, parentFolderId || null);
    setIsCreateFolderModalOpen(false);
  }, [createFolder]);

  const handleCloseFileEditor = useCallback(() => {
    setIsFileEditorOpen(false);
    aiAgentActions.setSelectedFile(null);
    // Clear any pending save timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      setSaveTimeout(null);
    }
    // Reset save state
    setHasUnsavedChanges(false);
    setSaveStatus('idle');
  }, [saveTimeout]);

  const handleGoToSource = useCallback((branchId: string, messageId: string) => {
    router.push(`/workspace/${branchId}?messageId=${messageId}`);
    setIsFileEditorOpen(false);
  }, [router]);

  // Thread handlers
  const handleThreadClick = useCallback((threadId: string) => {
    router.push(`/workspace/${threadId}`);
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [router, isSidebarOpen]);

  const handleCreateThread = useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  const handleSelectBranch = useCallback((branchId: string) => {
    router.push(`/workspace/${branchId}`);
  }, [router]);

  const handleBranchThread = useCallback(() => {
    if (!snap.currentThread) return;
    setIsCreateModalOpen(true);
  }, [snap.currentThread]);

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
    console.log('[WorkspaceContainer] handleApproveToolCall called with:', toolCallId, 'Pending:', pendingToolCall?.toolName);
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
      console.log('[WorkspaceContainer] Calling approveTool with true, requestId:', requestId || 'N/A (recovery mode)');
      await approveTool(toolCallId, true, undefined, requestId || undefined);
      console.log('[WorkspaceContainer] Approval successful, clearing pending tool call');
      setPendingToolCall(null);
    } catch (error) {
      console.error('[WorkspaceContainer] Failed to approve tool call:', error);
    }
  }, [pendingToolCall, snap, approveTool]);

  const handleRejectToolCall = useCallback(async (toolCallId: string, reason?: string) => {
    console.log('[WorkspaceContainer] handleRejectToolCall called with:', toolCallId, 'Reason:', reason);
    if (!pendingToolCall) {
      console.warn('[WorkspaceContainer] Cannot reject: pendingToolCall missing');
      return;
    }

    const requestId = snap.currentRequestId;

    try {
      // Call the approval endpoint with rejection (requestId optional in recovery)
      console.log('[WorkspaceContainer] Calling approveTool with false, requestId:', requestId || 'N/A (recovery mode)');
      await approveTool(toolCallId, false, reason || 'User rejected', requestId || undefined);
      console.log('[WorkspaceContainer] Rejection successful, clearing pending tool call');
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

  const handleRemove = useCallback((contextRefId: string) => {
    // TODO: Implement remove from context
    console.log('Remove:', contextRefId);
  }, []);

  const handleDismiss = useCallback((contextRefId: string) => {
    // TODO: Implement dismiss context reference
    console.log('Dismiss:', contextRefId);
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
    console.log('Notifications clicked');
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
        onCreateFile={handleCreateFile}
        onCreateFolder={handleCreateFolder}
        isSidebarOpen={isSidebarOpen}
        isLoadingThreads={isLoadingThreads}

        // File editor props
        currentFile={currentFile}
        isFileEditorOpen={isFileEditorOpen}
        onCloseFileEditor={handleCloseFileEditor}
        onGoToSource={handleGoToSource}
        onFileChange={handleFileChange}
        saveStatus={saveStatus}
        lastSavedAt={lastSavedAt}
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
        messages={snap.messages.map((m, idx) => {
        const isLastAssistantMessage = m.role === 'assistant' && idx === snap.messages.length - 1;
        if (pendingToolCall && isLastAssistantMessage) {
          console.log('[WorkspaceContainer] Attaching approval to message:', m.id, 'Tool:', pendingToolCall.toolName);
        }
        return {
          ...m,
          events: m.events ? [...m.events] : undefined,
          // Add pending tool call only to the last ASSISTANT message if it exists
          ...(isLastAssistantMessage && pendingToolCall ? {
            pendingToolCall: {
              toolCallId: pendingToolCall.toolCallId,
              toolName: pendingToolCall.toolName,
              toolInput: pendingToolCall.toolInput,
            },
            onApproveToolCall: () => handleApproveToolCall(pendingToolCall.toolCallId),
            onRejectToolCall: (reason?: string) => handleRejectToolCall(pendingToolCall.toolCallId, reason),
          } : {}),
        };
      })}
        contextGroups={contextGroups}
        messageText={messageText}
        isStreaming={isSendMessageStreaming || snap.isStreaming}
        isLoading={snap.isLoadingThread}
        // NOTE: pendingToolCall is passed inline within messages (via pendingToolCall in individual message objects above)
        // Do NOT pass as ThreadView prop - that would render separate modal instead of inline
        isContextExpanded={isContextExpanded}
        onSelectBranch={handleSelectBranch}
        onToggleContextPanel={handleToggleContextPanel}
        onMessageChange={handleMessageChange}
        onSendMessage={handleSendMessage}
        onStopStreaming={handleStopStreaming}
        onApproveToolCall={handleApproveToolCallForThreadView}
        onRejectToolCall={handleRejectToolCallForThreadView}
        onAddReference={handleAddReference}
        onAddToExplicit={handleAddToExplicit}
        onRemove={handleRemove}
        onDismiss={handleDismiss}
        onBranchThread={handleBranchThread}
        hasChildren={hasChildren}
        onConsolidate={handleConsolidate}
      />

      {/* Create Branch Modal */}
      <CreateBranchModalContainer
        isOpen={isCreateModalOpen}
        parentId={snap.currentThread?.id || null}
        parentTitle={snap.currentThread?.title}
        onClose={() => setIsCreateModalOpen(false)}
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


      {/* Add Reference Modal */}
      {isAddReferenceModalOpen && (
        <ContextPanelContainer
          onAddContext={(entityType, path) => {
            console.log('Add context:', entityType, path);
            setIsAddReferenceModalOpen(false);
          }}
          onRemoveContext={(referenceId) => {
            console.log('Remove context:', referenceId);
          }}
        />
      )}
    </>
  );
}

/**
 * Outer component that provides FileSystem context
 */
export function WorkspaceContainer() {
  return (
    <FileSystemProvider>
      <WorkspaceContent />
    </FileSystemProvider>
  );
}
