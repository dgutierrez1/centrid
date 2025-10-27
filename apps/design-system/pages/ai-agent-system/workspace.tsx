import React, { useState } from 'react';
import { DesignSystemFrame } from '../../components/DesignSystemFrame';
import { AiAgentSystemMock } from '../../components/AiAgentSystemMock';

export default function WorkspacePage() {
  const [layout, setLayout] = useState<'3-panel' | '2-panel'>('3-panel');

  return (
    <DesignSystemFrame title="AI Agent System - Workspace">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Workspace (3-Panel Adaptive Layout)
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            Primary exploration interface with adaptive 3-panel layout prioritizing thread
            interface (center), with closeable file editor (right).
          </p>

          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setLayout('3-panel')}
              className={`px-4 py-2 rounded-md ${
                layout === '3-panel'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              3-Panel (File Open)
            </button>
            <button
              onClick={() => setLayout('2-panel')}
              className={`px-4 py-2 rounded-md ${
                layout === '2-panel'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              2-Panel (No File)
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden h-[800px]">
          <AiAgentSystemMock showFileEditor={layout === '3-panel'} />
        </div>

        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Layout Behavior
          </h3>
          <ul className="list-disc list-inside text-blue-800 dark:text-blue-200 space-y-2">
            <li>
              <strong>Left sidebar:</strong> 20% width, Files/Threads tabs (collapsible on mobile)
            </li>
            <li>
              <strong>Center panel:</strong> 50-80% width (adapts), thread interface ALWAYS visible
            </li>
            <li>
              <strong>Right panel:</strong> 0-30% width, file editor (only when file opened,
              closeable)
            </li>
            <li>Desktop: 3-panel (20% + 50% + 30%) when file open, 2-panel when closed</li>
            <li>Mobile: Drawer navigation, stacked views (sidebar, chat, editor)</li>
          </ul>
        </div>
      </div>
    </DesignSystemFrame>
  );
}
