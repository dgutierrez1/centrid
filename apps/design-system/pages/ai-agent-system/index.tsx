import React from 'react';
import Link from 'next/link';
import { DesignSystemFrame } from '../../components/DesignSystemFrame';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@centrid/ui/components';
import { screens } from './screens';

export default function AIAgentSystemIndex() {
  return (
    <DesignSystemFrame title="AI Agent Execution System" backHref="/">
      <div className="space-y-8">
        {/* Feature Overview */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Feature Overview
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-3xl">
            Comprehensive AI agent system that enables natural language interaction with a
            filesystem-based knowledge management system. Includes chat interface, context
            management, collaborative editing with approval flows, and real-time progress tracking.
          </p>
        </div>

        {/* Screens Grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Screens Designed
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {screens.map((screen) => (
              <Link key={screen.id} href={screen.route}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle className="text-lg">{screen.title}</CardTitle>
                    <CardDescription>{screen.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-primary-600 dark:text-primary-400 font-medium">
                      View design →
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Component Architecture */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Component Architecture
          </h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Common Components (packages/ui/src/components/)</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <li>
                    <code>ChatMessage</code> - Consolidated message (text + tool calls + citations)
                  </li>
                  <li>
                    <code>TypingIndicator</code> - Animated typing indicator
                  </li>
                  <li>
                    <code>FileAutocomplete</code> - @-mention file selector
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feature Components (packages/ui/src/features/ai-agent-system/)</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <li>
                    <code>ChatView</code> - Main chat interface with messages and input
                  </li>
                  <li>
                    <code>ChatListPanel</code> - Chat list when no chat is selected
                  </li>
                  <li>
                    <code>ChatCard</code> - Individual chat preview card
                  </li>
                  <li>
                    <code>ContextReferenceBar</code> - Horizontal scrollable reference bar
                  </li>
                  <li>
                    <code>ContextReference</code> - Individual context pill
                  </li>
                  <li>
                    <code>ApprovalCard</code> - Inline approval prompt
                  </li>
                  <li>
                    <code>ConflictModal</code> - File conflict resolution
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DesignSystemFrame>
  );
}
