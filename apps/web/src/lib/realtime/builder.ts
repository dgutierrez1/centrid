/**
 * Realtime Subscription Builder
 *
 * Type-safe, chainable builder for Supabase realtime subscriptions
 * with automatic snake_case to camelCase transformation.
 */

import { supabase } from "@/lib/supabase/client";
import { snakeToCamel } from "@/lib/utils/casing";
import { getJsonbFields } from "./config";
import type {
  TableName,
  TableRow,
  RealtimeEvent,
  RealtimePayload,
  TableFilter,
  SubscriptionCallback,
  SubscriptionOptions,
  EventHandlerMap,
  PayloadForEvent,
} from "./types";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Chainable builder for creating type-safe realtime subscriptions
 *
 * @example
 * const subscription = createSubscription('threads')
 *   .filter({ owner_user_id: userId })
 *   .on('INSERT', (payload) => console.log('New thread:', payload.new))
 *   .on('UPDATE', (payload) => console.log('Updated thread:', payload.new))
 *   .subscribe();
 */
export class RealtimeSubscriptionBuilder<T extends TableName> {
  private table: T;
  private filters: TableFilter<T> = {};
  private events: EventHandlerMap<T> = new Map();
  private channelName?: string;
  private transformKeys: boolean = true;

  constructor(table: T) {
    this.table = table;
  }

  /**
   * Add filters to the subscription
   *
   * @param filters - Object with column names and values
   * @returns this for chaining
   *
   * @example
   * builder.filter({ owner_user_id: userId, status: 'active' })
   */
  filter(filters: TableFilter<T>): this {
    this.filters = { ...this.filters, ...filters };
    return this;
  }

  /**
   * Add an event listener
   *
   * @param event - Event type to listen for
   * @param callback - Callback function with typed payload (narrowed by event type)
   * @returns this for chaining
   *
   * @example
   * builder.on('INSERT', (payload) => {
   *   console.log('New row:', payload.new);  // payload.new is non-null for INSERT
   * })
   */
  on<E extends RealtimeEvent>(
    event: E,
    callback: (payload: PayloadForEvent<T, E>) => void | Promise<void>
  ): this {
    const callbacks = this.events.get(event) || [];
    callbacks.push(callback as SubscriptionCallback<T>);
    this.events.set(event, callbacks);
    return this;
  }

  /**
   * Set a custom channel name
   *
   * @param name - Channel name
   * @returns this for chaining
   *
   * @example
   * builder.channel('my-custom-channel')
   */
  channel(name: string): this {
    this.channelName = name;
    return this;
  }

  /**
   * Disable automatic key transformation
   *
   * @returns this for chaining
   *
   * @example
   * builder.noTransform() // Keep snake_case from database
   */
  noTransform(): this {
    this.transformKeys = false;
    return this;
  }

  /**
   * Build and subscribe to the realtime channel
   *
   * @returns RealtimeChannel for manual cleanup if needed
   *
   * @example
   * const channel = builder.subscribe();
   * // Later: supabase.removeChannel(channel);
   */
  subscribe(): RealtimeChannel {
    // Generate channel name if not provided
    const channelName =
      this.channelName ||
      `${this.table}-${Object.entries(this.filters)
        .map(([k, v]) => `${k}:${JSON.stringify(v)}`)
        .join("-")}-${Date.now()}`;

    const channel = supabase.channel(channelName);

    // Add postgres_changes listener for each event
    // Convert Map to Array to ensure ES5 compatibility
    const eventEntries = Array.from(this.events.entries());

    for (const [event, callbacks] of eventEntries) {
      const config: any = {
        event,
        schema: "public",
        table: this.table,
      };

      // Build filter string from filter object
      if (Object.keys(this.filters).length > 0) {
        const filterString = this.buildFilterString(this.filters);
        if (filterString) {
          config.filter = filterString;
        }
      }

      // Combine all callbacks for this event
      const combinedCallback = (payload: any) => {
        // Transform keys if enabled
        const transformedPayload = this.transformKeys
          ? this.transformPayload(payload)
          : payload;

        // Execute all callbacks for this event
        callbacks.forEach((cb) => {
          try {
            cb(transformedPayload);
          } catch (error) {
            console.error(
              `[Realtime] Error in callback for ${this.table}.${event}:`,
              error
            );
          }
        });
      };

      channel.on("postgres_changes", config, combinedCallback);
    }

    return channel.subscribe((status, err) => {
      if (status === "CHANNEL_ERROR") {
        console.error(`[Realtime] ${this.table} channel error:`, err);
      }
      if (status === "TIMED_OUT") {
        console.error(`[Realtime] ${this.table} subscription timed out`);
      }
    });
  }

  /**
   * Build PostgREST filter string from filter object
   *
   * @param filters - Filter object
   * @returns Filter string (e.g., "user_id=eq.123,status=eq.active")
   *
   * @private
   */
  private buildFilterString(filters: TableFilter<T>): string {
    const filterParts: string[] = [];

    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null) {
        continue;
      }

      // Handle object with operator
      if (
        typeof value === "object" &&
        !Array.isArray(value) &&
        "operator" in value
      ) {
        const { operator = "eq", value: filterValue } = value as any;
        filterParts.push(`${key}=${operator}.${filterValue}`);
      }
      // Handle direct value (default to eq)
      else {
        filterParts.push(`${key}=eq.${value}`);
      }
    }

    return filterParts.join(",");
  }

  /**
   * Transform payload from snake_case to camelCase + parse JSONB fields
   *
   * @param payload - Raw payload from Supabase
   * @returns Transformed payload with camelCase keys and parsed JSONB
   *
   * @private
   */
  private transformPayload(payload: any): RealtimePayload<T> {
    // Step 1: Transform snake_case → camelCase
    const transformed = {
      ...payload,
      new: payload.new ? snakeToCamel<TableRow<T>>(payload.new) : null,
      old: payload.old ? snakeToCamel<Partial<TableRow<T>>>(payload.old) : null,
    };

    // Step 2: Parse JSONB fields (operates on camelCase keys)
    const jsonbFields = getJsonbFields(this.table);

    if (transformed.new) {
      transformed.new = this.parseJsonbFields(
        transformed.new,
        jsonbFields.camel
      );
    }

    if (transformed.old) {
      transformed.old = this.parseJsonbFields(
        transformed.old,
        jsonbFields.camel
      );
    }

    return transformed;
  }

  /**
   * Parse JSONB fields in a row
   *
   * Supabase Realtime returns JSONB columns as stringified JSON, while GraphQL
   * queries return parsed objects. This method auto-parses JSONB fields based
   * on the config in apps/web/src/lib/realtime/config.ts.
   *
   * @param row - Row data (already camelCased)
   * @param jsonbFields - Set of JSONB field names (camelCase)
   * @returns Row with parsed JSONB fields
   *
   * @private
   */
  private parseJsonbFields<R>(row: R, jsonbFields: Set<string>): R {
    if (!row || typeof row !== "object") return row;

    const parsed = { ...row };

    for (const field of jsonbFields) {
      const value = (parsed as any)[field];

      // Only parse if field exists and is a string
      if (value !== undefined && value !== null && typeof value === "string") {
        try {
          (parsed as any)[field] = JSON.parse(value);
        } catch (error) {
          console.error(
            `[Realtime] Failed to parse JSONB field ${this.table}.${field}:`,
            error
          );
          // Keep original value on parse error
        }
      }
    }

    return parsed;
  }
}

/**
 * Create a subscription builder for a table
 *
 * @param table - Table name to subscribe to
 * @returns RealtimeSubscriptionBuilder for chaining
 *
 * @example
 * const subscription = createSubscription('threads')
 *   .filter({ owner_user_id: userId })
 *   .on('INSERT', (payload) => console.log(payload.new))
 *   .subscribe();
 */
export function createSubscription<T extends TableName>(
  table: T
): RealtimeSubscriptionBuilder<T> {
  return new RealtimeSubscriptionBuilder(table);
}

/**
 * Simple one-shot subscription helper
 *
 * @param options - Subscription options
 * @returns RealtimeChannel for manual cleanup
 *
 * @example
 * const subscription = subscribeToTable({
 *   table: 'threads',
 *   event: 'INSERT',
 *   filter: { owner_user_id: userId },
 *   callback: (payload) => console.log('New thread:', payload.new)
 * });
 */
export function subscribeToTable<T extends TableName>(
  options: SubscriptionOptions<T>
): RealtimeChannel {
  const {
    table,
    event = "*",
    filter,
    callback,
    channelName,
    transformKeys = true,
  } = options;

  const builder = createSubscription(table);

  // Add filters
  if (filter) {
    builder.filter(filter);
  }

  // Add event listener(s)
  if (Array.isArray(event)) {
    event.forEach((e) => builder.on(e, callback));
  } else {
    builder.on(event, callback);
  }

  // Set custom channel name
  if (channelName) {
    builder.channel(channelName);
  }

  // Disable transformation if requested
  if (!transformKeys) {
    builder.noTransform();
  }

  return builder.subscribe();
}
