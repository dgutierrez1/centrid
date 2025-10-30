"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __asyncDelegator = (this && this.__asyncDelegator) || function (o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: false } : f ? f(v) : v; } : f; }
};
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function () { return this; }, i;
    function awaitReturn(f) { return function (v) { return Promise.resolve(v).then(f, reject); }; }
    function verb(n, f) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentExecutionService = void 0;
var toolCall_ts_1 = require("./toolCall.ts");
var contextAssembly_ts_1 = require("./contextAssembly.ts");
var claudeClient_ts_1 = require("./claudeClient.ts");
var agentToolCall_ts_1 = require("../repositories/agentToolCall.ts");
var message_ts_1 = require("../repositories/message.ts");
var agentRequest_ts_1 = require("../repositories/agentRequest.ts");
/**
 * Agent Execution Service
 * Handles AI agent execution with SSE streaming and tool calls
 * ✅ STATELESS - All methods are static utility functions
 */
var AgentExecutionService = /** @class */ (function () {
    function AgentExecutionService() {
    }
    /**
     * NEW: Execute agent by request ID (replaces executeStream)
     * Fetches request, message, and context - main entry point for streaming
     * NEW: Supports resuming from checkpoint for tool approval
     */
    AgentExecutionService.executeStreamByRequest = function (requestId_1, userId_1) {
        return __asyncGenerator(this, arguments, function executeStreamByRequest_1(requestId, userId, options) {
            var request, error, message, error, primeContext;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('[AgentExecution] executeStreamByRequest started:', {
                            requestId: requestId,
                            userId: userId,
                        });
                        // Fetch request
                        console.log('[AgentExecution] Fetching request from DB:', requestId);
                        return [4 /*yield*/, __await(agentRequest_ts_1.agentRequestRepository.findById(requestId))];
                    case 1:
                        request = _a.sent();
                        console.log('[AgentExecution] Request fetched:', {
                            requestId: requestId,
                            found: !!request,
                            status: request === null || request === void 0 ? void 0 : request.status,
                            triggeringMessageId: request === null || request === void 0 ? void 0 : request.triggeringMessageId,
                            requestUserId: request === null || request === void 0 ? void 0 : request.userId,
                        });
                        if (!request || request.userId !== userId) {
                            error = "Request not found or access denied. Found: ".concat(!!request, ", UserMatch: ").concat((request === null || request === void 0 ? void 0 : request.userId) === userId);
                            console.error('[AgentExecution] ' + error);
                            throw new Error(error);
                        }
                        // Fetch triggering message
                        console.log('[AgentExecution] Fetching triggering message:', request.triggeringMessageId);
                        return [4 /*yield*/, __await(message_ts_1.messageRepository.findById(request.triggeringMessageId))];
                    case 2:
                        message = _a.sent();
                        console.log('[AgentExecution] Message fetched:', {
                            triggeringMessageId: request.triggeringMessageId,
                            found: !!message,
                            messageId: message === null || message === void 0 ? void 0 : message.id,
                        });
                        if (!message) {
                            error = "Triggering message not found: ".concat(request.triggeringMessageId);
                            console.error('[AgentExecution] ' + error);
                            throw new Error(error);
                        }
                        // Update request status
                        console.log('[AgentExecution] Updating status to in_progress');
                        return [4 /*yield*/, __await(agentRequest_ts_1.agentRequestRepository.update(requestId, {
                                status: 'in_progress',
                                progress: 0.1,
                            }))];
                    case 3:
                        _a.sent();
                        console.log('[AgentExecution] Status updated to in_progress');
                        // ✅ BUILD PRIME CONTEXT - Integrated with ContextAssemblyService
                        console.log('[AgentExecution] Building prime context for thread:', request.threadId);
                        return [4 /*yield*/, __await(contextAssembly_ts_1.contextAssemblyService.buildPrimeContext(request.threadId, message.content, userId))];
                    case 4:
                        primeContext = _a.sent();
                        console.log('[AgentExecution] Prime context built:', {
                            totalTokens: primeContext.totalTokens,
                            explicitFilesCount: primeContext.explicitFiles.length,
                            threadContextCount: primeContext.threadContext.length,
                        });
                        // Delegate to execution with request tracking
                        return [5 /*yield**/, __values(__asyncDelegator(__asyncValues(this.executeWithStreaming(request.threadId, message.id, message.content, primeContext, userId, requestId, // NEW: Pass requestId for tracking
                            options // NEW: Pass options for resume support
                            ))))];
                    case 5: 
                    // Delegate to execution with request tracking
                    return [4 /*yield*/, __await.apply(void 0, [_a.sent()])];
                    case 6:
                        // Delegate to execution with request tracking
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Execute agent - simplified interface for route handlers
     * Fetches message and context internally
     */
    AgentExecutionService.executeStream = function (userId, threadId, messageId) {
        return __asyncGenerator(this, arguments, function executeStream_1() {
            var message, primeContext;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, __await(message_ts_1.messageRepository.findById(messageId))];
                    case 1:
                        message = _a.sent();
                        if (!message || message.threadId !== threadId) {
                            throw new Error('Message not found');
                        }
                        return [4 /*yield*/, __await(contextAssembly_ts_1.contextAssemblyService.buildPrimeContext(threadId, message.content, userId))];
                    case 2:
                        primeContext = _a.sent();
                        // Delegate to main execution method
                        return [5 /*yield**/, __values(__asyncDelegator(__asyncValues(this.executeWithStreaming(threadId, messageId, message.content, primeContext, userId))))];
                    case 3: 
                    // Delegate to main execution method
                    return [4 /*yield*/, __await.apply(void 0, [_a.sent()])];
                    case 4:
                        // Delegate to main execution method
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Updated: Execute with request tracking + checkpoint/resume
     * This is an async generator that yields events for the SSE stream
     * NEW: Supports resuming from checkpoint for tool approval workflow
     */
    AgentExecutionService.executeWithStreaming = function (threadId_1, messageId_1, userMessage_1, primeContext_1, userId_1, requestId_1) {
        return __asyncGenerator(this, arguments, function executeWithStreaming_1(threadId, messageId, userMessage, primeContext, userId, requestId, // NEW: Optional requestId for tracking
        options // NEW: Resume from checkpoint
        ) {
            var systemPrompt, tools, messages, accumulatedContent, iterationCount, totalTokens, toolCallsList, continueLoop, maxIterations, revisionCount, maxRevisions, request, checkpoint, latestToolCall, claudeTools, toolsFormatted, iterationContent, iterationToolCalls, generator, claudeUsage, stopReason, eventCountFromClaude, _a, generator_1, generator_1_1, event_1, e_1_1, generatorError_1, toolCall, toolCallId, checkpoint, error_1, assistantMessage, error_2;
            var _b, e_1, _c, _d;
            var _e, _f;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        console.log('[AgentExecution] Starting agent execution with streaming:', {
                            threadId: threadId,
                            messageId: messageId,
                            userId: userId,
                            requestId: requestId,
                            isResume: options.isResume,
                            userMessageLength: userMessage.length,
                        });
                        systemPrompt = this.buildSystemPrompt(primeContext);
                        tools = this.getAvailableTools();
                        console.log('[AgentExecution] Setup complete:', {
                            systemPromptLength: systemPrompt.length,
                            toolsCount: tools.length,
                            isResume: options.isResume,
                        });
                        messages = [];
                        accumulatedContent = '';
                        iterationCount = 0;
                        totalTokens = 0;
                        toolCallsList = [];
                        continueLoop = true;
                        maxIterations = 5;
                        revisionCount = 0;
                        maxRevisions = 3;
                        if (!(options.isResume && requestId)) return [3 /*break*/, 5];
                        // Load from checkpoint
                        console.log('[AgentExecution] Loading checkpoint for resume:', { requestId: requestId });
                        return [4 /*yield*/, __await(agentRequest_ts_1.agentRequestRepository.findById(requestId))];
                    case 1:
                        request = _g.sent();
                        if (!(request === null || request === void 0 ? void 0 : request.checkpoint)) return [3 /*break*/, 3];
                        checkpoint = request.checkpoint;
                        messages = checkpoint.conversationHistory || [];
                        iterationCount = checkpoint.iterationCount || 0;
                        accumulatedContent = checkpoint.accumulatedContent || '';
                        console.log('[AgentExecution] Checkpoint loaded:', {
                            messagesCount: messages.length,
                            iterationCount: iterationCount,
                            contentLength: accumulatedContent.length,
                        });
                        // NEW: Load tool result and add to messages
                        // The tool was executed in /approve-tool, now we add the result so Claude can continue
                        console.log('[AgentExecution] Loading approved tool result:', {
                            requestId: requestId,
                            checkpointToolCallId: (_e = checkpoint.lastToolCall) === null || _e === void 0 ? void 0 : _e.id,
                        });
                        return [4 /*yield*/, __await(agentToolCall_ts_1.agentToolCallRepository.findLatestByRequestId(requestId))];
                    case 2:
                        latestToolCall = _g.sent();
                        if ((latestToolCall === null || latestToolCall === void 0 ? void 0 : latestToolCall.approvalStatus) === 'approved' && (latestToolCall === null || latestToolCall === void 0 ? void 0 : latestToolCall.toolOutput)) {
                            console.log('[AgentExecution] Adding tool result to messages:', {
                                toolCallId: latestToolCall.id,
                                toolName: latestToolCall.toolName,
                            });
                            // Build tool result structure and add to messages
                            messages = (0, claudeClient_ts_1.buildMessagesWithToolResults)(messages, [
                                {
                                    type: 'tool_use',
                                    id: latestToolCall.id,
                                    name: latestToolCall.toolName,
                                    input: latestToolCall.toolInput,
                                },
                            ], [
                                {
                                    toolCallId: latestToolCall.id,
                                    result: latestToolCall.toolOutput,
                                },
                            ]);
                            console.log('[AgentExecution] Tool result added, messages count:', messages.length);
                        }
                        else {
                            console.warn('[AgentExecution] Expected approved tool call with result not found');
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        console.warn('[AgentExecution] Checkpoint requested but not found, starting fresh');
                        messages = [
                            {
                                role: 'user',
                                content: userMessage,
                            },
                        ];
                        _g.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        // Fresh start: Build messages array for multi-turn conversation
                        messages = [
                            {
                                role: 'user',
                                content: userMessage,
                            },
                        ];
                        _g.label = 6;
                    case 6:
                        if (!(continueLoop && iterationCount < maxIterations)) return [3 /*break*/, 42];
                        iterationCount++;
                        console.log('[AgentExecution] Starting iteration', {
                            iterationCount: iterationCount,
                            revisionCount: revisionCount,
                            totalTokens: totalTokens,
                            messagesCount: messages.length,
                        });
                        _g.label = 7;
                    case 7:
                        _g.trys.push([7, 38, , 41]);
                        if (!requestId) return [3 /*break*/, 9];
                        return [4 /*yield*/, __await(agentRequest_ts_1.agentRequestRepository.update(requestId, {
                                progress: 0.2,
                            }))];
                    case 8:
                        _g.sent();
                        _g.label = 9;
                    case 9:
                        claudeTools = this.getAvailableTools();
                        toolsFormatted = (0, claudeClient_ts_1.formatToolsForClaude)(claudeTools);
                        iterationContent = [];
                        iterationToolCalls = [];
                        console.log('[AgentExecution] Calling Claude API with', toolsFormatted.length, 'tools');
                        generator = (0, claudeClient_ts_1.streamClaudeResponse)(systemPrompt, messages, toolsFormatted, {
                            maxTokens: 2000, // Claude Haiku supports up to 2048 output tokens
                            temperature: 0.7,
                        });
                        claudeUsage = { inputTokens: 0, outputTokens: 0 };
                        stopReason = 'end_turn';
                        console.log('[AgentExecution] Starting to collect events from Claude generator');
                        eventCountFromClaude = 0;
                        _g.label = 10;
                    case 10:
                        _g.trys.push([10, 26, , 27]);
                        _g.label = 11;
                    case 11:
                        _g.trys.push([11, 19, 20, 25]);
                        _a = true, generator_1 = (e_1 = void 0, __asyncValues(generator));
                        _g.label = 12;
                    case 12: return [4 /*yield*/, __await(generator_1.next())];
                    case 13:
                        if (!(generator_1_1 = _g.sent(), _b = generator_1_1.done, !_b)) return [3 /*break*/, 18];
                        _d = generator_1_1.value;
                        _a = false;
                        event_1 = _d;
                        eventCountFromClaude++;
                        console.log('[AgentExecution] Received event from Claude:', {
                            type: event_1.type,
                            eventNumber: eventCountFromClaude,
                            contentLength: ((_f = event_1.content) === null || _f === void 0 ? void 0 : _f.length) || 0,
                            hasContent: !!event_1.content || !!event_1.text,
                        });
                        if (!(event_1.type === 'text_chunk')) return [3 /*break*/, 16];
                        // Accumulate and yield text
                        accumulatedContent += event_1.content;
                        iterationContent.push({
                            type: 'text',
                            text: event_1.content,
                        });
                        console.log('[AgentExecution] Yielding text_chunk:', {
                            contentLength: event_1.content.length,
                            accumulatedLength: accumulatedContent.length,
                        });
                        return [4 /*yield*/, __await(event_1)];
                    case 14: return [4 /*yield*/, _g.sent()];
                    case 15:
                        _g.sent(); // Yield to SSE stream
                        return [3 /*break*/, 17];
                    case 16:
                        if (event_1.type === 'tool_call') {
                            // Track tool call for processing
                            iterationToolCalls.push({
                                toolId: event_1.toolCallId,
                                name: event_1.toolName,
                                input: event_1.toolInput,
                            });
                            iterationContent.push({
                                type: 'tool_use',
                                id: event_1.toolCallId,
                                name: event_1.toolName,
                                input: event_1.toolInput,
                            });
                        }
                        else if (event_1.type === 'completion') {
                            // Extract usage
                            claudeUsage = event_1.usage || { inputTokens: 0, outputTokens: 0 };
                            stopReason = event_1.stopReason;
                            totalTokens += claudeUsage.outputTokens;
                        }
                        _g.label = 17;
                    case 17:
                        _a = true;
                        return [3 /*break*/, 12];
                    case 18: return [3 /*break*/, 25];
                    case 19:
                        e_1_1 = _g.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 25];
                    case 20:
                        _g.trys.push([20, , 23, 24]);
                        if (!(!_a && !_b && (_c = generator_1.return))) return [3 /*break*/, 22];
                        return [4 /*yield*/, __await(_c.call(generator_1))];
                    case 21:
                        _g.sent();
                        _g.label = 22;
                    case 22: return [3 /*break*/, 24];
                    case 23:
                        if (e_1) throw e_1.error;
                        return [7 /*endfinally*/];
                    case 24: return [7 /*endfinally*/];
                    case 25: return [3 /*break*/, 27];
                    case 26:
                        generatorError_1 = _g.sent();
                        console.error('[AgentExecution] Error iterating Claude generator:', {
                            error: generatorError_1 instanceof Error ? generatorError_1.message : String(generatorError_1),
                            eventCountBeforeError: eventCountFromClaude,
                            stack: generatorError_1 instanceof Error ? generatorError_1.stack : undefined,
                        });
                        throw generatorError_1;
                    case 27:
                        if (eventCountFromClaude === 0) {
                            console.error('[AgentExecution] Claude generator yielded 0 events!', {
                                iterationCount: iterationCount,
                                systemPromptLength: systemPrompt.length,
                                messagesCount: messages.length,
                            });
                        }
                        console.log('[AgentExecution] Claude iteration complete:', {
                            textLength: accumulatedContent.length,
                            toolCallsCount: iterationToolCalls.length,
                            stopReason: stopReason,
                            tokensUsed: claudeUsage.outputTokens,
                        });
                        if (!requestId) return [3 /*break*/, 29];
                        return [4 /*yield*/, __await(agentRequest_ts_1.agentRequestRepository.update(requestId, {
                                progress: 0.4,
                            }))];
                    case 28:
                        _g.sent();
                        _g.label = 29;
                    case 29:
                        if (!(iterationToolCalls.length === 0)) return [3 /*break*/, 32];
                        console.log('[AgentExecution] No tool calls, conversation complete');
                        continueLoop = false;
                        return [4 /*yield*/, __await({ type: 'completion', usage: claudeUsage })];
                    case 30: return [4 /*yield*/, _g.sent()];
                    case 31:
                        _g.sent();
                        return [3 /*break*/, 42];
                    case 32:
                        toolCall = iterationToolCalls[0];
                        return [4 /*yield*/, __await(this.createToolCall(threadId, messageId, { name: toolCall.name, input: toolCall.input }, userId, requestId))];
                    case 33:
                        toolCallId = _g.sent();
                        if (!requestId) return [3 /*break*/, 35];
                        checkpoint = {
                            conversationHistory: messages,
                            lastToolCall: {
                                id: toolCallId,
                                name: toolCall.name,
                                input: toolCall.input,
                            },
                            iterationCount: iterationCount,
                            accumulatedContent: accumulatedContent,
                            status: 'awaiting_approval',
                        };
                        console.log('[AgentExecution] Saving checkpoint:', {
                            requestId: requestId,
                            toolCallId: toolCallId,
                            iterationCount: iterationCount,
                        });
                        return [4 /*yield*/, __await(agentRequest_ts_1.agentRequestRepository.update(requestId, {
                                checkpoint: checkpoint,
                            }))];
                    case 34:
                        _g.sent();
                        _g.label = 35;
                    case 35: return [4 /*yield*/, __await({
                            type: 'tool_call',
                            toolCallId: toolCallId,
                            toolName: toolCall.name,
                            toolInput: toolCall.input,
                            approval_required: true,
                            revision_count: revisionCount,
                        })];
                    case 36: 
                    // Yield tool call for user approval (no waiting - return immediately)
                    return [4 /*yield*/, _g.sent()];
                    case 37:
                        // Yield tool call for user approval (no waiting - return immediately)
                        _g.sent();
                        console.log('[AgentExecution] Tool call emitted, returning for approval:', {
                            toolCallId: toolCallId,
                            toolName: toolCall.name,
                            requestId: requestId,
                        });
                        // NEW: Return immediately instead of waiting for approval
                        // The /approve-tool endpoint will call /execute (resume) when user approves
                        continueLoop = false;
                        return [3 /*break*/, 42];
                    case 38:
                        error_1 = _g.sent();
                        console.error('[AgentExecution] Error during Claude API call:', error_1);
                        return [4 /*yield*/, __await({
                                type: 'error',
                                message: error_1 instanceof Error ? error_1.message : 'Unknown error',
                            })];
                    case 39: return [4 /*yield*/, _g.sent()];
                    case 40:
                        _g.sent();
                        continueLoop = false;
                        return [3 /*break*/, 42];
                    case 41: return [3 /*break*/, 6];
                    case 42:
                        if (!requestId) return [3 /*break*/, 49];
                        _g.label = 43;
                    case 43:
                        _g.trys.push([43, 47, , 49]);
                        return [4 /*yield*/, __await(message_ts_1.messageRepository.create({
                                threadId: threadId,
                                ownerUserId: userId,
                                role: 'assistant',
                                content: accumulatedContent || 'Request processing completed.',
                                toolCalls: toolCallsList,
                                tokensUsed: totalTokens,
                            }))];
                    case 44:
                        assistantMessage = _g.sent();
                        console.log('[AgentExecution] Created assistant message:', assistantMessage.id);
                        // Update request with response message and final status
                        return [4 /*yield*/, __await(agentRequest_ts_1.agentRequestRepository.update(requestId, {
                                status: 'completed',
                                progress: 1.0,
                                responseMessageId: assistantMessage.id,
                                tokenCost: totalTokens,
                                results: {
                                    filesCreated: toolCallsList
                                        .filter(function (t) { return t.toolName === 'write_file' && t.approved; })
                                        .map(function (t) { return t.toolInput.path; }),
                                    branchesCreated: toolCallsList.filter(function (t) { return t.toolName === 'create_branch' && t.approved; }).length,
                                    toolsExecuted: toolCallsList.length,
                                    toolsApproved: toolCallsList.filter(function (t) { return t.approved; }).length,
                                },
                                completedAt: new Date(),
                            }))];
                    case 45:
                        // Update request with response message and final status
                        _g.sent();
                        // NEW: Update all tool calls to link to message (Phase 3 - MVU B3.3)
                        return [4 /*yield*/, __await(agentToolCall_ts_1.agentToolCallRepository.updateMessageIdForRequest(requestId, assistantMessage.id))];
                    case 46:
                        // NEW: Update all tool calls to link to message (Phase 3 - MVU B3.3)
                        _g.sent();
                        console.log('[AgentExecution] Updated request and tool calls:', {
                            requestId: requestId,
                            messageId: assistantMessage.id,
                        });
                        return [3 /*break*/, 49];
                    case 47:
                        error_2 = _g.sent();
                        console.error('[AgentExecution] Failed to save assistant message:', error_2);
                        // Mark request as failed
                        return [4 /*yield*/, __await(agentRequest_ts_1.agentRequestRepository.update(requestId, {
                                status: 'failed',
                                progress: 1.0,
                                completedAt: new Date(),
                                results: {
                                    error: error_2 instanceof Error ? error_2.message : String(error_2),
                                },
                            }))];
                    case 48:
                        // Mark request as failed
                        _g.sent();
                        return [3 /*break*/, 49];
                    case 49: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get available tools for agent
     */
    AgentExecutionService.getAvailableTools = function () {
        return [
            {
                name: 'write_file',
                description: 'Write content to a file',
                input_schema: {
                    type: 'object',
                    properties: {
                        path: { type: 'string', description: 'File path' },
                        content: { type: 'string', description: 'File content' },
                    },
                    required: ['path', 'content'],
                },
            },
            {
                name: 'create_branch',
                description: 'Create a new conversation branch',
                input_schema: {
                    type: 'object',
                    properties: {
                        title: { type: 'string', description: 'Branch title' },
                        contextFiles: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Files to include',
                        },
                    },
                    required: ['title'],
                },
            },
            {
                name: 'search_files',
                description: 'Search for files',
                input_schema: {
                    type: 'object',
                    properties: {
                        query: { type: 'string', description: 'Search query' },
                    },
                    required: ['query'],
                },
            },
            {
                name: 'read_file',
                description: 'Read file contents',
                input_schema: {
                    type: 'object',
                    properties: {
                        path: { type: 'string', description: 'File path' },
                    },
                    required: ['path'],
                },
            },
            {
                name: 'list_directory',
                description: 'List files and folders in a directory',
                input_schema: {
                    type: 'object',
                    properties: {
                        path: { type: 'string', description: 'Directory path' },
                    },
                    required: ['path'],
                },
            },
        ];
    };
    /**
     * Create tool call record in database
     * ✅ Links to requestId (not messageId yet - set later)
     */
    AgentExecutionService.createToolCall = function (threadId, messageId, toolCall, userId, requestId // NEW: Optional requestId for tracking
    ) {
        return __awaiter(this, void 0, void 0, function () {
            var record;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, agentToolCall_ts_1.agentToolCallRepository.create({
                            messageId: messageId,
                            threadId: threadId,
                            ownerUserId: userId,
                            toolName: toolCall.name,
                            toolInput: toolCall.input,
                            requestId: requestId || null, // NEW: Link to request
                        })];
                    case 1:
                        record = _a.sent();
                        console.log('[AgentExecution] Created tool call:', {
                            toolCallId: record.id,
                            requestId: requestId,
                            toolName: toolCall.name,
                        });
                        return [2 /*return*/, record.id];
                }
            });
        });
    };
    /**
     * Pause and wait for tool call approval
     * Uses ToolCallService.waitForApproval (stateless)
     */
    AgentExecutionService.pauseForApproval = function (toolCallId_1, userId_1) {
        return __awaiter(this, arguments, void 0, function (toolCallId, userId, timeout) {
            var approval, toolCall;
            if (timeout === void 0) { timeout = 600000; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, toolCall_ts_1.ToolCallService.waitForApproval(toolCallId, timeout)];
                    case 1:
                        approval = _a.sent();
                        if (!(!approval.approved && !approval.reason)) return [3 /*break*/, 3];
                        return [4 /*yield*/, agentToolCall_ts_1.agentToolCallRepository.findById(toolCallId)];
                    case 2:
                        toolCall = _a.sent();
                        if (toolCall === null || toolCall === void 0 ? void 0 : toolCall.rejectionReason) {
                            approval.reason = toolCall.rejectionReason;
                        }
                        _a.label = 3;
                    case 3: return [2 /*return*/, approval];
                }
            });
        });
    };
    /**
     * Execute approved tool
     * ✅ ALL 5 TOOLS IMPLEMENTED HERE
     * Uses static ToolCallService methods
     * NEW: Public method so it can be called from approval endpoint
     */
    AgentExecutionService.executeTool = function (toolName, toolInput, threadId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = toolName;
                        switch (_a) {
                            case 'write_file': return [3 /*break*/, 1];
                            case 'create_branch': return [3 /*break*/, 3];
                            case 'search_files': return [3 /*break*/, 5];
                            case 'read_file': return [3 /*break*/, 7];
                            case 'list_directory': return [3 /*break*/, 9];
                        }
                        return [3 /*break*/, 11];
                    case 1: return [4 /*yield*/, toolCall_ts_1.ToolCallService.executeWriteFile(toolInput.path, toolInput.content, threadId, userId, true)];
                    case 2: return [2 /*return*/, _b.sent()];
                    case 3: return [4 /*yield*/, toolCall_ts_1.ToolCallService.executeCreateBranch(toolInput.title, toolInput.contextFiles || [], threadId, userId, true)];
                    case 4: return [2 /*return*/, _b.sent()];
                    case 5: return [4 /*yield*/, toolCall_ts_1.ToolCallService.executeSearchFiles(toolInput.query, userId)];
                    case 6: return [2 /*return*/, _b.sent()];
                    case 7: return [4 /*yield*/, toolCall_ts_1.ToolCallService.executeReadFile(toolInput.path, userId)];
                    case 8: return [2 /*return*/, _b.sent()];
                    case 9: return [4 /*yield*/, toolCall_ts_1.ToolCallService.executeListDirectory(toolInput.path, userId)];
                    case 10: return [2 /*return*/, _b.sent()];
                    case 11: return [2 /*return*/, { error: "Unknown tool: ".concat(toolName) }];
                }
            });
        });
    };
    /**
     * Approve or reject a tool call
     * Called from the approve-tool endpoint
     */
    AgentExecutionService.approveTool = function (userId, toolCallId, approved, reason) {
        return __awaiter(this, void 0, void 0, function () {
            var toolCall;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, agentToolCall_ts_1.agentToolCallRepository.findById(toolCallId)];
                    case 1:
                        toolCall = _a.sent();
                        if (!toolCall || toolCall.ownerUserId !== userId) {
                            throw new Error('Tool call not found or access denied');
                        }
                        if (!approved) return [3 /*break*/, 3];
                        return [4 /*yield*/, agentToolCall_ts_1.agentToolCallRepository.updateStatus(toolCallId, 'approved')];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, agentToolCall_ts_1.agentToolCallRepository.rejectWithRevisionTracking(toolCallId, reason)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Build system prompt from prime context
     * NEW: Added tool guidance for sequential approval workflow
     */
    AgentExecutionService.buildSystemPrompt = function (primeContext) {
        var _a, _b;
        var prompt = 'You are an AI assistant helping with a conversation thread.\n\n';
        // NEW: Add tool guidance for sequential approvals
        prompt += '### Tool Usage Guidelines:\n';
        prompt += 'When you need to use tools:\n';
        prompt += '- Suggest ONE tool at a time\n';
        prompt += '- Wait for the result before suggesting the next tool\n';
        prompt += '- Use the result to inform your next decision\n';
        prompt += 'This ensures each action is reviewed and approved individually.\n\n';
        if (((_a = primeContext.explicitFiles) === null || _a === void 0 ? void 0 : _a.length) > 0) {
            prompt += '### Explicit Context:\n';
            primeContext.explicitFiles.forEach(function (f) {
                prompt += "- ".concat(f.title || f.path, "\n");
            });
            prompt += '\n';
        }
        if (((_b = primeContext.threadContext) === null || _b === void 0 ? void 0 : _b.length) > 0) {
            prompt += '### Thread History:\n';
            primeContext.threadContext.forEach(function (t) {
                prompt += "- ".concat(t.title || t.id, "\n");
            });
            prompt += '\n';
        }
        return prompt;
    };
    return AgentExecutionService;
}());
exports.AgentExecutionService = AgentExecutionService;
