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
exports.provenanceTrackingService = exports.ProvenanceTrackingService = void 0;
var file_ts_1 = require("../repositories/file.ts");
var thread_ts_1 = require("../repositories/thread.ts");
/**
 * Provenance Tracking Service
 * Tracks the origin and editing history of AI-generated files
 * Uses repositories for data access
 */
var ProvenanceTrackingService = /** @class */ (function () {
    function ProvenanceTrackingService() {
    }
    /**
     * Create a new file with provenance metadata
     * Tracks: who created it, when, in which thread, from what context
     */
    ProvenanceTrackingService.prototype.createFileWithProvenance = function (userId, path, content, threadId, contextSummary) {
        return __awaiter(this, void 0, void 0, function () {
            var thread, file, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, thread_ts_1.threadRepository.findById(threadId)];
                    case 1:
                        thread = _a.sent();
                        return [4 /*yield*/, file_ts_1.fileRepository.create({
                                path: path,
                                content: content,
                                ownerUserId: userId,
                                provenance: {
                                    createdInThreadId: threadId,
                                    contextSummary: contextSummary || "Created in \"".concat((thread === null || thread === void 0 ? void 0 : thread.branchTitle) || 'Unknown Thread', "\""),
                                },
                            })];
                    case 2:
                        file = _a.sent();
                        return [2 /*return*/, { fileId: file.id }];
                    case 3:
                        error_1 = _a.sent();
                        console.error('Failed to create file with provenance:', error_1);
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Update last edit metadata when file is modified
     */
    ProvenanceTrackingService.prototype.updateLastEdit = function (fileId, editedBy, threadId) {
        return __awaiter(this, void 0, void 0, function () {
            var file, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, file_ts_1.fileRepository.findById(fileId)];
                    case 1:
                        file = _a.sent();
                        if (!file) {
                            throw new Error("File not found: ".concat(fileId));
                        }
                        return [4 /*yield*/, file_ts_1.fileRepository.update(fileId, {
                                content: file.content,
                                editMetadata: {
                                    lastEditedBy: editedBy,
                                    editedInThreadId: threadId,
                                },
                            })];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        console.error('Failed to update last edit:', error_2);
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get full provenance history for a file
     */
    ProvenanceTrackingService.prototype.getProvenance = function (fileId) {
        return __awaiter(this, void 0, void 0, function () {
            var file, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, file_ts_1.fileRepository.findById(fileId)];
                    case 1:
                        file = _a.sent();
                        if (!file || !file.isAIGenerated) {
                            return [2 /*return*/, null];
                        }
                        return [2 /*return*/, {
                                isAIGenerated: file.isAIGenerated,
                                createdBy: file.createdBy || 'unknown',
                                lastEditedBy: file.lastEditedBy,
                                lastEditedAt: file.lastEditedAt,
                                createdAt: file.createdAt,
                            }];
                    case 2:
                        error_3 = _a.sent();
                        console.error('Failed to get provenance:', error_3);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if file is AI-generated
     */
    ProvenanceTrackingService.prototype.isAIGenerated = function (fileId) {
        return __awaiter(this, void 0, void 0, function () {
            var file, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, file_ts_1.fileRepository.findById(fileId)];
                    case 1:
                        file = _a.sent();
                        return [2 /*return*/, !!(file && file.isAIGenerated)];
                    case 2:
                        error_4 = _a.sent();
                        console.error('Failed to check if AI-generated:', error_4);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return ProvenanceTrackingService;
}());
exports.ProvenanceTrackingService = ProvenanceTrackingService;
exports.provenanceTrackingService = new ProvenanceTrackingService();
