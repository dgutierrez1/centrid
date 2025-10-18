# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Centrid AI Filesystem is a mobile-first AI agent workspace with document management, built on Next.js 14 with Supabase backend. The application provides AI-powered document processing, full-text search, and multi-agent interactions for creating, editing, and researching content.

**Tech Stack**: Next.js 14 (Pages Router), React 18, TypeScript, Supabase (PostgreSQL + Edge Functions + Auth + Storage), Valtio (state management), Tailwind CSS

## Development Commands

### Local Development
```bash
npm install                    # Install dependencies
npm run dev                   # Start Next.js dev server (http://localhost:3000)
npm run build                 # Build production bundle
npm run type-check            # Run TypeScript compiler (no emit)
npm run lint                  # Run ESLint
```

### Supabase Local Development
```bash
npm run supabase:start        # Start local Supabase (requires Docker)
npm run supabase:stop         # Stop local Supabase
npm run supabase:reset        # Reset local database (applies migrations)
npm run supabase:gen-types    # Generate TypeScript types from DB schema
```

### Edge Functions
```bash
supabase functions deploy <function-name>      # Deploy specific function
supabase functions serve                        # Serve functions locally
```

## Environment Configuration

Copy `env.example` to `.env.local` and configure:

**Required for basic development**:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only)

**Required for AI features**:
- `OPENAI_API_KEY` - OpenAI API key (for Create/Edit agents)
- `ANTHROPIC_API_KEY` - Anthropic API key (for Research agent)

**Optional** (for payment testing):
- `MERCADO_PAGO_ACCESS_TOKEN` - Mercado Pago credentials
- `MERCADO_PAGO_WEBHOOK_SECRET`

## Architecture

### Database Schema

The database schema is defined in `supabase/migrations/`:

**Core Tables**:
- `user_profiles` - Extended user data (plan, usage_count, subscription_status)
- `documents` - File metadata with full-text search vectors (filename, file_type, content_text, search_vector)
- `document_chunks` - Text segments for improved search and context retrieval
- `agent_requests` - AI agent execution tracking (agent_type: create/edit/research, status, progress, results)
- `agent_sessions` - Multi-turn conversation management (request_chain, context_state)
- `usage_events` - Usage tracking for billing (event_type, tokens_used, cost_usd)

**Key Features**:
- Automatic `tsvector` generation for full-text search on documents and chunks
- Row Level Security (RLS) policies enforce user data isolation
- Automatic `updated_at` timestamp triggers
- Automatic user profile creation on signup

### State Management

Global state is managed with Valtio in `src/lib/state.ts`:

```typescript
import { appState, actions, computed } from '@/lib/state';
import { useSnapshot } from 'valtio';

// In components
const state = useSnapshot(appState);

// Update state
actions.setDocuments(documents);
actions.addNotification({ type: 'success', title: 'Done', message: 'Task completed' });

// Access computed values
const selectedDoc = computed.selectedDocument();
const isOverLimit = computed.isOverUsageLimit();
```

**State Sections**: Authentication, Documents, AI Agents, Search, UI State, Notifications, Sync/Real-time, Error handling

**Persistence**: Theme, sidebar state, and active view are auto-persisted to localStorage

### Supabase Client Usage

Import from `src/lib/supabase.ts`:

```typescript
import { supabase, callEdgeFunction, uploadFile } from '@/lib/supabase';

// Client-side queries
const { data, error } = await supabase.from('documents').select('*');

// Edge function calls
const result = await callEdgeFunction('execute-ai-agent', { requestId, userId, agentType, content });

// File uploads
await uploadFile('documents', `${userId}/${filename}`, file);
```

**Helper Functions**: `signInWithProvider()`, `signInWithEmail()`, `signUp()`, `getCurrentUser()`, `getUserProfile()`, `withRetry()` for resilient operations

### Edge Functions

Located in `supabase/functions/`:

1. **process-document** - File upload, parsing, text extraction with chunking
2. **execute-ai-agent** - Orchestrates AI agent requests with context building, model selection, progress tracking
3. **text-search** - Full-text search across documents using PostgreSQL tsvector
4. **billing-webhook** - Mercado Pago subscription webhooks
5. **sync-operations** - Cross-device synchronization with conflict resolution

**Edge Function Runtime**: Deno (TypeScript/JavaScript)
- Import AI SDKs via ESM: `import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.24.0"`
- Import OpenAI via: `import OpenAI from "https://esm.sh/openai@4.0.0"`
- Use Deno-compatible libraries only (no Node.js-specific packages)

**AI Agent System**:
- `create` agent: Uses GPT-4o (temp: 0.7) for content generation
- `edit` agent: Uses GPT-4o-mini (temp: 0.3) for content improvement
- `research` agent: Uses Claude 3.5 Sonnet via Anthropic SDK (temp: 0.1) for document analysis
- **Anthropic SDK features**: Tool use (function calling), streaming responses, automatic retries, prompt caching
- Context building: Retrieves up to 20 document chunks for contextual AI operations
- Usage limits enforced: Free (100/month), Pro (1000/month), Enterprise (10000/month)

**Example AI Agent with Anthropic SDK**:
```typescript
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.24.0";

const anthropic = new Anthropic({
  apiKey: Deno.env.get("ANTHROPIC_API_KEY")!,
});

// Basic message
const message = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 4096,
  temperature: 0.1,
  system: systemPrompt,
  messages: [{ role: "user", content: userMessage }]
});

// With tool use (Claude can call functions autonomously)
const messageWithTools = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 4096,
  tools: [
    {
      name: "search_documents",
      description: "Search user's documents for information",
      input_schema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" }
        },
        required: ["query"]
      }
    }
  ],
  messages: [{ role: "user", content: request.content }]
});

// Handle tool calls
if (message.stop_reason === "tool_use") {
  const toolUse = message.content.find(c => c.type === "tool_use");
  // Execute tool and continue conversation
}
```

### TypeScript Path Aliases

Configured in `tsconfig.json`:

```typescript
import { Component } from '@/components/ui/Component';
import { supabase } from '@/lib/supabase';
import { appState } from '@/lib/state';
import type { Database } from '@/types/database.types';
```

### Component Organization

- `src/components/agents/` - AI agent interfaces (AgentInterface.tsx)
- `src/components/documents/` - Document management (DocumentManager.tsx)
- `src/components/layout/` - Layout components (Layout, Header, Sidebar)
- `src/components/providers/` - Context providers (AuthProvider, RealtimeProvider, ThemeProvider)
- `src/components/search/` - Search interface (SearchInterface.tsx)
- `src/components/ui/` - Reusable UI components (LoadingSpinner, NotificationPanel)

### Pages Router Structure

Using Next.js Pages Router (not App Router):

- `src/pages/_app.tsx` - Application wrapper with providers
- `src/pages/dashboard.tsx` - Main application dashboard
- Root redirects to `/dashboard` (configured in `next.config.js`)

## Key Implementation Patterns

### Real-time Subscriptions

Use the helper from `src/lib/supabase.ts`:

```typescript
const subscription = createRealtimeSubscription(
  'agent_requests',
  (payload) => {
    if (payload.new.status === 'completed') {
      actions.updateAgentRequest(payload.new.id, payload.new);
    }
  },
  { user_id: userId }
);
```

### Document Processing Flow

1. User uploads file via DocumentManager
2. File uploaded to Supabase Storage
3. `process-document` Edge Function triggered
4. Text extracted and chunked
5. Full-text search vectors generated automatically via triggers
6. Real-time updates via RealtimeProvider

### AI Agent Execution Flow

1. User submits request via AgentInterface
2. `agent_requests` record created with status: 'pending'
3. `execute-ai-agent` Edge Function invoked
4. Usage limits checked
5. Context built from contextDocuments
6. Model selected based on agent_type
7. Progress updates published (0.1 → 0.2 → 0.3 → 0.8 → 1.0)
8. Results stored in `agent_requests.results`
9. Usage event logged for billing

### Authentication Flow

1. Supabase Auth handles OAuth (Google, GitHub, Apple) or email/password
2. On user creation, `handle_new_user()` trigger creates user_profile
3. AuthProvider manages session state
4. RLS policies automatically filter data by `auth.uid()`

## Database Type Generation

After modifying migrations, regenerate types:

```bash
npm run supabase:gen-types
```

This creates `src/types/database.types.ts` with full type safety for all tables.

## Testing Local Changes

1. Start local Supabase: `npm run supabase:start`
2. Apply migrations: `npm run supabase:reset`
3. Generate types: `npm run supabase:gen-types`
4. Start Next.js: `npm run dev`
5. Test Edge Functions locally: `supabase functions serve`

## Deployment

- **Frontend**: Vercel (automatic via git push)
- **Backend**: Supabase production instance
- **Edge Functions**: `supabase functions deploy <function-name> --project-ref <ref>`

Always run `npm run type-check` before deploying to catch TypeScript errors.

## Performance Considerations

- **Search**: Full-text search uses PostgreSQL `tsvector` with GiN indexes (defined in `supabase/migrations/20240115000003_create_indexes.sql`)
- **Real-time**: Supabase channels filter by user_id to minimize bandwidth
- **Code Splitting**: Webpack configured to split Supabase into separate bundle
- **Context Limits**: AI agent context limited to 20 document chunks to prevent token overflow
- **Caching**: Service worker caching configured for PWA offline support

## Common Gotchas

1. **Edge Functions use Deno**: Not Node.js - use Deno-compatible imports (e.g., `https://deno.land/std@0.168.0/http/server.ts`)
2. **AI SDK imports**: Use ESM CDN imports (esm.sh) not npm packages. Example: `https://esm.sh/@anthropic-ai/sdk@0.24.0`
3. **RLS Policies**: Always active - queries automatically filtered by `auth.uid()`. Use service role key only for admin operations
4. **Search Vectors**: Auto-updated via triggers on INSERT/UPDATE - don't manually set `search_vector` column
5. **Usage Limits**: Enforced at Edge Function level, checked before AI execution
6. **State Updates**: Use `actions` from `state.ts`, never mutate `appState` directly
7. **Type Safety**: Run `npm run supabase:gen-types` after any migration changes
8. **Anthropic SDK Tool Use**: When Claude calls tools, you must handle the tool execution and send results back in a new message to continue the conversation

## Validation

Input validation uses Zod schemas in `src/lib/validation.ts`. Always validate user input before processing.
