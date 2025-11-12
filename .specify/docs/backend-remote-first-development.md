---
title: Remote-First Development Pattern
summary: Remote Supabase as default for type generation, edge function testing, and zero-config workflows
---

# Remote-First Development Pattern

**What**: Remote Supabase instance as the primary development target with seamless type generation and edge function deployment for testing.

**Why**: Remote development ensures type safety with production schema, enables realistic edge function testing, eliminates Docker complexity, and maintains consistent development environments across the team.

**How**:

```bash
# Default workflow (uses remote Supabase)
npm run dev                    # Start all apps (remote by default)
npm run codegen               # Generate GraphQL types from remote schema
npm run deploy:function api   # Deploy edge function for testing

# Type generation workflow
npm run db:push               # Push schema changes to remote
npm run codegen               # Regenerate types from updated schema

# Testing edge functions
npm run deploy:function api   # Deploy to remote for testing
# Test with frontend at http://localhost:3000
```

**Remote Advantages**:

- ✅ Automatic type generation from production schema
- ✅ Realistic edge function testing (Deno runtime, env vars, secrets)
- ✅ No Docker or port conflicts
- ✅ Consistent environment across team members
- ✅ RLS policies work correctly (better than local auth emulation)

**Rules**:

✅ **DO** use remote Supabase for all development by default
✅ **DO** deploy edge functions to remote for testing (not local)
✅ **DO** run `npm run codegen` after schema changes to sync types
✅ **DO** use `.env.remote` files (committed) for explicit remote config

❌ **DON'T** default to local development "just because"
❌ **DON'T** test edge functions locally - deploy to remote for accurate testing
❌ **DON'T** skip type generation after schema changes

**Local Development (Optional)**:

Local Supabase exists for edge cases but is rarely needed:
- Offline work when internet is unavailable
- Testing destructive migrations before running on remote

If you need local development:
```bash
cd apps/api && supabase start
npm run dev:local
```

Note: 95% of workflows work better with remote. Local adds Docker complexity and requires manual syncing.

**Used in**:

- `apps/api/.env.remote` - Remote PostgreSQL connection (committed)
- `apps/web/.env.remote` - Remote Supabase endpoint (committed)
- `apps/api/.env.local` - Optional local PostgreSQL connection (committed, rarely used)
- `apps/web/.env.local` - Optional local Supabase endpoint (committed, rarely used)
