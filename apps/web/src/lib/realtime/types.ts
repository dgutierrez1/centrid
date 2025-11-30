/**
 * Type-Safe Realtime Subscription Types
 *
 * Provides full type safety for Supabase realtime subscriptions
 * with automatic snake_case to camelCase transformation.
 *
 * Uses GraphQL types as the source of truth for unified typing
 * across queries and realtime subscriptions.
 */

import type { RealtimeChannel } from '@supabase/supabase-js';
import type {
  Thread,
  Message,
  File,
  Folder,
  ToolCall,
  ContextReference,
  AgentRequest,
  AgentExecutionEvent,
  ShadowEntity,
} from '@/types/graphql';

// ============================================================================
// Core Types
// ============================================================================

/**
 * Map database table names to GraphQL types
 * This provides unified typing across GraphQL queries and realtime subscriptions
 *
 * When adding a new table:
 * 1. Add the GraphQL type import above
 * 2. Add the table name → type mapping here
 */
export interface TableTypeMap {
  threads: Thread;
  messages: Message;
  files: File;
  folders: Folder;
  agent_tool_calls: ToolCall;
  context_references: ContextReference;
  agent_requests: AgentRequest;
  agent_execution_events: AgentExecutionEvent;
  shadow_entities: ShadowEntity;
}

/**
 * Extract table names from TableTypeMap
 */
export type TableName = keyof TableTypeMap;

/**
 * Extract row type for a specific table
 * Uses GraphQL types for type safety
 */
export type TableRow<T extends TableName> = TableTypeMap[T];

/**
 * Realtime event types from Supabase
 */
export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

/**
 * Filter operators supported by PostgREST
 */
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'is';

// ============================================================================
// Payload Types
// ============================================================================

/**
 * Realtime payload structure from Supabase
 * Generic over table name to provide typed row data
 */
export interface RealtimePayload<T extends TableName> {
  schema: string;
  table: string;
  commit_timestamp: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: TableRow<T> | null;
  old: Partial<TableRow<T>> | null;
  errors: string[] | null;
}

/**
 * Event-specific payload types with narrowed nullability
 * INSERT/UPDATE guarantee `new` exists, DELETE guarantees `old` exists
 */
export type InsertPayload<T extends TableName> = Omit<RealtimePayload<T>, 'new' | 'old' | 'eventType'> & {
  eventType: 'INSERT';
  new: TableRow<T>;
  old: null;
};

export type UpdatePayload<T extends TableName> = Omit<RealtimePayload<T>, 'new' | 'old' | 'eventType'> & {
  eventType: 'UPDATE';
  new: TableRow<T>;
  old: Partial<TableRow<T>>;
};

export type DeletePayload<T extends TableName> = Omit<RealtimePayload<T>, 'new' | 'old' | 'eventType'> & {
  eventType: 'DELETE';
  new: null;
  old: Partial<TableRow<T>>;
};

/**
 * Get payload type for specific event
 */
export type PayloadForEvent<T extends TableName, E extends RealtimeEvent> =
  E extends 'INSERT' ? InsertPayload<T> :
  E extends 'UPDATE' ? UpdatePayload<T> :
  E extends 'DELETE' ? DeletePayload<T> :
  RealtimePayload<T>;

// ============================================================================
// Filter Types
// ============================================================================

/**
 * Filter value with optional operator
 */
export type FilterValue<V> = {
  operator?: FilterOperator;
  value: V | V[];
} | V; // Shorthand for eq operator

/**
 * Type-safe filter builder for a table
 * Accepts both snake_case (database) and camelCase (TypeScript) keys
 */
export type TableFilter<T extends TableName> = {
  [K in keyof TableRow<T>]?: FilterValue<TableRow<T>[K]>;
};

// ============================================================================
// Callback Types
// ============================================================================

/**
 * Subscription callback with properly typed payload
 */
export type SubscriptionCallback<T extends TableName> = (
  payload: RealtimePayload<T>
) => void | Promise<void>;

// ============================================================================
// Options Types
// ============================================================================

/**
 * Options for creating a subscription
 */
export interface SubscriptionOptions<T extends TableName> {
  /** Table to subscribe to */
  table: T;

  /** Event(s) to listen for (default: '*') */
  event?: RealtimeEvent | RealtimeEvent[];

  /** Filters to apply (uses database column names) */
  filter?: TableFilter<T>;

  /** Callback function for handling events */
  callback: SubscriptionCallback<T>;

  /** Custom channel name (auto-generated if not provided) */
  channelName?: string;

  /** Enable automatic snake_case to camelCase transformation (default: true) */
  transformKeys?: boolean;
}

/**
 * Options for React hook subscriptions
 */
export interface UseSubscriptionOptions<T extends TableName> extends SubscriptionOptions<T> {
  /** Enable/disable subscription (default: true) */
  enabled?: boolean;
}

// ============================================================================
// Export Types for Builder
// ============================================================================

/**
 * Event handler map for builder pattern
 */
export type EventHandlerMap<T extends TableName> = Map<
  RealtimeEvent,
  SubscriptionCallback<T>[]
>;

/**
 * Subscription channel with cleanup
 */
export interface ManagedSubscription {
  channel: RealtimeChannel;
  unsubscribe: () => void;
}
