import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useQueryState, parseAsStringEnum } from 'nuqs';
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
import { fileMetadataState, openFile, closeFile, getCurrentFileMetadata } from '@/lib/state/fileMetadata';
import { useSaveCurrentFile } from '@/lib/hooks/useSaveCurrentFile';
import type { FileSystemNode } from '@/lib/types/ui';
import { useCreateBranch } from '@/lib/hooks/useCreateBranch';
import { useLoadThread } from '@/lib/hooks/useLoadThread';
import { useLoadThreads } from '@/lib/hooks/useLoadThreads';
import { useSendMessage } from '@/lib/hooks/useSendMessage';
import { useAgentStreaming } from '@/lib/hooks/useAgentStreaming';
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
import { GetThreadDocument, ListPendingToolCallsDocument, GetAgentRequestDocument, useCreateThreadWithMessageMutation } from '@/types/graphql';
import { createSubscription } from '@/lib/realtime';
import { parseJsonbRow } from '@/lib/realtime/config';
import { toast } from 'react-hot-toast';
import { usePersistedThreadExpansion } from '@/lib/hooks/usePersistedThreadExpansion';
import { usePersistedFileExpansion } from '@/lib/hooks/usePersistedFileExpansion';
import { findPathToNode } from '@/lib/utils/tree-helpers';
import type { ContentBlock } from '@/types/graphql';

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


  // URL-synced state using nuqs (handles bidirectional sync automatically)
  const [sidebarActiveTab, setSidebarActiveTab] = useQueryState(
    'tab',
    parseAsStringEnum(['files', 'threads'] as const).withDefault('threads')
  );

  const [urlFileId, setUrlFileId] = useQueryState('fileId');

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
  const [, createThreadWithMessage] = useCreateThreadWithMessageMutation();

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

  // Agent streaming hook for new thread creation
  const { startStreaming, isStreaming: isAgentStreaming } = useAgentStreaming();


  // MVU F2.2: Recovery - Check for active requests on thread mount
  useEffect(() => {
    if (!threadId) return;

    const checkForActiveRequest = async () => {
      const activeRequestId = localStorage.getItem(`thread-${threadId}-activeRequest`);

      if (!activeRequestId) return;

      // Skip recovery if currently streaming (not an interrupted request)
      if (aiAgentState.isStreaming) return;

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
            // Update state with new messages (parse JSONB fields)
            if (threadResult.data.thread.messages) {
              aiAgentState.messages = threadResult.data.thread.messages.map((m: any) => {
                const parsed = parseJsonbRow('messages', m);
                return {
                  ...parsed,
                  timestamp: parsed.timestamp, // ✅ Keep as ISO string
                };
              });
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
  // Use urlFileId as source of truth (not selectedFileId from Valtio)
  // This fixes race condition where selectedFileId is null before query completes
  const { isLoading: isLoadingFile } = useLoadFile(urlFileId);
  const selectedFileId = filesystemSnap.selectedFile?.id || null;
  const currentFile = filesystemSnap.selectedFile;
  const { updateFile, isSaving } = useUpdateFile();

  // Tool approval hook
  const { approve, reject, isLoading: isApprovingToolCall } = useApproveToolCall();

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
  const { saveFile, handleContentChange, saveAndThen, clearSaveTimeout, checkHasUnsavedChanges } = useSaveCurrentFile({
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
    if (!selectedFileId || !metadataSnap.currentFile) return false;
    return metadataSnap.currentFile.currentContent !== metadataSnap.currentFile.lastSavedContent;
  }, [selectedFileId, metadataSnap.currentFile]);

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
    // Allow close even if file didn't load properly (stuck/error state)
    if (!selectedFileId) {
      clearSaveTimeout();
      setUrlFileId(null);
      return;
    }

    // Read fresh content from Valtio proxy (not stale snapshot)
    const metadata = getCurrentFileMetadata();
    if (!metadata || metadata.fileId !== selectedFileId) {
      clearSaveTimeout();
      setUrlFileId(null);
      return;
    }

    const contentToSave = metadata.currentContent;
    const hasChanges = checkHasUnsavedChanges(selectedFileId);

    if (hasChanges) {
      // Save and then close on success
      await saveAndThen(selectedFileId, contentToSave, () => {
        setUrlFileId(null);
      });
      // If save failed, saveAndThen won't call onSuccess, so we stay open
    } else {
      // No changes - just close
      clearSaveTimeout();
      setUrlFileId(null);
    }
  }, [selectedFileId, checkHasUnsavedChanges, saveAndThen, clearSaveTimeout, setUrlFileId]);

  const handleGoToSource = useCallback((branchId: string, messageId: string) => {
    router.push(`/workspace/${branchId}?messageId=${messageId}`);
    // Clear file editor when navigating to a different thread
    setUrlFileId(null);
  }, [router, setUrlFileId]);

  // Thread handlers
  const handleThreadClick = useCallback((threadId: string) => {
    // Only navigate if we're not already on this thread
    if (router.query.threadId !== threadId) {
      // Only set loading state if thread data is not likely cached
      // Thread is likely cached if we just hovered over it or it's in the branch tree
      // The useLoadThread hook will handle loading state via useGraphQLQuery's smart detection
      router.push(`/workspace/${threadId}`);
    }
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [router, isSidebarOpen]);

  const handleThreadHover = useCallback((threadId: string) => {
    // Prefetch thread data on hover to warm the cache
    // Only prefetch if not already on this thread
    if (router.query.threadId !== threadId && threadId !== 'new') {
      graphqlClient.query(GetThreadDocument, { id: threadId }).toPromise();
    }
  }, [router.query.threadId]);

  const handleCreateThread = useCallback(() => {
    // Navigate directly to empty state instead of showing modal
    router.push('/workspace/new');
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [router, isSidebarOpen]);

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

    // Handle "new" thread state - atomic thread + message creation
    if (threadId === 'new') {
      try {
        // Generate title from first message (first 50 chars or first sentence)
        const autoTitle = content.trim().length > 50
          ? content.trim().substring(0, 50) + '...'
          : content.trim().split(/[.!?]/)[0] || 'New Thread';

        // Generate idempotency key for message deduplication
        const messageIdempotencyKey = crypto.randomUUID();

        // Atomic: create thread + message + trigger execution in single mutation
        const result = await createThreadWithMessage({
          input: {
            branchTitle: autoTitle,
            messageContent: content,
            messageIdempotencyKey,
          },
        });

        if (result.error) {
          aiAgentState.isStreaming = false;
          throw new Error(result.error.message);
        }

        const newThreadId = result.data?.createThreadWithMessage.thread.id;
        const messageData = result.data?.createThreadWithMessage.message;

        if (!newThreadId || !messageData) {
          throw new Error('No thread ID or message returned');
        }

        // Parse message response with parseJsonbRow (handles content JSONB)
        const parsedMessage = parseJsonbRow('messages', messageData);
        const requestId = parsedMessage.requestId;

        if (!requestId) {
          throw new Error('No requestId in message response');
        }

        // Add BOTH messages to state (user message from mutation + optimistic assistant)
        aiAgentState.messages = [
          {
            id: parsedMessage.id,
            threadId: newThreadId,
            role: 'user' as const,
            content: parsedMessage.content,      // ✅ JSONB parsed
            toolCalls: parsedMessage.toolCalls || [],
            timestamp: parsedMessage.timestamp,  // ✅ ISO string
            tokensUsed: 0,
            idempotencyKey: messageIdempotencyKey,
          },
          {
            id: crypto.randomUUID(),
            threadId: newThreadId,
            role: 'assistant' as const,
            content: [{ type: 'text' as const, text: '' }] as ContentBlock[], // Empty, will be streamed
            toolCalls: [],
            timestamp: new Date().toISOString(), // ✅ ISO string
            isStreaming: true,
            tokensUsed: 0,
            requestId, // Track which request this responds to
          } as any,
        ];

        // Set currentThread BEFORE navigation (enables skip condition in useLoadThread)
        aiAgentActions.setCurrentThread({
          id: newThreadId,
          title: autoTitle,
          parentThreadId: null,
          depth: 0,
          artifactCount: 0,
          lastActivity: new Date().toISOString(), // ✅ ISO string
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Start streaming agent response (reusable hook)
        startStreaming(requestId, {
          optimisticMessageIndex: 1, // Assistant message at index 1
          threadId: newThreadId,
          onToolCall: (toolCall) => setPendingToolCall(toolCall),
          onError: (error) => {
            toast.error(error.message);
            // Mark assistant message as failed
            if (aiAgentState.messages[1]) {
              aiAgentState.messages[1].isStreaming = false;
              aiAgentState.messages[1].content = [
                { type: 'text' as const, text: '⚠️ Error: ' + error.message }
              ] as ContentBlock[];
            }
          },
        });

        // Navigate immediately (useLoadThread will SKIP because currentThread matches + messages exist)
        router.push(`/workspace/${newThreadId}`);

        setMessageText(''); // Clear input
      } catch (error) {
        console.error('Failed to create thread with message:', error);
        toast.error('Failed to create thread');
        aiAgentState.isStreaming = false;
      }
      return;
    }

    try {
      await sendMessage(content);
      setMessageText(''); // Clear input after successful send
    } catch (error) {
      console.error('Failed to send message:', error);
      // Error handling is done in the useSendMessage hook with toast notifications
    }
  }, [threadId, sendMessage, createThreadWithMessage, router, startStreaming]);

  const handleStopStreaming = useCallback(() => {
    stopStream();
  }, [stopStream]);

  // Tool call handlers
  const handleApproveToolCall = useCallback(async (toolCallId: string) => {
    if (!pendingToolCall) {
      console.warn('[WorkspaceContainer] Cannot approve: pendingToolCall missing');
      return;
    }

    try {
      // Approve the tool call (backend automatically resumes execution)
      await approve({ id: toolCallId });
      setPendingToolCall(null);
    } catch (error) {
      console.error('[WorkspaceContainer] Failed to approve tool call:', error);
    }
  }, [pendingToolCall, approve]);

  const handleRejectToolCall = useCallback(async (toolCallId: string, reason?: string) => {
    if (!pendingToolCall) {
      console.warn('[WorkspaceContainer] Cannot reject: pendingToolCall missing');
      return;
    }

    try {
      // Call the rejection mutation
      await reject({ id: toolCallId, reason: reason || 'User rejected' });
      setPendingToolCall(null);
    } catch (error) {
      console.error('[WorkspaceContainer] Failed to reject tool call:', error);
    }
  }, [pendingToolCall, reject]);

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
        selectedFileId={currentFile?.id || null}
        onFileClick={handleFileClick}
        onThreadClick={handleThreadClick}
        onThreadHover={handleThreadHover}
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
        isContextExpanded={isContextExpanded}
        onSelectBranch={handleSelectBranch}
        onToggleContextPanel={handleToggleContextPanel}
        onMessageChange={handleMessageChange}
        onSendMessage={handleSendMessage}
        onStopStreaming={handleStopStreaming}
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
