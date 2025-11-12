---
title: Edge Functions Pattern
summary: Deploy-to-remote workflow for Supabase Edge Functions with custom entrypoint configuration
domain: backend
priority: core
related: [backend-remote-first-development, backend-graphql-architecture]
---

<!-- After editing this file, run: npm run sync-docs -->

# Edge Functions Pattern

**What**: All Edge Function code lives in `apps/api/src/functions/` (single source of truth). Each function must be declared in `apps/api/supabase/config.toml` with a custom entrypoint and import map configuration.

**Why**: Custom entrypoint configuration allows TypeScript source code to live in `src/functions/` instead of `supabase/functions/`, maintaining clean monorepo structure. Deploy-to-remote testing ensures accuracy with real Deno runtime, environment variables, and secrets.

**Structure**:

```
apps/api/
├── src/functions/
│   ├── api/
│   │   └── index.ts          # GraphQL Yoga handler
│   └── my-function/
│       └── index.ts          # Deno.serve handler
├── supabase/
│   └── config.toml           # Function declarations
└── import_map.json           # Deno import mappings
```

**Important**: There is NO `apps/api/supabase/functions/` directory. Supabase CLI deploys functions from `src/functions/` using custom entrypoint configuration.

**Testing Workflow (Deploy to Remote)**:

Edge functions should be deployed to remote for testing, not run locally. This ensures accurate testing with the real Deno runtime, environment variables, and secrets.

```bash
# Iterative development workflow (from root)
npm run deploy:function api           # Deploy to remote for testing
# Test with frontend at http://localhost:3000

# Or deploy all functions
cd apps/api
npm run deploy:functions              # Deploy all functions to remote
```

**Local Serving (Rarely Needed)**:

```bash
cd apps/api
supabase functions serve              # Serve functions locally (not recommended)
```

**Configuration** (`apps/api/supabase/config.toml`):

```toml
[edge_runtime]
enabled = true
policy = "per_worker"

# Each function must be declared with custom entrypoint and import_map
[functions.my-function]
entrypoint = '../src/functions/my-function/index.ts'
import_map = '../import_map.json'
# (Repeat pattern for all functions)
```

**Creating new Edge Functions**:

1. Create directory `apps/api/src/functions/my-function/` with `index.ts` (Deno.serve handler)
2. Add to `config.toml` (see pattern above)
3. Deploy and test: `npm run deploy:function my-function` (test with frontend)

**Note**: Functions must be explicitly declared in `config.toml` (no auto-discovery). Import map is auto-used during deployment.

**Rules**:
- ✅ DO put all Edge Function code in `apps/api/src/functions/`
- ✅ DO declare each function in `config.toml` with custom entrypoint
- ✅ DO deploy to remote for testing (not local)
- ✅ DO keep Edge Functions thin (business logic in services)
- ✅ DO test with frontend at localhost:3000 after deploying
- ❌ DON'T create `supabase/functions/` directory (use `src/functions/`)
- ❌ DON'T rely on auto-discovery (explicit config.toml declaration required)
- ❌ DON'T test locally (deploy to remote for accurate results)
- ❌ DON'T put business logic in Edge Functions (use services)

**Used in**:
- `apps/api/src/functions/` - All Edge Function source code
- `apps/api/supabase/config.toml` - Function declarations with entrypoints
- `apps/api/import_map.json` - Deno import mappings (auto-used during deployment)
- `package.json` - `deploy:function` and `deploy:functions` scripts
