/**
 * Tool Call GraphQL Type
 * Agent tool calls with approval workflow and subscriptions
 */

import { builder } from '../builder.ts';
import { agentToolCallRepository } from '../../repositories/agentToolCall.ts';
import type { AgentToolCall } from '../db/types.js';

// ============================================================================
// Tool Call Type
// ============================================================================

const ToolCallType = builder.objectRef<AgentToolCall>('ToolCall').implement({
  description: 'Agent tool call requiring approval',
  fields: (t) => ({
    id: t.exposeID('id', { description: 'Tool call ID (Claude toolu_* ID)' }),
    messageId: t.exposeString('messageId', { description: 'Triggering message ID' }),
    threadId: t.exposeString('threadId', { description: 'Thread ID' }),
    ownerUserId: t.exposeString('ownerUserId', { description: 'Owner user ID' }),
    requestId: t.exposeString('requestId', { nullable: true, description: 'Agent request ID' }),
    toolName: t.exposeString('toolName', { description: 'Tool name (e.g., write_file, create_branch)' }),
    toolInput: t.field({
      type: 'JSON',
      description: 'Tool input parameters (JSON)',
      resolve: (toolCall) => toolCall.toolInput,
    }),
    approvalStatus: t.exposeString('approvalStatus', { description: 'Status: pending, approved, rejected, timeout' }),
    toolOutput: t.field({
      type: 'JSON',
      nullable: true,
      description: 'Tool execution output (JSON)',
      resolve: (toolCall) => toolCall.toolOutput,
    }),
    rejectionReason: t.exposeString('rejectionReason', { nullable: true, description: 'Rejection reason if rejected' }),
    revisionCount: t.exposeInt('revisionCount', { nullable: true, description: 'Number of revisions' }),
    revisionHistory: t.field({
      type: 'JSON',
      nullable: true,
      description: 'Revision history (JSON)',
      resolve: (toolCall) => toolCall.revisionHistory,
    }),
    timestamp: t.field({
      type: 'DateTime',
      description: 'Creation timestamp',
      resolve: (toolCall) => toolCall.timestamp,
    }),
  }),
});

// ============================================================================
// Input Types
// ============================================================================

const ApproveToolCallInput = builder.inputType('ApproveToolCallInput', {
  description: 'Input for approving a tool call',
  fields: (t) => ({
    id: t.id({ required: true, description: 'Tool call ID' }),
  }),
});

const RejectToolCallInput = builder.inputType('RejectToolCallInput', {
  description: 'Input for rejecting a tool call',
  fields: (t) => ({
    id: t.id({ required: true, description: 'Tool call ID' }),
    reason: t.string({ required: false, description: 'Rejection reason' }),
  }),
});

// ============================================================================
// Queries
// ============================================================================

builder.queryField('toolCall', (t) =>
  t.field({
    type: ToolCallType,
    nullable: true,
    description: 'Get tool call by ID',
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (parent, args, context) => {
      const toolCall = await agentToolCallRepository.findById(args.id);
      if (!toolCall || toolCall.ownerUserId !== context.userId) {
        return null;
      }
      return toolCall;
    },
  })
);

builder.queryField('pendingToolCalls', (t) =>
  t.field({
    type: [ToolCallType],
    description: 'Get pending tool calls for a thread',
    args: {
      threadId: t.arg.id({ required: true }),
    },
    resolve: async (parent, args, context) => {
      return await agentToolCallRepository.findPendingByThreadId(args.threadId);
    },
  })
);

builder.queryField('toolCallsByRequest', (t) =>
  t.field({
    type: [ToolCallType],
    description: 'Get all tool calls for an agent request',
    args: {
      requestId: t.arg.id({ required: true }),
    },
    resolve: async (parent, args, context) => {
      return await agentToolCallRepository.findByRequestId(args.requestId);
    },
  })
);

// ============================================================================
// Mutations
// ============================================================================

builder.mutationField('approveToolCall', (t) =>
  t.field({
    type: ToolCallType,
    description: 'Approve a pending tool call (triggers async execution)',
    args: {
      input: t.arg({ type: ApproveToolCallInput, required: true }),
    },
    resolve: async (parent, args, context) => {
      const toolCall = await agentToolCallRepository.findById(args.input.id);

      if (!toolCall) {
        throw new Error('Tool call not found');
      }

      if (toolCall.ownerUserId !== context.userId) {
        throw new Error('Unauthorized');
      }

      if (toolCall.approvalStatus !== 'pending') {
        throw new Error('Tool call is not pending');
      }

      // Update status to approved
      const updated = await agentToolCallRepository.updateStatus(
        args.input.id,
        'approved'
      );

      // NOTE: Approval triggers agent execution via Supabase Realtime subscription
      // The /api/agent-requests/:requestId/execute endpoint listens for approved status
      // and resumes execution automatically

      return updated;
    },
  })
);

builder.mutationField('rejectToolCall', (t) =>
  t.field({
    type: ToolCallType,
    description: 'Reject a pending tool call',
    args: {
      input: t.arg({ type: RejectToolCallInput, required: true }),
    },
    resolve: async (parent, args, context) => {
      const toolCall = await agentToolCallRepository.findById(args.input.id);

      if (!toolCall) {
        throw new Error('Tool call not found');
      }

      if (toolCall.ownerUserId !== context.userId) {
        throw new Error('Unauthorized');
      }

      if (toolCall.approvalStatus !== 'pending') {
        throw new Error('Tool call is not pending');
      }

      // Reject with revision tracking
      const updated = await agentToolCallRepository.rejectWithRevisionTracking(
        args.input.id,
        args.input.reason || 'User rejected'
      );

      return updated;
    },
  })
);

// ============================================================================
// Subscriptions (Future: GraphQL subscriptions for real-time updates)
// ============================================================================

// NOTE: GraphQL subscriptions require a pub/sub system
// For MVP, we use Supabase Realtime directly in the frontend
// Future enhancement: Add GraphQL subscription support
//
// builder.subscriptionField('toolCallStatusChanged', (t) =>
//   t.field({
//     type: ToolCallType,
//     description: 'Subscribe to tool call status changes',
//     args: {
//       requestId: t.arg.id({ required: true }),
//     },
//     subscribe: (parent, args, context) => {
//       // Return async iterator from Supabase Realtime
//       return createRealtimeIterator('agent_tool_calls', {
//         requestId: args.requestId,
//       });
//     },
//     resolve: (payload) => payload,
//   })
// );
