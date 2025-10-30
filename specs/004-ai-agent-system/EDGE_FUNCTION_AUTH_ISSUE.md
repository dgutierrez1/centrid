# Edge Function Authentication Issue

**Date**: 2025-10-28
**Status**: 🔴 BLOCKED

## Problem Summary

The workspace page loads successfully and is protected by server-side authentication, but client-side Edge Function calls are returning **401 Unauthorized**.

### Symptoms

1. ✅ User can log in successfully
2. ✅ `/workspace` page loads (server-side auth validates)
3. ✅ `useLoadThreads` hook fires correctly
4. ❌ `supabase.functions.invoke('list-threads')` returns **401**
5. ❌ Console error: "Edge Function returned a non-2xx status code"

### Error Stack

```
Failed to load resource: the server responded with a status of 401 ()
Error loading threads: FunctionsHttpError: Edge Function returned a non-2xx status code
    at FunctionsClient.eval (FunctionsClient.js:96:27)
```

## Root Cause Analysis

### Server-Side Auth (✅ Working)

**File**: `apps/web/src/pages/workspace/index.tsx`
```typescript
export const getServerSideProps: GetServerSideProps = withServerAuth(
  async (context, { user, supabase }) => {
    return { props: {} };
  }
);
```

- Uses `withServerAuth` HOC
- Reads session from **HTTP-only cookies**
- Validates JWT server-side
- Returns 307 redirect if unauthenticated

### Client-Side Auth (❌ Broken)

**File**: `apps/web/src/lib/supabase/client.ts`
```typescript
export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

- Uses `createBrowserClient` from `@supabase/ssr`
- Expected to read session from **localStorage**
- Should automatically attach JWT to function calls
- **But**: Not attaching Authorization header

### The Disconnect

**Server-Side Session Flow**:
1. User logs in → JWT stored in **HTTP-only cookies**
2. `getServerSideProps` reads cookies via SSR
3. Page renders successfully

**Client-Side Session Flow**:
1. User logs in → JWT should be in **localStorage**
2. `createBrowserClient` should read from localStorage
3. Function calls should auto-attach `Authorization: Bearer <jwt>`
4. **Problem**: localStorage doesn't have the session

## Why This Happens

The `@supabase/ssr` package uses different storage strategies:

- **Server**: Reads from cookies (via Next.js request)
- **Client**: Reads from localStorage

When using `@supabase/ssr`, the session must be synced between server and client. The typical pattern is:

1. Server reads session from cookies
2. Server passes session data to client via props
3. Client hydrates Supabase client with session

**We're missing step 2 and 3**.

## Solution Options

### Option 1: Pass Session via Props (Recommended)

Update `workspace/index.tsx`:

```typescript
export const getServerSideProps: GetServerSideProps = withServerAuth(
  async (context, { user, supabase }) => {
    const { data: { session } } = await supabase.auth.getSession();

    return {
      props: {
        initialSession: session,
      }
    };
  }
);
```

Update `WorkspaceContainer`:

```typescript
export function WorkspaceContainer({ initialSession }: { initialSession: Session | null }) {
  useEffect(() => {
    if (initialSession) {
      supabase.auth.setSession({
        access_token: initialSession.access_token,
        refresh_token: initialSession.refresh_token,
      });
    }
  }, [initialSession]);

  // ... rest of component
}
```

### Option 2: Use Middleware to Sync Session

Create `apps/web/src/middleware.ts`:

```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  await supabase.auth.getSession()
  return res
}

export const config = {
  matcher: ['/workspace/:path*'],
}
```

This automatically syncs cookies → localStorage.

### Option 3: Change to Cookie-Based Client

Use `createServerClient` on client-side with custom cookie handling (complex).

## Recommended Fix

**Option 1** is simplest and most explicit. It:
- ✅ Works with existing SSR setup
- ✅ No middleware needed
- ✅ Clear data flow (server → props → client)
- ✅ Compatible with `@supabase/ssr`

## Files to Modify

1. **`apps/web/src/pages/workspace/index.tsx`**
   - Add `initialSession` to returned props

2. **`apps/web/src/pages/workspace/[docId].tsx`**
   - Add `initialSession` to returned props

3. **`apps/web/src/components/ai-agent/WorkspaceContainer.tsx`**
   - Accept `initialSession` prop
   - Call `supabase.auth.setSession()` on mount

4. **Test all protected routes** to ensure pattern is consistent

## Testing Plan

After implementing fix:

1. Clear browser localStorage
2. Clear browser cookies
3. Log in fresh
4. Navigate to `/workspace`
5. Open browser Network tab
6. Verify `list-threads` request has `Authorization: Bearer <jwt>` header
7. Verify response is 200 OK (not 401)
8. Verify threads load in sidebar

## Related Issues

- Session timing issue (hook fires before localStorage synced)
- Server/client session storage mismatch
- `@supabase/ssr` documentation unclear on session hydration

## Next Steps

1. ✅ Document the issue (this file)
2. ⏳ Implement Option 1 fix
3. ⏳ Test authentication flow end-to-end
4. ⏳ Test thread creation + navigation
5. ⏳ Test message sending
