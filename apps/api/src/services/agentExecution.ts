import { ToolCallService } from "./toolCall.ts";
import { contextAssemblyService } from "./contextAssembly.ts";
import { messageRepository } from "../repositories/message.ts";
import { agentRequestRepository } from "../repositories/agentRequest.ts";
import { agentToolCallRepository } from "../repositories/agentToolCall.ts";
import { getAvailableTools } from "../config/tools.ts";
import type { ContentBlock } from "../types/graphql.ts";
import { MessageOrchestrator } from "./messageOrchestrator.ts";
import { ConversationLoader } from "./conversationLoader.ts";
import { ToolExecutionHandler } from "./toolExecutionHandler.ts";
import { ExecutionLoop } from "./executionLoop.ts";
import { createLogger } from "../utils/logger.ts";

const logger = createLogger("AgentExecution");

/**
 * Extract text from ContentBlock[] (handles both string and ContentBlock[] content)
 */
function extractTextFromContent(content: ContentBlock[] | string): string {
  if (typeof content === 'string') return content;
  return content
    .filter(block => block.type === 'text')
    .map(block => ('text' in block ? block.text : '') ?? '')
    .join('\n');
}

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
 *
 * EVENT-DRIVEN STREAMING ARCHITECTURE:
 * This service yields events during execution that are persisted to agent_execution_events
 * table and consumed by frontend for real-time updates.
 *
 * Event Flow:
 * 1. Backend: executeWithStreaming() yields events (content_block_delta, tool_call, etc.)
 * 2. Backend: AgentRequestService.executeRequest() persists events to agent_execution_events table
 * 3. Backend: Supabase Realtime broadcasts events to subscribed clients
 * 4. Frontend: useAgentStreaming() receives events and updates Valtio state
 * 5. Frontend: Message component reactively renders based on state changes
 *
 * Events emitted:
 * - content_block_delta: Progressive text updates with full accumulated text
 * - tool_call: Tool requires user approval (execution pauses)
 * - tool_result_complete: Auto-executed tool finished successfully
 * - message_complete: Final message state with all content blocks
 * - completion: Execution finished (legacy, for backward compatibility)
 * - error: Execution failed
 *
 * Message Persistence Strategy:
 * - Messages table updated at MILESTONES (not every chunk):
 *   1. When iteration completes without tools
 *   2. When tool requires approval (with text + tool_use block)
 *   3. When tool execution completes (add tool_result block)
 * - This keeps database writes low while agent_execution_events provides real-time feedback
 * - On page refresh, frontend loads final state from messages table
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
    logger.info("executeStreamByRequest started", { requestId, userId });

    // Fetch request
    const request = await agentRequestRepository.findById(requestId);

    if (!request || request.userId !== userId) {
      logger.error("Request not found or access denied", {
        requestId,
        found: !!request,
      });
      throw new Error("Request not found or access denied");
    }

    // Fetch triggering message
    const message = await messageRepository.findById(
      request.triggeringMessageId
    );

    if (!message) {
      logger.error("Triggering message not found", {
        triggeringMessageId: request.triggeringMessageId,
      });
      throw new Error(
        `Triggering message not found: ${request.triggeringMessageId}`
      );
    }

    // Update request status
    await agentRequestRepository.update(requestId, {
      status: "in_progress",
      progress: 0.1,
    });

    // Extract text from ContentBlock[] for context building
    const messageText = extractTextFromContent(message.content);

    // Build prime context
    const primeContext = await contextAssemblyService.buildPrimeContext(
      request.threadId,
      messageText,
      userId
    );

    logger.info("Prime context built", {
      totalTokens: primeContext.totalTokens,
      explicitFilesCount: primeContext.explicitFiles.length,
    });

    // Delegate to execution with request tracking
    yield* this.executeWithStreaming(
      request.threadId,
      message.id,
      messageText,
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
      throw new Error("Message not found");
    }

    // Extract text from ContentBlock[] for context building
    const messageText = extractTextFromContent(message.content);

    // ✅ BUILD PRIME CONTEXT - Using ContextAssemblyService
    const primeContext = await contextAssemblyService.buildPrimeContext(
      threadId,
      messageText,
      userId
    );

    // Delegate to main execution method
    yield* this.executeWithStreaming(
      threadId,
      messageId,
      messageText,
      primeContext,
      userId
    );
  }

  /**
   * REFACTORED: Clean execution flow using service classes
   * This is an async generator that yields events for the SSE stream
   * Supports resuming after tool approval workflow
   */
  static async *executeWithStreaming(
    threadId: string,
    messageId: string,
    userMessage: string,
    primeContext: PrimeContext,
    userId: string,
    requestId?: string,
    options: { isResume?: boolean } = {}
  ): AsyncGenerator<any> {
    if (!requestId) {
      throw new Error("requestId is required for execution");
    }

    logger.info("Starting agent execution", {
      threadId,
      requestId,
      isResume: options.isResume,
    });

    // Initialize services
    const messageOrchestrator = new MessageOrchestrator();
    const conversationLoader = new ConversationLoader();
    const toolHandler = new ToolExecutionHandler();
    const loop = new ExecutionLoop();

    try {
      // 1. Get or create response message (idempotent)
      const responseMessage =
        await messageOrchestrator.getOrCreateResponseMessage(
          requestId,
          threadId,
          userId
        );

      logger.info("Response message ready", {
        messageId: responseMessage.id,
        isNew: responseMessage.isNew,
      });

      // 2. Load conversation state (handles resume automatically)
      const conversationState = await conversationLoader.loadConversation(
        threadId,
        requestId
      );

      logger.info("Conversation loaded", {
        messagesCount: conversationState.messages.length,
        isResume: conversationState.isResume,
      });

      // 3. Create execution state
      const state = loop.createInitialState(
        conversationState.messages,
        conversationState.accumulatedText,
        conversationState.toolCallsList
      );

      // 4. Build system prompt and get tools
      const systemPrompt = this.buildSystemPrompt(primeContext);
      const tools = this.getAvailableTools();

      // Update progress
      await agentRequestRepository.update(requestId, { progress: 0.2 });

      // 5. Run execution loop with max iteration safety limit
      const MAX_ITERATIONS = 10; // Support complex multi-step tasks

      while (loop.shouldContinue(state)) {
        // Check iteration limit first (safety net)
        if (state.iteration > MAX_ITERATIONS) {
          logger.warn("Max iterations reached", {
            iteration: state.iteration,
            requestId,
            toolsExecuted: state.toolCallsList.length,
          });

          yield {
            type: "warning",
            message: `Reached maximum of ${MAX_ITERATIONS} steps. Task may be incomplete.`,
          };

          // Finalize and complete
          await messageOrchestrator.finalizeMessage(
            responseMessage.id,
            state.toolCallsList,
            state.totalTokens
          );

          await agentRequestRepository.update(requestId, {
            status: "completed",
            progress: 1.0,
            completedAt: new Date().toISOString(),
            results: {
              maxIterationsReached: true,
              toolsExecuted: state.toolCallsList.length,
            },
          });

          // Fetch final message state
          const finalMessage = await messageRepository.findById(
            responseMessage.id
          );

          // Yield message_complete event with final state
          yield {
            type: "message_complete",
            messageId: responseMessage.id,
            content: finalMessage?.content || [],
            toolCalls: state.toolCallsList,
            tokensUsed: state.totalTokens,
          };

          loop.complete(state);
          break;
        }

        logger.info("Starting iteration", {
          iteration: state.iteration,
          totalTokens: state.totalTokens,
        });

        // Run single iteration (yields text_chunk events)
        const result = yield* loop.runIteration(state, {
          systemPrompt,
          tools,
          maxTokens: 2000,
          temperature: 0.7,
        });

        // Enhanced logging for multi-step debugging
        logger.info("Iteration completed", {
          iteration: state.iteration,
          totalTokens: state.totalTokens,
          toolsExecutedSoFar: state.toolCallsList.length,
          toolCallsInThisIteration: result.toolCalls.length,
          lastToolName: result.toolCalls[0]?.name,
        });

        // Update progress with iteration tracking
        await agentRequestRepository.update(requestId, {
          progress: Math.min(0.4 + state.iteration * 0.1, 0.9),
        });

        // Handle completion (no tool calls)
        if (result.toolCalls.length === 0) {
          logger.info("No tool calls, completing execution");

          // Finalize message with accumulated content
          if (state.accumulatedText) {
            await messageOrchestrator.appendContent(responseMessage.id, [
              { type: "text", text: state.accumulatedText },
            ]);
            // FIX: Reset accumulated text after appending to prevent duplication
            state.accumulatedText = "";
          }

          await messageOrchestrator.finalizeMessage(
            responseMessage.id,
            state.toolCallsList,
            state.totalTokens
          );

          // Update request status
          await agentRequestRepository.update(requestId, {
            status: "completed",
            progress: 1.0,
            responseMessageId: responseMessage.id,
            tokenCost: state.totalTokens,
            results: {
              filesCreated: state.toolCallsList
                .filter((t) => t.toolName === "write_file" && t.approved)
                .map((t) => t.toolInput.path),
              branchesCreated: state.toolCallsList.filter(
                (t) => t.toolName === "create_branch" && t.approved
              ).length,
              toolsExecuted: state.toolCallsList.length,
              toolsApproved: state.toolCallsList.filter((t) => t.approved)
                .length,
            },
            completedAt: new Date().toISOString(),
          });

          // Fetch final message state with all content blocks
          const finalMessage = await messageRepository.findById(
            responseMessage.id
          );

          // Yield completion event
          yield {
            type: "completion",
            usage: result.usage,
            messageId: responseMessage.id,
            totalTokens: state.totalTokens,
          };

          // Yield message_complete event with full final message state
          yield {
            type: "message_complete",
            messageId: responseMessage.id,
            content: finalMessage?.content || [],
            toolCalls: state.toolCallsList,
            tokensUsed: state.totalTokens,
          };

          loop.complete(state);
          break;
        }

        // Handle tool call
        const toolCall = result.toolCalls[0];
        const toolExecutionResult = await toolHandler.handleToolCall(toolCall, {
          threadId,
          triggeringMessageId: messageId,        // User's message (function param)
          responseMessageId: responseMessage.id,  // Assistant's message
          userId,
          requestId,
        });

        if (toolExecutionResult.needsApproval) {
          // Tool needs approval - save message and pause
          logger.info("Tool requires approval, pausing execution", {
            toolCallId: toolExecutionResult.toolCallId,
            toolName: toolCall.name,
          });

          // Append content to message (text + tool_use block)
          const contentToAppend: ContentBlock[] = [];

          if (state.accumulatedText) {
            contentToAppend.push({
              type: "text",
              text: state.accumulatedText,
            });
          }

          contentToAppend.push({
            type: "tool_use",
            id: toolExecutionResult.toolCallId!,
            name: toolCall.name,
            input: toolCall.input,
          });

          await messageOrchestrator.appendContent(
            responseMessage.id,
            contentToAppend
          );

          // FIX: Reset accumulated text after appending to prevent duplication on resume
          state.accumulatedText = "";

          // Track tool call
          loop.trackToolCall(
            state,
            toolExecutionResult.toolCallId!,
            toolCall.name,
            toolCall.input,
            false
          );

          // Finalize message with pending tool
          await messageOrchestrator.finalizeMessage(
            responseMessage.id,
            state.toolCallsList,
            state.totalTokens
          );

          // Yield tool_call event
          yield {
            type: "tool_call",
            toolCallId: toolExecutionResult.toolCallId,
            toolName: toolCall.name,
            toolInput: toolCall.input,
            approval_required: true,
            responseMessageId: responseMessage.id,
          };

          // Pause and wait for approval
          loop.complete(state);
          break;
        } else {
          // Tool auto-executed - add result and continue
          logger.info("Tool auto-executed, continuing", {
            toolCallId: toolExecutionResult.toolCallId,
            toolName: toolCall.name,
            accumulatedTextBefore: state.accumulatedText.substring(0, 50),
          });

          // Persist text + tool_use block to database before continuing
          const contentToAppend: ContentBlock[] = [];
          if (state.accumulatedText) {
            contentToAppend.push({
              type: "text",
              text: state.accumulatedText,
            });
          }
          contentToAppend.push({
            type: "tool_use",
            id: toolExecutionResult.toolCallId!,
            name: toolCall.name,
            input: toolCall.input,
          });
          await messageOrchestrator.appendContent(
            responseMessage.id,
            contentToAppend
          );

          // Reset accumulated text to prevent duplication in next iteration
          state.accumulatedText = "";

          // Track tool call
          loop.trackToolCall(
            state,
            toolExecutionResult.toolCallId!,
            toolCall.name,
            toolCall.input,
            true
          );

          // Add tool result to conversation
          loop.addToolResults(state, result.contentBlocks, [
            {
              toolCallId: toolCall.toolId,
              result: toolExecutionResult.result,
            },
          ]);

          // Persist tool_result block to database
          await messageOrchestrator.appendContent(responseMessage.id, [
            {
              type: "tool_result",
              tool_use_id: toolCall.toolId,
              content:
                typeof toolExecutionResult.result === "string"
                  ? toolExecutionResult.result
                  : JSON.stringify(toolExecutionResult.result),
            },
          ]);

          // Yield tool_result_complete event for real-time UI updates
          yield {
            type: "tool_result_complete",
            toolCallId: toolCall.toolId,
            toolName: toolCall.name,
            result: toolExecutionResult.result,
            messageId: responseMessage.id,
          };

          // Continue loop
        }
      }
    } catch (error) {
      logger.error("Execution failed", {
        error: error instanceof Error ? error.message : String(error),
        threadId,
        requestId,
      });

      // Mark request as failed
      await agentRequestRepository.update(requestId, {
        status: "failed",
        progress: 1.0,
        completedAt: new Date().toISOString(),
        results: {
          error: error instanceof Error ? error.message : String(error),
        },
      });

      yield {
        type: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      };
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
      case "write_file":
        return await ToolCallService.executeWriteFile(
          toolInput.path,
          toolInput.content,
          threadId,
          userId,
          true
        );

      case "create_branch":
        return await ToolCallService.executeCreateBranch(
          toolInput.title,
          toolInput.contextFiles || [],
          threadId,
          userId,
          true
        );

      case "search_files":
        return await ToolCallService.executeSearchFiles(
          toolInput.query,
          userId
        );

      case "read_file":
        return await ToolCallService.executeReadFile(toolInput.path, userId);

      case "list_directory":
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
      throw new Error("Tool call not found or access denied");
    }

    if (approved) {
      await agentToolCallRepository.updateStatus(toolCallId, "approved");
    } else {
      await agentToolCallRepository.rejectWithRevisionTracking(
        toolCallId,
        reason
      );
    }
  }

  /**
   * Build system prompt from prime context
   * NEW: Added tool guidance for sequential approval workflow
   */
  private static buildSystemPrompt(primeContext: PrimeContext): string {
    let prompt =
      "You are an AI assistant for Centrid, helping users manage their documents and knowledge.\n\n";

    // Multi-step tool execution policy with reflection pattern
    prompt += "### Tool Execution Policy\n";
    prompt += "When handling user requests:\n";
    prompt +=
      "1. Analyze what the user is asking for (may require multiple steps)\n";
    prompt += "2. Execute tools one at a time to fulfill the request\n";
    prompt +=
      '3. After each tool succeeds, evaluate: "Is the original request now complete?"\n';
    prompt +=
      "4. If complete: Provide a summary of what was accomplished and stop\n";
    prompt += "5. If not complete: Continue with the next necessary tool\n";
    prompt +=
      "6. Do not suggest improvements or additional features unless explicitly requested\n\n";

    prompt += "### Examples of Multi-Step Requests\n";
    prompt +=
      'Request: "Create folder reports and a file summary.txt inside it"\n';
    prompt += "→ Step 1: Create folder\n";
    prompt += "→ Step 2: Create file inside folder\n";
    prompt += "→ Step 3: Confirm both complete, provide summary\n\n";

    prompt += 'Request: "Create file with today\'s news"\n';
    prompt += "→ Step 1: Create file\n";
    prompt +=
      "→ Step 2: Confirm complete, provide summary (do not create additional versions)\n\n";

    if (primeContext.explicitFiles?.length > 0) {
      prompt += "### Explicit Context:\n";
      primeContext.explicitFiles.forEach((f) => {
        prompt += `- ${f.title || f.path}\n`;
      });
      prompt += "\n";
    }

    if (primeContext.threadContext?.length > 0) {
      prompt += "### Thread History:\n";
      primeContext.threadContext.forEach((t) => {
        prompt += `- ${t.title || t.id}\n`;
      });
      prompt += "\n";
    }

    return prompt;
  }
}
