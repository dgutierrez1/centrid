import React, { useState } from 'react';
import { DesignSystemFrame } from '../../components/DesignSystemFrame';
import { Message, ThreadInput, ToolCallApproval } from '@centrid/ui/features';

export default function ComponentsPage() {
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  return (
    <DesignSystemFrame title="AI Agent System - Components">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Individual Components
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Showcase of individual components used in the AI Agent System.
          </p>
        </div>

        <div className="space-y-12">
          {/* Message Component */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Message Component
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  User Message
                </h3>
                <Message
                  role="user"
                  content="Can you help me implement OAuth authentication with Google?"
                  timestamp={new Date('2025-10-26T10:30:00Z')}
                />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Agent Message
                </h3>
                <Message
                  role="assistant"
                  content="I'll help you implement OAuth authentication with Google using Supabase Auth. First, let me create a configuration file for the OAuth providers."
                  timestamp={new Date('2025-10-26T10:30:15Z')}
                />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Streaming Message
                </h3>
                <Message
                  role="assistant"
                  content=""
                  timestamp={new Date()}
                  isStreaming={true}
                  streamingBuffer="Let me think about that..."
                />
              </div>
            </div>
          </section>

          {/* ThreadInput Component */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Thread Input
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <ThreadInput
                messageText={inputValue}
                onChange={setInputValue}
                onSendMessage={(text) => {
                  console.log('Submit:', text);
                  setInputValue('');
                }}
                onStopStreaming={() => {
                  console.log('Stop streaming');
                  setIsStreaming(false);
                }}
                isStreaming={isStreaming}
                placeholder="Ask a question..."
              />
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                <p className="mb-2">Features:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>@-mention autocomplete for files and conversations</li>
                  <li>Send/Stop toggle button (coral when streaming)</li>
                  <li>Auto-resize textarea</li>
                  <li>Keyboard shortcuts: Enter to send, Shift+Enter for new line</li>
                </ul>
              </div>
            </div>
          </section>

          {/* ToolCallApproval Component */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Tool Call Approval
            </h2>
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
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                <p className="mb-2">Features:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>File preview with syntax highlighting</li>
                  <li>Branch details (if creating branch)</li>
                  <li>Approve (green) / Reject (red) buttons</li>
                  <li>Inline during agent streaming</li>
                </ul>
              </div>
            </div>
          </section>

          {/* States Demonstration */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Component States
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Input - Default
                  </h3>
                  <ThreadInput
                    messageText=""
                    onChange={() => {}}
                    onSendMessage={() => {}}
                    isStreaming={false}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Input - Streaming
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
                    Input - Loading
                  </h3>
                  <ThreadInput
                    messageText=""
                    onChange={() => {}}
                    onSendMessage={() => {}}
                    isLoading={true}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

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
