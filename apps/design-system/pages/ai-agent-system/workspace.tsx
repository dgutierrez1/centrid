import React from 'react';
import { DesignSystemFrame } from '../../components/DesignSystemFrame';
import { MobileLayout, Input, MarkdownEditor } from '@centrid/ui/components';
import {
  ChatView,
  ContextReferenceData,
  MessageData,
  FileChangePreview,
  BranchSelector,
  BranchNode,
  ContextPanel,
  ContextItem,
  ContextWidgets,
  ContextWidget,
} from '@centrid/ui/features';
import { ToolCall, Citation, Icons, Button } from '@centrid/ui/components';
import {
  mockBranches,
  mockExplicitContext,
  mockFrequentlyUsed,
  mockSemanticMatches,
  mockBranchContext,
  mockArtifacts,
  mockExcludedContext,
} from '../../components/ai-agent-system/mockData';

// Mock chat list data
interface ChatData {
  id: string;
  title: string;
  lastMessagePreview: string;
  lastActivityAt: Date;
}

const mockChats: ChatData[] = [
  {
    id: 'c1',
    title: 'User validation logic',
    lastMessagePreview: 'The user validation logic is located in...',
    lastActivityAt: new Date('2024-01-15T10:25:00'),
  },
  {
    id: 'c2',
    title: 'React 18 best practices',
    lastMessagePreview: 'I found several React 18 best practices...',
    lastActivityAt: new Date('2024-01-15T10:28:00'),
  },
  {
    id: 'c3',
    title: 'Add authentication tests',
    lastMessagePreview: 'Let me help you write tests for the auth...',
    lastActivityAt: new Date('2024-01-15T09:30:00'),
  },
  {
    id: 'c4',
    title: 'Database migration guide',
    lastMessagePreview: 'Here are the steps to migrate your database...',
    lastActivityAt: new Date('2024-01-14T10:30:00'),
  },
];

// Mock context references
const mockContextReferences: ContextReferenceData[] = [
  {
    id: '1',
    referenceType: 'file',
    displayLabel: 'auth.ts',
    sourceReference: '/src/services/auth.ts',
    contentPreview: 'export function validateUser() {...',
    tokenCount: 500,
  },
];

// Mock tool calls and citations
const mockToolCalls: ToolCall[] = [
  {
    id: 't1',
    toolName: 'search_documents',
    status: 'completed',
    description: 'Searching filesystem for authentication logic...',
  },
  {
    id: 't2',
    toolName: 'read_document',
    status: 'completed',
    description: 'Reading user validation file',
    targetFile: '/src/services/auth.ts',
  },
];

const mockCitations: Citation[] = [
  {
    id: 'c1',
    url: 'https://react.dev/learn',
    title: 'React 18 Documentation',
    snippet: 'React 18 introduces automatic batching, new APIs like useId, and...',
  },
];

// Mock messages - using static dates to avoid SSR hydration errors
const mockMessages: MessageData[] = [
  {
    id: 'm1',
    role: 'user',
    content: 'Where is the user validation logic in the codebase?',
    timestamp: new Date('2024-01-15T10:30:00'),
  },
  {
    id: 'm2',
    role: 'agent',
    content:
      'The user validation logic is located in `/src/services/auth.ts`. The main validation function is `validateUser()` which checks email format, password strength, and account status.',
    timestamp: new Date('2024-01-15T10:31:00'),
    toolCalls: mockToolCalls,
  },
  {
    id: 'm3',
    role: 'user',
    content: 'Can you search the web for React 18 best practices and create a summary file?',
    timestamp: new Date('2024-01-15T10:35:00'),
  },
];

// Mock file changes for approval
const mockFileChanges: FileChangePreview[] = [
  {
    id: 'f1',
    filePath: '/docs/react-18-best-practices.md',
    action: 'create',
    metadata: {
      lineCount: 150,
      fileSize: '8.2 KB',
    },
  },
];

export default function WorkspaceShowcase() {
  const [draftMessage, setDraftMessage] = React.useState('');
  const [messages, setMessages] = React.useState(mockMessages);
  const [references, setReferences] = React.useState(mockContextReferences);
  const [isResponding, setIsResponding] = React.useState(false);
  const [showApproval, setShowApproval] = React.useState(true);
  const [isApproving, setIsApproving] = React.useState(false);
  const [viewport, setViewport] = React.useState<'desktop' | 'mobile'>('desktop');
  const [currentMobileView, setCurrentMobileView] = React.useState<'files' | 'editor' | 'chat'>(
    'chat'
  );
  const [currentChatId, setCurrentChatId] = React.useState('c2'); // React 18 best practices
  const [showChatSelector, setShowChatSelector] = React.useState(false);
  const [chatSearchQuery, setChatSearchQuery] = React.useState('');

  // Desktop workspace state
  const [leftPanelTab, setLeftPanelTab] = React.useState<'threads' | 'files'>('threads');
  const [openFile, setOpenFile] = React.useState<string | null>('auth.ts'); // null = no file open
  const [editorContent, setEditorContent] = React.useState(`// src/services/auth.ts

export function validateUser(
  email: string,
  password: string
) {
  // Email format validation
  const emailRegex =
    /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      valid: false,
      error: 'Invalid email format'
    };
  }

  // Password strength check
  if (password.length < 8) {
    return {
      valid: false,
      error: 'Password must be at least 8 characters'
    };
  }

  return { valid: true };
}`);

  // Context widget expansion states
  const [expandedWidgets, setExpandedWidgets] = React.useState<Set<string>>(new Set());
  const [hoveredWidget, setHoveredWidget] = React.useState<string | null>(null);
  const toggleWidget = (widgetId: string) => {
    setExpandedWidgets((prev) => {
      const next = new Set(prev);
      if (next.has(widgetId)) {
        next.delete(widgetId);
      } else {
        next.add(widgetId);
      }
      return next;
    });
  };

  const currentChat = mockChats.find((c) => c.id === currentChatId) || mockChats[1];
  const filteredChats = mockChats.filter((chat) =>
    chat.title.toLowerCase().includes(chatSearchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (!draftMessage.trim()) return;

    const newMessage: MessageData = {
      id: `m${messages.length + 1}`,
      role: 'user',
      content: draftMessage,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setDraftMessage('');

    // Simulate agent response
    setIsResponding(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `m${prev.length + 1}`,
          role: 'agent',
          content: 'I found several React 18 best practices. Creating a summary document now...',
          timestamp: new Date(),
          citations: mockCitations,
        },
      ]);
      setIsResponding(false);
      setShowApproval(true);
    }, 2000);
  };

  const handleRemoveReference = (id: string) => {
    setReferences(references.filter((r) => r.id !== id));
  };

  const handleApprove = () => {
    setIsApproving(true);
    setTimeout(() => {
      setShowApproval(false);
      setIsApproving(false);
    }, 1500);
  };

  const handleReject = () => {
    setShowApproval(false);
  };

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    setShowChatSelector(false);
    setChatSearchQuery('');
  };

  const handleNewChat = () => {
    // In a real implementation, this would create a new chat
    console.log('Create new chat');
    setShowChatSelector(false);
  };

  return (
    <DesignSystemFrame
      title="Integrated Workspace"
      backHref="/ai-agent-system"
      description="Full workspace integration with file tree, editor, and AI chat. Switch between desktop and mobile viewports."
    >
      <div className="space-y-4">
        {/* Design Controls */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-sm mb-3">Design Controls</h3>
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded p-1">
              <button
                onClick={() => setViewport('desktop')}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  viewport === 'desktop'
                    ? 'bg-primary-500 text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Desktop (1440px)
              </button>
              <button
                onClick={() => setViewport('mobile')}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  viewport === 'mobile'
                    ? 'bg-primary-500 text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Mobile (375px)
              </button>
            </div>

            {viewport === 'desktop' && (
              <>
                <div className="flex gap-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded p-1">
                  <button
                    onClick={() => setLeftPanelTab('threads')}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      leftPanelTab === 'threads'
                        ? 'bg-primary-500 text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    Threads Tab
                  </button>
                  <button
                    onClick={() => setLeftPanelTab('files')}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      leftPanelTab === 'files'
                        ? 'bg-primary-500 text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    Files Tab
                  </button>
                </div>
                <button
                  onClick={() => setOpenFile(openFile ? null : 'auth.ts')}
                  className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-750"
                >
                  {openFile ? 'Close File' : 'Open File'}
                </button>
              </>
            )}

            <button
              onClick={() => setShowApproval(!showApproval)}
              className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-750"
            >
              {showApproval ? 'Hide' : 'Show'} Approval
            </button>
            <button
              onClick={() => setIsResponding(!isResponding)}
              className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-750"
            >
              {isResponding ? 'Stop' : 'Start'} Agent
            </button>
            {viewport === 'mobile' && (
              <select
                value={currentMobileView}
                onChange={(e) =>
                  setCurrentMobileView(e.target.value as 'files' | 'editor' | 'chat')
                }
                className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded"
              >
                <option value="files">Files View</option>
                <option value="editor">Editor View</option>
                <option value="chat">Chat View</option>
              </select>
            )}
          </div>
        </div>

        {/* Workspace Container */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {viewport === 'desktop' ? (
            <div className="h-[900px]">
              <DesktopWorkspace
                messages={messages}
                draftMessage={draftMessage}
                onDraftMessageChange={setDraftMessage}
                onSendMessage={handleSendMessage}
                isAgentResponding={isResponding}
                canCancelRequest={isResponding}
                onCancelRequest={() => setIsResponding(false)}
                contextReferences={references}
                onRemoveReference={handleRemoveReference}
                onReferenceClick={(ref) => console.log('Reference clicked:', ref)}
                onAddReference={() => console.log('Add reference clicked')}
                approvalRequest={
                  showApproval
                    ? {
                        changes: mockFileChanges,
                        isOngoing: true,
                        onApprove: handleApprove,
                        onReject: handleReject,
                        isApproving,
                      }
                    : undefined
                }
                currentChat={currentChat}
                allChats={mockChats}
                showChatSelector={showChatSelector}
                onToggleChatSelector={() => setShowChatSelector(!showChatSelector)}
                chatSearchQuery={chatSearchQuery}
                onChatSearchChange={setChatSearchQuery}
                filteredChats={filteredChats}
                onSelectChat={handleSelectChat}
                onNewChat={handleNewChat}
                leftPanelTab={leftPanelTab}
                onLeftPanelTabChange={setLeftPanelTab}
                openFile={openFile}
                onCloseFile={() => setOpenFile(null)}
                editorContent={editorContent}
                onEditorContentChange={setEditorContent}
                expandedWidgets={expandedWidgets}
                onToggleWidget={toggleWidget}
                hoveredWidget={hoveredWidget}
                onHoveredWidgetChange={setHoveredWidget}
              />
            </div>
          ) : (
            <div className="w-[375px] h-[812px] mx-auto">
              <MobileWorkspace
                messages={messages}
                draftMessage={draftMessage}
                onDraftMessageChange={setDraftMessage}
                onSendMessage={handleSendMessage}
                isAgentResponding={isResponding}
                canCancelRequest={isResponding}
                onCancelRequest={() => setIsResponding(false)}
                contextReferences={references}
                onRemoveReference={handleRemoveReference}
                onReferenceClick={(ref) => console.log('Reference clicked:', ref)}
                onAddReference={() => console.log('Add reference clicked')}
                approvalRequest={
                  showApproval
                    ? {
                        changes: mockFileChanges,
                        isOngoing: true,
                        onApprove: handleApprove,
                        onReject: handleReject,
                        isApproving,
                      }
                    : undefined
                }
                currentView={currentMobileView}
                setCurrentView={setCurrentMobileView}
                currentChat={currentChat}
                allChats={mockChats}
                showChatSelector={showChatSelector}
                onToggleChatSelector={() => setShowChatSelector(!showChatSelector)}
                chatSearchQuery={chatSearchQuery}
                onChatSearchChange={setChatSearchQuery}
                filteredChats={filteredChats}
                onSelectChat={handleSelectChat}
                onNewChat={handleNewChat}
              />
            </div>
          )}
        </div>

        {/* Implementation Notes */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h3 className="font-semibold text-sm mb-2">Implementation Notes</h3>
          {viewport === 'desktop' ? (
            <ul className="text-sm space-y-1 list-disc list-inside text-gray-700 dark:text-gray-300">
              <li>
                <strong>Thread-first UX:</strong> Adaptive 3-panel layout prioritizes conversation
              </li>
              <li>
                <strong>Left panel (20%):</strong> Tabs for Files/Threads (defaults to Threads on open)
              </li>
              <li>
                <strong>Center panel (40-80%):</strong> Thread/chat (expands when no file open)
              </li>
              <li>
                <strong>Right panel (0-40%):</strong> Editor (only appears when file opened, close button to dismiss)
              </li>
              <li>Only one file open at a time (simplifies MVP, matches user mental model)</li>
              <li>Chat maintains state independently from editor</li>
            </ul>
          ) : (
            <ul className="text-sm space-y-1 list-disc list-inside text-gray-700 dark:text-gray-300">
              <li>Single-panel mobile layout switches between Files, Editor, and Chat</li>
              <li>Bottom navigation with 44px minimum touch targets</li>
              <li>Chat view uses full viewport height</li>
              <li>Context pills scrollable horizontally</li>
              <li>Active tab indicated by primary color (coral)</li>
            </ul>
          )}
        </div>
      </div>
    </DesignSystemFrame>
  );
}

// Chat Header Component
interface ChatHeaderProps {
  currentChat: ChatData;
  showChatSelector: boolean;
  onToggleChatSelector: () => void;
  chatSearchQuery: string;
  onChatSearchChange: (query: string) => void;
  filteredChats: ChatData[];
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
}

function ChatHeader({
  currentChat,
  showChatSelector,
  onToggleChatSelector,
  chatSearchQuery,
  onChatSearchChange,
  filteredChats,
  onSelectChat,
  onNewChat,
}: ChatHeaderProps) {
  return (
    <div className="relative border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Current Chat Title / Selector Button */}
        <button
          onClick={onToggleChatSelector}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <span className="font-medium text-sm truncate max-w-[200px]">{currentChat.title}</span>
          <Icons.chevronDown
            className={`h-4 w-4 text-gray-500 transition-transform ${showChatSelector ? 'rotate-180' : ''}`}
          />
        </button>

        {/* New Chat Button */}
        <Button onClick={onNewChat} size="sm" variant="outline" className="gap-2">
          <Icons.plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Chat Selector Dropdown */}
      {showChatSelector && (
        <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-lg z-10">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search chats..."
                value={chatSearchQuery}
                onChange={(e) => onChatSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="max-h-[300px] overflow-y-auto">
            {filteredChats.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">No chats found</div>
            ) : (
              filteredChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 ${
                    chat.id === currentChat.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium truncate">{chat.title}</h4>
                        {chat.id === currentChat.id && (
                          <Icons.check className="h-3 w-3 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5">
                        {chat.lastMessagePreview}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {formatRelativeTime(chat.lastActivityAt)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to format relative time
function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Desktop Workspace Component
interface WorkspaceProps {
  messages: MessageData[];
  draftMessage: string;
  onDraftMessageChange: (message: string) => void;
  onSendMessage: () => void;
  isAgentResponding?: boolean;
  canCancelRequest?: boolean;
  onCancelRequest?: () => void;
  contextReferences: ContextReferenceData[];
  onRemoveReference?: (referenceId: string) => void;
  onReferenceClick?: (reference: ContextReferenceData) => void;
  onAddReference?: () => void;
  approvalRequest?: {
    changes: FileChangePreview[];
    isOngoing: boolean;
    onApprove: () => void;
    onReject: () => void;
    isApproving?: boolean;
    isRejecting?: boolean;
  };
  currentChat: ChatData;
  allChats: ChatData[];
  showChatSelector: boolean;
  onToggleChatSelector: () => void;
  chatSearchQuery: string;
  onChatSearchChange: (query: string) => void;
  filteredChats: ChatData[];
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  leftPanelTab: 'threads' | 'files';
  onLeftPanelTabChange: (tab: 'threads' | 'files') => void;
  openFile: string | null;
  onCloseFile: () => void;
  editorContent: string;
  onEditorContentChange: (content: string) => void;
  expandedWidgets: Set<string>;
  onToggleWidget: (widgetId: string) => void;
  hoveredWidget: string | null;
  onHoveredWidgetChange: (widgetId: string | null) => void;
}

function DesktopWorkspace(chatProps: WorkspaceProps) {
  const {
    leftPanelTab,
    onLeftPanelTabChange,
    openFile,
    onCloseFile,
    editorContent,
    onEditorContentChange,
    expandedWidgets,
    onToggleWidget,
    hoveredWidget,
    onHoveredWidgetChange,
  } = chatProps;

  // Calculate widths based on whether file is open
  const centerWidth = openFile ? 'w-[40%]' : 'w-[80%]';
  const rightWidth = openFile ? 'w-[40%]' : 'w-0';

  // Prepare context widgets data
  const contextWidgets: ContextWidget[] = [
    {
      id: 'active',
      type: 'active',
      count: chatProps.contextReferences.length + mockExplicitContext.length,
      items: [...chatProps.contextReferences, ...mockExplicitContext].map((item) => ({
        id: item.id,
        label: item.displayLabel || item.label,
        canRemove: true,
      })),
    },
    {
      id: 'frequent',
      type: 'frequent',
      count: mockFrequentlyUsed.length,
    },
    {
      id: 'semantic',
      type: 'semantic',
      count: mockSemanticMatches.length,
    },
    {
      id: 'branch',
      type: 'branch',
      count: mockBranchContext.length,
    },
    {
      id: 'artifacts',
      type: 'artifacts',
      count: mockArtifacts.length,
    },
    {
      id: 'excluded',
      type: 'excluded',
      count: mockExcludedContext.length,
    },
  ];

  const handleRemoveContextItem = (widgetType: string, itemId: string) => {
    if (widgetType === 'active') {
      chatProps.onRemoveReference?.(itemId);
    }
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900">
      <div className="flex h-full">
        {/* Left Panel: Threads/Files Tabs (20%) */}
        <div className="w-[20%] border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
          {/* Tab Switcher */}
          <div className="border-b border-gray-200 dark:border-gray-700 p-2">
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 rounded p-1">
              <button
                onClick={() => onLeftPanelTabChange('threads')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded transition-colors ${
                  leftPanelTab === 'threads'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                Threads
              </button>
              <button
                onClick={() => onLeftPanelTabChange('files')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded transition-colors ${
                  leftPanelTab === 'files'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                Files
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-3">
            {leftPanelTab === 'threads' ? (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Thread Branches
                </div>
                {/* Tree structure showing branch hierarchy */}
                <div className="space-y-0.5">
                  {mockBranches.map((branch) => {
                    const depth = branch.depth || 0;
                    const isActive = branch.isActive;
                    const hasChildren = branch.childCount && branch.childCount > 0;

                    return (
                      <div
                        key={branch.id}
                        className={`text-left rounded transition-colors ${
                          isActive
                            ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-750'
                        }`}
                        style={{ marginLeft: `${depth * 12}px` }}
                      >
                        <button className="w-full px-2 py-1.5 flex items-center gap-2">
                          {/* Branch indicator */}
                          <div className="flex-shrink-0">
                            {hasChildren ? (
                              <Icons.gitBranch className="h-3.5 w-3.5 text-gray-400" />
                            ) : (
                              <div className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                            )}
                          </div>
                          {/* Branch content */}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                              {branch.title}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {branch.artifactCount} artifacts
                            </div>
                          </div>
                          {branch.createdByAgent && (
                            <Icons.sparkles className="h-3 w-3 text-primary-500 flex-shrink-0" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Files
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 p-1.5 hover:bg-gray-50 dark:hover:bg-gray-750 rounded cursor-pointer">
                    <Icons.folder className="h-4 w-4 text-gray-400" />
                    <span>docs</span>
                  </div>
                  <div className="flex items-center gap-2 p-1.5 ml-4 hover:bg-gray-50 dark:hover:bg-gray-750 rounded cursor-pointer">
                    <Icons.fileText className="h-4 w-4 text-gray-400" />
                    <span>react-18-best-practices.md</span>
                  </div>
                  <div className="flex items-center gap-2 p-1.5 hover:bg-gray-50 dark:hover:bg-gray-750 rounded cursor-pointer">
                    <Icons.folder className="h-4 w-4 text-gray-400" />
                    <span>src</span>
                  </div>
                  <div
                    className={`flex items-center gap-2 p-1.5 ml-4 rounded cursor-pointer ${
                      openFile === 'auth.ts'
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-750'
                    }`}
                  >
                    <Icons.fileText className="h-4 w-4" />
                    <span className="font-medium">auth.ts</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center Panel: Thread/Chat (40-80%, expands when no file open) */}
        <div className={`${centerWidth} bg-white dark:bg-gray-800 flex flex-col transition-all duration-200`}>
          {/* Branch Selector */}
          <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
            <BranchSelector
              currentBranch={mockBranches[4]} // "RAG Deep Dive" branch
              branches={mockBranches}
              onSelectBranch={(id) => console.log('Selected branch:', id)}
              onCreateBranch={() => console.log('Create new branch')}
            />
          </div>

          {/* Messages Section */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {chatProps.messages.map((msg) => (
                <div key={msg.id} className="flex gap-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    msg.role === 'user'
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}>
                    {msg.role === 'user' ? 'U' : 'A'}
                  </div>
                  <div className="flex-1">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p>{msg.content}</p>
                    </div>
                    {msg.toolCalls && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                          Used {msg.toolCalls.length} tools
                        </summary>
                        <div className="mt-1 space-y-1">
                          {msg.toolCalls.map((tool) => (
                            <div key={tool.id} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                              <Icons.check className="h-3 w-3 text-success-500" />
                              {tool.description}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                    <time className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                      {msg.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </time>
                  </div>
                </div>
              ))}
            </div>

            {/* Approval Request */}
            {chatProps.approvalRequest && (
              <div className="mt-4 border border-warning-200 dark:border-warning-800 rounded-lg p-3 bg-warning-50 dark:bg-warning-900/20">
                <div className="flex items-start gap-2">
                  <Icons.alertCircle className="h-5 w-5 text-warning-600 dark:text-warning-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Create: {chatProps.approvalRequest.changes[0].filePath.split('/').pop()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={chatProps.approvalRequest.onApprove}
                      className="p-1.5 bg-success-600 text-white rounded hover:bg-success-700"
                    >
                      <Icons.check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={chatProps.approvalRequest.onReject}
                      className="p-1.5 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      <Icons.x className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Context Widgets - Reusable Component */}
          <ContextWidgets
            widgets={contextWidgets}
            isExpanded={expandedWidgets.has('context-section')}
            onToggleExpand={() => onToggleWidget('context-section')}
            onRemoveItem={handleRemoveContextItem}
          />

          {/* Input Box */}
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="px-4 py-3 bg-white dark:bg-gray-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatProps.draftMessage}
                  onChange={(e) => chatProps.onDraftMessageChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      chatProps.onSendMessage();
                    }
                  }}
                  placeholder="Ask a question or describe what you'd like to do..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={chatProps.onSendMessage}
                  disabled={!chatProps.draftMessage.trim()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Icons.send className="h-4 w-4" />
                  <span>Send</span>
                </button>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span>Use @ to reference files</span>
                <span>Cmd+Enter to send</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Editor (0-40%, only when file is open) */}
        {openFile && (
          <div className={`${rightWidth} border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col transition-all duration-200`}>
            {/* Editor Header with Close Button */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-3 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <Icons.fileText className="h-4 w-4 text-gray-500" />
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">{openFile}</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  (Read-only preview)
                </span>
              </div>
              <button
                onClick={onCloseFile}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Close file"
              >
                <Icons.x className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Editor Content - Using Monaco-like syntax highlighting */}
            <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900">
              <div className="h-full overflow-auto p-4 font-mono text-sm">
                <pre className="text-gray-900 dark:text-gray-100 leading-relaxed">
                  <code>{editorContent}</code>
                </pre>
              </div>
            </div>

            {/* Editor Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>TypeScript</span>
                <span>UTF-8</span>
                <span>Lines: {editorContent.split('\n').length}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Mobile Workspace Component
interface MobileWorkspaceProps extends WorkspaceProps {
  currentView: 'files' | 'editor' | 'chat';
  setCurrentView: (view: 'files' | 'editor' | 'chat') => void;
}

function MobileWorkspace(props: MobileWorkspaceProps) {
  const { currentView, setCurrentView, ...chatProps } = props;
  return (
    <MobileLayout
      header={
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Icons.menu className="h-5 w-5" />
            </Button>
            <h1 className="font-semibold text-base">
              {currentView === 'files' && 'Files'}
              {currentView === 'editor' && 'auth.ts'}
              {currentView === 'chat' && 'AI Assistant'}
            </h1>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Icons.settings className="h-5 w-5" />
          </Button>
        </div>
      }
      footer={
        <div className="flex items-center justify-around bg-white dark:bg-gray-800 py-2 px-4">
          <button
            onClick={() => setCurrentView('files')}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${
              currentView === 'files'
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Icons.folder className="h-5 w-5" />
            <span className="text-xs font-medium">Files</span>
          </button>
          <button
            onClick={() => setCurrentView('editor')}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${
              currentView === 'editor'
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Icons.fileText className="h-5 w-5" />
            <span className="text-xs font-medium">Editor</span>
          </button>
          <button
            onClick={() => setCurrentView('chat')}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${
              currentView === 'chat'
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Icons.messageSquare className="h-5 w-5" />
            <span className="text-xs font-medium">Chat</span>
          </button>
        </div>
      }
    >
      {/* Files View */}
      {currentView === 'files' && (
        <div className="p-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <Icons.folder className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium">docs</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 ml-4">
              <Icons.fileText className="h-5 w-5 text-gray-600" />
              <span className="text-sm">react-18-best-practices.md</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <Icons.folder className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium">src</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 ml-4">
              <Icons.fileText className="h-5 w-5 text-primary-600" />
              <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                auth.ts
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Editor View */}
      {currentView === 'editor' && (
        <div className="p-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 font-mono text-xs">
            <pre className="text-gray-900 dark:text-gray-100">
{`// src/services/auth.ts

export function validateUser(
  email: string,
  password: string
) {
  // Email format validation
  const emailRegex =
    /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      valid: false,
      error: 'Invalid email format'
    };
  }

  // Password strength check
  if (password.length < 8) {
    return {
      valid: false,
      error: 'Password must be at least 8 characters'
    };
  }

  return { valid: true };
}`}
            </pre>
          </div>
        </div>
      )}

      {/* Chat View */}
      {currentView === 'chat' && (
        <div className="flex flex-col h-full">
          <ChatHeader
            currentChat={chatProps.currentChat}
            showChatSelector={chatProps.showChatSelector}
            onToggleChatSelector={chatProps.onToggleChatSelector}
            chatSearchQuery={chatProps.chatSearchQuery}
            onChatSearchChange={chatProps.onChatSearchChange}
            filteredChats={chatProps.filteredChats}
            onSelectChat={chatProps.onSelectChat}
            onNewChat={chatProps.onNewChat}
          />
          <div className="flex-1 overflow-hidden">
            <ChatView
              messages={chatProps.messages}
              draftMessage={chatProps.draftMessage}
              onDraftMessageChange={chatProps.onDraftMessageChange}
              onSendMessage={chatProps.onSendMessage}
              isAgentResponding={chatProps.isAgentResponding}
              canCancelRequest={chatProps.canCancelRequest}
              onCancelRequest={chatProps.onCancelRequest}
              contextReferences={chatProps.contextReferences}
              onRemoveReference={chatProps.onRemoveReference}
              onReferenceClick={chatProps.onReferenceClick}
              onAddReference={chatProps.onAddReference}
              approvalRequest={chatProps.approvalRequest}
            />
          </div>
        </div>
      )}
    </MobileLayout>
  );
}
