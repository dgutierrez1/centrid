# Auth Hardening - Feature 004 Integration

**Feature Branch**: `004-ai-agent-system`
**Change Type**: New User Story (Security Cross-Cutting Concern)
**Reason**: Discovered security gap during 004 implementation - affects ALL routes including new AI agent routes

---

## Why Add to Feature 004?

**Discovery Context**: While implementing AI agent workspace routes (`/workspace`, `/workspace/[docId]`, `/thread`, `/thread/[threadId]`), security analysis revealed that **6 out of 8 protected routes lack server-side auth checks**.

**Cross-Cutting Impact**:
- ✅ Affects **old routes** (dashboard from 002-mvp-account-foundation)
- ✅ Affects **new routes** (workspace, thread from 004-ai-agent-system)
- ✅ Discovered NOW during 004 implementation
- ✅ Must be fixed BEFORE 004 ships

**Decision**: Add as **User Story 6** in feature 004 with cross-feature scope marker.

---

## Proposed Additions to spec.md

### ADD: New User Story 6 (after User Story 5)

```markdown
### User Story 6 - Server-Side Auth Enforcement (Priority: P0) 🔒 CROSS-FEATURE SECURITY

**Cross-Feature Scope**: This addresses security gaps across multiple features (002-mvp-account-foundation routes + 004-ai-agent-system routes)

All application routes must enforce authentication server-side to prevent HTML leakage to unauthenticated users. This applies to workspace routes (new in this feature) and existing protected routes (dashboard, profile) from previous features.

**Why this priority**: P0 (Critical Security) - Server-side auth enforcement prevents unauthorized access and information disclosure. Without this, sensitive page structure and API endpoints are leaked to unauthenticated users. This MUST be fixed before feature 004 ships.

**Security Impact**:
- **Without fix**: HTML pages sent to unauthenticated users reveal app structure, API endpoints, and potentially sensitive information
- **With fix**: Server returns 307 redirects before rendering any HTML - zero information leakage

**Acceptance Scenarios**:

#### 1. Server-Side Auth Enforcement (ALL Routes)

1. **Given** a user is not logged in, **When** they try to access `/workspace`, **Then** server checks auth BEFORE rendering and returns 307 redirect to `/login?redirect=/workspace` (NO HTML sent)
2. **Given** a user is not logged in, **When** they make direct HTTP request (curl) to `/thread`, **Then** server returns 307 redirect to login, NOT the HTML page
3. **Given** a user is not logged in, **When** they try to access `/dashboard`, **Then** server checks auth BEFORE rendering and redirects to login
4. **Given** a user's session expires, **When** they try to access any protected route, **Then** they are immediately redirected to login with no flash of protected content

#### 2. Public Route Redirects (Authenticated Users)

5. **Given** a user is logged in, **When** they try to access `/login` or `/signup`, **Then** server redirects them to `/dashboard` (prevent confusion)
6. **Given** a user is logged in, **When** they bookmark `/login` and visit it, **Then** server-side redirect to `/dashboard` happens immediately

#### 3. Dynamic Parameter Validation (Workspace & Thread Routes)

7. **Given** a user is logged in, **When** they access `/workspace/[docId]` with a valid docId they own, **Then** they can access the workspace
8. **Given** a user is logged in, **When** they access `/workspace/[docId]` with another user's docId, **Then** server validates ownership and returns 404 Not Found (no data leakage about existence)
9. **Given** a user is logged in, **When** they access `/workspace/[invalid-uuid]`, **Then** server validates UUID format and returns 404 Not Found immediately (no database query)
10. **Given** a user is logged in, **When** they access `/thread/[threadId]` with a valid threadId they own, **Then** they can access the thread
11. **Given** a user is logged in, **When** they access `/thread/[threadId]` with another user's threadId, **Then** server validates ownership and returns 404 Not Found

#### 4. RLS Defense in Depth

12. **Given** app-layer auth is bypassed (hypothetical), **When** attacker attempts direct database access, **Then** RLS policies prevent unauthorized data access (database layer protection)
```

---

## Proposed Additions to plan.md

### ADD: Section "Server-Side Auth Middleware" (after "Real-time Subscriptions" section)

```markdown
## Server-Side Auth Middleware

**Critical Security Pattern**: ALL protected routes use `withServerAuth()` wrapper in `getServerSideProps` to enforce server-side authentication BEFORE rendering HTML.

**Why Server-Side**: Client-side auth checks happen AFTER HTML is sent to browser. This leaks page structure, component code, and API endpoints to unauthenticated users. Server-side checks return HTTP 307 redirects before any HTML rendering.

### Implementation Pattern

```typescript
// apps/web/src/lib/auth/serverAuth.ts

/**
 * Wrapper for protected routes - checks auth server-side before rendering
 *
 * @example Protected route
 * export const getServerSideProps = withServerAuth(async (context, { user, supabase }) => {
 *   // Fetch data here with user.id
 *   return { props: { data } }
 * })
 */
export function withServerAuth(handler, options = {}) {
  return async (context) => {
    const supabase = createServerClient(context)
    const { data: { user } } = await supabase.auth.getUser()

    // Guest-only pages (login/signup)
    if (options.requireGuest) {
      if (user) {
        return { redirect: { destination: '/dashboard', permanent: false } }
      }
      return handler(context, { user: null, supabase })
    }

    // Protected pages (default)
    if (!user) {
      return {
        redirect: {
          destination: `/login?redirect=${encodeURIComponent(context.resolvedUrl)}`,
          permanent: false
        }
      }
    }

    return handler(context, { user, supabase })
  }
}
```

### Protected Routes (Require Auth)

**New in Feature 004** (AI Agent System):
- `/workspace` - Workspace index
- `/workspace/[docId]` - Document workspace (+ ownership validation)
- `/thread` - Thread index
- `/thread/[threadId]` - Thread detail (+ ownership validation)

**Existing from Feature 002** (Account Foundation):
- `/dashboard` - Main dashboard (NEEDS FIX)
- `/dashboard-new` - New dashboard (already has auth ✅)
- `/profile` - Profile settings (already has auth ✅)
- `/account/delete` - Account deletion (already has auth ✅)

### Public Routes (No Auth Required)

**Guest-Only** (redirect authenticated users to /dashboard):
- `/login` - Login form (NEEDS FIX)
- `/signup` - Signup form (NEEDS FIX)
- `/forgot-password` - Password reset request
- `/reset-password` - Password reset form

**Truly Public** (no auth check or redirect):
- `/` - Landing page
- `/landing` - Marketing landing
- `/auth/callback` - OAuth callback handler
- `/account-deleted` - Confirmation after deletion

### Helper Functions

```typescript
/**
 * Validate document ownership - prevents cross-user access
 */
export async function validateDocumentOwnership(supabase, userId, docId) {
  // Validate UUID format first (prevent injection)
  if (!isValidUUID(docId)) return null

  const { data } = await supabase
    .from('documents')
    .select('id, name, user_id')
    .eq('id', docId)
    .eq('user_id', userId)
    .single()

  return data || null
}

/**
 * Validate thread ownership - prevents cross-user access
 */
export async function validateThreadOwnership(supabase, userId, threadId) {
  if (!isValidUUID(threadId)) return null

  const { data } = await supabase
    .from('threads')
    .select('id, title, user_id')
    .eq('id', threadId)
    .eq('user_id', userId)
    .single()

  return data || null
}

/**
 * Validate UUID format - prevents malicious input
 */
export function isValidUUID(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}
```

### Usage Example: Dynamic Route with Ownership Validation

```typescript
// apps/web/src/pages/workspace/[docId].tsx

export const getServerSideProps = withServerAuth(
  async (context, { user, supabase }) => {
    const { docId } = context.params

    // Validate document exists and user owns it
    const document = await validateDocumentOwnership(supabase, user.id, docId)

    if (!document) {
      return { notFound: true }  // 404 (no data leakage)
    }

    // Fetch document content
    const { data: content } = await supabase
      .from('file_contents')
      .select('content')
      .eq('file_id', docId)
      .single()

    return {
      props: {
        document,
        content: content?.content || ''
      }
    }
  }
)
```

### Security Benefits

| Issue | Before | After |
|-------|--------|-------|
| HTML Leakage | ❌ Full HTML sent to unauth users | ✅ 307 redirect only |
| Page Structure Disclosure | ❌ Components/imports visible | ✅ Zero code exposure |
| API Endpoint Disclosure | ❌ Endpoints in client code | ✅ No client code sent |
| Parameter Enumeration | ❌ Can try all UUIDs | ✅ Invalid UUIDs rejected immediately |
| Cross-User Access | ❌ Client-side check only | ✅ Server validates ownership |
| Defense in Depth | ⚠️ RLS only | ✅ App layer + RLS |

### Implementation Checklist

**Phase 1: Create Middleware** (30 minutes)
- [ ] Create `apps/web/src/lib/auth/serverAuth.ts`
- [ ] Implement `withServerAuth()` wrapper
- [ ] Implement ownership validation helpers
- [ ] Implement UUID validation helper

**Phase 2: Update Routes** (2-3 hours)
- [ ] Add auth to `/dashboard.tsx` (old dashboard)
- [ ] Add auth to `/workspace/index.tsx`
- [ ] Add auth + ownership validation to `/workspace/[docId].tsx`
- [ ] Add auth to `/thread/index.tsx`
- [ ] Add auth + ownership validation to `/thread/[threadId].tsx`
- [ ] Add guest-only redirect to `/login.tsx`
- [ ] Add guest-only redirect to `/signup.tsx`

**Phase 3: Verification** (30 minutes)
- [ ] `curl http://localhost:3000/dashboard` → 307 redirect (NO HTML)
- [ ] `curl http://localhost:3000/workspace/abc` → 307 redirect (NO HTML)
- [ ] Login, `curl http://localhost:3000/login` → 307 redirect to /dashboard
- [ ] Login, access `/workspace/invalid-uuid` → 404 Not Found
- [ ] Create 2 users, login as User A, try User B's docId → 404 Not Found
- [ ] Run full test suite → all auth scenarios pass
```

---

## Proposed Additions to tasks.md

### ADD: Phase 0 (Before Phase 1) - Critical Security Hardening

```markdown
## Phase 0: Server-Side Auth Enforcement (NEW) 🔒 SECURITY CRITICAL

**Priority**: P0 (MUST complete before any Phase 1-5 tasks)
**Reason**: Security gap discovered during implementation - affects all routes including new workspace/thread routes
**Scope**: Cross-feature (fixes 002-mvp-account-foundation + 004-ai-agent-system routes)

**Goal**: Enforce server-side authentication on ALL protected routes to prevent HTML leakage and unauthorized access

**Estimated Time**: 3-4 hours total

### Tasks

#### T000: Create Server-Side Auth Middleware (30 minutes)

- [ ] T000.1 [P0] Create `apps/web/src/lib/auth/serverAuth.ts` file
- [ ] T000.2 [P0] Implement `withServerAuth()` wrapper function
  - Handle protected routes (redirect to login if not authenticated)
  - Handle guest-only routes (redirect to dashboard if authenticated)
  - Pass user + supabase to handler
- [ ] T000.3 [P0] Implement `requireAuth()` low-level helper for custom logic
- [ ] T000.4 [P0] Implement `validateDocumentOwnership(supabase, userId, docId)` helper
- [ ] T000.5 [P0] Implement `validateThreadOwnership(supabase, userId, threadId)` helper
- [ ] T000.6 [P0] Implement `isValidUUID(value)` validation helper

**Verification**: TypeScript compiles, all helpers have tests

#### T001: Add Auth to Legacy Protected Routes (1 hour)

**Context**: Routes from 002-mvp-account-foundation that lack server-side auth

- [ ] T001.1 [P0] Add `getServerSideProps` with `withServerAuth()` to `/dashboard.tsx`
- [ ] T001.2 [P0] Test: `curl /dashboard` → 307 redirect to /login (NO HTML)

**Status**: `/dashboard-new.tsx`, `/profile.tsx`, `/account/delete.tsx` already have server-side auth ✅

#### T002: Add Auth to Workspace Routes (1 hour)

**Context**: New routes from 004-ai-agent-system

- [ ] T002.1 [P0] Add `getServerSideProps` with `withServerAuth()` to `/workspace/index.tsx`
- [ ] T002.2 [P0] Add `getServerSideProps` with `withServerAuth()` to `/workspace/[docId].tsx`
  - Validate UUID format with `isValidUUID(docId)`
  - Validate ownership with `validateDocumentOwnership()`
  - Return `{ notFound: true }` if invalid or unauthorized
- [ ] T002.3 [P0] Test: Unauthenticated access → 307 redirect (NO HTML)
- [ ] T002.4 [P0] Test: Invalid UUID → 404 Not Found immediately
- [ ] T002.5 [P0] Test: User A tries User B's docId → 404 Not Found

#### T003: Add Auth to Thread Routes (1 hour)

**Context**: New routes from 004-ai-agent-system

- [ ] T003.1 [P0] Add `getServerSideProps` with `withServerAuth()` to `/thread/index.tsx`
- [ ] T003.2 [P0] Add `getServerSideProps` with `withServerAuth()` to `/thread/[threadId].tsx`
  - Validate UUID format with `isValidUUID(threadId)`
  - Validate ownership with `validateThreadOwnership()`
  - Return `{ notFound: true }` if invalid or unauthorized
- [ ] T003.3 [P0] Test: Unauthenticated access → 307 redirect (NO HTML)
- [ ] T003.4 [P0] Test: Invalid UUID → 404 Not Found immediately
- [ ] T003.5 [P0] Test: User A tries User B's threadId → 404 Not Found

#### T004: Add Guest-Only Redirects to Public Auth Pages (30 minutes)

**Context**: Prevent authenticated users from accessing login/signup (better UX)

- [ ] T004.1 [P0] Add `withServerAuth({ requireGuest: true })` to `/login.tsx`
- [ ] T004.2 [P0] Add `withServerAuth({ requireGuest: true })` to `/signup.tsx`
- [ ] T004.3 [P0] Test: Login, then visit `/login` → 307 redirect to /dashboard
- [ ] T004.4 [P0] Test: Login, then visit `/signup` → 307 redirect to /dashboard

#### T005: Security Verification Checklist (30 minutes)

- [ ] T005.1 [P0] Verify: `curl http://localhost:3000/dashboard` → 307 redirect (NO HTML)
- [ ] T005.2 [P0] Verify: `curl http://localhost:3000/workspace` → 307 redirect (NO HTML)
- [ ] T005.3 [P0] Verify: `curl http://localhost:3000/thread` → 307 redirect (NO HTML)
- [ ] T005.4 [P0] Verify: Login, `curl /login` → 307 redirect to /dashboard
- [ ] T005.5 [P0] Verify: Login, access `/workspace/invalid-uuid` → 404
- [ ] T005.6 [P0] Verify: Create 2 test users, User A tries User B's resource → 404
- [ ] T005.7 [P0] Verify: Session expiry → immediate redirect to login (no flash of content)
- [ ] T005.8 [P0] Run full test suite → all auth scenarios pass

**Checkpoint**: ALL Phase 0 tasks MUST be completed and verified before starting Phase 1

---

## Phase 1: Thread Branching & Graph Management (EXISTING)

_(Continue with existing Phase 1 tasks...)_
```

---

## Proposed Additions to Functional Requirements (spec.md)

### ADD: To "Security & Privacy" Section (Line ~321)

```markdown
#### Security & Privacy

**Existing Requirements** (from previous features):
- **FR-061**: System MUST use Row-Level Security (RLS) policies to enforce user isolation at database level
- **FR-062**: System MUST ensure user can only access their own threads, files, and data
- **FR-063**: System MUST prevent enumeration attacks on thread IDs and file IDs

**NEW Requirements** (Server-Side Auth Enforcement):
- **FR-064**: System MUST perform authentication checks server-side (in `getServerSideProps`) before rendering ANY protected page
- **FR-065**: System MUST return HTTP 307 redirects for unauthenticated requests to protected routes (MUST NOT send HTML)
- **FR-066**: System MUST redirect authenticated users away from guest-only pages (/login, /signup) to /dashboard
- **FR-067**: System MUST validate UUID format for all dynamic route parameters (docId, threadId) BEFORE database queries
- **FR-068**: System MUST validate resource ownership (document, thread) server-side for all dynamic routes
- **FR-069**: System MUST return 404 Not Found for invalid UUIDs or unauthorized resource access (MUST NOT leak existence information)
- **FR-070**: System MUST implement defense in depth with both application-layer auth checks AND RLS policies
```

---

## Proposed Additions to Success Criteria (spec.md)

### ADD: To "Measurable Outcomes" Section (Line ~420)

```markdown
### Security Verification (NEW)

**Auth Enforcement**:
- **SC-001**: Protected routes return 307 redirects for unauthenticated users (0% HTML leakage - verified via curl)
- **SC-002**: Direct HTTP requests to protected routes return redirects, NOT page content (verified via automated tests)
- **SC-003**: Invalid UUIDs in dynamic routes return 404 within <100ms (no database queries - verified via logging)
- **SC-004**: Cross-user resource access attempts return 404 (100% data isolation at app + RLS layers - verified with 2 test users)
- **SC-005**: Session expiry triggers immediate redirect to login (0% flash of protected content - verified via manual testing)
- **SC-006**: Guest-only pages redirect authenticated users to dashboard (100% of login/signup requests - verified via curl)
```

---

## Proposed Additions to research.md

### ADD: New Decision Entry

```markdown
## Decision 5: Server-Side Auth Enforcement for All Routes (2025-10-28)

**Context**: During implementation of AI agent workspace routes (`/workspace`, `/thread`), security analysis of existing codebase revealed critical vulnerability: 6 out of 8 protected routes had NO server-side authentication checks.

**Problem Discovered**:
- Routes with **ONLY** client-side auth: `/dashboard`, `/workspace`, `/workspace/[docId]`, `/thread`, `/thread/[threadId]`
- Routes with ✅ server-side auth: `/profile`, `/account/delete`, `/dashboard-new`
- **Impact**: HTML pages sent to unauthenticated users revealed page structure, component code, API endpoints
- **Attack vector**: `curl http://app.com/dashboard` returned full HTML before client-side redirect
- **Data leakage**: Dynamic routes didn't validate UUIDs or ownership server-side

**Decision**: Enforce server-side authentication for ALL routes using middleware pattern

**Implementation Approach**:
1. **Create reusable auth helpers** (`apps/web/src/lib/auth/serverAuth.ts`):
   - `withServerAuth()` - Wrapper for protected routes
   - `validateDocumentOwnership()` - Ownership validation
   - `validateThreadOwnership()` - Ownership validation
   - `isValidUUID()` - Format validation

2. **Update all protected routes** to use `getServerSideProps` with auth check:
   - New routes (workspace, thread) - add before Phase 1
   - Old routes (dashboard) - fix as part of security hardening

3. **Add guest-only protection** to public auth pages (login, signup):
   - Redirect authenticated users to dashboard
   - Prevents confusion and improves UX

**Alternatives Considered**:
1. **Next.js Middleware** (experimental in Pages Router)
   - ❌ Not stable in Pages Router (only App Router)
   - Deferred to future refactor
2. **Client-side only** (status quo)
   - ❌ Vulnerable to HTML leakage
   - ❌ Page structure disclosure
   - ❌ Rejected
3. **RLS only** (database-layer only)
   - ❌ Insufficient - HTML still sent to browser
   - ❌ Need app-layer checks BEFORE rendering

**Trade-offs**:
- ✅ **Security**: No HTML leakage, proper server-side enforcement
- ✅ **Performance**: Server-side checks add <50ms per request (acceptable)
- ✅ **Maintenance**: Reusable helpers reduce code duplication
- ✅ **Defense in Depth**: App layer + RLS = two layers of protection
- ⚠️ **Migration Effort**: 6 routes need updating (~3-4 hours)
- ⚠️ **Testing Overhead**: Need to verify curl requests return redirects

**Verification Strategy**:
- Manual testing: `curl` requests to all protected routes
- Automated tests: Check HTTP status codes (307 vs 200)
- Cross-user testing: Create 2 test users, verify 404 on unauthorized access
- UUID validation: Test invalid UUIDs return 404 immediately

**Outcome**: Server-side auth pattern adopted as **mandatory standard** for all future protected routes. Phase 0 tasks added to feature 004 to fix existing gaps before proceeding with new features.

**Cross-Feature Impact**:
- Feature 002 (Account Foundation): `/dashboard` fixed
- Feature 004 (AI Agent System): `/workspace`, `/thread` protected before launch
- All future features: Must use `withServerAuth()` pattern from day 1
```

---

## Summary: What Gets Added to Feature 004 Docs

| Document | Section | Lines Added | Type |
|----------|---------|-------------|------|
| `spec.md` | User Story 6 (NEW) | ~60 lines | NEW security user story |
| `spec.md` | FR-064 to FR-070 (7 requirements) | ~25 lines | NEW functional requirements |
| `spec.md` | SC-001 to SC-006 (6 criteria) | ~20 lines | NEW success criteria |
| `plan.md` | "Server-Side Auth Middleware" section | ~150 lines | NEW implementation guide |
| `tasks.md` | Phase 0 (NEW - before Phase 1) | ~80 lines | NEW critical security phase |
| `research.md` | Decision 5 entry | ~50 lines | NEW decision log |

**Total**: ~385 lines of specification updates

**Why in Feature 004 Instead of 002**:
1. ✅ Discovered during 004 implementation
2. ✅ Affects 004 routes (workspace, thread) that need protection
3. ✅ Must be fixed BEFORE 004 ships
4. ✅ Cross-feature impact documented in spec ("Cross-Feature Scope" marker)
5. ✅ Implementation context is fresh (team is actively working on 004)

**Traceability**:
- User Story 6 clearly marked as "CROSS-FEATURE SECURITY"
- Affects routes from both 002 and 004
- Decision log explains discovery context
- Phase 0 tasks explain which routes are from which feature

---

## How to Apply

Run `/speckit.refactor` on **feature 004**:

```bash
cd specs/004-ai-agent-system
/speckit.refactor "add server-side auth enforcement as User Story 6 - harden all protected routes including workspace and thread with server-side checks, dynamic parameter validation, and guest-only redirects for login/signup"
```

Or apply manually by copying sections from this document into the corresponding files in `specs/004-ai-agent-system/`.
