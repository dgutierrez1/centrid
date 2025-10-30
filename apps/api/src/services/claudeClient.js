"use strict";
/**
 * Claude API Client Service
 * Handles streaming communication with Anthropic Claude API
 * Replaces simulated agent execution with real Claude responses
 */
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamClaudeResponse = streamClaudeResponse;
exports.buildMessagesWithToolResults = buildMessagesWithToolResults;
exports.formatToolsForClaude = formatToolsForClaude;
/**
 * Stream Claude API and collect full response
 * Returns parsed content blocks with text and tool calls
 */
function streamClaudeResponse(systemPrompt, messages, tools, options) {
    return __asyncGenerator(this, arguments, function streamClaudeResponse_1() {
        var apiKey, model, maxTokens, temperature, requestBody, response, errorText, data, accumulatedText, toolCalls, _i, _a, block, text, offset, chunkCount, chunk;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    apiKey = Deno.env.get('ANTHROPIC_API_KEY');
                    if (!apiKey) {
                        throw new Error('ANTHROPIC_API_KEY not set');
                    }
                    model = 'claude-haiku-4-5-20251001';
                    maxTokens = (_b = options === null || options === void 0 ? void 0 : options.maxTokens) !== null && _b !== void 0 ? _b : 4096;
                    temperature = (_c = options === null || options === void 0 ? void 0 : options.temperature) !== null && _c !== void 0 ? _c : 0.7;
                    requestBody = {
                        model: model,
                        max_tokens: maxTokens,
                        temperature: temperature,
                        system: systemPrompt,
                        tools: tools.map(function (t) { return ({
                            name: t.name,
                            description: t.description,
                            input_schema: t.input_schema,
                        }); }),
                        messages: messages.map(function (m) { return ({
                            role: m.role,
                            content: typeof m.content === 'string' ? m.content : m.content,
                        }); }),
                    };
                    console.log('[ClaudeClient] Calling Claude API:', {
                        model: requestBody.model,
                        maxTokens: maxTokens,
                        temperature: temperature,
                        messagesCount: messages.length,
                        toolsCount: tools.length,
                    });
                    return [4 /*yield*/, __await(fetch('https://api.anthropic.com/v1/messages', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'x-api-key': apiKey,
                                'anthropic-version': '2023-06-01',
                            },
                            body: JSON.stringify(requestBody),
                        }))];
                case 1:
                    response = _d.sent();
                    if (!!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, __await(response.text())];
                case 2:
                    errorText = _d.sent();
                    console.error('[ClaudeClient] API error - Response not OK:', {
                        status: response.status,
                        statusText: response.statusText,
                        errorTextLength: errorText.length,
                        errorTextFirst500: errorText.substring(0, 500),
                        model: requestBody.model,
                        apiUrl: 'https://api.anthropic.com/v1/messages',
                    });
                    throw new Error("Claude API error: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText.substring(0, 200)));
                case 3: return [4 /*yield*/, __await(response.json())];
                case 4:
                    data = _d.sent();
                    console.log('[ClaudeClient] Received response:', {
                        stopReason: data.stop_reason,
                        contentBlocksCount: data.content.length,
                        usage: data.usage,
                    });
                    accumulatedText = '';
                    toolCalls = [];
                    console.log('[ClaudeClient] Processing response content blocks:', {
                        contentBlocksCount: data.content.length,
                        stopReason: data.stop_reason,
                    });
                    if (data.content.length === 0) {
                        console.warn('[ClaudeClient] WARNING: Claude returned empty content array!');
                        console.log('[ClaudeClient] Full response:', JSON.stringify(data));
                    }
                    _i = 0, _a = data.content;
                    _d.label = 5;
                case 5:
                    if (!(_i < _a.length)) return [3 /*break*/, 14];
                    block = _a[_i];
                    if (!(block.type === 'text')) return [3 /*break*/, 10];
                    text = block.text;
                    console.log('[ClaudeClient] Yielding text block:', {
                        textLength: (text === null || text === void 0 ? void 0 : text.length) || 0,
                    });
                    if (!text) return [3 /*break*/, 9];
                    accumulatedText += text;
                    offset = 0;
                    chunkCount = 0;
                    _d.label = 6;
                case 6:
                    if (!(offset < text.length)) return [3 /*break*/, 9];
                    chunk = text.substring(offset, offset + 100);
                    chunkCount++;
                    console.log('[ClaudeClient] Yielding text_chunk:', {
                        chunkNumber: chunkCount,
                        chunkLength: chunk.length,
                    });
                    return [4 /*yield*/, __await({
                            type: 'text_chunk',
                            content: chunk,
                        })];
                case 7: return [4 /*yield*/, _d.sent()];
                case 8:
                    _d.sent();
                    offset += 100;
                    return [3 /*break*/, 6];
                case 9: return [3 /*break*/, 13];
                case 10:
                    if (!(block.type === 'tool_use')) return [3 /*break*/, 13];
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
                    return [4 /*yield*/, __await({
                            type: 'tool_call',
                            toolCallId: block.id,
                            toolName: block.name,
                            toolInput: block.input || {},
                        })];
                case 11: return [4 /*yield*/, _d.sent()];
                case 12:
                    _d.sent();
                    _d.label = 13;
                case 13:
                    _i++;
                    return [3 /*break*/, 5];
                case 14:
                    // Yield completion with usage
                    console.log('[ClaudeClient] Yielding completion event:', {
                        accumulatedTextLength: accumulatedText.length,
                        toolCallsCount: toolCalls.length,
                        inputTokens: data.usage.input_tokens,
                        outputTokens: data.usage.output_tokens,
                        stopReason: data.stop_reason,
                    });
                    return [4 /*yield*/, __await({
                            type: 'completion',
                            usage: {
                                inputTokens: data.usage.input_tokens,
                                outputTokens: data.usage.output_tokens,
                            },
                            stopReason: data.stop_reason,
                        })];
                case 15: return [4 /*yield*/, _d.sent()];
                case 16:
                    _d.sent();
                    return [4 /*yield*/, __await({
                            textContent: accumulatedText,
                            toolCalls: toolCalls,
                            stopReason: data.stop_reason,
                            usage: {
                                inputTokens: data.usage.input_tokens,
                                outputTokens: data.usage.output_tokens,
                            },
                        })];
                case 17: return [2 /*return*/, _d.sent()];
            }
        });
    });
}
/**
 * Build messages array with tool results for next iteration
 * Used after tool execution to include results in next API call
 */
function buildMessagesWithToolResults(messages, assistantContent, toolResults) {
    // Add assistant message with all content blocks
    var newMessages = __spreadArray([], messages, true);
    newMessages.push({
        role: 'assistant',
        content: assistantContent,
    });
    // Add tool results from each tool call
    if (toolResults.length > 0) {
        newMessages.push({
            role: 'user',
            content: toolResults.map(function (tr) { return ({
                type: 'tool_result',
                tool_use_id: tr.toolCallId,
                content: typeof tr.result === 'string'
                    ? tr.result
                    : JSON.stringify(tr.result),
            }); }),
        });
    }
    return newMessages;
}
/**
 * Format tool definitions for Claude API
 * Converts from internal tool format to Claude tool_use format
 */
function formatToolsForClaude(tools) {
    return tools.map(function (tool) { return ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.input_schema,
    }); });
}
