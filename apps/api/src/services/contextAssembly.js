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
exports.contextAssemblyService = exports.ContextAssemblyService = void 0;
var contextReference_ts_1 = require("../repositories/contextReference.ts");
var message_ts_1 = require("../repositories/message.ts");
/**
 * Context Assembly Service
 * Builds prime context from explicit references and thread history
 * Features:
 * - In-memory LRU caching (30s TTL, max 50 threads)
 * - Parallel query batching with Promise.all
 * - Accurate token estimation
 * - No dependencies on Supabase/userId - uses repositories which handle auth at edge layer
 */
var ContextAssemblyService = /** @class */ (function () {
    function ContextAssemblyService() {
        // ✅ In-memory cache per threadId
        this.contextCache = new Map();
        this.CACHE_TTL = 30000; // 30 second TTL
        this.CACHE_MAX_SIZE = 50;
    }
    /**
     * Build prime context for a message
     * Combines explicit context references with thread history
     * Uses LRU cache to avoid repeated queries for same thread
     */
    ContextAssemblyService.prototype.buildPrimeContext = function (threadId, userMessage, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var cached, _a, explicitReferences, recentMessages, explicitFiles, threadContext, totalTokens, context, oldestKey, oldestTime, _i, _b, _c, key, value, error_1;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        cached = this.contextCache.get(threadId);
                        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
                            console.log('[ContextAssembly] Cache hit for threadId:', threadId);
                            return [2 /*return*/, cached.context];
                        }
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, Promise.all([
                                contextReference_ts_1.contextReferenceRepository.findByThreadId(threadId), // Parallel
                                message_ts_1.messageRepository.findByThreadId(threadId, 20, 0), // Parallel (fetch 20 instead of 10)
                            ])];
                    case 2:
                        _a = _d.sent(), explicitReferences = _a[0], recentMessages = _a[1];
                        explicitFiles = explicitReferences
                            .filter(function (r) { return r.entityType === 'file'; })
                            .map(function (r) { return ({
                            path: r.entityReference,
                            title: r.entityReference.split('/').pop(),
                            source: r.source,
                        }); });
                        threadContext = recentMessages.map(function (m) { return ({
                            id: m.id,
                            title: m.content.substring(0, 50) + '...',
                            role: m.role,
                        }); });
                        totalTokens = this.estimateTokens(userMessage, explicitFiles, threadContext);
                        context = {
                            totalTokens: totalTokens,
                            explicitFiles: explicitFiles,
                            threadContext: threadContext,
                            excluded: [],
                        };
                        // ✅ Store in cache with timestamp
                        this.contextCache.set(threadId, {
                            context: context,
                            timestamp: Date.now(),
                        });
                        // ✅ LRU eviction: Remove oldest when cache exceeds size limit
                        if (this.contextCache.size > this.CACHE_MAX_SIZE) {
                            oldestKey = null;
                            oldestTime = Infinity;
                            for (_i = 0, _b = this.contextCache.entries(); _i < _b.length; _i++) {
                                _c = _b[_i], key = _c[0], value = _c[1];
                                if (value.timestamp < oldestTime) {
                                    oldestTime = value.timestamp;
                                    oldestKey = key;
                                }
                            }
                            if (oldestKey) {
                                console.log('[ContextAssembly] Evicting cache for threadId:', oldestKey);
                                this.contextCache.delete(oldestKey);
                            }
                        }
                        return [2 /*return*/, context];
                    case 3:
                        error_1 = _d.sent();
                        console.error('[ContextAssembly] Failed to build prime context:', error_1);
                        // Return minimal context on error
                        return [2 /*return*/, {
                                totalTokens: 0,
                                explicitFiles: [],
                                threadContext: [],
                                excluded: [],
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Accurate token estimation based on content length
     * OpenAI token counting: ~1.3 tokens per word, ~4 chars per token
     * Conservative estimate: 3.5 chars per token
     */
    ContextAssemblyService.prototype.estimateTokens = function (userMessage, explicitFiles, threadContext) {
        // ✅ User message tokens: 3.5 chars per token (conservative)
        var messageTokens = Math.ceil(userMessage.length / 3.5);
        // ✅ Context files: assume ~500 chars average = ~150 tokens each
        var fileTokens = explicitFiles.length * 150;
        // ✅ Thread messages: average message ~50 tokens
        var historyTokens = threadContext.length * 50;
        // ✅ System prompt overhead: ~200 tokens for instructions
        var overheadTokens = 200;
        var total = messageTokens + fileTokens + historyTokens + overheadTokens;
        console.log('[ContextAssembly] Token estimation', {
            message: messageTokens,
            files: fileTokens,
            history: historyTokens,
            overhead: overheadTokens,
            total: total,
        });
        return total;
    };
    /**
     * Clear cache (for testing/debugging)
     */
    ContextAssemblyService.prototype.clearCache = function () {
        console.log('[ContextAssembly] Clearing cache');
        this.contextCache.clear();
    };
    /**
     * Get cache statistics (for monitoring)
     */
    ContextAssemblyService.prototype.getCacheStats = function () {
        return {
            size: this.contextCache.size,
            entries: Array.from(this.contextCache.values()).length,
        };
    };
    return ContextAssemblyService;
}());
exports.ContextAssemblyService = ContextAssemblyService;
exports.contextAssemblyService = new ContextAssemblyService();
