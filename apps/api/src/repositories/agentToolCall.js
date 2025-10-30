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
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentToolCallRepository = exports.AgentToolCallRepository = void 0;
var drizzle_orm_1 = require("drizzle-orm");
var db_ts_1 = require("../functions/_shared/db.ts");
var schema_ts_1 = require("../db/schema.ts");
var AgentToolCallRepository = /** @class */ (function () {
    function AgentToolCallRepository() {
    }
    /**
     * Create a new tool call
     */
    AgentToolCallRepository.prototype.create = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, db, cleanup, toolCall;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, db_ts_1.getDB)()];
                    case 1:
                        _a = _b.sent(), db = _a.db, cleanup = _a.cleanup;
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, , 4, 6]);
                        return [4 /*yield*/, db
                                .insert(schema_ts_1.agentToolCalls)
                                .values({
                                messageId: input.messageId,
                                threadId: input.threadId,
                                ownerUserId: input.ownerUserId,
                                toolName: input.toolName,
                                toolInput: input.toolInput,
                                requestId: input.requestId || null,
                                approvalStatus: 'pending',
                                timestamp: new Date(),
                            })
                                .returning()];
                    case 3:
                        toolCall = (_b.sent())[0];
                        return [2 /*return*/, toolCall];
                    case 4: return [4 /*yield*/, cleanup()];
                    case 5:
                        _b.sent();
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Find tool call by ID
     */
    AgentToolCallRepository.prototype.findById = function (toolCallId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, db, cleanup, toolCall;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, db_ts_1.getDB)()];
                    case 1:
                        _a = _b.sent(), db = _a.db, cleanup = _a.cleanup;
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, , 4, 6]);
                        return [4 /*yield*/, db
                                .select()
                                .from(schema_ts_1.agentToolCalls)
                                .where((0, drizzle_orm_1.eq)(schema_ts_1.agentToolCalls.id, toolCallId))
                                .limit(1)];
                    case 3:
                        toolCall = (_b.sent())[0];
                        return [2 /*return*/, toolCall || null];
                    case 4: return [4 /*yield*/, cleanup()];
                    case 5:
                        _b.sent();
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Update tool call status
     */
    AgentToolCallRepository.prototype.updateStatus = function (toolCallId, status, output) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, db, cleanup, toolCall;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, db_ts_1.getDB)()];
                    case 1:
                        _a = _b.sent(), db = _a.db, cleanup = _a.cleanup;
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, , 4, 6]);
                        return [4 /*yield*/, db
                                .update(schema_ts_1.agentToolCalls)
                                .set({
                                approvalStatus: status,
                                toolOutput: output || null,
                            })
                                .where((0, drizzle_orm_1.eq)(schema_ts_1.agentToolCalls.id, toolCallId))
                                .returning()];
                    case 3:
                        toolCall = (_b.sent())[0];
                        return [2 /*return*/, toolCall];
                    case 4: return [4 /*yield*/, cleanup()];
                    case 5:
                        _b.sent();
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Reject tool with revision tracking
     */
    AgentToolCallRepository.prototype.rejectWithRevisionTracking = function (toolCallId, reason) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, db, cleanup, toolCall, newRevisionCount, maxRevisionsReached, historyEntry, revisionHistory, updated;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, db_ts_1.getDB)()];
                    case 1:
                        _a = _b.sent(), db = _a.db, cleanup = _a.cleanup;
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, , 5, 7]);
                        return [4 /*yield*/, this.findById(toolCallId)];
                    case 3:
                        toolCall = _b.sent();
                        if (!toolCall) {
                            throw new Error('Tool call not found');
                        }
                        newRevisionCount = (toolCall.revisionCount || 0) + 1;
                        maxRevisionsReached = newRevisionCount >= 3;
                        historyEntry = {
                            attempt: newRevisionCount,
                            toolInput: toolCall.toolInput,
                            rejectedAt: new Date().toISOString(),
                            rejectionReason: reason || 'User rejected',
                        };
                        revisionHistory = toolCall.revisionHistory || [];
                        revisionHistory.push(historyEntry);
                        return [4 /*yield*/, db
                                .update(schema_ts_1.agentToolCalls)
                                .set({
                                approvalStatus: 'rejected',
                                revisionCount: newRevisionCount,
                                rejectionReason: reason || 'User rejected',
                                revisionHistory: revisionHistory,
                                toolOutput: { reason: reason || 'User rejected' },
                            })
                                .where((0, drizzle_orm_1.eq)(schema_ts_1.agentToolCalls.id, toolCallId))
                                .returning()];
                    case 4:
                        updated = (_b.sent())[0];
                        return [2 /*return*/, { toolCall: updated, maxRevisionsReached: maxRevisionsReached }];
                    case 5: return [4 /*yield*/, cleanup()];
                    case 6:
                        _b.sent();
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Find pending tool calls by request ID
     */
    AgentToolCallRepository.prototype.findPendingByRequestId = function (requestId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, db, cleanup;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, db_ts_1.getDB)()];
                    case 1:
                        _a = _b.sent(), db = _a.db, cleanup = _a.cleanup;
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, , 4, 6]);
                        return [4 /*yield*/, db
                                .select()
                                .from(schema_ts_1.agentToolCalls)
                                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_ts_1.agentToolCalls.requestId, requestId), (0, drizzle_orm_1.eq)(schema_ts_1.agentToolCalls.approvalStatus, 'pending')))
                                .orderBy(schema_ts_1.agentToolCalls.timestamp)];
                    case 3: return [2 /*return*/, _b.sent()];
                    case 4: return [4 /*yield*/, cleanup()];
                    case 5:
                        _b.sent();
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Find pending tool calls for a thread
     */
    AgentToolCallRepository.prototype.findPendingByThreadId = function (threadId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, db, cleanup;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, db_ts_1.getDB)()];
                    case 1:
                        _a = _b.sent(), db = _a.db, cleanup = _a.cleanup;
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, , 4, 6]);
                        return [4 /*yield*/, db
                                .select()
                                .from(schema_ts_1.agentToolCalls)
                                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_ts_1.agentToolCalls.threadId, threadId), (0, drizzle_orm_1.eq)(schema_ts_1.agentToolCalls.approvalStatus, 'pending')))
                                .orderBy(schema_ts_1.agentToolCalls.timestamp)];
                    case 3: return [2 /*return*/, _b.sent()];
                    case 4: return [4 /*yield*/, cleanup()];
                    case 5:
                        _b.sent();
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Find all tool calls for a message
     */
    AgentToolCallRepository.prototype.findByMessageId = function (messageId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, db, cleanup;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, db_ts_1.getDB)()];
                    case 1:
                        _a = _b.sent(), db = _a.db, cleanup = _a.cleanup;
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, , 4, 6]);
                        return [4 /*yield*/, db
                                .select()
                                .from(schema_ts_1.agentToolCalls)
                                .where((0, drizzle_orm_1.eq)(schema_ts_1.agentToolCalls.messageId, messageId))
                                .orderBy(schema_ts_1.agentToolCalls.timestamp)];
                    case 3: return [2 /*return*/, _b.sent()];
                    case 4: return [4 /*yield*/, cleanup()];
                    case 5:
                        _b.sent();
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Find all tool calls for a thread
     */
    AgentToolCallRepository.prototype.findByThreadId = function (threadId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, db, cleanup;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, db_ts_1.getDB)()];
                    case 1:
                        _a = _b.sent(), db = _a.db, cleanup = _a.cleanup;
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, , 4, 6]);
                        return [4 /*yield*/, db
                                .select()
                                .from(schema_ts_1.agentToolCalls)
                                .where((0, drizzle_orm_1.eq)(schema_ts_1.agentToolCalls.threadId, threadId))
                                .orderBy(schema_ts_1.agentToolCalls.timestamp)];
                    case 3: return [2 /*return*/, _b.sent()];
                    case 4: return [4 /*yield*/, cleanup()];
                    case 5:
                        _b.sent();
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Update message_id for all tool calls in a request
     */
    AgentToolCallRepository.prototype.updateMessageIdForRequest = function (requestId, messageId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, db, cleanup;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, db_ts_1.getDB)()];
                    case 1:
                        _a = _b.sent(), db = _a.db, cleanup = _a.cleanup;
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, , 4, 6]);
                        return [4 /*yield*/, db
                                .update(schema_ts_1.agentToolCalls)
                                .set({ messageId: messageId })
                                .where((0, drizzle_orm_1.eq)(schema_ts_1.agentToolCalls.requestId, requestId))];
                    case 3:
                        _b.sent();
                        console.log('[AgentToolCall] Updated message_id for request:', requestId);
                        return [3 /*break*/, 6];
                    case 4: return [4 /*yield*/, cleanup()];
                    case 5:
                        _b.sent();
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * NEW: Find latest tool call by request (for resume logic)
     * Returns the most recent tool call for a request, used when resuming after approval
     */
    AgentToolCallRepository.prototype.findLatestByRequestId = function (requestId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, db, cleanup, toolCall;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, db_ts_1.getDB)()];
                    case 1:
                        _a = _b.sent(), db = _a.db, cleanup = _a.cleanup;
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, , 4, 6]);
                        return [4 /*yield*/, db
                                .select()
                                .from(schema_ts_1.agentToolCalls)
                                .where((0, drizzle_orm_1.eq)(schema_ts_1.agentToolCalls.requestId, requestId))
                                .orderBy(schema_ts_1.agentToolCalls.timestamp)
                                .limit(1)];
                    case 3:
                        toolCall = (_b.sent())[0];
                        return [2 /*return*/, toolCall || null];
                    case 4: return [4 /*yield*/, cleanup()];
                    case 5:
                        _b.sent();
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    return AgentToolCallRepository;
}());
exports.AgentToolCallRepository = AgentToolCallRepository;
exports.agentToolCallRepository = new AgentToolCallRepository();
