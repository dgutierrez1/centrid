import React from 'react';
import { DesignSystemFrame } from '../../components/DesignSystemFrame';
import { ChatView, BranchSelector, ContextPanel } from '@centrid/ui/features';
import type { MessageData } from '@centrid/ui/features';
import {
  mockBranches,
  mockMessages,
  mockExplicitContext,
  mockFrequentlyUsed,
  mockSemanticMatches,
  mockBranchContext,
  mockArtifacts,
  mockExcludedContext,
} from '../../components/ai-agent-system/mockData';

export default function ChatInterfacePage() {
  const [draftMessage, setDraftMessage] = React.useState('');
  const [messages, setMessages] = React.useState<MessageData[]>(mockMessages);
  const [isAgentResponding, setIsAgentResponding] = React.useState(false);
  const [contextCollapsed, setContextCollapsed] = React.useState(false);

  const currentBranch = mockBranches.find((b) => b.isActive)!;

  const handleSendMessage = () => {
    if (!draftMessage.trim()) return;

    // Add user message
    const userMessage: MessageData = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: draftMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setDraftMessage('');

    // Simulate agent response
    setIsAgentResponding(true);
    setTimeout(() => {
      const agentMessage: MessageData = {
        id: `msg-${Date.now()}`,
        role: 'agent',
        contentBlocks: [
          {
            id: `block-${Date.now()}`,
            type: 'text',
            content:
              'This is a simulated agent response. In the real application, this would stream from the Claude API with real-time updates.',
          },
        ],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, agentMessage]);
      setIsAgentResponding(false);
    }, 2000);
  };

  return (
    <DesignSystemFrame
      title="Chat Interface (Full)"
      description="Complete chat interface with branch selector, message stream, context panel, and input"
      backHref="/ai-agent-system"
    >
      <div className="space-y-6">
        {/* Description */}
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-600 dark:text-gray-400">
            This screen shows the complete chat interface integrating all components: Branch Selector
            (hierarchical tree), Message Stream (SSE streaming), Context Panel (6 sections with
            priority indicators), and Chat Input (with @-mention autocomplete).
          </p>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-4">
            Key Features:
          </h3>
          <ul className="text-sm text-gray-600 dark:text-gray-400">
            <li>Branch selector in header with current branch + navigation</li>
            <li>Message stream with interleaved content (text + tool calls)</li>
            <li>Context panel positioned BELOW messages, ABOVE input (6 sections)</li>
            <li>Typing indicator for agent streaming</li>
            <li>Empty state when no messages</li>
          </ul>
        </div>

        {/* Chat Interface Preview */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {/* Header with Branch Selector */}
          <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <BranchSelector
                currentBranch={currentBranch}
                branches={mockBranches}
                onSelectBranch={(id) => console.log('Select branch:', id)}
                onCreateBranch={() => console.log('Create branch')}
              />
              <div className="text-sm text-gray-500">
                {mockArtifacts.length} artifacts • {messages.length} messages
              </div>
            </div>
          </div>

          {/* Chat View Container */}
          <div className="h-[600px] flex flex-col">
            {/* Messages Area */}
            <div className="flex-1 overflow-auto bg-white dark:bg-gray-900">
              <ChatView
                messages={messages}
                draftMessage={draftMessage}
                onDraftMessageChange={setDraftMessage}
                onSendMessage={handleSendMessage}
                isAgentResponding={isAgentResponding}
                contextReferences={[]}
              />
            </div>

            {/* Context Panel - BELOW messages, ABOVE input */}
            <ContextPanel
              explicitContext={mockExplicitContext}
              frequentlyUsed={mockFrequentlyUsed}
              semanticMatches={mockSemanticMatches}
              branchContext={mockBranchContext}
              artifacts={mockArtifacts}
              excludedContext={mockExcludedContext}
              collapsed={contextCollapsed}
              onCollapsedChange={setContextCollapsed}
              onItemClick={(item) => console.log('Item clicked:', item)}
              onItemRemove={(item) => console.log('Remove item:', item)}
              onItemAdd={(item) => console.log('Add item:', item)}
              onHideBranch={(item) => console.log('Hide branch:', item)}
            />
          </div>
        </div>

        {/* States Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">States</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Default</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Chat with messages, context panel collapsed, ready for input
              </p>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Streaming</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Agent responding with typing indicator, stop button enabled
              </p>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Context Expanded
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                All 6 context sections visible with priority tier indicators
              </p>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Empty</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No messages yet, shows empty state with helpful prompt
              </p>
            </div>
          </div>
        </div>
      </div>
    </DesignSystemFrame>
  );
}
