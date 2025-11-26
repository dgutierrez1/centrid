import { streamClaudeResponse, buildMessagesWithToolResults } from './claudeClient.ts';
import type { ContentBlock } from '../types/graphql.ts';
import { createLogger } from '../utils/logger.ts';

const logger = createLogger('ExecutionLoop');

export interface ExecutionState {
  messages: any[]; // Claude-formatted messages
  iteration: number;
  maxIterations: number;
  totalTokens: number;
  accumulatedText: string;
  toolCallsList: Array<{
    id: string;
    toolName: string;
    toolInput: any;
    approved: boolean;
  }>;
  shouldContinue: boolean;
}

export interface IterationResult {
  contentBlocks: ContentBlock[];
  toolCalls: Array<{
    toolId: string;
    name: string;
    input: any;
  }>;
  stopReason: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface IterationConfig {
  systemPrompt: string;
  tools: any[];
  maxTokens?: number;
  temperature?: number;
}

/**
 * ExecutionLoop Service
 *
 * Handles the core iteration logic for agent execution.
 * Calls Claude API and processes responses in a clean, focused loop.
 *
 * Key responsibilities:
 * - Create and manage execution state
 * - Run single Claude API iteration
 * - Process streaming responses
 * - Determine loop continuation
 * - Add tool results to conversation
 *
 * EVENT-DRIVEN ARCHITECTURE:
 * This service yields events that are consumed by AgentRequestService and persisted
 * to agent_execution_events table for real-time streaming to frontend.
 *
 * Events emitted:
 * - content_block_delta: Text chunk with accumulated text (replaces text_chunk)
 * - tool_call: Tool invocation detected
 * - completion: Iteration finished
 *
 * Frontend subscribes to agent_execution_events for real-time updates during execution.
 * Messages table is updated at milestones (iteration end, tool approval) for final state.
 */
export class ExecutionLoop {
  /**
   * Create initial execution state
   */
  createInitialState(
    messages: any[],
    accumulatedText: string = '',
    toolCallsList: any[] = []
  ): ExecutionState {
    return {
      messages,
      iteration: 0,
      maxIterations: 5,
      totalTokens: 0,
      accumulatedText,
      toolCallsList,
      shouldContinue: true,
    };
  }

  /**
   * Check if execution should continue
   */
  shouldContinue(state: ExecutionState): boolean {
    return state.shouldContinue && state.iteration < state.maxIterations;
  }

  /**
   * Run single Claude API iteration
   *
   * Calls Claude API with streaming, collects all events, returns structured result.
   * Yields events for real-time updates (text chunks, tool calls, etc.)
   */
  async *runIteration(
    state: ExecutionState,
    config: IterationConfig
  ): AsyncGenerator<any, IterationResult> {
    state.iteration++;

    logger.info('Starting iteration', {
      iteration: state.iteration,
      messagesCount: state.messages.length,
      totalTokens: state.totalTokens,
    });

    const contentBlocks: ContentBlock[] = [];
    const toolCalls: Array<{ toolId: string; name: string; input: any }> = [];
    let stopReason = 'end_turn';
    let usage = { inputTokens: 0, outputTokens: 0 };

    try {
      // Call Claude API with streaming
      const generator = streamClaudeResponse(
        config.systemPrompt,
        state.messages,
        config.tools,
        {
          maxTokens: config.maxTokens || 2000,
          temperature: config.temperature || 0.7,
        }
      );

      // Collect all events from Claude
      for await (const event of generator) {
        if (event.type === 'text_chunk') {
          // Accumulate text
          state.accumulatedText += event.content;

          contentBlocks.push({
            type: 'text',
            text: event.content,
          });

          // Yield enhanced event for streaming (with full accumulated text)
          yield {
            type: 'content_block_delta',
            delta: event.content,
            accumulatedText: state.accumulatedText,
          };
        } else if (event.type === 'tool_call') {
          // Track tool call
          toolCalls.push({
            toolId: event.toolCallId,
            name: event.toolName,
            input: event.toolInput,
          });

          contentBlocks.push({
            type: 'tool_use',
            id: event.toolCallId,
            name: event.toolName,
            input: event.toolInput,
          });
        } else if (event.type === 'completion') {
          // Extract usage and stop reason
          usage = event.usage || { inputTokens: 0, outputTokens: 0 };
          stopReason = event.stopReason;
          state.totalTokens += usage.outputTokens;
        }
      }

      logger.info('Iteration complete', {
        iteration: state.iteration,
        contentBlocksCount: contentBlocks.length,
        toolCallsCount: toolCalls.length,
        stopReason,
        tokensUsed: usage.outputTokens,
      });

      return {
        contentBlocks,
        toolCalls,
        stopReason,
        usage,
      };
    } catch (error) {
      logger.error('Iteration failed', {
        iteration: state.iteration,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * Add tool results to conversation state
   *
   * Uses buildMessagesWithToolResults to properly pair tool_use and tool_result blocks.
   */
  addToolResults(
    state: ExecutionState,
    contentBlocks: ContentBlock[],
    toolResults: Array<{ toolCallId: string; result: any }>
  ): void {
    logger.info('Adding tool results to conversation', {
      toolResultsCount: toolResults.length,
    });

    // Use helper to build messages with proper tool_use/tool_result pairing
    state.messages = buildMessagesWithToolResults(
      state.messages,
      contentBlocks,
      toolResults
    );

    logger.info('Tool results added', {
      messagesCount: state.messages.length,
    });
  }

  /**
   * Mark execution as complete (stop loop)
   */
  complete(state: ExecutionState): void {
    state.shouldContinue = false;
    logger.info('Execution marked as complete', {
      iteration: state.iteration,
      totalTokens: state.totalTokens,
    });
  }

  /**
   * Add approved tool call to tracking list
   */
  trackToolCall(
    state: ExecutionState,
    toolCallId: string,
    toolName: string,
    toolInput: any,
    approved: boolean
  ): void {
    state.toolCallsList.push({
      id: toolCallId,
      toolName,
      toolInput,
      approved,
    });
  }
}

export const executionLoop = new ExecutionLoop();
