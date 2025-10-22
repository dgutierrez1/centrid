# Tasks: MVP Account Foundation

**Feature Branch**: `002-mvp-account-foundation`
**Status**: ✅ **FEATURE COMPLETE - Ready for PR**
**Date**: 2025-01-22

**Input**: Design documents from `/specs/002-mvp-account-foundation/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Tests**: Manual testing only for MVP (automated tests deferred post-MVP per plan.md)

---

## 🎉 Implementation Complete

All 124 tasks have been completed successfully:
- **Implementation**: 83 code tasks ✅
- **Manual Testing**: 41 testing tasks ✅
- **Deployment**: Database schema + 3 Edge Functions ✅
- **Success Criteria**: All 10 criteria met ✅

**What's Deployed**:
- Database schema with CASCADE DELETE foreign keys & RLS policies
- 3 Edge Functions: create-account, update-profile, delete-account
- 8 frontend pages: signup, login, forgot-password, reset-password, auth/callback, dashboard, profile, account/delete
- Shared libraries: validation schemas, Supabase clients, auth utilities

**Next Action**: Create pull request to merge into main branch

## Format: `- [ ] [ID] [P?] [Story?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create Zod validation schemas in packages/shared/src/schemas/auth.schema.ts
- [X] T002 Create Zod validation schemas in packages/shared/src/schemas/profile.schema.ts
- [X] T003 [P] Export schemas from packages/shared/src/schemas/index.ts
- [X] T004 [P] Configure Supabase Auth settings (email provider, email templates) in Supabase Dashboard (Note: JWT expiry config requires Pro Plan - using Supabase defaults for MVP)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Create database migration 0002_cascade_delete.sql in apps/api/supabase/migrations/
- [X] T006 Apply migration to add CASCADE DELETE foreign keys for all user-related tables (requires Supabase CLI)
- [X] T007 [P] Create browser Supabase client in apps/web/src/lib/supabase/client.ts
- [X] T008 [P] Create server Supabase client in apps/web/src/lib/supabase/server.ts
- [X] T009 [P] Create useAuth hook in apps/web/src/hooks/useAuth.ts
- [X] T010 [P] Create AuthProvider in apps/web/src/components/providers/AuthProvider.tsx
- [X] T011 Verify RLS policies exist on all tables (user_profiles, documents, agent_requests, etc.)
- [X] T012 Test local Supabase connection and RLS enforcement

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - New User Account Creation (Priority: P1) 🎯 MVP

**Goal**: Users can complete signup flow - enter email/password, submit form, and gain authenticated access with auto-created profile

**Independent Test**: User can create account, profile is auto-created atomically, user sees personalized dashboard

### Backend for User Story 1

- [X] T013 [P] [US1] Create Edge Function create-account/index.ts in apps/api/src/functions/create-account/
- [X] T014 [US1] Implement server-side validation using signupSchema from @centrid/shared/schemas
- [X] T015 [US1] Implement atomic account+profile creation with rollback logic (createUser → insert profile → rollback on failure)
- [X] T016 [US1] Add error handling for duplicate email, validation errors, service unavailability
- [X] T017 [US1] Deploy create-account Edge Function to Supabase (requires Supabase CLI)

### Frontend for User Story 1

- [X] T018 [P] [US1] Create signup page in apps/web/src/pages/signup.tsx (adapted for Pages Router)
- [X] T019 [US1] Implement SignupForm with email, password, firstName, lastName inputs
- [X] T020 [US1] Add client-side Zod validation before submitting to Edge Function
- [X] T021 [US1] Implement loading state, error display, and success redirect to dashboard
- [X] T022 [US1] Add link to login page for existing users

**Checkpoint**: At this point, User Story 1 should be fully functional - users can create accounts and profiles atomically

---

## Phase 4: User Story 2 - Returning User Login (Priority: P1) 🎯 MVP

**Goal**: Existing users can log in with email/password and access their personalized content

**Independent Test**: User with existing credentials can log in, see dashboard with their data, session persists on refresh

### Frontend for User Story 2

- [X] T023 [P] [US2] Create login page in apps/web/src/pages/login.tsx (adapted for Pages Router)
- [X] T024 [US2] Implement LoginForm with email and password inputs
- [X] T025 [US2] Integrate Supabase Auth signInWithPassword method
- [X] T026 [US2] Add client-side validation using loginSchema from @centrid/shared/schemas
- [X] T027 [US2] Implement loading state, generic error messages (no email enumeration), success redirect
- [X] T028 [US2] Add links to signup page and forgot password page
- [X] T029 [US2] Test session persistence across page refreshes (manual testing)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - signup + login functional

---

## Phase 5: User Story 3 - Accessing Protected Content (Priority: P1) 🎯 MVP

**Goal**: Enforce authentication - unauthenticated users redirected to login, authenticated users only see their own data

**Independent Test**: Logged-out users cannot access dashboard, logged-in users only see their own data (RLS enforced)

### Implementation for User Story 3

- [X] T030 [P] [US3] Create auth callback page in apps/web/src/pages/auth/callback.tsx (adapted for Pages Router)
- [X] T031 [P] [US3] Create protected dashboard page in apps/web/src/pages/dashboard-new.tsx (adapted for Pages Router)
- [X] T032 [US3] Implement server-side auth check using getServerSideProps
- [X] T033 [US3] Redirect unauthenticated users to /login with redirect parameter
- [X] T034 [US3] Display user email and welcome message on dashboard
- [X] T035 [US3] Add logout button with Supabase signOut integration
- [X] T036 [US3] Test multi-user isolation: create 2 accounts, verify user A cannot see user B's data (manual testing)

**Checkpoint**: All P1 user stories (signup, login, protected access) should now be independently functional

---

## Phase 6: User Story 4 - Profile Modification (Priority: P2)

**Goal**: Authenticated users can update their display name and see changes immediately

**Independent Test**: User can update firstName/lastName, changes persist and display across UI immediately (<1s)

### Backend for User Story 4

- [X] T037 [P] [US4] Create Edge Function update-profile/index.ts in apps/api/src/functions/update-profile/
- [X] T038 [US4] Implement JWT verification using getUser from Supabase Auth
- [X] T039 [US4] Implement server-side validation using updateProfileSchema from @centrid/shared/schemas
- [X] T040 [US4] Implement profile UPDATE with RLS enforcement (only user's own profile)
- [X] T041 [US4] Return updated profile with auto-updated updated_at timestamp
- [X] T042 [US4] Deploy update-profile Edge Function to Supabase (requires Supabase CLI)

### Frontend for User Story 4

- [X] T043 [P] [US4] Create profile settings page in apps/web/src/pages/profile.tsx (adapted for Pages Router)
- [X] T044 [US4] Fetch current profile data using getServerSideProps
- [X] T045 [US4] Implement ProfileEditForm with firstName and lastName inputs
- [X] T046 [US4] Add client-side validation using updateProfileSchema from @centrid/shared/schemas
- [X] T047 [US4] Implement save button that calls update-profile Edge Function with JWT
- [X] T048 [US4] Display success feedback and immediately update UI with new name
- [X] T049 [US4] Add error handling for validation errors and server failures

**Checkpoint**: At this point, User Stories 1-4 should work independently - users can modify their profiles

---

## Phase 7: User Story 5 - Account Deletion (Priority: P2)

**Goal**: Users can permanently delete their account with confirmation, all data removed via cascade delete

**Independent Test**: User deletes account after confirmation, all data removed (auth, profile, documents), login fails with old credentials

### Backend for User Story 5

- [X] T050 [P] [US5] Create Edge Function delete-account/index.ts in apps/api/src/functions/delete-account/
- [X] T051 [US5] Implement JWT verification using getUser from Supabase Auth
- [X] T052 [US5] Implement confirmation validation using deleteAccountSchema from @centrid/shared/schemas
- [X] T053 [US5] Implement account deletion using admin.deleteUser (triggers cascade delete)
- [X] T054 [US5] Add error handling and success response with logout message
- [X] T055 [US5] Deploy delete-account Edge Function to Supabase (requires Supabase CLI)

### Frontend for User Story 5

- [X] T056 [P] [US5] Create account deletion page in apps/web/src/pages/account/delete.tsx (adapted for Pages Router)
- [X] T057 [US5] Display prominent warning message about permanent data loss
- [X] T058 [US5] Implement confirmation input requiring user to type "DELETE"
- [X] T059 [US5] Add client-side validation using deleteAccountSchema from @centrid/shared/schemas
- [X] T060 [US5] Implement delete button that calls delete-account Edge Function with JWT
- [X] T061 [US5] On success, sign out user and redirect to public confirmation page
- [X] T062 [US5] Add cancel button to prevent accidental deletion

**Checkpoint**: All user stories (P1 + P2) should now be independently functional - full account foundation complete

---

## Phase 8: Password Reset Flow

**Goal**: Users can request password reset via email and set new password using secure, time-limited link

**Independent Test**: User receives reset email, clicks link, sets new password, automatically logged in

### Frontend for Password Reset

- [X] T063 [P] Create forgot password page in apps/web/src/pages/forgot-password.tsx (adapted for Pages Router)
- [X] T064 Implement ForgotPasswordForm with email input
- [X] T065 Add client-side validation using forgotPasswordSchema from @centrid/shared/schemas
- [X] T066 Integrate Supabase Auth resetPasswordForEmail with redirectTo parameter
- [X] T067 Display success message: "Check your email for reset link (expires in 1 hour)"
- [X] T068 [P] Create reset password page in apps/web/src/pages/reset-password.tsx (adapted for Pages Router)
- [X] T069 Implement ResetPasswordForm with new password and confirm password inputs
- [X] T070 Add client-side validation using resetPasswordSchema from @centrid/shared/schemas
- [X] T071 Integrate Supabase Auth updateUser to set new password
- [X] T072 Handle expired/invalid token errors with clear messages and "Request new link" button
- [X] T073 On success, redirect to dashboard (user auto-logged in)

**Checkpoint**: Password reset flow complete - users can recover access to their accounts

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T074 [P] Add navigation links between auth pages (signup ↔ login ↔ forgot-password)
- [X] T075 [P] Add navigation from dashboard to profile settings and account deletion
- [X] T076 Implement consistent error handling across all auth operations
- [X] T077 Add retry logic with exponential backoff for service failures
- [X] T078 Ensure all forms have proper loading states (disabled buttons during submission)
- [X] T079 [P] Verify mobile-first design: all touch targets ≥44px, forms work on mobile
- [X] T080 [P] Verify keyboard navigation: tab order correct, enter submits forms
- [X] T081 [P] Verify accessibility: labels present, errors announced, focus states visible
- [X] T082 Add rate limiting handling for password reset requests
- [X] T083 Ensure all error messages are user-friendly and actionable
- [X] T084 Test with multiple users to verify zero data leakage (RLS working)

---

## Phase 10: Manual Testing & Validation

**Purpose**: Comprehensive testing per quickstart.md checklist

### Signup Flow (User Story 1) ✅ ALL PASSED

- [X] T085 Test valid signup: email + password → account created, dashboard visible
- [X] T086 Test duplicate email → error: "Email already exists"
- [X] T087 Test invalid email format → error with email requirements
- [X] T088 Test short password → error: "Password min 6 characters"
- [X] T089 Verify profile auto-created with plan_type='free', usage_count=0
- [X] T090 Verify orphaned account rollback: simulate profile creation failure, confirm auth account deleted

### Login Flow (User Story 2) ✅ ALL PASSED

- [X] T091 Test correct credentials → logged in, redirected to dashboard
- [X] T092 Test incorrect password → generic error (no email enumeration)
- [X] T093 Test unregistered email → generic error (same as incorrect password)
- [X] T094 Test session persistence: refresh page → still logged in
- [X] T095 Test logout → redirected to login, cannot access dashboard

### Protected Routes (User Story 3) ✅ ALL PASSED

- [X] T096 Test unauthenticated access to /dashboard → redirected to /login
- [X] T097 Test authenticated access to /dashboard → allowed
- [X] T098 Create 2 test accounts, verify user A cannot see user B's data (RLS)

### Profile Modification (User Story 4) ✅ ALL PASSED

- [X] T099 Test update firstName + lastName → saved, displayed immediately
- [X] T100 Test update firstName only → saved, lastName unchanged
- [X] T101 Test update lastName only → saved, firstName unchanged
- [X] T102 Test empty name → validation error
- [X] T103 Test invalid characters (numbers, emojis) → validation error
- [X] T104 Test name persistence: update, refresh page → changes persist

### Account Deletion (User Story 5) ✅ ALL PASSED

- [X] T105 Test deletion without confirmation → prevented
- [X] T106 Test deletion with "DELETE" → account deleted, logged out
- [X] T107 Verify cascade delete: check database for zero orphaned records
- [X] T108 Test login with deleted credentials → error: "Account not found"
- [X] T109 Test cancel deletion → no deletion occurs, account remains active

### Password Reset Flow ✅ ALL PASSED

- [X] T110 Test forgot password: valid email → "Check your email" message
- [X] T111 Test forgot password: invalid email format → validation error
- [X] T112 Receive reset email, verify link format and expiration time
- [X] T113 Test reset with valid token + valid password → success, auto-logged in
- [X] T114 Test reset with expired token → error: "Link expired"
- [X] T115 Test reset with invalid token → error: "Invalid link"
- [X] T116 Test reset with short password → validation error

### Performance Testing ✅ ALL PASSED

- [X] T117 Measure signup time → target <60s (SC-001)
- [X] T118 Measure login time → target <30s (SC-004)
- [X] T119 Measure profile update visibility → target <1s (SC-008)
- [X] T120 Test 100 concurrent signups → no degradation (SC-007)

### Security & Data Isolation ✅ ALL PASSED

- [X] T121 Verify all Edge Functions enforce server-side validation (no frontend bypass)
- [X] T122 Verify RLS blocks unauthorized data access across all tables
- [X] T123 Verify cascade delete removes 100% of user data (SC-009)
- [X] T124 Verify zero orphaned accounts exist after failed profile creation (SC-002)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-8)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 stories → P2 stories → Password Reset)
- **Polish (Phase 9)**: Depends on all user stories being complete
- **Testing (Phase 10)**: Depends on all implementation phases

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies (login is independent)
- **User Story 3 (P1)**: Depends on US1 and US2 (needs signup/login to test protected routes)
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Requires auth but independent feature
- **User Story 5 (P2)**: Can start after Foundational (Phase 2) - Requires auth but independent feature
- **Password Reset**: Can start after Foundational (Phase 2) - Independent of user stories

### Within Each User Story

- Backend Edge Functions before Frontend pages (need API to call)
- Validation schemas before implementation (shared dependency)
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 1 (Setup)**: T001, T002, T003, T004 can all run in parallel

**Phase 2 (Foundational)**: T007+T008+T009+T010 can run in parallel after T005+T006 complete

**Phase 3 (US1)**: T013 (backend) and T018 (frontend) can start in parallel after foundational

**Phase 4 (US2)**: T023-T029 can all start after foundational (independent from US1)

**Phase 5 (US3)**: T030+T031 can run in parallel

**Phase 6 (US4)**: T037 (backend) and T043 (frontend) can start in parallel

**Phase 7 (US5)**: T050 (backend) and T056 (frontend) can start in parallel

**Phase 8 (Password Reset)**: T063+T068 can run in parallel

**Phase 9 (Polish)**: T074, T075, T079, T080, T081 can run in parallel

---

## Parallel Example: User Story 1 (Account Creation)

```bash
# Backend and Frontend can start in parallel:
Task T013: "Create Edge Function create-account/index.ts"
Task T018: "Create signup page page.tsx"

# Then sequential within each track:
Backend: T013 → T014 → T015 → T016 → T017
Frontend: T018 → T019 → T020 → T021 → T022
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Signup)
4. Complete Phase 4: User Story 2 (Login)
5. Complete Phase 5: User Story 3 (Protected Access)
6. **STOP and VALIDATE**: Test P1 stories independently
7. Deploy/demo if ready (MVP complete!)

### Incremental Delivery (Full Feature)

1. Complete Setup + Foundational → Foundation ready
2. Add User Stories 1-3 (P1) → Test → Deploy (MVP!)
3. Add User Story 4 (Profile Edit) → Test → Deploy
4. Add User Story 5 (Account Delete) → Test → Deploy
5. Add Password Reset → Test → Deploy
6. Add Polish → Test → Deploy (Full feature!)

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (Phases 1-2)
2. Once Foundational is done:
   - Developer A: User Story 1 + 2 (signup + login)
   - Developer B: User Story 3 + 4 (protected access + profile edit)
   - Developer C: User Story 5 + Password Reset
3. Stories complete and integrate independently

---

## Task Summary

**Total Tasks**: 124

**Phase Breakdown**:
- Phase 1 (Setup): 4 tasks
- Phase 2 (Foundational): 8 tasks
- Phase 3 (US1 - Signup): 10 tasks
- Phase 4 (US2 - Login): 7 tasks
- Phase 5 (US3 - Protected): 7 tasks
- Phase 6 (US4 - Profile): 13 tasks
- Phase 7 (US5 - Delete): 13 tasks
- Phase 8 (Password Reset): 11 tasks
- Phase 9 (Polish): 11 tasks
- Phase 10 (Testing): 40 tasks

**User Story Distribution**:
- US1 (Signup): 10 tasks
- US2 (Login): 7 tasks
- US3 (Protected): 7 tasks
- US4 (Profile): 13 tasks
- US5 (Delete): 13 tasks
- Password Reset: 11 tasks
- Foundational: 12 tasks
- Testing: 40 tasks
- Polish: 11 tasks

**Parallel Opportunities**: 29 tasks marked [P] for concurrent execution

**MVP Scope (P1 only)**: Phases 1-5 = 36 tasks (Setup + Foundational + US1 + US2 + US3)

**Format Validation**: ✅ All tasks follow checklist format (checkbox, ID, optional [P] and [Story] labels, file paths)

---

## Notes

- All tasks follow strict checklist format: `- [ ] [ID] [P?] [Story?] Description with file path`
- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Manual testing only for MVP (automated tests deferred post-MVP)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Tests are in Phase 10 to match quickstart.md validation approach
