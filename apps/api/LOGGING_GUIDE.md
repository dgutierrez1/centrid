# Supabase Edge Functions Logging Guide

This guide covers the enhanced logging system implemented for better debugging and monitoring of your Supabase Edge Functions.

## Overview

The logging system provides:
- **Structured JSON logging** for better filtering and search in Supabase UI
- **Request correlation** with unique request IDs
- **Performance timing** for operations
- **Context preservation** across function calls
- **Log levels** (debug, info, warn, error)

## Quick Start

### For Edge Functions

```typescript
import { createLogger, withTiming } from '../lib/logger.ts';

Deno.serve(async (req) => {
  const logger = createLogger(req, { function: 'my-function' });

  logger.info('Request received');

  try {
    const result = await withTiming(
      logger.child({ operation: 'database_query' }),
      'user lookup',
      () => getUserFromDatabase(userId)
    );

    logger.complete('Operation completed', { userId: result.id });

    return new Response(JSON.stringify(result));
  } catch (error) {
    logger.error('Operation failed', error);
    return new Response('Error', { status: 500 });
  }
});
```

### For Services

```typescript
import { createServiceLogger } from '../lib/logger.ts';

export class MyService {
  private logger: any;

  constructor(userId: string) {
    this.logger = createServiceLogger('MyService', { userId });
  }

  async processData(data: any) {
    this.logger.debug('Starting data processing', { dataId: data.id });

    try {
      const result = await this.expensiveOperation(data);
      this.logger.info('Processing completed', { resultId: result.id });
      return result;
    } catch (error) {
      this.logger.error('Processing failed', error, { dataId: data.id });
      throw error;
    }
  }
}
```

## Logger Methods

### Basic Logging

```typescript
logger.debug('Detailed debugging info', { details: 'optional context' });
logger.info('General information', { userId: '123' });
logger.warn('Warning conditions', { retryCount: 3 });
logger.error('Error occurred', error, { context: 'additional data' });
```

### Performance Timing

```typescript
// Method 1: Built-in timing
logger.complete('Operation completed'); // Uses elapsed time since logger creation

// Method 2: Manual timing
logger.timing('database query', duration, { queryType: 'select' });

// Method 3: WithTiming wrapper
const result = await withTiming(
  logger.child({ operation: 'api_call' }),
  'external API request',
  () => fetchExternalAPI(data)
);
```

### Context Management

```typescript
// Create child logger with additional context
const childLogger = logger.child({ userId: '123', operation: 'auth' });

// Update logger context
logger.setContext({ requestId: 'abc-123', userId: '456' });

// Log streaming events (for SSE)
logStreamEvent(logger, 'message_received', data);
```

## Log Format

All logs are output as structured JSON:

```json
{
  "level": "info",
  "message": "User authenticated successfully",
  "timestamp": "2025-01-10T10:30:45.123Z",
  "context": {
    "requestId": "req-abc-123",
    "userId": "user-456",
    "function": "authenticate",
    "method": "POST"
  },
  "duration": 150,
  "error": {
    "name": "ValidationError",
    "message": "Invalid input",
    "stack": "Error: Invalid input\n    at ..."
  }
}
```

## Log Levels

- **debug**: Detailed debugging information (development/verbose)
- **info**: General information about normal operation
- **warn**: Warning conditions that don't prevent operation
- **error**: Error conditions that prevent normal operation

## Best Practices

### 1. Use Structured Context

```typescript
// Good
logger.info('User authenticated', { userId: user.id, email: user.email });

// Avoid
logger.info(`User authenticated: ${user.id} with email ${user.email}`);
```

### 2. Time Operations

```typescript
// Good
const result = await withTiming(logger, 'database operation', () =>
  database.query(sql)
);

// Avoid
const start = Date.now();
const result = await database.query(sql);
console.log(`Operation took ${Date.now() - start}ms`);
```

### 3. Include Request IDs

```typescript
// Automatically included in createLogger()
const logger = createLogger(req);

// Manually add to services
const serviceLogger = createServiceLogger('MyService', { requestId });
```

### 4. Log Errors with Context

```typescript
// Good
logger.error('Failed to create user', error, {
  email: userInput.email,
  plan: userInput.plan
});

// Avoid
console.error('Failed to create user:', error.message);
```

### 5. Use Appropriate Log Levels

```typescript
// Debug: Detailed flow info
logger.debug('Processing request step', { step: 'validation' });

// Info: Important business events
logger.info('User created account', { userId, plan });

// Warn: Recoverable issues
logger.warn('Rate limit approaching', { currentCount: 98, limit: 100 });

// Error: Failures
logger.error('Payment processing failed', error, { userId, amount });
```

## Viewing Logs in Supabase

1. Go to your Supabase project
2. Navigate to **Edge Functions** → **Logs**
3. Use the search bar to filter by:
   - Function name: `function:"stream-agent"`
   - Request ID: `requestId:"req-abc-123"`
   - User ID: `userId:"user-456"`
   - Log level: `level:"error"`
   - Error messages: `message:"authentication"`

## Migration from console.log

### Before

```typescript
console.error('[stream-agent] Function invoked');
console.error('[stream-agent] User authenticated:', user.id);
console.error('[stream-agent] Error:', error.message);
```

### After

```typescript
const logger = createLogger(req, { function: 'stream-agent' });
logger.info('Function invoked');
logger.info('User authenticated', { userId: user.id });
logger.error('Function error', error);
```

## Advanced Usage

### Custom Loggers

```typescript
// Create specialized logger for streaming
const streamLogger = logger.child({
  component: 'sse_stream',
  threadId,
  messageId
});

// Create logger for background jobs
const jobLogger = createServiceLogger('BackgroundJob', {
  jobId,
  jobType: 'email-sending'
});
```

### Error Tracking

```typescript
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed', error, {
    operation: 'riskyOperation',
    userId: user.id,
    retryable: true
  });

  // Add to monitoring/alerting
  if (error instanceof CriticalError) {
    await alertTeam(error, logger.context);
  }
}
```

### Performance Monitoring

```typescript
const performanceLogger = createServiceLogger('PerformanceMonitor');

// Track database performance
const dbResult = await withTiming(
  performanceLogger.child({ operation: 'database_query' }),
  'user profile fetch',
  () => userProfileRepository.findById(userId)
);

// Track external API calls
const apiResult = await withTiming(
  performanceLogger.child({ operation: 'external_api' }),
  'OpenAI API call',
  () => openaiClient.chat.completions.create(params)
);
```

## Troubleshooting

### Logs Not Showing

1. **Check log level**: Make sure you're not filtering out your log level
2. **Verify function deployment**: Ensure functions are redeployed after logging changes
3. **Check time range**: Logs may take a few seconds to appear in Supabase UI

### Too Many Logs

1. **Reduce debug logs**: Use debug level only for detailed development info
2. **Use sampling**: Log every Nth event for high-frequency operations
3. **Adjust context**: Include only relevant context in log messages

### Performance Impact

1. **Async logging**: Logs are non-blocking in Deno
2. **Context size**: Keep context objects reasonably sized
3. **Log frequency**: Avoid logging in tight loops

## Example: Complete Function

```typescript
import { createLogger, withTiming } from '../lib/logger.ts';
import { authenticateUser } from '../services/authService.ts';

Deno.serve(async (req) => {
  const logger = createLogger(req, { function: 'user-profile' });

  if (req.method === 'OPTIONS') {
    logger.debug('CORS preflight');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    logger.info('Profile request received');

    // Authentication with timing
    const authResult = await withTiming(
      logger.child({ operation: 'authentication' }),
      'user authentication',
      () => authenticateUser(req.headers.get('Authorization'))
    );

    if (authResult.error) {
      logger.warn('Authentication failed', { error: authResult.error });
      return new Response(JSON.stringify({ error: authResult.error }), {
        status: 401,
        headers: corsHeaders
      });
    }

    logger.setContext({ userId: authResult.user.id });
    logger.info('User authenticated', { userId: authResult.user.id });

    // Business logic with timing
    const profile = await withTiming(
      logger.child({ operation: 'profile_fetch' }),
      'user profile retrieval',
      () => userProfileService.getById(authResult.user.id)
    );

    logger.complete('Profile request completed', {
      userId: profile.id,
      hasAvatar: !!profile.avatarUrl
    });

    return new Response(JSON.stringify({ data: profile }), {
      headers: corsHeaders
    });

  } catch (error) {
    logger.error('Profile request failed', error);
    return new Response(JSON.stringify({
      error: 'Internal server error'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});
```

This comprehensive logging system will help you debug issues faster and monitor your Edge Functions more effectively in the Supabase dashboard.