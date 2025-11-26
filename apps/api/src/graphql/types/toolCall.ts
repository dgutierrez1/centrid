/**
 * Tool Call GraphQL Type
 * Agent tool calls with approval workflow and subscriptions
 */

import { builder } from '../builder.ts';
import { agentToolCallRepository } from '../../repositories/agentToolCall.ts';
import { AgentRequestService } from '../../services/agentRequestService.ts';
import { AgentExecutionService } from '../../services/agentExecution.ts';
import type { AgentToolCall } from '../../db/types.ts';
import { createLogger } from '../../utils/logger.ts';

const logger = createLogger('ToolCallType');

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

      // Execute the tool synchronously using generic executor
      logger.info('Executing approved tool', {
        toolCallId: toolCall.id,
        toolName: toolCall.toolName,
        threadId: toolCall.threadId,
      });

      const toolResult = await AgentExecutionService.executeTool(
        toolCall.toolName,
        toolCall.toolInput,
        toolCall.threadId,
        context.userId
      );

      logger.info('Tool execution completed', {
        toolCallId: toolCall.id,
        success: !toolResult.error,
      });

      // Update status to approved with execution result
      const updated = await agentToolCallRepository.updateStatus(
        args.input.id,
        'approved',
        toolResult
      );

      // Fire-and-forget execution resume (matches createMessageWithExecution pattern)
      // Frontend subscribes to agent_execution_events for real-time updates
      if (toolCall.requestId) {
        AgentRequestService.executeRequest(toolCall.requestId)
          .then((result) => {
            logger.info('Agent execution resumed after tool approval', {
              toolCallId: toolCall.id,
              requestId: toolCall.requestId,
              status: result.status,
            });
          })
          .catch((error) => {
            logger.error('Agent execution failed after tool approval', {
              toolCallId: toolCall.id,
              requestId: toolCall.requestId,
              error: error instanceof Error ? error.message : String(error),
            });
          });
      } else {
        logger.warn('Tool call approved but no requestId found', {
          toolCallId: toolCall.id,
        });
      }

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
