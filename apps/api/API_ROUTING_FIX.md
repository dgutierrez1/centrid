# API Routing Fix - Timeout Resolution

**Date**: 2025-10-30
**Issue**: API function timing out on all requests
**Root Cause**: Routing mismatch between Supabase path handling and Hono route definitions

## Problem

The API edge function was timing out on every request, including simple health checks. Initial investigation focused on:
- ❌ Database connection issues
- ❌ Auth middleware hanging
- ❌ Environment variable misconfigurations
- ❌ Connection pool exhaustion

**Actual root cause**: No routes were matching incoming requests.

## How Supabase Edge Functions Handle Paths

When you deploy a function named `api`, Supabase:
1. Exposes it at: `https://{project}.supabase.co/functions/v1/api`
2. Strips the `/functions/v1/` prefix
3. Passes the remaining path to your handler

**Example path mapping:**
```
External URL                                  → Path received by Hono
/functions/v1/api                            → /api
/functions/v1/api/health                     → /api/health
/functions/v1/api/threads                    → /api/threads
/functions/v1/api/threads/123/messages       → /api/threads/123/messages
```

## The Bug

Our Hono routes were defined as:
```typescript
app.get('/', ...)              // Expected exactly '/'
app.get('/health', ...)        // Expected '/health'
app.route('/api/threads', ...) // Expected '/api/threads/*'
```

But Supabase was sending:
- `/api` (not `/`)
- `/api/health` (not `/health`)
- `/api/threads` (correct)

**Result**: No routes matched, requests hung until timeout (15-30s).

## The Fix

Changed root routes to match actual incoming paths:

**Before:**
```typescript
app.get('/', (c) => { ... })
app.get('/health', (c) => { ... })
```

**After:**
```typescript
app.get('/api', (c) => { ... })
app.get('/api/health', (c) => { ... })
```

**Other routes** (`/api/threads`, `/api/files`, etc.) were already correct.

## Testing

**Before fix:**
```bash
$ curl https://.../functions/v1/api
# ... hangs for 15s ...
# Timeout error
```

**After fix:**
```bash
$ curl https://.../functions/v1/api
{
  "name": "Centrid API",
  "version": "3.0.6",
  "status": "operational",
  "timestamp": "2025-10-30T06:36:38.610Z"
}
# ✅ Instant response (~200ms)
```

## Diagnosis Process

1. **Minimal Function Test**: Created a minimal Hono app (just 2 routes)
   - Deployed successfully
   - Responded with 404 (not timeout)
   - ✅ This confirmed the full version had an import/initialization issue

2. **Path Debugging**: Added path logging to minimal version
   - Discovered Supabase passes `/api`, not `/`
   - ✅ This revealed the routing mismatch

3. **Fix Applied**: Adjusted root routes to match actual paths
   - Bundle size: 1.659MB (full version)
   - Response time: ~200ms
   - ✅ Timeout resolved

## Lessons Learned

1. **Test routing first**: Before investigating DB connections or auth, verify routes match incoming paths
2. **Minimal reproduction**: Deploy a minimal version to isolate the issue
3. **Log actual paths**: Add debug logging to see what paths are actually received
4. **Understand platform behavior**: Know how your hosting platform (Supabase, Vercel, etc.) handles path routing

## Environment Variable Notes

During investigation, we also standardized on `DB_URL` as the environment variable name (with fallback to `SUPABASE_DB_URL`):

```typescript
const databaseUrl = Deno.env.get('DB_URL') || 
                    Deno.env.get('SUPABASE_DB_URL') || 
                    process.env.DB_URL || 
                    process.env.SUPABASE_DB_URL;
```

This provides compatibility with both naming conventions.

## Current Status

✅ **Resolved**: API responds instantly to all requests
⚠️ **Remaining**: Auth middleware returns "Invalid or expired token" - investigate separately

## Related Files

- `apps/api/src/functions/api/index.ts` - Main API routes (fixed)
- `apps/api/src/functions/_shared/db.ts` - Database connection helper (env var updated)
- `apps/api/src/db/config.ts` - DB singleton config (env var updated)
- `apps/api/API_TIMEOUT_ROOT_CAUSE.md` - Initial investigation (connection issues)
- `apps/api/API_CONNECTION_LEAK_FIX.md` - Repository cleanup fix (still valid)
