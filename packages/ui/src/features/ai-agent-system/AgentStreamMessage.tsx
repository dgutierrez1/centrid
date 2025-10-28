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
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());

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

  // Group consecutive collapsed tool calls
  const groupedEvents: Array<{ type: 'single'; event: AgentEvent; index: number } | { type: 'group'; events: AgentEvent[]; indices: number[] }> = [];
  let currentGroup: AgentEvent[] = [];
  let currentGroupIndices: number[] = [];

  events.forEach((event, index) => {
    const isCollapsed = getCollapsedState(event, index);

    if (event.type === 'tool_call' && isCollapsed) {
      // Add to current group
      currentGroup.push(event);
      currentGroupIndices.push(index);
    } else {
      // Flush current group if it exists
      if (currentGroup.length > 0) {
        if (currentGroup.length === 1) {
          // Single collapsed tool - render normally
          groupedEvents.push({ type: 'single', event: currentGroup[0], index: currentGroupIndices[0] });
        } else {
          // Multiple collapsed tools - render as group
          groupedEvents.push({ type: 'group', events: currentGroup, indices: currentGroupIndices });
        }
        currentGroup = [];
        currentGroupIndices = [];
      }
      // Add non-collapsed event
      groupedEvents.push({ type: 'single', event, index });
    }
  });

  // Flush any remaining group
  if (currentGroup.length > 0) {
    if (currentGroup.length === 1) {
      groupedEvents.push({ type: 'single', event: currentGroup[0], index: currentGroupIndices[0] });
    } else {
      groupedEvents.push({ type: 'group', events: currentGroup, indices: currentGroupIndices });
    }
  }

  return (
    <div
      className={`flex gap-3 animate-fade-in ${className}`}
      data-testid="agent-stream-message"
    >
      {/* Avatar - two states: streaming (bouncing dots) or done (minimal dot) */}
      <div
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
          isStreaming
            ? 'bg-primary-100 dark:bg-primary-900/50 ring-2 ring-primary-500/50'
            : 'bg-gray-100 dark:bg-gray-800'
        }`}
        aria-label="AI Agent avatar"
      >
        {isStreaming ? (
          <div className="flex gap-[3px]">
            <span className="w-1 h-1 bg-primary-600 dark:bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }}></span>
            <span className="w-1 h-1 bg-primary-600 dark:bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '1s' }}></span>
            <span className="w-1 h-1 bg-primary-600 dark:bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1s' }}></span>
          </div>
        ) : (
          <svg className="w-3.5 h-3.5 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
        )}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        {/* Message Box with Events - shimmer border when request is streaming */}
        <div className={`rounded-lg relative ${
          isStreaming
            ? 'bg-gradient-to-r from-primary-600/30 via-primary-300 to-primary-600/30 dark:from-primary-400/30 dark:via-primary-200 dark:to-primary-400/30 animate-shimmer bg-[length:200%_100%] p-[3px]'
            : 'bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 shadow-sm px-3 py-2'
        }`}>
          {isStreaming && (
            <div className="absolute inset-[3px] bg-white dark:bg-gray-800/50 rounded-lg" />
          )}
          <div className={`space-y-3 ${isStreaming ? 'relative z-10 px-3 py-2' : ''}`}>
            {groupedEvents.map((item, idx) => {
              if (item.type === 'single') {
                const isLatest = item.index === events.length - 1;
                const isCollapsed = getCollapsedState(item.event, item.index);

                return (
                  <div key={item.event.id} className={item.event.type === 'text' ? 'inline' : ''}>
                    <AgentStreamEvent
                      event={item.event}
                      isLatest={isLatest}
                      isCollapsed={isCollapsed}
                      onToggleCollapse={() => toggleCollapse(item.event.id)}
                    />
                  </div>
                );
              } else {
                // Group of collapsed tools
                const isGroupExpanded = expandedGroups.has(idx);
                const completedCount = item.events.filter(e => e.type === 'tool_call' && e.status === 'completed').length;
                const errorCount = item.events.filter(e => e.type === 'tool_call' && e.status === 'error').length;

                const toggleGroup = () => {
                  setExpandedGroups(prev => {
                    const next = new Set(prev);
                    if (next.has(idx)) {
                      next.delete(idx);
                    } else {
                      next.add(idx);
                    }
                    return next;
                  });
                };

                return (
                  <div key={`group-${idx}`}>
                    <button
                      onClick={toggleGroup}
                      className="w-full flex items-center gap-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded px-1 py-0.5 transition-colors"
                    >
                      <span className="flex-1 text-left text-gray-600 dark:text-gray-400">
                        {item.events.length} tools
                      </span>
                      <svg
                        className={`w-3 h-3 text-gray-400 shrink-0 transition-transform ${isGroupExpanded ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    {isGroupExpanded && (
                      <div className="mt-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-1">
                        {item.events.map((event, eventIdx) => (
                          <div key={event.id}>
                            <AgentStreamEvent
                              event={event}
                              isLatest={false}
                              isCollapsed={true}
                              onToggleCollapse={() => toggleCollapse(event.id)}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
            })}

            {/* Streaming cursor - shown after all events when streaming */}
            {isStreaming && (
              <span className="inline-block ml-1.5 w-[3px] h-5 bg-gradient-to-b from-primary-400 via-primary-700 to-primary-400 animate-pulse relative top-[3px] rounded-full"></span>
            )}

            {/* Timestamp - relocated to bottom right of message box */}
            {timestamp && (
              <div className="flex justify-end mt-2 pt-1 border-t border-gray-100 dark:border-gray-700/50">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {timestamp?.toLocaleTimeString?.([], { hour: '2-digit', minute: '2-digit' }) || '--:--'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
