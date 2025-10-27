import React from 'react';
import Link from 'next/link';
import { DesignSystemFrame } from '../../components/DesignSystemFrame';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@centrid/ui/components';
import { screens } from './screens';

export default function AIAgentSystemIndex() {
  return (
    <DesignSystemFrame
      featureName="AI Agent Execution System"
      featureId="ai-agent-system"
    >
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

        {/* Quick Links */}
        <div className="flex gap-3">
          <Link href="/ai-agent-system/components">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Component Library
                </CardTitle>
                <CardDescription>
                  View all components with states (ApprovalCard, ConflictModal, ContextReferenceBar, ChatMessage, etc.)
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/ai-agent-system/chat-states">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  State Variations
                </CardTitle>
                <CardDescription>
                  Comprehensive state showcase: streaming, chat lists, file autocomplete
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
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
