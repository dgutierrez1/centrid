/**
 * Test fixtures for messages
 * Provides realistic test data for message scenarios
 */

export const mockMessage = {
  user: {
    id: 'msg_user_001',
    threadId: 'thread_001',
    ownerUserId: 'user_001',
    role: 'user' as const,
    content: [{ type: 'text', text: 'Hello, how can you help me?' }],
    toolCalls: null,
    tokensUsed: null,
    timestamp: new Date('2025-01-01T12:00:00Z'),
  },
  assistantText: {
    id: 'msg_assistant_001',
    threadId: 'thread_001',
    ownerUserId: 'user_001',
    role: 'assistant' as const,
    content: [{ type: 'text', text: 'I can help you with various tasks!' }],
    toolCalls: null,
    tokensUsed: 150,
    timestamp: new Date('2025-01-01T12:00:01Z'),
  },
  assistantWithTool: {
    id: 'msg_assistant_002',
    threadId: 'thread_001',
    ownerUserId: 'user_001',
    role: 'assistant' as const,
    content: [
      { type: 'text', text: 'Let me read that file for you.' },
      {
        type: 'tool_use',
        id: 'toolu_01',
        name: 'read_file',
        input: { file_path: '/test/file.txt' },
      },
    ],
    toolCalls: null,
    tokensUsed: 200,
    timestamp: new Date('2025-01-01T12:00:02Z'),
  },
  assistantMultipleTools: {
    id: 'msg_assistant_003',
    threadId: 'thread_001',
    ownerUserId: 'user_001',
    role: 'assistant' as const,
    content: [
      { type: 'text', text: 'I need to read and then write files.' },
      {
        type: 'tool_use',
        id: 'toolu_02',
        name: 'read_file',
        input: { file_path: '/input.txt' },
      },
      { type: 'text', text: 'Now writing the output...' },
      {
        type: 'tool_use',
        id: 'toolu_03',
        name: 'write_file',
        input: { file_path: '/output.txt', content: 'result' },
      },
      { type: 'text', text: 'Done!' },
    ],
    toolCalls: null,
    tokensUsed: 300,
    timestamp: new Date('2025-01-01T12:00:03Z'),
  },
};

export const mockConversation = [
  mockMessage.user,
  mockMessage.assistantText,
  mockMessage.user,
  mockMessage.assistantWithTool,
];
