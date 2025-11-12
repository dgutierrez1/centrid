/**
 * React Hooks for Realtime Subscriptions
 *
 * Provides React hooks for managing Supabase realtime subscriptions
 * with automatic cleanup on unmount.
 */

import { useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { subscribeToTable } from './builder';
import type { TableName, UseSubscriptionOptions } from './types';
import { createClient } from '@/lib/supabase';

/**
 * React hook for managing a single realtime subscription
 *
 * Automatically cleans up subscription on unmount or when dependencies change.
 *
 * @param options - Subscription options
 *
 * @example
 * useRealtimeSubscription({
 *   table: 'threads',
 *   event: '*',
 *   filter: { owner_user_id: userId },
 *   callback: (payload) => {
 *     if (payload.eventType === 'INSERT') {
 *       addThread(payload.new);
 *     }
 *   },
 *   enabled: !!userId, // Conditional subscription
 * });
 */
export function useRealtimeSubscription<T extends TableName>(
  options: UseSubscriptionOptions<T>
) {
  const { enabled = true, ...subscriptionOptions } = options;
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // Don't subscribe if disabled
    if (!enabled) {
      return;
    }

    // Create subscription
    const supabase = createClient();
    channelRef.current = subscribeToTable(subscriptionOptions);

    // Cleanup on unmount or dependency change
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, JSON.stringify(subscriptionOptions.filter)]);
}

/**
 * React hook for managing multiple realtime subscriptions
 *
 * Automatically cleans up all subscriptions on unmount or when dependencies change.
 *
 * @param subscriptions - Array of subscription options
 *
 * @example
 * useRealtimeSubscriptions([
 *   {
 *     table: 'threads',
 *     event: '*',
 *     filter: { owner_user_id: userId },
 *     callback: handleThreadEvent,
 *     enabled: !!userId,
 *   },
 *   {
 *     table: 'messages',
 *     event: 'INSERT',
 *     filter: { thread_id: threadId },
 *     callback: handleNewMessage,
 *     enabled: !!threadId,
 *   },
 * ]);
 */
export function useRealtimeSubscriptions(
  subscriptions: Array<UseSubscriptionOptions<any>>
) {
  const channelsRef = useRef<RealtimeChannel[]>([]);

  useEffect(() => {
    const supabase = createClient();
    const channels: RealtimeChannel[] = [];

    // Create subscriptions for enabled items
    for (const sub of subscriptions) {
      const { enabled = true, ...subscriptionOptions } = sub;

      if (enabled) {
        const channel = subscribeToTable(subscriptionOptions);
        channels.push(channel);
      }
    }

    channelsRef.current = channels;

    // Cleanup on unmount or dependency change
    return () => {
      channelsRef.current.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, [JSON.stringify(subscriptions.map((s) => ({ filter: s.filter, enabled: s.enabled })))]);
}
