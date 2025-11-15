/**
 * Test fixtures for messages (frontend)
 * Provides realistic test data for message UI testing
 */

export const mockMessage = {
  user: {
    id: 'msg_user_001',
    role: 'user' as const,
    content: [{ type: 'text', text: 'Can you help me with this file?' }],
    timestamp: '2025-01-01T12:00:00.000Z',
  },
  assistant: {
    id: 'msg_assistant_001',
    role: 'assistant' as const,
    content: [{ type: 'text', text: 'Of course! Let me take a look.' }],
    timestamp: '2025-01-01T12:00:01.000Z',
  },
  withToolPending: {
    id: 'msg_assistant_002',
    role: 'assistant' as const,
    content: [
      { type: 'text', text: 'Let me read that file.' },
      {
        type: 'tool_use',
        id: 'toolu_pending',
        name: 'read_file',
        input: { file_path: '/test.txt' },
        status: 'pending',
      },
    ],
    timestamp: '2025-01-01T12:00:02.000Z',
  },
  withToolCompleted: {
    id: 'msg_assistant_003',
    role: 'assistant' as const,
    content: [
      { type: 'text', text: 'Here are the file contents.' },
      {
        type: 'tool_use',
        id: 'toolu_completed',
        name: 'read_file',
        input: { file_path: '/test.txt' },
        status: 'completed',
        result: 'File contents here',
      },
      { type: 'text', text: 'Does this help?' },
    ],
    timestamp: '2025-01-01T12:00:03.000Z',
  },
};

export const mockConversation = [
  mockMessage.user,
  mockMessage.assistant,
  mockMessage.user,
  mockMessage.withToolCompleted,
];
