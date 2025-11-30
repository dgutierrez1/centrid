/**
 * UsageEvent GraphQL Type
 * Usage tracking for billing and analytics
 */

import { builder } from '../builder.ts';
import { usageEventRepository } from '../../repositories/usageEvent.ts';

// Define UsageEvent type shape
interface UsageEvent {
  id: string;
  userId: string;
  eventType: string;
  tokensUsed: number | null;
  cost: number | null;
  metadata: any;
  createdAt: string;
}

// ============================================================================
// UsageEvent Type
// ============================================================================

const UsageEventType = builder.objectRef<UsageEvent>('UsageEvent').implement({
  description: 'Usage event for billing and analytics tracking',
  fields: (t) => ({
    id: t.exposeID('id'),
    userId: t.exposeString('userId', { description: 'User ID this event belongs to' }),
    eventType: t.exposeString('eventType', { description: 'Event type (e.g., agent_request, file_upload)' }),
    tokensUsed: t.exposeInt('tokensUsed', { nullable: true, description: 'Number of tokens used (for AI operations)' }),
    cost: t.exposeFloat('cost', { nullable: true, description: 'Cost in dollars' }),
    metadata: t.field({
      type: 'String', // JSON stringified
      nullable: true,
      description: 'Event metadata (JSON object as string)',
      resolve: (event) => event.metadata ? JSON.stringify(event.metadata) : null,
    }),
    createdAt: t.field({
      type: 'DateTime',
      nullable: false,
      resolve: (event) => event.createdAt,
    }),
  }),
});

// ============================================================================
// Aggregate Types (for analytics)
// ============================================================================

// Shape for UsageStats (for objectRef)
interface UsageStats {
  totalTokens: number;
  totalCost: number;
}

const UsageStatsType = builder.objectRef<UsageStats>('UsageStats').implement({
  description: 'Aggregated usage statistics',
  fields: (t) => ({
    totalTokens: t.exposeInt('totalTokens', { description: 'Total tokens used' }),
    totalCost: t.exposeFloat('totalCost', { description: 'Total cost in dollars' }),
  }),
});

// ============================================================================
// Queries (read-only - events are append-only for audit trail)
// ============================================================================

builder.queryField('usageEvents', (t) =>
  t.field({
    type: [UsageEventType],
    description: 'Get usage events for current user (with optional date range filtering)',
    args: {
      userId: t.arg.id({ required: false, description: 'User ID (defaults to current user)' }),
      startDate: t.arg({ type: 'DateTime', required: false, description: 'Filter events after this date' }),
      endDate: t.arg({ type: 'DateTime', required: false, description: 'Filter events before this date' }),
      limit: t.arg.int({ required: false }),
      offset: t.arg.int({ required: false }),
    },
    resolve: async (parent, args, context) => {
      const userId = args.userId || context.userId;

      return await usageEventRepository.findByUserId(userId, {
        startDate: args.startDate,
        endDate: args.endDate,
        limit: args.limit,
        offset: args.offset,
      });
    },
  })
);

builder.queryField('usageStats', (t) =>
  t.field({
    type: UsageStatsType,
    description: 'Get aggregated usage statistics for current user',
    args: {
      userId: t.arg.id({ required: false, description: 'User ID (defaults to current user)' }),
      startDate: t.arg({ type: 'DateTime', required: false, description: 'Calculate stats since this date' }),
    },
    resolve: async (parent, args, context) => {
      const userId = args.userId || context.userId;
      const startDate = args.startDate ?? undefined; // Convert null to undefined

      const [totalTokens, totalCost] = await Promise.all([
        usageEventRepository.getTotalTokensByUserId(userId, startDate),
        usageEventRepository.getTotalCostByUserId(userId, startDate),
      ]);

      return {
        totalTokens,
        totalCost,
      };
    },
  })
);

// ============================================================================
// No Mutations - Events are created internally by billing system
// ============================================================================
