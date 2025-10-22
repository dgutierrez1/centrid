# Quick Start: MVP Account Foundation

**Feature**: MVP Account Foundation
**Branch**: `002-mvp-account-foundation`
**Date**: 2025-01-21
**Estimated Time**: 2-3 days

## Overview

This guide provides a streamlined path to implement the MVP account foundation. Follow these steps in order to deliver user signup, login, profile management, and account deletion functionality.

## Prerequisites

Before starting:
- ✅ Backend architecture implemented (schema.ts exists in apps/api/src/db/)
- ✅ Supabase project created and configured
- ✅ Environment variables set in apps/web/.env.local and apps/api/.env
- ✅ Database schema deployed (user_profiles, documents, etc.)
- ✅ RLS policies enabled on all tables

## Quick Reference

| Component | Location | Type |
|-----------|----------|------|
| **Frontend Pages** | `apps/web/src/app/(auth)/` | Next.js App Router |
| **Backend Functions** | `apps/api/src/functions/` | Supabase Edge Functions |
| **Database Schema** | `apps/api/src/db/schema.ts` | Drizzle ORM |
| **UI Components** | `packages/ui/src/components/` | React components |
| **Validation Schemas** | `packages/shared/src/schemas/` | Zod schemas |

## Implementation Steps

### Step 1: Configure Supabase Auth (15 min)

**Supabase Dashboard → Authentication → Providers**

1. **Enable Email Provider**:
   - ✅ Email/Password authentication
   - ⚠️ Email confirmation: DISABLED (MVP only - enable in production)
   - ✅ Secure email change: ENABLED

2. **Auth Settings** (Dashboard → Settings → Auth):
   ```
   Site URL: http://localhost:3000 (dev) / https://centrid.ai (prod)
   Redirect URLs: http://localhost:3000/auth/callback
   JWT Expiry: Default (1 hour) - Custom expiry requires Pro Plan
   ```

   **Note**: For MVP, we're using Supabase's default session timeout (1 hour). Custom JWT expiry configuration is only available on Pro Plan and above.

3. **Email Templates** (Dashboard → Authentication → Email Templates):
   - **Password Reset Template**:
     ```html
     <h2>Reset Your Password</h2>
     <p>Click the link below to reset your password (expires in 1 hour):</p>
     <p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
     ```

4. **Copy Environment Variables**:
   ```bash
   # Add to apps/web/.env.local
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
   SUPABASE_SERVICE_ROLE_KEY=eyJxxx... # server-side only
   ```

**Verification**:
```bash
# Test Supabase connection
cd apps/web
npm run dev
# Visit http://localhost:3000 - no errors in console
```

---

### Step 2: Database Migrations (20 min)

**Add Foreign Key Constraints for Cascade Delete**

1. **Create Migration** (`apps/api/supabase/migrations/0002_cascade_delete.sql`):
   ```sql
   -- Add CASCADE DELETE foreign keys for account deletion (FR-026, FR-027)

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

   -- document_chunks already cascade from documents (defined in schema.ts)
   ```

2. **Run Migration**:
   ```bash
   cd apps/api

   # Local development
   supabase db reset

   # Production
   supabase db push --project-ref <your-project-ref>
   ```

**Verification**:
```sql
-- Run in Supabase SQL Editor
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS foreign_table
FROM pg_constraint
WHERE confdeltype = 'c'; -- CASCADE delete
-- Should show all 5 foreign keys
```

---

### Step 3: Shared Validation Schemas (15 min)

**Create Zod Schemas** (`packages/shared/src/schemas/`)

1. **Auth Schema** (`auth.schema.ts`):
   ```typescript
   import { z } from 'zod'

   const nameFieldSchema = z.string()
     .trim()
     .min(1, 'Name cannot be empty')
     .max(100, 'Name must be less than 100 characters')
     .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters')
     .optional()

   export const signupSchema = z.object({
     email: z.string().email('Invalid email address'),
     password: z.string().min(6, 'Password must be at least 6 characters'),
     firstName: nameFieldSchema,
     lastName: nameFieldSchema
   })

   export const loginSchema = z.object({
     email: z.string().email('Invalid email address'),
     password: z.string().min(6, 'Password must be at least 6 characters')
   })

   export const forgotPasswordSchema = z.object({
     email: z.string().email('Invalid email address')
   })

   export const resetPasswordSchema = z.object({
     password: z.string().min(6, 'Password must be at least 6 characters')
   })

   export type SignupInput = z.infer<typeof signupSchema>
   export type LoginInput = z.infer<typeof loginSchema>
   export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
   export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
   ```

2. **Profile Schema** (`profile.schema.ts`):
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

   export const deleteAccountSchema = z.object({
     confirmation: z.literal('DELETE', {
       errorMap: () => ({ message: 'Type DELETE to confirm' })
     })
   })

   export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
   export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>
   ```

3. **Export Schemas** (`packages/shared/src/schemas/index.ts`):
   ```typescript
   export * from './auth.schema'
   export * from './profile.schema'
   ```

---

### Step 4: Supabase Edge Functions (60 min)

**Create Server-Side Operations**

#### A. Account Creation Function

**File**: `apps/api/src/functions/create-account/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { signupSchema } from '@centrid/shared/schemas'

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  try {
    // Parse and validate request
    const body = await req.json()
    const validation = signupSchema.safeParse(body)

    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: validation.error.errors[0].message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { email, password, firstName, lastName } = validation.data

    // Initialize Supabase client with SERVICE_ROLE_KEY
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Step 1: Create auth account (Supabase Auth handles password hashing/storage)
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password, // Password is NEVER stored in our DB, only in Supabase Auth
      email_confirm: false // MVP: no email confirmation
    })

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Step 2: Create profile (explicit Edge Function, not database trigger)
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
      // Delete auth account to maintain atomicity
      await supabase.auth.admin.deleteUser(authUser.user.id)

      return new Response(
        JSON.stringify({ error: 'Profile creation failed. Please try again.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Success
    return new Response(
      JSON.stringify({ success: true, user: authUser.user }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

#### B. Profile Update Function

**File**: `apps/api/src/functions/update-profile/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { updateProfileSchema } from '@centrid/shared/schemas'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  try {
    // Get JWT from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // Initialize Supabase with ANON_KEY (respects RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verify JWT and get user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate request
    const body = await req.json()
    const validation = updateProfileSchema.safeParse(body)

    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: validation.error.errors[0].message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Update profile (RLS enforces user can only update their own)
    // Only update fields that were provided
    const updates: any = {}
    if (validation.data.firstName !== undefined) updates.first_name = validation.data.firstName
    if (validation.data.lastName !== undefined) updates.last_name = validation.data.lastName

    const { data: profile, error: updateError } = await supabase
      .from('user_profiles')
      .update(updates) // updated_at is auto-updated by database trigger
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Profile update failed' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, profile }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

#### C. Account Deletion Function

**File**: `apps/api/src/functions/delete-account/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { deleteAccountSchema } from '@centrid/shared/schemas'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  try {
    // Get JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify JWT
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate confirmation
    const body = await req.json()
    const validation = deleteAccountSchema.safeParse(body)

    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: validation.error.errors[0].message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Delete user (cascade deletes all related data)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)

    if (deleteError) {
      return new Response(
        JSON.stringify({ error: 'Account deletion failed' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Account deleted successfully. You have been logged out.'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

**Deploy Functions**:
```bash
cd apps/api
supabase functions deploy create-account
supabase functions deploy update-profile
supabase functions deploy delete-account
```

---

### Step 5: Supabase Clients (10 min)

**Create Client Utilities** (`apps/web/src/lib/supabase/`)

1. **Browser Client** (`client.ts`):
   ```typescript
   import { createBrowserClient } from '@supabase/ssr'

   export const createClient = () =>
     createBrowserClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
     )
   ```

2. **Server Client** (`server.ts`):
   ```typescript
   import { createServerClient } from '@supabase/ssr'
   import { cookies } from 'next/headers'

   export const createClient = () => {
     const cookieStore = cookies()

     return createServerClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
       {
         cookies: {
           get(name: string) {
             return cookieStore.get(name)?.value
           },
         },
       }
     )
   }
   ```

---

### Step 6: Frontend Pages (90 min)

**Implement Auth UI**

#### A. Signup Page (`apps/web/src/app/(auth)/signup/page.tsx`)

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Card } from '@centrid/ui/components'
import { signupSchema, type SignupInput } from '@centrid/shared/schemas'

export default function SignupPage() {
  const [formData, setFormData] = useState<SignupInput>({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate
    const validation = signupSchema.safeParse(formData)
    if (!validation.success) {
      setError(validation.error.errors[0].message)
      setLoading(false)
      return
    }

    // Call Edge Function
    const response = await fetch('/functions/v1/create-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validation.data)
    })

    const data = await response.json()

    if (!response.ok) {
      setError(data.error)
      setLoading(false)
      return
    }

    // Success - redirect to dashboard
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8">
        <h1 className="text-2xl font-bold mb-6">Create Account</h1>

        <form onSubmit={handleSignup} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <Input
            type="password"
            placeholder="Password (min 6 characters)"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          <Input
            type="text"
            placeholder="First Name"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
          />
          <Input
            type="text"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating account...' : 'Sign Up'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <a href="/login" className="text-primary-600 hover:underline">
            Log in
          </a>
        </p>
      </Card>
    </div>
  )
}
```

**Implement similarly**:
- Login Page (`apps/web/src/app/(auth)/login/page.tsx`)
- Forgot Password Page (`apps/web/src/app/(auth)/forgot-password/page.tsx`)
- Reset Password Page (`apps/web/src/app/(auth)/reset-password/page.tsx`)
- Profile Settings Page (`apps/web/src/app/(app)/profile/page.tsx`)
- Account Deletion Page (`apps/web/src/app/(app)/account/delete/page.tsx`)

---

### Step 7: Testing (30 min)

**Manual Testing Checklist**

1. **Signup Flow** (User Story 1):
   - [ ] Navigate to /signup
   - [ ] Enter valid email + password → Account created, redirected to dashboard
   - [ ] Check Supabase Dashboard → user exists in auth.users
   - [ ] Check user_profiles table → profile auto-created
   - [ ] Try duplicate email → Error: "Email already exists"
   - [ ] Try invalid email → Error: "Invalid email"
   - [ ] Try short password → Error: "Password min 6 characters"

2. **Login Flow** (User Story 2):
   - [ ] Log out
   - [ ] Navigate to /login
   - [ ] Enter correct credentials → Logged in, redirected to dashboard
   - [ ] Enter wrong password → Error (generic message)
   - [ ] Refresh page → Session persists (still logged in)

3. **Protected Routes** (User Story 3):
   - [ ] Log out
   - [ ] Try accessing /dashboard → Redirected to /login
   - [ ] Log in → Can access /dashboard

4. **Profile Modification** (User Story 4):
   - [ ] Navigate to /profile
   - [ ] Update name → Saved, displayed immediately
   - [ ] Refresh page → Name persists
   - [ ] Try empty name → Validation error

5. **Account Deletion** (User Story 5):
   - [ ] Navigate to /account/delete
   - [ ] Type "DELETE" → Account deleted
   - [ ] Check Supabase: user deleted from auth.users
   - [ ] Check database: profile deleted, documents deleted (cascade)
   - [ ] Try logging in with old credentials → Error

**Performance Testing**:
- [ ] Signup completes in <60s (SC-001)
- [ ] Login completes in <30s (SC-004)
- [ ] Profile update visible in <1s (SC-008)

---

## Common Issues & Solutions

### Issue: "Profile creation failed"
**Cause**: RLS policy blocking insert
**Solution**: Check RLS policies allow INSERT for authenticated users

### Issue: "Unauthorized" when updating profile
**Cause**: JWT not sent in Authorization header
**Solution**: Verify frontend sends `Authorization: Bearer {token}`

### Issue: Account deleted but data remains
**Cause**: Foreign keys missing CASCADE DELETE
**Solution**: Run migration 0002_cascade_delete.sql

### Issue: Session doesn't persist
**Cause**: localStorage not working
**Solution**: Check browser settings, ensure cookies enabled

---

## Success Criteria Validation

| Criterion | Test | Expected Result |
|-----------|------|-----------------|
| SC-001 | Time signup flow | <60 seconds |
| SC-002 | Check orphaned accounts | Zero (100% rollback) |
| SC-003 | Test frontend bypass | All attempts fail (server-side validation) |
| SC-004 | Time login flow | <30 seconds |
| SC-005 | Refresh page while logged in | 100% persistence |
| SC-006 | Try accessing other user's data | Zero cases (RLS blocks) |
| SC-007 | Load test with 100 concurrent signups | No degradation |
| SC-008 | Time profile update | <1 second visible update |
| SC-009 | Delete account, check database | 100% removal (zero orphans) |
| SC-010 | Cancel deletion flow | Zero accidental deletions |

---

## Next Steps

After completing this implementation:

1. **Run `/speckit.tasks`** to generate dependency-ordered task list
2. **Implement tasks** following the generated order
3. **Test thoroughly** using manual testing checklist above
4. **Document issues** in GitHub issues
5. **Deploy to staging** for user acceptance testing

---

## Resources

- **API Contracts**: [contracts/auth.openapi.yaml](./contracts/auth.openapi.yaml), [contracts/profile.openapi.yaml](./contracts/profile.openapi.yaml)
- **Data Model**: [data-model.md](./data-model.md)
- **Research**: [research.md](./research.md)
- **Spec**: [spec.md](./spec.md)
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs

---

**Estimated Total Time**: 2-3 days for full implementation and testing
