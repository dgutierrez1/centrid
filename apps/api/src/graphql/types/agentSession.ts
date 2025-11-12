/**
 * AgentSession GraphQL Type
 * Multi-turn conversation session management
 */

import { builder } from '../builder.ts';
import { agentSessionRepository } from '../../repositories/agentSession.ts';
import type { agentSessions } from '../../db/schema.ts';

// Use Drizzle schema type (InferSelectModel)
type AgentSession = typeof agentSessions.$inferSelect;

// ============================================================================
// AgentSession Type
// ============================================================================

const AgentSessionType = builder.objectRef<AgentSession>('AgentSession').implement({
  description: 'Multi-turn conversation session for agent execution',
  fields: (t) => ({
    id: t.exposeID('id'),
    userId: t.exposeString('userId', { description: 'User ID this session belongs to' }),
    requestChain: t.field({
      type: 'JSON',
      description: 'Chain of agent requests in this session (JSON array)',
      resolve: (session) => session.requestChain,
    }),
    contextState: t.field({
      type: 'JSON',
      nullable: true,
      description: 'Session context state (JSON object)',
      resolve: (session) => session.contextState,
    }),
    createdAt: t.field({
      type: 'DateTime',
      resolve: (session) => session.createdAt, // Already ISO string from database
    }),
    updatedAt: t.field({
      type: 'DateTime',
      resolve: (session) => session.updatedAt, // Already ISO string from database
    }),
  }),
});

// ============================================================================
// Input Types
// ============================================================================

const CreateAgentSessionInput = builder.inputType('CreateAgentSessionInput', {
  fields: (t) => ({
    requestChain: t.field({ type: 'JSON', required: true, description: 'Initial request chain (JSON array)' }),
    contextState: t.field({ type: 'JSON', required: false, description: 'Initial context state (JSON object)' }),
  }),
});

const UpdateAgentSessionInput = builder.inputType('UpdateAgentSessionInput', {
  fields: (t) => ({
    requestChain: t.field({ type: 'JSON', required: false, description: 'Updated request chain (JSON array)' }),
    contextState: t.field({ type: 'JSON', required: false, description: 'Updated context state (JSON object)' }),
  }),
});

// ============================================================================
// Queries
// ============================================================================

builder.queryField('agentSession', (t) =>
  t.field({
    type: AgentSessionType,
    nullable: true,
    description: 'Get a single agent session by ID',
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (parent, args, context) => {
      return await agentSessionRepository.findById(args.id);
    },
  })
);

builder.queryField('agentSessions', (t) =>
  t.field({
    type: [AgentSessionType],
    description: 'Get all agent sessions for current user',
    args: {
      userId: t.arg.id({ required: false, description: 'User ID (defaults to current user)' }),
      limit: t.arg.int({ required: false }),
      offset: t.arg.int({ required: false }),
    },
    resolve: async (parent, args, context) => {
      const userId = args.userId || context.userId;
      return await agentSessionRepository.findByUserId(userId, args.limit ?? undefined, args.offset ?? undefined);
    },
  })
);

// ============================================================================
// Mutations
// ============================================================================

builder.mutationField('createAgentSession', (t) =>
  t.field({
    type: AgentSessionType,
    description: 'Create a new agent session',
    args: {
      input: t.arg({ type: CreateAgentSessionInput, required: true }),
    },
    resolve: async (parent, args, context) => {
      return await agentSessionRepository.create({
        userId: context.userId,
        requestChain: args.input.requestChain,
        contextState: args.input.contextState || undefined,
      });
    },
  })
);

builder.mutationField('updateAgentSession', (t) =>
  t.field({
    type: AgentSessionType,
    nullable: true,
    description: 'Update an existing agent session',
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: UpdateAgentSessionInput, required: true }),
    },
    resolve: async (parent, args, context) => {
      const updateData: {
        requestChain?: unknown[];
        contextState?: unknown;
      } = {};

      if (args.input.requestChain !== undefined) {
        updateData.requestChain = args.input.requestChain as unknown[];
      }
      if (args.input.contextState !== undefined) {
        updateData.contextState = args.input.contextState as unknown;
      }

      return await agentSessionRepository.update(args.id, updateData);
    },
  })
);

builder.mutationField('deleteAgentSession', (t) =>
  t.field({
    type: 'Boolean',
    description: 'Delete an agent session',
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (parent, args, context) => {
      await agentSessionRepository.delete(args.id);
      return true;
    },
  })
);
