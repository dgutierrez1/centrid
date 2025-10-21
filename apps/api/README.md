# Centrid API

Self-contained backend application with ALL server logic: business logic, Edge Functions, and database migrations.

## Directory Structure

```
apps/api/
├── src/
│   ├── services/      # Business logic (RAG, AI orchestration, document processing)
│   ├── utils/         # Backend utilities (response formatting, error handling)
│   ├── lib/           # Shared libraries (Supabase client, API clients)
│   └── functions/     # Edge Functions (Deno runtime)
└── supabase/
    ├── config.toml    # Supabase configuration
    └── migrations/    # Database schema
```

## Quick Start

```bash
cd apps/api

# Start local Supabase (requires Docker)
npm run supabase:start

# Generate TypeScript types → packages/shared/src/types/database.ts
npm run supabase:types

# Serve Edge Functions locally (http://localhost:54321/functions/v1/*)
npm run supabase:serve
```

## Code Organization

### `src/services/` - Business Logic

Reusable logic shared across Edge Functions. Keep functions thin, logic here.

**Examples**: `rag-service.ts`, `document-service.ts`, `ai-service.ts`, `usage-service.ts`

**Imports**: ✅ `@centrid/shared`, `../lib/`, `../utils/` | ❌ `../functions/`, `@centrid/ui`, apps

### `src/utils/` - Utilities

Common operations: response formatting, error handling, validation.

**Examples**: `response.ts`, `errors.ts`, `validation.ts`, `auth.ts`

**Imports**: ✅ `@centrid/shared` | ❌ `../services/`, `../functions/`, `@centrid/ui`, apps

### `src/lib/` - Shared Libraries

Configure external clients and infrastructure.

**Examples**: `supabase.ts`, `openai.ts`, `anthropic.ts`

**Imports**: ✅ `@centrid/shared` (types) | ❌ Business logic, functions, apps

### `src/functions/` - Edge Functions

Thin HTTP handlers (Deno runtime). Orchestrate services, return responses.

**Example**:
```typescript
// src/functions/my-function/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { myService } from "../../services/my-service.ts"

serve(async (req) => {
  const result = await myService(await req.json())
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" }
  })
})
```

**Imports**: ✅ `../../services/`, `../../utils/`, `../../lib/`, `npm:@centrid/shared` | ❌ `@centrid/ui`, apps

## Deployment

```bash
# Deploy specific function
npm run deploy:function process-document

# Push database migrations
npm run db:push
```

## Import Rules

- ✅ `apps/api` → MAY import from `@centrid/shared` only
- ❌ `apps/api` → MUST NOT import from `@centrid/ui` or other apps
- ✅ Edge Functions use `npm:@centrid/shared` (Deno npm: specifier)
- ❌ No imports from `packages/ui`, `apps/web`, `apps/design-system`
