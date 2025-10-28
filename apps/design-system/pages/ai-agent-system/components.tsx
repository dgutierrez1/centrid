import React, { useState } from 'react';
import { DesignSystemFrame } from '../../components/DesignSystemFrame';
import {
  Message,
  ThreadInput,
  ToolCallApproval,
  ContextPanel,
  ContextReference,
  BranchSelector,
  BranchActions,
  CreateBranchModal,
  ConsolidateModal,
  ProvenanceHeader,
  FileEditorPanel,
  WorkspaceSidebar,
  AgentStreamEvent,
  AgentStreamMessage,
  type ContextGroup,
  type Branch,
  type FileData,
  type Provenance,
  type AgentEvent,
} from '@centrid/ui/features';

export default function ComponentsPage() {
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showConsolidateModal, setShowConsolidateModal] = useState(false);
  const [contextPanelExpanded, setContextPanelExpanded] = useState(true);
  const [sidebarActiveTab, setSidebarActiveTab] = useState<'files' | 'threads'>('threads');

  // Mock data
  const mockContextGroups: ContextGroup[] = [
    {
      type: 'explicit',
      title: 'Explicit References',
      items: [
        {
          referenceType: 'file',
          name: 'api-spec.md',
          sourceBranch: 'Main Thread',
          priorityTier: 1,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        },
        {
          referenceType: 'file',
          name: 'architecture.md',
          sourceBranch: 'Main Thread',
          priorityTier: 1,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
        },
      ],
    },
    {
      type: 'semantic',
      title: 'Semantic Matches',
      items: [
        {
          referenceType: 'file',
          name: 'implementation-guide.md',
          sourceBranch: 'API Design Branch',
          relevanceScore: 0.87,
          priorityTier: 2,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        },
        {
          referenceType: 'file',
          name: 'best-practices.md',
          sourceBranch: 'Main Thread',
          relevanceScore: 0.72,
          priorityTier: 2,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
        },
      ],
    },
    {
      type: 'branch',
      title: 'Branch Context',
      items: [
        {
          referenceType: 'file',
          name: 'initial-research.md',
          sourceBranch: 'Main Thread',
          priorityTier: 3,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 1 week ago
        },
      ],
    },
    {
      type: 'artifacts',
      title: 'Artifacts',
      items: [
        {
          referenceType: 'file',
          name: 'analysis.md',
          sourceBranch: 'Current Branch',
          priorityTier: 1,
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        },
      ],
    },
  ];

  const mockBranches: Branch[] = [
    {
      id: 'main',
      title: 'Main Thread',
      parentId: null,
      depth: 0,
      artifactCount: 3,
      lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      summary: 'Working on API design and implementation',
    },
    {
      id: 'branch-1',
      title: 'Feature Exploration',
      parentId: 'main',
      depth: 1,
      artifactCount: 2,
      lastActivity: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      summary: 'Exploring different approaches',
    },
    {
      id: 'branch-2',
      title: 'Authentication Research',
      parentId: 'main',
      depth: 1,
      artifactCount: 4,
      lastActivity: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      summary: 'Investigating OAuth and JWT patterns',
    },
    {
      id: 'branch-3',
      title: 'Database Schema',
      parentId: 'main',
      depth: 1,
      artifactCount: 3,
      lastActivity: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      summary: 'Designing data models',
    },
    {
      id: 'branch-1-1',
      title: 'Redux Implementation',
      parentId: 'branch-1',
      depth: 2,
      artifactCount: 5,
      lastActivity: new Date(Date.now() - 45 * 60 * 1000), // 45 min ago
      summary: 'Testing Redux for state management',
    },
    {
      id: 'branch-1-2',
      title: 'Context API Approach',
      parentId: 'branch-1',
      depth: 2,
      artifactCount: 3,
      lastActivity: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
      summary: 'Simpler alternative with React Context',
      isActive: true,
    },
    {
      id: 'branch-2-1',
      title: 'Google OAuth Setup',
      parentId: 'branch-2',
      depth: 2,
      artifactCount: 2,
      lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      summary: 'Configuring Google OAuth provider',
    },
    {
      id: 'branch-3-1',
      title: 'PostgreSQL Design',
      parentId: 'branch-3',
      depth: 2,
      artifactCount: 4,
      lastActivity: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      summary: 'SQL schema and migrations',
    },
    // Depth 3 branches
    {
      id: 'branch-1-1-1',
      title: 'Redux Toolkit Setup',
      parentId: 'branch-1-1',
      depth: 3,
      artifactCount: 2,
      lastActivity: new Date(Date.now() - 40 * 60 * 1000), // 40 min ago
      summary: 'Configuring Redux Toolkit with TypeScript',
    },
    {
      id: 'branch-1-1-2',
      title: 'Thunk Middleware Config',
      parentId: 'branch-1-1',
      depth: 3,
      artifactCount: 1,
      lastActivity: new Date(Date.now() - 35 * 60 * 1000), // 35 min ago
      summary: 'Async actions with Redux Thunk',
    },
    {
      id: 'branch-2-1-1',
      title: 'OAuth Callback Handler',
      parentId: 'branch-2-1',
      depth: 3,
      artifactCount: 3,
      lastActivity: new Date(Date.now() - 90 * 60 * 1000), // 90 min ago
      summary: 'Handling OAuth redirect and token exchange',
    },
    {
      id: 'branch-2-1-2',
      title: 'Token Refresh Logic',
      parentId: 'branch-2-1',
      depth: 3,
      artifactCount: 2,
      lastActivity: new Date(Date.now() - 80 * 60 * 1000), // 80 min ago
      summary: 'Automatic token refresh with retry logic',
    },
    {
      id: 'branch-3-1-1',
      title: 'User Table Schema',
      parentId: 'branch-3-1',
      depth: 3,
      artifactCount: 1,
      lastActivity: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      summary: 'User authentication and profile tables',
    },
    {
      id: 'branch-3-1-2',
      title: 'Document Relations',
      parentId: 'branch-3-1',
      depth: 3,
      artifactCount: 2,
      lastActivity: new Date(Date.now() - 3.5 * 60 * 60 * 1000), // 3.5 hours ago
      summary: 'Foreign keys and document ownership',
    },
    // Depth 4 branches
    {
      id: 'branch-1-1-1-1',
      title: 'Store Configuration',
      parentId: 'branch-1-1-1',
      depth: 4,
      artifactCount: 1,
      lastActivity: new Date(Date.now() - 38 * 60 * 1000), // 38 min ago
      summary: 'Root reducer and middleware setup',
    },
    {
      id: 'branch-1-1-1-2',
      title: 'DevTools Integration',
      parentId: 'branch-1-1-1',
      depth: 4,
      artifactCount: 1,
      lastActivity: new Date(Date.now() - 36 * 60 * 1000), // 36 min ago
      summary: 'Redux DevTools configuration',
    },
    {
      id: 'branch-2-1-1-1',
      title: 'Error Handling',
      parentId: 'branch-2-1-1',
      depth: 4,
      artifactCount: 2,
      lastActivity: new Date(Date.now() - 85 * 60 * 1000), // 85 min ago
      summary: 'OAuth error states and user feedback',
    },
    {
      id: 'branch-3-1-2-1',
      title: 'Cascade Delete Rules',
      parentId: 'branch-3-1-2',
      depth: 4,
      artifactCount: 1,
      lastActivity: new Date(Date.now() - 3.25 * 60 * 60 * 1000), // 3.25 hours ago
      summary: 'Defining cascade behavior for related records',
    },
  ];

  const mockFile: FileData = {
    id: 'file-1',
    name: 'api-spec.md',
    path: '/workspace/api-spec.md',
    content: '# API Specification\n\n## Overview\nThis document describes the API endpoints...',
    size: 2456,
    lastModified: new Date('2025-10-26T10:00:00Z'),
  };

  const mockProvenance: Provenance = {
    createdInThreadId: 'thread-abc',
    createdInThreadTitle: 'API Design Discussion',
    createdAt: new Date('2025-10-25T14:30:00Z'),
    createdBy: 'agent',
    contextSummary: 'Created while discussing RESTful API design patterns',
    lastEditedAt: new Date('2025-10-26T10:00:00Z'),
    lastEditedBy: 'user',
    editedInThreadId: 'thread-xyz',
  };

  // Mock streaming events with mixed text and tool calls
  const mockStreamEvents: AgentEvent[] = [
    { id: '1', type: 'text', content: "I'll help you implement OAuth authentication with Google. " },
    { id: '2', type: 'text', content: "First, let me create a configuration file for the OAuth providers." },
    {
      id: '3',
      type: 'tool_call',
      name: 'create_file',
      description: 'Creating /config/oauth.ts',
      input: { path: '/config/oauth.ts', content: '// OAuth config...' },
      output: 'File created successfully',
      status: 'completed',
      duration: 1200,
    },
    { id: '4', type: 'text', content: "Great! Now I'll update your authentication service to use this config." },
    {
      id: '5',
      type: 'tool_call',
      name: 'edit_file',
      description: 'Updating /services/auth.ts',
      input: { path: '/services/auth.ts', changes: 'Added OAuth provider setup' },
      output: 'Modified 15 lines',
      status: 'completed',
      duration: 800,
    },
    { id: '6', type: 'text', content: "Finally, let me add the redirect URL to your environment config." },
    {
      id: '7',
      type: 'tool_call',
      name: 'edit_file',
      description: 'Updating /.env.local',
      input: { path: '/.env.local', changes: 'Added GOOGLE_OAUTH_REDIRECT_URL' },
      status: 'running',
    },
  ];

  // Mock events with last tool expanded, previous collapsed
  const mockStreamEventsCollapsed: AgentEvent[] = [
    { id: 'a1', type: 'text', content: "Let me analyze your API design. " },
    {
      id: 'a2',
      type: 'tool_call',
      name: 'read_file',
      description: 'Reading /api/spec.md',
      input: { path: '/api/spec.md' },
      output: '# API Spec\n...',
      status: 'completed',
      duration: 500,
    },
    { id: 'a3', type: 'text', content: "I see some opportunities for improvement. Let me check your database schema too." },
    {
      id: 'a4',
      type: 'tool_call',
      name: 'read_file',
      description: 'Reading /db/schema.ts',
      input: { path: '/db/schema.ts' },
      output: 'export const schema = ...',
      status: 'completed',
      duration: 450,
    },
    { id: 'a5', type: 'text', content: "Based on both files, here are my recommendations:" },
    { id: 'a6', type: 'text', content: "1. Add validation middleware\n2. Implement rate limiting\n3. Use database transactions" },
    { id: 'a7', type: 'text', content: "Let me create a validation middleware file for you:" },
    {
      id: 'a8',
      type: 'tool_call',
      name: 'create_file',
      description: 'Creating /middleware/validate.ts',
      input: { path: '/middleware/validate.ts', content: 'export const validate = ...' },
      status: 'running',
    },
  ];

  // Mock events with multiple tools loading simultaneously (shimmer effect)
  const mockMultipleLoadingTools: AgentEvent[] = [
    { id: 'm1', type: 'text', content: "I'll set up your project structure. Running multiple tasks in parallel:" },
    {
      id: 'm2',
      type: 'tool_call',
      name: 'create_file',
      description: 'Creating package.json',
      input: { path: '/package.json' },
      status: 'running',
    },
    {
      id: 'm3',
      type: 'tool_call',
      name: 'create_file',
      description: 'Creating tsconfig.json',
      input: { path: '/tsconfig.json' },
      status: 'running',
    },
    {
      id: 'm4',
      type: 'tool_call',
      name: 'create_file',
      description: 'Creating .gitignore',
      input: { path: '/.gitignore' },
      status: 'running',
    },
  ];

  // Mock events with multiple completed tools grouped together (collapsed pill)
  const mockGroupedCollapsedTools: AgentEvent[] = [
    { id: 'g1', type: 'text', content: "Let me set up your project structure." },
    {
      id: 'g2',
      type: 'tool_call',
      name: 'create_file',
      description: 'Creating package.json',
      input: { path: '/package.json' },
      output: 'File created successfully',
      status: 'completed',
      duration: 300,
    },
    {
      id: 'g3',
      type: 'tool_call',
      name: 'create_file',
      description: 'Creating tsconfig.json',
      input: { path: '/tsconfig.json' },
      output: 'File created successfully',
      status: 'completed',
      duration: 250,
    },
    {
      id: 'g4',
      type: 'tool_call',
      name: 'create_file',
      description: 'Creating .gitignore',
      input: { path: '/.gitignore' },
      output: 'File created successfully',
      status: 'completed',
      duration: 200,
    },
    {
      id: 'g5',
      type: 'tool_call',
      name: 'create_file',
      description: 'Creating README.md',
      input: { path: '/README.md' },
      output: 'File created successfully',
      status: 'completed',
      duration: 350,
    },
    { id: 'g6', type: 'text', content: "All configuration files have been created. Now let me install the dependencies:" },
    {
      id: 'g7',
      type: 'tool_call',
      name: 'run_command',
      description: 'Running npm install',
      input: { command: 'npm install' },
      status: 'running',
    },
  ];

  return (
    <DesignSystemFrame title="AI Agent System - Component Library">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Component Library
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Complete showcase of all components with state variations used in the AI Agent System
          </p>
        </div>

        <div className="space-y-12">
          {/* Message Component */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Message
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Message bubble with avatar, timestamp, and support for both simple text and streaming events (text + tool calls)
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  User Message (no sender name, timestamp at bottom)
                </h3>
                <Message
                  role="user"
                  content="Can you help me implement OAuth authentication with Google?"
                  timestamp={new Date('2025-10-26T10:30:00Z')}
                />
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Simple Agent Message (no sender name, timestamp at bottom)
                </h3>
                <Message
                  role="assistant"
                  content="I'll help you implement OAuth authentication with Google using Supabase Auth. The process involves three main steps: configuring OAuth providers, updating your auth service, and setting up redirect URLs."
                  timestamp={new Date('2025-10-26T10:30:15Z')}
                />
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Agent Message with Mixed Streaming Events (text → tool → text → tool → text → tool)
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Pattern: text, text, tool (completed/collapsed), text, tool (completed/collapsed), text, tool (running/expanded with streaming indicator)
                </p>
                <Message
                  role="assistant"
                  events={mockStreamEvents}
                  timestamp={new Date()}
                  isStreaming={true}
                />
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Agent Message with Multiple Tools (auto-collapse old tools, expand last)
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Pattern: text, tool (completed/collapsed), text, tool (completed/collapsed), text, text, text, tool (running/expanded with streaming indicator)
                </p>
                <Message
                  role="assistant"
                  events={mockStreamEventsCollapsed}
                  timestamp={new Date()}
                  isStreaming={true}
                />
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Simple Streaming Message (text only, with cursor)
                </h3>
                <Message
                  role="assistant"
                  content=""
                  timestamp={new Date()}
                  isStreaming={true}
                  streamingBuffer="Let me think about the best approach for your use case..."
                />
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Multiple Tools Loading (shimmer effect)
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  When multiple tools are running simultaneously, a shimmer animation appears with the brand color
                </p>
                <Message
                  role="assistant"
                  events={mockMultipleLoadingTools}
                  timestamp={new Date()}
                  isStreaming={true}
                />
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Grouped Collapsed Tools (compact pill)
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  When multiple completed tools are executed in sequence, they're grouped into a compact pill that can be expanded
                </p>
                <AgentStreamMessage
                  events={mockGroupedCollapsedTools}
                  timestamp={new Date()}
                  isStreaming={false}
                  autoCollapseOldTools={true}
                />
              </div>
            </div>
          </section>

          {/* ThreadInput Component */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              ThreadInput
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Input field with send/stop toggle, character counter, and auto-resize
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default State
                </h3>
                <ThreadInput
                  messageText=""
                  onChange={() => {}}
                  onSendMessage={() => {}}
                  placeholder="Ask a question..."
                />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  With Text (Ready to Send)
                </h3>
                <ThreadInput
                  messageText="Can you help me with this task?"
                  onChange={() => {}}
                  onSendMessage={() => {}}
                />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Streaming State (Stop Button)
                </h3>
                <ThreadInput
                  messageText=""
                  onChange={() => {}}
                  onSendMessage={() => {}}
                  onStopStreaming={() => {}}
                  isStreaming={true}
                />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Loading State
                </h3>
                <ThreadInput
                  messageText=""
                  onChange={() => {}}
                  onSendMessage={() => {}}
                  isLoading={true}
                />
              </div>
            </div>
          </section>

          {/* ContextPanel Component */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              ContextPanel
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Context display with 4 context types (explicit, semantic, branch, artifacts) in horizontal widget layout
            </p>

            {/* Default: 2 explicit references */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Default (2 explicit references)
              </h3>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <ContextPanel
                  contextGroups={mockContextGroups}
                  isExpanded={contextPanelExpanded}
                  onTogglePanel={() => setContextPanelExpanded(!contextPanelExpanded)}
                  onWidgetClick={(type) => console.log('Widget click:', type)}
                  onAddReference={() => console.log('Add reference clicked')}
                  onReferenceClick={(item) => console.log('Reference clicked:', item.name)}
                  onRemoveReference={(item) => console.log('Remove reference:', item.name)}
                />
              </div>
            </div>

            {/* No explicit references */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                No Explicit References
              </h3>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <ContextPanel
                  contextGroups={[
                    { type: 'explicit', title: 'Explicit References', items: [] },
                    ...mockContextGroups.slice(1)
                  ]}
                  isExpanded={contextPanelExpanded}
                  onTogglePanel={() => setContextPanelExpanded(!contextPanelExpanded)}
                  onWidgetClick={(type) => console.log('Widget click:', type)}
                  onAddReference={() => console.log('Add reference clicked')}
                  onReferenceClick={(item) => console.log('Reference clicked:', item.name)}
                  onRemoveReference={(item) => console.log('Remove reference:', item.name)}
                />
              </div>
            </div>

            {/* 3 explicit references */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                3 Explicit References
              </h3>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <ContextPanel
                  contextGroups={[
                    {
                      type: 'explicit',
                      title: 'Explicit References',
                      items: [
                        {
                          referenceType: 'file',
                          name: 'api-spec.md',
                          sourceBranch: 'Main Thread',
                          priorityTier: 1,
                          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
                        },
                        {
                          referenceType: 'file',
                          name: 'architecture.md',
                          sourceBranch: 'Main Thread',
                          priorityTier: 1,
                          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
                        },
                        {
                          referenceType: 'file',
                          name: 'user-guide.md',
                          sourceBranch: 'Documentation Branch',
                          priorityTier: 1,
                          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
                        },
                      ],
                    },
                    ...mockContextGroups.slice(1)
                  ]}
                  isExpanded={contextPanelExpanded}
                  onTogglePanel={() => setContextPanelExpanded(!contextPanelExpanded)}
                  onWidgetClick={(type) => console.log('Widget click:', type)}
                  onAddReference={() => console.log('Add reference clicked')}
                  onReferenceClick={(item) => console.log('Reference clicked:', item.name)}
                  onRemoveReference={(item) => console.log('Remove reference:', item.name)}
                />
              </div>
            </div>

            {/* 4 explicit references */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                4 Explicit References
              </h3>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <ContextPanel
                  contextGroups={[
                    {
                      type: 'explicit',
                      title: 'Explicit References',
                      items: [
                        {
                          referenceType: 'file',
                          name: 'api-spec.md',
                          sourceBranch: 'Main Thread',
                          priorityTier: 1,
                          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
                        },
                        {
                          referenceType: 'file',
                          name: 'architecture.md',
                          sourceBranch: 'Main Thread',
                          priorityTier: 1,
                          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
                        },
                        {
                          referenceType: 'file',
                          name: 'user-guide.md',
                          sourceBranch: 'Documentation Branch',
                          priorityTier: 1,
                          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
                        },
                        {
                          referenceType: 'file',
                          name: 'deployment.md',
                          sourceBranch: 'DevOps Branch',
                          priorityTier: 1,
                          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
                        },
                      ],
                    },
                    ...mockContextGroups.slice(1)
                  ]}
                  isExpanded={contextPanelExpanded}
                  onTogglePanel={() => setContextPanelExpanded(!contextPanelExpanded)}
                  onWidgetClick={(type) => console.log('Widget click:', type)}
                  onAddReference={() => console.log('Add reference clicked')}
                  onReferenceClick={(item) => console.log('Reference clicked:', item.name)}
                  onRemoveReference={(item) => console.log('Remove reference:', item.name)}
                />
              </div>
            </div>

            {/* Many explicit references (8) */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Many Explicit References (8 items - shows overflow)
              </h3>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <ContextPanel
                  contextGroups={[
                    {
                      type: 'explicit',
                      title: 'Explicit References',
                      items: [
                        { referenceType: 'file', name: 'api-spec.md', sourceBranch: 'Main Thread', priorityTier: 1, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) },
                        { referenceType: 'file', name: 'architecture.md', sourceBranch: 'Main Thread', priorityTier: 1, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3) },
                        { referenceType: 'file', name: 'user-guide.md', sourceBranch: 'Documentation Branch', priorityTier: 1, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4) },
                        { referenceType: 'file', name: 'deployment.md', sourceBranch: 'DevOps Branch', priorityTier: 1, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5) },
                        { referenceType: 'file', name: 'security-best-practices.md', sourceBranch: 'Security Branch', priorityTier: 1, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6) },
                        { referenceType: 'file', name: 'testing-guide.md', sourceBranch: 'QA Branch', priorityTier: 1, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 7) },
                        { referenceType: 'file', name: 'performance-optimization.md', sourceBranch: 'Performance Branch', priorityTier: 1, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8) },
                        { referenceType: 'file', name: 'database-schema.md', sourceBranch: 'Data Branch', priorityTier: 1, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 9) },
                      ],
                    },
                    ...mockContextGroups.slice(1)
                  ]}
                  isExpanded={contextPanelExpanded}
                  onTogglePanel={() => setContextPanelExpanded(!contextPanelExpanded)}
                  onWidgetClick={(type) => console.log('Widget click:', type)}
                  onAddReference={() => console.log('Add reference clicked')}
                  onReferenceClick={(item) => console.log('Reference clicked:', item.name)}
                  onRemoveReference={(item) => console.log('Remove reference:', item.name)}
                />
              </div>
            </div>
          </section>

          {/* ContextReference Component */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              ContextReference
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              File/thread reference widget with tier colors (collapsed pill or expanded card)
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Collapsed Pill (Same width as expanded, horizontal info)
                </h3>
                <div className="flex gap-3">
                  <ContextReference
                    referenceType="file"
                    name="api-architecture.md"
                    sourceBranch="RAG Deep Dive"
                    relevanceScore={0.95}
                    priorityTier={1}
                    isExpanded={false}
                    onClick={() => console.log('Click explicit file')}
                  />
                  <ContextReference
                    referenceType="thread"
                    name="Database Design Discussion"
                    sourceBranch="Main"
                    relevanceScore={0.87}
                    priorityTier={2}
                    isExpanded={false}
                    onClick={() => console.log('Click semantic thread')}
                  />
                  <ContextReference
                    referenceType="file"
                    name="prompting-strategies.md"
                    relationship="sibling"
                    relevanceScore={0.82}
                    priorityTier={3}
                    isExpanded={false}
                    onClick={() => console.log('Click branch file')}
                  />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Expanded Card (Same width, vertical info)
                </h3>
                <div className="flex gap-3">
                  <ContextReference
                    referenceType="file"
                    name="api-architecture.md"
                    sourceBranch="RAG Deep Dive"
                    relevanceScore={0.95}
                    priorityTier={1}
                    timestamp={new Date(Date.now() - 2 * 60 * 60 * 1000)}
                    isExpanded={true}
                    onClick={() => console.log('Click explicit file')}
                    onRemove={() => console.log('Remove')}
                  />
                  <ContextReference
                    referenceType="thread"
                    name="Database Design Discussion"
                    sourceBranch="Main Thread"
                    relevanceScore={0.87}
                    priorityTier={2}
                    timestamp={new Date(Date.now() - 1 * 60 * 60 * 1000)}
                    isExpanded={true}
                    onClick={() => console.log('Click semantic thread')}
                    onAddToExplicit={() => console.log('Add to explicit')}
                  />
                  <ContextReference
                    referenceType="file"
                    name="prompting-strategies.md"
                    relationship="sibling"
                    relevanceScore={0.82}
                    priorityTier={3}
                    timestamp={new Date(Date.now() - 3 * 60 * 60 * 1000)}
                    isExpanded={true}
                    onClick={() => console.log('Click branch file')}
                    onDismiss={() => console.log('Dismiss')}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* BranchSelector Component */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              BranchSelector
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Hierarchical branch tree dropdown navigation
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <BranchSelector
                currentBranch={mockBranches[0]}
                branches={mockBranches}
                onSelectBranch={(id) => console.log('Select branch:', id)}
              />
            </div>
          </section>

          {/* BranchActions Component */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              BranchActions
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Header action buttons for branch creation and consolidation
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <BranchActions
                onCreateBranch={() => setShowBranchModal(true)}
                onConsolidate={() => setShowConsolidateModal(true)}
                canConsolidate={true}
              />
            </div>
          </section>

          {/* ToolCallApproval Component */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              ToolCallApproval
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Inline approval prompt for agent filesystem/thread operations
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <ToolCallApproval
                toolName="create_file"
                toolInput={{
                  path: '/workspace/new-feature.md',
                  content: '# New Feature\n\nThis is a new feature document...',
                }}
                previewContent="# New Feature\n\nThis is a new feature document that will be created in the workspace."
                onApprove={() => console.log('Approved')}
                onReject={(reason) => console.log('Rejected:', reason)}
              />
            </div>
          </section>

          {/* ProvenanceHeader Component */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              ProvenanceHeader
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              File provenance metadata display (AI-generated with full provenance or Manual with badge)
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  AI-Generated File (Full Provenance)
                </h3>
                <ProvenanceHeader
                  fileName="api-spec.md"
                  provenance={mockProvenance}
                  onGoToSource={(threadId) => console.log('Go to source:', threadId)}
                />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Manual File (Badge Only)
                </h3>
                <ProvenanceHeader fileName="notes.md" provenance={null} />
              </div>
            </div>
          </section>

          {/* FileEditorPanel Component */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              FileEditorPanel
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              File editor with provenance header (right panel)
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="h-96 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <FileEditorPanel
                  file={mockFile}
                  provenance={mockProvenance}
                  onClose={() => console.log('Close')}
                  onSave={(content) => console.log('Save:', content)}
                  onGoToSource={(threadId) => console.log('Go to source:', threadId)}
                />
              </div>
            </div>
          </section>

          {/* AgentStreamEvent Component */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              AgentStreamEvent
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Real-time agent streaming events (text chunks, tool calls, status updates)
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-2">
              {mockStreamEvents.map((event, i) => (
                <AgentStreamEvent key={i} event={event} />
              ))}
            </div>
          </section>

          {/* Modals */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Modals
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Branch creation and consolidation workflow modals
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex gap-4">
                <button
                  onClick={() => setShowBranchModal(true)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Show Create Branch Modal
                </button>
                <button
                  onClick={() => setShowConsolidateModal(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Show Consolidate Modal
                </button>
              </div>
            </div>
          </section>

          {/* WorkspaceSidebar Preview */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              WorkspaceSidebar
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Left sidebar with Files/Threads tabs
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="h-96 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <WorkspaceSidebar
                  files={[
                    {
                      id: '1',
                      name: 'api-spec.md',
                      path: '/workspace/api-spec.md',
                      size: 2456,
                      lastModified: new Date(),
                      type: 'file',
                    },
                    {
                      id: '2',
                      name: 'architecture.md',
                      path: '/workspace/architecture.md',
                      size: 5120,
                      lastModified: new Date(),
                      type: 'file',
                    },
                  ]}
                  threads={mockBranches}
                  activeTab={sidebarActiveTab}
                  onTabChange={(tab) => setSidebarActiveTab(tab)}
                  onFileClick={(fileId) => console.log('File click:', fileId)}
                  onThreadClick={(threadId) => console.log('Thread click:', threadId)}
                  onCreateFile={() => console.log('Create file')}
                  onCreateFolder={() => console.log('Create folder')}
                  onCreateThread={() => console.log('Create thread')}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Modals (rendered at root) */}
        {showBranchModal && (
          <CreateBranchModal
            isOpen={showBranchModal}
            onClose={() => setShowBranchModal(false)}
            onSubmit={(title) => {
              console.log('Create branch:', title);
              setShowBranchModal(false);
            }}
          />
        )}
        {showConsolidateModal && (
          <ConsolidateModal
            isOpen={showConsolidateModal}
            onClose={() => setShowConsolidateModal(false)}
            currentBranch={mockBranches[0]}
            childBranches={mockBranches.slice(1)}
            onConfirmConsolidate={(branchIds, targetFolder, fileName) => {
              console.log('Consolidate branches:', branchIds, 'Folder:', targetFolder, 'File:', fileName);
            }}
            onApproveConsolidation={(targetFolder, fileName) => {
              console.log('Approved consolidation:', targetFolder + '/' + fileName);
              setShowConsolidateModal(false);
            }}
            onRejectConsolidation={() => {
              console.log('Rejected consolidation');
            }}
          />
        )}

        {/* Component Pattern Note */}
        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Component Pattern
          </h3>
          <p className="text-blue-800 dark:text-blue-200 mb-2">
            All components follow the data-in/callbacks-out pattern:
          </p>
          <pre className="text-xs bg-blue-100 dark:bg-blue-800 p-3 rounded overflow-auto">
            {`interface ComponentProps {
  // Data (read-only, from container)
  data: DataType;

  // UI state (ephemeral)
  isLoading?: boolean;

  // Callbacks (actions bubble up)
  onAction: (id: string) => void;
}`}
          </pre>
        </div>
      </div>
    </DesignSystemFrame>
  );
}
