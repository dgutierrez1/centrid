import { ToolCallService } from './toolCall.ts';
import { contextAssemblyService } from './contextAssembly.ts';
import { streamClaudeResponse, buildMessagesWithToolResults, formatToolsForClaude } from './claudeClient.ts';
import { agentToolCallRepository } from '../repositories/agentToolCall.ts';
import { messageRepository } from '../repositories/message.ts';
import { agentRequestRepository } from '../repositories/agentRequest.ts';
import { getAvailableTools, toolRequiresApproval } from '../config/tools.ts';
import type { ContentBlock } from '../types/agent.ts';

export interface PrimeContext {
  totalTokens: number;
  explicitFiles: any[];
  threadContext: any[];
  parentThreadSummary?: string;
  excluded?: any[];
}

/**
 * Agent Execution Service
 * Handles AI agent execution with SSE streaming and tool calls
 * ✅ STATELESS - All methods are static utility functions
 */
export class AgentExecutionService {
  /**
   * NEW: Execute agent by request ID (replaces executeStream)
   * Fetches request, message, and context - main entry point for streaming
   * NEW: Supports resuming from checkpoint for tool approval
   */
  static async *executeStreamByRequest(
    requestId: string,
    userId: string,
    options: { isResume?: boolean } = {}
  ): AsyncGenerator<any> {
    console.log('[AgentExecution] executeStreamByRequest started:', {
      requestId,
      userId,
    });

    // Fetch request
    console.log('[AgentExecution] Fetching request from DB:', requestId);
    const request = await agentRequestRepository.findById(requestId);

    console.log('[AgentExecution] Request fetched:', {
      requestId,
      found: !!request,
      status: request?.status,
      triggeringMessageId: request?.triggeringMessageId,
      requestUserId: request?.userId,
    });

    if (!request || request.userId !== userId) {
      const error = `Request not found or access denied. Found: ${!!request}, UserMatch: ${request?.userId === userId}`;
      console.error('[AgentExecution] ' + error);
      throw new Error(error);
    }

    // Fetch triggering message
    console.log('[AgentExecution] Fetching triggering message:', request.triggeringMessageId);
    const message = await messageRepository.findById(
      request.triggeringMessageId
    );

    console.log('[AgentExecution] Message fetched:', {
      triggeringMessageId: request.triggeringMessageId,
      found: !!message,
      messageId: message?.id,
    });

    if (!message) {
      const error = `Triggering message not found: ${request.triggeringMessageId}`;
      console.error('[AgentExecution] ' + error);
      throw new Error(error);
    }

    // Update request status
    console.log('[AgentExecution] Updating status to in_progress');
    await agentRequestRepository.update(requestId, {
      status: 'in_progress',
      progress: 0.1,
    });
    console.log('[AgentExecution] Status updated to in_progress');

    // ✅ BUILD PRIME CONTEXT - Integrated with ContextAssemblyService
    console.log('[AgentExecution] Building prime context for thread:', request.threadId);
    const primeContext = await contextAssemblyService.buildPrimeContext(
      request.threadId,
      message.content,
      userId
    );
    console.log('[AgentExecution] Prime context built:', {
      totalTokens: primeContext.totalTokens,
      explicitFilesCount: primeContext.explicitFiles.length,
      threadContextCount: primeContext.threadContext.length,
    });

    // Delegate to execution with request tracking
    yield* this.executeWithStreaming(
      request.threadId,
      message.id,
      message.content,
      primeContext,
      userId,
      requestId, // NEW: Pass requestId for tracking
      options // NEW: Pass options for resume support
    );
  }

  /**
   * Execute agent - simplified interface for route handlers
   * Fetches message and context internally
   */
  static async *executeStream(
    userId: string,
    threadId: string,
    messageId: string
  ): AsyncGenerator<any> {
    // Fetch message
    const message = await messageRepository.findById(messageId);
    if (!message || message.threadId !== threadId) {
      throw new Error('Message not found');
    }

    // ✅ BUILD PRIME CONTEXT - Using ContextAssemblyService
    const primeContext = await contextAssemblyService.buildPrimeContext(
      threadId,
      message.content,
      userId
    );

    // Delegate to main execution method
    yield* this.executeWithStreaming(
      threadId,
      messageId,
      message.content,
      primeContext,
      userId
    );
  }

  /**
   * Updated: Execute with request tracking + checkpoint/resume
   * This is an async generator that yields events for the SSE stream
   * NEW: Supports resuming from checkpoint for tool approval workflow
   */
  static async *executeWithStreaming(
    threadId: string,
    messageId: string,
    userMessage: string,
    primeContext: PrimeContext,
    userId: string,
    requestId?: string, // NEW: Optional requestId for tracking
    options: { isResume?: boolean } = {} // NEW: Resume from checkpoint
  ): AsyncGenerator<any> {
    console.log('[AgentExecution] Starting agent execution with streaming:', {
      threadId,
      messageId,
      userId,
      requestId,
      isResume: options.isResume,
      userMessageLength: userMessage.length,
    });

    const systemPrompt = this.buildSystemPrompt(primeContext);
    const tools = this.getAvailableTools();

    console.log('[AgentExecution] Setup complete:', {
      systemPromptLength: systemPrompt.length,
      toolsCount: tools.length,
      isResume: options.isResume,
    });

    // NEW: Load checkpoint if resuming
    let messages: any[] = [];
    let accumulatedContent = '';
    let iterationCount = 0;
    let totalTokens = 0;
    const toolCallsList: any[] = [];
    let continueLoop = true;
    const maxIterations = 5;
    let revisionCount = 0;
    const maxRevisions = 3;

    if (options.isResume && requestId) {
      // Load from checkpoint
      console.log('[AgentExecution] Loading checkpoint for resume:', { requestId });
      const request = await agentRequestRepository.findById(requestId);
      if (request?.checkpoint) {
        const checkpoint = request.checkpoint as any;
        messages = checkpoint.conversationHistory || [];
        iterationCount = checkpoint.iterationCount || 0;
        accumulatedContent = checkpoint.accumulatedContent || '';

        console.log('[AgentExecution] Checkpoint loaded:', {
          messagesCount: messages.length,
          iterationCount,
          contentLength: accumulatedContent.length,
        });

        // NEW: Load tool result and add to messages
        // The tool was executed in /approve-tool, now we add the result so Claude can continue
        console.log('[AgentExecution] Loading approved tool result:', {
          requestId,
          checkpointToolCallId: checkpoint.lastToolCall?.id,
        });

        const latestToolCall = await agentToolCallRepository.findLatestByRequestId(requestId);
        if (latestToolCall?.approvalStatus === 'approved' && latestToolCall?.toolOutput) {
          console.log('[AgentExecution] Adding tool result to messages:', {
            toolCallId: latestToolCall.id,
            toolName: latestToolCall.toolName,
          });

          // Build tool result structure and add to messages
          messages = buildMessagesWithToolResults(
            messages,
            [
              {
                type: 'tool_use',
                id: latestToolCall.id,
                name: latestToolCall.toolName,
                input: latestToolCall.toolInput,
              },
            ],
            [
              {
                toolCallId: latestToolCall.id,
                result: latestToolCall.toolOutput,
              },
            ]
          );

          console.log('[AgentExecution] Tool result added, messages count:', messages.length);
        } else {
          console.warn('[AgentExecution] Expected approved tool call with result not found');
        }
      } else {
        console.warn('[AgentExecution] Checkpoint requested but not found, starting fresh');
        messages = [
          {
            role: 'user' as const,
            content: userMessage,
          },
        ];
      }
    } else {
      // Fresh start: Build messages array for multi-turn conversation
      messages = [
        {
          role: 'user' as const,
          content: userMessage,
        },
      ];
    }
    while (continueLoop && iterationCount < maxIterations) {
      iterationCount++;
      console.log('[AgentExecution] Starting iteration', {
        iterationCount,
        revisionCount,
        totalTokens,
        messagesCount: messages.length,
      });

      // ✅ REAL CLAUDE API INTEGRATION
      try {
        // Update progress - context assembly done
        if (requestId) {
          await agentRequestRepository.update(requestId, {
            progress: 0.2,
          });
        }

        // Stream response from Claude API with tools
        const claudeTools = this.getAvailableTools();
        const toolsFormatted = formatToolsForClaude(claudeTools);

        let iterationContent: ContentBlock[] = [];
        const iterationToolCalls: Array<{ toolId: string; name: string; input: any }> = [];

        console.log('[AgentExecution] Calling Claude API with', toolsFormatted.length, 'tools');

        // Call Claude API with streaming
        const generator = streamClaudeResponse(
          systemPrompt,
          messages,
          toolsFormatted,
          {
            maxTokens: 2000, // Claude Haiku supports up to 2048 output tokens
            temperature: 0.7,
          }
        );

        let claudeUsage = { inputTokens: 0, outputTokens: 0 };
        let stopReason = 'end_turn';

        console.log('[AgentExecution] Starting to collect events from Claude generator');

        // Collect all events from Claude
        let eventCountFromClaude = 0;
        try {
          for await (const event of generator) {
            eventCountFromClaude++;
            console.log('[AgentExecution] Received event from Claude:', {
              type: event.type,
              eventNumber: eventCountFromClaude,
              contentLength: event.content?.length || 0,
              hasContent: !!event.content || !!event.text,
            });

            if (event.type === 'text_chunk') {
              // Accumulate and yield text
              accumulatedContent += event.content;
              iterationContent.push({
                type: 'text',
                text: event.content,
              });
              console.log('[AgentExecution] Yielding text_chunk:', {
                contentLength: event.content.length,
                accumulatedLength: accumulatedContent.length,
              });
              yield event; // Yield to SSE stream
            } else if (event.type === 'tool_call') {
              // Track tool call for processing
              iterationToolCalls.push({
                toolId: event.toolCallId,
                name: event.toolName,
                input: event.toolInput,
              });
              iterationContent.push({
                type: 'tool_use',
                id: event.toolCallId,
                name: event.toolName,
                input: event.toolInput,
              });
            } else if (event.type === 'completion') {
              // Extract usage
              claudeUsage = event.usage || { inputTokens: 0, outputTokens: 0 };
              stopReason = event.stopReason;
              totalTokens += claudeUsage.outputTokens;
            }
          }
        } catch (generatorError) {
          console.error('[AgentExecution] Error iterating Claude generator:', {
            error: generatorError instanceof Error ? generatorError.message : String(generatorError),
            eventCountBeforeError: eventCountFromClaude,
            stack: generatorError instanceof Error ? generatorError.stack : undefined,
          });
          throw generatorError;
        }

        if (eventCountFromClaude === 0) {
          console.error('[AgentExecution] Claude generator yielded 0 events!', {
            iterationCount,
            systemPromptLength: systemPrompt.length,
            messagesCount: messages.length,
          });
        }

        console.log('[AgentExecution] Claude iteration complete:', {
          textLength: accumulatedContent.length,
          toolCallsCount: iterationToolCalls.length,
          stopReason,
          tokensUsed: claudeUsage.outputTokens,
        });

        // Update progress - reasoning done
        if (requestId) {
          await agentRequestRepository.update(requestId, {
            progress: 0.4,
          });
        }

        // No tool calls - Claude finished
        if (iterationToolCalls.length === 0) {
          console.log('[AgentExecution] No tool calls, conversation complete');
          continueLoop = false;
          yield { type: 'completion', usage: claudeUsage };
          break;
        }

        // Process first tool call only (system prompt ensures max 1 per response)
        const toolCall = iterationToolCalls[0];

        // Check if tool requires approval
        const requiresApproval = toolRequiresApproval(toolCall.name);

        console.log('[AgentExecution] Tool call detected:', {
          toolName: toolCall.name,
          requiresApproval,
          iterationCount,
        });

        if (!requiresApproval) {
          // AUTO-EXECUTE: Read-only tools execute immediately without approval
          console.log('[AgentExecution] Auto-executing read-only tool:', {
            toolName: toolCall.name,
            iterationCount,
          });

          try {
            const toolResult = await this.executeTool(
              toolCall.name,
              toolCall.input,
              threadId,
              userId
            );

            console.log('[AgentExecution] Tool executed successfully:', {
              toolName: toolCall.name,
              resultLength: JSON.stringify(toolResult).length,
            });

            // Add tool result to messages
            messages.push({
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: toolCall.name + '_auto_' + Date.now(),
                  content: JSON.stringify(toolResult),
                },
              ],
            });

            // Continue loop - Claude will process the result
            console.log('[AgentExecution] Continuing execution with tool result');
            continueLoop = true;
            // Continue to next while iteration
          } catch (toolError) {
            console.error('[AgentExecution] Error executing tool:', {
              toolName: toolCall.name,
              error: toolError instanceof Error ? toolError.message : String(toolError),
            });

            yield {
              type: 'error',
              message: `Failed to execute tool ${toolCall.name}: ${
                toolError instanceof Error ? toolError.message : String(toolError)
              }`,
            };

            continueLoop = false;
            break;
          }
        } else {
          // APPROVAL REQUIRED: Save checkpoint and wait for user
          // Create tool call record in database
          const toolCallId = await this.createToolCall(
            threadId,
            messageId,
            { name: toolCall.name, input: toolCall.input },
            userId,
            requestId
          );

          // Save checkpoint for resume
          if (requestId) {
            const checkpoint = {
              conversationHistory: messages,
              lastToolCall: {
                id: toolCallId,
                name: toolCall.name,
                input: toolCall.input,
              },
              iterationCount,
              accumulatedContent,
              status: 'awaiting_approval',
            };

            console.log('[AgentExecution] Saving checkpoint for approval-required tool:', {
              requestId,
              toolCallId,
              toolName: toolCall.name,
              iterationCount,
            });

            await agentRequestRepository.update(requestId, {
              checkpoint,
            });
          }

          // Yield tool call for user approval
          yield {
            type: 'tool_call',
            toolCallId,
            toolName: toolCall.name,
            toolInput: toolCall.input,
            approval_required: true,
            revision_count: revisionCount,
          };

          console.log('[AgentExecution] Approval-required tool call emitted, waiting for user:', {
            toolCallId,
            toolName: toolCall.name,
            requestId,
          });

          // Return immediately - /approve-tool endpoint will call /execute (resume)
          continueLoop = false;
          break;
        }

        // Continue loop to get Claude's next response with tool results
      } catch (error) {
        console.error('[AgentExecution] Error during Claude API call:', error);
        yield {
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
        continueLoop = false;
        break;
      }
    }

    // NEW: Save assistant message at stream end (Phase 3 - MVU B3.2)
    if (requestId) {
      try {
        // Build content as ContentBlock array
        const content: ContentBlock[] = [
          {
            type: 'text',
            text: accumulatedContent || 'Request processing completed.',
          },
        ];

        // Create assistant message with content blocks
        const assistantMessage = await messageRepository.create({
          threadId: threadId,
          ownerUserId: userId,
          role: 'assistant',
          content: content,
          toolCalls: toolCallsList,
          tokensUsed: totalTokens,
        });

        console.log(
          '[AgentExecution] Created assistant message:',
          assistantMessage.id
        );

        // Update request with response message and final status
        await agentRequestRepository.update(requestId, {
          status: 'completed',
          progress: 1.0,
          responseMessageId: assistantMessage.id,
          tokenCost: totalTokens,
          results: {
            filesCreated: toolCallsList
              .filter((t) => t.toolName === 'write_file' && t.approved)
              .map((t) => t.toolInput.path),
            branchesCreated: toolCallsList.filter(
              (t) => t.toolName === 'create_branch' && t.approved
            ).length,
            toolsExecuted: toolCallsList.length,
            toolsApproved: toolCallsList.filter((t) => t.approved).length,
          },
          completedAt: new Date().toISOString(),
        });

        // NEW: Update all tool calls to link to message (Phase 3 - MVU B3.3)
        await agentToolCallRepository.updateMessageIdForRequest(
          requestId,
          assistantMessage.id
        );

        console.log('[AgentExecution] Updated request and tool calls:', {
          requestId,
          messageId: assistantMessage.id,
        });
      } catch (error) {
        console.error('[AgentExecution] Failed to save assistant message:', error);

        // Mark request as failed
        await agentRequestRepository.update(requestId, {
          status: 'failed',
          progress: 1.0,
          completedAt: new Date().toISOString(),
          results: {
            error: error instanceof Error ? error.message : String(error),
          },
        });
      }
    }

  }

  /**
   * Get available tools for agent
   */
  private static getAvailableTools() {
    // Use centralized tool config instead of hardcoded definitions
    return getAvailableTools();
  }

  /**
   * Create tool call record in database
   * ✅ Links to requestId (not messageId yet - set later)
   */
  private static async createToolCall(
    threadId: string,
    messageId: string,
    toolCall: { name: string; input: Record<string, any> },
    userId: string,
    requestId?: string // NEW: Optional requestId for tracking
  ): Promise<string> {
    const record = await agentToolCallRepository.create({
      messageId,
      threadId,
      ownerUserId: userId,
      toolName: toolCall.name,
      toolInput: toolCall.input,
      requestId: requestId || null, // NEW: Link to request
    });

    console.log('[AgentExecution] Created tool call:', {
      toolCallId: record.id,
      requestId: requestId,
      toolName: toolCall.name,
    });

    return record.id;
  }

  /**
   * Pause and wait for tool call approval
   * Uses ToolCallService.waitForApproval (stateless)
   */
  private static async pauseForApproval(
    toolCallId: string,
    userId: string,
    timeout: number = 600000
  ): Promise<{ approved: boolean; reason?: string }> {
    // Call static method directly
    const approval = await ToolCallService.waitForApproval(
      toolCallId,
      timeout
    );

    // Fetch rejection reason if rejected
    if (!approval.approved && !approval.reason) {
      const toolCall = await agentToolCallRepository.findById(toolCallId);
      if (toolCall?.rejectionReason) {
        approval.reason = toolCall.rejectionReason;
      }
    }

    return approval;
  }

  /**
   * Execute approved tool
   * ✅ ALL 5 TOOLS IMPLEMENTED HERE
   * Uses static ToolCallService methods
   * NEW: Public method so it can be called from approval endpoint
   */
  static async executeTool(
    toolName: string,
    toolInput: Record<string, any>,
    threadId: string,
    userId: string
  ): Promise<any> {
    switch (toolName) {
      case 'write_file':
        return await ToolCallService.executeWriteFile(
          toolInput.path,
          toolInput.content,
          threadId,
          userId,
          true
        );

      case 'create_branch':
        return await ToolCallService.executeCreateBranch(
          toolInput.title,
          toolInput.contextFiles || [],
          threadId,
          userId,
          true
        );

      case 'search_files':
        return await ToolCallService.executeSearchFiles(
          toolInput.query,
          userId
        );

      case 'read_file':
        return await ToolCallService.executeReadFile(
          toolInput.path,
          userId
        );

      case 'list_directory':
        return await ToolCallService.executeListDirectory(
          toolInput.path,
          userId
        );

      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  }

  /**
   * Approve or reject a tool call
   * Called from the approve-tool endpoint
   */
  static async approveTool(
    userId: string,
    toolCallId: string,
    approved: boolean,
    reason?: string
  ): Promise<void> {
    // Verify tool call exists and user owns it
    const toolCall = await agentToolCallRepository.findById(toolCallId);
    if (!toolCall || toolCall.ownerUserId !== userId) {
      throw new Error('Tool call not found or access denied');
    }

    if (approved) {
      await agentToolCallRepository.updateStatus(toolCallId, 'approved');
    } else {
      await agentToolCallRepository.rejectWithRevisionTracking(toolCallId, reason);
    }
  }

  /**
   * Build system prompt from prime context
   * NEW: Added tool guidance for sequential approval workflow
   */
  private static buildSystemPrompt(primeContext: PrimeContext): string {
    let prompt = 'You are an AI assistant helping with a conversation thread.\n\n';

    // NEW: Add tool guidance for sequential approvals
    prompt += '### Tool Usage Guidelines:\n';
    prompt += 'When you need to use tools:\n';
    prompt += '- Suggest ONE tool at a time\n';
    prompt += '- Wait for the result before suggesting the next tool\n';
    prompt += '- Use the result to inform your next decision\n';
    prompt += 'This ensures each action is reviewed and approved individually.\n\n';

    if (primeContext.explicitFiles?.length > 0) {
      prompt += '### Explicit Context:\n';
      primeContext.explicitFiles.forEach(f => {
        prompt += `- ${f.title || f.path}\n`;
      });
      prompt += '\n';
    }

    if (primeContext.threadContext?.length > 0) {
      prompt += '### Thread History:\n';
      primeContext.threadContext.forEach(t => {
        prompt += `- ${t.title || t.id}\n`;
      });
      prompt += '\n';
    }

    return prompt;
  }
}
