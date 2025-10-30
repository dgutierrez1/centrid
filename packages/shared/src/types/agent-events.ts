/**
 * Agent Execution Event Types
 *
 * These events are emitted during agent execution and persisted to agent_execution_events table.
 * They enable real-time streaming, recovery, and tool approval workflows.
 */

/** Tool call requires user approval */
export interface ToolCallEvent {
  type: 'tool_call'
  data: {
    toolCallId: string
    toolName: string
    toolInput: Record<string, any>
  }
}

/** Tool execution result (sent back to agent) */
export interface ToolResultEvent {
  type: 'tool_result'
  data: {
    toolCallId: string
    toolName: string
    output: string
    executionTimeMs: number
  }
}

/** Text chunk from agent response */
export interface TextChunkEvent {
  type: 'text_chunk'
  data: {
    content: string
  }
}

/** Context assembled and ready */
export interface ContextReadyEvent {
  type: 'context_ready'
  data: {
    documentCount: number
    contextSize: number
    tokens: number
  }
}

/** Agent execution completed */
export interface CompletionEvent {
  type: 'completion'
  data: {
    messageId: string
    totalTokens: number
    executionTimeMs: number
  }
}

/** Execution error occurred */
export interface ErrorEvent {
  type: 'error'
  data: {
    message: string
    code?: string
  }
}

/** Union of all agent execution events */
export type AgentExecutionEvent =
  | ToolCallEvent
  | ToolResultEvent
  | TextChunkEvent
  | ContextReadyEvent
  | CompletionEvent
  | ErrorEvent

/** Event with metadata as stored in database */
export interface AgentExecutionEventRecord {
  id: string
  request_id: string
  type: string
  data: Record<string, any>
  created_at: string
}

/** Tool call pending approval */
export interface PendingToolCall {
  id: string
  requestId: string
  toolName: string
  toolInput: Record<string, any>
  status: 'pending'
  createdAt: Date
}
