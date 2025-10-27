import React from 'react';
import { DesignSystemFrame } from '../../components/DesignSystemFrame';
import {
  ChatView,
  ChatListPanel,
  ContextReferenceData,
  MessageData,
  ChatData,
} from '@centrid/ui/features';
import { FileAutocomplete, FileItem, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@centrid/ui/components';

// ============================================================================
// STREAMING STATES DATA
// ============================================================================

const idleMessages: MessageData[] = [];

const userMessageState: MessageData[] = [
  {
    id: 'm1',
    role: 'user',
    content: 'Can you help me refactor this authentication function to use async/await?',
    timestamp: new Date(),
  },
];

const streamingState: MessageData[] = [
  {
    id: 'm1',
    role: 'user',
    content: 'Can you help me refactor this authentication function to use async/await?',
    timestamp: new Date(Date.now() - 5000),
  },
  {
    id: 'm2',
    role: 'agent',
    content: "I'll help you refactor the authentication function to use async/await. Let me first read the current implementation to understand",
    timestamp: new Date(),
  },
];

const toolCallProgressState: MessageData[] = [
  {
    id: 'm1',
    role: 'user',
    content: 'Can you help me refactor this authentication function to use async/await?',
    timestamp: new Date(Date.now() - 10000),
  },
  {
    id: 'm2',
    role: 'agent',
    timestamp: new Date(Date.now() - 5000),
    contentBlocks: [
      {
        id: 'b1',
        type: 'text',
        content: "I'll help you refactor the authentication function. Let me read the current implementation first.",
      },
      {
        id: 'b2',
        type: 'tool_calls',
        toolCalls: [
          {
            id: 't1',
            toolName: 'read_document',
            status: 'running',
            description: 'Reading authentication module',
            targetFile: '/src/services/auth.ts',
          },
        ],
      },
      {
        id: 'b3',
        type: 'text',
        content: "I'm analyzing the function structure to identify the best refactoring approach...",
      },
    ],
  },
];

const toolCallCompleteState: MessageData[] = [
  {
    id: 'm1',
    role: 'user',
    content: 'Can you help me refactor this authentication function to use async/await?',
    timestamp: new Date(Date.now() - 15000),
  },
  {
    id: 'm2',
    role: 'agent',
    timestamp: new Date(Date.now() - 10000),
    contentBlocks: [
      {
        id: 'b1',
        type: 'text',
        content: "I'll help you refactor the authentication function. Let me read the current implementation first.",
      },
      {
        id: 'b2',
        type: 'tool_calls',
        toolCalls: [
          {
            id: 't1',
            toolName: 'read_document',
            status: 'completed',
            description: 'Reading authentication module',
            targetFile: '/src/services/auth.ts',
          },
        ],
      },
      {
        id: 'b3',
        type: 'text',
        content: "Great! I found the authentication logic. Now let me search for any related test files.",
      },
      {
        id: 'b4',
        type: 'tool_calls',
        toolCalls: [
          {
            id: 't2',
            toolName: 'search_documents',
            status: 'completed',
            description: 'Searching for authentication tests',
            targetFile: '/src/services/__tests__/',
          },
        ],
      },
      {
        id: 'b5',
        type: 'text',
        content: "Perfect! I've analyzed both the implementation and tests. I'm ready to provide the refactored version.",
      },
    ],
  },
];

const completeResponseState: MessageData[] = [
  {
    id: 'm1',
    role: 'user',
    content: 'Can you help me refactor this authentication function to use async/await?',
    timestamp: new Date(Date.now() - 30000),
  },
  {
    id: 'm2',
    role: 'agent',
    content: `I've analyzed your authentication function. Here's the refactored version using async/await:

\`\`\`typescript
export async function authenticateUser(email: string, password: string) {
  try {
    const user = await db.users.findByEmail(email);

    if (!user) {
      throw new Error('User not found');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      throw new Error('Invalid password');
    }

    const token = await generateJWT(user.id);
    return { user, token };
  } catch (error) {
    logger.error('Authentication failed:', error);
    throw error;
  }
}
\`\`\`

The key improvements:
1. Replaced callback-based code with async/await
2. Added proper error handling with try/catch
3. Made the data flow more linear and readable
4. Added logging for debugging`,
    timestamp: new Date(Date.now() - 20000),
    toolCalls: [
      {
        id: 't1',
        toolName: 'read_document',
        status: 'completed',
        description: 'Reading authentication module',
        targetFile: '/src/services/auth.ts',
      },
    ],
  },
];

const mockContextReferences: ContextReferenceData[] = [
  {
    id: '1',
    referenceType: 'file',
    displayLabel: 'auth.ts',
    sourceReference: '/src/services/auth.ts',
    tokenCount: 500,
  },
];

// ============================================================================
// CHAT LIST DATA
// ============================================================================

const mockChats: ChatData[] = [
  {
    id: 'c1',
    title: 'Refactor authentication function',
    lastMessagePreview: "I'll help you refactor the authentication function to use async/await...",
    lastActivityAt: new Date(Date.now() - 5 * 60 * 1000), // 5 mins ago
    contextCount: 2,
    hasUnread: true,
    initializationContext: 'file',
  },
  {
    id: 'c2',
    title: 'Add tests for user validation',
    lastMessagePreview: 'I can help you write comprehensive tests for the user validation logic...',
    lastActivityAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    contextCount: 3,
    hasUnread: false,
    initializationContext: 'folder',
  },
  {
    id: 'c3',
    title: 'General project questions',
    lastMessagePreview: 'Let me search through your files to find the relevant documentation...',
    lastActivityAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    contextCount: 1,
    hasUnread: false,
    initializationContext: 'new_chat',
  },
  {
    id: 'c4',
    title: 'Update API documentation',
    lastMessagePreview: "I've reviewed the API endpoints and can help update the documentation...",
    lastActivityAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    contextCount: 5,
    hasUnread: false,
    initializationContext: 'file',
  },
  {
    id: 'c5',
    title: 'Migrate database schema',
    lastMessagePreview: 'Here are the steps to safely migrate your database schema...',
    lastActivityAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    contextCount: 4,
    hasUnread: false,
    initializationContext: 'folder',
  },
];

// ============================================================================
// FILE AUTOCOMPLETE DATA
// ============================================================================

const mockFileItems: FileItem[] = [
  {
    id: 'f1',
    name: 'auth.ts',
    path: '/src/services/auth.ts',
    type: 'file',
  },
  {
    id: 'f2',
    name: 'user.ts',
    path: '/src/types/user.ts',
    type: 'file',
  },
  {
    id: 'f3',
    name: 'validation.ts',
    path: '/src/utils/validation.ts',
    type: 'file',
  },
  {
    id: 'f4',
    name: 'components',
    path: '/src/components',
    type: 'folder',
  },
  {
    id: 'f5',
    name: 'README.md',
    path: '/README.md',
    type: 'file',
  },
  {
    id: 'f6',
    name: 'services',
    path: '/src/services',
    type: 'folder',
  },
];

type StreamingState = 'idle' | 'user-message' | 'streaming' | 'tool-progress' | 'tool-complete' | 'complete';
type ChatListState = 'empty' | 'loading' | 'with-chats' | 'search-results';
type AutocompleteState = 'closed' | 'open-empty' | 'open-searching' | 'open-with-results';

export default function ChatStates() {
  // Streaming states
  const [currentStreamingState, setCurrentStreamingState] = React.useState<StreamingState>('streaming');
  const [draftMessage, setDraftMessage] = React.useState('');

  // Chat list states
  const [currentChatListState, setCurrentChatListState] = React.useState<ChatListState>('with-chats');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeChatId, setActiveChatId] = React.useState('c1');

  // Autocomplete states
  const [currentAutocompleteState, setCurrentAutocompleteState] = React.useState<AutocompleteState>('open-with-results');
  const [autocompleteQuery, setAutocompleteQuery] = React.useState('');

  const stateMessages = {
    idle: idleMessages,
    'user-message': userMessageState,
    streaming: streamingState,
    'tool-progress': toolCallProgressState,
    'tool-complete': toolCallCompleteState,
    complete: completeResponseState,
  };

  const messages = stateMessages[currentStreamingState];
  const isResponding = currentStreamingState === 'streaming' || currentStreamingState === 'tool-progress';

  return (
    <DesignSystemFrame
      featureName="AI Agent System"
      featureId="ai-agent-system"
    >
      <div className="space-y-12">
        {/* ============================================================ */}
        {/* SECTION 1: STREAMING STATES */}
        {/* ============================================================ */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              1. Streaming States
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              ChatView component states from idle to complete response
            </p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-sm mb-3">Current State</h3>
            <div className="flex flex-wrap gap-2">
              {(['idle', 'user-message', 'streaming', 'tool-progress', 'tool-complete', 'complete'] as StreamingState[]).map((state, index) => (
                <button
                  key={state}
                  onClick={() => setCurrentStreamingState(state)}
                  className={`px-3 py-1 text-sm rounded ${
                    currentStreamingState === state
                      ? 'bg-primary-600 text-white'
                      : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {index + 1}. {state.charAt(0).toUpperCase() + state.slice(1).replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-sm mb-1 text-blue-900 dark:text-blue-100">
              {currentStreamingState === 'idle' && 'State 1: Idle (No Messages)'}
              {currentStreamingState === 'user-message' && 'State 2: User Message Sent'}
              {currentStreamingState === 'streaming' && 'State 3: Agent Streaming Response'}
              {currentStreamingState === 'tool-progress' && 'State 4: Tool Call in Progress'}
              {currentStreamingState === 'tool-complete' && 'State 5: Tool Call Completed'}
              {currentStreamingState === 'complete' && 'State 6: Complete Response with Code'}
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {currentStreamingState === 'idle' && 'Empty state showing placeholder to start conversation'}
              {currentStreamingState === 'user-message' && 'User has sent a message, waiting for agent response'}
              {currentStreamingState === 'streaming' && 'Agent is streaming response token by token (partial message visible)'}
              {currentStreamingState === 'tool-progress' && 'Agent is executing a tool call to read a file'}
              {currentStreamingState === 'tool-complete' && 'Tool call completed successfully, waiting for final response'}
              {currentStreamingState === 'complete' && 'Full response with markdown code block and explanation'}
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="h-[600px]">
              <ChatView
                messages={messages}
                draftMessage={draftMessage}
                onDraftMessageChange={setDraftMessage}
                onSendMessage={() => {}}
                isAgentResponding={isResponding}
                canCancelRequest={isResponding}
                onCancelRequest={() => {}}
                contextReferences={currentStreamingState === 'idle' ? [] : mockContextReferences}
                onRemoveReference={() => {}}
                onReferenceClick={() => {}}
                onAddReference={() => {}}
              />
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 2: CHAT LIST STATES */}
        {/* ============================================================ */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              2. Chat List States
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              ChatListPanel component showing empty, loading, populated, and search states
            </p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-sm mb-3">Current State</h3>
            <div className="flex flex-wrap gap-2">
              {(['empty', 'loading', 'with-chats', 'search-results'] as ChatListState[]).map((state) => (
                <button
                  key={state}
                  onClick={() => {
                    setCurrentChatListState(state);
                    if (state === 'search-results') {
                      setSearchQuery('auth');
                    } else {
                      setSearchQuery('');
                    }
                  }}
                  className={`px-3 py-1 text-sm rounded ${
                    currentChatListState === state
                      ? 'bg-primary-600 text-white'
                      : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {state.charAt(0).toUpperCase() + state.slice(1).replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Empty State</CardTitle>
                <CardDescription>No chats yet - shows "Create your first chat" prompt</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[500px] border-t border-gray-200 dark:border-gray-700">
                  <ChatListPanel
                    chats={[]}
                    activeChatId={undefined}
                    onSelectChat={() => {}}
                    onNewChat={() => {}}
                    isLoading={false}
                    searchQuery=""
                    onSearchChange={() => {}}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Loading State</CardTitle>
                <CardDescription>Skeleton loaders while fetching chats</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[500px] border-t border-gray-200 dark:border-gray-700">
                  <ChatListPanel
                    chats={[]}
                    activeChatId={undefined}
                    onSelectChat={() => {}}
                    onNewChat={() => {}}
                    isLoading={true}
                    searchQuery=""
                    onSearchChange={() => {}}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>With Chats</CardTitle>
                <CardDescription>List of 5 chats with previews, timestamps, and badges</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[500px] border-t border-gray-200 dark:border-gray-700">
                  <ChatListPanel
                    chats={mockChats}
                    activeChatId={activeChatId}
                    onSelectChat={setActiveChatId}
                    onNewChat={() => {}}
                    isLoading={false}
                    searchQuery=""
                    onSearchChange={setSearchQuery}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Search Results</CardTitle>
                <CardDescription>Filtered chats matching search query "auth"</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[500px] border-t border-gray-200 dark:border-gray-700">
                  <ChatListPanel
                    chats={mockChats}
                    activeChatId={activeChatId}
                    onSelectChat={setActiveChatId}
                    onNewChat={() => {}}
                    isLoading={false}
                    searchQuery="auth"
                    onSearchChange={setSearchQuery}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 3: FILE AUTOCOMPLETE STATES */}
        {/* ============================================================ */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              3. File Autocomplete States
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              FileAutocomplete component for @-mention and "+ Add" button interactions
            </p>
          </div>

          <div className="p-4 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-200 dark:border-warning-800">
            <h4 className="font-semibold text-sm mb-1 text-warning-900 dark:text-warning-100">
              Critical Interaction Pattern
            </h4>
            <ul className="text-sm text-warning-700 dark:text-warning-300 space-y-1">
              <li><strong>Desktop:</strong> Triggered by typing "@" in chat input or clicking "+ Add" button</li>
              <li><strong>Mobile:</strong> Triggered by clicking "+ Add" button (shows as bottom sheet/modal)</li>
              <li><strong>Search:</strong> Real-time filtering of files and folders by name/path</li>
              <li><strong>Keyboard Nav:</strong> Arrow keys to navigate, Enter to select, Escape to close</li>
            </ul>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Empty Query</CardTitle>
                <CardDescription>Shows first 8 items when no search query</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative h-96 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 flex items-end p-4">
                  <div className="w-full">
                    <FileAutocomplete
                      items={mockFileItems}
                      query=""
                      onQueryChange={setAutocompleteQuery}
                      onSelect={() => {}}
                      onClose={() => {}}
                      open={true}
                      placeholder="Search files and folders..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Searching</CardTitle>
                <CardDescription>Filtered results matching query "auth"</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative h-96 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 flex items-end p-4">
                  <div className="w-full">
                    <FileAutocomplete
                      items={mockFileItems}
                      query="auth"
                      onQueryChange={setAutocompleteQuery}
                      onSelect={() => {}}
                      onClose={() => {}}
                      open={true}
                      placeholder="Search files and folders..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>No Results</CardTitle>
                <CardDescription>Empty state when search yields no matches</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative h-96 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 flex items-end p-4">
                  <div className="w-full">
                    <FileAutocomplete
                      items={[]}
                      query="nonexistent"
                      onQueryChange={setAutocompleteQuery}
                      onSelect={() => {}}
                      onClose={() => {}}
                      open={true}
                      placeholder="Search files and folders..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ============================================================ */}
        {/* IMPLEMENTATION NOTES */}
        {/* ============================================================ */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h3 className="font-semibold text-sm mb-2">Implementation Notes</h3>
          <ul className="text-sm space-y-1 list-disc list-inside text-gray-700 dark:text-gray-300">
            <li><strong>Streaming:</strong> Uses @assistant-ui/react for token-by-token streaming</li>
            <li><strong>Chat List:</strong> Real-time search with debounce, virtualized scrolling for 100+ chats</li>
            <li><strong>Autocomplete:</strong> Keyboard navigation (↑↓ arrows, Enter, Escape), fuzzy search</li>
            <li><strong>Mobile:</strong> Autocomplete shows as bottom sheet with larger touch targets (44px min)</li>
            <li><strong>Performance:</strong> FileAutocomplete limits to 8 results max to prevent lag</li>
          </ul>
        </div>
      </div>
    </DesignSystemFrame>
  );
}
