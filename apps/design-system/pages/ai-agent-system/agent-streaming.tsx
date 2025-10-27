import React, { useState, useEffect, useCallback } from 'react';
import { DesignSystemFrame } from '../../components/DesignSystemFrame';
import { Card } from '@centrid/ui/components';
import { AgentStreamMessage, type AgentEvent } from '@centrid/ui/features/ai-agent-system/AgentStreamMessage';
import { ThreadInput } from '@centrid/ui/features/ai-agent-system/ThreadInput';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content?: string;
  events?: AgentEvent[];
  timestamp: Date;
  isStreaming?: boolean;
}

// Possible text responses
const TEXT_RESPONSES = [
  "Let me help you with that.",
  "I'll search for relevant information.",
  "Great question! Let me analyze this.",
  "I can help you understand this better.",
  "Let me gather the necessary details.",
  "I'll look into that for you.",
];

const FOLLOWUP_TEXTS = [
  "Based on my analysis, here's what I found:",
  "After reviewing the data, I can see that:",
  "The results show:",
  "Here's what the information reveals:",
  "My findings indicate:",
];

const CONCLUSION_TEXTS = [
  "I hope this helps! Let me know if you need clarification.",
  "Does this answer your question?",
  "Would you like me to explore this further?",
  "Is there anything else you'd like to know?",
  "Let me know if you need more details.",
];

// Possible tool calls
const TOOL_TEMPLATES = [
  {
    name: 'search_code',
    description: 'Searching codebase',
    inputGen: () => ({ pattern: ['RAG', 'authentication', 'database', 'API'][Math.floor(Math.random() * 4)], path: './src' }),
    outputGen: () => `Found ${Math.floor(Math.random() * 20) + 5} matches`,
  },
  {
    name: 'read_file',
    description: 'Reading file',
    inputGen: () => ({ file_path: ['./src/auth.ts', './src/db.ts', './config.json', './README.md'][Math.floor(Math.random() * 4)] }),
    outputGen: () => `File contents retrieved (${Math.floor(Math.random() * 500) + 100} lines)`,
  },
  {
    name: 'analyze_code',
    description: 'Analyzing code patterns',
    inputGen: () => ({ focus: ['security', 'performance', 'structure', 'dependencies'][Math.floor(Math.random() * 4)] }),
    outputGen: () => `Analysis complete: ${Math.floor(Math.random() * 10) + 3} findings`,
  },
  {
    name: 'run_tests',
    description: 'Running test suite',
    inputGen: () => ({ pattern: '**/*.test.ts' }),
    outputGen: () => `Tests passed: ${Math.floor(Math.random() * 50) + 20}/${Math.floor(Math.random() * 50) + 25}`,
  },
  {
    name: 'search_docs',
    description: 'Searching documentation',
    inputGen: () => ({ query: ['best practices', 'API reference', 'tutorial', 'examples'][Math.floor(Math.random() * 4)] }),
    outputGen: () => `Found ${Math.floor(Math.random() * 15) + 5} relevant pages`,
  },
];

// Generate random streaming events
function generateRandomEvents(): AgentEvent[] {
  const events: AgentEvent[] = [];
  let eventId = 0;

  // Always start with text
  events.push({
    type: 'text',
    id: `event-${eventId++}`,
    content: TEXT_RESPONSES[Math.floor(Math.random() * TEXT_RESPONSES.length)],
  });

  // Random number of tool calls (1-4)
  const numTools = Math.floor(Math.random() * 4) + 1;

  for (let i = 0; i < numTools; i++) {
    const template = TOOL_TEMPLATES[Math.floor(Math.random() * TOOL_TEMPLATES.length)];
    const hasError = Math.random() < 0.1; // 10% chance of error

    events.push({
      type: 'tool_call',
      id: `event-${eventId++}`,
      name: template.name,
      description: template.description,
      status: hasError ? 'error' : 'completed',
      input: template.inputGen(),
      output: hasError ? undefined : template.outputGen(),
      error: hasError ? 'Operation failed: Resource not available' : undefined,
      duration: Math.floor(Math.random() * 3000) + 500,
    });

    // Sometimes add text between tools
    if (i < numTools - 1 && Math.random() < 0.5) {
      events.push({
        type: 'text',
        id: `event-${eventId++}`,
        content: FOLLOWUP_TEXTS[Math.floor(Math.random() * FOLLOWUP_TEXTS.length)],
      });
    }
  }

  // Always end with conclusion text
  events.push({
    type: 'text',
    id: `event-${eventId++}`,
    content: CONCLUSION_TEXTS[Math.floor(Math.random() * CONCLUSION_TEXTS.length)],
  });

  return events;
}

export default function AgentStreamingPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [currentStreamingEvents, setCurrentStreamingEvents] = useState<AgentEvent[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  // Simulate streaming by adding events one by one
  const simulateStreaming = useCallback((allEvents: AgentEvent[], messageId: string) => {
    let currentIndex = 0;
    setIsStreaming(true);

    const streamInterval = setInterval(() => {
      if (currentIndex >= allEvents.length) {
        clearInterval(streamInterval);
        setIsStreaming(false);

        // Update the final message to not be streaming
        setMessages(prev => prev.map(msg =>
          msg.id === messageId ? { ...msg, isStreaming: false } : msg
        ));
        return;
      }

      const event = allEvents[currentIndex];

      // If it's a tool call, show it as running first
      if (event.type === 'tool_call') {
        const runningEvent = { ...event, status: 'running' as const };

        setMessages(prev => prev.map(msg =>
          msg.id === messageId
            ? { ...msg, events: [...(msg.events || []), runningEvent] }
            : msg
        ));

        // After a delay, complete the tool
        setTimeout(() => {
          setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
              const updatedEvents = [...(msg.events || [])];
              updatedEvents[updatedEvents.length - 1] = event;
              return { ...msg, events: updatedEvents };
            }
            return msg;
          }));
        }, Math.floor(Math.random() * 1500) + 500);
      } else {
        // Text event - add immediately
        setMessages(prev => prev.map(msg =>
          msg.id === messageId
            ? { ...msg, events: [...(msg.events || []), event] }
            : msg
        ));
      }

      currentIndex++;
    }, Math.floor(Math.random() * 800) + 400); // Random delay between events

  }, []);

  // Auto-start streaming on mount
  useEffect(() => {
    const welcomeEvents = generateRandomEvents();
    const messageId = `msg-${Date.now()}`;

    setMessages([{
      id: messageId,
      role: 'assistant',
      events: [],
      timestamp: new Date(),
      isStreaming: true,
    }]);

    setTimeout(() => {
      simulateStreaming(welcomeEvents, messageId);
    }, 500);
  }, [simulateStreaming]);

  const handleSendMessage = (text: string) => {
    if (!text.trim() || isStreaming) return;

    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setMessageText('');

    // Start agent response after brief delay
    setTimeout(() => {
      const agentEvents = generateRandomEvents();
      const agentMessageId = `msg-${Date.now()}`;

      const agentMessage: Message = {
        id: agentMessageId,
        role: 'assistant',
        events: [],
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages(prev => [...prev, agentMessage]);

      setTimeout(() => {
        simulateStreaming(agentEvents, agentMessageId);
      }, 300);
    }, 500);
  };

  return (
    <DesignSystemFrame title="Agent Streaming Demo">
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Live Agent Streaming Demo
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Watch the agent stream mixed content: text blocks and tool calls. Each message generates a random sequence of events.
            Old tool calls auto-collapse to keep the interface clean.
          </p>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                {message.role === 'user' ? (
                  <div className="flex gap-3 items-start flex-row-reverse">
                    <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0 max-w-[80%]">
                      <div className="flex items-center gap-2 mb-1 justify-end">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">You</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="rounded-lg px-3 py-2 bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800/50">
                        <div className="prose prose-sm max-w-none prose-primary dark:prose-invert text-gray-900 dark:text-gray-100">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <AgentStreamMessage
                    events={message.events || []}
                    timestamp={message.timestamp}
                    isStreaming={message.isStreaming}
                    autoCollapseOldTools={true}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="max-w-4xl mx-auto">
            <ThreadInput
              value={messageText}
              onChange={setMessageText}
              onSend={handleSendMessage}
              placeholder="Send a message to see random streaming events..."
              disabled={isStreaming}
            />
          </div>
        </div>
      </div>
    </DesignSystemFrame>
  );
}
