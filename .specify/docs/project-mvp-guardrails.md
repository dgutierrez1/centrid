---
title: MVP Scope Guardrails
summary: Five-question checklist to prevent scope creep and maintain MVP-first discipline
domain: project
priority: core
related: []
---

<!-- After editing this file, run: npm run sync-docs -->

# MVP Scope Guardrails

**What**: Five-question checklist to evaluate feature necessity before implementation, ensuring MVP-first discipline and preventing scope creep.

**Why**: MVP-first discipline delivers value in days (not weeks), proves core hypothesis faster, and prevents feature bloat that delays launch.

**Before implementing any feature, ask**:

1. **Necessity**: Required to prove core hypothesis?
2. **Complexity**: Can this be simpler? Minimal version?
3. **Timeline**: Completable in days (not weeks)?
4. **Abstraction**: Premature? Wait for Rule of Three
5. **Scope Creep**: "While we're at it" feature? Defer!

**MVP Core Features** (In Scope):

- Document upload (Markdown, Text, PDF)
- Vector embeddings (pgvector)
- RAG chat with context retrieval
- Multi-chat/thread support
- Real-time updates
- Basic auth (email/password)

**Deferred Post-MVP** (Out of Scope):

- Advanced formats (DOCX, Excel)
- Social auth (Google, GitHub)
- Complex billing
- Multi-user collaboration
- Advanced analytics
- Document versioning

**Rule of Three**:

Wait for third occurrence before abstracting. Premature abstraction adds complexity without proven value.

**Example**:
- First time: Inline implementation
- Second time: Copy-paste with slight modification
- Third time: Extract reusable abstraction

**Rules**:
- ✅ DO ask all 5 guardrail questions before starting features
- ✅ DO scope features to complete in days (not weeks)
- ✅ DO wait for Rule of Three before abstracting
- ✅ DO defer "nice-to-have" features post-MVP
- ✅ DO prove core hypothesis first
- ❌ DON'T add "while we're at it" features
- ❌ DON'T abstract until third occurrence
- ❌ DON'T implement deferred features during MVP
- ❌ DON'T sacrifice speed for perfect architecture

**Used in**:
- Feature planning and scoping decisions
- Pull request reviews (scope validation)
- Sprint planning (timeline estimation)
