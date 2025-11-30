/**
 * JSONB Field Configuration for Realtime Subscriptions
 *
 * Supabase Realtime returns JSONB columns as stringified JSON, while GraphQL
 * queries return parsed objects. This config maps table names to JSONB field
 * names so the Realtime builder can automatically parse them.
 *
 * @see apps/api/src/db/schema.ts for source of truth on JSONB columns
 */

import { snakeToCamel } from '@/lib/utils/casing';

/**
 * Maps table names to JSONB field names (snake_case, as they appear in database)
 *
 * Total: 14 JSONB columns across 7 tables
 */
export const JSONB_FIELDS: Record<string, string[]> = {
  // Agent system tables (10 JSONB columns)
  agent_execution_events: ['data'], // Event payload (different structure per event type)
  agent_tool_calls: ['tool_input', 'tool_output', 'revision_history'], // Tool parameters, results, and revision attempts
  agent_requests: ['results', 'checkpoint'], // Execution results and tool approval checkpoint state
  agent_sessions: ['request_chain', 'context_state'], // Array of request IDs and arbitrary context data

  // Usage & metadata (2 JSONB columns)
  usage_events: ['metadata'], // Usage tracking metadata
  shadow_entities: ['structure_metadata'], // Entity-specific metadata

  // Messages (2 JSONB columns)
  messages: ['content', 'tool_calls'], // ContentBlock[] and tool call references
};

/**
 * Get JSONB fields for a table in both snake_case and camelCase
 *
 * @param tableName - Database table name
 * @returns Object with snake_case and camelCase field sets
 *
 * @example
 * const fields = getJsonbFields('agent_execution_events');
 * fields.snake // Set(['data'])
 * fields.camel // Set(['data'])
 */
export function getJsonbFields(tableName: string): {
  snake: Set<string>;
  camel: Set<string>;
} {
  const snakeFields = JSONB_FIELDS[tableName] || [];
  const camelFields = snakeFields.map((field) =>
    // Handle simple field names that don't need transformation
    field.includes('_') ? snakeToCamel(field) : field
  );

  return {
    snake: new Set(snakeFields),
    camel: new Set(camelFields),
  };
}

/**
 * Parse JSONB fields in a row (for cold path .select() queries)
 *
 * Used when fetching existing data via `.select()` instead of Realtime subscriptions.
 * The Realtime builder handles parsing automatically for hot path (real-time events).
 *
 * @param tableName - Database table name
 * @param row - Row data from .select() query (snake_case or camelCase)
 * @returns Row with parsed JSONB fields
 *
 * @example
 * const events = await supabase
 *   .from('agent_execution_events')
 *   .select('*')
 *   .eq('request_id', requestId);
 *
 * const parsed = events.map(event => parseJsonbRow('agent_execution_events', event));
 */
export function parseJsonbRow<T extends Record<string, any>>(
  tableName: string,
  row: T
): T {
  if (!row || typeof row !== 'object') return row;

  const jsonbFields = getJsonbFields(tableName);
  const parsed = { ...row };

  // Try both snake_case and camelCase field names (handles both query styles)
  const allFieldNames = new Set([
    ...Array.from(jsonbFields.snake),
    ...Array.from(jsonbFields.camel),
  ]);

  for (const field of Array.from(allFieldNames)) {
    const value = parsed[field];

    // Only parse if field exists and is a string
    if (value !== undefined && value !== null && typeof value === 'string') {
      try {
        (parsed as Record<string, unknown>)[field] = JSON.parse(value);
      } catch (error) {
        console.error(
          `[Realtime] Failed to parse JSONB field ${tableName}.${field}:`,
          error
        );
        // Keep original value on parse error
      }
    }
  }

  return parsed;
}
