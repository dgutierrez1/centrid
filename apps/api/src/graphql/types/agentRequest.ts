/**
 * Agent Request GraphQL Type
 * AI agent execution tracking with event streaming via subscriptions
 */

import { builder } from '../builder.ts';
import { agentRequestRepository } from '../../repositories/agentRequest.ts';
import { agentExecutionEventRepository } from '../../repositories/agentExecutionEvent.ts';
import { AgentExecutionService } from '../../services/agentExecution.ts';
import { AgentRequestService } from '../../services/agentRequestService.ts';
import { agentExecutionEventBus } from '../../services/agentExecutionEventBus.ts';
import { createLogger } from '../../utils/logger.ts';
import type { AgentRequest, AgentExecutionEvent } from '../../db/types.ts';

const logger = createLogger('graphql/agentRequest');

// Import AgentExecutionEventType from dedicated file (avoid duplicate definition)
import { AgentExecutionEventType } from './agentExecutionEvent.ts';

// ============================================================================
// Agent Request Type
// ============================================================================

const AgentRequestType = builder.objectRef<AgentRequest>('AgentRequest').implement({
  description: 'AI agent execution request',
  fields: (t) => ({
    id: t.exposeID('id', { description: 'Request ID' }),
    userId: t.exposeString('userId', { description: 'Owner user ID' }),
    threadId: t.exposeString('threadId', { description: 'Thread ID' }),
    triggeringMessageId: t.exposeString('triggeringMessageId', { description: 'Triggering message ID' }),
    responseMessageId: t.exposeString('responseMessageId', { nullable: true, description: 'Response message ID' }),
    agentType: t.exposeString('agentType', { description: 'Agent type (e.g., claude, gpt4)' }),
    content: t.exposeString('content', { description: 'Request content/prompt' }),
    status: t.exposeString('status', { description: 'Status: pending, in_progress, completed, failed' }),
    progress: t.exposeFloat('progress', { description: 'Progress (0.0 - 1.0)' }),
    results: t.field({
      type: 'JSON',
      nullable: true,
      description: 'Execution results (JSON)',
      resolve: (request) => request.results,
    }),
    checkpoint: t.field({
      type: 'JSON',
      nullable: true,
      description: 'Checkpoint state for tool approval resume (JSON)',
      resolve: (request) => request.checkpoint,
    }),
    tokenCost: t.exposeInt('tokenCost', { nullable: true, description: 'Total tokens used' }),
    createdAt: t.field({
      type: 'DateTime',
      description: 'Creation timestamp',
      resolve: (request) => request.createdAt, // Already ISO string from database
    }),
    updatedAt: t.field({
      type: 'DateTime',
      description: 'Last update timestamp',
      resolve: (request) => request.updatedAt, // Already ISO string from database
    }),
    completedAt: t.field({
      type: 'DateTime',
      nullable: true,
      description: 'Completion timestamp',
      resolve: (request) => request.completedAt, // Already ISO string from database or null
    }),
  }),
});

// ============================================================================
// Input Types
// ============================================================================

const CreateAgentRequestInput = builder.inputType('CreateAgentRequestInput', {
  description: 'Input for creating an agent request',
  fields: (t) => ({
    threadId: t.id({ required: true, description: 'Thread ID' }),
    triggeringMessageId: t.id({ required: true, description: 'Message ID that triggered this request' }),
    agentType: t.string({ required: true, description: 'Agent type (claude, gpt4, etc)' }),
    content: t.string({ required: true, description: 'Request content/prompt' }),
  }),
});

// ============================================================================
// Queries
// ============================================================================

builder.queryField('agentRequest', (t) =>
  t.field({
    type: AgentRequestType,
    nullable: true,
    description: 'Get agent request by ID',
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (parent, args, context) => {
      const request = await agentRequestRepository.findById(args.id);
      if (!request || request.userId !== context.userId) {
        return null;
      }
      return request;
    },
  })
);

builder.queryField('agentRequestsByThread', (t) =>
  t.field({
    type: [AgentRequestType],
    description: 'Get all agent requests for a thread',
    args: {
      threadId: t.arg.id({ required: true }),
    },
    resolve: async (parent, args, context) => {
      return await agentRequestRepository.findByThreadId(args.threadId);
    },
  })
);

// NOTE: agentExecutionEvents query is defined in agentExecutionEvent.ts (avoid duplication)

// ============================================================================
// Mutations
// ============================================================================

builder.mutationField('createAgentRequest', (t) =>
  t.field({
    type: AgentRequestType,
    description: 'Create a new agent request (triggers async execution)',
    args: {
      input: t.arg({ type: CreateAgentRequestInput, required: true }),
    },
    resolve: async (parent, args, context) => {
      const request = await agentRequestRepository.create({
        userId: context.userId,
        threadId: args.input.threadId,
        triggeringMessageId: args.input.triggeringMessageId,
        agentType: args.input.agentType,
        content: args.input.content,
      });

      // NOTE: Actual execution happens via executeAgentRequest mutation
      // which is called asynchronously after request creation
      // Frontend listens to Supabase Realtime for status updates

      return request;
    },
  })
);

// ============================================================================
// Execute Agent Request Mutation (uses shared service function)
// ============================================================================

builder.mutationField('executeAgentRequest', (t) =>
  t.field({
    type: 'Boolean',
    description: 'Execute agent request and stream events to database (shares logic with REST endpoint)',
    args: {
      requestId: t.arg.id({ required: true, description: 'Agent request ID to execute' }),
    },
    resolve: async (parent, args, context) => {
      try {
        // Call shared service function (same logic as REST endpoint)
        const result = await AgentRequestService.executeRequest(args.requestId);

        if (result.status === 'failed') {
          throw new Error(result.error || 'Execution failed');
        }

        return true;
      } catch (error) {
        console.error('[Execute GraphQL] Unexpected error:', error);
        throw new Error(
          `Execution error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
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
// builder.subscriptionField('agentExecutionEvents', (t) =>
//   t.field({
//     type: AgentExecutionEventType,
//     description: 'Subscribe to agent execution events (real-time streaming)',
//     args: {
//       requestId: t.arg.id({ required: true }),
//     },
//     subscribe: (parent, args, context) => {
//       // Return async iterator from Supabase Realtime
//       return createRealtimeIterator('agent_execution_events', {
//         requestId: args.requestId,
//       });
//     },
//     resolve: (payload) => payload,
//   })
// );
//
// builder.subscriptionField('agentRequestStatusChanged', (t) =>
//   t.field({
//     type: AgentRequestType,
//     description: 'Subscribe to agent request status changes',
//     args: {
//       requestId: t.arg.id({ required: true }),
//     },
//     subscribe: (parent, args, context) => {
//       return createRealtimeIterator('agent_requests', {
//         id: args.requestId,
//       });
//     },
//     resolve: (payload) => payload,
//   })
// );
