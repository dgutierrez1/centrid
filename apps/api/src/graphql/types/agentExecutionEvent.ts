/**
 * AgentExecutionEvent GraphQL Type
 * Real-time event streaming for agent execution progress
 */

import { builder } from '../builder.ts';
import { agentExecutionEventRepository } from '../../repositories/agentExecutionEvent.ts';
import type { AgentExecutionEvent } from '../db/types.js';

// ============================================================================
// AgentExecutionEvent Type
// ============================================================================

export const AgentExecutionEventType = builder.objectRef<AgentExecutionEvent>('AgentExecutionEvent').implement({
  description: 'Real-time execution events for agent requests (text_chunk, tool_call, completion, error)',
  fields: (t) => ({
    id: t.exposeID('id'),
    requestId: t.exposeString('requestId', { description: 'Agent request ID this event belongs to' }),
    type: t.exposeString('type', { description: 'Event type: text_chunk, tool_call, completion, error' }),
    data: t.field({
      type: 'JSON',
      description: 'Event payload (JSON object)',
      resolve: (event) => event.data,
    }),
    createdAt: t.field({
      type: 'DateTime',
      resolve: (event) => event.createdAt, // Already ISO string from database
    }),
  }),
});

// ============================================================================
// Queries (read-only - events are append-only)
// ============================================================================

builder.queryField('agentExecutionEvents', (t) =>
  t.field({
    type: [AgentExecutionEventType],
    description: 'Get all execution events for an agent request (for replay on late connection)',
    args: {
      requestId: t.arg.id({ required: true, description: 'Agent request ID' }),
    },
    resolve: async (parent, args, context) => {
      return await agentExecutionEventRepository.findByRequestId(args.requestId);
    },
  })
);

builder.queryField('agentExecutionEventsSince', (t) =>
  t.field({
    type: [AgentExecutionEventType],
    description: 'Get execution events since a certain timestamp (for incremental polling)',
    args: {
      requestId: t.arg.id({ required: true, description: 'Agent request ID' }),
      timestamp: t.arg({ type: 'DateTime', required: true, description: 'ISO timestamp to fetch events after' }),
    },
    resolve: async (parent, args, context) => {
      // args.timestamp is already an ISO string from DateTime scalar
      return await agentExecutionEventRepository.findByRequestIdSinceTimestamp(args.requestId, args.timestamp);
    },
  })
);

// ============================================================================
// No Mutations - Events are created internally by agent execution system
// ============================================================================
