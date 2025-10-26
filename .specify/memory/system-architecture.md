# System Architecture Patterns

**Purpose**: Document project-wide architectural patterns that ALL features follow. Feature-specific arch.md files reference these patterns instead of re-documenting them.

**Last Updated**: [DATE]

**Usage**: When writing `specs/[feature]/arch.md`, reference these patterns by name (e.g., "Uses Controller/View pattern - see system architecture") instead of explaining the pattern every time.

---

## Architectural Patterns

### Module Organization Pattern

**Pattern Name**: [e.g., "Controller/View", "Smart/Dumb", "MVC", "MVVM"]

**Structure**:
- **Controllers** (business logic, data fetching, state management)
  - Location: [path pattern - e.g., "src/features/[feature]/controllers/"]
  - Responsibilities: API calls, state updates, wrapping views with data
- **Views** (presentation only, props in → UI out)
  - Location: [path pattern - e.g., "src/features/[feature]/views/"]
  - Responsibilities: Rendering UI, calling callbacks, zero business logic
- **Shared Widgets** (reusable across features)
  - Location: [path pattern - e.g., "src/shared/components/"]
  - Responsibilities: Generic UI elements (buttons, inputs, cards)

**When to use**: All UI features

**Key rules**:
- Views never import from services directly
- Controllers never contain JSX/UI logic
- Shared widgets are framework-agnostic when possible

---

### State Management Pattern

**Global State Pattern**: [e.g., "Global store (Redux/Valtio/Zustand)", "Context API", "React Query"]

**State types**:

| State Type | Scope | Persistence | Update Pattern | Example |
|------------|-------|-------------|----------------|---------|
| **Application** | Cross-feature, global | Session/Local storage | [Pattern] | User profile, app settings |
| **Feature** | Single feature, global to feature | Memory only | [Pattern] | Feature-specific lists, filters |
| **UI** | Component-local | Memory only | [Pattern] | Form inputs, expand/collapse |
| **URL** | Navigation | URL params | [Pattern] | Route params, search queries |
| **Server** | Backend | Database | [Pattern] | Persisted entities |

**Standard flow**:
1. **Reads**: Component → State → Render
2. **Writes**: User action → Callback → Controller → Service → State update
3. **Sync**: Server update → Real-time subscription → State update → Re-render

**Key rules**:
- [Rule 1 - e.g., "Pass IDs not objects (prevents stale data)"]
- [Rule 2 - e.g., "Single source of truth per entity type"]
- [Rule 3 - e.g., "Immutable updates only"]

---

### Data Flow Pattern

**Read Pattern**:
```
Component → Controller → Cache? → Service → API → Database
                            ↓ hit
                         Return cached
```

**Write Pattern**:
```
User action → Controller → Optimistic update → Service → API
                                    ↓ success: confirm
                                    ↓ error: rollback + notify
```

**Real-time Sync Pattern**:
```
Database change → Real-time channel → Subscription → State update → Re-render
```

**Standard patterns by use case**:
- **User-triggered reads**: On-demand fetch (no cache) or session cache (5min)
- **User-triggered writes**: Optimistic update → API call → Rollback on error
- **Real-time updates**: WebSocket/SSE subscription → State updates automatically
- **Background sync**: Polling (last resort) or event-driven (preferred)

---

## Integration Patterns

### Feature-to-Feature Integration

**Available patterns**:

| Pattern | When to Use | Implementation | Example |
|---------|-------------|----------------|---------|
| **Direct API** | Synchronous operations | Feature A calls Feature B's API endpoint | Auth validates session for every request |
| **Event-driven** | Async operations, loose coupling | Feature A publishes event, Feature B subscribes | User created → Send welcome email |
| **Shared State** | Frequent reads, single source of truth | Feature A writes to shared store, Feature B reads | User profile shared across features |
| **Callback Props** | Parent-child communication | Parent passes callback, child invokes | Modal calls onClose from parent |

**Default choice**: Event-driven for async, Direct API for sync, Shared State for frequent reads

**Key rules**:
- Never import across feature boundaries (only via public APIs)
- Avoid circular dependencies (use events to break cycles)
- Document integration contracts in feature arch.md

---

### External Service Integration

**Pattern**: [e.g., "Service layer wraps external APIs", "Repository pattern", "Adapter pattern"]

**Structure**:
```
Feature → Service → External Adapter → External API
                         ↓ (interface)
                   Alternative implementation
```

**Error handling**:
- **Transient errors** (network, rate limits): Retry with exponential backoff
- **Permanent errors** (auth, not found): Fail fast, notify user
- **Degradation**: Fallback to cached data or reduced functionality

**Key rules**:
- Always wrap external services (never call directly from features)
- Define interfaces for all external dependencies
- Log all external calls for debugging

---

## Security Patterns

### Authentication & Authorization

**Authentication pattern**: [e.g., "JWT tokens", "Session cookies", "OAuth2"]

**Authorization pattern**: [e.g., "Role-based (RBAC)", "Permission-based", "Owner-based"]

**Enforcement layers**:
1. **API layer**: Verify auth token, check permissions
2. **Database layer**: Row-level security (RLS) policies
3. **UI layer**: Hide unauthorized actions (UX only, not security)

**Key rules**:
- Never trust client-side auth (always verify server-side)
- Use principle of least privilege (grant minimum permissions)
- Log all auth failures for security monitoring

---

### Data Protection

**Sensitive data handling**:
- **In transit**: [e.g., "HTTPS/TLS only", "Certificate pinning"]
- **At rest**: [e.g., "AES-256 encryption for PII", "Hashed passwords (bcrypt)"]
- **In logs**: [e.g., "Redact sensitive fields", "Separate audit logs"]

**Key rules**:
- Never log passwords, tokens, or PII in plaintext
- Encrypt sensitive fields at application layer (defense in depth)
- Use secure random for tokens/IDs (not Math.random())

---

## Performance Patterns

### Caching Strategy

**Cache layers**:
1. **Client memory**: Component state, session storage
2. **Client persistent**: Local storage, IndexedDB
3. **CDN**: Static assets, public content
4. **Server memory**: Redis, in-memory cache
5. **Server persistent**: Database query cache

**Cache invalidation patterns**:
- **Time-based**: Expire after N seconds (simple, may serve stale data)
- **Event-based**: Invalidate on write (accurate, more complex)
- **Versioning**: Include version in key (safest, requires coordination)

**Default TTLs by data type**:
- Static assets: 1 year (versioned URLs)
- User profile: 5 minutes (infrequent changes)
- Dynamic lists: 30 seconds (frequent changes)
- Real-time data: No cache (use subscriptions)

---

### Optimization Patterns

**Common optimizations**:
- **Pagination**: Limit results to 20-50 items per page
- **Lazy loading**: Load data on-demand (infinite scroll, virtual scroll)
- **Debouncing**: Wait N ms after last input (search, autocomplete)
- **Throttling**: Execute max once per N ms (scroll, resize)
- **Memoization**: Cache expensive computation results
- **Code splitting**: Load routes/features on-demand

**When NOT to optimize prematurely**:
- Features with <100 items (pagination overhead not worth it)
- Actions <100ms without optimization (user won't notice)
- Non-critical paths (optimize critical path first)

---

## Testing Patterns

### Test Strategy

**Test pyramid** (70% unit, 20% integration, 10% e2e):
- **Unit tests**: Test functions/classes in isolation (fast, many)
- **Integration tests**: Test module interactions (medium, fewer)
- **E2E tests**: Test complete user flows (slow, critical paths only)

**What to test by layer**:
- **Views**: Rendering, user interactions, edge cases (unit)
- **Controllers**: State management, callback handling (unit)
- **Services**: API calls, error handling, retries (integration)
- **Features**: Complete user flows (e2e)

**Test data strategy**:
- **Fixtures**: JSON files for deterministic test data
- **Factories**: Functions generating test data programmatically
- **Mocks**: Fake implementations of external dependencies

---

## Deployment Patterns

### Environment Strategy

**Standard environments**:
1. **Development**: Local, synthetic data, relaxed security
2. **Staging**: Remote, anonymized production data, production-like
3. **Production**: Remote, real user data, strict security

**Configuration management**:
- **Environment variables**: All environment-specific config
- **Feature flags**: Toggle features without deployments
- **Secrets management**: Never commit secrets (use secret manager)

**Deployment process**:
```
Code commit → Tests → Build → Deploy to Staging → Smoke tests → Manual approval → Deploy to Production → Monitor
```

---

### Monitoring & Observability

**Key metrics** (track these for all features):
- **Performance**: Response time (p50, p95, p99), throughput (req/s)
- **Reliability**: Error rate (%), uptime (%), success rate (%)
- **Business**: User actions (count), conversions (%), retention (%)

**Logging levels**:
- **ERROR**: System failure, requires immediate attention
- **WARN**: Degraded functionality, investigate soon
- **INFO**: Normal operations, audit trail
- **DEBUG**: Detailed info for troubleshooting (disabled in production)

**Alerting thresholds**:
- **Critical**: Page on-call (error rate >5%, p95 latency >2x normal)
- **Warning**: Notify team (error rate >1%, p95 latency >1.5x normal)
- **Info**: Log only (trends, anomalies)

---

## Migration & Evolution Patterns

### Backward Compatibility

**Breaking change policy**:
1. **Announce**: Communicate change 3+ months before
2. **Deprecate**: Mark old API as deprecated, add sunset header
3. **Support both**: Run old + new in parallel during migration
4. **Remove**: Delete old API after migration complete

**API versioning**:
- **Strategy**: [e.g., "URL versioning (/v1/, /v2/)", "Header versioning", "No versioning (backward compatible only)"]
- **Support window**: [e.g., "N-1 versions supported (1 year minimum)"]

---

### Data Migration

**Migration patterns**:
- **Dual-write**: Write to both old + new schemas during migration
- **Batch migration**: Process existing data in background batches
- **Lazy migration**: Convert data on-read (gradual, transparent)

**Rollback strategy**:
- **Always reversible**: Every migration must have down/rollback script
- **Test rollback**: Verify rollback works before deploying forward migration
- **Data snapshots**: Backup before risky migrations

---

## Common Anti-Patterns

### What NOT to do

**Architecture anti-patterns**:
- ❌ **God modules**: Module does everything (split into focused modules)
- ❌ **Circular dependencies**: A depends on B depends on A (use events to break cycle)
- ❌ **Leaky abstractions**: Implementation details exposed in interfaces
- ❌ **Tight coupling**: Modules can't be changed independently
- ❌ **Premature optimization**: Optimizing before profiling

**State management anti-patterns**:
- ❌ **Prop drilling**: Passing props through 5+ levels (use context/state)
- ❌ **Duplicate state**: Same data in multiple places (single source of truth)
- ❌ **Stale closures**: Callbacks referencing old state values
- ❌ **Mutation**: Directly mutating state objects (use immutable updates)

**Performance anti-patterns**:
- ❌ **N+1 queries**: Loop making individual queries (batch or join)
- ❌ **Unbounded lists**: Rendering 10,000+ items (paginate or virtual scroll)
- ❌ **Blocking operations**: Synchronous heavy computation (use workers/async)
- ❌ **Memory leaks**: Not cleaning up subscriptions/timers

---

## Decision Template

When documenting architectural decisions in feature arch.md, use this format:

**Decision**: [What was decided]

**Context**: [Problem being solved, constraints]

**Options considered**:
1. [Option A] - Pros: [...] Cons: [...]
2. [Option B] - Pros: [...] Cons: [...]

**Chosen**: [Selected option]

**Why**: [Rationale, trade-offs accepted]

**Consequences**: [Impact on implementation, future constraints]

---

## Maintenance

**Update triggers** (when to update this document):
- New project-wide pattern adopted (e.g., new state management library)
- Existing pattern deprecated (e.g., migrating from pattern A to pattern B)
- Common anti-pattern discovered (add to anti-patterns section)
- Architecture decision affects multiple features (document here, not per-feature)

**Review cadence**: Quarterly review with team, update as needed

**Version history**: Track major changes in git commits
