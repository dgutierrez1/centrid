/**
 * Tests for ClaudeConversationBuilder
 * Ensures correct conversation construction for Claude API
 *
 * Critical test cases:
 * 1. Message splitting at tool_use boundaries
 * 2. Rejected tools get is_error flag
 * 3. Pending tools skip tool_result
 * 4. Orphaned tool_use edge case (no matching tool_call record)
 * 5. Multiple consecutive tools
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClaudeConversationBuilder } from './conversationBuilder.ts';
import { mockToolCall } from '../test/fixtures/tool-calls.ts';
import { mockMessage } from '../test/fixtures/messages.ts';
import type { AgentToolCall } from '../db/types.ts';

// Mock the logger to suppress console output
vi.mock('../utils/logger.ts', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

// Mock TOOL_REGISTRY
vi.mock('../config/tools.ts', () => ({
  TOOL_REGISTRY: {
    web_search: { type: 'web_search_20250305' }, // Native tool
    read_file: {}, // Custom tool (no type field)
    write_file: {},
    execute_code: {},
  },
}));

describe('ClaudeConversationBuilder', () => {
  describe('Test 1: Message splitting at tool_use boundaries', () => {
    it('splits assistant message at tool_use boundaries', () => {
      const toolCalls = [
        {
          ...mockToolCall.approved,
          toolName: 'read_file',
        },
      ];

      const builder = new ClaudeConversationBuilder(toolCalls);

      builder.addAssistantMessage({
        id: 'msg_001',
        content: [
          { type: 'text', text: 'Before tool' },
          {
            type: 'tool_use',
            id: mockToolCall.approved.id,
            name: 'read_file',
            input: { file_path: '/test.txt' },
          },
          { type: 'text', text: 'After tool' },
        ],
      });

      const messages = builder.build();

      // Should produce 4 messages:
      // 1. Assistant: [text "Before tool"]
      // 2. Assistant: [tool_use]
      // 3. User: [tool_result]
      // 4. Assistant: [text "After tool"]
      expect(messages).toHaveLength(4);

      // Verify first message (text before tool)
      expect(messages[0]).toMatchObject({
        role: 'assistant',
        content: [{ type: 'text', text: 'Before tool' }],
      });

      // Verify second message (tool_use)
      expect(messages[1]).toMatchObject({
        role: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: mockToolCall.approved.id,
            name: 'read_file',
            input: { file_path: '/test.txt' },
          },
        ],
      });

      // Verify third message (tool_result from user)
      expect(messages[2]).toMatchObject({
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: mockToolCall.approved.id,
            content: mockToolCall.approved.toolOutput,
          },
        ],
      });

      // Verify fourth message (text after tool)
      expect(messages[3]).toMatchObject({
        role: 'assistant',
        content: [{ type: 'text', text: 'After tool' }],
      });
    });
  });

  describe('Test 2: Rejected tools get is_error flag', () => {
    it('adds is_error flag for rejected tools', () => {
      const toolCalls = [
        {
          ...mockToolCall.rejected,
          toolName: 'write_file',
        },
      ];

      const builder = new ClaudeConversationBuilder(toolCalls);

      builder.addAssistantMessage({
        id: 'msg_001',
        content: [
          {
            type: 'tool_use',
            id: mockToolCall.rejected.id,
            name: 'write_file',
            input: { file_path: '/test.txt', content: 'test' },
          },
        ],
      });

      const messages = builder.build();

      // Should have 2 messages: tool_use + tool_result
      expect(messages).toHaveLength(2);

      // Verify tool_result has is_error flag
      const toolResult = messages[1].content[0];
      expect(toolResult.type).toBe('tool_result');
      expect(toolResult.is_error).toBe(true);
      expect(toolResult.content).toContain('User declined');
      expect(toolResult.content).toContain(mockToolCall.rejected.rejectionReason);
    });
  });

  describe('Test 3: Pending tools skip tool_result', () => {
    it('skips tool_result for pending tools', () => {
      const toolCalls = [
        {
          ...mockToolCall.pending,
          toolName: 'execute_code',
        },
      ];

      const builder = new ClaudeConversationBuilder(toolCalls);

      builder.addAssistantMessage({
        id: 'msg_001',
        content: [
          {
            type: 'tool_use',
            id: mockToolCall.pending.id,
            name: 'execute_code',
            input: { code: 'console.log("test")' },
          },
        ],
      });

      const messages = builder.build();

      // Should only have 1 message (tool_use), no tool_result
      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe('assistant');
      expect(messages[0].content[0].type).toBe('tool_use');
    });
  });

  describe('Test 4: Orphaned tool_use edge case', () => {
    it('skips segment when tool_call record not found', () => {
      const toolCalls: AgentToolCall[] = []; // Empty - no matching record

      const builder = new ClaudeConversationBuilder(toolCalls);

      builder.addAssistantMessage({
        id: 'msg_001',
        content: [
          { type: 'text', text: 'Before orphaned tool' },
          {
            type: 'tool_use',
            id: 'missing-tool-id',
            name: 'read_file',
            input: {},
          },
          { type: 'text', text: 'After orphaned tool' },
        ],
      });

      const messages = builder.build();

      // Should only have 2 text segments, tool segment skipped
      expect(messages).toHaveLength(2);
      expect(messages[0].content[0].text).toBe('Before orphaned tool');
      expect(messages[1].content[0].text).toBe('After orphaned tool');
    });
  });

  describe('Test 5: Multiple consecutive tools', () => {
    it('handles multiple consecutive tools correctly', () => {
      const tool1 = { ...mockToolCall.approved, id: 'toolu_01', toolName: 'read_file' };
      const tool2 = { ...mockToolCall.approved, id: 'toolu_02', toolName: 'write_file' };

      const toolCalls = [tool1, tool2];

      const builder = new ClaudeConversationBuilder(toolCalls);

      builder.addAssistantMessage({
        id: 'msg_001',
        content: [
          {
            type: 'tool_use',
            id: 'toolu_01',
            name: 'read_file',
            input: { file_path: '/input.txt' },
          },
          {
            type: 'tool_use',
            id: 'toolu_02',
            name: 'write_file',
            input: { file_path: '/output.txt', content: 'test' },
          },
        ],
      });

      const messages = builder.build();

      // Should alternate: [tool1], [result1], [tool2], [result2]
      expect(messages).toHaveLength(4);

      // Tool 1
      expect(messages[0].content[0].type).toBe('tool_use');
      expect(messages[0].content[0].id).toBe('toolu_01');

      // Result 1
      expect(messages[1].content[0].type).toBe('tool_result');
      expect(messages[1].content[0].tool_use_id).toBe('toolu_01');

      // Tool 2
      expect(messages[2].content[0].type).toBe('tool_use');
      expect(messages[2].content[0].id).toBe('toolu_02');

      // Result 2
      expect(messages[3].content[0].type).toBe('tool_result');
      expect(messages[3].content[0].tool_use_id).toBe('toolu_02');
    });
  });

  describe('Additional test: User messages', () => {
    it('passes user messages through unchanged', () => {
      const builder = new ClaudeConversationBuilder([]);

      builder.addUserMessage([{ type: 'text', text: 'Hello!' }]);

      const messages = builder.build();

      expect(messages).toHaveLength(1);
      expect(messages[0]).toMatchObject({
        role: 'user',
        content: [{ type: 'text', text: 'Hello!' }],
      });
    });
  });

  describe('Additional test: Content sanitization', () => {
    it('strips internal fields from tool_use blocks', () => {
      const toolCalls = [
        {
          ...mockToolCall.approved,
          toolName: 'read_file',
        },
      ];

      const builder = new ClaudeConversationBuilder(toolCalls);

      builder.addAssistantMessage({
        id: 'msg_001',
        content: [
          {
            type: 'tool_use',
            id: mockToolCall.approved.id,
            name: 'read_file',
            input: { file_path: '/test.txt' },
            internalField: 'should be stripped',
            status: 'pending',
          } as any,
        ],
      });

      const messages = builder.build();
      const toolUse = messages[0].content[0];

      // Should only have Claude-compatible fields
      expect(Object.keys(toolUse)).toEqual(['type', 'id', 'name', 'input']);
      expect(toolUse).not.toHaveProperty('internalField');
      expect(toolUse).not.toHaveProperty('status');
    });
  });
});
