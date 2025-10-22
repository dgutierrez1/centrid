# Implementation Plan: MVP Account Foundation

**Branch**: `002-mvp-account-foundation` | **Date**: 2025-01-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-mvp-account-foundation/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement minimal account foundation for MVP: user signup, login, profile creation, password reset, basic profile editing, and account deletion. All account operations are server-controlled with atomic account+profile creation using Edge Function architecture. Focus on security (server-side validation, rollback on failure), GDPR compliance (cascade delete), and user autonomy (profile modification, account deletion).

**Technical Approach**: Server-side Edge Functions for all account operations, Supabase Auth for authentication, PostgreSQL for profile storage, Row Level Security for data isolation, atomic operations with automatic rollback on partial failures.

## Technical Context

**Language/Version**: TypeScript 5.x (Next.js 14+, React 18+)
**Primary Dependencies**: Supabase Auth (@supabase/ssr), Supabase Edge Functions (Deno runtime), Drizzle ORM, Zod validation
**Storage**: PostgreSQL 15+ (Supabase) with `user_profiles`, `documents`, `document_chunks`, `agent_requests`, `agent_sessions`, `usage_events` tables
**Testing**: Manual testing for MVP (signup flow, login flow, profile modification, account deletion, RLS verification)
**Target Platform**: Web (Next.js SSR + client components), mobile PWA (future)
**Project Type**: Web application (monorepo: apps/web frontend, apps/api backend)
**Performance Goals**: Signup completion <60s, login <30s, session persistence 100%, profile updates <1s, zero unauthorized data access
**Constraints**: All account operations server-side only (no frontend direct creation), atomic operations (both auth + profile succeed or both fail), 7-day session timeout, 1-hour password reset link expiration
**Scale/Scope**: 100 concurrent signup/login requests without degradation, 5 UI screens (signup, login, forgot password, reset password, dashboard, profile settings, account deletion)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Component Architecture Discipline ✅
- **Compliance**: UI components in `packages/ui` will be pure presentational (forms, inputs, buttons)
- **Compliance**: Business logic in `apps/web/src/components/` (smart components) and `apps/api/src/functions/` (Edge Functions)
- **Compliance**: Providers for auth state management (`AuthProvider` in `apps/web/src/components/providers/`)

### Principle II: Universal Platform Strategy ✅
- **Compliance**: Mobile-first design required (forms optimized for mobile, 44px touch targets)
- **Compliance**: API-first backend (Edge Functions return JSON, suitable for web + future native apps)
- **Compliance**: PWA as MVP delivery (Next.js with responsive forms)

### Principle IV: Managed Backend Stack ✅
- **Compliance**: Supabase Auth for authentication (email/password, password reset)
- **Compliance**: PostgreSQL for profile storage (`user_profiles` table)
- **Compliance**: Row Level Security enabled on all user tables
- **Compliance**: Edge Functions for server-side account operations

### Principle V: End-to-End Type Safety ✅
- **Compliance**: TypeScript everywhere (frontend + Edge Functions)
- **Compliance**: Database types auto-generated from Supabase schema (Drizzle ORM)
- **Compliance**: Zod validation for all user inputs (email, password, name)
- **Compliance**: Supabase client uses generated Database type

### Principle VIII: Zero-Trust Data Access via RLS ✅
- **Compliance**: RLS enabled on `user_profiles`, `documents`, `document_chunks`, `agent_requests`, `agent_sessions`, `usage_events`
- **Compliance**: All policies enforce `auth.uid() = user_id`
- **Compliance**: Edge Functions use ANON_KEY to respect RLS
- **Compliance**: Server-side validation prevents frontend injection attacks

### Principle IX: MVP-First Discipline ✅
- **Compliance**: Minimal viable implementation (email/password only, no social OAuth)
- **Compliance**: Email confirmation deferred (users can authenticate immediately)
- **Compliance**: Basic password reset included (better UX, prevents support burden)
- **Compliance**: Profile editing limited to display name only (not email/password changes)
- **Compliance**: Scope: Completable in 2-3 days

### Principle X: Monorepo Architecture ✅
- **Compliance**: Frontend in `apps/web/src/app/(auth)/` for auth pages
- **Compliance**: Backend in `apps/api/src/functions/` for Edge Functions
- **Compliance**: Shared types in `packages/shared/src/types/`
- **Compliance**: UI components in `packages/ui/src/components/`

### Principle XI: Visual Design System ✅ RESOLVED
- **Decision**: Implement directly in `apps/web` for MVP speed (research.md Decision 1)
- **Compliance**: Use existing `packages/ui` components (Button, Input, Card)
- **Compliance**: Apply Tailwind utilities from shared config
- **Compliance**: Mobile-first design (44px touch targets)
- **Post-MVP**: Refactor to design system after validation

### GATE STATUS: ✅ PASS (Post-Design Re-evaluation)

**All clarifications resolved in Phase 0 (research.md)**. All principles align with MVP account foundation requirements.

**Re-evaluation Results**:
- ✅ All Phase 1 artifacts generated (data-model.md, contracts/, quickstart.md)
- ✅ Design decisions documented and aligned with constitution
- ✅ No new violations introduced
- ✅ Ready for Phase 2 (task generation via /speckit.tasks)

## Project Structure

### Documentation (this feature)

```
specs/002-mvp-account-foundation/
├── spec.md              # Business specification (complete)
├── plan.md              # This file (/speckit.plan command output - COMPLETE)
├── research.md          # Phase 0 output (COMPLETE)
├── data-model.md        # Phase 1 output (COMPLETE)
├── quickstart.md        # Phase 1 output (COMPLETE)
├── contracts/           # Phase 1 output (COMPLETE)
│   ├── auth.openapi.yaml
│   ├── profile.openapi.yaml
│   └── password-reset.openapi.yaml
├── tasks.md             # Phase 2 output (/speckit.tasks - NOT created by /speckit.plan)
└── checklists/
    └── requirements.md  # Spec validation checklist (complete)
```

### Source Code (repository root)

```
# Web application structure (apps/web + apps/api)

apps/web/
├── src/
│   ├── app/
│   │   ├── (auth)/                    # Auth pages group
│   │   │   ├── signup/
│   │   │   │   └── page.tsx           # Signup page (client component)
│   │   │   ├── login/
│   │   │   │   └── page.tsx           # Login page (client component)
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx           # Forgot password page
│   │   │   ├── reset-password/
│   │   │   │   └── page.tsx           # Reset password page
│   │   │   └── auth/
│   │   │       └── callback/
│   │   │           └── route.ts       # Auth callback handler
│   │   ├── (app)/                     # Protected routes group
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx           # Dashboard (server component)
│   │   │   ├── profile/
│   │   │   │   └── page.tsx           # Profile settings page
│   │   │   └── account/
│   │   │       └── delete/
│   │   │           └── page.tsx       # Account deletion page
│   │   └── layout.tsx                 # Root layout
│   ├── components/
│   │   ├── auth/                      # Smart auth components
│   │   │   ├── SignupForm.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   ├── ForgotPasswordForm.tsx
│   │   │   ├── ResetPasswordForm.tsx
│   │   │   ├── ProfileEditForm.tsx
│   │   │   └── AccountDeleteForm.tsx
│   │   └── providers/
│   │       └── AuthProvider.tsx       # Auth state provider
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts              # Browser Supabase client
│   │       └── server.ts              # Server Supabase client
│   └── hooks/
│       └── useAuth.ts                 # Auth hook

apps/api/
├── src/
│   ├── functions/
│   │   ├── create-account/
│   │   │   └── index.ts               # Server-side account creation Edge Function
│   │   ├── delete-account/
│   │   │   └── index.ts               # Server-side account deletion Edge Function
│   │   └── update-profile/
│   │       └── index.ts               # Server-side profile update Edge Function
│   ├── services/
│   │   ├── auth.service.ts            # Auth business logic (shared across functions)
│   │   └── profile.service.ts         # Profile business logic
│   ├── lib/
│   │   └── supabase.ts                # Supabase client config for Edge Functions
│   └── db/
│       ├── schema.ts                  # Drizzle schema (already exists)
│       └── migrate.ts                 # Migration runner
└── supabase/
    ├── config.toml                    # Supabase config
    └── migrations/                    # Database migrations
        └── 0001_account_foundation.sql  # Account tables + RLS + triggers

packages/ui/
└── src/
    └── components/
        ├── Button.tsx                 # Pure button component
        ├── Input.tsx                  # Pure input component
        ├── Card.tsx                   # Pure card component
        └── index.ts                   # Exports

packages/shared/
└── src/
    ├── types/
    │   ├── database.types.ts          # Auto-generated from Drizzle schema
    │   └── auth.types.ts              # Shared auth types
    └── schemas/
        ├── auth.schema.ts             # Zod schemas for auth (signup, login)
        └── profile.schema.ts          # Zod schemas for profile (update, delete)

tests/
├── integration/
│   ├── auth.test.ts                   # Auth flow tests
│   └── profile.test.ts                # Profile tests
└── contract/
    └── auth.contract.test.ts          # API contract tests
```

**Structure Decision**: Web application structure chosen. Frontend in `apps/web` with auth pages in `(auth)` route group and protected pages in `(app)` route group. Backend in `apps/api` with Edge Functions for server-side operations. Shared validation schemas in `packages/shared` for frontend + backend type safety. Pure UI components in `packages/ui` with no server dependencies.

## Complexity Tracking

*No violations detected - all patterns align with constitution principles.*

No complexity justification needed. Implementation follows standard patterns:
- Server-side Edge Functions (Principle IV: Managed Backend Stack)
- Atomic operations with rollback (Principle VIII: Zero-Trust Data Access)
- Component separation (Principle I: Component Architecture)
- MVP-first scope (Principle IX: MVP-First Discipline)
