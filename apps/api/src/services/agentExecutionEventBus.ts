/**
 * Agent Execution Event Bus
 * In-memory pub/sub for execution updates with event buffering
 * Allows SSE endpoints to stream updates even if execution finished before connection
 */

export interface AgentExecutionEvent {
  type: string;
  requestId: string;
  timestamp: number;
  data: any;
}

class AgentExecutionEventBus {
  private listeners = new Map<string, Set<(event: AgentExecutionEvent) => void>>();
  private eventBuffer = new Map<string, AgentExecutionEvent[]>();
  private readonly BUFFER_SIZE = 1000; // Keep last 1000 events per request

  /**
   * Subscribe to execution updates for a specific request
   * Returns unsubscribe function
   *
   * NOTE: When subscribing, you should first get buffered events,
   * then subscribe to new ones
   */
  subscribe(requestId: string, callback: (event: AgentExecutionEvent) => void): () => void {
    if (!this.listeners.has(requestId)) {
      this.listeners.set(requestId, new Set());
    }

    this.listeners.get(requestId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const subscribers = this.listeners.get(requestId);
      if (subscribers) {
        subscribers.delete(callback);
        // Clean up empty sets
        if (subscribers.size === 0) {
          this.listeners.delete(requestId);
        }
      }
    };
  }

  /**
   * Emit event to all subscribers AND buffer it
   */
  emit(requestId: string, event: AgentExecutionEvent): void {
    // Buffer the event
    if (!this.eventBuffer.has(requestId)) {
      this.eventBuffer.set(requestId, []);
    }
    const buffer = this.eventBuffer.get(requestId)!;
    buffer.push(event);

    // Keep buffer size manageable (remove oldest if too large)
    if (buffer.length > this.BUFFER_SIZE) {
      buffer.shift();
    }

    // Emit to subscribers
    const subscribers = this.listeners.get(requestId);
    if (subscribers && subscribers.size > 0) {
      subscribers.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('[EventBus] Callback error:', error);
        }
      });
    }
  }

  /**
   * Get buffered events for a request
   * Use this to replay events when a client connects late
   */
  getBuffer(requestId: string): AgentExecutionEvent[] {
    return this.eventBuffer.get(requestId) || [];
  }

  /**
   * Clear buffer for a request (call when request completes and no one is watching)
   */
  clearBuffer(requestId: string): void {
    this.eventBuffer.delete(requestId);
  }

  /**
   * Get number of active subscriptions (for debugging)
   */
  getSubscriberCount(requestId: string): number {
    return this.listeners.get(requestId)?.size ?? 0;
  }

  /**
   * Get buffer size (for debugging)
   */
  getBufferSize(requestId: string): number {
    return this.eventBuffer.get(requestId)?.length ?? 0;
  }
}

// Singleton instance
export const agentExecutionEventBus = new AgentExecutionEventBus();
