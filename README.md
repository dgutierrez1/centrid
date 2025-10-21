# Centrid - AI Knowledge Workspace

**Version**: 3.1.0
**Status**: In Development

## Overview

Centrid solves the **context loss problem** in AI chat applications. Unlike ChatGPT where diving into subtopics causes context degradation, Centrid maintains a **persistent knowledge graph** ensuring optimal context for every AI interaction.

**Core Value**: Upload documents once, use them across all conversations forever. No re-uploading, no re-contextualizing. Single source of truth for all AI workflows.

## Tech Stack

- **Frontend**: Next.js 14 (Pages Router), React 18, TypeScript
- **Backend**: Supabase (PostgreSQL + Edge Functions + Auth + Storage + Realtime)
- **State**: Valtio (reactive state management)
- **Styling**: Tailwind CSS + shadcn/ui components
- **AI**: OpenAI GPT-4o, Anthropic Claude 3.5 Sonnet
- **Payments**: Mercado Pago (Colombia focus)

## Project Structure

```
centrid/                          # Monorepo root
├── apps/
│   ├── web/                      # Main application
│   │   ├── src/
│   │   │   ├── components/       # Smart components (data + logic)
│   │   │   │   ├── agents/       # AgentInterface
│   │   │   │   ├── documents/    # DocumentManager
│   │   │   │   ├── layout/       # Layout, Header, Sidebar
│   │   │   │   ├── providers/    # Auth, Realtime, Theme
│   │   │   │   ├── search/       # SearchInterface
│   │   │   │   └── ui/           # App-specific UI overrides
│   │   │   ├── lib/              # Supabase, state, validation
│   │   │   ├── pages/            # Next.js pages
│   │   │   └── types/            # Database types (generated)
│   │   └── package.json
│   │
│   └── design-system/            # Component playground
│       ├── src/pages/            # Component showcase
│       └── package.json          # ONLY imports from packages/
│
├── packages/
│   ├── ui/                       # Pure UI components (SOURCE OF TRUTH)
│   │   ├── src/
│   │   │   ├── components/       # shadcn components
│   │   │   ├── features/         # Feature UI (DocumentCard, etc)
│   │   │   └── layout/           # Layout primitives
│   │   ├── colors.config.js      # Color system
│   │   └── package.json          # NO server dependencies
│   │
│   └── shared/                   # Shared types & utilities
│       ├── src/
│       │   ├── types/            # Shared TypeScript types
│       │   └── utils/            # Utilities (cn, formatters)
│       └── package.json
│
├── scripts/
│   └── add-component.sh          # Helper: shadcn → packages/ui
│
├── supabase/
│   ├── migrations/               # Database schema
│   └── functions/                # Edge Functions (Deno)
│
├── .specify/                     # Design docs & constitution
├── package.json                  # Workspace root
├── turbo.json                    # Turborepo config
└── tsconfig.base.json            # Shared TS config
```

## Quick Start

### Prerequisites

- Node.js 18+
- Docker (for local Supabase)
- Supabase CLI

### Installation

```bash
# Install dependencies
npm install

# Start local Supabase
npm run supabase:start

# Apply database migrations
npm run supabase:reset

# Generate TypeScript types
npm run supabase:gen-types
```

### Environment Setup

Copy `env.example` to `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# AI APIs
OPENAI_API_KEY=your_key
ANTHROPIC_API_KEY=your_key

# Optional: Payments
MERCADO_PAGO_ACCESS_TOKEN=your_token
```

### Development

```bash
# Start all apps (parallel)
npm run dev

# Start specific apps
npm run web:dev          # Main app on :3000
npm run design:dev       # Design system on :3001

# Type checking & linting
npm run type-check
npm run lint

# Build for production
npm run build
```

## Component Workflow

All UI components live in `packages/ui` as the **single source of truth**.

### Adding Components

```bash
# Use the helper script (automated)
./scripts/add-component.sh dialog

# Then export from packages/ui/src/components/index.ts
export { Dialog, DialogTrigger, DialogContent } from './dialog';
```

**Never run `shadcn add` directly in packages/ui** - use the script!

### Using Components

```tsx
// In apps/web or apps/design-system
import { Button, Card, Dialog } from '@centrid/ui/components';
import { cn } from '@centrid/shared/utils';
import type { Document } from '@centrid/shared/types';
```

## Database Schema

Core tables:
- `user_profiles` - User data & subscription
- `documents` - File metadata with full-text search
- `document_chunks` - Text segments for RAG
- `agent_requests` - AI agent execution tracking
- `agent_sessions` - Multi-turn conversations
- `usage_events` - Usage tracking for billing

**Security**: Row Level Security (RLS) enforces user isolation at database level.

## Edge Functions (Supabase)

Located in `supabase/functions/`:

1. **process-document** - File processing & chunking
2. **execute-ai-agent** - AI orchestration with RAG
3. **text-search** - Full-text search
4. **billing-webhook** - Mercado Pago integration
5. **sync-operations** - Cross-device sync

**Runtime**: Deno (use ESM imports, not npm)

## Key Principles

1. **MVP-First**: Scope to deliver value in days, not weeks
2. **Separation of Concerns**: UI in packages/, logic in apps/web/
3. **Mobile-First**: PWA with 44px touch targets
4. **Type Safety**: End-to-end TypeScript with generated DB types
5. **Real-Time**: Supabase subscriptions (no polling)
6. **Security**: Database-level RLS (cannot be bypassed)

## Architecture Boundaries

✅ **Allowed**:
- `apps/web` → imports from `packages/ui`, `packages/shared`
- `apps/design-system` → imports from `packages/ui`, `packages/shared`
- `packages/ui` → imports from `packages/shared`

❌ **Forbidden**:
- `packages/ui` → importing from `apps/web` (enforced by package.json)
- `packages/ui` → importing Supabase, Valtio, or providers
- `apps/design-system` → importing from `apps/web`

## Documentation

- **[SETUP.md](SETUP.md)** - Monorepo setup & component workflow
- **[CLAUDE.md](CLAUDE.md)** - Development commands & patterns
- **[.specify/memory/constitution.md](.specify/memory/constitution.md)** - Core principles & constraints
- **[packages/ui/COLORS.md](packages/ui/COLORS.md)** - Color system

## Deployment

- **Frontend**: Vercel (automatic on git push)
- **Backend**: Supabase production instance
- **Edge Functions**: `supabase functions deploy <name>`

## Performance Targets

- API response: <300ms
- AI operations: <10s
- Real-time propagation: <100ms
- Document upload to chat: <60s
- Component development: 30-45min (vs 6-8hr manual)

## License

MIT

---

**Built with MVP-first discipline. Ship fast, iterate faster.**
