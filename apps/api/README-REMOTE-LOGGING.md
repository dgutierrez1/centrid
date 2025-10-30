# Remote Logging for Local Development

This guide explains how to access Supabase Edge Functions logs from your local development environment when logs aren't available locally.

## 🚀 Quick Setup

### 1. Set Up Log Aggregation Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of setup-log-aggregation.sql
-- This creates the function_logs table and necessary indexes
```

### 2. Deploy Logs API Function

```bash
cd apps/api
npm run deploy:function logs
```

### 3. Update Environment Variables

Add these to your Supabase Edge Function secrets:

- `PROJECT_ID`: Your Supabase project ID (xennuhfmnucybtyzfgcl)
- `SUPABASE_URL`: Your Supabase URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

### 4. Add Log Storage to Your Functions

Update your Edge Functions to store logs:

```typescript
import { createLogger } from '../lib/logger.ts';
import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  const logger = createLogger(req, { function: 'your-function' });

  // Store logs in database for remote access
  const storeLogInDatabase = async (logEntry: any) => {
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      await supabase.from('function_logs').insert({
        request_id: logEntry.context?.requestId,
        function_name: logEntry.context?.function,
        level: logEntry.level,
        message: logEntry.message,
        context: logEntry.context,
        duration: logEntry.duration,
        error: logEntry.error,
        user_id: logEntry.context?.userId,
        thread_id: logEntry.context?.threadId,
        project_id: Deno.env.get('PROJECT_ID')!,
        operation: logEntry.context?.operation,
        step: logEntry.context?.step,
        environment: Deno.env.get('ENVIRONMENT') || 'production'
      });
    } catch (error) {
      console.error('Failed to store log in database:', error);
    }
  };

  // Wrap your logger to store logs
  const originalInfo = logger.info.bind(logger);
  logger.info = (message: string, context?: any) => {
    originalInfo(message, context);
    storeLogInDatabase({
      level: 'info',
      message,
      context,
      timestamp: new Date().toISOString()
    });
  };

  // Your existing function code...
});
```

## 🔧 Accessing Logs Locally

### Option 1: Command Line Tool

```bash
# Install dependencies (if not already installed)
# jq is required for JSON parsing
# On macOS: brew install jq
# On Ubuntu: sudo apt-get install jq

# Set your service role key
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

# Fetch recent logs
./scripts/fetch-logs.sh

# Follow logs continuously
./scripts/fetch-logs.sh --follow

# Filter by function
./scripts/fetch-logs.sh --function stream-agent

# Filter by log level
./scripts/fetch-logs.sh --level error

# Filter by time period
./scripts/fetch-logs.sh --since "10 minutes ago"

# Combined filters
./scripts/fetch-logs.sh --function thread-messages --level error --since "5 minutes ago"
```

### Option 2: API Access

```bash
# Get logs via curl
curl -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  "https://xennuhfmnucybtyzfgcl.supabase.co/functions/v1/logs?limit=50"

# Filter by function
curl -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  "https://xennuhfmnucybtyzfgcl.supabase.co/functions/v1/logs?function=stream-agent&level=error"

# Filter by request ID
curl -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  "https://xennuhfmnucybtyzfgcl.supabase.co/functions/v1/logs?requestId=req-abc-123"
```

### Option 3: Web Interface

Create a simple HTML file to view logs:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Function Logs Viewer</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-900 text-white p-4">
  <div class="max-w-6xl mx-auto">
    <h1 class="text-2xl font-bold mb-4">Function Logs</h1>

    <div class="mb-4 flex gap-2 flex-wrap">
      <input type="text" id="functionFilter" placeholder="Function name"
             class="px-3 py-2 bg-gray-800 rounded">
      <select id="levelFilter" class="px-3 py-2 bg-gray-800 rounded">
        <option value="">All Levels</option>
        <option value="error">Error</option>
        <option value="warn">Warning</option>
        <option value="info">Info</option>
        <option value="debug">Debug</option>
      </select>
      <input type="text" id="requestIdFilter" placeholder="Request ID"
             class="px-3 py-2 bg-gray-800 rounded">
      <button onclick="fetchLogs()" class="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700">
        Refresh
      </button>
      <button onclick="toggleAutoRefresh()" id="autoRefreshBtn"
              class="px-4 py-2 bg-green-600 rounded hover:bg-green-700">
        Auto Refresh: OFF
      </button>
    </div>

    <div id="logStats" class="mb-4 text-sm text-gray-400"></div>
    <div id="logs" class="space-y-2 font-mono text-sm max-h-96 overflow-y-auto"></div>
  </div>

  <script>
    let autoRefresh = false;
    let refreshInterval;

    async function fetchLogs() {
      const functionFilter = document.getElementById('functionFilter').value;
      const levelFilter = document.getElementById('levelFilter').value;
      const requestIdFilter = document.getElementById('requestIdFilter').value;

      let url = '/functions/v1/logs?limit=100';
      if (functionFilter) url += \`&function=\${functionFilter}\`;
      if (levelFilter) url += \`&level=\${levelFilter}\`;
      if (requestIdFilter) url += \`&requestId=\${requestIdFilter}\`;

      try {
        const response = await fetch(url, {
          headers: {
            'Authorization': 'Bearer YOUR_SERVICE_ROLE_KEY' // Update this
          }
        });

        const data = await response.json();
        displayLogs(data.logs || []);
        updateStats(data);
      } catch (error) {
        console.error('Failed to fetch logs:', error);
        document.getElementById('logs').innerHTML =
          '<div class="text-red-400">Failed to fetch logs. Check console for details.</div>';
      }
    }

    function displayLogs(logs) {
      const logsDiv = document.getElementById('logs');
      logsDiv.innerHTML = '';

      if (logs.length === 0) {
        logsDiv.innerHTML = '<div class="text-gray-400">No logs found</div>';
        return;
      }

      logs.forEach(log => {
        const logEntry = document.createElement('div');
        const levelColor = {
          'error': 'bg-red-900 border-red-700',
          'warn': 'bg-yellow-900 border-yellow-700',
          'info': 'bg-blue-900 border-blue-700',
          'debug': 'bg-gray-800 border-gray-600'
        }[log.level] || 'bg-gray-800 border-gray-600';

        logEntry.className = \`p-2 rounded border \${levelColor}\`;
        logEntry.innerHTML = \`
          <div class="flex justify-between items-start">
            <div>
              <div class="flex gap-2 items-center">
                <span class="text-gray-400 text-xs">\${new Date(log.created_at).toLocaleString()}</span>
                <span class="px-2 py-1 text-xs rounded bg-gray-700">\${log.level.toUpperCase()}</span>
                <span class="text-green-400 text-sm font-mono">\${log.function_name || 'unknown'}</span>
                \${log.context?.requestId ? \`<span class="text-blue-400 text-xs">req:\${log.context.requestId}</span>\` : ''}
              </div>
              <div class="text-white mt-1">\${log.message}</div>
              \${log.duration ? \`<div class="text-gray-400 text-xs">Duration: \${log.duration}ms</div>\` : ''}
              \${log.operation ? \`<div class="text-gray-400 text-xs">Operation: \${log.operation}</div>\` : ''}
            </div>
          </div>
          \${log.error ? \`<details class="mt-2">
            <summary class="text-red-400 cursor-pointer text-sm">Error Details</summary>
            <pre class="text-red-300 text-xs mt-1 bg-red-950 p-2 rounded">\${JSON.stringify(log.error, null, 2)}</pre>
          </details>\` : ''}
          \${log.context && Object.keys(log.context).length > 0 ? \`<details class="mt-2">
            <summary class="text-gray-400 cursor-pointer text-sm">Context</summary>
            <pre class="text-gray-300 text-xs mt-1 bg-gray-950 p-2 rounded">\${JSON.stringify(log.context, null, 2)}</pre>
          </details>\` : ''}
        \`;
        logsDiv.appendChild(logEntry);
      });
    }

    function updateStats(data) {
      const stats = document.getElementById('logStats');
      const levelCounts = {};
      data.logs.forEach(log => {
        levelCounts[log.level] = (levelCounts[log.level] || 0) + 1;
      });

      stats.innerHTML = \`Total: \${data.count} | \${Object.entries(levelCounts).map(([level, count]) =>
        \`\${level.toUpperCase()}:\${count}\`
      ).join(' | ')}\`;
    }

    function toggleAutoRefresh() {
      autoRefresh = !autoRefresh;
      const btn = document.getElementById('autoRefreshBtn');

      if (autoRefresh) {
        btn.textContent = 'Auto Refresh: ON';
        btn.className = 'px-4 py-2 bg-orange-600 rounded hover:bg-orange-700';
        refreshInterval = setInterval(fetchLogs, 5000);
      } else {
        btn.textContent = 'Auto Refresh: OFF';
        btn.className = 'px-4 py-2 bg-green-600 rounded hover:bg-green-700';
        clearInterval(refreshInterval);
      }
    }

    // Initial load
    fetchLogs();
  </script>
</body>
</html>
```

## 🎯 Use Cases

### Debugging Production Issues

```bash
# Find errors in the last hour
./scripts/fetch-logs.sh --level error --since "1 hour ago"

# Trace a specific request across all functions
./scripts/fetch-logs.sh --filter "req-abc-123"

# Monitor a specific function
./scripts/fetch-logs.sh --function stream-agent --follow
```

### Performance Analysis

```bash
# Find slow operations (>5 seconds)
./scripts/fetch-logs.sh --filter "duration" | grep "ms" | awk '$NF > 5000'

# Monitor context assembly performance
./scripts/fetch-logs.sh --function context-assembly --filter "context"
```

### User Issue Investigation

```bash
# Trace all activity for a specific user
./scripts/fetch-logs.sh --filter "user-123" --follow

# Find issues in a specific thread
./scripts/fetch-logs.sh --filter "thread-456" --level error,warn
```

## 🔍 Filtering Examples

### By Function Name
```bash
./scripts/fetch-logs.sh --function thread-messages
./scripts/fetch-logs.sh --function stream-agent
./scripts/fetch-logs.sh --function create-thread
```

### By Log Level
```bash
./scripts/fetch-logs.sh --level error      # Only errors
./scripts/fetch-logs.sh --level warn,error  # Warnings and errors
./scripts/fetch-logs.sh --level info        # Info and above
```

### By Time Period
```bash
./scripts/fetch-logs.sh --since "5 minutes ago"
./scripts/fetch-logs.sh --since "1 hour ago"
./scripts/fetch-logs.sh --since "2025-01-10T10:00:00Z"
```

### By Request ID
```bash
./scripts/fetch-logs.sh --filter "req-abc-123"
```

### Combined Filters
```bash
./scripts/fetch-logs.sh --function stream-agent --level error --since "10 minutes ago"
```

## 🛠️ Advanced Usage

### Create Custom Log Views

```sql
-- View slow operations
SELECT * FROM function_logs
WHERE duration > 5000
ORDER BY created_at DESC
LIMIT 50;

-- View errors by function
SELECT function_name, COUNT(*) as error_count
FROM function_logs
WHERE level = 'error'
GROUP BY function_name
ORDER BY error_count DESC;

-- View user activity patterns
SELECT user_id, COUNT(*) as activity_count
FROM function_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY user_id
ORDER BY activity_count DESC;
```

### Integration with Development Tools

```bash
# Add to your package.json scripts
{
  "scripts": {
    "logs:recent": "./scripts/fetch-logs.sh --limit 20",
    "logs:errors": "./scripts/fetch-logs.sh --level error",
    "logs:function": "./scripts/fetch-logs.sh --function",
    "logs:follow": "./scripts/fetch-logs.sh --follow"
  }
}

# Use in development
npm run logs:errors
npm run logs:function stream-agent
npm run logs:follow
```

## 🚨 Security Considerations

1. **Service Role Key**: Use service role key for log access, not anon key
2. **RLS Policies**: Table has Row Level Security enabled
3. **Environment Variables**: Store sensitive keys in environment, not code
4. **Log Retention**: Set up cleanup to remove old logs (30 days default)
5. **PII Filtering**: Avoid logging sensitive user information

## 📈 Monitoring and Alerting

### Set Up Log Alerts

```sql
-- Create a function to check for error spikes
CREATE OR REPLACE FUNCTION check_error_spike()
RETURNS TABLE (function_name TEXT, error_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT function_name, COUNT(*) as error_count
  FROM function_logs
  WHERE level = 'error'
    AND created_at > NOW() - INTERVAL '1 hour'
  GROUP BY function_name
  HAVING COUNT(*) > 10; -- Alert if more than 10 errors per hour
END;
$$ LANGUAGE plpgsql;
```

### Performance Monitoring

```sql
-- Monitor slow operations
SELECT
  function_name,
  AVG(duration) as avg_duration,
  MAX(duration) as max_duration,
  COUNT(*) as operation_count
FROM function_logs
WHERE duration IS NOT NULL
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY function_name
ORDER BY avg_duration DESC;
```

## 🤝 Contributing

To improve the remote logging system:

1. Add new log filtering options
2. Improve the web interface
3. Add more sophisticated alerting
4. Enhance performance monitoring
5. Add log analytics features

Remember to test changes thoroughly before deploying to production!