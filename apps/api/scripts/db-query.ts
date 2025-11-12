#!/usr/bin/env tsx
/**
 * Generic Database Query Tool with Operator Support
 *
 * Usage:
 *   npm run db:query '{"table":"threads","where":{"userId":{"eq":"abc"}}}'
 *   npm run db:query @query.json
 *
 * Operators:
 *   eq, ne, gt, gte, lt, lte, like, ilike, in, notIn, isNull, isNotNull, or, and
 */

import 'dotenv/config';
import { getDB } from '../src/functions/_shared/db';
import * as schema from '../src/db/schema';
import type { SQL } from 'drizzle-orm';
import { eq, ne, gt, gte, lt, lte, like, ilike, inArray, notInArray, isNull, isNotNull, and, or, desc, asc } from 'drizzle-orm';
import { readFileSync } from 'fs';

// Operator mapping
const OPERATORS = {
  eq, ne, gt, gte, lt, lte, like, ilike,
  in: inArray,
  notIn: notInArray,
  isNull: (field: any) => isNull(field),
  isNotNull: (field: any) => isNotNull(field),
};

// Table name mapping (snake_case to camelCase schema keys)
const TABLES: Record<string, any> = {
  threads: schema.threads,
  messages: schema.messages,
  agent_requests: schema.agentRequests,
  agent_tool_calls: schema.agentToolCalls,
  agent_execution_events: schema.agentExecutionEvents,
  files: schema.files,
  folders: schema.folders,
  documents: schema.documents,
  document_chunks: schema.documentChunks,
  user_profiles: schema.userProfiles,
};

// Sensitive columns to mask
const SENSITIVE: Record<string, string[]> = {
  agent_requests: ['checkpoint'],
  agent_tool_calls: ['toolInput', 'toolOutput'],
};

interface Query {
  table: string;
  where?: any;
  orderBy?: Record<string, 'asc' | 'desc'> | { field: string; direction: 'asc' | 'desc' };
  limit?: number;
}

/**
 * Build WHERE clause from query object
 */
function buildWhere(tableSchema: any, where: any): SQL | undefined {
  if (!where) return undefined;

  const conditions: SQL[] = [];

  for (const [field, condition] of Object.entries(where)) {
    if (field === 'or') {
      // OR conditions: {or: [{field: {eq: "val"}}, {field: {gt: 5}}]}
      const orConditions = (condition as any[]).map(c => buildWhere(tableSchema, c)!).filter(Boolean);
      if (orConditions.length > 0) conditions.push(or(...orConditions)!);
    } else if (field === 'and') {
      // AND conditions (explicit): {and: [{field: {eq: "val"}}, {field: {gt: 5}}]}
      const andConditions = (condition as any[]).map(c => buildWhere(tableSchema, c)!).filter(Boolean);
      if (andConditions.length > 0) conditions.push(and(...andConditions)!);
    } else if (typeof condition === 'object' && condition !== null) {
      // Operator-based condition: {field: {eq: "value"}}
      for (const [op, value] of Object.entries(condition)) {
        const operator = OPERATORS[op as keyof typeof OPERATORS];
        if (!operator) throw new Error(`Unknown operator: ${op}`);

        const column = tableSchema[field];
        if (!column) throw new Error(`Unknown column: ${field} in table`);

        if (op === 'isNull' || op === 'isNotNull') {
          conditions.push(operator(column));
        } else {
          conditions.push(operator(column, value));
        }
      }
    } else {
      // Simple equality shorthand: {field: "value"} → {field: {eq: "value"}}
      const column = tableSchema[field];
      if (!column) throw new Error(`Unknown column: ${field} in table`);
      conditions.push(eq(column, condition));
    }
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Mask sensitive columns in results
 */
function maskSensitive(results: any[], tableName: string) {
  const cols = SENSITIVE[tableName] || [];

  return results.map(row => {
    const masked = { ...row };

    // Mask sensitive columns
    cols.forEach(col => {
      if (masked[col]) masked[col] = '[MASKED]';
    });

    // Special handling: mask tool call inputs in messages.content
    if (tableName === 'messages' && masked.toolCalls) {
      masked.toolCalls = (masked.toolCalls as any[]).map(tc => ({
        ...tc,
        input: '[MASKED]',
      }));
    }

    return masked;
  });
}

/**
 * Execute database query
 */
async function execute(q: Query) {
  const { db, cleanup } = await getDB();

  try {
    // Get table schema
    const table = TABLES[q.table];
    if (!table) {
      throw new Error(`Unknown table: ${q.table}\nAvailable: ${Object.keys(TABLES).join(', ')}`);
    }

    // Build query
    let query = db.select().from(table);

    const whereClause = buildWhere(table, q.where);
    if (whereClause) query = query.where(whereClause);

    if (q.orderBy) {
      // Support two formats:
      // 1. {field: "timestamp", direction: "desc"} - new format
      // 2. {timestamp: "desc", id: "asc"} - original format (multiple fields)
      if ('field' in q.orderBy && 'direction' in q.orderBy) {
        // New format: single field
        const { field, direction } = q.orderBy;
        const column = table[field];
        if (!column) throw new Error(`Unknown column for orderBy: ${field}`);
        const orderFn = direction === 'asc' ? asc : desc;
        query = query.orderBy(orderFn(column));
      } else {
        // Original format: multiple fields
        for (const [field, dir] of Object.entries(q.orderBy)) {
          const column = table[field];
          if (!column) throw new Error(`Unknown column for orderBy: ${field}`);
          const orderFn = dir === 'asc' ? asc : desc;
          query = query.orderBy(orderFn(column));
        }
      }
    }

    query = query.limit(q.limit || 50);

    const results = await query;
    return maskSensitive(results, q.table);
  } finally {
    await cleanup();
  }
}

// CLI entrypoint
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const args = process.argv.slice(2);

  if (!args[0] || args[0] === 'help') {
    console.log(`
Database Query Tool

Usage:
  npm run db:query '<json>'
  npm run db:query @file.json

Query Structure:
  {
    "table": "threads",
    "where": {
      "userId": {"eq": "abc-123"},
      "createdAt": {"gte": "2025-01-01"}
    },
    "orderBy": {"createdAt": "desc"},
    "limit": 10
  }

Operators:
  eq, ne - equals, not equals
  gt, gte, lt, lte - comparisons
  like, ilike - pattern matching
  in, notIn - value in/not in list
  isNull, isNotNull - NULL checks
  or, and - logical operators

Examples:
  npm run db:query '{"table":"threads","where":{"userId":{"eq":"abc"}}}'
  npm run db:query '{"table":"files","where":{"userId":{"eq":"abc"},"path":{"like":"%.ts"}}}'
  npm run db:query '{"table":"agent_requests","where":{"userId":{"eq":"abc"},"status":{"in":["failed","pending"]}}}'

Tables: ${Object.keys(TABLES).join(', ')}
    `);
    process.exit(0);
  }

  // Parse query (from CLI arg or file)
  const queryStr = args[0].startsWith('@')
    ? readFileSync(args[0].slice(1), 'utf-8')
    : args[0];

  const query: Query = JSON.parse(queryStr);

  execute(query)
    .then(results => {
      console.log(JSON.stringify(results, null, 2));
      console.error(`\n✅ Found ${results.length} results`);
    })
    .catch(err => {
      console.error(`❌ Error: ${err.message}`);
      process.exit(1);
    });
}

export { execute, type Query };
