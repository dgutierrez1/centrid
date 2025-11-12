/**
 * Test fixtures for tool calls
 * Provides realistic test data for agent tool call scenarios
 */

export const mockToolCall = {
  approved: {
    id: 'toolu_01ApprovedToolCall',
    messageId: 'msg_001',
    threadId: 'thread_001',
    ownerUserId: 'user_001',
    requestId: 'req_001',
    responseMessageId: 'msg_002',
    toolName: 'read_file',
    toolInput: { file_path: '/test/file.txt' },
    approvalStatus: 'approved' as const,
    toolOutput: 'File contents here',
    rejectionReason: null,
    revisionCount: 0,
    revisionHistory: null,
    timestamp: new Date('2025-01-01T12:00:00Z'),
  },
  rejected: {
    id: 'toolu_02RejectedToolCall',
    messageId: 'msg_003',
    threadId: 'thread_001',
    ownerUserId: 'user_001',
    requestId: 'req_002',
    responseMessageId: 'msg_004',
    toolName: 'write_file',
    toolInput: { file_path: '/test/output.txt', content: 'test' },
    approvalStatus: 'rejected' as const,
    toolOutput: null,
    rejectionReason: 'User declined file write',
    revisionCount: 1,
    revisionHistory: [{ timestamp: new Date(), reason: 'User declined' }],
    timestamp: new Date('2025-01-01T12:01:00Z'),
  },
  pending: {
    id: 'toolu_03PendingToolCall',
    messageId: 'msg_005',
    threadId: 'thread_001',
    ownerUserId: 'user_001',
    requestId: 'req_003',
    responseMessageId: 'msg_006',
    toolName: 'execute_code',
    toolInput: { code: 'console.log("test")' },
    approvalStatus: 'pending' as const,
    toolOutput: null,
    rejectionReason: null,
    revisionCount: 0,
    revisionHistory: null,
    timestamp: new Date('2025-01-01T12:02:00Z'),
  },
  native: {
    id: 'toolu_04NativeToolCall',
    messageId: 'msg_007',
    threadId: 'thread_001',
    ownerUserId: 'user_001',
    requestId: 'req_004',
    responseMessageId: 'msg_008',
    toolName: 'web_search',
    toolInput: { query: 'test search' },
    approvalStatus: 'approved' as const,
    toolOutput: null, // Native tools don't have output in our system
    rejectionReason: null,
    revisionCount: 0,
    revisionHistory: null,
    timestamp: new Date('2025-01-01T12:03:00Z'),
  },
};

export const mockToolCallArray = [
  mockToolCall.approved,
  mockToolCall.rejected,
  mockToolCall.pending,
];
