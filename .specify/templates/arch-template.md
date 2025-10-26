# Architecture: [FEATURE NAME]

**Feature**: `[###-feature-name]`
**Date**: [DATE]
**Status**: Draft
**Spec**: [link to spec.md]

> **Purpose**: Document complete feature architecture (frontend + backend + data + integration). Focus on STRUCTURE and WHY decisions were made. Keep concise - system-wide patterns are in system-architecture.md, implementation details are in plan.md.

**System Patterns**: See `.specify/memory/system-architecture.md` for project-wide patterns. Reference patterns by name instead of re-documenting.

---

## System Context

**How this feature fits into the system**:

| Aspect | Details |
|--------|---------|
| **This feature owns** | [Domains - e.g., "User authentication flow, session management, auth API"] |
| **Depends on** | [Other features/services - e.g., "User profile service (feature-002), Email service (external)"] |
| **Exposes to others** | [APIs/interfaces/events - e.g., "POST /auth/login, useAuth() hook, auth:login event"] |
| **Integration pattern** | [How it connects - e.g., "Event-driven for notifications, Synchronous API for validation"] |

---

## Architecture Overview

**Layers in this feature** (check all that apply):

- [ ] **Frontend** - User interface (screens, components, client-side logic)
- [ ] **Backend** - Server-side APIs, business logic, background jobs
- [ ] **Data** - Database schema, storage, caching
- [ ] **Integration** - External services, webhooks, message queues

**High-level flow**:
```
[User] → [Frontend] → [Backend API] → [Business Logic] → [Database]
                           ↓
                    [External Services]
```

---

## Frontend Architecture

*DELETE this entire section if no frontend (backend-only, CLI, library)*

### Screens & Flows

| Screen | Purpose | User Story | Priority | Route/Entry Point |
|--------|---------|------------|----------|-------------------|
| [Name] | [What user accomplishes] | US-001 | P1 | [/path or entry method] |

**Primary user flow**:
```
[Screen A] → [action] → [Screen B] → [action] → [Screen C] → [outcome]
```

**Navigation pattern**: [e.g., "Linear wizard", "Hub-and-spoke", "Modal overlays"]

### Component Structure

**[Screen 1 Name]**:
```
ScreenController (business logic)
├─ ScreenView (presentation)
│  ├─ Header
│  ├─ ContentPanel
│  └─ ActionBar
└─ LoadingState / ErrorState
```

**Pattern**: [Reference system pattern - e.g., "Controller/View pattern (see system-architecture.md)"]

**Module locations**:
- Controllers: [path pattern]
- Views: [path pattern]
- Shared: [path pattern]

### Frontend State Management

| State Type | Contains | Scope | Update Pattern |
|------------|----------|-------|----------------|
| **Application** | [e.g., "User session, feature data"] | Global | [e.g., "Optimistic → API → Rollback on error"] |
| **UI** | [e.g., "Form inputs, expand/collapse"] | Component | [e.g., "Local state only"] |
| **URL** | [e.g., "Route params, filters"] | Navigation | [e.g., "Synced with router"] |

**State flow**: [Reference system pattern or describe if unique]

---

## Backend Architecture

*DELETE this entire section if no backend (frontend-only, static site)*

### API Surface

| Endpoint | Method | Purpose | Request | Response | Auth |
|----------|--------|---------|---------|----------|------|
| /[resource] | POST | [Action] | [Body format] | [Response format] | Required/Optional |
| /[resource]/:id | GET | [Action] | [Params] | [Response] | Required/Optional |

**API pattern**: [e.g., "REST (resource-oriented)", "GraphQL", "RPC"]

**Contract location**: `specs/[feature]/contracts/`

### Service Layer

**Services** (business logic):

| Service | Responsibilities | Dependencies | Location |
|---------|------------------|--------------|----------|
| [ServiceName] | [What it does] | [Other services, external APIs] | [Path] |

**Pattern**: [Reference system pattern - e.g., "Three-layer backend (see system-architecture.md)"]

### Background Jobs / Async Processing

*SKIP if no background processing*

| Job | Trigger | Frequency | Purpose |
|-----|---------|-----------|---------|
| [JobName] | [Event/Schedule] | [Once/Recurring/On-demand] | [What it does] |

**Job queue pattern**: [e.g., "Message queue (RabbitMQ)", "Cron jobs", "Event-driven"]

---

## Data Architecture

### Domain Model

| Entity | Key Attributes | Relationships | Lifecycle States |
|--------|---------------|---------------|------------------|
| [Entity1] | id, name, status, createdAt | has-many [Entity2] | draft → active → archived |
| [Entity2] | id, value, entity1Id | belongs-to [Entity1] | pending → completed |

**Business rules**:
- [Rule 1 - e.g., "Entity1 must be active to create Entity2"]
- [Rule 2 - e.g., "Entity2 cannot be deleted if status is completed"]

### Storage Strategy

| Data Type | Storage | Reason | Retention |
|-----------|---------|--------|-----------|
| [Type - e.g., "User data"] | [Where - e.g., "PostgreSQL"] | [Why - e.g., "Transactional integrity"] | [How long - e.g., "7 years"] |
| [Type - e.g., "File uploads"] | [Where - e.g., "S3"] | [Why - e.g., "Scalable blob storage"] | [How long - e.g., "Until deleted"] |
| [Type - e.g., "Session cache"] | [Where - e.g., "Redis"] | [Why - e.g., "Fast access, TTL"] | [How long - e.g., "24 hours"] |

### Data Flow

**Read operations**:
- **Pattern**: [e.g., "Cache-aside", "Read-through", "Direct database"]
- **Caching**: [e.g., "Redis cache (5min TTL)", "No cache (real-time)"]

**Write operations**:
- **Pattern**: [e.g., "Write-through", "Write-behind", "Direct write"]
- **Consistency**: [e.g., "Strong consistency", "Eventual consistency"]

---

## Integration Architecture

### Frontend ↔ Backend Integration

**Communication pattern**: [e.g., "REST API", "GraphQL", "WebSocket", "SSE"]

**Data flow**:
```
Frontend → HTTP Request → API Gateway → Backend Service → Database
                              ↓
                        Auth Middleware
```

**Real-time updates** (if applicable):
- **Pattern**: [e.g., "WebSocket subscriptions", "Server-Sent Events", "Polling"]
- **What updates**: [e.g., "New messages, status changes"]

**Error handling**:
- **Client errors** (4xx): [How handled - e.g., "Show error toast, log to monitoring"]
- **Server errors** (5xx): [How handled - e.g., "Retry with exponential backoff"]
- **Network errors**: [How handled - e.g., "Offline mode, queue for retry"]

### External Service Integration

*SKIP if no external services*

| Service | Purpose | Integration Pattern | Error Handling |
|---------|---------|---------------------|----------------|
| [Service name] | [What it's used for] | [API/Webhook/Queue] | [Retry/Fallback/Degrade] |

**Example**: Stripe (payments) | API calls | Retry 3x with exponential backoff

---

## Security Architecture

### Authentication & Authorization

**Authentication**: [How users authenticate - e.g., "JWT tokens in Authorization header"]

**Authorization**: [How permissions checked - e.g., "Role-based (admin, user, guest)"]

**Enforcement points**:
- **Frontend**: [What's enforced - e.g., "Hide unauthorized UI (UX only)"]
- **Backend**: [What's enforced - e.g., "Verify permissions on every endpoint"]
- **Database**: [What's enforced - e.g., "Row-level security policies"]

### Data Protection

**Sensitive data in this feature**:
- [Data type 1 - e.g., "Passwords"]: [Protection - e.g., "Hashed with bcrypt (12 rounds)"]
- [Data type 2 - e.g., "API keys"]: [Protection - e.g., "Encrypted at rest (AES-256)"]
- [Data type 3 - e.g., "PII"]: [Protection - e.g., "Encrypted in transit (TLS 1.3)"]

---

## Key Architectural Decisions

> Document WHY certain patterns/technologies were chosen. Focus on trade-offs and alternatives considered.

### Decision 1: [Decision Title - e.g., "Real-time sync pattern"]

**Context**: [Problem - e.g., "Users need to see updates from other users instantly"]

**Options considered**:
1. [Option A - e.g., "Polling"] - Pros: Simple. Cons: High latency, server load
2. [Option B - e.g., "WebSockets"] - Pros: Low latency, efficient. Cons: More complex
3. [Option C - e.g., "SSE"] - Pros: Simpler than WS, unidirectional. Cons: Less flexible

**Chosen**: [Option - e.g., "WebSockets"]

**Why**: [Rationale - e.g., "Need bidirectional communication for collaborative features. Latency requirements <100ms. Team has experience with Socket.io"]

**Consequences**:
- [Impact 1 - e.g., "Requires persistent connections (scaling consideration)"]
- [Impact 2 - e.g., "Need reconnection logic for mobile"]

---

### Decision 2: [Next Decision - e.g., "Database choice"]

**Context**: [Problem]

**Options considered**:
1. [Option A] - Pros: [...] Cons: [...]
2. [Option B] - Pros: [...] Cons: [...]

**Chosen**: [Option]

**Why**: [Rationale]

**Consequences**: [Impacts]

---

*Add 2-5 key decisions - cover major architectural choices across frontend, backend, data, integration*

---

## Performance Considerations

**Critical paths** (what needs to be fast):
- [Path 1 - e.g., "Search query"]: Target <300ms
- [Path 2 - e.g., "Page load"]: Target <2s (p95)

**Optimization strategies**:
- [Strategy 1 - e.g., "Database indexes on frequently queried fields"]
- [Strategy 2 - e.g., "CDN for static assets"]
- [Strategy 3 - e.g., "Redis cache for user sessions"]

**Scalability concerns**:
- [Concern 1 - e.g., "Database connection pooling (max 100 connections)"]
- [Concern 2 - e.g., "Horizontal scaling (stateless backend services)"]

---

## Implementation Handoff

> Critical information for /speckit.plan and /speckit.design

**For /speckit.plan**:
- Data model → `data-model.md`
- API contracts → `/contracts/`
- Service structure → implementation tasks
- Integration patterns → connection code

**For /speckit.design**:
- Screen list → visual designs to create
- User flows → navigation to implement
- Component structure → what to build in UI library

**For /speckit.tasks**:
- Frontend modules → where to write UI code
- Backend services → where to write API code
- Database schema → migration scripts
- Integration points → API client setup

---

## Validation Checklist

**Completeness**:
- [ ] All user stories from spec.md covered (frontend screens OR backend APIs)
- [ ] Domain model includes all entities from spec.md
- [ ] Frontend architecture complete (if UI feature)
- [ ] Backend architecture complete (if API feature)
- [ ] Integration points documented (how layers connect)
- [ ] At least 2 key decisions documented with rationale

**Consistency**:
- [ ] Entity names consistent across frontend/backend/data sections
- [ ] API endpoints match between backend and integration sections
- [ ] State management aligns with data flow

**Balance**:
- [ ] Frontend and backend have equal detail (if full-stack)
- [ ] No section dominates (architecture is complete picture)
- [ ] Each layer has purpose and rationale

**Conciseness**:
- [ ] No duplication of system-architecture.md patterns (references instead)
- [ ] Focus on feature-specific architecture
- [ ] Easy to scan and review in <15 minutes

---

**Architecture Approved**: [DATE]

**Next Steps**:
- Run `/speckit.plan` to generate implementation plan (uses data model, API contracts, integration patterns)
- Run `/speckit.design` to create visual design (uses screens, flows, components)
