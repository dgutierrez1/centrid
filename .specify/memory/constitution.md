<!--
Sync Impact Report:
- Version: Initial template → 1.0.0
- Rationale: First ratification of Centrid project constitution
- Principles: 8 technical principles established (Component Architecture, Mobile-First, Context-First, Supabase-First, Type Safety, Real-Time First, Agent-First File System, Security by Default)
- Added sections: Technology Stack Constraints, Key Architectural Decisions, Success Metrics, Anti-Patterns
- Templates status:
  ✅ plan-template.md - Constitution Check section present, compatible
  ✅ spec-template.md - Requirements aligned with principles
  ✅ tasks-template.md - Task organization supports principle-driven development
- Follow-up TODOs: None - all placeholders filled
-->

# Centrid Constitution

## Core Principles

### I. Component Architecture Discipline

**Separation of Concerns**

All UI components MUST be pure presentational components (dumb) that only receive props and call callbacks. All business logic, state management, and integrations MUST live in container components (smart) or dedicated service layers. Provider components are the ONLY exception for cross-cutting concerns (auth, realtime, theme).

**Rationale**: Enables testability, reusability, and maintainability. Components can be tested with simple prop inputs without mocking complex dependencies. Clear boundaries between presentation and logic improve code quality and developer velocity.

### II. Universal Platform Strategy

**Mobile-First Architecture**

All features MUST be designed mobile-first with PWA as MVP delivery. Backend MUST be API-first with stateless endpoints suitable for both web and future native apps. UI MUST use touch-optimized interactions. Code sharing target: 80%+ between web and future mobile platforms.

**Rationale**: Target users (indie hackers, solo developers, technical writers) need mobile access for on-the-go productivity. PWA enables rapid launch while maintaining native app transition path without architectural rewrites. Mobile-first ensures the most constrained environment works perfectly.

### III. Persistent Knowledge Graph with RAG

**Context-First Data Model**

Document context MUST be global and persistent across ALL user chats. Vector embeddings (pgvector 1536-dim) MUST be generated for all document chunks. RAG context retrieval MUST happen before every AI request using semantic similarity search. Citation tracking MUST record which document chunks informed each response via message_context_chunks table. Context window MUST be limited to 6000 tokens with relevance-ranked chunks.

**Rationale**: Core value proposition - users shouldn't re-upload or re-contextualize documents for each conversation. Single source of truth for all knowledge enables consistent AI responses with transparent sourcing. This is the "ChatGPT meets Obsidian" innovation.

### IV. Managed Backend Stack

**Supabase-First Backend**

Database MUST use PostgreSQL via Supabase with pgvector extension. Authentication MUST use Supabase Auth with JWT tokens. File storage MUST use Supabase Storage with path-based policies. Real-time updates MUST use Supabase Realtime (WebSocket subscriptions). Edge Functions MUST be used for AI orchestration, document processing, and agent execution. Row Level Security (RLS) MUST be enabled on all user data tables.

**Rationale**: Reduces infrastructure complexity, provides built-in auth/storage/realtime, enables rapid development. RLS provides database-level security that cannot be bypassed. No GraphQL layer needed - Supabase Realtime handles real-time updates with type safety. Optimized for indie hacker velocity.

### V. End-to-End Type Safety

**Type Safety Everywhere**

All code MUST be TypeScript. Database types MUST be auto-generated from Supabase schema. API contracts MUST be type-safe. Runtime validation MUST use Zod for external inputs. Supabase client MUST use generated Database type for all queries.

**Rationale**: Catches bugs at compile time, improves developer experience, enables confident refactoring, self-documenting code. Type safety extends from database → API → UI, eliminating entire classes of runtime errors.

### VI. Live Collaboration Architecture

**Real-Time First**

All user-facing data changes MUST propagate via Supabase Realtime subscriptions. Database updates MUST trigger real-time notifications to subscribed clients. Frontend MUST subscribe to relevant channels (documents, messages, chats) and update Valtio state automatically. Polling MUST NOT be used for data synchronization. Agent modifications to documents MUST be visible in real-time across all user devices.

**Rationale**: Users expect instant updates across devices in modern applications. Real-time subscriptions provide better UX, lower latency, and reduced server load vs polling. Supabase Realtime handles WebSocket management, reconnection, and RLS filtering automatically.

### VII. MCP-Based Document Access

**Agent-First File System**

Claude Agent SDK MUST access documents via MCP (Model Context Protocol) tools. Agent tools MUST read documents from PostgreSQL (content_text field) for speed. Agent write operations MUST update database first (triggering real-time notifications), then Storage asynchronously. File paths in Storage MUST follow structure: documents/{user_id}/{document_id}/{filename}. Agents MUST validate user ownership before all operations. Version field MUST be used for optimistic locking on concurrent updates.

**Rationale**: Agents need reliable file system abstraction. Database-first writes ensure instant UI updates via realtime subscriptions. Storage serves as backup and source for re-processing. MCP provides standard protocol for tool integration with Claude Agent SDK.

### VIII. Zero-Trust Data Access via RLS

**Security by Default**

All database tables with user data MUST have Row Level Security (RLS) enabled. RLS policies MUST enforce auth.uid() = user_id for all operations. All file uploads MUST be validated (type, size, content). Storage policies MUST check folder path includes user_id. Authentication MUST be required for all user data access. Edge Functions MUST use ANON_KEY (respects RLS) for user operations, SERVICE_ROLE_KEY ONLY when necessary with manual ownership validation. JWT tokens MUST be validated by Supabase (signature verification).

**Rationale**: Database-level security cannot be bypassed - more secure than application-level checks. RLS automatically filters all queries. Even direct database access respects policies. Security is enforced, not just checked. Critical for user trust and data privacy.

## Technology Stack Constraints

### Frontend & UI

- **Framework**: Next.js 14+, React 18+, TypeScript
- **State Management**: Valtio (reactive, minimal boilerplate)
- **CSS Framework**: TailwindCSS 3.4+ (utility-first, mobile-first)
- **Component Library**: shadcn/ui (copy-paste components, not dependency)
- **UI Primitives**: Radix UI (via shadcn/ui - accessible, touch-friendly)
- **Design Tokens**: Centralized in tailwind.config.js (colors, spacing, typography)

### Backend & Infrastructure

- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions + Realtime)
- **Database**: PostgreSQL 15+ with pgvector extension (1536-dim embeddings)
- **Real-time**: Supabase Realtime (WebSocket subscriptions, no GraphQL needed)
- **Deployment**: Vercel (frontend), Supabase (backend)

### AI & Development Tools

- **AI Models**: Claude 3.5 Sonnet (primary via Agent SDK with MCP tools)
- **AI Tooling**: shadcn MCP server (AI-powered component generation)
- **Design Tool**: v0.dev by Vercel (optional, for high-fidelity UI mockups)
- **Icons**: Heroicons or Lucide (tree-shakeable, consistent)

### Billing & Payments

- **Payment Processor**: Mercado Pago (Colombia market focus)

## Key Architectural Decisions

These decisions are locked and MUST be followed:

1. Multi-chat system with independent conversations
2. RAG-based context retrieval using vector similarity search (pgvector cosine similarity)
3. Full-text search (PostgreSQL tsvector) as supplement to vector search
4. Real-time updates via Supabase Realtime
5. Component-based architecture with clear separation between presentation and logic
6. Agent file access via MCP tools (read_document, update_document, search_documents)
7. Row Level Security (RLS) for database-level security enforcement
8. JWT-based authentication with auth.uid() for ownership validation
9. TailwindCSS + shadcn/ui for rapid UI development with full customization control
10. shadcn MCP + Claude for AI-powered component generation (30min vs 10hr development cycles)
11. Mobile-first component design with 44px minimum touch targets
12. Design tokens centralized in Tailwind config for consistent theming

## Success Metrics

Performance and quality targets that MUST be met:

- 80%+ code sharing between web and future mobile platforms
- <300ms API response time for standard queries
- <10s for AI agent operations including RAG context retrieval
- 99.5% uptime
- User can upload document and start chatting within 60 seconds
- Context retrieval accuracy >85% (measured by user feedback on AI responses)
- Zero unauthorized data access (enforced by RLS)
- Real-time updates propagate to all devices within 100ms
- UI feature development: 30-45 minutes with shadcn MCP vs 6-8 hours manual
- Component generation: <5 minutes from description to working code
- Mobile touch targets: 100% compliance with 44x44px minimum
- Design consistency: All components use centralized Tailwind tokens

## Anti-Patterns to Avoid

These patterns are FORBIDDEN:

- ❌ Logic in presentational components
- ❌ Direct Supabase calls in UI components (use container layer)
- ❌ Untyped API responses or database queries
- ❌ Missing loading/error states
- ❌ Unvalidated user inputs
- ❌ Missing RLS policies on tables with user data
- ❌ Desktop-first design decisions
- ❌ Monolithic components (keep components focused and composable)
- ❌ Polling for data updates (use Supabase Realtime subscriptions)
- ❌ Application-level security checks instead of RLS
- ❌ Using SERVICE_ROLE_KEY without manual ownership validation
- ❌ GraphQL layer (unnecessary complexity - Supabase provides what's needed)
- ❌ Separate WebSocket server (Supabase Realtime handles it)
- ❌ Storage-only document management (database enables search + real-time)
- ❌ Client-side only security (must be enforced at database level)
- ❌ Heavy component libraries (use shadcn/ui copy-paste approach instead)
- ❌ Building UI components from scratch (leverage shadcn/ui + MCP generation)
- ❌ Desktop hover states on mobile (use active states for touch feedback)
- ❌ Touch targets smaller than 44x44px (iOS/Android accessibility requirement)
- ❌ Inline styles or CSS-in-JS (use Tailwind utilities for consistency)

## Governance

### Amendment Procedure

Constitution amendments require:

1. Clear rationale for change documented in commit message
2. Impact analysis on existing codebase (automated where possible)
3. Update to all dependent templates and documentation
4. Version bump following semantic versioning (MAJOR for breaking changes, MINOR for additions, PATCH for clarifications)

### Versioning Policy

- MAJOR bump: Principle removals, incompatible governance changes
- MINOR bump: New principles added, material expansions
- PATCH bump: Clarifications, typos, non-semantic refinements

### Compliance Review

- Review architecture decisions against constitution during technical design
- Validate new features against principles before implementation
- Automated checks where possible (TypeScript strict mode, linting, RLS policies)
- Constitution review every quarter or when major technical pivots occur

All PRs/reviews MUST verify compliance with principles. Complexity introduced that violates principles MUST be justified with clear rationale and documented in plan.md Complexity Tracking section. Use [CLAUDE.md](../../CLAUDE.md) for runtime development guidance.

**Version**: 1.0.0 | **Ratified**: 2025-01-15 | **Last Amended**: 2025-01-15
