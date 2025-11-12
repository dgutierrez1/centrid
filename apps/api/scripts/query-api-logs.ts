#!/usr/bin/env tsx
/**
 * Query Supabase Edge Function logs for the main 'api' function
 * Merges HTTP requests and console logs into unified timeline
 *
 * Usage Examples:
 *   npm run logs                                    # Last 1 hour (merged)
 *   npm run logs -- --hours=2                       # Last 2 hours
 *   npm run logs -- --errors                        # Only errors
 *   npm run logs -- --route="/api/threads"          # Specific route
 *   npm run logs -- --status=500                    # Specific status code
 *   npm run logs -- --search="abc-123"              # Full-text search
 *   npm run logs -- --hours=1 --search="error"      # Combined filters
 */

interface LogQueryOptions {
  hours?: number; // Hours back (default: 1)
  route?: string; // Filter by route regex (e.g., '/api/threads')
  status?: number; // Filter by status code (e.g., 500)
  errors?: boolean; // Only show errors (status >= 400 or error logs)
  search?: string; // Full-text search across all log fields (case-insensitive)
  limit?: number; // Max results per type (default: 100)
}

async function queryApiLogs(options: LogQueryOptions = {}) {
  const PROJECT_REF = "xennuhfmnucybtyzfgcl";
  const TOKEN = "sbp_9780fde63fd08ee25194cc1c67952c152a89ebf3";

  if (!PROJECT_REF || !TOKEN) {
    throw new Error(
      "Missing environment variables:\n" +
        "  SUPABASE_PROJECT_REF\n" +
        "  SUPABASE_PERSONAL_ACCESS_TOKEN\n\n" +
        "Get your Personal Access Token from:\n" +
        "  Supabase Dashboard → Account → Access Tokens\n\n" +
        "Add to ~/.zshrc or ~/.bashrc:\n" +
        '  export SUPABASE_PERSONAL_ACCESS_TOKEN="sbp_..."\n' +
        '  export SUPABASE_PROJECT_REF="your-project-ref"'
    );
  }

  const hours = options.hours || 1; // 1 hour default
  const limit = options.limit || 100;

  // Calculate timestamps (ISO 8601 format required by API)
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);
  const iso_timestamp_end = endTime.toISOString();
  const iso_timestamp_start = startTime.toISOString();

  // Helper to query a specific log type
  async function queryLogType(table: string, whereClause: string) {
    const sql = `
      SELECT timestamp, event_message, metadata
      FROM ${table}
      WHERE ${whereClause}
      ORDER BY timestamp DESC
      LIMIT ${limit}
    `;

    const params = new URLSearchParams({
      iso_timestamp_start,
      iso_timestamp_end,
      sql,
    });

    const response = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/analytics/endpoints/logs.all?${params}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    return data.result || [];
  }

  // Build where clauses
  // HTTP logs: filter by function path in URL
  let httpWhere = `event_message LIKE '%/functions/v1/api/%'`;

  // Console logs: get all (they're already JSON structured, filter by time range only)
  let consoleWhere = `1=1`;

  if (options.route) {
    httpWhere += ` AND event_message LIKE '%${options.route}%'`;
    // Console logs don't have URL paths, so route filter only applies to HTTP
  }

  // Add search filter to SQL WHERE clause (filters BEFORE LIMIT)
  if (options.search) {
    const escapedSearch = options.search.replace(/'/g, "''"); // Escape single quotes for SQL
    httpWhere += ` AND event_message LIKE '%${escapedSearch}%'`;
    consoleWhere += ` AND event_message LIKE '%${escapedSearch}%'`;
  }

  // Query both types in parallel
  const [httpLogs, consoleLogs] = await Promise.all([
    queryLogType('function_edge_logs', httpWhere),
    queryLogType('function_logs', consoleWhere),
  ]);

  // Process HTTP logs
  const processedHttp = httpLogs
    .map((log: any) => {
      const meta = log.metadata?.[0] || {};
      const request = meta.request?.[0] || {};
      const response = meta.response?.[0] || {};

      return {
        type: 'HTTP',
        timestamp: new Date(log.timestamp / 1000).toISOString(),
        timestampMs: log.timestamp / 1000,
        event_message: log.event_message,
        status: response.status_code,
        method: request.method,
        path: request.pathname,
        duration_ms: meta.execution_time_ms,
      };
    })
    .filter((log: any) => {
      if (options.errors && (!log.status || log.status < 400)) return false;
      if (options.status && log.status !== options.status) return false;
      return true;
    });

  // Process console logs
  const processedConsole = consoleLogs
    .map((log: any) => ({
      type: 'LOG',
      timestamp: new Date(log.timestamp / 1000).toISOString(),
      timestampMs: log.timestamp / 1000,
      event_message: log.event_message,
    }))
    .filter((log: any) => {
      if (options.errors) {
        // Filter for error keywords in console logs
        const msg = log.event_message.toLowerCase();
        return msg.includes('error') || msg.includes('failed') || msg.includes('exception');
      }
      return true;
    });

  // Merge and sort by timestamp
  const merged = [...processedHttp, ...processedConsole].sort(
    (a, b) => a.timestampMs - b.timestampMs
  );

  // Search filter already applied in SQL WHERE clause
  return merged;
}

// CLI Interface
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const args = process.argv.slice(2);
  const options: LogQueryOptions = {};

  // Parse CLI arguments: npm run logs -- --hours=2 --route="/api/threads" --errors
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--errors") {
      options.errors = true;
    } else if (arg.startsWith("--")) {
      // Split only on FIRST = to preserve spaces in value
      const equalIndex = arg.indexOf("=");

      if (equalIndex !== -1) {
        // Format: --key=value or --key="value with spaces"
        const key = arg.substring(2, equalIndex);
        const value = arg.substring(equalIndex + 1);

        if (key === "hours" || key === "limit" || key === "status") {
          options[key] = parseInt(value);
        } else {
          options[key as keyof LogQueryOptions] = value;
        }
      } else if (i + 1 < args.length && !args[i + 1].startsWith("--")) {
        // Format: --key value
        const key = arg.substring(2);
        const value = args[i + 1];

        if (key === "hours" || key === "limit" || key === "status") {
          options[key] = parseInt(value);
        } else {
          options[key as keyof LogQueryOptions] = value;
        }
        i++; // Skip next arg
      }
    }
  }

  queryApiLogs(options)
    .then((logs) => {
      // Format output with [HTTP] or [LOG] prefix
      logs.forEach((log: any) => {
        const prefix = log.type === 'HTTP' ? '[HTTP]' : '[LOG] ';
        const timestamp = log.timestamp.replace('T', ' ').replace('Z', '');

        if (log.type === 'HTTP') {
          console.log(`${prefix} ${timestamp} | ${log.method} ${log.path} → ${log.status} (${log.duration_ms}ms)`);
        } else {
          console.log(`${prefix} ${timestamp} | ${log.event_message}`);
        }
      });

      const httpCount = logs.filter((l: any) => l.type === 'HTTP').length;
      const logCount = logs.filter((l: any) => l.type === 'LOG').length;
      console.error(`\n✅ Found ${logs.length} log entries (${httpCount} HTTP, ${logCount} console)`);
    })
    .catch((err) => {
      console.error("❌ Error:", err.message);
      process.exit(1);
    });
}

export { queryApiLogs, type LogQueryOptions };
