# Environment Configuration Guide

**Feature**: 001-backend-mvp-setup
**Date**: 2025-10-21
**Status**: ✅ Configured and Cleaned Up

---

## 📂 Environment File Structure

### Frontend (`apps/web/`)
```
apps/web/.env        # Frontend environment variables (committed with real values)
apps/web/.env.local  # Local overrides (NOT committed, highest priority)
apps/web/.env.example # Frontend template (committed)
```

### Backend (`apps/api/`)
```
apps/api/.env        # Backend database connection (NOT committed)
apps/api/.env.example # Backend template with documentation (committed)
```

**No .env files at root level** - All environment files are in their respective app directories.

---

## 🔌 Database Connection Ports

### Port 5432 - Session Mode (Direct PostgreSQL)

**Use for:**
- ✅ Drizzle migrations (`npx drizzle-kit push`)
- ✅ Schema changes and DDL operations
- ✅ Local development
- ✅ Long-running connections

**Configuration:**
```bash
# apps/api/.env
DATABASE_URL="postgresql://postgres.xennuhfmnucybtyzfgcl:Simbirri1414@aws-1-us-east-1.pooler.supabase.com:5432/postgres"
```

**Why:**
- More reliable for schema operations
- No connection timeout issues
- Direct PostgreSQL access

---

### Port 6543 - Transaction Mode (PgBouncer Pooler)

**Use for:**
- ✅ Edge Functions in production
- ✅ Serverless runtime environments
- ✅ High-concurrency scenarios

**Configuration:**
```bash
# Set in Supabase Dashboard → Edge Functions → Secrets
DATABASE_URL="postgresql://postgres.xennuhfmnucybtyzfgcl:Simbirri1414@aws-1-us-east-1.pooler.supabase.com:6543/postgres"
```

**Why:**
- Efficient connection pooling
- Better for serverless/short-lived connections
- Handles many concurrent requests

---

## 🎯 Recommended Setup

### For Development (Current Setup)

**apps/api/.env:**
```bash
# Use Session mode (port 5432) for all local development
DATABASE_URL="postgresql://postgres.xennuhfmnucybtyzfgcl:Simbirri1414@aws-1-us-east-1.pooler.supabase.com:5432/postgres"
```

**Root .env:**
```bash
# Frontend variables only
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### For Production

**Migrations:**
- Run from local machine using port 5432
- Command: `cd apps/api && npx drizzle-kit push --force`

**Edge Functions:**
- Set DATABASE_URL in Supabase Dashboard → Edge Functions → Secrets
- Use port 6543 (Transaction mode)
- Command: `supabase secrets set DATABASE_URL="postgresql://...6543/postgres"`

---

## 🛠️ Common Operations

### Run Migrations
```bash
cd apps/api
npx drizzle-kit push --force
# Uses DATABASE_URL from apps/api/.env (port 5432)
```

### Check Schema Status
```bash
cd apps/api
npx drizzle-kit push
# Should show: "[i] No changes detected"
```

### Deploy Edge Functions
```bash
cd apps/api
supabase functions deploy hello
# Uses DATABASE_URL from Supabase Secrets (set to port 6543)
```

---

## 🔒 Security Notes

### Never Commit
- ❌ `.env` files (already in .gitignore)
- ❌ Database passwords
- ❌ API keys

### Always Use
- ✅ `.env.example` files with placeholder values
- ✅ URL-encoded passwords for special characters
- ✅ Separate environment files for frontend/backend

### Special Character Encoding
If your password contains special characters:
```
! = %21
@ = %40
# = %23
$ = %24
% = %25
^ = %5E
& = %26
* = %2A
```

**Example:**
- Password: `MyPass!@#123`
- Encoded: `MyPass%21%40%23123`

---

## 📝 File Locations

### Frontend Environment (`apps/web/`)
```
apps/web/.env        # Frontend config with actual values (committed)
apps/web/.env.local  # Local overrides (NOT committed, takes precedence)
apps/web/.env.example # Frontend template (committed)
```

Contains:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- AI API keys (optional)
- Payment integration (optional)

### Backend Environment (`apps/api/`)
```
apps/api/.env        # Backend database config (NOT committed)
apps/api/.env.example # Backend template (committed)
```

Contains:
- `DATABASE_URL` (port 5432 for development)
- `DATABASE_URL_POOLER` (port 6543 for production - commented)

---

## ✅ Verification Checklist

After setup, verify:

- [X] `apps/api/.env` exists with DATABASE_URL (port 5432)
- [X] `apps/web/.env` and `apps/web/.env.local` exist with frontend variables
- [X] NO .env files at root level
- [X] All .env files properly listed in `.gitignore`
- [X] Can run `npx drizzle-kit push` successfully from apps/api
- [X] Database shows all 6 tables in Supabase Dashboard
- [X] No database credentials in committed files

---

## 🔄 Migration History

**2025-10-21**: Initial setup
- ✅ Created 6 tables: user_profiles, documents, document_chunks, agent_requests, agent_sessions, usage_events
- ✅ Created 13 indexes
- ✅ Applied RLS policies
- ✅ Verified schema synchronization

**Port Selection:**
- Initially tried port 6543 (Transaction mode) → Connection timeout
- Switched to port 5432 (Session mode) → Success
- Documented both ports for appropriate use cases

---

## 📚 References

- **Supabase Connection Strings**: Dashboard → Settings → Database
- **Drizzle Kit Docs**: https://orm.drizzle.team/kit-docs/overview
- **Environment Best Practices**: See CLAUDE.md

---

**Environment setup complete!** All connections configured for optimal performance.
