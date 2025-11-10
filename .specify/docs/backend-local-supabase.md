---
title: Local Supabase Development Pattern
summary: Committed .env.local files enable zero-config local Supabase development
---

# Local Supabase Development Pattern

**What**: Optional local Supabase instance for offline development using committed localhost configuration files.

**Why**: Eliminates network latency, enables offline work, prevents accidental production changes during rapid iteration. Zero scripting required.

**How**:

```bash
# One-time: Start local Supabase (if you want to use local)
cd apps/api && supabase start

# Daily use: Just run dev (auto-detects local or uses remote)
npm run dev
```

**Environment Hierarchy**:

- `.env` - Remote Supabase (production, committed)
- `.env.local` - Local Supabase (localhost URLs, committed)
- `.env.local` overrides `.env` when present (Next.js standard behavior)

**How it works**:

- If local Supabase is running → uses localhost (from .env.local)
- If local Supabase is NOT running → falls back to remote (from .env)
- No switching required, no scripts, just works

**Local Ports**:

- API: `http://localhost:54321`
- Database: `postgresql://localhost:54322`
- Studio: `http://localhost:54323`
- Inbucket (email): `http://localhost:54324`

**Rules**:

✅ **DO** commit .env.local files (localhost URLs are not secrets)
✅ **DO** just run `npm run dev` (works with local or remote)
✅ **DO** manually start Supabase when you want local dev

❌ **DON'T** put production secrets in .env.local
❌ **DON'T** create automation scripts (keep it simple)

**Used in**:

- `apps/api/.env.local` - Localhost PostgreSQL connection (committed)
- `apps/web/.env.local` - Localhost Supabase endpoint (committed)
