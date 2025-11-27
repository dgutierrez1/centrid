/**
 * Structured Logger Utility
 * Provides module-scoped loggers with automatic request context
 */

import { AsyncLocalStorage } from 'node:async_hooks';

// ============================================================================
// Types
// ============================================================================

interface LogContext {
  requestId?: string;
  userId?: string;
  path?: string;
  method?: string;
}

interface LogData {
  [key: string]: any;
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// ============================================================================
// AsyncLocalStorage for Request Context
// ============================================================================

const asyncLocalStorage = new AsyncLocalStorage<LogContext>();

/**
 * Set request context for all loggers in current async scope
 * Called by request middleware
 */
export function setRequestContext(context: LogContext): void {
  asyncLocalStorage.enterWith(context);
}

/**
 * Get current request context from AsyncLocalStorage
 */
function getRequestContext(): LogContext {
  return asyncLocalStorage.getStore() || {};
}

// ============================================================================
// Logger Implementation
// ============================================================================

class Logger {
  private module: string;
  private additionalContext: Record<string, any>;

  constructor(module: string, additionalContext: Record<string, any> = {}) {
    this.module = module;
    this.additionalContext = additionalContext;
  }

  /**
   * Core logging method - outputs structured JSON
   */
  private log(level: LogLevel, message: string, data?: LogData): void {
    const context = getRequestContext();

    const logEntry = {
      level,
      module: this.module,
      message,
      ...context,
      ...this.additionalContext,
      ...data,
      timestamp: new Date().toISOString(),
    };

    // In Deno/Edge Functions, console.log is captured by runtime
    // Output as JSON for structured logging
    if (level === 'error') {
      console.error(JSON.stringify(logEntry));
    } else {
      console.log(JSON.stringify(logEntry));
    }
  }

  /**
   * Log info level messages
   */
  info(message: string, data?: LogData): void {
    this.log('info', message, data);
  }

  /**
   * Log error level messages with proper error serialization
   */
  error(message: string, error?: Error | any): void {
    const errorData: LogData = {};

    if (error) {
      if (error instanceof Error) {
        errorData.error = {
          name: error.name,
          message: error.message,
          stack: error.stack,
        };
      } else if (typeof error === 'object') {
        errorData.error = error;
      } else {
        errorData.error = String(error);
      }
    }

    this.log('error', message, errorData);
  }

  /**
   * Log warning level messages
   */
  warn(message: string, data?: LogData): void {
    this.log('warn', message, data);
  }

  /**
   * Log debug level messages (only in development)
   */
  debug(message: string, data?: LogData): void {
    // Check LOG_LEVEL env var or default to debug in development
    const logLevel = Deno?.env?.get('LOG_LEVEL') || 'info';
    if (logLevel === 'debug') {
      this.log('debug', message, data);
    }
  }

  /**
   * Create a child logger with additional context
   * Useful for operations that need extra context
   */
  child(context: Record<string, any>): Logger {
    return new Logger(this.module, {
      ...this.additionalContext,
      ...context,
    });
  }

  /**
   * Log with timing - useful for performance monitoring
   */
  async withTiming<T>(
    operation: string,
    fn: () => Promise<T>,
    data?: LogData
  ): Promise<T> {
    const startTime = performance.now();

    try {
      this.debug(`${operation} started`, data);
      const result = await fn();

      const duration = performance.now() - startTime;
      this.info(`${operation} completed`, {
        ...data,
        duration: Math.round(duration),
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.log('error', `${operation} failed`, {
        error: error instanceof Error
          ? { name: error.name, message: error.message, stack: error.stack }
          : error,
        ...data,
        duration: Math.round(duration),
      });
      throw error;
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a module-scoped logger
 * @param module - Module name (e.g., 'routes/threads', 'ThreadService')
 * @returns Logger instance for the module
 *
 * @example
 * ```typescript
 * import { createLogger } from '@/utils/logger';
 *
 * const logger = createLogger('ThreadService');
 *
 * logger.info('Thread created', { threadId: '123' });
 * logger.error('Failed to create thread', error);
 * ```
 */
export function createLogger(module: string): Logger {
  return new Logger(module);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Run a function with a specific request context
 * Useful for background jobs or operations outside normal request flow
 */
export async function withRequestContext<T>(
  context: LogContext,
  fn: () => Promise<T>
): Promise<T> {
  return asyncLocalStorage.run(context, fn);
}

/**
 * Format bytes for logging
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format duration for logging
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}