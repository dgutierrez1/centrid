/**
 * Type-Safe Realtime Subscription System
 *
 * Provides a reusable, type-safe API for Supabase realtime subscriptions
 * with automatic snake_case to camelCase transformation.
 *
 * @example
 * // Simple subscription
 * const channel = subscribeToTable({
 *   table: 'threads',
 *   event: 'INSERT',
 *   filter: { owner_user_id: userId },
 *   callback: (payload) => console.log(payload.new)
 * });
 *
 * @example
 * // Chainable builder
 * const channel = createSubscription('folders')
 *   .filter({ user_id: userId })
 *   .on('INSERT', (payload) => addFolder(payload.new))
 *   .on('UPDATE', (payload) => updateFolder(payload.new))
 *   .subscribe();
 *
 * @example
 * // React hook
 * useRealtimeSubscription({
 *   table: 'threads',
 *   event: '*',
 *   filter: { owner_user_id: userId },
 *   callback: handleThreadEvent,
 *   enabled: !!userId,
 * });
 */

// Builder and helpers
export { RealtimeSubscriptionBuilder, createSubscription, subscribeToTable } from './builder';

// React hooks
export { useRealtimeSubscription, useRealtimeSubscriptions } from './hooks';

// Types
export type {
  TableName,
  TableRow,
  RealtimeEvent,
  FilterOperator,
  RealtimePayload,
  FilterValue,
  TableFilter,
  SubscriptionCallback,
  SubscriptionOptions,
  UseSubscriptionOptions,
  EventHandlerMap,
  ManagedSubscription,
} from './types';
