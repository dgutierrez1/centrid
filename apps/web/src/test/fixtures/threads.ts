/**
 * Test fixtures for threads
 * Provides realistic test data for thread scenarios
 */

export const mockThread = {
  basic: {
    id: 'thread_001',
    ownerUserId: 'user_001',
    parentThreadId: null,
    branchTitle: null,
    creator: 'user' as const,
    createdAt: new Date('2025-01-01T12:00:00Z'),
    updatedAt: new Date('2025-01-01T12:00:00Z'),
  },
  withBranch: {
    id: 'thread_002',
    ownerUserId: 'user_001',
    parentThreadId: 'thread_001',
    branchTitle: 'Alternative approach',
    creator: 'user' as const,
    createdAt: new Date('2025-01-01T13:00:00Z'),
    updatedAt: new Date('2025-01-01T13:00:00Z'),
  },
  agentCreated: {
    id: 'thread_003',
    ownerUserId: 'user_001',
    parentThreadId: null,
    branchTitle: 'Agent suggestion',
    creator: 'agent' as const,
    createdAt: new Date('2025-01-01T14:00:00Z'),
    updatedAt: new Date('2025-01-01T14:00:00Z'),
  },
};

export const mockThreadWithMessages = {
  ...mockThread.basic,
  messages: [
    {
      id: 'msg_001',
      threadId: 'thread_001',
      ownerUserId: 'user_001',
      role: 'user' as const,
      content: [{ type: 'text', text: 'Hello!' }],
      timestamp: new Date('2025-01-01T12:00:00Z'),
    },
    {
      id: 'msg_002',
      threadId: 'thread_001',
      ownerUserId: 'user_001',
      role: 'assistant' as const,
      content: [{ type: 'text', text: 'Hi there!' }],
      timestamp: new Date('2025-01-01T12:00:01Z'),
    },
  ],
};

export const mockThreadList = [
  mockThread.basic,
  mockThread.withBranch,
  mockThread.agentCreated,
];
