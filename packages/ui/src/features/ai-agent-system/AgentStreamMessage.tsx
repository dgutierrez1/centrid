import React, { useState } from 'react';
import { AgentStreamEvent, type AgentEvent } from './AgentStreamEvent';

export interface AgentStreamMessageProps {
  events: AgentEvent[];
  timestamp: Date;
  isStreaming?: boolean;
  autoCollapseOldTools?: boolean;
  className?: string;
}

export function AgentStreamMessage({
  events,
  timestamp,
  isStreaming = false,
  autoCollapseOldTools = true,
  className = '',
}: AgentStreamMessageProps) {
  const [collapsedEvents, setCollapsedEvents] = useState<Set<string>>(new Set());

  const toggleCollapse = (eventId: string) => {
    setCollapsedEvents(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  // Determine which events should be collapsed
  const getCollapsedState = (event: AgentEvent, index: number): boolean => {
    // If manually toggled, respect that
    if (collapsedEvents.has(event.id)) {
      return true;
    }

    // Auto-collapse logic
    if (!autoCollapseOldTools || event.type !== 'tool_call') {
      return false;
    }

    const isLastEvent = index === events.length - 1;
    const isRunning = event.status === 'running';

    // Don't collapse the last event or running events
    if (isLastEvent || isRunning) {
      return false;
    }

    // Check if there are multiple tool calls
    const toolCallEvents = events.filter(e => e.type === 'tool_call');
    if (toolCallEvents.length <= 1) {
      return false;
    }

    // Collapse old completed/error tool calls
    return true;
  };

  return (
    <div
      className={`flex gap-3 items-start animate-fade-in ${className}`}
      data-testid="agent-stream-message"
    >
      {/* Avatar */}
      <div
        className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
        aria-label="AI Agent avatar"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
          <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
        </svg>
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            AI Agent
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {timestamp?.toLocaleTimeString?.([], { hour: '2-digit', minute: '2-digit' }) || '--:--'}
          </span>
          {isStreaming && (
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"></span>
              Streaming
            </span>
          )}
        </div>

        {/* Message Box with Events */}
        <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 shadow-sm rounded-lg px-3 py-2">
          <div className="space-y-3">
            {events.map((event, index) => {
              const isLatest = index === events.length - 1;
              const isCollapsed = getCollapsedState(event, index);

              return (
                <AgentStreamEvent
                  key={event.id}
                  event={event}
                  isLatest={isLatest}
                  isCollapsed={isCollapsed}
                  onToggleCollapse={() => toggleCollapse(event.id)}
                />
              );
            })}

            {isStreaming && (
              <span className="inline-block animate-pulse ml-1 text-gray-900 dark:text-gray-100">▊</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
