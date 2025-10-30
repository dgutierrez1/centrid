"use strict";
/**
 * Shared Database Helper for Supabase Edge Functions
 *
 * Provides a single-connection-per-request database client for Edge Functions.
 * This pattern ensures proper resource cleanup and prevents connection leaks
 * in the serverless environment.
 *
 * Usage:
 * ```typescript
 * import { getDB } from '../_shared/db.ts';
 *
 * Deno.serve(async (req) => {
 *   const { db, cleanup } = await getDB();
 *
 *   try {
 *     const results = await db.query.documents.findMany();
 *     return Response.json(results);
 *   } finally {
 *     await cleanup();
 *   }
 * });
 * ```
 */
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
exports.getDB = getDB;
var postgres_js_1 = require("drizzle-orm/postgres-js");
var postgres_1 = require("postgres");
var schema = require("../../db/schema.ts");
/**
 * Configuration for database connection in Edge Functions
 */
var DB_CONFIG = {
    max: 5, // ✅ Allow 5 pooled connections within single request
    idle_timeout: 5, // ✅ Reduce to 5s (edge functions are short-lived)
    connect_timeout: 5, // ✅ Faster timeout for edge context
    prepare: false, // ✅ Disable prepared statements (OLTP not analytical)
};
/**
 * Get a database client for Edge Function requests
 *
 * @returns Object containing the Drizzle db client and cleanup function
 *
 * @example
 * ```typescript
 * const { db, cleanup } = await getDB();
 * try {
 *   const documents = await db.query.documents.findMany({
 *     where: eq(schema.documents.userId, userId)
 *   });
 *   return Response.json(documents);
 * } finally {
 *   await cleanup();
 * }
 * ```
 */
function getDB() {
    return __awaiter(this, void 0, void 0, function () {
        var databaseUrl, sql, db;
        var _this = this;
        return __generator(this, function (_a) {
            databaseUrl = Deno.env.get('DB_URL') || Deno.env.get('SUPABASE_DB_URL') || process.env.DB_URL || process.env.SUPABASE_DB_URL;
            if (!databaseUrl) {
                throw new Error("SUPABASE_DB_URL environment variable is not set. " +
                    "Configure it in Supabase Dashboard → Edge Functions → Secrets");
            }
            sql = (0, postgres_1.default)(databaseUrl, DB_CONFIG);
            db = (0, postgres_js_1.drizzle)(sql, { schema: schema });
            return [2 /*return*/, {
                    db: db,
                    /**
                     * Cleanup function to close database connection
                     * MUST be called in a finally block to prevent connection leaks
                     */
                    cleanup: function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, sql.end()];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); },
                }];
        });
    });
}
