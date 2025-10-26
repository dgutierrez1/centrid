import React from 'react';
import { DesignSystemFrame } from '../../components/DesignSystemFrame';
import { MobileLayout, Input } from '@centrid/ui/components';
import {
  ChatView,
  ContextReferenceData,
  MessageData,
  FileChangePreview,
} from '@centrid/ui/features';
import { ToolCall, Citation, Icons, Button } from '@centrid/ui/components';

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
    lastActivityAt: new Date(Date.now() - 300000), // 5 mins ago
  },
  {
    id: 'c2',
    title: 'React 18 best practices',
    lastMessagePreview: 'I found several React 18 best practices...',
    lastActivityAt: new Date(Date.now() - 120000), // 2 mins ago (current)
  },
  {
    id: 'c3',
    title: 'Add authentication tests',
    lastMessagePreview: 'Let me help you write tests for the auth...',
    lastActivityAt: new Date(Date.now() - 3600000), // 1 hour ago
  },
  {
    id: 'c4',
    title: 'Database migration guide',
    lastMessagePreview: 'Here are the steps to migrate your database...',
    lastActivityAt: new Date(Date.now() - 86400000), // 1 day ago
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

// Mock messages
const mockMessages: MessageData[] = [
  {
    id: 'm1',
    role: 'user',
    content: 'Where is the user validation logic in the codebase?',
    timestamp: new Date(Date.now() - 300000),
  },
  {
    id: 'm2',
    role: 'agent',
    content:
      'The user validation logic is located in `/src/services/auth.ts`. The main validation function is `validateUser()` which checks email format, password strength, and account status.',
    timestamp: new Date(Date.now() - 280000),
    toolCalls: mockToolCalls,
  },
  {
    id: 'm3',
    role: 'user',
    content: 'Can you search the web for React 18 best practices and create a summary file?',
    timestamp: new Date(Date.now() - 120000),
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
              <li>Three-panel layout: File tree (20%), Editor (50%), AI Chat (30%)</li>
              <li>Fixed proportions (no resizing in MVP)</li>
              <li>Chat maintains state independently from editor</li>
              <li>Context references can include selected file from editor</li>
              <li>Approval card appears inline above chat input</li>
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
}

function DesktopWorkspace({ ...chatProps }: WorkspaceProps) {
  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900">
      <div className="flex h-full">
        {/* Left Panel: File Tree (20%) */}
        <div className="w-1/5 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <h3 className="font-semibold text-sm mb-3">Files</h3>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <div>📁 docs</div>
            <div className="ml-4">📄 auth-guide.md</div>
            <div>📁 src</div>
            <div className="ml-4 text-primary-600 dark:text-primary-400">📄 auth.ts</div>
          </div>
        </div>

        {/* Center Panel: Editor (50%) */}
        <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <h3 className="font-semibold text-sm mb-3">auth.ts</h3>
          <div className="bg-gray-50 dark:bg-gray-900 rounded p-4 font-mono text-xs">
            <pre className="text-gray-900 dark:text-gray-100">
{`export function validateUser(
  email: string,
  password: string
) {
  // Validation logic...
  return { valid: true };
}`}
            </pre>
          </div>
        </div>

        {/* Right Panel: AI Chat (30%) */}
        <div className="w-[30%] bg-white dark:bg-gray-800 flex flex-col">
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
      </div>
    </div>
  );
}

// Mobile Workspace Component
interface MobileWorkspaceProps extends WorkspaceProps {
  currentView: 'files' | 'editor' | 'chat';
  setCurrentView: (view: 'files' | 'editor' | 'chat') => void;
}

function MobileWorkspace({ currentView, setCurrentView, ...chatProps }: MobileWorkspaceProps) {
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
