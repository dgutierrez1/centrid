import React, { useState } from 'react';
import { DesignSystemFrame } from '../../components/DesignSystemFrame';
import { ThreadInput } from '@centrid/ui/features';

export default function InputStatesPage() {
  const [defaultInput, setDefaultInput] = useState('');
  const [typedInput, setTypedInput] = useState('Can you help me with this task?');
  const [longInput, setLongInput] = useState(
    'This is a longer message that demonstrates how the input handles multi-line text. It should auto-resize up to a maximum height and then become scrollable.'
  );

  return (
    <DesignSystemFrame title="Thread Input States">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Thread Input - All States
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Comprehensive showcase of all ThreadInput component states and interactions.
          </p>
        </div>

        <div className="space-y-8">
          {/* Empty State */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              1. Empty / Default State
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Initial state with placeholder text. Send button is disabled (grayed out).
            </p>
            <ThreadInput
              messageText=""
              onChange={() => {}}
              onSendMessage={() => {}}
              placeholder="Ask a question..."
            />
          </section>

          {/* Typed State */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              2. Typed / Ready to Send
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              User has typed a message. Send button is enabled (coral background).
            </p>
            <ThreadInput
              messageText={typedInput}
              onChange={setTypedInput}
              onSendMessage={(text) => {
                console.log('Sending:', text);
                setTypedInput('');
              }}
              placeholder="Ask a question..."
            />
          </section>

          {/* Focused State */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              3. Focused State
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Input is focused (click inside to see coral ring). Shows character count.
            </p>
            <ThreadInput
              messageText={defaultInput}
              onChange={setDefaultInput}
              onSendMessage={() => {}}
              placeholder="Click here to focus..."
            />
          </section>

          {/* Multi-line State */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              4. Multi-line / Long Text
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Textarea auto-resizes with content, up to max height (200px), then scrollable.
            </p>
            <ThreadInput
              messageText={longInput}
              onChange={setLongInput}
              onSendMessage={() => {}}
              placeholder="Type a long message..."
            />
          </section>

          {/* Loading State */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              5. Loading / Sending State
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Message is being sent. Input is disabled, send button shows spinner, status shows "Sending...".
            </p>
            <ThreadInput
              messageText=""
              onChange={() => {}}
              onSendMessage={() => {}}
              isLoading={true}
              placeholder="Ask a question..."
            />
          </section>

          {/* Streaming State (Agent Thinking) */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              6. Streaming / Agent Responding
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Agent is streaming a response. Input is disabled, stop button (red) replaces send button, status shows "Agent thinking...".
            </p>
            <ThreadInput
              messageText=""
              onChange={() => {}}
              onSendMessage={() => {}}
              onStopStreaming={() => console.log('Stopping...')}
              isStreaming={true}
              placeholder="Ask a question..."
            />
          </section>

          {/* Disabled State */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              7. Disabled State
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Input is disabled (grayed out, not interactive). Used during loading or streaming.
            </p>
            <div className="opacity-60 pointer-events-none">
              <ThreadInput
                messageText="This input is disabled"
                onChange={() => {}}
                onSendMessage={() => {}}
                isLoading={true}
                placeholder="Disabled..."
              />
            </div>
          </section>

          {/* Character Limit */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              8. Character Limit Warning
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Shows character count approaching limit (10000 chars by default).
            </p>
            <ThreadInput
              messageText={'A'.repeat(9950)}
              onChange={() => {}}
              onSendMessage={() => {}}
              characterLimit={10000}
              placeholder="Ask a question..."
            />
          </section>
        </div>

        {/* State Transition Guide */}
        <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
            State Transitions
          </h3>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <p><strong>Empty → Typed:</strong> User types text → Send button becomes enabled (coral)</p>
            <p><strong>Typed → Loading:</strong> User clicks Send → Input disabled, spinner shows, "Sending..." status</p>
            <p><strong>Loading → Streaming:</strong> Message sent → Stop button (red) appears, "Agent thinking..." status</p>
            <p><strong>Streaming → Empty:</strong> Agent completes → Input re-enabled, cleared, back to empty state</p>
            <p><strong>Streaming → Empty (Manual):</strong> User clicks Stop → Streaming stops, input re-enabled</p>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="mt-8 p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-4">
            Keyboard Shortcuts
          </h3>
          <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-2">
            <li><kbd className="px-2 py-1 bg-purple-100 dark:bg-purple-800 rounded font-mono text-xs">Enter</kbd> - Send message (if not empty)</li>
            <li><kbd className="px-2 py-1 bg-purple-100 dark:bg-purple-800 rounded font-mono text-xs">Shift + Enter</kbd> - New line (multi-line input)</li>
            <li><kbd className="px-2 py-1 bg-purple-100 dark:bg-purple-800 rounded font-mono text-xs">Esc</kbd> - Blur input (future: cancel @-mention)</li>
          </ul>
        </div>

        {/* Visual States Summary */}
        <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Visual Indicators
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Send Button</h4>
              <ul className="text-gray-700 dark:text-gray-300 space-y-1">
                <li>✓ <strong>Disabled:</strong> Gray background, no text</li>
                <li>✓ <strong>Enabled:</strong> Coral (primary-600) background</li>
                <li>✓ <strong>Loading:</strong> Spinner animation</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Stop Button</h4>
              <ul className="text-gray-700 dark:text-gray-300 space-y-1">
                <li>✓ <strong>Streaming:</strong> Red (destructive) background</li>
                <li>✓ <strong>Icon:</strong> Square (stop symbol)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Input Field</h4>
              <ul className="text-gray-700 dark:text-gray-300 space-y-1">
                <li>✓ <strong>Default:</strong> Gray border</li>
                <li>✓ <strong>Focused:</strong> Coral ring (ring-2 ring-primary-500)</li>
                <li>✓ <strong>Disabled:</strong> Grayed out, not interactive</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Status Text</h4>
              <ul className="text-gray-700 dark:text-gray-300 space-y-1">
                <li>✓ <strong>Sending:</strong> "Sending..." (left side)</li>
                <li>✓ <strong>Streaming:</strong> "Agent thinking..." (left side)</li>
                <li>✓ <strong>Character count:</strong> "N/10000" (right side)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DesignSystemFrame>
  );
}
