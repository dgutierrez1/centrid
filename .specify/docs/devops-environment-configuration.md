---
title: Environment Configuration Pattern
summary: Remote-first environment files with explicit .env.remote and .env.local for backend and frontend
domain: devops
priority: specialized
related: [backend-remote-first-development]
---

<!-- After editing this file, run: npm run sync-docs -->

# Environment Configuration Pattern

**What**: Remote-first environment configuration with explicit `.env.remote` (committed) and `.env.local` (optional, rarely used) files for both backend (`apps/api`) and frontend (`apps/web`).

**Why**: Remote-first development eliminates Docker complexity, enables realistic edge function testing, and maintains consistent environments across the team. Explicit `.env.remote` files make remote-by-default obvious.

**Backend Environment** (`apps/api/.env`):

**Required**:

- `DATABASE_URL` - PostgreSQL connection string (Supabase Dashboard → Settings → Database)
  - Port 5432 (Session Mode): For `db:push` and dev
  - Port 6543 (Transaction Mode): For Edge Functions (set via Supabase Secrets)
  - URL-encode special chars (! = %21, @ = %40, # = %23)

**Environment Files**:
- `apps/api/.env.remote` - Remote database config (committed, used by default)
- `apps/api/.env.local` - Optional local database config (committed, rarely used)

**Frontend Environment** (`apps/web/.env`):

**Required**:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only)

**Optional**:
- `OPENAI_API_KEY` - OpenAI API key (AI agents)
- `ANTHROPIC_API_KEY` - Anthropic API key (AI agents)
- `MERCADO_PAGO_ACCESS_TOKEN` - MercadoPago access token (payments)
- `MERCADO_PAGO_WEBHOOK_SECRET` - MercadoPago webhook secret (payments)

**Environment Files**:
- `apps/web/.env.remote` - Remote Supabase config (committed, used by default)
- `apps/web/.env.local` - Optional local overrides (NOT committed, for personal dev config only)

**Note**: For `apps/web`, `.env.local` is NOT committed and overrides `.env` (Next.js standard). For `apps/api`, both `.env.remote` and `.env.local` are committed for explicit remote/local switching.

**Rules**:
- ✅ DO use `.env.remote` for all development by default
- ✅ DO commit `.env.remote` files (both apps/api and apps/web)
- ✅ DO URL-encode special characters in DATABASE_URL
- ✅ DO use port 5432 for db:push, port 6543 for Edge Functions
- ✅ DO keep `.env.local` uncommitted for apps/web (Next.js standard)
- ❌ DON'T commit `.env.local` for apps/web (personal config only)
- ❌ DON'T forget to URL-encode DATABASE_URL special characters
- ❌ DON'T use local development by default (remote is better)

**Used in**:
- `apps/api/.env.remote` - Remote PostgreSQL connection (committed)
- `apps/web/.env.remote` - Remote Supabase endpoint (committed)
- `apps/api/.env.local` - Optional local PostgreSQL connection (committed, rarely used)
- `apps/web/.env.local` - Optional local overrides (NOT committed, personal config)
