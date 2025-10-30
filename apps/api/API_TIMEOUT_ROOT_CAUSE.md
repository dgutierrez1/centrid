# API Timeout Root Cause Analysis

**Date**: 2025-10-30  
**Status**: 🔴 CRITICAL - Auth flow timing out  
**Impact**: All authenticated API requests failing/timing out

---

## Critical Issues Identified

### 1. 🔴 Environment Variable Mismatch (HIGHEST PRIORITY)

**Location**: `apps/api/src/functions/_shared/db.ts:58`

```typescript
const databaseUrl = process.env.SUPABASE_DB_URL;  // ❌ WRONG
```

**vs** `apps/api/src/db/config.ts:18,36`

```typescript
const databaseUrl = Deno.env.get('DATABASE_URL') || process.env.DATABASE_URL;  // ✅ CORRECT
```

**Impact**: If any service tries to use `_shared/db.ts`, it will fail to find `SUPABASE_DB_URL` and throw an error, causing timeouts.

**Fix**: Standardize on `DATABASE_URL` everywhere.

---

### 2. 🔴 Supabase Client Created Per Request

**Location**: `apps/api/src/functions/api/middleware/auth.ts:30-33`

```typescript
// ❌ Creates NEW client for EVERY request
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!
);
```

**Impact**: 
- No connection pooling/reuse
- Overhead of initializing client on every auth check
- Could exhaust connections under load
- Adds 50-200ms per request

**Fix**: Create singleton Supabase client or reuse from shared helper.

---

### 3. 🟡 Duplicate Database Initialization Systems

**Two competing patterns**:

1. **`_shared/db.ts`** - Per-request connection with cleanup:
   ```typescript
   export async function getDB() {
     const sql = postgres(databaseUrl, DB_CONFIG);
     const db = drizzle(sql, { schema });
     return { db, cleanup: async () => await sql.end() };
   }
   ```

2. **`db/config.ts`** - Singleton pattern:
   ```typescript
   let dbInstance: any = null;
   export function getDbInstance() {
     if (!dbInstance) {
       sqlClient = postgres(databaseUrl);
       dbInstance = drizzle(sqlClient, { schema });
     }
     return dbInstance;
   }
   ```

**Impact**: 
- Confusion about which to use
- Potential for connection leaks if wrong pattern used
- `_shared/db.ts` is designed for edge functions but references wrong env var

**Fix**: Choose ONE pattern and deprecate the other.

---

### 4. 🟡 No Connection Timeout Handling in Auth

**Location**: `apps/api/src/functions/api/middleware/auth.ts:35`

```typescript
const { data: { user }, error } = await supabase.auth.getUser(token);
```

**Issue**: No timeout on the `getUser()` call. If Supabase Auth API is slow/hanging, this will wait indefinitely until edge function timeout (25s default).

**Fix**: Add timeout wrapper:
```typescript
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Auth timeout')), 5000)
);

const authPromise = supabase.auth.getUser(token);

const { data: { user }, error } = await Promise.race([
  authPromise,
  timeoutPromise
]);
```

---

### 5. 🟡 Middleware Execution Order

**Location**: `apps/api/src/functions/api/index.ts:46,136`

```typescript
app.use('*', requestLogger);       // Line 46 - runs for ALL requests
// ...
app.use('/api/*', authMiddleware); // Line 136 - runs for /api/* only
```

**Observation**: `requestLogger` creates a `requestId` (line 10), then `authMiddleware` overwrites it (line 47).

**Impact**: Minor - duplicate `requestId` creation. Not a timeout cause but inefficient.

---

## Timeout Flow Analysis

**What happens when a request comes in**:

1. ✅ CORS middleware runs (~1-5ms)
2. ✅ Request logger runs, creates requestId (~1ms)
3. 🔴 Auth middleware runs:
   - Creates NEW Supabase client (~50-100ms) ⚠️
   - Calls `supabase.auth.getUser(token)` (network call to Supabase Auth API)
   - **IF** Supabase Auth API is slow/down → **TIMEOUT HERE** ⏱️
   - **IF** env vars missing → Error thrown, 500 response
4. 🟢 Route handler runs (if auth succeeds)

**Most Likely Timeout Cause**: Step 3 - Supabase Auth API call hanging or taking too long.

---

## Recommended Fixes (Priority Order)

### IMMEDIATE (Deploy Today)

1. **Fix Environment Variable Mismatch**
   - Change `_shared/db.ts` line 58 to use `DATABASE_URL`
   - Verify env var is set in Supabase Dashboard → Edge Functions → Secrets

2. **Add Auth Timeout**
   - Wrap `supabase.auth.getUser()` in 5-second timeout
   - Return 401 on timeout (don't let it hang)

3. **Cache Supabase Client in Auth Middleware**
   - Create singleton client outside middleware function
   - Reuse for all requests

### SHORT-TERM (This Week)

4. **Consolidate Database Initialization**
   - Choose ONE pattern (recommend `db/config.ts` singleton for edge functions)
   - Deprecate `_shared/db.ts` OR align it to use `DATABASE_URL`

5. **Add Health Check for Database**
   - Add `GET /health/db` endpoint that tests DB connection
   - Monitor this endpoint to detect connection issues early

### LONG-TERM (Next Sprint)

6. **Implement Circuit Breaker for Supabase Auth**
   - If auth calls fail repeatedly, bypass auth temporarily (return 503)
   - Prevents cascading failures

7. **Add Request Tracing**
   - Log timing for each middleware step
   - Identify exactly where timeouts occur

---

## Testing Commands

**Test auth flow**:
```bash
# Test with valid token
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-project.supabase.co/functions/v1/api/health

# Test without token (should fail fast)
curl https://your-project.supabase.co/functions/v1/api/health

# Test with invalid token (should fail fast, not timeout)
curl -H "Authorization: Bearer invalid_token_12345" \
  https://your-project.supabase.co/functions/v1/api/health
```

**Expected response times**:
- No token: <50ms (immediate 401)
- Invalid token: <500ms (Supabase Auth rejects)
- Valid token: <200ms (Supabase Auth validates)

**If seeing >5s responses**: Auth call is timing out.

---

## Environment Variables Checklist

Verify these are set in **Supabase Dashboard → Edge Functions → Secrets**:

- ✅ `DATABASE_URL` (port 6543 for edge functions)
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (for `getSupabase()` in services)

**Test locally**:
```bash
cd apps/api
cat supabase/.env.local  # Should contain all above vars
```

---

## Next Steps

1. **Verify env vars are set** (most likely culprit)
2. **Apply IMMEDIATE fixes** (env var + timeout)
3. **Deploy and test**
4. **Monitor logs** for auth timing

If issue persists after IMMEDIATE fixes, likely a Supabase infrastructure issue (check status.supabase.com).
