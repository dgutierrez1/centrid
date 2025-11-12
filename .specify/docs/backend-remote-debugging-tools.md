---
title: Remote Database Debugging Scripts
summary: Standalone TypeScript scripts for querying remote database and API logs during development
---

<!-- After editing this file, run: npm run sync-docs -->

# Remote Database Debugging Scripts

**What**: Command-line tools that query remote Supabase databases and logs using SQL-like JSON queries and flexible filtering

**Why**: Eliminates need to connect to production database manually or navigate Supabase dashboard—enables fast debugging with structured queries from terminal

**How**:

```bash
# Query database with operator-based filters
npm run db:query '{"table":"threads","where":{"userId":{"eq":"abc-123"}},"limit":10}'

# Query with multiple conditions and ordering
npm run db:query '{"table":"agent_requests","where":{"status":{"in":["failed","pending"]}},"orderBy":{"createdAt":"desc"}}'

# Query API logs with time windows and filters
npm run logs -- --hours=2 --route="/api/threads" --errors

# Search logs for specific terms
npm run logs -- --search="abc-123" --hours=1
```

**Rules**:
- ✅ DO: Use JSON query format for db:query with operators (eq, ne, gt, gte, lt, lte, like, ilike, in, notIn, isNull, isNotNull)
- ✅ DO: Mask sensitive data automatically (checkpoint, toolInput, toolOutput masked by default)
- ✅ DO: Support both inline JSON and file-based queries (`npm run db:query @query.json`)
- ✅ DO: Merge HTTP and console logs in chronological order for complete request lifecycle view
- ❌ DON'T: Expose raw credentials—use environment variables (DATABASE_URL, SUPABASE_PERSONAL_ACCESS_TOKEN)
- ❌ DON'T: Query production without reviewing masked fields list first

**Used in**:
- `apps/api/scripts/db-query.ts` - Generic database query tool with operator support and automatic masking
- `apps/api/scripts/query-api-logs.ts` - Supabase Edge Function log querying with HTTP/console log merging
