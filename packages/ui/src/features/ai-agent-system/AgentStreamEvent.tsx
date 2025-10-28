import React, { useState } from 'react';

export type AgentEventType = 'text' | 'tool_call';
export type ToolCallStatus = 'running' | 'completed' | 'error';

export interface TextEvent {
  type: 'text';
  content: string;
  id: string;
}

export interface ToolCallEvent {
  type: 'tool_call';
  id: string;
  name: string;
  description?: string;
  status: ToolCallStatus;
  input?: Record<string, any>;
  output?: string;
  error?: string;
  duration?: number; // in milliseconds
}

export type AgentEvent = TextEvent | ToolCallEvent;

export interface AgentStreamEventProps {
  event: AgentEvent;
  isLatest?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

// Helper to format tool names into human-readable format
const formatToolName = (name: string): string => {
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export function AgentStreamEvent({
  event,
  isLatest = false,
  isCollapsed = false,
  onToggleCollapse,
  className = '',
}: AgentStreamEventProps) {
  if (event.type === 'text') {
    return (
      <div className={`prose prose-sm max-w-none dark:prose-invert text-gray-900 dark:text-gray-100 ${className}`}>
        {event.content}
      </div>
    );
  }

  // Tool call event
  const toolCall = event as ToolCallEvent;
  const readableToolName = formatToolName(toolCall.name);
  const statusColors = {
    running: {
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'text-blue-600 dark:text-blue-400',
      text: 'text-blue-900 dark:text-blue-100',
    },
    completed: {
      bg: 'bg-green-50 dark:bg-green-950/30',
      border: 'border-green-200 dark:border-green-800',
      icon: 'text-green-600 dark:text-green-400',
      text: 'text-green-900 dark:text-green-100',
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-200 dark:border-red-800',
      icon: 'text-red-600 dark:text-red-400',
      text: 'text-red-900 dark:text-red-100',
    },
  };

  const colors = statusColors[toolCall.status];

  // Collapsed view (for old tool calls) - one line, no background
  if (isCollapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className={`w-full flex items-center gap-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded px-1 py-0.5 transition-colors ${className}`}
      >
        <div className="shrink-0 text-gray-400">
          {toolCall.status === 'completed' && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {toolCall.status === 'error' && (
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        <span className="flex-1 text-left text-gray-600 dark:text-gray-400">{readableToolName}</span>
        {toolCall.duration && (
          <span className="text-xs text-gray-400 shrink-0">
            {(toolCall.duration / 1000).toFixed(1)}s
          </span>
        )}
        <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    );
  }

  // Expanded view - text shimmer on running tools
  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      {/* Icon */}
      <div className="shrink-0 text-gray-500 dark:text-gray-400">
        {toolCall.status === 'running' && (
          <svg className="w-4 h-4 animate-spin text-primary-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {toolCall.status === 'completed' && (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {toolCall.status === 'error' && (
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>

      {/* Tool name and description with shimmer on running */}
      <div className="flex-1 min-w-0">
        <span className={`font-semibold ${
          toolCall.status === 'running'
            ? 'relative inline-block bg-gradient-to-r from-primary-600 via-primary-300 to-primary-600 dark:from-primary-400 dark:via-primary-200 dark:to-primary-400 bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]'
            : 'text-gray-900 dark:text-gray-100'
        }`}>
          {readableToolName}
        </span>
        {toolCall.description && (
          <span className={`ml-2 ${
            toolCall.status === 'running'
              ? 'relative inline-block bg-gradient-to-r from-primary-600 via-primary-300 to-primary-600 dark:from-primary-400 dark:via-primary-200 dark:to-primary-400 bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]'
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            — {toolCall.description}
          </span>
        )}
        {toolCall.error && (
          <span className="text-red-600 dark:text-red-400 ml-2">— Error: {toolCall.error}</span>
        )}
      </div>

      {/* Status badge */}
      {toolCall.status === 'running' && (
        <span className="text-xs text-primary-600 dark:text-primary-400 font-medium shrink-0">Running...</span>
      )}
      {toolCall.duration && toolCall.status === 'completed' && (
        <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
          {(toolCall.duration / 1000).toFixed(1)}s
        </span>
      )}
    </div>
  );
}
