# Data Model: MVP Account Foundation

**Feature**: MVP Account Foundation
**Branch**: `002-mvp-account-foundation`
**Date**: 2025-01-21
**Phase**: 1 (Design & Contracts)

## Overview

This document defines the data model for MVP account foundation, extracted from functional requirements in spec.md. The model leverages the existing Drizzle schema defined in `apps/api/src/db/schema.ts`.

## Core Entities

### User Account (Managed by Supabase Auth)

**Table**: `auth.users` (Supabase managed)

**Purpose**: Represents authentication credentials and identity

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | uuid | Primary Key | Unique user identifier |
| `email` | text | Unique, Not Null | Email address (unique identifier) |
| `encrypted_password` | text | Not Null | Password (securely hashed) |
| `email_confirmed_at` | timestamp | Nullable | Email confirmation timestamp (null for MVP) |
| `last_sign_in_at` | timestamp | Nullable | Last login timestamp |
| `created_at` | timestamp | Not Null, Default NOW() | Account creation timestamp |
| `updated_at` | timestamp | Not Null, Default NOW() | Last update timestamp |

**Validation Rules** (from FR-002, FR-003):
- Email must be valid format (RFC 5322)
- Password minimum 6 characters
- Email must be unique (enforced by Supabase)

**State Transitions**:
```
[New] --signup--> [Active]
[Active] --delete--> [Deleted]
```

**Relationships**:
- One-to-One with User Profile (auto-created on signup)
- One-to-Many with Documents
- One-to-Many with Agent Requests
- One-to-Many with Agent Sessions
- One-to-Many with Usage Events

---

### User Profile

**Table**: `user_profiles` (defined in apps/api/src/db/schema.ts)

**Purpose**: Extended user data beyond auth credentials

**Schema** (from schema.ts:20-31):
```typescript
export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  planType: text('plan_type').notNull().default('free'),
  usageCount: integer('usage_count').notNull().default(0),
  subscriptionStatus: text('subscription_status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
```

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | uuid | Primary Key, Auto-generated | Profile ID |
| `user_id` | uuid | Foreign Key (auth.users.id), Unique, Not Null | Reference to auth account |
| `first_name` | text | Not Null | User's first name (required during signup) |
| `last_name` | text | Not Null | User's last name (required during signup) |
| `plan_type` | text | Not Null, Default 'free' | Plan type (free, pro, enterprise) |
| `usage_count` | integer | Not Null, Default 0 | Usage counter for billing |
| `subscription_status` | text | Not Null, Default 'active' | Subscription status |
| `created_at` | timestamp | Not Null, Default NOW() | Profile creation timestamp |
| `updated_at` | timestamp | Not Null, Default NOW() | Last update timestamp (auto-updated via trigger) |

**Validation Rules** (from FR-007, FR-008, FR-022):
- `plan_type`: Must be one of ['free', 'pro', 'enterprise']
- `usage_count`: Must be >= 0
- `subscription_status`: Must be one of ['active', 'inactive', 'cancelled']
- `first_name`: Required, must be 1-100 characters, valid characters only (letters, spaces, hyphens, apostrophes)
- `last_name`: Required, must be 1-100 characters, valid characters only (letters, spaces, hyphens, apostrophes)

**Default Values** (FR-007, FR-008):
- New profiles: `plan_type = 'free'`, `usage_count = 0`, `subscription_status = 'active'`

**Profile Creation** (FR-005, FR-006):
- Profile created explicitly by Edge Function during account creation
- Atomic operation: both auth account and profile succeed or both fail
- If profile creation fails, auth account is rolled back (no orphaned accounts)

**State Transitions**:
```
[Created] --update name--> [Modified]
[Modified] --delete account--> [Deleted]
```

**Relationships**:
- One-to-One with User Account (auth.users)
- Cascade delete on user account deletion (FR-026, FR-027)

---

### Session

**Table**: Managed by Supabase Auth (implicit, not a database table)

**Purpose**: Authenticated user session

**Properties**:
| Field | Type | Description |
|-------|------|-------------|
| `access_token` | JWT | Access token for API requests |
| `refresh_token` | string | Token for refreshing expired sessions |
| `expires_at` | timestamp | Session expiration (7 days from creation) |
| `user` | User | User object from auth.users |

**Validation Rules** (FR-014):
- Session expires after 7 days of inactivity
- Auto-refresh before expiration (handled by Supabase client)

**State Transitions**:
```
[None] --login/signup--> [Active]
[Active] --logout--> [None]
[Active] --7 days idle--> [Expired]
[Expired] --login--> [Active]
```

**Storage**:
- localStorage (browser, auto-managed by Supabase client)
- Persists across page refreshes (FR-010)

---

### Password Reset Request

**Table**: Managed by Supabase Auth (implicit)

**Purpose**: Secure password reset flow

**Properties**:
| Field | Type | Description |
|-------|------|-------------|
| `token` | string | Secure reset token (signed) |
| `email` | text | Email of user requesting reset |
| `expires_at` | timestamp | Token expiration (1 hour from creation) |

**Validation Rules** (FR-016, FR-018):
- Token expires after 1 hour
- Token is single-use (invalidated after password reset)
- Token signature verified by Supabase

**State Transitions**:
```
[Requested] --user clicks link within 1hr--> [Valid]
[Valid] --password reset--> [Used]
[Requested] --1hr passes--> [Expired]
```

**Flow** (FR-015, FR-016, FR-017, FR-018):
1. User requests reset: `resetPasswordForEmail(email)`
2. Supabase sends email with secure link (expires in 1 hour)
3. User clicks link, redirected to reset password page
4. User sets new password: `updateUser({ password })`
5. Token invalidated, session created

---

## Related Entities (Cascade Delete)

These entities exist in the schema but are not modified by this feature. They are listed here because of cascade delete behavior on account deletion (FR-026, FR-027).

### Documents

**Table**: `documents` (schema.ts:37-54)

**Cascade Behavior**:
- Deleted when user account is deleted
- Foreign key: `user_id` references `auth.users.id` ON DELETE CASCADE

### Document Chunks

**Table**: `document_chunks` (schema.ts:60-72)

**Cascade Behavior**:
- Deleted when document is deleted (which happens when user account is deleted)
- Foreign key: `document_id` references `documents.id` ON DELETE CASCADE

### Agent Requests

**Table**: `agent_requests` (schema.ts:78-93)

**Cascade Behavior**:
- Deleted when user account is deleted
- Foreign key: `user_id` references `auth.users.id` ON DELETE CASCADE

### Agent Sessions

**Table**: `agent_sessions` (schema.ts:99-109)

**Cascade Behavior**:
- Deleted when user account is deleted
- Foreign key: `user_id` references `auth.users.id` ON DELETE CASCADE

### Usage Events

**Table**: `usage_events` (schema.ts:115-127)

**Cascade Behavior**:
- Deleted when user account is deleted
- Foreign key: `user_id` references `auth.users.id` ON DELETE CASCADE

---

## Row Level Security (RLS) Policies

All tables enforce user data isolation via RLS (FR-012).

### User Profiles RLS (schema.ts:137-149)

```sql
-- Users can view own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);
```

**Enforced by**: Supabase (cannot be bypassed)
**Result**: Users can only view/modify their own profile (FR-012)

### Documents RLS (schema.ts:152-174)

```sql
-- Users can view/insert/update/delete own documents
CREATE POLICY "Users can view own documents"
  ON documents FOR SELECT
  USING (auth.uid() = user_id);
-- ... (similar for INSERT, UPDATE, DELETE)
```

**Result**: Users can only access their own documents

### Similar policies for:
- Document Chunks (schema.ts:177-215)
- Agent Requests (schema.ts:218-240)
- Agent Sessions (schema.ts:243-265)
- Usage Events (schema.ts:268-283)

---

## Database Triggers

### Auto-Create Profile (schema.ts:324-337)

```sql
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id, name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();
```

**Purpose**: Automatically create user profile when auth account is created (FR-005)
**Note**: Edge Function also handles this explicitly with rollback on failure

### Auto-Update Timestamps (schema.ts:292-320)

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Purpose**: Automatically update `updated_at` field on profile modifications
**Result**: `updated_at` is always accurate (no manual management needed)

---

## Indexes

### User Profiles (schema.ts:30)

```typescript
userIdIdx: index('user_profiles_user_id_idx').on(table.userId)
```

**Purpose**: Fast lookups by `user_id` (all profile queries filter by this)
**Performance**: O(log n) instead of O(n) for user profile retrieval

### Other Tables

All user-related tables have indexes on `user_id` for fast RLS filtering:
- `documents_user_id_idx`
- `agent_requests_user_id_idx`
- `agent_sessions_user_id_idx`
- `usage_events_user_id_idx`

---

## Data Flow Diagrams

### Account Creation Flow (FR-001, FR-005, FR-006)

```
Client                Edge Function           Supabase Auth       PostgreSQL
  |                        |                        |                |
  |--signup request------->|                        |                |
  |   (email, password)    |                        |                |
  |                        |                        |                |
  |                        |--createUser()--------->|                |
  |                        |                        |--insert------->|
  |                        |                        |                | auth.users
  |                        |<--auth user------------|<--success------|
  |                        |                        |                |
  |                        |--insert profile----------------------->|
  |                        |                        |                | user_profiles
  |                        |                        |                |
  |                        |  (IF SUCCESS)          |                |
  |<--success--------------|<--profile created----------------------|
  |                        |                        |                |
  |                        |  (IF FAILURE)          |                |
  |                        |--deleteUser()--------->|                |
  |                        |                        |--delete------->|
  |                        |                        |                | auth.users
  |<--error: retry---------|<--rollback complete----|<--success------|
```

### Profile Modification Flow (FR-021, FR-022, FR-023)

```
Client                Edge Function           PostgreSQL
  |                        |                        |
  |--update name---------->|                        |
  |   (name, JWT)          |                        |
  |                        |--validate JWT--------->|
  |                        |   (extract user_id)    | RLS check
  |                        |<--authorized-----------|
  |                        |                        |
  |                        |--Zod validation--------|
  |                        |   (name length, chars) |
  |                        |                        |
  |                        |--UPDATE user_profiles->|
  |                        |   WHERE user_id = X    | (RLS enforced)
  |                        |<--success--------------|
  |                        |                        | Trigger: update updated_at
  |<--name updated---------|                        |
```

### Account Deletion Flow (FR-024, FR-025, FR-026, FR-027, FR-028)

```
Client                Edge Function           Supabase Auth       PostgreSQL
  |                        |                        |                |
  |--delete request------->|                        |                |
  |   (confirmation, JWT)  |                        |                |
  |                        |--validate confirmation-|                |
  |                        |   (type "DELETE")      |                |
  |                        |                        |                |
  |                        |--deleteUser()--------->|                |
  |                        |                        |--DELETE------->|
  |                        |                        |                | auth.users
  |                        |                        |                |
  |                        |                        |                | CASCADE:
  |                        |                        |                | - user_profiles
  |                        |                        |                | - documents
  |                        |                        |                | - document_chunks
  |                        |                        |                | - agent_requests
  |                        |                        |                | - agent_sessions
  |                        |                        |                | - usage_events
  |                        |<--all deleted----------|<--success------|
  |<--logout & redirect----|                        |                |
```

---

## Schema Migrations

### Migration 0001: Account Foundation

**File**: `apps/api/supabase/migrations/0001_account_foundation.sql`

**Changes Needed**:
1. Add foreign key constraints with CASCADE DELETE (for account deletion)
2. Ensure RLS policies are applied
3. Ensure triggers are created

**SQL** (additions to existing schema):
```sql
-- Add CASCADE DELETE foreign keys (if not already present)
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

-- Document chunks cascade from documents (already in schema)
-- No change needed - already defined in schema.ts
```

---

## Validation Summary

| Entity | Validation | Enforced By |
|--------|------------|-------------|
| **User Account** | Email format, unique email, password min 6 chars | Supabase Auth |
| **User Profile** | Name 1-100 chars, valid characters | Zod schema (server-side) |
| **Session** | JWT signature, 7-day expiry | Supabase Auth |
| **Password Reset** | Token signature, 1-hour expiry | Supabase Auth |
| **Data Isolation** | User can only access own data | RLS policies (database-level) |
| **Cascade Delete** | All user data deleted on account deletion | Foreign key constraints (database-level) |

---

## Performance Considerations

### Query Optimization
- **Indexes**: All tables have `user_id` indexes for fast filtering
- **RLS**: Policies use indexed columns (no table scans)
- **Cascade Delete**: Database-level (faster than application-level loops)

### Expected Query Performance
- Profile lookup by user_id: <10ms (indexed)
- Account creation: <500ms (2 sequential operations)
- Profile update: <100ms (single UPDATE with RLS)
- Account deletion: <1s (cascade delete of all related data)

### Scalability
- **Concurrent Signups**: 100+ requests/sec (Supabase Auth capacity)
- **Profile Updates**: 1000+ updates/sec (PostgreSQL indexed writes)
- **Data Isolation**: Zero performance penalty (RLS uses indexes)

---

## Security Guarantees

### Database-Level Security (Cannot Be Bypassed)
- ✅ RLS enforces user isolation on all queries
- ✅ Foreign keys enforce cascade delete (no orphaned records)
- ✅ Triggers ensure data consistency (auto-create profile, update timestamps)

### Application-Level Security
- ✅ Server-side validation (Zod schemas in Edge Functions)
- ✅ JWT verification (Supabase Auth)
- ✅ Atomic operations with rollback (Edge Function logic)

### Attack Prevention
- ✅ SQL injection: Prevented by Drizzle ORM parameterized queries
- ✅ Data leakage: Prevented by RLS (users cannot query other users' data)
- ✅ Frontend bypass: Prevented by server-side validation (Edge Functions only)
- ✅ Session hijacking: Prevented by JWT signature verification

---

## Data Model Validation

### Completeness Check

| Requirement | Entity Coverage |
|-------------|-----------------|
| FR-001 to FR-028 | ✅ All functional requirements covered |
| User Stories 1-5 | ✅ All acceptance scenarios supported |
| Edge Cases | ✅ All edge cases handled (duplicate email, network failure, partial success, etc.) |
| Success Criteria | ✅ All measurable outcomes supported (SC-001 to SC-010) |

### Constitution Compliance

| Principle | Compliance |
|-----------|------------|
| V: End-to-End Type Safety | ✅ Auto-generated types from Drizzle schema |
| VIII: Zero-Trust Data Access | ✅ RLS on all tables, foreign keys with CASCADE |
| IX: MVP-First Discipline | ✅ Minimal schema, leverages existing tables |

---

## Next Steps

This data model is ready for:
1. **API Contract Generation** (Phase 1: contracts/)
2. **Quickstart Documentation** (Phase 1: quickstart.md)
3. **Implementation** (Phase 2: /speckit.tasks)

All entities, relationships, validation rules, and security policies are defined and aligned with the feature specification.
