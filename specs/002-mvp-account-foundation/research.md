# Research & Technical Decisions: MVP Account Foundation

**Feature**: MVP Account Foundation
**Branch**: `002-mvp-account-foundation`
**Date**: 2025-01-21
**Phase**: 0 (Research)

## Overview

This document resolves technical unknowns identified in the Technical Context and Constitution Check sections of plan.md. It documents research findings, technology choices, and architectural decisions for the MVP account foundation.

## Research Questions

### 1. Design System Workflow for Auth UI

**Question**: Should we design auth UI in `apps/design-system` first, or implement directly in `apps/web` for MVP speed?

**Decision**: Implement directly in `apps/web` with basic styling for MVP, defer design system iteration to post-MVP

**Rationale**:
- **MVP-First Principle**: Constitution IX prioritizes shipping speed over perfect architecture
- **Time Constraint**: Feature must be completable in 2-3 days; design iteration adds 1-2 days
- **Standard Patterns**: Auth UI follows well-established patterns (email/password forms, basic validation)
- **Low Risk**: Auth forms are simple CRUD interfaces with minimal UX complexity
- **Post-MVP Path**: Can refactor to design system after MVP validation

**Implementation Approach**:
- Use existing `packages/ui` components (Button, Input, Card) directly in `apps/web`
- Apply Tailwind utilities from shared config for consistent styling
- Follow mobile-first design (44px touch targets, responsive forms)
- Defer visual polish to post-MVP design iteration

**Alternatives Considered**:
- **Option A: Full design system workflow** - Rejected: Adds 1-2 days for minimal UX gain on standard forms
- **Option B: Hybrid (design key screens only)** - Rejected: Partial investment still delays MVP without full benefits
- **Option C: Implement directly (chosen)** - Accepted: Fastest path to validation, refactor later if needed

### 2. Server-Side Account Creation Architecture

**Question**: How to implement atomic account+profile creation with automatic rollback on Supabase?

**Decision**: Edge Function with sequential operations and explicit rollback on profile creation failure

**Rationale**:
- **Security**: Frontend cannot bypass server-side validation (FR-001)
- **Atomicity**: Both auth account and profile succeed or both fail (FR-005, FR-006)
- **Supabase Constraint**: No native distributed transactions between Auth and Database
- **Rollback Strategy**: Explicit rollback via `admin.deleteUser()` if profile creation fails

**Implementation Pattern**:

```typescript
// apps/api/src/functions/create-account/index.ts
async function createAccount(
  email: string,
  password: string,
  firstName?: string,
  lastName?: string
) {
  // Step 1: Create auth account (Supabase Auth handles password hashing/storage)
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: false // MVP: no email confirmation
  })

  if (authError) {
    return { error: authError, success: false }
  }

  // Step 2: Create profile
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      user_id: authUser.user.id,
      first_name: firstName ?? null,
      last_name: lastName ?? null,
      plan_type: 'free',
      usage_count: 0,
      subscription_status: 'active'
    })

  // Step 3: Rollback on failure
  if (profileError) {
    await supabase.auth.admin.deleteUser(authUser.user.id) // Rollback
    return { error: 'Profile creation failed', success: false }
  }

  return { success: true, user: authUser.user }
}
```

**Note**: Passwords are NEVER stored in our database. Supabase Auth handles all password hashing and storage in `auth.users.encrypted_password`. We only pass the password to Supabase Auth during account creation.

**Alternatives Considered**:
- **Database Trigger**: Auto-create profile on auth.users insert
  - **Rejected**: Edge Function provides explicit control, better error handling, and clearer rollback logic
- **Transaction-like Wrapper**: Custom library for auth+db transactions
  - **Rejected**: Over-engineering for MVP, adds complexity
- **Frontend Direct Creation**: Let frontend call signup, trigger creates profile
  - **Rejected**: Violates FR-001 (server-side validation only)

### 3. Supabase Auth Configuration

**Question**: What Supabase Auth settings are needed for MVP account foundation?

**Decision**: Email/password provider only, email confirmation disabled, 7-day session timeout

**Configuration** (Supabase Dashboard → Authentication):

```yaml
Providers:
  Email Provider: Enabled
  Email Confirmation: Disabled (MVP only - enable in production)
  Social OAuth: Disabled (deferred post-MVP)

Auth Settings:
  Site URL: http://localhost:3000 (dev), https://centrid.ai (prod)
  Redirect URLs: http://localhost:3000/auth/callback
  JWT Expiry: Default (1 hour) - Custom expiry requires Pro Plan, using defaults for MVP

Password Requirements:
  Min Length: 6 characters (acceptable for MVP, industry standard is 8+)
  Complexity: Not enforced (simple validation for MVP)
```

**Rationale**:
- **Email Confirmation Disabled**: Reduces friction for MVP testing (Assumption from spec.md)
- **7-Day Session**: Balanced security/UX (clarification answer from spec.md)
- **Simple Password Rules**: 6 characters minimum (FR-003, acceptable for MVP)
- **No Social OAuth**: Simplifies implementation (Out of Scope in spec.md)

### 4. Password Reset Implementation

**Question**: How to implement secure, time-limited password reset flow?

**Decision**: Supabase Auth built-in password reset with email-based secure links (1-hour expiration)

**Implementation**:

```typescript
// Step 1: User requests reset (forgot-password page)
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`
})

// Step 2: User receives email with secure link
// Link format: https://centrid.ai/reset-password?token=xxx&type=recovery

// Step 3: User sets new password (reset-password page)
const { error } = await supabase.auth.updateUser({
  password: newPassword
})
```

**Rationale**:
- **Built-in Security**: Supabase handles token generation, expiration (1 hour), signature verification
- **FR-015, FR-016**: Email-based reset with time-limited links (1-hour expiration)
- **FR-017, FR-018**: New password setting with expired link rejection
- **No Custom Logic**: Leverages Supabase Auth, reduces implementation time

**Email Template** (Supabase Dashboard → Authentication → Email Templates):
```html
<h2>Reset Your Password</h2>
<p>Click the link below to reset your password (expires in 1 hour):</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
```

### 5. Profile Modification Validation

**Question**: What server-side validation is needed for name field updates?

**Decision**: Zod schema with trim, min/max length, valid character checks for firstName and lastName

**Validation Schema** (packages/shared/src/schemas/profile.schema.ts):

```typescript
import { z } from 'zod'

const nameFieldSchema = z.string()
  .trim()
  .min(1, 'Name cannot be empty')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters')
  .optional()

export const updateProfileSchema = z.object({
  firstName: nameFieldSchema,
  lastName: nameFieldSchema
})
```

**Validation Rules for Profile Updates** (FR-022):
- Both fields optional during profile updates (user can update one or both)
- If provided, non-empty after trimming (prevents whitespace-only names)
- Reasonable length (1-100 characters per field)
- Valid characters (letters, spaces, hyphens, apostrophes)
- No numbers or special characters (names should be text only)
- No emojis (prevents display issues)

**Note**: During signup, firstName and lastName are REQUIRED (not optional). The updateProfileSchema allows optional updates to these existing required fields.

**Implementation** (apps/api/src/functions/update-profile/index.ts):
```typescript
// Server-side validation
const validation = updateProfileSchema.safeParse(requestBody)
if (!validation.success) {
  return new Response(
    JSON.stringify({ error: validation.error.errors[0].message }),
    { status: 400 }
  )
}

// Update profile (only update fields that were provided)
const updates: any = {}
if (validation.data.firstName !== undefined) updates.first_name = validation.data.firstName
if (validation.data.lastName !== undefined) updates.last_name = validation.data.lastName

const { error } = await supabase
  .from('user_profiles')
  .update(updates)
  .eq('user_id', userId)
```

### 6. Account Deletion Cascade Strategy

**Question**: How to ensure complete data removal on account deletion (GDPR compliance)?

**Decision**: Database-level cascade delete + Edge Function for auth account cleanup

**Database Cascade Setup** (apps/api/supabase/migrations/0001_account_foundation.sql):

```sql
-- Add foreign key constraints with CASCADE DELETE
ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

ALTER TABLE documents
  ADD CONSTRAINT documents_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

ALTER TABLE agent_requests
  ADD CONSTRAINT agent_requests_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

ALTER TABLE agent_sessions
  ADD CONSTRAINT agent_sessions_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

ALTER TABLE usage_events
  ADD CONSTRAINT usage_events_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Document chunks cascade from documents (already defined in schema.ts)
ALTER TABLE document_chunks
  ADD CONSTRAINT document_chunks_document_id_fkey
  FOREIGN KEY (document_id)
  REFERENCES documents(id)
  ON DELETE CASCADE;
```

**Edge Function Implementation** (apps/api/src/functions/delete-account/index.ts):

```typescript
async function deleteAccount(userId: string) {
  // Delete auth account (triggers cascade delete of all related data)
  const { error } = await supabase.auth.admin.deleteUser(userId)

  if (error) {
    return { error: 'Account deletion failed', success: false }
  }

  // Cascade automatically deletes:
  // - user_profiles (via FK)
  // - documents (via FK)
  // - document_chunks (via documents FK)
  // - agent_requests (via FK)
  // - agent_sessions (via FK)
  // - usage_events (via FK)

  return { success: true }
}
```

**Rationale**:
- **FR-026, FR-027**: Complete data removal with cascade delete
- **SC-009**: 100% data removal (no orphaned records)
- **GDPR Compliance**: User right to be forgotten
- **Database-Level**: Cascade enforced at DB level (cannot be bypassed)
- **Single Operation**: Delete auth account, database handles the rest

**Confirmation Flow** (FR-025, SC-010):
```typescript
// Step 1: Show warning
"Deleting your account is permanent. All documents, chats, and data will be lost forever."

// Step 2: Require confirmation
"Type 'DELETE' to confirm"

// Step 3: Delete account only after explicit confirmation
if (confirmationInput === 'DELETE') {
  await deleteAccount(userId)
}
```

### 7. Session Management

**Question**: How to implement 7-day session timeout and cross-page persistence?

**Decision**: Supabase Auth JWT with automatic refresh, 7-day expiration

**Implementation**:

```typescript
// Supabase client config (apps/web/src/lib/supabase/client.ts)
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true, // Session persists across page refreshes
        autoRefreshToken: true, // Auto-refresh before expiration
        detectSessionInUrl: true // Handle OAuth redirects
      }
    }
  )

// Auth hook (apps/web/src/hooks/useAuth.ts)
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user }
}
```

**Rationale**:
- **FR-010**: Session persistence across page refreshes (localStorage)
- **FR-014**: Automatic expiration after 7 days (JWT expiry)
- **FR-004**: Refresh the page, user stays logged in
- **Supabase Handles**: Token refresh, expiration, secure storage

### 8. Authentication Service Error Handling

**Question**: How to handle Supabase Auth service failures gracefully?

**Decision**: Retry logic with exponential backoff + user-friendly error messages

**Implementation Pattern**:

```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      if (attempt === maxRetries) throw error

      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt - 1) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw new Error('Max retries exceeded')
}

// Usage in auth operations
try {
  const result = await withRetry(() =>
    supabase.auth.signInWithPassword({ email, password })
  )
} catch (error) {
  // FR-019, FR-020: Clear error + retry capability
  setError('Service temporarily unavailable. Please try again.')
  setShowRetryButton(true)
}
```

**Error Messages** (FR-019):
- **Network Error**: "Cannot connect to authentication service. Check your internet connection."
- **Service Down**: "Authentication service is temporarily unavailable. Please try again in a moment."
- **Rate Limited**: "Too many attempts. Please wait a moment and try again."
- **Unknown**: "An unexpected error occurred. Please try again."

**Rationale**:
- **FR-019, FR-020**: Clear errors + retry capability
- **Clarification Answer**: Show error with retry (Option B from spec.md)
- **User Experience**: Reduces frustration during transient failures
- **Exponential Backoff**: Prevents overwhelming failing service

## Technology Decisions Summary

| Technology | Decision | Rationale |
|------------|----------|-----------|
| **Frontend Framework** | Next.js 14 App Router | Server components, built-in auth patterns, SSR for SEO |
| **Auth Provider** | Supabase Auth | Built-in email/password, JWT, password reset, session management |
| **Database** | PostgreSQL (Supabase) | Already defined in schema.ts, RLS support, foreign keys |
| **Validation** | Zod schemas | Runtime type safety, shared between frontend/backend |
| **State Management** | React useState + Supabase client | Simple auth state, no global state needed for MVP |
| **Styling** | Tailwind + shadcn/ui | Consistent with constitution, mobile-first, rapid development |
| **Testing** | Manual testing (MVP) | Automated tests deferred post-MVP for speed |
| **Session Storage** | localStorage (Supabase default) | Automatic via Supabase client config |
| **Error Handling** | Retry with backoff | Graceful degradation, user-friendly errors |
| **Cascade Delete** | Database foreign keys | GDPR compliance, zero orphaned records |

## Implementation Dependencies

### External Services
- **Supabase Auth**: Email/password provider, password reset emails
- **Supabase Database**: PostgreSQL with foreign key constraints
- **Email Service**: Supabase email templates (password reset)

### Package Dependencies
```json
{
  "dependencies": {
    "@supabase/ssr": "^0.0.10",
    "@supabase/supabase-js": "^2.38.0",
    "next": "^14.0.0",
    "react": "^18.2.0",
    "zod": "^3.22.0"
  }
}
```

### Environment Variables
```env
# Frontend (apps/web/.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx... # server-side only

# Backend (apps/api/.env)
DATABASE_URL=postgresql://...pooler.supabase.com:5432/postgres
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

## Best Practices Applied

### Security
- ✅ Server-side validation (all inputs validated with Zod)
- ✅ RLS policies (user can only access their own data)
- ✅ JWT-based auth (Supabase handles signing/verification)
- ✅ No sensitive data in frontend (service role key server-only)
- ✅ HTTPS only in production (Vercel default)

### Performance
- ✅ Database indexes on `user_id` columns (fast queries)
- ✅ Server components where possible (less client JavaScript)
- ✅ Minimal client state (only auth user object)
- ✅ Optimistic UI updates (immediate feedback on profile edits)

### User Experience
- ✅ Clear error messages (specific, actionable)
- ✅ Loading states (buttons disabled during operations)
- ✅ Mobile-first design (44px touch targets, responsive forms)
- ✅ Session persistence (users stay logged in)
- ✅ Retry capability (service failures recoverable)

### Maintainability
- ✅ Type safety (TypeScript + Zod end-to-end)
- ✅ Shared schemas (frontend/backend use same validation)
- ✅ Component separation (pure UI in packages/ui)
- ✅ Clear file structure (auth components grouped)
- ✅ Constitution compliance (all principles followed)

## Open Questions (None)

All unknowns from Technical Context have been resolved. Ready to proceed to Phase 1 (Design & Contracts).
