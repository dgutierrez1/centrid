/**
 * Claude API Client Service
 * Handles streaming communication with Anthropic Claude API
 * Replaces simulated agent execution with real Claude responses
 */

import { Readable } from 'node:stream';

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

export interface ContentBlock {
  type: 'text' | 'tool_use';
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, any>;
}

export interface ParsedResponse {
  textContent: string;
  toolCalls: Array<{
    id: string;
    name: string;
    input: Record<string, any>;
  }>;
  stopReason: 'end_turn' | 'tool_use' | 'max_tokens' | string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Stream Claude API and collect full response
 * Returns parsed content blocks with text and tool calls
 */
export async function* streamClaudeResponse(
  systemPrompt: string,
  messages: any[],
  tools: ToolDefinition[],
  options?: {
    maxTokens?: number;
    temperature?: number;
  }
): AsyncGenerator<any> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not set');
  }

  // Use Claude Haiku 4.5 - fastest lower-tier model, currently available
  const model = 'claude-haiku-4-5-20251001';

  const maxTokens = options?.maxTokens ?? 4096;
  const temperature = options?.temperature ?? 0.7;

  const requestBody = {
    model: model,
    max_tokens: maxTokens,
    temperature: temperature,
    system: systemPrompt,
    tools: tools.map(t => ({
      name: t.name,
      description: t.description,
      input_schema: t.input_schema,
    })),
    messages: messages.map(m => ({
      role: m.role,
      content: typeof m.content === 'string' ? m.content : m.content,
    })),
  };

  console.log('[ClaudeClient] Calling Claude API:', {
    model: requestBody.model,
    maxTokens,
    temperature,
    messagesCount: messages.length,
    toolsCount: tools.length,
  });

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[ClaudeClient] API error - Response not OK:', {
      status: response.status,
      statusText: response.statusText,
      errorTextLength: errorText.length,
      errorTextFirst500: errorText.substring(0, 500),
      model: requestBody.model,
      apiUrl: 'https://api.anthropic.com/v1/messages',
    });
    throw new Error(`Claude API error: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`);
  }

  const data = await response.json();

  console.log('[ClaudeClient] Received response:', {
    stopReason: data.stop_reason,
    contentBlocksCount: data.content.length,
    usage: data.usage,
  });

  // Yield each content block as it comes
  let accumulatedText = '';
  const toolCalls: Array<{ id: string; name: string; input: Record<string, any> }> = [];

  console.log('[ClaudeClient] Processing response content blocks:', {
    contentBlocksCount: data.content.length,
    stopReason: data.stop_reason,
  });

  if (data.content.length === 0) {
    console.warn('[ClaudeClient] WARNING: Claude returned empty content array!');
    console.log('[ClaudeClient] Full response:', JSON.stringify(data));
  }

  for (const block of data.content) {
    if (block.type === 'text') {
      // Yield text in chunks for streaming effect
      const text = block.text;
      console.log('[ClaudeClient] Yielding text block:', {
        textLength: text?.length || 0,
      });
      if (text) {
        accumulatedText += text;

        // Yield text in ~100 character chunks for realistic streaming
        let offset = 0;
        let chunkCount = 0;
        while (offset < text.length) {
          const chunk = text.substring(offset, offset + 100);
          chunkCount++;
          console.log('[ClaudeClient] Yielding text_chunk:', {
            chunkNumber: chunkCount,
            chunkLength: chunk.length,
          });
          yield {
            type: 'text_chunk',
            content: chunk,
          };
          offset += 100;
        }
      }
    } else if (block.type === 'tool_use') {
      // Yield tool call
      console.log('[ClaudeClient] Parsed tool call:', {
        toolId: block.id,
        toolName: block.name,
      });

      toolCalls.push({
        id: block.id,
        name: block.name,
        input: block.input || {},
      });

      yield {
        type: 'tool_call',
        toolCallId: block.id,
        toolName: block.name,
        toolInput: block.input || {},
      };
    }
  }

  // Yield completion with usage
  console.log('[ClaudeClient] Yielding completion event:', {
    accumulatedTextLength: accumulatedText.length,
    toolCallsCount: toolCalls.length,
    inputTokens: data.usage.input_tokens,
    outputTokens: data.usage.output_tokens,
    stopReason: data.stop_reason,
  });

  yield {
    type: 'completion',
    usage: {
      inputTokens: data.usage.input_tokens,
      outputTokens: data.usage.output_tokens,
    },
    stopReason: data.stop_reason,
  };

  return {
    textContent: accumulatedText,
    toolCalls,
    stopReason: data.stop_reason,
    usage: {
      inputTokens: data.usage.input_tokens,
      outputTokens: data.usage.output_tokens,
    },
  };
}

/**
 * Build messages array with tool results for next iteration
 * Used after tool execution to include results in next API call
 */
export function buildMessagesWithToolResults(
  messages: any[],
  assistantContent: any[],
  toolResults: Array<{ toolCallId: string; result: any }>
): any[] {
  // Add assistant message with all content blocks
  const newMessages = [...messages];

  newMessages.push({
    role: 'assistant',
    content: assistantContent,
  });

  // Add tool results from each tool call
  if (toolResults.length > 0) {
    newMessages.push({
      role: 'user',
      content: toolResults.map(tr => ({
        type: 'tool_result',
        tool_use_id: tr.toolCallId,
        content: typeof tr.result === 'string'
          ? tr.result
          : JSON.stringify(tr.result),
      })),
    });
  }

  return newMessages;
}

/**
 * Format tool definitions for Claude API
 * Converts from internal tool format to Claude tool_use format
 */
export function formatToolsForClaude(tools: any[]): ToolDefinition[] {
  return tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.input_schema,
  }));
}
