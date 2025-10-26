import React from 'react';
import { DesignSystemFrame } from '../../components/DesignSystemFrame';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@centrid/ui/components';
import {
  ApprovalCard,
  ConflictModal,
  ContextReferenceBar,
  type FileChangePreview,
  type ConflictingFile,
  type ContextReferenceData,
} from '@centrid/ui/features/ai-agent-system';
import { ChatMessage, type ContentBlock } from '@centrid/ui/components';

export default function ComponentsShowcase() {
  const [conflictModalOpen, setConflictModalOpen] = React.useState(true);
  const [isApproving, setIsApproving] = React.useState(false);

  // Mock data for ApprovalCard
  const singleFileChange: FileChangePreview[] = [
    {
      id: '1',
      filePath: '/src/services/auth.ts',
      action: 'update',
      metadata: { lineCount: 45 },
    },
  ];

  const multipleFileChanges: FileChangePreview[] = [
    {
      id: '1',
      filePath: '/src/services/auth.ts',
      action: 'update',
      metadata: { lineCount: 45 },
    },
    {
      id: '2',
      filePath: '/src/components/LoginForm.tsx',
      action: 'update',
      metadata: { lineCount: 23 },
    },
    {
      id: '3',
      filePath: '/src/types/user.ts',
      action: 'create',
      metadata: { fileSize: '2.3 KB' },
    },
  ];

  const deleteChange: FileChangePreview[] = [
    {
      id: '1',
      filePath: '/src/legacy/old-auth.ts',
      action: 'delete',
      metadata: { fileSize: '5.1 KB' },
    },
  ];

  // Mock data for ConflictModal
  const conflictingFiles: ConflictingFile[] = [
    {
      path: '/src/services/auth.ts',
      lastSaved: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
      pendingChanges: 5,
    },
    {
      path: '/src/components/LoginForm.tsx',
      lastSaved: new Date(Date.now() - 30 * 1000), // 30 seconds ago
      pendingChanges: 2,
    },
  ];

  // Mock data for ContextReferenceBar
  const contextReferences: ContextReferenceData[] = [
    { id: '1', type: 'file', label: 'auth.ts', path: '/src/services/auth.ts' },
    { id: '2', type: 'folder', label: 'components/', path: '/src/components' },
    {
      id: '3',
      type: 'snippet',
      label: 'auth.ts (45-67)',
      path: '/src/services/auth.ts',
      lineRange: { start: 45, end: 67 },
    },
    { id: '4', type: 'web', label: 'docs.anthropic.com', url: 'https://docs.anthropic.com' },
    { id: '5', type: 'pasted', label: 'Pasted snippet' },
    { id: '6', type: 'file', label: 'user.ts', path: '/src/types/user.ts' },
  ];

  const fewReferences = contextReferences.slice(0, 3);

  // Mock data for ChatMessage with tool calls
  const toolCallsMessage: ContentBlock[] = [
    {
      id: 'text1',
      type: 'text',
      content: "I'll help you refactor the authentication function. Let me read the current implementation first.",
    },
    {
      id: 'tools1',
      type: 'tool_calls',
      toolCalls: [
        {
          id: 't1',
          toolName: 'read_document',
          status: 'completed',
          description: 'Reading authentication module',
          targetFile: '/src/services/auth.ts',
        },
        {
          id: 't2',
          toolName: 'search_documents',
          status: 'running',
          description: 'Searching for similar async patterns',
        },
      ],
    },
    {
      id: 'text2',
      type: 'text',
      content: 'Based on the current implementation, here are the recommended changes...',
    },
  ];

  // Mock data for ChatMessage with citations
  const citationsMessage: ContentBlock[] = [
    {
      id: 'text1',
      type: 'text',
      content: 'Based on the latest TypeScript documentation and best practices, async/await is the recommended approach for handling promises.',
    },
    {
      id: 'citations1',
      type: 'citations',
      citations: [
        {
          id: 'c1',
          url: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-5.html',
          title: 'TypeScript: Documentation - Async/Await',
          snippet: 'Async functions enable a cleaner syntax for working with promises...',
        },
        {
          id: 'c2',
          url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function',
          title: 'MDN: async function',
          snippet: 'The async function declaration defines an async function...',
        },
      ],
    },
  ];

  const handleApprove = () => {
    setIsApproving(true);
    setTimeout(() => setIsApproving(false), 2000);
  };

  return (
    <DesignSystemFrame title="AI Agent System - Components" backHref="/ai-agent-system">
      <div className="space-y-12">
        {/* Introduction */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Component Showcase
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-3xl">
            Individual component states and variations for the AI Agent System. Each component is shown
            with multiple states to demonstrate behavior and styling.
          </p>
        </div>

        {/* ApprovalCard States */}
        <section className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">ApprovalCard</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Inline banner showing file changes requiring approval
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Single File - Active</CardTitle>
                <CardDescription>One file update, ready for approval</CardDescription>
              </CardHeader>
              <CardContent>
                <ApprovalCard
                  changes={singleFileChange}
                  isOngoing={true}
                  onApprove={handleApprove}
                  onReject={() => {}}
                  isApproving={isApproving}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Multiple Files - Active</CardTitle>
                <CardDescription>Three files with mixed actions (+2 more indicator)</CardDescription>
              </CardHeader>
              <CardContent>
                <ApprovalCard
                  changes={multipleFileChanges}
                  isOngoing={true}
                  onApprove={() => {}}
                  onReject={() => {}}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delete Action</CardTitle>
                <CardDescription>File deletion requiring approval</CardDescription>
              </CardHeader>
              <CardContent>
                <ApprovalCard
                  changes={deleteChange}
                  isOngoing={true}
                  onApprove={() => {}}
                  onReject={() => {}}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inactive State</CardTitle>
                <CardDescription>Request no longer ongoing</CardDescription>
              </CardHeader>
              <CardContent>
                <ApprovalCard
                  changes={singleFileChange}
                  isOngoing={false}
                  onApprove={() => {}}
                  onReject={() => {}}
                />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ConflictModal */}
        <section className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">ConflictModal</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Modal shown when user edits file being modified by agent
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>File Conflict Detected</CardTitle>
              <CardDescription>
                Click button below to open modal (blocking interaction, requires decision)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <button
                onClick={() => setConflictModalOpen(true)}
                className="px-4 py-2 bg-warning-500 text-white rounded-md hover:bg-warning-600 transition-colors"
              >
                Open Conflict Modal
              </button>

              <ConflictModal
                isOpen={conflictModalOpen}
                conflictingFiles={conflictingFiles}
                onCancelRequest={() => {
                  setConflictModalOpen(false);
                  alert('Agent request cancelled - keeping your changes');
                }}
                onDiscardChanges={() => {
                  setConflictModalOpen(false);
                  alert('Your changes discarded - applying agent changes');
                }}
              />
            </CardContent>
          </Card>
        </section>

        {/* ContextReferenceBar */}
        <section className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              ContextReferenceBar
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Horizontal scrollable bar showing active context pills with different types
            </p>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Few References (3)</CardTitle>
                <CardDescription>
                  File, folder, and snippet references with Add button
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ContextReferenceBar
                  references={fewReferences}
                  onRemove={(id) => console.log('Remove:', id)}
                  onAddReference={() => console.log('Add reference')}
                  onReferenceClick={(ref) => console.log('Clicked:', ref)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Many References (6+)</CardTitle>
                <CardDescription>
                  Shows all reference types: file, folder, snippet, web, pasted
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ContextReferenceBar
                  references={contextReferences}
                  collapseThreshold={4}
                  onRemove={(id) => console.log('Remove:', id)}
                  onAddReference={() => console.log('Add reference')}
                  onReferenceClick={(ref) => console.log('Clicked:', ref)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Max Limit Warning (10)</CardTitle>
                <CardDescription>
                  When 10 references reached, shows max limit badge
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ContextReferenceBar
                  references={[
                    ...contextReferences,
                    { id: '7', type: 'file', label: 'config.ts', path: '/config.ts' },
                    { id: '8', type: 'file', label: 'types.ts', path: '/types.ts' },
                    { id: '9', type: 'file', label: 'utils.ts', path: '/utils.ts' },
                    { id: '10', type: 'file', label: 'index.ts', path: '/index.ts' },
                  ]}
                  onRemove={(id) => console.log('Remove:', id)}
                  onAddReference={() => console.log('Add reference')}
                />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ChatMessage with Tool Calls */}
        <section className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              ChatMessage - Tool Calls
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Agent message with interleaved text and tool execution
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Agent Message with Tool Progress</CardTitle>
              <CardDescription>
                Shows collapsible tool calls (completed + running states)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 bg-white dark:bg-gray-900">
              <ChatMessage
                role="agent"
                timestamp={new Date()}
                contentBlocks={toolCallsMessage}
                onCopy={() => console.log('Copy message')}
                onFileClick={(path) => console.log('Open file:', path)}
              />
            </CardContent>
          </Card>
        </section>

        {/* ChatMessage with Citations */}
        <section className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              ChatMessage - Citations
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Agent message with web sources and citations
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Agent Message with Web Citations</CardTitle>
              <CardDescription>
                Shows clickable citation cards with source snippets
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 bg-white dark:bg-gray-900">
              <ChatMessage
                role="agent"
                timestamp={new Date()}
                contentBlocks={citationsMessage}
                onCopy={() => console.log('Copy message')}
                onCitationClick={(url) => console.log('Open citation:', url)}
              />
            </CardContent>
          </Card>
        </section>

        {/* User Message */}
        <section className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              ChatMessage - User
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              User message with right-aligned styling
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>User Message</CardTitle>
              <CardDescription>
                Right-aligned with coral tint background
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 bg-white dark:bg-gray-900">
              <ChatMessage
                role="user"
                timestamp={new Date()}
                contentBlocks={[
                  {
                    id: 't1',
                    type: 'text',
                    content: 'Can you help me refactor this authentication function to use async/await?',
                  },
                ]}
              />
            </CardContent>
          </Card>
        </section>
      </div>
    </DesignSystemFrame>
  );
}
