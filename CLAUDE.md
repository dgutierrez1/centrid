# CLAUDE.md

Development guide for Claude Code working with Centrid.

## Project Overview

Centrid solves the context loss problem in AI chat applications by maintaining a **persistent knowledge graph**. Upload documents once, use them across all conversations forever.

**MVP Target**: Core features (document upload + RAG chat + context persistence) functional within 7 days.

**Tech Stack**: Next.js 14 (Pages Router), React 18, TypeScript, Supabase (PostgreSQL + Edge Functions + Auth + Storage), Valtio, Tailwind CSS

**Critical Principle**: MVP-first discipline. Scope features to deliver value in days, not weeks. Abstract only after third occurrence (Rule of Three).

## Monorepo Structure

```
centrid/
├── apps/
│   ├── web/                 # Main Next.js frontend
│   ├── design-system/       # Component playground (isolated)
│   └── api/                 # Self-contained backend (ALL server logic)
│       ├── src/
│       │   ├── services/    # Business logic (RAG, AI, document processing)
│       │   ├── utils/       # Backend utilities
│       │   ├── lib/         # Supabase client config
│       │   └── functions/   # Supabase Edge Functions
│       │       ├── process-document/
│       │       ├── execute-ai-agent/
│       │       └── handle-webhook/
│       └── supabase/
│           ├── config.toml  # Supabase config (points to src/functions/)
│           └── migrations/  # Database schema
├── packages/
│   ├── ui/                  # Pure UI components (SOURCE OF TRUTH)
│   └── shared/              # Shared types & utilities (frontend + backend)
└── scripts/
    └── add-component.sh     # shadcn → packages/ui workflow
```

**Import Rules**:

- `apps/web` → MAY import from `packages/ui`, `packages/shared`
- `apps/design-system` → ONLY imports from `packages/ui`, `packages/shared`
- `apps/api` → MAY import from `packages/shared` only
- `packages/ui` → MAY import from `packages/shared`
- `packages/ui` → FORBIDDEN to import Supabase, Valtio, or from `apps/`
- `packages/shared` → NO imports from other packages (foundation layer)

**Component Placement Principle**:

- **Reusable presentational components** → `packages/ui/src/components/` (SOURCE OF TRUTH)
- **App-specific business logic components** → `apps/web/src/components/`
- **Backend business logic** → `apps/api/src/services/`
- **Edge Function implementations** → `apps/api/src/functions/[name]/`
- When in doubt: If it's pure UI with no server deps, put it in `packages/ui`

## Development Commands

### Local Development

```bash
npm install                    # Install all workspace dependencies
npm run dev                    # Start all apps in parallel
npm run web:dev               # Start main app (http://localhost:3000)
npm run design:dev            # Start design system (http://localhost:3001)
npm run build                 # Build all apps
npm run type-check            # TypeScript check all workspaces
npm run lint                  # Lint all workspaces
```

### Supabase Local Development

All Supabase commands run from `apps/api/`:

```bash
cd apps/api
supabase start                # Start local Supabase (requires Docker)
supabase stop                 # Stop local Supabase
supabase db reset             # Reset DB & apply migrations
supabase gen types typescript # Generate types → ../../packages/shared/src/types/database.ts
```

### Component Workflow

```bash
./scripts/add-component.sh <name>   # Add shadcn component to packages/ui
# Then manually export from packages/ui/src/components/index.ts
```

**Never** run `shadcn add` directly in packages/ui - always use the script!

### Edge Functions

**Structure**: All Edge Function code lives in `apps/api/src/functions/` (single source of truth). Each function must be declared in `apps/api/supabase/config.toml` with a custom entrypoint pointing to the source.

**Important**: There is NO `apps/api/supabase/functions/` directory. Supabase CLI deploys functions from `src/functions/` using custom entrypoint configuration.

All Edge Function commands run from `apps/api/`:

```bash
cd apps/api
npm run deploy:functions              # Deploy all functions to remote
supabase functions serve               # Serve functions locally
```

**Configuration** (`apps/api/supabase/config.toml`):

```toml
[edge_runtime]
enabled = true
policy = "per_worker"

# Each function must be declared with custom entrypoint
[functions.create-account]
entrypoint = '../src/functions/create-account/index.ts'

[functions.update-profile]
entrypoint = '../src/functions/update-profile/index.ts'

[functions.delete-account]
entrypoint = '../src/functions/delete-account/index.ts'
```

**Creating new Edge Functions**:

1. Create function directory: `apps/api/src/functions/my-function/`
2. Create `index.ts` with Deno.serve handler
3. Import shared logic from `apps/api/src/services/`
4. Import types from `@centrid/shared` (via npm: specifier in Deno)
5. Add function declaration to `apps/api/supabase/config.toml` with custom entrypoint:
   ```toml
   [functions.my-function]
   entrypoint = '../src/functions/my-function/index.ts'
   ```
6. Deploy with `npm run deploy:functions`

**Note**: Supabase does not support auto-discovery of functions. Each function must be explicitly declared in config.toml.

### /speckit Workflow Commands

Claude Code has access to `/speckit` slash commands for feature development and design iteration:

- `/speckit.specify` - Create/update feature specifications
- `/speckit.plan` - Generate implementation plans
- `/speckit.tasks` - Generate dependency-ordered task lists
- `/speckit.implement` - Execute implementation from tasks.md
- `/speckit.design` - Design feature UI in design-system app
- `/speckit.design-system` - Create/update global design system
- `/speckit.clarify` - Ask targeted clarification questions
- `/speckit.analyze` - Cross-artifact consistency analysis

See [.specify/design-system/SETUP.md](.specify/design-system/SETUP.md) for design workflow details.

## Environment Configuration

### Backend Environment (`apps/api/.env`)

**Required** for backend/database (Remote Supabase):
- `DATABASE_URL` - PostgreSQL connection string from Supabase Dashboard → Settings → Database
  - **Port 5432 (Session Mode)**: Use for Drizzle schema push and development
  - **Port 6543 (Transaction Mode)**: Use for Edge Functions in production (set via Supabase Dashboard → Secrets)
  - **IMPORTANT**: URL-encode special characters in password (! = %21, @ = %40, # = %23, etc.)

```bash
# Local .env (apps/api/.env) - for db:push
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-X-XX-X.pooler.supabase.com:5432/postgres"

# Edge Functions Secrets (Supabase Dashboard) - for functions
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-X-XX-X.pooler.supabase.com:6543/postgres"
```

### Frontend Environment (`apps/web/.env`)

**Required** for frontend:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role (server-side only)

**Optional** (for AI features):
- `OPENAI_API_KEY` - For Create/Edit agents
- `ANTHROPIC_API_KEY` - For Research agent

**Optional** (for payments):
- `MERCADO_PAGO_ACCESS_TOKEN`
- `MERCADO_PAGO_WEBHOOK_SECRET`

**Note**: Next.js loads .env files in this order (later files override earlier):
1. `apps/web/.env` (all environments)
2. `apps/web/.env.local` (local overrides, not committed)

## Database Schema

Defined in `apps/api/src/db/schema.ts` using **Drizzle ORM**:

**Core Tables**:

- `user_profiles` - Extended user data (plan, usage_count, subscription_status)
- `documents` - File metadata with full-text search vectors
- `document_chunks` - Text segments for RAG context retrieval
- `agent_requests` - AI agent execution tracking
- `agent_sessions` - Multi-turn conversation management
- `usage_events` - Usage tracking for billing

**Features**:

- Type-safe schema definitions with Drizzle ORM
- Automatic `tsvector` generation for full-text search
- Row Level Security (RLS) enforces user isolation
- Automatic `updated_at` triggers
- Auto user profile creation on signup
- Migrations in `apps/api/drizzle/migrations/`

**Database Commands (MVP - Remote Only)**:

```bash
cd apps/api
npm run db:drop            # Drop all tables (MVP iteration only)
npm run db:push            # Push schema to remote DB (auto-approve with --force)
npm run deploy:functions   # Deploy all Edge Functions to remote
```

**MVP Approach**: Schema lives in `apps/api/src/db/schema.ts`. Changes are pushed directly to remote Supabase using Drizzle (`drizzle-kit push --force`). The `--force` flag auto-approves data-loss statements for non-interactive deployment. Safe to drop/recreate during MVP iteration. Migrations deferred until schema is stable post-MVP. Always target remote database (not local).

**Workflow** (clean schema recreation):
1. `npm run db:drop` - Drop all existing tables with CASCADE
2. `npm run db:push` - Push new schema and apply CASCADE DELETE foreign keys
3. `npm run deploy:functions` - Deploy Edge Functions

**AI Agents**:

- `create`: GPT-4o (temp: 0.7) for content generation
- `edit`: GPT-4o-mini (temp: 0.3) for improvements
- `research`: Claude 3.5 Sonnet (temp: 0.1) for analysis

Context: Up to 20 document chunks per request
Usage limits: Free (100/mo), Pro (1000/mo), Enterprise (10000/mo)

## TypeScript Path Aliases

Configured in `tsconfig.json`:

```typescript
// In apps/web
import { Component } from "@/components/ui/Component";
import { supabase } from "@/lib/supabase";
import { appState } from "@/lib/state";
import type { Database } from "@/types/database.types";

// Shared packages (works in all apps)
import { Button, Card } from "@centrid/ui/components";
import { cn } from "@centrid/shared/utils";
import type { Document } from "@centrid/shared/types";
```

## Component Organization

### apps/web/src/components/

Smart components with data fetching & business logic:

- `agents/` - AgentInterface.tsx
- `documents/` - DocumentManager.tsx
- `layout/` - Layout, Header, Sidebar
- `providers/` - AuthProvider, RealtimeProvider, ThemeProvider
- `search/` - SearchInterface.tsx
- `ui/` - App-specific UI overrides

### packages/ui/src/

Pure presentational components (NO server deps):

- `components/` - shadcn components (Button, Card, Input, etc)
- `features/` - Feature UI (DocumentCard, DocumentGrid, etc)
- `layout/` - Layout primitives

### packages/shared/src/

- `types/` - Shared TypeScript types
- `utils/` - Utilities (cn, formatters)

## Design System Quick Reference

All apps use the **Coral Theme** from `packages/ui`:

```tsx
import { Button, Card, Input, SimpleBarChart } from "@centrid/ui/components";

<Card className="p-6">
  <Input className="mb-4" />
  <Button className="bg-primary-600">Submit</Button>
</Card>;
```

**Color Classes**: `bg-primary-600` (#ff4d4d coral), `text-success-500` (#34c759), `text-warning-500` (#ff9f0a), `text-error-500` (#ff3b30)

**Typography**: `text-4xl` (36px), `text-2xl` (24px), `text-base` (16px), `text-sm` (14px)

**Spacing**: `p-6` (24px), `gap-4` (16px), `mb-8` (32px)

Full design tokens: `.specify/design-system/tokens.md`

## Design Iteration Workflow

Use `apps/design-system` to design and iterate on UI before implementing in `apps/web`.

**Two-Layer Approach:**

1. **Global Design System** (`/speckit.design-system`) - Run once at project start to establish colors, typography, spacing, components
2. **Feature-Specific Design** (`/speckit.design`) - Run per feature to design screens/interactions using the global system

### Design Loop

1. Create component in `apps/design-system/components/[Feature].tsx`
2. Add to showcase in `apps/design-system/pages/index.tsx`
3. Run `npm run design:dev` → http://localhost:3001
4. Screenshot with Playwright MCP (mobile + desktop)
5. Get feedback → edit → auto-reload → re-screenshot
6. Approve → implement in `apps/web`

### Playwright MCP Screenshots

**Viewports:**

- Mobile: 375×812
- Desktop: 1440×900

**Save to:** `apps/design-system/public/screenshots/[feature-name]/`

**Naming convention:**

```
[feature-name]/
├── mobile-default.png
├── mobile-hover.png
├── mobile-error.png
├── desktop-default.png
└── desktop-hover.png
```

### /speckit Commands (detailed usage)

**`/speckit.design-system`** - Create/update global design system:

1. Interactive questionnaire about design decisions
2. Generates/updates `.specify/design-system/tokens.md`
3. Updates `packages/ui/colors.config.js`
4. Screenshots showcase with Playwright MCP
5. Iterates until approved

**`/speckit.design`** - Design a specific feature:

1. Loads feature `spec.md` + `plan.md`
2. Creates component in `apps/design-system/components/[Feature].tsx`
3. Adds to showcase
4. Screenshots with Playwright MCP
5. Iterates based on feedback
6. Component ready for implementation in `apps/web`

### Updating Design Tokens

**Colors:**

1. Edit `.specify/design-system/tokens.md` (documentation)
2. Update `packages/ui/colors.config.js` (implementation)
3. Restart dev servers

**Spacing/Fonts:**

1. Edit `.specify/design-system/tokens.md` (documentation)
2. Update `packages/ui/tailwind.preset.js`
3. Restart dev servers

### Providing Design Feedback

**10 Design Levers** (use these when iterating):

1. **Visual Hierarchy** - Is the primary action obvious?
2. **Consistency** - Do similar things look similar?
3. **Information Density** - Right amount of info?
4. **Color with Purpose** - Every color means something?
5. **Typography Hierarchy** - Scannable text structure?
6. **Spacing Rhythm** - Consistent, mathematical spacing?
7. **Feedback & Affordance** - Interactivity obvious?
8. **Mobile-First Responsive** - Designed for constraints first?
9. **Accessibility** - Works for everyone?
10. **States** - Loading, error, empty states designed?

**Example feedback:**

- "Visual hierarchy: Make submit button more prominent"
- "Spacing: Feels cramped, increase gap between sections"
- "Accessibility: Focus state hard to see, needs stronger contrast"
- "States: Add loading spinner for AI response"

**Browser MCP Integration:**

- Automatically renders components and takes screenshots
- Iterates visually without manual dev server
- Supports viewport sizes, state triggers, element interactions
- Fallback: Manual review in browser if MCP unavailable

## Key Implementation Patterns

### Real-time Subscriptions

```typescript
import { createRealtimeSubscription } from "@/lib/supabase";

const subscription = createRealtimeSubscription(
  "agent_requests",
  (payload) => {
    if (payload.new.status === "completed") {
      actions.updateAgentRequest(payload.new.id, payload.new);
    }
  },
  { user_id: userId }
);
```

### Document Processing Flow

1. User uploads file → DocumentManager
2. File uploaded to Supabase Storage
3. `process-document` Edge Function triggered
4. Text extracted and chunked
5. Full-text search vectors auto-generated (triggers)
6. Real-time updates via RealtimeProvider

### AI Agent Execution Flow

1. User submits request → AgentInterface
2. `agent_requests` record created (status: 'pending')
3. `execute-ai-agent` Edge Function invoked
4. Usage limits checked
5. Context built from contextDocuments
6. Model selected based on agent_type
7. Progress updates: 0.1 → 0.2 → 0.3 → 0.8 → 1.0
8. Results stored in `agent_requests.results`
9. Usage event logged

## Testing Local Changes

```bash
cd apps/api
supabase start               # Start local Supabase
supabase db reset            # Apply migrations
supabase gen types typescript # Generate types

cd ../..                     # Back to root
npm run dev                  # Start all dev servers
```

## Deployment

- **Frontend**: Vercel (auto on git push) - `apps/web`
- **Backend**: Supabase production
- **Edge Functions**: From `apps/api/`: `supabase functions deploy <name> --project-ref <ref>`
- **Migrations**: From `apps/api/`: `supabase db push --project-ref <ref>`

Always run `npm run type-check` before deploying!

## MVP Scope Guardrails

Before implementing any feature:

1. **Necessity**: Required to prove core hypothesis?
2. **Complexity**: Can this be simpler? Minimal version?
3. **Timeline**: Completable in days (not weeks)?
4. **Abstraction**: Premature? Wait for Rule of Three
5. **Scope Creep**: "While we're at it" feature? Defer!

**MVP Core Features**:

- Document upload (Markdown, Text, PDF)
- Vector embeddings (pgvector)
- RAG chat with context retrieval
- Multi-chat/thread support
- Real-time updates
- Basic auth (email/password)

**Deferred Post-MVP**:

- Advanced formats (DOCX, Excel)
- Social auth (Google, GitHub)
- Complex billing
- Multi-user collaboration
- Advanced analytics
- Document versioning

## Performance Targets

- Search: <300ms (tsvector with GiN indexes)
- AI operations: <10s
- Real-time propagation: <100ms
- Document upload to chat: <60s

---

**Remember**: Ship first, refactor later. MVP-first discipline over perfect architecture.

## Constitution Summary

See [.specify/memory/constitution.md](.specify/memory/constitution.md) for complete project principles.
